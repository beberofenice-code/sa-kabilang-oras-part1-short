// Light presets per story beat (day, golden, interior, storm, dusk).
// Day and golden match the proven bridge look values from cartoon-3d-short SKILL.md verbatim;
// interior / storm / dusk extend the same calibrated two-tone + cool-shadow grammar for office,
// UN hall, lightning analogy, and overnight train scenes.
// Sun is CAMERA-RELATIVE and frozen per shot: az = deg from camera forward (0 = backlight, +90 = right, 180 = front).
export type C3 = [number, number, number];
export type LightMode = "day" | "golden" | "interior" | "storm" | "dusk";

export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3;
  blob: C3; actorShadow: boolean;
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string;
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;
  bias: number; normalBias: number;
};

export const LIGHTS: Record<LightMode, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.50, 1.33], shade: [0.30, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.20,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.20, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.50, 0.68, 0.24], shade: [0.15, 0.15, 0.30], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.10, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.90], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.50,
    bias: -0.0006, normalBias: 0.03,
  },
  interior: {
    az: 65, el: 40,
    lit: [1.46, 1.38, 1.28], shade: [0.44, 0.41, 0.52], lift: [0.06, 0.05, 0.09], lambert: 0.28, sideK: 0.88, term: 0.24,
    charTint: [1.0, 0.96, 0.93], charShade: 0.90, charGrad: 0.08, bodyGrad: 0.18, sideTint: [0.90, 0.88, 0.96],
    blob: [0.58, 0.54, 0.60], actorShadow: false,
    top: "#4f8cdb", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#c9d6ea", fogNear: 65, fogFar: 420, sunDisc: "#000000",
    sunCol: "#fff4e4", sunI: 2.3, sky: "#f2eade", ground: "#8c7a6b", hemiI: 0.65,
    bias: -0.00025, normalBias: 0.015,
  },
  dusk: {
    az: 18, el: 12,
    lit: [1.38, 0.78, 0.44], shade: [0.20, 0.22, 0.42], lift: [0.04, 0.06, 0.16], lambert: 0.32, sideK: 0.80, term: 0.12,
    charTint: [0.98, 0.84, 0.72], charShade: 0.86, charGrad: 0.09, bodyGrad: 0.24, sideTint: [0.80, 0.80, 0.98],
    blob: [0.64, 0.62, 0.82], actorShadow: true,
    top: "#2d3464", hor: "#f2a47a", skyCurve: [0.04, 0.55, 0.95], fog: "#c98b88", fogNear: 35, fogFar: 310, sunDisc: "#ffbe88",
    sunCol: "#ff9e66", sunI: 4.0, sky: "#7e6b9c", ground: "#4f4668", hemiI: 0.50,
    bias: -0.0005, normalBias: 0.025,
  },
  storm: {
    az: 50, el: 32,
    lit: [0.86, 0.96, 1.24], shade: [0.22, 0.26, 0.44], lift: [0.04, 0.06, 0.14], lambert: 0.30, sideK: 0.82, term: 0.18,
    charTint: [0.90, 0.94, 1.00], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.80, 0.85, 0.98],
    blob: [0.46, 0.50, 0.64], actorShadow: false,
    top: "#1b284d", hor: "#627ba6", skyCurve: [0.0, 0.5, 0.75], fog: "#577099", fogNear: 28, fogFar: 260, sunDisc: "#000000",
    sunCol: "#b4ceff", sunI: 1.9, sky: "#4e6791", ground: "#35435e", hemiI: 0.55,
    bias: -0.0003, normalBias: 0.018,
  },
};

export type WorldLook = {
  sky: { c: string[]; e: number[] };
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;
  sat: number;
  cloud: { lit: string; mid: string; shade: string };
};

export const LOOK: Record<LightMode, WorldLook> = {
  day: {
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.10,
  },
  interior: {
    sky: { c: ["#cfe0f5", "#a8c8ee", "#78aae4", "#5892db", "#3c78cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0.14, 0.12, 0.09],
    sat: 1.05,
  },
  dusk: {
    sky: { c: ["#f4a97d", "#df8a7e", "#a96e8c", "#5d5584", "#2c3462"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1b2e5a", mid: "#2d4c82", far: "#c08982", crest: "#df9d86", trough: "#132042", glint: "#ffd7a6", shade: [0.4, 0.44, 0.72] },
    cloud: { lit: "#ffbfa0", mid: "#c7869a", shade: "#6b5d92" },
    bounce: [0.05, 0.03, 0.02],
    sat: 1.12,
  },
  storm: {
    sky: { c: ["#6a84ae", "#516c9a", "#385282", "#263b68", "#18264a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1b3a5c", mid: "#1e456e", far: "#2d517a", crest: "#7fa7cf", trough: "#10243d", glint: "#dceeff", shade: [0.38, 0.44, 0.66] },
    cloud: { lit: "#8ca4c9", mid: "#5c7399", shade: "#364668" },
    bounce: [0.03, 0.04, 0.07],
    sat: 1.04,
  },
};
