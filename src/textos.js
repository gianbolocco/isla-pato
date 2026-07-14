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
  'Belu y Gian por fin llegaron a su destino soñado:<br>' +
    '<b>Isla Pato</b> 🏝️ un pequeño paraíso perdido en medio del océano.<br>' +
    'Arena blanca, aguas cristalinas y días enteros para disfrutar juntos. 💛',

  'Después de pasar la mañana recorriendo la playa, jugando en la arena y riéndose de cualquier cosa,<br>' +
    'el cansancio empezó a ganar.<br>' +
    '«Voy a dormir una siestita, pato», dijo Belu mientras volvía a la cabaña. 😴',

  'Gian, como siempre con ganas de explorar, mira el mar y la playa. <br>' +
    '«Voy a recorrer un poco y vuelvo enseguida», dijo mientras preparaba el mate.<br>' +
    '«No me extrañes, pato.» 🧭🦆',

  'Pasó un rato… y después pasó un poco más.<br>' +
    'Belu abrió los ojos lentamente, todavía medio dormida.<br>' +
    'Pero algo estaba raro… la cabaña estaba demasiado tranquila. 😟',

  'La puerta estaba entreabierta y Gian no estaba por ningún lado.<br>' +
    'No había mensajes, no había pistas… solo una extraña sensación de que algo había ocurrido.',

  'Donde se habra metido?<br>' +
    'Voy a tener que salir a buscarlo...'
,
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
      '¡Pato! Si estas leyendo esto es porque llegaste muy lejos!!!. El <b>Capitán Lulu</b> trabó el <b>puente levadizo</b> con una ' +
      '<b>cerradura de compuertas lógicas</b> muy complejaaa. Yo ' +
      'no entiendo nada… pero vos SÍ: sos la mejor <b>ingeniera</b> del mundo 💛.<br><br>' +
      'Movés las <b>8 palancas</b> (cada una 0 o 1). Las compuertas <b>AND / OR / NOT / XOR</b> ' +
      'combinan las señales por el tablero. Cuando la <b>lámpara de SALIDA se ponga en celeste</b>, ' +
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
        pregunta: '¿Cual fue el primer apodo que se pusieron antes de ser novios?',
        opciones: ['Patos', 'Pesecitos', 'Loquitos'],
        correcta: 2,
      },
        {
        pregunta: '¿Qué comida es la favorita de Gian?',
        opciones: ['sushi', 'Guiso de lentejas','asado'],
    correcta: 1,
  },
      {
        pregunta: '¿Cual es lo que mas le gusta hacer a Rosa?',
        opciones: ['Jugar', 'Cazar pajos', 'Absolutamente nada'],
        correcta: 2,
      },
      {
        pregunta: '¿Cual fue la bebida que se pidieron la primera cita despues del cine?',
        opciones: ['daiquiri', 'dos cocuchas frias', 'Gin'],
        correcta: 1,
      },
      {
        pregunta: '¿Como se llamaba el caballo que eligio belu en la cabalgata de villa ruiz?',
        opciones: ['Capricho', 'Muñeco', 'Jose'],
        correcta: 0,
      },
      {
        pregunta: '¿Que comida llevamos las veces que fuimos a almorzar al jardin botanico?',
        opciones: ['empanadas', 'hamburguesa', 'focaccia'],
        correcta: 2,
      },
      {
        pregunta: '¿Que nombre le pensamos poner a sus futuros patitos?',
        opciones: ['Felipe', 'Bernardina', 'Hlario'],
        correcta: 0,
      },
      {
        pregunta: '¿Donde te pidio gian de ser novios?',
        opciones: ['En un restaurante', 'En un auto', 'En su casa'],
        correcta: 1,
      },
    ],
  },

  // --- ALEJANDRO, el papá de Belu (Cala del Pescador). Le dice "pitu". ---
  alejandro: {
    nombre: 'Alejandro',
    lineas: [
      '¡Pitu! ¿Vos por acá? 🎣 Con tu mamá andábamos paseando en la lancha por las islas…',
      '…y el <b>Capitán Lulu</b>, el muy pirata, nos dejó varados en esta cala. A tu mamá no le hizo ni gracia, je.',
      'Yo aproveché para tirar la caña un rato. Pero escuché que ese pirata se llevó a Gian… ¿es cierto?',
      '¡Y para colmo <b>destrozó el puente</b> a la otra isla! 😤',
      'Vas a tener que cruzar <b>saltando por las rocas y los restos del naufragio</b>. ¡Con cuidado, pitu!',
      '¡Traémelo a Gian! ¡Vos podés! 🎣',
    ],
  },

  // --- MAMÁ de Belu (Cala del Pescador). NPC de COMEDIA opcional (no traba la misión). ---
  mama: {
    nombre: 'Jimena',   // 👉 poné acá el nombre real si querés
    lineas: [
      '¡Belu, mi amor! ¿Viste dónde nos vino a dejar varados el pirata este? 💅',
      'En esta isla no hay UN shopping, ni señal, ni un cafecito decente. ¡Nada de nada!',
      '¿Vos sabés lo que es estar tres días sin wifi? Un calvario, nena.',
      'Tu papá chocho con sus pescaditos, y yo acá achicharrándome al sol.',
      'Dale, andá a rescatar a Gian… ¡pero después nos sacás de esta isla, eh! 🕶️',
    ],
  },

  // --- ROSA, la gata blanca y negra de Belu (Cala del Naufragio, isla 5). Reencuentro + misión. ---
  rosa: {
    nombre: 'Rosa',
    reencuentro: [
      '¡Miau! 🐱 <i>Entre las rocas asoma una gatita blanca y negra…</i>',
      '¡Es <b>Rosa</b>! que se restriega contra las piernas de Belu ronroneando. 💛',
      '<i>Te da cabezazos cariñosos y babea¿ (que asco).</i> Estuvo vigilando algo grande en la orilla…',
      '¡Miau! Te guía hasta unas rocas: ¡Es el <b>barco encallado</b> que dijo Gian! aunque... hecho pedazos. ⛵💥',
      'Con ese barco podrías navegar hasta El barco pirata… pero está todo roto.',
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
      'El barco quedó como nuevo, meciéndose junto a las rocas. A lo lejos se ve... ' +
      'el barco del <b>Capitán Lulu</b>, con Gian en algún lado. 🏴‍☠️<br><br>' +
      'Subís con Rosa y tomás el timón. Es hora de navegar y <b>rescatar a tu pato</b>.<br><br>'
  },

  // --- FINAL (abordaje del Pato Mareado): Capitán Lulu, rescate de Gian y carta dedicada. ---
  lulu: {
    nombre: 'Capitán Lulu',
    amenaza:
      '¡BRAAA! ¿Quién se atreve a abordar <b>mi barcooo</b>?… ¿una chica con una gata? 😼<br>' +
      '¡Jo jo jo! Nunca liberarás a gian. ¡El cañón no te servirá de nada!',
    derrota: '¡NOOO, AAAAAAAAAA! 💫',
  },

  // Líneas de Gian al salir de la jaula (se muestran en el reencuentro).
  gianRescate:
    '¡PATO! 😭 Sabía que ibas a venir a buscarme…<br><br>' +
    'Cruzaste islas, arreglaste un barco y le metiste un cañonazo a Lulu ' +
    'Sos la persona más valiente, inteligente y hermosa del mundo. 💛',

  // ✍️ CARTA FINAL — el mensaje dedicado de Gian a Belu. EDITÁ ESTO con tus palabras.
  finalCarta: {
  titulo: 'Para vos, mi pato 💛',
  mensaje:
    'Belu, seguro que a este juego le faltan muchas cosas, pero te lo hice con mucho amor y dedicación.<br><br>' +
    'Cumplimos 2 años de novio y quería sacarte una sonrisa un ratito, y recordarte que me hacés feliz, y que cada día me hacés un poquito más feliz.<br><br>' +
    'Esto es una manera de retribuirte todo lo que me das: tu amor, tus besos, tus abrazos y la calma que me das.<br><br>' +
    'Haciendo referencia al juego, vos me salvaste en muchos sentidos. No me imagino una vida sin vos, sin tus mensajitos, sin tus abrazos y sin tenerte a mi lado.<br><br>' +
    'Te amo, gracias por todo. 🦆',
},

};
