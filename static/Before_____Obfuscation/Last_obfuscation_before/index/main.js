let loadingText, completeText;

// Modal logic
async function loadApps() {
  const res = await fetch('/list-apps');
  const apps = await res.json();
  const tbody = document.querySelector('#apps-table tbody');
  tbody.innerHTML = '';
  apps.forEach(app => {
    tbody.innerHTML += `
      <tr>
        <td>${app.id}</td>
        <td><a href="http://${location.hostname}:${app.port}" target="_blank">http://${location.hostname}:${app.port}</a></td>
        <td><button class="delete-btn" onclick="deleteApp('${app.id}')">Delete</button></td>
      </tr>
    `;
  });
}

async function deleteApp(id) {
  const res = await fetch('/delete-app/' + id, { method: 'DELETE' });
  if (res.ok) loadApps();
  else alert('Delete failed');
}

// Utility: preload an image and resolve on load/error
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Header animation
window.addEventListener('DOMContentLoaded', () => {
  const isAuth = window.isAuthenticated === true || window.isAuthenticated === 'true';
  const header = document.querySelector('header');

  if (!isAuth && header) {
    setTimeout(() => {
      header.classList.add('slide-in');
    }, 5000);
  } else if (header) {
    header.style.transform = 'none';
    header.style.opacity = '1';
    header.style.transition = 'none';
  }
});

// Container animation
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelector('.container1').classList.add('slide-in');
    document.querySelector('.container2').classList.add('slide-in');
  }, 5000);
});

// Preloader and background image logic
window.addEventListener('load', async () => {
  const MIN_PRELOADER_TIME = 2000;
  const PRELOADER_FADE_TIME = 600;
  const PROGRESS_ANIMATION_TIME = 2000;

  const preloader = document.querySelector('.preloader');
  const progressBar = document.querySelector('.preloader .progress-bar');
  const percEl = document.querySelector('.preloader .percentage');
  const startTime = performance.now();

  if (window.isAuthenticated) {
    await loadApps();
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '#FFF';
  } else {
    const totalImages = 7;
    const randomNumber = Math.floor(Math.random() * totalImages) + 1;
    const bgImage = `/static/images/ui_ux/image${randomNumber}.jpg`;

    await Promise.race([
      preloadImage(bgImage),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    document.body.style.backgroundImage = `url('${bgImage}')`;
    document.body.style.backgroundColor = '';
  }

  const elapsed = performance.now() - startTime;
  const remainingTime = Math.max(0, MIN_PRELOADER_TIME - elapsed);

  setTimeout(() => {
    if (!progressBar || !percEl) {
      if (preloader) {
        preloader.classList.add('hidden');
        document.body.classList.add('preloader-done');
      }
      return;
    }

    let progress = 0;
    const startProgressTime = performance.now();

    function animateProgress() {
      const now = performance.now();
      const elapsedProgress = now - startProgressTime;
      progress = Math.min(100, (elapsedProgress / PROGRESS_ANIMATION_TIME) * 100);

      progressBar.style.width = progress + '%';
      percEl.textContent = Math.floor(progress) + '%';

      if (progress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        preloader.classList.add('hidden');
        document.body.classList.add('preloader-done');
        preloader.classList.add('hidden');

        preloader.addEventListener('transitionend', () => {
          const astronaut = document.querySelector('.fly-astronaut');
          astronaut.style.animationPlayState = 'running';
        }, { once: true });

        startPageAnimations();
        setTimeout(() => {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, PRELOADER_FADE_TIME);
      }
    }

    animateProgress();
  }, remainingTime);

  startRandomFlyingHearts();
});

// Spinner Circle JS
function showUploadSpinner() {
  const spinner = document.getElementById('uploadSpinner');
  if (spinner) spinner.style.display = 'block';
}

function hideUploadSpinner() {
  const spinner = document.getElementById('uploadSpinner');
  if (spinner) spinner.style.display = 'none';
}

// Form submission handler with validation
function onSubmitHandler(event) {
  const form = event.target.form || event.target.closest('form');
  if (!form) return true;

  const fileInput = form.querySelector('input[name="site_zip"]');
  const urlInput = form.querySelector('input[name="github_url"]');
  const appTypeInput = form.querySelector('input[name="app_type"]:checked');

  if (!appTypeInput) {
    alert('Please select app type.');
    event.preventDefault();
    return false;
  }

  const hasFile = fileInput && fileInput.files.length > 0;
  const hasUrl = urlInput && urlInput.value.trim() !== '';

  if (!hasFile && !hasUrl) {
    alert('Please upload a ZIP file or enter a GitHub repo URL.');
    event.preventDefault();
    return false;
  }

  showUploadSpinner();
  return true;
}

// Handle back/forward navigation
window.addEventListener('pageshow', (event) => {
  if (event.persisted || (window.performance && window.performance.getEntriesByType('navigation')[0].type === 'back_forward')) {
    hideUploadSpinner();
    if (window.isAuthenticated) {
      loadApps();
    }
  }
});

// Modal variables and functions
const modalBg = document.getElementById('modalBg');
const modal = document.getElementById('modalContent');

function openModal(type, page = 1) {
  let html = '';

  if (type === 'how') {
    if (page === 1) {
      html = `
        <div class="glass-buttons">
          <div class="circle green close-btn"><i class="fas fa-times"></i></div>
          <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
          <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
        </div>
        <h3>🛠️ How Mi-Stack Works (Page 1/2)</h3>
        <p>Deploy your app easily by uploading a ZIP archive or providing a GitHub repo HTTPS URL.</p>
        <p>Click the green "Code" button on GitHub → copy HTTPS URL → paste it in the GitHub URL field.</p>
        <img src="/static/images/icons/code-button.png" alt="GitHub code button" style="max-width:100%; margin:10px 0;" />
        <p>ZIP archive should contain all your app files in the root or proper folders (e.g. static/ for assets).</p>
        <p>Use our supported app types like Node.js, Python Flask, Static HTML, Go, Ruby, PHP, Java.</p>
  
        <div class="modal-nav" style="margin-top:20px;">
          <span class="nav-arrow next" title="Next" onclick="openModal('how', 2)" >
            <strong>Forward</strong>
            <img src="/static/images/icons/forward.png"  />
          </span>
        </div>
      `;
    } else if (page === 2) {
      html = `
        <div class="glass-buttons">
          <div class="circle green close-btn"><i class="fas fa-times"></i></div>
          <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
          <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
        </div>
        <h3>🛠️ How Mi-Stack Works (Page 2/2)</h3>
  
        <h4>Supported App Types & Required Files/Folders</h4>
        <ul>
          <li><strong>Node.js:</strong> server.js, package.json, node_modules/ (optional - installed automatically)</li>
          <li><strong>Python (Flask):</strong> app.py, requirements.txt, static/ (for CSS, JS, images), templates/ (for HTML)</li>
          <li><strong>Static HTML:</strong> index.html and related assets (CSS, JS, images) in folders</li>
          <li><strong>Go:</strong> main.go, go.mod, go.sum, any static assets</li>
          <li><strong>Ruby (Sinatra):</strong> app.rb, Gemfile, public/ (for static files), views/ (for templates)</li>
          <li><strong>PHP:</strong> index.php and related PHP files, assets folders</li>
          <li><strong>Java (Spring Boot):</strong> jar/war files and configuration files</li>
        </ul>
  
        <p>Ensure your app listens on port 8080 for compatibility with Mi-Stack hosting.</p>
  
        <div class="modal-nav">
          <span class="nav-arrow back" title="Back" onclick="openModal('how', 1)" >
            <img src="/static/images/icons/back.png" />
            <strong>Backward</strong>
          </span>
        </div>
      `;
    }
  }
  
  
  else if (type === 'nodejsZip') {
    html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>📦 Node.js ZIP File Structure</h3>
      <p>Ensure your <code>project.zip</code> has this format:</p>
      <pre style="background:#f9f9f9;padding:15px;border-radius:8px;overflow:auto;">
project.zip
├── server.js
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── script.js
      </pre>
      <p><strong>Why is <code>package.json</code> required?</strong></p>
      <p>
        The <code>package.json</code> file defines your app’s dependencies and scripts.<br/>
        Make sure it includes a <code>"start"</code> script like this:
      </p>
      <pre style="background:#f4f4f4;padding:10px;border-left:4px solid #007acc;">
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
      </pre>
    `;
  } 
  
  else if (type === 'phpZip') {
    html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>🐘 PHP App Structure & Guidelines</h3>
      <p>Please prepare your ZIP file with this structure:</p>
      <pre>
  project.zip
  ├── index.php
  ├── config.php          # Optional config files
  ├── includes/           # PHP includes or libraries
  ├── public/             # Public assets (css, js, images)
  │   ├── css/
  │   ├── js/
  │   └── images/
  └── vendor/             # Composer dependencies (do NOT include this)
      </pre>
      <p><strong>Important Notes:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li><code>index.php</code> should be at the root or in the document root folder.</li>
        <li>Organize your PHP files and includes in folders like <code>includes/</code> or similar.</li>
        <li><code>public/</code> folder is recommended for CSS, JavaScript, and image assets.</li>
        <li><em>Do NOT include</em> the <code>vendor/</code> folder or <code>node_modules</code> if using Composer or npm; dependencies will be installed on build.</li>
        <li>Do NOT include IDE/editor config files or build caches.</li>
        <li>Your app will be served by Apache on port <code>80</code>.</li>
        <li>Ensure PHP files have correct permissions and entry points.</li>
      </ul>
      <p>Following this structure ensures your PHP app deploys correctly on Mi-Stack.</p>
    `;
  }
  
  
  else if (type === 'staticZip') {
    html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>🌐 Static Website ZIP Structure & Hosting Guidelines</h3>
      <p>Your ZIP must contain at least:</p>
      <pre>
  project.zip
  ├── index.html
  ├── styles.css
  ├── script.js
  └── assets/
      ├── images/
      ├── fonts/
      └── other static files
      </pre>
      <p><strong>Important Notes:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li><code>index.html</code> must be at the root of the ZIP and is the main entry point.</li>
        <li>Include all necessary CSS, JS, and assets your website requires (in folders like <code>assets/</code> or similar).</li>
        <li>Do NOT include <code>node_modules</code>, build tool caches, or source files (e.g., uncompiled Sass/SCSS) in your ZIP.</li>
        <li>Frameworks like <strong>Vue.js, React, Next.js, Nest.js</strong> are supported <em>only if fully built/compiled into static files</em>. Upload the build output folder contents, not the source.</li>
        <li>For React/Vue/Next.js, run the build command (e.g., <code>npm run build</code> or <code>yarn build</code>) locally, then zip the contents of the generated <code>build</code> or <code>dist</code> folder.</li>
        <li>Your site will be served on port <code>80</code> using nginx.</li>
        <li>All asset paths must be relative and correctly linked in <code>index.html</code>.</li>
      </ul>
      <p>Follow these rules to ensure your static site hosts smoothly and loads correctly on Mi-Stack.</p>
    `;
  }

  else if (type === 'javaZip') {
    if (page === 1) {
      html = `
        <div class="glass-buttons">
          <div class="circle green close-btn"><i class="fas fa-times"></i></div>
          <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
          <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
        </div>
        <h3>☕ Java App Structure (Page 1/2)</h3>
        <p>Your ZIP archive should have this root directory structure:</p>
        <pre style="background:#f7f7f7; padding:10px; border-radius:5px;">
  project.zip
  ├── app.jar              
  ├── config/             
  ├── logs/                
  └── README.md    

  # Runnable fat/uber JAR file including all dependencies
  # (Optional) Config files if your app uses external config
  # (Optional) Log output folder (if your app writes logs)
  # (Optional) Info about your app, build, or usage
        </pre>
        <p><strong>Key points:</strong></p>
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li><code>app.jar</code> must be at the root of the ZIP, ready to run with <code>java -jar app.jar</code>.</li>
          <li>Do <strong>NOT</strong> include <code>.java</code> source files or <code>.class</code> files separately.</li>
          <li>Exclude build folders like <code>target/</code>, <code>build/</code>, or any IDE-specific files.</li>
          <li>Include only files your app needs at runtime (config, resources) if applicable.</li>
          <li>Ensure <code>MANIFEST.MF</code> inside <code>app.jar</code> properly sets <code>Main-Class</code>.</li>
        </ul>
        <p>This structure helps Mi-Stack to locate and run your app smoothly.</p>
        <div class="modal-nav" style="margin-top:20px;">
          <span class="nav-arrow next" title="Next" onclick="openModal('javaZip', 2)" style="cursor:pointer; user-select:none;">
            <strong>Forward</strong>
            <img src="/static/images/icons/forward.png" alt="Next arrow" style="width:20px; vertical-align:middle;" />
          </span>
        </div>
      `;
    } else if (page === 2) {
      html = `
        <div class="glass-buttons">
          <div class="circle green close-btn"><i class="fas fa-times"></i></div>
          <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
          <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
        </div>
        <h3>☕ Java App Hosting Tips (Page 2/2)</h3></br>
        <h4>Spring Boot & Frameworks</h4>
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li>Build fat JAR using <code>mvn clean package</code> or <code>./gradlew bootJar</code>.</li>
          <li>Include embedded server (Tomcat/Jetty/Netty).</li>
          <li>Only upload runnable JAR, no source or WAR files.</li>
        </ul>
        <h4>Supported Java Frameworks</h4>
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li>Spring Boot</li>
          <li>Micronaut</li>
          <li>Quarkus</li>
          <li>Jakarta EE with embedded servers</li>
          <li>Plain runnable JAR apps</li>
        </ul>
        <h4>Additional Tips</h4>
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li>Test locally with <code>java -jar app.jar</code>.</li>
          <li>App must listen on port <code>8080</code>.</li>
          <li>Keep your JAR size reasonable to avoid upload timeouts.</li>
          <li>Check logs on Mi-Stack for startup errors.</li>
        </ul>
        <div class="modal-nav">
          <span class="nav-arrow back" title="Back" onclick="openModal('javaZip', 1)" style="cursor:pointer; user-select:none;">
            <img src="/static/images/icons/back.png" alt="Back arrow" style="width:20px; vertical-align:middle;" />
            <strong>Backward</strong>
          </span>
        </div>
      `;
    }
  }
  
  
  
  else if (type === 'goZip') {
    html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>🐹 Go App Structure & Guidelines</h3>
      <p>Please prepare your ZIP file with the following structure:</p>
      <pre>
  project.zip
  ├── main.go
  ├── go.mod
  ├── go.sum
  ├── handlers.go
  ├── utils.go
  └── assets/
      ├── css/
      ├── js/
      └── images/
      </pre>
      <p><strong>Important Notes:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li><code>main.go</code> must be at the root and contains <code>func main()</code> entrypoint.</li>
        <li><code>go.mod</code> and <code>go.sum</code> manage dependencies (required if using Go modules).</li>
        <li>Include any additional Go source files (like <code>handlers.go</code>, <code>utils.go</code>) at the root or organized folders.</li>
        <li><code>assets/</code> folder is optional; use it for static files your app serves (CSS, JS, images).</li>
        <li><em>Do NOT include</em> build artifacts, compiled binaries, <code>vendor/</code>, or <code>bin/</code> directories.</li>
        <li>Do NOT include Go cache files or any IDE/editor config files.</li>
        <li>The Docker build automatically runs <code>go build -o app</code> to compile your app.</li>
        <li>Your app will be hosted on port <code>8080</code>.</li>
        <li>Keep your import paths and module setup clean and standard.</li>
      </ul>
      <p>If you follow this structure, your Go app will deploy smoothly on Mi-Stack.</p>
    `;
  }
  
  
  else if (type === 'rubyZip') {
    showRubyPage(page);
    modalBg.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 50);
    return;
  } 
  
  else if (type === 'pythonZip') {
    if (page === 1) {
      html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>📦 Python ZIP File Structure (Page 1/2)</h3>
      <p>Ensure your <code>project.zip</code> has this format for Python apps:</p>
      <pre style="background:#f9f9f9;padding:15px;border-radius:8px;overflow:auto;">
project.zip
├── app.py
├── requirements.txt
└── static/
    ├── index.html
    ├── style.css
    └── script.js
      </pre>
      <p><strong>Why is <code>requirements.txt</code> required?</strong></p>
      <p>
        The <code>requirements.txt</code> file lists your Python dependencies.<br/>
        Make sure to include all packages your app needs to run.
      </p>
      <p><strong>Example <code>app.py</code>:</strong></p>
      <pre style="background:#f4f4f4;padding:10px;border-left:4px solid #007acc;">
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
      </pre>
      <div class="modal-nav">
        <span class="nav-arrow next" title="Next" onclick="openModal('pythonZip', 2)">
          <strong>Forward</strong>
          <img src="/static/images/icons/forward.png" alt="Next arrow" />
        </span>
      </div>
      `;
    } else if (page === 2) {
      html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>🐍 Python Hosting Tips (Page 2/2)</h3>
      <p><strong>Important:</strong> Do <em>NOT</em> include virtual environments (like <code>venv/</code> or <code>.env/</code>) inside your ZIP. These can cause deployment failures and unnecessarily bloat your package.</p>
      <p>Instead, list all your dependencies in <code>requirements.txt</code> so they can be installed fresh in the container.</p>
      <h4>Flask apps:</h4>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li>Ensure your app listens on all interfaces: <code>app.run(host='0.0.0.0')</code>.</li>
        <li>Serve static files from the <code>static/</code> folder.</li>
        <li>Use <code>requirements.txt</code> to list Flask and other packages.</li>
      </ul>
      <h4>Django apps:</h4>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li>Your ZIP should include the Django project folder, <code>manage.py</code>, and a <code>requirements.txt</code>.</li>
        <li>Make sure to collect static files via <code>python manage.py collectstatic</code> before zipping.</li>
        <li>Do not include your database files (like <code>db.sqlite3</code>) unless you want to keep existing data.</li>
        <li>Configure your <code>ALLOWED_HOSTS</code> in <code>settings.py</code> to include <code>*</code> or your deployment URL.</li>
      </ul>
      <p>Following these guidelines will help your Python app deploy smoothly.</p>
      <div class="modal-nav">
        <span class="nav-arrow back" title="Back" onclick="openModal('pythonZip', 1)">
          <img src="/static/images/icons/back.png" alt="Back arrow" />
          <strong>Backward</strong>
        </span>
      </div>
      `;
    }
  } 
  else if (type === 'about') {
    html = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>👤 About Us</h3></br>
      <p>Mi-Stack was created by <strong>Missari</strong> to radically simplify app hosting — especially for <strong>Frontend</strong>, <strong>Backend</strong>, and DevOps.</p>
      <p>Instead of managing complex VPS instances or cloud servers, Mi-Stack offers a streamlined, one-click deployment experience that abstracts away infrastructure hassles.</p>
      <p>Our platform builds, packages, and runs your apps inside automatically — so you can focus on coding, not server operations.</p>
      </br><p>Mi-Stack is designed to compete with big cloud providers like AWS by providing easy, accessible, and affordable hosting with fast deployment and minimal setup.</p>
      </br><p>
        <a href="https://www.linkedin.com/company/mi-stack/" target="_blank" style="
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          margin-top: 5px;
          gap: 8px;
          font-weight: bold;
          letter-spacing: 0.8px;
          color: #0A66C2;
          transition: all 0.3s ease;
        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="22" height="22" style="vertical-align: middle;" />
          LinkedIn For Mi-Stack🧑🏻‍🚀🚀
        </a>
      </p>
    `;
  }
  

  modal.innerHTML = html;
  modalBg.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 50);

  // Add event listeners for close buttons
  modal.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeModal();
    });
  });
}

modalBg.addEventListener('click', e => {
  if (e.target === modalBg) {
    modal.classList.remove('show');
    setTimeout(() => (modalBg.style.display = 'none'), 200);
  }
});

function closeModal() {
  modal.classList.remove('show');
  setTimeout(() => (modalBg.style.display = 'none'), 200);
}

function showRubyPage(page) {
  let content = '';


  if (page === 1) {
    content = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>💎 Ruby App ZIP Structure (Page 1/3)</h3>
      <p>Include essential files/folders at ZIP root:</p>
      <pre>
project.zip
├── Gemfile
├── Gemfile.lock
├── main.rb (or app.rb)
├── config/
├── lib/
├── app/
├── bin/
├── public/
└── other necessary files
      </pre>
      <p><strong>Exclude:</strong> virtual envs (<code>.bundle</code>, <code>vendor/bundle</code>), editor folders (<code>.idea</code>), logs (<code>log/</code>), system files.</p>
      <div class="modal-nav">
        <span class="nav-arrow next" title="Next" onclick="showRubyPage(2)">
          <strong>Forward</strong>
          <img src="/static/images/icons/forward.png" alt="Next arrow" />
        </span>
      </div>
    `;
  } else if (page === 2) {
    content = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>💡 Ruby Hosting Basics (Page 2/3)</h3>
      <p>Mi-Stack runs your app using this Dockerfile:</p>
      <pre>
FROM ruby:3.2
WORKDIR /app
COPY . .
RUN gem install bundler && bundle install
EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]
      </pre>
      <p>App should listen on port 3000.</p>
      <p>Run locally in Docker before upload:</p>
      <pre>
docker build -t my-ruby-app .
docker run -p 3000:3000 my-ruby-app
      </pre>
      <div class="modal-nav">
        <span class="nav-arrow back" title="Back" onclick="showRubyPage(1)">
          <img src="/static/images/icons/back.png" alt="Back arrow" />
          <strong>Backward</strong>
        </span>
        <span class="nav-arrow next" title="Next" onclick="showRubyPage(3)">
          <strong>Forward</strong>
          <img src="/static/images/icons/forward.png" alt="Next arrow" />
        </span>
      </div>
    `;
  } else if (page === 3) {
    content = `
      <div class="glass-buttons">
        <div class="circle green close-btn"><i class="fas fa-times"></i></div>
        <div class="circle yellow close-btn"><i class="fas fa-times"></i></div>
        <div class="circle red close-btn"><i class="fas fa-minus"></i></div>
      </div>
      <h3>⚙️ Frameworks & Best Practices (Page 3/3)</h3>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li><strong>Rails:</strong> Include <code>app/</code>, <code>config/</code>, <code>bin/rails</code>, and <code>public/</code>.</li>
        <li><strong>Sinatra/Padrino:</strong> Include main app file (e.g., <code>main.rb</code>), <code>config/</code>, and <code>lib/</code> as needed.</li>
        <li>Avoid committing sensitive config or local gems. Use env variables for secrets.</li>
        <li>Keep your project clean from unnecessary files to speed Docker builds.</li>
      </ul>
      <p>Supported Ruby frameworks:</p>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li>Ruby on Rails</li>
        <li>Sinatra</li>
        <li>Padrino</li>
        <li>Other Ruby CLI or background apps</li>
      </ul>
      <div class="modal-nav">
        <span class="nav-arrow back" title="Back" onclick="showRubyPage(2)">
          <img src="/static/images/icons/back.png" alt="Back arrow" />
          <strong>Backward</strong>
        </span>
      </div>
    `;
  }
  modal.innerHTML = content;
  modalBg.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 50);

  // Add event listeners for close buttons
  modal.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeModal();
    });
  });

// Navigation arrows dynamic event handling
const nextArrow = modal.querySelector('.nav-arrow.next');
if (nextArrow) {
  nextArrow.addEventListener('click', e => {
    e.stopPropagation();
    if (page < 3) {
      showRubyPage(page + 1);
    }
  });
}

const backArrow = modal.querySelector('.nav-arrow.back');
if (backArrow) {
  backArrow.addEventListener('click', e => {
    e.stopPropagation();
    if (page > 1) {
      showRubyPage(page - 1);
    }
  });
}
}

// Starfield animation
(function () {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let w, h;
  let stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((w * h) / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0005 + 0.0002,
      });
    }
  }

  let lastTime = 0;

  function animateStars(time) {
    const delta = time - lastTime;
    lastTime = time;
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.phase += s.speed * delta;
      const alpha = 0.5 + 0.5 * Math.sin(s.phase);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animateStars);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animateStars);
})();

// Flying Heart Animation
function createFlyingHeart(icon) {
  const heart = document.createElement('div');
  heart.className = 'flying-heart';
  heart.textContent = '💜';
  const rect = icon.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + (Math.random() * 20 - 10);
  const y = rect.top + rect.height / 2 + (Math.random() * 20 - 10);
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  document.body.appendChild(heart);
  heart.addEventListener('animationend', () => heart.remove());
}

function startRandomFlyingHearts() {
  const icons = document.querySelectorAll('.icon-row img');
  setInterval(() => {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    createFlyingHeart(icon);
  }, 3000);
}

// Preloader end animations
function startPageAnimations() {
  document.querySelectorAll(".icon-row img").forEach(img => {
    img.classList.add("show");
  });

  const astronaut = document.querySelector(".fly-astronaut");
  if (astronaut) {
    astronaut.style.animation = "flyAcross 5s linear forwards";
  }
}