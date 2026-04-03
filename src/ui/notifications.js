// ═══ NOTIFICATIONS ═══

const container = document.getElementById('notifications');

export function notify(message, type = '') {
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = message;
  container.appendChild(el);
  
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.5s';
    setTimeout(() => el.remove(), 500);
  }, 2500);
}
