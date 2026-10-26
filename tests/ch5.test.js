import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import ch5Script from '../chapters/ch5/script.js';
import ch5 from '../chapters/ch5/chapter.js';
import { buildCh5Scene, STATIONS } from '../chapters/ch5/scene.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import { traceGlyph } from '../core/minigame.js';

const answers = new Set(ch5Script.quizzes.map(q => q.options[q.answer]));

test('ch5: script passes validation', () => {
  eq(validateScript(ch5Script, SOURCES), []);
  for (const [id, sp] of Object.entries(ch5Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
});

test('ch5: workshop stations follow the passed-down order', () => {
  eq(ch5Script.making.cards, ['나무를 바닷물에 담그기', '소금물에 삶기', '그늘에서 말리기', '글자 새기기', '마구리(판 양 끝에 나무 덧대기)', '옻칠하기']);
  eq(ch5Script.making.states.length, ch5Script.making.cards.length + 1);
  eq(ch5Script.making.waves.map(w => w.active.length), [3, 5, 6]);
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

test('ch5: scene builds with one artisan to talk to, three working artisans and six stations', () => {
  const w = testWorld();
  const s = buildCh5Scene(w);
  ok(w.npcs.has('artisan1') && w.npcs.has('monk'), 'artisan and monk');
  ok(!w.npcs.has('artisan2'), 'the other artisans are background workers');
  eq(s.workers.length, 3);
  ok([w.npcs.get('artisan1').mesh, ...s.workers].every(m => m.position.z < s.start[1]), 'all ahead of the player');
  eq(STATIONS.length, 6);
  w.dispose();
});

test('ch5: completes with touch-only actions', async () => {
  const s = touchSetup(ch5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS.find(c => c.id === 'ch5'), ch5, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
}, { timeout: 300000 });

test('ch5: resume at minigame puts the player at the start', () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    s.w.player.position.set(5, 0, 5);
    ch5.enterStage(s.ctx, 'minigame');
    eq([s.w.player.position.x, s.w.player.position.z], sc.start);
  } finally { s.done(); }
});

test('ch5: resume at quiz shows the finished library of woodblocks and the sea stage', () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    eq(sc.library.visible, false);
    ch5.enterStage(s.ctx, 'quiz');
    eq(sc.library.visible, true);
    eq(sc.sea.root.visible, true);
  } finally { s.done(); }
});
