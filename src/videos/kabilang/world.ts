// Unified Three.js scene controller for "Sa Kabilang Oras (Part 1)".
// Poses the active modular 3D set, sky/clouds/fog, camera-relative sun, dynamic props, and cast sprites
// as a pure deterministic function of (shotId, frame).
import * as THREE from "three";
import { buildAllSets, BuiltSets } from "./build";
import { ctex, cloudHD } from "./paint";
import { LIGHTS, LOOK, LightMode } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stageShot, CamInfo } from "./cast";
import {
  FPS, SHOTS, camAt, clamp01, smooth,
  F_CAR_APPROACH, F_CAR_IMPACT, F_CLOCK_FROZEN,
  F_SKY_SIREN, F_HOLD_HAND, F_PHOTO_BACK,
  F_ROAD_QUAKE, F_LIGHT_OPEN, F_HEADLIGHT_GLARE, F_PART_TWO,
} from "./story";

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
}, false);

const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
    im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
}, false);

export class World {
  root = new THREE.Group();
  private sets: BuiltSets;
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private sunDisc: THREE.Sprite;
  private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<LightMode, THREE.Texture[]>;
  private lastLight: LightMode | null = null;
  private tmpRight = new THREE.Vector3();
  private tmpFwd = new THREE.Vector3();
  private tmpUp = new THREE.Vector3(0, 1, 0);
  private tmpTarget = new THREE.Vector3();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() },
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), this.skyMat);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true, transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5;
    this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }

    this.hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 0.55);
    this.sun = new THREE.DirectionalLight("#fff3e0", 2.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 2;
    this.sun.shadow.camera.far = 130;
    this.sun.shadow.camera.left = -24;
    this.sun.shadow.camera.right = 24;
    this.sun.shadow.camera.top = 24;
    this.sun.shadow.camera.bottom = -24;
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);

    const modes: LightMode[] = ["day", "golden", "interior", "dusk", "storm"];
    this.cloudMaps = Object.fromEntries(modes.map((m) => [m, [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[m].cloud))])) as unknown as Record<LightMode, THREE.Texture[]>;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35, d = 520 + (i % 3) * 55;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.08, 1.08, 1.08), transparent: true, depthWrite: false, fog: false })
      );
      const w = 125 + (i % 4) * 28;
      m.position.set(Math.cos(a) * d, 95 + (i % 4) * 32, Math.sin(a) * d);
      m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m);
      R.add(m);
    }

    this.sets = buildAllSets(R);
  }

  private sunDirFor(id: number): THREE.Vector3 {
    let dir = this.sunCache.get(id);
    if (!dir) {
      const s = SHOTS[id - 1];
      const L = LIGHTS[s.light];
      const az = ((s.sunAz ?? L.az) * Math.PI) / 180;
      const el = ((s.sunEl ?? L.el) * Math.PI) / 180;
      const c0 = camAt(id, s.a);
      const fw = new THREE.Vector3(c0.look[0] - c0.pos[0], 0, c0.look[2] - c0.pos[2]).normalize();
      if (fw.lengthSq() < 1e-4) fw.set(0, 0, 1);
      const rt = new THREE.Vector3().crossVectors(fw, this.tmpUp).normalize();
      const horiz = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az));
      dir = horiz.multiplyScalar(Math.cos(el)).addScaledVector(this.tmpUp, Math.sin(el)).normalize();
      this.sunCache.set(id, dir);
    }
    return dir;
  }

  private applyLight(light: LightMode, scene: THREE.Scene) {
    const L = LIGHTS[light], K = LOOK[light];
    TONE.uLitCol.value.set(...L.lit);
    TONE.uShadeCol.value.set(...L.shade);
    TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert;
    TONE.uSideK.value = L.sideK;
    TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = K.sat;

    CHAR.uCharTint.value.set(...L.charTint);
    CHAR.uCharShade.value = L.charShade;
    CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad;
    CHAR.uSideTint.value.set(...L.sideTint);

    this.hemi.color.set(L.sky);
    this.hemi.groundColor.set(L.ground);
    this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol);
    this.sun.intensity = L.sunI;
    this.sun.shadow.bias = L.bias;
    this.sun.shadow.normalBias = L.normalBias;

    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;

    const u = this.skyMat.uniforms;
    K.sky.c.forEach((hex, idx) => untone(hex, u[`c${idx}`].value));
    u.e.value.set(
      (K.sky.e[1] * Math.PI) / 180,
      (K.sky.e[2] * Math.PI) / 180,
      (K.sky.e[3] * Math.PI) / 180,
      (K.sky.e[4] * Math.PI) / 180
    );

    if (this.lastLight !== light) {
      this.clouds.forEach((m, i) => {
        const bm = m.material as THREE.MeshBasicMaterial;
        bm.map = this.cloudMaps[light][i % 4];
        bm.needsUpdate = true;
      });
      this.lastLight = light;
    }
  }

  private animateProps(id: number, f: number) {
    const d = this.sets.dyn;
    const t = f / FPS;

    // Shot 1: Sedan rushes along wet night road with blazing headlights -> gone after impact flash!
    if (id === 1) {
      const preImpact = f < F_CAR_IMPACT + 3;
      d.crashCar.visible = preImpact;
      if (preImpact) {
        const u = clamp01((f - (F_CAR_APPROACH - 18)) / (F_CAR_IMPACT - (F_CAR_APPROACH - 18)));
        const ease = u * u * (1.2 - 0.2 * u);
        d.crashCar.position.set(-16.5 + ease * 14.3, Math.abs(Math.sin(t * 20)) * 0.03, 0.55);
      }
    }

    // Shot 3: Vintage Filipino Kalesa trots smoothly across sunlit heritage plaza!
    if (id === 3) {
      const u = clamp01((f - 390) / 180);
      d.kalesa.position.set(-9.8 + u * 15.2, Math.abs(Math.sin(t * 9.5)) * 0.06, -1.6);
      d.kalesa.rotation.z = Math.sin(t * 9.5) * 0.025;
    }

    // Shot 6: Giant Clock Tower hands twitch slightly and stay stubbornly frozen!
    if (id === 6) {
      const twitch = f >= F_CLOCK_FROZEN - 6 ? Math.sin(t * 16) * (Math.sin(t * 3.1) > 0.45 ? 0.045 : 0.0) : 0;
      d.clockHour.rotation.z = 2.15 + twitch * 0.35;
      d.clockMin.rotation.z = -Math.PI / 2 + twitch;
    }

    // Shot 10: Distant red & blue siren pulses glowing eerily in the storm sky!
    if (id === 10) {
      const on = smooth((f - (F_SKY_SIREN - 18)) / 18) * (1 - smooth((f - (F_HOLD_HAND + 14)) / 24));
      const pR = 0.5 + 0.5 * Math.sin(t * 7.5);
      const pB = 0.5 + 0.5 * Math.sin(t * 7.5 + Math.PI);
      (d.sirenRed.material as THREE.MeshBasicMaterial).opacity = 0.38 * on * pR;
      (d.sirenBlue.material as THREE.MeshBasicMaterial).opacity = 0.40 * on * pB;
    }

    // Shot 11: Library golden dust sunbeams gently drift
    if (id === 11) {
      d.sunShafts.position.x = Math.sin(t * 0.6) * 0.16;
    }

    // Shot 12: 1970s Vintage Photograph Card floats gently -> dramatic 180° flip at F_PHOTO_BACK!
    if (id === 12) {
      const flipU = smooth((f - (F_PHOTO_BACK - 10)) / 20);
      d.photoCard.rotation.y = flipU * Math.PI + Math.sin(t * 1.8) * 0.04;
      d.photoCard.position.y = 1.98 + Math.sin(t * 2.2) * 0.04;
      d.photoCard.rotation.z = Math.sin(t * 1.4) * 0.025;
    }

    // Shot 13: Road trembles, golden crack splits cobblestones & blinding headlight time-portal bursts open!
    if (id === 13) {
      const crackU = smooth((f - (F_ROAD_QUAKE - 4)) / 22);
      (d.roadCrack.material as THREE.MeshBasicMaterial).opacity = 0.85 * crackU;
      d.roadCrack.scale.x = 0.6 + crackU * 1.8;

      const openU = smooth((f - (F_LIGHT_OPEN - 8)) / 28);
      const glareU = smooth((f - (F_HEADLIGHT_GLARE - 6)) / 24);
      const swellU = smooth((f - (F_PART_TWO - 12)) / 50);
      d.riftGroup.visible = openU > 0.01;
      const sc = 0.25 + openU * 0.65 + glareU * 0.18 + swellU * 0.22;
      d.riftGroup.scale.setScalar(sc);
      d.riftCore.scale.set(1.0 + Math.sin(t * 9) * 0.04, 1.0 + Math.cos(t * 8) * 0.04, 1.0);
    }
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const s = SHOTS[id - 1];
    const L = LIGHTS[s.light];

    // Toggle only active modular 3D set
    for (const [k, grp] of Object.entries(this.sets.groups)) {
      grp.visible = k === s.set;
    }

    // Pose camera
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.fov = c.fov;
    cam.updateProjectionMatrix();
    this.tmpTarget.set(...c.look);
    cam.lookAt(this.tmpTarget);
    if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
    cam.updateMatrixWorld();

    // Lighting, sky, fog & camera-relative frozen sun
    this.applyLight(s.light, scene);
    const sdir = this.sunDirFor(id);
    this.sun.position.copy(this.tmpTarget).addScaledVector(sdir, 46);
    this.sun.target.position.copy(this.tmpTarget);
    this.sun.target.updateMatrixWorld();
    this.fill.position.copy(this.tmpTarget).addScaledVector(sdir, -30).add(new THREE.Vector3(0, 18, 0));
    this.fill.target.position.copy(this.tmpTarget);
    this.fill.target.updateMatrixWorld();

    this.sky.position.copy(cam.position);
    const hasSun = L.sunDisc !== "#000000" && s.set !== "vintage_library" && s.set !== "photo_reveal";
    this.sunDisc.visible = hasSun;
    this.sunHalo.visible = hasSun;
    if (hasSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sdir, 780);
      this.sunDisc.scale.set(62, 62, 1);
      this.sunHalo.position.copy(cam.position).addScaledVector(sdir, 720);
      this.sunHalo.scale.set(220, 220, 1);
    }

    const showClouds = s.set !== "vintage_library" && s.set !== "photo_reveal";
    for (const m of this.clouds) {
      m.visible = showClouds;
      if (showClouds) m.lookAt(cam.position);
    }

    // Animate shot-specific dynamic 3D props
    this.animateProps(id, f);

    // Stage 2D cartoon characters & FX cards
    cam.getWorldDirection(this.tmpFwd);
    this.tmpRight.crossVectors(this.tmpFwd, this.tmpUp).normalize();
    const camInfo: CamInfo = { pos: cam.position, right: this.tmpRight, sun: sdir };
    const staged = stageShot(id, f, s.light, camInfo);

    while (this.actors.length < staged.actors.length) this.actors.push(new Actor(this.root));
    while (this.fxs.length < staged.fx.length) this.fxs.push(new Fx(this.root));

    for (let i = 0; i < this.actors.length; i++) {
      const A = this.actors[i];
      if (i < staged.actors.length) {
        const p = staged.actors[i];
        A.r = this.pool.req(p.key, p.size[0], p.size[1], p.size[2], p.draw);
        A.mesh.visible = true;
        A.setOpacity(p.opacity ?? 1);
        A.mesh.position.set(p.x, p.y, p.z);
        const sc = p.scale ?? 1;
        A.mesh.scale.set((p.mirror ? -1 : 1) * sc, sc, 1);
        const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
        A.mesh.rotation.set(0, yaw, ((p.roll ?? 0) * Math.PI) / 180);
      } else {
        A.mesh.visible = false;
        A.r = null;
      }
    }

    for (let i = 0; i < this.fxs.length; i++) {
      const F = this.fxs[i];
      if (i < staged.fx.length) {
        const p = staged.fx[i];
        F.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
        F.use(Boolean(p.soft));
        F.mesh.visible = true;
        F.mesh.position.set(p.x, p.y, p.z);
        F.mesh.scale.set(p.w, p.h, 1);
        if (p.flat) {
          F.mesh.rotation.set(-Math.PI / 2, 0, -(p.rot ?? 0));
        } else {
          F.mesh.lookAt(cam.position);
          if (p.rot) F.mesh.rotateZ(p.rot);
        }
      } else {
        F.mesh.visible = false;
        F.r = null;
      }
    }

    this.pool.flush();
    for (let i = 0; i < staged.actors.length; i++) this.actors[i].bind();
    for (let i = 0; i < staged.fx.length; i++) this.fxs[i].bind();

    return this.tmpTarget;
  }
}
