// Diálogo reutilizable (globo abajo-centro con nombre del que habla + texto +
// botones de opción que se clickean). Lo usan el loro Juancho y, más adelante,
// Rosa, Gian, Lulu y demás NPC. No maneja el pointer-lock: eso lo coordina quien
// lo abre (ver game/CaboRoca.js con el `ui` controller de Game).

export class Dialogue {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', bottom: '40px', transform: 'translateX(-50%)',
      width: 'min(560px, 92vw)', padding: '16px 18px 18px',
      background: 'rgba(24,20,14,0.92)', color: '#f7eccf',
      border: '2px solid #caa76a', borderRadius: '14px',
      boxShadow: '0 14px 34px rgba(0,0,0,0.5)',
      font: '16px/1.5 "Segoe UI", system-ui, sans-serif',
      zIndex: '40', display: 'none',
    });

    this.speaker = document.createElement('div');
    Object.assign(this.speaker.style, {
      display: 'inline-block', marginBottom: '8px', padding: '2px 10px',
      background: '#2f8f4f', color: '#fff', borderRadius: '8px',
      fontWeight: '700', fontSize: '13px', letterSpacing: '.3px',
    });
    this.text = document.createElement('div');
    this.text.style.marginBottom = '12px';
    this.options = document.createElement('div');
    Object.assign(this.options.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

    this.el.append(this.speaker, this.text, this.options);
    container.appendChild(this.el);
  }

  // options: [{ label, onClick }]. Si se omite, muestra un botón "Continuar".
  show(speaker, html, options) {
    this.speaker.textContent = speaker;
    this.text.innerHTML = html;
    this.options.innerHTML = '';
    const opts = options && options.length ? options : [{ label: 'Continuar ▸', onClick: () => {} }];
    for (const o of opts) {
      const b = document.createElement('button');
      b.textContent = o.label;
      Object.assign(b.style, {
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '10px 14px', borderRadius: '10px',
        background: '#f2e6c8', color: '#3a2c14', border: '1px solid #caa76a',
        font: 'inherit', fontWeight: '600',
      });
      b.onmouseenter = () => { b.style.background = '#ffe9b0'; };
      b.onmouseleave = () => { b.style.background = '#f2e6c8'; };
      b.onclick = () => o.onClick();
      this.options.appendChild(b);
    }
    this.el.style.display = 'block';
    this.visible = true;
  }

  hide() {
    this.el.style.display = 'none';
    this.visible = false;
  }
}
