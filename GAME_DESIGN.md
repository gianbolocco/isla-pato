# GAME DESIGN — "Vacaciones en Isla Pato" 🏝️🏴‍☠️🦆

Biblia del juego. Historia, personajes, mundo, objetos y mecánicas.
Tono: **aventura divertida, con chistes internos**. Tierno pero jugueton.

---

## Premisa
Belu, Gian y Nemo se van de vacaciones a **Isla Pato**. Todo hermoso… hasta que
aparece el barco pirata **"El Pato Mareado"** y **secuestran a Gian**. Belu (con
Nemo) tiene que cruzar el archipiélago, superar desafíos de parkour y llegar a la
guarida pirata para **rescatar a su pato y liberarlo**.

**El giro:** la heroína es Belu; el que hay que rescatar es Gian (reversión tierna
del "damsel in distress").

## Personajes
- **Belu** — protagonista jugable. Valiente, tierna. (modelo chibi ya hecho)
- **Nemo** — caniche blanco, compañero fiel. Olfatea el rastro, cava tesoros,
  distrae/muerde piratas (comedia). (modelo chibi ya hecho)
- **Gian ("el pato")** — el secuestrado. Tira chistes desde la jaula. Se hizo el
  **niño explorador**, se perdió, y por eso lo agarraron. (modelo chibi ya hecho)
- **Capitán Lulu** — villano bobo-adorable: parche, gordito, gorro pirata, rubio,
  pelo corto, barbita. *(por modelar en 3D estilo chibi)*

## Chiste maestro: "PATO" 🦆
Belu y Gian se dicen **"pato"**. Es el hilo de oro de todo el juego:
- Belu no rescata a "Gian", rescata a **su pato**.
- Nota de rescate: *"Tenemos a tu pato. Si lo querés, vení a buscarlo. — Cap. Lulu"*.
- Coleccionable principal: **patitos de goma** 🦆.
- El barco de Lulu: **"El Pato Mareado"**.

## Intro (cutscene)
Playa paradisíaca. Belu saca fotos, Nemo corre. Gian: *"voy a explorar un toque"* 🧭,
se aleja, se pierde tras unas rocas, y **¡zácate!** la tripulación de Lulu lo mete en
un saco. Nemo ladra, Belu se da vuelta y ve "El Pato Mareado" zarpando con Gian en una
jaula agitando la mano. → Arranca la misión.

## Mundo (actos = islas, cada una una misión)
No estamos atados a las 3 islas actuales: se reskinnean y se agregan escenarios.

| # | Isla / Escenario | Misión | Estado |
|---|---|---|---|
| 1 | 🌴 **Isla Pato** | Intro (botella) + juntar **tablones** para reparar el puente | ✅ |
| 2 | 🪨 **Cabo Roca** (rocosa, árboles, faro) | **Loro Juancho**: quiz sobre Gian → clave → **reja con teclado** | ✅ |
| 3 | 🎣 **Cala del Pescador** | **Alejandro** (papá): diálogo + **parkour** sobre el agua (Lulu destrozó el puente) | ✅ |
| 4 | 🔌 **El Búnker** (ruina retro-tech, atardecer tormentoso) | **Circuito de compuertas lógicas** (AND/OR/NOT): mover palancas para prender la SALIDA y bajar el **puente levadizo** (guiño a ingeniería en informática) | ✅ |
| 5 | 🐾 **Cala del Naufragio** (barco encallado, cala soleada) | Aparece **Nemo** (reencuentro emotivo, tecla E) + subir al **bote** para navegar al barco pirata | ✅ |
| — | ⚓ **El Pato Mareado (final)** | Abordar, liberar a Gian | 🏗️ barco (landmark lejano) |

Personajes/NPC: **Juancho** (loro), **Alejandro** ("pitu", papá pescador), **Capitán Lulu**
(por modelar). Sistemas reutilizables: diálogo, interacción (E), teclado, checkpoints, parkour,
**puzzle lógico** (palancas + compuertas + puente levadizo).

El **barco pirata "El Pato Mareado"** ya está en el horizonte como meta lejana. Se llega
cruzando las islas; cada una da un ítem/misión para pasar a la siguiente (nivel 1: tablones).

## Objetos
- **Piezas del mapa del tesoro** — objetivo principal (juntarlas abre la guarida).
- **Llaves** 🗝️ — para la jaula de Gian.
- **Patitos de goma** 🦆 — coleccionable/puntaje.
- **Notas** — de rescate ridículas + mensajitos de Gian desde el cautiverio
  (**acá van los chistes internos** — pendientes, salen mientras construimos niveles).
- **Huesitos de Nemo** 🦴, cofres, barriles, cañones, banderas, catalejo, brújula,
  loro, sombreros piratas.
- **Fotos-recuerdo** (polaroids con fotos reales de `img/`) — pocos toques tiernos.

## Mecánicas
- **Nemo compañero:** te sigue, olfatea el rastro, cava, distrae piratas.
- **Parkour con sentido:** trepar mástiles/aparejos, saltar entre naufragios,
  escalar cuevas para acercarte al barco.
- **Progresión por misiones:** cada isla es cerrada; completarla abre la siguiente.
- **Conflicto NO violento** (slapstick): a los piratas los esquivás o los noquea
  Nemo / un cocazo 🥥. Sin sangre, puro chiste.
- **Notas/diálogos** en globos de texto → donde viven los chistes internos.

## Pendientes / slots a llenar
- Frases de Gian desde la jaula (van saliendo con cada nivel).
- Más chistes internos para notas y carteles.
- Diseño fino de cada isla al construirla.

## Estado de assets
- ✅ Modelos: Belu, Gianlucca, Nemo (chibi, con toon shading).
- ⏳ Por modelar: Capitán Lulu, piratas, barco, props piratas.
- Render: bloom + toon + tone mapping (ver `config.js → RENDER`).
