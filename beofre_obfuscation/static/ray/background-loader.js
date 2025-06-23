// background-loader.js
window.addEventListener('load', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rand = Math.floor(Math.random() * 1000);
  const url = `https://picsum.photos/${width}/${height}?random=${rand}`;
  document.body.style.backgroundImage = `url('${url}')`;
});

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

(function loadBackgroundImage() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rand = Math.floor(Math.random() * 1000);
  const url = `https://picsum.photos/${width}/${height}?random=${rand}`;

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
})();

