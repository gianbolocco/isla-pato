# Modelos 3D del avatar (Ready Player Me)

Acá van los archivos `.glb` del avatar de Belu y sus animaciones.
El código los toma desde estas rutas (ver `src/config.js` → `AVATAR`):

```
public/models/belu.glb          <- el avatar (cuerpo entero) de Ready Player Me
public/models/anim/idle.glb     <- animación: quieta
public/models/anim/walk.glb     <- animación: caminar
public/models/anim/run.glb      <- animación: correr
```

Mientras estos archivos no existan, el juego usa automáticamente la Belu de
primitivas (no se rompe nada). Poné `AVATAR.enabled = false` en `config.js` para
forzar el modelo de primitivas aunque el `.glb` exista.

## Cómo generar el avatar (≈5 min, sin instalar nada)

1. Entrá a https://readyplayer.me/  →  "Create Avatar".
2. Elegí **Full body** y subí una **selfie de Belu** (frente, buena luz).
   Ajustá pelo/color/ropa para que se parezca.
3. Cuando termine te da un link tipo `https://models.readyplayer.me/XXXX.glb`.
   Abrilo en el navegador para descargar el archivo y renombralo `belu.glb`.
   (Tip: agregá `?quality=high` al final del link para más detalle.)
4. Copiá `belu.glb` a `public/models/`.

## Animaciones (compatibles con el rig de RPM)

Librería oficial gratis: https://github.com/readyplayerme/animation-library
(carpeta `feminine/glb/`). Bajá 3 clips y renombralos:

- una de `.../idle/` (ej. `F_Standing_Idle_001.glb`) → `anim/idle.glb`
- una de `.../locomotion/` de caminar (ej. `F_Walk_002.glb`) → `anim/walk.glb`
- una de `.../locomotion/` de correr (ej. `F_Run_001.glb`) → `anim/run.glb`

No hace falta retargetear: los huesos ya coinciden con el avatar de RPM.

## Ajuste fino

Si el avatar aparece de espaldas, hundido o de otro tamaño, tocá en
`src/config.js` → `AVATAR`: `yawOffset` (probar `Math.PI`), `yOffset`, `scale`.
