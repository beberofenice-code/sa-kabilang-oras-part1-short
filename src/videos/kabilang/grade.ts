// Display-referred 7-knot monotone Hermite tone curve + 3-zone saturation + BT.709 split-tone + elliptical vignette.
import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Vector3, Vector2 } from "three";
import type { LightMode } from "./lights";

const frag = /* glsl */ `
uniform float gradeKy[7];
uniform float gradeKm[7];
uniform vec3 gradeSat;
uniform vec3 gradeTintS;
uniform vec3 gradeTintM;
uniform vec3 gradeTintH;
uniform vec2 gradeVig;
uniform float gradeAmount;

vec3 gradeEncode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 gradeDecode(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
float gradeHermite(float v, float x0, float x1, float y0, float y1, float m0, float m1) {
  float h = x1 - x0, t = (v - x0) / h, t2 = t * t, t3 = t2 * t;
  return (2.0 * t3 - 3.0 * t2 + 1.0) * y0 + (t3 - 2.0 * t2 + t) * h * m0 + (-2.0 * t3 + 3.0 * t2) * y1 + (t3 - t2) * h * m1;
}
float gradeCurve(float v) {
  v = clamp(v, 0.0, 1.0);
  if (v < 0.1)  return gradeHermite(v, 0.0, 0.1, gradeKy[0], gradeKy[1], gradeKm[0], gradeKm[1]);
  if (v < 0.25) return gradeHermite(v, 0.1, 0.25, gradeKy[1], gradeKy[2], gradeKm[1], gradeKm[2]);
  if (v < 0.5)  return gradeHermite(v, 0.25, 0.5, gradeKy[2], gradeKy[3], gradeKm[2], gradeKm[3]);
  if (v < 0.75) return gradeHermite(v, 0.5, 0.75, gradeKy[3], gradeKy[4], gradeKm[3], gradeKm[4]);
  if (v < 0.9)  return gradeHermite(v, 0.75, 0.9, gradeKy[4], gradeKy[5], gradeKm[4], gradeKm[5]);
  return gradeHermite(v, 0.9, 1.0, gradeKy[5], gradeKy[6], gradeKm[5], gradeKm[6]);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 src = gradeEncode(inputColor.rgb);
  vec3 c = vec3(gradeCurve(src.r), gradeCurve(src.g), gradeCurve(src.b));
  const vec3 W = vec3(0.2126, 0.7152, 0.0722);
  float y = dot(c, W);
  float wS = 1.0 - smoothstep(0.0, 0.55, y);
  float wH = smoothstep(0.45, 1.0, y);
  float wM = 1.0 - wS - wH;
  float s = gradeSat.y + (gradeSat.x - gradeSat.y) * wS + (gradeSat.z - gradeSat.y) * wH;
  c = vec3(y) + s * (c - vec3(y));
  c += wS * gradeTintS + wM * gradeTintM + wH * gradeTintH;
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p) * 0.70710678;
  c *= 1.0 - gradeVig.x * smoothstep(gradeVig.y, 1.0, r);
  c = clamp(c, 0.0, 1.0);
  outputColor = vec4(gradeDecode(mix(src, c, gradeAmount)), inputColor.a);
}`;

const E_CB: [number, number, number] = [0.0, -0.18733, 1.8556];
const E_CR: [number, number, number] = [1.5748, -0.46813, 0.0];
export const tintRGB = (cb: number, cr: number) =>
  new Vector3(cb * E_CB[0] + cr * E_CR[0], cb * E_CB[1] + cr * E_CR[1], cb * E_CB[2] + cr * E_CR[2]);

export const KX = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
export function monoTangents(ky: number[]): number[] {
  const n = KX.length, h: number[] = [], d: number[] = [], m = new Array(n).fill(0);
  for (let k = 0; k < n - 1; k++) { h.push(KX[k + 1] - KX[k]); d.push((ky[k + 1] - ky[k]) / h[k]); }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    if (d[k - 1] * d[k] <= 0) { m[k] = 0; continue; }
    const w1 = 2 * h[k] + h[k - 1], w2 = h[k] + 2 * h[k - 1];
    m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
  }
  return m;
}

export type GradeParams = {
  ky: number[];
  sat: [number, number, number];
  tintS: [number, number]; tintM: [number, number]; tintH: [number, number];
  vig: [number, number];
};

export const GRADES: Record<LightMode, GradeParams> = {
  day: {
    ky: [0.02, 0.10, 0.28, 0.60, 0.835, 0.945, 1.0],
    sat: [1.0, 1.06, 1.02],
    tintS: [0.01, 0.003], tintM: [0, 0], tintH: [0.005, 0],
    vig: [0.12, 0.45],
  },
  golden: {
    ky: [0.02, 0.09, 0.245, 0.54, 0.80, 0.93, 1.0],
    sat: [1.0, 1.12, 1.15],
    tintS: [0.022, 0.002], tintM: [0, 0], tintH: [-0.012, 0.008],
    vig: [0.20, 0.40],
  },
  interior: {
    ky: [0.025, 0.11, 0.27, 0.56, 0.82, 0.94, 1.0],
    sat: [1.02, 1.08, 1.04],
    tintS: [0.014, 0.006], tintM: [-0.004, 0.005], tintH: [-0.008, 0.006],
    vig: [0.20, 0.42],
  },
  dusk: {
    ky: [0.02, 0.09, 0.24, 0.52, 0.78, 0.92, 1.0],
    sat: [1.06, 1.14, 1.12],
    tintS: [0.026, 0.002], tintM: [0.006, 0.004], tintH: [-0.010, 0.010],
    vig: [0.24, 0.38],
  },
  storm: {
    ky: [0.02, 0.095, 0.25, 0.52, 0.79, 0.93, 1.0],
    sat: [1.08, 1.12, 1.04],
    tintS: [0.024, -0.004], tintM: [0.012, -0.002], tintH: [0.004, 0.0],
    vig: [0.26, 0.38],
  },
};

export const GRADE_STRENGTH: Record<LightMode, number> = {
  day: 1.0, golden: 1.0, interior: 1.0, dusk: 1.0, storm: 1.0,
};

export class GradeEffect extends Effect {
  constructor(p: GradeParams, amount = 1) {
    super("GradeEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["gradeKy", new Uniform(p.ky.slice())],
        ["gradeKm", new Uniform(monoTangents(p.ky))],
        ["gradeSat", new Uniform(new Vector3(...p.sat))],
        ["gradeTintS", new Uniform(tintRGB(...p.tintS))],
        ["gradeTintM", new Uniform(tintRGB(...p.tintM))],
        ["gradeTintH", new Uniform(tintRGB(...p.tintH))],
        ["gradeVig", new Uniform(new Vector2(...p.vig))],
        ["gradeAmount", new Uniform(amount)],
      ]),
    });
  }
  set(p: GradeParams) {
    const u = this.uniforms;
    u.get("gradeKy")!.value = p.ky.slice();
    u.get("gradeKm")!.value = monoTangents(p.ky);
    (u.get("gradeSat")!.value as Vector3).set(...p.sat);
    u.get("gradeTintS")!.value = tintRGB(...p.tintS);
    u.get("gradeTintM")!.value = tintRGB(...p.tintM);
    u.get("gradeTintH")!.value = tintRGB(...p.tintH);
    (u.get("gradeVig")!.value as Vector2).set(...p.vig);
  }
  get amount() { return this.uniforms.get("gradeAmount")!.value as number; }
  set amount(v: number) { this.uniforms.get("gradeAmount")!.value = v; }
}

export function gradeFor(fx: GradeEffect, light: LightMode) {
  const tag = fx as unknown as { _light?: string };
  if (tag._light !== light) { fx.set(GRADES[light]); tag._light = light; }
  fx.amount = GRADE_STRENGTH[light];
}
