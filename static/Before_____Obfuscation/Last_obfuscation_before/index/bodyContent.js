document.addEventListener("DOMContentLoaded", () => {
  const isAuth = window.isAuthenticated === true || window.isAuthenticated === 'true';
  const main = document.getElementById("mainContent");
  const modalContent = document.getElementById("modalContent");

  if (!isAuth) {
    main.innerHTML = `

    
      <div class="container1">
  
  
  <div class="icon-row">
    <img src="/static/images/icons/1055710.png" title="How it works" onclick="openModal('how')">
    <img src="/static/images/icons/node.png" title="Node.js ZIP example" onclick="openModal('nodejsZip')">
    <img src="/static/images/icons/python.png" title="Python ZIP example" onclick="openModal('pythonZip')">
    <img src="/static/images/icons/php.png"  title="PHP ZIP example" onclick="openModal('phpZip')">
    <img src="/static/images/icons/html.png"  title="Static Website example" onclick="openModal('staticZip')">
    <img src="/static/images/icons/java.png"  title="Java ZIP example" onclick="openModal('javaZip')">
    <img src="/static/images/icons/go.png"  title="Go ZIP example" onclick="openModal('goZip')">
    <img src="/static/images/icons/ruby.png"  title="Ruby ZIP example" onclick="openModal('rubyZip')">
    <img src="/static/images/icons/1995522.png"  title="About us" onclick="openModal('about')">
  </div>
</div>

<div class="container2">
<h2>Welcome to Mi-Stack</h2>
<p>Please <a href="${window.loginUrl}">login</a> or <a href="${window.registerUrl}">register</a> to start hosting your apps.</p>
</div>

<img src="/static/images/astronaut/1.png" class="fly-astronaut" style="animation-play-state: paused;">





    `;

    // Now run JavaScript *after* the element is inserted in the DOM
const astronautImages = ['1.png', 'travel_in_home_1.png', 'travel_in_home_2.png'];
const img = document.querySelector('.fly-astronaut');
if (img) {
  const randomIndex = Math.floor(Math.random() * astronautImages.length);
  img.src = `/static/images/astronaut/${astronautImages[randomIndex]}`;
}

    //Before login is above : after logged in is below
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
          
         <label>Select App Type:</label></br>

<div class="app-type-options">
  <label class="switch">
    <input type="checkbox" name="app_type" value="nodejs" checked>
    <span class="slider"></span>
    <span class="label-text">Node.js</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="python">
    <span class="slider"></span>
    <span class="label-text">Python</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="go">
    <span class="slider"></span>
    <span class="label-text">Go</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="java">
    <span class="slider"></span>
    <span class="label-text">Java</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="php">
    <span class="slider"></span>
    <span class="label-text">PHP</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="ruby">
    <span class="slider"></span>
    <span class="label-text">Ruby</span>
  </label>

  <label class="switch">
    <input type="checkbox" name="app_type" value="static">
    <span class="slider"></span>
    <span class="label-text">Static Site (HTML/CSS/JS, Vue.js*, Next.js*)</span>
  </label>
</div>




          <!-- Hidden field for combined app ID -->
          <input type="hidden" id="appId" name="app_id" value="">

          <input type="submit" value="Upload &amp; Host">
          <div id="uploadSpinner" class="upload-spinner"></div>
        </form>

        <h2>Your Running Apps</h2>

        </b></br></br>

        <p id="slotStatus" style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">
          Slots: Loading...
        </p>

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

   

     // Enforce only one toggle ON at a time (like radio buttons)
  document.querySelectorAll('.app-type-options input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        // Uncheck all others
        document.querySelectorAll('.app-type-options input[type="checkbox"]').forEach((cb) => {
          if (cb !== checkbox) cb.checked = false;
        });
      } else {
        // Prevent all unchecked - revert toggle on if none is selected
        const anyChecked = Array.from(document.querySelectorAll('.app-type-options input[type="checkbox"]')).some(cb => cb.checked);
        if (!anyChecked) {
          checkbox.checked = true; // revert back to checked
        }
      }
    });
  });

    // Function to update the slot status display with 🔋 and 🪫 emojis
    async function updateSlotStatus() {
      try {
        const res = await fetch('/user-slot-status');  // Your backend endpoint to get slots
        if (!res.ok) throw new Error('Failed to fetch slot status');
        const data = await res.json();

        const maxSlots = data.max_slots || 0;
        const usedSlots = data.used_slots || 0;

        let slotEmojis = '';
        for (let i = 0; i < usedSlots; i++) slotEmojis += '🔋';  // Used/occupied slots
        for (let i = usedSlots; i < maxSlots; i++) slotEmojis += '🪫';  // Available slots

        const slotStatusEl = document.getElementById('slotStatus');
        if (slotStatusEl) {
          slotStatusEl.textContent = `Slots: ${slotEmojis}`;
        }
      } catch (error) {
        console.error('Error loading slot status:', error);
        const slotStatusEl = document.getElementById('slotStatus');
        if (slotStatusEl) {
          slotStatusEl.textContent = 'Slots: Error loading';
        }
      }
    }

    // Function to load and display user's running apps
    async function loadApps() {
      try {
        const res = await fetch('/list-apps');
        if (!res.ok) throw new Error('Failed to load apps');
        const apps = await res.json();

        const tbody = document.querySelector('#apps-table tbody');
        tbody.innerHTML = '';

        apps.forEach(app => {
          const tr = document.createElement('tr');
          tr.setAttribute('data-appid', app.id);
          tr.innerHTML = `
            <td>${app.id}</td>
            <td><a href="http://${window.location.hostname}:${app.port}" target="_blank">http://${window.location.hostname}:${app.port}</a></td>
            <td><button class="delete-btn" data-appid="${app.id}">Delete</button></td>
          `;
          tbody.appendChild(tr);
        });

        // Attach delete event listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async e => {
            const appId = e.target.getAttribute('data-appid');
            if (!appId) return;

            if (!confirm(`Delete app "${appId}"?`)) return;

            try {
              const res = await fetch(`/delete-app/${appId}`, { method: 'DELETE' });
              if (!res.ok) {
                alert('Failed to delete app.');
                return;
              }
              // Remove row immediately
              const row = document.querySelector(`tr[data-appid="${appId}"]`);
              if (row) row.remove();

              // Update slot/battery status immediately
              updateSlotStatus();
            } catch {
              alert('Error deleting app.');
            }
          });
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Call slot status update on page load and on pageshow (back/forward)
    window.addEventListener('pageshow', () => {
      updateSlotStatus();
      loadApps();
    });

    // Also call once immediately on load
    updateSlotStatus();
    loadApps();

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
