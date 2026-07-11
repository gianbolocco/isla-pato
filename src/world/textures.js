import * as THREE from 'three';

// Texturas procedurales (CanvasTexture) para dar "onda" a los materiales sin
// depender de archivos de imagen externos. Todas devuelven una THREE.CanvasTexture.

export function makeWoodTex(base = '#8a5c30', grain = '#5f3c1f') {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = grain; x.lineWidth = 1; x.globalAlpha = 0.4;
  for (let i = 0; i < 6; i++) {
    const y = 6 + i * 10 + (Math.random() * 3 - 1.5);
    x.beginPath(); x.moveTo(0, y);
    x.bezierCurveTo(18, y + 2, 44, y - 2, 64, y + 1); x.stroke();
  }
  x.globalAlpha = 0.22;                       // separadores de tablones
  for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, 64); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeStripeTex(a = '#d98c86', b = '#f3ede0', n = 6) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  const w = 64 / n;
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * w, 0, Math.ceil(w), 64); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeHeartTex(bg = '#ffe4ea', heart = '#e0554e') {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 64, 64);
  x.fillStyle = heart;
  const cx = 32, cy = 30, s = 13;
  x.beginPath();
  x.moveTo(cx, cy + s);
  x.bezierCurveTo(cx + s, cy, cx + s, cy - s, cx, cy - s * 0.35);
  x.bezierCurveTo(cx - s, cy - s, cx - s, cy, cx, cy + s);
  x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
