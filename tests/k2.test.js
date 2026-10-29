// 근대편 2장: D-29 거리 사람 아무 차례로·김옥균을 따라 밤길·방 붙이기 → D-30 도입 장면·빛나는 문·간판·여러 곳에 개혁안 붙이기·달아나는 김옥균
import { test, eq, ok } from './harness.js';
import k2, { villageTalk, WALK_A, WALK_B, NIGHT_A, PALACE_B, NIGHT_MOOD, runAway, docLine } from '../chapters/modern/k2/chapter.js';
import script from '../chapters/modern/k2/script.js';
import { MOODS } from '../core/world.js';
import { testWorld } from './bot.js';
import { makePerson, animateWalk } from '../core/people.js';
import { LOOKS } from '../content/characters.js';

const lines = () => [...Object.values(script.npc).flatMap(n => [...(n.first || []), ...(n.later || []), ...(n.wait || [])]),
  ...script.night.a.flatMap(s => [...s.talk, ...(s.after || [])]), ...script.night.b.flatMap(s => [...s.talk, ...(s.after || [])]),
  ...Object.values(script.parts).flatMap(p => [...(p.intro || []), ...p.cards.flatMap(c => c.talk || [])]), ...script.result].filter(l => l.text);
const pathLen = stops => { let n = 0, p = [0, 12.5]; for (const s of stops) for (const q of s.path) { n += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return n; };

test('k2 D-29: 거리 사람은 아무 차례로, 김옥균 앞에서 학생의 결심', () => {
  eq(villageTalk('clerk', new Set(['merchant']))[0], script.npc.clerk.bridge);
  eq(villageTalk('merchant', new Set())[0], script.npc.merchant.first[0]);
  ok(!script.npc.clerk.tooEarly && !script.npc.kimokgyun.tooEarly);
  ok(k2.anyOrder && script.npc.kimokgyun.wait.length);
  ok(script.npc.kimokgyun.first.some(l => l.who === 'me'));
});

test('k2 D-29: 큰길 어귀 문, 문길은 비어 있다', () => {
  const w = testWorld();
  try {
    const s = k2.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2);
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

// ── D-30 ──
test('k2 D-30 C-01: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 간판 대사는 사람 대사로 옮겼다', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  eq(script.goals.length, 5);
  ok(k2.parts.every((p, i) => p.goal === script.goals[i + 2]), '부분마다 차례대로 목표');
  ok(!script.npc.signPost && !script.npc.signCoup, '안내판 npc 항목은 지웠다');
  ok(k2.layout.signs.length >= 2 && k2.layout.signs.every(s => s.plaque), '길 위 안내판 없음, 건물 간판만');
  ok(k2.layout.signs.some(s => s.title === '우정총국'), '우정총국 건물 간판');
  const all = lines();
  ok(all.some(l => l.text.includes('지금도 서울 종로') && l.src), '우정총국 안내판 내용은 사람 대사로');
  ok(all.some(l => l.text.includes('법에 맞지 않는 방법') && l.src), '정변 뜻은 사람 대사로');
});

test('k2 D-30 C-02·C-03: 도입 장면은 문장마다 한 장면, 끝나면 치우고, 빛나는 문은 빈 땅에 선다', () => {
  const w = testWorld();
  try {
    k2.buildScene(w);
    ok(k2.portal && k2.portal.at, 'portal');
    const [px, pz] = k2.portal.at, fx = px + Math.sin(k2.portal.ry) * 1.2, fz = pz + Math.cos(k2.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = k2.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물이 더해졌다');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
  } finally { w.dispose(); }
});

test('k2 D-30 C-05: 둘째 놀이부터는 김옥균에게 가서 말을 걸어야 시작한다', () => {
  eq(k2.parts.map(p => p.type), ['scene', 'deliver', 'scene']);
  ok(!k2.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 대화 뒤 바로');
  for (const p of k2.parts.slice(1)) {
    eq(p.intro?.[0]?.meet?.who, 'kimokgyun');
    ok(p.intro.slice(1).every(l => l.who === 'kimokgyun'), '말 건 사람이 놀이를 알려 준다');
  }
});

test('k2 D-30 G-01: 정변 밤은 밤 하늘, 장소 이름판은 그곳에(우정총국 → 창덕궁)', () => {
  const m = MOODS[NIGHT_MOOD];
  ok(m, '밤 분위기');
  const lum = c => ((c >> 16 & 255) + (c >> 8 & 255) + (c & 255)) / 3;
  ok(lum(m.skyTop) < 60 && lum(m.skyHorizon) < 110, '하늘이 어둡다');
  ok(lum(MOODS.winterDusk.skyHorizon) > 150, '마을은 해 질 녘 그대로');
  eq(NIGHT_A.names.map(n => n.text), ['우정총국', '창덕궁']);
  const [post, palace] = NIGHT_A.names;
  ok(post.z > palace.z + 15, '우정총국에서 북쪽 궁까지 길게');
  eq(PALACE_B.names.map(n => n.text), ['창덕궁']);
  eq(k2.parts[0].mood, NIGHT_MOOD);
});

test('k2 D-30 G-02: 김옥균 따라 걷기는 길고, 멈춘 곳마다 그 일이 장면으로 나타난다', () => {
  ok(WALK_A.length >= 4 && WALK_B.length >= 2, '멈추는 곳');
  ok(pathLen(WALK_A) >= 70, `걷는 길 ${pathLen(WALK_A).toFixed(0)}`);
  ok(WALK_A.every(s => s.path.length >= 2), '멈춘 곳 사이는 여러 걸음');
  ok([...WALK_A, ...WALK_B].every(s => typeof s.show === 'function'), '멈춘 곳마다 장면');
  eq(script.night.a.length, WALK_A.length); eq(script.night.b.length, WALK_B.length);
  eq(script.night.a.map(s => s.label), ['우정총국 축하 잔치', '정변을 일으킴', '창덕궁으로', '새 정부와 개혁안']);
  ok(script.night.b[script.night.b.length - 1].after.some(l => l.text.includes('일본으로 몸을 피했')), '몸을 피한 뒤 해설');
  ok(script.night.b.some(s => s.talk.some(l => l.text.includes('3일 만에') && l.src)));
});

test('k2 D-30 G-03: 「발표하겠소」, 여러 곳에 개혁안을 붙이고 붙인 뒤 두루마리로 내용을 본다', async () => {
  ok(lines().some(l => l.text === '새 정부를 세우고 개혁안을 발표하겠소.' && l.src));
  ok(!lines().some(l => l.text.includes('발표하오.')));
  const reform = k2.parts[1], yes = reform.cards.filter(c => c.bin !== 'no');
  eq(yes.length, 3);
  eq(new Set(yes.map(c => c.bin)).size, 3, '진짜 개혁안마다 다른 곳');
  const places = reform.bins.filter(b => b.id !== 'no');
  for (const [i, a] of places.entries()) for (const b of places.slice(i + 1)) ok(Math.hypot(a.x - b.x, a.z - b.z) > 9, `${a.label}·${b.label}이 멀리 떨어져 있다`);
  ok(places.every(b => b.drop), '벽·게시판에 붙는다');
  for (const c of yes) { const d = c.talk[0].doc; ok(d && d.items[0].text.includes(c.text.slice(0, 4)) && d.src, `${c.text}: 붙인 뒤 두루마리`); }
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const p = docLine({ ui }, yes[0].talk[0]);
    ok(ui.querySelector('.screen.doc .doc-scroll'), '두루마리 모양');
    ui.querySelector('.doc-ok').click(); await p;
    ok(!ui.querySelector('.screen.doc'));
  } finally { ui.remove(); }
});

test('k2 D-30 G-04: 청 군대가 오면 김옥균이 몸을 숙이고 빠른 걸음으로 멀리 달아난다', async () => {
  const w = testWorld();
  try {
    const a = makePerson(LOOKS.kimokgyun), b = makePerson(LOOKS.kimokgyun);
    w.level.add(a); w.level.add(b);
    let lean = 0;
    const done = runAway(w, a, { x: 30, z: 0 }, 2);
    const off = w.onUpdate(() => { lean = Math.max(lean, a.rotation.x); });
    for (let i = 0; i < 50; i++) w.step(1 / 20, { x: 0, z: 0 });
    await done; off();
    const steps = a.userData.walk;
    ok(a.position.x > 29, '멀리 달아났다');
    ok(lean > 0.15, `몸을 앞으로 숙인다 ${lean.toFixed(2)}`);
    b.userData.walk = 0; for (let i = 0; i < 40; i++) animateWalk(b, true, 1 / 20);
    ok(steps > b.userData.walk * 1.6, `걷기보다 걸음이 빠르다 ${steps.toFixed(1)} / ${b.userData.walk.toFixed(1)}`);
    eq(a.rotation.x, 0, '끝나면 자세를 되돌린다');
  } finally { w.dispose(); }
});
