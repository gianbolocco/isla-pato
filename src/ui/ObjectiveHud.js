// HUD del objetivo actual (arriba-centro). Lo maneja la máquina de historia (Story):
// muestra qué tiene que hacer Belu en cada checkpoint.

export class ObjectiveHud {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
      padding: '8px 18px', borderRadius: '12px',
      background: 'rgba(20,16,10,0.55)', color: '#f7eccf',
      border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      font: '15px "Segoe UI", system-ui, sans-serif', textAlign: 'center',
      pointerEvents: 'none', zIndex: '20', backdropFilter: 'blur(3px)',
      maxWidth: '80vw',
    });
    container.appendChild(this.el);
  }

  set(html) { this.el.innerHTML = html; }
}
