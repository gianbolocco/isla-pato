// Menú de inicio + intro narrada (contexto de la historia). Se muestra UNA vez al
// arrancar, por encima del juego (que ya renderiza de fondo). Al terminar llama a
// onDone(), que debe capturar el mouse y empezar a jugar (gesto del usuario = el click
// del último botón). Todo autocontenido con estilos inline (como el resto de la UI).
//
// Los textos de la intro están en textos.js → intro (editables ahí).
import { TEXTOS } from '../textos.js';

const STORY = TEXTOS.intro;

function el(tag, style = {}, html) {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
}

function button(label) {
  const b = el('button', {
    marginTop: '22px', padding: '14px 30px', border: 'none', borderRadius: '999px',
    background: 'linear-gradient(180deg, #ff7a5c, #e0554e)', color: '#fff',
    font: '700 18px system-ui, sans-serif', letterSpacing: '.3px', cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(224,85,78,.45)', transition: 'transform .15s ease, box-shadow .15s ease',
  }, label);
  b.onmouseenter = () => { b.style.transform = 'translateY(-2px)'; b.style.boxShadow = '0 14px 30px rgba(224,85,78,.55)'; };
  b.onmouseleave = () => { b.style.transform = 'none'; b.style.boxShadow = '0 10px 24px rgba(224,85,78,.45)'; };
  return b;
}

export class StartScreen {
  constructor(container, onDone) {
    this.onDone = onDone;
    this.i = 0;

    this.root = el('div', {
      position: 'fixed', inset: '0', zIndex: '200',
      display: 'grid', placeItems: 'center', padding: '24px',
      background: 'radial-gradient(120% 110% at 50% 0%, #7ec5f0 0%, #a9d6cf 45%, #f0e2b8 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      opacity: '0', transition: 'opacity .4s ease',
    });

    this.menu = this._buildMenu();
    this.story = this._buildStory();
    this.root.append(this.menu, this.story);
    this._show('menu');

    container.appendChild(this.root);
    requestAnimationFrame(() => { this.root.style.opacity = '1'; });
  }

  _buildMenu() {
    const wrap = el('div', { textAlign: 'center', maxWidth: '640px' });
    wrap.append(
      el('div', { fontSize: '54px', marginBottom: '4px' }, '🏝️🦆'),
      el('h1', {
        margin: '0', color: '#0e4a63', fontSize: 'clamp(30px, 6vw, 56px)', fontWeight: '800',
        letterSpacing: '.5px', textShadow: '0 2px 0 #ffffff80',
      }, 'Vacaciones en Isla Pato'),
      el('p', { margin: '10px 0 0', color: '#1d5a4a', fontSize: 'clamp(16px, 2.4vw, 22px)', fontWeight: '600' },
        'Belu al Rescate'),
      el('p', { margin: '18px auto 0', maxWidth: '440px', color: '#3a4a3f', opacity: '.85', lineHeight: '1.5' },
        'Una aventura para encontrar a Gian —"el pato"— perdido en el archipiélago.'),
    );

    const play = button('▶  Comenzar');
    play.onclick = () => this._show('story');
    wrap.append(play);

    wrap.append(el('p', {
      marginTop: '26px', color: '#3a4a3f', opacity: '.7', fontSize: '13px', lineHeight: '1.7',
    },
      '<b>WASD</b> moverse · <b>Espacio</b> saltar · <b>Shift</b> correr · <b>Mouse</b> mirar · <b>E</b> interactuar' +
      '<br><span style="opacity:.8">un regalo para Belu 💛</span>'));
    return wrap;
  }

  _buildStory() {
    const wrap = el('div', { display: 'none', width: 'min(560px, 92vw)', textAlign: 'center' });

    this.card = el('div', {
      background: '#f6efd8',
      backgroundImage: 'repeating-linear-gradient(#f6efd8, #f6efd8 26px, #e7dfc2 27px)',
      color: '#4a3a1e', borderRadius: '10px', border: '1px solid #d8cba0',
      padding: '34px 30px', minHeight: '150px',
      display: 'grid', alignItems: 'center',
      font: '19px/1.7 Georgia, "Times New Roman", serif',
      boxShadow: '0 18px 44px rgba(0,0,0,.28)',
      transition: 'opacity .25s ease',
    });
    wrap.append(this.card);

    this.next = button('Continuar ▸');
    this.next.onclick = () => this._advance();
    wrap.append(this.next);

    const skip = el('div', {
      marginTop: '14px', color: '#0e4a63', opacity: '.7', fontSize: '13px',
      cursor: 'pointer', textDecoration: 'underline',
    }, 'Saltar intro ⏭');
    skip.onclick = () => this._finish();
    wrap.append(skip);

    this._renderCard();
    return wrap;
  }

  _renderCard() {
    this.card.style.opacity = '0';
    setTimeout(() => {
      this.card.innerHTML = STORY[this.i];
      this.card.style.opacity = '1';
    }, 160);
    this.next.innerHTML = this.i >= STORY.length - 1 ? 'Empezar la aventura ▸' : 'Continuar ▸';
  }

  _advance() {
    if (this.i >= STORY.length - 1) { this._finish(); return; }
    this.i++;
    this._renderCard();
  }

  _show(view) {
    this.menu.style.display = view === 'menu' ? 'block' : 'none';
    this.story.style.display = view === 'story' ? 'block' : 'none';
  }

  // Cierra la intro. onDone() se llama SINCRÓNICO (dentro del click) para que el
  // requestPointerLock cuente como gesto del usuario; el fade es aparte.
  _finish() {
    if (this._done) return;
    this._done = true;
    this.onDone();
    this.root.style.pointerEvents = 'none';
    this.root.style.opacity = '0';
    setTimeout(() => this.root.remove(), 450);
  }
}
