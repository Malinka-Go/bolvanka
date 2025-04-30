// Telegram init
const tg = window.Telegram.WebApp;
tg.ready();
const user = tg.initDataUnsafe?.user;
document.getElementById("username").textContent = user?.username
  ? `@${user.username}`
  : "User";