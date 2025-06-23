// starfield.js
(function () {
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

  function animate() {
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

