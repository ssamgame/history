import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j3Script from '../chapters/joseon/j3/script.js';
import { buildJ3Scene } from '../chapters/joseon/j3/scene.js';
import j3, { HOURS, DIAL_ROUNDS, GAUGE_ROUNDS, dialSVG, gaugeSVG } from '../chapters/joseon/j3/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j3Script.quizzes.map(q => q.options[q.answer]));

test('j3: script passes validation', () => eq(validateScript(j3Script, SOURCES), []));

test('j3: quiz answers match the spec, and the rain gauge is not credited to 장영실', () => {
  eq(j3Script.quizzes.map(q => q.options[q.answer]), ['12지신 동물', '측우기']);
  const all = JSON.stringify(j3Script);
  ok(!/장영실[^"]*측우기를? (만들|발명)/.test(all) && !/측우기[^"]*장영실이 (만들|발명)/.test(all), 'no 장영실 측우기 claim');
});

test('j3: sundial rounds — the correct animal is offered once and not always in the same place', () => {
  eq(HOURS.length, 9);
  eq(HOURS[4][0], '말', 'middle line is 오시(말)');
  for (const r of DIAL_ROUNDS) eq(r.opts.filter(k => k === r.h).length, 1);
  ok(new Set(DIAL_ROUNDS.map(r => r.opts.indexOf(r.h))).size > 1, 'answer position varies');
  ok(dialSVG(4).includes('🐴') && gaugeSVG(5).includes('측우기'));
  for (const r of GAUGE_ROUNDS) eq(r.opts.filter(n => n === r.lv).length, 1);
});

test('j3: scene has the three instruments and people', () => {
  const w = testWorld();
  try {
    const s = buildJ3Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['commoner', 'crownPrince', 'jangyeongsil']);
    ok(s.dial && s.gauge && s.clock, 'instruments');
    s.setRain(true); s.setRain(false); s.ringClock();
  } finally { w.dispose(); }
});

test('j3: completes with touch-only actions', async () => {
  const s = touchSetup(j3Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON.find(c => c.id === 'j3'), j3, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 1); eq(r.firstTryTotal, 1, 'one play: 해 그림자 맞추기');
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j3: the shadow moves opposite the sun; a wrong check gives the hint, two wrong checks fail the round', async () => {
  const { dial } = await import('../chapters/kit/dial.js');
  const s = touchSetup(j3Script.speakers);
  try {
    const p = dial(s.ctx, { hours: HOURS, target: 2, hint: j3Script.dial.fail });
    const h = () => s.ctx.testHooks.dial, b = act => s.ui.querySelector(`.jp-dial [data-act="${act}"]`);
    eq(h().sun, 4); eq(h().need, 6, '그림자를 용(2번 줄)에 두려면 해는 반대쪽 6');
    b('left').click(); b('check').click();
    eq(s.ui.querySelector('.jp-hint').textContent, j3Script.dial.fail);
    b('left').click(); b('check').click();
    const r = await p; eq(r, { ok: false, wrong: 2 });
    const p2 = dial(s.ctx, { hours: HOURS, target: 2 });
    for (let i = 0; i < 4; i++) b('right').click();
    b('check').click();
    eq((await p2).ok, true);
  } finally { s.done(); }
});
