import * as THREE from 'three';

// Generise jednostavnu ali uverljivu teksturu planete direktno preko canvas-a,
// bez potrebe za spoljasnjim slikama sa interneta. Vraca i THREE.CanvasTexture
// (za 3D materijal) i dataURL (za koriscenje kao <img> u info panelu - ovo je
// nacin da se ostvari "slika" u multimedijalnom prikazu bez eksternih fajlova).

function hexToCss(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

function shade(hex, amount) {
  // amount: -1..1, negativno tamni, pozitivno svetli
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amount > 0 ? (255 - c) * amount : c * amount))));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

export function createPlanetTexture(colorHex, { glow = false, bands = true } = {}) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = hexToCss(colorHex);
  ctx.fillRect(0, 0, size, size);

  if (glow) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.6);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, hexToCss(colorHex));
    gradient.addColorStop(1, hexToCss(shade(colorHex, -0.3)));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  } else if (bands) {
    // horizontalne trake razlicite nijanse - daje utisak povrsine/atmosfere
    const bandCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < bandCount; i++) {
      const y = (size / bandCount) * i;
      const h = size / bandCount;
      const amount = (Math.random() - 0.5) * 0.35;
      ctx.fillStyle = hexToCss(shade(colorHex, amount));
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;

    // fina "sumska" zrnca radi teksture terena/oblaka
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.6;
      const amount = (Math.random() - 0.5) * 0.5;
      ctx.fillStyle = hexToCss(shade(colorHex, amount));
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, dataUrl: canvas.toDataURL('image/png') };
}
