// 상황 놀이 부품: 카드 대신 장면 속에서 직접 해 보는 미니게임. 근대·일제 강점기·현대편 장의 parts에 쓴다.
// 모두 (ctx, part, easy) → Promise(성공이면 true, 도중에 틀렸다가 고쳐 끝내면 'missed', 시간이 다 되는 등 실패면 false).
// 실패하면 장 틀(tryPart)이 힌트를 보여 주고 다시 하게 한다. 틀린 답은 처음부터 다시가 아니라 해설(part.fail)을 듣고 고쳐 고른다.
//
//   drive  : 배·전차·트럭을 몰아(또는 걸어서) 지점을 차례로 지나간다. 암초·기뢰·적 배에 부딪히면 앞 지점으로.
//            { arena?, vehicle?: 'boat'|'truck'|'tram'|'car'|'train', from, route: [{ x, z, label?, say? }], hazards?: [{ x, z, r, kind, to?, speed? }],
//              seconds, counter?, speed?, followers?: { looks, per } }
//   stops  : 바닥에 이름표가 선 곳들을 일어난 차례대로 찾아가 대화 버튼을 누른다. 틀린 곳이면 해설을 듣고, 화살표를 따라 맞는 곳을 고른다.
//            { arena?, from, spots: [{ x, z, label, say? }] (정답 차례), seconds? }
//   deliver: 머리 위에 든 것(글)을 들고 알맞은 곳(바구니 자리)에 들어가면 놓인다. 놓으면(틀려도) 처음 자리(from)로 돌아가 다음 것을 든다.
//            { arena?, from, bins: [{ id, label, x, z }], cards: [{ text, bin }] }
//   find   : 곳곳에 선 팻말 가운데 맞는 것만 찾아 대화 버튼을 누른다. 틀린 것이면 해설을 듣고 이어서 고른다.
//            { arena?, from, items: [{ text, correct, x, z }] }
//   ambush : 위에서 내려다보는 골짜기(바다)에 적이 들어오면 그 위의 버튼을 눌러 물리친다(연기를 내며 물러난다).
//            { arena?, camera: { pos, target }, path: [[x, z], [x, z]], zone: { x, z, r }, enemies, need, interval, speed, unit: 'soldier'|'ship'|'target', label }
//            unit 'target'(사격 훈련, D-46): 쏘는 사람 쪽(+z)을 보는 과녁 판이 썰매에 실려 지나가고, 맞으면 뒤로 넘어간다
//   sneak  : 순찰하는 감시원의 불빛을 피해 숨을 곳을 차례로 지나 목적지까지 간다. 들키면 앞 숨을 곳으로. hides(덤불) 안에서는 들키지 않는다.
// 이야기: drive·sneak의 지점, stops의 자리, find·deliver의 정답에 talk(대화 줄)를 달면 그때 대화가 나오고 시간이 멈춘다.
//         drive 지점의 hold(초)는 그 안에서 버텨야 지나가고, pickups(줍기)·needPickups로 가는 길에 모을 것을 둔다. ambush는 waves로 여러 차례.
//         stops·find·deliver 자리에 look을 주면 그때 사람이 서 있다.
//            { arena?, from, waypoints: [{ x, z, label? }], guards: [{ path: [[x, z], [x, z]], speed, range?, look? }], seconds }
// arena: 마을과 떨어진 곳(origin)에 미니게임 무대를 따로 세운다. { origin: [x, z], ground, groundColor, bounds, props, roads }
//        좌표는 모두 무대 기준. arena가 없으면 장 마을에서 한다.
import * as THREE from 'three';
import { BUILD, addFootprint, taegukgiTexture, addNature } from './town.js';
import { bakeStatic } from './buildings.js';
import { terrainField, terrainMesh, hillColorFor } from './terrain.js';
import { mat, makePerson, setCarry } from '../../core/people.js';
import { createTapTargets } from '../../core/minigame.js';
import { MAP_OUTLINE } from '../../core/screens.js';
import { LOOKS } from '../../content/characters.js';
import { sayAll } from '../joseon/common.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const add = (g, geo, color, x, y, z) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };

// 장면 속 이름표(글씨 판). 늘 카메라를 본다.
export function labelSprite(text, { color = '#231c14', bg = 'rgba(239,227,198,0.95)', border = '#6b4a32', size = 1 } = {}) {
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  const font = 'bold 44px "Nanum Myeongjo", Batang, serif';
  c.font = font;
  const w = Math.min(1024, Math.ceil(c.measureText(text).width) + 48), h = 72;
  cv.width = w; cv.height = h;
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.strokeStyle = border; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  c.font = font; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 10;
  const k = 0.9 * size;
  s.scale.set((w / h) * k, k, 1);
  s.userData.setText = null; s.userData.text = text;
  return s;
}

// 화면 위쪽에 잠깐 뜨는 알림(대화창을 열지 않아 흐름이 끊기지 않는다). 목표 상자가 길어져도 그 아래에 뜬다
export function toast(ctx, text, kind = '') {
  let t = ctx.ui.querySelector('.play-toast');
  if (!t) { t = document.createElement('div'); t.className = 'play-toast'; ctx.ui.append(t); }
  t.textContent = text; t.className = `play-toast ${kind}`; t.hidden = false;
  const below = ['.hud:not([hidden])', '.hud-notice:not([hidden])'].map(q => ctx.ui.querySelector(q)?.getBoundingClientRect()).filter(r => r && r.height);
  t.style.top = below.length ? `${Math.max(118, ...below.map(r => Math.round(r.bottom + 8)))}px` : ''; // 목표 상자·새 장소 알림 아래
  clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 2600);
}
function clearToast(ctx) { const t = ctx.ui.querySelector('.play-toast'); if (t) t.remove(); }

// 무대 둘레(걷는 곳 밖 뒤·양옆)에 그 시대·장소다운 건물과 나무를 줄지어 세운다. 걷는 곳은 건드리지 않고 부딪힘도 없다.
// edge: { style, back?: false(뒤가 물일 때), sides?: false, seed? }. 한 덩어리로 합쳐 그리기 수를 늘리지 않는다.
const EDGE = {
  thatch: [['hanok', {}], ['tree', { kind: 'pine' }], ['hanok', { seed: 3 }], ['straw', {}], ['hanok', { seed: 5 }], ['jars', {}]],
  tile: [['hanok', { tile: true }], ['tree', { kind: 'pine' }], ['hanok', { tile: true, seed: 2 }], ['hanok', {}], ['tree', {}]],
  street: [['shop', { awning: 0x8a2f24 }], ['shop', { thatch: true, seed: 3 }], ['hanok', { tile: true }], ['shop', { seed: 5, awning: 0x2f5a6b }], ['tree', { kind: 'willow' }]],
  modern: [['shop', { style: 'modern', awning: 0x2f6b5e }], ['western', { w: 7, d: 5, h: 5, color: 0x8a4a3a }], ['shop', { awning: 0x8a2f24 }], ['tree', { kind: 'poplar' }], ['shop', { style: 'modern', seed: 4, awning: 0x6b4a2f }], ['hanok', { tile: true }]],
  brick: [['western', { w: 8, d: 5, h: 6, color: 0x8a4a3a }], ['tree', {}], ['western', { w: 7, d: 5, h: 5, color: 0xb8ab90 }], ['western', { w: 6, d: 5, h: 7, color: 0x7d5a48 }], ['tree', { kind: 'poplar' }]],
  shanghai: [['lanehouse', { n: 3 }], ['shop', { style: 'modern', awning: 0x8a2f24 }], ['lanehouse', { n: 2, seed: 4 }], ['tree', {}]],
  city: [['concrete', { floors: 3 }], ['concrete', { floors: 2, color: 0xd6cfc0, w: 6 }], ['tree', { kind: 'poplar' }], ['concrete', { floors: 4, w: 6 }], ['shop', { style: 'modern' }]],
  camp: [['tent', {}], ['tree', { kind: 'pine' }], ['woodpile', {}], ['tent', {}], ['tree', { kind: 'pine' }], ['barracks', {}]],
  forest: [['tree', { kind: 'pine' }], ['tree', { kind: 'pine', scale: 1.3 }], ['tree', {}], ['tree', { kind: 'pine', scale: 0.9 }]],
  snow: [['tree', { kind: 'bare' }], ['hanok', { roofColor: 0xe6e8ec }], ['tree', { kind: 'pine', color: 0x5a6e5a }], ['tree', { kind: 'bare' }], ['woodpile', {}]],
  shanty: [['shack', {}], ['shack', { seed: 2 }], ['tree', { kind: 'bare' }], ['shack', { seed: 3 }], ['jars', {}]],
};
const EDGE_W = { hanok: 8, shop: 7, western: 9, lanehouse: 11, concrete: 8, barracks: 10, tent: 6, shack: 5, tree: 5, straw: 3.5, jars: 3.5, woodpile: 3.5 };
// 화질 '낮음'에서는 둘레의 하나 걸러 하나와 바깥 둘째 줄(extra)을 숨긴다(world.setQuality가 minQuality를 보고 켜고 끈다)
function arenaEdge(arena) {
  const e = arena.edge, list = EDGE[e.style] || EDGE.forest, b = arena.bounds, main = new THREE.Group(), extra = new THREE.Group();
  let s = e.seed || 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const blocked = (x, z) => (arena.props || []).some(p => p.type === 'water' ? Math.abs(x - p.x) < p.w / 2 + 3 && Math.abs(z - p.z) < p.d / 2 + 3
    : Math.hypot(x - p.x, z - p.z) < 4.5);
  let k = 0;
  let out = 0; // 숲·진영은 한 줄 더 바깥에
  const line = (x0, z0, dx, dz, len, ry) => { // (x0,z0)에서 (dx,dz) 쪽으로 len만큼 늘어선다. 건물 앞은 걷는 곳을 본다
    for (let t = 0; t < len;) {
      const [type, o] = list[k++ % list.length], w = EDGE_W[type] || 6, off = (rnd() - 0.5) * (type === 'tree' ? 5 : 2); // 줄에서 조금씩 들쭉날쭉
      const x = x0 + dx * (t + w / 2) - dz * off, z = z0 + dz * (t + w / 2) + dx * off;
      t += w + rnd() * 1.5;
      if (blocked(x, z)) continue;
      const pg = new THREE.Group(); pg.position.set(x, 0, z); pg.rotation.y = ry + (type === 'tree' ? rnd() * 6 : 0); if (o.scale) pg.scale.setScalar(o.scale);
      BUILD[type](pg, { ...o, seed: o.seed ?? k }); (out || k % 2 ? extra : main).add(pg);
    }
  };
  const back = b.z0 - 6, sx0 = b.x0 - 6, sx1 = b.x1 + 6;
  if (e.back !== false) line(sx0 - 2, back, 1, 0, sx1 - sx0 + 4, 0);
  const sides = () => { if (e.sides !== false) { line(sx0 - out, back + 6, 0, 1, b.z1 - b.z0 - 4, Math.PI / 2); line(sx1 + out, back + 6, 0, 1, b.z1 - b.z0 - 4, -Math.PI / 2); } };
  sides();
  if (e.style === 'forest' || e.style === 'camp') { out = 6; if (e.back !== false) line(sx0 - 8, back - 6, 1, 0, sx1 - sx0 + 16, 0); sides(); }
  const g = new THREE.Group(); g.add(bakeStatic(main), bakeStatic(extra));
  g.traverse(o => { if (o.isMesh) o.castShadow = false; }); // 걷는 곳 밖 먼 장식은 그림자를 드리우지 않아도 티가 안 난다(그림자 그리기 횟수 절약)
  extra.userData.minQuality = 'medium'; g.userData.edge = true;
  return g;
}

export const CENTER_SCALE = 1.25; // 무대 가운데 소품은 멀리서도 알아보게 조금 크게

// 미니게임 무대: 마을에서 멀리 떨어진 곳에 땅·물·건물을 세우고, 끝나면 모두 치운다.
export function buildArena(world, arena) {
  const t0 = performance.now();
  const [ox, oz] = arena ? arena.origin : [0, 0];
  const g = new THREE.Group(); g.position.set(ox, 0, oz);
  const at = (x, z) => ({ x: x + ox, z: z + oz });
  const colStart = world.colliders.length, oldBounds = world.bounds;
  world.level.add(g); // 무대가 없으면 마을 자리(0,0)에 표시물만 둔다
  if (arena) {
    const color = arena.groundColor ?? 0x8a7a62, kind = arena.ground || 'earth';
    if (arena.sea) {
      const gg = new THREE.PlaneGeometry(160, 160, 8, 8).rotateX(-Math.PI / 2);
      const ground = new THREE.Mesh(gg, new THREE.MeshPhongMaterial({ color: arena.sea === true ? 0x3f7d9a : arena.sea, shininess: 70 }));
      ground.position.y = 0.01; ground.receiveShadow = true; g.add(ground);
    } else { // 걷는 곳은 평평하게, 바깥은 언덕(마을 땅과 같은 방식)
      const field = terrainField({ bounds: arena.bounds, props: [...(arena.props || []), ...(arena.center || [])], margin: arena.edge ? 13 : 4, hill: arena.hill ?? 0.8 }); // 둘레 건물(edge)이 서는 곳까지 평평하게
      if (kind === 'stone') { const f = field.flat, pave = new THREE.Mesh(box(f.x1 - f.x0, 0.04, f.z1 - f.z0), mat(color, 'stone')); pave.position.set((f.x0 + f.x1) / 2, 0.02, (f.z0 + f.z1) / 2); pave.receiveShadow = true; g.add(pave); }
      const ground = terrainMesh(field, { color: kind === 'stone' ? 0x7d7158 : color, kind: kind === 'stone' ? 'earth' : kind, roads: arena.roads || [], size: 160, seg: 64, hill: arena.hillColor ?? hillColorFor(kind, color, world.moodName) });
      ground.position.y = 0.01; g.add(ground);
      // 마을처럼 언덕에는 소나무·덤불·바위, 걷는 곳 가장자리에는 풀포기(지도·바다 무대와 nature: false는 빼고). 무대를 치우면 함께 치운다.
      if (!arena.map && arena.nature !== false) addNature(world, { bounds: arena.bounds, props: [...(arena.props || []), ...(arena.center || [])], roads: arena.roads || [], start: arena.from, hillColor: arena.hillColor }, field, kind, color, g);
    }
    if (arena.map) g.add(mapFloor(arena.map));
    for (const r of arena.roads || []) { const m = new THREE.Mesh(box(r.w, 0.05, r.d), mat(r.color || 0x8f7556, r.kind || 'earth')); m.position.set(r.x, r.y ?? 0.04, r.z); m.rotation.y = r.ry || 0; m.receiveShadow = true; g.add(m); }
    const cg = new THREE.Group(); // 가운데 소품은 움직이지 않으니 다 놓은 뒤 재질별로 한 덩어리로 합친다
    for (const p of [...(arena.props || []), ...(arena.center || []).map(c => ({ scale: CENTER_SCALE, ...c, center: true }))]) { // center: 무대 가운데 역사 소품(배치표에서 따로 적어 길·목표를 피했는지 검사한다)
      const pg = new THREE.Group(); pg.position.set(p.x, p.y || 0, p.z); pg.rotation.y = p.ry || 0; if (p.scale) pg.scale.setScalar(p.scale); (p.center ? cg : g).add(pg);
      const r = BUILD[p.type](pg, p);
      if (p.type === 'crowd') bakeStatic(pg, m => m.material.map === taegukgiTexture()); // 서 있는 무리는 한 덩어리로
      if (p.type === 'water') pg.position.y = 0.32; // 무대 땅 위로 물이 보이게
      if (r && p.solid !== false) addFootprint(world, { ...p, ...at(p.x, p.z) }, r); // 긴 건물·기차는 작은 원을 줄지어
    }
    if (cg.children.length) g.add(bakeStatic(cg));
    if (arena.edge) { g.add(arenaEdge(arena)); world.applyDecor?.(g); }
    for (const c of arena.colliders || []) world.addCollider({ ...at(c.x, c.z), r: c.r });
    const b = arena.bounds; world.bounds = { x0: b.x0 + ox, x1: b.x1 + ox, z0: b.z0 + oz, z1: b.z1 + oz };
    world.perf?.time('무대 짓기', performance.now() - t0); // 개발용 성능 측정(?perf=1)
    world.remeasure?.(); // 무대는 마을보다 무거울 수 있으니 화질 자동 조절이 다시 잰다(직접 고른 화질은 그대로)
  }
  return {
    group: g, at,
    dispose() {
      world.level.remove(g);
      if (arena) { world.colliders.splice(colStart); world.bounds = oldBounds; }
    },
  };
}

// 바닥에 크게 그린 우리나라 지도(장 고르기 화면의 지도와 같은 모양, 300×400 비율). 38도선을 점선으로.
// mapSpot(map)(가로%, 세로%) → 그 자리의 { x, z } (무대 기준)
export function mapSpot(map) { return (px, py) => ({ x: map.x + (px / 100 - 0.5) * map.w, z: map.z + (py / 100 - 0.5) * map.w * 4 / 3 }); }
function mapFloor(map) {
  const cv = document.createElement('canvas'); cv.width = 600; cv.height = 800;
  const c = cv.getContext('2d');
  c.fillStyle = '#7fa8bf'; c.fillRect(0, 0, 600, 800);
  const pts = MAP_OUTLINE.split(' ').map(p => p.split(',').map(Number));
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * 2, y * 2) : c.moveTo(x * 2, y * 2))); c.closePath();
  c.fillStyle = '#d9cfa8'; c.fill(); c.strokeStyle = '#6b5a3a'; c.lineWidth = 6; c.stroke();
  c.beginPath(); c.ellipse(240, 776, 32, 16, 0, 0, Math.PI * 2); c.fill(); c.stroke(); // 제주도
  if (map.line38 !== false) { c.setLineDash([18, 12]); c.strokeStyle = '#8a2f24'; c.lineWidth = 5; c.beginPath(); c.moveTo(60, 360); c.lineTo(560, 360); c.stroke(); c.setLineDash([]); c.fillStyle = '#8a2f24'; c.font = 'bold 30px sans-serif'; c.fillText('38도선', 470, 345); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(map.w, map.w * 4 / 3).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex }));
  m.position.set(map.x, 0.03, map.z); m.receiveShadow = true;
  return m;
}

// 탈것 모양(앞이 +z)
function vehicleMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'boat') { // 상륙정: 납작한 배와 앞판
    add(g, box(2.4, 0.9, 5.2), 0x55603f, 0, 0.35, 0);
    add(g, box(2.4, 1.2, 0.2), 0x4a5436, 0, 0.9, 2.6);
    add(g, box(1.2, 1, 1.2), 0x3f4a30, 0, 1.2, -1.8);
    const flag = add(g, box(0.6, 0.4, 0.04), 0xe8e8e8, 0, 2.3, -1.8); flag.material = flag.material.clone();
  } else if (kind === 'tram') { BUILD.tram(g, { track: 0.01 }); }
  else if (kind === 'truck') { BUILD.truck(g, { color: 0x55603f }); }
  else if (kind === 'car') { BUILD.truck(g, { color: 0x3f6a8a }); }
  else if (kind === 'train') {
    add(g, box(2.2, 2.2, 5), 0x2b2b2b, 0, 1.5, 0);
    add(g, new THREE.CylinderGeometry(0.35, 0.45, 1.4, 10), 0x1e1c1a, 0, 3.1, 1.6);
  }
  return g;
}
// 학생을 탈것으로 바꾼다. 되돌리는 함수를 돌려준다.
function rideVehicle(world, kind, speed) {
  const p = world.player, hidden = [...p.children];
  hidden.forEach(c => { c.visible = false; });
  const v = vehicleMesh(kind); v.scale.setScalar(1 / (p.scale.x || 1)); p.add(v); // 아이 역할(작은 키)이어도 탈것은 제 크기
  world.speedScale = speed;
  return () => { p.remove(v); hidden.forEach(c => { c.visible = true; }); world.speedScale = 1; };
}

function ring(color = 0xd9a441, r0 = 0.9, r1 = 1.25) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.09;
  return m;
}
const near = (p, t, r) => Math.hypot(p.x - t.x, p.z - t.z) < r;
const place = (world, [x, z], ry = Math.PI) => { const p = world.player; p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; world.camMode = 'follow'; world.snapCamera(); };

// 여러 부품이 같이 쓰는 뼈대: 무대 세우기, 시간·숫자 표시, 끝낼 때 정리
function session(ctx, part, easy) {
  const { world, hud } = ctx;
  const arena = buildArena(world, part.arena);
  const back = part.arena && { p: world.player.position.clone(), ry: world.player.rotation.y, cam: world.camMode }; // 무대를 치우면 원래 자리로
  const cleanups = [() => { arena.dispose(); if (back) { world.player.position.copy(back.p); world.player.rotation.y = back.ry; world.camMode = back.cam === 'fixed' ? 'follow' : back.cam; world.snapCamera(); } }, () => clearToast(ctx), () => { hud.setTimer(null); hud.setCounter(null); world.setGoal(null); ctx.input.enabled = false; ctx.testHooks.walkTo = null; hud.setPrompt?.(null); hud.setTalkEnabled?.(false); }];
  const duration = part.seconds ? part.seconds * (easy ? 1.5 : 1) : null;
  let t = 0, done = false, busy = false, resolveFn;
  const fns = [];
  const promise = new Promise(r => { resolveFn = r; });
  // 시계는 하나만 돈다(부품이 update를 여러 번 불러도 시간이 겹쳐 흐르지 않게). 이야기 대화 중에는 시간과 놀이가 멈춘다.
  const off = world.onUpdate((dt, el) => {
    if (done || busy) return;
    t += dt;
    if (duration) { hud.setTimer(duration - t); if (t >= duration) { s.finish(false); return; } }
    for (const fn of fns) { fn(dt, el); if (done) return; }
  });
  cleanups.push(off);
  const s = {
    arena, at: arena.at, t: () => t,
    missed: false, // 도중에 틀린 적이 있으면 true(끝까지 하면 'missed'로 끝난다)
    finish(ok) {
      if (done) return; done = true;
      for (const f of cleanups.reverse()) f();
      resolveFn(ok && s.missed ? 'missed' : ok);
    },
    // 틀린 답: 소리와 함께 해설을 들려준다(대화 동안 시간이 멈춘다). 그 뒤 화살표가 맞는 곳을 알려 준다.
    wrong(text) {
      s.missed = true;
      ctx.audio.play('wrong');
      const why = typeof part.fail === 'string' ? part.fail : ctx.partHint; // 해설: 부분의 fail, 없으면 장이 tryPart에 준 힌트
      s.say([{ who: 'guide', text: why ? `${text} ${why}` : text }]);
    },
    get done() { return done; },
    get busy() { return busy; },
    cleanup(f) { cleanups.push(f); },
    update(fn) { fns.push(fn); },
    // 대화·고르기처럼 기다려야 하는 일: 끝날 때까지 시간과 움직임을 멈춘다
    async run(fn) {
      busy = true;
      const wasInput = ctx.input.enabled;
      ctx.input.enabled = false; ctx.input.releaseJoystick?.();
      hud.setTalkEnabled?.(false); hud.setPrompt?.(null);
      try { await fn(); } finally { if (ctx.dialogue) ctx.dialogue.close(); busy = false; if (!done) ctx.input.enabled = wasInput; }
    },
    // 이야기 장면: 대화가 끝날 때까지 시간과 움직임을 멈춘다. then이 있으면 대화 뒤에 부른다.
    say(lines, then) {
      if (!lines || !lines.length || !ctx.dialogue) { if (then) then(); return; }
      busy = true;
      const wasInput = ctx.input.enabled;
      ctx.input.enabled = false; ctx.input.releaseJoystick?.();
      hud.setTalkEnabled?.(false); hud.setPrompt?.(null);
      sayAll(ctx.dialogue, lines).then(() => {
        ctx.dialogue.close();
        busy = false;
        if (!done) ctx.input.enabled = wasInput;
        if (then && !done) then();
      });
    },
    promise,
  };
  if (part.from) place(world, [arena.at(...part.from).x, arena.at(...part.from).z], part.face ?? Math.PI);
  ctx.input.enabled = true;
  return s;
}

// 대화 버튼(E)으로 '여기!'를 고르는 부품들이 함께 쓰는 것: 가까운 후보를 찾아 버튼을 켜고, 누르면 pick(후보)
function pickWithButton(ctx, s, candidates, pick, reach = 1.9) {
  const { world, hud } = ctx;
  let cur = null;
  s.update(() => {
    const p = world.player.position;
    let best = null, bd = reach;
    for (const c of candidates()) { const d = Math.hypot(p.x - c.pos.x, p.z - c.pos.z); if (d < bd) { bd = d; best = c; } }
    cur = best;
    hud.setTalkEnabled?.(!!cur);
    hud.setPrompt?.(cur ? new THREE.Vector3(cur.pos.x, 0, cur.pos.z) : null);
  });
  const off = ctx.onAction(() => { if (cur && !s.done && !s.busy) { const c = cur; cur = null; pick(c); } });
  s.cleanup(off);
}

// 장소에 서 있는 그때 사람(학생 쪽을 본다)
function standPerson(g, look, x, z) { const p = makePerson(LOOKS[look] || LOOKS.citizen); p.position.set(x, 0, z); g.add(p); return p; }

// ── drive ─────────────────────────────────────────────
export function drive(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const unride = part.vehicle ? rideVehicle(world, part.vehicle, part.speed || 1.7) : (part.speed ? (world.speedScale = part.speed, () => { world.speedScale = 1; }) : () => {});
  s.cleanup(unride);
  const route = part.route.map((r, i) => {
    const m = ring(0xd9a441, 1.4, 1.9); m.position.set(r.x, 0.12, r.z); m.visible = i === 0; g.add(m);
    let lab = null;
    if (r.label) { lab = labelSprite(r.label, { size: r.labelSize || 1 }); lab.position.set(r.x, r.post ? 3.6 : 3.2, r.z); lab.visible = i === 0 || !!part.showAll; g.add(lab); }
    if (r.post) { const p = new THREE.Group(); p.position.set(r.x + 2.2, 0, r.z); g.add(p); add(p, new THREE.CylinderGeometry(0.1, 0.12, 2.6, 6), 0x5a3f2a, 0, 1.3, 0); add(p, box(1.6, 0.5, 0.08), 0xefe3c6, 0, 2.3, 0.08); } // 이정표 기둥
    let person = null;
    if (r.look) { person = standPerson(g, r.look, r.x + (r.post ? -1.6 : 1.6), r.z - 0.6); person.rotation.y = r.ry ?? 0; }
    if (part.showAll) m.visible = true; // 이정표를 처음부터 모두 보이고 차례대로 걷는다
    return { ...r, m, lab, person, pos: s.at(r.x, r.z) };
  });
  const hazards = (part.hazards || []).map(hz => {
    const hg = new THREE.Group(); hg.position.set(hz.x, 0, hz.z); g.add(hg);
    if (hz.kind === 'log') { const l = add(hg, new THREE.CylinderGeometry(0.5, 0.5, 4, 10), 0x6b4a32, 0, 0.5, 0); l.rotation.z = Math.PI / 2; } // 굴러오는 통나무(가는 쪽과 직각으로 눕힘)
    else if (hz.kind === 'ship') { add(hg, box(2.6, 1.4, 6), 0x3a3f46, 0, 0.5, 0); add(hg, box(1.6, 1.4, 2), 0x2b2f36, 0, 1.8, -0.5); }
    else if (hz.kind === 'mine') { add(hg, new THREE.SphereGeometry(0.6, 10, 8), 0x2b2b2b, 0, 0.3, 0); }
    else if (hz.kind === 'crowd') { for (let i = 0; i < 3; i++) { const p = makePerson(LOOKS.gendarme); p.position.set(i - 1, 0, 0); hg.add(p); } }
    else if (hz.kind === 'car') { BUILD.truck(hg, { color: 0x8a2f24 }); }
    else if (hz.kind === 'cart') { const c = new THREE.Group(); c.rotation.y = Math.PI / 2; hg.add(c); BUILD.cart(c, { load: true }); } // 소달구지·손수레(1890년대 길)
    else if (hz.kind === 'truck') { BUILD.truck(hg, { color: 0x55603f }); } // 군용 트럭(전쟁 장면)
    else { const r = add(hg, new THREE.DodecahedronGeometry(hz.r || 1.4, 0), 0x6b6862, 0, 0.4, 0); r.scale.y = 0.6; }
    return { ...hz, hg, ph: Math.random() * 6 };
  });
  // 줍기: 가는 길에 흩어진 것(태극기·편지 등). needPickups가 붙은 지점은 다 모아야 지나갈 수 있다.
  const pickups = (part.pickups || []).map(pk => {
    const pg = new THREE.Group(); pg.position.set(pk.x, 0, pk.z); g.add(pg);
    // 사람을 모으는 것(follow)은 들판에 선 사람으로, 물건은 빛나는 상자로 보인다
    const item = pk.follow ? standPerson(pg, pk.follow, 0, 0) : add(pg, box(0.5, 0.5, 0.5), 0xd9a441, 0, 1.0, 0); if (!pk.follow) item.rotation.set(0.5, 0.5, 0);
    const m = ring(0xd9a441, 0.6, 0.85); m.position.set(0, 0.09, 0); pg.add(m);
    if (pk.label) { const lab = labelSprite(pk.label, { size: 0.7 }); lab.position.set(0, 2.1, 0); pg.add(lab); }
    return { ...pk, pg, item, pos: s.at(pk.x, pk.z), got: false };
  });
  const left = () => pickups.filter(x => !x.got);
  const followers = [];
  let next = 0, last = part.from, safe = 0, held = 0;
  const total = route.length;
  const show = () => {
    const pk = pickups.length ? ` · ${part.pickupCounter || '모은 것'} ${pickups.length - left().length}/${pickups.length}` : '';
    const r = route[next];
    const wait = r && r.hold && held > 0 ? ` · ${r.holdLabel || '기다리는 중'} ${Math.min(r.hold, held).toFixed(1)}/${r.hold}초` : '';
    ctx.hud.setCounter(`${part.counter || '지난 곳'} ${next}/${total}${pk}${wait}`);
    // 다 모아야 하는 지점인데 아직 남았으면, 화살표는 가장 가까운 것을 가리킨다
    if (r && r.needPickups && left().length) {
      const p = world.player.position;
      const n = left().sort((a, b) => Math.hypot(a.pos.x - p.x, a.pos.z - p.z) - Math.hypot(b.pos.x - p.x, b.pos.z - p.z))[0];
      world.setGoal(n.pos);
    } else world.setGoal(r ? r.pos : null);
  };
  show();
  // 건네받기: give가 있는 곳에 닿으면 그곳 사람이 꾸러미를 건네고, 학생이 두 손에 들고 다닌다. hand가 있는 곳에서는 하나씩 건넨다
  let carried = null;
  s.cleanup(() => { if (carried) setCarry(world.player, null); });
  const giveBundle = r => {
    const b = new THREE.Group(); for (let k = 0; k < 5; k++) add(b, box(0.7, 0.07, 0.5), k % 2 ? 0xf2ede0 : 0xe6dfcc, 0, k * 0.075, 0); add(b, box(0.08, 0.42, 0.52), 0x8a6a48, 0, 0.18, 0);
    const from = r.person ? r.person.position.clone().add(new THREE.Vector3(0, 1.3, 0)) : new THREE.Vector3(r.x, 1.3, r.z);
    b.position.copy(from); g.add(b);
    const to = new THREE.Vector3(); let k = 0;
    const off = world.onUpdate(dt => { // 사람 손에서 학생 손으로 날아온다
      k = Math.min(1, k + dt / 0.6);
      world.player.localToWorld(to.set(0, 1.22, 0.6)); g.worldToLocal(to);
      b.position.lerpVectors(from, to, k); b.position.y += Math.sin(k * Math.PI) * 0.6;
      if (k >= 1) { off(); g.remove(b); b.scale.setScalar(1.3); setCarry(world.player, b, 'arms'); carried = b; } // 두 팔로 안고 다닌다(D-18, 꾸러미가 몸보다 넓어 뒤에서도 보인다)
    });
    s.cleanup(off);
  };
  // 정류장 손님(alight: 내리는 사람 수, board: 타는 사람 수). 학생(전차)의 오른쪽 길가로 오간다
  const riders = [];
  s.cleanup(() => ctx.hud.setWait?.(null));
  const spawnRiders = r => {
    const p = world.player.position, ry = world.player.rotation.y, side = r.side || 1;
    const rx = Math.cos(ry) * side, rz = -Math.sin(ry) * side, fx = Math.sin(ry), fz = Math.cos(ry);
    const looks = r.riderLooks || ['gentleman', 'woman', 'student', 'citizen'];
    const local = (a, b) => g.worldToLocal(new THREE.Vector3(p.x + rx * a + fx * b, 0, p.z + rz * a + fz * b));
    for (let i = 0; i < (r.alight || 0); i++) {
      const person = standPerson(g, looks[i % looks.length], 0, 0); person.position.copy(local(1.4, (i - 0.5) * 1.2));
      person.userData.rider = 'off'; riders.push({ p: person, to: local(6 + i * 0.6, (i - 0.5) * 2.6), ph: i });
    }
    for (let i = 0; i < (r.board || 0); i++) {
      const person = standPerson(g, looks[(i + 2) % looks.length], 0, 0); person.position.copy(local(4.6, 1.6 + i));
      person.userData.rider = 'on'; riders.push({ p: person, to: local(1.2, 0.4), ph: i + 3 });
    }
  };
  const reach = r => {
    audio.play('correct');
    if (r.give) giveBundle(r);
    if (r.hand && carried) carried.scale.y = Math.max(0.3, carried.scale.y - 0.22);
    r.m.visible = false; if (r.lab) r.lab.visible = false;
    if (r.say) toast(ctx, r.say, 'good');
    last = [r.x, r.z]; next += 1; held = 0;
    const p = world.player.position;
    if (part.followers) for (let i = 0; i < part.followers.per; i++) {
      const looks = part.followers.looks, f = new THREE.Group(); // 따라오는 사람(flags면 태극기를 든다)
      BUILD.crowd(f, { n: 1, looks: [looks[followers.length % looks.length]], flags: part.followers.flags ? 1 : 0 });
      f.position.copy(p); g.parent.add(f); followers.push(f);
    }
    if (route[next]) { route[next].m.visible = true; if (route[next].lab) route[next].lab.visible = true; }
    show();
    const talk = () => s.say(r.talk, () => { if (next === total) setTimeout(() => s.finish(true), 400); });
    if (r.scene) s.run(() => r.scene(ctx, s, g)).then(() => { if (!s.done) talk(); }); // 그 자리에서 보는 짧은 장면(시간은 멈춘다), 그 뒤 대사
    else talk();
  };
  s.update((dt, el) => {
    const p = world.player.position;
    safe = Math.max(0, safe - dt);
    for (const h of hazards) {
      if (h.to) { // 두 점 사이를 오간다
        const k = (Math.sin((el + h.ph) * (h.speed || 0.6) * (easy ? 0.5 : 1)) + 1) / 2;
        h.hg.position.set(h.x + (h.to[0] - h.x) * k, 0, h.z + (h.to[1] - h.z) * k);
        h.hg.rotation.y = Math.atan2(h.to[0] - h.x, h.to[1] - h.z);
      }
      const hp = s.at(h.hg.position.x, h.hg.position.z);
      if (!safe && Math.hypot(p.x - hp.x, p.z - hp.z) < (h.r || 1.4) + 0.9) {
        audio.play('wrong'); safe = 1.5; held = 0;
        toast(ctx, part.bump || '부딪혔어요! 앞 지점에서 다시 가요.', 'bad');
        const back = s.at(...last); p.set(back.x, 0, back.z); world.snapCamera();
      }
    }
    for (const pk of pickups) {
      if (pk.got) continue;
      if (!pk.follow) pk.item.rotation.y += dt * 2; else pk.item.rotation.y = Math.atan2(p.x - pk.pos.x, p.z - pk.pos.z); // 사람은 학생 쪽을 본다
      if (near(p, pk.pos, 1.5)) {
        pk.got = true; pk.pg.visible = false; audio.play('tap'); toast(ctx, pk.say || (pk.follow ? `${pk.label || '한 사람'}이(가) 함께해요!` : `${pk.label || '하나'}를 주웠어요!`), 'good'); show();
        if (pk.follow) { const f = new THREE.Group(); BUILD.crowd(f, { n: 1, looks: [pk.follow] }); f.scale.setScalar(pk.small ? 0.7 : 1); f.position.copy(p); g.parent.add(f); followers.push(f); } // 찾은 사람이 뒤따라온다
      }
    }
    const r = route[next];
    if (r) {
      const inside = near(p, r.pos, 2);
      if (inside && r.needPickups && left().length) { if (!r.warned) { r.warned = true; toast(ctx, r.needSay || `아직 ${part.pickupCounter || '모을 것'}이(가) 남았어요.`, 'bad'); } }
      else if (inside && r.hold) { // 기다리기: 빛나는 곳 안에서 hold초를 버틴다(벗어나면 처음부터)
        if (!held && r.holdSay) toast(ctx, r.holdSay);
        if (!held && !r.ridden && (r.alight || r.board)) { r.ridden = true; spawnRiders(r); }
        held += dt; show();
        ctx.hud.setWait?.(`${r.holdLabel || '기다리는 중'} ${Math.max(1, Math.ceil(r.hold - held))}초`, r.holdCenter ? { center: true } : undefined); // 남은 초를 가운데 크게(holdCenter: 화면 한가운데에 더 크게, 근대 1장 망루)
        if (held >= r.hold) { ctx.hud.setWait?.(null); reach(r); }
      } else if (inside) reach(r);
      else if (held) { held = 0; ctx.hud.setWait?.(null); toast(ctx, r.holdLeave || '빛나는 곳을 벗어나면 처음부터 다시 기다려요.', 'bad'); show(); }
      if (!inside) r.warned = false;
    }
    // 정류장 손님: 내리는 사람은 전차 옆에서 길가로 걸어 나가고, 타는 사람은 길가에서 걸어와 전차에 오른다
    for (const rd of riders) {
      if (!rd.p.visible) continue;
      const dx = rd.to.x - rd.p.position.x, dz = rd.to.z - rd.p.position.z, d = Math.hypot(dx, dz);
      if (d < 0.05) { if (rd.p.userData.rider === 'on') rd.p.visible = false; continue; }
      const k = Math.min(d, dt * 2.2);
      rd.p.position.x += (dx / d) * k; rd.p.position.z += (dz / d) * k; rd.p.rotation.y = Math.atan2(dx, dz);
      rd.p.position.y = Math.abs(Math.sin(el * 9 + rd.ph)) * 0.08; // 걸음에 맞춰 살짝 들썩
    }
    // 따라오는 사람들: 앞사람을 줄지어 따라 걷는다
    let lead = world.player.position;
    for (const f of followers) {
      const dx = lead.x - f.position.x, dz = lead.z - f.position.z, d = Math.hypot(dx, dz);
      if (d > 1.3) { f.position.x += (dx / d) * Math.min(d - 1.3, dt * 9); f.position.z += (dz / d) * Math.min(d - 1.3, dt * 9); f.rotation.y = Math.atan2(dx, dz); }
      lead = f.position;
    }
  });
  s.cleanup(() => followers.forEach(f => f.parent && f.parent.remove(f)));
  return s.promise;
}

// ── stops ─────────────────────────────────────────────
export function stops(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const spots = part.spots.map((sp, i) => {
    const m = ring(0xd9a441); m.position.set(sp.x, 0.1, sp.z); g.add(m);
    const lab = labelSprite(sp.label); lab.position.set(sp.x, 2.6, sp.z); g.add(lab);
    if (sp.look) standPerson(g, sp.look, sp.x, sp.z - 1.4);
    return { ...sp, i, m, lab, pos: s.at(sp.x, sp.z), done: false };
  });
  let next = 0;
  const show = () => {
    ctx.hud.setCounter(`${part.counter || '찾아간 곳'} ${next}/${spots.length}`);
    const n = spots[next];
    ctx.testHooks.walkTo = n ? n.pos : null;
    world.setGoal((easy || s.missed) && n ? n.pos : null);
  };
  show();
  pickWithButton(ctx, s, () => spots.filter(x => !x.done), sp => {
    if (sp.i === next) {
      audio.play('correct'); sp.done = true; sp.m.material.color.set(0x2f6b5e);
      sp.lab.material.opacity = 0.55;
      if (sp.say) toast(ctx, sp.say, 'good');
      if (part.act) part.act(sp.i, s); // 맞는 차례에 닿으면 장면이 움직인다(예: 자격루 물이 차고 구슬이 구름, D-23)
      next += 1; show();
      s.say(sp.talk, () => { if (next === spots.length) setTimeout(() => s.finish(true), 500); });
    } else {
      toast(ctx, `× ${sp.label}: 아직 이 차례가 아니에요.`, 'bad');
      s.wrong(`「${sp.label}」은(는) 아직 차례가 아니에요. 바로 앞의 일 다음에 무엇이 일어났는지 떠올려 봐요. 이제 화살표가 맞는 곳을 알려 줄게요.`);
      show();
    }
  });
  return s.promise;
}

// ── deliver ───────────────────────────────────────────
// 가져다 놓을 물건 모양(카드의 carry: log·sack·scroll·notice·letter). 들 때는 몸 기준, 내려놓으면 바닥 기준(아랫면이 y 0)
const CARRY_THING = {
  log() { // 나무 기둥: 어깨에 메고(눕혀 들고), 내려놓으면 세운다
    const g = new THREE.Group(), m = add(g, new THREE.CylinderGeometry(0.16, 0.18, 2.6, 8), 0x9a6a3a, 0, 0, 0);
    m.material = mat(0x9a6a3a, 'wood', 'object');
    g.rotation.x = Math.PI / 2; // 앞뒤로 길게 어깨에 멘다
    return g;
  },
  sack() { // 세금 꾸러미: 베로 싼 보따리와 매듭
    const g = new THREE.Group();
    add(g, box(0.7, 0.45, 0.5), 0xd8ccb0, 0, 0.23, 0);
    add(g, box(0.74, 0.08, 0.12), 0x8a6a48, 0, 0.46, 0); add(g, new THREE.SphereGeometry(0.11, 8, 6), 0x8a6a48, 0, 0.52, 0);
    return g;
  },
  scroll() { // 둘둘 만 문서: 종이 두루마리와 나무 축
    const g = new THREE.Group();
    const r = add(g, new THREE.CylinderGeometry(0.12, 0.12, 0.62, 10), 0xf2ede0, 0, 0.12, 0); r.rotation.z = Math.PI / 2;
    for (const x of [-0.36, 0.36]) { const k = add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), 0x6b4a32, x, 0.12, 0); k.rotation.z = Math.PI / 2; }
    add(g, box(0.06, 0.26, 0.26), 0xa3262a, 0, 0.12, 0); // 붉은 끈
    return g;
  },
  notice() { // 방(벽보): 세워 든 종이에 먹 글씨 줄
    const g = new THREE.Group();
    add(g, box(0.62, 0.8, 0.02), 0xf0e9d8, 0, 0, 0);
    for (let i = 0; i < 4; i++) add(g, box(0.06, 0.6 - (i % 2) * 0.15, 0.01), 0x2a2420, 0.2 - i * 0.13, 0.02, 0.015);
    return g;
  },
  letter() { // 서양 배가 보낸 편지: 봉투와 붉은 봉인
    const g = new THREE.Group();
    add(g, box(0.5, 0.05, 0.34), 0xf4efe2, 0, 0.03, 0); add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10), 0xa3262a, 0, 0.07, 0);
    g.rotation.x = -0.5;
    return g;
  },
};
// 가져다 놓기 칸 이름표 자리: 원 앞쪽(카메라 쪽 dz)에 낮게(y는 글 가운데 높이) 두어, 먼 칸이어도 왼쪽 위 목표 상자 밑에 숨지 않게 한다
export const BIN_LABEL = { y: 2.2, dz: 1.6 };
export function deliver(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const bins = part.bins.map(b => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.35 }));
    disc.position.set(b.x, 0.07, b.z); g.add(disc);
    const r = ring(0xd9a441, 2.0, 2.3); r.position.set(b.x, 0.08, b.z); g.add(r);
    const lab = labelSprite(b.label, { size: 1.25 }); lab.position.set(b.x, BIN_LABEL.y, b.z + BIN_LABEL.dz); g.add(lab);
    if (b.look) standPerson(g, b.look, b.x, b.z - 2.6);
    return { ...b, disc, pos: s.at(b.x, b.z) };
  });
  let i = 0, held = null;
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.44), mat(0xf2ede0)); sheet.rotation.x = -0.5; // 손에 든 종이
  const things = new Map(); // 카드마다 든 물건(carry: 'log'·'sack'·'letter'), 없으면 종이 한 장
  const thing = c => { if (!c.carry || !CARRY_THING[c.carry]) return sheet; if (!things.has(c)) things.set(c, CARRY_THING[c.carry]()); return things.get(c); };
  const missedCards = new Set();
  const hold = () => {
    if (held) world.player.remove(held);
    const c = part.cards[i];
    held = c ? labelSprite(c.text, { bg: 'rgba(255,250,240,0.97)', border: '#d9a441' }) : null;
    if (held) { held.position.set(0, 3.1 / (world.player.scale.y || 1), 0); held.scale.divideScalar(world.player.scale.x || 1); world.player.add(held); } // 키가 작아도 글은 같은 크기·높이
    setCarry(world.player, c ? thing(c) : null, c && c.carry === 'log' ? 'shoulder' : 'arms'); // 머리 위 글은 읽기용으로 두고, 손에는 그 물건(없으면 종이 한 장)을 든다(D-18)
    ctx.hud.setCounter(`${part.counter || '가져다 놓은 것'} ${i}/${part.cards.length}`);
    const target = c && bins.find(b => b.id === c.bin);
    ctx.testHooks.walkTo = target ? target.pos : null;
    world.setGoal((easy || missedCards.has(c)) && target ? target.pos : null); // 한 번 틀린 것은 화살표가 맞는 곳을 알려 준다
  };
  hold();
  s.cleanup(() => { if (held) world.player.remove(held); setCarry(world.player, null); });
  // 놓은 뒤에는 처음 자리로 돌아가 다음 것을 든다
  const home = () => { if (part.from) { const a = s.at(...part.from); place(world, [a.x, a.z], part.face ?? Math.PI); } };
  // 지나가다 밟은 것은 놓지 않는다: 원 안에서 멈춰 잠깐(DWELL초) 서 있어야 놓인다. 원은 서 있는 동안 점점 밝아진다.
  const DWELL = 0.7;
  let inside = null, stay = 0;
  const last = world.player.position.clone();
  s.update(dt => {
    const moved = world.player.position.distanceTo(last) / Math.max(dt, 1e-3); last.copy(world.player.position);
    const c = part.cards[i];
    const b = c && bins.find(x => near(world.player.position, x.pos, 2.1));
    if (b !== inside) { if (inside) inside.disc.material.opacity = 0.35; inside = b; stay = 0; }
    if (!b || stay < 0) return;
    if (moved > 1.5) { stay = 0; b.disc.material.opacity = 0.35; return; } // 걷는 중
    stay += dt; b.disc.material.opacity = 0.35 + Math.min(1, stay / DWELL) * 0.5;
    if (stay < DWELL) return;
    stay = -1; b.disc.material.opacity = 0.35; // 같은 원 안에서는 한 번만
    if (b.id === c.bin) {
      audio.play('correct'); toast(ctx, `○ ${c.text} → ${b.label}`, 'good');
      if (c.carry) { // 가져간 것은 그 자리에 내려놓는다(기둥은 세우고, 방은 칸의 drop: [x, y, z, 옆 간격] 자리에 붙이거나 바닥에 눕힌다)
        const o = thing(c), k = b.placed = (b.placed || 0) + 1;
        setCarry(world.player, null); o.rotation.set(0, 0, 0);
        if (b.drop) o.position.set(b.x + b.drop[0] + (k - 1) * (b.drop[3] || 0), b.drop[1], b.z + b.drop[2]);
        else { o.position.set(b.x + 1.2 + (k - 1) * 0.5, c.carry === 'log' ? 1.3 : 0.02, b.z - 1.4); if (c.carry === 'notice') o.rotation.x = -Math.PI / 2; }
        g.add(o);
      }
      i += 1; home(); hold();
      s.say(c.talk, () => { if (i === part.cards.length) setTimeout(() => s.finish(true), 500); });
    } else {
      toast(ctx, `× ${c.text}: ${b.label}이(가) 아니에요.`, 'bad');
      missedCards.add(c); home(); hold();
      s.wrong(`「${c.text}」은(는) ${b.label}이(가) 아니에요. 다시 들고 가 봐요. 이번에는 화살표가 맞는 곳을 알려 줄게요.`);
    }
  });
  return s.promise;
}

// ── find ──────────────────────────────────────────────
export function find(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const items = part.items.map(it => {
    const post = new THREE.Group(); post.position.set(it.x, 0, it.z); g.add(post);
    add(post, new THREE.CylinderGeometry(0.07, 0.08, 1.6, 6), 0x5a3f2a, 0, 0.8, 0);
    const lab = labelSprite(it.text, { size: 0.85 }); lab.position.set(0, 2.2, 0); post.add(lab);
    if (it.look) standPerson(post, it.look, 0, -1.2);
    const m = ring(0xd9a441, 0.8, 1.05); m.position.set(0, 0.09, 0); post.add(m);
    return { ...it, post, lab, m, pos: s.at(it.x, it.z), got: false };
  });
  const need = items.filter(x => x.correct).length;
  let got = 0;
  const show = () => {
    ctx.hud.setCounter(`${part.counter || '찾은 것'} ${got}/${need}`);
    const p = world.player.position;
    const left = items.filter(x => x.correct && !x.got).sort((a, b) => Math.hypot(a.pos.x - p.x, a.pos.z - p.z) - Math.hypot(b.pos.x - p.x, b.pos.z - p.z));
    ctx.testHooks.walkTo = left[0] ? left[0].pos : null;
    world.setGoal(easy && left[0] ? left[0].pos : null);
  };
  show();
  pickWithButton(ctx, s, () => items.filter(x => !x.got), it => {
    if (it.correct) {
      audio.play('correct'); it.got = true; it.m.material.color.set(0x2f6b5e); it.lab.material.opacity = 0.55;
      toast(ctx, `○ ${it.text}`, 'good'); got += 1; show();
      s.say(it.talk, () => { if (got === need) setTimeout(() => s.finish(true), 500); });
    } else {
      toast(ctx, `× ${it.text}`, 'bad');
      it.got = true; it.m.material.color.set(0x8a2f24); it.lab.material.opacity = 0.4; // 틀린 팻말은 다시 고르지 않게 흐리게
      s.wrong(`「${it.text}」은(는) 맞지 않아요.${it.why ? ' ' + it.why : ''} 남은 팻말 가운데 맞는 것을 찾아봐요.`);
      show();
    }
  });
  return s.promise;
}

// ── ambush ────────────────────────────────────────────
// shooters: [{ x, z, ry }] 언덕 풀숲에 엎드려 총을 겨눈 사람(D-37 근대 6장 의병). 누르면 가까운 둘이 쏘아(불빛·연기·총소리) 적이 놀라 물러난다
export function proneShooter(g, { x, z, ry = 0, look = 'uibyeong', y = 0, seed = 1, band: wear = true }) { // (x, z)는 가슴 자리. 발은 뒤(-z), 총은 앞(+z)
  const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = ry; g.add(s);
  const patch = new THREE.Mesh(new THREE.CircleGeometry(1.6, 14).rotateX(-Math.PI / 2), mat(0x4a6234, 'grass')); patch.scale.set(0.9, 1, 1.5); patch.position.set(0, 0.03, -0.3); s.add(patch); // 눌린 풀
  const body = makePerson({ ...LOOKS[look], gear: null }, { track: false });
  body.rotation.x = Math.PI / 2 - 0.14; body.position.set(0, 0.42, -1.2); s.add(body); // 배를 깔고 엎드려 가슴만 조금 든다
  const u = body.userData;
  if (u.head) u.head.rotation.x = -1.2; // 고개를 들어 앞을 본다
  u.arms?.forEach((a, i) => { a.rotation.x = Math.PI + 0.1; a.rotation.z = (i ? -1 : 1) * 0.28; }); // 두 팔을 앞으로 뻗어 총을 받친다
  u.legs?.forEach((l, i) => { l.rotation.z = (i ? -1 : 1) * 0.12; }); // 다리는 조금 벌린다
  if (wear) { // 흰 머리띠(의병). 군모를 쓴 독립군은 band: false
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.08, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0xf2efe6, side: THREE.DoubleSide }));
    band.position.y = 0.12; u.head?.add(band);
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.04), band.material); knot.position.set(0.08, 0.04, -0.34); knot.rotation.z = 0.4; u.head?.add(knot);
  }
  const gun = new THREE.Group(); gun.position.set(0.16, 0.7, 1.15); s.add(gun); // 뺨에 붙여 앞으로 겨눈 총
  add(gun, new THREE.CylinderGeometry(0.055, 0.06, 1.6, 6), 0x1e1c1a, 0, 0.02, 0.65).rotation.x = Math.PI / 2;
  add(gun, box(0.1, 0.14, 0.75), 0x6b4a32, 0, -0.03, -0.2);
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 16; i++) { // 몸을 가린 키 큰 풀숲(앞쪽 총구 길은 비운다)
    const a = rnd() * Math.PI * 2, d = 0.9 + rnd() * 0.9, px = Math.cos(a) * d, pz = Math.sin(a) * d * 1.4 - 0.2;
    if (pz > 0.6 && Math.abs(px) < 0.7) continue;
    const h = 1.0 + rnd() * 0.9, t = new THREE.Mesh(new THREE.ConeGeometry(0.1 + rnd() * 0.08, h, 4), mat(rnd() < 0.5 ? 0x4a6a34 : 0x6a8040, 'grass'));
    t.position.set(px, h / 2, pz); t.rotation.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5); s.add(t);
  }
  const muzzle = new THREE.Vector3(0.16, 0.72, 2.6);
  return { group: s, gun, muzzle, headband: wear && !!u.head, aim: !!(u.head && u.arms?.length === 2) };
}
// 일본군 깃발(욱일기, D-38 선생님): 앞선 부대가 든다
let rsTex = null;
function risingSunFlag() {
  if (!rsTex) {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; const c = cv.getContext('2d');
    c.fillStyle = '#f4f0e6'; c.fillRect(0, 0, 96, 64);
    c.fillStyle = '#b8282c';
    for (let i = 0; i < 16; i += 2) { const a0 = i / 16 * Math.PI * 2, a1 = (i + 1) / 16 * Math.PI * 2; c.beginPath(); c.moveTo(42, 32); c.lineTo(42 + Math.cos(a0) * 120, 32 + Math.sin(a0) * 120); c.lineTo(42 + Math.cos(a1) * 120, 32 + Math.sin(a1) * 120); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(42, 32, 13, 0, Math.PI * 2); c.fill();
    rsTex = new THREE.CanvasTexture(cv); rsTex.colorSpace = THREE.SRGBColorSpace;
  }
  const f = new THREE.Group();
  add(f, new THREE.CylinderGeometry(0.035, 0.035, 4.4, 5), 0x3a2c20, 0, 2.2, 0);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.1), new THREE.MeshLambertMaterial({ map: rsTex, side: THREE.DoubleSide })); cloth.position.set(0.85, 3.75, 0); f.add(cloth);
  return f;
}
export function muzzleFire(g, shooter, ctx) {
  const p = shooter.group.localToWorld(shooter.muzzle.clone()); g.worldToLocal(p);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe8e4da, transparent: true, opacity: 0.75, depthWrite: false }));
  flash.position.copy(p); smoke.position.copy(p); g.add(flash, smoke);
  let t = 0;
  const off = ctx.world.onUpdate(dt => {
    t += dt; flash.visible = t < 0.15; shooter.gun.position.z = 0.55 - Math.max(0, 0.12 - t); // 총이 뒤로 살짝 튄다
    smoke.scale.setScalar(1 + t * 3); smoke.position.y = p.y + t * 0.6; smoke.material.opacity = Math.max(0, 0.75 - t * 0.6);
    if (t > 1.3) { off(); g.remove(flash, smoke); }
  });
}
export function ambush(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, { ...part, from: null }, easy);
  const g = s.arena.group;
  ctx.input.enabled = false;
  world.player.visible = false;
  s.cleanup(() => { world.player.visible = true; world.camMode = 'follow'; });
  const cam = part.camera;
  const cp = s.at(cam.pos[0], cam.pos[2]), ct = s.at(cam.target[0], cam.target[2]);
  const far = world.camera.aspect < 1 ? Math.min(2.4, 1.2 / world.camera.aspect) : 1; // 휴대폰 세로: 좌우가 좁으니 카메라를 뒤로
  world.setFixedCamera([ct.x + (cp.x - ct.x) * far, cam.target[1] + (cam.pos[1] - cam.target[1]) * far, ct.z + (cp.z - ct.z) * far], [ct.x, cam.target[1], ct.z]);
  world.camMode = 'fixed';
  const taps = createTapTargets(ctx);
  s.cleanup(() => taps.dispose());
  const shooters = (part.shooters || []).map((sp, i) => proneShooter(g, { seed: i + 1, ...sp }));
  const hook = ctx.testHooks.ambush = { prone: shooters.length, shots: 0, flashes: 0, headbands: shooters.filter(x => x.headband).length, aimPose: shooters.length > 0 && shooters.every(x => x.aim), flag: false, fallen: 0, lying: 0, targets: 0 };
  const fire = u => { // 다가온 적과 가까운 둘이 쏜다
    const near = shooters.map(sh => ({ sh, d: sh.group.position.distanceTo(u.position) })).sort((a, b) => a.d - b.d).slice(0, 2);
    near.forEach(({ sh }) => { muzzleFire(g, sh, ctx); hook.flashes += 1; });
    hook.shots += 1; audio.play('shot');
  };
  const paths = part.paths || [part.path]; // 여러 길이면 번갈아 들어온다
  const zones = part.zones || [part.zone];
  for (const zn of zones) { const zm = new THREE.Mesh(new THREE.CircleGeometry(zn.r, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.18 })); zm.position.set(zn.x, 0.08, zn.z); g.add(zm); }
  // 여러 차례 공격(waves): 차례마다 적 수·필요한 수·빠르기, 차례 사이 이야기(talk)
  const waves = part.waves || [{ enemies: part.enemies, need: part.need, interval: part.interval, speed: part.speed }];
  const needOf = w => Math.max(1, w.need - (easy ? 1 : 0));
  const totalNeed = waves.reduce((a, w) => a + needOf(w), 0);
  const units = [];
  let wi = 0, spawned = 0, waveHits = 0, hits = 0, clock = 0, between = false;
  const count = () => ctx.hud.setCounter(`${part.counter || '물리친 적'} ${hits}/${totalNeed}${waves.length > 1 ? ` · ${wi + 1}/${waves.length}차` : ''}`);
  count();
  const wave = () => waves[wi];
  const spawn = () => {
    const W = wave();
    const u = new THREE.Group(); g.add(u);
    let unit0 = null;
    if (part.unit === 'ship') { add(u, box(2.6, 1.6, 7), 0x3a3f46, 0, 0.5, 0); add(u, box(1.6, 2, 2.4), 0x2b2f36, 0, 2, -0.6); add(u, new THREE.CylinderGeometry(0.08, 0.08, 4, 5), 0x2b241c, 0, 3.4, 0.8); }
    else if (part.unit === 'target') { // 썰매 위 나무틀에 둥근 과녁 판(앞이 +z)
      add(u, box(1.6, 0.12, 0.9), 0x6b4a32, 0, 0.06, 0);
      const board = new THREE.Group(); board.position.y = 0.12; u.add(board);
      for (const sx of [-1, 1]) add(board, box(0.1, 1.9, 0.1), 0x5e4330, sx * 0.62, 0.95, 0);
      [[0.78, 0xd2b07a], [0.55, 0xe6dcc3], [0.3, 0xb8452f], [0.1, 0xe6dcc3]].forEach(([r, c], k) => { const d = add(board, new THREE.CylinderGeometry(r, r, 0.06, 18), c, 0, 1.45, 0.06 + k * 0.015); d.rotation.x = Math.PI / 2; });
      u.scale.setScalar(1.4); unit0 = board; // 멀리서도 잘 보이게 조금 크게
    }
    else for (let i = 0; i < 3; i++) { const p = makePerson(LOOKS[W.look || part.look || 'gendarme']); p.position.set((i - 1) * 0.9, 0, -i * 0.6); u.add(p); }
    if (part.flag && spawned === 0) { const f = risingSunFlag(); f.position.set(0.45, 0, 0.6); u.add(f); hook.flag = true; } // 차례마다 맨 앞 부대가 깃발을 든다
    const [[ax, az], [bx, bz]] = paths[(spawned + wi) % paths.length];
    u.rotation.y = part.unit === 'target' ? 0 : Math.atan2(bx - ax, bz - az); // 과녁은 늘 쏘는 쪽을 본다
    const unit = { u, board: unit0, k: 0, state: 'come', t: null, smoke: null, a: [ax, az], b: [bx, bz], len: Math.hypot(bx - ax, bz - az), speed: (W.speed || part.speed || 2.2) * (easy ? 0.7 : 1) };
    unit.t = taps.add(u, { label: part.label || '공격!', onTap: () => {
      if (unit.state !== 'come') return;
      unit.state = part.unit === 'ship' ? 'back' : part.unit === 'target' ? 'hit' : 'down'; unit.down = 0; if (unit.state === 'hit') hook.targets += 1; hits += 1; waveHits += 1; if (shooters.length) fire(u); audio.play('correct'); count(); // 맞은 병사는 뒤로 쓰러진다(D-45, 배는 물러난다)
      if (unit.state === 'down') hook.fallen += u.children.filter(c => c.userData?.arms).length;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdedad2, transparent: true, opacity: 0.7 }));
      puff.position.set(0, 1.5, 0); if (unit.board) puff.scale.setScalar(0.45); u.add(puff); unit.smoke = puff; // 과녁은 작은 흙먼지
    } });
    unit.t.btn.hidden = true;
    units.push(unit); spawned += 1;
  };
  s.update(dt => {
    if (between) return;
    const W = wave();
    clock += dt;
    if (spawned < W.enemies && clock >= spawned * (W.interval || part.interval || 2.4) * (easy ? 1.3 : 1)) spawn();
    for (const unit of units) {
      const [ax, az] = unit.a, [bx, bz] = unit.b, len = unit.len;
      if (unit.state === 'come') unit.k += (unit.speed * dt) / len;
      else if (unit.state === 'back') { unit.k -= (unit.speed * 1.6 * dt) / len; unit.u.rotation.y = Math.atan2(ax - bx, az - bz); }
      else if (unit.state === 'hit') { // 맞은 과녁 판은 뒤로 넘어가고 썰매는 그대로 지나간다
        unit.down += dt; unit.k += (unit.speed * dt) / len;
        const k = Math.min(1, unit.down / 0.4); unit.board.rotation.x = -Math.PI / 2 * k * k;
        if (unit.k >= 1) { unit.state = 'away'; unit.u.visible = false; }
      }
      else if (unit.state === 'down') { // 쓰러져 잠시 누워 있다가(피는 없다) 땅속으로 사라진다
        unit.down += dt;
        unit.u.children.forEach((c, i) => {
          if (c === unit.smoke) return;
          const k = Math.min(1, Math.max(0, (unit.down - i * 0.12) / 0.45));
          const side = i % 2 ? 1 : -1; // 옆으로 비스듬히 쓰러져 멀리서도 누운 모습이 보인다
          c.rotation.x = -Math.PI * 0.18 * k * k; c.rotation.z = side * Math.PI / 2 * k * k; c.position.y = unit.down > 2.4 ? -Math.min(1, (unit.down - 2.4) / 0.8) * 0.6 : 0;
          if (c.userData?.arms) hook.lying = Math.max(hook.lying, Math.abs(c.rotation.z));
        });
        if (unit.down > 3.2) { unit.state = 'away'; unit.u.visible = false; }
      }
      const x = ax + (bx - ax) * unit.k, z = az + (bz - az) * unit.k;
      unit.u.position.set(x, 0, z);
      if (unit.smoke) { unit.smoke.scale.multiplyScalar(1 + dt * 0.6); unit.smoke.material.opacity = Math.max(0, unit.smoke.material.opacity - dt * 0.4); }
      const inZone = zones.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r);
      unit.t.used = !(unit.state === 'come' && inZone); // 골짜기 안에 있을 때만 누를 수 있다
      if (unit.state === 'come' && unit.k >= 1) { unit.state = 'gone'; audio.play('wrong'); toast(ctx, part.miss || '놓쳤어요! 다음을 기다려요.', 'bad'); }
      if (unit.state === 'back' && unit.k <= -0.2) { unit.state = 'away'; unit.u.visible = false; }
      if (unit.state === 'gone') unit.u.visible = false;
    }
    // 이번 차례가 끝났는지: 다 나왔고 다가오는 적이 없을 때
    if (spawned === W.enemies && units.every(u => u.state !== 'come')) {
      if (waveHits < needOf(W)) { s.finish(false); return; }
      if (wi === waves.length - 1) { setTimeout(() => s.finish(true), 900); between = true; return; }
      between = true;
      for (const u of units) { taps.remove(u.t); g.remove(u.u); }
      units.length = 0;
      wi += 1; spawned = 0; waveHits = 0; clock = 0; count();
      s.say(wave().talk, () => { between = false; toast(ctx, `${wi + 1}차 공격이 와요!`); });
    }
  });
  return s.promise;
}

// ── sneak ─────────────────────────────────────────────
export function sneak(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const wps = part.waypoints.map((w, i) => {
    const m = ring(0x7fb3c8, 1.1, 1.5); m.position.set(w.x, 0.1, w.z); m.visible = i === 0; g.add(m);
    let lab = null; if (w.label) { lab = labelSprite(w.label, { size: 0.8 }); lab.position.set(w.x, 2.6, w.z); lab.visible = i === 0; g.add(lab); }
    return { ...w, m, lab, pos: s.at(w.x, w.z) };
  });
  const guards = part.guards.map(gd => {
    const body = makePerson(LOOKS[gd.look || 'gendarme']); g.add(body);
    const range = (gd.range || 5) * (easy ? 0.75 : 1);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(range, 24, -0.55, 1.1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.32, depthWrite: false }));
    cone.rotation.y = -Math.PI / 2; // 원 조각의 가운데(+x)가 헌병의 앞(+z)을 보게(D-40: 예전에는 뒤를 비췄다)
    cone.position.y = 0.06; body.add(cone);
    return { ...gd, body, range, ph: Math.random() * 6, cone };
  });
  ctx.testHooks.sneak = { guards };
  // 숨을 곳(덤불·짐더미): 안에 들어가 있으면 감시원 불빛에 들키지 않는다
  const hides = (part.hides || []).map(hd => {
    const hg = new THREE.Group(); hg.position.set(hd.x, 0, hd.z); g.add(hg);
    for (let i = 0; i < 4; i++) { const b = add(hg, new THREE.SphereGeometry(0.75, 8, 6), 0x3f6a3a, Math.cos(i * 1.7) * (hd.r || 1.6) * 0.55, 0.55, Math.sin(i * 1.7) * (hd.r || 1.6) * 0.55); b.scale.y = 0.8; }
    return { ...hd, pos: s.at(hd.x, hd.z) };
  });
  const hidden = p => hides.some(hd => near(p, hd.pos, hd.r || 1.6));
  let next = 0, last = part.from, caught = 0;
  const show = () => { ctx.hud.setCounter(`${part.counter || '지난 숨을 곳'} ${next}/${wps.length}`); world.setGoal(wps[next] ? wps[next].pos : null); };
  show();
  s.update((dt, el) => {
    const p = world.player.position;
    caught = Math.max(0, caught - dt);
    for (const gd of guards) {
      const [[ax, az], [bx, bz]] = gd.path;
      const k = (Math.sin((el + gd.ph) * (gd.speed || 0.5)) + 1) / 2, dk = Math.cos((el + gd.ph) * (gd.speed || 0.5));
      gd.body.position.set(ax + (bx - ax) * k, 0, az + (bz - az) * k);
      const want = dk >= 0 ? Math.atan2(bx - ax, bz - az) : Math.atan2(ax - bx, az - bz); // 걷는 쪽으로 천천히 돌아선다(불빛도 함께 돈다)
      if (gd.ry === undefined) gd.ry = want;
      gd.ry += Math.atan2(Math.sin(want - gd.ry), Math.cos(want - gd.ry)) * Math.min(1, dt * 5);
      gd.body.rotation.y = gd.ry;
      if (caught || hidden(p)) continue;
      const gp = s.at(gd.body.position.x, gd.body.position.z), dx = p.x - gp.x, dz = p.z - gp.z, d = Math.hypot(dx, dz);
      let diff = Math.atan2(dx, dz) - gd.body.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (d < gd.range && Math.abs(diff) < 0.55) {
        audio.play('wrong'); caught = 1.5;
        toast(ctx, part.caught || '들켰어요! 앞의 숨을 곳에서 다시 가요.', 'bad');
        const back = s.at(...last); p.set(back.x, 0, back.z); world.snapCamera();
      }
    }
    const w = wps[next];
    if (w && near(p, w.pos, 1.6)) {
      audio.play('correct'); w.m.visible = false; if (w.lab) w.lab.visible = false;
      if (w.say) toast(ctx, w.say, 'good');
      last = [w.x, w.z]; next += 1;
      if (wps[next]) { wps[next].m.visible = true; if (wps[next].lab) wps[next].lab.visible = true; }
      show();
      s.say(w.talk, () => { if (next === wps.length) setTimeout(() => s.finish(true), 400); });
    }
  });
  return s.promise;
}

// ── judge ─────────────────────────────────────────────
// 사람들에게 다가가 이야기를 듣고(talk), 그 말이 맞는지 고른다(options[0] = 맞다, options[1] = 아니다).
// 틀리면 해설(why, 없으면 fail)을 듣고 다시 고른다. 모두 고르면 끝.
// { arena?, from, question, options: [맞다, 아니다], items: [{ x, z, look, talk: [대사], correct, why?, after?: [대사] }], counter? }
export function judge(ctx, part, easy) {
  const { world, audio, dialogue } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const items = part.items.map(it => {
    const post = new THREE.Group(); post.position.set(it.x, 0, it.z); g.add(post);
    const p = standPerson(post, it.look || 'soldier', 0, 0); p.rotation.y = it.ry ?? 0;
    const m = ring(0xd9a441, 0.9, 1.15); m.position.set(0, 0.09, 0); post.add(m);
    const lab = labelSprite(part.mark || '?', { size: 0.9 }); lab.position.set(0, 3.2, 0); post.add(lab); // mark: 머리 위 표시(근대 1장은 '!')
    return { ...it, post, m, lab, pos: s.at(it.x, it.z + 1.2), done: false };
  });
  let got = 0;
  const show = () => {
    ctx.hud.setCounter(`${part.counter || '들은 이야기'} ${got}/${items.length}`);
    const p = world.player.position;
    const left = items.filter(x => !x.done).sort((a, b) => Math.hypot(a.pos.x - p.x, a.pos.z - p.z) - Math.hypot(b.pos.x - p.x, b.pos.z - p.z));
    ctx.testHooks.walkTo = left[0] ? left[0].pos : null;
    world.setGoal(easy && left[0] ? left[0].pos : null);
  };
  show();
  pickWithButton(ctx, s, () => items.filter(x => !x.done), it => s.run(async () => {
    for (const l of it.talk || []) await dialogue.say(l);
    for (;;) {
      ctx.testHooks.choice = it.correct ? 0 : 1; // 테스트 봇이 고를 답
      const i = await dialogue.choose({ who: 'guide', text: part.question }, part.options);
      ctx.testHooks.choice = null;
      if ((i === 0) === !!it.correct) break;
      s.missed = true; audio.play('wrong');
      await dialogue.say({ who: 'guide', text: `× 다시 생각해 봐요. ${it.why || (typeof part.fail === 'string' ? part.fail : ctx.partHint) || ''}` });
    }
    audio.play('correct'); it.done = true; got += 1;
    it.m.material.color.set(0x2f6b5e); it.lab.visible = false;
    toast(ctx, `○ ${it.correct ? part.options[0] : part.options[1]}`, 'good');
    for (const l of it.after || []) await dialogue.say(l);
    show();
    if (got === items.length) setTimeout(() => s.finish(true), 300);
  }), 2.2);
  return s.promise;
}

// ── build ─────────────────────────────────────────────
// 지을 것을 하나씩 정해 주면, 알맞은 터로 걸어가 대화 버튼을 눌러 짓는다. 맞는 터면 건물이 땅에서 솟아오른다.
// 틀린 터면 해설을 듣고(화살표가 맞는 터를 알려 준다) 다시 고른다.
// { arena?, from, sites: [{ id, label, x, z }], builds: [{ text, site, make: () => Object3D, talk?: [대사], ry? }] }
export function build(ctx, part, easy) {
  const { world, audio } = ctx;
  const s = session(ctx, part, easy);
  const g = s.arena.group;
  const sites = part.sites.map(st => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.3 }));
    disc.position.set(st.x, 0.07, st.z); g.add(disc);
    const lab = labelSprite(st.label, { size: 1.1 }); lab.position.set(st.x, 3.2, st.z); g.add(lab);
    return { ...st, disc, lab, pos: s.at(st.x, st.z), built: null };
  });
  let i = 0, missedNow = false;
  const show = () => {
    const b = part.builds[i];
    ctx.hud.setCounter(b ? `지을 것: ${b.text} (${i + 1}/${part.builds.length})` : `다 지었어요 ${part.builds.length}/${part.builds.length}`);
    const t = b && sites.find(x => x.id === b.site);
    ctx.testHooks.walkTo = t ? t.pos : null;
    world.setGoal((easy || missedNow) && t ? t.pos : null);
  };
  // part.before(s): 짓기 전에 무대 안에서 먼저 할 일(예: 인물을 따라 터 둘러보기, D-22). 그동안 시간과 짓기는 멈춘다
  const start = () => {
  show();
  toast(ctx, `${part.builds[0].text}을(를) 지을 터를 찾아 대화 버튼을 눌러요.`);
  pickWithButton(ctx, s, () => sites.filter(x => !x.built), st => {
    const b = part.builds[i];
    if (st.id !== b.site) {
      missedNow = true; show();
      s.wrong(`「${st.label}」은(는) ${b.text}을(를) 지을 곳이 아니에요. 이제 화살표가 맞는 터를 알려 줄게요.`);
      return;
    }
    audio.play('correct'); missedNow = false;
    const obj = b.make(); obj.position.set(st.x, -6, st.z); obj.rotation.y = b.ry || 0; g.add(obj); st.built = obj;
    st.disc.visible = false; st.lab.visible = false;
    let k = 0; // 땅에서 솟아오른다(1.6초)
    s.update(dt => { if (k < 1) { k = Math.min(1, k + dt / 1.6); obj.position.y = -6 * (1 - k) * (1 - k); } });
    toast(ctx, `○ ${st.label}에 ${b.text}을(를) 지었어요`, 'good');
    i += 1; show();
    if (part.builds[i]) setTimeout(() => toast(ctx, `이번에는 ${part.builds[i].text}을(를) 지을 터를 찾아요.`), 1800);
    s.say(b.talk, () => { if (i === part.builds.length) setTimeout(() => s.finish(true), 1800); });
  }, 2.6);
  };
  if (part.before) s.run(() => part.before(s)).then(() => { if (!s.done) start(); });
  else start();
  return s.promise;
}

export const PLAY = { drive, stops, deliver, find, ambush, sneak, judge, build };
