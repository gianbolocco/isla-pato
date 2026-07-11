// Cartelito de interacción ("Apretá E para…") abajo-centro. Aparece cuando Belu
// está cerca de algo interactuable (loro, reja, etc.).
export class Prompt {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', bottom: '120px', transform: 'translateX(-50%)',
      padding: '8px 16px', borderRadius: '20px',
      background: 'rgba(20,16,10,0.7)', color: '#f7eccf',
      border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      font: '14px "Segoe UI", system-ui, sans-serif',
      pointerEvents: 'none', zIndex: '30', display: 'none',
    });
    container.appendChild(this.el);
  }

  show(html) { this.el.innerHTML = html; this.el.style.display = 'block'; }
  hide() { if (this.el.style.display !== 'none') this.el.style.display = 'none'; }
}
