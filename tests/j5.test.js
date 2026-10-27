import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j5Script from '../chapters/joseon/j5/script.js';
import { buildJ5Scene } from '../chapters/joseon/j5/scene.js';
import j5 from '../chapters/joseon/j5/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j5Script.quizzes.map(q => q.options[q.answer]));
const sortPicks = Object.fromEntries(j5Script.sort.cards.map(c => [c.text, c.bin]));

test('j5: script passes validation', () => eq(validateScript(j5Script, SOURCES), []));

test('j5: quiz answers match the spec; 척화·주화 are balanced, no side is called right', () => {
  eq(j5Script.quizzes.map(q => q.options[q.answer]), ['남한산성', '삼전도']);
  const n = id => j5Script.sort.cards.filter(c => c.bin === id).length;
  eq([n('cheok'), n('ju')], [3, 3]);
  const all = JSON.stringify(j5Script);
  ok(!/(옳|틀렸|잘못)/.test(all), 'no judging words');
  ok(j5Script.result.every(l => l.src.includes('S38')));
});

test('j5: scene has the fortress people and six braziers that light up', () => {
  const w = testWorld();
  try {
    const s = buildJ5Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['choemyeonggil', 'keeper', 'kimsangheon', 'soldier']);
    eq(s.fires.length, 6);
    s.resetFires(); ok(s.fires.every(f => !f.lit));
    s.light(s.fires[0]); ok(s.fires[0].lit && s.fires[0].flame.visible);
    for (const f of s.fires) { const b = w.bounds; ok(f.x > b.x0 && f.x < b.x1 && f.z > b.z0 && f.z < b.z1, 'reachable'); }
  } finally { w.dispose(); }
});

test('j5: completes with touch-only actions', async () => {
  const s = touchSetup(j5Script.speakers);
  const bot = touchBot(s, { answers, sortPicks });
  try {
    const r = await runChapter(JOSEON[4], j5, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j5: sort cards do not simply alternate, and both sides give a reason', () => {
  const bins = j5Script.sort.cards.map(c => c.bin);
  ok(bins.some((b, i) => i > 0 && b === bins[i - 1]), `order ${bins.join(',')}`);
  ok(j5Script.sort.cards.some(c => c.bin === 'cheok' && c.text.includes('려면')), '척화 has a reason too');
});

test('j5: the two places are labelled only 척화 and 주화', () => {
  eq(j5Script.sort.bins.map(b => b.label), ['척화', '주화']);
});

test('j5: a brazier lights only when the action button is pressed next to it', async () => {
  const s = touchSetup(j5Script.speakers);
  try {
    const sc = j5.buildScene(s.w, s.ctx);
    const run = j5.lightFires(s.ctx, false);
    const f = sc.fires[0];
    s.w.player.position.set(f.x, 0, f.z + 1.3);
    for (let i = 0; i < 10; i++) s.w.step(0.05, { x: 0, z: 0 });
    eq(f.lit, false, 'standing next to it is not enough');
    ok(!s.hud.talkBtn.disabled, 'button is offered');
    s.hud.talkBtn.click();
    s.w.step(0.05, { x: 0, z: 0 });
    eq(f.lit, true, 'lit by the button');
    for (const g of sc.fires) { s.w.player.position.set(g.x, 0, g.z + 1.3); s.w.step(0.05, { x: 0, z: 0 }); s.hud.talkBtn.click(); s.w.step(0.05, { x: 0, z: 0 }); }
    eq(await run, true);
  } finally { s.done(); }
});

test('j5: 인조 performs three kneelings and nine bows before 청 태종 at 삼전도', async () => {
  const s = touchSetup(j5Script.speakers);
  const bot = touchBot(s, { answers, sortPicks });
  try {
    j5.buildScene(s.w, s.ctx);
    j5.enterStage(s.ctx, 'minigame');
    await j5.minigame(s.ctx);
    eq(s.ctx.testHooks.samjeondo, { kneels: 3, bows: 9 });
    ok(j5Script.samjeondo.every(l => l.who !== 'narr' || (l.src && l.src.includes('S63'))), 'narration cites S63');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
