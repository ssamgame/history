import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { getTexture, KINDS } from '../core/textures.js';
import { mat, makePerson } from '../core/people.js';
import { scatter } from '../core/props.js';
import { LOOKS } from '../content/characters.js';
import { testWorld } from './bot.js';

test('textures: stone, wood, roof tile, grass and grain are drawn once and reused', () => {
  for (const k of ['grain', 'stone', 'wood', 'tile', 'grass', 'cloth']) ok(KINDS.includes(k), k);
  const a = getTexture('stone'), b = getTexture('stone');
  ok(a === b, 'cached');
  ok(a instanceof THREE.CanvasTexture);
  eq(a.wrapS, THREE.RepeatWrapping);
  eq(a.colorSpace, THREE.SRGBColorSpace);
  ok(getTexture('wood') !== a);
});

test('materials: every material has a surface texture mapped by world position', () => {
  const m = mat(0x123456), s = mat(0x123456, 'stone');
  ok(m.map === getTexture('grain'), 'plain colours get a light grain');
  ok(s.map === getTexture('stone'), 'asked-for kind');
  ok(m !== s, 'separate materials per kind');
  // 장면에서 쓰는 색은 알아서 맞는 무늬를 고른다: 성벽 회색은 돌, 지붕 먹색은 기와, 갈색 목재는 나뭇결
  ok(mat(0x8c8577).map === getTexture('stone'), '0x8c8577 → stone');
  ok(mat(0x3d4846).map === getTexture('tile'), '0x3d4846 → tile');
  ok(mat(0x6b4a32).map === getTexture('wood'), '0x6b4a32 → wood');
  ok(mat(0x8a7356).map === getTexture('earth'), '0x8a7356 → earth');
  ok(mat(0x123456, 'stone') === s, 'cached');
  ok(typeof s.onBeforeCompile === 'function' && s.userData.triScale > 0, 'world-position mapping');
});

test('world: tone mapping and a sun whose shadow follows the camera anywhere on the map', () => {
  const w = testWorld('high');
  try {
    eq(w.renderer.toneMapping, THREE.ACESFilmicToneMapping);
    w.setMood('overcast');
    w.player.position.set(320, 0, 0); w.snapCamera();
    w.step(0.05, { x: 0, z: 0 });
    ok(Math.abs(w.sun.target.position.x - 320) < 12, `sun aims at x ${w.sun.target.position.x.toFixed(1)}`);
    ok(w.sun.position.distanceTo(w.sun.target.position) > 30, 'sun stays far above');
  } finally { w.dispose(); }
});

test('world: shadow map is sharper on higher quality', () => {
  const w = testWorld('low');
  try {
    w.setQuality('high'); const hi = w.sun.shadow.mapSize.x;
    w.setQuality('medium'); const med = w.sun.shadow.mapSize.x;
    ok(hi > med, `${hi} > ${med}`);
  } finally { w.dispose(); }
});

test('people: belt, collar and shoes, and gear by role', () => {
  const names = g => { const s = new Set(); g.traverse(o => o.name && s.add(o.name)); return s; };
  const p = names(makePerson(LOOKS.player));
  for (const n of ['belt', 'collar', 'shoe']) ok(p.has(n), `player has ${n}`);
  ok(names(makePerson(LOOKS.player)).has('spear'), 'soldier carries a spear');
  ok(names(makePerson(LOOKS.gangamchan)).has('sword'), 'general wears a sword');
  ok(!names(makePerson(LOOKS.monk)).has('spear') && !names(makePerson(LOOKS.monk)).has('sword'), 'monk unarmed');
});

test('props: scattered scenery is batched, scales with quality and keeps clear of paths', () => {
  const w = testWorld('high');
  try {
    const keep = [{ x: 0, z: 0, r: 10 }];
    const hi = scatter(w, { kind: 'pine', count: 40, area: { x0: -30, x1: 30, z0: -30, z1: 30 }, avoid: keep, seed: 3 });
    ok(hi.meshes.every(m => m.isInstancedMesh), 'instanced (few draw calls)');
    ok(hi.meshes.length <= 3, `${hi.meshes.length} draw calls`);
    eq(hi.count, Math.round(40 * w.quality.particles)); // 높음은 더 촘촘하게(2026-10-23)
    ok(hi.positions.every(([x, z]) => Math.hypot(x, z) >= 10), 'nothing on the path');
    const again = scatter(w, { kind: 'pine', count: 40, area: { x0: -30, x1: 30, z0: -30, z1: 30 }, avoid: keep, seed: 3 });
    eq(again.positions, hi.positions, 'same seed, same layout');
    w.setQuality('low');
    const lo = scatter(w, { kind: 'grass', count: 40, area: { x0: -30, x1: 30, z0: -30, z1: 30 }, seed: 3 });
    ok(lo.count < 40 && lo.count > 0, `low quality draws fewer (${lo.count})`);
  } finally { w.dispose(); }
});

import { BUILD as KIT_BUILD } from '../chapters/kit/town.js';
import * as THREE_G from 'three';
test('graphics: 시대별 새 부품(가게·석고문 집·시멘트 건물·막사·노점·다리·배·축대·나무 종류)은 재질별로 합쳐 몇 번에 그린다', () => {
  const cases = [['shop', {}], ['shop', { style: 'modern', sign: '양화점' }], ['lanehouse', { n: 3 }], ['concrete', { floors: 3, sign: '다방' }], ['barracks', {}], ['stall', {}],
    ['bridge', {}], ['bridge', { style: 'wood' }], ['boat', {}], ['terrace', {}], ['paddy', {}], ['watchtower', {}], ['spearRack', {}], ['archeryTarget', {}], ...['pine', 'willow', 'bare', 'poplar'].map(kind => ['tree', { kind }])];
  for (const [type, p] of cases) {
    const g = new THREE_G.Group();
    KIT_BUILD[type](g, { x: 0, z: 0, ...p });
    let meshes = 0; g.traverse(o => { if (o.isMesh) meshes++; });
    ok(meshes > 0 && meshes <= 12, `${type} ${JSON.stringify(p)}: ${meshes}번`);
  }
});

import { bakeLevel } from '../core/bake.js';
test('bake: 움직이지 않는 장면 조각은 재질별로 합치고, 장면이 돌려준 것·사람·움직이는 것은 그대로 둔다', () => {
  const w = testWorld();
  try {
    const L = w.level, red = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), red); m.position.set(i, 0, 0); L.add(m); }
    const kept = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), red); L.add(kept);
    const spinner = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), red); L.add(spinner);
    w.onUpdate(dt => { spinner.rotation.y += dt; });
    const r = bakeLevel(w, { door: kept });
    ok(r.after < r.before, JSON.stringify(r));
    ok(kept.parent === L && spinner.parent === L, '돌려준 것과 움직이는 것은 그대로');
    let reds = 0; L.traverse(o => { if (o.isMesh && o.material === red) reds++; });
    eq(reds, 3, '스무 개가 하나로 + 둘');
  } finally { w.dispose(); }
});

import { animateWalk as AW, setWork } from '../core/people.js';
test('people: 서 있는 사람은 고개를 천천히 돌리고, 일하는 사람은 팔을 움직이며, 키가 조금씩 다르다', () => {
  const a = makePerson(LOOKS.commoner), b = makePerson(LOOKS.commoner);
  ok(Math.abs(a.scale.y - b.scale.y) > 0.001 || Math.abs(a.scale.y - 1) > 0.001, `키 ${a.scale.y} ${b.scale.y}`);
  const head = a.getObjectByName('headGroup'), h0 = head.rotation.y;
  // 고개는 쉬었다 돌렸다 한다(느린 물결 한 바퀴 약 30초, 사람마다 때가 다름) → 한 바퀴 안에 한 번은 돈다
  let turned = 0;
  for (let i = 0; i < 30 * 30; i++) { AW(a, false, 1 / 30); turned = Math.max(turned, Math.abs(head.rotation.y - h0)); }
  ok(turned > 0.01, '고개를 돌린다');
  const w = makePerson(LOOKS.worker); setWork(w, 'hammer');
  const arm = w.userData.arms[1], seen = new Set();
  for (let i = 0; i < 40; i++) { AW(w, false, 1 / 30); seen.add(arm.rotation.x.toFixed(2)); }
  ok(seen.size > 5, '일하는 팔이 움직인다');
});

import { buildArena, CENTER_SCALE } from '../chapters/kit/play.js';
test('arena: 무대 둘레(edge)에 시대다운 건물·나무를 세우되, 걷는 곳 밖에 두고 부딪힘 없이 몇 번에 그린다', () => {
  const world = testWorld();
  const arena = { origin: [400, 0], ground: 'stone', bounds: { x0: -15, x1: 15, z0: -10, z1: 12 }, props: [], edge: { style: 'modern' } };
  const cols = world.colliders.length;
  const a = buildArena(world, arena);
  eq(world.colliders.length, cols, '둘레 건물은 부딪힘이 없다');
  const edge = a.group.children.find(c => c.userData.edge), meshes = [];
  edge?.traverse(o => { if (o.isMesh) meshes.push(o); });
  let n = meshes.length, inside = 0;
  meshes.forEach(m => { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i += 7) { const x = p.getX(i), z = p.getZ(i); if (x > -14 && x < 14 && z > -9 && z < 11) inside++; } });
  ok(meshes.every(m => !m.castShadow), '먼 둘레 장식은 그림자를 드리우지 않는다');
  ok(edge && n > 0 && n <= 60, `둘레는 재질별로 합쳐 ${n}번`);
  eq(inside, 0, '걷는 곳 안에는 아무것도 없다');
  a.dispose();
});

test('arena: 근대~현대편 지도·바다 무대가 아닌 무대는 모두 둘레(edge)가 있다', async () => {
  const { MODERN, COLONIAL, PRESENT } = await import('../chapters/index.js');
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
    const ch = (await meta.load()).default;
    for (const p of ch.parts.filter(q => q.arena && !q.arena.map && !q.arena.sea && q.arena.nature !== false)) ok(p.arena.edge, `${meta.id} ${p.type}`);
  }
});

// 점과 선분 사이 거리
const segDist = ([px, pz], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz; const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0; return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
test('arena: 무대 가운데에 그 사건다운 역사 소품이 있고, 학생이 걷는 길·목표 지점·출발 자리를 막지 않는다', async () => {
  const { MODERN, COLONIAL, PRESENT } = await import('../chapters/index.js');
  const { BUILD } = await import('../chapters/kit/town.js');
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
    const ch = (await meta.load()).default;
    for (const part of ch.parts) {
      const a = part.arena; if (!a || a.map || a.sea) continue;
      const name = `${meta.id} ${part.type}`;
      ok((a.center || []).length >= 3, `${name}: 가운데 소품 3개 이상 (${(a.center || []).length})`);
      const pts = [...(part.route || []), ...(part.spots || []), ...(part.bins || []), ...(part.items || []), ...(part.waypoints || []), ...(part.sites || [])].map(q => [q.x, q.z]);
      const from = part.from ? [part.from[0], part.from[1]] : null;
      const segs = [];
      if (from && (part.type === 'drive' || part.type === 'sneak')) { let prev = from; for (const q of pts) { segs.push([prev, q]); prev = q; } }
      else if (from) for (const q of pts) segs.push([from, q]);
      if (part.path) for (let i = 1; i < part.path.length; i++) segs.push([part.path[i - 1], part.path[i]]);
      for (const g of part.guards || []) for (let i = 1; i < g.path.length; i++) segs.push([g.path[i - 1], g.path[i]]);
      for (const c of a.center || []) {
        const r0 = BUILD[c.type](new THREE.Group(), c), r = (typeof r0 === 'number' ? r0 : Math.max(...r0.rect) / 2) * (c.scale || CENTER_SCALE);
        const b = a.bounds, at = [c.x, c.z];
        ok(c.x > b.x0 && c.x < b.x1 && c.z > b.z0 && c.z < b.z1, `${name} ${c.type}: 걷는 곳 안`);
        for (const q of pts) ok(Math.hypot(c.x - q[0], c.z - q[1]) >= r + 2.4, `${name} ${c.type}(${c.x},${c.z}): 목표 (${q}) 가까이`);
        if (from) ok(Math.hypot(c.x - from[0], c.z - from[1]) >= r + 2.4, `${name} ${c.type}: 출발 자리 가까이`);
        for (const [p0, p1] of segs) ok(segDist(at, p0, p1) >= r + 1.4, `${name} ${c.type}(${c.x},${c.z}): 길 (${p0})→(${p1}) 위`);
      }
    }
  }
});

test('quality: 화질이 낮으면 멀리 있는 장식(무대 둘레 일부)만 숨기고, 무대 가운데 소품·길은 그대로 둔다. 화질을 올리면 다시 보인다', () => {
  const world = testWorld();
  const arena = { origin: [400, 0], ground: 'earth', bounds: { x0: -15, x1: 15, z0: -10, z1: 12 }, props: [], edge: { style: 'forest' }, center: [{ type: 'firepit', x: 0, z: 0 }] };
  const shown = root => { let n = 0; root.traverse(o => { if (o.isMesh) { let v = true, p = o; while (p) { if (!p.visible) v = false; p = p.parent; } if (v) n++; } }); return n; };
  world.setQuality('medium');
  const a = buildArena(world, arena);
  const decor = []; a.group.traverse(o => { if (o.userData.minQuality) decor.push(o); });
  ok(decor.length > 0, '둘레의 덜 중요한 장식은 화질 표시가 있다');
  const mid = shown(a.group);
  world.setQuality('low');
  const low = shown(a.group);
  ok(low < mid, `낮음에서 덜 그린다 (${mid} → ${low})`);
  world.setQuality('high');
  eq(shown(a.group), mid, '다시 올리면 모두 보인다');
  a.dispose();
});
