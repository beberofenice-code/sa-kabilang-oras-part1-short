// Hand-painted HD Canvas2D textures for "Sa Kabilang Oras (Part 1)".
// Follows the cartoon-3d-short look bible: rich storybook hues (never neon, never lemon),
// per-tile HSL jitter, seams painted as dark tints, organic brushwork, and ZERO readable text/letters.
import * as THREE from "three";

export const rng = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

const cache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, repeat = true) => {
  let t = cache.get(key);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    let hseed = key.length * 131;
    for (let i = 0; i < key.length; i++) hseed = (hseed * 31 + key.charCodeAt(i)) % 233280;
    draw(cv.getContext("2d")!, rng(hseed));
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 1;
    t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    cache.set(key, t);
  }
  return t;
};

export const rep = (t: THREE.Texture, x: number, y: number) => {
  const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c;
};

const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const _jc = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };

export const jit = (r: () => number, hex: string, dv = 0.1, dh = 5, ds = 0.14) => {
  _jc.set(hex).getHSL(_hsl);
  const k = (a: number) => 1 + (r() * 2 - 1) * a;
  _jc.setHSL((_hsl.h + ((r() * 2 - 1) * dh) / 360 + 1) % 1, Math.min(1, _hsl.s * k(ds)), Math.min(0.96, _hsl.l * k(dv)));
  return "#" + _jc.getHexString();
};

/** Rain-slicked modern night city asphalt road (Shot 1 crash) */
export const wetAsphaltHD = (key = "wetAsphaltHD") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = "#343a47"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = pick(r, ["#2c313d", "#3e4554", "#272c38", "#475063"]);
      g.fillRect(r() * 512, r() * 512, 3 + r() * 6, 3 + r() * 5);
    }
    // Wet puddle reflections
    for (let i = 0; i < 16; i++) {
      g.fillStyle = "rgba(116,148,196,0.22)";
      g.beginPath(); g.ellipse(70 + r() * 370, r() * 512, 26 + r() * 54, 14 + r() * 32, (r() - 0.5) * 0.4, 0, Math.PI * 2); g.fill();
    }
    // White crosswalk & lane stripes
    g.fillStyle = "#d8dce2";
    g.fillRect(24, 0, 12, 512);
    g.fillRect(476, 0, 12, 512);
    g.fillStyle = "#e6b94c";
    g.fillRect(248, 22, 16, 170);
    g.fillRect(248, 276, 16, 170);
  });

/** Modern night city building facade with glowing apartments (Shot 1 background) */
export const cityTowerHD = (key = "cityTowerHD", wall = "#3d465c") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 22 + col * 80, y = 20 + row * 48;
        const lit = r() < 0.48;
        g.fillStyle = lit ? pick(r, ["#ffd98a", "#ffe6b0", "#b8dcff"]) : "#222838";
        g.fillRect(x, y, 54, 30);
        g.strokeStyle = "#181d29"; g.lineWidth = 3;
        g.strokeRect(x, y, 54, 30);
      }
    }
  });

/** Warm heritage cobblestone plaza & old town street */
export const cobblePlazaHD = (key = "cobblePlazaHD") =>
  ctex(key, 1024, 1024, (g, r) => {
    g.fillStyle = "#5c5044"; g.fillRect(0, 0, 1024, 1024);
    const rows = 16, rh = 1024 / rows;
    const cols = ["#c4b094", "#b8a284", "#ccb99d", "#ae997e", "#bfa88a"];
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      let x = (row % 2) * -36;
      while (x < 1024) {
        const w = 68 + r() * 44;
        g.fillStyle = jit(r, pick(r, cols), 0.08, 4, 0.1);
        g.beginPath();
        g.roundRect(x + 3, y + 3, w - 6, rh - 6, 8);
        g.fill();
        g.strokeStyle = "#473c32"; g.lineWidth = 3;
        g.stroke();
        x += w;
      }
    }
  });

/** Classic Filipino Bahay na Bato ancestral house facade (coral stone base + capiz shell grid windows) */
export const bahayBatoHD = (key = "bahayBatoHD", plaster = "#e4d4b7") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = plaster; g.fillRect(0, 0, 512, 270);
    // Subtle plaster brushwork
    for (let i = 0; i < 65; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,248,232,0.14)" : "rgba(130,96,64,0.10)";
      g.fillRect(r() * 512, r() * 260, 30 + r() * 60, 14 + r() * 26);
    }
    // Coral-stone ground story
    g.fillStyle = "#a3937c"; g.fillRect(0, 270, 512, 242);
    for (let row = 0; row < 5; row++) {
      const y = 274 + row * 48;
      for (let col = 0; col < 5; col++) {
        const x = col * 106 + (row % 2 ? -40 : 0);
        g.fillStyle = jit(r, pick(r, ["#c6b79c", "#b8a88c", "#cfc1a6"]), 0.08, 4, 0.08);
        g.fillRect(x + 3, y + 3, 98, 42);
        g.strokeStyle = "#5a4d3f"; g.lineWidth = 2.5;
        g.strokeRect(x + 3, y + 3, 98, 42);
      }
    }
    // Dark hardwood trim beams
    g.fillStyle = "#4d311f"; g.fillRect(0, 256, 512, 20); g.fillRect(0, 0, 512, 16);
    // Capiz shell sliding windows with warm interior glow
    for (const wx of [44, 276]) {
      g.fillStyle = "#482e1d"; g.fillRect(wx - 8, 44, 192, 178);
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 6; gx++) {
        g.fillStyle = pick(r, ["#f7e5b5", "#f0d799", "#faeec8", "#e8cb8a"]);
        g.fillRect(wx + gx * 29 + 3, 52 + gy * 32 + 3, 24, 27);
      }
    }
    // Arched colonial wooden double door
    g.fillStyle = "#3c2618"; g.fillRect(194, 326, 124, 186);
    g.fillStyle = "#6e462b"; g.fillRect(204, 336, 104, 176);
    g.strokeStyle = "#2b1910"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(256, 336); g.lineTo(256, 512); g.stroke();
  });

/** Warm terracotta Spanish-era clay roof tiles */
export const clayRoofHD = (key = "clayRoofHD", base = "#b2583d") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = "#6e3222"; g.fillRect(0, 0, 512, 512);
    const rows = 10, cols = 12, rh = 512 / rows, cw = 512 / cols;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * cw + (j % 2 ? cw * 0.5 : 0) - cw * 0.5;
        const y = j * rh;
        g.fillStyle = jit(r, base, 0.11, 5, 0.12);
        g.beginPath(); g.roundRect(x + 2, y + 2, cw - 4, rh - 3, 6); g.fill();
        g.fillStyle = "#4d2116"; g.fillRect(x, y + rh - 5, cw, 5);
      }
    }
  });

/** Heritage limestone / adobe masonry for Clock Tower & Arched Stone Bridge */
export const adobeStoneHD = (key = "adobeStoneHD", base = "#c2b399") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = "#6b5e4c"; g.fillRect(0, 0, 512, 512);
    const rows = 8, rh = 512 / rows;
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      let x = (row % 2) * -48;
      while (x < 512) {
        const w = 96 + r() * 48;
        g.fillStyle = jit(r, base, 0.09, 4, 0.1);
        g.fillRect(x + 3, y + 3, w - 6, rh - 6);
        g.strokeStyle = "#4d4234"; g.lineWidth = 3;
        g.strokeRect(x + 3, y + 3, w - 6, rh - 6);
        x += w;
      }
    }
    // Subtle moss flecks near stone joins
    for (let i = 0; i < 38; i++) {
      g.fillStyle = "rgba(88,124,62,0.22)";
      g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 18, 5 + r() * 10, r(), 0, Math.PI * 2); g.fill();
    }
  });

/** Ornate Clock Tower brass-and-ivory dial face (pure geometric ticks, ZERO letters/numbers!) */
export const clockDialHD = (key = "clockDialHD") =>
  ctex(key, 512, 512, (g) => {
    g.fillStyle = "#5c4224"; g.fillRect(0, 0, 512, 512);
    // Brass outer ring
    g.fillStyle = "#d4a644";
    g.beginPath(); g.arc(256, 256, 244, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#2b1c12"; g.lineWidth = 10; g.stroke();
    // Cream ivory face
    const gr = g.createRadialGradient(240, 230, 30, 256, 256, 218);
    gr.addColorStop(0, "#fbf5e4"); gr.addColorStop(0.85, "#ebdbb8"); gr.addColorStop(1, "#cfb788");
    g.fillStyle = gr;
    g.beginPath(); g.arc(256, 256, 214, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#5a3d1e"; g.lineWidth = 6; g.stroke();
    // Inner decorative circle
    g.strokeStyle = "#8c6836"; g.lineWidth = 4;
    g.beginPath(); g.arc(256, 256, 152, 0, Math.PI * 2); g.stroke();
    // 12 radial hour bars (zero numerals!)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const major = i % 3 === 0;
      const r0 = major ? 156 : 168;
      const r1 = 202;
      g.strokeStyle = "#2b1c12";
      g.lineWidth = major ? 14 : 8;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0);
      g.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1);
      g.stroke();
    }
    // Minute dots
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = (i / 60) * Math.PI * 2;
      g.fillStyle = "#5c4328";
      g.beginPath(); g.arc(256 + Math.cos(a) * 194, 256 + Math.sin(a) * 194, 3, 0, Math.PI * 2); g.fill();
    }
  }, false);

/** Warm ochre wood planks (market stalls, kalesa, library floors, footbridges) */
export const planksHD = (key = "planksHD", cols = ["#c68a4c", "#b87c42", "#d29656", "#bc8246"]) =>
  ctex(key, 1024, 1024, (g, r) => {
    const n = 16, ph = 1024 / n;
    for (let i = 0; i < n; i++) {
      const y = i * ph;
      g.fillStyle = jit(r, pick(r, cols), 0.1, 4, 0.1);
      g.fillRect(0, y, 1024, ph);
      g.strokeStyle = "rgba(84,46,16,0.22)"; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        const gy = y + 8 + r() * (ph - 16);
        g.beginPath(); g.moveTo(0, gy); g.bezierCurveTo(320, gy + (r() - 0.5) * 8, 700, gy + (r() - 0.5) * 8, 1024, gy); g.stroke();
      }
      g.fillStyle = "#342014"; g.fillRect(0, y, 1024, 4);
      const cut = 140 + r() * 740; g.fillRect(cut, y, 4, ph);
      g.fillStyle = "#28170e";
      for (const nx of [cut - 14, cut + 18]) { g.beginPath(); g.arc(nx, y + ph * 0.5, 3, 0, Math.PI * 2); g.fill(); }
    }
  });

/** Lush hillside & riverside grass with wildflower flecks */
export const grassHD = (key = "grassHD", base = "#5a9a44") =>
  ctex(key, 1024, 1024, (g, r) => {
    g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 110; i++) {
      const x = r() * 1024, y = r() * 1024, rx = 45 + r() * 90, ry = 30 + r() * 60;
      g.fillStyle = r() < 0.5 ? "rgba(48,102,36,0.24)" : "rgba(136,192,84,0.20)";
      for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) {
        g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, r() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    g.lineCap = "round";
    for (let i = 0; i < 2800; i++) {
      const x = r() * 1024, y = r() * 1024, len = 7 + r() * 12;
      g.strokeStyle = pick(r, ["#3e782c", "#72b64e", "#4d8a38", "#88c65e"]);
      g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - len); g.stroke();
    }
    for (let i = 0; i < 55; i++) {
      g.fillStyle = pick(r, ["#f7eed0", "#f4d472", "#f2a69c"]);
      g.beginPath(); g.arc(r() * 1024, r() * 1024, 2.5 + r() * 2.2, 0, Math.PI * 2); g.fill();
    }
  });

/** Sparkling golden-hour river water */
export const riverHD = (key = "riverHD", deep = "#1f6c96", mid = "#2b8db0", crest = "#ffe0a8") =>
  ctex(key, 1024, 1024, (g, r) => {
    g.fillStyle = deep; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 100; i++) {
      const x = r() * 1024, y = r() * 1024, rx = 80 + r() * 150, ry = 18 + r() * 38;
      g.fillStyle = r() < 0.6 ? mid : "#185478";
      g.globalAlpha = 0.30 + r() * 0.24;
      for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) {
        g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, (r() - 0.5) * 0.16, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1; g.lineCap = "round";
    for (let i = 0; i < 230; i++) {
      const x = r() * 1024, y = r() * 1024, len = 48 + r() * 110;
      g.strokeStyle = r() < 0.4 ? crest : "rgba(232,250,255,0.48)";
      g.globalAlpha = 0.32 + r() * 0.36;
      g.lineWidth = 3 + r() * 4.5;
      for (const ox of [-1024, 0, 1024]) {
        g.beginPath();
        g.moveTo(x + ox, y);
        g.bezierCurveTo(x + ox + len * 0.33, y - 6, x + ox + len * 0.66, y + 6, x + ox + len, y);
        g.stroke();
      }
    }
    g.globalAlpha = 1;
  });

/** Tree bark for acacia & heritage shade trees */
export const barkHD = (key = "barkHD", base = "#5e432d") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 120; i++) {
      const x = r() * 512, y = r() * 512, w = 8 + r() * 18, h = 60 + r() * 140;
      g.fillStyle = jit(r, r() < 0.5 ? "#4a3320" : "#705238", 0.12, 4, 0.1);
      g.fillRect(x, y, w, h);
    }
    g.strokeStyle = "#2e1e12"; g.lineWidth = 3;
    for (let i = 0; i < 36; i++) {
      const x = r() * 512;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 30, 180, x + (r() - 0.5) * 30, 340, x, 512); g.stroke();
    }
  });

/** Dappled acacia foliage */
export const foliageHD = (key = "foliageHD", base = "#3d823b") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) {
      const x = r() * 512, y = r() * 512;
      g.fillStyle = jit(r, pick(r, ["#2f6c2e", "#509846", "#66ab50", "#3a7d37"]), 0.12, 5, 0.12);
      g.beginPath(); g.ellipse(x, y, 12 + r() * 20, 8 + r() * 14, r() * Math.PI, 0, Math.PI * 2); g.fill();
    }
  });

/** Vintage library wooden bookshelf filled with painted clothbound volumes (ZERO text!) */
export const bookshelfHD = (key = "bookshelfHD") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = "#4d2f1c"; g.fillRect(0, 0, 512, 512);
    const shelves = 4, sh = 512 / shelves;
    const bookCols = ["#8c362e", "#2d526e", "#3d6b48", "#c28c38", "#6e4666", "#a85a3a", "#4e5c72", "#9e7c44"];
    for (let s = 0; s < shelves; s++) {
      const sy = s * sh;
      // Dark recess behind books
      g.fillStyle = "#26160d"; g.fillRect(14, sy + 10, 484, sh - 24);
      let x = 20;
      while (x < 480) {
        const bw = 18 + r() * 20;
        const bh = sh - 34 - r() * 24;
        const col = jit(r, pick(r, bookCols), 0.1, 4, 0.1);
        g.fillStyle = col;
        g.fillRect(x, sy + sh - 16 - bh, bw - 2, bh);
        g.strokeStyle = "#1c100a"; g.lineWidth = 2.2;
        g.strokeRect(x, sy + sh - 16 - bh, bw - 2, bh);
        // Gold decorative horizontal spine bands (pure lines, zero text!)
        g.fillStyle = "#e6be60";
        g.fillRect(x + 3, sy + sh - 16 - bh + 12, bw - 8, 4);
        g.fillRect(x + 3, sy + sh - 30, bw - 8, 3);
        x += bw;
      }
      // Solid wooden shelf plank
      g.fillStyle = "#6e4427"; g.fillRect(0, sy + sh - 16, 512, 16);
      g.fillStyle = "#331c0f"; g.fillRect(0, sy + sh - 4, 512, 4);
    }
    // Side vertical frame posts
    g.fillStyle = "#683f24"; g.fillRect(0, 0, 16, 512); g.fillRect(496, 0, 16, 512);
  });

/** Warm sunlit vintage library plaster & wood wainscoting wall */
export const libraryWallHD = (key = "libraryWallHD") =>
  ctex(key, 512, 512, (g, r) => {
    g.fillStyle = "#e8dac0"; g.fillRect(0, 0, 512, 310);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,250,238,0.16)" : "rgba(164,132,96,0.10)";
      g.fillRect(r() * 512, r() * 300, 40 + r() * 70, 20 + r() * 30);
    }
    // Lower dark wood wainscoting
    g.fillStyle = "#6e4528"; g.fillRect(0, 310, 512, 202);
    g.fillStyle = "#4a2c18"; g.fillRect(0, 304, 512, 14);
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = "#3c2212"; g.lineWidth = 4;
      g.strokeRect(20 + i * 124, 332, 96, 152);
    }
  });

/** Hand-painted 1970s sepia photograph FRONT: Clara in her exact rose-cream dress under the acacia tree! (ZERO text!) */
export const photoFrontHD = (key = "photoFrontHD") =>
  ctex(key, 512, 640, (g, r) => {
    // Aged cream Polaroid/vintage photo mount border
    g.fillStyle = "#efe3c8"; g.fillRect(0, 0, 512, 640);
    g.strokeStyle = "#4d3a28"; g.lineWidth = 10; g.strokeRect(8, 8, 496, 624);
    // Warm sepia photo inner window
    const px = 38, py = 38, pw = 436, ph = 490;
    const sky = g.createLinearGradient(0, py, 0, py + ph);
    sky.addColorStop(0, "#b8966b"); sky.addColorStop(0.62, "#dfd0b0"); sky.addColorStop(1, "#8c6b48");
    g.fillStyle = sky; g.fillRect(px, py, pw, ph);
    // Vintage background acacia canopy & clock tower silhouette
    g.fillStyle = "#7a5b3c";
    g.beginPath(); g.arc(135, 195, 92, 0, Math.PI * 2); g.arc(380, 185, 86, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#6b4d33";
    g.fillRect(344, 155, 58, 225);
    g.beginPath(); g.arc(373, 210, 18, 0, Math.PI * 2); g.fillStyle = "#d9c49c"; g.fill();
    // Ground plaza
    g.fillStyle = "#7e5f3f"; g.fillRect(px, 376, pw, 152);

    // CLARA in the exact same rose-cream dress & hair ribbon (sepia-tinted cartoon portrait!)
    const cx = 256, ink = "#3a2518";
    // Legs
    g.strokeStyle = ink; g.lineWidth = 10; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx - 22, 420); g.lineTo(cx - 24, 488); g.stroke();
    g.beginPath(); g.moveTo(cx + 22, 420); g.lineTo(cx + 24, 488); g.stroke();
    // Rose-cream vintage skirt & bodice (distinctive Clara silhouette!)
    g.fillStyle = "#cfa08e";
    g.beginPath(); g.moveTo(cx - 46, 304); g.lineTo(cx + 46, 304); g.lineTo(cx + 76, 428); g.lineTo(cx - 76, 428); g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 8; g.stroke();
    // Cream collar & ribbon sash
    g.fillStyle = "#efe0c4";
    g.beginPath(); g.moveTo(cx - 32, 302); g.lineTo(cx + 32, 302); g.lineTo(cx, 334); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#965848"; g.fillRect(cx - 50, 356, 100, 16);
    // Arms holding woven basket
    g.strokeStyle = ink; g.lineWidth = 9;
    g.beginPath(); g.moveTo(cx - 46, 322); g.quadraticCurveTo(cx - 78, 362, cx - 50, 396); g.stroke();
    g.beginPath(); g.moveTo(cx + 46, 322); g.quadraticCurveTo(cx + 78, 362, cx + 52, 396); g.stroke();
    // Bean head
    g.fillStyle = "#e6cca6";
    g.beginPath(); g.ellipse(cx, 232, 68, 63, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink; g.lineWidth = 9; g.stroke();
    // Sleek dark hair + unmistakable top ribbon bow!
    g.fillStyle = "#463022";
    g.beginPath(); g.ellipse(cx, 198, 69, 36, 0, Math.PI, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx - 64, 244, 14, 34, 0.1, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx + 64, 244, 14, 34, -0.1, 0, Math.PI * 2); g.fill(); g.stroke();
    // Ribbon bow on head
    g.fillStyle = "#a85c52";
    g.beginPath(); g.ellipse(cx - 20, 166, 20, 12, -0.25, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx + 20, 166, 20, 12, 0.25, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(cx, 168, 9, 0, Math.PI * 2); g.fill(); g.stroke();
    // Gentle smiling face
    g.fillStyle = ink;
    g.beginPath(); g.ellipse(cx - 20, 232, 6, 8, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 20, 232, 6, 8, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, 252, 16, 0.2, Math.PI - 0.2); g.stroke();

    // Subtle vintage sepia scratches & vignette grain
    for (let i = 0; i < 45; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,244,218,0.18)" : "rgba(72,46,24,0.16)";
      g.beginPath(); g.arc(px + r() * pw, py + r() * ph, 1.5 + r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "#4d3a28"; g.lineWidth = 6; g.strokeRect(px, py, pw, ph);
    // Decorative vintage film corner marks on bottom margin (zero text/digits!)
    g.fillStyle = "#8a6d4b";
    for (let i = 0; i < 5; i++) g.fillRect(156 + i * 44, 566, 24, 8);
  }, false);

/** Hand-painted BACK of the 1970s photograph: aged paper with Mateo's matching golden-crimson family emblem seal! (ZERO text!) */
export const photoBackHD = (key = "photoBackHD") =>
  ctex(key, 512, 640, (g, r) => {
    g.fillStyle = "#e6d5b2"; g.fillRect(0, 0, 512, 640);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(148,112,70,0.12)" : "rgba(255,248,230,0.16)";
      g.beginPath(); g.ellipse(r() * 512, r() * 640, 24 + r() * 64, 16 + r() * 44, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "#4d3a28"; g.lineWidth = 10; g.strokeRect(8, 8, 496, 624);
    // Subtle vintage postal back divider lines (zero text!)
    g.strokeStyle = "rgba(92,66,42,0.45)"; g.lineWidth = 4;
    g.strokeRect(36, 36, 440, 568);
    // Stylized handwritten-ink flourish squiggles (abstract calligraphy strokes, ZERO legible letters!)
    g.strokeStyle = "#3a2518"; g.lineWidth = 6; g.lineCap = "round";
    for (const [y0, w0] of [[156, 250], [216, 210]] as const) {
      g.beginPath();
      g.moveTo(126, y0);
      for (let x = 126; x <= 126 + w0; x += 22) {
        g.quadraticCurveTo(x + 11, y0 + (Math.sin(x * 0.14) * 14), x + 22, y0);
      }
      g.stroke();
    }
    // Glowing Crimson & Gold Family Crest Seal (exact match to Mateo's jacket/pendant emblem!)
    const cx = 256, cy = 382;
    const glow = g.createRadialGradient(cx, cy, 18, cx, cy, 132);
    glow.addColorStop(0, "rgba(255,214,96,0.65)");
    glow.addColorStop(1, "rgba(255,214,96,0)");
    g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, 132, 0, Math.PI * 2); g.fill();

    // Wax seal circle
    g.fillStyle = "#b8362e";
    g.beginPath(); g.arc(cx, cy, 78, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#3a1b18"; g.lineWidth = 8; g.stroke();
    // Gold inner ring + iconic 8-point golden sun/star crest!
    g.strokeStyle = "#f4cb58"; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, 60, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#f4cb58";
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rad = i % 2 === 0 ? 46 : 20;
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath(); g.fill();
    g.strokeStyle = "#3a1b18"; g.lineWidth = 4; g.stroke();
    // Center diamond
    g.fillStyle = "#fff4cf";
    g.beginPath(); g.arc(cx, cy, 12, 0, Math.PI * 2); g.fill();
  }, false);

/** Soft painted cumulus clouds parameterized by LOOK[light].cloud */
export const cloudHD = (k: number, pal: { lit: string; mid: string; shade: string }) =>
  ctex(`cloud_${k}_${pal.lit}_${pal.shade}`, 512, 256, (g, r) => {
    const puffs: [number, number, number, number][] = [
      [150, 152, 92, 62], [238, 126, 110, 78], [336, 148, 96, 64],
      [285, 166, 118, 52], [192, 168, 108, 48],
    ];
    for (const [x, y, rx, ry] of puffs) {
      const ox = (r() - 0.5) * 28, oy = (r() - 0.5) * 16;
      const gr = g.createLinearGradient(0, y - ry, 0, y + ry);
      gr.addColorStop(0, pal.lit); gr.addColorStop(0.55, pal.mid); gr.addColorStop(1, pal.shade);
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x + ox, y + oy, rx * (0.9 + r() * 0.2), ry * (0.9 + r() * 0.2), 0, 0, Math.PI * 2); g.fill();
    }
  }, false);
