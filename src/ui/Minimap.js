// Minimapa 2D abajo-izquierda: dibuja las islas, puentes, plataformas y la posición (y
// orientación) del jugador. Se alimenta de world.getMapData(). Los nombres van en "pastillas"
// alternadas arriba/abajo de cada isla (con línea guía) para que no se encimen.

export class Minimap {
  constructor(mapData) {
    this.data = mapData;

    // Límites del mundo a partir de los contornos de las islas.
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const isl of mapData.islands) {
      for (const [x, z] of isl.pts) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }
    const pad = 10;
    this.b = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };

    // Escala uniforme que entra en un área interior, dejando margen arriba/abajo para las
    // etiquetas (MY) y a los lados (MX). El lienzo se dimensiona según esa escala.
    this.MX = 10; this.MY = 30;
    const wWorld = this.b.maxX - this.b.minX;
    const hWorld = this.b.maxZ - this.b.minZ;
    const s = Math.min(288 / wWorld, 132 / hWorld);
    this.s = s;
    this.cw = Math.round(wWorld * s + this.MX * 2);
    this.ch = Math.round(hWorld * s + this.MY * 2);

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'fixed', bottom: '14px', left: '14px',
      padding: '6px', borderRadius: '12px', background: 'rgba(14,17,22,0.5)',
      border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(3px)', pointerEvents: 'none', zIndex: '20',
    });
    const canvas = document.createElement('canvas');
    canvas.width = this.cw; canvas.height = this.ch;
    canvas.style.display = 'block';
    canvas.style.borderRadius = '8px';
    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    this.ctx = canvas.getContext('2d');
  }

  _xy(x, z) {
    return [this.MX + (x - this.b.minX) * this.s, this.MY + (z - this.b.minZ) * this.s];
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  update(pos, facing) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    // Mar.
    ctx.fillStyle = 'rgba(42,167,196,0.6)';
    ctx.fillRect(0, 0, this.cw, this.ch);

    // Islas.
    for (const isl of this.data.islands) {
      ctx.beginPath();
      isl.pts.forEach(([x, z], i) => {
        const [px, py] = this._xy(x, z);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = isl.mountain ? '#a9b7a0' : '#7cc25a';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
      if (isl.mountain) {
        const [mx, my] = this._xy(isl.cx, isl.cz);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Puentes.
    ctx.strokeStyle = '#a9793f';
    ctx.lineWidth = 3;
    for (const bg of this.data.bridges) {
      const [x1, y1] = this._xy(bg.x1, bg.z1);
      const [x2, y2] = this._xy(bg.x2, bg.z2);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Plataformas.
    ctx.fillStyle = '#caa25c';
    for (const p of this.data.platforms) {
      const [px, py] = this._xy(p.x, p.z);
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    // Jugador (flecha que apunta hacia donde mira).
    const [ppx, ppy] = this._xy(pos.x, pos.z);
    let dx = Math.sin(facing), dz = Math.cos(facing);
    const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
    const px2 = -dz, pz2 = dx, S = 6;
    ctx.fillStyle = '#ff5a7a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ppx + dx * S, ppy + dz * S);
    ctx.lineTo(ppx + px2 * S * 0.6, ppy + pz2 * S * 0.6);
    ctx.lineTo(ppx - px2 * S * 0.6, ppy - pz2 * S * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nombres en pastillas, alternando arriba/abajo (con línea guía) para no encimarse.
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.data.islands.forEach((isl, i) => {
      const [cx, cy] = this._xy(isl.cx, isl.cz);
      const label = isl.name || '?';
      const w = ctx.measureText(label).width + 10, h = 15;
      const above = i % 2 === 0;
      let py = above ? cy - 20 : cy + 20;
      py = Math.max(h / 2 + 1, Math.min(this.ch - h / 2 - 1, py));
      let px = Math.max(w / 2 + 1, Math.min(this.cw - w / 2 - 1, cx));

      // Línea guía isla → pastilla.
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

      // Pastilla.
      this._roundRect(px - w / 2, py - h / 2, w, h, 5);
      ctx.fillStyle = isl.name ? 'rgba(20,24,32,0.86)' : 'rgba(60,50,30,0.86)';
      ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, px, py + 0.5);
    });
  }
}
