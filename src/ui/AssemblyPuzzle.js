// Puzzle de armado del barco (Cala del Naufragio, isla 5): panel central con las piezas
// juntadas (botones barajados) y una fila de ranuras 1..N. Hay que elegir las piezas en el
// ORDEN correcto (de abajo hacia arriba); cada acierto llena una ranura y dispara
// `onPlace(order)` (que instala la pieza en el barco 3D). Al completar, `onComplete()`.
// No maneja el pointer-lock: lo coordina quien lo abre (game/ShipwreckIsland con el `ui`).

export class AssemblyPuzzle {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      width: 'min(560px, 94vw)', padding: '18px 20px 20px', borderRadius: '16px',
      background: 'rgba(24,20,14,0.95)', color: '#f7eccf',
      border: '2px solid #caa76a', boxShadow: '0 18px 44px rgba(0,0,0,0.55)',
      font: '16px "Segoe UI", system-ui, sans-serif', zIndex: '46', display: 'none',
    });

    this.title = document.createElement('div');
    Object.assign(this.title.style, { textAlign: 'center', fontWeight: '700', fontSize: '19px', marginBottom: '8px' });

    this.intro = document.createElement('div');
    Object.assign(this.intro.style, { fontSize: '14px', lineHeight: '1.5', marginBottom: '12px', opacity: '0.95' });

    this.slots = document.createElement('div');
    Object.assign(this.slots.style, { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' });

    this.grid = document.createElement('div');
    Object.assign(this.grid.style, { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' });

    this.feedback = document.createElement('div');
    Object.assign(this.feedback.style, { minHeight: '20px', textAlign: 'center', marginTop: '12px', fontWeight: '600' });

    // Salir sin terminar (por si el jugador quiere volver a mirar la isla).
    this.cancel = document.createElement('button');
    this.cancel.textContent = 'Salir ✕';
    Object.assign(this.cancel.style, {
      display: 'block', margin: '10px auto 0', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer',
      background: 'transparent', color: '#f7eccf', border: '1px solid #6b5636', font: 'inherit',
    });
    this.cancel.onclick = () => { this.hide(); if (this.onCancel) this.onCancel(); };

    this.el.append(this.title, this.intro, this.slots, this.grid, this.feedback, this.cancel);
    container.appendChild(this.el);
  }

  // { parts:[{name,order}], texts:{titulo,intro,correcto,incorrecto,completo}, onPlace, onComplete, onCancel }
  open({ parts, texts, onPlace, onComplete, onCancel }) {
    this.texts = texts;
    this.onPlace = onPlace;
    this.onComplete = onComplete;
    this.onCancel = onCancel;
    this.total = parts.length;
    this.next = 1;

    this.title.innerHTML = texts.titulo;
    this.intro.innerHTML = texts.intro;
    this.feedback.textContent = '';
    this.feedback.style.color = '#f7eccf';

    // Ranuras vacías (1..N).
    this.slots.innerHTML = '';
    this.slotEls = [];
    for (let i = 1; i <= this.total; i++) {
      const s = document.createElement('div');
      Object.assign(s.style, {
        minWidth: '58px', height: '30px', lineHeight: '30px', padding: '0 8px',
        textAlign: 'center', borderRadius: '8px', fontSize: '12px',
        background: '#0d0b07', color: '#6b5636', border: '1px dashed #5a4a2a',
      });
      s.textContent = i;
      this.slots.appendChild(s);
      this.slotEls.push(s);
    }

    // Botones de piezas, barajados.
    this.grid.innerHTML = '';
    const shuffled = parts.slice().sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      const b = document.createElement('button');
      b.textContent = p.name;
      Object.assign(b.style, {
        padding: '11px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
        background: '#f2e6c8', color: '#3a2c14', border: '1px solid #caa76a',
        font: 'inherit', fontWeight: '600',
      });
      b.onmouseenter = () => { if (!b.disabled) b.style.background = '#ffe9b0'; };
      b.onmouseleave = () => { if (!b.disabled) b.style.background = '#f2e6c8'; };
      b.onclick = () => this._pick(p, b);
      this.grid.appendChild(b);
    }

    this.el.style.display = 'block';
    this.visible = true;
  }

  _pick(part, btn) {
    if (part.order === this.next) {
      // Acierto: llena la ranura, deshabilita el botón, instala la pieza en el barco.
      const slot = this.slotEls[this.next - 1];
      slot.textContent = part.name;
      Object.assign(slot.style, { color: '#3a2c14', background: '#a8d99a', border: '1px solid #7bbf6a' });
      btn.disabled = true;
      Object.assign(btn.style, { background: '#cbb98f', color: '#7a6a48', cursor: 'default', opacity: '0.6' });
      this.feedback.style.color = '#a8d99a';
      this.feedback.textContent = this.texts.correcto;
      if (this.onPlace) this.onPlace(part.order);
      this.next++;
      if (this.next > this.total) {
        this.feedback.style.color = '#ffe9a8';
        this.feedback.innerHTML = this.texts.completo;
        setTimeout(() => { this.hide(); if (this.onComplete) this.onComplete(); }, 1400);
      }
    } else {
      // Error: sacudida + pista.
      this.feedback.style.color = '#ff8a7a';
      this.feedback.textContent = this.texts.incorrecto;
      this._shake();
    }
  }

  _shake() {
    const base = 'translate(-50%,-50%)';
    let n = 0;
    const id = setInterval(() => {
      const dx = (n % 2 ? -1 : 1) * 8;
      this.el.style.transform = `translate(calc(-50% + ${dx}px),-50%)`;
      if (++n > 5) { clearInterval(id); this.el.style.transform = base; }
    }, 40);
  }

  hide() { this.el.style.display = 'none'; this.visible = false; }
}
