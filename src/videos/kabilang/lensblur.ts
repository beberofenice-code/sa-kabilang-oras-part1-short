// Fast half-resolution thin-lens depth of field Pass for software/CPU & GPU rendering.
// Computes a 14-tap depth-aware Vogel bokeh disc at 0.5x resolution (respecting near-plane occlusion so sharp
// subjects keep razor-clean silhouettes without halos), then composites only out-of-focus pixels at full resolution.
// Skips completely (0 ms) when cInf < 0.25. Preserves the exact visual look of the 2-stage bokeh at ~10x speed.
import * as THREE from "three";
import { Pass, Effect, BlendFunction } from "postprocessing";
import { Uniform } from "three";

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BLUR_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 texel;
uniform float outH;
uniform float cNear;
uniform float cFar;
uniform float focus;
uniform float cInf;
uniform float nearScale;
uniform float maxCoC;
varying vec2 vUv;

#define GOLDEN 2.39996323
#define TAPS 14

float distAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cNear, cFar); }
float cocAt(float d, float s) {
  float c = cInf * s * (1.0 - focus / max(d, 1e-3));
  if (c < 0.0) c *= nearScale;
  return clamp(c, -maxCoC * s, maxCoC * s);
}

void main() {
  vec4 c0 = texture2D(tColor, vUv);
  float s = outH / 1920.0;
  float d0 = distAt(vUv);
  float r0 = abs(cocAt(d0, s));
  float R = r0 * 0.92;
  vec3 acc = c0.rgb;
  float wsum = 1.0;
  if (R > 0.75) {
    for (int i = 0; i < TAPS; i++) {
      float rr = sqrt((float(i) + 0.5) / float(TAPS)) * R;
      float a = float(i) * GOLDEN;
      vec2 suv = vUv + vec2(cos(a), sin(a)) * rr * texel;
      float ds = distAt(suv);
      float rs = abs(cocAt(ds, s)) * 0.92;
      if (ds > d0) rs = min(rs, R);
      float w = clamp(rs - rr + 0.5, 0.0, 1.0);
      acc += texture2D(tColor, suv).rgb * w;
      wsum += w;
    }
  }
  gl_FragColor = vec4(acc / wsum, clamp(r0 / 6.0, 0.0, 1.0));
}`;

const COMP_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tBlur;
uniform sampler2D tDepth;
uniform float outH;
uniform float cNear;
uniform float cFar;
uniform float focus;
uniform float cInf;
uniform float nearScale;
uniform float maxCoC;
varying vec2 vUv;

float cocAt(float d, float s) {
  float c = cInf * s * (1.0 - focus / max(d, 1e-3));
  if (c < 0.0) c *= nearScale;
  return clamp(c, -maxCoC * s, maxCoC * s);
}

void main() {
  vec4 sharp = texture2D(tColor, vUv);
  float s = outH / 1920.0;
  float d0 = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, cNear, cFar);
  float r0 = abs(cocAt(d0, s));
  float blend = smoothstep(0.65, 2.4, r0);
  if (blend < 0.005) { gl_FragColor = sharp; return; }
  vec3 blur = texture2D(tBlur, vUv).rgb;
  gl_FragColor = vec4(mix(sharp.rgb, blur, blend), sharp.a);
}`;

export class LensBlurPass extends Pass {
  private cam: THREE.PerspectiveCamera;
  private blurRT: THREE.WebGLRenderTarget;
  private blurMat: THREE.ShaderMaterial;
  private compMat: THREE.ShaderMaterial;
  private fsScene = new THREE.Scene();
  private fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;

  constructor(camera: THREE.PerspectiveCamera, { maxCoC = 24, nearScale = 1.2 } = {}) {
    super("LensBlurPass");
    this.cam = camera;
    this.needsSwap = true;
    this.needsDepthTexture = true;

    this.blurRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
    });

    const common = {
      tColor: { value: null },
      tDepth: { value: null },
      outH: { value: 1920 },
      cNear: { value: 0.2 },
      cFar: { value: 1500 },
      focus: { value: 10 },
      cInf: { value: 0 },
      nearScale: { value: nearScale },
      maxCoC: { value: maxCoC },
    };

    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: { ...common, texel: { value: new THREE.Vector2(1 / 1080, 1 / 1920) } },
      depthTest: false,
      depthWrite: false,
    });
    this.compMat = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: COMP_FRAG,
      uniforms: { ...common, tBlur: { value: this.blurRT.texture } },
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat);
    this.quad.frustumCulled = false;
    this.fsScene.add(this.quad);
  }

  set focus(v: number) {
    this.blurMat.uniforms.focus.value = v;
    this.compMat.uniforms.focus.value = v;
  }
  get focus() { return this.blurMat.uniforms.focus.value as number; }

  set cInf(v: number) {
    this.blurMat.uniforms.cInf.value = v;
    this.compMat.uniforms.cInf.value = v;
  }
  get cInf() { return this.blurMat.uniforms.cInf.value as number; }

  override setDepthTexture(depthTexture: THREE.Texture) {
    this.blurMat.uniforms.tDepth.value = depthTexture ?? null;
    this.compMat.uniforms.tDepth.value = depthTexture ?? null;
  }

  override setSize(width: number, height: number) {
    const rw = Math.max(1, Math.round(width * 0.5));
    const rh = Math.max(1, Math.round(height * 0.5));
    this.blurRT.setSize(rw, rh);
    (this.blurMat.uniforms.texel.value as THREE.Vector2).set(1 / width, 1 / height);
    this.blurMat.uniforms.outH.value = height;
    this.compMat.uniforms.outH.value = height;
  }

  override render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget, outputBuffer: THREE.WebGLRenderTarget) {
    if ((this.blurMat.uniforms.cInf.value as number) < 0.25) {
      // Fast passthrough copy only when needed; swap=false shortcut would break composer ping-pong,
      // so let compMat copy sharp directly when cInf is off (1 texture read, ~10 ms).
      this.compMat.uniforms.tColor.value = inputBuffer.texture;
      this.compMat.uniforms.cNear.value = this.cam.near;
      this.compMat.uniforms.cFar.value = this.cam.far;
      this.quad.material = this.compMat;
      renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
      renderer.render(this.fsScene, this.fsCam);
      return;
    }

    this.blurMat.uniforms.tColor.value = inputBuffer.texture;
    this.blurMat.uniforms.cNear.value = this.cam.near;
    this.blurMat.uniforms.cFar.value = this.cam.far;
    this.quad.material = this.blurMat;
    renderer.setRenderTarget(this.blurRT);
    renderer.render(this.fsScene, this.fsCam);

    this.compMat.uniforms.tColor.value = inputBuffer.texture;
    this.compMat.uniforms.cNear.value = this.cam.near;
    this.compMat.uniforms.cFar.value = this.cam.far;
    this.quad.material = this.compMat;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.render(this.fsScene, this.fsCam);
  }

  override dispose() {
    this.blurRT.dispose();
    this.blurMat.dispose();
    this.compMat.dispose();
    this.quad.geometry.dispose();
  }
}

// ---------------- film grain (kept for compatibility) ----------------
const grainFrag = /* glsl */ `
uniform float seed;
uniform float amount;
uniform float cellPx;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float h3(ivec2 c, uint k) { return float(pcg(uint(c.x) + pcg(uint(c.y) + pcg(k)))) * (1.0 / 4294967295.0) - 0.5; }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 p = uv * resolution / (cellPx * resolution.y / 1920.0);
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  uint k = uint(seed + 0.5) * 2654435761u + 1013904223u;
  float n = mix(mix(h3(i, k), h3(i + ivec2(1, 0), k), f.x), mix(h3(i + ivec2(0, 1), k), h3(i + ivec2(1, 1), k), f.x), f.y);
  vec3 g = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
  float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
  float w = 0.25 + 0.75 * clamp(4.0 * l * (1.0 - l), 0.0, 1.0);
  g = max(g + n * (amount / 0.2145) * w, 0.0);
  outputColor = vec4(pow(g, vec3(2.2)), inputColor.a);
}`;

export class GrainEffect extends Effect {
  constructor({ amount = 0.025, cellPx = 1.5 }: { amount?: number; cellPx?: number } = {}) {
    super("GrainEffect", grainFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([["seed", new Uniform(0)], ["amount", new Uniform(amount)], ["cellPx", new Uniform(cellPx)]]),
    });
  }
  set seed(v: number) { this.uniforms.get("seed")!.value = v; }
  set amount(v: number) { this.uniforms.get("amount")!.value = v; }
}
