// 현대편 3장(D-50): 「낙동강 진지」 문으로 들어와 국군 병사·유엔군 병사·피란민 이야기를 아무 차례로 듣고(모두 들어야 국군 지휘관) →
// 부산 항구에 16개 나라 유엔군 도착 → 물때를 읽고 인천에 상륙하기 → 국군 병사에게 말을 걸면 되찾은 서울에 태극기 올리기.
// 매복·상륙정 몰기·지도 걷기·길 위 안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h3, { villageTalk, arrivalScene, tidePlay, seoulPlay, PORT, FLEET, RUINS } from '../chapters/present/h3/chapter.js';
import script from '../chapters/present/h3/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['soldier', 'unSoldier', 'refugee'];

test('h3 D-50: 진지 사람은 아무 차례로, 모두 들어야 국군 지휘관, 끝에 학생의 결심', () => {
  ok(h3.anyOrder, 'anyOrder');
  eq(villageTalk('refugee', new Set(['soldier']))[0], script.npc.refugee.bridge);
  eq(villageTalk('unSoldier', new Set())[0], script.npc.unSoldier.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.officer.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.officer.first.at(-1).who, 'me');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h3 D-50: 진지 문, 문길은 비어 있고 문 옆 이름판, 길 위 안내판 대신 천막 간판', () => {
  const w = testWorld();
  try {
    const s = h3.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
    ok(h3.layout.signs.length >= 2 && h3.layout.signs.every(x => x.plaque), '간판만');
    ok(!script.npc.signUN && !script.npc.signRiver, '안내판 npc 항목은 지웠다');
  } finally { w.dispose(); }
});

test('h3 D-30 C-01·C-05: 퀘스트는 진행 차례대로, 놀이는 새 놀이 둘, 다음 놀이는 국군 병사에게 말을 걸어야', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('지휘관'));
  const idx = h3.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3) && idx.every((v, i) => !i || v > idx[i - 1]), `목표 ${idx}`);
  eq(idx.at(-1), script.goals.length - 1);
  eq(h3.parts.map(p => p.type), ['act', 'act']);
  ok(!h3.parts[0].intro?.[0]?.meet, '첫 놀이는 장면 뒤 바로');
  eq(h3.parts[1].intro?.[0]?.meet?.who, 'soldier');
  ok(!script.parts.river && !script.parts.landing && !script.parts.flow, '매복·상륙정 몰기·지도 걷기는 뺐다');
});

test('h3 D-50: 출처 있는 문장은 대사·장면·놀이로 남았다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S57') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['낙동강까지 물러났어요', '16개 나라', '마지막 방어선', '1950년 9월 15일', '9월 28일', '밀물과 썰물의 차이', '갯벌', '월미도']) has(t);
  has('튀르키예', 'S71');
  eq(script.arrival.nations.length, 16, '16개 나라');
});

test('h3 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h3.buildScene(w);
    const [px, pz] = h3.portal.at, fx = px + Math.sin(h3.portal.ry) * 1.2, fz = pz + Math.cos(h3.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h3.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h3 D-50: 유엔군 도착 — 16개 나라 이름판 아래 줄지어 서서 경례(얼굴이 보이게), 끝나면 치운다', async () => {
  ok(PORT.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h3.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await arrivalScene(s.ctx);
    const h = s.ctx.testHooks.arrival;
    eq(h.troops, 16); eq(h.labels, 16, '나라 이름판');
    ok(h.saluted, '경례');
    ok(h.facing >= 0.8, `D-45: 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h3 D-50: 물때를 읽고 인천에 상륙 — 물이 가장 높을 때를 두 번 고르고, 갯벌이 드러났다 잠기고, 신호 뒤 방파제를 오른다', async () => {
  ok(FLEET.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h3.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await tidePlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.tide;
    eq(h.picks, script.parts.tide.rounds.map(x => x.answer), '물이 가장 높은 때');
    eq(h.high, 2); ok(h.ebb, '물이 빠짐'); ok(h.signal, '상륙 신호');
    ok(h.climbed >= 4, `방파제를 오름 ${h.climbed}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('h3 D-50: 되찾은 서울에 태극기 — 줄을 당길 때마다 올라가고, 시민들이 나와 만세(얼굴이 보이게)', async () => {
  ok(RUINS.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h3.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await seoulPlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.seoul;
    eq(h.pulls, script.parts.seoul.pulls);
    ok(h.flagY > 6, `깃발 높이 ${h.flagY}`);
    ok(h.people >= 10 && h.cheers === 3, `시민 ${h.people}, 만세 ${h.cheers}`);
    ok(h.facing >= 0.8, `D-45: 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
