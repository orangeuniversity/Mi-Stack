(() => {
  document.body.innerHTML = '';

  // Rocket icon link
  const rocketLink = document.createElement('a');
  rocketLink.href = window.indexUrl || '#';
  rocketLink.id = 'rocket-home';
  rocketLink.title = 'Go to Home';
  rocketLink.innerHTML = `<img src="https://img.icons8.com/?size=100&id=VxghLA7bZMVU&format=png&color=000000" alt="Rocket Icon" />`;
  document.body.appendChild(rocketLink);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  // Container
  const glassContainer = document.createElement('div');
  glassContainer.className = 'glass-container';

  // Instruction box
  const instructionBox = document.createElement('div');
  instructionBox.className = 'instruction-box';
  instructionBox.style.display = 'none';
  glassContainer.appendChild(instructionBox);

  // Heading
  const heading = document.createElement('h2');
  heading.textContent = 'Create Mi-Stack Account';
  glassContainer.appendChild(heading);

  // Form
  const form = document.createElement('form');
  form.method = 'POST';

  // Helper to create input with wrapper and toggle button
  function createInputWithToggle({ name, placeholder, type = 'password' }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.name = name;
    input.placeholder = placeholder;
    input.required = true;
    input.type = type;
    input.autocomplete = type === 'password' ? 'new-password' : (name === 'email' ? 'email' : 'off');
    wrapper.appendChild(input);

    if (type === 'password') {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'password-toggle';
      toggleBtn.setAttribute('aria-label', 'Show password');
      toggleBtn.textContent = '👁️';
      wrapper.appendChild(toggleBtn);

      toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          toggleBtn.textContent = '👁️‍🗨️';
          toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          toggleBtn.textContent = '👁️';
          toggleBtn.setAttribute('aria-label', 'Show password');
        }
      });
    }
    return { wrapper, input };
  }

  // Username input (text)
  const usernameInput = document.createElement('input');
  usernameInput.name = 'username';
  usernameInput.placeholder = 'Username';
  usernameInput.required = true;
  usernameInput.type = 'text';
  usernameInput.autocomplete = 'username';
  form.appendChild(usernameInput);

  // Email input (no toggle)
  const emailInput = document.createElement('input');
  emailInput.name = 'email';
  emailInput.placeholder = 'Email';
  emailInput.required = true;
  emailInput.type = 'email';
  emailInput.autocomplete = 'email';
  form.appendChild(emailInput);

  // Password input with toggle
  const { wrapper: pwdWrapper, input: inputPassword } = createInputWithToggle({
    name: 'password',
    placeholder: 'Password',
    type: 'password'
  });
  form.appendChild(pwdWrapper);

  // Password strength meter
  const strengthMeter = document.createElement('div');
  strengthMeter.className = 'password-strength';
  const strengthBar = document.createElement('div');
  strengthBar.className = 'password-strength-bar';
  strengthMeter.appendChild(strengthBar);
  form.appendChild(strengthMeter);

  // Confirm password input with toggle
  const { wrapper: confirmWrapper, input: inputConfirm } = createInputWithToggle({
    name: 'confirm_password',
    placeholder: 'Confirm Password',
    type: 'password'
  });
  form.appendChild(confirmWrapper);

  // Submit button
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Register';
  button.disabled = true;
  form.appendChild(button);

  glassContainer.appendChild(form);

  // Login link
  const loginLink = document.createElement('a');
  loginLink.href = window.loginUrl || '#';
  loginLink.textContent = 'Already have an account? Log in';
  glassContainer.appendChild(loginLink);

  document.body.appendChild(overlay);
  document.body.appendChild(glassContainer);

  // Password strength evaluation
  function evaluatePasswordStrength(pwd) {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  function updateStrengthBar(score) {
    const widthPercent = (score / 5) * 100;
    strengthBar.style.width = widthPercent + '%';
    if (score <= 2) {
      strengthBar.style.backgroundColor = 'red';
    } else if (score === 3) {
      strengthBar.style.backgroundColor = 'orange';
    } else {
      strengthBar.style.backgroundColor = 'limegreen';
    }
  }

  // Show/hide instruction
  function showInstruction(msg, type = 'error') {
    instructionBox.textContent = msg;
    instructionBox.className = 'instruction-box ' + (type === 'error' ? 'error' : 'success');
    instructionBox.style.display = 'block';
  }
  function hideInstruction() {
    instructionBox.style.display = 'none';
  }

  // Validate form state
  function validateForm() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const pwd = inputPassword.value;
    const confirmPwd = inputConfirm.value;
    const pwdStrength = evaluatePasswordStrength(pwd);
    updateStrengthBar(pwdStrength);
    const passwordsMatch = pwd === confirmPwd;

    if (
      username &&
      email &&
      pwdStrength >= 4 &&
      passwordsMatch &&
      emailInput.checkValidity()
    ) {
      button.disabled = false;
      hideInstruction();
    } else {
      button.disabled = true;
      if (!passwordsMatch && confirmPwd.length > 0) {
        showInstruction('Passwords do not match.', 'error');
      } else if (pwdStrength < 4 && pwd.length > 0) {
        showInstruction('Password is too weak. Use 8+ chars, mix of uppercase, lowercase, numbers, and symbols.', 'error');
      } else {
        hideInstruction();
      }
    }
  }

  emailInput.addEventListener('input', validateForm);
  inputPassword.addEventListener('input', validateForm);
  inputConfirm.addEventListener('input', validateForm);
  usernameInput.addEventListener('input', validateForm);

  // Handle form submit with AJAX
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (button.disabled) return;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = inputPassword.value;
    const confirm_password = inputConfirm.value;

    try {
      const response = await fetch(window.registerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({
          username,
          email,
          password,
          confirm_password
        }),
      });

      const text = await response.text();

      if (response.ok) {
        showInstruction('✅ Account created successfully! Redirecting to login...', 'success');
        button.disabled = true;
        setTimeout(() => {
          window.location.href = window.loginUrl || '/login';
        }, 2000);
      } else {
        let errorMsg = 'Registration failed.';
        if (text.includes('Email already registered')) {
          errorMsg = 'This account already exists. Please login or use a different email.';
        } else if (text.includes('Password is too weak')) {
          errorMsg = 'Password is too weak.';
        } else {
          errorMsg = text;
        }
        showInstruction(errorMsg, 'error');
      }
    } catch (err) {
      showInstruction('Server error. Please try again later.', 'error');
    }
  });
})();

