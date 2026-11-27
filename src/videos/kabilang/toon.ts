// Flat 2D cartoon cast & 2D effect cards for "Sa Kabilang Oras (Part 1)".
// Follows the proven cartoon-3d-short character grammar: superellipse bean heads (h/w 0.94),
// plum ink #241726 variable-width outline, stick limbs with ink-dot hands, expressive faces,
// no blush, no eye catchlights, painted radial/linear crescents. Design space 600 x 1000 (soles y = 975).
export const INK = "#241726";
export const SKIN = "#e8b98e";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.94, 0.84, 0.80];
const SH_CLOTH: C3 = [0.64, 0.66, 0.74];
const SH_FELT: C3 = [0.62, 0.62, 0.70];

export type Build = "adult" | "teen" | "elder";
export type HatStyle = "none" | "messy" | "ribbon" | "salakot" | "fedora" | "bun" | "bob";

export type Outfit = {
  jacket: string;
  pants: string;
  boots: string;
  skin?: string;
  hair?: string | null;
  hat?: HatStyle;
  hatCol?: string;
  collar?: string;
  sash?: string;
  dress?: string;        // Flowing vintage skirt (Clara & vintage townswomen)
  hoodie?: boolean;      // Mateo's modern hoodie strings + backpack straps + golden sun crest patch!
  crestBadge?: boolean;  // Mateo's iconic 8-point crimson-gold family crest matching the 1970s photo back!
  moustache?: string;
  glasses?: boolean;
  build?: Build;
};

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

// ---------------- Cast Outfits for "Sa Kabilang Oras (Part 1)" ----------------
export const MATEO: Outfit = {
  jacket: "#3c6898", pants: "#2f3848", boots: "#ebe6da", skin: "#e0ad82",
  hair: "#211c24", hat: "messy", collar: "#f0ece2", hoodie: true, crestBadge: true, build: "teen",
};
export const CLARA: Outfit = {
  jacket: "#e8b4a6", dress: "#d8988a", pants: "#9e6a62", boots: "#54382c", skin: "#f0c6a4",
  hair: "#251c22", hat: "ribbon", hatCol: "#b8444a", collar: "#faf2e4", sash: "#b8444a", build: "teen",
};
export const KUTSERO: Outfit = {
  jacket: "#efe4cc", pants: "#59483a", boots: "#3d2a1d", skin: "#cf976b",
  hat: "salakot", hatCol: "#d4ae66", sash: "#b83a32", moustache: "#2d2424", build: "adult",
};
export const LIBRARIAN: Outfit = {
  jacket: "#6b5446", pants: "#3d332e", boots: "#2e2420", skin: "#d6a47a",
  hair: "#cfd2d8", hat: "bun", collar: "#f4ead8", glasses: true, build: "elder",
};
const SKINS = ["#d29b70", "#deb088", "#c88f64", "#e6ba94"];
export const townsfolk = (v = 0): Outfit => {
  const tops = ["#ece1c8", "#c8825a", "#688682", "#d4b264", "#8a6d7a", "#7e9668"];
  const isWoman = v % 2 === 1;
  return {
    jacket: tops[v % tops.length],
    dress: isWoman ? ["#7c545c", "#586d78", "#8c6e4e"][v % 3] : undefined,
    pants: "#483e36",
    boots: "#3a2a20",
    skin: SKINS[v % SKINS.length],
    hair: "#251e24",
    hat: isWoman ? "bun" : (v % 4 === 0 ? "fedora" : "salakot"),
    hatCol: v % 4 === 0 ? "#685446" : "#d4ae66",
    collar: "#f4ecdc",
    build: v % 5 === 0 ? "elder" : "adult",
  };
};

// ---------------- Pen ----------------
export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0;
    const c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0];
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- bean contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.05 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.22 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.22 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.04 * (rnd(seed, 4) - 0.5),
  asym: (0.05 + 0.02 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(4 * (rnd(seed, 7) - 0.5)), noise: 0.007, seed,
});

export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "gentle" | "smile" | "grin" | "laugh" | "nervous" | "shock" | "awe" | "talk" | "sadSmile" | "peace" | "worried";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf";
type MouthK = "dash" | "frown" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave";

const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral:  { eye: ["lid", "lid"],         brow: [0, -1],   mouth: "dash" },
  gentle:   { eye: ["dot", "dot"],         brow: [-2, 1],   mouth: "smile" },
  smile:    { eye: ["dot", "dot"],         brow: [-1, -1],  mouth: "smileWide" },
  grin:     { eye: ["happy", "happy"],     brow: [-3, -3],  mouth: "grin" },
  laugh:    { eye: ["squeeze", "squeeze"], brow: [-4, -4],  mouth: "laugh" },
  nervous:  { eye: ["small", "small"],     brow: [-3, 2],   mouth: "wave" },
  worried:  { eye: ["dot", "dot"],         brow: [-4, 3],   mouth: "frown" },
  shock:    { eye: ["shock", "shock"],     brow: [-7, -6],  mouth: "O" },
  awe:      { eye: ["shock", "shock"],     brow: [-5, -4],  mouth: "o" },
  talk:     { eye: ["dot", "dot"],         brow: [-2, -1],  mouth: "o" },
  sadSmile: { eye: ["lid", "lid"],         brow: [-4, 3],   mouth: "smile" },
  peace:    { eye: ["happy", "happy"],     brow: [-1, 1],   mouth: "smile" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK => (lid >= 1 && k !== "happy" && k !== "squeeze" ? "dash" : lid > 0 ? halfLid(k) : k);
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
  }
};

const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 2 * u, my, 4.2 * u, 5 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
  }
};

// ---------------- Hairstyles & Hats ----------------
const drawHat = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 4.2 * u;
  const hat = o.hat ?? "none";

  if (hat === "salakot") {
    const col = o.hatCol ?? "#d4ae66";
    const brY = crown + 16 * u;
    const cone: P2[] = [[cx - 74 * u, brY + 6 * u], [cx, brY - 36 * u], [cx + 74 * u, brY + 6 * u]];
    p.shadedFill(cone, col, mul(col, SH_FELT), light, 72 * u, 0.3);
    p.poly(cone, null, ow);
    p.stroke([[cx, brY - 34 * u], [cx - 36 * u, brY + 4 * u]], 2.2 * u, "#8a6632");
    p.stroke([[cx, brY - 34 * u], [cx + 36 * u, brY + 4 * u]], 2.2 * u, "#8a6632");
    p.ell(cx, brY - 37 * u, 6 * u, 4.5 * u, "#e4bc48", 2.4 * u);
    return;
  }

  if (hat === "fedora") {
    const col = o.hatCol ?? "#685446";
    const brY = crown + 16 * u;
    p.ell(cx, brY + 4 * u, 68 * u, 11 * u, col, ow);
    const dome = ellPts(cx, brY, 44 * u, 28 * u, 180, 360);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 44 * u, 0.35);
    p.poly(dome, null, ow);
    p.poly(rrect(cx - 43 * u, brY - 8 * u, cx + 43 * u, brY + 2 * u, 3 * u), "#2e2420", 2.4 * u);
    return;
  }

  if (hat === "ribbon" && o.hair) {
    // Clara's iconic sleek dark bob hair + crimson vintage ribbon bow!
    p.ell(cx, crown + 19 * u, 53 * u, 28 * u, o.hair, ow * 0.85, 180, 360);
    if (side) {
      p.ell(cx - 40 * u, hc + 8 * u, 18 * u, 36 * u, o.hair, ow * 0.8, 0, 360, 12);
    } else {
      p.ell(cx - 46 * u, hc - 2 * u, 11 * u, 30 * u, o.hair, ow * 0.78, 0, 360, 8);
      p.ell(cx + 46 * u, hc - 2 * u, 11 * u, 30 * u, o.hair, ow * 0.78, 0, 360, -8);
    }
    const rb = o.hatCol ?? "#b8444a";
    p.ell(cx - 17 * u, crown - 4 * u, 15 * u, 9 * u, rb, ow * 0.7, 0, 360, -16);
    p.ell(cx + 17 * u, crown - 4 * u, 15 * u, 9 * u, rb, ow * 0.7, 0, 360, 16);
    p.ell(cx, crown - 2 * u, 7 * u, 7 * u, shade(rb, 1.12), ow * 0.65);
    return;
  }

  if (hat === "messy" && o.hair) {
    // Mateo's youthful modern windswept teen hair
    const cut = crown + 0.34 * HH;
    const keep = (x: number, y: number) => y < cut || (side && x < cx - 8 * u && y < hc + 0.24 * H.b);
    const n = hp.length, sIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(sIdx), ...hp.slice(0, sIdx)].filter(([x, y]) => keep(x, y)).map(([x, y]) => [cx + (x - cx) * 1.05, hc + (y - hc) * 1.05] as P2);
    if (arc.length >= 3) { p.shadedFill(arc, o.hair, mul(o.hair, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.85); }
    p.poly([[cx - 24 * u, crown + 4 * u], [cx + 4 * u, crown - 16 * u], [cx + 28 * u, crown + 10 * u]], o.hair, ow * 0.75);
    p.poly([[cx - 42 * u, crown + 16 * u], [cx - 22 * u, crown - 8 * u], [cx - 4 * u, crown + 18 * u]], o.hair, ow * 0.72);
    return;
  }

  if (hat === "bun" && o.hair) {
    p.ell(cx + (side ? -42 * u : 0), crown + (side ? 16 * u : -6 * u), 21 * u, 19 * u, o.hair, ow * 0.85);
  }
  if (o.hair) {
    const cut = crown + 0.34 * HH;
    const keep = (x: number, y: number) => y < cut || (side && x < cx - 8 * u && y < hc + 0.24 * H.b);
    const n = hp.length, sIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(sIdx), ...hp.slice(0, sIdx)].filter(([x, y]) => keep(x, y)).map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length >= 3) { p.shadedFill(arc, o.hair, mul(o.hair, SH_FELT), light, H.a, 0.35); p.poly(arc, null, ow * 0.85); }
  }
};

const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, o: Outfit) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing, skin = o.skin ?? SKIN;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - 19 * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 4.6 * u, 2.4 * u);
  }
  if (o.glasses) {
    for (const side of [-1, 1]) p.ell(fx + side * ex, ey, 14 * u, 12 * u, null, 2.8 * u);
    p.stroke([[fx - 2 * u, ey], [fx + 2 * u, ey]], 2.8 * u, INK);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (o.moustache) {
    for (const s of [-1, 1])
      taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * 16 * u, cy + 15 * u], 4.5 * u, 1.8 * u, o.moustache);
  }
  if (expr === "nervous") p.ell(cx + 38 * u * (facing || 1), cy - 18 * u, 3.4 * u, 5.8 * u, "#9fd4ff", 2 * u);
};

const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, o: Outfit) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy, skin = o.skin ?? SKIN;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - 19 * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 4.6 * u, 2.4 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (o.moustache) taper(p, [hx + 42 * u, hy + 13.5 * u], [hx + 22 * u, hy + 11.5 * u], 5.2 * u, 1.8 * u, o.moustache);
};

// ---------------- Bodies ----------------
export type Prop = null | "watch" | "basket" | "photo" | "lantern" | "book";
export type FrontMode = "walk" | "run" | "stand" | "sit" | "kneel" | "reach" | "point" | "shrug" | "wave" | "checkHands" | "lookUp";

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.10, legs: 1.40, tw: 0.80 },
  teen:  { a: 115, torso: 1.02, legs: 1.32, tw: 0.74 },
  elder: { a: 114, torso: 1.06, legs: 1.30, tw: 0.78 },
};

export type FrontOpts = {
  phase?: number;
  expr?: Expr;
  mode?: FrontMode;
  look?: number;
  blink?: boolean | number;
  prop?: Prop;
  tilt?: number;
  headTilt?: number;
  light?: number;
  facing?: -1 | 0 | 1;
  seed?: number;
  ghostAlpha?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

const drawTorsoDetails = (p: Pen, o: Outfit, tcx: number, chin: number, torsoBot: number, HH: number, T: Blob, u: number, facing: number) => {
  if (o.collar) {
    p.poly([[tcx - 16 * u, chin - 4 * u], [tcx + 16 * u, chin - 4 * u], [tcx + 2 * u * facing, chin + 22 * u]], o.collar, 2 * u);
  }
  if (o.hoodie) {
    // Hoodie drawstrings + dark backpack shoulder straps
    p.stroke([[tcx - 8 * u, chin + 10 * u], [tcx - 10 * u, chin + 40 * u]], 2.6 * u, "#f0ece2");
    p.stroke([[tcx + 8 * u, chin + 10 * u], [tcx + 10 * u, chin + 40 * u]], 2.6 * u, "#f0ece2");
    p.stroke([[tcx - 28 * u, chin + 4 * u], [tcx - 32 * u, torsoBot - 18 * u]], 6.5 * u, "#2c3442");
    p.stroke([[tcx + 28 * u, chin + 4 * u], [tcx + 32 * u, torsoBot - 18 * u]], 6.5 * u, "#2c3442");
  }
  if (o.crestBadge) {
    // Mateo's small crimson-gold sun emblem patch on chest (matches the 1970s photo back seal!)
    p.ell(tcx + 16 * u, chin + 38 * u, 9.5 * u, 9.5 * u, "#b8362e", 2.2 * u);
    p.ell(tcx + 16 * u, chin + 38 * u, 4.5 * u, 4.5 * u, "#f4cb58", 0);
  }
  if (o.sash) {
    p.poly([[tcx - T.a * 1.05, torsoBot - 22 * u], [tcx + T.a * 1.05, torsoBot - 22 * u], [tcx + T.a * 1.05, torsoBot - 4 * u], [tcx - T.a * 1.05, torsoBot - 4 * u]], o.sash, 2.2 * u);
  }
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "stand", look = 0, blink = false, prop = null, tilt = 0, headTilt = 0,
    light = DEF_LIGHT, facing = 0, seed = 1, ghostAlpha = 1 } = opts;
  const g = p.g;
  if (ghostAlpha < 1) { g.save(); g.globalAlpha = ghostAlpha; }
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  const bob = mode === "walk" ? 0.022 * tall * Math.cos(2 * two * phase) : mode === "run" ? 0.035 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" || mode === "kneel" ? sole - 0.34 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;

  // ---- legs ----
  p.rot = null;
  if (mode === "sit" || mode === "kneel") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 38 * u, hipY + 0.16 * HH], f: P2 = [300 + side * 36 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 3 * u], footW, footCol);
    }
  } else {
    const L = mode === "run" ? 64 : mode === "walk" ? 42 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * (20 + (mode === "run" ? 12 : 0)) * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.15), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }

  // ---- upper body ----
  const sway = mode === "walk" ? 1.5 * Math.sin(two * phase) : mode === "run" ? 4.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const T: Blob = {
    a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
    nTop: 2.2, nBot: 2.6, egg: 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7,
  };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "walk" || mode === "run" ? Math.sin(two * phase) : 0;

  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "reach") {
    const dir = facing < 0 ? -1 : 1;
    arms.push({ pts: hang(-dir, 0), front: false });
    arms.push({ pts: [sh(dir), [tcx + dir * (1.22 * T.a + 18 * u), chin + 0.24 * HH], [tcx + dir * (1.62 * T.a + 44 * u), chin + 0.14 * HH]], front: true });
  } else if (mode === "checkHands") {
    for (const side of [-1, 1]) {
      arms.push({ pts: [sh(side), [tcx + side * (1.16 * T.a + 16 * u), chin + 0.40 * HH], [tcx + side * (0.90 * T.a + 18 * u), chin + 0.08 * HH]], front: true });
    }
  } else if (mode === "shrug") {
    for (const side of [-1, 1]) {
      arms.push({ pts: [sh(side), [tcx + side * (1.18 * T.a + 14 * u), chin + 0.44 * HH], [tcx + side * (1.42 * T.a + 28 * u), chin + 0.12 * HH]], front: true });
    }
  } else if (mode === "wave") {
    const w = 16 * u * Math.sin(two * phase * 2);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [sh(1), [tcx + 1.20 * T.a + 18 * u, chin + 0.08 * HH], [tcx + 1.34 * T.a + 28 * u + w, chin - 0.30 * HH]], front: true });
  } else if (mode === "point") {
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [sh(1), [tcx + 1.18 * T.a + 20 * u, chin + 0.08 * HH], [tcx + 1.56 * T.a + 44 * u, chin - 0.08 * HH]], front: true });
  } else if (prop === "watch" || prop === "photo" || prop === "book") {
    arms.push({ pts: [sh(-1), [tcx - 1.12 * T.a - 10 * u, chin + 0.42 * HH], [tcx - 0.34 * T.a, chin + 0.36 * HH]], front: true });
    arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 10 * u, chin + 0.42 * HH], [tcx + 0.34 * T.a, chin + 0.36 * HH]], front: true });
  } else if (prop === "lantern" || prop === "basket") {
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [sh(1), [tcx + 1.14 * T.a + 14 * u, chin + 0.38 * HH], [tcx + 1.12 * T.a + 22 * u, chin + 0.58 * HH]], front: true });
  } else {
    arms.push({ pts: hang(-1, sw), front: sw > 0 });
    arms.push({ pts: hang(1, -sw), front: sw <= 0 });
  }

  const drawArm = (pts: [P2, P2, P2]) => { p.stroke(curve(pts[0], pts[1], pts[2]), 5.4 * u, armCol); p.dot(pts[2][0], pts[2][1], 6.4 * u, INK); };
  arms.filter((a) => !a.front).forEach((a) => drawArm(a.pts));

  // Vintage dress skirt if present (Clara & townswomen)
  if (o.dress) {
    const skirt: P2[] = [[tcx - T.a * 0.96, torsoBot - 16 * u], [tcx + T.a * 0.96, torsoBot - 16 * u],
      [tcx + T.a * 1.44, torsoBot + 0.62 * HH], [tcx - T.a * 1.44, torsoBot + 0.62 * HH]];
    p.gradFill(skirt, o.dress, mul(o.dress, SH_CLOTH), light, 0.28);
    p.poly(skirt, null, ow * 0.92);
  }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light, 0.25);
  p.clip(tp, () => drawTorsoDetails(p, o, tcx, chin, torsoBot, HH, T, u, facing));
  p.inkRing(tp, ow, thick, 0.45);
  arms.filter((a) => a.front).forEach((a) => drawArm(a.pts));

  // ---- hand props ----
  if (prop === "photo") {
    p.poly(rrect(tcx - 28 * u, chin + 12 * u, tcx + 28 * u, chin + 72 * u, 4 * u), "#efe2c6", 3 * u);
    p.poly(rrect(tcx - 20 * u, chin + 18 * u, tcx + 20 * u, chin + 56 * u, 2 * u), "#b8966b", 2 * u);
  } else if (prop === "basket") {
    const bx = tcx + 1.12 * T.a + 22 * u, by = chin + 0.68 * HH;
    p.arc(bx, by - 14 * u, 16 * u, 16 * u, 180, 360, 3.2 * u, "#8a6234");
    p.poly([[bx - 22 * u, by - 10 * u], [bx + 22 * u, by - 10 * u], [bx + 16 * u, by + 20 * u], [bx - 16 * u, by + 20 * u]], "#c89652", 3 * u);
  } else if (prop === "watch") {
    p.ell(tcx, chin + 34 * u, 13 * u, 13 * u, "#2e3542", 3 * u);
    p.ell(tcx, chin + 34 * u, 9 * u, 9 * u, "#eef6ff", 1.5 * u);
  } else if (prop === "lantern") {
    const lx = tcx + 1.14 * T.a + 24 * u, ly = chin + 0.68 * HH;
    p.poly(rrect(lx - 13 * u, ly - 16 * u, lx + 13 * u, ly + 18 * u, 5 * u), "#ffd66e", 3 * u);
    p.poly([[lx - 16 * u, ly - 16 * u], [lx + 16 * u, ly - 16 * u], [lx, ly - 28 * u]], "#42332c", 2.8 * u);
  }

  // ---- head ----
  const hRot = headTilt + (mode === "lookUp" ? -14 : 0);
  const ht = hRot ? rad(hRot) : 0;
  if (ht) {
    const pivot = A ? rotAbout([tcx, chin], rad(A), [300, hipY]) : ([tcx, chin] as P2);
    p.rot = [rad(A) + ht, pivot[0], pivot[1], pivot[0] - tcx, pivot[1] - chin];
  }
  const hp = blobPts(tcx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick, 0.45);
  faceFront(p, tcx, hc + 0.02 * H.b, W, expr, facing, look, lid, o);
  drawHat(p, o, hp, H, tcx, hc, light, false);
  p.rot = null;
  if (ghostAlpha < 1) g.restore();
};

export type SideOpts = {
  phase?: number;
  expr?: Expr;
  mode?: "walk" | "run" | "stand";
  blink?: boolean | number;
  light?: number;
  lean?: number;
  seed?: number;
  ghostAlpha?: number;
};

export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "walk", blink = false, light = DEF_LIGHT, lean, seed = 1, ghostAlpha = 1 } = opts;
  const g = p.g;
  if (ghostAlpha < 1) { g.save(); g.globalAlpha = ghostAlpha; }
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, 1), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  const bob = mode === "stand" ? 0 : (mode === "run" ? 0.04 : 0.026) * tall * Math.cos(2 * two * phase);
  const torsoBot = sole - Bd.legs * HH + bob, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;

  p.rot = null;
  const stride = mode === "stand" ? 0 : mode === "run" ? 90 : 62;
  const lift = mode === "stand" ? 0 : mode === "run" ? 66 : 36;
  for (const ph of [0.5, 0]) {
    const a = two * (phase + ph);
    const fx = 300 + Math.sin(a) * stride, fy = sole - 4 * u - Math.max(0, -Math.cos(a)) * lift;
    const kx = 300 + (fx - 300) * 0.52 + (mode === "stand" ? 4 * u : 14 * u), ky = (hipY + fy) * 0.5 - Math.max(0, -Math.cos(a)) * 14;
    p.stroke(curve([300, hipY], [kx, ky], [fx, fy]), legW, legCol);
    footStroke(p, [fx - 4 * u, fy], [fx + 14 * u, fy], footW, footCol);
  }

  const ln = lean ?? (mode === "run" ? 10 : mode === "walk" ? 4.5 : 0);
  p.rot = ln ? [rad(ln), 300, hipY] : null;
  const T: Blob = { a: 0.34 * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: 0.1, asym: 0.08, rot: 0, noise: 0.006, seed: seed + 9 };
  const tcx = 302, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sw = mode === "stand" ? 0 : Math.sin(two * phase) * (mode === "run" ? 58 : 38);
  const drawSideArm = (s: number) => {
    const shP: P2 = [tcx, chin + 0.15 * HH], elP: P2 = [tcx + s * 0.55 - 4 * u, chin + 0.58 * HH], haP: P2 = [tcx + s, chin + 0.96 * HH - Math.abs(s) * 0.18];
    p.stroke(curve(shP, elP, haP), 5.4 * u, armCol);
    p.dot(haP[0], haP[1], 6.4 * u, INK);
  };
  drawSideArm(-sw);
  if (o.dress) {
    const sk: P2[] = [[tcx - T.a * 0.9, torsoBot - 16 * u], [tcx + T.a * 0.9, torsoBot - 16 * u], [tcx + T.a * 1.4, torsoBot + 0.60 * HH], [tcx - T.a * 1.4, torsoBot + 0.60 * HH]];
    p.gradFill(sk, o.dress, mul(o.dress, SH_CLOTH), light, 0.28); p.poly(sk, null, ow * 0.9);
  }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light, 0.25);
  p.inkRing(tp, ow, thick, 0.45);
  drawSideArm(sw);

  const hp = blobPts(tcx + 4 * u, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick, 0.45);
  faceSide(p, tcx + 4 * u, hc + 0.02 * H.b, W, expr, lid, o);
  drawHat(p, o, hp, H, tcx + 4 * u, hc, light, true);
  p.rot = null;
  if (ghostAlpha < 1) g.restore();
};

// ---------------- 2D Effect Cards (ZERO TEXT!) ----------------
export const fxContact = (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(128, 128, 12, 128, 128, 118);
  gr.addColorStop(0, "rgba(42,36,52,0.52)"); gr.addColorStop(0.55, "rgba(42,36,52,0.28)"); gr.addColorStop(1, "rgba(42,36,52,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

export const fxShadow = (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(128, 128, 16, 128, 128, 118);
  gr.addColorStop(0, "rgba(48,44,68,0.34)"); gr.addColorStop(0.7, "rgba(48,44,68,0.14)"); gr.addColorStop(1, "rgba(48,44,68,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

/** Frozen wristwatch close-up FX card (hands frozen at 8:15, ZERO text!) */
export const fxFrozenWatch = (p: Pen, twitch = 0) => {
  const g = p.g;
  // Soft warm glow behind watch
  const gl = g.createRadialGradient(128, 128, 22, 128, 128, 122);
  gl.addColorStop(0, "rgba(255,232,168,0.55)"); gl.addColorStop(1, "rgba(255,232,168,0)");
  g.fillStyle = gl; g.fillRect(0, 0, 256, 256);
  // Dark watch strap top & bottom
  p.poly(rrect(94, 10, 162, 246, 10), "#2e3545", 7);
  // Watch bezel
  p.ell(128, 128, 74, 74, "#465066", 8);
  p.ell(128, 128, 60, 60, "#f8f4e8", 5);
  // 12 crisp tick marks (no numbers!)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    p.stroke([[128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44], [128 + Math.cos(a) * 54, 128 + Math.sin(a) * 54]], i % 3 === 0 ? 5 : 3, INK);
  }
  // Hour & Minute hands frozen at 8:15 + subtle twitching red second hand!
  p.stroke([[128, 128], [128 - 28, 128 + 16]], 7, INK);
  p.stroke([[128, 128], [128 + 42, 128]], 5.5, INK);
  const sa = -Math.PI / 3 + twitch * 0.08;
  p.stroke([[128, 128], [128 + Math.cos(sa) * 46, 128 + Math.sin(sa) * 46]], 3, "#d43832");
  p.dot(128, 128, 6, INK);
};

/** Warm glowing firefly orb (Shots 8, 9) */
export const fxFirefly = (p: Pen, col = "#ffe680") => {
  const g = p.g, gr = g.createRadialGradient(64, 64, 4, 64, 64, 58);
  gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.28, col); gr.addColorStop(0.65, "rgba(255,210,96,0.28)"); gr.addColorStop(1, "rgba(255,210,96,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** Golden floating petal (Shot 7 passage of time) */
export const fxPetal = (p: Pen, col = "#f5b8a4") => {
  p.ell(64, 64, 24, 12, col, 4, 0, 360, -28);
};

/** Soft luminous ethereal smoke/fade wisps around Clara's hand (Shot 10) */
export const fxFadeWisp = (p: Pen, col = "#c6f0ff") => {
  const g = p.g;
  for (const [cx, cy, r] of [[96, 150, 52], [148, 120, 62], [124, 82, 48]] as const) {
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, r);
    gr.addColorStop(0, "rgba(255,255,255,0.75)");
    gr.addColorStop(0.45, col);
    gr.addColorStop(1, "rgba(180,235,255,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  }
};

/** Subtle glowing ECG heartbeat pulse wave across the storm sky (Shot 10, pure waveform, ZERO text!) */
export const fxHeartPulse = (p: Pen, phase = 0) => {
  const g = p.g;
  g.lineCap = "round"; g.lineJoin = "round";
  const pts: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const u = i / 48;
    const x = 16 + u * 480;
    const d = ((u - phase) % 1 + 1) % 1;
    let y = 128;
    if (d > 0.35 && d < 0.40) y -= 22 * Math.sin(((d - 0.35) / 0.05) * Math.PI);
    else if (d >= 0.42 && d < 0.45) y += 26;
    else if (d >= 0.45 && d < 0.50) y -= 94 * Math.sin(((d - 0.45) / 0.05) * Math.PI);
    else if (d >= 0.50 && d < 0.54) y += 40 * Math.sin(((d - 0.50) / 0.04) * Math.PI);
    else if (d >= 0.58 && d < 0.66) y -= 24 * Math.sin(((d - 0.58) / 0.08) * Math.PI);
    pts.push([x, y]);
  }
  g.strokeStyle = "rgba(120,235,255,0.35)"; g.lineWidth = 18;
  p.path(pts, false); g.stroke();
  g.strokeStyle = "#d8fbff"; g.lineWidth = 6;
  p.path(pts, false); g.stroke();
};

/** Radiant starburst sparkle (Shots 4, 10, 12, 13) */
export const fxSparkle = (p: Pen, col = "#ffe68a") => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 6, 128, 128, 118);
  gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.35, col); gr.addColorStop(1, "rgba(255,230,138,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  p.poly([[128, 22], [142, 114], [234, 128], [142, 142], [128, 234], [114, 142], [22, 128], [114, 114]], "#ffffff", 0);
};
