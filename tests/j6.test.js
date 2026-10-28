import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j6Script from '../chapters/joseon/j6/script.js';
import { buildJ6Scene, GAPS } from '../chapters/joseon/j6/scene.js';
import j6, { yardTalk, tryPulleys } from '../chapters/joseon/j6/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON, SESSIONS, isSessionDone } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave, sleep } from './bot.js';

const answers = new Set(j6Script.quizzes.map(q => q.options[q.answer]));

// 길게 누르기·끌기 도우미(J-05·J-06): 봇은 짧게 누르기만 하므로, 놀이가 ctx.testHooks.hold로 알려 준 큰 버튼을 손가락처럼
// 누르고 있다가(대화창이 뜨면 뗀다), ctx.testHooks.drag로 알려 준 돌을 빈자리까지 끌어다 놓는다. bumpFirst: 처음 한 번은
// 빈자리가 아닌 곳에서 아래 방향키로 돌을 내려 본다(해설만 듣는다)
function handHelper(s, { bumpFirst = false } = {}) {
  let held = null, busy = false, bump = bumpFirst ? 'todo' : 'done';
  const covered = [], log = { holds: [], drags: 0 };
  const pe = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, bubbles: true, clientX: x, clientY: y }));
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  const t = setInterval(async () => {
    if (busy) return;
    const h = s.ctx.testHooks.hold;
    if (h && !s.dialogue.isOpen()) {
      if (held !== h.el) {
        const r = h.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const top = document.elementFromPoint(cx, cy);
        if (!top || !(top === h.el || h.el.contains(top))) covered.push(`hold button covered by ${top ? top.className : 'nothing'}`);
        if (r.right > innerWidth || r.bottom > innerHeight || r.left < 0 || r.top < 0) covered.push('hold button off screen');
        pe(h.el, 'pointerdown', cx, cy); held = h.el; log.holds.push(h.sec);
      }
    } else if (held) { pe(held, 'pointerup', 0, 0); held = null; }
    const d = s.ctx.testHooks.drag;
    if (!d || s.dialogue.isOpen()) { if (bump === 'down' && s.dialogue.isOpen()) { key('keyup', 'ArrowDown'); bump = 'done'; } return; }
    if (bump === 'todo') { key('keydown', 'ArrowDown'); bump = 'down'; return; }
    if (bump === 'down') return;
    busy = true;
    const [x0, y0] = d.stone(), [x1, y1] = d.target();
    pe(d.el, 'pointerdown', x0, y0);
    for (let k = 1; k <= 6; k++) { pe(d.el, 'pointermove', x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6); await sleep(20); }
    pe(d.el, 'pointerup', x1, y1); log.drags += 1;
    await sleep(80); busy = false;
  }, 20);
  return { log, stop() { clearInterval(t); if (held) pe(held, 'pointerup', 0, 0); if (covered.length) throw new Error(covered.join('; ')); } };
}

test('j6: script passes validation', () => eq(validateScript(j6Script, SOURCES), []));

test('j6: quiz answers match the spec, completion year and record book are cited', () => {
  eq(j6Script.quizzes.map(q => q.options[q.answer]), ['탕평책', '거중기']);
  ok(j6Script.result[0].text.includes('1796') && j6Script.result[0].src.includes('S39'));
  ok(j6Script.result[1].src.includes('S42'));
  eq(j6Script.pulley.options[j6Script.pulley.answer], '다 (움직도르래 2개)');
});

test('j6: scene — three gaps the crane can fill, four people', () => {
  const w = testWorld();
  try {
    const s = buildJ6Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['jeongjo', 'jeongyakyong', 'official', 'worker']);
    eq(s.fillers.length, GAPS.length);
    ok(s.fillers.every(f => !f.visible), 'gaps start empty');
    for (const g of GAPS) { const k = s.kOf(g); s.setSlide(k); ok(Math.abs(s.trolley.position.x - g) < 1e-6, `crane reaches ${g}`); }
    s.fill(1); ok(s.fillers[1].visible);
  } finally { w.dispose(); }
});

test('j6: completes with touch-only actions', async () => {
  const s = touchSetup(j6Script.speakers);
  const bot = touchBot(s, { answers });
  const hand = handHelper(s);
  try {
    const r = await runChapter(JOSEON[5], j6, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
    eq(hand.log.drags, GAPS.length, 'each stone was dragged into its gap');
  } finally { hand.stop(); bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j6 D-30 J-06: lowering the stone where there is no gap only gets a hint; the wall is still finished', async () => {
  const s = touchSetup(j6Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers });
  const hand = handHelper(s, { bumpFirst: true }); // 처음 돌은 빈자리가 아닌 곳에서 아래 방향키로 내려 본다
  try {
    const sc = j6.buildScene(s.w, s.ctx);
    j6.enterStage(s.ctx, 'minigame');
    const r = await j6.minigame(s.ctx);
    ok(said.includes(j6Script.wall.notGap), 'hint');
    ok(sc.fillers.every(f => f.visible), 'all gaps filled');
    eq(r.firstTryCorrect, 1, 'pulleys right, wall missed once');
  } finally { hand.stop(); bot.stop(); s.done(); }
}, { timeout: 150000 });

test('joseon: all six chapters load and the result card opens after chapter 6', async () => {
  for (const c of JOSEON) { ok(c.load, c.id); eq((await c.load()).default.id, c.id); }
  const save = { data: { chapters: {} }, chapterResult: id => save.data.chapters[id] || null };
  for (const c of JOSEON.slice(0, 5)) save.data.chapters[c.id] = { stars: 3 };
  eq(isSessionDone(2, save), false);
  save.data.chapters.j6 = { stars: 2 };
  eq(isSessionDone(2, save), true);
  eq(SESSIONS[2].points.length, 6);
});

test('j6: 정약용 designed (고안) the 거중기, and the tomb went to 화산 (not this site)', () => {
  const lines = j6Script.npc.jeongyakyong.first.map(l => l.text).join(' ');
  ok(lines.includes('고안') && !lines.includes('거중기를 만들었다'), lines);
  ok(!j6Script.npc.jeongjo.first[0].text.includes('이곳'), j6Script.npc.jeongjo.first[0].text);
});

test('j4: attack advance stops before overlapping our fleet', async () => {
  const { buildJ4Scene } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try { const s = buildJ4Scene(w); s.setAdvance(1); ok(s.enemy.position.z <= -36, `${s.enemy.position.z}`); } finally { w.dispose(); }
});

test('j6: result mentions the 1997 UNESCO listing with a source (S44)', () => {
  const l = j6Script.result.find(x => x.text.includes('1997'));
  ok(l && l.src.includes('S44'), l && l.text);
});

test('j6: 화산 is clearly a mountain name, not a volcano', () => {
  const lines = [...j6Script.intro, ...j6Script.npc.jeongjo.first].map(l => l.text).filter(t => t.includes('화산'));
  ok(lines.length >= 2 && lines.every(t => t.includes('화산\'이라는 산')), lines.join(' / '));
});

test('j6: placed stones look exactly like the wall stones (same material)', async () => {
  const { buildJ6Scene } = await import('../chapters/joseon/j6/scene.js');
  const w = testWorld();
  try {
    const s = buildJ6Scene(w);
    const wallMat = s.wallMaterial;
    ok(wallMat, 'scene tells its wall material');
    ok(s.fillers.every(f => f.material === wallMat), 'fillers');
    eq(s.stone.material, wallMat, 'the stone on the crane');
  } finally { w.dispose(); }
});

test('j6: the crane lowers the stone into the gap and lifts the empty hook, like a claw machine', async () => {
  const { buildJ6Scene, GAPS } = await import('../chapters/joseon/j6/scene.js');
  const w = testWorld();
  try {
    const s = buildJ6Scene(w);
    const step = () => w.step(0.05, { x: 0, z: 0 });
    let picked = false; s.pickUp().then(() => { picked = true; });
    const ys = [];
    for (let i = 0; i < 200 && !picked; i++) { step(); ys.push(s.stone.getWorldPosition(new THREE.Vector3()).y); await Promise.resolve(); }
    ok(picked && s.stone.visible, 'picked up a stone');
    ok(Math.min(...ys) < 1.2 && ys[ys.length - 1] > 5, `went down to the pile then up (${Math.min(...ys).toFixed(1)} → ${ys[ys.length - 1].toFixed(1)})`);
    s.setSlide(s.kOf(GAPS[1]));
    let placed = false; s.placeAt(1).then(() => { placed = true; });
    let filledWhileLow = false;
    for (let i = 0; i < 200 && !placed; i++) { step(); if (s.fillers[1].visible && s.stone.visible === false) filledWhileLow = true; await Promise.resolve(); }
    ok(placed && s.fillers[1].visible, 'stone sits in the gap');
    ok(!s.stone.visible, 'hook is empty after letting go');
    ok(filledWhileLow, 'the stone was handed over to the wall');
  } finally { w.dispose(); }
});

test('j6: the crane howto reads naturally (two lines)', () => {
  eq(j6Script.wall.howto.steps.length, 2);
  ok(!j6Script.wall.howto.steps.join(' ').includes('들고 옆으로 옮겨'));
});

// ---- D-27 ----
test('j6 D-27: yard gate and 수원 화성 board, one-paragraph intro, people in any order, three pulley frames', () => {
  const w = testWorld();
  try {
    const sc = buildJ6Scene(w);
    ok(sc.yardGate && sc.yardGate.leaves.length === 2 && sc.introFrom[1] > sc.start[1], 'gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '수원 화성') board = true; });
    ok(board, 'board');
    eq(sc.pulleys.map(r => r.n), [0, 1, 2]);
    eq([...w.npcs.values()].filter(n => n.spot).map(n => n.id), [], 'no road signs (C-03)');
    ok(w.level.children.some(o => o.name === 'plaque:장안문'), 'name plaque on 장안문');
  } finally { w.dispose(); }
  eq(j6Script.intro.length, 1);
  eq(j6Script.pulley.howto.steps.length, 2);
  ok(!('tooEarly' in j6Script.npc.worker));
  eq(yardTalk('worker', new Set(['official']))[0], j6Script.npc.worker.bridge);
  ok(j6Script.tour.some(l => l.src && l.src.includes('S48')), 'tour sourced');
});

test('j6 D-27: pulling the frames lifts the stone higher when there are more moving pulleys', async () => {
  const s = touchSetup(j6Script.speakers);
  const bot = touchBot(s, { answers });
  const hand = handHelper(s);
  const highest = [0, 0, 0];
  try {
    const sc = j6.buildScene(s.w, s.ctx);
    const off = s.w.onUpdate(() => sc.pulleys.forEach((r, i) => { highest[i] = Math.max(highest[i], r.load.position.y); }));
    const r = await tryPulleys(s.ctx, false);
    off();
    eq(r, true);
    ok(highest[0] < highest[1] && highest[1] < highest[2], `heights ${highest.map(h => h.toFixed(2))}`);
  } finally { hand.stop(); bot.stop(); s.done(); }
}, { timeout: 90000 });

// ---- D-30 (C-01·C-02·C-03·C-05, J-01~J-06) ----
test('j6 D-30 C-01/C-02/C-03: quests without the quiz, 정조 waits for everyone, intro film, portal on open ground, no road sign lines', () => {
  ok(!j6Script.goals.some(g => g.includes('확인')), 'no quiz goal');
  ok(j6Script.npc.jeongjo.wait[0].text.includes('모두'), 'wait line asks for everyone');
  ok(!('signGate' in j6Script.npc), 'sign lines removed');
  ok(j6Script.intro.length === 1 && !j6Script.intro[0].text.includes('\n') && j6Script.intro[0].src, 'one sourced paragraph');
  ok(typeof j6.introScene === 'function' && Array.isArray(j6.portal.at), 'intro film and portal');
  const s = touchSetup(j6Script.speakers);
  try {
    const sc = j6.buildScene(s.w, s.ctx);
    const x0 = sc.trolley.position.x;
    const film = j6.introScene(s.ctx);
    ok(film.shots.length >= j6Script.intro.length, 'a shot for the line');
    film.shots.forEach(sh => sh.act?.(s.ctx));
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 });
    film.done?.(s.ctx);
    ok(Math.abs(sc.trolley.position.x - x0) < 1e-6, 'crane put back after the film');
    const [px, pz] = j6.portal.at;
    for (const n of s.w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `portal clear of ${n.id}`);
    ok(s.w.colliders.every(c => Math.hypot(c.x - px, c.z - pz) > (c.r || 0) + 1.2), 'portal clear of colliders');
  } finally { s.done(); }
});

test('j6 D-30 C-01: 정조 gives the quest only after both yard people were heard', async () => {
  const s = touchSetup(j6Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const bot = touchBot(s, { answers });
  try {
    j6.buildScene(s.w, s.ctx);
    j6.enterStage(s.ctx, 'explore');
    let markEarly = false;
    const off = s.w.onUpdate(() => {
      const one = ['official', 'worker'].filter(id => said.includes(j6Script.npc[id].first[0])).length === 1;
      if (one && !s.dialogue.isOpen() && s.w.npcs.get('jeongjo').mark.visible) markEarly = true;
    });
    await j6.explore(s.ctx);
    off();
    ok(!markEarly, 'no ! over 정조 while someone is still unheard');
    const iJ = said.findIndex(l => l === j6Script.npc.jeongjo.first[0]);
    ok(iJ > 0, 'jeongjo spoke');
    for (const id of ['official', 'worker']) ok(said.slice(0, iJ).includes(j6Script.npc[id].first[0]), `${id} heard before 정조`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('j6 D-30 J-01/J-02: nobody waves an arm for no reason; yard people carry stones to the pile by the crane and come back', () => {
  const w = testWorld();
  try {
    const sc = buildJ6Scene(w);
    const people = []; w.level.traverse(o => { if (o.userData.legs) people.push(o); });
    ok(people.every(p => !p.userData.work), `no idle work motions (${people.filter(p => p.userData.work).map(p => p.userData.work)})`);
    ok(sc.carriers.length >= 2, 'stone carriers');
    const pile = sc.yardPile, n0 = pile.count();
    let maxN = n0, minAfterMax = 99, carried = 0, empty = 0, walkedLoaded = 0, maxMove = 0;
    const p0 = sc.carriers.map(c => c.position.clone());
    for (let i = 0; i < 1600; i++) { // 80초
      w.step(0.05, { x: 0, z: 0 });
      const n = pile.count();
      if (n > maxN) { maxN = n; minAfterMax = 99; } else minAfterMax = Math.min(minAfterMax, n);
      for (const c of sc.carriers) {
        if (c.userData.carry && c.userData.carry.style === 'arms') carried += 1; else if (!c.userData.carry) empty += 1;
        if (c.userData.carry && c.userData.walking) walkedLoaded += 1;
      }
      sc.carriers.forEach((c, k) => { maxMove = Math.max(maxMove, c.position.distanceTo(p0[k])); });
    }
    ok(carried > 100 && empty > 100, `carry ${carried} / empty ${empty}`);
    ok(walkedLoaded > 50, 'they walk with the stone in their arms');
    ok(maxMove > 8, `they walk between the piles (${maxMove.toFixed(1)})`);
    ok(maxN > n0, `stones pile up (${n0} → ${maxN})`);
    ok(minAfterMax < maxN, 'and the pile gets smaller again');
    ok(maxN <= pile.max, 'never more than the pile can hold');
  } finally { w.dispose(); }
});

test('j6 D-30 J-03: right after 정조 speaks, 정약용 waits until the student walks up and talks to him', async () => {
  const s = touchSetup(j6Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  try {
    j6.buildScene(s.w, s.ctx);
    j6.enterStage(s.ctx, 'minigame');
    j6.minigame(s.ctx);
    for (let i = 0; i < 60; i++) { s.w.step(1 / 20, { x: 0, z: 0 }); await sleep(5); }
    ok(!said.includes(j6Script.npc.jeongyakyong.first[0]), '정약용 did not start by himself');
    ok(!s.dialogue.isOpen(), 'no dialogue open');
    const jy = s.w.npcs.get('jeongyakyong').mesh.position, g = s.w.getGoal();
    ok(g && Math.hypot(g.x - jy.x, g.z - jy.z) < 0.01, 'arrow points at 정약용');
    ok(s.w.npcs.get('jeongyakyong').mark.visible, '! over 정약용');
  } finally { s.done(); }
});

test('j6 D-30 J-04: pulley frames show fixed and moving pulleys with rope strands; the crane has four over four; the pull is seen from the eye', async () => {
  const w = testWorld();
  try {
    const sc = buildJ6Scene(w);
    sc.pulleys.forEach(r => {
      eq(r.wheels.bottom.length, r.n, `${r.label} moving pulleys`);
      eq(r.wheels.top.length, r.n, `${r.label} fixed pulleys`);
      eq(r.strands.length, Math.max(1, 2 * r.n), `${r.label} strands holding the stone`);
      const len0 = r.strands.map(m => m.scale.y); r.setH(1); const len1 = r.strands.map(m => m.scale.y); r.setH(0);
      ok(len0.every((l, k) => len1[k] < l - 0.5), `${r.label} strands shorten as the stone goes up`);
    });
    eq(sc.tackle.top.length, 4); eq(sc.tackle.bottom.length, 4); eq(sc.tackle.strands.length, 8);
    const a = sc.tackle.strands.map(m => m.scale.y); sc.setLift(0.2); const b = sc.tackle.strands.map(m => m.scale.y); sc.setLift(1);
    ok(a.every((l, k) => b[k] > l + 1), 'crane strands get longer when the stone goes down');
  } finally { w.dispose(); }
  // 당겨 보는 동안 카메라는 학생 눈높이에서 그 틀을 올려다본다
  const s = touchSetup(j6Script.speakers);
  const bot = touchBot(s, { answers });
  const hand = handHelper(s);
  const views = [];
  try {
    const sc = j6.buildScene(s.w, s.ctx);
    const off = s.w.onUpdate(() => {
      if (!s.ctx.testHooks.hold) return;
      const c = s.w.camera.position, d = new THREE.Vector3(); s.w.camera.getWorldDirection(d);
      const near = sc.pulleys.map(r => Math.hypot(c.x - r.x, c.z - r.z)).sort((x, y) => x - y)[0];
      views.push({ y: c.y, near, up: d.y, mode: s.w.camMode, hidden: !s.w.player.visible });
    });
    await tryPulleys(s.ctx, false);
    off();
    ok(views.length > 10, 'pulled with the hold button');
    ok(views.every(v => v.mode === 'fixed' && v.y < 1.9 && v.near < 4.5 && v.up > 0.05 && v.hidden), `first person ${JSON.stringify(views.find(v => !(v.mode === 'fixed' && v.y < 1.9 && v.near < 4.5 && v.up > 0.05 && v.hidden)))}`);
    ok(s.w.player.visible && s.w.camMode === 'follow', 'back to the follow camera');
  } finally { hand.stop(); bot.stop(); s.done(); }
}, { timeout: 90000 });

test('j6 D-30 J-05: hold E or the big button to pull; letting go stops and slowly slides back; later steps need longer holds', async () => {
  const { HOLD_SEC } = await import('../chapters/joseon/j6/chapter.js');
  const { holdPress } = await import('../chapters/joseon/j6/hold.js');
  ok(HOLD_SEC.pulley[0] < HOLD_SEC.pulley[1] && HOLD_SEC.pulley[1] < HOLD_SEC.pulley[2] && HOLD_SEC.pulley[2] < HOLD_SEC.winch, JSON.stringify(HOLD_SEC));
  const s = touchSetup({});
  try {
    const seen = [];
    let done = false;
    holdPress(s.ctx, { label: '당기기', sec: 1, onProgress: p => seen.push(p) }).then(() => { done = true; });
    const step = n => { for (let i = 0; i < n; i++) s.w.step(0.05, { x: 0, z: 0 }); };
    step(10);
    eq(seen[seen.length - 1] || 0, 0, 'nothing happens without pressing');
    ok(s.ctx.testHooks.hold && s.ctx.testHooks.hold.el, 'tells the test bot which button to hold');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    step(8); const a = seen[seen.length - 1];
    ok(a > 0.3 && a < 0.5, `keyboard hold fills (${a})`);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
    step(4); const b = seen[seen.length - 1];
    ok(b < a && b > a - 0.25, `letting go slides back slowly (${a} → ${b})`);
    const el = s.ctx.testHooks.hold.el;
    el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, bubbles: true }));
    step(30);
    await sleep(0);
    ok(done, 'finished by holding the big button');
    ok(!s.ctx.testHooks.hold, 'hook cleared');
    ok(!el.isConnected, 'button removed');
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9 }));
  } finally { s.done(); }
});
