// 근대편 4장(D-33): 한성 서대문 밖 마을 문으로 들어와 한성 사람들 이야기를 아무 차례로 듣고(모두 들어야 서재필) →
// 환구단 즉위식 장면 → 독립신문 배달 → 시민에게 말을 걸면 종로 만민 공동회(연설 듣기 → 시민들 말 가려내기).
// D-30 공통(퀘스트 차례·도입 장면·빛나는 문·간판·다가가서 시작)
import { test, eq, ok } from './harness.js';
import k4, { villageTalk, coronation, HWANGUDAN, JONGNO } from '../chapters/modern/k4/chapter.js';
import script from '../chapters/modern/k4/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };

test('k4 D-33: 한성 사람은 아무 차례로, 모두 들어야 서재필, 끝에 학생의 결심', () => {
  ok(k4.anyOrder, 'anyOrder');
  eq(villageTalk('scholar', new Set(['citizen']))[0], script.npc.scholar.bridge);
  eq(villageTalk('citizen', new Set())[0], script.npc.citizen.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.seojaepil.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.seojaepil.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  ok(!script.npc.gojong, '고종은 마을이 아니라 즉위식 장면에');
  ok(!JSON.stringify(script).includes('장군'), '"~장군" 대신 이름만');
});

test('k4 D-33: 마을 어귀 문, 문길은 비어 있고 문 옆 이름판', () => {
  const w = testWorld();
  try {
    const s = k4.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 7 && c.z < 15), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('k4 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[2].includes('즉위식'), '셋째 퀘스트는 즉위식');
  const idx = k4.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v >= idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signGate && !script.npc.signForum && !script.npc.signAltar, '안내판 npc 항목은 지웠다');
  ok(k4.layout.signs.length >= 2 && k4.layout.signs.every(s => s.plaque), '건물 간판만');
  const lines = allLines(script);
  for (const want of ['독립문을 세워 자주독립의 의지', '환구단은 황제가 하늘에 제사', '첫 만민 공동회는 1898년 종로']) ok(lines.some(l => l.text.includes(want) && l.src?.length), want);
});

test('k4 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    k4.buildScene(w);
    const [px, pz] = k4.portal.at, fx = px + Math.sin(k4.portal.ry) * 1.2, fz = pz + Math.cos(k4.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = k4.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('k4 D-33 C-05: 놀이는 신문 배달 → 만민 공동회 연설 → 시민들 말 가려내기, 역사책 없음, 연설은 시민에게 말을 걸어야 시작', () => {
  eq(k4.parts.map(p => p.type), ['drive', 'scene', 'judge']);
  ok(!Object.values(script.parts).some(p => p.type === 'book'), '역사책은 뺐다');
  ok(!k4.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(k4.parts[1].intro?.[0]?.meet?.who, 'citizen');
  ok(k4.parts[1].intro.slice(1).every(l => l.who === 'citizen'), '말 건 사람이 알려 준다');
  eq(k4.parts[2].arena, JONGNO, '연설과 같은 종로 무대');
});

test('k4 D-33: 만민 공동회 — 연설은 출처 있는 해설, 시민들 말은 맞는 것·틀린 것이 섞이고 맞으면 출처, 틀리면 까닭', () => {
  const sp = script.parts.speech;
  ok(sp.lines.some(l => l.who === 'speaker'), '연사의 연설');
  ok(sp.lines.filter(l => l.who === 'narr').every(l => l.src?.length), '해설은 출처');
  const j = script.parts.forum;
  eq(j.type, 'judge'); eq(j.options, ['맞아요', '아니에요']);
  ok(j.items.length >= 4, '시민 넷 이상');
  ok(j.items.some(it => it.correct) && j.items.some(it => !it.correct), '맞는 말과 틀린 말');
  for (const it of j.items) {
    ok(it.talk?.length && it.look, '말하는 시민');
    if (it.correct) ok(it.after?.some(l => l.src?.length), `맞는 말은 출처 있는 해설: ${it.talk[0].text}`);
    else ok(it.why, `틀린 말은 까닭: ${it.talk[0].text}`);
  }
  const said = j.items.map(it => it.talk[0].text).join(' ');
  for (const want of ['독립신문', '러시아', '대한 제국']) ok(said.includes(want) || allLines(j).some(l => l.text.includes(want)), want);
});

test('k4 D-33: 역사책에 있던 을미사변·아관 파천·독립신문·대한 제국은 장면·대사로(출처 그대로)', () => {
  const lines = allLines(script);
  const has = (t, s) => ok(lines.some(l => l.text.includes(t) && s.every(x => l.src?.includes(x))), `${t} ${s}`);
  has('을미사변', ['S51']);
  has('러시아 공사관', ['S54']);
  has('독립신문', ['S53']);
  has('대한 제국으로 바꾸었', ['S54']);
});

test('k4 D-33: 환구단 즉위식 — 사람들이 지켜보고, 고종이 제단에 올라 황제 옷(노란색)으로, 끝나면 무대를 치운다', async () => {
  const lines = script.coronation.lines;
  ok(lines.some(l => l.who === 'gojong' && l.text.includes('경운궁')), '경운궁으로 돌아왔다');
  ok(lines.some(l => l.who === 'narr' && l.text.includes('환구단에서 황제로 즉위') && l.src.includes('S54')), '즉위 해설');
  ok(HWANGUDAN.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    k4.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await coronation(s.ctx);
    const h = s.ctx.testHooks.coronation;
    ok(h, 'testHooks');
    ok(h.watchers >= 10, `지켜보는 사람 ${h.watchers}`);
    eq(h.robe, 0xc99a2e, '황제는 노란 옷');
    ok(h.top > 1, `제단 위에 올랐다 ${h.top}`);
    ok(h.bowed, '신하들이 절한다');
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
    ok(s.w.player.visible, '학생이 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });
