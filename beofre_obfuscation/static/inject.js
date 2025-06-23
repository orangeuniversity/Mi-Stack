import { Templates } from './templates.js';

document.addEventListener("DOMContentLoaded", function () {
  const dynamicDiv = document.getElementById("dynamicContent");

  // Load preloader
  document.body.insertAdjacentHTML("afterbegin", Templates.preloader);

  // Load modal
  dynamicDiv.insertAdjacentHTML("beforeend", Templates.modal);

  // Load guest icons if not logged in
  const isGuest = document.body.classList.contains("guest-mode");
  if (isGuest) {
    document.getElementById("mainContent").innerHTML = Templates.guestIcons;
  }
});

