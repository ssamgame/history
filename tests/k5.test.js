// 근대편 5장(D-34): 한성 큰길 마을 문으로 들어와 거리 사람들 이야기를 아무 차례로 듣고(모두 들어야 전차 운전수) →
// 해가 지며 전등·가로등이 켜지는 밤 장면 → 근대 문물 가져다 놓기 → 운전수에게 말을 걸면 전차 몰기 →
// 학생에게 말을 걸면 문물 체험 걷기(전신 보내기·전화 걸기·전깃불 켜기·학교 들어가기·양화점). 역사책은 뺐다.
// D-30 공통(퀘스트 차례·모두 들어야 메인 인물·도입 장면·빛나는 문·간판·다가가서 시작)
import { test, eq, ok } from './harness.js';
import k5, { villageTalk, nightScene, munmulWalk, NIGHT_MOOD, MUNMUL } from '../chapters/modern/k5/chapter.js';
import script from '../chapters/modern/k5/script.js';
import { MOODS } from '../core/world.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };

test('k5 D-34: 거리 사람은 아무 차례로, 모두 들어야 전차 운전수, 끝에 학생의 결심', () => {
  ok(k5.anyOrder, 'anyOrder');
  eq(villageTalk('woman', new Set(['gentleman']))[0], script.npc.woman.bridge);
  eq(villageTalk('gentleman', new Set())[0], script.npc.gentleman.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.driver.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.driver.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of ['gentleman', 'woman', 'student']) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
  ok(!JSON.stringify(script).includes('장군'), '"~장군" 대신 이름만');
});

test('k5 D-34: 마을 어귀 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = k5.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 15), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('k5 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[2].includes('밤'), '셋째 퀘스트는 밤 장면');
  const idx = k5.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v >= idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signTram && !script.npc.signChurch && !script.npc.signLife, '안내판 npc 항목은 지웠다');
  ok(k5.layout.signs.length >= 2 && k5.layout.signs.every(s => s.plaque), '건물 간판만');
  const lines = allLines(script);
  for (const want of ['특별석', '교회·성당·학교 등을 서양식으로', '양복, 구두 같은 서양식 옷']) ok(lines.some(l => l.text.includes(want) && l.src?.length), want);
});

test('k5 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    k5.buildScene(w);
    const [px, pz] = k5.portal.at, fx = px + Math.sin(k5.portal.ry) * 1.2, fz = pz + Math.cos(k5.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = k5.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('k5 D-34 C-05: 놀이는 가져다 놓기 → 전차 몰기 → 문물 체험 걷기, 역사책·찾기 없음, 다음 놀이는 말을 걸어야 시작', () => {
  eq(k5.parts.map(p => p.type), ['deliver', 'drive', 'scene']);
  ok(!Object.values(script.parts).some(p => ['book', 'find', 'stops'].includes(p.type)), '역사책·찾기는 뺐다');
  ok(!k5.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(k5.parts[1].intro?.[0]?.meet?.who, 'driver');
  eq(k5.parts[2].intro?.[0]?.meet?.who, 'student');
  ok(k5.parts[2].intro.slice(1).every(l => l.who === 'student'), '말 건 학생이 알려 준다');
  ok(script.parts.tram.route.some(r => r.alight && r.board), '정류장 손님 그대로');
});

test('k5 D-34: 역사책에 있던 문장은 출처 그대로 장면·대사로 옮겼다', () => {
  const lines = allLines(script);
  const has = (t, s = ['S51']) => ok(lines.some(l => l.text.includes(t) && s.every(x => l.src?.includes(x))), `${t} ${s}`);
  has('전신은 글자나 숫자를 전기 신호로 바꾸어 보내는 통신이에요.');
  has('일본과 중국까지 이어지는 통신망이 생겼어요', ['S51', 'S69']);
  has('전화기를 들여와서 소식을 빠르게 주고받을 수 있게 되었어요.');
  has('1899년부터 서대문에서 청량리까지 전차가');
  has('전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어요.');
  has('전깃불과 유리 창문이 있는 근대식 건물이 세워지고, 교회·성당·학교 등을 서양식으로 지었어요.');
  has('여러 학교가 세워져 근대식 교육을 받을 수 있었고, 신문이 나와 나라 안팎의 소식을 알 수 있었어요.');
  has('양복, 구두 같은 서양식 옷이 들어오고 외국 음식과 식료품도 들어왔어요. 왕실과 관리를 중심으로 퍼져 나갔어요.');
});

test('k5 D-34: 밤 장면 — 낮에서 밤으로, 가로등이 하나씩 켜지고(점광은 보통·높음만), 끝나면 낮으로 되돌린다', async () => {
  ok(MOODS[NIGHT_MOOD], '밤 분위기');
  ok(script.night.lines.some(l => l.text === '전등과 가로등이 생겨서 밤에도 다닐 수 있게 되었어요.' && l.src.includes('S51')), '출처 문장 그대로');
  for (const particles of [0.9, 0.3]) {
    const s = touchSetup(script.speakers);
    const bot = touchBot(s, { answers: new Set() });
    try {
      s.w.quality = { ...s.w.quality, particles };
      k5.buildScene(s.w);
      const n0 = s.w.level.children.length;
      await nightScene(s.ctx);
      const h = s.ctx.testHooks.night;
      ok(h, 'testHooks');
      eq(h.mood, NIGHT_MOOD, '밤이 되었다');
      ok(h.lit >= 3, `켜진 가로등 ${h.lit}`);
      ok(h.windows >= 4, `불 켜진 창 ${h.windows}`);
      ok(h.walkers >= 2, `밤길을 걷는 사람 ${h.walkers}`);
      eq(h.lights > 0, particles >= 0.9, `점광 ${h.lights} (화질 ${particles})`);
      eq(s.w.moodName, k5.mood, '낮으로 되돌렸다');
      eq(s.w.level.children.length, n0, '더한 것을 치웠다');
      ok(s.w.player.visible, '학생이 보인다');
    } finally { bot.stop(); s.done(); }
  }
}, { timeout: 90000 });

test('k5 D-34: 문물 체험 걷기 — 다섯 자리를 차례로 걸어가 대화 버튼으로 직접 써 보고, 끝나면 무대를 치운다', async () => {
  ok(MUNMUL.origin[0] >= 300, '마을과 떨어진 무대');
  const st = script.parts.munmul.stations;
  eq(st.length, 5);
  ok(st.every(x => x.label && x.act && x.lines.some(l => l.src?.length)), '자리마다 이름·할 일·출처 있는 해설');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    k5.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await munmulWalk(s.ctx);
    const h = s.ctx.testHooks.munmul;
    eq(h.used, st.map(x => x.id), '차례대로 다섯 자리');
    ok(h.pressed >= 5, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.signal, '전신 신호가 전깃줄을 따라 간다');
    ok(h.rang, '전화벨이 울린다');
    ok(h.litWindows >= 4, `전깃불 켜진 창 ${h.litWindows}`);
    ok(h.classroom >= 6, `교실 학생 ${h.classroom}`);
    ok(h.carried, '구두 상자를 받아 든다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
