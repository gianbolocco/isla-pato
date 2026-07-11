# Juego de Belu 🎮❤️

Juego 3D de mundo abierto con parkour, hecho como regalo para Belu (la novia de Gianlucca).
Belu es la protagonista jugable.

## Visión del proyecto
- **Género:** 3D mundo abierto explorable + parkour simple pero satisfactorio.
- **Prioridades (en orden):** mundo bonito para explorar · buen movimiento/parkour · toques románticos.
- **Distribución:** web (se comparte por link). Más adelante se puede empaquetar como `.exe` con Tauri/Electron sin reescribir.
- **Público:** Belu juega desde compu o celular con solo abrir un link.

## Stack técnico
- **Three.js** (render 3D) + **Vite** (bundler/dev server).
- JavaScript ESM. Sin motor de físicas externo todavía: controlador de personaje cinemático propio (mejor "feel" de parkour y más liviano).
- Node/npm ya instalados.

## Cómo correr
```bash
npm install      # una sola vez
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción -> dist/
```

## Arquitectura (src/)
- `config.js` — constantes ajustables (físicas, cámara, render/bloom/toon, INTRO, AVATAR, PROPS). **Tunear el "feel" aquí.**
- `main.js` — punto de entrada; arranca el juego.
- `core/Game.js` — escena, renderer, cámara 3ra persona (con colisión), post-FX (bloom), loop principal, intro (botella + mensaje).
- `core/Input.js` — teclado + mouse (pointer lock).
- `core/toon.js` — toon shading (gradiente + `toonify`) para los personajes.
- `entities/Player.js` — controlador de Belu (movimiento, gravedad, salto, colisiones).
- `entities/{BeluModel,GianluccaModel,NemoModel}.js` — modelos 3D chibi con primitivas.
- `entities/BeluAvatar.js` — carga un avatar `.glb` con rig (opcional, `AVATAR.enabled`).
- **`world/World.js`** — orquestador: islas (terreno con altura vía `groundHeightAt`), mar, cielo, luces; ubica los props. `getMapData()` para el minimapa. Usa `_place(built)` para componer builders.
- **`world/props/`** — objetos reutilizables, cada builder devuelve `{ group, colliders, ... }` o un `THREE.Group`:
  - `nature.js` (palmeras/pinos/nubes/arbustos), `beach.js` (sombrilla/reposera/pelota/mesa/parrilla),
  - `Cabin.js` (cabaña habitable + muebles), `Dock.js` (muelle), `structures.js` (puentes/plataformas).
- `world/{meshUtils,textures}.js` — `meshFrom` y texturas procedurales (CanvasTexture).
- `world/Props.js` — cargador de props `.glb` externos (Poly Pizza/Kenney), ver `PROPS`.
- `objects/Bottle.js` — la botella del mensaje de la intro.
- `ui/Minimap.js` — minimapa 2D abajo-izquierda (usa `world.getMapData()`). `ui/MessageBox.js` — notas/diálogos.

**Convención de props:** un maker simple devuelve un `THREE.Group` ya ubicado; un builder con colisión devuelve `{ group, colliders, bridge?, platform(s)? }` y el `World` lo agrega con `_place(...)`.

## Controles
- **WASD / flechas** — moverse (relativo a la cámara)
- **Espacio** — saltar (con coyote-time, jump-buffer y doble salto)
- **Shift** — correr
- **Mouse** — orbitar cámara (click para capturar el puntero, Esc para soltar)

## Assets
- `personajes/modeloBelu.png` — imagen de referencia del personaje (frente + espalda). NO es 3D; guía de estilo.
- `img/` — fotos y videos reales de la pareja para los toques románticos.
  - ⚠️ Los `.HEIC` (iPhone) NO los muestra el navegador; hay que convertirlos a `.jpg`/`.png`.
  - Los `.jpg`/`.PNG` sí sirven directo. Los `.MP4` sirven para cutscenes.

## Roadmap
- [x] **Fase 1 — Base jugable:** escena 3D, cámara 3ra persona, Belu corre y salta, plataformas de prueba.
- [ ] **Fase 2 — Parkour:** wall-run/wall-jump, checkpoints, plataformas móviles, respawn.
- [ ] **Fase 3 — Mundo bonito:** iluminación, cielo, niebla, vegetación/props, zonas para explorar.
- [ ] **Fase 4 — Toques románticos:** coleccionables (corazones/fotos), mensajes dedicados, final especial.
- [ ] **Fase 5 — Pulido + publicar:** sonido, menú, y subir a un link.

## Convenciones de código
- Módulos ESM pequeños y con una sola responsabilidad.
- Constantes de gameplay en `config.js`, nunca "mágicas" dentro de la lógica.
- Comentarios en español explicando la intención, no lo obvio.
- Unidades: 1 unidad ≈ 1 metro. Y+ es arriba. El personaje mira hacia su dirección de movimiento.

## Historia y diseño
Ver `GAME_DESIGN.md` — biblia del juego: **"Belu al Rescate"** (aventura pirata divertida;
Belu rescata a Gian —"el pato"— del Capitán Lulu, con Nemo de compañero).

## Notas de sesión
Ver `DEVLOG.md` para el registro cronológico de avances y decisiones.
