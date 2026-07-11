// Nota estilo PAPEL (carta desplegada) para el mensaje de la botella y, más adelante,
// las notas de rescate y diálogos. Renglones, sello de cera y leve inclinación.
// No bloquea el juego: aparece al acercarse y se va al alejarse.

export class MessageBox {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', bottom: '80px',
      transform: 'translateX(-50%) translateY(24px) rotate(-1.2deg)',
      width: 'min(460px, 86vw)', padding: '24px 28px 26px',
      background: '#f6efd8',
      backgroundImage: 'repeating-linear-gradient(#f6efd8, #f6efd8 24px, #e4dcc0 25px)',
      color: '#4a3a1e',
      border: '1px solid #d8cba0', borderRadius: '4px',
      boxShadow: '0 14px 34px rgba(0,0,0,0.4), inset 0 0 44px rgba(180,150,90,0.15)',
      font: '16px/1.6 Georgia, "Times New Roman", serif', textAlign: 'left',
      pointerEvents: 'none', opacity: '0',
      transition: 'opacity .35s ease, transform .35s ease',
      zIndex: '25', display: 'none',
    });

    // Sello de cera (patito 🦆).
    const seal = document.createElement('div');
    Object.assign(seal.style, {
      position: 'absolute', top: '-15px', right: '24px', width: '36px', height: '36px',
      borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #d85a4e, #a5342b)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
    });
    seal.textContent = '🦆';
    this.el.appendChild(seal);

    this.content = document.createElement('div');
    this.el.appendChild(this.content);
    container.appendChild(this.el);
    this.visible = false;
  }

  show(title, html) {
    if (this.visible) return;
    this.content.innerHTML =
      `<div style="font-weight:700;font-size:20px;font-style:italic;margin-bottom:10px">${title}</div>` +
      `<div>${html}</div>`;
    this.el.style.display = 'block';
    void this.el.offsetWidth;                 // fuerza reflow para la transición
    this.el.style.opacity = '1';
    this.el.style.transform = 'translateX(-50%) translateY(0) rotate(-1.2deg)';
    this.visible = true;
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateX(-50%) translateY(24px) rotate(-1.2deg)';
    setTimeout(() => { if (!this.visible) this.el.style.display = 'none'; }, 350);
  }
}
