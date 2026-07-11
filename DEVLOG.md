# DEVLOG — Juego de Belu

Registro cronológico de avances y decisiones. Lo más nuevo arriba.

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
