// 근대편 3장(D-31): 고부 마을 문으로 들어와 모두 듣기 → 농민 모으기(걷는 농민이 농기구를 든다) → 전봉준에게 말을 걸면 횃불 밤 행진 → 고부 관아 → 요구 문서
// → 전봉준을 따라 황토현·전주성·집강소·다시 일어섬·우금치를 걸으며 보기. D-30 공통(퀘스트 차례·도입 장면·빛나는 문·간판·다가가서 시작)
import { test, eq, ok } from './harness.js';
import k3, { villageTalk, WALK, WALK_ARENA, MARCH, NIGHT_MOOD, makeTorch, torchLights, equipFollowers } from '../chapters/modern/k3/chapter.js';
import script from '../chapters/modern/k3/script.js';
import { MOODS } from '../core/world.js';
import { testWorld } from './bot.js';
import { BUILD } from '../chapters/kit/town.js';
import * as THREE from 'three';

const pathLen = (stops, p = [0, 12]) => { let n = 0; for (const s of stops) for (const q of s.path) { n += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return n; };

test('k3 D-31: 고부 사람은 아무 차례로, 모두 들어야 전봉준, 끝에 학생의 결심', () => {
  ok(k3.anyOrder, 'anyOrder');
  eq(villageTalk('farmer', new Set(['peasant']))[0], script.npc.farmer.bridge);
  eq(villageTalk('peasant', new Set())[0], script.npc.peasant.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.jeonbongjun.wait?.length, '아직 다 듣지 않았을 때 대사');
  const last = script.npc.jeonbongjun.first.at(-1);
  eq(last.who, 'me'); eq(last.text, '저도 농민들을 모으겠습니다!');
  ok(script.speakers.me, '나');
  ok(script.more?.text, '남았을 때 안내');
  ok(!JSON.stringify(script).includes('장군'), '"~장군" 대신 이름만');
});

test('k3 D-31: 마을 어귀 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = k3.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('k3 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 사람 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  const idx = k3.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 2), '부분마다 목표');
  ok(idx.every((v, i) => !i || v >= idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signDonghak && !script.npc.signGabo, '안내판 npc 항목은 지웠다');
  ok(k3.layout.signs.length >= 2 && k3.layout.signs.every(s => s.plaque), '건물 간판만');
  ok(k3.layout.signs.some(s => s.title === '고부 관아'), '관아 간판');
  const all = Object.values(script.npc).flatMap(n => [...(n.first || []), ...(n.later || [])]);
  ok(all.some(l => l.text.includes('최제우') && l.src), '동학 안내판 내용은 사람 대사로');
  ok(script.result.some(l => l.text.includes('갑오개혁') && l.src), '갑오개혁은 끝 정리로');
});

test('k3 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    k3.buildScene(w);
    const [px, pz] = k3.portal.at, fx = px + Math.sin(k3.portal.ry) * 1.2, fz = pz + Math.cos(k3.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = k3.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
  } finally { w.dispose(); }
});

test('k3 D-31 C-05: 놀이 차례, 행진과 따라 걷기는 전봉준에게 말을 걸어야 시작', () => {
  eq(k3.parts.map(p => p.type), ['drive', 'scene', 'scene', 'doc', 'scene']);
  ok(!k3.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 대화 뒤 바로');
  for (const p of [k3.parts[1], k3.parts[4]]) {
    eq(p.intro?.[0]?.meet?.who, 'jeonbongjun');
    ok(p.intro.slice(1).every(l => l.who === 'jeonbongjun'), '말 건 사람이 알려 준다');
  }
  ok(!k3.parts.some(p => p.type === 'book'), '역사책은 따라 걷기로 바꿨다');
  ok(k3.parts[3].scroll, '요구 문서는 두루마리');
});

test('k3 D-31: 뒤따르는 농민은 농기구를 들고 다리를 움직여 걷는다', () => {
  const w = testWorld();
  try {
    const ctx = { world: w };
    k3.parts[0].before(ctx);
    const f = new THREE.Group(); BUILD.crowd(f, { n: 1, looks: ['peasant'] }); w.level.add(f); // play.js drive가 따라오는 사람을 만드는 방식
    const p = f.children[0];
    let swing = 0;
    for (let i = 0; i < 30; i++) { f.position.z -= 0.15; w.step(1 / 20, { x: 0, z: 0 }); swing = Math.max(swing, Math.abs(p.userData.legs[0].rotation.x)); }
    ok(p.userData.carry && p.userData.carry.obj.name.startsWith('tool'), '농기구를 든다');
    ok(swing > 0.2, `다리를 움직인다 ${swing.toFixed(2)}`);
    eq(p.rotation.y, 0, '가는 쪽을 본다');
    k3.parts[0].after(ctx);
    ok(equipFollowers, 'equipFollowers');
  } finally { w.dispose(); }
});

test('k3 D-31: 횃불 밤 행진은 밤 하늘, 횃불은 스스로 빛나고 무거운 불빛은 보통·높음만', () => {
  const m = MOODS[NIGHT_MOOD];
  const lum = c => ((c >> 16 & 255) + (c >> 8 & 255) + (c & 255)) / 3;
  ok(m && lum(m.skyTop) < 60 && lum(m.skyHorizon) < 110, '밤 하늘');
  eq(k3.parts[1].mood, NIGHT_MOOD);
  const t = makeTorch();
  ok(t.name.startsWith('tool') && t.getObjectByName('flame').material.isMeshBasicMaterial, '불꽃은 빛 계산 없는 발광 재질');
  const lo = testWorld('low'), hi = testWorld('medium');
  try {
    eq(torchLights(lo), 0, '화질 낮음: 점광 없음');
    ok(torchLights(hi) >= 1, '화질 보통: 점광');
  } finally { lo.dispose(); hi.dispose(); }
  ok(MARCH.names.some(n => n.text === '고부 관아'), '관아 이름판');
  ok(pathLen([{ path: MARCH.path }], [0, 10]) >= 35, '밤길이 길다');
});

test('k3 D-31: 전봉준을 따라 황토현 → 전주성 → 집강소 → 다시 일어섬 → 우금치, 멈춘 곳마다 장면과 출처 있는 해설', () => {
  eq(script.walk.stops.map(s => s.label), ['황토현', '전주성', '집강소', '다시 일어섬', '우금치']);
  eq(WALK.length, script.walk.stops.length);
  ok(WALK.every(s => s.path.length >= 2 && typeof s.show === 'function'), '여러 걸음, 장면');
  ok(pathLen(WALK) >= 90, `걷는 길 ${pathLen(WALK).toFixed(0)}`);
  const texts = script.walk.stops.flatMap(s => s.talk.filter(l => l.who === 'narr'));
  ok(texts.every(l => l.src?.length), '해설은 출처');
  for (const want of ['황토현에서 관군을 크게 물리쳤어요', '전주성을 차지했어요', '집강소', '다시 일어났어요', '우금치에서 일본군과 관군에게 크게 졌고']) ok(texts.some(l => l.text.includes(want)), want);
  eq(WALK_ARENA.names.map(n => n.text), ['황토현', '전주성', '집강소', '공주 우금치']);
});
