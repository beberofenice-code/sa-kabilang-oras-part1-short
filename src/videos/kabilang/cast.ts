// Cast staging & canvas sprite pool for "Sa Kabilang Oras (Part 1)".
// Every character card uses cardShade() (scene light tint + shadow floor + sun-side gradient + golden inner rim)
// and sits on the NOINK layer so world ink never outlines sprite quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide,
  MATEO, CLARA, KUTSERO, LIBRARIAN, townsfolk,
  fxContact, fxShadow, fxFrozenWatch, fxFirefly, fxPetal, fxFadeWisp, fxHeartPulse, fxSparkle,
  Outfit, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, clamp01, smooth,
  F_CAR_APPROACH, F_CAR_IMPACT, F_WAKE_UP, F_NO_SCRATCH,
  F_WATCH_STOP, F_CLARA_APPEAR, F_OKAY_KA_LANG, F_NOTICE_CLOCK,
  F_FALL_IN_LOVE, F_STAY_FOREVER, F_SKY_SIREN, F_HEART_MACHINE,
  F_HOLD_HAND, F_HAND_GLOW, F_FADE_SMOKE, F_OLD_PHOTO,
  F_PHOTO_BACK, F_LIGHT_OPEN, F_WHO_IS_CLARA, F_PART_TWO,
} from "./story";
import { LIGHTS, LightMode } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r); else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216;
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  setOpacity(op: number) {
    const fade = op < 0.99;
    this.mat.transparent = fade;
    this.mat.alphaTest = fade ? 0.04 : 0.5;
    this.mat.opacity = op;
    this.mat.depthWrite = !fade;
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}

export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t;
      this.mesh.material = this.blob;
      this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t;
      this.soft.map = t;
      this.mesh.renderOrder = 0;
    }
  }
}

export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; roll?: number; size: [number, number, number];
  shadow?: boolean; opacity?: number;
};
export type FxPlace = {
  key: string; cw: number; ch: number; draw: (p: Pen) => void;
  x: number; y: number; z: number; w: number; h: number;
  flat?: boolean; rot?: number; soft?: boolean;
};
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 24) => Math.round(v * n) / n;
const tier = (d: number): [number, number, number] =>
  d < 3.4 ? [660, 1100, 1.1] : d < 7.0 ? [480, 800, 0.8] : d < 18 ? [300, 500, 0.5] : [180, 300, 0.3];

const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number, swaps: number[] = []) => {
  for (const sf of swaps) { const k = f - sf + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-50 * hh(i, 9));
  for (let n = 0; s <= f && n < 300; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(22 + 48 * hh(i * 31 + n, 13));
  }
  return 0;
};

const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = cam.sun.dot(cam.right) * (mirror ? -1 : 1), sy = -cam.sun.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const tmp = new THREE.Vector3();

const makeFront = (
  cam: CamInfo, o: Outfit, okey: string, seed: number,
  x: number, y: number, z: number, fo: FrontOpts, scale = 1, roll = 0, shadow = true
): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.1, z)) / scale;
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { ...fo, light: light2D(cam, false), seed };
  return { key: `F|${okey}|${fkey(f2)}`, x, y, z, scale, roll, shadow, size: [w, h, k], draw: (p) => bodyFront(p, o, f2) };
};

const makeSide = (
  cam: CamInfo, o: Outfit, okey: string, seed: number,
  x: number, y: number, z: number, so: SideOpts, mirror = false, scale = 1, roll = 0, shadow = true
): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.1, z)) / scale;
  const [w, h, k] = tier(d);
  const s2: SideOpts = { ...so, light: light2D(cam, mirror), seed };
  return { key: `S|${okey}|${fkey(s2)}`, x, y, z, scale, mirror, roll, shadow, size: [w, h, k], draw: (p) => bodySide(p, o, s2) };
};

export function stageShot(id: number, f: number, light: LightMode, cam: CamInfo): { actors: Place[]; fx: FxPlace[] } {
  const actors: Place[] = [];
  const fx: FxPlace[] = [];
  const t = f / FPS;

  // ==================== SHOT 1: Night Road Crash -> Wakes Unharmed ====================
  if (id === 1) {
    if (f < F_CAR_IMPACT + 3) {
      const walkU = clamp01(f / 65);
      const shocked = f >= F_CAR_APPROACH + 20;
      actors.push(makeFront(cam, MATEO, "mat1a", 1, 1.4 - walkU * 1.1, 0, 0.5, {
        mode: shocked ? "stand" : "walk",
        phase: t * 1.1,
        expr: shocked ? "shock" : "neutral",
        look: shocked ? -1.0 : -0.3,
        facing: -1,
        headTilt: shocked ? -8 : 0,
        blink: lidAt(f, 1, [F_CAR_APPROACH + 20]),
      }, 1.0));
    } else {
      // After white flash: Mateo wakes up sitting on the road, then stands checking his hands with ZERO scratches!
      const standing = f >= F_WAKE_UP + 32;
      const checking = f >= F_NO_SCRATCH - 16;
      actors.push(makeFront(cam, MATEO, "mat1b", 1, 0.0, 0, 0.5, {
        mode: checking ? "checkHands" : standing ? "stand" : "sit",
        expr: checking ? "awe" : "nervous",
        look: checking ? 0 : 0.3,
        headTilt: checking ? 5 : -4,
        blink: lidAt(f, 1, [F_WAKE_UP, F_NO_SCRATCH]),
      }, 1.0));
    }
  }

  // ==================== SHOT 2: Empty Dawn Street & Frozen Wristwatch ====================
  if (id === 2) {
    const checkWatch = f >= F_WATCH_STOP - 14;
    actors.push(makeFront(cam, MATEO, "mat2", 1, -0.35, 0, 0.6, {
      mode: checkWatch ? "stand" : "shrug",
      prop: checkWatch ? "watch" : null,
      expr: checkWatch ? "awe" : "nervous",
      look: checkWatch ? 0.5 : -0.4,
      headTilt: checkWatch ? 6 : -5,
      blink: lidAt(f, 1, [F_WATCH_STOP]),
    }, 1.0));
    if (checkWatch) {
      const pop = smooth((f - (F_WATCH_STOP - 14)) / 14);
      const twitch = Math.sin(t * 14) > 0.7 ? 1 : 0;
      fx.push({
        key: `watch_${twitch}`, cw: 256, ch: 256, draw: (p) => fxFrozenWatch(p, twitch),
        x: 0.78, y: 1.92 + Math.sin(t * 2.5) * 0.04, z: 1.15, w: 1.24 * pop, h: 1.24 * pop, soft: true,
      });
    }
  }

  // ==================== SHOT 3: Sunlit Vintage Plaza & Kalesa ====================
  if (id === 3) {
    // Mateo standing in awe in foreground right of plaza
    actors.push(makeFront(cam, MATEO, "mat3", 1, 2.6, 0, 2.4, {
      mode: "stand", expr: "awe", look: -0.7, facing: -1, blink: lidAt(f, 1),
    }, 1.0));
    // Kutsero riding visibly on the front bench of the moving kalesa
    const ku = clamp01((f - 390) / 180);
    const kx = -9.8 + ku * 15.2;
    actors.push(makeSide(cam, KUTSERO, "kut3", 5, kx + 0.55, 1.15, -0.78, {
      mode: "stand", expr: "smile", blink: lidAt(f, 5),
    }, false, 0.94, 0, false));
    // Vintage townsfolk strolling peacefully across the square
    actors.push(makeFront(cam, townsfolk(0), "tf3a", 31, -4.8, 0, -4.2, { mode: "stand", expr: "smile", blink: lidAt(f, 31) }, 0.96));
    actors.push(makeFront(cam, townsfolk(1), "tf3b", 32, -3.5, 0, -4.5, { mode: "stand", expr: "talk", blink: lidAt(f, 32) }, 0.94));
    actors.push(makeSide(cam, townsfolk(2), "tf3c", 33, 5.2 - ku * 2.4, 0, -7.8, { mode: "walk", phase: t * 0.9, expr: "neutral", blink: lidAt(f, 33) }, true, 0.94));
  }

  // ==================== SHOT 4: First Meeting — Clara ("Okay ka lang?") ====================
  if (id === 4) {
    const sawClara = f >= F_CLARA_APPEAR - 8;
    const asking = f >= F_OKAY_KA_LANG - 10;
    actors.push(makeFront(cam, MATEO, "mat4", 1, -0.72, 0, 0.45, {
      mode: "sit",
      expr: sawClara ? "awe" : "nervous",
      look: 0.9,
      facing: 1,
      headTilt: -6,
      blink: lidAt(f, 1, [F_CLARA_APPEAR, F_OKAY_KA_LANG]),
    }, 1.0));
    actors.push(makeFront(cam, CLARA, "cla4", 2, 0.62, 0, 0.62, {
      mode: asking ? "reach" : "kneel",
      expr: asking ? "talk" : "gentle",
      prop: asking ? null : "basket",
      look: -0.8,
      facing: -1,
      headTilt: 5,
      blink: lidAt(f, 2, [F_OKAY_KA_LANG]),
    }, 1.0));
    for (let i = 0; i < 3; i++) {
      const sc = 0.44 + 0.20 * Math.sin(t * 2.8 + i * 2.1);
      fx.push({
        key: `sp4_${i}`, cw: 256, ch: 256, draw: (p) => fxSparkle(p, "#ffe8a4"),
        x: -0.2 + i * 0.85, y: 2.55 + (i % 2) * 0.45 + Math.sin(t * 1.8 + i) * 0.1, z: -0.6,
        w: sc, h: sc, soft: true,
      });
    }
  }

  // ==================== SHOT 5: Old Town Market Lane ====================
  if (id === 5) {
    const u = clamp01((f - 710) / 126);
    const walkX = -3.8 + u * 6.8;
    actors.push(makeSide(cam, CLARA, "cla5", 2, walkX + 1.25, 0, 0.3, {
      mode: "walk", phase: t * 1.15, expr: "smile", blink: lidAt(f, 2),
    }, false, 1.0));
    actors.push(makeSide(cam, MATEO, "mat5", 1, walkX - 0.35, 0, 0.5, {
      mode: "walk", phase: t * 1.15 + 0.3, expr: "awe", blink: lidAt(f, 1),
    }, false, 1.0));
    for (let i = 0; i < 3; i++) {
      actors.push(makeFront(cam, townsfolk(i + 1), `ven5_${i}`, 40 + i, -4.5 + i * 4.5, 0.05, -2.5, {
        mode: i === 1 ? "wave" : "stand", phase: t * 0.8, expr: "smile", blink: lidAt(f, 40 + i),
      }, 0.94));
    }
  }

  // ==================== SHOT 6: Stopped Clock Tower ====================
  if (id === 6) {
    const lookUp = f >= F_NOTICE_CLOCK - 6;
    actors.push(makeFront(cam, MATEO, "mat6", 1, -0.65, 0, 1.4, {
      mode: lookUp ? "lookUp" : "stand",
      expr: lookUp ? "awe" : "neutral",
      look: 0.2,
      headTilt: lookUp ? -10 : 0,
      blink: lidAt(f, 1, [F_NOTICE_CLOCK]),
    }, 1.0));
    actors.push(makeFront(cam, CLARA, "cla6", 2, 0.85, 0, 1.2, {
      mode: "stand",
      expr: "gentle",
      prop: "basket",
      look: -0.6,
      facing: -1,
      blink: lidAt(f, 2),
    }, 1.0));
  }

  // ==================== SHOT 7: Golden Hillside — Days, Weeks, Months Passing ====================
  if (id === 7) {
    const u = clamp01((f - 964) / 128);
    const xPos = -3.4 + u * 6.4;
    actors.push(makeSide(cam, MATEO, "mat7", 1, xPos - 0.55, 0, 0.8, {
      mode: "walk", phase: t * 1.05, expr: "smile", blink: lidAt(f, 1),
    }, false, 1.0));
    actors.push(makeSide(cam, CLARA, "cla7", 2, xPos + 0.65, 0, 0.5, {
      mode: "walk", phase: t * 1.05 + 0.2, expr: "grin", blink: lidAt(f, 2),
    }, false, 1.0));
    for (let i = 0; i < 8; i++) {
      const px = -5.5 + ((i * 2.1 + t * 1.45) % 12.0);
      const py = 3.8 - ((t * 0.65 + i * 0.42) % 3.2);
      fx.push({
        key: `pet7_${i % 2}`, cw: 128, ch: 128, draw: (p) => fxPetal(p, i % 2 ? "#f7c48c" : "#f2a69c"),
        x: px, y: py, z: 1.8 - (i % 3) * 1.4, w: 0.34, h: 0.34, rot: t * 1.4 + i, soft: true,
      });
    }
  }

  // ==================== SHOT 8: River, Sunset Bridge, Laughing Under Tree ====================
  if (id === 8) {
    const u1 = clamp01((f - 1092) / 72);
    actors.push(makeSide(cam, MATEO, "mat8a", 1, -7.2 + u1 * 2.4, 0.32, 0.6, {
      mode: "walk", phase: t * 1.1, expr: "smile", blink: lidAt(f, 1),
    }, false, 0.98));
    actors.push(makeSide(cam, CLARA, "cla8a", 2, -6.1 + u1 * 2.4, 0.32, 0.3, {
      mode: "walk", phase: t * 1.1 + 0.25, expr: "smile", blink: lidAt(f, 2),
    }, false, 0.98));
    actors.push(makeFront(cam, MATEO, "mat8b", 1, -0.52, 0.82, 0.1, {
      mode: "stand", expr: "peace", look: 0.6, facing: 1, blink: lidAt(f, 11),
    }, 0.98));
    actors.push(makeFront(cam, CLARA, "cla8b", 2, 0.52, 0.82, 0.1, {
      mode: "stand", expr: "smile", look: -0.6, facing: -1, blink: lidAt(f, 12),
    }, 0.98));
    actors.push(makeFront(cam, MATEO, "mat8c", 1, 5.05, 0.32, -0.3, {
      mode: "wave", phase: t * 0.9, expr: "laugh", look: 0.7, facing: 1, headTilt: 5, blink: lidAt(f, 21),
    }, 0.98));
    actors.push(makeFront(cam, CLARA, "cla8c", 2, 6.05, 0.32, -0.2, {
      mode: "stand", expr: "laugh", look: -0.7, facing: -1, headTilt: -5, blink: lidAt(f, 22),
    }, 0.98));
  }

  // ==================== SHOT 9: Falling in Love Under Firefly Acacia ====================
  if (id === 9) {
    const bliss = f >= F_STAY_FOREVER - 6;
    const inLove = f >= F_FALL_IN_LOVE - 6;
    actors.push(makeFront(cam, MATEO, "mat9", 1, -0.58, 0.12, 0.42, {
      mode: "sit",
      expr: bliss ? "peace" : inLove ? "smile" : "gentle",
      look: 0.85,
      facing: 1,
      headTilt: 5,
      blink: lidAt(f, 1, [F_FALL_IN_LOVE]),
    }, 1.02));
    actors.push(makeFront(cam, CLARA, "cla9", 2, 0.56, 0.12, 0.42, {
      mode: "sit",
      expr: inLove ? "smile" : "gentle",
      look: -0.85,
      facing: -1,
      headTilt: -5,
      blink: lidAt(f, 2, [F_FALL_IN_LOVE]),
    }, 1.02));
    for (let i = 0; i < 14; i++) {
      const a = t * (0.65 + (i % 3) * 0.25) + i * 1.1;
      const fxX = Math.sin(a) * (1.4 + (i % 4) * 0.65);
      const fxY = 1.05 + (i % 5) * 0.48 + Math.cos(a * 1.3) * 0.25;
      const fxZ = -0.8 + ((i % 3) - 1) * 0.85;
      const sc = 0.28 + 0.14 * Math.sin(t * 4.5 + i);
      fx.push({
        key: `ff9_${i % 2}`, cw: 128, ch: 128, draw: (p) => fxFirefly(p, i % 2 ? "#ffe880" : "#ffd268"),
        x: fxX, y: fxY, z: fxZ, w: sc, h: sc, soft: true,
      });
    }
  }

  // ==================== SHOT 10: Sky Siren, Heart Machine & Clara Fading Like Smoke ====================
  if (id === 10) {
    const hearSky = f >= F_SKY_SIREN - 12 && f < F_HOLD_HAND - 6;
    const reaching = f >= F_HOLD_HAND - 6;
    const glowing = f >= F_HAND_GLOW - 4;
    const fading = f >= F_FADE_SMOKE - 8;
    const claraOp = fading ? Math.max(0.42, 1.0 - smooth((f - (F_FADE_SMOKE - 8)) / 26) * 0.58) : glowing ? 0.84 : 1.0;

    actors.push(makeFront(cam, MATEO, "mat10", 1, -0.62, 0, 0.6, {
      mode: reaching ? "reach" : hearSky ? "lookUp" : "stand",
      expr: fading ? "shock" : glowing ? "worried" : hearSky ? "nervous" : "neutral",
      look: reaching ? 0.9 : 0.2,
      facing: 1,
      headTilt: hearSky ? -12 : 0,
      blink: lidAt(f, 1, [F_SKY_SIREN, F_HAND_GLOW, F_FADE_SMOKE]),
    }, 1.0));
    const claraPlace = makeFront(cam, CLARA, "cla10", 2, 0.68, 0, 0.62, {
      mode: reaching ? "reach" : "stand",
      expr: fading ? "sadSmile" : glowing ? "worried" : "gentle",
      look: -0.9,
      facing: -1,
      blink: lidAt(f, 2, [F_HAND_GLOW]),
    }, 1.0);
    claraPlace.opacity = claraOp;
    actors.push(claraPlace);

    if (f >= F_HEART_MACHINE - 12 && f < F_HOLD_HAND + 10) {
      const ph = q((t * 0.75) % 1, 16);
      fx.push({
        key: `ecg_${ph}`, cw: 512, ch: 256, draw: (p) => fxHeartPulse(p, ph),
        x: 0.0, y: 6.4, z: -9.5, w: 9.8, h: 3.4, soft: true,
      });
    }
    if (glowing) {
      const u = smooth((f - (F_HAND_GLOW - 4)) / 24);
      for (let i = 0; i < 4; i++) {
        const wy = 1.25 + i * 0.34 + u * 0.38 + Math.sin(t * 3 + i) * 0.08;
        const wx = 0.28 + (i % 2 ? 0.28 : -0.18) + Math.cos(t * 2.5 + i) * 0.1;
        const sc = 0.44 + u * 0.32;
        fx.push({
          key: `wisp_${i % 2}`, cw: 256, ch: 256, draw: (p) => fxFadeWisp(p, i % 2 ? "#c2f0ff" : "#fff0cc"),
          x: wx, y: wy, z: 0.85, w: sc, h: sc, soft: true,
        });
      }
    }
  }

  // ==================== SHOT 11: Vintage Library — Finding 1970s Photo ====================
  if (id === 11) {
    const foundPhoto = f >= F_OLD_PHOTO - 12;
    actors.push(makeFront(cam, MATEO, "mat11", 1, -0.35, 0, 1.35, {
      mode: "stand",
      prop: foundPhoto ? "photo" : "book",
      expr: foundPhoto ? "awe" : "neutral",
      look: 0.3,
      headTilt: foundPhoto ? -5 : 4,
      blink: lidAt(f, 1, [F_OLD_PHOTO]),
    }, 1.0));
    actors.push(makeFront(cam, LIBRARIAN, "lib11", 6, 3.6, 0, -1.8, {
      mode: "stand", expr: "neutral", prop: "book", look: -0.6, facing: -1, blink: lidAt(f, 6),
    }, 0.96));
  }

  // ==================== SHOT 12: Dramatic 1970s Photo Front & Back Reveal ====================
  if (id === 12) {
    const flipped = f >= F_PHOTO_BACK;
    actors.push(makeFront(cam, MATEO, "mat12", 1, -1.35, 0.18, -0.85, {
      mode: flipped ? "shrug" : "stand",
      expr: flipped ? "shock" : "awe",
      look: 0.9,
      facing: 1,
      headTilt: flipped ? -8 : 4,
      blink: lidAt(f, 1, [F_PHOTO_BACK]),
    }, 1.02));
    if (flipped) {
      const sp = smooth((f - F_PHOTO_BACK) / 14);
      // Small corner glint so the crimson-gold family crest seal stays 100% unobstructed!
      fx.push({
        key: "sp12", cw: 256, ch: 256, draw: (p) => fxSparkle(p, "#ffdf78"),
        x: 0.48, y: 2.52, z: 0.34, w: 0.48 * sp, h: 0.48 * sp, soft: true,
      });
    }
  }

  // ==================== SHOT 13: PART 1 CLIFFHANGER — Road Quake & Blinding Rift ====================
  if (id === 13) {
    const riftOpen = f >= F_LIGHT_OPEN;
    const farewell = f >= F_WHO_IS_CLARA - 8;
    const endPart1 = f >= F_PART_TWO - 6;
    actors.push(makeFront(cam, MATEO, "mat13", 1, -0.92, 0, 1.25, {
      mode: farewell ? "reach" : "stand",
      expr: endPart1 ? "shock" : riftOpen ? "worried" : "shock",
      look: 0.9,
      facing: 1,
      headTilt: -4,
      blink: lidAt(f, 1, [F_LIGHT_OPEN, F_WHO_IS_CLARA]),
    }, 1.02));
    const claraFade = endPart1 ? Math.max(0.55, 1.0 - smooth((f - (F_PART_TWO - 6)) / 36) * 0.45) : 1.0;
    const clara13 = makeFront(cam, CLARA, "cla13", 2, 0.78, 0, -0.85, {
      mode: farewell ? "reach" : "stand",
      expr: "sadSmile",
      look: -0.9,
      facing: -1,
      headTilt: 5,
      blink: lidAt(f, 2, [F_WHO_IS_CLARA]),
    }, 1.0);
    clara13.opacity = claraFade;
    actors.push(clara13);

    if (riftOpen) {
      for (let i = 0; i < 6; i++) {
        const a = t * 1.6 + i * 1.05;
        const sc = 0.48 + 0.24 * Math.sin(t * 4 + i);
        fx.push({
          key: `sp13_${i % 2}`, cw: 256, ch: 256, draw: (p) => fxSparkle(p, i % 2 ? "#ffe896" : "#ffffff"),
          x: Math.cos(a) * 1.8, y: 2.0 + Math.sin(a * 1.3) * 1.0, z: -3.2 + (i % 3) * 0.6,
          w: sc, h: sc, soft: true,
        });
      }
    }
  }

  // Contact shadows under every grounded actor
  const L = LIGHTS[light];
  const sunH = Math.hypot(cam.sun.x, cam.sun.z) || 1;
  const shx = -cam.sun.x / sunH, shz = -cam.sun.z / sunH;
  for (const a of actors) {
    if (a.shadow === false) continue;
    const sc = a.scale ?? 1;
    fx.push({
      key: "blob|contact", cw: 256, ch: 256, draw: fxContact,
      x: a.x, y: a.y + 0.02, z: a.z, w: 0.72 * sc, h: 0.44 * sc, flat: true,
    });
    if (L.actorShadow) {
      fx.push({
        key: "blob|tail", cw: 256, ch: 256, draw: fxShadow,
        x: a.x + shx * 0.65 * sc, y: a.y + 0.015, z: a.z + shz * 0.65 * sc,
        w: 0.86 * sc, h: 1.25 * sc, flat: true, rot: Math.atan2(shx, shz),
      });
    }
  }

  return { actors, fx };
}
