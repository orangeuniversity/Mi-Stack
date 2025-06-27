// Declare these globally so playCompletion() can access them
let loadingText, completeText;

// Modal logic (unchanged)
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
    const bgImage = `/static/ui_ux/image${randomNumber}.jpg`;

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
        setTimeout(() => {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, PRELOADER_FADE_TIME);
      }
    }

    animateProgress();

  }, remainingTime);

  startRandomFlyingHearts();
});

// Modal variables and functions
const modalBg = document.getElementById('modalBg');
const modal = document.getElementById('modalContent');

function openModal(type) {
  let html = '';
  if (type === 'how') {
    html = `
      <div class="glass-buttons">
        <div class="circle green" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle yellow" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle red" onclick="closeModal()"><i class="fas fa-minus"></i></div>
      </div>
      <h3>🛠️ How Mi-Stack Works</h3>
      <p>Deploy any Node.js app easily: upload a ZIP or provide GitHub repo URL.</p>
      <ol>
        <li>Zip your project with <code>server.js</code>, <code>package.json</code> (with start script), and <code>public/</code>.</li>
        <li>Or create a GitHub repo, then copy HTTPS URL:</li>
      </ol>
      <img src="https://docs.github.com/assets/images/help/repository/code-button.png" alt="GitHub code button" style="max-width:100%;margin:10px 0;" />
      <p>Click "Code" → copy HTTPS URL → paste it in the field.</p>
    `;
  }
  if (type === 'zip') {
    html = `
      <div class="glass-buttons">
        <div class="circle green" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle yellow" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle red" onclick="closeModal()"><i class="fas fa-minus"></i></div>
      </div>
      <h3>📦 ZIP File Structure</h3>
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
  if (type === 'about') {
    html = `
      <div class="glass-buttons">
        <div class="circle green" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle yellow" onclick="closeModal()"><i class="fas fa-times"></i></div>
        <div class="circle red" onclick="closeModal()"><i class="fas fa-minus"></i></div>
      </div>
      <h3>👤 About Us</h3>
      <p>Mi-Stack was created by <strong>Missari</strong>, a passionate developer aiming to make Node.js hosting simple and accessible.</p>
      <p>Our mission is to empower developers to deploy apps in seconds — no hassle, no servers.</p>
      <p>
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
}

modalBg.addEventListener('click', e => {
  if (!modal.contains(e.target)) {
    modal.classList.remove('show');
    setTimeout(() => (modalBg.style.display = 'none'), 200);
  }
});

function closeModal() {
  modal.classList.remove('show');
  setTimeout(() => (modalBg.style.display = 'none'), 200);
}

// STARFIELD ANIMATION
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

// Spinner Circle JS
function showUploadSpinner() {
  document.getElementById('uploadSpinner').style.display = 'block';
}

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

