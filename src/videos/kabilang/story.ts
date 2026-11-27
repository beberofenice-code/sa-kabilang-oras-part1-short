// Master timeline for "Sa Kabilang Oras (Part 1)" (Original Tagalog animated story short).
// Every shot boundary, camera trajectory, flash, kick, DOF cue, and character beat is locked
// 2-3 frames ahead of voice/words.json (77.474 s -> 2340 frames = 78.000 s @ 30 fps).
import type { LightMode } from "./lights";

export const FPS = 30;
export const TOTAL = 2340; // 78.000 s
export type V3 = [number, number, number];

export type SetId =
  | "night_road_crash"
  | "empty_dawn_street"
  | "vintage_plaza"
  | "clara_meeting"
  | "old_town_lane"
  | "clock_tower"
  | "hillside_days"
  | "river_bridge_sunset"
  | "firefly_acacia"
  | "siren_sky_fade"
  | "vintage_library"
  | "photo_reveal"
  | "cliffhanger_rift";

export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: LightMode;
  set: SetId;
  xfade?: number;
  sunAz?: number;
  sunEl?: number;
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

export const SHOTS: ShotDef[] = [
  { id: 1,  a: 0,    b: 226,   light: "storm",    set: "night_road_crash",    sunAz: 42,  sunEl: 26 },
  { id: 2,  a: 226,  b: 390,   light: "golden",   set: "empty_dawn_street",   sunAz: 8,   sunEl: 9 },
  { id: 3,  a: 390,  b: 570,   light: "day",      set: "vintage_plaza",       xfade: 6, sunAz: 72,  sunEl: 46 },
  { id: 4,  a: 570,  b: 710,   light: "golden",   set: "clara_meeting",       xfade: 6, sunAz: 10,  sunEl: 10 },
  { id: 5,  a: 710,  b: 837,   light: "day",      set: "old_town_lane",       xfade: 6, sunAz: 76,  sunEl: 48 },
  { id: 6,  a: 837,  b: 964,   light: "day",      set: "clock_tower",         xfade: 6, sunAz: 68,  sunEl: 44 },
  { id: 7,  a: 964,  b: 1092,  light: "golden",   set: "hillside_days",       xfade: 8, sunAz: 12,  sunEl: 11 },
  { id: 8,  a: 1092, b: 1279,  light: "golden",   set: "river_bridge_sunset", xfade: 6, sunAz: 6,   sunEl: 8 },
  { id: 9,  a: 1279, b: 1433,  light: "dusk",     set: "firefly_acacia",      xfade: 8, sunAz: 18,  sunEl: 12 },
  { id: 10, a: 1433, b: 1753,  light: "storm",    set: "siren_sky_fade",      xfade: 6, sunAz: 48,  sunEl: 30 },
  { id: 11, a: 1753, b: 1911,  light: "interior", set: "vintage_library",     xfade: 6, sunAz: 64,  sunEl: 38 },
  { id: 12, a: 1911, b: 2055,  light: "interior", set: "photo_reveal",        sunAz: 60,  sunEl: 36 },
  { id: 13, a: 2055, b: TOTAL, light: "dusk",     set: "cliffhanger_rift",    xfade: 6, sunAz: 10,  sunEl: 10 },
];

export type FlashEvent = { f: number; curve: number[]; color?: string };
export const FLASHES: FlashEvent[] = [
  { f: 96,   curve: [0.68, 0.98, 0.94, 0.68, 0.36, 0.14], color: "#fff8e8" }, // Car headlight impact blinding white flash!
  { f: 226,  curve: [0.92, 0.68, 0.38, 0.14], color: "#fff4dc" },             // Post-hook slip into timeless golden dawn
  { f: 1656, curve: [0.46, 0.72, 0.42, 0.18], color: "#e6f6ff" },             // Clara's hand shimmers with ethereal light
  { f: 2152, curve: [0.52, 0.88, 0.66, 0.34, 0.14], color: "#fff6dc" },       // Blinding headlight rift bursts open in plaza!
];

export const flashAt = (f: number): { opacity: number; color: string } => {
  let opacity = 0;
  let color = "#ffffff";
  for (const fl of FLASHES) {
    const k = f - fl.f;
    if (k >= 0 && k < fl.curve.length && fl.curve[k] > opacity) {
      opacity = fl.curve[k];
      color = fl.color ?? "#ffffff";
    }
  }
  return { opacity, color };
};

export const shotAt = (f: number): ShotDef =>
  SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = s.xfade;
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story key timings (frames, 2-3 f ahead of words.json) ----------------
export const F_CAR_APPROACH    = 26;   // "nabundol" (f29)
export const F_CAR_IMPACT      = 96;   // peak crash before "pero nang magising" (f113)
export const F_WAKE_UP         = 122;  // "magising siya" (f125)
export const F_NO_SCRATCH      = 194;  // "galos" (f198)
export const F_NO_AMBULANCE    = 234;  // "ambulansya" (f236)
export const F_NO_CITY         = 274;  // "siyudad" (f276)
export const F_WATCH_STOP      = 322;  // "relo niya" (f325)
export const F_KALESA          = 450;  // "kalesa" (f453)
export const F_OLD_HOUSES      = 480;  // "lumang bahay" (f482)
export const F_QUIET_PLAZA     = 542;  // "plasa" (f545)
export const F_LOOK_AROUND     = 574;  // "Tumingin siya" (f571-581)
export const F_CLARA_APPEAR    = 620;  // "babaeng nasa harapan" (f622)
export const F_OKAY_KA_LANG    = 683;  // '"Okay ka lang?"' (f686)
export const F_CLARA_NAME      = 714;  // "Clara" (f716)
export const F_TOWN_WALK       = 762;  // "dinala niya si Mateo" (f764)
export const F_NOTICE_CLOCK    = 847;  // "napansin si Mateo" (f849)
export const F_CLOCK_FROZEN    = 883;  // "nakahinto ang malaking orasan" (f885)
export const F_DAYS_PASS       = 988;  // "araw, linggo" (f991)
export const F_MONTHS_STAY     = 1034; // "buwan" (f1036)
export const F_RIVER_WALK      = 1132; // "ilog" (f1135)
export const F_BRIDGE_SUNSET   = 1170; // "dapithapon sa tulay" (f1173)
export const F_TREE_LAUGH      = 1218; // "nagtatawanan sa ilalim ng puno" (f1220)
export const F_FALL_IN_LOVE    = 1321; // "napamahal si Mateo kay Clara" (f1324)
export const F_STAY_FOREVER    = 1396; // "ayaw na niyang umuwi" (f1398)
export const F_SKY_SIREN       = 1505; // "sirena" (f1508)
export const F_HEART_MACHINE   = 1528; // "tibok ng makina" (f1530)
export const F_HOLD_HAND       = 1605; // "hawakan niya ang kamay" (f1607)
export const F_HAND_GLOW       = 1655; // "nagliwanag ito" (f1658)
export const F_FADE_SMOKE      = 1700; // "naglaho parang usok" (f1702)
export const F_LIBRARY_FIND    = 1810; // "aklatan" (f1812)
export const F_OLD_PHOTO       = 1839; // "litrato mula dekada sitenta" (f1842)
export const F_PHOTO_CLARA     = 1928; // "Clara, pareho ang damit" (f1930)
export const F_PHOTO_BACK      = 1989; // "sa likod ay ang apelyido ni Mateo" (f1991)
export const F_ROAD_QUAKE      = 2061; // "yumanig ang kalsada" (f2064)
export const F_LIGHT_OPEN      = 2102; // "bumukas ang nakasisilaw" (f2104)
export const F_HEADLIGHT_GLARE = 2150; // "ilaw ng sasakyan" (f2152)
export const F_WHO_IS_CLARA    = 2210; // "Sino ba talaga si Clara" (f2213)
export const F_IS_MATEO_ALIVE  = 2250; // "buhay pa ba si Mateo?" (f2253)
export const F_PART_TWO        = 2276; // "Abangan sa Part Two." (f2279)

// ---------------- camera engine ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type ShotCam = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => ShotCam };

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k, a.pos[2] + (b.pos[2] - a.pos[2]) * k],
  look: [a.look[0] + (b.look[0] - a.look[0]) * k, a.look[1] + (b.look[1] - a.look[1]) * k, a.look[2] + (b.look[2] - a.look[2]) * k],
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const fullCam = (c: ShotCam): Cam => ({ fov: 40, roll: 0, ...c });
const runKeys = (keys: Key[], f: number): Cam => {
  let cur = fullCam(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? fullCam(k.s(f)) : mixCam(cur, fullCam(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};

/** Continuous creeping push-in so zero frames are static (>= 0.24 %/f) */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 26) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) {
    for (let i = 0; i < Math.min(x, n); i++) {
      s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
    }
  }
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): ShotCam => ({
  pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k],
  look,
  ...rest,
});

// ---------------- per-shot camera trajectories ----------------
const CAMS: Record<number, Key[]> = {
  // Shot 1: Rainy night road — Mateo crosses under streetlight, sedan headlights surge in -> flash -> Mateo wakes unharmed!
  1: [
    { f: 0, s: (f) => dolly([-4.6, 2.5, 11.4], [-0.4, 1.85, 0.0], pushK(f, 0, 0.0028), { fov: 43, roll: -1.4 }) },
    { f: 56, dur: 30, s: (f) => dolly([-2.0, 2.2, 8.6], [0.2, 1.75, 0.2], pushK(f, 56, 0.0034, 0.0056, 22), { fov: 41, roll: 2.6 }) },
    { f: 99, cut: true, s: (f) => dolly([2.2, 2.15, 7.2], [0.0, 1.45, 0.5], pushK(f, 99, 0.0028), { fov: 38, roll: -1.6 }) },
    { f: 165, dur: 26, s: (f) => dolly([0.8, 2.05, 5.4], [0.0, 1.65, 0.5], pushK(f, 165, 0.0030), { fov: 36, roll: 1.4 }) },
  ],

  // Shot 2: Quiet golden cobblestone street — Mateo bewildered, lifts frozen wristwatch close to camera!
  2: [
    { f: 226, s: (f) => dolly([-5.2, 2.8, 12.0], [0.0, 1.9, -1.5], pushK(f, 226, 0.0026), { fov: 43, roll: -1.2 }) },
    { f: 314, dur: 24, s: (f) => dolly([0.45, 2.15, 6.0], [0.18, 1.72, 0.75], pushK(f, 314, 0.0032, 0.0054, 20), { fov: 37, roll: 2.0 }) },
  ],

  // Shot 3: Sweeping sunlit vintage Filipino town plaza — kalesa trots by, Bahay na Bato houses & quiet square
  3: [
    { f: 390, s: (f) => {
      const u = clamp01((f - 390) / 110);
      return {
        pos: [10.4 - u * 11.4, 5.4 - u * 1.9, 15.2 - u * 3.0],
        look: [0.5 - u * 1.4, 2.2, -1.2],
        fov: 44 - u * 2,
        roll: -1.4 + u * 2.2,
      };
    }},
    { f: 505, dur: 28, s: (f) => dolly([-2.8, 3.2, 11.6], [0.0, 2.1, -2.0], pushK(f, 505, 0.0028), { fov: 42, roll: 1.6 }) },
  ],

  // Shot 4: First meeting with Clara — Mateo turns around, warm golden shallow-DOF reveal of Clara ("Okay ka lang?")
  4: [
    { f: 570, s: (f) => dolly([-3.6, 2.1, 7.6], [-0.4, 1.65, 0.4], pushK(f, 570, 0.0026), { fov: 39, roll: -1.2 }) },
    { f: 618, dur: 26, s: (f) => dolly([0.45, 2.05, 6.2], [0.15, 1.60, 0.55], pushK(f, 618, 0.0030, 0.0054, 22), { fov: 36, roll: 1.6 }) },
  ],

  // Shot 5: Old Filipino market lane — Clara guides Mateo past wooden stalls, hanging lanterns & townsfolk
  5: [
    { f: 710, s: (f) => {
      const u = clamp01((f - 710) / 126);
      return {
        pos: [-5.8 + u * 8.2, 2.75, 10.6 - u * 1.8],
        look: [-1.4 + u * 3.2, 1.85, 0.0],
        fov: 41,
        roll: -1.5 + u * 3.0,
      };
    }},
  ],

  // Shot 6: Stopped Clock Tower — Mateo halts & looks up, camera tilts dramatically up to giant frozen brass clock dial!
  6: [
    { f: 837, s: (f) => dolly([-3.4, 2.3, 10.8], [0.0, 2.6, -2.0], pushK(f, 837, 0.0026), { fov: 42, roll: -1.2 }) },
    { f: 878, dur: 28, s: (f) => dolly([0.8, 5.8, 9.6], [0.0, 8.8, -4.6], pushK(f, 878, 0.0034, 0.0056, 22), { fov: 37, roll: 2.2 }) },
  ],

  // Shot 7: Passage of time — Golden hillside overlook above the old town, Mateo & Clara strolling as petals drift
  7: [
    { f: 964, s: (f) => {
      const u = clamp01((f - 964) / 128);
      return {
        pos: [-6.8 + u * 9.8, 3.6 - u * 0.6, 11.4 - u * 1.2],
        look: [-1.2 + u * 2.8, 2.1, -1.6],
        fov: 43,
        roll: -1.4 + u * 2.8,
      };
    }},
  ],

  // Shot 8: Romantic montage — Sparkling river stroll -> sunset stone bridge -> laughing under the great acacia tree
  8: [
    { f: 1092, s: (f) => dolly([-6.6, 2.8, 10.6], [-4.8, 1.8, 0.4], pushK(f, 1092, 0.0028), { fov: 41, roll: -1.4 }) },
    { f: 1164, dur: 22, s: (f) => dolly([0.0, 2.95, 8.8], [0.0, 2.0, 0.1], pushK(f, 1164, 0.0028), { fov: 40, roll: 1.4 }) },
    { f: 1216, dur: 24, s: (f) => dolly([6.6, 2.6, 9.2], [5.4, 1.9, -0.2], pushK(f, 1216, 0.0030, 0.0050, 20), { fov: 39, roll: -1.8 }) },
  ],

  // Shot 9: Falling in love — Dusk close-up under giant glowing firefly acacia tree, warm bokeh all around Mateo & Clara
  9: [
    { f: 1279, s: (f) => dolly([-2.2, 2.2, 7.6], [0.0, 1.8, 0.2], pushK(f, 1279, 0.0026), { fov: 38, roll: -1.4 }) },
    { f: 1352, dur: 30, s: (f) => dolly([1.4, 2.1, 5.4], [0.0, 1.75, 0.4], pushK(f, 1352, 0.0030), { fov: 34, roll: 1.6 }) },
  ],

  // Shot 10: Cracks in reality — Sky siren & ECG wave in night storm clouds -> Mateo touches Clara's hand -> she shimmers & fades like smoke!
  10: [
    { f: 1433, s: (f) => dolly([-3.2, 2.4, 10.2], [0.0, 3.4, -4.0], pushK(f, 1433, 0.0025), { fov: 44, roll: -1.5 }) },
    { f: 1502, dur: 28, s: (f) => dolly([1.4, 3.4, 10.6], [0.0, 6.2, -9.0], pushK(f, 1502, 0.0028), { fov: 45, roll: 2.2 }) },
    { f: 1600, dur: 26, s: (f) => dolly([-0.8, 2.15, 6.8], [0.05, 1.68, 0.6], pushK(f, 1600, 0.0032, 0.0056, 22), { fov: 38, roll: -1.8 }) },
    { f: 1696, dur: 22, s: (f) => dolly([0.2, 2.1, 6.4], [0.05, 1.68, 0.6], pushK(f, 1696, 0.0032), { fov: 36, roll: 2.0 }) },
  ],

  // Shot 11: Vintage town library — Sunbeams through tall arched windows, wooden bookshelves, Mateo discovers 1970s album!
  11: [
    { f: 1753, s: (f) => dolly([-5.4, 2.8, 9.6], [0.0, 2.0, -0.6], pushK(f, 1753, 0.0026), { fov: 42, roll: -1.2 }) },
    { f: 1835, dur: 26, s: (f) => dolly([1.8, 2.25, 5.8], [0.2, 1.75, 0.4], pushK(f, 1835, 0.0030, 0.0052, 20), { fov: 36, roll: 1.8 }) },
  ],

  // Shot 12: Dramatic photo reveal — Crisp close-up on vintage 1970s sepia portrait of Clara -> flips to crest back matching Mateo!
  12: [
    { f: 1911, s: (f) => dolly([-1.2, 2.25, 5.8], [0.0, 1.95, 0.0], pushK(f, 1911, 0.0028), { fov: 36, roll: -1.2 }) },
    { f: 1986, dur: 20, s: (f) => dolly([1.1, 2.22, 4.9], [0.0, 1.92, 0.0], pushK(f, 1986, 0.0034, 0.0062, 18), { fov: 33, roll: 2.6 }) },
  ],

  // Shot 13: PART 1 CLIFFHANGER — Town plaza shakes, blinding headlight rift splits the road, Clara looks back at Mateo!
  13: [
    { f: 2055, s: (f) => dolly([-3.6, 2.8, 12.6], [0.0, 2.1, -2.0], pushK(f, 2055, 0.0028), { fov: 44, roll: -1.8 }) },
    { f: 2102, dur: 26, s: (f) => dolly([2.2, 2.5, 10.6], [0.0, 2.0, -2.5], pushK(f, 2102, 0.0032, 0.0056, 22), { fov: 42, roll: 2.2 }) },
    { f: 2208, dur: 28, s: (f) => dolly([-0.2, 2.25, 7.6], [-0.05, 1.75, -0.4], pushK(f, 2208, 0.0034, 0.0054, 24), { fov: 38, roll: -1.4 }) },
  ],
};

// Sign-flipping 7-frame impact shakes on crash, photo shock, road quake & portal burst
export const KICKS: [number, number][] = [
  [F_CAR_IMPACT - 2, 0.28],
  [F_HAND_GLOW, 0.14],
  [F_PHOTO_BACK + 2, 0.16],
  [F_ROAD_QUAKE, 0.24],
  [F_LIGHT_OPEN, 0.22],
  [F_HEADLIGHT_GLARE, 0.26],
];

export const camAt = (id: number, f: number): Cam => {
  const c = runKeys(CAMS[id], f);
  let dx = 0, dy = 0, dr = 0;
  for (const [kf, amp] of KICKS) {
    const k = f - kf;
    if (k >= 0 && k < 7) {
      const s = (k % 2 ? -1 : 1) * amp * Math.exp(-k * 0.42);
      dx += s * 0.48; dy += s * 0.30; dr += s * 4.0;
    }
  }
  return {
    pos: [c.pos[0] + dx, c.pos[1] + dy, c.pos[2]],
    look: [c.look[0] + dx * 0.35, c.look[1] + dy * 0.35, c.look[2]],
    fov: c.fov,
    roll: c.roll + dr,
  };
};

// ---------------- Depth of Field per beat ----------------
export type Dof = { cInf: number; focus?: (f: number) => V3 };
export const dofAt = (f: number): Dof => {
  if (f >= 145 && f < 226) return { cInf: 11, focus: () => [0.0, 1.55, 0.5] };     // Mateo waking unharmed CU
  if (f >= 312 && f < 390) return { cInf: 13, focus: () => [0.4, 1.72, 0.7] };     // Frozen wristwatch CU
  if (f >= 612 && f < 710) return { cInf: 14, focus: () => [0.55, 1.68, 0.6] };    // Clara "Okay ka lang?" golden CU
  if (f >= 1279 && f < 1433) return { cInf: 13, focus: () => [0.0, 1.75, 0.4] };   // Firefly acacia romantic CU
  if (f >= 1600 && f < 1753) return { cInf: 12, focus: () => [0.35, 1.72, 0.6] };  // Clara fading hand CU
  if (f >= 1911 && f < 2055) return { cInf: 12, focus: () => [0.0, 1.92, 0.0] };   // 1970s photo & back reveal CU
  if (f >= 2208) return { cInf: 10, focus: () => [0.1, 1.8, -0.8] };               // Part 1 cliffhanger farewell CU
  return { cInf: 0 };
};
