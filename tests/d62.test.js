// D-62 (2026-10-31) 선생님 전체 수정 요청: 공통 4가지와 고려편 1~6장
import { test, ok, eq } from './harness.js';
import { ALL_CHAPTERS } from '../chapters/index.js';
import { roleLook } from '../content/roles.js';
import { testWorld, sleep } from './bot.js';

const WEAPONS = ['spear', 'sword', 'rifle', 'bow'];

test('d62 공통1: 어느 장에서도 학생은 무기를 들지 않는다', async () => {
  const w = testWorld();
  for (const meta of ALL_CHAPTERS) {
    const mod = (await meta.load()).default;
    const look = roleLook(meta.id, mod.player);
    ok(!look.gear, `${meta.id}: gear ${look.gear}`);
    w.setPlayerLook(look);
    const found = WEAPONS.filter(n => w.player.getObjectByName(n));
    eq(found.length, 0, `${meta.id}: 학생 몸에 ${found}`);
  }
});

// 공통2: 3D 얼굴에는 입체 코가 따로 있어, 얼굴 무늬에 코(콧대 선·콧구멍·코끝 그늘)를 또 그리면 코가 둘로 보인다.
// 눈 위 쌍꺼풀 선·눈 밑 선, 입 아래 분홍 그늘도 눈·입이 겹친 것처럼 보였다(2026-10-31 선생님). 대화창 그림(평면)에는 그대로 둔다.
import { faceTexture, FACE_LAYOUT } from '../core/faces.js';
import { LOOKS } from '../content/characters.js';
import { buildFace, resolve } from '../core/facebuild.js';
test('d62 공통2: 3D 얼굴 무늬에는 코·입 아래 그늘·눈 위아래 겹선을 그리지 않는다', () => {
  const { S, cy, R, cut, f } = FACE_LAYOUT;
  const toTex = py => (py <= cut ? py : cut + (py - cut) * f) * S; // 늘여 붙인 판의 세로 자리
  for (const id of ['kimyunhu', 'soldier', 'villager', 'yanggwang', 'khitan', 'mongol', 'seohui', 'woman', 'kid', 'monk']) {
    const L = LOOKS[id]; if (!L) continue;
    const v = resolve(buildFace(L, 0));
    const tex = faceTexture({ ...L.face, v }); const c = tex.image.getContext('2d');
    const alphaMax = (x0, x1, y0, y1) => { const d = c.getImageData(Math.round(x0), Math.round(y0), Math.max(1, Math.round(x1 - x0)), Math.max(1, Math.round(y1 - y0))).data; let m = 0; for (let i = 3; i < d.length; i += 4) m = Math.max(m, d[i]); return m; };
    const cx = S / 2, r = R; // 비율
    const eyeY = cy + (-0.06 + v.eyeY) * r, my = cy + (0.46 + v.mouthY) * r;
    // 코 자리: 눈 아래부터 입 위까지 가운데 좁은 띠(수염이 없는 사람만)
    if (!L.face.beard) ok(alphaMax(cx - 0.05 * R * S, cx + 0.05 * R * S, toTex(eyeY + 0.09 * r), toTex(my - 0.1 * r)) < 40, `${id}: 코를 또 그렸다`);
    // 입 아래 그늘
    if (!L.face.beard) ok(alphaMax(cx - 0.05 * R * S, cx + 0.05 * R * S, toTex(my + 0.16 * r), toTex(my + 0.24 * r)) < 40, `${id}: 입 아래 그늘`);
  }
});

// 공통3: 바다는 파도치고 물결이 움직인다(보통·높음은 물결 높이, 낮음도 물결 무늬가 흐른다). 굳히기 뒤에도 움직인다.
import { bakeLevel } from '../core/bake.js';
import ch6 from '../chapters/ch6/chapter.js';
import j4 from '../chapters/joseon/j4/chapter.js';
import { touchSetup } from './bot.js';
import ch6Script from '../chapters/ch6/script.js';
import j4Script from '../chapters/joseon/j4/script.js';
for (const [name, ch, sc] of [['ch6', ch6, ch6Script], ['j4', j4, j4Script]]) {
  test(`d62 공통3: ${name} 바다가 굳힌 뒤에도 출렁이고 물결 무늬가 흐른다`, () => {
    const s = touchSetup(sc.speakers);
    s.w.setQuality?.('medium');
    const built = ch.buildScene(s.w, s.ctx);
    bakeLevel(s.w, built);
    const seas = []; s.w.level.traverse(o => { if (o.userData.sea) seas.push(o); });
    ok(seas.length >= 1, `${name}: 바다 판 ${seas.length}`);
    const sea = seas.sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count)[0];
    const ys = () => Array.from({ length: 40 }, (_, i) => sea.geometry.attributes.position.getY(i * 37 % sea.geometry.attributes.position.count));
    const off0 = sea.material.map.offset.clone();
    s.w.quality.water = 'waves';
    for (let i = 0; i < 10; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    const a = ys(); for (let i = 0; i < 15; i++) s.w.step(1 / 30, { x: 0, z: 0 }); const b = ys();
    ok(Math.max(...a.map((y, i) => Math.abs(y - b[i]))) > 0.02, `${name}: 물결 높이가 움직인다`);
    ok(Math.max(...a.map(Math.abs)) < 0.3, `${name}: 물결이 너무 높지 않다`);
    s.w.quality.water = 'flat';
    for (let i = 0; i < 5; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(sea.material.map.offset.distanceTo(off0) > 0.001, `${name}: 물결 무늬가 흐른다`);
  });
}

// 공통4: 서 있는 사람들 머리가 모두 똑같이 좌우로 움직이지 않는다: 사람마다 때가 다르고, 가끔만 둘러본다(뼈대 몸·예전 몸 모두)
import * as THREE from 'three';
import { makePerson, setRigHook, POST_POSE } from '../core/people.js';
import { loadBody, attachBody, updateBodies, resetBodies } from '../core/body.js';
async function headYaws(skel) {
  const w = testWorld();
  if (skel) { await loadBody(); resetBodies(); setRigHook(attachBody); POST_POSE.add(updateBodies); }
  const ppl = [];
  try {
    for (let i = 0; i < 8; i++) { const p = makePerson(LOOKS.soldier); if (skel) attachBody(p, LOOKS.soldier); p.position.set(i * 2, 0, 0); w.level.add(p); ppl.push(p); }
  } finally { if (skel) { setRigHook(null); } }
  const q = new THREE.Quaternion(), e = new THREE.Euler(), series = ppl.map(() => []), rolls = ppl.map(() => []);
  for (let f = 0; f < 2700; f++) { // 90초(가끔 둘러보므로 길게 본다)
    w.step(1 / 30, { x: 0, z: 0 });
    if (f % 3) continue;
    ppl.forEach((p, i) => { const h = p.getObjectByName('headGroup'); h.getWorldQuaternion(q); q.premultiply(p.getWorldQuaternion(new THREE.Quaternion()).invert()); e.setFromQuaternion(q, 'YXZ'); series[i].push(e.y); rolls[i].push(e.z); });
  }
  if (skel) POST_POSE.delete(updateBodies);
  return { series, rolls };
}
const corr = (a, b) => { const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return va < 1e-6 || vb < 1e-6 ? 0 : c / Math.sqrt(va * vb); };
for (const skel of [false, true]) {
  test(`d62 공통4: 서 있는 사람 머리 좌우 움직임이 사람마다 다르고 가끔만(${skel ? '뼈대 몸' : '예전 몸'})`, async () => {
    const R = await headYaws(skel);
    for (const [k, S] of [['돌리기', R.series], ['갸웃', R.rolls]]) {
      let same = 0, pairs = 0;
      for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { pairs++; if (corr(S[i], S[j]) > 0.8) same++; }
      ok(same <= pairs * 0.1, `${k}: 머리가 같이 움직이는 짝 ${same}/${pairs}`);
      for (const s of S) { const m = s.reduce((a, y) => a + y, 0) / s.length, busy = s.filter(y => Math.abs(y - m) > 0.05).length / s.length; ok(busy < 0.45, `${k}: 움직이는 시간 ${(busy * 100).toFixed(0)}%`); }
    }
  });
}

// 고려 1장: 강동 6주 성벽을 쌓는 백성은 돌을 안고 천천히 걷는다(뛰듯 빠르지 않게)
import { ALL_CHAPTERS as ALLC } from '../chapters/index.js';
import { touchBot } from './bot.js';
test('d62 고려1: 성벽 쌓는 백성은 돌을 안고 천천히 걷는다', async () => {
  const mod = (await ALLC.find(c => c.id === 'ch1').load()).default;
  const s = touchSetup(mod.script.speakers); touchBot(s, { answers: new Set() });
  mod.buildScene(s.w, s.ctx);
  await mod.stories.gangdong(s.ctx);
  const h = s.ctx.testHooks.gangdong;
  ok(h.built, '성을 다 쌓았다');
  ok(h.masonSpeed > 0.3 && h.masonSpeed <= 1.5, `일꾼 빠르기 ${h.masonSpeed?.toFixed(2)}m/s`);
}, { timeout: 40000 });

// ── 고려 2장(거란 2차 침입) ──
import ch2 from '../chapters/ch2/chapter.js';
import ch2Script from '../chapters/ch2/script.js';
import { WALL_TOP } from '../chapters/ch2/scene.js';
test('d62 고려2-1: 시작 장면은 성벽 위에서 본 거란 왕(말 탄 선봉)과 덤벼오는 거란군 가까이', () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    ok(sc.khitanKing && sc.khitanKing.userData.person, '말 탄 거란 왕');
    const front = Math.max(...sc.horde.map(k => k.userData.home.z));
    ok(sc.khitanKing.position.z > front, `왕이 맨 앞(선봉) ${sc.khitanKing.position.z} > ${front}`);
    const intro = ch2.introScene(s.ctx);
    ok(intro.shots.length >= 2, `장면 ${intro.shots.length}`);
    const s0 = intro.shots[0];
    ok(s0.cam[1] >= WALL_TOP && Math.abs(s0.cam[2] + 12.5) < 2.5 && s0.look[2] < s0.cam[2] - 8, '첫 장면: 성벽 위에서 북쪽을 본다');
    const last = intro.shots[intro.shots.length - 1], c = last.to?.cam || last.cam, l = last.to?.look || last.look;
    ok(Math.hypot(c[0] - l[0], c[1] - l[1], c[2] - l[2]) < 7, '마지막 장면: 덤벼오는 거란군 가까이(클로즈업)');
    intro.shots.forEach(sh => sh.act?.(s.ctx)); for (let i = 0; i < 60; i++) s.w.step(1 / 30, { x: 0, z: 0 }); intro.done?.(s.ctx);
    ok(sc.horde.every(k => k.position.distanceTo(k.userData.home) < 0.01), '장면이 끝나면 제자리');
  } finally { s.done(); }
});
test('d62 고려2-2·3: 거란 막사에 불이 없고, 사다리로 다가오는 거란군은 대군이다', () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    eq(sc.campFires.length, 0, '막사 불');
    let fires = 0; sc.khitan.traverse(o => { if (o.userData.fire || o.isPoints) fires++; }); eq(fires, 0, '거란 진영의 불·연기');
    ok(sc.horde.length >= 30, `거란군 ${sc.horde.length}명`);
  } finally { s.done(); }
});
test('d62 고려2-4·5·6: 곽주는 완성된 성, 군대는 성문으로만 들어가고, 백성은 천천히 나온다', async () => {
  const s = touchSetup(ch2Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch2.buildScene(s.w, s.ctx);
    await ch2.stories.gwakju(s.ctx);
    const h = s.ctx.testHooks.gwakju;
    ok(h.towers >= 2 && h.gatehouse && h.enclosed, `성의 모양: 망루 ${h.towers}, 문루 ${h.gatehouse}, 둘러싼 성벽 ${h.enclosed}`);
    ok(h.gateWidth >= 5.5, `성문 너비 ${h.gateWidth}`);
    ok(h.throughWall === 0, `성벽을 뚫고 들어간 군사 ${h.throughWall}`);
    ok(h.folkSpeed > 0.2 && h.folkSpeed <= 1.4, `나오는 백성 빠르기 ${h.folkSpeed?.toFixed(2)}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });
test('d62 고려2-7: 들판 장면에서는 성이 보이지 않는다(황량한 들판)', () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    ok(sc.castle, '성 묶음');
    sc.setField(true); ok(!sc.castle.visible && !sc.khitan.visible, '들판: 성·거란 진영 숨김');
    sc.setField(false); ok(sc.castle.visible, '성안으로 돌아오면 다시 보인다');
  } finally { s.done(); }
});
test('d62 고려2-8: 포승줄에 묶여 끌려가는 백성은 다가가 E를 눌러야 함께 간 고려군이 거란군을 쓰러뜨리고 구한다', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    ok(sc.captives.every(c => c.rope && c.escort), '포승줄과 호송병');
    ok(sc.allies && sc.allies.length >= 2, `함께 가는 고려군 ${sc.allies?.length}`);
    const run = ch2.rescueOnce(s.ctx, false);
    for (let i = 0; i < 5; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    const c = sc.captives[0];
    ok(c.rope.visible, '처음엔 묶여 있다');
    s.w.player.position.set(c.group.position.x, 0, c.group.position.z + 1.5);
    for (let i = 0; i < 10; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(c.escort.visible && c.rope.visible && !s.ctx.testHooks.rescue.saved, '가까이 가기만 해서는 구하지 않는다');
    ok(!s.hud.talkBtn.disabled, 'E(행동) 단추가 켜진다');
    s.hud.talkBtn.click();
    for (let i = 0; i < 90 && c.rope.visible; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(s.ctx.testHooks.rescue.struck >= 1, '고려군이 거란군을 쳤다');
    ok(c.escort.userData.down || !c.escort.visible, '거란군이 쓰러졌다');
    ok(!c.rope.visible, '포승줄을 풀었다');
    eq(s.ctx.testHooks.rescue.saved, 1, '구한 무리');
    run.cancel?.();
  } finally { s.done(); }
}, { timeout: 30000 });
test('d62 고려2-9·10: 물러나는 거란 대군은 고려군 반대쪽으로 돌아가고, 양규 전사는 해설로 맺는다', async () => {
  const s = touchSetup(ch2Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch2.buildScene(s.w, s.ctx);
    ok(!ch2Script.lastStand, '양규의 "백성을 구하라" 대사를 뺐다');
    eq(ch2Script.result[1].text, '양규는 끝까지 싸우다 결국 전사했어요.');
    await ch2.stories.lastStand(s.ctx);
    const h = s.ctx.testHooks.lastStand;
    ok(h.retreated >= 40, `물러나는 거란군 ${h.retreated}`);
    ok(h.away > 0.85, `고려군 반대쪽으로 물러난다(방향 ${h.away?.toFixed(2)})`);
    ok(h.lines === 2, `해설 ${h.lines}줄`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

// ── 고려 3장(귀주 대첩) ──
import ch3 from '../chapters/ch3/chapter.js';
import ch3Script from '../chapters/ch3/script.js';
import { playFlood } from '../chapters/ch3/chapter.js';
test('d62 고려3-1: 첫 장면의 소배압 군대(거란 대군)는 웅장하다', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ok(sc.introHost, '도입 장면 대군');
    ok(sc.introHost.count >= 40, `거란 대군 ${sc.introHost.count}`);
    ok(sc.introHost.general?.userData.person, '말 탄 소배압');
    const intro = ch3.introScene(s.ctx);
    intro.shots[0].act?.(s.ctx); ok(sc.introHost.group.visible, '첫 장면에 보인다');
    intro.done?.(s.ctx); ok(!sc.introHost.group.visible, '장면이 끝나면 치운다');
  } finally { s.done(); }
});
test('d62 고려3-2: 둑이 터지면 거란군은 물에 쓸려 가다 화면에서 사라진다', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    sc.river.setCross(0.66);
    const army = sc.river.army, x0 = army.children.map(k => k.getWorldPosition(new THREE.Vector3()).x);
    let moved = 0; const off = s.w.onUpdate(() => { army.children.forEach((k, i) => { if (k.visible) moved = Math.max(moved, k.getWorldPosition(new THREE.Vector3()).x - x0[i]); }); });
    const p = playFlood(s.ctx);
    for (let i = 0; i < 200; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    await p; off();
    ok(moved > 4, `물살에 아래로 떠밀렸다 ${moved.toFixed(1)}m`);
    eq(army.children.filter(k => k.visible).length, 0, '쓸려 간 거란군은 사라진다');
  } finally { s.done(); }
});

// ── 고려 4장(강화도 천도·처인성·충주성) ──
import ch4 from '../chapters/ch4/chapter.js';
import ch4Script from '../chapters/ch4/script.js';
import { setupCheoin, cheoinDefense, salitaiScene } from '../chapters/ch4/chapter.js';
test('d62 고려4-1·2: 첫 해설의 저고여 걷기 장면은 없고, 저고여가 쓰러지면 곁의 사람은 바로 뒤로 달아난다', async () => {
  ok(!ch4.introScene, '첫 해설 장면(저고여 걷기)을 뺐다');
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const J = sc.areas.jeogo; const p = J.play();
    let hitX = null; const off = s.w.onUpdate(() => { if (hitX == null && J.envoy.rotation.x < -0.2) hitX = J.aide.position.x; });
    for (let i = 0; i < 330; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    await p; off();
    ok(hitX != null, '저고여가 쓰러졌다');
    ok(!J.aide.visible || J.aide.position.x < hitX - 5, `곁의 사람이 뒤로 달아났다 ${J.aide.position.x.toFixed(1)} < ${(hitX - 5).toFixed(1)}`);
    ok(J.aideRan > 4, `달아나는 빠르기 ${J.aideRan?.toFixed(1)}`);
  } finally { s.done(); }
}, { timeout: 30000 });
test('d62 고려4-3·4: 강화 천도 장면: 산 위에 「강화도」, 고려 조정과 몽골군 쪽은 모두 뭍', async () => {
  const s = touchSetup(ch4Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch4.buildScene(s.w, s.ctx);
    await ch4.stories.capital(s.ctx);
    const h = s.ctx.testHooks.capital;
    eq(h.label, '강화도'); ok(h.labelY > 5, `산 위 높이 ${h.labelY}`);
    ok(h.landBetween, '고려 조정이 떠나는 곳과 몽골군 사이는 뭍');
    ok(h.sunk < 0.05, `몽골군이 땅에 박히지 않는다 ${h.sunk}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });
test('d62 고려4-5: 몽골군 모자가 머리 위에 떠 있지 않다', () => {
  for (const id of ['mongol', 'mongolArcher', 'mongolLancer']) {
    const p = makePerson(LOOKS[id]); p.updateMatrixWorld(true);
    const hat = new THREE.Box3().setFromObject(p.getObjectByName('hat:mongol')), head = new THREE.Box3().setFromObject(p.getObjectByName('head'));
    ok(hat.min.y < head.max.y - 0.15, `${id}: 모자 아래 ${hat.min.y.toFixed(2)} / 머리 꼭대기 ${head.max.y.toFixed(2)}`);
  }
});
test('d62 고려4-6·15·17: 처인성 소식, 충주성 앞 해설, 노비 문서 뒤 김윤후의 약속(대사)', () => {
  const news = ch4Script.cheoin.news; ok(news?.length && news.some(l => l.text.includes('김윤후') && l.text.includes('처인성') && l.src), '처인성에 김윤후가 있다는 소식');
  const before = ch4Script.chungju.before; ok(before?.length && before.some(l => l.who === 'narr' && l.text.includes('충주성') && l.text.includes('김윤후') && l.src), '충주성 방어에도 참여했다는 해설');
  const pr = ch4Script.chungju.promise; ok(pr?.length && pr.every(l => l.who === 'kimyunhu') && pr.some(l => l.text.includes('벼슬')), '김윤후가 말로 약속');
  ok(!ch4Script.chungju.burn || ch4Script.chungju.burn.every(l => l.who !== 'narr'), '불태운 뒤 해설은 없다');
});
async function runCheoin(s, sec) {
  setupCheoin(s.ctx);
  const run = cheoinDefense(s.ctx, false);
  const off = s.w.onUpdate(() => { const sp = s.ctx.testHooks.spot; if (sp) { s.w.player.position.x = sp.x; s.w.player.position.z = sp.z; } });
  for (let i = 0; i < sec * 30; i++) s.w.step(1 / 30, { x: 0, z: 0 });
  off(); return run;
}
test('d62 고려4-7~13: 처인성: 막사 불 없음·멀리·지키는 몽골군, 일반 화살이 남아 보임, 궁수 미리, 30초, 말은 막사로 달아남', async () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    eq(sc.campFires.length, 0, '막사 불');
    ok(sc.camp && sc.camp.dist >= 55, `막사 거리 ${sc.camp?.dist}`);
    ok(sc.camp.guards.length >= 4, `막사를 지키는 몽골군 ${sc.camp.guards.length}`);
    for (const a of sc.arrows) { ok(!a.getObjectByName('fireTip') && !a.getObjectByName('trail'), '불화살이 아닌 보통 화살'); }
    setupCheoin(s.ctx);
    ok(sc.archers.every(a => a.group.visible), '궁수·승려가 성벽 위에 미리 서 있다');
    ok(ch4Script.cheoin.howto.steps.join(' ').includes('30초'), '설명 30초');
    const r = await runCheoin(s, 32);
    eq(s.ctx.testHooks.cheoinDuration, 30, '30초');
    ok(r === true, '버텼다');
    ok(s.ctx.testHooks.stuckArrows >= 1, `맞은 화살이 사라지지 않고 보인다 ${s.ctx.testHooks.stuckArrows}`);
    ok(s.ctx.testHooks.horseFlee >= 6, `말이 막사 쪽으로 빠르게 달아난다 ${s.ctx.testHooks.horseFlee?.toFixed(1)}`);
    ok(s.ctx.testHooks.horseToCamp > 0.8, `막사 쪽으로 ${s.ctx.testHooks.horseToCamp?.toFixed(2)}`);
  } finally { s.done(); }
}, { timeout: 60000 });
test('d62 고려4-14: 놀이가 끝나면 김윤후가 활로 살리타를 쏘아 쓰러뜨리고 몽골군이 적진으로 달아난다', async () => {
  const s = touchSetup(ch4Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch4.buildScene(s.w, s.ctx); setupCheoin(s.ctx);
    await salitaiScene(s.ctx);
    const h = s.ctx.testHooks.salitai;
    ok(h.bow, '김윤후가 활을 들었다'); ok(h.arrowFlew, '화살이 날아갔다'); ok(h.fell, '살리타가 쓰러졌다');
    ok(h.fled >= 4 && h.fleeSpeed >= 4, `몽골군이 빠르게 달아난다 ${h.fled}명 ${h.fleeSpeed?.toFixed(1)}m/s`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
test('d62 고려4-16: 충주성: 김윤후는 노비 문서 곁, 문서 뭉치에 불이 붙어 점점 작아지다 재가 된다', async () => {
  const s = touchSetup(ch4Script.speakers);
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    const C = sc.areas.chungju;
    const d = Math.hypot(C.kimyunhu[0] - C.pile[0], C.kimyunhu[1] - C.pile[1]); ok(d < 2.6, `김윤후와 문서 더미 ${d.toFixed(1)}m`);
    sc.pileUp(3);
    const h0 = sc.stackHeight(); const p = sc.burnDocuments(); let mid = null;
    for (let i = 0; i < 300; i++) { s.w.step(1 / 30, { x: 0, z: 0 }); if (i === 110) mid = sc.stackHeight(); }
    await p;
    ok(h0 > 0.2 && mid < h0 * 0.8 && mid > 0.01, `점점 작아진다 ${h0.toFixed(2)} → ${mid?.toFixed(2)}`);
    ok(sc.stackHeight() < 0.02 && sc.ashPile.visible, '완전히 재가 된다');
    ok(sc.fireOnStack, '불은 문서 뭉치 위에');
  } finally { s.done(); }
}, { timeout: 30000 });

// ── 고려 5장(팔만대장경) ──
import ch5 from '../chapters/ch5/chapter.js';
import ch5Script from '../chapters/ch5/script.js';
import { makeBlock } from '../chapters/ch5/chapter.js';
import { roam } from '../core/flow.js';
test('d62 고려5-1: 초조대장경은 맨 아래에서 불이 붙어 그을리며 점점 타 검은 재가 된다', () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    ch5.buildScene(s.w, s.ctx);
    const intro = ch5.introScene(s.ctx); intro.shots[0].act(s.ctx);
    const h = s.ctx.testHooks.introBurn; const h0 = h.height();
    for (let i = 0; i < 90; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    const mid = h.height(), dark0 = h.darkness();
    for (let i = 0; i < 150; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(h.fireY() < 0.3, `불은 맨 아래에 ${h.fireY().toFixed(2)}`);
    ok(mid < h0 && h.height() < h0 * 0.35, `점점 타서 낮아진다 ${h0.toFixed(2)} → ${mid.toFixed(2)} → ${h.height().toFixed(2)}`);
    ok(h.darkness() > 0.8 && h.darkness() >= dark0, `검게 그을린다 ${h.darkness().toFixed(2)}`);
    ok(h.ash(), '검은 재가 남는다');
    intro.done(s.ctx);
  } finally { s.done(); }
});
test('d62 고려5-2·3: 처음 스님은 정면(학생 쪽)을 보고, 장인은 대화 뒤 다시 처음 방향을 본다', async () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    const monk = s.w.npcs.get('monk').mesh, st = sc.start;
    const to = Math.atan2(st[0] - monk.position.x, st[1] - monk.position.z), d = Math.atan2(Math.sin(to - monk.rotation.y), Math.cos(to - monk.rotation.y));
    ok(Math.abs(d) < 0.5, `스님이 학생 쪽을 본다 ${d.toFixed(2)}`);
    const a = s.w.npcs.get('artisan1').mesh, r0 = a.rotation.y;
    s.w.player.position.set(a.position.x + 1.5, 0, a.position.z + 1.5);
    const stop = roam(s.ctx, { faceBack: true, async onTalk() {} });
    s.w.step(1 / 30, { x: 0, z: 0 }); s.hud.talkBtn.click(); await sleep(20);
    for (let i = 0; i < 60; i++) { s.w.step(1 / 30, { x: 0, z: 0 }); if (i === 2) await sleep(5); }
    stop();
    ok(Math.abs(Math.atan2(Math.sin(a.rotation.y - r0), Math.cos(a.rotation.y - r0))) < 0.05, `처음 방향으로 돌아섰다 ${a.rotation.y.toFixed(2)} / ${r0.toFixed(2)}`);
    const src = await (await fetch('../chapters/ch5/chapter.js')).text();
    ok(/roam\(ctx, \{[^}]*faceBack: true/.test(src), '5장 탐험에서 장인이 다시 돌아선다');
  } finally { s.done(); }
});
test('d62 고려5-4~11: 경판 만들기(꾹 누르기·그림 먼저·끓는 솥·세로 말리기·가로 새기기·마구리·옻칠)', async () => {
  const s = touchSetup(ch5Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    await makeBlock(s.ctx);
    const W = s.ctx.testHooks.work, O = s.ctx.testHooks.order;
    ok(W.soak.holdSec >= 2.9 && W.soak.strokes === 0, `바닷물: 3초 꾹 누르기 ${W.soak.holdSec?.toFixed(2)}`);
    for (const id of ['soak', 'boil', 'dry', 'ends', 'lacquer']) ok(O.indexOf(`picture:${id}`) >= 0 && O.indexOf(`picture:${id}`) < O.indexOf(`put:${id}`), `${id}: 그림 설명이 먼저`);
    ok(sc.pot.water.visible && sc.pot.bubbles.length >= 6 && sc.pot.open, '솥: 끓는 물이 보인다');
    ok(W.boil.spin > 1.5 && W.boil.underwater, `휘저으면 소금물 아래 판이 물과 함께 돈다 ${W.boil.spin?.toFixed(2)}`);
    ok(W.dry.vertical > 0.95, `선반: 세로로 세운다 ${W.dry.vertical?.toFixed(2)}`); ok(W.dry.wait >= 3, `일정 시간 뒤 꺼낸다 ${W.dry.wait}`);
    for (const id of ['carve', 'ends', 'lacquer']) ok(W[id].horizontal > 0.95, `${id}: 경판을 가로로 ${W[id].horizontal?.toFixed(2)}`);
    eq(sc.tableBoards.length, 0, '경판 밑 나무판자 없음');
    ok(W.ends.tableGap >= 0.25, `몸이 탁자를 통과하지 않는다 ${W.ends.tableGap?.toFixed(2)}`);
    ok(sc.lacquerPot.position.distanceTo(new THREE.Vector3(...sc.stations.find(x => x.id === 'lacquer').put)) > 0.9, '검은 옻칠 통은 구석으로');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
test('d62 고려5-4: 바닷물 담그기는 짧게 누르면 되지 않고 3초 꾹 눌러야 한다', async () => {
  const s = touchSetup(ch5Script.speakers);
  try {
    const sc = ch5.buildScene(s.w, s.ctx);
    ch5.enterStage(s.ctx, 'minigame');
    makeBlock(s.ctx);
    for (let i = 0; i < 5; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    const st0 = sc.stations[0];
    s.w.player.position.set(st0.spot[0], 0, st0.spot[1]); for (let i = 0; i < 10; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    s.hud.talkBtn.click(); await sleep(10);
    for (let i = 0; i < 400 && !s.ctx.testHooks.holding; i++) { s.w.step(1 / 30, { x: 0, z: 0 }); if (document.querySelector('.doc-ok')) document.querySelector('.doc-ok').click(); await sleep(1); }
    ok(s.ctx.testHooks.holding, '꾹 누르기 차례');
    s.hud.talkBtn.click(); for (let i = 0; i < 30; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(s.ctx.testHooks.holding, '짧게 누르기로는 끝나지 않는다');
    s.hud.talkBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    for (let i = 0; i < 60; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    ok(s.ctx.testHooks.holding, '2초로는 아직');
    for (let i = 0; i < 40; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    s.hud.talkBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    ok(!s.ctx.testHooks.holding, '3초 꾹 누르면 담근다');
  } finally { s.done(); }
}, { timeout: 60000 });
test('d62 고려5-12: 16년 동안 서가를 채우는 장면은 빠르게 흐르는 타임랩스(사람도 빠르게)', async () => {
  const s = touchSetup(ch5Script.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch5.buildScene(s.w, s.ctx);
    await ch5.stories.tripitaka(s.ctx);
    const h = s.ctx.testHooks.tripitaka;
    ok(h.timelapse, '타임랩스'); eq(h.years, 16, '해마다 1236~1251'); ok(h.filled, '서가가 가득 찬다');
    ok(h.carrierSpeed > 5, `나르는 사람이 빠르게 움직인다 ${h.carrierSpeed?.toFixed(1)}m/s`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

// ── 고려 6장(삼별초) ──
import ch6s from '../chapters/ch6/script.js';
test('d62 고려6-1·2: 장이 시작하면 반대하던 군사들이 든 팔을 내리고, 사람들은 학생 쪽을 본다', () => {
  const s = touchSetup(ch6s.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    for (const id of ['baejungson', 'sambyeolcho', 'minister', 'villager']) {
      const m = s.w.npcs.get(id).mesh, to = Math.atan2(sc.start[0] - m.position.x, sc.start[1] - m.position.z), d = Math.atan2(Math.sin(to - m.rotation.y), Math.cos(to - m.rotation.y));
      ok(Math.abs(d) < 0.6, `${id}: 학생 쪽을 본다 ${d.toFixed(2)}`);
    }
    const intro = ch6.introScene(s.ctx);
    intro.shots.forEach(sh => sh.act?.(s.ctx)); for (let i = 0; i < 20; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    intro.done(s.ctx); for (let i = 0; i < 20; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    for (const id of ['sambyeolcho', 'baejungson']) { const a = s.w.npcs.get(id).mesh.userData.arms; ok(a.every(x => x.rotation.x > -0.5), `${id}: 팔을 내렸다 ${a.map(x => x.rotation.x.toFixed(2))}`); }
  } finally { s.done(); }
});
test('d62 고려6-3: 배중손을 앞에 태우고 학생이 노를 저어 간다', () => {
  const s = touchSetup(ch6s.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    const r = sc.boat.userData.rower, pas = sc.boat.userData.passenger;
    ok(r.person.userData.student, '노 젓는 사람은 학생');
    ok(pas && pas.userData.who === 'baejungson', '배중손이 탔다');
    ok(pas.position.z > r.person.position.z + 1.2, '배중손은 앞(뱃머리)에');
  } finally { s.done(); }
});
test('d62 고려6-4·5: 용장성은 성벽이 허물어져 무너지고, 항파두리는 흙성을 뒤로 두고 두 군대가 대치한다', async () => {
  const s = touchSetup(ch6s.speakers); const bot = touchBot(s, { answers: new Set() });
  try {
    ch6.buildScene(s.w, s.ctx);
    ok(!ch6s.jeju.talk.some(l => l.text.includes('꾸민 장면')), '꾸몄다는 해설은 뺐다');
    await ch6.stories.yongjang(s.ctx);
    const y = s.ctx.testHooks.yongjang;
    ok(y.crumbled >= 20, `무너져 내린 성돌 ${y.crumbled}`); ok(!y.fire, '불길 대신 무너짐');
    await ch6.stories.hangpaduri(s.ctx);
    const h = s.ctx.testHooks.hangpaduri;
    ok(h.phases.includes('standoff') && !h.phases.includes('clash'), `대치(싸움 없음) ${h.phases}`);
    ok(h.wallBehind, '삼별초는 흙성을 등지고 선다'); ok(h.gap > 4, `두 군대 사이 ${h.gap?.toFixed(1)}m`); ok(h.facing > 0.85, `서로 마주 본다 ${h.facing?.toFixed(2)}`);
  } finally { bot.stop(); s.done(); }
}, { timeout: 120000 });
test('d62 고려6-1(뼈대 몸): 장이 시작하면 든 팔을 내린다', async () => {
  await loadBody(); resetBodies(); setRigHook(attachBody); POST_POSE.add(updateBodies);
  const s = touchSetup(ch6s.speakers);
  try {
    ch6.buildScene(s.w, s.ctx);
    const intro = ch6.introScene(s.ctx);
    intro.shots.forEach(sh => sh.act?.(s.ctx)); for (let i = 0; i < 20; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    intro.done(s.ctx); for (let i = 0; i < 30; i++) s.w.step(1 / 30, { x: 0, z: 0 });
    const q = new THREE.Quaternion(), up = new THREE.Vector3();
    for (const id of ['sambyeolcho', 'baejungson']) {
      const m = s.w.npcs.get(id).mesh, S = m.userData.skel; ok(S, '뼈대 몸');
      for (const side of ['R', 'L']) { const b = S.bones(`upperarm_${side}`) || S.bones(`arm_${side}`); if (!b) continue; const hand = S.bones(`hand_${side}`); const a = b.getWorldPosition(new THREE.Vector3()), h = hand.getWorldPosition(new THREE.Vector3()); ok(h.y < a.y, `${id} ${side}: 손이 어깨보다 아래 ${h.y.toFixed(2)} < ${a.y.toFixed(2)}`); }
    }
  } finally { setRigHook(null); POST_POSE.delete(updateBodies); s.done(); }
});
