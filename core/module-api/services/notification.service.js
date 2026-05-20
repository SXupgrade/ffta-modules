const TOAST_DURATION_MS = 4000;

function showToast(message, type) {
  if (typeof document === 'undefined') return;

  let container = document.querySelector('.ffta-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'ffta-toast-container';
    (document.querySelector('.ffta-modules-shell') || document.body).appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `ffta-toast ffta-toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (container.children.length === 0) container.remove();
  }, TOAST_DURATION_MS);
}

export function createNotificationService(adapter = null) {
  return {
    success(message) {
      adapter?.success?.(message);
      showToast(message, 'success');
    },
    error(message) {
      adapter?.error?.(message);
      showToast(message, 'error');
      console.error('[ffta]', message);
    },
    info(message) {
      adapter?.info?.(message);
      showToast(message, 'info');
    }
  };
}
