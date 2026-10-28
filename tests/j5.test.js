import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j5Script from '../chapters/joseon/j5/script.js';
import { buildJ5Scene } from '../chapters/joseon/j5/scene.js';
import j5, { SIDES, fortTalk, kowtowPose, ministerTalk, BOW_LOOKS, PEOPLE } from '../chapters/joseon/j5/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j5Script.quizzes.map(q => q.options[q.answer]));

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
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['choemyeonggil', 'coldfolk', 'injo', 'keeper', 'kimsangheon', 'soldier']);
    eq(s.fires.length, 6);
    s.resetFires(); ok(s.fires.every(f => !f.lit));
    s.light(s.fires[0]); ok(s.fires[0].lit && s.fires[0].flame.visible);
    for (const f of s.fires) { const b = w.bounds; ok(f.x > b.x0 && f.x < b.x1 && f.z > b.z0 && f.z < b.z1, 'reachable'); }
  } finally { w.dispose(); }
});

test('j5: completes with touch-only actions', async () => {
  const s = touchSetup(j5Script.speakers);
  const bot = touchBot(s, { answers });
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
    s.w.player.position.set(sc.wood.x, 0, sc.wood.z + 0.5); s.w.step(0.05, { x: 0, z: 0 });
    ok(!s.hud.talkBtn.disabled, 'pick up the firewood first'); s.hud.talkBtn.click(); s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.player.children.some(c => c.isGroup && c.children.length >= 5), 'firewood on the shoulder');
    s.dialogue.close();
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
  const bot = touchBot(s, { answers });
  try {
    j5.buildScene(s.w, s.ctx);
    j5.enterStage(s.ctx, 'minigame');
    await j5.minigame(s.ctx);
    eq(s.ctx.testHooks.samjeondo, { kneels: 3, bows: 9 });
    ok(j5Script.samjeondo.every(l => l.who !== 'narr' || (l.src && l.src.includes('S63'))), 'narration cites S63');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// ---- D-26 ----
test('j5 D-26: west gate and 남한산성 board, one-paragraph intro, two-line how-to, people in any order', () => {
  const w = testWorld();
  try {
    const sc = buildJ5Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2 && sc.introFrom[0] < sc.start[0], 'comes in through the west gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '남한산성') board = true; });
    ok(board, 'board');
  } finally { w.dispose(); }
  ok(j5Script.intro.length <= 2 && j5Script.intro.every(l => !l.text.includes('\n')));
  for (const h of [j5Script.sort.howto, j5Script.fires.card]) eq(h.steps.length, 2);
  ok(!('tooEarly' in j5Script.npc.keeper));
  eq(fortTalk('keeper', new Set(['soldier']))[0], j5Script.npc.keeper.bridge);
  eq(j5Script.sort.use.map(i => j5Script.sort.cards[i].bin).sort(), ['cheok', 'cheok', 'ju', 'ju'], 'two of each, no side favoured');
  ok(SIDES.cheok.x < 0 && SIDES.ju.x > 0, '김상헌(척화) left, 최명길(주화) right');
});

test('j5 D-26: kneeling and bowing bend the legs, arms and back smoothly', async () => {
  const { makePerson } = await import('../core/people.js');
  const { LOOKS } = await import('../content/characters.js');
  const THREE = await import('three');
  const h = new THREE.Group(); const p = makePerson(LOOKS.joseonOfficial); h.add(p); h.userData.body = p;
  const ys = [];
  for (let i = 0; i <= 10; i++) { kowtowPose(h, i / 10, 0); ys.push(p.position.y); }
  ok(ys.every((y, i) => i === 0 || y <= ys[i - 1] + 1e-6), 'goes down steadily when kneeling');
  kowtowPose(h, 1, 1);
  ok(p.rotation.x > 0.4 && p.userData.head.rotation.x > 0.5, 'bows, head down'); ok(p.userData.arms[0].rotation.x < -1.2, 'hands go down to the ground');
  kowtowPose(h, 0, 0);
  ok(Math.abs(p.rotation.x) < 1e-6 && Math.abs(p.position.y) < 1e-6, 'stands up again');
});

// ---- D-30 ----
test('j5 C-01·C-02·C-03: intro film (청군 → 인조가 산성으로), portal, no quiz goal, plaques only (행궁·서문), sign facts moved to people', async () => {
  ok(typeof j5.introScene === 'function', 'introScene');
  ok(j5.portal && j5.portal.at.length === 2, 'portal');
  ok(!j5Script.goals.some(g => g.includes('배운 내용')), 'no quiz goal');
  ok(!Object.keys(j5Script.npc).some(k => k.startsWith('sign')), 'no sign npc entries');
  const lines = JSON.stringify(j5Script);
  ok(lines.includes('2014') && lines.includes('1625'), 'sign facts kept in someone\'s words');
  const s = touchSetup(j5Script.speakers);
  try {
    const sc = j5.buildScene(s.w, s.ctx);
    eq([...s.w.npcs.values()].filter(n => n.spot).length, 0, 'no road signs');
    const names = []; s.w.level.traverse(o => { if (o.name && o.name.startsWith('plaque:')) names.push(o.name); });
    eq(names.sort(), ['plaque:서문', 'plaque:행궁']);
    const film = j5.introScene(s.ctx);
    ok(film.shots.length >= j5Script.intro.length, 'a shot per sentence');
    const [q0, k0] = [sc.introQing.position.clone(), sc.introKing.position.clone()];
    film.shots[0].act(s.ctx);
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.introQing.position.distanceTo(q0) > 0.5, 'the 청 army marches in the first shot');
    film.shots[film.shots.length - 1].act(s.ctx);
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.introKing.position.x > k0.x + 0.5, '인조 walks in through the west gate');
    film.done(s.ctx);
    ok(!sc.introQing.visible && !sc.introKing.visible, 'intro groups are hidden for the story');
    const b = s.w.bounds, [px, pz] = j5.portal.at;
    ok(px > b.x0 + 2 && px < b.x1 - 2 && pz > b.z0 + 2 && pz < b.z1 - 2, 'portal inside the fortress');
    for (const f of sc.fires) ok(Math.hypot(f.x - px, f.z - pz) > 3, 'portal clear of braziers');
    for (const n of s.w.npcs.values()) if (n.mesh.visible) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 2.5, `portal clear of ${n.id}`);
  } finally { s.done(); }
});

test('j5 N-01: 김상헌과 최명길 each have to be heard; both wait until all fortress people were heard', () => {
  const all = new Set(PEOPLE);
  for (const id of ['kimsangheon', 'choemyeonggil']) {
    eq(ministerTalk(id, new Set([PEOPLE[0]]), new Set()), j5Script.npc[id].wait, `${id} waits`);
    ok(j5Script.npc[id].wait[0].text.includes('모두'), 'wait says 모두');
    eq(ministerTalk(id, all, new Set())[0], j5Script.npc[id].first[0], `${id} speaks once all were heard`);
  }
  const lastK = ministerTalk('kimsangheon', all, new Set(['choemyeonggil'])), lastC = ministerTalk('choemyeonggil', all, new Set(['kimsangheon']));
  eq(lastK[lastK.length - 1], j5Script.closing, 'closing line after the second minister');
  eq(lastC[lastC.length - 1], j5Script.closing);
  ok(!ministerTalk('kimsangheon', all, new Set()).includes(j5Script.closing), 'no closing after only one');
  ok(!/(옳|틀렸|잘못)/.test(JSON.stringify(j5Script.closing)), 'no side judged');
});

test('j5 N-01: in the fortress walk both ministers are talked to before the minigame', async () => {
  const s = touchSetup(j5Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    j5.buildScene(s.w, s.ctx);
    await j5.explore(s.ctx);
    eq([...s.ctx.testHooks.ministers].sort(), ['choemyeonggil', 'kimsangheon']);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });

test('j5 N-02·N-03·N-04: names over the two ministers, a shivering 백성 starts the braziers, 인조 laments then leads the walk', async () => {
  const s = touchSetup(j5Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const bot = touchBot(s, { answers });
  const seen = new Set(); let frame = 0, shiver = 0, lastRz = null;
  try {
    j5.buildScene(s.w, s.ctx);
    const folk = s.w.npcs.get('coldfolk');
    ok(folk && folk.mesh.visible, 'a cold 백성 in the fortress');
    ok(folk.mesh.userData.legs[0].userData.knee && folk.mesh.userData.legs[0].userData.knee.rotation.x > 1, 'crouching with bent knees');
    j5.enterStage(s.ctx, 'minigame');
    s.w.onUpdate(() => {
      frame += 1;
      const rz = folk.mesh.rotation.z; if (lastRz != null) shiver = Math.max(shiver, Math.abs(rz - lastRz)); lastRz = rz;
      if (frame % 5) return;
      s.w.level.traverse(o => { if (o.isSprite && o.visible && o.name && o.name.startsWith('name:')) { const p = o.getWorldPosition(o.position.clone()); if (p.y > 2.5) seen.add(o.name); } });
    });
    await j5.minigame(s.ctx);
    ok(seen.has('name:김상헌') && seen.has('name:최명길'), `names shown ${[...seen]}`);
    ok(shiver > 0.005, 'the 백성 shivers');
    const F = j5Script.fires, iCold = said.indexOf(j5Script.npc.coldfolk.first[0]), iHow = said.indexOf(F.howto[0]);
    ok(iCold >= 0 && iHow > iCold, `cold story (${iCold}) before the braziers (${iHow})`);
    const lament = j5Script.npc.injo.first, iL = said.indexOf(lament[0]), iW = said.indexOf(j5Script.walk.start[0]), iS = said.indexOf(j5Script.samjeondo[0]);
    ok(lament.every(l => l.who === 'injo') && lament.filter(l => l.src).length >= 1, '인조 speaks, sourced');
    ok(iHow < iL && iL < iW && iW < iS, `lament ${iL} → walk ${iW} → 삼전도 ${iS}`);
    ok(s.ctx.testHooks.ledBy === 'injo', 'walked behind 인조 (leadWalk)');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j5 N-03: braziers can be lit in any order', async () => {
  const s = touchSetup(j5Script.speakers);
  try {
    const sc = j5.buildScene(s.w, s.ctx);
    const run = j5.lightFires(s.ctx, false);
    s.w.player.position.set(sc.wood.x, 0, sc.wood.z + 0.5); s.w.step(0.05, { x: 0, z: 0 });
    s.hud.talkBtn.click(); s.w.step(0.05, { x: 0, z: 0 }); s.dialogue.close();
    for (const g of [...sc.fires].reverse()) { s.w.player.position.set(g.x, 0, g.z + 1.3); s.w.step(0.05, { x: 0, z: 0 }); s.hud.talkBtn.click(); s.w.step(0.05, { x: 0, z: 0 }); eq(g.lit, true); }
    eq(await run, true);
  } finally { s.done(); }
});

test('j5 N-05: kneel with knees, then hands, back and head go down in order, smoothly; 인조 wears a clearly different colour', async () => {
  const { makePerson } = await import('../core/people.js');
  const THREE = await import('three');
  const h = new THREE.Group(); const p = makePerson(BOW_LOOKS.official); h.add(p); h.userData.body = p;
  kowtowPose(h, 1, 0);
  const kn = p.userData.legs[0].userData.knee;
  ok(kn && kn.rotation.x > 2, 'knees folded when kneeling');
  ok(p.userData.arms[0].userData.elbow, 'elbows');
  kowtowPose(h, 1, 0.3);
  const armEarly = -p.userData.arms[0].rotation.x, headEarly = p.userData.head.rotation.x;
  kowtowPose(h, 1, 1);
  ok(armEarly / -p.userData.arms[0].rotation.x > headEarly / p.userData.head.rotation.x + 0.15, 'hands go down before the head');
  // 부드럽게: 60분의 1씩 움직여도 관절이 크게 튀지 않는다
  const snap = () => [p.rotation.x, p.position.y, p.userData.head.rotation.x, ...p.userData.arms.map(a => a.rotation.x), ...p.userData.legs.map(l => l.rotation.x), kn.rotation.x];
  let prev = null, jump = 0;
  for (let i = 0; i <= 120; i++) { const t = i / 120; if (t <= 0.5) kowtowPose(h, t * 2, 0); else kowtowPose(h, 1, (t - 0.5) * 2); const v = snap(); if (prev) jump = Math.max(jump, ...v.map((x, j) => Math.abs(x - prev[j]))); prev = v; }
  ok(jump < 0.3, `smooth (${jump.toFixed(2)})`);
  const hsl = x => { const o = {}; new THREE.Color(x).getHSL(o); return o; };
  const K = hsl(BOW_LOOKS.king.robe);
  for (const other of [BOW_LOOKS.prince, BOW_LOOKS.official]) {
    const O = hsl(other.robe);
    const dh = Math.min(Math.abs(K.h - O.h), 1 - Math.abs(K.h - O.h));
    ok(dh > 0.12 || Math.abs(K.l - O.l) > 0.2, `인조 ${K.h.toFixed(2)} vs ${O.h.toFixed(2)}`);
  }
});
