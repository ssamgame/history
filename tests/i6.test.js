// 일제 강점기편 6장(D-46): 「한국광복군 훈련장」 문으로 들어와 광복군 대원·지휘관·임시 정부 요원 이야기를 아무 차례로 듣고(모두 들어야 김구) →
// 대원들이 태극기 여백에 이름과 각오를 적는 장면 → 엎드려 움직이는 과녁 쏘기 → 김구에게 말을 걸면 한인 애국단에서 한국광복군까지 걷기.
// 통나무 달리기·가져다 놓기·안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i6, { villageTalk, flagScene, roadWalk, FLAGROOM, ROAD } from '../chapters/colonial/i6/chapter.js';
import script from '../chapters/colonial/i6/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['soldier', 'officer', 'staff'];

test('i6 D-46: 훈련장 사람은 아무 차례로, 모두 들어야 김구, 끝에 학생의 결심', () => {
  ok(i6.anyOrder, 'anyOrder');
  eq(villageTalk('officer', new Set(['soldier']))[0], script.npc.officer.bridge);
  eq(villageTalk('staff', new Set())[0], script.npc.staff.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.kimgu.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.kimgu.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('i6 D-46: 훈련장 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = i6.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i6 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 막사 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('김구'), '둘째 퀘스트는 김구');
  ok(script.goals[2].includes('태극기'), '셋째 퀘스트는 태극기 장면');
  const idx = i6.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signFlag && !script.npc.signPacific, '안내판 npc 항목은 지웠다');
  ok(i6.layout.signs.length >= 2 && i6.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('i6 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i6.buildScene(w);
    const [px, pz] = i6.portal.at, fx = px + Math.sin(i6.portal.ry) * 1.2, fz = pz + Math.cos(i6.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i6.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i6 D-46 C-05: 놀이는 엎드려 과녁 쏘기 → 걷기, 다음 놀이는 김구에게 말을 걸어야 시작', () => {
  eq(i6.parts.map(p => p.type), ['ambush', 'scene']);
  ok(!i6.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i6.parts[1].intro?.[0]?.meet?.who, 'kimgu');
  ok(i6.parts[1].intro.slice(1).every(l => l.who === 'kimgu'), '말 건 김구가 알려 준다');
  const amb = i6.parts[0];
  eq(amb.unit, 'target', '움직이는 과녁');
  ok(amb.shooters?.length >= 4 && amb.shooters.every(s => s.look === 'gwangbokgun' && s.band === false), '군모 쓴 광복군이 엎드려 있다');
  ok(!amb.flag, '과녁에는 깃발이 없다');
  ok(!script.parts.run && !script.parts.sort, '통나무 달리기·가져다 놓기는 뺐다');
});

test('i6 D-46: 안내판·가져다 놓기 글은 출처 그대로 사람 대사·장면이 되었다', () => {
  const lines = allLines(script);
  const has = (t, s = 'S51') => ok(lines.some(l => l.text.includes(t) && l.src?.includes(s)), t);
  for (const t of ['하와이를 기습', '충칭에서 만든 임시 정부의 군대', '옮겨 다녔', '태극기의 여백에', '이봉창', '훙커우 공원', '미군과 함께 국내로', '갑자기 항복']) has(t);
  eq(script.parts.road.stations.map(s => s.id), ['aegukdan', 'tokyo', 'hongkou', 'chongqing']);
});

test('i6 D-46: 태극기 장면 — 대원들이 차례로 이름을 적고, 들어 펼쳐 만세(얼굴이 보이게), 끝나면 치운다', async () => {
  ok(FLAGROOM.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await flagScene(s.ctx);
    const h = s.ctx.testHooks.flag;
    ok(h.signers >= 6, `둘러선 대원 ${h.signers}`);
    ok(h.written >= h.signers + 1, `적은 이름(학생 포함) ${h.written}`);
    ok(h.lifted, '태극기를 들어 펼친다');
    ok(h.cheers >= 3, `만세 ${h.cheers}`);
    ok(h.facing >= 0.8, `D-45: 대원들의 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i6 D-46: 엎드려 과녁 쏘기 — 맞은 과녁이 넘어가고, 세 차례를 마친다', async () => {
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i6.buildScene(s.w);
    const { PLAY } = await import('../chapters/kit/play.js');
    const r = await PLAY.ambush(s.ctx, i6.parts[0], false);
    ok(r, `끝냄 ${r}`);
    const h = s.ctx.testHooks.ambush;
    ok(h.prone >= 4 && h.aimPose, '엎드려 겨눈다');
    ok(h.shots >= 3, `쏨 ${h.shots}`);
    ok(h.targets >= 3, `넘어간 과녁 ${h.targets}`);
    eq(h.fallen, 0, '과녁은 사람이 아니다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('i6 D-46: 한인 애국단에서 한국광복군까지 — 네 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(ROAD.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i6.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await roadWalk(s.ctx);
    const h = s.ctx.testHooks.road;
    eq(h.used, ['aegukdan', 'tokyo', 'hongkou', 'chongqing']);
    ok(h.pressed >= 4, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.carriage, '도쿄: 마차가 지나간다');
    ok(h.stage, '훙커우: 일본군 행사장 단상');
    ok(h.allies >= 2, `충칭: 광복군과 미군 ${h.allies}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
