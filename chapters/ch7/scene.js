// 고려 새 4장 「윤관과 별무반」 장면(2026-10-26, docs/superpowers/specs/2026-10-26-ch7-spec.md 5절).
// 고려 동북쪽 국경 마을(탐험) · 마을 북쪽 징집 갈림길(동쪽에서 오는 줄 → 갈림길 → 신기군·신보군·항마군 세 갈래와 깃발) ·
// 서쪽 들판(첫 장면: 말 탄 여진 군사가 몰아쳐 고려 보병 줄이 물러남, 먼지만) · 북동쪽 언덕(성 9개가 차례로 솟음, 이름·자리 표시 없음).
// 사람 얼굴·몸·색감과 고려 건물은 그대로(core/figures.js · kit hanok · chapters/goryeo/set.js의 말·성채·깃발).
// 움직이는 것(줄 선 사람·부대 줄·행렬·성·들판 무리·깃발)만 돌려준다. 나머지는 장면 굳히기(core/bake.js)로 합쳐진다.
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';
import { makeFigure, setAction, crowdLook } from '../../core/figures.js';
import { flatten } from '../kit/ops.js';
import { hanok, tree, straw, jars, woodpile } from '../kit/buildings.js';
import { backdropMountains } from '../kit/terrain.js';
import { groundMaterial } from '../../core/textures.js';
import { scatter } from '../../core/props.js';
import { flag, horse, castleMarker, RIDE_Y, HORSE_COLORS } from '../goryeo/set.js';

export const FORK = { x: 0, z: -2 };
// 세 갈래 끝(깃발 자리): 남쪽에서 볼 때 왼쪽부터 신기군 · 신보군 · 항마군(길 단추 1 · 2 · 3과 같은 차례)
export const LANE_END = { cav: { x: -10, z: -14 }, inf: { x: 0, z: -16 }, monk: { x: 10, z: -14 } };
const LANE_COLOR = { cav: 0x8a4a2e, inf: 0x2f6b5e, monk: 0x6e6a62 };
const SLOT = 2.1;                         // 줄 선 사람 사이(말 길이만큼)
const slotX = k => FORK.x + 2.2 + k * SLOT; // 줄은 갈림길 동쪽으로 늘어선다
const FIELD = { x: -72, z: 6 };           // 첫 장면 들판(마을에서 보이지 않는 서쪽)
const CASTLES = [[-4, -33], [8, -36], [19, -31], [28, -39], [14, -45], [2, -47], [25, -51], [36, -33], [37, -46]];
const SPEED = 6;
const MARCH_X = 5;                        // 행렬은 신보군과 항마군 깃발 사이로 나아간다

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const face = (dx, dz) => Math.atan2(dx, dz); // 그 방향을 보는 rotation.y(사람·말은 +z가 앞)

// 갈림길에 오는 사람 한 명의 모양(script.switch.waves의 kind)
function personLook(p) {
  const s = p.seed || 1;
  if (p.kind === 'monk') return crowdLook('monk', s);
  if (p.kind === 'official' || (p.kind === 'rider' && p.official)) return crowdLook('official', s);
  if (p.kind === 'farmer') return crowdLook('commoner', s);
  if (p.kind === 'leader') return { ...LOOKS.drafteeLeader, job: 'commoner' };
  return { ...LOOKS.draftee, job: 'commoner', robe: [0xe2d8c2, 0xd8cdb4, 0xe8dfcc, 0xd2c6ae][s % 4] };
}
// 사람(+말) 한 무리를 만들고 조각을 합친다(팔다리 대신 통째로 움직인다)
function makeArrival(p) {
  const g = new THREE.Group();
  const fig = makeFigure(personLook(p)); setAction(fig, 'idle');
  if (p.kind === 'rider') {
    g.add(horse({ color: HORSE_COLORS[(p.seed || 0) % 2], saddle: true }));
    fig.position.y = RIDE_Y; g.add(fig);
  } else if (p.kind === 'leader') {
    const h = horse({ color: HORSE_COLORS[(p.seed || 1) % 2] }); h.position.set(0.95, 0, -0.5); g.add(h);
    fig.position.x = -0.35; g.add(fig);
  } else g.add(fig);
  return flatten(g);
}
// 부대 줄 한 칸에 서는 사람: 신기군은 말 탄 병사, 신보군은 창 든 병사, 항마군은 승려
function troopMember(lane, i) {
  const g = new THREE.Group();
  if (lane === 'cav') { g.add(horse({ color: HORSE_COLORS[i % 2], saddle: true })); const f = makeFigure(crowdLook('soldier', i + 1)); f.position.y = RIDE_Y; g.add(f); }
  else g.add(makeFigure(crowdLook(lane === 'inf' ? 'soldier' : 'monk', i + 1)));
  return g;
}

export function buildCh7Scene(world) {
  const L = world.level, rand = seeded(23);
  world.bounds = { x0: -14, x1: 14, z0: -3, z1: 16 };
  const put = (fn, x, z, ry = 0, p = {}, r = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); if (r) world.addCollider({ x, z, r }); return g; };
  const strip = (x0, z0, x1, z1, w, color = 0xb8a27a) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2), mat(color, 'earth'));
    m.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2); m.rotation.y = face(x1 - x0, z1 - z0); m.receiveShadow = true; L.add(m); return m;
  };

  // 아침 풀밭: 걷는 곳은 평평하고 멀리는 언덕
  {
    const g = new THREE.PlaneGeometry(260, 260, 64, 64); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), far = Math.max(0, Math.abs(x + 15) - 75, z - 40, -z - 80);
      p.setY(i, Math.min(far * far * 0.02, 16) + 0.08 * Math.sin(x * 0.35) * Math.cos(z * 0.3));
      const j = rand() * 0.04; c.setRGB(0.42 + j, 0.5 + j, 0.3 + j); cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass')); t.receiveShadow = true; L.add(t);
  }
  // 길: 남쪽 마을길 → 갈림길, 동쪽에서 오는 징집 길, 북쪽 세 갈래
  strip(FORK.x, FORK.z, 0, 20, 2.4);
  strip(FORK.x, FORK.z, 40, FORK.z, 2.6);
  for (const e of Object.values(LANE_END)) strip(FORK.x, FORK.z, e.x, e.z, 2.2);
  // 부대 마당(깃발 뒤 맨땅)
  for (const [id, e] of Object.entries(LANE_END)) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(4.4, 20).rotateX(-Math.PI / 2), mat(0xa89670, 'earth'));
    m.position.set(e.x, 0.02, e.z - 2.6); m.receiveShadow = true; L.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.6, 24).rotateX(-Math.PI / 2), mat(LANE_COLOR[id], 'cloth'));
    ring.position.set(e.x, 0.04, e.z - 2.6); L.add(ring);
  }

  // 마을(탐험): 기와집 둘·초가 넷, 장독대·짚더미·장작, 버드나무
  for (const [x, z, ry, tile] of [[-9, 7, 0.15, true], [-8, 13.5, -0.1, false], [8.5, 8.5, -0.2, false], [10.5, 14.5, 0.1, true], [-13, 3, 0.4, false], [14.5, 6, -0.4, false]]) {
    put(hanok, x, z, ry, tile ? { tile: true } : {}, 2.6);
  }
  put(jars, -4.6, 9.5, 0.3, {}, 0.9); put(straw, 4.6, 11.5, 0, {}, 0.9); put(woodpile, 5.5, 16.5, 0.4, {}, 0.9); put(straw, -5, 15, 0.6, {}, 0.9);
  for (const [x, z] of [[-14, 9], [14, 7], [-3.5, 17.5], [6, 18], [-16, -6], [17, -8]]) put(tree, x, z, rand() * 3, { kind: x % 2 ? 'willow' : 'pine', x, z });
  // 갈림길 안내 깃발과 부대 깃발(펄럭인다)
  const flags = [];
  for (const [id, e] of Object.entries(LANE_END)) { const f = flag({ color: LANE_COLOR[id], h: 5.4, w: 1.6, ch: 2.2 }); f.position.set(e.x - 2.2, 0, e.z + 0.6); L.add(f); flags.push(f); }
  world.onUpdate((dt, t) => { for (const f of flags) f.userData.update(dt, t); });

  // 말 거는 사람: 윤관(갈림길 옆), 마을 어른
  world.addNpc('yungwan', LOOKS.yungwan, -4, 1, 0);
  world.addNpc('villager', LOOKS.drafteeLeader, 5, 5, -0.6);

  // ── 부대 줄: 갈래마다 3줄 × 3명. 한 줄을 1·2·3명짜리로 미리 만들어(합쳐서) 숫자에 맞는 것만 보인다 ──
  const troops = { cav: [], inf: [], monk: [] };
  for (const [lane, e] of Object.entries(LANE_END)) {
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let k = 1; k <= 3; k++) {
        const g = new THREE.Group(); g.position.set(e.x, 0, e.z - 1.2 - r * 2.2);
        for (let c = 0; c < k; c++) { const m = troopMember(lane, r * 3 + c); m.position.x = (c - 1) * 1.7; g.add(m); }
        flatten(g); g.visible = false; L.add(g); row.push(g);
      }
      troops[lane].push(row);
    }
  }
  const setTroops = counts => {
    for (const [lane, rows] of Object.entries(troops)) {
      const n = Math.min(9, counts[lane] || 0);
      rows.forEach((row, r) => { const k = Math.max(0, Math.min(3, n - r * 3)); row.forEach((g, i) => { g.visible = i === k - 1; }); });
    }
  };

  // ── 갈림길에 오는 사람들(무리마다 prepare로 새로 만든다) ──
  const queue = new THREE.Group(); queue.name = 'queue'; L.add(queue);
  let walkers = [];
  const prepare = people => {
    for (const w of walkers) { queue.remove(w.obj); w.obj.traverse(o => o.geometry?.dispose()); }
    walkers = people.map(p => {
      const obj = makeArrival(p); obj.visible = false; queue.add(obj);
      return { obj, path: [], state: 'away', shake: 0, done: null };
    });
  };
  const line = waiting => {
    waiting.forEach((i, k) => {
      const w = walkers[i]; if (!w || w.state === 'sent') return;
      if (w.state === 'away') { w.obj.position.set(slotX(Math.max(k, waiting.length) + 2), 0, FORK.z); w.obj.rotation.y = face(-1, 0); w.obj.visible = true; }
      w.state = 'wait';
      w.path = [{ x: slotX(k), z: FORK.z, ry: k === 0 ? 0 : face(-1, 0) }];
    });
  };
  const send = (i, lane) => new Promise(resolve => {
    const w = walkers[i]; if (!w) return resolve();
    const e = LANE_END[lane];
    w.state = 'sent'; w.path = [{ x: FORK.x, z: FORK.z }, { x: e.x, z: e.z }]; w.done = resolve;
  });
  const wrong = i => { const w = walkers[i]; if (w) w.shake = 0.5; };
  world.onUpdate((dt, t) => {
    for (const w of walkers) {
      if (!w.obj.visible) continue;
      const o = w.obj;
      if (w.path.length) {
        const g = w.path[0], dx = g.x - o.position.x, dz = g.z - o.position.z, d = Math.hypot(dx, dz), step = SPEED * dt;
        if (d > 0.02) o.rotation.y = face(dx, dz);
        if (d <= step) {
          o.position.x = g.x; o.position.z = g.z; w.path.shift();
          if (!w.path.length) {
            if (g.ry != null) o.rotation.y = g.ry;
            if (w.state === 'sent') { o.visible = false; const f = w.done; w.done = null; f?.(); }
          }
        } else { o.position.x += dx / d * step; o.position.z += dz / d * step; }
        o.position.y = Math.abs(Math.sin(t * 10)) * 0.12;
      } else o.position.y = 0;
      if (w.shake > 0) { w.shake = Math.max(0, w.shake - dt); o.rotation.y = Math.sin(w.shake * 40) * 0.35 * (w.shake / 0.5); }
    }
  });

  // ── 첫 장면 들판(서쪽): 고려 보병 줄(남쪽)과 몰아쳐 오는 말 탄 여진 군사(북쪽), 먼지 ──
  const field = new THREE.Group(); field.name = 'openingField'; field.position.set(FIELD.x, 0, FIELD.z); L.add(field);
  const goryeoLine = new THREE.Group(); goryeoLine.position.z = 4; field.add(goryeoLine);
  for (let i = 0; i < 7; i++) { const f = makeFigure(crowdLook('soldier', i + 1)); f.position.set(-6 + i * 2, 0, (i % 2) * 0.8); f.rotation.y = Math.PI; goryeoLine.add(f); }
  flatten(goryeoLine);
  const riders = new THREE.Group(); riders.position.z = -24; field.add(riders);
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); g.position.set(-6 + i * 3, 0, (i % 2) * -1.6);
    g.add(horse({ color: HORSE_COLORS[i % 2], saddle: true }));
    const f = makeFigure({ ...LOOKS.jurchen, job: 'jurchen' }); f.position.y = RIDE_Y; g.add(f);
    riders.add(g);
  }
  flatten(riders);
  const fieldDust = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xc8b896, transparent: true, opacity: 0, depthWrite: false }));
    d.position.set(-6 + i * 2.4, 0.8, 1); d.visible = false; field.add(d); fieldDust.push(d);
  }

  // ── 행렬(놀이 뒤 북쪽으로 나아감): 말 탄 윤관이 앞, 신기군 · 신보군 · 항마군이 뒤 ──
  const marchers = new THREE.Group(); marchers.name = 'marchers'; L.add(marchers);
  {
    const lead = new THREE.Group(); lead.add(horse({ color: HORSE_COLORS[0], saddle: true }));
    const y = makeFigure({ ...LOOKS.yungwan, job: 'official' }); y.position.y = RIDE_Y; lead.add(y); lead.position.set(0, 0, -2.4); lead.rotation.y = Math.PI; marchers.add(lead);
    const rows = [['cav', 3], ['inf', 3], ['inf', 3], ['monk', 3]];
    rows.forEach(([lane, n], r) => { for (let c = 0; c < n; c++) { const m = troopMember(lane, r * 3 + c); m.position.set((c - 1) * 1.8, 0, 1 + r * 2.4); m.rotation.y = Math.PI; marchers.add(m); } });
    flatten(marchers);
  }
  marchers.position.set(MARCH_X, 0, FORK.z - 4); marchers.visible = false;

  // ── 성 9개(이름 · 자리 표시 없음, 개수만) ──
  const castles = new THREE.Group(); castles.name = 'castles'; L.add(castles);
  for (const [x, z] of CASTLES) { const c = flatten(castleMarker({})); c.position.set(x, 0, z); c.rotation.y = face(-x, 20 - z) * 0.3; castles.add(c); }
  castles.visible = false;
  const setCastles = n => castles.children.forEach((c, i) => { c.visible = i < n; c.scale.set(1, 1, 1); });

  // 풀포기 · 바위(길과 부대 마당은 비운다), 먼 산줄기
  const keep = [{ x: 0, z: 8, r: 2 }, { x: 0, z: 14, r: 2 }, ...Object.values(LANE_END).map(e => ({ x: e.x, z: e.z - 2.6, r: 5.2 })), { x: 0, z: -9, r: 4.5 }, { x: -5, z: -8, r: 3.5 }, { x: 5, z: -8, r: 3.5 }];
  const offRoad = (x, z) => Math.abs(z - FORK.z) > 1.8 || x < FORK.x - 1;
  scatter(world, { kind: 'grass', count: 110, area: { x0: -24, x1: 30, z0: -24, z1: 20 }, avoid: keep, keep: (x, z) => offRoad(x, z) && Math.abs(x) > 1.6, seed: 71, scale: [0.9, 1.5], color: 0x7a9450 });
  scatter(world, { kind: 'rock', count: 18, area: { x0: -40, x1: 50, z0: -40, z1: -20 }, avoid: CASTLES.map(([x, z]) => ({ x, z, r: 5 })), seed: 72, scale: [0.6, 1.6] });
  scatter(world, { kind: 'pine', count: 34, area: { x0: -60, x1: 70, z0: -95, z1: -28 }, avoid: [...CASTLES.map(([x, z]) => ({ x, z, r: 6 })), { x: 5, z: -22, r: 8 }], seed: 73, scale: [1, 1.6] });
  backdropMountains(L, { color: 0x5f7a4c, radius: 130 });

  return {
    fork: FORK, start: [2.5, 14],
    explore: { x0: -14, x1: 14, z0: -3, z1: 16 },
    flags, troops, setTroops, queue, prepare, line, send, wrong,
    field, goryeoLine, riders, fieldDust,
    fieldCam: { pos: [FIELD.x + 16, 7, FIELD.z + 10], target: [FIELD.x - 1, 1, FIELD.z - 6] },
    // 갈림길 놀이 카메라: 세 깃발과 동쪽 줄이 한눈에(아래 단추 자리만큼 남쪽 땅을 더 넣는다)
    laneFit: { target: [2, 0, -8], dir: [0, 0.8, 0.85], points: [[-13, 5, -21], [13, 5, -21], [-12, 0, -8], [slotX(7) + 1, 2.5, FORK.z], [2, 0, 4]], margin: 0.95 },
    // 진군 카메라: 갈림길 남서쪽 위에서 행렬과 성 9개가 한 화면에
    marchFit: { target: [16, 0, -36], dir: [-0.55, 0.75, 0.8], points: [...CASTLES.map(([x, z]) => [x, 6, z]), [MARCH_X, 0, FORK.z - 2]], margin: 0.9 },
    marchers, castles, setCastles,
  };
}

// 첫 장면: 말 탄 여진 군사가 몰아쳐 오고, 고려 보병 줄이 버티다 물러난다(먼지만, 약 4.5초)
export function playOpening(world, sc) {
  const r0 = sc.riders.position.z, g0 = sc.goryeoLine.position.z;
  return new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      const k = Math.min(1, t / 2.4);
      sc.riders.position.z = r0 + k * k * 22;
      if (t > 2) sc.goryeoLine.position.z = g0 + Math.min(1, (t - 2) / 2) * 6;
      sc.fieldDust.forEach((d, i) => {
        const a = Math.max(0, Math.min(1, (t - 1.8 - i * 0.08) / 2.4));
        d.visible = a > 0 && a < 1; d.material.opacity = Math.sin(Math.PI * a) * 0.55; d.scale.setScalar(0.6 + a * 1.8);
      });
      if (t >= 4.6) { off(); resolve(); }
    });
  });
}

// 행렬이 북쪽으로 나아가고, 동북쪽 언덕에 성이 하나씩 솟는다(약 6초). onCastle(i): 성 하나가 솟을 때
export function playMarch(world, sc, onCastle = () => {}) {
  sc.marchers.visible = true; sc.marchers.position.set(MARCH_X, 0, FORK.z - 4);
  sc.castles.visible = true; sc.castles.children.forEach(c => { c.visible = false; c.scale.set(1, 0.01, 1); });
  return new Promise(resolve => {
    let t = 0, shown = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      sc.marchers.position.z = FORK.z - 4 - Math.min(t, 4.5) * 5;
      sc.marchers.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
      while (shown < 9 && t > 1 + shown * 0.5) { sc.castles.children[shown].visible = true; onCastle(shown); shown += 1; }
      sc.castles.children.forEach((c, i) => { if (c.visible) c.scale.y = Math.min(1, Math.max(0.01, (t - 1 - i * 0.5) / 0.4)); });
      if (t >= 6.2) { off(); sc.castles.children.forEach(c => { c.visible = true; c.scale.set(1, 1, 1); }); resolve(); }
    });
  });
}
