// Small toast helper used across pages
function showToast(message, type = 'info', timeout = 3500) {
  // create container if missing
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  // auto dismiss
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 400);
  }, timeout);
  // click to remove early
  toast.addEventListener('click', () => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  });
  return toast;
}

// small convenience wrappers
function showSuccess(msg, t = 2500) { return showToast(msg, 'success', t); }
function showError(msg, t = 4000) { return showToast(msg, 'danger', t); }
function showInfo(msg, t = 3000) { return showToast(msg, 'info', t); }
