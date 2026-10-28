import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import ch5Script from '../chapters/ch5/script.js';
import ch5 from '../chapters/ch5/chapter.js';
import { buildCh5Scene } from '../chapters/ch5/scene.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import { traceGlyph } from '../core/minigame.js';

const answers = new Set(ch5Script.quizzes.map(q => q.options[q.answer]));

test('ch5: script passes validation', () => {
  eq(validateScript(ch5Script, SOURCES), []);
  for (const [id, sp] of Object.entries(ch5Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
});

test('ch5: making steps match the spec', () => {
  eq(ch5Script.making.steps, ['나무를 바닷물에 담그기', '소금물에 삶기', '그늘에서 말리기', '글자 새기기', '마구리(판 양 끝에 나무 덧대기)', '옻칠하기']);
  eq(ch5Script.quizzes.map(q => q.options[q.answer]), ['부처의 힘으로 몽골의 침입을 물리치려고', '벌레가 먹지 않도록']);
});

test('ch5: carving uses the real characters 大藏經 with every stroke in order', () => {
  const gs = ch5Script.carving.glyphs;
  eq(gs.map(g => g.glyph), ['大', '藏', '經']);
  eq(gs.map(g => g.strokes.length), [3, 17, 13]);
  for (const g of gs) {
    eq(g.outlines.length, g.strokes.length, `${g.glyph} outline per stroke`);
    ok(g.outlines.every(p => /^M[\d\s.LQCZ-]+$/.test(p)), `${g.glyph} outlines are plain paths`);
    for (const s of g.strokes) {
      ok(s.length >= 2 && s.length <= 5, `${g.glyph} stroke has ${s.length} dots`);
      ok(s.every(([x, y]) => x > 0 && x < 1 && y > 0 && y < 1), `${g.glyph} dots inside the board`);
    }
  }
  // 大의 첫 획은 가로획(왼쪽→오른쪽), 둘째 획은 위에서 왼쪽 아래로 삐침
  const [h, p] = gs[0].strokes;
  ok(h[h.length - 1][0] - h[0][0] > 0.4 && Math.abs(h[h.length - 1][1] - h[0][1]) < 0.15, 'horizontal first');
  ok(p[0][1] < 0.2 && p[p.length - 1][1] > 0.75 && p[p.length - 1][0] < p[0][0], 'then the left-falling stroke');
});

test('ch5: the board draws the real stroke shapes and fills each stroke when done', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const g = ch5Script.carving.glyphs[0];
  traceGlyph({ ui }, g);
  const board = ui.querySelector('.trace-board');
  eq(board.querySelectorAll('.trace-outline').length, 3, 'faint outline of every stroke');
  eq(board.querySelectorAll('.trace-glyph').length, 0, 'no font fallback needed');
  const r = board.getBoundingClientRect();
  const at = (type, [fx, fy]) => board.dispatchEvent(new PointerEvent(type, { pointerId: 7, bubbles: true, clientX: r.left + fx * r.width, clientY: r.top + fy * r.height }));
  at('pointerdown', g.strokes[0][0]);
  for (const pt of g.strokes[0].slice(1)) at('pointermove', pt);
  eq(board.querySelectorAll('.trace-outline.done').length, 1, 'first stroke carved');
  ok(ui.querySelector('h2').textContent.includes('大'));
  ui.remove();
});

test('ch5: scene builds with four artisans in front of the start', () => {
  const w = testWorld();
  const s = buildCh5Scene(w);
  const artisans = ['artisan1', 'artisan2', 'artisan3', 'artisan4'];
  for (const id of artisans) ok(w.npcs.has(id), id);
  ok(artisans.every(id => w.npcs.get(id).mesh.position.z < s.start[1]), 'all ahead of the player');
  w.dispose();
});

test('ch5: completes with touch-only actions', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[4], ch5, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch5: resume at minigame puts the player at the start', () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    s.w.player.position.set(5, 0, 5);
    ch5.enterStage(s.ctx, 'minigame');
    eq([s.w.player.position.x, s.w.player.position.z], sc.start);
  } finally { s.done(); }
});

test('ch5: resume at quiz shows the finished library of woodblocks', () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    eq(sc.plank.parent === sc.library, false);
    ch5.enterStage(s.ctx, 'quiz');
    eq(sc.library.visible, true);
    eq(sc.plank.parent, sc.library, 'the carved block is on the shelf');
    eq([s.w.player.position.x, s.w.player.position.z], sc.start);
  } finally { s.done(); }
});

// ---- D-17: 스님이 여는 탐험, 나무판을 들고 경판 만들기, 그 경판에 大藏經 새기기 ----
import { artisanTalk, makeBlock, carveAndShelve } from '../chapters/ch5/chapter.js';
import { sleep } from './bot.js';

test('ch5 D-17: workshop gate, 경판 작업장 board, no reading signs, one-paragraph intro, five goals', () => {
  const w = testWorld();
  const sc = buildCh5Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  ok(sc.introFrom[1] > sc.start[1], 'comes in from outside the gate');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '경판 작업장') board = true; });
  ok(board, '경판 작업장 name board');
  eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  eq(ch5Script.intro.length, 1); ok(!ch5Script.intro[0].text.includes('\n'));
  ok(ch5Script.intro[0].src.includes('S9') && ch5Script.intro[0].src.includes('S7'));
  eq(ch5Script.goals.length, 5);
  eq(sc.stations.length, 6, 'six work places');
  ok(!('tooEarly' in ch5Script), 'never blocks out of order');
  w.dispose();
});

test('ch5 D-17: artisans tell their part in any order, pick up from the one before, and point back to an earlier artisan not yet heard', () => {
  const ids = ['artisan1', 'artisan2', 'artisan3', 'artisan4'];
  for (const [i, id] of ids.entries()) {
    const all = artisanTalk(id, new Set(ids));
    eq(all, ch5Script.npc[id], `${id} alone`);
    ok(all.every(l => l.src && l.src.every(x => ['S7', 'S8', 'S9'].includes(x))), `${id} sourced`);
    if (i > 0) ok(all[0].text.startsWith('그다음엔'), `${id} picks up with 그다음엔`);
  }
  const first = artisanTalk('artisan3', new Set());
  ok(first[first.length - 1].text.includes('1번 장인에게도'), 'one line back to artisan 1');
  ok(artisanTalk('artisan3', new Set(['artisan1'])).at(-1).text.includes('2번 장인에게도'));
  ok(ch5Script.npc.monk.open.some(l => l.text.includes('몽골군') && l.src.includes('S9')), 'the monk opens the story');
});

function stepN(w, n = 1) { for (let i = 0; i < n; i++) w.step(0.05, { x: 0, z: 0 }); }

test('ch5 D-17: carrying the plank to the six glowing places in order changes it step by step; a wrong place gets a hint, not a fail', async () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    let res = null;
    makeBlock(s.ctx).then(r => { res = r; });
    stepN(s.w);
    ok(s.w.player.children.includes(sc.plank), 'the monk hands the plank: it is in the arms');
    eq(sc.plank.userData.stage, 0);
    const seen = [];
    for (let k = 0; k < 6; k++) {
      const st = sc.stations[k];
      eq(sc.stations.filter(x => x.ring.visible).map(x => x.id), [st.id], `only place ${k + 1} glows`);
      if (k === 0) { // 다른 자리를 지나가기만 하면 알려 주지 않는다
        const w3 = sc.stations[3];
        s.w.player.position.set(w3.spot[0], 0, w3.spot[1]); stepN(s.w, 2);
        s.w.player.position.set(w3.spot[0], 0, w3.spot[1] + 3); stepN(s.w);
        await sleep(20); ok(!s.dialogue.isOpen(), 'just passing by');
      }
      if (k === 1) { // 틀린 곳(말리는 선반)에 먼저 가 본다
        const w2 = sc.stations[2];
        s.w.player.position.set(w2.spot[0], 0, w2.spot[1]); stepN(s.w, 12); // 잠깐 머문다(지나가기만 하면 알려 주지 않음)
        await sleep(20);
        ok(s.dialogue.isOpen(), 'monk hint'); s.dialogue.close(); await sleep(5);
        eq(sc.plank.userData.stage, 1, 'nothing happens at the wrong place');
        s.w.player.position.set(w2.spot[0] + 3, 0, w2.spot[1] + 3); stepN(s.w);
      }
      s.w.player.position.set(st.spot[0], 0, st.spot[1]); stepN(s.w);
      ok(!s.w.player.children.includes(sc.plank), `put down at ${st.id}`);
      stepN(s.w, 40);
      seen.push(sc.plank.userData.stage);
      ok(s.w.player.children.includes(sc.plank) || k === 5, `picked up again after ${st.id}`);
    }
    await sleep(5);
    eq(seen, [1, 2, 3, 4, 5, 6]);
    ok(sc.plank.getObjectByName('marks').visible && sc.plank.getObjectByName('ends').visible, 'letters and end pieces');
    ok(res && res.first === false, 'hint means no first-try point');
  } finally { s.done(); }
});

test('ch5 D-17: 大藏經 is carved on the block just made, then the student carries it to the shelf', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    sc.setStage(6); setCarryPlank(s, sc);
    await carveAndShelve(s.ctx);
    eq(sc.plank.userData.carved, 3, 'three letters carved');
    eq(sc.plank.parent, sc.library, 'on the shelf');
    ok(sc.library.visible);
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });

import { setCarry } from '../core/people.js';
function setCarryPlank(s, sc) { setCarry(s.w.player, sc.plank, 'arms'); }

test('ch5 D-17: full run uses no cards and keeps the low camera', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  let cards = 0, fixed = 0;
  const off = s.w.onUpdate(() => { if (s.ui.querySelector('.order-card')) cards += 1; if (s.w.camMode === 'fixed' && !s.ctx.testHooks.quizView) fixed += 1; }); // 퀴즈 배경은 고정 카메라라 세지 않는다
  try {
    const r = await runChapter(CHAPTERS[4], ch5, s.ctx, memSave());
    eq(cards, 0, 'no picture cards'); eq(fixed, 0, 'no fixed camera');
    eq(r.firstTryCorrect, 1);
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });
