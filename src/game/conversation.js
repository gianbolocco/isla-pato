// Reproduce un diálogo lineal (una lista de líneas con botón "Continuar"), abriendo y
// cerrando la UI (pointer-lock) por su cuenta. Reutilizable para cualquier NPC scripted.
//
//   playLines(dialogue, ui, 'Alejandro', ['Hola…', 'Adiós…'], () => { /* al terminar */ });
export function playLines(dialogue, ui, speaker, lines, onEnd) {
  ui.open();
  let i = 0;
  const step = () => {
    if (i >= lines.length) {
      dialogue.hide();
      ui.close();
      if (onEnd) onEnd();
      return;
    }
    const last = i === lines.length - 1;
    dialogue.show(speaker, lines[i++], [{ label: last ? 'Cerrar' : 'Continuar ▸', onClick: step }]);
  };
  step();
}
