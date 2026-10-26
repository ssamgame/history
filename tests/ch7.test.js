// 고려 새 4장 「윤관과 별무반」(장 id ch7, 2026-10-26, docs/superpowers/specs/2026-10-26-ch7-spec.md)과 새 놀이 부품 「별무반 갈림길」(chapters/kit/switch.js).
// 아직 장 목록(chapters/index.js)에 넣지 않았으므로 모듈을 직접 불러 시험한다(목록 등록은 고려편 5·6장 구성 변경 때).
// 판정표·틀리면 힌트와 같은 사람 다시·두 번 틀리면 그 무리만 다시·두 번 실패하면 쉬운 모드·키보드·끌어 놓기, 대사·금지어,
// 그리기 조각 수, 이어하기, 터치만으로 끝까지, 화면 배치, 새 인물·말 모양.
import { test, eq, ok } from './harness.js';
import { switchLanes } from '../chapters/kit/switch.js';
import ch7Script from '../chapters/ch7/script.js';
import ch7, { PREVIEW_META, WAVE_FIRST } from '../chapters/ch7/chapter.js';
import { touchSetup, touchBot, memSave, sleep, testWorld } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces, makeFigure } from '../core/figures.js';
import { horse } from '../chapters/goryeo/set.js';
import { runChapter } from '../core/flow.js';
import { validateScript } from '../core/content.js';
import { SOURCES } from '../content/sources.js';
import { LOOKS } from '../content/characters.js';

const S = ch7Script, rule = S.switch.rule;
const LANES = S.switch.lanes;
const keyDown = code => window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code.slice(-1) }));
const laneBtn = (s, id) => s.ui.querySelector(`.switch-lane[data-lane="${id}"]`);

// 한 무리를 돌린다: picks[i] = 그 사람에게 차례로 고를 길(정답이 아니면 틀린 고르기)
async function runWave(s, people, picks, opts = {}) {
  let res = null;
  const sent = [], wrongSeen = [];
  const p = switchLanes(s.ctx, { lanes: LANES, people, rule, hints: S.switch.hints, scene: { send: (i, lane) => { sent.push([i, lane]); }, wrong: i => wrongSeen.push(i) }, ...opts }).then(r => { res = r; });
  const todo = picks.map(a => [...a]);
  for (let n = 0; n < 400 && !res; n++) {
    const h = s.ctx.testHooks.lanes;
    if (h && h.ready) {
      const lane = todo[h.index]?.length ? todo[h.index].shift() : h.answer;
      laneBtn(s, lane).click();
    }
    s.w.step(0.05, { x: 0, z: 0 });
    await sleep(1);
  }
  await p;
  return { ...res, sent, wrongSeen };
}

test('ch7-switch: horse → 신기군, monk → 항마군, everyone else → 신보군 (rule kept as data in the script)', () => {
  eq(rule({ horse: true }), 'cav');
  eq(rule({ horse: true, official: true }), 'cav', 'a well-dressed rider is 신기군 too (horse, not rank)');
  eq(rule({ monk: true }), 'monk');
  eq(rule({}), 'inf');
  eq(rule({ official: true }), 'inf');
  eq(LANES.map(l => [l.id, l.label]), [['cav', '신기군'], ['inf', '신보군'], ['monk', '항마군']]);
  // 무리마다 사람 수와 사람 표가 판정표와 맞는다
  eq(S.switch.waves.map(w => w.people.length), [4, 6, 8]);
  eq(S.switch.waves[2].gap, 3);
  for (const w of S.switch.waves) for (const p of w.people) ok(['leader', 'rider', 'official', 'youth', 'monk', 'farmer'].includes(p.kind), p.kind);
  const w1 = S.switch.waves[0].people.map(rule).sort();
  eq(w1, ['cav', 'inf', 'inf', 'monk'], 'wave 1: one of each look, easy to tell apart');
  ok(S.switch.waves[1].people.some(p => p.kind === 'rider' && p.official && p.horse), 'wave 2: an official on a horse');
  ok(S.switch.waves[1].people.some(p => p.kind === 'leader' && p.horse && !p.official), 'wave 2: a commoner leading a horse');
});

test('ch7-switch: right lane counts up, wrong lane gives a hint and the same person again, two wrong picks fail the wave', async () => {
  const s = touchSetup(S.speakers);
  try {
    const people = S.switch.waves[0].people;
    const said = [];
    const good = await runWave(s, people, []);
    eq(good.ok, true); eq(good.wrong, 0);
    eq(good.counts, { cav: 1, inf: 2, monk: 1 });
    eq(good.sent.map(([i]) => i), [0, 1, 2, 3]);
    // 첫 사람(말 끄는 사람)에게 한 번 틀리고 다시 맞힌다
    const i0 = people.findIndex(p => p.horse);
    const one = await runWave(s, people, people.map((p, i) => (i === i0 ? ['inf'] : [])));
    eq(one.ok, true); eq(one.wrong, 1); eq(one.wrong === 1 && one.sent.length, 4);
    eq(one.wrongs, [i0], 'the same person was asked again');
    // 두 번 틀리면 그 무리는 실패
    const bad = await runWave(s, people, [['monk'], ['cav']]);
    eq(bad.ok, false); eq(bad.wrong, 2);
    said.push(...[...s.ui.querySelectorAll('.switch-hint')].map(e => e.textContent));
    eq(said.length, 0, 'panel is gone after the wave');
  } finally { s.done(); }
});

test('ch7-switch: hint names the clue for the right lane', async () => {
  const s = touchSetup(S.speakers);
  try {
    const people = [{ kind: 'monk', monk: true }, { kind: 'youth' }];
    let res = null;
    const p = switchLanes(s.ctx, { lanes: LANES, people, rule, hints: S.switch.hints }).then(r => { res = r; });
    for (let n = 0; n < 20 && !s.ctx.testHooks.lanes?.ready; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    laneBtn(s, 'inf').click();
    await sleep(5);
    eq(s.ui.querySelector('.switch-hint').textContent, S.switch.hints.monk);
    laneBtn(s, 'monk').click();
    for (let n = 0; n < 40 && !s.ctx.testHooks.lanes?.ready; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    laneBtn(s, 'inf').click();
    for (let n = 0; n < 40 && !res; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    await p;
    eq(res.ok, true); eq(res.wrong, 1);
  } finally { s.done(); }
});

test('ch7-switch: keyboard 1 · 2 · 3 picks the lane, and dragging the person card onto a lane works too', async () => {
  const s = touchSetup(S.speakers);
  try {
    const people = [{ kind: 'leader', horse: true }, { kind: 'youth' }, { kind: 'monk', monk: true }];
    let res = null;
    const p = switchLanes(s.ctx, { lanes: LANES, people, rule, hints: S.switch.hints }).then(r => { res = r; });
    const waitReady = async () => { for (let n = 0; n < 60 && !s.ctx.testHooks.lanes?.ready; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); } };
    await waitReady(); keyDown('Digit1');
    await waitReady(); keyDown('Digit2');
    await waitReady();
    // 끌어 놓기: 사람 카드를 눌러 항마군 단추 위에서 놓는다
    const card = s.ui.querySelector('.switch-who'), b = laneBtn(s, 'monk').getBoundingClientRect(), c = card.getBoundingClientRect();
    card.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, bubbles: true, clientX: c.left + 5, clientY: c.top + 5 }));
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }));
    for (let n = 0; n < 60 && !res; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    await p;
    eq(res.ok, true); eq(res.wrong, 0); eq(res.counts, { cav: 1, inf: 1, monk: 1 });
  } finally { s.done(); }
});

test('ch7-switch: easy mode dims one wrong lane and makes the clue blink', async () => {
  const s = touchSetup(S.speakers);
  try {
    const p = switchLanes(s.ctx, { lanes: LANES, people: [{ kind: 'leader', horse: true }], rule, hints: S.switch.hints, easy: true });
    for (let n = 0; n < 20 && !s.ctx.testHooks.lanes?.ready; n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    const dim = [...s.ui.querySelectorAll('.switch-lane.dim')];
    eq(dim.length, 1); ok(dim[0].dataset.lane !== 'cav' && dim[0].disabled, 'a wrong lane is dimmed');
    ok(s.ui.querySelector('.switch-who .clue.blink'), 'horse clue blinks');
    laneBtn(s, 'cav').click();
    for (let n = 0; n < 40 && s.ui.querySelector('.switch-lanes'); n++) { s.w.step(0.05, { x: 0, z: 0 }); await sleep(1); }
    eq((await p).ok, true);
  } finally { s.done(); }
});

test('ch7-switch: wave 3 people arrive every few seconds and wait in a line (missing one is not a failure)', async () => {
  const s = touchSetup(S.speakers);
  try {
    const lines = [];
    let res = null;
    const people = S.switch.waves[2].people;
    const p = switchLanes(s.ctx, { lanes: LANES, people, rule, hints: S.switch.hints, gap: 3, scene: { line: q => lines.push(q.length) } }).then(r => { res = r; });
    for (let t = 0; t < 10; t += 0.05) { s.w.step(0.05, { x: 0, z: 0 }); }
    await sleep(5);
    ok(Math.max(...lines) >= 4, `line grows while nobody is sent (${Math.max(...lines)})`);
    ok(!res, 'nobody lost');
    for (let n = 0; n < 400 && !res; n++) {
      const h = s.ctx.testHooks.lanes; if (h?.ready) laneBtn(s, h.answer).click();
      s.w.step(0.05, { x: 0, z: 0 }); await sleep(1);
    }
    await p;
    eq(res.ok, true); eq(res.wrong, 0);
  } finally { s.done(); }
});

// 장 안에서: 1무리를 두 번 실패하면 그 무리만 다시, 세 번째부터 쉬운 모드. 첫 시도는 무리 셋 가운데 틀림 없이 끝낸 무리 수(2 이상이면 2)
test('ch7: chapter minigame — two failed waves turn on easy mode, only that wave is replayed', async () => {
  const s = touchSetup(S.speakers);
  let failWaves = 2; const easySeen = [];
  const drive = setInterval(() => {
    if (s.dialogue.isOpen()) { if (!s.dialogue.isChoosing()) s.dialogue.advance(); return; }
    const start = [...s.ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (start) { start.click(); return; }
    const h = s.ctx.testHooks.lanes;
    if (h?.ready) {
      if (h.wave === 0 && failWaves > 0) { const wrong = LANES.find(l => l.id !== h.answer && !laneBtn(s, l.id).disabled); laneBtn(s, wrong.id).click(); if (h.wrongNow === 1) failWaves -= 1; }
      else laneBtn(s, h.answer).click();
      if (!easySeen.includes(`${h.wave}:${h.easy}`)) easySeen.push(`${h.wave}:${h.easy}`);
    }
    s.w.step(0.05, { x: 0, z: 0 });
  }, 8);
  try {
    ch7.buildScene(s.w, s.ctx);
    ch7.enterStage(s.ctx, 'minigame');
    const r = await ch7.minigame(s.ctx);
    eq(r, { firstTryCorrect: 2, firstTryTotal: 2, easyModeUsed: true });
    eq(s.ctx.testHooks.waveTries, [3, 1, 1], 'wave 1 played three times, the others once');
    ok(easySeen.includes('0:true') && easySeen.includes('2:true'), 'easy mode stays on after it starts');
    eq(WAVE_FIRST(1), 1); eq(WAVE_FIRST(0), 0); eq(WAVE_FIRST(3), 2);
  } finally { clearInterval(drive); s.done(); }
}, { timeout: 150000 });

test('ch7: script passes validation, uses only S71 · S72 for 윤관 facts, required lines 7 or fewer', () => {
  eq(validateScript(S, SOURCES), []);
  const required = [S.intro, S.npc.yungwan.first, S.switch.before, S.march, S.result];
  const n = required.flat().length;
  ok(n <= 7, `required lines ${n}`);
  for (const group of required) ok(group.length <= 2, 'two lines at a time');
  const facts = required.flat().filter(l => l.src);
  ok(facts.length >= 5, 'facts are in the body now');
  for (const l of facts) ok(l.src.every(id => ['S71', 'S72'].includes(id)), l.text);
  eq(S.quizzes.map(q => q.question), ['윤관의 건의로 만든 새 군대는?', '1107년 윤관이 쌓은 것은?']);
  eq(S.quizzes.map(q => q.options[q.answer]), ['별무반', '동북 9성']);
  eq(S.quizzes.map(q => q.src), [['S71'], ['S72']]);
  eq(S.PENDING, undefined, 'no placeholder block left');
  for (const h of Object.values(S.switch.hints)) ok([...h].length <= 30, h);
});

test('ch7: no forbidden words (9성 names, numbers of troops, reasons, "윤관 장군") in the chapter files', async () => {
  const banned = ['윤관 장군', '함주', '영주', '웅주', '복주', '길주', '공험진', '숭녕', '통태', '진양', '선춘령', '17만', '20만', '모함', '오연총', '불화살', '피를'];
  for (const f of ['script.js', 'chapter.js', 'scene.js']) {
    const text = await (await fetch(`../chapters/ch7/${f}`)).text();
    for (const w of banned) ok(!text.includes(w), `${f}: ${w}`);
  }
});

test('ch7: new looks — 윤관 (official cap, no sword) and 여진 병사 (fur hat, different color from 거란)', () => {
  ok(LOOKS.yungwan && LOOKS.yungwan.face && !LOOKS.yungwan.gear, '윤관 has no weapon');
  eq(LOOKS.yungwan.face.eyes, 'stern');
  ok(LOOKS.jurchen && LOOKS.jurchen.hat === 'fur', '여진 병사 fur hat covers the hair');
  ok(LOOKS.jurchen.robe !== LOOKS.khitan.robe && LOOKS.jurchen.robe !== LOOKS.khitanBright.robe, 'not the 거란 color');
  for (const id of ['draftee', 'drafteeLeader']) ok(LOOKS[id] && LOOKS[id].face, id);
  for (const [id, sp] of Object.entries(S.speakers)) if (id !== 'guide') ok(sp.look && LOOKS[sp.look], `${id} → ${sp.look}`);
  const f = makeFigure({ ...LOOKS.jurchen, job: 'jurchen' });
  ok(f.getObjectByName('face'), 'face shows under the hat');
});

test('ch7: horse() is a low-poly prop in two colors, drawn in a few pieces', () => {
  const a = horse(), b = horse({ color: 0x8a8178 });
  eq(a.name, 'horse');
  let n = 0; a.traverse(o => { if (o.isMesh) n += 1; });
  ok(n <= 4, `horse pieces ${n}`);
  const box = { min: Infinity, max: -Infinity }; a.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); box.max = Math.max(box.max, o.geometry.boundingBox.max.y); } });
  ok(box.max > 1.8 && box.max < 3, `horse height ${box.max}`);
  ok(a.children[0].material.color.getHex() !== b.children[0].material.color.getHex(), 'two colors');
});

test('ch7: explore and the busiest lane view draw 500 pieces or fewer after baking', async () => {
  const s = touchSetup(S.speakers);
  try {
    const sc = ch7.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    const a = drawPieces(s.w.scene); ok(a <= 500, `explore ${a}`);
    sc.field.visible = false;
    sc.setTroops({ cav: 9, inf: 9, monk: 9 });
    sc.prepare(S.switch.waves[2].people); sc.line([0, 1, 2, 3, 4, 5, 6, 7]);
    const b = drawPieces(s.w.scene); ok(b <= 500, `lanes ${b}`);
    sc.prepare([]); sc.castles.visible = true; sc.marchers.visible = true;
    const c = drawPieces(s.w.scene); ok(c <= 500, `castles ${c}`);
  } finally { s.done(); }
});

test('ch7: resume at minigame stands at the fork; resume at quiz shows the nine castles', () => {
  const s = touchSetup(S.speakers);
  try {
    const sc = ch7.buildScene(s.w, s.ctx);
    ch7.enterStage(s.ctx, 'minigame');
    ok(Math.hypot(s.w.player.position.x - sc.fork.x, s.w.player.position.z - sc.fork.z) < 4, 'player at the fork');
    eq(sc.field.visible, false, 'the opening field is put away');
    ch7.enterStage(s.ctx, 'quiz');
    eq(sc.castles.visible, true);
    eq(sc.castles.children.filter(c => c.name === 'castleMarker').length, 9);
    ok(sc.castles.children.every(c => !c.isSprite), 'castles have no name labels');
  } finally { s.done(); }
});

test('ch7: completes with touch-only actions (module loaded directly, not in the chapter list)', async () => {
  const s = touchSetup(S.speakers);
  const answers = new Set(S.quizzes.map(q => q.options[q.answer]));
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(PREVIEW_META, ch7, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
    eq(r.easyModeUsed, false);
    ok(bot.taps >= 1, 'talked to 윤관 through the touch button');
    ok(!s.ui.querySelector('.switch-lanes'), 'lane buttons are gone');
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

// 길 단추 셋·사람 카드·진행 막대가 화면 크기마다 화면 안에 들고, 손가락 크기이고, 목표 상자·막대와 겹치지 않는다
const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
test('layout: ch7 lane buttons, person card and progress bar fit and do not overlap', async () => {
  for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=switch'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.switch-lane'); i++) await sleep(20);
      await sleep(80);
      const btns = [...d.querySelectorAll('.switch-lane')], who = d.querySelector('.switch-who').getBoundingClientRect();
      const hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect(), gauge = d.querySelector('.ops-gauge, .gauge')?.getBoundingClientRect();
      eq(btns.length, 3);
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${w}x${h}: lane ${b.dataset.lane} outside`);
        ok(r.height >= 44 && r.width >= 44, `${w}x${h}: lane ${b.dataset.lane} too small`);
        const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(top && (top === b || b.contains(top)), `${w}x${h}: lane ${b.dataset.lane} covered`);
        ok(!overlap(r, hb), `${w}x${h}: lane overlaps the goal box`);
        if (gauge) ok(!overlap(r, gauge), `${w}x${h}: lane overlaps the progress bar`);
      }
      ok(who.top >= -1 && who.bottom <= h + 1 && who.left >= -1 && who.right <= w + 1, `${w}x${h}: person card outside`);
      ok(!overlap(who, hb), `${w}x${h}: person card overlaps the goal box`);
      if (gauge) { ok(!overlap(gauge, hb), `${w}x${h}: bar overlaps the goal box`); ok(!overlap(who, gauge), `${w}x${h}: person card overlaps the bar`); }
    } finally { frame.remove(); }
  }
}, { timeout: 90000 });
