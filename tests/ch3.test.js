import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import ch3Script from '../chapters/ch3/script.js';
import { buildCh3Scene } from '../chapters/ch3/scene.js';
import { testWorld } from './bot.js';

test('ch3: script passes validation', () => eq(validateScript(ch3Script, SOURCES), []));

test('ch3: quiz answers match the spec', () => {
  eq(ch3Script.quizzes.map(q => q.options[q.answer]), ['쇠가죽으로 물을 막았다가 터뜨리기', '귀주 대첩']); // 일어난 차례: 삼교천(1018) → 귀주(1019)
});

test('ch3: scene builds with 6 hides and a dam', () => {
  const w = testWorld();
  const s = buildCh3Scene(w);
  eq([...w.npcs.keys()].sort(), ['gangamchan', 'soldier']);
  eq(s.hides.length, 6);
  ok(s.hides.every(h => h.mesh.visible), 'hides visible');
  eq(s.damWall.visible, false);
  ok(s.dam.r > 0);
  // 강을 건너는 거란군: 진행도 0이면 북쪽 강둑, 1이면 남쪽 강둑
  s.river.setCross(0); const z0 = s.river.army.position.z;
  s.river.setCross(1); const z1 = s.river.army.position.z;
  ok(z0 < s.river.zNorth && z1 > s.river.zSouth, `${z0} → ${z1}`);
  w.dispose();
});

import ch3 from '../chapters/ch3/chapter.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import { touchSetup, touchBot, memSave } from './bot.js';
const answers = new Set(ch3Script.quizzes.map(q => q.options[q.answer]));

test('ch3: completes with touch-only actions', async () => {
  const s = touchSetup(ch3Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[2], ch3, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.easyModeUsed, false);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch3: early press fails with a hint and retries', async () => {
  const s = touchSetup(ch3Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers, pressEarlyOnce: true });
  try {
    ch3.buildScene(s.w, s.ctx);
    ch3.enterStage(s.ctx, 'minigame');
    const r = await ch3.minigame(s.ctx);
    ok(said.includes(ch3Script.dam.early), 'early hint shown');
    eq(r.easyModeUsed, false);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch3: resume at quiz shows guju aftermath', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ch3.enterStage(s.ctx, 'quiz');
    eq(s.w.bounds, sc.gujuBounds);
    eq(sc.reinforcements.visible, true);
    eq(sc.damWall.visible, true);
  } finally { s.done(); }
});

test('ch3: guju lines avoid unsourced claims and the 1019 explanation cites S5', () => {
  ok(!ch3Script.guju.intro.some(l => l.text.includes('내려왔')), 'no claim that the Khitan came down to Guju');
  ok(ch3Script.quizzes[0].src.includes('S5'));
});
