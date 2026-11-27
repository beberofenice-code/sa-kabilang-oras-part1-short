// Procedural 3D sets for "Sa Kabilang Oras (Part 1)" (13 modular origin-locked sets).
// Every static surface is batched per material with twoTone() shading and hand-painted Canvas2D textures.
// Dynamic handles (crash sedan + headlights, kalesa, clock tower hands, sky siren clouds, library sunbeams,
// double-sided flipping 1970s photograph card, cliffhanger road rift & headlight beams) animate in world.ts.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import {
  wetAsphaltHD, cityTowerHD, cobblePlazaHD, bahayBatoHD, clayRoofHD,
  adobeStoneHD, clockDialHD, planksHD, grassHD, riverHD, barkHD, foliageHD,
  bookshelfHD, libraryWallHD, photoFrontHD, photoBackHD, rep,
} from "./paint";
import type { SetId } from "./story";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const mats = new Map<string, THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};

const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};

export const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1, u0 = 0, v0 = 0) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
};

export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3, tile = 0, bottom = false) => {
  const [x0, y0, z0] = [min.x, min.y, min.z], [x1, y1, z1] = [max.x, max.y, max.z];
  const t = (a: number) => (tile ? a / tile : 1);
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const faces = [
    quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), t(w), t(h)),
    quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), t(h)),
    quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), t(h)),
    quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), t(h)),
    quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d)),
  ];
  if (bottom) faces.push(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)));
  return mergeGeometries(faces, false);
};

export const quadUp = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = 0) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), u, v);

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal));
    else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- Reusable Architectural & Nature Builders ----------------

function addBahayNaBato(
  b: Batch, x: number, z: number, w: number, h: number, d: number, yaw: number,
  facMat: THREE.Material, wallMat: THREE.Material, roofMat: THREE.Material, trimMat: THREE.Material
) {
  const m = new THREE.Matrix4().makeTranslation(x, 0, z).multiply(new THREE.Matrix4().makeRotationY(yaw));
  b.add(boxGeo(V(-w / 2 - 0.14, 0, -d / 2 - 0.14), V(w / 2 + 0.14, 0.36, d / 2 + 0.14), 2), trimMat, m);
  b.add(quad(V(-w / 2, 0.36, d / 2), V(w / 2, 0.36, d / 2), V(w / 2, h, d / 2), V(-w / 2, h, d / 2), 1, 1), facMat, m);
  b.add(quad(V(w / 2, 0.36, -d / 2), V(-w / 2, 0.36, -d / 2), V(-w / 2, h, -d / 2), V(w / 2, h, -d / 2), 1, 1), facMat, m);
  b.add(quad(V(-w / 2, 0.36, -d / 2), V(-w / 2, 0.36, d / 2), V(-w / 2, h, d / 2), V(-w / 2, h, -d / 2), 1, 1), wallMat, m);
  b.add(quad(V(w / 2, 0.36, d / 2), V(w / 2, 0.36, -d / 2), V(w / 2, h, -d / 2), V(w / 2, h, d / 2), 1, 1), wallMat, m);
  const ov = 0.72, rh = 2.05;
  b.add(quad(V(-w / 2 - ov, h - 0.1, d / 2 + ov), V(w / 2 + ov, h - 0.1, d / 2 + ov), V(w / 2 - 0.55, h + rh, 0), V(-w / 2 + 0.55, h + rh, 0), 3, 2), roofMat, m);
  b.add(quad(V(w / 2 + ov, h - 0.1, -d / 2 - ov), V(-w / 2 - ov, h - 0.1, -d / 2 - ov), V(-w / 2 + 0.55, h + rh, 0), V(w / 2 - 0.55, h + rh, 0), 3, 2), roofMat, m);
  // Solid left & right gable infill walls under pitched roof (zero sky gap!)
  b.add(quad(V(-w / 2, h - 0.1, -d / 2), V(-w / 2, h - 0.1, d / 2), V(-w / 2 + 0.45, h + rh - 0.05, 0), V(-w / 2 + 0.45, h + rh - 0.05, 0), 1, 1), wallMat, m);
  b.add(quad(V(w / 2, h - 0.1, d / 2), V(w / 2, h - 0.1, -d / 2), V(w / 2 - 0.45, h + rh - 0.05, 0), V(w / 2 - 0.45, h + rh - 0.05, 0), 1, 1), wallMat, m);
  // Subtle wooden balcony ledge
  b.add(boxGeo(V(-w * 0.36, h * 0.48, d / 2), V(w * 0.36, h * 0.52, d / 2 + 0.65), 1.4), trimMat, m);
}

function addAcaciaTree(b: Batch, x: number, y: number, z: number, sc: number, trunkMat: THREE.Material, leafMat: THREE.Material, leafHi: THREE.Material, blossomMat?: THREE.Material) {
  b.add(new THREE.CylinderGeometry(0.42 * sc, 0.68 * sc, 3.6 * sc, 9), trunkMat, new THREE.Matrix4().makeTranslation(x, y + 1.8 * sc, z));
  // Spreading branches
  for (const [ang, tilt] of [[0.4, 0.55], [2.4, 0.58], [4.5, 0.52]] as const) {
    const m = new THREE.Matrix4().makeTranslation(x, y + 3.1 * sc, z)
      .multiply(new THREE.Matrix4().makeRotationY(ang))
      .multiply(new THREE.Matrix4().makeRotationZ(tilt))
      .multiply(new THREE.Matrix4().makeTranslation(0, 1.3 * sc, 0));
    b.add(new THREE.CylinderGeometry(0.18 * sc, 0.30 * sc, 2.6 * sc, 7), trunkMat, m);
  }
  const puffs: [number, number, number, number, boolean][] = [
    [0, 5.2, 0, 2.8, false], [-2.5, 4.7, 0.6, 2.1, true], [2.5, 4.8, -0.4, 2.2, false],
    [0.5, 5.9, -1.6, 2.0, true], [-1.2, 5.4, -1.8, 1.85, false], [1.6, 5.1, 1.6, 1.9, true],
  ];
  for (const [ox, oy, oz, r, hi] of puffs) {
    b.add(new THREE.IcosahedronGeometry(r * sc, 1), hi ? leafHi : leafMat,
      new THREE.Matrix4().makeTranslation(x + ox * sc, y + oy * sc, z + oz * sc));
  }
  if (blossomMat) {
    for (const [ox, oy, oz] of [[-2.1, 4.1, 1.4], [1.9, 4.3, 1.2], [0.2, 4.7, 1.9], [-0.9, 4.9, -1.2]] as const) {
      b.add(new THREE.IcosahedronGeometry(0.62 * sc, 0), blossomMat,
        new THREE.Matrix4().makeTranslation(x + ox * sc, y + oy * sc, z + oz * sc));
    }
  }
}

function addLampPost(parent: THREE.Object3D, b: Batch, x: number, z: number, ironMat: THREE.Material, h = 4.2, glowCol = new THREE.Color(2.4, 1.9, 1.0)) {
  b.add(new THREE.CylinderGeometry(0.08, 0.14, h, 8), ironMat, new THREE.Matrix4().makeTranslation(x, h / 2, z));
  b.add(boxGeo(V(x - 0.28, h - 0.12, z - 0.28), V(x + 0.28, h + 0.08, z + 0.28)), ironMat);
  b.add(new THREE.ConeGeometry(0.36, 0.34, 6), ironMat, new THREE.Matrix4().makeTranslation(x, h + 0.56, z));
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 8),
    new THREE.MeshBasicMaterial({ color: glowCol, fog: false })
  );
  bulb.position.set(x, h + 0.22, z);
  bulb.layers.set(NOINK);
  parent.add(bulb);
}

/** Modern night sedan with crisp HDR headlights & subtle translucent light cones (Shot 1 crash) */
function makeCrashCar(bodyMat: THREE.Material, glassMat: THREE.Material, darkMat: THREE.Material): { group: THREE.Group; beams: THREE.Group } {
  const g = new THREE.Group();
  const b = new Batch();
  b.add(boxGeo(V(-2.2, 0.38, -0.96), V(2.2, 1.05, 0.96)), bodyMat);
  b.add(boxGeo(V(-1.15, 1.05, -0.84), V(0.85, 1.68, 0.84)), bodyMat);
  b.add(boxGeo(V(-1.05, 1.12, -0.87), V(0.75, 1.60, 0.87)), glassMat);
  b.add(boxGeo(V(-1.20, 1.10, -0.76), V(0.90, 1.58, 0.76)), glassMat);
  b.add(boxGeo(V(2.15, 0.36, -0.98), V(2.34, 0.66, 0.98)), darkMat);
  b.add(boxGeo(V(-2.34, 0.36, -0.98), V(-2.15, 0.66, 0.98)), darkMat);
  for (const wx of [-1.32, 1.32]) for (const wz of [-0.94, 0.94]) {
    b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 12), darkMat,
      new THREE.Matrix4().makeTranslation(wx, 0.38, wz).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  }
  b.build(g, true);

  // Subtle translucent headlamp cones (never wash out Mateo!) + crisp HDR headlamp bulbs
  const beams = new THREE.Group();
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.5, 1.6), fog: false });
  const coneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.88, 0.62), transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  for (const hz of [-0.62, 0.62]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), bulbMat);
    lamp.position.set(2.26, 0.76, hz); lamp.layers.set(NOINK); beams.add(lamp);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 4.4, 14, 1, true), coneMat);
    cone.position.set(4.4, 0.68, hz); cone.rotation.z = Math.PI / 2; cone.layers.set(NOINK); beams.add(cone);
  }
  g.add(beams);
  return { group: g, beams };
}

/** Heritage Filipino Kalesa horse-drawn carriage (Shot 3 unknown era!) */
function makeKalesa(woodMat: THREE.Material, hoodMat: THREE.Material, wheelMat: THREE.Material, horseMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const b = new Batch();
  // Carriage cabin + curved canopy hood
  b.add(boxGeo(V(-1.3, 0.75, -0.78), V(0.55, 1.45, 0.78), 1.4), woodMat);
  b.add(boxGeo(V(-1.38, 1.45, -0.82), V(0.35, 2.38, 0.82), 1.6), hoodMat);
  // Twin big spoked carriage wheels
  for (const wz of [-0.88, 0.88]) {
    b.add(new THREE.TorusGeometry(0.72, 0.08, 7, 16), wheelMat, new THREE.Matrix4().makeTranslation(-0.4, 0.74, wz));
    for (let s = 0; s < 4; s++) {
      b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), wheelMat,
        new THREE.Matrix4().makeTranslation(-0.4, 0.74, wz).multiply(new THREE.Matrix4().makeRotationZ((s * Math.PI) / 4)));
    }
  }
  // Wooden shafts
  for (const sz of [-0.46, 0.46]) {
    b.add(boxGeo(V(0.5, 0.92, sz - 0.05), V(2.4, 1.02, sz + 0.05)), woodMat);
  }
  // Stylized cartoon horse in front!
  b.add(boxGeo(V(1.65, 1.05, -0.34), V(3.05, 1.72, 0.34)), horseMat); // torso
  b.add(boxGeo(V(2.75, 1.55, -0.22), V(3.38, 2.30, 0.22)), horseMat); // neck
  b.add(boxGeo(V(3.05, 2.02, -0.20), V(3.75, 2.38, 0.20)), horseMat); // head
  for (const lx of [1.82, 2.85]) for (const lz of [-0.22, 0.22]) {
    b.add(new THREE.CylinderGeometry(0.08, 0.07, 1.08, 7), horseMat, new THREE.Matrix4().makeTranslation(lx, 0.54, lz));
  }
  b.build(g, true);
  return g;
}

export type DynProps = {
  crashCar: THREE.Group;
  carBeams: THREE.Group;
  kalesa: THREE.Group;
  clockHour: THREE.Mesh;
  clockMin: THREE.Mesh;
  sirenRed: THREE.Mesh;
  sirenBlue: THREE.Mesh;
  sunShafts: THREE.Group;
  photoCard: THREE.Group;
  roadCrack: THREE.Mesh;
  riftGroup: THREE.Group;
  riftCore: THREE.Mesh;
};

export type BuiltSets = {
  groups: Record<SetId, THREE.Group>;
  dyn: DynProps;
};

export function buildAllSets(root: THREE.Object3D): BuiltSets {
  // Shared painted materials
  const wetRoad = lam("wetRoad", () => ({ map: rep(wetAsphaltHD(), 2, 12) }));
  const cityWallA = lam("cityWallA", () => ({ map: rep(cityTowerHD("ctA", "#333c52"), 1, 2) }));
  const cityWallB = lam("cityWallB", () => ({ map: rep(cityTowerHD("ctB", "#2b3246"), 1, 2) }));
  const cobble = lam("cobble", () => ({ map: rep(cobblePlazaHD(), 7, 7) }));
  const cobbleLong = lam("cobbleLong", () => ({ map: rep(cobblePlazaHD(), 5, 10) }));
  const facCream = lam("facCream", () => ({ map: bahayBatoHD("bbCream", "#e8dac0") }));
  const facOchre = lam("facOchre", () => ({ map: bahayBatoHD("bbOchre", "#dfbe86") }));
  const facTerra = lam("facTerra", () => ({ map: bahayBatoHD("bbTerra", "#d89c80") }));
  const facSage = lam("facSage", () => ({ map: bahayBatoHD("bbSage", "#c8d1ba") }));
  const wallPlaster = lam("wallPlaster", () => ({ color: "#d6c7ae" }));
  const roofClay = lam("roofClay", () => ({ map: rep(clayRoofHD(), 1, 1) }));
  const roofDark = lam("roofDark", () => ({ map: rep(clayRoofHD("roofDark", "#8c4432"), 1, 1) }));
  const adobe = lam("adobe", () => ({ map: rep(adobeStoneHD(), 2, 2) }));
  const adobeTall = lam("adobeTall", () => ({ map: rep(adobeStoneHD("adobeTall"), 2, 5) }));
  const wood = lam("wood", () => ({ map: rep(planksHD(), 2, 2) }));
  const woodDark = lam("woodDark", () => ({ color: "#523320" }));
  const grass = lam("grass", () => ({ map: rep(grassHD(), 8, 8) }));
  const river = lam("river", () => ({ map: rep(riverHD(), 4, 8) }));
  const bark = lam("bark", () => ({ map: barkHD() }));
  const leaf = lam("leaf", () => ({ map: foliageHD() }));
  const leafHi = lam("leafHi", () => ({ map: foliageHD("foliageHi", "#529848") }));
  const blossom = lam("blossom", () => ({ color: "#d85c74" }));
  const iron = lam("iron", () => ({ color: "#2d323c" }));
  const carRed = lam("carRed", () => ({ color: "#4e5c72" }));
  const carGlass = lam("carGlass", () => ({ color: "#88a4c4" }));
  const kalesaHood = lam("kalesaHood", () => ({ color: "#8e3430" }));
  const horseCoat = lam("horseCoat", () => ({ color: "#7a4a2b" }));
  const shelfMat = lam("shelfMat", () => ({ map: bookshelfHD() }));
  const libWall = lam("libWall", () => ({ map: rep(libraryWallHD(), 3, 1) }));
  const clothA = lam("clothA", () => ({ color: "#c85242" }));
  const clothB = lam("clothB", () => ({ color: "#3d7a82" }));
  const brass = lam("brass", () => ({ color: "#d4a442" }));

  const groups = {} as Record<SetId, THREE.Group>;
  const mk = (id: SetId) => { const g = new THREE.Group(); g.visible = false; root.add(g); groups[id] = g; return g; };

  // ==================== 1. NIGHT ROAD CRASH (Shot 1) ====================
  const g1 = mk("night_road_crash");
  const b1 = new Batch();
  b1.add(quadUp(-80, 80, -80, 40, 1, 1, -0.05), lam("nightGround", () => ({ color: "#262c38" })));
  b1.add(quadUp(-6.5, 6.5, -55, 25, 1, 1, 0.0), wetRoad);
  // Sidewalk curbs
  b1.add(boxGeo(V(-14, 0, -55), V(-6.5, 0.24, 25), 2), adobe);
  b1.add(boxGeo(V(6.5, 0, -55), V(14, 0.24, 25), 2), adobe);
  // Modern city apartment towers on both sides (kept clear of camera)
  for (const [tx, tz, w, h, d, alt] of [
    [-12.5, -6, 9, 18, 9, false], [-13.5, -20, 10, 24, 10, true], [-12.0, -35, 10, 20, 10, false],
    [12.5, -8, 9, 20, 9, true], [13.5, -22, 10, 25, 10, false], [12.0, -36, 10, 19, 10, true],
    [-4.5, -42, 12, 28, 10, false], [8.0, -45, 12, 26, 10, true],
  ] as const) {
    b1.add(boxGeo(V(tx - w / 2, 0, tz - d / 2), V(tx + w / 2, h, tz + d / 2)), alt ? cityWallB : cityWallA);
  }
  addLampPost(g1, b1, -6.8, -1.5, iron, 5.2, new THREE.Color(3.0, 2.3, 1.3));
  addLampPost(g1, b1, 6.8, -10.5, iron, 5.2, new THREE.Color(3.0, 2.3, 1.3));
  addLampPost(g1, b1, -6.8, -21.0, iron, 5.2, new THREE.Color(3.0, 2.3, 1.3));
  b1.build(g1, true);
  const { group: crashCar, beams: carBeams } = makeCrashCar(carRed, carGlass, iron);
  crashCar.position.set(-14, 0, 0.6);
  g1.add(crashCar);

  // ==================== 2. EMPTY DAWN STREET (Shot 2) ====================
  const g2 = mk("empty_dawn_street");
  const b2 = new Batch();
  b2.add(quadUp(-90, 90, -90, 40, 1, 1, -0.05), grass);
  b2.add(quadUp(-16, 16, -65, 25, 1, 1, 0.0), cobbleLong);
  addBahayNaBato(b2, -9.2, -4.5, 6.2, 6.6, 5.2, Math.PI / 2, facCream, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b2, -9.5, -13.5, 6.4, 7.2, 5.4, Math.PI / 2, facOchre, wallPlaster, roofDark, woodDark);
  addBahayNaBato(b2, 9.2, -5.5, 6.2, 6.8, 5.2, -Math.PI / 2, facTerra, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b2, 9.4, -15.0, 6.4, 6.4, 5.4, -Math.PI / 2, facSage, wallPlaster, roofDark, woodDark);
  addAcaciaTree(b2, -8.5, 0, -24, 1.25, bark, leaf, leafHi, blossom);
  addAcaciaTree(b2, 8.8, 0, -26, 1.35, bark, leaf, leafHi);
  addLampPost(g2, b2, -5.4, -3.0, iron, 4.0);
  addLampPost(g2, b2, 5.4, -11.0, iron, 4.0);
  b2.build(g2, true);

  // ==================== 3. VINTAGE PLAZA & KALESA (Shot 3) ====================
  const g3 = mk("vintage_plaza");
  const b3 = new Batch();
  b3.add(quadUp(-100, 100, -100, 45, 1, 1, -0.05), grass);
  b3.add(quadUp(-26, 26, -34, 24, 1, 1, 0.0), cobble);
  // Central stone heritage fountain
  b3.add(new THREE.CylinderGeometry(2.6, 2.9, 0.65, 16), adobe, new THREE.Matrix4().makeTranslation(0, 0.32, -6.5));
  b3.add(new THREE.CylinderGeometry(2.3, 2.3, 0.12, 16), river, new THREE.Matrix4().makeTranslation(0, 0.62, -6.5));
  b3.add(new THREE.CylinderGeometry(0.42, 0.62, 2.4, 10), adobe, new THREE.Matrix4().makeTranslation(0, 1.4, -6.5));
  b3.add(new THREE.CylinderGeometry(1.15, 0.45, 0.42, 12), adobe, new THREE.Matrix4().makeTranslation(0, 2.35, -6.5));
  // Ancestral Bahay na Bato ring framing plaza
  addBahayNaBato(b3, -12.5, -4.0, 6.5, 7.0, 5.5, Math.PI / 2, facCream, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b3, -11.5, -14.5, 6.8, 7.6, 5.5, Math.PI / 3, facTerra, wallPlaster, roofDark, woodDark);
  addBahayNaBato(b3, 0.0, -21.5, 8.2, 8.2, 6.0, 0, facOchre, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b3, 11.8, -14.0, 6.6, 7.2, 5.4, -Math.PI / 3, facSage, wallPlaster, roofDark, woodDark);
  addBahayNaBato(b3, 13.0, -3.5, 6.4, 6.8, 5.2, -Math.PI / 2, facCream, wallPlaster, roofClay, woodDark);
  addAcaciaTree(b3, -7.8, 0, -10.5, 0.92, bark, leaf, leafHi, blossom);
  addAcaciaTree(b3, 8.2, 0, -10.0, 0.95, bark, leaf, leafHi, blossom);
  addLampPost(g3, b3, -4.6, -2.5, iron, 4.0);
  addLampPost(g3, b3, 4.6, -2.5, iron, 4.0);
  b3.build(g3, true);
  const kalesa = makeKalesa(wood, kalesaHood, woodDark, horseCoat);
  kalesa.position.set(-10, 0, -1.6);
  g3.add(kalesa);

  // ==================== 4. CLARA MEETING ("Okay ka lang?", Shot 4) ====================
  const g4 = mk("clara_meeting");
  const b4 = new Batch();
  b4.add(quadUp(-90, 90, -90, 40, 1, 1, -0.05), grass);
  b4.add(quadUp(-20, 20, -32, 20, 1, 1, 0.0), cobble);
  // Warm low stone planter & flowering bougainvillea framing golden bokeh background
  b4.add(boxGeo(V(-5.5, 0, -4.5), V(5.5, 0.72, -3.4), 2), adobe);
  addAcaciaTree(b4, -5.6, 0, -6.2, 1.05, bark, leaf, leafHi, blossom);
  addAcaciaTree(b4, 6.0, 0, -6.8, 1.10, bark, leaf, leafHi, blossom);
  addBahayNaBato(b4, -9.2, -13.5, 7.2, 7.4, 5.5, 0.35, facOchre, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b4, 8.4, -14.2, 7.0, 7.0, 5.4, -0.35, facCream, wallPlaster, roofDark, woodDark);
  addLampPost(g4, b4, -3.8, -3.2, iron, 4.0);
  addLampPost(g4, b4, 4.2, -3.4, iron, 4.0);
  b4.build(g4, true);

  // ==================== 5. OLD TOWN MARKET LANE (Shot 5) ====================
  const g5 = mk("old_town_lane");
  const b5 = new Batch();
  b5.add(quadUp(-90, 90, -90, 40, 1, 1, -0.05), grass);
  b5.add(quadUp(-18, 18, -34, 20, 1, 1, 0.0), cobbleLong);
  // Charming wooden market stalls along back edge
  for (let i = 0; i < 4; i++) {
    const sx = -6.8 + i * 4.5, sz = -3.8;
    b5.add(boxGeo(V(sx - 1.4, 0, sz - 0.8), V(sx + 1.4, 1.0, sz + 0.8), 1.4), wood);
    for (const px of [-1.3, 1.3]) for (const pz of [-0.7, 0.7]) {
      b5.add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), woodDark, new THREE.Matrix4().makeTranslation(sx + px, 1.3, sz + pz));
    }
    b5.add(boxGeo(V(sx - 1.65, 2.52, sz - 1.0), V(sx + 1.65, 2.74, sz + 1.05)), i % 2 ? clothB : clothA);
    // Painted clay banga pots / woven baskets on stall counter
    b5.add(new THREE.SphereGeometry(0.28, 9, 7), lam("clayPot", () => ({ color: "#b66442" })), new THREE.Matrix4().makeTranslation(sx - 0.6, 1.24, sz + 0.1));
    b5.add(new THREE.SphereGeometry(0.24, 9, 7), lam("wovenB", () => ({ color: "#d6a45e" })), new THREE.Matrix4().makeTranslation(sx + 0.4, 1.20, sz + 0.15));
  }
  addBahayNaBato(b5, -10.5, -11.5, 7.4, 7.6, 5.5, 0.12, facCream, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b5, 0.0, -12.5, 8.2, 8.2, 5.8, 0, facTerra, wallPlaster, roofDark, woodDark);
  addBahayNaBato(b5, 10.6, -11.5, 7.4, 7.4, 5.5, -0.12, facOchre, wallPlaster, roofClay, woodDark);
  // Warm strung festival lanterns overhead (HDR glow, NOINK!)
  for (let i = 0; i < 7; i++) {
    const lx = -7.2 + i * 2.4, ly = 4.4 - Math.sin((i / 6) * Math.PI) * 0.65;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, 0.8), fog: false }));
    bulb.position.set(lx, ly, -1.6); bulb.layers.set(NOINK); g5.add(bulb);
  }
  b5.build(g5, true);

  // ==================== 6. STOPPED CLOCK TOWER (Shot 6) ====================
  const g6 = mk("clock_tower");
  const b6 = new Batch();
  b6.add(quadUp(-90, 90, -90, 40, 1, 1, -0.05), grass);
  b6.add(quadUp(-24, 24, -34, 24, 1, 1, 0.0), cobble);
  // Majestic limestone Clock Tower at z = -7.5
  b6.add(boxGeo(V(-2.7, 0, -10.2), V(2.7, 1.2, -4.8), 2), adobe);
  b6.add(boxGeo(V(-2.2, 1.2, -9.7), V(2.2, 11.4, -5.3), 2.5), adobeTall);
  b6.add(boxGeo(V(-2.55, 11.2, -10.05), V(2.55, 11.8, -4.95), 2), woodDark);
  // Pyramidal clay spire roof + brass weathervane finial
  b6.add(new THREE.ConeGeometry(3.3, 4.0, 4), roofClay, new THREE.Matrix4().makeTranslation(0, 13.8, -7.5).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4)));
  b6.add(new THREE.CylinderGeometry(0.08, 0.12, 1.6, 6), brass, new THREE.Matrix4().makeTranslation(0, 16.4, -7.5));
  // Flanking ancestral houses
  addBahayNaBato(b6, -10.0, -9.5, 6.8, 6.8, 5.2, 0.25, facCream, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b6, 10.0, -9.5, 6.8, 6.8, 5.2, -0.25, facOchre, wallPlaster, roofDark, woodDark);
  addAcaciaTree(b6, -7.2, 0, -4.2, 0.85, bark, leaf, leafHi);
  addAcaciaTree(b6, 7.6, 0, -4.4, 0.85, bark, leaf, leafHi);
  b6.build(g6, true);

  // Unlit crisp brass Clock Tower Dial (y = 8.8, z = -5.22) + dynamic frozen hands!
  const dial = new THREE.Mesh(new THREE.CircleGeometry(1.65, 32), new THREE.MeshBasicMaterial({ map: clockDialHD() }));
  dial.position.set(0, 8.8, -5.22);
  dial.layers.set(NOINK);
  g6.add(dial);
  const handMat = new THREE.MeshBasicMaterial({ color: "#1c1310" });
  const clockHour = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.92, 0.06), handMat);
  clockHour.geometry.translate(0, 0.36, 0);
  clockHour.position.set(0, 8.8, -5.16);
  clockHour.rotation.z = (2.15); // ~8:15!
  clockHour.layers.set(NOINK);
  const clockMin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.32, 0.06), handMat);
  clockMin.geometry.translate(0, 0.56, 0);
  clockMin.position.set(0, 8.8, -5.14);
  clockMin.rotation.z = -Math.PI / 2; // 15 min!
  clockMin.layers.set(NOINK);
  g6.add(clockHour, clockMin);

  // ==================== 7. HILLSIDE DAYS PASSING (Shot 7) ====================
  const g7 = mk("hillside_days");
  const b7 = new Batch();
  b7.add(quadUp(-100, 100, -100, 35, 1, 1, -0.04), grass);
  // Warm gravel walking path
  b7.add(quadUp(-24, 24, -2.2, 3.6, 1, 1, 0.01), cobbleLong);
  // Low stone hillside overlook wall
  b7.add(boxGeo(V(-20, 0, -2.7), V(20, 0.85, -2.15), 2), adobe);
  // Distant miniature old town roofs & shimmering river valley below
  b7.add(quadUp(-80, 80, -75, -18, 1, 1, -2.2), river);
  for (let i = 0; i < 6; i++) {
    const hx = -15 + i * 6.2, hz = -13.5 - (i % 2) * 3.8;
    addBahayNaBato(b7, hx, hz, 4.4, 4.4, 3.8, (i % 2 ? 0.18 : -0.18), i % 2 ? facCream : facOchre, wallPlaster, roofClay, woodDark);
  }
  addAcaciaTree(b7, -8.5, 0, -4.5, 1.15, bark, leaf, leafHi, blossom);
  addAcaciaTree(b7, 9.2, 0, -4.8, 1.2, bark, leaf, leafHi, blossom);
  b7.build(g7, true);

  // ==================== 8. RIVER, SUNSET BRIDGE & ACACIA TREE (Shot 8) ====================
  const g8 = mk("river_bridge_sunset");
  const b8 = new Batch();
  b8.add(quadUp(-100, 100, -90, 40, 1, 1, -0.12), river);
  // Left riverbank & right acacia park bank
  b8.add(boxGeo(V(-28, -0.2, -16), V(-3.8, 0.32, 16), 3), grass);
  b8.add(boxGeo(V(3.8, -0.2, -16), V(28, 0.32, 16), 3), grass);
  b8.add(quadUp(-14, -4.0, -3.5, 4.5, 1, 1, 0.34), cobbleLong);
  // Iconic arched heritage stone bridge spanning x = -4.2 to +4.2!
  b8.add(boxGeo(V(-4.4, 0.25, -2.2), V(4.4, 0.82, 2.2), 2), adobe);
  b8.add(boxGeo(V(-4.3, 0.82, -2.15), V(4.3, 1.62, -1.85), 2), adobe);
  b8.add(boxGeo(V(-4.3, 0.82, 1.85), V(4.3, 1.62, 2.15), 2), adobe);
  // Bridge stone piers
  for (const px of [-3.6, 0, 3.6]) {
    b8.add(boxGeo(V(px - 0.55, -0.4, -2.25), V(px + 0.55, 0.85, 2.25), 1.5), adobe);
  }
  addLampPost(g8, b8, -3.6, -2.0, iron, 3.6);
  addLampPost(g8, b8, 3.6, -2.0, iron, 3.6);
  // Giant spreading acacia tree on right bank (x = 6.2, z = -1.6)
  addAcaciaTree(b8, 6.4, 0.3, -2.4, 1.35, bark, leaf, leafHi, blossom);
  addAcaciaTree(b8, -9.5, 0.3, -4.2, 1.05, bark, leaf, leafHi);
  addBahayNaBato(b8, -11.5, -12.5, 6.6, 6.8, 5.2, 0.2, facOchre, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b8, 12.2, -13.0, 6.8, 7.0, 5.2, -0.25, facCream, wallPlaster, roofDark, woodDark);
  b8.build(g8, true);

  // ==================== 9. FIREFLY ACACIA TREE AT DUSK (Shot 9) ====================
  const g9 = mk("firefly_acacia");
  const b9 = new Batch();
  b9.add(quadUp(-90, 90, -90, 35, 1, 1, -0.02), grass);
  // Hero giant spreading acacia tree directly behind Mateo & Clara!
  addAcaciaTree(b9, 0.0, 0, -2.8, 1.75, bark, leaf, leafHi);
  // Cozy stone park bench beneath the acacia
  b9.add(boxGeo(V(-1.7, 0.0, -0.45), V(1.7, 0.56, 0.25), 1.4), wood);
  b9.add(boxGeo(V(-1.55, 0.0, -0.42), V(-1.2, 0.52, 0.22)), adobe);
  b9.add(boxGeo(V(1.2, 0.0, -0.42), V(1.55, 0.52, 0.22)), adobe);
  // Soft distant silhouette town lanterns across the meadow
  addAcaciaTree(b9, -9.0, 0, -14.0, 1.25, bark, leaf, leafHi);
  addAcaciaTree(b9, 9.5, 0, -15.0, 1.30, bark, leaf, leafHi);
  addLampPost(g9, b9, -5.2, -7.5, iron, 3.8, new THREE.Color(2.6, 1.8, 0.9));
  addLampPost(g9, b9, 5.4, -8.2, iron, 3.8, new THREE.Color(2.6, 1.8, 0.9));
  b9.build(g9, true);

  // ==================== 10. SIREN SKY & CLARA FADING (Shot 10) ====================
  const g10 = mk("siren_sky_fade");
  const b10 = new Batch();
  b10.add(quadUp(-90, 90, -90, 35, 1, 1, -0.06), river);
  b10.add(quadUp(-24, 24, -4.5, 16, 1, 1, 0.0), cobble);
  b10.add(boxGeo(V(-24, 0, -4.8), V(24, 0.92, -4.15), 2), adobe);
  addLampPost(g10, b10, -4.5, -4.4, iron, 4.2, new THREE.Color(1.8, 2.2, 2.8));
  addLampPost(g10, b10, 4.5, -4.4, iron, 4.2, new THREE.Color(1.8, 2.2, 2.8));
  addAcaciaTree(b10, -8.5, 0, -7.5, 1.1, bark, leaf, leafHi);
  addAcaciaTree(b10, 8.8, 0, -8.0, 1.15, bark, leaf, leafHi);
  b10.build(g10, true);
  // Distant eerie red & blue sky siren soft radial glow clouds overhead (zero hard sphere edges!)
  const makeGlowTex = (rgbaInner: string, rgbaOuter: string) => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 8, 128, 128, 124);
    gr.addColorStop(0, rgbaInner); gr.addColorStop(0.5, rgbaOuter); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const sirenRed = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshBasicMaterial({ map: makeGlowTex("rgba(255,75,75,0.95)", "rgba(220,40,60,0.35)"), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  sirenRed.position.set(-4.2, 9.2, -16.0); sirenRed.layers.set(NOINK);
  const sirenBlue = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshBasicMaterial({ map: makeGlowTex("rgba(75,165,255,0.95)", "rgba(40,115,245,0.35)"), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  sirenBlue.position.set(4.2, 9.2, -16.0); sirenBlue.layers.set(NOINK);
  g10.add(sirenRed, sirenBlue);

  // ==================== 11. VINTAGE TOWN LIBRARY (Shot 11) ====================
  const g11 = mk("vintage_library");
  const b11 = new Batch();
  b11.add(quadUp(-14, 14, -14, 14, 1, 1, 0), wood);
  b11.add(quad(V(-14, 0, -6.5), V(14, 0, -6.5), V(14, 8.5, -6.5), V(-14, 8.5, -6.5), 1, 1), libWall);
  b11.add(quad(V(-9.5, 0, 12), V(-9.5, 0, -6.5), V(-9.5, 8.5, -6.5), V(-9.5, 8.5, 12), 1, 1), libWall);
  b11.add(quad(V(9.5, 0, -6.5), V(9.5, 0, 12), V(9.5, 8.5, 12), V(9.5, 8.5, -6.5), 1, 1), libWall);
  for (const bx of [-5.8, -2.0, 2.0, 5.8]) {
    b11.add(boxGeo(V(bx - 1.5, 0, -6.2), V(bx + 1.5, 6.2, -5.2)), shelfMat);
  }
  b11.add(boxGeo(V(-2.2, 0.92, -0.8), V(2.2, 1.08, 1.2), 1.4), wood);
  for (const lx of [-1.9, 1.9]) for (const lz of [-0.6, 1.0]) {
    b11.add(boxGeo(V(lx - 0.12, 0, lz - 0.12), V(lx + 0.12, 0.94, lz + 0.12)), woodDark);
  }
  b11.add(boxGeo(V(-0.75, 1.08, -0.1), V(0.75, 1.18, 0.72)), lam("album", () => ({ color: "#6e2e26" })));
  b11.add(boxGeo(V(-0.68, 1.18, -0.04), V(0.68, 1.22, 0.66)), lam("pages", () => ({ color: "#f2e5c8" })));
  b11.add(new THREE.CylinderGeometry(0.06, 0.22, 0.72, 8), brass, new THREE.Matrix4().makeTranslation(1.45, 1.44, -0.3));
  b11.add(new THREE.ConeGeometry(0.38, 0.34, 10), lam("lampShade", () => ({ color: "#2e7a52" })), new THREE.Matrix4().makeTranslation(1.45, 1.85, -0.3));
  b11.build(g11, true);
  const sunShafts = new THREE.Group();
  const shaftMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.0, 0.68), transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  for (const sx of [-2.4, 0.6, 3.2]) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 9.0), shaftMat);
    sh.position.set(sx, 3.8, -2.4); sh.rotation.z = -0.32; sh.layers.set(NOINK); sunShafts.add(sh);
  }
  g11.add(sunShafts);

  // ==================== 12. 1970s PHOTO REVEAL CLOSE-UP (Shot 12) ====================
  const g12 = mk("photo_reveal");
  const b12 = new Batch();
  b12.add(quadUp(-12, 12, -12, 12, 1, 1, 0), wood);
  b12.add(quad(V(-12, 0, -5.0), V(12, 0, -5.0), V(12, 8.0, -5.0), V(-12, 8.0, -5.0), 1, 1), libWall);
  for (const bx of [-4.2, 0.0, 4.2]) {
    b12.add(boxGeo(V(bx - 1.6, 0, -4.7), V(bx + 1.6, 6.2, -3.8)), shelfMat);
  }
  b12.add(boxGeo(V(-2.6, 0.92, -1.0), V(2.6, 1.10, 1.2), 1.4), wood);
  b12.build(g12, true);

  const photoCard = new THREE.Group();
  photoCard.position.set(0.0, 1.98, 0.18);
  const pFront = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 1.82), new THREE.MeshBasicMaterial({ map: photoFrontHD() }));
  pFront.position.z = 0.014; pFront.layers.set(NOINK);
  const pBack = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 1.82), new THREE.MeshBasicMaterial({ map: photoBackHD() }));
  pBack.position.z = -0.014; pBack.rotation.y = Math.PI; pBack.layers.set(NOINK);
  const pEdge = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.84, 0.024), lam("photoEdge", () => ({ color: "#d8c7a4" })));
  photoCard.add(pEdge, pFront, pBack);
  g12.add(photoCard);

  // ==================== 13. PART 1 CLIFFHANGER — QUAKE & HEADLIGHT RIFT (Shot 13) ====================
  const g13 = mk("cliffhanger_rift");
  const b13 = new Batch();
  b13.add(quadUp(-100, 100, -100, 40, 1, 1, -0.05), grass);
  b13.add(quadUp(-24, 24, -40, 24, 1, 1, 0.0), cobble);
  addBahayNaBato(b13, -10.5, -6.5, 6.6, 7.2, 5.4, Math.PI / 2, facCream, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b13, -10.8, -17.0, 6.8, 7.4, 5.4, Math.PI / 2, facTerra, wallPlaster, roofDark, woodDark);
  addBahayNaBato(b13, 10.5, -6.5, 6.6, 7.2, 5.4, -Math.PI / 2, facOchre, wallPlaster, roofClay, woodDark);
  addBahayNaBato(b13, 10.8, -17.0, 6.8, 7.4, 5.4, -Math.PI / 2, facSage, wallPlaster, roofDark, woodDark);
  addAcaciaTree(b13, -7.8, 0, -24.0, 1.25, bark, leaf, leafHi);
  addAcaciaTree(b13, 8.2, 0, -24.0, 1.25, bark, leaf, leafHi);
  addLampPost(g13, b13, -5.2, -3.5, iron, 4.0);
  addLampPost(g13, b13, 5.2, -3.5, iron, 4.0);
  b13.build(g13, true);

  // Glowing golden road fracture line
  const roadCrack = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 14.0),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.75, 0.95), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  roadCrack.rotation.x = -Math.PI / 2;
  roadCrack.position.set(0, 0.04, -5.5);
  roadCrack.layers.set(NOINK);
  g13.add(roadCrack);

  // Balanced dramatic HDR Time-Portal & Twin Headlight Beams (glowing cleanly behind Clara without washing out frame!)
  const riftGroup = new THREE.Group();
  riftGroup.position.set(0, 2.25, -8.5);
  const riftCore = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 6.8),
    new THREE.MeshBasicMaterial({ map: makeGlowTex("rgba(255,244,205,0.92)", "rgba(255,196,112,0.34)"), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  riftCore.layers.set(NOINK);
  riftGroup.add(riftCore);

  const riftBeamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 0.80, 0.52), transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  for (const bx of [-0.95, 0.95]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.4, 1.5), fog: false }));
    bulb.position.set(bx, -0.45, 0.45); bulb.layers.set(NOINK); riftGroup.add(bulb);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.35, 7.2, 16, 1, true), riftBeamMat);
    beam.position.set(bx * 1.15, -0.55, 4.0); beam.rotation.x = -Math.PI / 2; beam.layers.set(NOINK); riftGroup.add(beam);
  }
  riftGroup.visible = false;
  g13.add(riftGroup);

  return {
    groups,
    dyn: { crashCar, carBeams, kalesa, clockHour, clockMin, sirenRed, sirenBlue, sunShafts, photoCard, roadCrack, riftGroup, riftCore },
  };
}
