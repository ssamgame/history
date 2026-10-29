// 일제 강점기편 3장(D-41): 「상하이」 거리 문으로 들어와 연락원·독립신문 기자·안창호 이야기를 아무 차례로 듣고(모두 들어야 김구) →
// 청사 앞에 동포들이 모이고 깃대에 태극기가 오르며 대한민국 임시 정부가 세워지는 장면 →
// 헌법 읽기 → 연락원에게 말을 걸면 비밀 편지 전하기 → 김구에게 말을 걸면 임시 정부 청사 걷기(비밀 연락·독립신문·독립 공채·외교·독립군). 가져다 놓기는 뺐다. D-30 공통
import { test, eq, ok } from './harness.js';
import i3, { villageTalk, launchScene, officeWalk, OFFICE } from '../chapters/colonial/i3/chapter.js';
import script from '../chapters/colonial/i3/script.js';
import { testWorld, touchSetup, touchBot } from './bot.js';

const allLines = o => { const out = []; const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.text === 'string' && v.who) { out.push(v); return; } Object.values(v).forEach(walk); }; walk(o); return out; };
const PEOPLE = ['messenger', 'reporter', 'ahnchangho'];

test('i3 D-41: 거리 사람은 아무 차례로, 모두 들어야 김구, 끝에 학생의 결심', () => {
  ok(i3.anyOrder, 'anyOrder');
  eq(villageTalk('reporter', new Set(['messenger']))[0], script.npc.reporter.bridge);
  eq(villageTalk('ahnchangho', new Set())[0], script.npc.ahnchangho.first[0]);
  ok(!Object.values(script.npc).some(n => n.tooEarly), '차례 전 대사 없음');
  ok(script.npc.kimgu.wait?.length, '아직 다 듣지 않았을 때 대사');
  eq(script.npc.kimgu.first.at(-1).who, 'me');
  ok(script.speakers.me && script.more?.text, '나, 남았을 때 안내');
  for (const id of PEOPLE) ok(script.npc[id].bridge && script.npc[id].later?.length, `${id}: 이어 주는 말·다시 말`);
});

test('i3 D-41: 거리 문, 문길은 비어 있고 문 옆 이름판, 청사 앞 깃대', () => {
  const w = testWorld();
  try {
    const s = i3.buildScene(w);
    ok(s.gate && s.gate.leaves.length === 2, '문짝 둘');
    ok(s.board, '이름판');
    ok(s.flag, '깃대의 태극기');
    for (const c of w.colliders) ok(!(Math.abs(c.x) < 2 + c.r && c.z > 8 && c.z < 16), `문길이 막힘 (${c.x}, ${c.z})`);
  } finally { w.dispose(); }
});

test('i3 D-30 C-01·C-03: 퀘스트는 진행 차례대로(퀴즈 목표 없음), 길 위 안내판 대신 건물 간판, 안내판 글은 대사로', () => {
  ok(!script.goals.some(g => g.includes('배운 내용')), '퀴즈 목표 없음');
  ok(script.goals[1].includes('김구'), '둘째 퀘스트는 김구');
  ok(script.goals[2].includes('세워지는'), '셋째 퀘스트는 임시 정부 출범');
  const idx = i3.parts.map(p => script.goals.indexOf(p.goal));
  ok(idx.every(i => i >= 3), `부분마다 목표 ${idx}`);
  ok(idx.every((v, i) => !i || v > idx[i - 1]), '목표가 차례대로');
  eq(idx.at(-1), script.goals.length - 1, '마지막 부분이 마지막 목표');
  ok(!script.npc.signOffice && !script.npc.signBond, '안내판 npc 항목은 지웠다');
  ok(i3.layout.signs.length >= 2 && i3.layout.signs.every(s => s.plaque), '건물 간판만');
});

test('i3 D-30 C-02·C-03: 도입 장면은 문장마다, 끝나면 치우고, 빛나는 문은 빈 땅', () => {
  const w = testWorld();
  try {
    i3.buildScene(w);
    const [px, pz] = i3.portal.at, fx = px + Math.sin(i3.portal.ry) * 1.2, fz = pz + Math.cos(i3.portal.ry) * 1.2;
    for (const c of w.colliders) ok(Math.hypot(c.x - px, c.z - pz) > c.r + 2 && Math.hypot(c.x - fx, c.z - fz) > c.r + 0.8, `문 자리가 막힘 (${c.x}, ${c.z})`);
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `문이 ${n.id}와 가깝다`);
    const n0 = w.level.children.length;
    const film = i3.introScene({ world: w });
    ok(film.shots.length >= script.intro.length, '문장마다 장면');
    for (const sh of film.shots) { sh.act?.({ world: w }); for (let i = 0; i < 20; i++) w.step(1 / 20, { x: 0, z: 0 }); }
    ok(w.level.children.length > n0, '도입 장면에 인물');
    film.done();
    eq(w.level.children.length, n0, '끝나면 치운다');
    for (const n of w.npcs.values()) ok(n.mesh.visible, `${n.id} 다시 보인다`);
  } finally { w.dispose(); }
});

test('i3 D-41 C-05: 놀이는 헌법 읽기 → 비밀 편지 전하기 → 청사 걷기, 가져다 놓기 없음, 다음 놀이는 말을 걸어야 시작', () => {
  eq(i3.parts.map(p => p.type), ['doc', 'sneak', 'scene']);
  ok(!Object.values(script.parts).some(p => ['deliver', 'book', 'find', 'stops'].includes(p.type)), '가져다 놓기는 뺐다');
  ok(!i3.parts[0].intro?.[0]?.meet, '첫 놀이는 탐험 끝 뒤 바로');
  eq(i3.parts[1].intro?.[0]?.meet?.who, 'messenger');
  eq(i3.parts[2].intro?.[0]?.meet?.who, 'kimgu');
  ok(i3.parts[2].intro.slice(1).every(l => l.who === 'kimgu'), '말 건 김구가 알려 준다');
});

test('i3 D-41: 가져다 놓기 여섯 글과 안내판 글은 출처 그대로 장면·걷기 자리의 대사가 되었다', () => {
  const lines = allLines(script);
  const has = t => ok(lines.some(l => l.text.includes(t) && l.src?.includes('S51')), t);
  for (const t of ['1919년 9월 중국 상하이', '여러 임시 정부를 통합한', '비밀 조직을 두어', '독립신문을 펴내', '독립 공채를 발행', '돈을 갚겠다고 약속하는', '외교 기관을 두어', '독립군 단체를 아래에 두고', '만주 지역에서', '민주 공화제', '민주주의 정치 체계']) has(t);
  eq(script.parts.office.stations.map(s => s.id), ['contact', 'news', 'bond', 'diplo', 'army']);
});

test('i3 D-41: 임시 정부 출범 장면 — 청사 앞에 동포가 모이고, 깃대에 태극기가 오르고, 만세, 끝나면 치운다', async () => {
  ok(script.launch.lines.some(l => l.text.includes('대한민국 임시 정부') && l.src?.includes('S51')), '출처 있는 해설');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    const sc = i3.buildScene(s.w);
    const n0 = s.w.level.children.length;
    await launchScene(s.ctx);
    const h = s.ctx.testHooks.launch;
    ok(h.crowd >= 8, `모인 동포 ${h.crowd}`);
    ok(h.flagTo - h.flagFrom > 2, `태극기가 오른다 ${h.flagFrom} → ${h.flagTo}`);
    ok(h.cheers >= 3, `만세 ${h.cheers}번`);
    eq(s.w.level.children.length, n0, '더한 것을 치웠다');
    ok(sc.flag.position.y > 3, '끝나도 태극기는 깃대 위에');
    ok(s.w.player.visible, '학생이 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('i3 D-41: 임시 정부 청사 걷기 — 다섯 자리를 대화 버튼으로 겪고, 끝나면 무대를 치운다', async () => {
  ok(OFFICE.origin[0] >= 300, '마을과 떨어진 무대');
  const s = touchSetup(script.speakers);
  const bot = touchBot(s, { answers: new Set() });
  try {
    i3.buildScene(s.w);
    const n0 = s.w.level.children.length, b0 = s.w.bounds;
    await officeWalk(s.ctx);
    const h = s.ctx.testHooks.office;
    eq(h.used, ['contact', 'news', 'bond', 'diplo', 'army']);
    ok(h.pressed >= 5, `대화 버튼으로 시작 ${h.pressed}`);
    ok(h.letterHidden, '편지를 옷 속에 숨긴다');
    ok(h.printed >= 3, `찍은 신문 ${h.printed}`);
    ok(h.coins >= 3 && h.bond, `모인 돈 ${h.coins}, 공채를 받아 든다`);
    ok(h.envoyLeft, '외교관이 떠난다');
    ok(h.marched >= 4, `만주로 떠나는 독립군 ${h.marched}`);
    eq(s.w.level.children.length, n0, '무대를 치웠다');
    eq(s.w.bounds, b0, '걷는 곳도 마을로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
