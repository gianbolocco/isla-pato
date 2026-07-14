// Teclado numérico para poner la clave de la reja. `open({title, onSubmit, onCancel})`.
// onSubmit(valor) debe devolver true si la clave es correcta (ahí se cierra); si es
// falsa, sacude y limpia. No maneja pointer-lock: lo coordina quien lo abre.

import { audio } from '../core/audio.js';

export class Keypad {
  constructor(container) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      width: '260px', padding: '18px', borderRadius: '16px',
      background: 'rgba(24,20,14,0.95)', color: '#f7eccf',
      border: '2px solid #caa76a', boxShadow: '0 18px 44px rgba(0,0,0,0.55)',
      font: '16px "Segoe UI", system-ui, sans-serif', zIndex: '45', display: 'none',
    });

    this.title = document.createElement('div');
    Object.assign(this.title.style, { textAlign: 'center', marginBottom: '10px', fontWeight: '700' });

    this.display = document.createElement('div');
    Object.assign(this.display.style, {
      height: '44px', margin: '0 0 12px', borderRadius: '8px',
      background: '#0d0b07', color: '#8fe36a', border: '1px solid #5a4a2a',
      font: '26px/44px "Consolas", monospace', letterSpacing: '6px', textAlign: 'center',
    });

    this.grid = document.createElement('div');
    Object.assign(this.grid.style, { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' });

    const mkBtn = (label, onClick, accent) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        padding: '12px 0', borderRadius: '10px', cursor: 'pointer',
        background: accent || '#f2e6c8', color: '#3a2c14', border: '1px solid #caa76a',
        font: '18px inherit', fontWeight: '700',
      });
      b.onclick = onClick;
      return b;
    };
    for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      this.grid.appendChild(mkBtn(n, () => this._press(n)));
    }
    this.grid.appendChild(mkBtn('C', () => this._clear(), '#e6b0a8'));
    this.grid.appendChild(mkBtn('0', () => this._press('0')));
    this.grid.appendChild(mkBtn('OK', () => this._enter(), '#a8d99a'));

    const cancel = document.createElement('button');
    cancel.textContent = 'Cancelar';
    Object.assign(cancel.style, {
      marginTop: '12px', width: '100%', padding: '8px', borderRadius: '10px', cursor: 'pointer',
      background: 'transparent', color: '#f7eccf', border: '1px solid #6b5636', font: 'inherit',
    });
    cancel.onclick = () => { this.hide(); if (this._onCancel) this._onCancel(); };

    this.el.append(this.title, this.display, this.grid, cancel);
    container.appendChild(this.el);
    this._value = '';
  }

  open({ title, onSubmit, onCancel }) {
    this.title.textContent = title || 'Ingresá la clave';
    this._onSubmit = onSubmit;
    this._onCancel = onCancel;
    this._value = '';
    this._refresh();
    this.el.style.display = 'block';
    this.visible = true;
  }

  hide() { this.el.style.display = 'none'; this.visible = false; }

  _refresh() { this.display.textContent = this._value || '—'; }

  _press(d) { if (this._value.length < 8) { this._value += d; this._refresh(); audio.keypadPress(); } }
  _clear() { this._value = ''; this._refresh(); }

  _enter() {
    if (this._onSubmit && this._onSubmit(this._value)) {
      audio.keypadOk();
      this.hide();
    } else {
      audio.keypadFail();
      // Clave incorrecta: parpadeo rojo + limpiar.
      this.display.style.color = '#ff6a6a';
      this.display.textContent = '✖ ✖ ✖ ✖';
      setTimeout(() => { this.display.style.color = '#8fe36a'; this._clear(); }, 550);
    }
  }
}
