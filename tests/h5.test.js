// 현대편 5장(D-52): 「피란민 마을」 문으로 들어와 행상 아주머니·밀면집 할머니·학생 이야기를 아무 차례로 듣고(모두 들어야 피란민 할아버지) →
// 구호물품 밀가루를 나눠 받는 줄 → 밀면 만들기 → 할아버지에게 말을 걸면 1983년 이산가족 찾기.
// 물 나르기·역사책·길 위 안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h5, { villageTalk, reliefScene, noodlePlay, familyPlay, RELIEF, KITCHEN, PLAZA } from '../chapters/present/h5/chapter.js';
import script from '../chapters/present/h5/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['mother', 'grandma', 'student'];

test('h5 D-52: 마을 사람은 아무 차례로, 모두 들어야 피란민 할아버지, 끝에 학생의 결심', () => {
  ok(h5.anyOrder, 'anyOrder');
  eq(villageTalk('grandma', new Set(['mother']))[0], script.npc.grandma.bridge);
  eq(villageTalk('student', new Set())[0], script.npc.student.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.grandpa.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.grandpa.first.at(-1).who, 'me');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h5 D-52: 마을 문, 문길은 비어 있고 문 옆 이름판, 길 위 안내판 대신 판잣집 간판', () => {
  const w = testWorld();
  try {
    const s = h5.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
    ok(h5.layout.signs.length >= 2 && h5.layout.signs.every(x => x.plaque), '간판만');
    ok(!script.npc.signFamily && !script.npc.signTask, '안내판 npc 항목은 지웠다');
  } finally { w.dispose(); }
});

test('h5 D-30 C-01·C-05: 퀘스트는 진행 차례대로, 놀이는 새 놀이 둘, 다음 놀이는 할아버지에게 말을 걸어야', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('할아버지'));
  const idx = h5.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3) && idx.every((v, i) => !i || v > idx[i - 1]), `목표 ${idx}`);
  eq(idx.at(-1), script.goals.length - 1);
  eq(h5.parts.map(p => p.type), ['act', 'act']);
  ok(!h5.parts[0].intro?.[0]?.meet, '첫 놀이는 장면 뒤 바로');
  eq(h5.parts[1].intro?.[0]?.meet?.who, 'grandpa');
  ok(!script.parts.help && !script.parts.life, '물 나르기·역사책은 뺐다');
});

test('h5 D-52: 출처 있는 문장은 대사·장면·놀이로 남았다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S51') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['판잣집', '행상', '냉면', '밀가루', '운동장', '적으로 여기는', '평화 통일', '구호물품']) has(t);
  has('138일', 'S62'); has('1983년', 'S62');
});

test('h5 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h5.buildScene(w);
    const [px, pz] = h5.portal.at, fx = px + Math.sin(h5.portal.ry) * 1.2, fz = pz + Math.cos(h5.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h5.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h5 D-52: 구호물품 줄 — 줄 선 사람들(얼굴이 보이게)이 밀가루 포대를 받아 간다, 끝나면 치운다', async () => {
  ok(RELIEF.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await reliefScene(s.ctx);
    const h = s.ctx.testHooks.relief;
    ok(h.people >= 10 && h.given === 2, `줄 ${h.people}, 받음 ${h.given}`);
    ok(h.facing >= 0.8, `얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h5 D-52: 밀면 만들기 — 반죽·국수틀·헹구기를 차례로 하고 손님 셋에게 낸다', async () => {
  ok(KITCHEN.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await noodlePlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.noodle, P = script.parts.noodle;
    eq(h.steps, P.steps.map(x => x.id));
    eq(h.presses, P.steps.reduce((n, x) => n + x.presses, 0));
    eq(h.served, P.guests);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('h5 D-52: 이산가족 찾기 — 할아버지 이야기대로 벽보를 쓰고 붙인 뒤 방송에서 동생을 만난다', async () => {
  ok(PLAZA.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await familyPlay(s.ctx);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.family;
    eq(h.filled, script.parts.family.fields.map(f => f.answer));
    ok(h.posted && h.aired && h.met, '붙임·방송·만남');
    for (const f of script.parts.family.fields) ok(script.parts.family.story.text.includes(f.answer.replace(' 피란길', '')), `이야기 속에 ${f.answer}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0); eq(s.w.moodName, h5.mood, '장의 하늘로 되돌렸다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
