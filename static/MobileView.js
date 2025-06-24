function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(navigator.userAgent);
}

window.addEventListener('load', () => {
  if (isMobile()) {
    const pre = document.querySelector('.preloader');
    if (pre) {
      // As soon as preloader disappears (optional fade-out), redirect
      pre.addEventListener('transitionend', () => {
        window.location.href = 'mobile.html';
      });
      pre.addEventListener('animationend', () => {
        window.location.href = 'mobile.html';
      });

      // Optional: If no animation is happening at all, just go right now
      if (getComputedStyle(pre).opacity === '0') {
        window.location.href = 'mobile.html';
      }
    } else {
      // No preloader? Go immediately.
      window.location.href = 'mobile.html';
    }
  }
});
