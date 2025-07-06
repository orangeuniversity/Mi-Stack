import os
import zipfile
import uuid
import subprocess
import shutil
import re
import requests
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# --- Setup ---
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret')  # Load from env, fallback for dev
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mibase.db'
app.config['UPLOAD_FOLDER'] = 'apps'
DOCKER_APP_FOLDER = 'docker_apps'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB limit, adjust as needed

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(DOCKER_APP_FOLDER, exist_ok=True)

MAILBOXLAYER_API_KEY = "e6f14a9717f8e95e228ad18b1f1e6a67"

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
    folder_name = db.Column(db.String(36))

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def is_password_strong(password):
    if len(password) < 5 or not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password) or not re.search(r'[^A-Za-z0-9]', password):
        return False
    return True

def validate_email_mailboxlayer(email):
    url = "http://apilayer.net/api/check"
    params = {"access_key": MAILBOXLAYER_API_KEY, "email": email, "smtp": 1, "format": 1}
    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        print("MailboxLayer response:", data)
        return data.get("format_valid") and data.get("smtp_check")
    except Exception as e:
        print("MailboxLayer API error:", e)
        return True

@app.before_request
def redirect_mobile_users():
    mobile_keywords = [
        'mobi', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini',
        'samsung', 'oppo', 'vivo', 'redmi', 'xiaomi', 'huawei', 'oneplus', 'realme', 'lenovo',
        'meizu', 'zte', 'nokia', 'motorola', 'sony', 'lg'
    ]
    ua = request.headers.get('User-Agent', '').lower()
    if request.path.startswith('/static') or request.path == '/mobile.html':
        return
    if any(keyword in ua for keyword in mobile_keywords):
        return redirect(url_for('mobile_page'))

@app.route('/')
def index():
    ua = request.headers.get('User-Agent', '').lower()
    mobile_keywords = [
        'mobi', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini',
        'samsung', 'oppo', 'vivo', 'redmi', 'xiaomi', 'huawei', 'oneplus', 'realme', 'lenovo',
        'meizu', 'zte', 'nokia', 'motorola', 'sony', 'lg'
    ]
    if any(keyword in ua for keyword in mobile_keywords):
        return render_template('mobile.html')
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password_raw = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not validate_email_mailboxlayer(email):
            return "Email address is invalid or risky. Please use a valid email.", 400
        if User.query.filter_by(email=email).first():
            return "This account already exists. Please login or use a different email.", 409
        if not email or not password_raw or not confirm_password:
            return "Missing required fields.", 400
        if password_raw != confirm_password:
            return "Passwords do not match.", 400
        if not is_password_strong(password_raw):
            return "Password too weak. Must be at least 5 characters, with at least one letter, one digit, and one special character.", 400

        hashed = generate_password_hash(password_raw)
        user = User(email=email, password=hashed)
        db.session.add(user)
        db.session.commit()
        return "Account created successfully!", 200

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password_raw = request.form['password']
        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password_raw):
            if request.headers.get('Accept') == 'application/json':
                return jsonify({"error": "Invalid credentials."}), 401
            flash('Invalid credentials.', 'warning')
            return redirect(url_for('login'))

        login_user(user)
        if request.headers.get('Accept') == 'application/json':
            return jsonify({"success": True}), 200
        return redirect(url_for('index'))

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/upload', methods=['POST'])
@login_required
def upload_zip():
    if len(current_user.apps) >= 1:
        return "❌ You can only host up to 1 apps.", 403

    app_type = request.form.get('app_type', 'nodejs')
    zip_file = request.files.get('site_zip')
    github_url = request.form.get('github_url')
    app_name = request.form.get('app_id', '').strip().lower()

    if app_name.startswith("user-"):
        app_name = app_name[5:]
    if not app_name or not re.match(r'^[a-z0-9\-_]+$', app_name):
        return "❌ Invalid app name. Use only letters, numbers, dash or underscore.", 400

    username = current_user.email.split('@')[0].lower()
    container_id = f"{username}-{app_name}"

    if HostedApp.query.filter_by(container_id=container_id, user_id=current_user.id).first():
        return "❌ You already have an app with this name. Please choose another.", 409

    image_name = f'userapp_{container_id}'
    uid = str(uuid.uuid4())
    user_base = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
    docker_user_base = os.path.join(DOCKER_APP_FOLDER, str(current_user.id))
    app_path = os.path.join(user_base, uid)
    docker_path = os.path.join(docker_user_base, uid)
    os.makedirs(app_path, exist_ok=True)
    os.makedirs(docker_path, exist_ok=True)

    if zip_file and zip_file.filename.endswith('.zip'):
        zip_filename = secure_filename(zip_file.filename)
        zip_path = os.path.join(app_path, zip_filename)
        zip_file.save(zip_path)
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(app_path)
        except zipfile.BadZipFile:
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return "❌ Invalid ZIP.", 400
        os.remove(zip_path)
    elif github_url and github_url.startswith("https://github.com/"):
        result = subprocess.run(['git', 'clone', '--depth', '1', github_url, app_path], capture_output=True, text=True)
        if result.returncode != 0:
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return f"❌ GitHub clone failed:<br><pre>{result.stderr}</pre>", 400
    else:
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Invalid input.", 400

    # Determine Dockerfile and port based on app_type
    if app_type == 'nodejs':
        if not os.path.exists(os.path.join(app_path, 'package.json')) or not os.path.exists(os.path.join(app_path, 'server.js')):
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return "❌ Required Node.js files missing.", 400
        dockerfile_template_path = 'Dockerfile.nodejs'
        expose_port = '3000'
    elif app_type == 'python':
        if not os.path.exists(os.path.join(app_path, 'app.py')):
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return "❌ 'app.py' missing.", 400
        dockerfile_template_path = 'Dockerfile.python'
        expose_port = '3000'
    elif app_type == 'static':
        if not os.path.exists(os.path.join(app_path, 'index.html')):
            shutil.rmtree(app_path, ignore_errors=True)
            shutil.rmtree(docker_path, ignore_errors=True)
            return "❌ No index.html found for static app.", 400
        dockerfile_template_path = 'Dockerfile.static'  # you must create this file (see below)
        expose_port = '80'
    else:
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return jsonify({'error': 'Unsupported app type'}), 400

    # Read and write Dockerfile template into docker_path
    try:
        with open(dockerfile_template_path, 'r') as f:
            dockerfile_content = f.read()
    except Exception:
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Cannot read Dockerfile.", 500

    with open(os.path.join(docker_path, 'Dockerfile'), 'w') as f:
        f.write(dockerfile_content)

    # Copy app files into docker_path
    for item in os.listdir(app_path):
        src = os.path.join(app_path, item)
        dst = os.path.join(docker_path, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)

    # Generate port based on UUID hash (to avoid collision)
    port = str(4000 + int(uid[-4:], 16) % 1000)

    # Clean up old containers/images if exist
    subprocess.run(['docker', 'rm', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'rmi', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Build Docker image
    build = subprocess.run(['docker', 'build', '-t', image_name, docker_path])
    if build.returncode != 0:
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Docker build failed.", 500

    # Run Docker container mapping correct port
    run = subprocess.run(['docker', 'run', '-d', '-p', f'{port}:{expose_port}', '--name', image_name, image_name])
    if run.returncode != 0:
        subprocess.run(['docker', 'rmi', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)
        return "❌ Docker run failed.", 500

    # Save hosted app info in DB
    hosted = HostedApp(container_id=container_id, port=port, user_id=current_user.id, folder_name=uid)
    db.session.add(hosted)
    db.session.commit()

    ip = request.host.split(":")[0]
    return f'<h2>✅ Hosted:</h2><a href="http://{ip}:{port}" target="_blank">http://{ip}:{port}</a>'

@app.route('/list-apps')
@login_required
def list_apps():
    apps = HostedApp.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": a.container_id, "port": a.port} for a in apps])

@app.route('/delete-app/<app_id>', methods=['DELETE'])
@login_required
def delete_app(app_id):
    app_entry = HostedApp.query.filter_by(container_id=app_id, user_id=current_user.id).first()
    if not app_entry:
        return 'Not found or not yours', 404

    subprocess.run(['docker', 'rm', '-f', app_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'rmi', '-f', app_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    uid = app_entry.folder_name
    user_base = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
    docker_user_base = os.path.join(DOCKER_APP_FOLDER, str(current_user.id))
    shutil.rmtree(os.path.join(user_base, uid), ignore_errors=True)
    shutil.rmtree(os.path.join(docker_user_base, uid), ignore_errors=True)

    db.session.delete(app_entry)
    db.session.commit()
    return '', 204

@app.route('/mobile.html')
def mobile_page():
    return render_template('mobile.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
