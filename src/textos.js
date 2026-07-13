// ============================================================================
//  TEXTOS DEL JUEGO  —  editá acá TODO lo que se lee en pantalla.
//
//  Cómo editar sin romper nada:
//   • Cambiá solo lo que está entre comillas '...'.
//   • <b>...</b> = negrita   ·   <br> = salto de línea   ·   los emojis se pegan.
//   • {nombre} y {clave} se reemplazan solos — dejalos si querés que aparezcan.
//   • No borres las comas , las comillas ' ' ni las llaves { } / corchetes [ ].
// ============================================================================

export const TEXTOS = {

  // --- INTRO NARRADA (menú → historia). Cada línea de abajo es una tarjeta. ---
  intro: [
    'Belu y Gian se escaparon de vacaciones a <b>Isla Pato</b> 🏝️.<br>' +
      'Sol, mar turquesa y todo el tiempo del mundo para los dos.',
    'Después de una mañana de playa, a Belu le ganó el sueño.<br>' +
      '«Me tiro una siesta un ratito», dijo, y se acurrucó en la cabaña. 😴',
    '«Yo aprovecho a explorar un toque la isla», dijo Gian con cara de aventurero.<br>' +
      '«Ya vuelvo, pato.» 🧭 Y salió a caminar entre las palmeras.',
    'Belu se despertó un rato después…<br>y la cabaña estaba en silencio. <b>Gian no estaba.</b><br>' +
      'Ni una nota, ni un ruido. Nada. 😟',
    '¿Dónde se metió? Algo no anda bien.<br>' +
      'Es hora de levantarse y salir a buscar a tu pato. 🦆💛',
  ],

  // --- BOTELLA del muelle (Isla Pato, al principio). ---
  botellaIntro: {
    titulo: 'Querido pato…',
    mensaje:
      'Necesito ayudaaaaa! Me quise hacer el niño explorador y sali a recorrer la hermosa isla pato, ' +
      'me perdí... y el <b>Capitán Lulu</b> me secuestró. Estoy en su barco pirataa.<br><br>' +
      'Para rescatarme vas a tener que <b>avanzar por todas las islas</b>. En la <b>última isla</b> ' +
      'hay un barco para navegar hasta el barco pirata y rescatarme.<br><br>' +
      'Hay puente destruido, que te lleva a la proxima isla, tienes que buscar la manera de repararlo y avanzar<br><br>' +
      '¡Vení a salvar a tu pato! Te amo. — Gian',
  },

  // --- BOTELLA del Búnker (isla 4, antes del puzzle de compuertas). ---
  botellaBunker: {
    titulo: 'Che pato… la última traba 🔌',
    mensaje:
      '¡Pato! Casi llegás 😭. El <b>Capitán Lulu</b> trabó el <b>puente levadizo</b> con una ' +
      '<b>cerradura de compuertas lógicas</b> bien enredada (se cree Bill Gates, el pirata). Yo ' +
      'no entiendo nada… pero vos SÍ: sos la mejor <b>ingeniera en informática</b> del mundo 💛.<br><br>' +
      'Movés las <b>8 palancas</b> (cada una 0 o 1). Las compuertas <b>AND / OR / NOT / XOR</b> ' +
      'combinan las señales por el tablero. Cuando la <b>lámpara de SALIDA se ponga en cian</b>, ' +
      'el puente baja.<br><br>Hay una sola combinación correcta. ¡Vos podés, pato! Te amo. — Gian',
  },

  // --- JUANCHO, el loro (Cabo Roca). Hace un quiz sobre Gian y da la clave de la reja. ---
  juancho: {
    nombre: 'Juancho',
    saludo: '¡Braaawk! Soy <b>{nombre}</b>. Yo sé la clave de la reja… pero primero: ¿de verdad conocés a tu pato? 🦜',
    empezar: '¡Dale, preguntame!',
    incorrecto: '¡Braaawk! ✖ Esa no… ¿en serio? Probá de nuevo 🦜',
    final: '¡Braaawk! Se nota que lo querés 💛. La clave de la reja es <b>{clave}</b>. ¡Andá a salvar a tu pato! 🦜',
    // Cada pregunta: el texto, las opciones y cuál es la correcta (0 = la primera).
    preguntas: [
      {
        pregunta: '¿Cómo se llama el "pato" que Belu quiere rescatar?',
        opciones: ['Gianlucca', 'Un pingüino', 'El Capitán Lulu'],
        correcta: 0,
      },
      {
        pregunta: '¿Quién se llevó a Gian en el barco pirata?',
        opciones: ['El Capitán Lulu', 'Un delfín', 'Rosa la gata'],
        correcta: 0,
      },
      {
        pregunta: '¿Cómo se dicen de cariño Belu y Gian?',
        opciones: ['Pato', 'Jefe', 'Vecino'],
        correcta: 0,
      },
    ],
  },

  // --- ALEJANDRO, el papá de Belu (Cala del Pescador). Le dice "pitu". ---
  alejandro: {
    nombre: 'Alejandro',
    lineas: [
      '¿Qué hacés, pitu? 🎣 Estaba acá tranquilo pescando…',
      '…cuando apareció el <b>Capitán Lulu</b>. El muy pirata sabe que andás buscando a Gian.',
      'Y para complicarte, ¡me <b>destrozó el puente</b> a la otra isla! 😤',
      'Vas a tener que cruzar <b>saltando por las rocas y los restos del naufragio</b>. ¡Con cuidado, pitu!',
      'Tomá, llevate mi <b>anzuelo de la suerte</b> 🎣. ¡Traémelo a Gian! Te amo, hija 💛',
    ],
  },

  // --- ROSA, la gata blanca y negra de Belu (Cala del Naufragio, isla 5). Reencuentro + misión. ---
  rosa: {
    nombre: 'Rosa',
    reencuentro: [
      '¡Miau! 🐱 <i>Entre las rocas asoma una gatita blanca y negra…</i>',
      '¡Es <b>Rosa</b>! Tu gata, que se restriega contra las piernas de Belu ronroneando. 💛',
      '<i>Te da cabezazos cariñosos.</i> Estuvo vigilando algo grande en la orilla…',
      '¡Miau! Te guía hasta unas rocas: un <b>barco encallado</b>, hecho pedazos. ⛵💥',
      'Con ese barco podrías navegar hasta El Pato Mareado… pero está todo roto.',
      'Para arreglarlo hay que juntar <b>materiales</b> por la isla: madera 🪵, tela 🧵, ' +
        'soga 🪢 y brea 🛢️. ¡A buscarlos, Belu! 🐾',
    ],
  },

  // --- REPARAR el barco (Cala del Naufragio): etiquetas de las 4 estaciones (en orden). ---
  barcoReparar: {
    estaciones: [
      'Volvé al barco y parchá el <b>casco</b> con madera 🪵 (E)',
      'Armá la <b>cubierta</b> y colocá el <b>timón</b> 🔨 (E)',
      'Cosé la tela y <b>izá la vela</b> 🧵 (E)',
      'Calafateá con <b>brea</b> y <b>botá</b> el barco al agua 🛢️ (E)',
    ],
  },

  // --- EL BARCO REPARADO (Cala del Naufragio): al zarpar, rumbo al barco pirata. ---
  barcoListo: {
    titulo: 'El barco reparado 🚢',
    mensaje:
      'El barco quedó como nuevo, meciéndose junto a las rocas. A lo lejos se recorta ' +
      '<b>El Pato Mareado</b>, el barco del <b>Capitán Lulu</b>, con Gian en algún lado. 🏴‍☠️<br><br>' +
      'Subís con Rosa y tomás el timón. Es hora de navegar y <b>rescatar a tu pato</b>.<br><br>' +
      '<i>— Continuará: el abordaje a El Pato Mareado —</i>',
  },

  // --- FINAL (abordaje del Pato Mareado): Capitán Lulu, rescate de Gian y carta dedicada. ---
  lulu: {
    nombre: 'Capitán Lulu',
    amenaza:
      '¡BRAAA! ¿Quién se atreve a abordar <b>mi</b> Pato Mareado?… ¿una chica con una gata? 😼<br>' +
      '¡Jo jo jo! Nunca liberarás a tu "patito". ¡El cañón no te servirá de na—!',
    derrota: '¡NOOO, mi gorriteee! 💫',
  },

  // Líneas de Gian al salir de la jaula (se muestran en el reencuentro).
  gianRescate:
    '¡PATO! 😭 Sabía que ibas a venir a buscarme…<br><br>' +
    'Cruzaste islas, arreglaste un barco y le metiste un cañonazo a un pirata. ' +
    'Sos la persona más valiente, inteligente y hermosa del mundo. 💛',

  // ✍️ CARTA FINAL — el mensaje dedicado de Gian a Belu. EDITÁ ESTO con tus palabras.
  finalCarta: {
    titulo: 'Para vos, mi pato 💛',
    mensaje:
      'Belu, hice este jueguito entero para decirte algo simple: <b>te amo</b>.<br><br>' +
      'Gracias por bancarme, por hacerme reír y por ser mi lugar favorito del mundo. Cada isla ' +
      'de este viaje es un pedacito de lo mucho que te quiero.<br><br>' +
      'Sos mi pato. Y yo, para siempre, el tuyo. 🦆❤️<br><br>' +
      '<i>(editá este mensaje en src/textos.js → finalCarta)</i>',
  },

};
