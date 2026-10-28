import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import ch4Script from '../chapters/ch4/script.js';
import { buildCh4Scene } from '../chapters/ch4/scene.js';
import { testWorld } from './bot.js';

test('ch4: script passes validation', () => eq(validateScript(ch4Script, SOURCES), []));

test('ch4: quiz answers and capital reason match the spec', () => {
  eq(ch4Script.quizzes.map(q => q.options[q.answer]), ['몽골군이 바다와 물에서 싸우는 데 약해서', '김윤후']);
  eq(ch4Script.capital.reason.options.find(o => o.correct).text, '몽골군을 상대로 바다와 물에서 싸우면 고려가 유리할 것입니다.');
  for (const [id, sp] of Object.entries(ch4Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
});

test('ch4: scene builds with npcs and areas', () => {
  const w = testWorld();
  const s = buildCh4Scene(w);
  ok(w.npcs.has('minister') && w.npcs.has('kimyunhu'), 'npcs');
  ok(s.areas.palace && s.areas.ganghwa && s.areas.cheoin && s.areas.chungju, 'four areas');
  eq(s.mongols.length, 8);
  ok(s.mongols.every(m => !m.group.visible), 'attackers start hidden');
  eq(s.documents.visible, true);
  w.dispose();
});

import * as THREE from 'three';
import ch4 from '../chapters/ch4/chapter.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import { touchSetup, touchBot, memSave, sleep } from './bot.js';
const answers = new Set([...ch4Script.quizzes.map(q => q.options[q.answer]), ch4Script.capital.reason.options.find(o => o.correct).text]);

test('ch4: completes with touch-only actions', async () => {
  const s = touchSetup(ch4Script.speakers);
  const bot = touchBot(s, { answers, mapPicks: ['ganghwa'] });
  try {
    const r = await runChapter(CHAPTERS[3], ch4, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch4: picking 개경 first gives a hint and retries', async () => {
  const s = touchSetup(ch4Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers, mapPicks: ['gaegyeong', 'ganghwa'] });
  try {
    ch4.buildScene(s.w, s.ctx);
    await ch4.minigame(s.ctx);
    ok(said.includes(ch4Script.capital.places[0].hint), 'hint for 개경');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch4: approaching Mongols are on screen at any screen shape', () => {
  for (const aspect of [0.6, 0.75, 1, 1.33, 1.78, 2.2]) {
    const s = touchSetup(ch4Script.speakers);
    try {
      const sc = ch4.buildScene(s.w, s.ctx);
      s.w.camera.aspect = aspect;
      const f = sc.areas.cheoin.fit;
      s.w.fitFixedCamera(f.target, f.dir, f.points);
      s.w.camera.updateMatrixWorld();
      const v = new THREE.Vector3();
      for (const p of f.points) { v.set(...p).project(s.w.camera); ok(Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.92, `aspect ${aspect}: ${v.x.toFixed(2)},${v.y.toFixed(2)}`); }
    } finally { s.done(); }
  }
});

test('ch4: map and reason hints make no unsourced claims', () => {
  const hints = [...ch4Script.capital.places.map(p => p.hint), ...ch4Script.capital.reason.options.map(o => o.hint)].filter(Boolean);
  ok(!hints.some(h => h.includes('넓은 땅')), 'no claim about the size of Ganghwa');
});

test('ch4: the envoy incident comes before the invasion, with its source and an open culprit', () => {
  const lines = [...ch4Script.intro, ...ch4Script.jeogo.before, ...ch4Script.jeogo.after]; // 해설 카드 → 압록강 가 장면
  const story = lines.map(l => l.text).join(' ');
  const iEnvoy = story.indexOf('저고여'), iInvade = story.indexOf('1231년 8월');
  ok(iEnvoy >= 0 && iInvade > iEnvoy, 'envoy story first, then the 1231 invasion');
  ok(story.includes('밝혀지지 않았'), 'says the culprit is unknown');
  ok(lines.some(l => l.text.includes('저고여') && l.src.includes('S22')), 'envoy line cites S22');
  ok(ch4Script.npc.minister.heard.some(l => l.text.includes('사신') && l.src && l.src.includes('S22')), 'minister mentions it');
});

test('ch4 D-13: archers rise; walking to the spot Kim Yun-hu points at makes an archer shoot (no buttons)', async () => {
  const { cheoinDefense, putOnCheoinWall } = await import('../chapters/ch4/chapter.js');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ok(sc.archers.every(a => !a.group.visible), 'hidden before the battle');
    putOnCheoinWall(s.ctx);
    ok(s.w.player.position.y > 2, `student on the wall (y ${s.w.player.position.y.toFixed(2)})`);
    cheoinDefense(s.ctx, false);
    const step = n => { for (let i = 0; i < n; i++) s.w.step(0.05, { x: 0, z: 0 }); };
    step(20);
    ok(sc.archers.every(a => a.group.visible), 'archers appear');
    ok(Math.max(...sc.archers.map(a => a.group.position.y)) > 0.5, 'archers stand up on the wall');
    eq(s.ui.querySelectorAll('.tap-target').length, 0, 'no tap buttons');
    const target = sc.mongols.find(m => m.group.visible);
    ok(target, 'a Mongol approaches');
    ok(sc.spotRing.visible && s.ctx.testHooks.pointed, 'Kim Yun-hu points at a glowing spot');
    const g = s.w.getGoal(); ok(g && Math.abs(g.x - s.ctx.testHooks.spot.x) < 0.01, 'arrow to the spot');
    s.w.player.position.set(s.ctx.testHooks.spot.x, 2.4, s.ctx.testHooks.spot.z);
    step(1);
    eq(s.ctx.testHooks.cheoinShot, 1, 'shot');
    ok(sc.arrows.some(a => a.visible), 'an arrow flies');
    step(24);
    ok(target.group.rotation.x < -0.6, `falls backward (rx ${target.group.rotation.x.toFixed(2)})`);
    ok(s.w.player.position.y > 2, 'student stays on the wall');
  } finally { s.done(); }
});

test('ch4 D-13: the wall walk keeps the student on the ramp or on top of the north wall', async () => {
  const { cheoinPlace, CHEOIN } = await import('../chapters/ch4/scene.js');
  const p = { x: CHEOIN.x, z: -30 }; // 성 밖 들판 → 성벽 위로
  const y = cheoinPlace(p);
  eq(y, CHEOIN.top);
  ok(Math.abs(Math.hypot(p.x - CHEOIN.x, p.z) - CHEOIN.R) < 0.3, 'on the wall ring');
  const q = { x: CHEOIN.x + Math.cos(CHEOIN.rampA) * (CHEOIN.ramp0 + 1), z: Math.sin(CHEOIN.rampA) * (CHEOIN.ramp0 + 1) };
  const yq = cheoinPlace(q);
  ok(yq > 0 && yq < CHEOIN.top, `on the ramp (${yq.toFixed(2)})`);
});

test('ch4 D-13: villager then minister; minister alone first is never stuck; gate and 개경 board; one-paragraph intro', async () => {
  const { ministerTalk } = await import('../chapters/ch4/chapter.js');
  const n = ch4Script.npc.minister;
  eq(ministerTalk(new Set()), n.tooEarly);
  const all = ministerTalk(new Set(['villager']));
  ok(all.some(l => l.src && l.src.includes('S10')) && all[all.length - 1].text.includes('지도'), 'leads to the map');
  const w = testWorld();
  const sc = buildCh4Scene(w);
  ok(w.npcs.has('villager'), 'villager');
  ok(sc.palaceGate && sc.palaceGate.leaves.length === 2, 'gate');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '개경') board = true; });
  ok(board, '개경 name board');
  eq([...w.npcs.values()].filter(x => x.spot).length, 0, 'no reading signs');
  eq(ch4Script.intro.length, 1); ok(!ch4Script.intro[0].text.includes('\n'));
  w.dispose();
});

test('ch4 D-14: the slave documents are carried to the pile, then burn with flickering flames that die down to smoke and ash', async () => {
  const { setupChungju, carryDocuments } = await import('../chapters/ch4/chapter.js');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    setupChungju(s.ctx);
    let done = false;
    carryDocuments(s.ctx).then(() => { done = true; });
    for (let k = 0; k < 3; k++) {
      const g1 = s.w.getGoal(); s.w.player.position.set(g1.x, 0, g1.z); s.w.step(0.05, { x: 0, z: 0 });
      ok(s.w.player.children.includes(sc.bundles[k]), `carrying bundle ${k + 1}`);
      const g2 = s.w.getGoal(); s.w.player.position.set(g2.x, 0, g2.z); s.w.step(0.05, { x: 0, z: 0 });
    }
    await sleep(5);
    ok(done, 'all three placed');
    eq(sc.fire.visible, false, 'no fire before burning');
    sc.burnDocuments();
    for (let i = 0; i < 30; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.fire.visible && sc.fire.children.some(f => f.visible && f.material.transparent && f.material.color.r > 0.8 && f.material.color.b < 0.4), 'orange-yellow flames');
    const h1 = sc.fire.children.map(f => f.scale.y).join();
    s.w.step(0.05, { x: 0, z: 0 }); s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.fire.children.map(f => f.scale.y).join() !== h1, 'flames flicker');
    for (let i = 0; i < 140; i++) s.w.step(0.05, { x: 0, z: 0 });
    eq(sc.fire.visible, false, 'fire dies down');
    ok(sc.smoke.visible && sc.ashPile.visible, 'smoke and ash');
    eq(sc.documents.visible, false);
  } finally { s.done(); }
});

test('ch4 D-14: after the burning, the slaves and people cheer in place, both arms up and down, each with its own beat', async () => {
  const { cheer } = await import('../chapters/ch4/chapter.js');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const before = sc.people.map(p => [p.position.x, p.position.z]);
    const stop = cheer(s.ctx);
    const hi = sc.people.map(() => 0), lo = sc.people.map(() => 0);
    let differ = false;
    for (let i = 0; i < 60; i++) {
      s.w.step(0.05, { x: 0, z: 0 });
      sc.people.forEach((p, j) => { const a = p.userData.arms; hi[j] = Math.min(hi[j], a[0].rotation.x, a[1].rotation.x); lo[j] = Math.max(lo[j], a[0].rotation.x); });
      if (Math.abs(sc.people[0].userData.arms[0].rotation.x - sc.people[1].userData.arms[0].rotation.x) > 0.3) differ = true;
    }
    ok(hi.every(v => v < -2.6), 'arms go up over the head');
    ok(lo.every((v, j) => v - hi[j] > 0.8), 'and come down again');
    ok(differ, 'not all in the same beat');
    sc.people.forEach((p, j) => ok(Math.hypot(p.position.x - before[j][0], p.position.z - before[j][1]) < 0.01, 'stays in place'));
    stop();
  } finally { s.done(); }
});

test('ch4 D-14: Mongols come only from the field in front, on screen from the wall camera', async () => {
  const { putOnCheoinWall } = await import('../chapters/ch4/chapter.js');
  for (const aspect of [1.33, 1.6, 1.78]) {
    const s = touchSetup(ch4Script.speakers);
    try {
      const sc = ch4.buildScene(s.w, s.ctx);
      s.w.camera.aspect = aspect; s.w.camera.updateProjectionMatrix();
      putOnCheoinWall(s.ctx);
      s.w.camera.updateMatrixWorld();
      const v = new THREE.Vector3(), A = sc.areas.cheoin;
      for (const m of sc.mongols) {
        v.set(A.center[0] + Math.cos(m.angle) * A.spawnR, 2, Math.sin(m.angle) * A.spawnR).project(s.w.camera);
        ok(Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95, `aspect ${aspect}: ${v.x.toFixed(2)},${v.y.toFixed(2)}`);
      }
    } finally { s.done(); }
  }
});

test('ch4 D-14: a masked soldier with no marks of any country shoots from behind a bush; the envoy walks, is hit and falls; the soldier slips away into the trees', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const J = sc.areas.jeogo, A = J.archer, E = J.envoy;
    ok(A.getObjectByName('mask') && A.getObjectByName('hood'), 'masked and hooded');
    let marks = false; A.traverse(o => { if (/flag|banner|hat:/.test(o.name)) marks = true; });
    ok(!marks, 'no flag or national hat');
    J.play();
    let swing = 0, shot = false, hitBeforeFall = true, minY = 0, camX = new Set(), fellAt = -1;
    for (let i = 0; i < 230; i++) {
      s.w.step(0.05, { x: 0, z: 0 });
      swing = Math.max(swing, Math.abs(E.userData.legs[0].rotation.x));
      if (J.arrow.visible) shot = true;
      if (E.rotation.x < -0.5 && fellAt < 0) { fellAt = i; if (!shot) hitBeforeFall = false; }
      minY = Math.min(minY, A.position.y);
      camX.add(Math.round(s.w.camera.position.x));
    }
    ok(swing > 0.3, 'the envoy walks with swinging legs');
    ok(shot && hitBeforeFall, 'an arrow flies before he falls');
    ok(E.rotation.x < -1.2, 'he falls');
    ok(minY > -0.01, 'the soldier never sinks into the ground');
    eq(A.visible, false, 'the soldier is gone');
    ok(camX.size > 2, 'the camera follows the road');
    ok(ch4Script.jeogo.after[0].text.includes('누가 죽였는지는 끝내 밝혀지지 않았어요.'), 'culprit line kept');
  } finally { s.done(); }
});

test('ch4: resume at minigame puts the player in the palace', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ch4.enterStage(s.ctx, 'minigame');
    eq(s.w.bounds, sc.areas.palace.bounds);
  } finally { s.done(); }
});

test('ch4: resume at quiz shows Chungju with the slave documents already turned to ash', () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    ch4.enterStage(s.ctx, 'quiz');
    eq(s.w.camMode, 'fixed');
    eq(s.w.player.visible, false);
    eq(sc.documents.visible, false, 'documents gone');
    eq(sc.smoke.visible, true, 'smoke still rising');
    eq(sc.ashPile.visible, true, 'ash left');
  } finally { s.done(); }
});

