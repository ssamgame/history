import { test, eq, ok } from './harness.js';
import { createNotebook } from '../core/notebook.js';
import { createDialogue } from '../core/dialogue.js';
import { showNotebook } from '../core/screens.js';
import { makeSign } from '../core/signs.js';
import { roam } from '../core/flow.js';
import { touchSetup, memSave, sleep } from './bot.js';

const SPEAKERS = { yiseonggye: { name: '이성계', look: 'yiseonggye' }, guide: { name: '안내', mark: '◎', color: '#2f6b5e' } };

test('notebook: facts are grouped by place, person and event; guide lines and repeats are skipped', () => {
  const nb = createNotebook();
  nb.start([], SPEAKERS);
  nb.setContext({ kind: 'place', title: '위화도' });
  ok(nb.record({ who: 'narr', text: '위화도는 압록강에 있는 섬이에요.', src: ['S23'] }));
  nb.setContext(null);
  ok(nb.record({ who: 'yiseonggye', text: '작은 나라가 큰 나라를 거스르는 것은 옳지 않다.', src: ['S23'] }));
  ok(nb.record({ who: 'narr', text: '1388년, 이성계는 군사를 돌렸어요.', src: ['S23'] }));
  ok(!nb.record({ who: 'guide', text: '느낌표가 있는 사람에게 말을 걸어 봐.' }), 'no source → not a fact');
  ok(!nb.record({ who: 'narr', text: '1388년, 이성계는 군사를 돌렸어요.', src: ['S23'] }), 'repeat');
  const e = nb.entries();
  eq(e.map(x => [x.kind, x.title, x.lines.length]), [['place', '위화도', 1], ['person', '이성계', 1], ['event', '사건 해설', 1]]);
});

test('notebook: quiz answers and explanations are kept once each', () => {
  const nb = createNotebook();
  nb.start([], SPEAKERS);
  const q = { question: '이성계가 군사를 돌린 곳은?', options: ['귀주', '위화도'], answer: 1, explain: '압록강의 섬 위화도에서 군사를 돌렸어요.', src: ['S23'] };
  nb.recordQuiz(q, false); nb.recordQuiz(q, true);
  const quiz = nb.entries().find(x => x.kind === 'quiz');
  eq(quiz.lines.length, 1);
  eq(quiz.lines[0].answer, '위화도');
  eq(quiz.lines[0].correct, false, 'first result is kept');
});

test('save: notes survive reload and reset clears them', () => {
  const s = memSave();
  s.setNotes('j1', [{ kind: 'event', title: '사건 해설', lines: [{ text: 'a', src: ['S23'] }] }]);
  const again = memSave(); // 다른 저장소이므로 비어 있다
  eq(again.notes('j1'), []);
  eq(s.notes('j1').length, 1);
  s.load(); eq(s.notes('j1').length, 1, 'load keeps notes');
  s.reset(); eq(s.notes('j1'), []);
});

test('dialogue: people lines are tagged as made-up speech, recorded quotes and narration are not', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const said = [];
  const d = createDialogue(ui, SPEAKERS, { typeMs: 0, onSay: l => said.push(l.text) });
  try {
    const tag = () => ui.querySelector('.dlg-tag');
    let p = d.say({ who: 'yiseonggye', text: '가' }); eq(tag().textContent, '꾸민 대사'); ok(!tag().hidden); d.advance(); await p;
    p = d.say({ who: 'yiseonggye', text: '나', quote: true }); eq(tag().textContent, '기록에 남은 말'); d.advance(); await p;
    p = d.say({ who: 'narr', text: '다' }); ok(tag().hidden, 'narration has no tag'); d.advance(); await p;
    eq(said, ['가', '나', '다']);
  } finally { d.dispose(); ui.remove(); }
});

test('roam: reading a sign files its facts under the sign title, and a nearby sign is announced once', async () => {
  const s = touchSetup(SPEAKERS);
  const nb = createNotebook(); nb.start([], SPEAKERS);
  s.ctx.notebook = nb;
  try {
    s.w.addSpot('signIsland', makeSign('위화도'), 0, -3, 0);
    s.w.player.position.set(0, 0, 3);
    const notices = [];
    const orig = s.hud.notice; s.hud.notice = t => { notices.push(t); orig(t); };
    const stop = roam(s.ctx, { onTalk: async () => { await s.dialogue.say({ who: 'narr', text: '위화도는 압록강에 있는 섬이에요.', src: ['S23'] }); } });
    for (let i = 0; i < 3; i++) s.w.step(0.016, { x: 0, z: 0 });
    eq(notices.filter(t => t.includes('위화도')).length, 1, 'announced once');
    ok(/0\s*\/\s*1/.test(s.ui.querySelector('.hud-found').textContent), 'read count shown');
    s.w.player.position.set(0, 0, -1.2);
    s.w.step(0.016, { x: 0, z: 0 });
    s.hud.talkBtn.click();
    await sleep(20);
    nb.record({ who: 'narr', text: '위화도는 압록강에 있는 섬이에요.', src: ['S23'] }); // 대화창 쪽 기록은 main.js가 맡으므로 여기서 직접
    s.dialogue.advance(); await sleep(20);
    stop();
    const place = nb.entries().find(x => x.kind === 'place');
    ok(place && place.title === '위화도', JSON.stringify(nb.entries()));
    ok(/1\s*\/\s*1/.test(s.ui.querySelector('.hud-found').textContent) || s.ui.querySelector('.hud-found').hidden, 'read count updated');
  } finally { s.done(); }
});

test('notebook screen: lists sections, sources and the made-up speech note; closes', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const p = showNotebook(ui, { no: 1, title: '위화도 회군과 조선 건국' }, [
      { kind: 'place', title: '위화도', lines: [{ text: '위화도는 섬이에요.', src: ['S23'] }] },
      { kind: 'person', title: '이성계', lines: [{ text: '작은 나라가…', src: ['S23'] }] },
      { kind: 'quiz', title: '확인 문제', lines: [{ text: '이성계가 군사를 돌린 곳은?', answer: '위화도', explain: '압록강의 섬', correct: true, src: ['S23'] }] },
    ]);
    const t = ui.textContent;
    ok(t.includes('살펴본 곳') && t.includes('만난 사람') && t.includes('확인 문제'), t);
    ok(t.includes('꾸민'), 'explains made-up speech');
    ok(ui.querySelector('.nb-src'), 'source shown');
    ui.querySelector('.screen.notebook button.primary').click();
    await p;
    ok(!ui.querySelector('.screen.notebook'));
  } finally { ui.remove(); }
});

import { createHud } from '../core/screens.js';
test('hud: goal shows which step of the chapter it is', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const hud = createHud(ui, { touch: false });
    hud.setGoal('이성계를 찾아가자', [3, 6]);
    eq(ui.querySelector('.goal-step').textContent, '3/6');
    hud.setGoal('자유롭게 둘러보자');
    ok(ui.querySelector('.goal-step').hidden);
  } finally { ui.remove(); }
});

import { readBook, showDocument } from '../core/minigame.js';
test('book: pages turn with 다음 쪽, every page line is noted, and it ends with 다 읽었어요', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const nb = createNotebook(); nb.start([], {});
  try {
    const p = readBook({ ui, notebook: nb }, { title: '책', pages: [
      { title: '첫 쪽', figure: '<svg></svg>', lines: [{ who: 'narr', text: '가', src: ['S51'] }] },
      { title: '둘째 쪽', lines: [{ who: 'narr', text: '나', src: ['S51'] }] },
    ] });
    ok(ui.textContent.includes('첫 쪽') && ui.textContent.includes('1 / 2'));
    ui.querySelector('.book-next').click(); await sleep(260);
    ok(ui.textContent.includes('둘째 쪽'));
    eq(ui.querySelector('.book-next').textContent, '다 읽었어요');
    ui.querySelector('.book-next').click();
    eq(await p, true);
    eq(nb.entries()[0].lines.map(l => l.text), ['가', '나']);
  } finally { ui.remove(); }
});

test('doc: a document lists its items with notes and closes', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const p = showDocument({ ui }, { title: '요구', heading: '농민군의 요구', items: [{ text: '탐관오리를 쫓아낼 것', note: '나쁜 관리' }] });
    ok(ui.querySelector('.doc-paper li').textContent.includes('탐관오리'));
    ui.querySelector('.doc-ok').click();
    eq(await p, true);
  } finally { ui.remove(); }
});

test('hud: remaining time shows big in the middle of the top', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const hud = createHud(ui, { touch: false });
    hud.setTimer(42.2);
    const big = ui.querySelector('.hud-bigtimer');
    ok(!big.hidden && big.textContent === '43초');
    hud.setTimer(null); ok(big.hidden);
  } finally { ui.remove(); }
});

test('hud: 새 장소 알림과 가운데 큰 남은 시간은 왼쪽 위 목표 상자와 겹치지 않는다', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const hud = createHud(ui, { touch: false });
    hud.show({ no: 2, years: '1010', event: '거란 2차 침입' }, { name: '흥화진을 지키는 병사' });
    hud.setGoal('성안의 병사에게 말을 걸어 보자, 그리고 아주 긴 목표 글이 붙어도 괜찮은지 본다', [1, 6]);
    hud.setFound('살펴본 안내판 0 / 2');
    hud.setTimer(42); hud.notice('새 장소 발견: 흥화진');
    const box = ui.querySelector('.hud').getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    for (const sel of ['.hud-notice', '.hud-bigtimer']) {
      const r = ui.querySelector(sel).getBoundingClientRect();
      ok(r.width > 0 && !hit(box, r), `${sel} ${JSON.stringify(r)} vs hud ${JSON.stringify(box)}`);
    }
  } finally { ui.remove(); }
});
