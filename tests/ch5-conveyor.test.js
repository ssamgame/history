// 고려 새 6장(장 id ch5) 「팔만대장경과 삼별초」와 새 놀이 부품 「경판 공방」(chapters/kit/conveyor.js) · 「노 젓기 박자」(chapters/kit/rhythm.js), 2026-10-26.
// 판 상태 → 다음 작업대, 틀리면 튕김과 힌트, 판 3개를 놓치면 실패, 두 번 실패하면 쉬운 모드와 그 무리만 다시,
// 박자 맞춤(±창)과 번갈아 젓기, 시간 안에 못 가면 실패, 대사 · 금지어, 그리기 조각 수, 이어하기, 화면 배치.
import { test, eq, ok } from './harness.js';
import { conveyor } from '../chapters/kit/conveyor.js';
import { rhythm } from '../chapters/kit/rhythm.js';
import ch5Script from '../chapters/ch5/script.js';
import ch5, { STATIONS } from '../chapters/ch5/chapter.js';
import { touchSetup, sleep } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces } from '../core/figures.js';
import { validateScript } from '../core/content.js';
import { SOURCES } from '../content/sources.js';

const S = ch5Script, M = S.making;
const step = (s, n, dt = 0.05) => { for (let i = 0; i < n; i++) s.w.step(dt, { x: 0, z: 0 }); };
const st = (s, i) => s.ui.querySelector(`.conv-st[data-st="${i}"]`);
function openConv(s, opts) {
  let res = null;
  const p = conveyor(s.ctx, { stations: STATIONS, states: M.states, colors: M.colors, hints: { order: M.order, miss: M.miss }, ...opts }).then(r => { res = r; });
  return { p, get res() { return res; } };
}
const run = async (s, g, n = 400) => { for (let i = 0; i < n && !g.res; i++) { step(s, 1); await sleep(1); } await g.p; return g.res; };

test('ch5-conveyor: a board goes to the station for its next step; the last active step puts it on the shelf', async () => {
  const s = touchSetup(S.speakers);
  try {
    const shelf = [];
    const g = openConv(s, { active: [0, 1, 2], boards: 1, gap: 1, beltSeconds: 60, scene: { shelf: n => shelf.push(n) } });
    step(s, 12); await sleep(5);
    eq(s.ctx.testHooks.conveyor.answer, 0, 'raw wood goes to the sea water first');
    ok(st(s, 3).disabled && st(s, 5).disabled, 'only the first three stations are on in wave 1');
    for (const i of [0, 1, 2]) {
      eq(s.ui.querySelector('.conv-board').textContent, M.states[i]);
      st(s, i).click();
      for (let k = 0; k < 40 && s.ctx.testHooks.conveyor?.answer !== i + 1 && !g.res; k++) { step(s, 1); await sleep(2); }
    }
    const r = await run(s, g);
    eq(r, { ok: true, done: 1, misses: 0, wrong: 0 });
    eq(shelf, [1]);
  } finally { s.done(); }
});

test('ch5-conveyor: the wrong station bounces the board back with a hint (same board, same state)', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = openConv(s, { active: [0, 1, 2, 3, 4, 5], boards: 1, gap: 1, beltSeconds: 60 });
    step(s, 12); await sleep(5);
    st(s, 2).click();
    eq(s.ui.querySelector('.conv-hint').textContent, M.order);
    eq(s.ui.querySelector('.conv-board').textContent, M.states[0], 'still raw wood');
    eq(s.ctx.testHooks.conveyor.answer, 0);
    // 키보드 1 = 바닷물
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
    for (let k = 0; k < 40 && s.ctx.testHooks.conveyor?.answer !== 1; k++) { step(s, 1); await sleep(2); }
    eq(s.ctx.testHooks.conveyor.answer, 1, 'keyboard picks the station');
  } finally { s.done(); }
});

test('ch5-conveyor: three unfinished boards reaching the belt end fail the wave', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = openConv(s, { active: [0, 1, 2], boards: 3, gap: 0.5, beltSeconds: 3 });
    const r = await run(s, g);
    eq(r.ok, false); eq(r.misses, 3);
    ok(!s.ui.querySelector('.conv-belt'), 'belt removed');
  } finally { s.done(); }
});

test('ch5-conveyor: easy mode slows the belt and makes the next station glow', async () => {
  const s = touchSetup(S.speakers);
  try {
    openConv(s, { active: [0, 1, 2], boards: 1, gap: 1, beltSeconds: 10, easy: true });
    step(s, 12); await sleep(5);
    ok(st(s, 0).classList.contains('glow') && !st(s, 1).classList.contains('glow'), 'next station glows');
    const left = parseFloat(s.ui.querySelector('.conv-board').style.left);
    step(s, 20); await sleep(2); // 1초
    const W = s.ui.querySelector('.conv-belt').clientWidth;
    const moved = (parseFloat(s.ui.querySelector('.conv-board').style.left) - left) / (W - 96);
    ok(Math.abs(moved - 0.07) < 0.02, `belt at 0.7 speed (${moved.toFixed(3)} of the belt per second)`);
  } finally { s.done(); }
});

test('ch5-rhythm: a press on the beat on the right side moves the boat; the same side again turns it; off-beat does nothing', async () => {
  const s = touchSetup(S.speakers);
  try {
    const strokes = [], prog = [];
    let res = null;
    const p = rhythm(s.ctx, { beatSeconds: 1, windowSec: 0.25, strokes: 3, seconds: 30, scene: { stroke: (side, good) => strokes.push([side, good]), progress: v => prog.push(v) } }).then(r => { res = r; });
    const btn = side => s.ui.querySelector(`.row-btn[data-side="${side}"]`);
    step(s, 10); // t = 0.5, 박자(1.2초)에서 먼 때
    btn('left').click();
    eq(strokes.length, 0, 'off-beat press does nothing');
    step(s, 14); // t = 1.2: 첫 박자(왼쪽)
    eq(s.ctx.testHooks.rhythm.side, 'left');
    btn('left').click();
    step(s, 20); // t = 2.2: 둘째 박자(오른쪽)인데 또 왼쪽
    btn('left').click();
    step(s, 20); btn('right').click(); // t = 3.2: 셋째 박자는 왼쪽인데 오른쪽 → 같은 쪽 연달아가 아님(번갈아), 하지만 박자 쪽과 다름
    eq(strokes.map(x => x[1]), [true, false, false]);
    step(s, 20); btn('left').click(); // t = 4.2 넷째(오른쪽)
    step(s, 20); btn('left').click(); // t = 5.2 다섯째(왼쪽)
    for (let i = 0; i < 20 && !res; i++) { step(s, 1); await sleep(1); }
    await p;
    eq(res.ok, true); ok(res.made >= 3, `made ${res.made}`);
    ok(prog.every((v, i) => i === 0 || v >= prog[i - 1]), 'boat only moves forward');
  } finally { s.done(); }
});

test('ch5-rhythm: the window is ±0.25 s (easy ±0.4 s) and running out of time fails the leg', async () => {
  const s = touchSetup(S.speakers);
  try {
    let res = null;
    const p = rhythm(s.ctx, { beatSeconds: 1, windowSec: 0.25, strokes: 12, seconds: 3 }).then(r => { res = r; });
    step(s, 30); // t = 1.5: 박자 1.2에서 0.3초 늦음
    s.ui.querySelector('.row-btn[data-side="left"]').click();
    eq(s.ctx.testHooks.rhythm.made, 0, '0.3 s late is outside ±0.25');
    for (let i = 0; i < 60 && !res; i++) { step(s, 1); await sleep(1); }
    await p;
    eq(res.ok, false); eq(res.why, 'time');
    const s2 = touchSetup(S.speakers);
    try {
      rhythm(s2.ctx, { beatSeconds: 1.3, windowSec: 0.4, strokes: 12, seconds: 45, easy: true });
      step(s2, 31); // t = 1.55: 박자 1.2에서 0.35초 늦음(±0.4 안)
      s2.ui.querySelector('.row-btn[data-side="left"]').click();
      eq(s2.ctx.testHooks.rhythm.made, 1, 'easy window catches it');
    } finally { s2.done(); }
    eq([S.sambyeolcho.legs[0].beat, S.sambyeolcho.legs[0].window, S.sambyeolcho.legs[0].strokes, S.sambyeolcho.legs[0].seconds], [1, 0.25, 12, 30]);
    eq([S.sambyeolcho.easy.beat, S.sambyeolcho.easy.window, S.sambyeolcho.easy.seconds], [1.3, 0.4, 45]);
  } finally { s.done(); }
});

test('ch5: chapter minigame — two failed workshop waves turn on easy mode, only that wave is replayed; carving can be skipped', async () => {
  const s = touchSetup(S.speakers);
  let fails = 2;
  const say = s.dialogue.say; s.dialogue.say = l => { if (typeof l.text === 'string' && l.text.startsWith(M.failHint)) fails -= 1; return say(l); };
  const drive = setInterval(() => {
    if (s.dialogue.isOpen()) { if (!s.dialogue.isChoosing()) s.dialogue.advance(); return; }
    const start = [...s.ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (start) { start.click(); return; }
    const skip = s.ui.querySelector('.screen.carve-ask .skip'); if (skip) { skip.click(); return; }
    const c = s.ctx.testHooks.conveyor;
    if (c?.ready && !(s.ctx.testHooks.convWave === 0 && fails > 0)) st(s, c.answer)?.click();
    const r = s.ctx.testHooks.rhythm;
    if (r && Math.abs(r.dt) < 0.08) s.ui.querySelector(`.row-btn[data-side="${r.side}"]`)?.click();
    s.w.step(0.05, { x: 0, z: 0 });
  }, 4);
  try {
    ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    const r = await ch5.minigame(s.ctx);
    eq(r, { firstTryCorrect: 1, firstTryTotal: 2, easyModeUsed: true });
    eq(s.ctx.testHooks.convTries, [3, 1, 1], 'wave 1 played three times, the others once');
    eq(s.ctx.testHooks.rowTries, [1, 1]);
    ok(!s.ui.querySelector('.trace-board'), 'carving skipped');
  } finally { clearInterval(drive); s.done(); }
}, { timeout: 300000 });

test('ch5: script passes validation, required lines 7, no names or 81,258, "전해져요" on the passed-down method', async () => {
  eq(validateScript(S, SOURCES), []);
  const B = S.sambyeolcho;
  const required = [S.npc.artisan1, S.result, B.start, B.leader, B.jindo, B.jeju];
  eq(required.flat().length, 7);
  for (const g of required) ok(g.length <= 2);
  eq(S.speakers.baejungson.name, '삼별초 지휘관');
  ok(S.npc.artisan1[0].text.includes('전해져요') && S.npc.artisan1[0].text.includes('바닷물') && S.npc.artisan1[0].text.includes('소금물'));
  ok(M.howto.steps.some(t => t.includes('옻칠') && t.includes('전해져요')));
  ok(S.result[0].text.includes('8만 장이 넘는'));
  eq(S.quizzes.map(q => q.options[q.answer]), ['부처의 힘으로 몽골의 침입을 물리치려고', '강화도 → 진도 → 제주도']);
  const text = await (await fetch('../chapters/ch5/script.js')).text();
  for (const w of ['배중손', '김통정', '81,258', '승려 출신']) ok(!text.includes(w), w);
});

test('ch5: workshop, belt view and sea view each draw 500 pieces or fewer after baking', () => {
  const s = touchSetup(S.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    const a = drawPieces(s.w.scene); ok(a <= 500, `workshop ${a}`);
    sc.shelf(9);
    const b = drawPieces(s.w.scene); ok(b <= 500, `belt view ${b}`);
    sc.sea.show(true); sc.sea.setLeg(0);
    const c = drawPieces(s.w.scene); ok(c <= 500, `sea ${c}`);
  } finally { s.done(); }
});

test('ch5: resume at minigame stands in the workshop; resume at quiz shows Jeju at sea', () => {
  const s = touchSetup(S.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    s.w.player.position.set(5, 0, 5);
    ch5.enterStage(s.ctx, 'minigame');
    eq([s.w.player.position.x, s.w.player.position.z], sc.start);
    eq(sc.sea.root.visible, false);
    ch5.enterStage(s.ctx, 'quiz');
    eq(sc.sea.root.visible, true); eq(s.w.camMode, 'fixed'); eq(sc.library.visible, true);
  } finally { s.done(); }
});

const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
const inside = (r, w, h) => r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1;
test('layout: ch5 belt, six stations, oar buttons, hint and gauge fit and do not overlap', async () => {
  for (const kind of ['conveyor', 'rhythm']) for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = `./fit.html?kind=${kind}`; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.documentElement.dataset.ready; i++) await sleep(20);
      await sleep(150);
      const hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect();
      const btns = [...d.querySelectorAll(kind === 'conveyor' ? '.conv-st' : '.row-btn')];
      eq(btns.length, kind === 'conveyor' ? 6 : 2);
      const others = kind === 'conveyor' ? ['.conv-belt', '.conv-hint', '.ops-gauge'] : ['.row-pop'];
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        ok(inside(r, w, h), `${kind} ${w}x${h}: button outside`);
        ok(r.width >= 44 && r.height >= 44, `${kind} ${w}x${h}: button too small (${Math.round(r.width)}x${Math.round(r.height)})`);
        const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(top && (top === b || b.contains(top)), `${kind} ${w}x${h}: button covered`);
        ok(!overlap(r, hb), `${kind} ${w}x${h}: button overlaps the goal box`);
      }
      for (const sel of others) {
        const r = d.querySelector(sel).getBoundingClientRect();
        ok(inside(r, w, h), `${kind} ${w}x${h}: ${sel} outside`);
        ok(!overlap(r, hb), `${kind} ${w}x${h}: ${sel} overlaps the goal box`);
        for (const b of btns) ok(!overlap(r, b.getBoundingClientRect()), `${kind} ${w}x${h}: ${sel} overlaps a button`);
      }
    } finally { frame.remove(); }
  }
}, { timeout: 120000 });
