import os, zipfile, uuid, subprocess
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'apps'
DOCKER_APP_FOLDER = 'docker_apps'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DOCKER_APP_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_zip():
    zip_file = request.files['site_zip']
    if not zip_file or not zip_file.filename.endswith('.zip'):
        return 'Only .zip files are allowed', 400

    uid = str(uuid.uuid4())
    app_path = os.path.join(UPLOAD_FOLDER, uid)
    docker_path = os.path.join(DOCKER_APP_FOLDER, uid)
    os.makedirs(app_path, exist_ok=True)
    os.makedirs(docker_path, exist_ok=True)

    zip_path = os.path.join(app_path, secure_filename(zip_file.filename))
    zip_file.save(zip_path)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(app_path)
    os.remove(zip_path)

    # Validate files
    if not os.path.exists(os.path.join(app_path, 'package.json')):
        return "❌ Error: 'package.json' not found in the uploaded zip.", 400
    if not os.path.exists(os.path.join(app_path, 'server.js')):
        return "❌ Error: 'server.js' not found in the uploaded zip.", 400

    # Copy Dockerfile
    with open('Dockerfile.template', 'r') as f:
        dockerfile_content = f.read()
    with open(os.path.join(docker_path, 'Dockerfile'), 'w') as f:
        f.write(dockerfile_content)

    # Copy contents to Docker build context
    for item in os.listdir(app_path):
        src = os.path.join(app_path, item)
        dst = os.path.join(docker_path, item)
        subprocess.run(['cp', '-r', src, dst])

    # Build and run container
    image_name = f'userapp_{uid[:8]}'
    port = str(4000 + int(uid[-4:], 16) % 1000)

    build_result = subprocess.run(['docker', 'build', '-t', image_name, docker_path])
    if build_result.returncode != 0:
        return "❌ Docker build failed. Check your server.js and package.json.", 500

    run_result = subprocess.run(['docker', 'run', '-d', '-p', f'{port}:3000', '--name', image_name, image_name])
    if run_result.returncode != 0:
        return "❌ Docker container failed to start. Try with a valid Node.js app.", 500

    # Extract host IP
    server_ip = request.host.split(":")[0]

    # Final output message
    return f'''
    <html>
    <head><title>App Hosted</title></head>
    <body>
      <h2>✅ Your app is live at:</h2>
      <a href="http://{server_ip}:{port}" target="_blank">
        http://{server_ip}:{port}
      </a>
      <p>You can share this link with others on your network.</p>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
