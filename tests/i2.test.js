// 일제 강점기편 2장(D-39): 탑골 공원 문으로 들어와 학생·유관순·상인 이야기를 아무 차례로 듣고(모두 들어야 종교 지도자) →
// 팔각정에서 학생이 독립 선언서를 읽고 모두 태극기를 꺼내 만세를 외치는 장면 →
// 태극기 나눠 주기 → 학생에게 말을 걸면 만세 행진 → 유관순에게 말을 걸면 만세의 흐름 걷기(독립의 희망·전국으로·아우내 장터·제암리). 역사책은 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i2, { villageTalk, declarationScene, flowWalk, FLOW } from '../chapters/colonial/i2/chapter.js';
import script from '../chapters/colonial/i2/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['student', 'yugwansun', 'merchant'];

test('i2 D-39: 공원 사람은 아무 차례로, 모두 들어야 종교 지도자, 끝에 학생의 결심', () => {
  ok(i2.anyOrder, 'anyOrder');
  eq(villageTalk('yugwansun', new Set(['student']))[0], script.npc.yugwansun.bridge);
  eq(villageTalk('merchant', new Set())[0], script.npc.merchant.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.leader.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.leader.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
  ok(!JSON.stringify(script).includes('장군'), '"~장군" 대신 이름만');
});

test('i2 D-39: 공원 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = i2.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i2 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('종교 지도자'), '둘째 퀘스트는 종교 지도자');
  ok(script.goals[2].includes('독립 선언서'), '셋째 퀘스트는 독립 선언서 낭독');
  const idx = i2.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signDeclare && !script.npc.signYu && !script.npc.signJeam, '안내판 npc 항목은 지웠다');
  ok(i2.layout.signs.length >= 2 && i2.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('i2 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i2.buildScene(w);
    const [px, pz] = i2.portal.at, fx = px + Math.sin(i2.portal.ry) * 1.2, fz = pz + Math.cos(i2.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i2.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i2 D-39 C-05: 놀이는 태극기 나눠 주기 → 만세 행진 → 만세의 흐름 걷기, 역사책·찾기 없음, 다음 놀이는 말을 걸어야 시작', () => {
  eq(i2.parts.map(p => p.type), ['drive', 'drive', 'scene']);
  ok(!Object.values(script.parts).some(p => ['book', 'find', 'stops', 'deliver'].includes(p.type)), '역사책·찾기는 뺐다');
  ok(!i2.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i2.parts[1].intro?.[0]?.meet?.who, 'student');
  eq(i2.parts[2].intro?.[0]?.meet?.who, 'yugwansun');
  ok(i2.parts[2].intro.slice(1).every(l => l.who === 'yugwansun'), '말 건 유관순이 알려 준다');
});

test('i2 D-39: 역사책 네 쪽과 안내판 글은 출처 그대로 장면·걷기 자리의 대사가 되었다', () => {
  const lines = allLines(script);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  for (const t of ['제1차 세계 대전이 끝났어요', '독립의 희망', '탑골 공원에서 독립 선언서를 읽고', '전국으로 퍼졌고', '전 민족적인 운동', '천안에서 만세 시위를 이끌다가', '제암리']) has(t);
  eq(script.parts.flow.stations.map(s => s.id), ['hope', 'spread', 'aunae', 'jeamri']);
});

test('i2 D-39: 독립 선언서 낭독 장면 — 팔각정에서 읽고, 모두 태극기를 들어 만세, 끝나면 치운다', async () => {
  ok(script.declare.lines.some(l => l.text.includes('독립 선언서') && l.src?.includes('S51')), '출처 있는 해설');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i2.buildScene(s.w);
    const n0 = s.w.level.children.length;
    await declarationScene(s.ctx);
    const h = s.ctx.testHooks.declare;
    ok(h.reader, '선언서를 읽는 학생');
    ok(h.flags >= 8, `꺼낸 태극기 ${h.flags}`);
    ok(h.cheers >= 3, `만세 ${h.cheers}번`);
    ok(h.held, 'D-43: 태극기는 손에 쥐고 가슴 앞에');
    ok(h.raisedY > 2, `D-43: 만세 때 깃발이 머리 위로 ${h.raisedY.toFixed(2)}`);
    ok(h.camZ < -2, `D-43: 카메라가 사람들 앞쪽(팔각정 쪽)에서 얼굴을 본다 z ${h.camZ.toFixed(1)}`);
    eq(s.w.level.children.length, n0, '더한 것을 치웠다');
    ok(s.w.player.visible, '학생이 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i2 D-39: 만세의 흐름 걷기 — 네 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(FLOW.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i2.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await flowWalk(s.ctx);
    const h = s.ctx.testHooks.flow;
    eq(h.used, ['hope', 'spread', 'aunae', 'jeamri']);
    ok(h.pressed >= 4, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.newspaper, '신문을 펼쳐 본다');
    ok(h.classes >= 4, `함께한 여러 계층 ${h.classes}`);
    ok(h.arrested, '유관순이 끌려간다');
    ok(h.smoke >= 2, `제암리 연기 ${h.smoke}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// D-43: 태극기를 든 사람은 모두 손에 쥐고 가슴 앞에 든다(옛 모습: 머리 위에 떠 있거나 거꾸로 매달린 깃발)
import { BUILD } from '../chapters/kit/town.js';
import * as THREE from 'three';
test('i2 D-43: 무리 속 태극기는 오른손에 쥐어 가슴 앞, 깃발은 손 위로 선다', () => {
  const g = new THREE.Group();
  BUILD.crowd(g, { n: 10, flags: 1, looks: ['student'] });
  const ps = g.children.filter(c => c.userData?.arms);
  ok(ps.length === 10 && ps.every(p => p.userData.carry?.style === 'flag'), '모두 손에 쥔다');
  for (const p of ps) {
    const f = p.userData.carry.obj;
    ok(f.position.z > 0.4 && f.position.y > 1 && f.position.y < 1.5, `가슴 앞 ${f.position.y.toFixed(2)}, ${f.position.z.toFixed(2)}`);
    ok(p.userData.arms[1].rotation.x < -0.5, '오른팔을 앞으로 굽힌다');
  }
});
