import { test, eq, ok } from './harness.js';
import { createDialogue } from '../core/dialogue.js';

const speakers = { sonn: { name: '소손녕', mark: '蕭', color: '#5b4a36' }, seohui: { name: '서희', mark: '徐', color: '#2b4c7e' } };
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
  const quiz = { kind: 'quiz', question: '강동 6주를 얻은 사람은?', options: ['양규', '서희', '강감찬'], answer: 1, explain: '서희의 담판이에요.', src: ['S1'] };
  let p = d.quiz(quiz); await sleep(5); d.pick(0);
  await until(() => q('.dlg-text').textContent.includes('×'));
  d.advance();
  ok(q('.dlg-text').textContent.includes('서희의 담판'), 'explains (the explanation names the right answer)');
  d.advance();
  await until(() => !q('.dlg-choices').hidden); // 틀리면 같은 문제를 다시 낸다
  d.pick(1);
  await until(() => q('.dlg-text').textContent.includes('○'));
  d.advance(); d.advance();
  eq(await p, { correct: false, tries: 2 });
  p = d.quiz(quiz); await sleep(5); d.pick(1);
  await until(() => q('.dlg-text').textContent.includes('○'));
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

test('dialogue 11-05: 대화창을 누르거나 닫으면 단추에 남은 키보드 초점을 풀어 방향키가 게임으로 간다', async () => {
  const { root, d, q, done } = setup();
  try {
    const btn = document.createElement('button'); root.appendChild(btn);
    const p = d.say({ who: 'sonn', text: '가' });
    btn.focus(); eq(document.activeElement, btn, 'focused');
    q('.dlg').click(); q('.dlg').click(); await p;
    ok(document.activeElement !== btn, '대화창을 누르면 초점이 풀린다');
    btn.focus(); d.close();
    ok(document.activeElement !== btn, '대화가 닫히면 초점이 풀린다');
    const c = d.choose({ who: 'sonn', text: '?' }, ['하나', '둘']);
    await sleep(300);
    const b0 = q('.dlg-choices button'); b0.focus(); b0.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b0.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    eq(await c, 0); ok(document.activeElement !== b0, '고른 단추의 초점이 풀린다');
  } finally { done(); }
});
