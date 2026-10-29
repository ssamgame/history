// 현대편 6장(D-53): 「서울」 문으로 들어와 대학생·시민·공장 노동자 이야기를 아무 차례로 듣고(모두 들어야 고속도로 일꾼) →
// 1970년 7월 경부고속도로가 열리는 날 → 수출 공장에서 옷 만들기 → 시민에게 말을 걸면 1988년 서울 올림픽 굴렁쇠 굴리기.
// 고속도로 달리기·역사책·가져다 놓기·길 위 안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h6, { villageTalk, openingScene, factoryPlay, hoopPlay, HWY, FACTORY, STADIUM } from '../chapters/present/h6/chapter.js';
import script from '../chapters/present/h6/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['student', 'citizen', 'worker'];

test('h6 D-53: 거리 사람은 아무 차례로, 모두 들어야 고속도로 일꾼, 끝에 학생의 결심', () => {
  ok(h6.anyOrder, 'anyOrder');
  eq(villageTalk('worker', new Set(['student']))[0], script.npc.worker.bridge);
  eq(villageTalk('citizen', new Set())[0], script.npc.citizen.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.builder.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.builder.first.at(-1).who, 'me');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h6 D-53: 서울 문, 문길은 비어 있고 문 옆 이름판, 길 위 안내판 대신 건물 간판', () => {
  const w = testWorld();
  try {
    const s = h6.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
    ok(h6.layout.signs.length >= 2 && h6.layout.signs.every(x => x.plaque), '간판만');
    ok(!script.npc.signOlympic && !script.npc.signRoad, '안내판 npc 항목은 지웠다');
  } finally { w.dispose(); }
});

test('h6 D-30 C-01·C-05: 퀘스트는 진행 차례대로, 놀이는 새 놀이 둘, 다음 놀이는 시민에게 말을 걸어야', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('일꾼'));
  const idx = h6.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3) && idx.every((v, i) => !i || v > idx[i - 1]), `목표 ${idx}`);
  eq(idx.at(-1), script.goals.length - 1);
  eq(h6.parts.map(p => p.type), ['act', 'act']);
  ok(!h6.parts[0].intro?.[0]?.meet, '첫 놀이는 장면 뒤 바로');
  eq(h6.parts[1].intro?.[0]?.meet?.who, 'citizen');
  ok(!script.parts.highway && !script.parts.flow && !script.parts.split, '고속도로 달리기·역사책·가져다 놓기는 뺐다');
});

test('h6 D-53: 출처 있는 문장은 대사·장면·놀이로 남았다', () => {
  const lines = allLines(script);
  const has = (t, s) => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), `${t} (${s})`);
  has('3월 15일', 'S58'); has('4·19 혁명', 'S58');
  has('5·18 민주화 운동', 'S59'); has('직선제', 'S59');
  has('1970년 7월', 'S60'); has('하루 만에', 'S60');
  has('160개 나라', 'S61'); has('제24회', 'S61');
  has('수출', 'S73'); has('수출의 날', 'S73');
  has('굴렁쇠', 'S74');
});

test('h6 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h6.buildScene(w);
    const [px, pz] = h6.portal.at, fx = px + Math.sin(h6.portal.ry) * 1.2, fz = pz + Math.cos(h6.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h6.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h6 D-53: 고속도로 개통 — 줄을 끊자 차들이 달리고 구경꾼이 환호(얼굴이 보이게), 끝나면 치운다', async () => {
  ok(HWY.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await openingScene(s.ctx);
    const h = s.ctx.testHooks.opening;
    ok(h.cut && h.cars >= 3 && h.cheers === 2, `줄 ${h.cut}, 차 ${h.cars}, 환호 ${h.cheers}`);
    ok(h.facing >= 0.8, `D-45: 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h6 D-53: 수출 공장 — 박음질해서 상자 셋을 수출 트럭에 싣고 트럭이 떠난다', async () => {
  ok(FACTORY.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await factoryPlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.factory, P = script.parts.factory;
    eq(h.stitches, P.boxes * P.stitches); eq(h.shirts, P.boxes); eq(h.loaded, P.boxes);
    ok(h.drove, '트럭이 떠남');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
    ok(!s.w.player.userData.carry, '돌아오면 빈손');
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

test('h6 D-53: 올림픽 굴렁쇠 — 굴렁쇠를 굴리며 운동장을 가로지르고 성화가 타오른다', async () => {
  ok(STADIUM.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await hoopPlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.hoop;
    eq(h.marks, STADIUM.marks.length);
    ok(h.rolled > 20, `굴린 거리 ${h.rolled}`);
    ok(h.lit, '성화');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0); eq(s.w.moodName, h6.mood);
    ok(!s.w.player.userData.carry, '막대를 내려놓음');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
