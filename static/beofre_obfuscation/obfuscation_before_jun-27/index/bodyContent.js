document.addEventListener("DOMContentLoaded", () => {
  const isAuth = window.isAuthenticated === true || window.isAuthenticated === 'true';
  const main = document.getElementById("mainContent");
  const modalContent = document.getElementById("modalContent");

  if (!isAuth) {
    main.innerHTML = `
      <div class="container">
        <h2>Welcome to Mi-Stack</h2>
        <div class="icon-row">
          <img onclick="openModal('how')" src="https://cdn-icons-png.flaticon.com/512/1055/1055710.png" title="How it works">
          <img onclick="openModal('zip')" src="https://cdn-icons-png.flaticon.com/512/2910/2910797.png" title="ZIP example">
          <img onclick="openModal('about')" src="https://cdn-icons-png.flaticon.com/512/1995/1995522.png" title="About us">
        </div>
        <p>Please <a href="${window.loginUrl}">login</a> or <a href="${window.registerUrl}">register</a> to start hosting your apps.</p>
      </div>
    `;
  } else {
    main.innerHTML = `
      <div class="container">
        <h2>Deploy a New App</h2>
        <form action="${window.uploadUrl}" method="POST" enctype="multipart/form-data">
          <label>Upload a ZIP file:</label>
          <input type="file" name="site_zip" accept=".zip">
          <label>Or enter GitHub repo HTTPS URL:</label>
          <input type="text" name="github_url" placeholder="https://github.com/username/repo">
          <input type="submit" value="Upload &amp; Host" onclick="showUploadSpinner()">
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
  }

  modalContent.innerHTML = `
    <div class="glass-buttons">
      <div class="circle red" onclick="closeModal()"><i class="fas fa-times"></i></div>
      <div class="circle yellow" onclick="closeModal()"><i class="fas fa-minus"></i></div>
    </div>
  `;
});

