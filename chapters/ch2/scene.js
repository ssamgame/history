// 2장 장면: 눈 덮인 흥화진 성, 북쪽의 거란 진영, 성 남쪽의 눈 들판.
import { gateLeaves, nameBoard } from '../kit/gate.js';
import * as THREE from 'three';
import { backdropMountains } from '../kit/terrain.js';
import { hanok, woodpile, jars, straw } from '../kit/buildings.js';
import { BUILD } from '../kit/town.js';
import { makeFire } from '../../core/fire.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { setStyle } from '../../core/motion.js';
import { scatter } from '../../core/props.js';
import { LOOKS, look } from '../../content/characters.js';
import { createWeather } from '../../core/weather.js';
import { rider } from '../kit/army.js';
import { handOf } from '../../core/interact.js';

const HALF = 12;          // 성 안쪽 반 너비
const WALL_H = 4.2;
const LADDER_Z = -14.5;   // 사다리 밑동 (북쪽 성벽 바깥)
const FIELD_Z = 50;       // 들판 중심
// 사다리 자리: 북쪽 성가퀴 사이 틈(성가퀴는 x -12부터 1.8 간격)
export const LADDER_X = [-9.3, -5.7, -2.1, 1.5, 5.1, 8.7];
export const WALL_TOP = WALL_H + 0.14; // 성벽 위 걷는 높이(쌓인 눈 위)
export const WALK_Z = -12.55;          // 성벽 위 걷는 줄(성가퀴 안쪽)

const GAUGE_SEG = 32;
const G_YELLOW = new THREE.Color(0xffd43b), G_ORANGE = new THREE.Color(0xff8c1a), G_RED = new THREE.Color(0xe82a1e);
// 사다리 게이지 채우기(0~1): 찬 만큼만 그리고, 반까지는 노랑 → 주황, 그다음 주황 → 빨강
export function setGauge(g, f) {
  f = Math.min(1, Math.max(0, f));
  g.userData.fill = f;
  g.geometry.setDrawRange(0, 6 * Math.ceil(f * GAUGE_SEG));
  if (f < 0.5) g.material.color.copy(G_YELLOW).lerp(G_ORANGE, f / 0.5);
  else g.material.color.copy(G_ORANGE).lerp(G_RED, (f - 0.5) / 0.5);
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 눈밭 높이: 멀리는 언덕으로 솟고 잔물결 굴곡이 있다. 사람이 걷는 곳(성 밖 거란군 z -32~-14, 들판 백성 z 14~74, x ±28)은 높이 0
// (2026-10-31 자동 점검: 굴곡 ±0.15m에 발이 묻혀 보였다)
const WALKED = [{ x0: -28, x1: 28, z0: -34, z1: 76 }];
const outside = (x, z) => Math.min(...WALKED.map(r => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1))));
function snowH(x, z) {
  const far = Math.max(0, Math.hypot(x, z - 20) - 60), k = Math.min(1, outside(x, z) / 8);
  return Math.min(far * far * 0.01, 16) + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15 * k * k * (3 - 2 * k);
}

// 포승줄(D-62): 호송병의 왼손 → 백성들의 모은 두 손을 차례로 잇는 가는 줄. update()가 매 프레임 손 자리를 따라간다
const ROPE_MAT = new THREE.MeshLambertMaterial({ color: 0x8a7350 });
const ROPE_GEO = new THREE.CylinderGeometry(0.022, 0.022, 1, 4).translate(0, 0.5, 0);
const rv = new THREE.Vector3(), rw = new THREE.Vector3(), rup = new THREE.Vector3(0, 1, 0);
function makeRope(group, lead, folk) {
  const segs = folk.map(() => { const m = new THREE.Mesh(ROPE_GEO, ROPE_MAT); m.castShadow = false; group.add(m); return m; });
  const rope = new THREE.Group(); rope.name = 'rope'; group.add(rope); // 보이기만 맡는 묶음(줄 조각은 group에 붙어 있다)
  const handAt = (p, i, out) => { const h = handOf(p, i); if (h) h.getWorldPosition(out); else p.localToWorld(out.set(0, 1.0, 0.3)); return group.worldToLocal(out); };
  const pts = () => { const a = [handAt(lead, 1, new THREE.Vector3())]; for (const v of folk) { const l = handAt(v, 0, new THREE.Vector3()), r = handAt(v, 1, new THREE.Vector3()); a.push(l.add(r).multiplyScalar(0.5)); } return a; };
  rope.update = () => {
    if (!rope.visible) { segs.forEach(m => { m.visible = false; }); return; }
    group.updateMatrixWorld(true);
    const P = pts();
    segs.forEach((m, i) => { const a = P[i], b = P[i + 1]; rv.subVectors(b, a); const len = rv.length(); m.visible = len > 0.01; m.position.copy(a); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(rup, rw.copy(rv).normalize()); });
  };
  return rope;
}

export function buildCh2Scene(world) {
  const L = world.level, rand = seeded(11);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 };

  // 눈 덮인 땅
  {
    const g = new THREE.PlaneGeometry(240, 240, 60, 60); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, snowH(x, z));
      const j = rand() * 0.04;
      c.setRGB(0.64 + j, 0.68 + j, 0.75 + j); // 2026-10-25: 흰 성벽·하늘과 구별되게 눈밭을 한 단계 낮춤
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grain'));
    t.receiveShadow = true; L.add(t);
  }
  // 성벽 (남쪽에 성문). 성과 성안 살림은 한 묶음(castle)으로: 들판 장면에서는 숨겨 황량한 들판만 보이게(D-62)
  const castleFrom = L.children.length;
  const stone = 0xe4ded2; // 밝은 돌색(돌 무늬가 조금 어둡게 하므로 더 밝게): 사다리와 거란 병사가 잘 보이도록
  mk(new THREE.BoxGeometry(HALF * 2 + 3.2, WALL_H, 1.6), stone, 0, WALL_H / 2, -HALF - 0.8);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(1.6, WALL_H, HALF * 2 + 3.2), stone, sx * (HALF + 0.8), WALL_H / 2, 0);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(HALF - 2.5 + 1.6, WALL_H, 1.6), stone, sx * (2.5 + (HALF - 2.5 + 1.6) / 2), WALL_H / 2, HALF + 0.8);
  // 남쪽 성문: 시작 장면에서 문짝 두 개가 성안 쪽으로 열린다(D-8)
  const gate = gateLeaves(L, { x: 0, z: HALF + 0.8, width: 5, height: WALL_H - 1, color: 0x5d4330 });
  // 성벽 위에 쌓인 눈
  mk(new THREE.BoxGeometry(HALF * 2 + 3.4, 0.14, 1.7), 0xf2f5f7, 0, WALL_H + 0.07, -HALF - 0.8, L, false);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(1.7, 0.14, HALF * 2 + 3.4), 0xf2f5f7, sx * (HALF + 0.8), WALL_H + 0.07, 0, L, false);
  // 성가퀴: 북쪽 성벽은 바깥쪽에(방어 장면), 동·서 성벽에도(남쪽은 카메라가 넘겨다보는 쪽이라 비운다)
  for (let x = -HALF; x <= HALF; x += 1.8) mk(new THREE.BoxGeometry(0.9, 0.8, 0.5), 0x8c877e, x, WALL_H + 0.4, -HALF - 1.4);
  for (const sx of [-1, 1]) for (let z = -HALF + 1; z <= HALF; z += 1.8) mk(new THREE.BoxGeometry(0.5, 0.8, 0.9), 0x8c877e, sx * (HALF + 1.4), WALL_H + 0.4, z);
  // 성벽 계단
  for (let i = 0; i < 6; i++) mk(new THREE.BoxGeometry(3, 0.7 * (i + 1), 0.8), 0x8c877e, 0, 0.35 * (i + 1), -HALF + 0.4 + (5 - i) * 0.8);
  // 성안 초가와 창고
  const hut = (x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g);
    hanok(g, { roofColor: 0xeef2f5 }); // 기단·기둥·창살을 갖춘 초가, 지붕은 눈에 덮였다
    world.addCollider({ x, z, r: 2.4 });
  };
  hut(-7, 3, 0.2); hut(7, -2, -0.3); hut(-6, -5, 0); hut(8, 7, 0.4);
  // 겨울 살림과 군량: 장작더미·쌀가마(예전 상자 자리), 장독대, 짚더미, 우물
  const put = (fn, x, z, ry = 0, p = {}, r = 0.8) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); world.addCollider({ x, z, r }); return g; };
  put(woodpile, 3.4, 3.3, 0.3); put(BUILD.rice, -2, 8.2, 0, { n: 6 }, 1.2);
  put(jars, -9.6, 0.6, Math.PI / 2, { n: 5 }, 1.0); put(straw, 9.8, -6.5, 0, {}, 1.0); put(BUILD.well, -1.5, -2.6, 0, {}, 0.9);
  // 성문에서 성벽 계단까지 사람들이 밟아 다진 눈길
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 17).rotateX(-Math.PI / 2), mat(0xc4c4c0, 'earth')); m.position.set(0, 0.03, 2.5); m.receiveShadow = true; L.add(m); }
  // 병사들이 몸을 녹이는 화톳불
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mk(new THREE.DodecahedronGeometry(0.24, 0), 0x77736a, 5 + Math.cos(a) * 0.7, 0.12, 0.5 + Math.sin(a) * 0.7); }
  const fire = makeFire({ size: 0.6, detail: world.quality.particles }); fire.group.position.set(5, 0.38, 0.5); fire.setLit(true); L.add(fire.group);
  world.addCollider({ x: 5, z: 0.5, r: 1.0 });
  world.onUpdate((dt, t) => fire.update(dt, t));
  for (const [x, z, c] of [[-10, -10, 0xb8452f], [10, -10, 0xd9a441]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 5, 5), 0x5a3f2a, x, WALL_H + 2.5, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9).translate(0.65, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, WALL_H + 4, z); L.add(f);
  }
  const castle = new THREE.Group(); castle.name = 'castle';
  for (const o of L.children.slice(castleFrom)) castle.add(o);
  L.add(castle);
  // 소나무
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2, d = 30 + rand() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d + 20;
    if (Math.abs(x) < 26 && z > 16 && z < 80) continue;
    if (Math.abs(x) < 32 && z < -14 && z > -60) continue; // 성벽 방어 카메라 앞을 가리지 않게
    mk(new THREE.ConeGeometry(1.4, 3.6, 6), 0x3e5f4a, x, 2.4, z);
    mk(new THREE.ConeGeometry(1.0, 1.2, 6), 0xf2f5f7, x, 3.9, z);
  }
  // 북쪽 거란 진영
  const khitan = new THREE.Group(); L.add(khitan);
  for (const [x, z] of [[-14, -36], [-4, -40], [7, -37], [16, -42], [-20, -46], [0, -50], [12, -52]]) {
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0x8f7556, x, 0.85, z, khitan);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, x, 2.45, z, khitan);
  }
  // 거란 진영의 천막에는 불을 피우지 않는다(D-62, 2026-10-31 선생님. 예전 D-16의 타는 천막을 뺐다)
  const campFires = [];
  const khitanFront = new THREE.Group(); khitan.add(khitanFront); // 성벽 앞 거란 대군(성벽 방어 때 사다리 아래로 몰려온다)
  // 대군(D-62): 네 줄로 늘어선 보병. 앞줄일수록 성벽에 가깝다
  const rows = [[11, -24, 3.4], [10, -27, 3.6], [9, -30.5, 4], [8, -34, 4.4]];
  rows.forEach(([n, z, gap], r) => { for (let i = 0; i < n; i++) {
    const k = makePerson(LOOKS.khitan);
    k.position.set((i - (n - 1) / 2) * gap + (r % 2) * 0.9 + (rand() - 0.5) * 0.8, 0, z - (i % 2) * 1.1 + (rand() - 0.5) * 0.6); khitanFront.add(k);
  } });
  const horde = [...khitanFront.children]; // 성벽 방어 때 사다리 아래로 걸어와 모이는 무리(D-32)
  for (const k of horde) k.userData.home = k.position.clone();
  // 선봉의 거란 왕(성종, S3: 직접 대군을 이끌고 왔다): 말 탄 채 대군 맨 앞 가운데, 양옆에 깃발 기수
  const KING = { ...LOOKS.khitan, robe: 0x7a5a24, trim: 0xd9a441, hat: 'fur', gear: 'sword', named: true };
  const khitanKing = rider(khitanFront, KING, 0.4, -20.5, 0, { armor: 0x6a5a40, saddle: 0x8a6a22 });
  const kingFlags = [-2.6, 3.2].map(x => { const f = new THREE.Group(); f.position.set(x, 0, -21.6); BUILD.banner(f, { color: 0x2e2a26, h: 3.6 }); khitanFront.add(f); return f; });
  // 성벽 싸움 동안(D-63, 2026-11-03 선생님): 왕은 대군 뒤 천막 앞에서 말 탄 채 장군 몇 명과 함께 지켜본다. 도입 장면에서는 선봉(D-62)
  const CAMP = { king: [-4, -36.9], flags: [[-6.7, -37.7], [-1.3, -37.7]] }, FRONT = { king: [0.4, -20.5], flags: [[-2.6, -21.6], [3.2, -21.6]] };
  const GENERAL = { ...LOOKS.khitan, robe: 0x5a3a22, trim: 0xd9a441, hat: 'fur', gear: 'sword', named: true };
  const kingGenerals = [[-5.9, -36.0, 0.25], [-2.1, -36.0, -0.25], [-7.4, -35.6, 0.15]].map(([x, z, ry]) => { const p = makePerson(GENERAL); p.position.set(x, 0, z); p.rotation.y = ry; khitanFront.add(p); return p; });
  const placeKing = P => { khitanKing.position.set(P.king[0], 0, P.king[1]); khitanKing.rotation.y = 0; kingFlags.forEach((f, i) => f.position.set(P.flags[i][0], 0, P.flags[i][1])); };
  const kingToCamp = () => placeKing(CAMP), kingToFront = () => placeKing(FRONT);

  // 사다리 6개와 오르는 거란 병사 (처음엔 숨김)
  const len = Math.hypot(WALL_H, LADDER_Z + HALF + 1.6 + 0.0);
  const tilt = Math.atan2(-(LADDER_Z + HALF + 1.6), WALL_H);
  const ladders = LADDER_X.map(x => {
    const group = new THREE.Group(); group.position.set(x, 0, LADDER_Z); group.visible = false; L.add(group);
    const pivot = new THREE.Group(); pivot.rotation.x = tilt; group.add(pivot);
    // 굵고 밝은 나무 사다리 (멀리서도 보이도록)
    // 사다리 끝은 성가퀴 사이로 1.3쯤 솟는다(성벽 위 학생 눈에 사다리가 보이게)
    for (const sx of [-0.42, 0.42]) mk(new THREE.BoxGeometry(0.2, len + 1.3, 0.2), 0xb07a42, sx, (len + 1.3) / 2, 0, pivot);
    for (let y = 0.4; y < len + 1.3; y += 0.5) mk(new THREE.BoxGeometry(0.84, 0.12, 0.12), 0xc48a4c, 0, y, 0, pivot);
    const top = new THREE.Object3D(); top.position.set(0, len - 0.3, 0); pivot.add(top);
    // 사다리를 타는 병사: 밝은 옷에 붉은 띠로 성벽 위에서 눈에 띄게
    const climber = makePerson(LOOKS.khitanBright); climber.visible = false; pivot.add(climber);
    // 사다리를 세우는 병사: 사다리 밑동에 서 있다
    const carrier = makePerson(LOOKS.khitanBright); carrier.position.set(0.9, 0, -0.6); carrier.visible = false; group.add(carrier);
    return { x, group, pivot, top, climber, carrier, len, tilt };
  });

  // 들판의 끌려가는 백성 무리 6개(D-62): 백성 셋이 한 줄로 포승줄에 묶여, 앞선 거란 병사가 줄 끝을 쥐고 끌고 간다
  const captives = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.visible = false; L.add(g);
    const folk = [];
    for (let k = 0; k < 3; k++) {
      const v = makePerson(look('villager', { robe: [0xe8e2d6, 0xd8cfbf, 0xc9bda8][k] }));
      v.position.set((k % 2 ? 0.25 : -0.2), 0, k * 1.05); v.rotation.y = Math.PI; setStyle(v, 'captive'); g.add(v); folk.push(v); // 끌려가는 걸음: 움츠린 어깨, 숙인 고개, 앞으로 모은 손(2026-10-30 움직임 개선)
    }
    const escort = makePerson(LOOKS.khitan); escort.position.set(0.1, 0, -1.5); escort.rotation.y = Math.PI; setStyle(escort, 'guard'); g.add(escort); // 호송병: 경계하며 둘레를 살핀다
    const rope = makeRope(g, escort, folk);
    captives.push({ group: g, escort, folk, rope, start: [-18 + i * 7.2 + (rand() - 0.5) * 2, FIELD_Z - 6 + rand() * 6] }); // 플레이어보다 앞(북쪽)에서 출발
  }
  // 들판에서 학생과 함께 가는 고려 병사 둘(D-62: 학생은 무기가 없어, 호송병은 이 병사들이 쓰러뜨린다)
  const allies = [0, 1].map(i => { const a = makePerson(LOOKS.soldier); a.visible = false; a.userData.ally = i; L.add(a); return a; });
  // 눈 위로 드러난 바위와 마른 풀 (성 밖 들판)
  scatter(world, { kind: 'rock', count: 30, area: { x0: -60, x1: 60, z0: 14, z1: 90 }, avoid: [{ x: 0, z: 46, r: 22 }], seed: 31, ground: snowH, scale: [0.6, 1.8], color: 0x9aa0a6 });
  scatter(world, { kind: 'grass', count: 120, area: { x0: -40, x1: 40, z0: 14, z1: 80 }, seed: 32, ground: snowH, scale: [0.6, 1.1], color: 0xa89470 });
  scatter(world, { kind: 'bush', count: 30, area: { x0: -70, x1: 70, z0: -70, z1: -16 }, avoid: [{ x: 0, z: -30, r: 26 }], seed: 33, ground: snowH, color: 0xdfe6ea });
  createWeather(world, 'snow', { count: 700 });

  world.addNpc('soldier', LOOKS.soldier, 5, 4.5, Math.PI * 0.8);
  world.addNpc('yanggyu', LOOKS.yanggyu, -3, -7, 0);
  world.addNpc('villager', LOOKS.villager, -8, 5.5, Math.PI * 0.6);
  // 성문 바로 안쪽 길옆 장소 이름판(D-8, 읽는 안내판이 아니다). 열린 오른쪽 문짝에 가리지 않는 자리
  nameBoard(L, '흥화진', 3, 8.8);
  // 성벽 위 사다리 자리마다 빛나는 원(양규가 가리킨 곳). 학생이 그 원에 가까이 가면 사다리를 밀어낸다
  // D-32: 원은 옅은 노란 바탕이고, 그 위 게이지가 시간이 지날수록 노랑 → 주황 → 빨강으로 차오른다(다 차면 적이 올라온다)
  const wallRings = LADDER_X.map(x => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.95, 32), new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.set(x, WALL_TOP + 0.04, WALK_Z); r.visible = false; L.add(r); return r;
  });
  const wallGauges = LADDER_X.map(x => {
    const g = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.95, GAUGE_SEG, 1, Math.PI / 2, Math.PI * 2),
      new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.scale.x = -1; // 화면 위(북쪽)에서 시작해 시계 방향으로 찬다
    g.position.set(x, WALL_TOP + 0.06, WALK_Z); g.visible = false; g.renderOrder = 2; L.add(g);
    setGauge(g, 0); return g;
  });

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.08, -6); ring.visible = false; L.add(ring);
  world.onUpdate((dt, t) => { const o = 0.55 + Math.sin(t * 4) * 0.3; ring.material.opacity = o; for (const r of wallRings) r.material.opacity = o; });

  backdropMountains(world.level, { color: 0xc8ccd0, radius: 130 }); // 먼 산줄기(깊이감)
  return {
    ring, gate, wallRings, wallGauges, horde, stairs: { x: 0, z: -6, r: 1.6 }, ladders, captives, khitan, khitanFront, campFires, castle, khitanKing, kingFlags, kingGenerals, kingToCamp, kingToFront, allies,
    setField(on) { castle.visible = !on; khitan.visible = !on; }, // 들판 장면: 성과 거란 진영을 숨겨 황량한 들판만(D-62)
    field: { bounds: { x0: -24, x1: 24, z0: 20, z1: 72 }, start: [0, 68], lostZ: 21 }, // 플레이어는 남쪽에서 북쪽(화면 위)으로 쫓아간다
    start: [0, 6],
  };
}
