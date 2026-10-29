// 현대편 2장(D-48): 「서울」 문으로 들어와 서울 시민·이승만·김구 이야기를 아무 차례로 듣고(모두 들어야 신문 기자) →
// 5·10 총선거 투표 날 장면 → 내 손으로 투표하기 → 기자에게 말을 걸면 제헌 헌법 완성하기. 역사책·가져다 놓기·투표소 걷기·안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import h2, { villageTalk, electionScene, votePlay, constitutionPlay, QUEUE, POLL, HALL } from '../chapters/present/h2/chapter.js';
import script from '../chapters/present/h2/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['citizen', 'syngmanrhee', 'kimgu'];

test('h2 D-48: 광장 사람은 아무 차례로, 모두 들어야 신문 기자, 끝에 학생의 결심', () => {
  ok(h2.anyOrder, 'anyOrder');
  eq(villageTalk('kimgu', new Set(['citizen']))[0], script.npc.kimgu.bridge);
  eq(villageTalk('syngmanrhee', new Set())[0], script.npc.syngmanrhee.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.reporter.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.reporter.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('h2 D-48: 이승만·김구의 생각은 옳고 그름을 매기지 않는다', () => {
  const words = ['옳', '틀렸', '잘못', '맞는 생각', '바른 생각'];
  for (const id of ['syngmanrhee', 'kimgu', 'reporter']) for (const l of allLines(script.npc[id])) ok(!words.some(w => l.text.includes(w)), `${id}: "${l.text}"`);
});

test('h2 D-48: 서울 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = h2.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('h2 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('기자'), '둘째 퀘스트는 신문 기자');
  ok(script.goals[2].includes('투표'), '셋째 퀘스트는 투표 날');
  const idx = h2.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signElection && !script.npc.signJeju && !script.npc.signConstitution, '안내판 npc 항목은 지웠다');
  ok(h2.layout.signs.length >= 2 && h2.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('h2 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    h2.buildScene(w);
    const [px, pz] = h2.portal.at, fx = px + Math.sin(h2.portal.ry) * 1.2, fz = pz + Math.cos(h2.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = h2.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('h2 D-48 C-05: 놀이는 새 놀이 둘(투표하기 → 헌법 완성하기), 다음 놀이는 기자에게 말을 걸어야 시작', () => {
  eq(h2.parts.map(p => p.type), ['act', 'act']);
  ok(!h2.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(h2.parts[1].intro?.[0]?.meet?.who, 'reporter');
  ok(h2.parts[1].intro.slice(1).every(l => l.who === 'reporter'), '말 건 기자가 알려 준다');
  ok(!script.parts.flow && !script.parts.views && script.parts.vote.type === 'act', '역사책·가져다 놓기·투표소 걷기는 뺐다');
  const bl = script.parts.law.blanks;
  eq(bl.map(b => b.answer), ['민주 공화국', '주권', '국민']);
  for (const b of bl) { eq(b.options.length, 3); ok(b.options.includes(b.answer), b.answer); }
});

test('h2 D-48: 안내판·역사책 글은 출처 그대로 대사·장면·놀이가 되었다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S51') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['5·10 총선거', '제주 4·3 사건', '민주 공화국', '국제 연합', '모스크바', '1948년 8월 15일', '남쪽만이라도', '통일 정부']) has(t);
  has('투표할 수 있었던', 'S70');
});

test('h2 D-48: 투표 날 장면 — 투표소 앞에 줄 선 사람들(얼굴이 보이게), 끝나면 치운다', async () => {
  ok(QUEUE.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h2.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await electionScene(s.ctx);
    const h = s.ctx.testHooks.election;
    ok(h.people >= 12, `줄 선 사람 ${h.people}`);
    ok(h.looks >= 5, `여러 사람(나이·남녀) ${h.looks}`);
    ok(h.entered >= 2, `차례로 들어감 ${h.entered}`);
    ok(h.facing >= 0.8, `D-45: 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('h2 D-48: 내 손으로 투표하기 — 명부 → 투표용지 → 기표소 도장 → 투표함, 끝나면 무대를 치운다', async () => {
  ok(POLL.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h2.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await votePlay(s.ctx, null, false);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.vote;
    eq(h.steps, ['roll', 'paper', 'booth', 'box']);
    ok(h.stamped >= 0 && h.stamped < 3, `도장 ${h.stamped}`);
    ok(h.inBox, '투표함에 넣었다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('h2 D-48: 제헌 헌법 완성하기 — 손 든 의원 셋과 빈칸을 채우고 의원들이 손뼉, 끝나면 무대를 치운다', async () => {
  ok(HALL.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    h2.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    const r = await constitutionPlay(s.ctx, null, false);
    ok(r === true, `끝냄 ${r}`);
    const h = s.ctx.testHooks.law;
    eq(h.filled, ['민주 공화국', '주권', '국민']);
    ok(h.members >= 12, `국회 의원 ${h.members}`);
    ok(h.clapped, '의원들이 일어나 손뼉');
    ok(h.facing >= 0.8, `D-45: 의원들 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
