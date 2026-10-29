// 현대편 4장(D-51): 「피란길」 문으로 들어와 국군 병사·유엔군 병사·이웃 할아버지 이야기를 아무 차례로 듣고(모두 들어야 피란민 어머니) →
// 남쪽으로 물러나는 행렬 → 피란 보따리 꾸리기(끝에 얼어붙은 강 건너기) → 유엔군 병사에게 말을 걸면 휴전선 긋기와 정전 협정.
// 아이 찾기·지도 걷기·역사책·길 위 안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h4, { villageTalk, retreatScene, packPlay, linePlay, ROAD, YARD, FRONT } from '../chapters/present/h4/chapter.js';
import script from '../chapters/present/h4/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['soldier', 'unSoldier', 'grandpa'];

test('h4 D-51: 마을 사람은 아무 차례로, 모두 들어야 피란민 어머니, 끝에 학생의 결심', () => {
  ok(h4.anyOrder, 'anyOrder');
  eq(villageTalk('grandpa', new Set(['soldier']))[0], script.npc.grandpa.bridge);
  eq(villageTalk('unSoldier', new Set())[0], script.npc.unSoldier.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.mother.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.mother.first.at(-1).who, 'me');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h4 D-51: 피란길 문, 문길은 비어 있고 문 옆 이름판, 길 위 안내판 대신 판잣집 간판', () => {
  const w = testWorld();
  try {
    const s = h4.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
    ok(h4.layout.signs.length >= 2 && h4.layout.signs.every(x => x.plaque), '간판만');
    ok(!script.npc.signPanmun && !script.npc.signTruce, '안내판 npc 항목은 지웠다');
  } finally { w.dispose(); }
});

test('h4 D-30 C-01·C-05: 퀘스트는 진행 차례대로, 놀이는 새 놀이 둘, 다음 놀이는 유엔군 병사에게 말을 걸어야', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('어머니'));
  const idx = h4.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3) && idx.every((v, i) => !i || v > idx[i - 1]), `목표 ${idx}`);
  eq(idx.at(-1), script.goals.length - 1);
  eq(h4.parts.map(p => p.type), ['act', 'act']);
  ok(!h4.parts[0].intro?.[0]?.meet, '첫 놀이는 장면 뒤 바로');
  eq(h4.parts[1].intro?.[0]?.meet?.who, 'unSoldier');
  ok(!script.parts.help && !script.parts.flow && !script.parts.truce, '아이 찾기·지도 걷기·역사책은 뺐다');
});

test('h4 D-51: 출처 있는 문장은 대사·장면·놀이로 남았다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S51') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['중국군', '1951년 1월 4일', '추운 겨울', '1953년 7월 판문점', '전쟁이 완전히 끝난 것은 아니에요', '압록강']) has(t);
  has('1951년 3월 서울을 다시 되찾은 뒤', 'S68'); has('판문점 천막', 'S68');
  has('2km', 'S72'); has('양쪽 군대가 맞선 곳', 'S72');
  const it = script.parts.pack.items;
  ok(it.some(x => x.take) && it.some(x => !x.take) && it.every(x => x.why), '가져갈 것·두고 갈 것과 까닭');
});

test('h4 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h4.buildScene(w);
    const [px, pz] = h4.portal.at, fx = px + Math.sin(h4.portal.ry) * 1.2, fz = pz + Math.cos(h4.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h4.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h4 D-51: 물러나는 행렬 — 트럭과 병사들이 카메라 쪽으로 지나간다, 끝나면 치운다', async () => {
  ok(ROAD.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await retreatScene(s.ctx);
    const h = s.ctx.testHooks.retreat;
    ok(h.soldiers >= 8 && h.passed >= 6, `병사 ${h.soldiers}, 지나감 ${h.passed}`);
    ok(h.facing >= 0.8, `얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h4 D-51: 피란 보따리 꾸리기 — 꼭 필요한 것만 넣고, 등에 지고 얼어붙은 강을 건넌다', async () => {
  ok(YARD.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await packPlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.pack, it = script.parts.pack.items;
    eq(h.taken, it.filter(x => x.take).map(x => x.id));
    eq(h.left, it.filter(x => !x.take).map(x => x.id));
    ok(h.crossed && h.family === 3, '가족과 함께 강을 건넘');
    ok(h.facing >= 0.8, `얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
    ok(!s.w.player.userData.carry, '돌아오면 보따리를 내려놓는다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('h4 D-51: 휴전선 긋기 — 말뚝 셋으로 선을 잇고, 양쪽이 물러나 비무장 지대, 판문점에서 서명', async () => {
  ok(FRONT.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await linePlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.line;
    eq(h.stakes, 3); eq(h.segments, 4, '서쪽 끝부터 동쪽 끝까지 줄');
    ok(h.backed && h.dmz && h.signed, '물러남·비무장 지대·서명');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
