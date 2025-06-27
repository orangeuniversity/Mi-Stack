import os
import zipfile
import uuid
import subprocess
import shutil
import docker
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import re

# --- Setup ---
app = Flask(__name__)
app.secret_key = 'secret-key'  # change in prod
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mibase.db'
app.config['UPLOAD_FOLDER'] = 'apps'
DOCKER_APP_FOLDER = 'docker_apps'

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Ensure base folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(DOCKER_APP_FOLDER, exist_ok=True)

# --- Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))
    apps = db.relationship('HostedApp', backref='owner', lazy=True)

class HostedApp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    container_id = db.Column(db.String(100), unique=True)
    port = db.Column(db.String(10))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    folder_name = db.Column(db.String(36))  # store the UID used for this app

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def is_password_strong(password):
    if len(password) < 5:
        return False
    if not re.search(r'[A-Za-z]', password):  # at least one letter
        return False
    if not re.search(r'\d', password):        # at least one digit
        return False
    if not re.search(r'[^A-Za-z0-9]', password):  # at least one special char
        return False
    return True


@app.before_request
def redirect_mobile_users():
    mobile_keywords = [
        'mobi', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini',
        'samsung', 'oppo', 'vivo', 'redmi', 'xiaomi', 'huawei', 'oneplus', 'realme', 'lenovo',
        'meizu', 'zte', 'nokia', 'motorola', 'sony', 'lg'
    ]
    ua = request.headers.get('User-Agent', '').lower()

    # Skip redirect for static files and mobile page itself to avoid loops
    if request.path.startswith('/static') or request.path == '/mobile.html':
        return

    if any(keyword in ua for keyword in mobile_keywords):
        # Redirect mobile users to the mobile.html page
        return redirect(url_for('mobile_page'))


@app.route('/')
def index():
    ua = request.headers.get('User-Agent', '').lower()

    # Enhanced mobile detection keywords
    mobile_keywords = [
        'mobi', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini',
        # Added explicit brand keywords (common substrings in user agents)
        'samsung', 'oppo', 'vivo', 'redmi', 'xiaomi', 'huawei', 'oneplus', 'realme', 'lenovo',
        'meizu', 'zte', 'nokia', 'motorola', 'sony', 'lg'
    ]

    # Check if any keyword matches
    if any(keyword in ua for keyword in mobile_keywords):
        return render_template('mobile.html')

    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password_raw = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if email and User.query.filter_by(email=email).first():
            return "This account already exists. Please login or use a different email.", 409

        if not email or not password_raw or not confirm_password:
            return "Missing required fields.", 400

        if password_raw != confirm_password:
            return "Passwords do not match.", 400

        if not is_password_strong(password_raw):
            return (
                    """Password is too weak.
                    It must have at least 5 characters, including:
                    - at least one letter (uppercase or lowercase)
                    - at least one digit
                    - at least one special character.""",
        400
    )



        hashed = generate_password_hash(password_raw)
        user = User(email=email, password=hashed)
        db.session.add(user)
        db.session.commit()

        return "Account created successfully!", 200

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Check if JSON/AJAX request via Accept header
        if request.headers.get('Accept') == 'application/json':
            email = request.form.get('email', '').strip().lower()
            password_raw = request.form.get('password', '')
            user = User.query.filter_by(email=email).first()

            if not user:
                return jsonify({"error": "User not found or invalid email."}), 404

            if not check_password_hash(user.password, password_raw):
                return jsonify({"error": "Incorrect password."}), 401

            login_user(user)
            return jsonify({"success": True}), 200

        # Fallback to normal form submit for non-AJAX
        email = request.form['email'].strip().lower()
        password_raw = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password_raw):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials.', 'warning')

    return render_template('login.html')
    



@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


@app.route('/upload', methods=['POST'])
@login_required
def upload_zip():
    # limit to 3 apps per user
    if len(current_user.apps) >= 3:
        return "❌ You can only host up to 3 apps.", 403

    zip_file = request.files.get('site_zip')
    github_url = request.form.get('github_url', '').strip()

    if not zip_file and not github_url:
        return "❌ Upload a ZIP or GitHub URL.", 400

    # Generate unique ID for this app
    uid = str(uuid.uuid4())
    # Organize per-user folder: apps/<user_id>/<uid>
    user_base = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
    docker_user_base = os.path.join(DOCKER_APP_FOLDER, str(current_user.id))
    os.makedirs(user_base, exist_ok=True)
    os.makedirs(docker_user_base, exist_ok=True)

    app_path = os.path.join(user_base, uid)
    docker_path = os.path.join(docker_user_base, uid)
    os.makedirs(app_path, exist_ok=True)
    os.makedirs(docker_path, exist_ok=True)

    # Handle ZIP upload
    if zip_file and zip_file.filename.endswith('.zip'):
        zip_filename = secure_filename(zip_file.filename)
        zip_path = os.path.join(app_path, zip_filename)
        zip_file.save(zip_path)
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(app_path)
        except zipfile.BadZipFile:
            # Cleanup the folder
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return "❌ Invalid ZIP.", 400
        os.remove(zip_path)

    # Handle GitHub clone
    elif github_url.startswith("https://github.com/"):
        result = subprocess.run(['git', 'clone', '--depth', '1', github_url, app_path],
                                capture_output=True, text=True)
        if result.returncode != 0:
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return f"❌ GitHub clone failed:<br><pre>{result.stderr}</pre>", 400
    else:
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Invalid input.", 400

    # Verify required files
    if not os.path.exists(os.path.join(app_path, 'package.json')):
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ 'package.json' missing.", 400
    if not os.path.exists(os.path.join(app_path, 'server.js')):
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ 'server.js' missing.", 400

    # Prepare Docker context: copy Dockerfile.template and app files
    try:
        with open('Dockerfile.template', 'r') as f:
            dockerfile_content = f.read()
    except Exception as e:
        # Cleanup
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Cannot read Dockerfile.template.", 500

    with open(os.path.join(docker_path, 'Dockerfile'), 'w') as f:
        f.write(dockerfile_content)

    # Copy all contents from app_path into docker_path
    for item in os.listdir(app_path):
        src = os.path.join(app_path, item)
        dst = os.path.join(docker_path, item)
        # use shutil.copytree or copy2 as needed
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)

    # Build and run Docker
    image_name = f'userapp_{uid[:8]}'
    # compute port deterministically/modulo
    try:
        port = str(4000 + int(uid[-4:], 16) % 1000)
    except:
        port = str(4000 + (int(uuid.uuid4().hex[-4:], 16) % 1000))

    # Build
    build = subprocess.run(['docker', 'build', '-t', image_name, docker_path])
    if build.returncode != 0:
        # Cleanup Docker context folder
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Docker build failed.", 500

    # Run
    run = subprocess.run(['docker', 'run', '-d', '-p', f'{port}:3000', '--name', image_name, image_name])
    if run.returncode != 0:
        # Attempt to remove image if exists
        subprocess.run(['docker', 'rmi', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Docker run failed.", 500

    # Record in DB, storing uid for cleanup
    hosted = HostedApp(container_id=image_name, port=port, user_id=current_user.id, folder_name=uid)
    db.session.add(hosted)
    db.session.commit()

    # Return link
    ip = request.host.split(":")[0]
    return f'''
    <html><body>
    <h2>✅ Hosted:</h2>
    <a href="http://{ip}:{port}" target="_blank">http://{ip}:{port}</a>
    </body></html>
    '''


@app.route('/list-apps')
@login_required
def list_apps():
    apps = HostedApp.query.filter_by(user_id=current_user.id).all()
    # Return container_id as ID so front-end can call delete-app/<container_id>
    return jsonify([{"id": a.container_id, "port": a.port} for a in apps])


@app.route('/delete-app/<app_id>', methods=['DELETE'])
@login_required
def delete_app(app_id):
    # Find the record, ensure ownership
    app_entry = HostedApp.query.filter_by(container_id=app_id, user_id=current_user.id).first()
    if not app_entry:
        return 'Not found or not yours', 404

    # 1. Stop & remove Docker container
    subprocess.run(['docker', 'rm', '-f', app_id])

    # 2. Optionally remove Docker image as well
    subprocess.run(['docker', 'rmi', '-f', app_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 3. Remove filesystem directories: both upload and docker contexts
    uid = app_entry.folder_name
    # paths used in upload:
    user_base = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
    docker_user_base = os.path.join(DOCKER_APP_FOLDER, str(current_user.id))
    app_path = os.path.join(user_base, uid)
    docker_path = os.path.join(docker_user_base, uid)
    # Remove if exist
    try:
        if os.path.exists(app_path):
            shutil.rmtree(app_path)
    except Exception as e:
        app.logger.warning(f"Failed to delete app_path {app_path}: {e}")
    try:
        if os.path.exists(docker_path):
            shutil.rmtree(docker_path)
    except Exception as e:
        app.logger.warning(f"Failed to delete docker_path {docker_path}: {e}")

    # 4. Remove DB record
    db.session.delete(app_entry)
    db.session.commit()
    return '', 204


# === Mobile route (UNINDENTED!) ===
@app.route('/mobile.html')
def mobile_page():
    return render_template('mobile.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)

