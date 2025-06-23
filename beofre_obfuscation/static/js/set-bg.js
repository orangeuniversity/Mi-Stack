// set-bg.js

window.addEventListener('load', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rand = Math.floor(Math.random() * 1000); // prevent caching
  const url = `https://picsum.photos/${width}/${height}?random=${rand}`;
  document.body.style.backgroundImage = `url('${url}')`;
});

