import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j6Script from '../chapters/joseon/j6/script.js';
import { buildJ6Scene, GAPS } from '../chapters/joseon/j6/scene.js';
import j6, { pulleySVG } from '../chapters/joseon/j6/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON, SESSIONS, isSessionDone } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j6Script.quizzes.map(q => q.options[q.answer]));
const cardPicks = new Set(j6Script.pulley.cards.filter(c => c.correct).map(c => c.text));

test('j6: script passes validation', () => eq(validateScript(j6Script, SOURCES), []));

test('j6: quiz answers match the spec, completion year and record book are cited', () => {
  eq(j6Script.quizzes.map(q => q.options[q.answer]), ['탕평책', '거중기']);
  ok(j6Script.result[0].text.includes('1796') && j6Script.result[0].src.includes('S39'));
  ok(j6Script.result[1].src.includes('S42'));
  ok(pulleySVG().includes('다'));
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
  const bot = touchBot(s, { answers, cardPicks });
  try {
    const r = await runChapter(JOSEON[5], j6, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j6: dropping a stone too early gives the early hint', async () => {
  const s = touchSetup(j6Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers, cardPicks, pressEarlyOnce: true });
  try {
    j6.buildScene(s.w, s.ctx);
    j6.enterStage(s.ctx, 'minigame');
    const r = await j6.minigame(s.ctx);
    ok(said.includes(j6Script.wall.early), 'early hint');
    eq(r.firstTryCorrect, 1);
  } finally { bot.stop(); s.done(); }
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

test('j6: the crane howto reads naturally', () => {
  ok(!j6Script.wall.howto[0].text.includes('들고 옆으로 옮겨'), j6Script.wall.howto[0].text);
});
