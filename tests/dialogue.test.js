import { test, eq, ok } from './harness.js';
import { createDialogue } from '../core/dialogue.js';

const speakers = { sonn: { name: '소손녕', mark: '蕭', color: '#5b4a36' }, seohui: { name: '서희', mark: '徐', color: '#2b4c7e', look: 'seohui' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 2000) {
  const t0 = performance.now();
  while (!fn()) { if (performance.now() - t0 > ms) throw new Error('until timeout'); await sleep(5); }
}
function setup() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const d = createDialogue(root, speakers, { typeMs: 15 });
  const q = sel => root.querySelector(sel);
  return { root, d, q, done: () => { d.close(); root.remove(); } };
}
const choice = {
  kind: 'choice', who: 'sonn', prompt: { who: 'sonn', text: '왜?' },
  options: [
    { text: '틀린 답', correct: false, reply: null, hint: '다시 생각해 보세요.' },
    { text: '맞는 답', correct: true, reply: { who: 'seohui', text: '그렇다.' }, hint: null },
  ],
};

test('dialogue: first advance completes typing, second resolves', async () => {
  const { d, q, done } = setup();
  let resolved = false;
  const p = d.say({ who: 'narr', text: '가나다라마바사아자차카타파하' }).then(() => { resolved = true; });
  await sleep(20);
  ok(q('.dlg-text').textContent.length < 14, 'still typing');
  d.advance();
  eq(q('.dlg-text').textContent, '가나다라마바사아자차카타파하');
  await sleep(10);
  eq(resolved, false);
  d.advance();
  await p;
  eq(resolved, true);
  done();
});

test('dialogue: speaker name and mark are shown', async () => {
  const { d, q, done } = setup();
  d.say({ who: 'sonn', text: '가' });
  eq(q('.dlg-name').textContent, '소손녕');
  eq(q('.dlg-portrait').textContent, '蕭');
  done();
});

test('dialogue: digit key picks choice', async () => {
  const { d, done } = setup();
  const p = d.choose({ who: 'sonn', text: '고르기' }, ['가', '나', '다']);
  await sleep(10);
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));
  eq(await p, 1);
  done();
});

test('dialogue: fast double tap does not pick a choice', async () => {
  const { d, q, done } = setup();
  const p = d.say({ who: 'narr', text: '긴 대사가 이어집니다' });
  q('.dlg').click(); q('.dlg').click();
  await p;
  let picked = null;
  d.choose({ who: 'sonn', text: '고르기' }, ['가', '나']).then(i => { picked = i; });
  q('.dlg-choices button').click();
  await sleep(30);
  eq(picked, null, 'click right after opening is ignored');
  await sleep(260);
  q('.dlg-choices button').click();
  await until(() => picked !== null);
  eq(picked, 0);
  done();
});

test('dialogue: ask retries after wrong answer and reports firstTry=false', async () => {
  const { d, q, done } = setup();
  const p = d.ask(choice);
  await sleep(5); d.pick(0);
  await until(() => q('.dlg-text').textContent.includes('다시 생각'));
  d.advance(); d.advance();
  await until(() => !q('.dlg-choices').hidden);
  d.pick(1);
  await until(() => q('.dlg-text').textContent === '그렇다.' || q('.dlg-name').textContent === '서희');
  d.advance(); d.advance();
  eq(await p, { firstTry: false });
  done();
});

test('dialogue: ask right first time reports firstTry=true', async () => {
  const { d, done } = setup();
  const p = d.ask(choice);
  await sleep(5); d.pick(1);
  await sleep(5); d.advance(); d.advance();
  eq(await p, { firstTry: true });
  done();
});

test('dialogue: quiz marks correct with ○ and wrong with ×', async () => {
  const { d, q, done } = setup();
  const quiz = { kind: 'quiz', question: '강동 6주를 얻은 사람은?', options: ['양규', '서희', '강감찬'], answer: 1, explain: '서희의 담판이에요.', src: ['S1'], year: 993 };
  const why = () => q('.dlg-why .txt').textContent, open = () => [...q('.dlg-choices').children].some(b => !b.disabled);
  let p = d.quiz(quiz, { index: 2, total: 3 }); await sleep(5);
  ok(q('.dlg').classList.contains('mode-quiz'), '퀴즈는 가운데 질문 + 보기 띠'); eq(q('.dlg-count').textContent, '문제 2/3'); eq(q('.dlg-year').textContent, '993년');
  d.pick(0);
  await until(() => why().includes('×'));
  ok(q('.dlg-choices button').classList.contains('wrong') && !q('.dlg-choices').hidden, '고른 띠에 × 표시, 띠는 남아 있다');
  d.advance();
  ok(why().includes('서희의 담판'), 'explains (the explanation names the right answer)');
  d.advance();
  await until(open); // 틀리면 같은 문제를 다시 낸다
  d.pick(1);
  await until(() => why().includes('○'));
  ok(q('.dlg-choices').children[1].classList.contains('right') && q('.dlg-choices').children[2].classList.contains('dim'), '맞은 띠는 ○, 나머지는 흐리게');
  d.advance(); d.advance();
  eq(await p, { correct: false, tries: 2 });
  p = d.quiz(quiz); await sleep(5); d.pick(1);
  await until(() => why().includes('○'));
  d.advance(); d.advance();
  eq(await p, { correct: true, tries: 1 });
  done();
});

test('dialogue: a tap that started before the choices opened is ignored even after the guard', async () => {
  const { d, q, done } = setup();
  try {
  let picked = null;
  d.choose({ who: 'sonn', text: '고르기' }, ['가', '나']).then(i => { picked = i; });
  await sleep(320);
  const b = q('.dlg-choices button');
  b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); // 손가락은 선택지가 뜨기 전에 내려왔다
  await sleep(20);
  eq(picked, null);
  b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  await until(() => picked !== null);
  eq(picked, 0);
  } finally { done(); }
});

test('dialogue: 해설은 자막, 안내는 칩, 사람 말은 한지 대화창(2026-11-09)', async () => {
  const { d, q, done } = setup();
  d.say({ who: 'narr', text: '해설' }); await sleep(5);
  ok(q('.dlg').classList.contains('mode-cap') && !q('.dlg').classList.contains('mode-chip'), '해설은 자막');
  eq(q('.dlg-portrait').textContent, '', '史 글자 없음');
  d.advance();
  d.say({ who: 'guide', text: '안내' }); await sleep(5);
  ok(q('.dlg').classList.contains('mode-chip'), '안내는 칩');
  d.advance();
  d.say({ who: 'seohui', text: '말' }); await sleep(5);
  ok(!q('.dlg').classList.contains('mode-cap') && !q('.dlg').classList.contains('mode-chip') && !q('.dlg').classList.contains('mode-quiz'), '사람은 대화창');
  d.advance();
  const p = d.choose({ who: 'guide', text: '어느 쪽?' }, ['가', '나']); await sleep(5);
  ok(q('.dlg').classList.contains('mode-quiz'), '안내가 묻는 고르기도 띠 모양');
  d.pick(1); eq(await p, 1);
  done();
});

test('dialogue: 안내 칩은 기다리지 않고 바로 넘어가며, 걸음을 막지 않고, 읽을 시간 뒤 저절로 사라진다(2026-11-09)', async () => {
  const { d, q, done } = setup();
  const t0 = performance.now(), p = d.say({ who: 'guide', text: '앞으로 가요' });
  await p; // 바로 끝난다(캐릭터가 멈추지 않게)
  ok(performance.now() - t0 < 300, '안내는 기다리지 않는다');
  ok(!q('.dlg').hidden && q('.dlg').classList.contains('mode-chip'), '칩이 보인다');
  ok(d.isOpen() && !d.isBlocking(), '보이지만 걷기·말 걸기를 막지 않는다');
  d.close(); ok(!q('.dlg').hidden, '대사 뒤 정리용 close()는 칩을 지우지 않는다');
  await until(() => q('.dlg').hidden, 8000); ok(performance.now() - t0 >= 1400, '읽을 시간 뒤 저절로 사라진다');
  // 사람 말이 바로 이어지면 칩이 적어도 1.2초는 보인 뒤에 덮는다
  const t1 = performance.now(); d.say({ who: 'guide', text: '둘째 안내' });
  const p2 = d.say({ who: 'seohui', text: '말' }); await sleep(50);
  ok(q('.dlg').classList.contains('mode-chip'), '아직 칩');
  await until(() => d.isBlocking(), 4000); ok(performance.now() - t1 >= 1100, `사람 말은 ${Math.round(performance.now() - t1)}ms 뒤에`);
  d.advance(); d.advance(); await p2; // 한 번은 글자 다 보이기, 한 번은 넘기기
  done();
}, { timeout: 20000 });
