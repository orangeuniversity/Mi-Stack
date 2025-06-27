document.addEventListener("DOMContentLoaded", () => {
  // Insert the login form HTML with message container
  const containerHTML = `
    <div class="glass-container">
      <h2>Login to Mi-Stack</h2>
      <div id="message" class="flash" style="display:none;"></div>
      <form id="loginForm" autocomplete="off">
        <input name="email" placeholder="Email" required type="email" />
        <input name="password" placeholder="Password" required type="password" />
        <button type="submit">Login</button>
      </form>
      <a href="${registerUrl}">Don't have an account? Register</a>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", containerHTML);

  // Grab form and message div
  const form = document.getElementById("loginForm");
  const messageDiv = document.getElementById("message");

  // Clear and show message helper
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = "flash"; // reset classes
    messageDiv.classList.add(type);
    messageDiv.style.display = "block";
  }

  // Handle form submit via AJAX
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    messageDiv.style.display = "none";
    messageDiv.textContent = "";

    const formData = new FormData(form);
    const data = new URLSearchParams(formData);

    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        showMessage("✅ Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = indexUrl;
        }, 1500);
      } else {
        // Error
        showMessage(result.error || "❌ Login failed.", "warning");
      }
    } catch (err) {
      showMessage("❌ Network error. Try again.", "warning");
    }
  });
});

