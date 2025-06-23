// === Mi-Stack Frontend Logic ===

// Load running apps (authenticated only)
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

window.onload = () => {
  const isAuth = !document.body.classList.contains('guest-mode');
  if (isAuth) loadApps();
  initPreloaderBackground();
};

function openModal(type) {
  const modalBg = document.getElementById('modalBg');
  const modal = document.getElementById('modalContent');
  let html = '';

  if (type === 'how') {
    html = `
      <h3>🛠️ How Mi-Stack Works</h3>
      <p>Deploy any Node.js app easily: upload a ZIP or provide GitHub repo URL.</p>
      <ol>
        <li>Zip your project with <code>server.js</code>, <code>package.json</code>, and <code>public/</code>.</li>
        <li>Paste your GitHub repo HTTPS URL in the field.</li>
      </ol>
    `;
  } else if (type === 'zip') {
    html = `<h3>📦 ZIP File Structure</h3><p>Ensure your project.zip looks like:</p>
<pre>
project.zip
├── server.js
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── script.js
</pre>`;
  } else if (type === 'about') {
    html = `<h3>👤 About Us</h3><p>Mi-Stack is built by Missari.</p>`;
  }

  modal.innerHTML = html;
  modalBg.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 50);
}

document.getElementById('modalBg').addEventListener('click', e => {
  const modal = document.getElementById('modalContent');
  if (!modal.contains(e.target)) {
    modal.classList.remove('show');
    setTimeout(() => document.getElementById('modalBg').style.display = 'none', 200);
  }
});

// === Spinner on Upload ===
function showUploadSpinner() {
  document.getElementById('uploadSpinner').style.display = 'block';
}

// === Preloader + Starfield + Background Image ===
function initPreloaderBackground() {
  const isGuest = document.body.classList.contains('guest-mode');
  if (!isGuest) {
    document.body.classList.add('preloader-done');
    document.querySelector('.preloader')?.classList.add('hidden');
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "white";
    return;
  }

  // Starfield canvas
  (function(){
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
      const count = Math.floor((w*h)/8000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0005 + 0.0002
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
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      });
      requestAnimationFrame(animateStars);
    }
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(animateStars);
  })();

  // Background image + loading progress
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rand = Math.floor(Math.random() * 1000);
  const url = `https://picsum.photos/${width}/${height}?random=${rand}`;
  fetch(url)
    .then(res => {
      const contentLength = res.headers.get('Content-Length');
      if (!res.ok) throw new Error("Network response was not ok");
      if (!contentLength) return res.blob().then(b => {
        updateProgress(100);
        return b;
      });
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      const reader = res.body.getReader();
      const chunks = [];
      function read() {
        return reader.read().then(({ done, value }) => {
          if (done) return new Blob(chunks);
          loaded += value.byteLength;
          chunks.push(value);
          const percent = Math.round((loaded / total) * 100);
          updateProgress(percent);
          return read();
        });
      }
      return read();
    })
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      document.body.style.backgroundImage = `url('${objectUrl}')`;
      playCompletion();
    })
    .catch(() => playCompletion());
}

function updateProgress(p) {
  const bar = document.querySelector(".preloader .progress-bar");
  const percEl = document.querySelector(".preloader .percentage");
  const pre = document.querySelector(".preloader");
  const clamped = Math.max(0, Math.min(100, p));
  if (!bar || !percEl || !pre) return;
  bar.style.width = clamped + "%";
  percEl.textContent = clamped + "%";
  if (clamped >= 100) {
    setTimeout(() => {
      pre.classList.add("hidden");
      setTimeout(() => pre.remove(), 600);
    }, 300);
  }
}

function playCompletion() {
  const tl = gsap.timeline();
  const loadingText = new SplitType(".loading-text.initial", { types: "chars" });
  const completeText = new SplitType(".loading-text.complete", { types: "chars" });
  gsap.set(loadingText.chars, { opacity: 0, y: 100 });
  gsap.set(completeText.chars, { opacity: 0, y: 100 });
  gsap.set(".loading-text.complete", { y: "100%" });
  tl.to(".loading-text.initial", {
    y: "-100%",
    duration: 0.5,
    ease: "power2.inOut"
  })
  .to(".loading-text.complete", {
    y: "0%",
    duration: 0.5,
    ease: "power2.inOut"
  }, "<")
  .to(completeText.chars, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    stagger: 0.03,
    ease: "power2.out"
  }, "<0.2")
  .to(".preloader", {
    y: "-100vh",
    duration: 1,
    ease: "power2.inOut",
    delay: 0.8
  })
  .set("body", { className: "+=preloader-done" }, "-=0.5")
  .set(".preloader", { display: "none" });
}

