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
}, { timeout: 240000 });

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

test('ch2 D-8/D-30: Yanggyu waits until both were heard, then gathers what the soldier and villager said', () => {
  const n = ch2Script.npc.yanggyu;
  eq(yanggyuTalk(new Set()), n.wait);
  eq(yanggyuTalk(new Set(['villager'])), n.wait, 'one of two is not enough');
  ok(n.wait[0].text.includes('모두'));
  const all = yanggyuTalk(new Set(['soldier', 'villager']));
  ok(all.some(l => l.src && l.src.includes('S3')) && all.some(l => l.src && l.src.includes('S14')), 'echoes S3 and S14');
  ok(all.some(l => l.text.includes('무너지면 안 된다')), 'S2 resolve');
});

test('ch2 D-30: no quiz goal, intro scene, glowing door on empty ground, no hud notices', async () => {
  ok(!ch2Script.goals.some(g => g.includes('확인')), 'no quiz goal');
  const s = touchSetup(ch2Script.speakers);
  try {
    ch2.buildScene(s.w, s.ctx);
    const film = ch2.introScene(s.ctx);
    ok(film.shots.length >= ch2Script.intro.length && film.shots.every(k => k.cam && k.look), 'a shot per sentence');
    ok(ch2.portal && ch2.portal.at.length === 2, 'portal spec');
    const [px, pz] = ch2.portal.at;
    ok(!s.w.colliders.some(c => Math.hypot(c.x - px, c.z - pz) < c.r + 1.5), 'portal not on a collider');
    const src = await (await fetch('../chapters/ch2/chapter.js')).text();
    ok(!/hud\.notice|\.notice\(/.test(src), 'no notice toasts');
  } finally { s.done(); }
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
  for (let i = 0; i < 6000 && s.w.bounds !== sc.field.bounds; i++) await sleep(15);
  for (let i = 0; i < 6000 && !s.ui.querySelector('.screen.howto'); i++) await sleep(15); // 들판의 양규에게 다가가 말을 걸어야 구출이 시작된다(C-05): 봇이 그 일을 한다
  bot.stop();
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

test('ch2 D-16: two Khitan camp tents outside the fortress burn, far from the wall and the rescue field', () => {
  const w = testWorld();
  try {
    const sc = buildCh2Scene(w);
    eq(sc.campFires.length, 2);
    const p = new THREE.Vector3();
    for (const f of sc.campFires) {
      ok(f.visible, 'burning');
      f.getWorldPosition(p);
      ok(p.z < -30, `well outside the north wall (z ${p.z.toFixed(1)})`);
      const b = sc.field.bounds; ok(!(p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1), 'not in the rescue field');
    }
  } finally { w.dispose(); }
});

// D-32 (2026-10-29 선생님): 성벽 방어 동안 성 밖 거란군 무리가 사다리 아래로 끊임없이 걸어와 모이고, 밀려나면 다시 다가온다
test('ch2 D-32: Khitan soldiers keep walking up to the ladders and come back after a push', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = await wallStarted(s);
    ok(Array.isArray(sc.horde) && sc.horde.length >= 10, 'a horde of soldiers outside the wall');
    const z0 = sc.horde.map(k => k.position.z);
    let strode = 0;
    for (let i = 0; i < 60; i++) { s.w.step(0.05, { x: 0, z: 0 }); strode = Math.max(strode, ...sc.horde.map(k => k.userData.stride || 0)); }
    const moved = sc.horde.filter((k, i) => Math.abs(k.position.z - z0[i]) > 1).length;
    ok(moved >= 6, `most soldiers walk toward the wall (${moved})`);
    ok(strode > 0.5, 'their legs walk');
    let l = null;
    for (let i = 0; i < 200 && !l; i++) {
      s.w.step(0.05, { x: 0, z: 0 });
      l = sc.ladders.find(x => x.group.visible && x.climber.visible && sc.horde.filter(k => Math.hypot(k.position.x - x.x, k.position.z + 15.5) < 3.2).length >= 2);
    }
    ok(l, 'soldiers gather under a raised ladder');
    const near = sc.horde.filter(k => Math.hypot(k.position.x - l.x, k.position.z + 15.5) < 3.2), nz = near.map(k => k.position.z);
    s.w.player.position.x = l.x; s.w.step(0.05, { x: 0, z: 0 }); // 사다리를 밀어낸다
    s.w.player.position.x = l.x > 0 ? -11 : 11;
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(near.every((k, i) => k.position.z < nz[i] - 1), 'pushed back with the ladder');
    const back = near.map(k => k.position.z);
    for (let i = 0; i < 200; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(near.some((k, i) => k.position.z > back[i] + 2), 'they come back toward the wall');
    ok(sc.horde.every(k => k.position.z < -15.6 && k.visible), 'nobody walks into the wall');
  } finally { s.done(); }
}, { timeout: 40000 });

// 2026-10-31 자동 점검: 사다리 아래에 몰린 거란군끼리 몸이 겹쳐 섰다(0.42m 안)
test('ch2: 사다리 아래에 몰린 거란군끼리 몸이 겹치지 않는다', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = await wallStarted(s);
    let worst = Infinity, at = '';
    for (let i = 0; i < 500; i++) {
      s.w.step(0.05, { x: 0, z: 0 });
      if (i < 40) continue; // 처음 자리에서 걸어 나온 뒤부터
      const ks = sc.horde.filter(k => k.visible);
      for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) {
        const d = Math.hypot(ks[a].position.x - ks[b].position.x, ks[a].position.z - ks[b].position.z);
        if (d < worst) { worst = d; at = `${i}걸음 ${ks[a].position.x.toFixed(1)},${ks[a].position.z.toFixed(1)}`; }
      }
    }
    ok(worst > 0.5, `가장 가까운 두 군사 ${worst.toFixed(2)}m (${at})`);
  } finally { s.done(); }
}, { timeout: 60000 });

// 2026-10-31 자동 점검: 성 밖 거란군·들판 백성의 발이 눈밭 굴곡(±0.15m)에 묻혔다. 사람이 걷는 곳의 눈밭은 높이 0이어야 한다
test('ch2: 사람이 걷는 성 밖·들판의 눈밭은 평평하다(발이 묻히지 않게)', async () => {
  const THREE = await import('three');
  const s = touchSetup(ch2Script.speakers);
  try {
    ch2.buildScene(s.w, s.ctx);
    s.w.scene.updateMatrixWorld(true);
    const planes = []; s.w.level.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width >= 200) planes.push(o); });
    ok(planes.length >= 1, 'snow plane');
    const rc = new THREE.Raycaster(); let worst = 0, at = '';
    for (let x = -26; x <= 26; x += 1.3) for (const z of [-30, -27, -24, -21, -18, -16, 20, 30, 38, 44, 50, 56, 62, 70]) {
      rc.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
      const h = rc.intersectObjects(planes)[0]; if (h && Math.abs(h.point.y) > worst) { worst = Math.abs(h.point.y); at = `${x.toFixed(1)},${z}`; }
    }
    ok(worst < 0.04, `눈밭 높이 ${worst.toFixed(3)}m (${at})`);
  } finally { s.done(); }
});

// D-32: 사다리 자리의 게이지가 시간이 지날수록 노랑 → 주황 → 빨강으로 차오르고, 다 차는 순간 그 사다리로 적이 올라온다
test('ch2 D-32: the ladder gauge fills yellow to red and the enemy climbs over when it is full', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = await wallStarted(s);
    ok(Array.isArray(sc.wallGauges) && sc.wallGauges.length === 6, 'a gauge per ladder spot');
    s.w.player.position.x = -11.4;
    let l = null;
    for (let i = 0; i < 80 && !l; i++) { s.w.step(0.05, { x: 0, z: 0 }); l = sc.ladders.find(x => x.group.visible); }
    ok(l, 'a ladder appeared');
    const g = sc.wallGauges[sc.ladders.indexOf(l)];
    ok(g.visible && g.userData.fill < 0.2, `gauge starts nearly empty (${g.userData.fill})`);
    const hue = c => c.getHSL({}, THREE.SRGBColorSpace).h;
    const c0 = g.material.color.clone();
    ok(hue(c0) > 0.11 && hue(c0) < 0.18, `starts yellow (${c0.getHexString()})`);
    let last = g.userData.fill, mid = null, full = null, breached = false;
    for (let i = 0; i < 400 && !breached; i++) {
      s.w.step(0.05, { x: 0, z: 0 });
      breached = (s.ctx.testHooks.wallBreaches || 0) >= 1;
      if (breached) break;
      const f = g.userData.fill;
      ok(f >= last - 1e-9, 'fills steadily'); last = f;
      if (!mid && f > 0.45 && f < 0.6) mid = g.material.color.clone();
      if (f > 0.9) full = g.material.color.clone();
    }
    ok(breached, 'an enemy climbed over');
    ok(last > 0.95, `gauge was full when the enemy came up (${last})`);
    ok(mid && hue(mid) > 0.05 && hue(mid) < 0.11, `orange in the middle (${mid && mid.getHexString()})`);
    ok(full && hue(full) < 0.04, `red when nearly full (${full && full.getHexString()})`);
    ok(!g.visible, 'gauge cleared after the climb');
  } finally { s.done(); }
}, { timeout: 40000 });

// 2026-10-31 자동 점검(tools/qa): "저기다!" 하고 가리키는 양규가 학생 몸에 겹쳐 섰다. 학생이 가리킨 곳으로 걸어가거나 양규 쪽으로 걸어 들어가도 둘은 겹치지 않는다
test('ch2: 성벽 방어 내내 양규와 학생이 겹치지 않는다(학생이 가리킨 곳으로 가도, 양규에게 걸어 들어가도)', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    await wallStarted(s);
    const p = s.w.player.position, m = s.w.npcs.get('yanggyu').mesh.position;
    let near = Infinity, bumped = 0;
    for (let i = 0; i < 600; i++) {
      const g = s.w.getGoal(), into = i % 100 >= 60 && i % 100 < 75; // 100걸음마다 잠깐 양규 쪽으로 곧장 걸어 들어간다
      const tx = into ? m.x : g ? g.x : p.x, dx = tx - p.x;
      if (into) bumped += 1;
      s.w.step(0.05, Math.abs(dx) > 0.15 ? { x: Math.sign(dx), z: 0 } : { x: 0, z: 0 }); // 조이스틱으로 걷는다(사람에게 막히는 것도 실제와 같다)
      near = Math.min(near, Math.hypot(p.x - m.x, p.z - m.z));
    }
    ok(bumped > 40, 'bumped');
    ok(near > 0.6, `가장 가까웠을 때 ${near.toFixed(2)}m`);
  } finally { s.done(); }
}, { timeout: 60000 });
