(() => {
  document.body.innerHTML = '';

  // Rocket icon link
  const rocketLink = document.createElement('a');
  rocketLink.href = window.indexUrl || '#';
  rocketLink.id = 'rocket-home';
  rocketLink.title = 'Go to Home';
  rocketLink.innerHTML = `<img src="https://img.icons8.com/?size=100&id=VxghLA7bZMVU&format=png&color=000000" alt="Rocket Icon" />`;
  document.body.appendChild(rocketLink);

  // Overlay
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

  // Username
  const usernameInput = document.createElement('input');
  usernameInput.name = 'username';
  usernameInput.placeholder = 'Username';
  usernameInput.required = true;
  usernameInput.type = 'text';
  usernameInput.autocomplete = 'username';
  form.appendChild(usernameInput);

  // Email
  const emailInput = document.createElement('input');
  emailInput.name = 'email';
  emailInput.placeholder = 'Email';
  emailInput.required = true;
  emailInput.type = 'email';
  emailInput.autocomplete = 'email';
  form.appendChild(emailInput);

  // Password
  function createInputWithToggle({ name, placeholder, type = 'password' }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.name = name;
    input.placeholder = placeholder;
    input.required = true;
    input.type = type;
    input.autocomplete = type === 'password' ? 'new-password' : 'off';
    wrapper.appendChild(input);

    if (type === 'password') {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'password-toggle';
      toggleBtn.textContent = '👁️';
      wrapper.appendChild(toggleBtn);

      toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          toggleBtn.textContent = '👁️‍🗨️';
        } else {
          input.type = 'password';
          toggleBtn.textContent = '👁️';
        }
      });
    }
    return { wrapper, input };
  }

  const { wrapper: pwdWrapper, input: inputPassword } = createInputWithToggle({
    name: 'password',
    placeholder: 'Password'
  });
  form.appendChild(pwdWrapper);

  // Password strength meter
  const strengthMeter = document.createElement('div');
  strengthMeter.className = 'password-strength';
  const strengthBar = document.createElement('div');
  strengthBar.className = 'password-strength-bar';
  strengthMeter.appendChild(strengthBar);
  form.appendChild(strengthMeter);

  const { wrapper: confirmWrapper, input: inputConfirm } = createInputWithToggle({
    name: 'confirm_password',
    placeholder: 'Confirm Password'
  });
  form.appendChild(confirmWrapper);

// Send OTP button (placed between confirm password and register button)
const toggleButton = document.createElement('button');
toggleButton.type = 'button';
toggleButton.textContent = 'Send OTP';
toggleButton.classList.add('otp-button');
form.appendChild(toggleButton);




  // Register button
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Register';
  button.disabled = true;
  form.appendChild(button);

  glassContainer.appendChild(form);

  // OTP form
  const integerForm = document.createElement('form');
  integerForm.style.display = 'none';
  integerForm.className = 'integer-form';

  const intInput = document.createElement('input');
  intInput.type = 'text';
  intInput.name = 'otp';
  intInput.placeholder = 'Enter OTP';
  intInput.required = true;
  integerForm.appendChild(intInput);

  const resendContainer = document.createElement('div');
  resendContainer.className = 'resend-container';
  integerForm.appendChild(resendContainer);

  const intSubmit = document.createElement('button');
  intSubmit.type = 'submit';
  intSubmit.textContent = 'Submit';
  integerForm.appendChild(intSubmit);

  glassContainer.appendChild(integerForm);

  // Login link
  const loginLink = document.createElement('a');
  loginLink.href = window.loginUrl || '#';
  loginLink.textContent = 'Already have an account? Log in';
  glassContainer.appendChild(loginLink);

  document.body.appendChild(overlay);
  document.body.appendChild(glassContainer);

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
    strengthBar.style.width = `${(score / 5) * 100}%`;
    if (score <= 2) strengthBar.style.backgroundColor = 'red';
    else if (score === 3) strengthBar.style.backgroundColor = 'orange';
    else strengthBar.style.backgroundColor = 'limegreen';
  }

  function showInstruction(msg, type = 'error') {
    instructionBox.textContent = msg;
    instructionBox.className = 'instruction-box ' + (type === 'error' ? 'error' : 'success');
    instructionBox.style.display = 'block';
  }

  function hideInstruction() {
    instructionBox.style.display = 'none';
  }

  function validateForm() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const pwd = inputPassword.value;
    const confirmPwd = inputConfirm.value;
    const pwdStrength = evaluatePasswordStrength(pwd);
    updateStrengthBar(pwdStrength);

    const passwordsMatch = pwd === confirmPwd;
    const otpVerifiedInput = form.querySelector('input[name="otp_verified"]');
    const otpVerified = otpVerifiedInput && otpVerifiedInput.value === 'true';

    if (otpVerified && username && email && pwdStrength >= 4 && passwordsMatch && emailInput.checkValidity()) {
      button.disabled = false;
      hideInstruction();
    } else {
      button.disabled = true;
      if (!passwordsMatch && confirmPwd.length > 0) {
        showInstruction('Passwords do not match.', 'error');
      } else if (pwdStrength < 4 && pwd.length > 0) {
        showInstruction('Password is too weak.', 'error');
      } else if (!otpVerified) {
        showInstruction('Please verify OTP sent to your email.', 'error');
      } else {
        hideInstruction();
      }
    }
  }

  emailInput.addEventListener('input', () => {
    const otpVerifiedInput = form.querySelector('input[name="otp_verified"]');
    if (otpVerifiedInput) otpVerifiedInput.value = 'false';
    validateForm();
  });
  inputPassword.addEventListener('input', validateForm);
  inputConfirm.addEventListener('input', validateForm);
  usernameInput.addEventListener('input', validateForm);

  let otpCooldown = false;
  function startOtpCooldown() {
    otpCooldown = true;
    let cooldownTime = 600;
    resendContainer.textContent = `Resend OTP in ${cooldownTime}s`;

    const interval = setInterval(() => {
      cooldownTime--;
      resendContainer.textContent = `Resend OTP in ${cooldownTime}s`;
      if (cooldownTime <= 0) {
        clearInterval(interval);
        resendContainer.textContent = '';
        toggleButton.textContent = 'Send OTP';
        toggleButton.disabled = false;
        otpCooldown = false;
      }
    }, 1000);
  }

  toggleButton.addEventListener('click', async () => {
    if (otpCooldown) return;

    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
      showInstruction('Please enter your email before requesting OTP.', 'error');
      return;
    }

    toggleButton.disabled = true;
    toggleButton.textContent = 'Sending OTP...';

    try {
      const response = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email })
      });
      const result = await response.json();

      if (response.ok) {
        showInstruction('OTP sent to your email.', 'success');
        startOtpCooldown();
        form.style.display = 'none';
        integerForm.style.display = 'flex';
        intInput.value = '';
      } else {
        showInstruction(result.error || 'Failed to send OTP.', 'error');
        toggleButton.textContent = 'Send OTP';
        toggleButton.disabled = false;
      }
    } catch {
      showInstruction('Server error sending OTP.', 'error');
      toggleButton.textContent = 'Send OTP';
      toggleButton.disabled = false;
    }
  });

  integerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const otp = intInput.value.trim();
    if (!otp) {
      showInstruction('Please enter the OTP.', 'error');
      return;
    }

    intSubmit.disabled = true;
    intSubmit.textContent = 'Verifying...';

    try {
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, otp })
      });
      const result = await response.json();

      if (response.ok) {
        showInstruction('OTP is correct!', 'success');

        setTimeout(() => {
          form.style.display = 'flex';
          integerForm.style.display = 'none';

          let otpVerifiedInput = form.querySelector('input[name="otp_verified"]');
          if (!otpVerifiedInput) {
            otpVerifiedInput = document.createElement('input');
            otpVerifiedInput.type = 'hidden';
            otpVerifiedInput.name = 'otp_verified';
            otpVerifiedInput.value = 'true';
            form.appendChild(otpVerifiedInput);
          } else {
            otpVerifiedInput.value = 'true';
          }

          toggleButton.style.display = 'none';
          validateForm();
        }, 1000);
      } else {
        showInstruction(result.error || 'Invalid OTP.', 'error');
      }
    } catch {
      showInstruction('Server error verifying OTP.', 'error');
    }

    intSubmit.disabled = false;
    intSubmit.textContent = 'Submit';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button.disabled) return;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = inputPassword.value;
    const confirm_password = inputConfirm.value;
    const otpVerifiedInput = form.querySelector('input[name="otp_verified"]');
    const otp_verified = otpVerifiedInput ? otpVerifiedInput.value : 'false';

    try {
      const response = await fetch(window.registerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
          username,
          email,
          password,
          confirm_password,
          otp_verified
        })
      });

      const text = await response.text();
      if (response.ok) {
        showInstruction('✅ Account created successfully! Redirecting to login...', 'success');
        button.disabled = true;
        setTimeout(() => {
          window.location.href = window.loginUrl || '/login';
        }, 2000);
      } else {
        showInstruction(text || 'Registration failed.', 'error');
      }
    } catch {
      showInstruction('Server error. Please try again.', 'error');
    }
  });
})();
