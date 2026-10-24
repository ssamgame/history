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
    ['bridge', {}], ['bridge', { style: 'wood' }], ['boat', {}], ['terrace', {}], ...['pine', 'willow', 'bare', 'poplar'].map(kind => ['tree', { kind }])];
  for (const [type, p] of cases) {
    const g = new THREE_G.Group();
    KIT_BUILD[type](g, { x: 0, z: 0, ...p });
    let meshes = 0; g.traverse(o => { if (o.isMesh) meshes++; });
    ok(meshes > 0 && meshes <= 12, `${type} ${JSON.stringify(p)}: ${meshes}번`);
  }
});
