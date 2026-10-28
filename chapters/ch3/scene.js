// 3장 장면: 비바람 속 삼교천(고려 진영, 둑 자리, 냇물을 건너는 거란군)과 남쪽의 귀주 벌판.
import * as THREE from 'three';
import { backdropMountains } from '../kit/terrain.js';
import { tent, tree, spearRack } from '../kit/buildings.js';
import { burning } from '../kit/fire.js';
import { BUILD } from '../kit/town.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';
import { scatter } from '../../core/props.js';
import { LOOKS, look } from '../../content/characters.js';
import { createWeather } from '../../core/weather.js';

const RIVER_Z = -8, RIVER_W = 6;
const DAM_X = -10;   // 쇠가죽 둑(냇물 위쪽). 물은 +x 쪽(아래쪽)으로 흐른다
const ARMY_X = 1.5;  // 거란군이 냇물을 건너는 여울(둑 위 학생 자리에서 화면 안에 보이게)
const GUJU_Z = 75;   // 귀주 벌판(진영에서 멀리 남쪽, 장면 전환으로만 간다). 귀주 놀이 때만 보인다
// 귀주 언덕(D-12): 고려군 뒤 둥근 언덕. 꼭대기(타원, 가로 반지름 12·세로 6)는 높이 HILL_H로 평평하다
export const HILL = { x: 0, z: GUJU_Z + 11, rx: 12, rz: 6 };
export const HILL_H = 1.2;
export function hillHeight(x, z) {
  return ((x - HILL.x) / HILL.rx) ** 2 + ((z - HILL.z) / HILL.rz) ** 2 < 1 ? HILL_H : 0;
}
const GATE_Z = 24;   // 진영 남문
// 냇가 둑(D-10): 학생과 강감찬이 올라서는 흙둑. 둑 위 높이 BANK_TOP
export const BANK = { x0: DAM_X - 0.6, x1: DAM_X + 10.6, z0: -4.6, z1: -2.6 };
export const BANK_TOP = 0.35;
export function bankHeight(x, z) {
  return x > BANK.x0 && x < BANK.x1 && z > BANK.z0 && z < BANK.z1 ? BANK_TOP : 0;
}

// 땅 높이(지형과 같은 식): 소품을 땅 위에 놓을 때 쓴다
function groundH(x, z) {
  let h = 0.1 * Math.sin(x * 0.4) * Math.cos(z * 0.3);
  const dr = Math.abs(z - RIVER_Z);
  if (dr < RIVER_W / 2 + 1.5) { const k = 1 - dr / (RIVER_W / 2 + 1.5); h -= k * k * (3 - 2 * k) * 1.4; }
  const far = Math.max(0, Math.abs(x) - 40, -z - 40, z - 90);
  return h + Math.min(far * far * 0.03, 14);
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 쏟아지는 물(D-12): 둑에서 아래쪽(+x)으로 흘러가며 퍼지는 청록 반투명 물살과 앞쪽의 흰 물거품.
// 평면·곡면 몇 장으로 만들고, 화질 '보통·높음'(waves)에서만 꼭짓점을 위치에 따라 출렁이게 한다.
function makeFlood(parent, waves) {
  const g = new THREE.Group(); g.visible = false; parent.add(g);
  const LEN = 34, W = RIVER_W + 1.2;
  const bodyGeo = new THREE.PlaneGeometry(LEN, W, waves ? 34 : 1, waves ? 6 : 1).rotateX(-Math.PI / 2).translate(-LEN / 2, 0, 0); // 앞끝이 x=0
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({ color: 0x2f8a92, transparent: true, opacity: 0.78, shininess: 60, specular: 0x9fd6dc, depthWrite: false }));
  g.add(body);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(LEN, W + 1.6).rotateX(-Math.PI / 2).translate(-LEN / 2, -0.12, 0), new THREE.MeshLambertMaterial({ color: 0x1f6670, transparent: true, opacity: 0.55, depthWrite: false }));
  g.add(back);
  // 앞쪽 물마루: 반쯤 감긴 곡면(물살 색) 위에 흰 물거품 곡면
  const crestGeo = new THREE.CylinderGeometry(0.75, 0.75, W, 12, 1, true, 0, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2);
  const crest = new THREE.Mesh(crestGeo, new THREE.MeshPhongMaterial({ color: 0x3fa3aa, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  crest.position.set(-0.4, 0.15, 0); g.add(crest);
  const foamGeo = new THREE.CylinderGeometry(0.85, 0.85, W + 0.3, 12, waves ? 6 : 1, true, 0, Math.PI * 0.9).rotateX(Math.PI / 2).rotateY(Math.PI / 2);
  const foam = new THREE.Mesh(foamGeo, new THREE.MeshBasicMaterial({ color: 0xf4f8f8, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  foam.position.set(0.1, 0.55, 0); g.add(foam);
  const spray = [];
  if (waves) for (let i = 0; i < 12; i++) { // 앞에서 튀는 물보라(보통·높음만)
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 7, 5), foam.material); s.userData.k = (i * 0.37) % 1; g.add(s); spray.push(s);
  }
  const bp = bodyGeo.attributes.position, base = Float32Array.from(bp.array);
  const fp = foamGeo.attributes.position, fbase = Float32Array.from(fp.array);
  return {
    group: g,
    // t초째 모습: 앞끝 x, 퍼지는 정도, 출렁임
    show(front, spread, t) {
      g.visible = true;
      g.position.set(front, -0.3, RIVER_Z);
      g.scale.set(1, 1, spread);
      foam.scale.y = 1 + Math.sin(t * 9) * 0.12; crest.rotation.x = Math.sin(t * 5) * 0.08;
      if (waves) {
        for (let i = 0; i < bp.count; i++) {
          const x = base[i * 3], z = base[i * 3 + 2], near = Math.max(0, 1 + x / 8); // 앞쪽일수록 높고 거칠다
          bp.setY(i, Math.sin(x * 0.9 + t * 7 + z * 0.8) * 0.12 + Math.cos(z * 1.7 - t * 5) * 0.06 + near * 0.5);
        }
        bp.needsUpdate = true;
        for (let i = 0; i < fp.count; i++) fp.setY(i, fbase[i * 3 + 1] + Math.sin(fbase[i * 3 + 2] * 2.3 + t * 11) * 0.08);
        fp.needsUpdate = true;
        spray.forEach((s, i) => { const k = (t * 1.6 + s.userData.k) % 1; s.position.set(0.3 + k * 1.5, 0.6 + Math.sin(k * Math.PI) * 1.1, (i / 11 - 0.5) * W * 0.95); s.scale.setScalar(1 - k * 0.7); });
      }
    },
    hide() { g.visible = false; },
  };
}

export function buildCh3Scene(world) {
  const L = world.level, rand = seeded(19);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -28, x1: 28, z0: -3.5, z1: 14 };

  // 젖은 풀밭과 냇물 골짜기
  {
    const g = new THREE.PlaneGeometry(240, 240, 70, 70); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let h = 0.1 * Math.sin(x * 0.4) * Math.cos(z * 0.3);
      const dr = Math.abs(z - RIVER_Z);
      if (dr < RIVER_W / 2 + 1.5) { const k = 1 - dr / (RIVER_W / 2 + 1.5); h -= k * k * (3 - 2 * k) * 1.4; }
      const far = Math.max(0, Math.abs(x) - 40, -z - 40, z - 90);
      h += Math.min(far * far * 0.03, 14);
      p.setY(i, h);
      const j = rand() * 0.04;
      if (dr < RIVER_W / 2 + 1.2 && h < 0.2) c.setRGB(0.45 + j, 0.42 + j, 0.36 + j);
      else c.setRGB(0.3 + j, 0.42 + j, 0.27 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, RIVER_W).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x4d6a78, transparent: true, opacity: 0.88, shininess: 30 }));
  water.position.set(0, -0.45, RIVER_Z); L.add(water);

  // 고려 진영 (남쪽 강둑): 맞배 천막, 창걸이, 쌀가마
  for (const [x, z] of [[-14, 9], [-6, 12], [8, 11], [16, 8], [22, 12]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand() * 0.5 - 0.25; L.add(g); tent(g, { color: 0xd8d0bc });
    world.addCollider({ x, z, r: 1.8 });
  }
  const put = (fn, x, z, ry = 0, p = {}, r = 0.9) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); if (r) world.addCollider({ x, z, r }); return g; };
  put(spearRack, 2, 12.5, 0); put(spearRack, -19, 11, 0.3); put(BUILD.rice, 12, 13, 0.2, { n: 6 }, 1.3);
  // 냇가: 강둑의 버드나무와 갈대(둑 막을 자리와 거란군이 건너는 여울은 비운다)
  for (const [x, z] of [[-34, -4.6], [-28, -4.8], [-14, -4.6], [16, -4.7], [24, -4.6], [32, -4.9], [-30, -11.6], [-15, -11.8], [18, -11.6], [28, -11.8]]) put(tree, x, z, rand() * 3, { kind: 'willow', x, z }, 0);
  scatter(world, { kind: 'grass', count: 90, area: { x0: -42, x1: 42, z0: -12.5, z1: -3.8 }, avoid: [{ x: DAM_X, z: RIVER_Z, r: 4.5 }, { x: ARMY_X, z: RIVER_Z, r: 9 }, { x: DAM_X + 5, z: -3.6, r: 6 }], seed: 41, ground: groundH, scale: [1.1, 1.9], color: 0x8a8a52 });
  const flagPoles = [];
  for (const [x, z, c] of [[-16, 2, 0xb8452f], [0, 2, 0xd9a441], [10, 2, 0xb8452f]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 5), 0x5a3f2a, x, 2.2, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9).translate(0.65, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, 3.4, z); L.add(f); flagPoles.push(f);
  }
  // 쇠가죽 묶음 6개
  const hides = [[-24, 6], [-12, 3], [-2, 7], [6, 3.5], [14, 4], [24, 5]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); L.add(g);
    for (let k = 0; k < 3; k++) mk(new THREE.BoxGeometry(1.1, 0.22, 0.8), [0x8a5a3a, 0x7a4e32, 0x94643f][k], 0, 0.12 + k * 0.22, 0, g).rotation.y = k * 0.4;
    return { x, z, mesh: g, taken: false };
  });
  // 둑 자리와 쇠가죽 둑 (처음엔 숨김)
  const damWall = new THREE.Group(); damWall.visible = false; L.add(damWall);
  for (let k = 0; k < 7; k++) mk(new THREE.BoxGeometry(1, 1.4, 0.5), 0x7a4e32, DAM_X, 0.2, RIVER_Z - RIVER_W / 2 + 0.5 + k * 0.85, damWall).rotation.y = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(DAM_X + 1, 0.08, -1.4); ring.visible = false; L.add(ring);
  // 냇가 흙둑과 둑 마개(D-10): 쇠가죽 둑 남쪽 끝의 나무 마개. 빛나는 원은 강감찬이 "지금이다!" 할 때 켜진다
  mk(new THREE.BoxGeometry(BANK.x1 - BANK.x0, 1.2, BANK.z1 - BANK.z0), 0x6e5a3e, (BANK.x0 + BANK.x1) / 2, BANK_TOP - 0.6, (BANK.z0 + BANK.z1) / 2);
  const plugAt = { x: DAM_X + 2.4, z: -3.6 }; // 쇠가죽 둑에서 조금 동쪽: 학생이 마개 앞에 서도 둑이 가려지지 않게
  for (const [dx, dz, h] of [[-0.3, -0.25, 1.3], [0.05, 0.2, 1.1], [0.35, -0.15, 1.2]]) mk(new THREE.CylinderGeometry(0.16, 0.2, h, 6), 0x5a3f2a, plugAt.x + dx - 0.4, BANK_TOP + h / 2, plugAt.z + dz - 0.4);
  { // 마개 말뚝에서 쇠가죽 둑 끝까지 맨 굵은 줄
    const ax = plugAt.x - 0.4, az = plugAt.z - 0.4, bx = DAM_X, bz = RIVER_Z - RIVER_W / 2 + 0.5 + 6 * 0.85, len = Math.hypot(bx - ax, bz - az);
    const rope = mk(new THREE.CylinderGeometry(0.06, 0.06, len, 5), 0x3b2a1c, (ax + bx) / 2, 0.75, (az + bz) / 2);
    rope.rotation.order = 'YXZ'; rope.rotation.y = Math.atan2(bx - ax, bz - az); rope.rotation.x = Math.PI / 2 - 0.12;
  }
  const plugRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), ring.material.clone());
  plugRing.rotation.x = -Math.PI / 2; plugRing.position.set(plugAt.x, BANK_TOP + 0.06, plugAt.z); plugRing.visible = false; L.add(plugRing);
  // 터지는 물결
  const flood = makeFlood(L, world.quality.water === 'waves');

  // 냇물을 건너는 거란군 (북쪽 강둑 → 남쪽)
  const zNorth = RIVER_Z - RIVER_W / 2, zSouth = RIVER_Z + RIVER_W / 2;
  const army = new THREE.Group(); L.add(army);
  for (let i = 0; i < 14; i++) { // 다섯 줄 세 겹: 둑 위에서 한눈에 보이게
    const k = makePerson(LOOKS.khitan);
    k.position.set(-4.4 + (i % 5) * 2.2, 0, -Math.floor(i / 5) * 1.8); k.rotation.y = 0; army.add(k);
  }
  const setCross = t => { army.position.set(ARMY_X, 0, zNorth - 8 + t * (zSouth + 4 - (zNorth - 8))); };
  setCross(0);
  // 북쪽 거란 진영
  for (const [x, z] of [[-10, -30], [2, -34], [14, -31], [-20, -38], [8, -42]]) {
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0x8f7556, x, 0.85, z);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, x, 2.45, z);
  }

  // 귀주 벌판: 남쪽 고려군, 북쪽 거란군, 동쪽에서 오는 지원군
  const guju = new THREE.Group(); guju.visible = false; L.add(guju);
  const gujuFlags = [], gujuKhitan = [], gujuGoryeo = [];
  for (let i = 0; i < 12; i++) {
    const p = makePerson(LOOKS.player); p.position.set(-11 + i * 2, 0, GUJU_Z + 2); p.rotation.y = Math.PI; guju.add(p); gujuGoryeo.push(p);
    const q = makePerson(LOOKS.khitan); q.position.set(-11 + i * 2, 0, GUJU_Z - 18); q.rotation.order = 'YXZ'; guju.add(q); gujuKhitan.push(q);
  }
  // 싸움 먼지: 두 군대가 부딪치는 곳에 피어오르는 흙먼지(처음엔 숨김)
  const dust = [];
  for (let i = 0; i < 10; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xb8a888, transparent: true, opacity: 0, depthWrite: false }));
    d.position.set(-10 + i * 2.2, 0.8, GUJU_Z - 16); d.userData.ph = i * 0.7; d.visible = false; guju.add(d); dust.push(d);
  }
  for (const [x, c] of [[-8, 0xb8452f], [0, 0xd9a441], [8, 0xb8452f]]) {
    mk(new THREE.CylinderGeometry(0.08, 0.08, 5, 5), 0x5a3f2a, x, 2.5 + HILL_H, GUJU_Z + 8, guju);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2).translate(0.8, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, 3.8 + HILL_H, GUJU_Z + 8); guju.add(f); gujuFlags.push(f);
  }
  // 거란군 진영 천막(D-16): 고려군이 몰아치면 천막 두 채에 불이 붙어 타오르고 연기가 오른다(처음엔 불 없음)
  const gujuFires = [];
  for (const [x, burn] of [[-9, true], [-1, false], [7, true]]) {
    const z = GUJU_Z - 25;
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0x8f7556, x, 0.85, z, guju);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, x, 2.45, z, guju);
    if (burn) gujuFires.push(burning(world, { parent: guju, x: x + 0.5, y: 0.3, z: z + 1.9, size: 2.1, level: 0 }));
  }
  const reinforcements = new THREE.Group(); reinforcements.visible = false; guju.add(reinforcements);
  for (let i = 0; i < 8; i++) {
    const p = makePerson(look('soldier', { robe: 0x3c5a7a })); p.position.set((i % 4) * 2, 0, Math.floor(i / 4) * 2); p.rotation.y = -Math.PI / 2; reinforcements.add(p);
  }
  reinforcements.position.set(30, 0, GUJU_Z - 2);
  { // 귀주 언덕: 꼭대기가 평평한 둥근 흙언덕(고려군 뒤)
    const hill = mk(new THREE.CylinderGeometry(1, 1.35, HILL_H + 0.4, 24), 0x5f7a45, HILL.x, (HILL_H + 0.4) / 2 - 0.4, HILL.z, guju);
    hill.scale.set(HILL.rx, 1, HILL.rz);
  }
  // 신호 북(D-10): 고려군 깃발 뒤 나무 틀에 건 큰 북. 빛나는 원은 강감찬이 "지금이다!" 할 때 켜진다
  const drumMesh = new THREE.Group(); guju.add(drumMesh);
  for (const sx of [-0.75, 0.75]) mk(new THREE.BoxGeometry(0.16, 2, 0.16), 0x5a3f2a, sx, 1, 0, drumMesh);
  mk(new THREE.BoxGeometry(1.8, 0.16, 0.2), 0x5a3f2a, 0, 1.95, 0, drumMesh);
  const drumBody = mk(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 14), 0x8a2f24, 0, 1.25, 0, drumMesh); drumBody.rotation.x = Math.PI / 2;
  for (const sz of [-0.36, 0.36]) { const head = mk(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 14), 0xe2d6b4, 0, 1.25, sz, drumMesh); head.rotation.x = Math.PI / 2; }
  const drumRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), ring.material.clone());
  drumRing.rotation.x = -Math.PI / 2; drumRing.visible = false; guju.add(drumRing);
  const drum = { x: 0, z: GUJU_Z + 11, r: 1.3, mesh: drumMesh, ring: drumRing,
    place(x) { this.x = x; drumMesh.position.set(x, HILL_H, this.z - 1.2); drumRing.position.set(x, HILL_H + 0.08, this.z); } };
  drum.place(5);

  // 진영 남문과 울타리(D-10 시작 장면): 문짝 두 개가 열리고 학생이 걸어 들어온다. 문 안쪽 길옆에 이름판
  const campEdge = new THREE.Group(); L.add(campEdge); // 귀주 장면에서는 숨긴다(멀리 진영 울타리가 보이지 않게)
  {
    const xs = [];
    for (let x = -34; x <= 34; x += 0.9) if (Math.abs(x) > 2.6) xs.push(x);
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.2, 2.6, 6), mat(0x6b4a32, 'wood', 'object'), xs.length);
    const o = new THREE.Object3D();
    xs.forEach((x, i) => { o.position.set(x, 1.3, GATE_Z); o.rotation.y = i; o.updateMatrix(); pm.setMatrixAt(i, o.matrix); });
    pm.castShadow = true; campEdge.add(pm);
    for (let x = -33; x <= 33; x += 1.6) if (Math.abs(x) > 3) world.addCollider({ x, z: GATE_Z, r: 0.9 });
    for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(0.4, 3.6, 0.4), 0x5a3f2a, sx * 2.7, 1.8, GATE_Z, campEdge);
    mk(new THREE.BoxGeometry(6, 0.35, 0.45), 0x5a3f2a, 0, 3.5, GATE_Z, campEdge);
  }
  const gate = gateLeaves(campEdge, { x: 0, z: GATE_Z, width: 5, height: 2.6, color: 0x6b4a32 });
  nameBoard(campEdge, '삼교천 진영', 3.5, GATE_Z - 3); // 출처 S3(흥화진 앞 삼교천)

  // 빗물 웅덩이 (진영 바닥)
  {
    const puddle = new THREE.MeshPhongMaterial({ color: 0x5a6670, shininess: 90, specular: 0x9aa6b0, transparent: true, opacity: 0.75 });
    for (const [x, z, s] of [[-18, 4, 1.4], [-8, 6, 1], [2, 4.5, 1.2], [11, 6.5, 0.9], [19, 3, 1.3], [-22, 11, 1], [4, 13, 1.1], [13, 13, 0.8]]) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), puddle);
      p.position.set(x, groundH(x, z) + 0.03, z); p.scale.set(s * 1.4, 1, s); p.rotation.y = x; p.receiveShadow = true; L.add(p);
    }
  }
  // 냇가 갈대와 바위, 진영의 젖은 풀, 귀주 벌판 둘레
  {
    const bank = [{ x: DAM_X, z: RIVER_Z, r: 5 }, { x: ARMY_X, z: RIVER_Z, r: 9 }, { x: DAM_X + 2, z: -3.6, r: 4 }, { x: DAM_X + 8, z: -3.6, r: 4 }];
    for (const [z0, z1, s] of [[RIVER_Z - RIVER_W / 2 - 2.6, RIVER_Z - RIVER_W / 2 - 0.4, 41], [RIVER_Z + RIVER_W / 2 + 0.4, RIVER_Z + RIVER_W / 2 + 2.2, 42]]) {
      scatter(world, { kind: 'grass', count: 110, area: { x0: -60, x1: 60, z0, z1 }, avoid: bank, seed: s, ground: groundH, scale: [1.0, 1.7], color: 0x8a9a5a });
      scatter(world, { kind: 'rock', count: 16, area: { x0: -60, x1: 60, z0, z1 }, avoid: bank, seed: s + 3, ground: groundH, scale: [0.5, 1.3] });
    }
    const keep = [[10, -1.5], [-14, 9], [-6, 12], [8, 11], [16, 8], [22, 12], [-24, 6], [-12, 3], [-2, 7], [6, 3.5], [14, 4], [24, 5], [-4, 5], [5, 7.5], [0, 10], [DAM_X + 1, -1.4], [0, 14], [3.5, GATE_Z - 3]].map(([x, z]) => ({ x, z, r: 2.6 }));
    scatter(world, { kind: 'grass', count: 120, area: { x0: -28, x1: 28, z0: -2, z1: 16 }, avoid: keep, seed: 43, ground: groundH, color: 0x6f8f4a });
    scatter(world, { kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: 20, z1: 110 }, avoid: [{ x: 0, z: GUJU_Z, r: 30 }, { x: 22, z: GUJU_Z + 18, r: 10 }, { x: 0, z: GATE_Z + 8, r: 10 }, { x: 0, z: GUJU_Z - 30, r: 22 }], seed: 44, ground: groundH, scale: [1, 1.6] });
    scatter(world, { kind: 'grass', count: 140, area: { x0: -26, x1: 34, z0: GUJU_Z - 24, z1: GUJU_Z + 4 }, seed: 45, ground: groundH, color: 0x7a9450 });
    scatter(world, { kind: 'rock', count: 20, area: { x0: -60, x1: 60, z0: -60, z1: -16 }, seed: 46, ground: groundH, scale: [0.8, 2.2] });
  }
  const rain = createWeather(world, 'rain', { count: 900 });

  world.addNpc('gangamchan', LOOKS.gangamchan, -4, 5, 0);
  world.addNpc('soldier', LOOKS.soldier, 5, 7.5, Math.PI * 0.8);
  world.addNpc('scout', LOOKS.archer, 10, -1.5, Math.PI); // 냇가에서 강 건너를 살피는 척후병

  // 깃발 방향: 북쪽(-z)으로 휘날리면 rotation.y = +PI/2, 남쪽이면 -PI/2
  let flagDir = -Math.PI / 2;
  const scene = {
    gate, campEdge, damX: DAM_X, plug: { ...plugAt, r: 1.3, ring: plugRing }, drum,
    stand: { x: DAM_X + 6, z: -3.6 }, gangOnBank: [DAM_X + 5, -4.2], // 강감찬은 학생 서쪽(마개 쪽)에 서서 거란군 쪽 화면을 가리지 않는다
    gujuStand: [-2.5, GUJU_Z + 11], gangAtGuju: [-4, GUJU_Z + 11],
    // 둑으로 가는 길(쇠가죽을 둔 곳 옆에서 둑 위로), 귀주로 가는 길(남문을 나가 거란군 줄의 서쪽으로 돌아 고려군 뒤로)
    bankPath: [[DAM_X + 3, -1.6], [DAM_X + 3.6, -3.6], [DAM_X + 5, -4.2]],
    hides, damWall, ring, flood, rain, flagPoles, gujuFlags, gujuKhitan, gujuGoryeo, gujuFires, reinforcements, guju, dust, gujuZ: GUJU_Z,
    dam: { x: DAM_X + 1, z: -1.4, r: 1.6 },
    river: { army, setCross, zNorth, zSouth },
    gujuBounds: { x0: -9, x1: 9, z0: GUJU_Z + 8, z1: GUJU_Z + 14 },
    start: [0, 10],
    setFlags(northward) { flagDir = northward ? Math.PI / 2 : -Math.PI / 2; rain.setWind(northward ? -2 : 2); },
  };
  world.onUpdate((dt, t) => {
    for (const f of [...flagPoles, ...gujuFlags]) f.rotation.y += (flagDir + Math.sin(t * 3 + f.position.x) * 0.25 - f.rotation.y) * Math.min(1, dt * 3);
    for (const r of [ring, plugRing, drumRing]) if (r.visible) r.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
    // 흙둑 위에서는 학생과 강감찬이 둑 높이에 선다
    for (const o of [world.player, world.npcs.get('gangamchan').mesh]) o.position.y += (Math.max(bankHeight(o.position.x, o.position.z), guju.visible ? hillHeight(o.position.x, o.position.z) : 0) - o.position.y) * Math.min(1, dt * 14);
    hides.forEach((h, i) => { if (!h.taken) h.mesh.rotation.y = Math.sin(t + i) * 0.2; });
  });
  scene.setFlags(false);
  backdropMountains(world.level, { color: 0x4f6a42, radius: 130 }); // 먼 산줄기(깊이감)
  return scene;
}
