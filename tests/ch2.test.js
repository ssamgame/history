import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import ch2Script from '../chapters/ch2/script.js';
import ch2 from '../chapters/ch2/chapter.js';
import { buildCh2Scene } from '../chapters/ch2/scene.js';
import { testWorld, touchSetup, touchBot, memSave, sleep } from './bot.js';

const answers = new Set(ch2Script.quizzes.map(q => q.options[q.answer]));

test('ch2: script passes validation', () => eq(validateScript(ch2Script, SOURCES), []));

test('ch2: quiz answers match the spec', () => {
  eq(ch2Script.quizzes.map(q => q.options[q.answer]), ['양규', '끌려가던 백성을 구했다']);
});

test('ch2: scene builds with 3 npcs, 3 wall zones with hidden ladders, 7 captive groups and 3 lane guards', () => {
  const w = testWorld();
  const s = buildCh2Scene(w);
  eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['soldier', 'villager', 'yanggyu']);
  eq(s.ladders.length, 3); eq(s.zones.length, 3);
  ok(s.ladders.every(l => !l.group.visible), 'ladders start hidden');
  eq(s.captives.length, 7); eq(s.guards.length, 3);
  ok(s.defenders.length >= 4, 'four soldiers for the board');
  w.dispose();
});

test('ch2: completes with touch-only actions', async () => {
  const s = touchSetup(ch2Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[1], ch2, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.easyModeUsed, false);
    eq(r.stars, 3);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

test('ch2: resume at minigame starts the wall command board', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    ch2.buildScene(s.w, s.ctx);
    ch2.enterStage(s.ctx, 'minigame');
    ch2.minigame(s.ctx); // 끝까지 기다리지 않는다
    await sleep(100);
    eq(s.w.camMode, 'fixed');
    ok(s.ui.textContent.includes('성벽 지휘판'), 'how-to card for the wall');
  } finally { s.done(); }
});

test('ch2: failing a wave twice repeats only that wave and then turns on easy mode', async () => {
  const s = touchSetup(ch2Script.speakers);
  const bot = touchBot(s, { answers, noTaps: () => (s.ctx.testHooks.wallAttempts || 0) <= 2 });
  try {
    ch2.buildScene(s.w, s.ctx);
    const r = await ch2.minigame(s.ctx);
    eq(s.ctx.testHooks.wallAttempts, 5, 'wave 1 three times, then waves 2 and 3');
    eq(s.ctx.testHooks.wallEasy, [false, false, true, true, true]);
    eq(r.easyModeUsed, true); eq(r.firstTryCorrect, 1);
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

import { roam } from '../core/flow.js';
test('roam: a zone that becomes active while the player stands in it fires', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    let active = false, fired = 0;
    s.w.player.position.set(0, 0, 0);
    const stop = roam(s.ctx, { onTalk: async () => {}, zones: [{ x: 0, z: 0, r: 2, active: () => active, onEnter: () => { fired += 1; } }] });
    s.w.step(0.016, { x: 0, z: 0 });
    eq(fired, 0);
    active = true;
    s.w.step(0.016, { x: 0, z: 0 });
    eq(fired, 1);
    stop();
  } finally { s.done(); }
});

test('ch2: a ladder is carried in and raised by a Khitan soldier before anyone climbs', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    ch2.minigame(s.ctx); // 끝까지 기다리지 않는다
    await sleep(50);
    s.ui.querySelector('.screen.howto button.primary').click(); // 방법 카드 '시작'
    await sleep(20);
    ok(s.ui.querySelector('.ops-board'), 'command board is shown');
    let l = null;
    for (let i = 0; i < 40 && !l; i++) { s.w.step(0.05, { x: 0, z: 0 }); l = sc.ladders.find(x => x.group.visible); }
    ok(l, 'a ladder appeared');
    ok(l.fx.carrier.visible, 'a soldier is carrying it');
    ok(l.fx.pivot.rotation.x < l.tilt - 0.3, 'ladder starts leaning back');
    ok(!l.fx.climber.visible, 'nobody climbs while it is carried and raised');
    ok(s.ui.querySelector('.ops-zone.danger'), 'the zone blinks');
    for (let i = 0; i < 52; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(Math.abs(l.fx.pivot.rotation.x - l.tilt) < 1e-6, 'ladder ends against the wall');
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(l.fx.climber.visible && l.fx.climber.position.y > 0.1, 'then a soldier climbs');
  } finally { s.done(); }
}, { timeout: 20000 });

import * as THREE from 'three';
test('ch2: all three ladders (base and top) and zone labels are on screen, above the board, at any screen shape', async () => {
  for (const aspect of [0.6, 0.75, 1, 1.33, 1.78, 2.2]) {
    const s = touchSetup(ch2Script.speakers);
    try {
      const sc = ch2.buildScene(s.w, s.ctx);
      s.w.camera.aspect = aspect; s.w.camera.updateProjectionMatrix();
      ch2.minigame(s.ctx); // 성벽 카메라까지만 본다
      await sleep(30);
      s.w.step(0.016, { x: 0, z: 0 });
      s.w.camera.updateMatrixWorld();
      const v = new THREE.Vector3();
      for (const l of sc.ladders) {
        l.group.visible = true; l.group.updateMatrixWorld(true);
        for (const p of [l.group.getWorldPosition(new THREE.Vector3()), l.top.getWorldPosition(new THREE.Vector3())]) {
          v.copy(p).project(s.w.camera);
          ok(Math.abs(v.x) < 0.95 && v.y < 0.92 && v.y > -0.5, `aspect ${aspect}, ladder ${l.x}: ${v.x.toFixed(2)}, ${v.y.toFixed(2)}`);
        }
      }
    } finally { s.done(); }
  }
}, { timeout: 30000 });

test('roam: talking moves the camera close to the speaker and back afterwards', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    s.w.addNpc('yanggyu', { robe: 0x7a2a1e, hat: 'general' }, 0, -2, 0);
    s.w.player.position.set(0, 0, 0);
    s.w.snapCamera();
    let during = null, dist = null;
    let release;
    const stop = roam(s.ctx, { onTalk: async () => { await new Promise(r => { release = r; }); } });
    s.w.step(0.016, { x: 0, z: 0 });
    s.hud.talkBtn.click();
    await sleep(10);
    for (let i = 0; i < 60; i++) s.w.step(0.05, { x: 0, z: 0 });
    during = s.w.camMode;
    dist = s.w.camera.position.distanceTo(s.w.npcs.get('yanggyu').mesh.position);
    release(); await sleep(10);
    eq(during, 'talk');
    ok(dist < 6, `camera near the speaker (${dist.toFixed(1)})`);
    eq(s.w.camMode, 'follow');
    stop();
  } finally { s.done(); }
});

async function untilRescue(s, sc) {
  const bot = touchBot(s, { answers });
  ch2.minigame(s.ctx); // 성벽은 봇이 막고, 눈밭에 도착하면 멈춘다
  for (let i = 0; i < 4000 && !sc.field.visible; i++) await sleep(15);
  bot.stop();
  for (let i = 0; i < 100 && !s.ui.querySelector('.screen.howto'); i++) await sleep(15);
  s.ui.querySelector('.screen.howto button.primary')?.click();
  await sleep(30);
}

test('ch2 escort: captives start ahead of the player, inside the camera view', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    await untilRescue(s, sc);
    s.w.step(0.016, { x: 0, z: 0 }); s.w.camera.updateMatrixWorld();
    const pz = s.w.player.position.z, v = new THREE.Vector3();
    const shown = sc.captives.filter(c => c.root.visible);
    eq(shown.length, 2, 'first wave: two groups');
    for (const c of shown) {
      ok(c.root.position.z < pz, `captive z ${c.root.position.z.toFixed(1)} is north of player ${pz.toFixed(1)}`);
      v.copy(c.root.position).project(s.w.camera);
      ok(v.z < 1 && Math.abs(v.y) < 1 && Math.abs(v.x) < 1, `captive on screen (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
    }
    const g = s.w.getGoal(); ok(g && g.z < pz, 'goal arrow points forward (up the screen)');
  } finally { s.done(); }
}, { timeout: 150000 });

test('ch2 escort: arrow up moves the player up the screen', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    await untilRescue(s, sc);
    const v = new THREE.Vector3();
    s.w.camera.updateMatrixWorld();
    const y0 = v.copy(s.w.player.position).project(s.w.camera).y, z0 = s.w.player.position.z;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    for (let i = 0; i < 10; i++) s.w.step(0.05, s.input.move());
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp' }));
    ok(s.w.player.position.z < z0, 'moved north');
    s.w.camera.updateMatrixWorld();
    ok(v.copy(s.w.player.position).project(s.w.camera).y >= y0 - 0.05, 'not moving down the screen');
  } finally { s.done(); }
}, { timeout: 150000 });

test('ch2: no captive or guard is left on the field after the rescue (quiz follows right away)', async () => {
  const s = touchSetup(ch2Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    await ch2.minigame(s.ctx);
    eq(sc.captives.filter(c => c.root.visible).length, 0, 'captives');
    eq(sc.guards.filter(g => g.visible).length, 0, 'guards');
    eq(s.w.player.position.z > -12, true, 'player is back inside the castle');
  } finally { bot.stop(); s.done(); }
}, { timeout: 180000 });

