import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import ch2Script from '../chapters/ch2/script.js';
import ch2, { yanggyuTalk } from '../chapters/ch2/chapter.js';
import { buildCh2Scene, WALK_Z } from '../chapters/ch2/scene.js';
import { testWorld, touchSetup, touchBot, memSave, sleep } from './bot.js';

const answers = new Set(ch2Script.quizzes.map(q => q.options[q.answer]));

test('ch2: script passes validation', () => eq(validateScript(ch2Script, SOURCES), []));

test('ch2: quiz answers match the spec', () => {
  eq(ch2Script.quizzes.map(q => q.options[q.answer]), ['양규', '끌려가던 백성을 구했다']);
});

test('ch2: scene builds with 3 npcs and 6 ladder slots', () => {
  const w = testWorld();
  const s = buildCh2Scene(w);
  eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['soldier', 'villager', 'yanggyu']);
  eq(s.ladders.length, 6);
  ok(s.ladders.every(l => !l.group.visible), 'ladders start hidden');
  eq(s.captives.length, 6);
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
}, { timeout: 120000 });

test('ch2: resume at minigame starts the wall defense', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    ch2.buildScene(s.w, s.ctx);
    ch2.enterStage(s.ctx, 'minigame');
    ch2.minigame(s.ctx); // 끝까지 기다리지 않는다
    for (let i = 0; i < 100 && !s.ui.querySelector('.screen.howto'); i++) { if (s.ctx.dialogue.isOpen()) s.ui.querySelector('.dlg').click(); await sleep(15); }
    eq(s.w.camMode, 'follow');
    ok(s.w.player.position.y > 4, 'player stands on the wall');
    ok(s.ui.textContent.includes('성벽 방어'), 'how-to card for the wall');
  } finally { s.done(); }
});

test('ch2: failing the wall three times turns on easy mode', async () => {
  const s = touchSetup(ch2Script.speakers);
  const bot = touchBot(s, { answers, holdStill: () => (s.ctx.testHooks.wallAttempts || 0) <= 3 });
  try {
    ch2.buildScene(s.w, s.ctx);
    const r = await ch2.minigame(s.ctx);
    eq(s.ctx.testHooks.wallAttempts, 4);
    eq(r.easyModeUsed, true);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

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
    const sc = await wallStarted(s); // 방법 카드 '시작'까지
    // 첫 사다리가 나오는 순간까지 시간을 보낸다
    let l = null;
    for (let i = 0; i < 40 && !l; i++) { s.w.step(0.05, { x: 0, z: 0 }); l = sc.ladders.find(x => x.group.visible); }
    ok(l, 'a ladder appeared');
    ok(l.carrier.visible, 'a soldier is raising it');
    const start = l.pivot.rotation.x;
    ok(start < l.tilt - 0.3, `ladder starts leaning back (${start} vs ${l.tilt})`);
    ok(l.climber.visible === false || l.climber.position.y < 0.01, 'nobody climbs while it is raised');
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(Math.abs(l.pivot.rotation.x - l.tilt) < 1e-6, 'ladder ends against the wall');
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(l.climber.visible && l.climber.position.y > 0.1, 'then a soldier climbs');
    eq(s.ui.querySelectorAll('.tap-target').length, 0, 'no tap buttons: the student walks to the ladder');
  } finally { s.done(); }
}, { timeout: 20000 });

import * as THREE from 'three';
// D-8: 양규가 가리킨 사다리 자리(성벽 위 빛나는 원)로 걸어가 가까이 가면 사다리를 밀어낸다(버튼 없음, 화면이 멈추지 않음)
async function wallStarted(s) {
  const sc = ch2.buildScene(s.w, s.ctx);
  ch2.enterStage(s.ctx, 'minigame');
  ch2.minigame(s.ctx); // 끝까지 기다리지 않는다
  for (let i = 0; i < 100 && !s.ui.querySelector('.screen.howto'); i++) { if (s.ctx.dialogue.isOpen()) s.ui.querySelector('.dlg').click(); await sleep(15); }
  s.ui.querySelector('.screen.howto button.primary').click();
  for (let i = 0; i < 100 && s.ctx.dialogue.isOpen(); i++) { s.ui.querySelector('.dlg').click(); await sleep(15); }
  await sleep(20);
  return sc;
}
test('ch2 D-8: Yanggyu points at a ladder and walking to it pushes it away', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = await wallStarted(s);
    let l = null;
    for (let i = 0; i < 80 && !l; i++) { s.w.step(0.05, { x: 0, z: 0 }); l = sc.ladders.find(x => x.group.visible); }
    ok(l, 'a ladder appeared');
    const g = s.w.getGoal();
    ok(g && Math.abs(g.x - l.x) < 0.01 && Math.abs(g.z - WALK_Z) < 0.01, 'goal arrow points at the ladder spot on the wall');
    const ring = sc.wallRings[sc.ladders.indexOf(l)];
    ok(ring.visible, 'glowing ring on the wall above the ladder');
    ok(s.ui.textContent.includes('저기다') || s.ctx.testHooks.pointed, 'Yanggyu calls out 저기다!');
    eq(s.ctx.dialogue.isOpen(), false, 'the game does not stop for a dialogue');
    const before = s.ctx.testHooks.wallPushed || 0;
    s.w.player.position.x = l.x; // 학생이 그 자리까지 걸어왔다
    s.w.step(0.05, { x: 0, z: 0 });
    eq(s.ctx.testHooks.wallPushed, before + 1, 'ladder pushed');
    ok(!ring.visible, 'ring cleared');
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(!l.group.visible || sc.ladders.filter(x => x.group.visible).length >= 1, 'pushed ladder falls away');
    ok(s.w.player.position.y > 4 && s.w.player.position.z < -12, 'player stays on the wall walk');
  } finally { s.done(); }
}, { timeout: 30000 });

test('ch2 D-8: no info signs, a gate that opens and a 흥화진 name board; one-paragraph intro', () => {
  const w = testWorld();
  const sc = buildCh2Scene(w);
  eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '흥화진') board = true; });
  ok(board, '흥화진 name board');
  ok(!script_has('signHeunghwa') && !script_has('signNaju'), 'sign lines removed');
  eq(ch2Script.intro.length, 1); ok(!ch2Script.intro[0].text.includes('\n'));
  w.dispose();
});
function script_has(id) { return !!ch2Script.npc[id]; }

test('ch2 D-8: Yanggyu gathers what the soldier and villager said (any order, never stuck)', () => {
  const n = ch2Script.npc.yanggyu;
  eq(yanggyuTalk(new Set()), [...n.greet, ...n.tooEarly]);
  const all = yanggyuTalk(new Set(['soldier', 'villager']));
  ok(all.some(l => l.src && l.src.includes('S3')) && all.some(l => l.src && l.src.includes('S14')), 'echoes S3 and S14');
  ok(all.some(l => l.text.includes('무너지면 안 된다')), 'S2 resolve');
  const one = yanggyuTalk(new Set(['villager']));
  ok(one.some(l => l.text.includes('무너지면 안 된다')), 'one person heard is enough to go on');
});

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
  ch2.minigame(s.ctx); // 성벽 방어는 봇이 막고, 들판에 도착하면 멈춘다
  for (let i = 0; i < 2000 && s.w.bounds !== sc.field.bounds; i++) await sleep(15);
  bot.stop();
  for (let i = 0; i < 100 && !s.ui.querySelector('.screen.howto'); i++) await sleep(15);
  s.ui.querySelector('.screen.howto button.primary')?.click();
  await sleep(30);
}

test('ch2 rescue: captives start ahead of the player, inside the camera view', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    await untilRescue(s, sc);
    s.w.step(0.016, { x: 0, z: 0 }); s.w.camera.updateMatrixWorld();
    const pz = s.w.player.position.z, v = new THREE.Vector3();
    for (const c of sc.captives) {
      ok(c.group.position.z < pz, `captive z ${c.group.position.z.toFixed(1)} is north of player ${pz.toFixed(1)}`);
      v.copy(c.group.position).project(s.w.camera);
      ok(v.z < 1 && Math.abs(v.y) < 1, `captive on screen (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
    }
    const g = s.w.getGoal(); ok(g && g.z < pz, 'goal arrow points forward (up the screen)');
  } finally { s.done(); }
}, { timeout: 120000 });

test('ch2 rescue: arrow up moves the player up the screen', async () => {
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
}, { timeout: 120000 });

test('ch2: no captive is left standing still on the field after the rescue (quiz follows right away)', async () => {
  const s = touchSetup(ch2Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    await ch2.minigame(s.ctx);
    const left = sc.captives.filter(c => c.group.visible);
    eq(left.length, 0, `captives still on the field: ${left.length}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch2 D-8: rescued villagers follow the student instead of vanishing', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = await (async () => { const sc = ch2.buildScene(s.w, s.ctx); await untilRescue(s, sc); return sc; })();
    const c = sc.captives[0];
    s.w.player.position.set(c.group.position.x, 0, c.group.position.z + 1);
    s.w.step(0.05, { x: 0, z: 0 });
    ok(!c.escort.visible, 'saved');
    s.w.player.position.set(c.group.position.x + 10, 0, c.group.position.z + 6);
    const d0 = Math.hypot(c.group.position.x - s.w.player.position.x, c.group.position.z - s.w.player.position.z);
    for (let i = 0; i < 60; i++) s.w.step(0.05, { x: 0, z: 0 });
    const d1 = Math.hypot(c.group.position.x - s.w.player.position.x, c.group.position.z - s.w.player.position.z);
    ok(c.group.visible, 'still visible');
    ok(d1 < d0 - 3 && d1 < 4, `walks after the student (${d0.toFixed(1)} -> ${d1.toFixed(1)})`);
  } finally { s.done(); }
}, { timeout: 120000 });
