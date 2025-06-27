document.addEventListener("DOMContentLoaded", () => {
  const preloaderContainer = document.querySelector(".preloader-container");
  if (preloaderContainer) {
    preloaderContainer.innerHTML = `
      <div aria-label="Loading content" aria-live="polite" class="preloader" role="status">
        <canvas id="starfield"></canvas>
        <div class="galaxy">
          <i class="fas fa-star center-star"></i>
          <div class="orbit orbit1"><div class="planet"></div></div>
          <div class="orbit orbit2"><div class="planet"></div></div>
          <div class="orbit orbit3"><div class="planet"></div></div>
          <div class="orbit orbit4"><div class="planet"></div></div>
        </div>
        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
        <div class="percentage">0%</div>
      </div>
    `;
  }
});

