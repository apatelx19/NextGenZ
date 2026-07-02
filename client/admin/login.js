document.addEventListener('DOMContentLoaded', () => {
  // JWT is now HTTP-only cookie.
  // Note: if user is already logged in, they can still view login page, or we could verify via API.

  const form = document.getElementById('loginForm');
  const errorMsg = document.getElementById('error-message');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('span');
  const loader = loginBtn.querySelector('.loader');

  // Toggle Password Visibility
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorMsg.classList.add('hidden');
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    loginBtn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/admin/dashboard.html';
      } else {
        if (data.errors && data.errors.length > 0) {
          showError(data.errors[0].msg);
        } else {
          showError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      showError('Network error. Please try again later.');
    } finally {
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
      loginBtn.disabled = false;
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }
});
