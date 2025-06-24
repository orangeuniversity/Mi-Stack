const modalBg = document.getElementById('modalBg');
const modal = document.getElementById('modalContent');

function openModal(type) {
  let html = '';
  if (type === 'how') {
    html = `
      <h3>🛠️ How Mi-Stack Works</h3>
      <p>Deploy any Node.js app easily: upload a ZIP or provide GitHub repo URL.</p>
      <ol>
        <li>Zip your project with <code>server.js</code>, <code>package.json</code> (with start script), and <code>public/</code>.</li>
        <li>Or create a GitHub repo, then copy HTTPS URL:</li>
      </ol>
      <img src="https://docs.github.com/assets/images/help/repository/code-button.png" alt="GitHub code button" style="max-width:100%;margin:10px 0;" />
      <p>Click "Code" → copy HTTPS URL → paste it in the field.</p>
    `;
  } else if (type === 'zip') {
    html = `
      <h3>📦 ZIP File Structure</h3>
      <p>Ensure your <code>project.zip</code> has this format:</p>
      <pre style="background:#f9f9f9;padding:15px;border-radius:8px;overflow:auto;">
project.zip
├── server.js
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── script.js
      </pre>
      <p><strong>Why is <code>package.json</code> required?</strong></p>
      <p>
        The <code>package.json</code> file defines your app’s dependencies and scripts.<br/>
        Make sure it includes a <code>"start"</code> script like this:
      </p>
      <pre style="background:#f4f4f4;padding:10px;border-left:4px solid #007acc;">
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
      </pre>
    `;
  } else if (type === 'about') {
    html = `
      <h3>👤 About Us</h3>
      <p>Mi-Stack was created by <strong>Missari</strong>, a passionate developer aiming to make Node.js hosting simple and accessible.</p>
      <p>Our mission is to empower developers to deploy apps in seconds — no hassle, no servers.</p>
      <p>
        <a href="https://www.linkedin.com/in/missari/" target="_blank" style="
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          margin-top: 5px;
          gap: 8px;
          font-weight: bold;
          letter-spacing: 0.8px;
          color: #0A66C2;
          transition: all 0.3s ease;
        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="22" height="22" style="vertical-align: middle;" />
          LinkedIn For 🧑🏻‍🚀🚀
        </a>
      </p>
    `;
  }

  modal.innerHTML = html;
  modalBg.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 50);
}

modalBg.addEventListener('click', e => {
  if (!modal.contains(e.target)) {
    modal.classList.remove('show');
    setTimeout(() => modalBg.style.display = 'none', 200);
  }
});
