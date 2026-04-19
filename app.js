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

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    redirectToRobloxLogin();
  });
});