// Minimapa 2D abajo-izquierda: dibuja las islas, puentes, plataformas y la posicion
// (y orientacion) del jugador. Se alimenta de world.getMapData().

export class Minimap {
  constructor(mapData) {
    this.data = mapData;

    // Limites del mundo a partir de los contornos de las islas.
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const isl of mapData.islands) {
      for (const [x, z] of isl.pts) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }
    const pad = 14;
    this.b = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };

    // Canvas con la proporcion del mundo (max 200px de lado).
    const maxSide = 200;
    const wWorld = this.b.maxX - this.b.minX;
    const hWorld = this.b.maxZ - this.b.minZ;
    const aspect = wWorld / hWorld;
    this.cw = aspect >= 1 ? maxSide : Math.round(maxSide * aspect);
    this.ch = aspect >= 1 ? Math.round(maxSide / aspect) : maxSide;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'fixed', bottom: '14px', left: '14px',
      padding: '6px', borderRadius: '12px', background: 'rgba(14,17,22,0.45)',
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
    return [
      (x - this.b.minX) / (this.b.maxX - this.b.minX) * this.cw,
      (z - this.b.minZ) / (this.b.maxZ - this.b.minZ) * this.ch,
    ];
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
      ctx.fillStyle = isl.mountain ? '#a9b7a0' : '#86c06a';
      ctx.fill();
      if (isl.mountain) {
        const [mx, my] = this._xy(isl.cx, isl.cz);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Nombres de las islas (o "?" si todavía no la diseñamos).
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const isl of this.data.islands) {
      const [lx, ly] = this._xy(isl.cx, isl.cz);
      const label = isl.name || '?';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(label, lx, ly);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, lx, ly);
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
    const [px, py] = this._xy(pos.x, pos.z);
    let dx = Math.sin(facing) / (this.b.maxX - this.b.minX) * this.cw;
    let dz = Math.cos(facing) / (this.b.maxZ - this.b.minZ) * this.ch;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const px2 = -dz, pz2 = dx; // perpendicular
    const S = 6;
    ctx.fillStyle = '#ff5a7a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + dx * S, py + dz * S);
    ctx.lineTo(px + px2 * S * 0.6, py + pz2 * S * 0.6);
    ctx.lineTo(px - px2 * S * 0.6, py - pz2 * S * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
