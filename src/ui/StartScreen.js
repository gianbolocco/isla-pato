// Menú de inicio + intro narrada (contexto de la historia). Se muestra UNA vez al
// arrancar, por encima del juego (que ya renderiza de fondo). Al terminar llama a
// onDone(), que debe capturar el mouse y empezar a jugar (gesto del usuario = el click
// del último botón). Todo autocontenido con estilos inline (como el resto de la UI).
//
// Estética: mapa/aventura pirata — mar de atardecer, soga dorada, pergamino. El emblema
// del juego vive en ui/logo.js. Los textos de la intro están en textos.js → intro.
import { TEXTOS } from '../textos.js';
import { LOGO_SVG } from './logo.js';

const STORY = TEXTOS.intro;

const GOLD = '#e7c877';
const PARCH = '#f1e4bd';

function el(tag, style = {}, html) {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
}

// Botón "de latón" (brass) con leve relieve, estilo cofre/timón.
function button(label) {
  const b = el('button', {
    marginTop: '24px', padding: '13px 32px', borderRadius: '10px',
    border: '1px solid #8c6a24',
    background: 'linear-gradient(180deg, #f0d590, #c99f45)', color: '#3a2c14',
    font: '700 18px Georgia, "Times New Roman", serif', letterSpacing: '.4px', cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 #fff6d6, inset 0 -2px 0 #9c7a2e',
    transition: 'transform .15s ease, box-shadow .15s ease, filter .15s ease',
  }, label);
  b.onmouseenter = () => { b.style.transform = 'translateY(-2px)'; b.style.filter = 'brightness(1.06)'; };
  b.onmouseleave = () => { b.style.transform = 'none'; b.style.filter = 'none'; };
  return b;
}

// Regla decorativa fina (hairline dorada con rombo al centro).
function divider() {
  return el('div', {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    margin: '14px auto 0', maxWidth: '340px', color: GOLD, opacity: '.8',
  }, '<span style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#e7c87799)"></span>' +
     '<span style="font-size:12px">✦</span>' +
     '<span style="flex:1;height:1px;background:linear-gradient(90deg,#e7c87799,transparent)"></span>');
}

export class StartScreen {
  constructor(container, onDone) {
    this.onDone = onDone;
    this.i = 0;

    this.root = el('div', {
      position: 'fixed', inset: '0', zIndex: '200',
      display: 'grid', placeItems: 'center', padding: '24px',
      background: 'radial-gradient(130% 120% at 50% 10%, #2c5f6c 0%, #17394380 40%, #0a1a20 100%), #0a1a20',
      fontFamily: 'Georgia, "Times New Roman", serif',
      opacity: '0', transition: 'opacity .4s ease',
    });
    // Viñeta cálida para "envejecer" los bordes.
    this.root.appendChild(el('div', {
      position: 'absolute', inset: '0', pointerEvents: 'none',
      boxShadow: 'inset 0 0 160px 40px rgba(4,12,15,.7)',
    }));

    this.menu = this._buildMenu();
    this.story = this._buildStory();
    this.root.append(this.menu, this.story);
    this._show('menu');

    container.appendChild(this.root);
    requestAnimationFrame(() => { this.root.style.opacity = '1'; });
  }

  _buildMenu() {
    const wrap = el('div', { position: 'relative', textAlign: 'center', maxWidth: '660px' });

    // Emblema del juego.
    const logo = el('div', {
      width: '132px', height: '132px', margin: '0 auto 14px',
      filter: 'drop-shadow(0 10px 22px rgba(0,0,0,.5))',
    });
    logo.innerHTML = LOGO_SVG;
    wrap.append(logo);

    wrap.append(
      el('h1', {
        margin: '0', color: PARCH, fontSize: 'clamp(30px, 6vw, 58px)', fontWeight: '800',
        letterSpacing: '1px',
        textShadow: '0 2px 0 rgba(0,0,0,.45), 0 0 24px rgba(231,200,119,.25)',
      }, 'Vacaciones en Isla Pato'),
      el('p', {
        margin: '8px 0 0', color: GOLD, fontSize: 'clamp(15px, 2.4vw, 22px)',
        fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase',
      }, '14/7/2026'),
      divider(),
      el('p', {
        margin: '14px auto 0', maxWidth: '460px', color: '#cfe0dd', opacity: '.9',
        lineHeight: '1.6', fontSize: '16px',
      }, 'Cruzá el archipiélago y rescatá a Gian de las garras del Capitán Lulu.'),
    );

    const play = button('⚓  Zarpar');
    play.onclick = () => this._show('story');
    wrap.append(play);

    wrap.append(el('p', {
      marginTop: '26px', color: '#bcd0cd', opacity: '.75', fontSize: '13px', lineHeight: '1.9',
    },
      '<b>WASD</b> moverse · <b>Espacio</b> saltar · <b>Shift</b> correr · <b>Mouse</b> mirar · <b>E</b> interactuar' +
      '<br><span style="color:#e7c877;opacity:.85;letter-spacing:1px">— un regalo para Belu —</span>'));
    return wrap;
  }

  _buildStory() {
    const wrap = el('div', { position: 'relative', display: 'none', width: 'min(580px, 92vw)', textAlign: 'center' });

    // Nota de pergamino (mapa/carta antigua).
    this.card = el('div', {
      position: 'relative',
      background:
        'radial-gradient(120% 120% at 20% 10%, #f7ecc8 0%, #ecdcae 60%, #e0cd97 100%)',
      color: '#4a3826', borderRadius: '8px',
      border: '2px solid #b79a5c',
      boxShadow: '0 20px 48px rgba(0,0,0,.45), inset 0 0 40px rgba(150,110,50,.18)',
      padding: '40px 34px', minHeight: '168px',
      display: 'grid', alignItems: 'center',
      font: '19px/1.75 Georgia, "Times New Roman", serif',
      transition: 'opacity .25s ease',
    });
    // Sello de cera con el patito estampado (esquina), en vez de emojis sueltos.
    this.card.appendChild(el('div', {
      position: 'absolute', right: '-10px', top: '-10px', width: '46px', height: '46px',
      borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #d65c4e, #9c322a)',
      border: '2px solid #7d241c', boxShadow: '0 4px 10px rgba(0,0,0,.45)',
      display: 'grid', placeItems: 'center', transform: 'rotate(-8deg)',
    }, '<svg viewBox="0 0 46 46" width="30" height="30" style="opacity:.9">' +
       '<g fill="#f3d6be">' +
       '<ellipse cx="20" cy="28" rx="12" ry="8"/>' +
       '<circle cx="30" cy="20" r="6.5"/>' +
       '<path d="M35,19 l7,2 l-7,2 z"/>' +
       '</g></svg>'));
    wrap.append(this.card);

    this.next = button('Continuar');
    this.next.onclick = () => this._advance();
    wrap.append(this.next);

    const skip = el('div', {
      marginTop: '14px', color: GOLD, opacity: '.7', fontSize: '13px',
      cursor: 'pointer', letterSpacing: '.5px',
    }, 'Saltar intro »');
    skip.onmouseenter = () => { skip.style.opacity = '1'; };
    skip.onmouseleave = () => { skip.style.opacity = '.7'; };
    skip.onclick = () => this._finish();
    wrap.append(skip);

    this._renderCard();
    return wrap;
  }

  _renderCard() {
    this.card.style.opacity = '0';
    setTimeout(() => {
      // Mantiene el sello (primer hijo) y reemplaza el texto.
      const seal = this.card.firstChild;
      this.card.innerHTML = STORY[this.i];
      this.card.insertBefore(seal, this.card.firstChild);
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
