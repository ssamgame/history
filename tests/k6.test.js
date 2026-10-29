// 근대편 6장(D-35): 한성 마을 문으로 들어와 학생·의병·신문 읽는 선비 이야기를 아무 차례로 듣고(모두 들어야 안창호) →
// 을사늑약 소식에 사람들이 신문 앞에 모여 슬퍼하고 가게가 문을 닫는 장면 →
// 두 갈래 길(애국 계몽 길: 학교 수업·신문 기사·민족 산업 / 의병 길: 해산 군인 맞이·연합 부대 출정) →
// 의병에게 말을 걸면 한성으로 가는 고갯길 매복 → 다시 의병에게 말을 걸면 만주·연해주로 떠나기 → 학생에게 말을 걸면 헤이그 특사.
// 가져다 놓기(여섯 글)는 체험으로 바꿨다. D-30 공통(퀘스트 차례·모두 들어야 메인 인물·도입 장면·빛나는 문·간판·다가가서 시작)
import { test, eq, ok } from './harness.js';
import k6, { villageTalk, newsScene, twoRoads, exileWalk, ROADS, EXILE } from '../chapters/modern/k6/chapter.js';
import script from '../chapters/modern/k6/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['student', 'uibyeong', 'reader'];

test('k6 D-35: 마을 사람은 아무 차례로, 모두 들어야 안창호, 끝에 학생의 결심', () => {
  ok(k6.anyOrder, 'anyOrder');
  eq(villageTalk('uibyeong', new Set(['student']))[0], script.npc.uibyeong.bridge);
  eq(villageTalk('reader', new Set())[0], script.npc.reader.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.ahnchangho.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.ahnchangho.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
  ok(!JSON.stringify(script).includes('장군'), '"~장군" 대신 이름만');
});

test('k6 D-35: 마을 어귀 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = k6.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('k6 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('안창호'), '둘째 퀘스트는 안창호');
  ok(script.goals[2].includes('을사늑약'), '셋째 퀘스트는 을사늑약 소식');
  const idx = k6.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signHague && !script.npc.signPress && !script.npc.signAhn, '안내판 npc 항목은 지웠다');
  ok(k6.layout.signs.length >= 2 && k6.layout.signs.every(s => s.plaque), '건물 간판만');
  const lines = allLines(script);
  for (const want of ['회의장 밖에서 연설', '황성신문, 대한매일신보', '하얼빈에서 처단']) ok(lines.some(l => l.text.includes(want) && l.src?.length), want);
});

test('k6 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    k6.buildScene(w);
    const [px, pz] = k6.portal.at, fx = px + Math.sin(k6.portal.ry) * 1.2, fz = pz + Math.cos(k6.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = k6.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('k6 D-35 C-05: 놀이는 두 갈래 길 → 고갯길 매복 → 만주·연해주 → 헤이그 특사, 가져다 놓기·역사책·찾기 없음, 다음 놀이는 말을 걸어야 시작', () => {
  eq(k6.parts.map(p => p.type), ['scene', 'ambush', 'scene', 'drive']);
  ok(!Object.values(script.parts).some(p => ['deliver', 'book', 'find', 'stops'].includes(p.type)), '가져다 놓기·역사책·찾기는 뺐다');
  ok(!k6.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(k6.parts[1].intro?.[0]?.meet?.who, 'uibyeong');
  eq(k6.parts[2].intro?.[0]?.meet?.who, 'uibyeong');
  eq(k6.parts[3].intro?.[0]?.meet?.who, 'student');
  ok(k6.parts[3].intro.slice(1).every(l => l.who === 'student'), '말 건 학생이 알려 준다');
  ok(script.parts.hills.intro.some(l => l.text.includes('한성')), '매복은 한성으로 가는 길(의병 길에 합침)');
});

test('k6 D-35: 가져다 놓기의 여섯 글은 출처 그대로 체험 자리의 대사가 되었다', () => {
  const st = [...script.parts.roads.edu.stations, ...script.parts.roads.army.stations, ...script.parts.exile.stations];
  const lines = allLines(st);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  has('학교를 세워 새로운 지식을');
  has('비판하는 기사');
  has('민족의 산업을 일으');
  has('해산된 군인들');
  has('서울 진공 작전');
  has('만주와 연해주');
  ok(script.parts.roads.edu.sum.text.includes('애국 계몽 운동') && script.parts.roads.edu.sum.src?.includes('S51'), '계몽 길 끝 정리');
  ok(script.parts.exile.sum.text.includes('의병 운동') && script.parts.exile.sum.src?.includes('S51'), '의병 길 끝 정리');
});

test('k6 D-35: 을사늑약 소식 장면 — 신문 앞에 사람이 모이고 가게가 문을 닫고, 끝나면 치운다', async () => {
  ok(script.news.lines.some(l => l.text.includes('을사늑약') && l.src?.includes('S51')), '출처 있는 해설');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    k6.buildScene(s.w);
    const n0 = s.w.level.children.length;
    await newsScene(s.ctx);
    const h = s.ctx.testHooks.news;
    ok(h, 'testHooks');
    ok(h.crowd >= 5, `모인 사람 ${h.crowd}`);
    ok(h.paper, '신문을 펼쳐 든다');
    ok(h.shut >= 1, `문을 닫은 가게 ${h.shut}`);
    eq(s.w.moodName, k6.mood, '분위기를 되돌렸다');
    eq(s.w.level.children.length, n0, '더한 것을 치웠다');
    ok(s.w.player.visible, '학생이 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('k6 D-35: 두 갈래 길 — 계몽 길 세 자리 뒤 의병 길 두 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(ROADS.origin[0] >= 300, '마을과 떨어진 무대');
  const P = script.parts.roads;
  eq(P.edu.stations.length, 3); eq(P.army.stations.length, 2);
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    k6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await twoRoads(s.ctx);
    const h = s.ctx.testHooks.roads;
    eq(h.used, [...P.edu.stations, ...P.army.stations].map(x => x.id), '계몽 길 → 의병 길 차례');
    ok(h.pressed >= 5, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.signpost, '갈림길 이정표');
    ok(h.classroom >= 6, `교실 학생 ${h.classroom}`);
    ok(h.printed >= 3, `찍어 낸 신문 ${h.printed}`);
    ok(h.goods >= 3, `민족 산업 물건 ${h.goods}`);
    ok(h.soldiers >= 4, `의병에 합친 해산 군인 ${h.soldiers}`);
    ok(h.army >= 8, `연합 부대 ${h.army}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('k6 D-35: 만주·연해주로 — 의병과 함께 강가 나룻배까지 걸어가 떠나고, 끝나면 무대를 치운다', async () => {
  ok(EXILE.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    k6.buildScene(s.w);
    const n0 = s.w.level.children.length;
    await exileWalk(s.ctx);
    const h = s.ctx.testHooks.exile;
    eq(h.used, script.parts.exile.stations.map(x => x.id));
    ok(h.followers >= 3, `함께 걷는 의병 ${h.followers}`);
    ok(h.sailed, '나룻배가 떠난다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
