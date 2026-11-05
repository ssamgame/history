import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j1Script from '../chapters/joseon/j1/script.js';
import { buildJ1Scene } from '../chapters/joseon/j1/scene.js';
import j1, { HANYANG_SITE } from '../chapters/joseon/j1/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON, isUnlocked } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j1Script.quizzes.map(q => q.options[q.answer]));

test('j1: script passes validation', () => eq(validateScript(j1Script, SOURCES), []));

test('j1: quiz answers and the four reasons match the spec', () => {
  eq(j1Script.quizzes.map(q => q.options[q.answer]), ['위화도', '한양']);
  eq(j1Script.reasons.people.length, 6);
  eq(j1Script.reasons.people.filter(p => p.correct).length, 4, 'four reasons (4불가론)');
  ok(j1Script.reasons.people.filter(p => p.correct).every(p => p.talk.some(l => l.src && l.src.includes('S23'))), 'relayed reasons cite S23');
  ok(j1Script.intro.every(l => l.src.includes('S23')));
});

test('j1: chapter is open in 조선편 and loads', async () => {
  const meta = JOSEON[0];
  ok(meta.load, 'j1 has load');
  eq(isUnlocked(meta, { chapterResult: () => null }), true);
  eq((await meta.load()).default.id, 'j1');
});

test('j1: scene builds the camp with three people and a turning army', () => {
  const w = testWorld();
  try {
    const s = buildJ1Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['archer', 'soldier', 'yiseonggye']);
    s.setTurn(0); const z0 = s.army.position.z; const r0 = s.army.children[0].rotation.y;
    s.setTurn(1); const z1 = s.army.position.z;
    ok(z1 > z0 + 20, `army crosses south ${z0} → ${z1}`);
    ok(Math.abs(r0 - Math.PI) < 1e-6 && s.army.children[0].rotation.y === 0, 'army turns around');
  } finally { w.dispose(); }
});

test('j1: completes with touch-only actions', async () => {
  const s = touchSetup(j1Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON[0], j1, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j1: soldiers relay what 이성계 said; a wrong judgement gets the explanation, then the student carries on', async () => {
  const s = touchSetup(j1Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const choose = s.dialogue.choose;
  let wrongOnce = true;
  const prompts = [];
  s.dialogue.choose = (p, o, x) => { prompts.push(p); if (wrongOnce && s.ctx.testHooks.choice != null) { wrongOnce = false; const c = s.ctx.testHooks.choice; s.ctx.testHooks.choice = 1 - c; } return choose(p, o, x); };
  const bot = touchBot(s, { answers });
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    const r = await j1.minigame(s.ctx);
    ok(said.some(t => t.startsWith('× 다시 생각해 봐요.')), 'explanation after the wrong judgement');
    // 2026-10-30 선생님: 가릴 때 군사가 한 말이 대화창에 보여야 한다(글이 비어 있었다)
    const judged = prompts.filter(p => p && typeof p.text === 'string' && p.text.includes(j1Script.reasons.question));
    ok(judged.length >= 6 && j1Script.reasons.people.every(P => judged.some(p => p.text.includes(P.talk[0].text))), `가릴 말이 보인다 ${prompts.map(p => typeof p).join(',')}`);
    eq(r.firstTryCorrect, 1, 'judging missed once, Hanyang right the first time');
    eq(r.easyModeUsed, false);
    ok(s.ctx.testHooks.march && s.ctx.testHooks.march.done, 'march on the map played');
    eq(s.ctx.testHooks.march.joseon, true, '고려 gives way to 조선 on the map');
    eq(s.ctx.testHooks.built, ['palace', 'jongmyo', 'sajik'], 'three buildings rose at their sites');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// 2026-10-30 선생님: 왕이 된 이성계의 오른발이 전각 돌계단에 묻혀 안 보였다. 궁궐 마당과 즉위 장면 모두 발이 다른 돌에 묻히지 않는다
test('j1: 왕이 된 이성계의 발이 돌계단·기단에 묻히지 않는다', async () => {
  const THREE = await import('three');
  const s = touchSetup(j1Script.speakers);
  try {
    j1.buildScene(s.w, s.ctx); j1.enterStage(s.ctx, 'quiz');
    const k = s.w.npcs.get('yiseonggye').mesh; s.w.level.updateMatrixWorld(true);
    const shoes = []; k.traverse(o => { if (o.name === 'shoe') shoes.push(new THREE.Box3().setFromObject(o).expandByScalar(-0.01)); });
    eq(shoes.length, 2);
    const hit = []; s.w.level.traverse(o => { if (!o.isMesh || !o.visible) return; let p = o; while (p && p !== k) p = p.parent; if (p === k) return; const b = new THREE.Box3().setFromObject(o); if (b.max.y > k.position.y + 0.02 && shoes.some(sh => sh.intersectsBox(b))) hit.push(o.name || o.geometry.type); });
    eq(hit, [], '발에 겹친 것');
  } finally { s.done(); }
});

test('j1: nothing stands between the camera and the player at the Hanyang site', () => {
  const from = 13; // 학생이 서는 곳(남쪽)
  ok(!HANYANG_SITE.props.some(p => p.z > from - 1 && (p.type === 'wall' || p.type === 'hanok' || p.type === 'western')), 'no wall south of the player');
});

test('j1: resume at quiz shows the army already gone south', () => {
  const s = touchSetup(j1Script.speakers);
  try {
    const sc = j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'quiz');
    ok(sc.army.position.z > 20, 'army crossed');
  } finally { s.done(); }
});

// ---- D-22 ----
import { campTalk, TOUR } from '../chapters/joseon/j1/chapter.js';

test('j1 D-22: camp gate and 위화도 board, no reading signs, one-paragraph intro, two-line how-to', () => {
  const w = testWorld();
  try {
    const sc = buildJ1Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2, 'gate');
    ok(sc.introFrom[1] > sc.start[1], 'comes in through the gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '위화도') board = true; });
    ok(board, '위화도 board');
    eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  } finally { w.dispose(); }
  ok(j1Script.intro.length <= 3); ok(j1Script.intro.every(l => !l.text.includes('\n'))); // 자막 장면(C-03): 짧은 문장 몇 개
  eq(j1Script.hanyang.howto.steps.length, 2);
  ok(j1Script.npc.archer.first.some(l => l.text.includes('압록강에 있는 섬')), 'island fact moved into a person');
  ok(j1Script.intro.some(l => l.text.includes('5만여 명') && l.text.includes('2만여 필')), 'D-67: 군대 규모는 첫 해설에(병사가 숫자를 외우지 않는다)');
});

test('j1 D-22/D-30: soldiers talk in any order and pick up from each other; 이성계 waits until all were heard', () => {
  ok(j1Script.npc.yiseonggye.wait[0].text.includes('모두'));
  eq(campTalk('soldier', new Set()), j1Script.npc.soldier.first, 'soldier first');
  eq(campTalk('archer', new Set(['soldier']))[0], j1Script.npc.archer.bridge, 'archer picks up from the soldier');
  ok(!('tooEarly' in j1Script.npc.soldier), 'soldier never blocks');
  ok(j1Script.npc.yiseonggye.turn[0].text.includes('군사를 돌려'), '이성계 decides to turn back');
  ok(j1Script.npc.yiseonggye.turn[0].src.includes('S23'));
});

test('j1 D-22: before building, the 관리 leads a walk north, east and west of the Hanyang site, one sourced line at each', async () => {
  const s = touchSetup(j1Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const bot = touchBot(s, { answers });
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    const seq = []; const sg = s.ctx.setGoal; s.ctx.setGoal = t => { seq.push('goal:' + t); return sg(t); };
    const say2 = s.dialogue.say; s.dialogue.say = l => { seq.push('say:' + l.text); return say2(l); };
    const mo = new MutationObserver(() => { if (s.ui.textContent.includes(j1Script.hanyang.howto.title) && seq[seq.length - 1] !== 'howto') seq.push('howto'); }); mo.observe(s.ui, { childList: true, subtree: true });
    await j1.minigame(s.ctx);
    mo.disconnect();
    const T = j1Script.hanyang.tour;
    const iWest = seq.indexOf('say:' + T.west[0].text), iHow = seq.indexOf('howto');
    ok(iHow > iWest && iWest > 0, `11-05: 짓기 방법 카드는 둘러보기가 끝난 뒤 (${iWest} < ${iHow})`);
    const iTurn = seq.indexOf('say:' + j1Script.npc.yiseonggye.turn[0].text), iWatch = seq.indexOf('goal:' + j1Script.watchGoal);
    ok(iWatch >= 0 && iWatch < iTurn, '11-05: 결심을 들을 때부터 퀘스트가 「위화도 회군 이야기를 지켜보자」');
    const at = ['north', 'east', 'west'].map(k => said.findIndex(l => l === T[k][0]));
    ok(at.every(i => i >= 0) && at[0] < at[1] && at[1] < at[2], `tour lines in order ${at}`);
    ok(['north', 'east', 'west'].every(k => T[k][0].src), 'sourced');
    eq(TOUR.stops.length, 3);
    eq(s.ctx.testHooks.built, ['palace', 'jongmyo', 'sajik']);
    const { pts, colliders } = s.ctx.testHooks.tour, seg = (c, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((c.x - a[0]) * vx + (c.z - a[1]) * vz) / L)); return Math.hypot(c.x - a[0] - vx * t, c.z - a[1] - vz * t); };
    const legs = [[pts[0], pts[1]], [pts[1], pts[2]], [pts[1], pts[3]], [pts[3], pts[4]], [pts[3], pts[5]], [pts[5], pts[6]]]; // 관리가 걷는 길과 학생이 서는 자리로 가는 길
    const hit = colliders.filter(c => c !== s.w.player && legs.some(([a, b]) => seg(c, a, b) < c.r + 0.45));
    eq(hit.length, 0, `11-05: 둘러보기 길이 담·나무·터와 겹치지 않는다 ${JSON.stringify(hit.slice(0, 3))}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// ---- D-30 H-01·H-02 ----
test('j1 H-01: 이성계 explains the four reasons himself (S23) before the camp talk sorts them from rumors', async () => {
  const Y = j1Script.npc.yiseonggye.reasons;
  ok(Array.isArray(Y) && Y.every(l => l.who === 'yiseonggye'), '이성계 speaks');
  const said4 = (Y || []).filter(l => l.src && l.src.includes('S23'));
  ok(['작은 나라가 큰 나라', '여름', '왜구', '아교'].every(k => said4.some(l => l.text.includes(k))), 'all four reasons in his own words');
  const s = touchSetup(j1Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const bot = touchBot(s, { answers });
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    await j1.minigame(s.ctx);
    const first = said.findIndex(l => j1Script.reasons.people.some(p => p.talk.includes(l)));
    const told = said4.map(l => said.indexOf(l));
    ok(told.length >= 4 && first > 0 && told.every(i => i >= 0 && i < first), `이성계 told all four first ${told} < ${first}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j1 H-02: the march has no "나", about 24 marching soldiers with flags, real steps and smooth turns; the camp army walks off too', async () => {
  const s = touchSetup(j1Script.speakers);
  const bot = touchBot(s, { answers });
  const st = { campLeg: 0, campTurn: 0, legs: 0, turn: 0, n: 0, flags: 0, sprites: 0, noWalk: 0 };
  let lastArmy = null, lastCamp = null;
  try {
    const sc = j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    const c0 = sc.army.children[0];
    s.w.onUpdate(() => {
      const m = s.ctx.testHooks.march;
      if (!m) {
        st.campLeg = Math.max(st.campLeg, Math.abs(c0.userData.legs[0].rotation.x));
        if (lastCamp != null) st.campTurn = Math.max(st.campTurn, Math.abs(c0.rotation.y - lastCamp));
        lastCamp = c0.rotation.y;
        return;
      }
      const a = m.army; if (!a || m.done) return;
      const people = a.children.filter(p => p.userData && p.userData.legs);
      st.n = people.length; st.noWalk = people.filter(p => p.userData.noWalk).length;
      st.flags = people.filter(p => p.userData.carry).length;
      let sp = 0; a.traverse(o => { if (o.isSprite) sp += 1; }); st.sprites = sp;
      for (const p of people) st.legs = Math.max(st.legs, Math.abs(p.userData.legs[0].rotation.x));
      if (lastArmy != null) st.turn = Math.max(st.turn, Math.abs(a.rotation.y - lastArmy));
      lastArmy = a.rotation.y;
    });
    await j1.minigame(s.ctx);
    ok(st.n >= 22 && st.n <= 28, `about 24 soldiers (${st.n})`);
    eq(st.sprites, 0, 'no "나" tag on the army');
    eq(st.noWalk, 0, 'nobody slides');
    ok(st.flags >= 2, `flag bearers hold flags (${st.flags})`);
    ok(st.legs > 0.3, `legs swing on the map (${st.legs.toFixed(2)})`);
    ok(st.turn < 0.1, `turns smoothly (${st.turn.toFixed(3)} rad per frame)`);
    ok(st.campLeg > 0.3, `camp army walks off after the decision (${st.campLeg.toFixed(2)})`);
    ok(st.campTurn < 0.6, `camp soldiers turn around smoothly (${st.campTurn.toFixed(2)})`);
    ok(sc.army.position.z > 20, 'camp army is gone south afterwards');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// 2026-10-30 선생님: 진영을 돌며 군사 여섯의 말을 듣고 이성계에게 돌아와 가리기, 한양을 정한 뒤 위화도로 돌아가지 않고 궁궐 마당에서 잇기(새로고침해도)
test('j1: 진영 곳곳의 여섯 군사를 찾아 듣고 이성계에게 돌아와 가린 뒤, 한양 궁궐 마당에서 관리를 만나며, 이어 하기도 궁궐 마당', async () => {
  const s = touchSetup(j1Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const sc = j1.buildScene(s.w, s.ctx);
    ok(sc.extra.length >= 10, `진영 군사 ${sc.extra.length}`);
    j1.enterStage(s.ctx, 'minigame');
    await j1.minigame(s.ctx);
    eq(s.ctx.testHooks.rumors.heard.length, 6, '여섯 군사의 말을 모두 들었다');
    const p = s.w.player.position, { COURT } = await import('../chapters/joseon/j1/scene.js');
    ok(Math.abs(p.x - COURT.x) < 15, `궁궐 마당에 있다 x ${p.x.toFixed(1)}`);
    const king = s.w.npcs.get('yiseonggye').mesh;
    ok(Math.abs(king.position.y - COURT.top) < 0.01, '왕이 된 이성계는 단 윗면에 선다');
    const portal = typeof j1.portal === 'function' ? j1.portal(s.ctx) : j1.portal; ok(Math.abs(portal.at[0] - COURT.x) < 15, '다음 문도 궁궐 마당에');
  } finally { bot.stop(); s.done(); }
  const t = touchSetup(j1Script.speakers);
  try {
    j1.buildScene(t.w, t.ctx); j1.enterStage(t.ctx, 'quiz');
    const { COURT } = await import('../chapters/joseon/j1/scene.js');
    ok(Math.abs(t.w.player.position.x - COURT.x) < 15, '퀴즈부터 이어 해도 궁궐 마당');
  } finally { t.done(); }
}, { timeout: 150000 });

// ---- 2026-11-05 선생님 플레이 점검(ego browser) ----
test('j1 11-05: 학생이 관리의 다음 길점 위에 서 있어도 관리가 2초 안에 그 길점으로 가고 둘러보기가 끝난다', async () => {
  const { leadWalk } = await import('../chapters/kit/lead.js');
  const s = touchSetup(j1Script.speakers);
  try {
    j1.buildScene(s.w, s.ctx);
    if (!s.w.npcs.has('minister')) s.w.addNpc('minister', { role: 'soldier' }, 0, 0, Math.PI);
    s.w.moveNpc('minister', 4, -2.5, 0);
    const p = s.w.player.position; p.x = 6.5; p.z = -1; // 다음 길점 바로 위(관리가 학생 몸 둘레만 돈다)
    let done = false;
    leadWalk(s.ctx, { id: 'minister', path: [[6.5, -1]], stand: [4, 0.5] }).then(() => { done = true; });
    const m = s.w.npcs.get('minister').mesh.position;
    let arrived = false;
    for (let i = 0; i < 70; i++) { s.w.step(0.05, { x: 0, z: 0 }); if (s.w.getGoal() && Math.abs(s.w.getGoal().x - 4) < 0.01) arrived = true; await Promise.resolve(); }
    ok(arrived, `관리가 3.5초 안에 길 끝에 닿는다(지금 ${m.x.toFixed(2)},${m.z.toFixed(2)})`);
    for (let i = 0; i < 200 && !done; i++) { const d = Math.hypot(4 - p.x, 0.5 - p.z); s.w.step(0.05, d > 0.3 ? { x: (4 - p.x) / d, z: (0.5 - p.z) / d } : { x: 0, z: 0 }); await Promise.resolve(); }
    ok(done, '학생이 자리로 가면 끝난다');
  } finally { s.done(); }
}, { timeout: 60000 });

test('j1 11-05: 걱정을 다 들으면 「들은 걱정」 수가 사라진다(이성계에게 가는 동안)', async () => {
  const s = touchSetup(j1Script.speakers);
  const bot = touchBot(s, { answers });
  let goal = null, counter = null, bad = false;
  const sg = s.ctx.setGoal; s.ctx.setGoal = t => { goal = t; return sg(t); };
  const sc = s.hud.setCounter.bind(s.hud); s.hud.setCounter = t => { counter = t; return sc(t); };
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'explore');
    const off = s.w.onUpdate(() => { if (goal === j1Script.goals[1] && counter && counter.startsWith('들은')) bad = true; });
    await j1.explore(s.ctx);
    off();
    ok(!bad, '이성계에게 가는 동안 「들은 걱정 2/2」가 남지 않는다');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });
