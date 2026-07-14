# DEVLOG — Juego de Belu

Registro cronológico de avances y decisiones. Lo más nuevo arriba.

## 2026-07-13 — Cala del Pescador: conector + la mamá de Belu (NPC de comedia)
- **Conector:** antes Alejandro (el papá) aparecía de la nada. Ahora sus líneas (`textos.js →
  alejandro`) explican que la familia andaba **paseando en la lancha por las islas y el Capitán
  Lulu los dejó varados** en la Cala del Pescador (sin tocar la intro).
- **Mamá de Belu** (NPC nuevo, COMEDIA opcional, no traba la misión): `entities/MamaModel.js` —
  chibi "Belu adulta" (mismo pelo rubio ondulado + carita tierna, vestido coral, anteojos de sol
  en la cabeza y **cartera** para el chiste del shopping). Se para bajo una **sombrilla + reposera**
  junto al campamento. Interacción E con líneas ("acá no hay ni un shopping, ni señal, ni wifi…").
  Textos en `textos.js → mama` (nombre editable). Config `MAMA` en `config.js`. Enganchada en
  `game/FishingIsland.js` (modelo + interacción + update) y props en `World._buildFishingIsland`.

## 2026-07-13 — Intro con estética pirata/mar + logo del juego
- **Logo/emblema** (`ui/logo.js` → `LOGO_SVG`, y `public/favicon.svg` con el mismo dibujo): roundel
  náutico vector puro — anillo de soga dorada, mar de atardecer con sol, rosa de los vientos tenue,
  olas y un **patito con tricornio pirata**. Sirve grande en la intro y como **favicon** del juego.
- **StartScreen rediseñada** (`ui/StartScreen.js`): paleta de mapa antiguo/madera/mar (fondo de mar
  profundo con viñeta, tipografía serif, dorado/pergamino). Menú con el emblema + título +
  subtítulo "BELU AL RESCATE" + botón de latón "⚓ Zarpar". Intro narrada sobre una **nota de
  pergamino** con sello de cera (patito estampado en SVG). Menos emojis en el chrome.
- **index.html:** título sin emojis ("Vacaciones en Isla Pato — Belu al Rescate"), `<link rel=icon>`
  al favicon.svg, y overlay de "click para jugar" a tono (emblema + serif + dorado).
- Nota: el TEXTO de la intro (`textos.js → intro`) queda como lo dejó el usuario (con sus emojis y
  su redacción); la baja de emojis se aplicó a la interfaz, no a la narración.

## 2026-07-13 — Más sonidos elegidos (diálogo, teclado, mecanismos, splash, hoguera, bichos, final)
- Ampliado `core/audio.js` con 10 SFX nuevos (todos sintetizados) + enganches:
  - **Blips de diálogo** por personaje (`Dialogue.show` → `audio.blip(speaker)`, tono derivado del nombre).
  - **Teclado de la reja** (`Keypad`): pip por tecla + jingle 'correcto' / buzz 'incorrecto'.
  - **Reja + puente levadizo** (`World.openGate`/`lowerDrawbridge`): chirrido + traqueteo de cadena
    (`audio.mechanism()`, una sola vez; el puente con flag `_dbSoundPlayed`).
  - **Splash** al tocar el agua (`Player`: cruce de `seaLevel` sobre agua abierta, flag `_splashed`
    rearmado al pisar tierra).
  - **Hoguera** crepitando por cercanía (`audio.addFire(x,z)` en el campamento de Rosa; rugido de
    fondo + chasquidos según distancia, en `audio.update(dt, playerPos)`).
  - **Maullido de Rosa** (`ShipwreckIsland._greetRosa`) y **graznido de Juancho** (`CaboRoca._startQuiz`).
  - **Final** (`Finale`): **cañonazo** (`_fire`), **Lulu volando** (whoosh+gritito al `knockOut`) y
    **jaula abriéndose** (`_openCage`).
- Quedaron SIN hacer (no elegidos): jingle de isla completa, chapoteo en la orilla, viento en las
  alturas, zumbido del faro, música de fondo, cierre musical de la carta.

## 2026-07-13 — Sonido sintetizado (Web Audio) + playa en el borde del Búnker
- **`core/audio.js`** (nuevo): motor de sonido SINGLETON, todo **sintetizado con la Web Audio
  API** (sin archivos, coherente con lo procedural del proyecto). Grafo fuentes → sfxBus/
  ambientBus → master. Se desbloquea con el primer gesto del usuario (autoplay policy); **M**
  mutea. Config nueva `SOUND` en `config.js` (volúmenes, cadencia de pasos, frecuencia de gaviotas).
  - **Ambiente:** oleaje (2 capas de ruido filtrado con LFO lento) + **gaviotas** cada 5–14 s.
  - **SFX:** pisadas por superficie (pasto/arena/roca, 2 capas c/u), salto, aterrizaje (según
    superficie), **agarrar item** (arpegio) e **interactuar** (blip). Enganches: `Player`
    (pasos por distancia recorrida `SOUND.stride`, salto en `_resolveJump`, aterrizaje en
    `_move`), `PlankField`/`ShipPartsField` (pickup), `InteractionManager` (E → interact),
    `Game` (init + `audio.update` para las gaviotas).
  - **World.surfaceAt(x,z)**: clasifica el piso ('sand'/'rock'/'grass') para el timbre del paso.
  - Pisadas de pasto y salto **rehechas** con capas de ruido (menos "beep", más orgánico).
- **Playa en el borde de El Búnker:** el anillo de arena ya existía, pero no leía como playa.
  Fix en `buildIslandMesh` (bunker): la piedra oscura **se funde en arena hacia el borde**;
  los props oscuros dejan de invadir la arena (scatter rMax 0.86→0.72) y se agregaron
  **palmeras de orilla** (tinte apagado). Ahora el borde es playa como las otras islas.

## 2026-07-13 — FINAL de la historia: abordaje del Pato Mareado (cañonazo → llave → liberar a Gian)
- **`game/Finale.js`** (nuevo): máquina de estados del final. Al abordar (E) el barco pirata: Belu
  camina por la cubierta → **dispara el cañón a Lulu** (E, auto-apuntado; bola + fogonazo/humo) →
  **Lulu sale volando** y suelta la **llave** → agarrar la llave (cercanía) → **abrir la jaula** (E)
  → sale **Gian** → **reencuentro** (cámara propia) + **carta dedicada** (`TEXTOS.finalCarta`) y
  pantalla **"Fin ❤️"**.
- **Barco pirata caminable** (`objects/PirateShip.js` rehecho): cubierta + alcázar + amuras +
  **anchors** (deckSpawn/cannon/lulu/cage/wheel). `World.enterFinaleStage()` lo congela, lo pone
  axis-aligned y agrega colliders de cubierta + barandas; `pirateAnchorWorld()` da posiciones.
- **Actores/props nuevos:** `entities/LuluModel.js` (Capitán Lulu chibi + `knockOut()` cómico),
  `world/props/cage.js` (jaula con puerta que abre), `world/props/cannon.js` (cañón). Gian
  (`GianluccaModel`) va preso en la jaula y sale al liberarlo.
- **Enganches:** `Game` crea `this.finale`; `Story`/`ShipwreckIsland` lo reciben; `_boardPirate()`
  llama `finale.start()`. `Game._tick` maneja `finale.cinematic` (cámara del reencuentro).
- **Textos** (`textos.js`): `lulu` (amenaza/derrota), `gianRescate`, **`finalCarta`** (mensaje
  dedicado editable). **DevPanel:** tecla **9** salta directo al final (temporal, para testear).

## 2026-07-13 — Nivel 1: el puente se repara con E (consistente con la isla 5)
- Antes el puente roto se reparaba **solo** al juntar el último tablón. Ahora, tras juntar
  todos los tablones, hay que **volver al puente y apretar E** para arreglarlo (igual que las
  estaciones del barco). `World` expone `bridgeRepairPoint` (borde del hueco, alcanzable) y
  `bridgeRepaired`; `Story` registra la interacción (habilitada al tener todos los tablones)
  y sumó el paso "volvé al puente y apretá E". Se sacó el `onDone` de auto-reparación.

## 2026-07-13 — Cinemática de zarpe (Cala del Naufragio → barco pirata) + ajustes
- **`game/SailCutscene.js`** (nuevo): al reparar el barco y **embarcar (E)**, arranca una
  cinemática — Belu y Rosa suben a la cubierta (hijas del barco, viajan con él) y el barco
  **navega por el mar hasta quedar al lado de "El Pato Mareado"**, con cámara de persecución
  que mira al frente; al llegar, toma final de los dos barcos + mensaje de cierre.
- **Enganches:** `Game.cutsceneActive` congela el control normal y deja que SailCutscene maneje
  cámara + barco; el barco expone `group3d` + `setCinematic()` (deja de auto-moverse); `World`
  expone `pirateShip` / `shipwreckShip`. `Story`/`ShipwreckIsland` reciben la cinemática y la
  disparan en `_board()`.
- **Ajustes de arte:** la **boca de Rosa** estaba muy abajo (subida, más chica). **Pinos** más
  grandes y realistas (`makePine` rehecho: tronco más alto + 5 pisos de conos con verdes
  variados y puntita; ~4 unidades), escalados más grandes en la isla.

## 2026-07-13 — Rosa (gata) reemplaza a Nemo como compañera
- **Nuevo `entities/RosaModel.js`**: gata chibi blanca y negra (bicolor/esmoquin) — cuerpo blanco
  con manchas negras, orejas puntiagudas, ojos verdes, naricita rosa, bigotes y cola larga que se
  mueve (swish). Misma interfaz que los demás personajes (`object3d` + `update(dt, speed01)`).
- **Nemo eliminado** del juego (se borró `entities/NemoModel.js`). En la Cala del Naufragio ahora
  la que espera y da la misión es **Rosa** (maullido en vez de ladrido). Renombrado en todo el
  código y textos: `config.NAUFRAGIO.rosa/rosaName`, `textos.js → rosa`, `game/ShipwreckIsland.js`
  (`RosaModel`, `_greetRosa`, `tailPhase`), objetivos de `Story`, opción del quiz de Juancho
  (“Rosa la gata”), y `World`. Docs (`GAME_DESIGN`, `CLAUDE`) actualizados: Rosa es la compañera.

## 2026-07-12 — Cala del Naufragio v2: barco carabela realista al agua + isla más rica + misión "reparar con materiales"
- **Barco realista** (`world/props/shipwreck.js` reescrito): carabela/balandra low-poly legible
  (casco con proa en punta, tracas, alcázar de popa, bauprés, cubierta ABIERTA) en vez del
  medio-cilindro que leía como barril. Vela **crema** (era verdosa) + franja roja, foque y jarcia.
  **Rocas separadas del casco** (`rocksGroup` estático vs `shipGroup` móvil): al reparar,
  `launch(target)` **desliza el barco de las rocas al agua** (a `seaLevel`), lo endereza y lo deja
  **flotando/meciéndose**, dejando las rocas en la orilla. `installPart(order)` revela cada pieza.
- **Isla más rica** (`World._buildShipwreckIsland`): **montañas rocosas** (cúmulos de `buildRock`
  sobre cada loma, más rocas en picos más altos + rocas-hito dispersas), **más árboles** (pino sin
  nieve arriba / frondoso abajo; `makePine({snow:false})`), palmeras en la playa, y **detalles de
  costa** nuevos (`world/props/coast.js`: driftwood, ancla, fogón con brasa, red de pesca,
  caracoles, estrellas de mar, algas). Campamento cerca de Nemo.
- **Misión nueva: reparar con materiales + estaciones** (reemplaza el puzzle de orden, se borró
  `ui/AssemblyPuzzle.js`): Nemo (E) → juntar **materiales** (🪵×4 🧵×2 🪢×2 🛢️×1;
  `shipParts.js`→`makeMaterial`, `ShipPartsField` con conteo por tipo) → 4 **estaciones** de
  reparación en el barco (marcador brillante + E): casco→cubierta/timón→vela→calafatear+**botar** →
  **embarcar**. Config `NAUFRAGIO` (materials/stations data-driven); World expone `installShipPart`/
  `launchShipwreck`/`shipwreckLaunched`. Story: tally de materiales + objetivo por estación.

## 2026-07-12 — Rediseño Cala del Naufragio: isla grande rocosa + juntar piezas + puzzle de armado
- **Isla más grande, rocosa y con montañas** (`ISLANDS[4]`, base 46, `rocky+hills`): nuevo
  relieve `hillsHeight` (suma de montículos smootherstep) enganchado en `terrainHeight`; la
  malla usa 44 anillos y tiñe los picos más pelados/claros. Bordes de **playa** como Isla Pato
  (el perfil de arena ya aplica a todas). Lomas empinadas (algunas bloquean) → algo de parkour;
  **escalera de rocas** hasta un pico donde se esconde una pieza.
- **Barco encallado grande y realista** (`world/props/shipwreck.js`, `buildShipwreck`): velero
  escorado sobre rocas, casco maltrecho con cuadernas a la vista, castillo de popa, bauprés.
  Arranca ROTO; `installPart(order)` revela cada pieza (pop) y `repair()` iza la bandera y lo
  endereza. Cabeceo en el agua. Reemplaza al bote (borrado `props/boat.js`).
- **Misión = juntar 8 piezas + armarlas** (`game/ShipwreckIsland.js` reescrito): Nemo (E) arranca
  la misión → aparecen las **8 piezas** (`world/props/shipParts.js` + `game/ShipPartsField.js`,
  cercanía, a la altura del terreno) por la isla → al juntarlas, reparar el barco (E) abre el
  **puzzle de armado** (`ui/AssemblyPuzzle.js`): elegir las piezas en ORDEN (de abajo hacia
  arriba); cada acierto arma la pieza en el barco 3D → reparado → **embarcar** (E) → cierre.
- **Config** `NAUFRAGIO` data-driven (dx/dz relativos al centro; `parts` con `order`). World
  expone `naufragio` (posiciones absolutas) + `installShipPart/repairShipwreck`. Story: 6 pasos
  nuevos; el warp del panel usa `naufragio.arrival`. Textos en `textos.js → barcoPuzzle/barcoListo`.

## 2026-07-12 — Panel de desarrollo temporal (teletransporte por islas)
- **`ui/DevPanel.js`** (nuevo, TEMPORAL): panel arriba-derecha con un botón por isla +
  "destrabar todo" + coords/objetivo en vivo. **Atajos 1–5** (y 0 = inicio) que funcionan
  incluso con el mouse capturado; `` ` `` muestra/oculta el panel. No warpea con un
  diálogo/teclado abierto (evita chocar con la reja).
- **`Story.devWarp(key)`**: destraba el camino hasta esa isla (repara puente / abre reja /
  baja levadizo, idempotente), teletransporta a Belu con los pies en el suelo, fija el
  checkpoint ahí y sincroniza el objetivo del HUD (`setStep`). + getters `objectiveText`.
- **Flag `config.DEBUG`** (true): prende/apaga el panel desde `main.js`. Poner en false
  (o borrar `DevPanel.js` + su uso) antes de publicar.

## 2026-07-12 — Isla 5 "Cala del Naufragio": reencuentro con Nemo + el bote al barco
- **Nueva isla jugable (ISLANDS[4], `cx 442, cz -36`):** cala soleada con un barco
  **encallado**, unida a la plataforma de llegada del puente levadizo por un puente
  diagonal (`buildBridge`). Bioma tropical normal (verde + arena), palmeras/arbustos/rocas.
- **Reencuentro con Nemo** (`game/ShipwreckIsland.js`, calcado de `FishingIsland`): Nemo
  espera entre los restos; al saludarlo con **E** se abre un diálogo emotivo (`TEXTOS.nemo`)
  y su cola menea más fuerte. Modelo `NemoModel` reutilizado (sin toon, como los otros NPC).
- **El bote** (`world/props/boat.js`, `makeBoat`): botecito de remos (media caña + regala +
  bancadas + 2 remos) varado en la orilla, **apuntando al mar**. Recién se puede subir
  DESPUÉS de encontrar a Nemo → muestra el mensaje de cierre (`TEXTOS.bote`, "continuará").
- **Historia** (`Story`): 4 pasos nuevos (llegar a la cala → oír el ladrido → saludar a
  Nemo → subir al bote → "rumbo a El Pato Mareado, ¡continuará!") reemplazan el placeholder.
- **Checkpoints** de llegada al Búnker y a la Cala (una caída ya no te manda a la Cala del
  Pescador). Config en `config.NAUFRAGIO`; textos en `textos.js → nemo/bote`.

## 2026-07-11 — Todos los textos en un solo archivo editable (`textos.js`)
- **`src/textos.js`** (nuevo): centraliza TODO el texto del juego con encabezado de "cómo
  editar" — `intro` (tarjetas), `botellaIntro`, `botellaBunker`, `juancho` (nombre, saludo,
  incorrecto, final, preguntas) y `alejandro` (nombre, líneas). Placeholders `{nombre}`/`{clave}`.
- **Enganches:** `config.js` importa `TEXTOS` y arma `INTRO`/`BUNKER`/`DAD` desde ahí (posiciones
  y gameplay quedan en config); `CaboRoca` lee a Juancho desde `TEXTOS.juancho` (la clave sigue
  en `QUIZ.code`); `StartScreen` usa `TEXTOS.intro`. Sin strings de diálogo sueltos en el código.

## 2026-07-11 — Menú de inicio + intro narrada (contexto de la historia)
- **`ui/StartScreen.js`** (nuevo): pantalla de arranque que se muestra UNA vez, con el juego
  renderizando de fondo. **Menú** (título, "Comenzar", controles, "un regalo para Belu") →
  **intro narrada** en 5 tarjetas: vacaciones en Isla Pato → Belu se tira la siesta → Gian
  se va a explorar ("ya vuelvo, pato") → Belu se despierta y Gian no está, ni una novedad →
  "salí a buscar a tu pato". Botón "Empezar la aventura" + link "Saltar intro".
- **`main.js`:** durante el menú/intro, Belu queda **congelada** (`game.uiActive=true`) y el
  overlay de "click para jugar" oculto (`introDone`). Al terminar, `onDone()` es SINCRÓNICO
  (dentro del click) para que `requestPointerLock` cuente como gesto del usuario.
- **`index.html`:** el `#overlay` arranca oculto y pasó a ser la pantalla de "click para
  jugar" (reaparece al soltar el mouse con Esc), no un segundo menú.

## 2026-07-11 — Limpieza: materiales compartidos + helpers reutilizables (sin duplicación)
- **`world/props/materials.js`** (nuevo): factories `woodMats()` (tablones) y `stoneMats(colors?)`
  (piedra facetada). Reemplazan los colores/materiales repetidos en `structures`, `Dock`,
  `Gate` y `World` (7+ definiciones duplicadas). Devuelven instancias nuevas: tunear una isla
  no afecta a las demás (aislamiento).
- **`World._scatter(isl, count, rMin, rMax, place, avoid)`**: un solo helper para dispersar
  vegetación/rocas al azar sobre una isla; reemplaza el bucle repetido en Cabo Roca, la Cala,
  el Búnker e Isla Pato. Cada isla pasa su propio `place`/`avoid` (queda aislada).
- **`Story._addBottleReader(...)`**: unifica las dos botellas leíbles con E (antes duplicadas)
  y devuelve su estado `{ seen }`.
- Código muerto eliminado (`makeNeonSign`). Sin cambios de comportamiento (build OK).

## 2026-07-11 — El Búnker: estética madera/piedra + circuito complejo + fix botella
- **Estética madera + piedra:** palancas de **madera** (con veta por CanvasTexture) sobre
  base de piedra; el tablero ahora tiene **borde de madera** y las compuertas van enmarcadas
  en madera; toda la consola se apoya sobre un **pedestal de ladrillos de piedra** caminable
  (0.4 de alto ≤ stepHeight, con collider). Se sacaron los **carteles de neón rosa**.
- **Circuito complejo** (data-driven en `config.BUNKER`, layout por gate): **8 palancas**
  (A–H) y **11 compuertas** con AND/OR/NOT/**XOR** en árbol. Restricciones `(A XOR B)·(E OR
  F)·(NOT F)·(G XOR H)·(A AND C)·(D AND G)` combinadas por ANDs. **Solución única** verificada
  por enumeración (256 combos): `A1 B0 C1 D1 E1 F0 G1 H0`. Cables auto-generados desde `gate.in`.
- **Compuertas legibles:** cada tipo con **color y borde propios** (AND verde, OR azul, NOT
  naranja, XOR violeta) y **texto grande en negrita** (`gateLabelTexture`), tiles más grandes
  — antes el símbolo cian chico "no se distinguía".
- **Fix botella del Búnker:** estaba en x=330 pero el paso del parkour se completa en x>332,
  así que el mensaje se activaba cuando Belu ya había pasado. Movida a x=342 (adentro).
- **Ambiente:** selva oscura (árboles atenuados + arbustos), rocas, barriles-chatarra,
  monitores CRT sueltos y **faroles que brillan** (cálidos + cian) alrededor de la consola.
- `BunkerIsland` reescrito data-driven; `applyOp` soporta AND/OR/NOT/XOR/NAND/NOR/XNOR.

## 2026-07-11 — Isla 4 "El Búnker": puzzle de compuertas lógicas + puente levadizo
- **Nueva isla jugable (ingeniería en informática):** ruina retro-tech en la selva al
  atardecer. El Capitán Lulu trabó el **puente levadizo** con una **cerradura de compuertas
  lógicas**; Belu (la ingeniera) la resuelve.
- **Puzzle** (`game/BunkerIsland.js`, data-driven en `config.BUNKER`): 4 **palancas** de
  entrada (0/1, tecla E) + compuertas **AND/OR/NOT** con lámparas que muestran el estado en
  vivo. `SALIDA = (A AND B) AND NOT(C OR D)` → única solución `A=1,B=1,C=0,D=0`. Al prender la
  SALIDA se baja el puente. Cables que brillan según la señal (cian=1 / rojo=0).
- **Props** (`world/props/bunker.js`): lámpara, palanca (manija que se inclina), módulo de
  compuerta con símbolo (CanvasTexture), tablero, cables, carteles de neón, monitor CRT,
  **puente levadizo** (pivotea y baja con animación) y cabrestante.
- **Bioma** (`World`): `bunker:true` en ISLANDS[3] → piedra húmeda oscura + musgo; luces
  locales cian/magenta y nubes de tormenta bajas. El puente levadizo + plataforma de llegada
  del otro lado (futura isla del naufragio) + `lowerDrawbridge()`/collider al bajar.
- **Botella #2 de Gian** en la llegada (`config.BUNKER.bottleMessage`) explicando el puzzle
  (palancas 0/1, compuertas, prender la SALIDA en cian). Pasos nuevos en `Story`.
- **Diseño:** la Isla 4 pasó a ser "El Búnker"; el reencuentro con **Nemo + el bote** se
  movió a una isla posterior ("Cala Naufragio", pendiente). Ver `GAME_DESIGN.md`.

## 2026-07-11 — Cabo Roca grande (Juancho escondido) + islas más separadas + muralla de piedra
- **Cabo Roca mucho más grande** (`base 26→38`) para que **cueste encontrar a Juancho**: se
  lo movió a un **rincón norte alejado del camino** (`QUIZ.parrotPos = (130, 46)`), con más
  árboles (18→32) y rocas (22→38) de cobertura (se mantiene un claro de radio 6 en el loro).
  (Se evaluó ponerlo en la cima del faro con escalera, pero trepar necesita una mecánica de
  escalada nueva que hoy no existe; queda como feature futura.)
- **Islas más separadas / puente largo:** la **Cala del Pescador** se corrió al este
  (`cx 190→240`) y la **Isla 4** con ella (`300→350`), así el puente Cabo Roca→Cala pasa de
  ~22 a ~59 de largo. Los props del campamento de la Cala se hicieron **relativos al centro
  de la isla** (se mueven con ella); `DAD.pos` y los umbrales/checkpoints de `Story`/`World`
  se reajustaron. El parkour Cala→Isla 4 conserva su largo (~56).
- **Muralla de la reja rehecha** (`props/Gate.js`): en vez de rocas sueltas flotando, ahora es
  **mampostería de piedra** — bloques apilados en hiladas con traba (running bond), retranqueo
  hacia arriba (talud), variación de color/rotación y **coronación de musgo**. Collider limpio
  por muro (sigue sin poder pasarse por el costado ni saltarse).

## 2026-07-11 — Islas en zigzag (no en línea recta) + loro sobre poste + caña rehecha
- **Islas fuera de la línea recta:** el archipiélago ahora zigzaguea en Z (Cabo Roca a
  `cz=22`, Isla 4 a `cz=-18`; Isla Pato y la Cala quedan en `cz=0` porque ahí están el
  spawn/muelle/props). El eje X sigue siendo el sentido del viaje.
- **Puentes diagonales de verdad** (`props/structures.js`): `buildBridge`/`buildBrokenBridge`
  se generalizaron a cualquier dirección del plano XZ — tablones/postes/soga se orientan a
  la dirección real (`rotation.y = -ang`, soga con quaternion) y la colisión pasó a ser una
  **cadena de cajas cortas** (`deckColliders`) que sigue la diagonal (antes era una sola AABB
  del largo entero). El hueco del puente roto ahora es `gapColliders` (array).
- **Parkour** (isla Cala → Isla 4): las plataformas **derivan en Z** hacia la Isla 4 (de z≈0
  a z≈-15). Checkpoint de Cabo Roca movido a `z=20` (la isla se corrió).
- **Loro Juancho ya no flota:** la rama va sobre un **poste de madera** con cap y escuadra de
  refuerzo, enterrado un poco para que el idle-bob no lo despegue del piso (`objects/Parrot.js`).
- **Caña de Alejandro rehecha** (`entities/AlejandroModel.js`): grupo anclado en la mano
  derecha apuntando sobre el agua — mango de corcho + tapón, caña ahusada, carrete con manija,
  anillas guía y **tanza hasta una boya roja/blanca** en el agua (antes flotaba al costado).

## 2026-07-11 — Ajustes: loro despejado, rocas con colisión, parkour largo sin checkpoints
- **Juancho despejado:** se quitó el árbol que lo tapaba; queda en su propia rama en un
  claro (World mantiene árboles/rocas lejos de `QUIZ.parrotPos`, radio 7).
- **Rocas con colisión:** nuevo `world/props/rocks.js` (`buildRock` con collider). Todas
  las rocas del mapa (orilla, Cabo Roca, Isla Pato) ahora son sólidas (no se atraviesan).
- **Cala del Pescador:** se le agregaron árboles (despejando el campamento).
- **Parkour más largo y difícil:** 13 piezas en zigzag con alturas variables (isla 4 movida
  a x=300 para más recorrido) y **sin checkpoints intermedios**: si te caés, volvés a la
  Cala del Pescador y lo rehacés entero.

## 2026-07-11 — Isla 3 "Cala del Pescador": Alejandro (papá) + parkour a la isla 4
- **Refactor a componentes reutilizables (menos duplicación):**
  - **`game/InteractionManager.js`**: cercanía + tecla E + cartelito centralizados para
    TODOS los NPC (loro, reja, Alejandro). `CaboRoca` se refactorizó para usarlo.
  - **`game/conversation.js`** (`playLines`): diálogos scripted reutilizables.
  - **`game/Checkpoints.js`**: banderines que setean el respawn (`Player.checkpoint`);
    si te caés en el parkour, volvés al último checkpoint, no al principio.
  - Piezas de parkour en **`world/props/parkour.js`** (barril, naufragio); plataformas
    de roca/madera reutilizadas de `structures.js`. Props de pesca en **`props/fishing.js`**.
- **Alejandro** (`entities/AlejandroModel.js`): papá chibi según la foto (canoso, barba
  gris, chaleco azul sobre buzo gris, con caña). Diálogo (le dice "pitu", Lulu le destrozó
  el puente) + anzuelo de la suerte. Config en `DAD`.
- **Isla 3 "Cala del Pescador"** (ISLANDS[2]): muelle + campamento (silla, balde, caja,
  botella, mesa, juncos). **Isla 4** (ISLANDS[3]) nueva (a diseñar, Nemo).
- **Parkour** isla 3 → 4 (dificultad media): puente destruido + rocas/barriles/naufragio/
  plataformas sobre el agua, con 4 checkpoints. Pasos nuevos en `Story`.

## 2026-07-11 — Ajustes: loro visible + reja ancha con muros + sin flecha al loro
- **Loro visible:** Juancho se saca de adentro de la copa; queda en una rama al costado
  del árbol (hacia donde llega Belu), visible. El objetivo ya no lo señala ("Explorá Cabo
  Roca…") → hay que encontrarlo solo.
- **Reja más ancha y alta** + **muros de roca** con colisión a ambos lados (`Gate.js`
  devuelve `gateCollider` + `wallColliders`): no se pasa por el costado ni saltando
  (collider del hueco alto hasta el dintel; muros de 7 de alto hasta el agua).

## 2026-07-11 — Ajustes nivel 2: loro guacamayo en rama + interacción con E + árboles
- **Juancho más realista** (`objects/Parrot.js`): guacamayo (cuerpo rojo, alas azules con
  banda amarilla, cola larga, parche de cara claro, pico ganchudo) posado en una **rama**.
- **Posado en un árbol, más escondido:** `CaboRoca` coloca un árbol y pone al loro arriba
  en la copa (elevado ~2.6). El trigger usa el punto del suelo (`talkRadius`).
- **Interacción con la tecla E** (loro y reja): aparece un **prompt** ("Apretá E…",
  `ui/Prompt.js`) y se abre el diálogo/teclado al presionar E (antes era automático).
  `Story`/`Game` pasan el `input` a `CaboRoca`.
- **Árboles más grandes y frondosos** (`nature.makeTree`): tronco con corteza + ramas,
  copa facetada (icosaedros) con verdes variados; más y más grandes en Cabo Roca.

## 2026-07-11 — Nivel 2: loro Juancho + quiz + reja con teclado + isla 3
- **Sistema de diálogo reutilizable** (`ui/Dialogue.js`) — globo con opciones clickeables,
  para todos los NPC. **Teclado numérico** (`ui/Keypad.js`) para la clave de la reja.
- **Loro Juancho** (`objects/Parrot.js`) chibi colorido en una roca de Cabo Roca.
- **Misión Cabo Roca** (`game/CaboRoca.js`): al acercarte, Juancho hace **3 preguntas
  sobre Gian** (opción múltiple, sin castigo, reintentás) y da la **clave**. En la **reja**
  se abre el teclado; con la clave correcta, la reja **sube** y se abre el paso.
- **Coordinador de pointer-lock** (`Game._ui`): al abrir diálogo/teclado se suelta el mouse
  (para clickear) y Belu queda **congelada**; al cerrar se recaptura. `main.js` no muestra
  el overlay con UI abierta.
- **Reja** (`world/props/Gate.js`): portcullis de piedra con collider que bloquea; `open()`
  sube los barrotes y `World.openGate()` saca la colisión.
- **Isla 3** (última, a diseñar) + **puente Cabo Roca→isla 3** (bloqueado por la reja).
  Minimapa la marca con "?". Pasos nuevos en `Story` (checkpoints hasta cruzar a isla 3).
- **Quiz configurable** (`config.QUIZ`): placeholders obvios + `code` — el usuario los edita.
- **Nubes** más grandes y menos brillosas (color apagado, no dispara el bloom).

## 2026-07-11 — Nombre "Vacaciones en Isla Pato" + puente roto con colisión
- **El juego se llama "Vacaciones en Isla Pato"** (index.html título + pantalla de inicio,
  package.json, CLAUDE.md/GAME_DESIGN).
- **Puente roto con colisión:** los dos tramos intactos ahora son sólidos (no se atraviesa
  ni se cae por las tablas visibles); el hueco del medio recién obtiene colisión al reparar
  (`structures.buildBrokenBridge` devuelve `colliders` + `gapCollider`; `World.repairBridge`).

## 2026-07-11 — Máquina de historia (checkpoints) + nota de papel + puente más largo
- **`game/Story.js`** (nuevo): máquina de estados de la historia con checkpoints, base
  extensible para todo el juego. Nivel 1: **leer la botella → llegar al puente roto (ahí
  recién aparecen los tablones) → juntarlos → puente reparado → cruzar**. Cada paso tiene
  `objective` (HUD) + `update()` que devuelve done; los objetivos gatean la progresión.
- **Gating correcto:** la misión de tablones NO se activa hasta ver la botella y después
  llegar al puente (`PlankField.spawn()` recién en ese checkpoint). El estado persiste al
  respawnear (no se pierde el progreso).
- **`ui/ObjectiveHud.js`** (objetivo arriba-centro) + **`game/PlankField.js`** (tablones sin
  HUD propio). Se reemplazó `PlankQuest.js`. `Game.js` sólo crea `Story` y la actualiza.
- **Mensaje de la botella = nota de PAPEL** (`ui/MessageBox.js`): renglones, sello de cera
  🦆, leve inclinación, tipografía tipo carta. Texto nuevo: avanzar por las islas + barco
  en la última isla. **Botella más grande** (scale 1.6).
- **Puente más largo:** Cabo Roca movida a x=118 (las islas estaban muy juntas).

## 2026-07-10 — Nivel 1 (tablones) + isla 2 rocosa (Cabo Roca) + montaña eliminada
- **Isla de la montaña eliminada** (ISLANDS[2]) junto con su puente y los pinos.
- **Nivel 1 — reparar el puente:** tablones escondidos por Isla Pato (`config.PLANKS`,
  `objects/Plank.js`). **`game/PlankQuest.js`** los instancia, anima, los junta por
  cercanía y muestra un **HUD** de progreso; al completarlos llama `world.repairBridge()`.
- **Puente ROTO reparable** (`structures.buildBrokenBridge`): le falta el tramo del medio
  y **no tiene colisión** hasta repararlo. `World.repairBridge()` muestra los tablones y
  agrega el collider para poder cruzar.
- **Isla 2 — "Cabo Roca"** (rocosa): `ISLANDS[1]` con `rocky:true` (terreno gris/musgo),
  **árboles** (`nature.makeTree`), muchas rocas y un **faro** (`objects/Lighthouse.js`).
- **Isla Pato con más vida** (`World._scatterHome`): arbustos, grupos de rocas (esconden
  los tablones) y palmeras extra.

## 2026-07-10 — El barco pirata en el horizonte (landmark)
- **`objects/PirateShip.js`** (`makePirateShip`): galeón "El Pato Mareado" — casco con
  franja roja, cañones, proa/bauprés, castillo de popa con ventanitas, 3 mástiles con
  velas (con panza) y bandera pirata negra con calavera. Sin personajes ni colisión aún.
- **En el mundo:** lejos en +Z desde el muelle (la meta en el horizonte), con balanceo
  suave (`World._buildPirateShip` + bob en `update`). Plan: 3 islas de por medio para llegar.

## 2026-07-10 — Nombres de isla + minimapa con nombres + playas realistas
- **Nombres de isla:** campo `name` en `ISLANDS` (World). Isla del comienzo = **"Isla Pato"**.
  `getMapData` lo expone; el **minimapa** dibuja el nombre centrado en cada isla (o "?"
  si todavía no la diseñamos). Convención para nombrar cada isla del viaje.
- **Playas realistas:** el borde de las islas se rehizo con bandas concéntricas de arena
  con **vertex-colors** (seca clara → húmeda oscura → sumergida), **línea de espuma**
  translúcida en la orilla y falda submarina como base. Arena más ancha (`grassF` 0.86→0.80).
  `meshFrom` ahora acepta `transparent/opacity`.

## 2026-07-10 — Refactor: props a módulos reutilizables + ventanas/interior + minimapa
- **Ventanas** de la cabaña: 4 (2 frente + 2 laterales) con marco y cruceta; interior
  con **texturas procedurales** (madera/rayas/corazón), cuadrito, plantita, baúl con tapa.
- **Minimapa** movido a **abajo-izquierda**. **Parkour** de la isla del comienzo eliminado.
- **Refactor grande (orden + buenas prácticas):** `World.js` pasó de ~1120 a ~430 líneas,
  quedando como **orquestador**. Los objetos se extrajeron a módulos reutilizables:
  - `world/meshUtils.js` (`meshFrom`), `world/textures.js` (CanvasTextures).
  - `world/props/nature.js`, `beach.js`, `Cabin.js`, `Dock.js`, `structures.js`.
  - `objects/Bottle.js` (sacada de `Game.js`).
  - **Convención:** makers simples devuelven `THREE.Group`; builders con colisión devuelven
    `{ group, colliders, bridge?, platform(s)? }` y `World._place(...)` los compone.
  - `CLAUDE.md` (Arquitectura) actualizado con la nueva estructura.

## 2026-07-10 — Intro habitable: cabaña interior + muelle + colisión de cámara
- **Cabaña habitable** (`World._buildCabin`): más grande (8×3.6×7), **hueca**, con
  **puerta abierta** (batiente girado) y hueco caminable. Colisión por **paredes**
  (fondo/laterales/frente partido por la puerta) en vez de un bloque sólido. **Belu
  spawnea adentro** (`PLAYER.spawn` = (0,2,-8)) y sale por la puerta. Piso de madera,
  2 ventanas laterales que brillan, chimenea.
- **Muebles** (`World._addFurniture`): cama (marco, respaldo, colchón, almohada,
  acolchado), mesita con lamparita que brilla, alfombra, baúl y estante con libritos.
- **Muelle** (`World._buildDock`): sale al mar en +Z (z=22→44), tablones **a ras del
  piso** (como los puentes, para caminar sin escalón), postes, soga y pilotes. La
  **botella con el mensaje** ahora está en la punta (`INTRO.bottle` = (0,40)).
- **Colisión de cámara** (`Game._updateCameraFollow`): raycast contra los colliders;
  si hay una pared entre Belu y la cámara, la acerca. Clave para estar adentro de la
  cabaña sin ver a través de las paredes.
- Modelo de Meshy descartado (pedido del usuario): estatua de 564k tris sin rig.

## 2026-07-10 — Historia definida + intro jugable (cabaña + botella)
- **`GAME_DESIGN.md`**: biblia del juego **"Belu al Rescate"** (aventura pirata; Belu
  rescata a Gian —"el pato"— del Capitán Lulu; Nemo aparece a mitad de la historia como
  detalle emotivo, NO desde el inicio). Referenciada en `CLAUDE.md`.
- **Spawn limpio:** al inicio Belu está sola (Gian secuestrado, Nemo aún no). Se sacaron
  el NPC de Gianlucca y Nemo del `Game.js` (los modelos quedan para escenas futuras).
  Spawn movido frente a la cabaña (`PLAYER.spawn`).
- **Cabaña cálida** (`World._buildCabin`): troncos, techo a dos aguas, puerta, **ventana
  que brilla** (emisiva + luz interior tibia, resalta con bloom), chimenea. Collider propio.
- **Botella con mensaje** (`core/Game`): botella de vidrio con pergamino y un glint que
  brilla; al acercarse Belu aparece el mensaje de Gian. UI reusable **`ui/MessageBox.js`**
  (pergamino abajo-centro). Texto/posición en `config.js → INTRO`.

## 2026-07-10 — Nemo (el caniche de Belu)
- **`entities/NemoModel.js`** (nuevo): caniche blanco toy chibi según la foto de referencia.
  Textura de rulos con "matas" de esferitas (`_fluff`) sobre un cuerpo sólido: cuerpo,
  4 patitas, cabeza con copete de caniche, orejas caídas peludas, hocico + naricita negra
  con brillo, ojos-botón, boquita con lengüeta, y **cola-pompón que menea** (idle).
  Misma interfaz (`object3d` + `update`). Toon shading aplicado como al resto.
- **En el mundo:** al lado de Gianlucca, cerca del spawn, mirando hacia Belu. Agregado en
  `core/Game.js` (crear + placement en el suelo + toonify + update).

## 2026-07-10 — Rostros tiernos + render bonito (bloom/toon) + pipeline de props
- **Rostros rehechos** (Belu y Gianlucca): ojos grandes y brillantes estilo chibi
  (esclera + iris marrón + pupila + 2 brillos + delineado superior), cejas suaves
  (gruesas en Gianlucca), cachetes sonrojados. Belu con fleco más prolijo. Antes eran
  puntitos oscuros; ahora leen como caritas tiernas de la referencia `modeloBelu.png`.
- **Render bonito** (`config.js` → `RENDER`): tone mapping ACES + **bloom**
  (`core/Game.js` con EffectComposer) para el brillo soñado en los highlights, y
  **toon shading** en los personajes (`core/toon.js`, look de dibujo). Todo tuneable.
- **Pipeline de props** (`world/Props.js` + `config.js` → `PROPS`): carga `.glb`
  gratis (Poly Pizza / Kenney / Quaternius) apoyados en el suelo, con caché/clonado.
  A prueba de fallos. `public/models/props/`. Pendiente: bajar los assets.

## 2026-07-10 — Gianlucca (2º personaje) + RPM en pausa
- **Decisión:** el avatar RPM no se puede automatizar (hay que crearlo a mano desde la
  selfie de Belu en su web), así que se **apaga** (`AVATAR.enabled=false`) y se sigue con
  modelos chibi de primitivas, que ya son "simples y tiernos". El andamiaje RPM queda
  listo por si algún día se genera el `.glb` (Rollup lo elimina del build mientras esté off).
- **`entities/GianluccaModel.js`** (nuevo): chibi del novio según las fotos de `img/` —
  pelo oscuro con costados cortos + copete, **cejas gruesas** (su sello), barba de pocos
  días, remera azul, jean oscuro, zapatillas. Un poco más alto/ancho que Belu. Misma
  interfaz (`object3d` + `update`) y misma animación (balanceo + idle-bob).
- **NPC en el mundo:** Gianlucca parado cerca del spawn (2.5, 0, 6) mirando hacia donde
  aparece Belu — un toque romántico (los dos en el juego). Agregado en `core/Game.js`.

## 2026-07-10 — Soporte de avatar con rig (Ready Player Me)
- **Decisión de dirección:** para "mejores modelos 3D" de personaje se elige un avatar
  con rig generado desde una **selfie de Belu** (Ready Player Me), en vez de seguir con
  primitivas. Camino técnico: `.glb` + `AnimationMixer` + clips de la librería de RPM.
- **`entities/BeluAvatar.js`** (nuevo): carga el `.glb` con `GLTFLoader`, arma el mixer
  y cruza idle/walk/run según `speed01`. Cumple la misma interfaz que `BeluModel`
  (`object3d` + `update(dt, speed01)`), así que entra sin tocar el Player/loop.
  **A prueba de fallos:** mientras el `.glb` no cargó (o si falla), muestra la Belu de
  primitivas; el juego nunca se queda sin personaje.
- **`config.js` → `AVATAR`:** flag `enabled`, rutas del modelo/animaciones y ajustes
  finos (`scale`/`yOffset`/`yawOffset`, umbrales y `fadeTime`).
- **`public/models/`** con `README.md`: dónde dejar `belu.glb` y los 3 clips, y pasos
  para generarlos. Pendiente del usuario: subir la selfie a RPM y dropear los archivos.

## 2026-07-09 — Montaña con forma (terrazas) + límite de pendiente
- Montaña rediseñada: en vez de un cono liso, ahora son **terrazas planas** (escalones) conectadas por una **rampa en espiral** (`mountainSample`). Fuera del camino la altura cae al escalón de abajo (acantilado); sobre el camino sube en rampa. Base con variación angular (forma, no círculo).
- **Límite de pendiente** en el Player (`MOVE.stepHeight`/`maxClimb`): el terreno demasiado empinado bloquea el avance → hay que **subir por el caminito**. Escalones chicos (rocas/bordes) se suben solos. Bajar sigue siendo libre.
- Isla de la montaña agrandada (base 40) para que el pie de la montaña no se salga del pasto.

## 2026-07-09 — Isla-montaña nevada + minimapa
- **Tercera isla** (0,-100) con **montaña**: terreno con altura real (`terrainHeight` = montículo suave), superficie de la isla ahora se construye con anillos concéntricos (subdivisión radial) para que la montaña sea suave.
- **Caminito en espiral** hasta la cima (`onPath`, coloreado tierra) y **nieve** arriba (blend a blanco desde el 60% de altura). **Pinos nevados** en las laderas.
- `groundHeightAt` ahora devuelve la altura del terreno (el player sube pendientes solo). Conectada a la isla A por un **segundo puente** (eje Z). Bridge builder generalizado a eje X o Z.
- **Minimapa** (`src/ui/Minimap.js`): canvas 2D abajo-centro con islas, puentes, plataformas y flecha del jugador (posición + orientación). Alimentado por `world.getMapData()`.

## 2026-07-09 — Pulido: cielo, pasto, texturas y Belu
- **Bug del "círculo blanco":** era el domo del cielo recortándose contra el far-plane. Reemplazado por un **degradado de fondo** (CanvasTexture) que siempre llena la pantalla.
- **Pasto realista:** briznas ahora son planos finos afinados en punta, plantadas en matas densas (~4200) con variación de verde (instanceColor). Antes eran conos picudos.
- **Más textura:** pasto de las islas con moteado (vertex colors) y ondulación suave del terreno; arena/costa/rocas con `flatShading` (facetas); florcitas dispersas.
- **Belu — cara:** ojos, cejas, pestañas y sonrisa **aplanados en Z** para que se vean pintados y no sobresalgan como bolitas.
- **Bely — pelo:** más forma — volumen ondulado arriba, flequillo con raya al medio, mechones con onda.
- **Belu — cuerpo:** piernas separadas (antes fundidas en bloque), pantalón wide-leg más afinado, brazos más largos/visibles.

## 2026-07-09 — Dos islas orgánicas + puente + entorno
- Belu confirmada OK por captura (cara tierna, pelo enmarcando, cuerpo unido). Palmeras OK.
- **Islas rehechas:** ahora hay **2 islas grandes con contorno irregular** (radio variable por ángulo vía `islandRadius`), no redondas. Geometría propia con pasto (centro), playa (anillo) y costa que baja al agua. `groundHeightAt` recorre ambas islas.
- **Puente de madera** que une las dos islas: tablones, vigas, postes, barandas de soga y pilotes al agua. Alineado a z=0 para colisión AABB (un collider de deck).
- **Pasto** con `InstancedMesh` (~1100 briznas) repartido por las islas. Rocas de orilla siguiendo el contorno.
- **Plataformas realistas:** `_woodPlatform` (muelle con tablones + postes al agua) y `_rockPlatform` (rocas con cima plana y musgo). Reemplazan los cubos pelados. Circuito de parkour sube a un mirador con palmera.
- Ajustes: sombra del sol cubre ambas islas, niebla/mar/cielo agrandados.

## 2026-07-09 — Palmeras realistas + modelo de Belu
- Cámara: agregado tope de piso (no atraviesa isla/mar) y opción `invertY` en config.
- Fix colisión: al caminar sobre una plataforma ya no se traba en la esquina (skin en ejes ortogonales al movimiento).
- **Palmeras rehechas:** tronco curvo afinado (8 secciones), frondas plumosas en 2 tramos que se arquean y caen (`makeFrond`/`leafBlade`), hojas afinadas en punta con cresta central, racimo de cocos. Mucho más realistas que los conos anteriores.
- **Modelo de Belu mejorado** (según `personajes/modeloBelu.png`): piel durazno claro y suave (antes muy naranja), rubor más sutil, brazos más gruesos con hombro redondeado y mano, pantalón wide-leg que se ensancha, zapatos crema.

## 2026-07-09 — Escenario: isla tropical
- Fix: eje X del movimiento estaba invertido (A/D). Corregido el vector "derecha" de la cámara.
- Nuevo mundo: **isla tropical redonda** rodeada de mar, cielo con degradado (domo con vertex-colors), niebla que funde mar y horizonte.
- Props procedurales: **palmeras** (tronco curvo + fronds + cocos), **nubes** (grupos de esferas achatadas que derivan y se envuelven), rocas de orilla, pasto central.
- **Mar** animado (vaivén vertical) semitransparente con brillo.
- **Cambio de arquitectura de piso:** el suelo ya no es un plano infinito. `World.groundHeightAt(x,z)` define dónde hay piso sólido (isla redonda) o mar (null). El Player consulta eso y respawnea si cae bajo `killY` (se hunde en el mar).
- **Parkour rehecho:** circuito que sale de la isla saltando por muelles/rocas sobre el agua y sube hasta un mirador con palmera. Más plataformas bajas en la isla para calentar.

## 2026-07-09 — Fase 1: Base jugable
- Montado proyecto Vite + Three.js con arquitectura modular (`src/core`, `src/entities`, `src/world`).
- Controlador de personaje cinemático propio: gravedad, salto con **coyote-time + jump-buffer + doble salto**, colisión AABB por ejes contra suelo y plataformas.
- Cámara en 3ra persona con pointer-lock (orbita con el mouse, WASD relativo a la cámara).
- **Belu** modelada en 3D con primitivas (estilo chibi de `modeloBelu.png`): cabeza grande, pelo rubio, top negro, pantalón crema, aretes de perla. Animación de idle-bob y balanceo al caminar.
- Mundo de prueba: suelo + plataformas flotantes a distintas alturas para probar el parkour.
- **Decisión:** físicas propias (no cannon/rapier) para tener control fino del "feel" y mantenerlo liviano. Reevaluar si el mundo crece mucho.
- **Pendiente conocido:** los `.HEIC` de `img/` necesitan conversión a jpg/png antes de usarse en la web.
