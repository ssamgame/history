import { test, eq, ok } from './harness.js';
import { buildCh1Scene } from '../chapters/ch1/scene.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

test('ch1: scene builds with 4 npcs and hidden pillars', () => {
  const w = testWorld();
  const s = buildCh1Scene(w);
  eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['archer', 'officer', 'seohui', 'soldier']);
  eq(s.gangdongPillars.visible, false);
  eq(s.gangdongPillars.children.filter(c => c.isSprite).length, 6);
  ok(s.khitanGroup.children.length > 0);
  eq(w.bounds, { x0: -30.8, x1: 30.8, z0: -14.4, z1: 22 });
  w.dispose();
});

test('ch1: low quality scene builds with flat water and fewer embers', () => {
  const lo = testWorld('low'); const a = buildCh1Scene(lo);
  const hi = testWorld('high'); const b = buildCh1Scene(hi);
  ok(a.emberCount < b.emberCount, `${a.emberCount} < ${b.emberCount}`);
  lo.dispose(); hi.dispose();
});

// ---- 1장 대사와 진행 ----
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import ch1Script from '../chapters/ch1/script.js';
import ch1, { introWalk, INTRO_FROM, START, seohuiTalk, followSeohui } from '../chapters/ch1/chapter.js';
import * as THREE from 'three';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';

const answers = new Set([
  ...[ch1Script.negotiation.q1, ch1Script.negotiation.q2].map(c => c.options.find(o => o.correct).text),
  ...ch1Script.quizzes.map(q => q.options[q.answer]),
]);

test('ch1: script passes validation', () => eq(validateScript(ch1Script, SOURCES), []));

test('ch1: correct answers use the exact sentences', () => {
  eq(ch1Script.negotiation.q1.options.find(o => o.correct).text, '고려는 고구려를 이은 나라이다.');
  eq(ch1Script.negotiation.q2.options.find(o => o.correct).text, '여진이 길을 막고 있어서 거란과 교류를 할 수 없다.');
  eq(ch1Script.negotiation.q2.prompt.text, '고려는 왜 가까운 거란과 친하게 지내지 않느냐?');
  eq(ch1Script.quizzes.length, 2);
});


test('ch1: completes with touch-only actions', async () => {
  const s = touchSetup(ch1Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[0], ch1, s.ctx, memSave());
    eq(r.firstTryTotal, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.quizCorrect, 2);
    eq(r.stars, 3);
    ok(bot.taps >= 2, 'talked through the touch button');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('ch1: wrong first answer gives hint and lowers firstTryCorrect', async () => {
  const s = touchSetup(ch1Script.speakers);
  const bot = touchBot(s, { answers, wrongFirst: new Set(['고려는 고구려를 이은 나라이다.']) });
  try {
    ch1.buildScene(s.w, s.ctx);
    const r = await ch1.minigame(s.ctx);
    eq(r, { firstTryCorrect: 1, firstTryTotal: 2, easyModeUsed: false });
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });

// D-5: 고려 1장 정식 — 낮은 카메라·정면 대화·문을 열고 들어오는 시작 장면과 장소 이름판
test('ch1: camp gate has two leaves on the road and a name board just inside (not a spot)', () => {
  const w = testWorld();
  const sc = buildCh1Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  const gz = sc.gate.z;
  ok(gz < INTRO_FROM[1] && gz > START[1], 'gate between intro start and start');
  sc.gate.setOpen(0); eq(sc.gate.leaves.map(l => +l.rotation.y.toFixed(2)), [0, 0]);
  sc.gate.setOpen(1); ok(sc.gate.leaves.every(l => Math.abs(l.rotation.y) > 1.3), 'opens');
  const board = w.level.getObjectByName('sign:고려군 진영');
  ok(board, 'name board');
  ok(board.position.z < gz && board.position.z > gz - 6 && Math.abs(board.position.x) > 1.5 && Math.abs(board.position.x) < 6, 'beside the road inside the gate');
  ok(![...w.npcs.values()].some(n => n.mesh === board), 'not a reading spot');
  w.dispose();
});

test('ch1: intro walk path from outside the camp is not blocked by colliders', () => {
  const w = testWorld();
  buildCh1Scene(w);
  ok(INTRO_FROM[1] > w.bounds.z1, 'starts outside the camp');
  for (let t = 0; t <= 1; t += 0.02) {
    const x = INTRO_FROM[0] + (START[0] - INTRO_FROM[0]) * t, z = INTRO_FROM[1] + (START[1] - INTRO_FROM[1]) * t;
    for (const c of w.colliders) ok(Math.hypot(x - c.x, z - c.z) > c.r + 0.45, `blocked at ${x},${z}`);
  }
  w.dispose();
});

test('ch1: intro walk brings the player in 3~5 s with input off, then restores; a key skips it', async () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    ch1.buildScene(s.w, s.ctx);
    const b0 = { ...s.w.bounds };
    s.ctx.input.enabled = true;
    let done = false;
    const p = introWalk(s.ctx).then(() => { done = true; });
    eq(s.ctx.input.enabled, false);
    ok(s.w.player.position.z > b0.z1, 'starts outside');
    let t = 0;
    for (; t < 8 && !done; t += 1 / 30) { s.w.step(1 / 30, { x: 0, z: 0 }); await Promise.resolve(); }
    await p;
    ok(t >= 3 && t <= 5.2, 'took ' + t.toFixed(2) + ' s');
    const leaves = []; s.w.level.traverse(o => { if (o.name === 'gateLeaf') leaves.push(o); });
    ok(leaves.length === 2 && leaves.every(l => Math.abs(l.rotation.y) > 1.3), 'gate left open');
    ok(Math.hypot(s.w.player.position.x - START[0], s.w.player.position.z - START[1]) < 0.3, 'at start');
    eq(s.w.bounds, b0); eq(s.w.autoMove, null);
    // 건너뛰기: 키를 누르면 바로 끝난다
    const q = introWalk(s.ctx);
    s.w.step(1 / 30, { x: 0, z: 0 });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    await q;
    ok(Math.hypot(s.w.player.position.x - START[0], s.w.player.position.z - START[1]) < 0.3, 'skip lands at start');
    eq(s.w.bounds, b0);
  } finally { s.done(); }
});

// D-6: 서희를 따라 걷는 담판 + 말이 모이는 탐험 + 큰 천막
test('ch1 D-6: goals walk with Seohui instead of going to the ferry', () => {
  eq(ch1Script.goals.length, 5);
  ok(ch1Script.goals[0].includes('이야기'), 'people first');
  ok(ch1Script.goals[2].includes('서희를 따라'), 'follow Seohui');
  ok(!ch1Script.goals.join().includes('나루터'), 'no ferry goal');
});

test('ch1 D-6: Seohui picks up what the student heard and ends with "no land"', () => {
  const sh = ch1Script.npc.seohui;
  eq(seohuiTalk(new Set()), sh.tooEarly);
  const all = seohuiTalk(new Set(['archer', 'officer', 'soldier']));
  const at = k => all.indexOf(sh.heard[k]);
  ok(at('soldier') > 0 && at('officer') > at('soldier') && at('archer') > at('officer'), 'heard lines in order');
  const land = all.findIndex(l => l.who === 'seohui' && /땅을/.test(l.text) && /없다/.test(l.text) && (l.src || []).includes('S17'));
  ok(land > at('archer'), 'land line comes after what was heard');
  const one = seohuiTalk(new Set(['soldier']));
  ok(one.includes(sh.heard.soldier) && !one.includes(sh.heard.officer) && !one.includes(sh.heard.archer), 'only what was heard');
  ok(one.some(l => /땅을/.test(l.text)), 'still says no land');
});

function walkFollow(s, maxT = 90) {
  const w = s.w; let done = false, t = 0, wet = null;
  const p = followSeohui(s.ctx).then(() => { done = true; });
  return { p, run: async (holdFor = 0) => {
    for (; t < maxT && !done; t += 1 / 30) {
      let mv = { x: 0, z: 0 };
      const g = w.getGoal(), q = w.player.position;
      if (t >= holdFor && g) { const dx = g.x - q.x, dz = g.z - q.z, d = Math.hypot(dx, dz); if (d > 1) mv = { x: dx / d, z: dz / d }; }
      w.step(1 / 30, mv);
      if (q.z < -15 && q.z > -24 && Math.abs(q.x - 8) > 1.3) wet = `${q.x.toFixed(1)},${q.z.toFixed(1)}`;
      await Promise.resolve();
    }
    await p; return { t, wet };
  } };
}

test('ch1 D-6: Seohui leads, waits for a student who stands still, and both end side by side facing Sonn', async () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    const sc = ch1.buildScene(s.w, s.ctx);
    s.w.player.position.set(-11, 0, 3.6);
    const f = walkFollow(s);
    // 3초 동안 가만히: 서희는 멀리 가 버리지 않는다
    for (let t = 0; t < 3; t += 1 / 30) { s.w.step(1 / 30, { x: 0, z: 0 }); await Promise.resolve(); }
    const m = s.w.npcs.get('seohui').mesh.position;
    ok(Math.hypot(m.x - s.w.player.position.x, m.z - s.w.player.position.z) < 6, 'Seohui waited');
    ok(Math.hypot(m.x + 11, m.z - 1.3) > 1, 'Seohui started walking');
    const r = await f.run();
    eq(r.wet, null);
    const sp = sc.negotiationSpot, q = s.w.player.position;
    ok(Math.hypot(m.x - sp.seohui[0], m.z - sp.seohui[1]) < 0.2, 'Seohui at her place');
    ok(Math.hypot(q.x - sp.player[0], q.z - sp.player[1]) < 0.2, 'student at the place');
    const gap = Math.hypot(m.x - q.x, m.z - q.z);
    ok(gap > 1.1 && gap < 2.4 && Math.abs(m.z - q.z) < 0.3, 'side by side ' + gap.toFixed(2));
    const sonn = sc.sonn.position;
    for (const o of [m, q]) { const d = o.z - sonn.z; ok(d > 2 && d < 4.5, 'facing distance ' + d.toFixed(2)); }
    eq(s.ctx.input.enabled, false);
  } finally { s.done(); }
}, { timeout: 60000 });

test('ch1 D-6: Seohui\'s path is not blocked and the river can only be crossed on the bridge', async () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    const sc = ch1.buildScene(s.w, s.ctx);
    const pts = sc.leadPath;
    for (let i = 1; i < pts.length; i++) for (let t = 0; t <= 1; t += 0.05) {
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, z = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
      for (const c of s.w.colliders) if (c !== s.w.npcs.get('seohui').collider) ok(Math.hypot(x - c.x, z - c.z) > c.r + 0.4, `blocked at ${x.toFixed(1)},${z.toFixed(1)}`);
    }
    s.w.player.position.set(2, 0, -13);
    followSeohui(s.ctx);
    for (let t = 0; t < 2; t += 1 / 30) s.w.step(1 / 30, { x: 0, z: -1 });
    ok(s.w.player.position.z > -14.6, 'river bank stops the student');
  } finally { s.done(); }
});

test('ch1 D-6: negotiation stays in the same scene and faces Sonn from the front, nothing in the way', async () => {
  const s = touchSetup(ch1Script.speakers);
  const events = []; let shot = null;
  const fade0 = s.ctx.fade; s.ctx.fade = async v => { events.push('fade'); return fade0(v); };
  const ask0 = s.dialogue.ask;
  s.dialogue.ask = c => { events.push('ask'); if (!shot) { for (let i = 0; i < 60; i++) s.w.step(1 / 30, { x: 0, z: 0 }); shot = s.w.camera.position.clone(); } return ask0(c); };
  const answers = new Set([ch1Script.negotiation.q1, ch1Script.negotiation.q2].map(c => c.options.find(o => o.correct).text));
  const bot = touchBot(s, { answers });
  try {
    const sc = ch1.buildScene(s.w, s.ctx);
    await ch1.minigame(s.ctx);
    ok(events.indexOf('fade') === -1 || events.indexOf('fade') > events.lastIndexOf('ask'), 'no fade before the answers: ' + events.join(','));
    const sonn = sc.sonn, cam = s.w.camera;
    const face = new THREE.Vector3(Math.sin(sonn.rotation.y), 0, Math.cos(sonn.rotation.y));
    const to = shot.clone().sub(sonn.position).setY(0).normalize();
    ok(face.dot(to) > 0.9, 'camera in front of Sonn ' + face.dot(to).toFixed(2));
    // 그 카메라에서 소손녕·서희 얼굴까지 가리는 것이 없다(큰 천막 포함)
    cam.position.copy(shot); s.w.level.updateMatrixWorld(true);
    const sh = s.w.npcs.get('seohui').mesh;
    for (const [who, obj] of [['Sonn', sonn], ['Seohui', sh]]) {
      const head = obj.getWorldPosition(new THREE.Vector3()).setY(1.8);
      const dir = head.clone().sub(shot), dist = dir.length(); dir.normalize();
      const rc = new THREE.Raycaster(shot, dir, 0.1, dist - 0.4); rc.camera = cam;
      const vis = o => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
      const inside = o => { for (let x = o; x; x = x.parent) if (x === obj || x === s.w.player || x === sh) return true; return false; };
      const hits = rc.intersectObjects(s.w.level.children, true).filter(h => vis(h.object) && !inside(h.object) && !h.object.isSprite);
      eq(hits.map(h => h.object.name || h.object.type), [], who + ' blocked');
    }
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });

test('ch1 D-6: a wrong answer gets a short hint from Seohui', async () => {
  const s = touchSetup(ch1Script.speakers);
  const said = []; const say0 = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say0(l); };
  const bot = touchBot(s, { answers, wrongFirst: new Set(['고려는 고구려를 이은 나라이다.']) });
  try {
    ch1.buildScene(s.w, s.ctx);
    const r = await ch1.minigame(s.ctx);
    eq(r.firstTryCorrect, 1);
    const hints = ch1Script.negotiation.q1.options.map(o => o.hint).filter(Boolean);
    ok(said.some(l => l.who === 'seohui' && hints.includes(l.text)), 'hint said by Seohui');
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });
