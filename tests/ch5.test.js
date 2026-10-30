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
import * as ch5mod from '../chapters/ch5/chapter.js';
const { artisanTalk, makeBlock, carveAndShelve, shelveBlock } = ch5mod;
import { sleep } from './bot.js';

test('ch5 D-17: workshop gate, 경판 작업장 board, no reading signs, one-paragraph intro, five goals', () => {
  const w = testWorld();
  const sc = buildCh5Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  ok(sc.introFrom[1] > sc.start[1], 'comes in from outside the gate');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '경판 작업장') board = true; });
  ok(board, '경판 작업장 name board');
  eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  eq(ch5Script.intro.length, 2); ok(ch5Script.intro.every(l => !l.text.includes('\n'))); // D-30: 자막 장면 두 문장
  ok(ch5Script.intro[0].src.includes('S9') && ch5Script.intro[1].src.includes('S7'));
  eq(ch5Script.goals.length, 6);
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

// ---- D-32: 장인 자리에서 E를 눌러야 그 단계가 되고, 그 과정 그림이 뜬다. 글자는 3번 장인 자리에서 바로 새긴다 ----
const stepPanel = s => s.ui.querySelector('.ch5-step');
function inkColors(cv) { // 캔버스에 실제로 그렸는지: 서로 다른 색 수
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, set = new Set();
  for (let i = 0; i < d.length; i += 4 * 97) set.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
  return set.size;
}

test('ch5 D-32: each work place waits for E (talk button), then shows a drawn picture of that step with one sourced line; a wrong place gets a hint, not a fail', async () => {
  const P = ch5Script.making.pictures;
  eq(P.length, 6);
  for (const p of P) { eq(p.who, 'narr'); ok(p.src.length && p.src.every(x => ['S8', 'S9'].includes(x)), p.id); ok(!p.text.includes('\n') && p.title); }
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    eq(P.map(p => p.id), sc.stations.map(x => x.id), 'one picture per work place in order');
    ch5.enterStage(s.ctx, 'minigame');
    let res = null;
    makeBlock(s.ctx).then(r => { res = r; });
    stepN(s.w);
    ok(s.w.player.userData.carry?.obj === sc.plank, 'the plank is in the arms');
    const st0 = sc.stations[0];
    s.w.player.position.set(st0.spot[0], 0, st0.spot[1]); stepN(s.w, 40);
    await sleep(10);
    eq(sc.plank.userData.stage, 0, 'standing there is not enough');
    ok(!stepPanel(s), 'no picture yet');
    ok(!s.hud.talkBtn.disabled, 'talk button ready at the work place');
    s.hud.talkBtn.click(); await sleep(10);
    // 2026-10-30: 작업 대상 앞으로 걸어가 판을 내려놓고, E를 누를 때마다 한 번씩 일한다(판을 물에 눌러 담그기 3번)
    for (let n = 0; n < 200 && !stepPanel(s); n++) { stepN(s.w, 3); await sleep(1); if (!s.hud.talkBtn.disabled) { s.hud.talkBtn.click(); await sleep(2); } }
    const panel = stepPanel(s);
    ok(panel, 'picture panel opens');
    eq(panel.dataset.step, 'soak');
    const cv = panel.querySelector('canvas');
    ok(cv && cv.width >= 300 && inkColors(cv) >= 4, 'a picture is drawn on a canvas');
    ok(panel.textContent.includes(P[0].text), 'one line under the picture');
    ok(s.w.player.userData.carry?.obj !== sc.plank, 'put down at the work place');
    eq(sc.plank.userData.stage, 0, 'still waiting while the picture is open');
    panel.querySelector('.doc-ok').click(); await sleep(10); stepN(s.w, 40); await sleep(5);
    ok(!stepPanel(s), 'closed');
    eq(sc.plank.userData.stage, 1, 'soaked');
    ok(s.w.player.userData.carry?.obj === sc.plank, 'picked up again');
    stepN(s.w, 14); await sleep(20);
    ok(!s.dialogue.isOpen(), 'standing on at the place just finished is not a wrong place');
    // 틀린 곳(말리는 선반)에 머물면 스님이 알려 주고, 거기서는 대화 버튼이 눌리지 않는다
    const w2 = sc.stations[2];
    s.w.player.position.set(w2.spot[0], 0, w2.spot[1]); stepN(s.w, 12);
    await sleep(20);
    ok(s.dialogue.isOpen(), 'monk hint'); s.dialogue.close(); await sleep(5); stepN(s.w);
    ok(s.hud.talkBtn.disabled, 'nothing to do at the wrong place');
    eq(sc.plank.userData.stage, 1);
    ok(res === null);
  } finally { s.done(); }
});

test('ch5 D-32: 1 -> 2 -> 3 work places, the letters 大藏經 are carved right at artisan 3, and the carved block is carried to artisan 4', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    const C = sc.stations.find(x => x.id === 'carve');
    const order = [], boards = new Set();
    let traceAway = 0, traceStage = new Set(), carried = false;
    const seen = n => { // 봇은 그림·글자판이 뜨자마자 눌러 닫으므로 화면에 붙는 순간을 살핀다
      if (n.classList?.contains('ch5-step')) order.push(n.dataset.step);
      const b = n.querySelector?.('.trace-board');
      if (b) {
        boards.add(b); traceStage.add(sc.plank.userData.stage);
        if (Math.hypot(s.w.player.position.x - C.spot[0], s.w.player.position.z - C.spot[1]) > 2) traceAway += 1;
      }
    };
    const mo = new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(seen)));
    mo.observe(s.ui, { childList: true });
    const off = s.w.onUpdate(() => {
      if (sc.plank.userData.carved === 3 && sc.plank.userData.stage === 4 && !stepPanel(s) && s.w.player.userData.carry?.obj === sc.plank) carried = true;
    });
    const r = await makeBlock(s.ctx);
    off(); mo.disconnect();
    eq(order, ['soak', 'boil', 'dry', 'carve', 'ends', 'lacquer']);
    eq(boards.size, 3, 'three letters traced');
    eq(traceAway, 0, 'traced at the carving place');
    eq([...traceStage], [3], 'carved before the end pieces');
    eq(sc.plank.userData.carved, 3); eq(sc.plank.userData.stage, 6);
    ok(carried, 'the carved block is carried to artisan 4');
    eq(r.first, true);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('ch5 D-32: no separate carving part after the block is made', () => {
  eq(typeof carveAndShelve, 'undefined');
  ok(!('go' in ch5Script.carving), 'no "take it to the carving place" line');
  ok(ch5Script.carving.intro[0].text.includes('3번 장인'));
});

import { setCarry } from '../core/people.js';
function setCarryPlank(s, sc) { setCarry(s.w.player, sc.plank, 'arms'); }

test('ch5 D-17: full run uses no cards and keeps the low camera', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  let cards = 0, fixed = 0;
  const boards = new Set();
  const poll = setInterval(() => { const b = s.ui.querySelector('.trace-board'); if (b) boards.add(b); }, 5); // 장이 장면을 다시 지으면 onUpdate가 지워져서 따로 살핀다
  const off = s.w.onUpdate(() => { if (s.ui.querySelector('.order-card')) cards += 1; if (s.w.camMode === 'fixed' && !s.w.storyOn && !s.ctx.testHooks.quizView && !s.ui.classList.contains('filming') && !s.ctx.testHooks.working) fixed += 1; }); // 퀴즈 배경·도입 장면, 경판 만드는 손동작·1인칭 서가(2026-10-30)는 고정 카메라라 세지 않는다
  try {
    const r = await runChapter(CHAPTERS[4], ch5, s.ctx, memSave());
    eq(cards, 0, 'no picture cards'); eq(fixed, 0, 'no fixed camera');
    eq(r.firstTryCorrect, 1);
    eq(boards.size, 3, 'the three letters are carved once (inside block making)');
  } finally { clearInterval(poll); off(); bot.stop(); s.done(); }
}, { timeout: 150000 });

// 2026-10-30 선생님: 경판 만들기를 실제 행동으로, 서가에 정확히 꽂기, 꽂을 때 1인칭
test('ch5: 자리마다 앞에 서서 판을 내려놓고 도구 끝이 판에 닿으며, 서가에는 1인칭으로 빈자리에 정확히 꽂고 그대로 남는다', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    await makeBlock(s.ctx);
    const W = s.ctx.testHooks.work;
    eq(Object.keys(W), ['soak', 'boil', 'dry', 'carve', 'ends', 'lacquer']);
    for (const [id, h] of Object.entries(W)) { ok(h.placed < 0.02, `${id}: 판을 놓을 곳에 놓았다 ${h.placed.toFixed(3)}`); if (['boil', 'carve', 'ends', 'lacquer'].includes(id)) ok(h.contact < 0.15, `${id}: 도구 끝이 판·솥에 닿는다 ${h.contact.toFixed(3)}`); }
    await shelveBlock(s.ctx);
    const H = s.ctx.testHooks.shelf;
    ok(H.fp, '1인칭으로 바뀌었다'); ok(H.gap < 0.15, `두 손이 경판을 붙들었다 ${H.gap.toFixed(3)}`); ok(H.slotErr < 0.01, `빈자리에 꽂혔다 ${H.slotErr.toFixed(3)}`);
    eq(sc.plank.parent, sc.library); ok(Math.abs(sc.plank.scale.x - 1) < 1e-6, '크기 그대로');
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 });
    eq(sc.plank.parent, sc.library, '제자리에 남는다'); eq(s.w.camMode, 'follow'); ok(s.w.player.userData.head.visible, '머리가 다시 보인다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
