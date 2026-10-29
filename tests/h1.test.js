// 현대편 1장(D-47): 「서울」 문으로 들어와 서울 시민·할머니·신문 파는 아이 이야기를 아무 차례로 듣고(모두 들어야 돌아온 김구) →
// 1945년 8월 15일 거리 만세 장면 → 문패 바꿔 달기 → 신문 파는 아이에게 말을 걸면 첫 한글 수업 교실. 소식 전하기·가져다 놓기·안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h1, { villageTalk, liberationScene, nameplatePlay, classroomPlay, STREET, NAMES, SCHOOL } from '../chapters/present/h1/chapter.js';
import script from '../chapters/present/h1/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['citizen', 'grandma', 'newsboy'];

test('h1 D-47: 거리 사람은 아무 차례로, 모두 들어야 김구, 끝에 학생의 결심', () => {
  ok(h1.anyOrder, 'anyOrder');
  eq(villageTalk('grandma', new Set(['citizen']))[0], script.npc.grandma.bridge);
  eq(villageTalk('newsboy', new Set())[0], script.npc.newsboy.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.kimgu.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.kimgu.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h1 D-47: 서울 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = h1.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('h1 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('김구'), '둘째 퀘스트는 김구');
  ok(script.goals[2].includes('8월 15일'), '셋째 퀘스트는 광복 날');
  const idx = h1.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signChildren && !script.npc.signPaper, '안내판 npc 항목은 지웠다');
  ok(h1.layout.signs.length >= 2 && h1.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('h1 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h1.buildScene(w);
    const [px, pz] = h1.portal.at, fx = px + Math.sin(h1.portal.ry) * 1.2, fz = pz + Math.cos(h1.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h1.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h1 D-47 C-05: 놀이는 새 놀이 둘(문패 바꿔 달기 → 첫 한글 수업), 다음 놀이는 신문 파는 아이에게 말을 걸어야 시작', () => {
  eq(h1.parts.map(p => p.type), ['act', 'act']);
  ok(!h1.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(h1.parts[1].intro?.[0]?.meet?.who, 'newsboy');
  ok(h1.parts[1].intro.slice(1).every(l => l.who === 'newsboy'), '말 건 아이가 알려 준다');
  ok(!script.parts.news && !script.parts.change, '소식 전하기·가져다 놓기는 뺐다');
  const hs = script.parts.names.houses;
  ok(hs.length >= 4, `집 ${hs.length}`);
  ok(!hs.some(h => h.old === '야스모토'), 'D-49: 야스모토는 다른 이름으로');
  for (const h of hs) { eq(h.options.length, 3); ok(h.options.includes(h.name), `${h.name}: 선택지에 정답`); ok(h.old && h.old !== h.name, '옛 문패'); }
});

test('h1 D-47: 안내판·가져다 놓기 글은 출처 그대로 사람 대사·장면이 되었다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S51') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['끊임없이 독립운동', '우리 성과 이름', '다시 발간', '한글 교과서', '어린이날', '1945년 8월 15일']) has(t);
  has('김구 선생은 1945년 11월에', 'S67');
  has('이승만은 10월에', 'S67');
});

test('h1 D-47: 광복 날 장면 — 사람들이 태극기를 들고 거리로 나와 만세(얼굴이 보이게), 끝나면 치운다', async () => {
  ok(STREET.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h1.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await liberationScene(s.ctx);
    const h = s.ctx.testHooks.liberation;
    ok(h.people >= 12, `사람 ${h.people}`);
    ok(h.flags >= h.people * 0.8, `태극기 ${h.flags}`);
    ok(h.cameOut >= 6, `집·가게에서 나온 사람 ${h.cameOut}`);
    ok(h.cheers >= 3, `만세 ${h.cheers}`);
    ok(h.facing >= 0.8, `D-45: 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h1 D-47: 문패 바꿔 달기 — 네 집 문패를 고른 이름으로 바꿔 달고, 끝나면 무대를 치운다', async () => {
  ok(NAMES.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h1.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await nameplatePlay(s.ctx, null, false);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.names;
    eq(h.hung, script.parts.names.houses.map(x => x.name));
    ok(h.oldDropped === h.hung.length, `옛 문패를 뗐다 ${h.oldDropped}`);
    ok(h.owners === h.hung.length, `집주인이 나왔다 ${h.owners}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('h1 D-47: 첫 한글 수업 — 책상마다 한글 교과서를 놓으면 아이가 읽고, 칠판에 우리말 우리글', async () => {
  ok(SCHOOL.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h1.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await classroomPlay(s.ctx, null, false);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.school;
    ok(h.desks >= 8 && h.books === h.desks, `책상 ${h.desks}, 놓은 책 ${h.books}`);
    eq(h.oldBooks, 0, '일본어 교과서는 모두 걷었다');
    ok(h.read >= h.desks, `읽은 아이 ${h.read}`);
    eq(h.seated, h.desks, 'D-49: 아이들이 모두 자기 책상 의자에 앉아 있다');
    ok(h.board, '칠판 글씨');
    ok(h.facing >= 0.8, `D-45: 함께 읽는 아이들 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
