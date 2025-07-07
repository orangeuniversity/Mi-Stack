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
import random
import datetime
import smtplib
from email.mime.text import MIMEText
from flask import jsonify


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
    max_apps = db.Column(db.Integer, default=1)


class HostedApp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    container_id = db.Column(db.String(100), unique=True)
    port = db.Column(db.String(10))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    folder_name = db.Column(db.String(36))

with app.app_context():
    db.create_all()

###################################################################################

# In-memory OTP store: { email: { 'otp': '123456', 'timestamp': datetime } }
otp_store = {}

def send_email(to_email, subject, body):
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    sender_email = 'bse.depart@gmail.com'
    sender_password = 'jwfpjoglrdymxpkl'  # Use your actual app password without spaces

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception as e:
        print("Error sending email:", e)
        raise


##########################################################################################

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

##########################################################################################

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

##########################################################################################

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

##########################################################################################

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password_raw = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        otp_verified = request.form.get('otp_verified', '').lower() == 'true'
        
        if not otp_verified:
             return "OTP verification required before registration.", 400
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

##########################################################################################
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

        # Prepare slot info for response
        max_slots = user.max_apps
        used_slots = len(user.apps)

        if 'application/json' in request.headers.get('Accept', ''):
            resp = {"success": True, "max_slots": max_slots, "used_slots": used_slots}
            if user.email == 'missariahil10@gmail.com':
                resp["admin"] = True
            return jsonify(resp), 200

        if user.email == 'missariahil10@gmail.com':
            return redirect(url_for('admin_panel'))
        return redirect(url_for('index'))

    # GET request
    return render_template('login.html')




##########################################################################################

@app.route('/user-slot-status')
@login_required
def user_slot_status():
    max_slots = current_user.max_apps
    used_slots = len(current_user.apps)
    return jsonify({"max_slots": max_slots, "used_slots": used_slots})



##########################################################################################



@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

##########################################################################################

@app.route('/upload', methods=['POST'])
@login_required
def upload_zip():
    if len(current_user.apps) >= current_user.max_apps:
        return redirect(url_for('upgrade_page'))

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

    def cleanup():
        shutil.rmtree(app_path, ignore_errors=True)
        shutil.rmtree(docker_path, ignore_errors=True)

    # Handle ZIP or GitHub
    if zip_file and zip_file.filename.endswith('.zip'):
        zip_filename = secure_filename(zip_file.filename)
        zip_path = os.path.join(app_path, zip_filename)
        zip_file.save(zip_path)
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(app_path)
        except zipfile.BadZipFile:
            cleanup()
            return "❌ Invalid ZIP.", 400
        os.remove(zip_path)
    elif github_url and github_url.startswith("https://github.com/"):
        result = subprocess.run(['git', 'clone', '--depth', '1', github_url, app_path], capture_output=True, text=True)
        if result.returncode != 0:
            cleanup()
            return f"❌ GitHub clone failed:<br><pre>{result.stderr}</pre>", 400
    else:
        cleanup()
        return "❌ Invalid input.", 400

    # Detect app type
    if app_type == 'nodejs':
        if not os.path.exists(os.path.join(app_path, 'package.json')) or not os.path.exists(os.path.join(app_path, 'server.js')):
            cleanup()
            return "❌ Required Node.js files missing.", 400
        dockerfile_template_path = 'Dockerfile.nodejs'
        expose_port = '3000'

    elif app_type == 'python':
        if not os.path.exists(os.path.join(app_path, 'app.py')):
            cleanup()
            return "❌ app.py missing.", 400
        dockerfile_template_path = 'Dockerfile.python'
        expose_port = '3000'

    elif app_type == 'static':
        if not os.path.exists(os.path.join(app_path, 'index.html')):
            cleanup()
            return "❌ No index.html found for static app.", 400
        dockerfile_template_path = 'Dockerfile.static'
        expose_port = '80'

    elif app_type == 'php':
        if not any(fname.endswith('.php') for fname in os.listdir(app_path)):
            cleanup()
            return "❌ No PHP files found.", 400
        dockerfile_template_path = 'Dockerfile.php'
        expose_port = '80'

    elif app_type == 'java':
        if not os.path.exists(os.path.join(app_path, 'app.jar')):
            cleanup()
            return "❌ app.jar missing for Java app.", 400
        dockerfile_template_path = 'Dockerfile.java'
        expose_port = '8080'

    elif app_type == 'go':
        if not os.path.exists(os.path.join(app_path, 'main.go')):
            cleanup()
            return "❌ main.go missing for Go app.", 400
        dockerfile_template_path = 'Dockerfile.go'
        expose_port = '8080'

    elif app_type == 'ruby':
        if not os.path.exists(os.path.join(app_path, 'Gemfile')):
            cleanup()
            return "❌ Gemfile missing for Ruby app.", 400
        dockerfile_template_path = 'Dockerfile.ruby'
        expose_port = '3000'

    else:
        cleanup()
        return jsonify({'error': 'Unsupported app type'}), 400

    # Copy Dockerfile
    try:
        with open(dockerfile_template_path, 'r') as f:
            dockerfile_content = f.read()
    except Exception:
        cleanup()
        return "❌ Cannot read Dockerfile.", 500

    with open(os.path.join(docker_path, 'Dockerfile'), 'w') as f:
        f.write(dockerfile_content)

    # Copy app files
    for item in os.listdir(app_path):
        src = os.path.join(app_path, item)
        dst = os.path.join(docker_path, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)

    # Generate port
    port = str(4000 + int(uid[-4:], 16) % 1000)

    # Clean up old containers/images
    subprocess.run(['docker', 'rm', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'rmi', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Build Docker image
    build = subprocess.run(['docker', 'build', '-t', image_name, docker_path])
    if build.returncode != 0:
        cleanup()
        return "❌ build failed.", 500  #docker

    # Run container
    run = subprocess.run(['docker', 'run', '-d', '-p', f'{port}:{expose_port}', '--name', image_name, image_name])
    if run.returncode != 0:
        subprocess.run(['docker', 'rmi', '-f', image_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cleanup()
        return "❌ run failed.", 500  #docker

    # Save DB entry
    hosted = HostedApp(container_id=container_id, port=port, user_id=current_user.id, folder_name=uid)
    db.session.add(hosted)
    db.session.commit()

    ip = request.host.split(":")[0]
    return f'<h2>✅ Hosted:</h2><a href="http://{ip}:{port}" target="_blank">http://{ip}:{port}</a>'


##########################################################################################

@app.route('/upgrade', methods=['GET', 'POST'])
@login_required
def upgrade_page():
    if request.method == 'POST':
        promo = request.form.get('promo', '').strip().lower()
        if promo in ['ahil', 'raina', 'reema']:
            current_user.max_apps += 1
            db.session.commit()
            # Return JSON with new slot info for frontend
            return jsonify({
                "success": "Promo applied! You now have 1 more slot.",
                "max_slots": current_user.max_apps,
                "used_slots": len(current_user.apps)
            }), 200

        pay = request.form.get('pay', '')
        if pay == '1dollar':  # Dummy trigger, replace with real payment later
            current_user.max_apps += 1
            db.session.commit()
            flash('✅ Payment successful! You now have 1 more slot.', 'success')
            return redirect(url_for('index'))

        flash('❌ Invalid promo code or payment.', 'danger')

    return render_template('upgrade.html', max_apps=current_user.max_apps, current=len(current_user.apps))


################################################################################################

@app.route('/list-apps')
@login_required
def list_apps():
    apps = HostedApp.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": a.container_id, "port": a.port} for a in apps])

##########################################################################################

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

##########################################################################################

@app.route('/admin', methods=['GET', 'POST'])
@login_required
def admin_panel():
    if current_user.email != 'missariahil10@gmail.com':
        return redirect(url_for('index'))

    users = User.query.all()

    if request.method == 'POST':
        user_id = request.form.get('user_id')
        action = request.form.get('action')

        target_user = User.query.get(int(user_id))
        if not target_user or target_user.email == 'missariahil10@gmail.com':
            flash("Invalid operation.", "danger")
            return redirect(url_for('admin_panel'))

        if action == 'increase':
            target_user.max_apps += 1
        elif action == 'decrease' and target_user.max_apps > 1:
            target_user.max_apps -= 1
            # If max_apps < number of hosted apps, remove oldest apps
            while len(target_user.apps) > target_user.max_apps:
                app_to_delete = target_user.apps[-1]  # or some logic for oldest
                # Delete container and files
                subprocess.run(['docker', 'rm', '-f', app_to_delete.container_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(['docker', 'rmi', '-f', app_to_delete.container_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                user_base = os.path.join(app.config['UPLOAD_FOLDER'], str(target_user.id))
                docker_user_base = os.path.join(DOCKER_APP_FOLDER, str(target_user.id))
                shutil.rmtree(os.path.join(user_base, app_to_delete.folder_name), ignore_errors=True)
                shutil.rmtree(os.path.join(docker_user_base, app_to_delete.folder_name), ignore_errors=True)
                db.session.delete(app_to_delete)
                db.session.commit()

        db.session.commit()
        flash("✅ Slot updated.", "success")
        return redirect(url_for('admin_panel'))

    # Prepare user data with apps URLs
    ip = request.host.split(":")[0]  # Get server IP/domain for URL generation

    users_data = []
    for user in users:
        if user.email == 'missariahil10@gmail.com':
            continue  # Skip admin user itself

        apps_info = []
        for app in user.apps:
            url = f"http://{ip}:{app.port}"
            apps_info.append({
                "container_id": app.container_id,
                "url": url
            })

        users_data.append({
            "id": user.id,
            "email": user.email,
            "max_apps": user.max_apps,
            "apps": apps_info
        })

    return render_template('admin.html', users=users_data)



##########################################################################################

@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form.get('email', '').strip().lower()
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email.'}), 400

    now = datetime.datetime.utcnow()
    entry = otp_store.get(email)
    if entry and (now - entry['timestamp']).total_seconds() < 600:  # 10 min cooldown
        return jsonify({'error': 'OTP already sent. Please wait 10 minutes before requesting again.'}), 429

    otp = f"{random.randint(100000, 999999)}"
    otp_store[email] = {'otp': otp, 'timestamp': now}

    try:
        send_email(email, "Your Mi-Stack Registration OTP", f"Your OTP code is: {otp}\n\nValid for 10 minutes.")
    except Exception:
        return jsonify({'error': 'Failed to send OTP email.'}), 500

    return jsonify({'success': 'OTP sent to email.'}), 200


@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    email = request.form.get('email', '').strip().lower()
    otp = request.form.get('otp', '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and OTP required.'}), 400

    entry = otp_store.get(email)
    if not entry:
        return jsonify({'error': 'No OTP requested for this email.'}), 400

    now = datetime.datetime.utcnow()
    if (now - entry['timestamp']).total_seconds() > 600:
        otp_store.pop(email, None)
        return jsonify({'error': 'OTP expired. Please request a new one.'}), 400

    if otp != entry['otp']:
        return jsonify({'error': 'Invalid OTP.'}), 400

    otp_store.pop(email, None)  # Remove OTP after successful verification
    return jsonify({'success': 'OTP verified.'}), 200

#######################################################################################

@app.route('/mobile.html')
def mobile_page():
    return render_template('mobile.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
