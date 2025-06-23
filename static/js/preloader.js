// preloader.js

// Starfield effect
(function(){
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = [];
    const count = Math.floor((w * h) / 8000);
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

  function animate(time) {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.phase += s.speed * 16;
      const alpha = 0.5 + 0.5 * Math.sin(s.phase);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
})();

// Preloader logic
const width = window.innerWidth;
const height = window.innerHeight;
const rand = Math.floor(Math.random() * 1000);
const url = `https://picsum.photos/${width}/${height}?random=${rand}`;

function updateProgress(p) {
  const clamped = Math.max(0, Math.min(100, p));
  const bar = document.querySelector(".preloader .progress-bar");
  const percEl = document.querySelector(".preloader .percentage");
  const pre = document.querySelector(".preloader");
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

// Fetch and display background image
fetch(url)
  .then(res => {
    const total = parseInt(res.headers.get("Content-Length")) || 1000000;
    let loaded = 0;
    const reader = res.body.getReader();
    const chunks = [];
    return (function read() {
      return reader.read().then(({ done, value }) => {
        if (done) return new Blob(chunks);
        loaded += value.byteLength;
        chunks.push(value);
        updateProgress(Math.round((loaded / total) * 100));
        return read();
      });
    })();
  })
  .then(blob => {
    const bgUrl = URL.createObjectURL(blob);
    document.body.style.backgroundImage = `url('${bgUrl}')`;
  })
  .catch(err => {
    console.warn("Image load error", err);
  });

