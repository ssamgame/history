// 일제 강점기편 4장(D-42): 「독립군 진영」 문으로 들어와 독립군 대원·홍범도·남자현 이야기를 아무 차례로 듣고(모두 들어야 김좌진) →
// 봉오동 골짜기 양쪽 숲에 숨은 홍범도 부대가 일본군을 무찌르는 장면 →
// 흩어진 부대 모으기 → 김좌진에게 말을 걸면 청산리 산비탈 풀숲 매복 → 홍범도에게 말을 걸면 승리한 진영 걷기. 이정표 걷기·안내판은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i4, { villageTalk, bongoScene, victoryWalk, BONGO, CAMP } from '../chapters/colonial/i4/chapter.js';
import script from '../chapters/colonial/i4/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['soldier', 'hongbeomdo', 'namjahyeon'];

test('i4 D-42: 진영 사람은 아무 차례로, 모두 들어야 김좌진, 끝에 학생의 결심', () => {
  ok(i4.anyOrder, 'anyOrder');
  eq(villageTalk('hongbeomdo', new Set(['soldier']))[0], script.npc.hongbeomdo.bridge);
  eq(villageTalk('namjahyeon', new Set())[0], script.npc.namjahyeon.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.kimjwajin.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.kimjwajin.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('i4 D-42: 진영 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = i4.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i4 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 막사 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('김좌진'), '둘째 퀘스트는 김좌진');
  ok(script.goals[2].includes('봉오동'), '셋째 퀘스트는 봉오동 전투');
  const idx = i4.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signHeroes && !script.npc.signUiyeol, '안내판 npc 항목은 지웠다');
  ok(i4.layout.signs.length >= 2 && i4.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('i4 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i4.buildScene(w);
    const [px, pz] = i4.portal.at, fx = px + Math.sin(i4.portal.ry) * 1.2, fz = pz + Math.cos(i4.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i4.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i4 D-42 C-05: 놀이는 부대 모으기 → 엎드려 매복 → 승리한 진영 걷기, 다음 놀이는 말을 걸어야 시작', () => {
  eq(i4.parts.map(p => p.type), ['drive', 'ambush', 'scene']);
  ok(!i4.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i4.parts[1].intro?.[0]?.meet?.who, 'kimjwajin');
  eq(i4.parts[2].intro?.[0]?.meet?.who, 'hongbeomdo');
  ok(i4.parts[2].intro.slice(1).every(l => l.who === 'hongbeomdo'), '말 건 홍범도가 알려 준다');
  const amb = i4.parts[1];
  ok(amb.shooters?.length >= 6 && amb.shooters.every(s => s.look === 'independenceArmy' && s.band === false), '군모 쓴 독립군이 엎드려 있다');
  ok(amb.flag, '일본군 깃발');
  ok(!script.parts.leaders, '이정표 걷기는 뺐다');
});

test('i4 D-42: 안내판·이정표 걷기 글은 출처 그대로 사람 대사·장면이 되었다', () => {
  const lines = allLines(script);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  for (const t of ['3·1 운동 뒤 만주로', '최초의 여성 비행사', '의열단', '봉오동 일대에서 일본군을 크게 무찔렀어요', '더 많은 군대를 이끌고', '청산리의 지형을 이용', '봉오동에 이어 청산리에서도', '큰 용기']) has(t);
  eq(script.parts.victory.stations.map(s => s.id), ['hong', 'kim', 'camp']);
});

test('i4 D-42: 봉오동 전투 장면 — 양쪽 숲의 독립군이 쏘고, 일본군이 물러나고, 끝나면 치운다', async () => {
  ok(BONGO.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await bongoScene(s.ctx);
    const h = s.ctx.testHooks.bongo;
    ok(h.prone >= 6, `엎드린 독립군 ${h.prone}`);
    ok(h.enemies >= 6, `일본군 ${h.enemies}`);
    ok(h.volleys >= 3, `쏜 차례 ${h.volleys}`);
    ok(h.fallen >= 6, `D-45: 맞은 일본군이 쓰러진다 ${h.fallen}`);
    ok(h.retreated, '남은 일본군이 물러난다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i4 D-42: 승리한 진영 걷기 — 세 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(CAMP.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await victoryWalk(s.ctx);
    const h = s.ctx.testHooks.victory;
    eq(h.used, ['hong', 'kim', 'camp']);
    ok(h.pressed >= 3, `대화 버튼으로 시작 ${h.pressed}`);
    eq(h.met, ['hongbeomdo', 'kimjwajin']);
    ok(h.fire && h.cheers >= 3, `모닥불, 만세 ${h.cheers}`);
    ok(h.facing >= 0.8, `D-45: 만세 부르는 대원들의 얼굴이 보인다 ${h.facing}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
