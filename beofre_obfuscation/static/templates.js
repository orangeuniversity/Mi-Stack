export const Templates = {
  preloader: `
    <div class="preloader" role="status" aria-live="polite" aria-label="Loading content">
      <canvas id="starfield"></canvas>
      <div class="galaxy">
        <i class="fas fa-star center-star"></i>
        <div class="orbit orbit1"><div class="planet"></div></div>
        <div class="orbit orbit2"><div class="planet"></div></div>
        <div class="orbit orbit3"><div class="planet"></div></div>
        <div class="orbit orbit4"><div class="planet"></div></div>
      </div>
      <div class="progress-container"><div class="progress-bar"></div></div>
      <div class="percentage">0%</div>
    </div>
  `,

  modal: `
    <div class="modal-bg" id="modalBg">
      <div class="modal" id="modalContent"></div>
    </div>
  `,

  guestIcons: `
    <div class="container">
      <h2>Welcome to Mi-Stack</h2>
      <div class="icon-row">
        <img src="https://cdn-icons-png.flaticon.com/512/1055/1055710.png"
             title="How it works" onclick="openModal('how')"/>
        <img src="https://cdn-icons-png.flaticon.com/512/2910/2910797.png"
             title="ZIP example" onclick="openModal('zip')"/>
        <img src="https://cdn-icons-png.flaticon.com/512/1995/1995522.png"
             title="About us" onclick="openModal('about')"/>
      </div>
      <p>Please <a href="/login">login</a> or <a href="/register">register</a> to start hosting your apps.</p>
    </div>
  `
};

