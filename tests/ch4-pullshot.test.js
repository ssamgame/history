// 고려 새 5장(장 id ch4) 「몽골의 침입과 처인성·충주성」과 새 놀이 부품 「당겨 쏘기」(chapters/kit/pullshot.js), 2026-10-26.
// 당긴 길이 → 힘, 힘이 모자라면 앞에 떨어짐, 조준선 옆 반경 안이면 맞음, 맞은 적은 물러남(쓰러지지 않음), 3명이 닿으면 실패,
// 쉬운 모드 값, 키보드, 두 번 실패하면 쉬운 모드와 그 무리만 다시, 대사·금지어, 그리기 조각 수, 화면 배치.
import { test, eq, ok } from './harness.js';
import { pullshot, PULL } from '../chapters/kit/pullshot.js';
import ch4Script from '../chapters/ch4/script.js';
import ch4, { WAVE_FIRST } from '../chapters/ch4/chapter.js';
import { touchSetup, sleep } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces } from '../core/figures.js';
import { validateScript } from '../core/content.js';
import { SOURCES } from '../content/sources.js';

const S = ch4Script;
const step = (s, n) => { for (let i = 0; i < n; i++) s.w.step(0.05, { x: 0, z: 0 }); };
// 장면을 짓고 당겨 쏘기 한 판을 연다
function start(s, wave, opts = {}) {
  const sc = ch4.buildScene(s.w, s.ctx), A = sc.areas.cheoin;
  let res = null;
  const p = pullshot(s.ctx, { field: { center: A.center, wallR: A.radius, spawnR: A.spawnR, bow: A.bow }, lanes: A.lanes, wave,
    enemies: sc.mongols.map(m => m.group), arrows: sc.arrows, texts: S.cheoin.texts, ...opts }).then(r => { res = r; });
  return { sc, p, get res() { return res; } };
}
// 활 단추를 눌러 (aim, 힘)으로 끌고 hold초 동안 당겼다가 놓는다
function drag(s, aim, power, hold = 0.7) {
  const pad = s.ui.querySelector('.pull-pad'), r = pad.getBoundingClientRect(), px = r.left + r.width / 2, py = r.top + r.height / 2;
  const L = power * PULL.pullPx, x = px - Math.sin(aim) * L, y = py + Math.cos(aim) * L;
  pad.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 5, bubbles: true, clientX: px, clientY: py }));
  window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 5, bubbles: true, clientX: x, clientY: y }));
  step(s, Math.ceil(hold / 0.05));
  window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, bubbles: true, clientX: x, clientY: y }));
}
const ONE = { lanes: [1], count: 1, speed: 0.4, gap: 1 };

test('ch4-pullshot: drag length is power, a weak shot falls short with a hint', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = start(s, ONE);
    step(s, 25);
    const h = s.ctx.testHooks.pullshot; ok(h && h.ready, 'a Mongol to aim at');
    drag(s, h.aim, 0.4);
    eq(s.ui.querySelector('.pull-hint').textContent, S.cheoin.texts.weak);
    step(s, 20);
    const m = g.sc.mongols.find(x => x.group.visible); ok(m, 'still walking');
    // 끝까지 당기면 맞고 물러난다
    drag(s, s.ctx.testHooks.pullshot.aim, 1);
    step(s, 20);
    let minRx = 0; for (let i = 0; i < 60 && !g.res; i++) { step(s, 1); minRx = Math.min(minRx, m.group.rotation.x); await sleep(0); }
    await g.p;
    eq(g.res.ok, true); eq(g.res.hits, 1); eq(g.res.breaches, 0);
    ok(minRx > -0.5, `flinches, does not fall (rx ${minRx.toFixed(2)})`);
  } finally { s.done(); }
});

test('ch4-pullshot: a shot far to the side misses; too short a pull does not shoot', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = start(s, ONE);
    step(s, 25);
    const aim = s.ctx.testHooks.pullshot.aim;
    drag(s, aim + 0.6, 1);
    step(s, 25);
    ok(g.sc.mongols.some(x => x.group.visible && x.group.rotation.x === 0), 'missed: still walking');
    drag(s, aim, 1, 0.2); // 0.5초보다 짧게
    ok(!g.sc.arrows.some(a => a.visible), 'no arrow for a too-short pull');
    drag(s, s.ctx.testHooks.pullshot.aim, 1);
    for (let i = 0; i < 80 && !g.res; i++) { step(s, 1); await sleep(0); }
    await g.p; eq(g.res.hits, 1);
  } finally { s.done(); }
});

test('ch4-pullshot: three Mongols reaching the wall fail the wave', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = start(s, { lanes: [0, 1, 2], count: 3, speed: 6, gap: 0.5 });
    for (let i = 0; i < 200 && !g.res; i++) { step(s, 1); await sleep(0); }
    await g.p;
    eq(g.res.ok, false); eq(g.res.why, 'breach'); eq(g.res.breaches, 3);
    ok(!s.ui.querySelector('.pull-pad'), 'pad removed');
  } finally { s.done(); }
});

test('ch4-pullshot: easy mode accepts a weaker pull and a wider aim', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = start(s, ONE, { easy: true });
    step(s, 25);
    drag(s, s.ctx.testHooks.pullshot.aim + 0.08, 0.45);
    for (let i = 0; i < 80 && !g.res; i++) { step(s, 1); await sleep(0); }
    await g.p;
    eq(g.res.hits, 1, 'hit with 45% power in easy mode');
    eq([PULL.easyRadius, PULL.easyPower, PULL.radius, PULL.minPower], [3, 0.4, 2, 0.6]);
  } finally { s.done(); }
});

test('ch4-pullshot: keyboard ← → aims, holding Space pulls and releasing shoots', async () => {
  const s = touchSetup(S.speakers);
  try {
    const g = start(s, ONE);
    step(s, 25);
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    key('keydown', 'Space'); step(s, 24); key('keyup', 'Space'); // 정면(가운데 갈래)으로 1.2초
    for (let i = 0; i < 80 && !g.res; i++) { step(s, 1); await sleep(0); }
    await g.p; eq(g.res.hits, 1);
  } finally { s.done(); }
});

test('ch4: chapter minigame — two failed waves turn on easy mode, only that wave is replayed', async () => {
  const s = touchSetup(S.speakers);
  let fails = 2;
  const drive = setInterval(() => {
    if (s.dialogue.isOpen()) { if (!s.dialogue.isChoosing()) s.dialogue.advance(); return; }
    const startBtn = [...s.ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (startBtn) { startBtn.click(); return; }
    const h = s.ctx.testHooks.pullshot, pad = s.ui.querySelector('.pull-pad');
    if (h && pad && !(s.ctx.testHooks.wave === 0 && fails > 0)) {
      const r = pad.getBoundingClientRect(), px = r.left + r.width / 2, py = r.top + r.height / 2, x = px - Math.sin(h.aim) * 140, y = py + Math.cos(h.aim) * 140;
      if (h.ready) pad.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 8, bubbles: true, clientX: px, clientY: py }));
      else if (h.pulling) { window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 8, bubbles: true, clientX: x, clientY: y })); if (h.held > 0.6) window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 8, bubbles: true, clientX: x, clientY: y })); }
    }
    s.w.step(0.1, { x: 0, z: 0 });
  }, 6);
  const say = s.dialogue.say; s.dialogue.say = l => { if (l.text === S.cheoin.failHint || l.text?.startsWith(S.cheoin.failHint)) fails -= 1; return say(l); };
  try {
    ch4.buildScene(s.w, s.ctx);
    ch4.enterStage(s.ctx, 'minigame');
    const r = await ch4.minigame(s.ctx);
    eq(r, { firstTryCorrect: 2, firstTryTotal: 2, easyModeUsed: true });
    eq(s.ctx.testHooks.waveTries, [3, 1, 1], 'wave 1 played three times, the others once');
    eq(WAVE_FIRST(3), 2); eq(WAVE_FIRST(1), 1);
  } finally { clearInterval(drive); s.done(); }
}, { timeout: 240000 });

test('ch4: script passes validation, required lines 7 or fewer, 김윤후 is a monk and not a commander', async () => {
  eq(validateScript(S, SOURCES), []);
  const required = [S.jeogo.after, S.npc.minister.first, S.cheoin.done, S.chungju];
  eq(required.flat().length, 7);
  for (const g of required) ok(g.length <= 2, 'two lines at a time');
  ok(S.jeogo.after[0].text.includes('누가 죽였는지는 끝내 밝혀지지 않았어요'), 'culprit stays unknown');
  eq(S.speakers.monk.name, '승려');
  eq(S.cheoin.intro[1].text, '함께 이 성을 지켜 봅시다.');
  ok(S.capital.done[0].text.startsWith(S.capital.year), 'map caption year');
  eq(S.capital.reason, undefined, 'no picking on the map');
  const text = await (await fetch('../chapters/ch4/script.js')).text();
  for (const w of ['승병', '승려 출신', '김윤후 장군', '쏘아라']) ok(!text.includes(w), w);
});

test('ch4: cheoin lane view draws 500 pieces or fewer after baking', () => {
  const s = touchSetup(S.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    const f = sc.areas.cheoin.fit; s.w.fitFixedCamera(f.target, f.dir, f.points);
    for (const m of sc.mongols) m.group.visible = true;
    for (const a of sc.archers) a.group.visible = true;
    const n = drawPieces(s.w.scene); ok(n <= 500, `pieces ${n}`);
  } finally { s.done(); }
});

const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
test('layout: ch4 pull pad, power bar and gauge fit and do not overlap', async () => {
  for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=pullshot'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.pull-pad'); i++) await sleep(20);
      await sleep(80);
      const pad = d.querySelector('.pull-pad').getBoundingClientRect(), bar = d.querySelector('.pull-power').getBoundingClientRect(), hint = d.querySelector('.pull-hint').getBoundingClientRect();
      const hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect(), gauge = d.querySelector('.ops-gauge').getBoundingClientRect();
      for (const [n, r] of [['pad', pad], ['bar', bar], ['hint', hint], ['gauge', gauge]]) ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${w}x${h}: ${n} outside`);
      ok(pad.width >= 44 && pad.height >= 44, `${w}x${h}: pad too small`);
      const top = d.elementFromPoint(pad.left + pad.width / 2, pad.top + pad.height / 2);
      ok(top && (top.closest('.pull-pad')), `${w}x${h}: pad covered`);
      for (const [n, r] of [['pad', pad], ['bar', bar], ['hint', hint]]) { ok(!overlap(r, hb), `${w}x${h}: ${n} overlaps the goal box`); ok(!overlap(r, gauge), `${w}x${h}: ${n} overlaps the gauge`); }
      ok(!overlap(gauge, hb), `${w}x${h}: gauge overlaps the goal box`);
      ok(!overlap(hint, pad) && !overlap(bar, pad), `${w}x${h}: hint or bar on the pad`);
    } finally { frame.remove(); }
  }
}, { timeout: 90000 });
