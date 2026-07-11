// Panel de mensaje/nota estilo pergamino (abajo-centro). Reusable para el mensaje
// de la botella y, más adelante, las notas de rescate y los diálogos.
// No bloquea el juego: aparece al acercarse y se va al alejarse.

export class MessageBox {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '90px',
      transform: 'translateX(-50%) translateY(24px)',
      maxWidth: 'min(560px, 88vw)',
      padding: '18px 22px',
      background: 'linear-gradient(180deg, #f7eccf 0%, #ecd9a8 100%)',
      color: '#4b3a1e',
      border: '2px solid #caa76a',
      borderRadius: '14px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      font: '16px/1.5 "Segoe UI", system-ui, sans-serif',
      textAlign: 'center',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity .3s ease, transform .3s ease',
      zIndex: '20',
      display: 'none',
    });
    container.appendChild(this.el);
    this.visible = false;
  }

  show(title, html) {
    if (this.visible) return;
    this.el.innerHTML =
      `<div style="font-weight:700;font-size:15px;letter-spacing:.3px;margin-bottom:8px;color:#6b4f22">${title}</div>` +
      `<div>${html}</div>`;
    this.el.style.display = 'block';
    // fuerza reflow para que corra la transición
    void this.el.offsetWidth;
    this.el.style.opacity = '1';
    this.el.style.transform = 'translateX(-50%) translateY(0)';
    this.visible = true;
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateX(-50%) translateY(24px)';
    setTimeout(() => { if (!this.visible) this.el.style.display = 'none'; }, 300);
  }
}
