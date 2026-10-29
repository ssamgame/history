// 일제 강점기편 5장(D-44): 「경성」 골목 문으로 들어와 학생·역사학자·상인 이야기를 아무 차례로 듣고(모두 들어야 조선어 학회 학자) →
// 1929년 광주에서 학생들이 거리로 나서는 장면 → 경찰 피해 사전 원고 모으기 → 역사학자에게 말을 걸면 민족 문화 걷기. 가져다 놓기·안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i5, { villageTalk, gwangjuScene, cultureWalk, GWANGJU, CULTURE } from '../chapters/colonial/i5/chapter.js';
import script from '../chapters/colonial/i5/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['student', 'historian', 'merchant'];

test('i5 D-44: 골목 사람은 아무 차례로, 모두 들어야 조선어 학회 학자, 끝에 학생의 결심', () => {
  ok(i5.anyOrder, 'anyOrder');
  eq(villageTalk('historian', new Set(['student']))[0], script.npc.historian.bridge);
  eq(villageTalk('merchant', new Set())[0], script.npc.merchant.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.linguist.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.linguist.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('i5 D-44: 골목 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = i5.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i5 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('조선어 학회'), '둘째 퀘스트는 조선어 학회 학자');
  ok(script.goals[2].includes('광주'), '셋째 퀘스트는 광주 학생 항일 운동');
  const idx = i5.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signGoods && !script.npc.signJune, '안내판 npc 항목은 지웠다');
  ok(i5.layout.signs.length >= 2 && i5.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('i5 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i5.buildScene(w);
    const [px, pz] = i5.portal.at, fx = px + Math.sin(i5.portal.ry) * 1.2, fz = pz + Math.cos(i5.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i5.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i5 D-44 C-05: 놀이는 원고 모으기 → 민족 문화 걷기, 가져다 놓기 없음, 다음 놀이는 말을 걸어야 시작', () => {
  eq(i5.parts.map(p => p.type), ['drive', 'scene']);
  ok(!Object.values(script.parts).some(p => ['deliver', 'book', 'find', 'stops'].includes(p.type)), '가져다 놓기는 뺐다');
  ok(!i5.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i5.parts[1].intro?.[0]?.meet?.who, 'historian');
  ok(i5.parts[1].intro.slice(1).every(l => l.who === 'historian'), '말 건 역사학자가 알려 준다');
});

test('i5 D-44: 가져다 놓기 아홉 글과 안내판 글은 출처 그대로 사람 대사·걷기 자리가 되었다', () => {
  const lines = allLines(script);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  for (const t of ['우리나라에서 만든 물건을', '성금을 모아 대학을', '아는 것이 힘', '6·10 만세 운동', '광주 학생 항일 운동', '차별적인 교육', '신채호와 박은식', '스스로의 힘으로 발전', '이육사, 윤동주, 한용운', '한글 맞춤법 통일안', '「우리말 큰사전」']) has(t);
  eq(script.parts.culture.stations.map(s => s.id), ['goods', 'night', 'history', 'poem', 'dict']);
});

test('i5 D-44: 광주 학생 항일 운동 장면 — 학생들이 걸어 나와 주먹을 들고, 카메라는 앞에서, 끝나면 치운다', async () => {
  ok(GWANGJU.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await gwangjuScene(s.ctx);
    const h = s.ctx.testHooks.gwangju;
    ok(h.students >= 10, `학생 ${h.students}`);
    ok(h.walked > 5, `걸어 나온 거리 ${h.walked}`);
    ok(h.fists >= 3, `주먹 ${h.fists}번`);
    ok(h.facing >= 0.8, `D-45: 학생들의 얼굴이 보인다 ${h.facing}`);
    ok(h.camFront, '카메라가 학생들 앞쪽에서 얼굴을 본다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i5 D-44: 민족 문화 걷기 — 다섯 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(CULTURE.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await cultureWalk(s.ctx);
    const h = s.ctx.testHooks.culture;
    eq(h.used, ['goods', 'night', 'history', 'poem', 'dict']);
    ok(h.pressed >= 5, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.cloth && h.coins >= 3, `우리 옷감, 성금 ${h.coins}`);
    ok(h.board && h.learners >= 6, `칠판 '아는 것이 힘', 배우는 사람 ${h.learners}`);
    ok(h.book, '역사책을 받아 든다');
    ok(h.poems >= 3, `시 원고 ${h.poems}`);
    ok(h.stack >= 5, `사전 원고 ${h.stack}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
