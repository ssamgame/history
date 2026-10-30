// 2026-10-24 선생님 의견 여섯 가지: 걷는 다리, 틀리면 해설 뒤 다시 고르기, 퀴즈 배경, 역할에 맞는 생김새·키, 가져다 놓으면 처음 자리로, 일어난 차례대로.
import { test, eq, ok } from './harness.js';
import { createDialogue } from '../core/dialogue.js';
import { makePerson } from '../core/people.js';
import { PLAY } from '../chapters/kit/play.js';
import { chooseCards, orderCards, sortCards, placeOnBoard } from '../core/minigame.js';
import { quizSubject, showQuizView } from '../core/quizview.js';
import { ROLES, roleLook } from '../content/roles.js';
import { LOOKS } from '../content/characters.js';
import { ALL_CHAPTERS, JOSEON } from '../chapters/index.js';
import { makeSign } from '../core/signs.js';
import { testWorld, touchSetup, sleep } from './bot.js';

const speakers = { guide: { name: '안내', mark: '◎', color: '#2f6b5e' }, a: { name: '흥선 대원군', mark: '大', color: '#555', look: 'daewongun' } };
const arena = { origin: [300, 0], ground: 'earth', bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } };
const until = async (fn, ms = 3000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) throw new Error('until timeout'); await sleep(5); } };
const step = (w, n = 1) => { for (let i = 0; i < n; i++) w.step(1 / 20, { x: 0, z: 0 }); };
// 대화창이 열려 있으면 끝까지 넘긴다
const drain = async s => { for (let i = 0; i < 40 && s.dialogue.isOpen(); i++) { s.dialogue.advance(); s.dialogue.advance(); await sleep(5); } };

// 1. 걷기
test('feedback: 움직이는 인물(따라오는 사람·감시원)도 다리를 흔들며 걷는다', () => {
  const w = testWorld();
  try {
    const p = makePerson(LOOKS.citizen); w.level.add(p);
    const legs = p.userData.legs;
    step(w);
    let mx = 0, crossed = false; // 한 순간이 아니라 걷는 동안 가장 크게 벌어진 각(걸음 박자는 사람마다 다르다)
    for (let i = 0; i < 6; i++) { p.position.x += 0.3; step(w); mx = Math.max(mx, Math.abs(legs[0].rotation.x)); if (Math.abs(legs[0].rotation.x) > 0.05 && Math.sign(legs[0].rotation.x) !== Math.sign(legs[1].rotation.x)) crossed = true; }
    ok(mx > 0.15, `걷는 동안 다리가 움직인다 (${mx.toFixed(2)})`);
    ok(crossed, '두 다리는 엇갈린다');
    step(w, 30);
    ok(Math.abs(legs[0].rotation.x) < 0.05, '멈추면 다리를 모은다');
    const rider = makePerson(LOOKS.citizen); rider.userData.noWalk = true; w.level.add(rider);
    step(w); for (let i = 0; i < 6; i++) { rider.position.x += 0.3; step(w); }
    ok(Math.abs(rider.userData.legs[0].rotation.x) < 0.01, '배에 탄 사람은 걷지 않는다');
  } finally { w.dispose(); }
});

test('feedback: 학생도 걸을 때 다리를 크게 흔든다', () => {
  const w = testWorld();
  try {
    let mx = 0; for (let i = 0; i < 8; i++) { w.step(1 / 20, { x: 1, z: 0 }); mx = Math.max(mx, Math.abs(w.player.userData.legs[0].rotation.x)); }
    ok(mx > 0.2, `가장 크게 벌어진 다리 각 ${mx.toFixed(2)}`);
  } finally { w.dispose(); }
});

// 2. 틀리면 해설 뒤 다시 고르기
test('feedback: 퀴즈를 틀리면 해설을 듣고 같은 문제에서 맞는 답을 다시 고른다', async () => {
  const root = document.createElement('div'); document.body.appendChild(root);
  const d = createDialogue(root, speakers, { typeMs: 0 });
  try {
    const q = { question: '조약은?', options: ['을사늑약', '강화도 조약', '정전 협정'], answer: 1, explain: '강화도 조약은 1876년에 맺었어요.' };
    const p = d.quiz(q);
    const buttons = () => [...root.querySelectorAll('.dlg-choices button')];
    await until(() => buttons().length === 3 && !root.querySelector('.dlg-choices').hidden);
    await sleep(300); d.pick(0);
    await until(() => root.querySelector('.dlg-text').textContent.includes('해설') || root.querySelector('.dlg-text').textContent.includes('1876'));
    ok(root.querySelector('.dlg-text').textContent.includes('강화도 조약은 1876년'), '틀리면 해설을 보여 준다');
    d.advance();
    await until(() => !root.querySelector('.dlg-choices').hidden);
    ok(root.querySelector('.dlg-text').textContent.includes('다시 골라'), '같은 문제를 다시 낸다');
    ok(buttons()[0].disabled, '틀린 답은 막아 둔다');
    d.pick(0); // 막힌 답은 골라지지 않는다
    ok(!root.querySelector('.dlg-choices').hidden);
    d.pick(1);
    await until(() => root.querySelector('.dlg-text').textContent.includes('맞았어요'));
    d.advance();
    const r = await p;
    eq(r.correct, false, '처음에 틀렸으면 점수에는 틀린 것으로');
    eq(r.tries, 2);
  } finally { d.dispose(); root.remove(); }
});

for (const kind of ['stops', 'deliver', 'find']) {
  test(`feedback: ${kind} — 틀린 곳을 고르면 처음부터가 아니라 해설을 듣고 이어서 한다`, async () => {
    const s = touchSetup(speakers);
    try {
      const said = []; const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
      const part = {
        stops: { arena, from: [0, 15], fail: '앞의 일을 떠올려요.', spots: [{ x: -8, z: 0, label: '가' }, { x: 8, z: 0, label: '나' }] },
        deliver: { arena, from: [0, 10], fail: '누구의 말인지 생각해요.', bins: [{ id: 'a', label: '척화', x: -9, z: -6 }, { id: 'b', label: '주화', x: 9, z: -6 }], cards: [{ text: '싸우자', bin: 'a' }, { text: '화의하자', bin: 'b' }] },
        find: { arena, from: [0, 12], fail: '조약의 내용을 떠올려요.', items: [{ text: '맞음', correct: true, x: -8, z: 2 }, { text: '틀림', correct: false, x: 0, z: -4 }] },
      }[kind];
      const p = PLAY[kind](s.ctx, part, false);
      const at = (x, z) => { s.w.player.position.set(300 + x, 0, z); step(s.w); };
      // 나누기는 원 안에 잠깐 서 있어야 놓인다
      const pick = async (x, z) => { at(x, z); if (kind === 'deliver') step(s.w, 20); else s.hud.talkBtn.click(); await sleep(10); await drain(s); step(s.w); };
      // 틀린 곳
      if (kind === 'stops') await pick(8, 0); else if (kind === 'deliver') await pick(9, -6); else await pick(0, -4);
      ok(said.some(t => t.includes(part.fail)), `${kind}: 해설(${part.fail})을 들려준다`);
      if (kind !== 'find') ok(s.w.getGoal(), `${kind}: 그 뒤 화살표가 맞는 곳을 알려 준다`);
      if (kind === 'deliver') ok(Math.hypot(s.w.player.position.x - 300, s.w.player.position.z - 10) < 0.1, 'deliver: 틀려도 처음 자리로 돌아간다');
      // 맞는 곳들
      if (kind === 'stops') { await pick(-8, 0); await pick(8, 0); }
      else if (kind === 'deliver') { await pick(-9, -6); await pick(9, -6); }
      else await pick(-8, 2);
      for (let i = 0; i < 30; i++) { step(s.w); await sleep(20); }
      eq(await p, 'missed', `${kind}: 끝까지 하면 성공(한 번 틀렸으니 첫 시도 성공은 아님)`);
    } finally { s.done(); }
  });
}

// 5. 가져다 놓으면 처음 자리로
test('feedback: 가져다 놓는 놀이 — 알맞은 원 안에 잠깐 서 있으면 놓이고 처음 자리로 돌아간다(버튼 없이)', async () => {
  const s = touchSetup(speakers);
  try {
    const part = { arena, from: [0, 10], bins: [{ id: 'a', label: '가', x: -9, z: -6 }, { id: 'b', label: '나', x: 9, z: -6 }], cards: [{ text: '하나', bin: 'a' }, { text: '둘', bin: 'b' }] };
    const p = PLAY.deliver(s.ctx, part, false);
    s.w.player.position.set(300 - 9, 0, -6); step(s.w);
    ok(s.w.player.position.x < 295, '지나가듯 잠깐 밟으면 놓이지 않는다');
    step(s.w, 20);
    ok(Math.hypot(s.w.player.position.x - 300, s.w.player.position.z - 10) < 0.1, '놓으면 처음 자리로');
    ok(s.hud.talkBtn.disabled, '대화 버튼은 필요 없다');
    s.w.player.position.set(300 + 9, 0, -6); step(s.w, 20);
    for (let i = 0; i < 30; i++) { step(s.w); await sleep(20); }
    eq(await p, true);
  } finally { s.done(); }
});

test('feedback: 카드 놀이도 틀리면 해설을 보여 주고 이어서 고른다', async () => {
  const s = touchSetup(speakers);
  const btn = t => [...s.ui.querySelectorAll('button')].find(b => b.textContent.includes(t) && !b.disabled);
  try {
    let p = chooseCards(s.ctx, { title: '고르기', cards: [{ text: '맞1', correct: true }, { text: '틀1', correct: false }, { text: '맞2', correct: true }], hint: '그림을 보세요.' });
    btn('틀1').click();
    ok(s.ui.querySelector('.card-why').textContent.includes('그림을 보세요.'), '고르기: 해설');
    btn('맞1').click(); btn('맞2').click();
    eq(await p, 'missed');
    p = orderCards(s.ctx, { title: '순서', cards: ['일', '이', '삼'], hint: '먼저 일어난 일부터.' });
    btn('이').click();
    ok(s.ui.querySelector('.card-why').textContent.includes('먼저 일어난 일부터.'), '순서: 해설');
    ok(btn('일').classList.contains('hint'), '순서: 다음 카드가 빛난다');
    btn('일').click(); await sleep(950); btn('이').click(); btn('삼').click();
    eq(await p, 'missed');
    p = sortCards(s.ctx, { title: '나누기', bins: [{ id: 'a', label: 'ㄱ' }, { id: 'b', label: 'ㄴ' }], cards: [{ text: '하나', bin: 'a' }] });
    s.ui.querySelector('.sort-bin[data-bin="b"]').click();
    ok(s.ui.querySelector('.sort-bin[data-bin="a"]').classList.contains('hint'), '나누기: 맞는 곳이 빛난다');
    await sleep(300); s.ui.querySelector('.sort-bin[data-bin="a"]').click();
    eq(await p, 'missed');
    p = placeOnBoard(s.ctx, { title: '놓기', items: [{ id: 'x', label: '배' }], slots: [{ id: 's1', answer: 'x', xy: [20, 20] }, { id: 's2', answer: 'y', xy: [70, 70] }] });
    s.ui.querySelector('.place-slot[data-slot="s2"]').click();
    ok(s.ui.querySelector('.place-slot[data-slot="s1"]').classList.contains('hint'), '놓기: 맞는 자리가 빛난다');
    s.ui.querySelector('.place-slot[data-slot="s1"]').click();
    eq(await p, 'missed');
  } finally { s.done(); }
});

// 3. 퀴즈 배경
test('feedback: 퀴즈마다 관련된 인물·안내판을 비추고 그때(해)를 이름표로 보여 준다', () => {
  const s = touchSetup(speakers);
  try {
    s.w.addNpc('a', LOOKS.daewongun, -6, 0, 0);
    s.w.addSpot('signTreaty', makeSign('강화도 조약'), 6, 0);
    const q1 = { year: 1863, question: '흥선 대원군은 서양 나라들의 교류 요구에 어떻게 했나요?', options: ['거절했다', '받아들였다'], answer: 0, explain: '' };
    const q2 = { year: 1876, question: '강화도 조약은 어느 나라와 맺었나요?', options: ['일본', '미국'], answer: 0, explain: '' };
    eq(quizSubject(s.w, speakers, q1).id, 'a');
    eq(quizSubject(s.w, speakers, q2).id, 'signTreaty');
    const hide = showQuizView(s.ctx, { script: { speakers } }, q2, 1);
    eq(s.w.camMode, 'fixed', '카메라가 장면을 비춘다');
    ok(Math.hypot(s.w.camera.position.x - 6, s.w.camera.position.z) < 7, '안내판 가까이');
    eq(s.ui.querySelector('.quiz-plate').textContent, '1876년 · 강화도 조약');
    hide();
    eq(s.ui.querySelector('.quiz-plate'), null);
    const none = showQuizView(s.ctx, { script: { speakers } }, { year: 1900, question: '무엇?', options: ['가'], answer: 0, explain: '' }, 0);
    const c0 = s.w.camera.position.clone(); step(s.w, 20);
    ok(c0.distanceTo(s.w.camera.position) > 0.01, '관련된 것이 없으면 마을을 천천히 돌며 보여 준다');
    none();
    // 장면에 없는 역사 인물은 잠깐 세워 비추고, 정답 이름은 미리 보여 주지 않는다
    const before = s.w.level.children.length;
    const g = showQuizView(s.ctx, { script: { speakers } }, { year: 1931, question: '김구가 만든 단체는?', options: ['한인 애국단', '신민회'], answer: 0, explain: '' }, 0);
    eq(s.w.level.children.length, before + 1, '김구를 세운다');
    eq(s.ui.querySelector('.quiz-plate').textContent, '1931년 · 김구');
    g();
    eq(s.w.level.children.length, before, '끝나면 치운다');
    eq(quizSubject(s.w, speakers, { question: '봉오동 전투에서 독립군을 이끈 사람은?', options: ['홍범도', '김구'], answer: 0, explain: '홍범도가 이끌었어요.' }), null, '정답(홍범도)은 미리 비추지 않는다');
  } finally { s.done(); }
});

// 4. 역할
test('feedback: 모든 장에 학생 역할(이름·하는 일·키)이 있고, 아이 역할은 작게 그린다', () => {
  for (const c of ALL_CHAPTERS) {
    const r = ROLES[c.id];
    ok(r && r.name && r.does, `${c.id}: 역할`);
    ok(r.scale >= 0.7 && r.scale <= 1, `${c.id}: 키`);
    ok(roleLook(c.id, null).robe != null, `${c.id}: 생김새`);
  }
  ok(ROLES.j2.scale < 0.9 && ROLES.h5.scale < 0.9 && ROLES.h4.scale < 0.9, '아이 역할은 작다');
  eq(ROLES.h3.scale, 1);
  eq(roleLook('h3', LOOKS.rokSoldier), LOOKS.rokSoldier, '역할에 생김새가 없으면 장의 생김새');
  eq(roleLook('ch5', null), LOOKS.kid);
  const w = testWorld();
  try {
    w.setPlayerLook(roleLook('j2', LOOKS.kid), ROLES.j2.scale);
    eq(w.player.scale.y, ROLES.j2.scale);
    w.setPlayerLook(LOOKS.player);
    eq(w.player.scale.y, 1);
  } finally { w.dispose(); }
});

// 6. 일어난 차례대로
test('feedback: 퀴즈는 장 안에서 일어난 차례(year)대로 낸다 — 강화도 조약 다음에 흥선 대원군이 나오지 않는다', async () => {
  for (const c of ALL_CHAPTERS) {
    const mod = (await c.load()).default;
    const ys = mod.quizzes.map(q => q.year);
    ok(ys.every(y => Number.isInteger(y)), `${c.id}: 퀴즈마다 해`);
    ok(ys.every((y, i) => i === 0 || ys[i - 1] <= y), `${c.id}: ${ys.join(' → ')}`);
  }
  const k1 = (await import('../chapters/modern/k1/script.js')).default;
  ok(k1.quizzes[0].question.includes('흥선 대원군') && k1.quizzes[1].question.includes('1876'));
});

test('feedback: 조선편은 과학 기구(1434~) 다음에 훈민정음(1443~)', () => {
  eq(JOSEON.map(c => c.id), ['j1', 'j3', 'j2', 'j4', 'j5', 'j6']);
  eq(JOSEON.map(c => c.no), [1, 2, 3, 4, 5, 6]);
  for (const course of [ALL_CHAPTERS]) {
    const first = y => parseInt(String(y), 10);
    for (let i = 1; i < course.length; i++) if (course[i].session === course[i - 1].session) ok(first(course[i].years) >= first(course[i - 1].years) || course[i].id === 'k5', `${course[i - 1].id} → ${course[i].id}`);
  }
});
