// 고려 3장 「강감찬과 귀주 대첩」(2026-10-26 새로 만들기)과 새 놀이 부품 둘:
// 둑 수위 조절(chapters/kit/damflow.js: 누르고 있으면 물이 차오르고 떼면 둑이 터진다)과 귀주 신호(chapters/kit/signal.js: 두 신호가 같이 켜질 때 공격).
// 판정표·넘침·쉬운 모드·키보드·누르기, 장 안의 다시 하기와 쉬워짐, 꼭 듣는 대사 수, 그리기 조각 수, 이어하기, 화면 배치, 1장 성채 표시.
import { test, eq, ok } from './harness.js';
import { damflow } from '../chapters/kit/damflow.js';
import { signal } from '../chapters/kit/signal.js';
import ch3Script from '../chapters/ch3/script.js';
import ch3, { DAM_WINDOW, DAM_LEVEL, CROSS_SECONDS } from '../chapters/ch3/chapter.js';
import { touchSetup, sleep } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces } from '../core/figures.js';
import { castleMarker } from '../chapters/goryeo/set.js';
import { buildCh1Scene } from '../chapters/ch1/scene.js';
import { testWorld } from './bot.js';

const key = (type, code = 'Space') => window.dispatchEvent(new KeyboardEvent(type, { code, key: ' ' }));
// 시간표대로 누르기·떼기: plan = [[초, 'down'|'up'], ...]
async function runDam(s, opts, plan, total = 14) {
  let res = null;
  const p = damflow(s.ctx, { window: DAM_WINDOW.normal, easyWindow: DAM_WINDOW.easy, crossSeconds: 12, minLevel: 2 / 3, easyMinLevel: 1 / 3, ...opts }).then(r => { res = r; });
  await sleep(5);
  const todo = [...plan];
  for (let t = 0; t < total && !res; t += 0.05) {
    while (todo.length && todo[0][0] <= t + 1e-9) { const [, a] = todo.shift(); key(a === 'down' ? 'keydown' : 'keyup'); }
    s.w.step(0.05, { x: 0, z: 0 });
  }
  await p;
  return res;
}

test('ch3-damflow: holding fills the water, releasing in the window with enough water bursts the dam', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const seen = { cross: [], level: [] };
    const scene = { cross: k => seen.cross.push(k), level: v => seen.level.push(v) };
    const r = await runDam(s, { scene }, [[4, 'down'], [7.5, 'up']]);
    eq(r.ok, true, JSON.stringify(r));
    ok(Math.max(...seen.level) > 0.8 && Math.max(...seen.level) < 0.95, `level ${Math.max(...seen.level)}`);
    ok(seen.cross.at(-1) > 0.6 && seen.cross.at(-1) < 0.66, 'army in the middle when released');
    ok(!s.ui.querySelector('.dam-btn') && !s.ui.querySelector('.dam-meter'), 'cleaned up');
  } finally { s.done(); }
});

test('ch3-damflow: early, low water, late and overflow each fail with their reason', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    eq((await runDam(s, {}, [[1, 'down'], [4, 'up']])).why, 'early');
    eq((await runDam(s, {}, [[6.5, 'down'], [7.5, 'up']])).why, 'low');
    eq((await runDam(s, {}, [])).why, 'late');
    eq((await runDam(s, {}, [[10.5, 'down'], [12.5, 'up']])).why, 'late');
    const o = await runDam(s, {}, [[0.2, 'down']]);
    eq(o.why, 'overflow');
    key('keyup');
  } finally { s.done(); }
});

test('ch3-damflow: easy mode widens the window, lowers the needed water and blinks the goal mark', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    eq((await runDam(s, {}, [[5.6, 'down'], [6.9, 'up']])).why, 'low', 'normal: not enough water');
    let blink = false;
    const p = runDam(s, { easy: true }, [[5.4, 'down'], [6.9, 'up']]);
    await sleep(2); blink = !!s.ui.querySelector('.dam-meter .goal.blink');
    const r = await p;
    eq(r.ok, true, JSON.stringify(r));
    ok(blink, 'goal mark blinks in easy mode');
  } finally { s.done(); }
});

test('ch3-damflow: the big button works by touch (press and lift)', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    let res = null;
    damflow(s.ctx, { window: DAM_WINDOW.normal, crossSeconds: 12, minLevel: 2 / 3 }).then(r => { res = r; });
    await sleep(5);
    const b = s.ui.querySelector('.dam-btn');
    ok(b && b.textContent.includes('물 모으기'), 'button');
    const ev = type => b.dispatchEvent(new PointerEvent(type, { pointerId: 5, bubbles: true }));
    for (let t = 0; t < 4; t += 0.05) s.w.step(0.05, { x: 0, z: 0 });
    ev('pointerdown');
    ok(b.classList.contains('down'), 'pressed look');
    for (let t = 0; t < 3.5; t += 0.05) s.w.step(0.05, { x: 0, z: 0 });
    ev('pointerup');
    await sleep(5);
    eq(res && res.ok, true);
  } finally { s.done(); }
});

async function runSignal(s, opts, pressAt, total = 12) {
  let res = null;
  const on = [];
  const p = signal(s.ctx, { lights: [{ label: '지원군', at: 2 }, { label: '깃발', at: 3.2 }], open: 3, easyOpen: 5, scene: { on: i => on.push(i) }, ...opts }).then(r => { res = r; });
  await sleep(5);
  for (let t = 0; t < total && !res; t += 0.05) {
    if (pressAt != null && t >= pressAt) { pressAt = null; s.ui.querySelector('.signal-btn')?.click(); }
    s.w.step(0.05, { x: 0, z: 0 });
  }
  await p;
  return { ...res, on };
}

test('ch3-signal: only when both signals are lit does the attack signal succeed', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    eq((await runSignal(s, {}, 1)).why, 'early');
    eq((await runSignal(s, {}, 2.6)).why, 'one');
    const good = await runSignal(s, {}, 3.6);
    eq(good.ok, true); eq(good.on, [0, 1], 'scene told when each light turns on');
    eq((await runSignal(s, {}, null)).why, 'late');
    eq((await runSignal(s, {}, 7.4)).why, 'late', 'normal: open 3 s');
    eq((await runSignal(s, { easy: true }, 7.4)).ok, true, 'easy: open 5 s');
  } finally { s.done(); }
});

test('ch3-signal: two lights on screen, and the space key sends the signal', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    let res = null;
    const p = signal(s.ctx, { lights: [{ label: '지원군', at: 0.2 }, { label: '깃발', at: 0.4 }], open: 3 }).then(r => { res = r; });
    await sleep(5);
    eq([...s.ui.querySelectorAll('.signal-light')].map(l => l.textContent.trim()), ['지원군', '깃발']);
    for (let t = 0; t < 1; t += 0.05) s.w.step(0.05, { x: 0, z: 0 });
    eq(s.ui.querySelectorAll('.signal-light.on').length, 2);
    eq(s.ctx.testHooks.signalReady, true);
    key('keydown');
    await p;
    eq(res.ok, true);
  } finally { s.done(); }
});

// 장 안에서: 둑을 두 번 일찍 터뜨리면 세 번째부터 쉬워지고, 첫 시도 수를 놀이마다 센다
test('ch3-damflow: chapter minigame — two failed dams turn on easy mode', async () => {
  const s = touchSetup(ch3Script.speakers);
  let early = 2, held = false, upAt = 0;
  const drive = setInterval(() => {
    if (s.dialogue.isOpen()) { if (!s.dialogue.isChoosing()) s.dialogue.advance(); return; }
    const start = [...s.ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (start) { start.click(); return; }
    const d = s.ctx.testHooks.dam;
    if (d) {
      if (!held && (early > 0 || d.press)) { key('keydown'); held = true; upAt = early > 0 ? 3 : 0; if (early > 0) early -= 1; }
      else if (held && upAt > 0) { upAt -= 1; if (!upAt) { key('keyup'); held = false; } }
      else if (held && d.release) { key('keyup'); held = false; }
    } else if (held) { key('keyup'); held = false; }
    if (s.ctx.testHooks.signalReady) s.ui.querySelector('.signal-btn')?.click();
    s.w.step(0.05, { x: 0, z: 0 });
  }, 10);
  try {
    ch3.buildScene(s.w, s.ctx);
    ch3.enterStage(s.ctx, 'minigame');
    const r = await ch3.minigame(s.ctx);
    eq(r, { firstTryCorrect: 1, firstTryTotal: 2, easyModeUsed: true });
    eq(s.ctx.testHooks.damEasy, [false, false, true]);
  } finally { clearInterval(drive); s.done(); }
}, { timeout: 150000 });

test('ch3-damflow: required lines are 7 or fewer, shortened lines keep their sources, the dam and Guju stay separate', () => {
  const S = ch3Script, n = S.npc;
  eq(S.start, undefined); eq(S.hides.built, undefined); eq(S.guju.intro, undefined);
  const required = [n.gangamchan.first, n.soldier.first, S.dam.done, S.guju.charge, S.guju.done, S.result];
  eq(required.flat().length, 7);
  eq(n.gangamchan.first, [{ who: 'gangamchan', text: '적이 반드시 이 냇물을 건널 것이다. 쇠가죽을 꿰어 물을 막아 두어라.', src: ['S3', 'S5'] }]);
  eq(n.soldier.first.map(l => l.text), ['쇠가죽을 모아 오라는 명령이야!']);
  for (const l of [n.gangamchan.first, n.gangamchan.later, n.soldier.first, n.soldier.later, n.soldier.tooEarly, S.guju.charge].flat()) ok([...l.text].length <= 46, l.text);
  eq(S.dam.done[0].src, ['S3']); eq(S.guju.done[0].src, ['S5']);
  ok(![S.dam.done, S.guju.done].flat().some(l => /귀주/.test(l.text) && /냇물|둑/.test(l.text)), 'the dam and Guju are not one event');
  eq(S.goals[5].includes('귀주 벌판'), true);
  eq(CROSS_SECONDS, 12); eq(DAM_LEVEL, { normal: 2 / 3, easy: 1 / 3 });
});

test('ch3-damflow: explore, dam and Guju views draw 500 pieces or fewer after baking', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    ok(!sc.river.army.visible && !sc.guju.visible, 'army and Guju field hidden while exploring');
    const a = drawPieces(s.w.scene); ok(a <= 500, `explore ${a}`);
    sc.damWall.visible = true; sc.river.army.visible = true;
    const b = drawPieces(s.w.scene); ok(b <= 500, `dam ${b}`);
    sc.river.army.visible = false; sc.guju.visible = true; sc.reinforcements.visible = true; sc.dust.forEach(d => { d.visible = true; });
    const c = drawPieces(s.w.scene); ok(c <= 500, `guju ${c}`);
  } finally { s.done(); }
});

test('ch3-damflow: resume at the minigame stage has the hides built into the dam', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ch3.enterStage(s.ctx, 'minigame');
    ok(sc.hides.every(h => h.taken && !h.mesh.visible), 'hides gathered');
    eq(sc.damWall.visible, true);
    eq(sc.river.army.visible, false);
  } finally { s.done(); }
});

test('ch3-damflow: chapter 1 Gangdong markers are small castles that rise from the ground', () => {
  const m = castleMarker({ flagColor: 0xb8452f });
  eq(m.name, 'castleMarker');
  const w = testWorld();
  try {
    const sc = buildCh1Scene(w);
    const marks = sc.gangdongPillars.children.filter(c => c.name === 'castleMarker');
    eq(marks.length, 6);
    eq(sc.gangdongPillars.children.filter(c => c.isSprite).length, 6);
    ok(!sc.gangdongPillars.children.some(c => c.isMesh && c.material.transparent), 'no see-through light columns');
    sc.pillars[0].set(0.5); ok(Math.abs(marks[0].scale.y - 0.5) < 1e-6, 'rises');
    sc.pillars[0].set(1); ok(sc.gangdongPillars.children.filter(c => c.isSprite)[0].visible, 'name shows when built');
  } finally { w.dispose(); }
});

// 둑 단추·물 높이 막대, 신호 표시·공격 단추가 화면 크기마다 화면 안에 들고, 손가락 크기이고, 목표 상자와 겹치지 않는다
const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
test('layout: ch3 dam button and water meter, signal lights and button fit and do not overlap', async () => {
  for (const kind of ['damflow', 'signal']) for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = `./fit.html?kind=${kind}`; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument, sel = kind === 'damflow' ? ['.dam-btn', '.dam-meter'] : ['.signal-btn', '.signal-lights'];
      for (let i = 0; i < 100 && !d.querySelector(sel[0]); i++) await sleep(20);
      await sleep(60);
      const b = d.querySelector(sel[0]).getBoundingClientRect(), m = d.querySelector(sel[1]).getBoundingClientRect(), hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect();
      for (const [n, r] of [['button', b], ['panel', m]]) ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${kind} ${w}x${h}: ${n} outside`);
      ok(b.height >= 44 && b.width >= 44, `${kind} ${w}x${h}: button too small`);
      const top = d.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2), btn = d.querySelector(sel[0]);
      ok(top && (top === btn || btn.contains(top)), `${kind} ${w}x${h}: button covered`);
      ok(!overlap(b, m), `${kind} ${w}x${h}: button overlaps the panel`);
      ok(!overlap(m, hb), `${kind} ${w}x${h}: panel overlaps the goal box`);
      ok(!overlap(b, hb), `${kind} ${w}x${h}: button overlaps the goal box`);
    } finally { frame.remove(); }
  }
}, { timeout: 90000 });
