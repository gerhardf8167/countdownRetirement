if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    const status = document.querySelector('#status');
    if (status && !status.textContent) status.textContent = 'Offline-Modus nicht verfuegbar. Bitte ueber HTTPS oder localhost oeffnen.';
  });
}

let installPrompt;
const installButton = document.querySelector('[data-install]');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});