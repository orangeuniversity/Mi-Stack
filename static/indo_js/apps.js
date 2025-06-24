async function loadApps() {
    const res = await fetch('/list-apps');
    const apps = await res.json();
    const tbody = document.querySelector('#apps-table tbody');
    tbody.innerHTML = '';
    apps.forEach(app => {
      tbody.innerHTML += `
        <tr>
          <td>${app.id}</td>
          <td><a href="http://${location.hostname}:${app.port}" target="_blank">http://${location.hostname}:${app.port}</a></td>
          <td><button class="delete-btn" onclick="deleteApp('${app.id}')">Delete</button></td>
        </tr>
      `;
    });
  }
  
  async function deleteApp(id) {
    const res = await fetch('/delete-app/' + id, { method: 'DELETE' });
    if (res.ok) loadApps();
    else alert('Delete failed');
  }
  
  function showUploadSpinner() {
    document.getElementById('uploadSpinner').style.display = 'block';
  }
  
  window.onload = () => {
    if (document.body.classList.contains('guest-mode') === false) loadApps();
    initPreloaderBackground();
  };
  