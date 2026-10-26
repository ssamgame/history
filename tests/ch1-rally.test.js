// 고려 1장 「서희의 담판」(2026-10-26 새로 만들기)과 놀이 부품 「말 받아치기」(chapters/kit/rally.js):
// 맞는 구슬·틀린 구슬·시간 제한·쉬운 모드·키보드·끌어 올리기, 장 안의 판 다시 하기와 첫 시도 세기, 꼭 듣는 대사 수,
// 그리기 조각 수, 지킴이 고르기, 이어하기, 화면 배치.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { rally } from '../chapters/kit/rally.js';
import { opsGauge } from '../chapters/kit/ops.js';
import ch1Script from '../chapters/ch1/script.js';
import ch1, { GUARDIAN_KEY, FERRY_RETURN, negotiationView } from '../chapters/ch1/chapter.js';
import { touchSetup, touchBot, sleep } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces } from '../core/figures.js';

const Q1 = ch1Script.negotiation.q1, Q2 = ch1Script.negotiation.q2;
const right = q => q.options.find(o => o.correct);
const step = (s, sec) => { for (let t = 0; t < sec; t += 0.05) s.w.step(0.05, { x: 0, z: 0 }); };
const orbs = s => [...s.ui.querySelectorAll('.rally-orb')];
const orbOf = (s, text) => orbs(s).find(o => o.dataset.text === text);

function rallySetup() {
  const s = touchSetup(ch1Script.speakers);
  const at = (x, z) => { const o = new THREE.Object3D(); o.position.set(x, 0, z); s.w.level.add(o); return o; };
  s.w.player.position.set(0, 0, 0); s.w.snapCamera();
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const auto = setInterval(() => { if (s.dialogue.isOpen() && !s.dialogue.isChoosing()) s.dialogue.advance(); }, 5);
  return { s, speaker: at(2, -5), target: at(-2, -5), said, done() { clearInterval(auto); s.done(); } };
}

test('ch1-rally: a correct orb sends the word ball back, raises the gauge and Seohui says the reply', async () => {
  const t = rallySetup(), { s } = t;
  try {
    const gauge = opsGauge(s.ctx, { value: 0.5 });
    const p = rally(s.ctx, { prompt: Q1.prompt, options: Q1.options, speakerAnchor: t.speaker, targetAnchor: t.target, gauge });
    await sleep(10); step(s, 0.3);
    eq(orbs(s).map(o => o.dataset.text).sort(), Q1.options.map(o => o.text).sort(), 'orb texts are the options, unchanged');
    ok(s.ui.querySelector('.rally-say').textContent.includes(Q1.prompt.text), 'Sonn says the prompt in a bubble');
    ok(s.ui.querySelector('.rally-ball'), 'a word ball flies');
    orbOf(s, right(Q1).text).click();
    const r = await p;
    eq(r.ok, true);
    ok(Math.abs(gauge.value - 0.75) < 1e-6, `gauge ${gauge.value}`);
    ok(t.said.some(l => l.text === right(Q1).reply.text), 'Seohui reply');
    ok(!s.ui.querySelector('.rally-orb') && !s.ui.querySelector('.rally-say') && !s.ui.querySelector('.rally-ball'), 'cleaned up');
    gauge.dispose();
  } finally { t.done(); }
});

test('ch1-rally: a wrong orb bursts the ball, lowers the gauge and returns that option\'s hint', async () => {
  const t = rallySetup(), { s } = t;
  try {
    const gauge = opsGauge(s.ctx, { value: 0.5 });
    const wrong = Q1.options.find(o => !o.correct);
    const p = rally(s.ctx, { prompt: Q1.prompt, options: Q1.options, speakerAnchor: t.speaker, targetAnchor: t.target, gauge });
    await sleep(10); step(s, 0.3);
    orbOf(s, wrong.text).click();
    await sleep(400);
    ok(s.ui.querySelector('.rally-burst'), 'the ball bursts (dust and letters)');
    const r = await p;
    eq(r.ok, false); eq(r.hint, wrong.hint);
    ok(Math.abs(gauge.value - 0.4) < 1e-6, `gauge ${gauge.value}`);
    eq(t.said.length, 0, 'no reply on a wrong orb');
    gauge.dispose();
  } finally { t.done(); }
});

test('ch1-rally: with a time limit the ball reaches Seohui and counts as wrong; easy mode dims one wrong orb and has no limit', async () => {
  const t = rallySetup(), { s } = t;
  try {
    let done = null;
    rally(s.ctx, { prompt: Q2.prompt, options: Q2.options, speakerAnchor: t.speaker, targetAnchor: t.target, seconds: 1, timeoutHint: '시간' }).then(r => { done = r; });
    await sleep(10); step(s, 1.5); await sleep(900);
    ok(done && done.ok === false && done.timeout === true, 'timed out');
    eq(done.hint, '시간');

    done = null;
    const p = rally(s.ctx, { prompt: Q2.prompt, options: Q2.options, speakerAnchor: t.speaker, targetAnchor: t.target, seconds: 1, easy: true }).then(r => { done = r; return r; });
    await sleep(10); step(s, 5); await sleep(50);
    eq(done, null, 'no time limit in easy mode');
    const off = orbs(s).filter(o => o.disabled);
    eq(off.length, 1, 'one orb is dimmed');
    ok(off[0].classList.contains('off') && off[0].dataset.text !== right(Q2).text, 'the dimmed orb is a wrong one');
    off[0].click(); await sleep(450);
    eq(done, null, 'the dimmed orb cannot be picked');
    orbOf(s, right(Q2).text).click();
    eq((await p).ok, true);
  } finally { t.done(); }
});

test('ch1-rally: keys 1·2·3 pick the orb with that number', async () => {
  const t = rallySetup(), { s } = t;
  try {
    const p = rally(s.ctx, { prompt: Q2.prompt, options: Q2.options, speakerAnchor: t.speaker, targetAnchor: t.target });
    await sleep(10); step(s, 0.2);
    const o = orbOf(s, right(Q2).text);
    eq(orbs(s).map(b => b.querySelector('.n').textContent), ['1', '2', '3']);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: `Digit${o.querySelector('.n').textContent}` }));
    eq((await p).ok, true);
  } finally { t.done(); }
});

test('ch1-rally: dragging an orb upward fires it; a small sideways drag does not', async () => {
  const t = rallySetup(), { s } = t;
  try {
    let done = null;
    const p = rally(s.ctx, { prompt: Q2.prompt, options: Q2.options, speakerAnchor: t.speaker, targetAnchor: t.target }).then(r => { done = r; return r; });
    await sleep(10); step(s, 0.2);
    const ev = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true }));
    const wrong = orbs(s).find(o => o.dataset.text !== right(Q2).text), r0 = wrong.getBoundingClientRect();
    ev(wrong, 'pointerdown', r0.left + 20, r0.top + 20); ev(window, 'pointermove', r0.left + 40, r0.top + 22); ev(window, 'pointerup', r0.left + 40, r0.top + 22);
    await sleep(450); eq(done, null, 'sideways drag is not a pick');
    const o = orbOf(s, right(Q2).text), r = o.getBoundingClientRect();
    ev(o, 'pointerdown', r.left + 20, r.top + 20);
    ev(window, 'pointermove', r.left + 22, r.top - 30);
    ev(window, 'pointermove', r.left + 24, r.top - 90);
    ev(window, 'pointerup', r.left + 24, r.top - 90);
    eq((await p).ok, true);
  } finally { t.done(); }
});

// 장 안에서: 같은 판을 두 번 틀리면 쉬워지고(구슬 하나 흐림), 판마다 첫 고르기가 맞았는지를 센다
test('ch1-rally: chapter minigame — two wrong picks turn on easy mode, firstTryCorrect counts first picks per round', async () => {
  const s = touchSetup(ch1Script.speakers);
  const plan = { [Q1.prompt.text]: ['wrong', 'wrong', 'right'], [Q2.prompt.text]: ['right'] }, sawOff = [];
  let busy = false;
  const drive = setInterval(() => {
    if (s.dialogue.isOpen()) { if (!s.dialogue.isChoosing()) s.dialogue.advance(); return; }
    const start = [...s.ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (start) { start.click(); return; }
    s.w.step(0.05, { x: 0, z: 0 });
    const say = s.ui.querySelector('.rally-say'), list = orbs(s).filter(o => !o.disabled);
    if (!say || !list.length || busy || s.ui.querySelector('.rally-board.busy')) return;
    const key = Object.keys(plan).find(k => say.textContent.includes(k)), what = plan[key].shift() || 'right';
    sawOff.push(orbs(s).some(o => o.disabled));
    const want = key === Q1.prompt.text ? Q1 : Q2;
    const pick = what === 'right' ? list.find(o => o.dataset.text === right(want).text) : list.find(o => o.dataset.text !== right(want).text);
    busy = true; pick.click(); setTimeout(() => { busy = false; }, 60);
  }, 15);
  try {
    ch1.buildScene(s.w, s.ctx);
    const r = await ch1.minigame(s.ctx);
    eq(r, { firstTryCorrect: 1, firstTryTotal: 2, easyModeUsed: true });
    eq(sawOff, [false, false, true, true], 'third try and the next round are easy (one orb dimmed)');
    ok(!s.ui.querySelector('.ops-gauge'), 'gauge removed');
  } finally { clearInterval(drive); s.done(); }
}, { timeout: 90000 });

test('ch1-rally: required lines are 7 or fewer, merged lines keep their sources, every bubble line fits in two lines', () => {
  const S = ch1Script, n = S.npc;
  eq(S.start, undefined, 'no start guide lines (the goal box says it)');
  const required = [n.soldier.first, n.seohui.first, S.negotiation.opening, S.negotiation.closing, S.retreat];
  eq(required.flat().length, 6);
  eq(n.soldier.first, [{ who: 'soldier', text: '거란 장수 소손녕이 항복하라고 한대. 80만 대군이라고 큰소리를 친대.', src: ['S16'] }]);
  eq(n.seohui.first, [{ who: 'seohui', text: '땅을 떼어 주고 달랠 수는 없다. 내가 직접 소손녕을 만나 담판을 짓겠다.', src: ['S17'] }]);
  for (const l of [n.soldier.first, n.soldier.later, n.seohui.first, n.seohui.later, n.seohui.tooEarly, n.officer.always, n.archer.always, Q1.options.map(o => o.reply).filter(Boolean), Q2.options.map(o => o.reply).filter(Boolean)].flat()) ok([...l.text].length <= 46, `${l.text} (${[...l.text].length})`);
  eq(S.retreat[1].text, '서희는 싸우지 않고 말로 거란군을 물러나게 했어요.', 'kept until the source check');
  // 퀴즈 2번은 S19 문장으로
  const q2 = S.quizzes[1];
  eq(q2.question, '거란이 고려를 경계한 까닭은?');
  eq(q2.options[q2.answer], '송나라와 가까이 지내서');
  eq(q2.explain, '거란은 송나라와 다투고 있어서 송과 가까이 지내는 고려를 경계했어요.');
  eq(q2.src, ['S19']);
  eq(S.quizzes[0].options, ['동북 9성', '강동 6주', '강화도']);
});

test('ch1-rally: explore and negotiation views draw 500 pieces or fewer after baking', async () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    const sc = ch1.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    const a = drawPieces(s.w.scene);
    ok(a <= 500, `explore draw pieces ${a}`);
    negotiationView(s.ctx);
    const b = drawPieces(s.w.scene);
    ok(b <= 500, `negotiation draw pieces ${b}`);
  } finally { s.done(); }
});

test('ch1-rally: guardian pick shows when none is saved (skip keeps asking), and not again once one is saved', async () => {
  const runExplore = async ({ skip }) => {
    const s = touchSetup(ch1Script.speakers);
    let seen = 0;
    const mo = new MutationObserver(() => { const p = s.ui.querySelector('.ops-pick'); if (p && !p.dataset.seen) { p.dataset.seen = '1'; seen += 1; if (skip) p.querySelector('.skip').click(); } });
    mo.observe(s.ui, { childList: true, subtree: true });
    const bot = touchBot(s, { answers: new Set() });
    try {
      ch1.buildScene(s.w, s.ctx);
      await ch1.explore(s.ctx);
    } finally { mo.disconnect(); bot.stop(); s.done(); }
    return seen;
  };
  let old = null;
  try { old = localStorage.getItem(GUARDIAN_KEY); localStorage.removeItem(GUARDIAN_KEY); } catch {}
  try {
    eq(await runExplore({ skip: true }), 1, 'asked');
    eq(localStorage.getItem(GUARDIAN_KEY), null, 'skip saves nothing');
    localStorage.setItem(GUARDIAN_KEY, 'b');
    eq(await runExplore({ skip: false }), 0, 'not asked again');
  } finally { try { if (old) localStorage.setItem(GUARDIAN_KEY, old); else localStorage.removeItem(GUARDIAN_KEY); } catch {} }
}, { timeout: 120000 });

test('ch1-rally: resume — minigame stage stands at the ferry, quiz stage shows the camp after the retreat', () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    const sc = ch1.buildScene(s.w, s.ctx);
    ch1.enterStage(s.ctx, 'minigame');
    eq([s.w.player.position.x, s.w.player.position.z], FERRY_RETURN);
    ch1.enterStage(s.ctx, 'quiz');
    eq(sc.khitanGroup.visible, false);
    eq(sc.gangdongPillars.visible, true);
    ok(sc.gangdongPillars.children.every(c => c.visible && (c.isSprite || Math.abs(c.scale.y - 1) < 1e-6)), 'all six pillars stand with their names');
  } finally { s.done(); }
});

// 말 받아치기 화면이 화면 크기마다 화면 안에 들고, 손가락으로 누를 만큼 크고, 게이지·목표 상자·말풍선과 겹치지 않는다
const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
test('layout: ch1 rally orbs fit, can be tapped and do not overlap the gauge, goal box or speech bubble', async () => {
  for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=rally'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.rally-orb'); i++) await sleep(20);
      await sleep(80);
      const btns = [...d.querySelectorAll('.rally-orb')];
      eq(btns.length, 3, `${w}x${h}: 3 orbs`);
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${w}x${h}: orb outside`);
        ok(r.height >= 44 && r.width >= 44, `${w}x${h}: orb too small (${Math.round(r.width)}x${Math.round(r.height)})`);
        const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(top && (top === b || b.contains(top)), `${w}x${h}: orb covered by ${top && top.className}`);
      }
      for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) ok(!overlap(btns[i].getBoundingClientRect(), btns[j].getBoundingClientRect()), `${w}x${h}: orbs overlap`);
      const g = d.querySelector('.ops-gauge').getBoundingClientRect(), hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect(), say = d.querySelector('.rally-say').getBoundingClientRect();
      for (const b of btns) { const r = b.getBoundingClientRect(); ok(!overlap(g, r), `${w}x${h}: gauge overlaps an orb`); ok(!overlap(say, r), `${w}x${h}: bubble overlaps an orb`); }
      ok(!overlap(g, hb), `${w}x${h}: gauge overlaps the goal box`);
      ok(!overlap(say, g), `${w}x${h}: bubble overlaps the gauge`);
      ok(!overlap(say, hb), `${w}x${h}: bubble overlaps the goal box`);
      ok(say.left >= 0 && say.right <= w && say.top >= 0, `${w}x${h}: bubble on screen`);
    } finally { frame.remove(); }
  }
}, { timeout: 60000 });
