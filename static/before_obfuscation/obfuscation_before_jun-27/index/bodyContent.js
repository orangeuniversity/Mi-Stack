//bodyContent.js
document.addEventListener("DOMContentLoaded", () => {
  const isAuth = window.isAuthenticated === true || window.isAuthenticated === 'true';
  const main = document.getElementById("mainContent");
  const modalContent = document.getElementById("modalContent");

  if (!isAuth) {
    main.innerHTML = `
      <div class="container">
        <h2>Welcome to Mi-Stack</h2>
        <div class="icon-row">
          <img onclick="openModal('how')" src="/static/index/1055710.png" title="How it works">
          <img onclick="openModal('zip')" src="/static/index/node.png" title="Node.js ZIP example">
          <img onclick="openModal('pythonZip')" src="/static/index/python.png" title="Python ZIP example">
          <img onclick="openModal('about')" src="/static/index/1995522.png" title="About us">
        </div>
        <p>Please <a href="${window.loginUrl}">login</a> or <a href="${window.registerUrl}">register</a> to start hosting your apps.</p>
      </div>
    `;
  } else {
    main.innerHTML = `
      <div class="container_deploy">
        <h2>Deploy a New App</h2></br>
        <form id="deployForm" action="${window.uploadUrl}" method="POST" enctype="multipart/form-data">
          <label>App Name:</label>
          <input type="text" id="appName" name="app_name" placeholder="Enter your app name" required>

          <label>Upload a ZIP file:</label>
          <input type="file" name="site_zip" accept=".zip">

          <label>Or enter GitHub repo HTTPS URL:</label>
          <input type="text" name="github_url" placeholder="https://github.com/username/repo">

          </br></br>
          <label>Select App Type:</label>
          <div class="app-type-options">
            <label><input type="radio" name="app_type" value="nodejs" checked required> Node.js</label>
            <label><input type="radio" name="app_type" value="python" required> Python</label>
            <label><input type="radio" name="app_type" value="static" required> Front-End</label>
          </div>

          <!-- Hidden field for combined app ID -->
          <input type="hidden" id="appId" name="app_id" value="">

          <input type="submit" value="Upload &amp; Host">
          <div id="uploadSpinner" class="upload-spinner"></div>
        </form>

        <h2>Your Running Apps</h2>
        <table id="apps-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>URL</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    // Add submit event listener to form to combine username + app name before submit
    const deployForm = document.getElementById('deployForm');
    deployForm.addEventListener('submit', (e) => {
      const appNameInput = document.getElementById('appName');
      const appIdInput = document.getElementById('appId');

      // Basic validation for app name
      if (!appNameInput.value.trim()) {
        e.preventDefault();
        alert('Please enter an app name.');
        return false;
      }

      // Assume username is available in window.username
      const username = window.username || 'user';

      // Create app ID by combining username + app name (lowercase, no spaces)
      const appNameClean = appNameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
      const combinedAppId = `${username}-${appNameClean}`;

      appIdInput.value = combinedAppId;

      // Show spinner only AFTER validation passed
      showUploadSpinner();
    });
  }

  modalContent.innerHTML = `
    <div class="glass-buttons">
      <div class="circle red" onclick="closeModal()"><i class="fas fa-times"></i></div>
      <div class="circle yellow" onclick="closeModal()"><i class="fas fa-minus"></i></div>
    </div>
  `;
});
