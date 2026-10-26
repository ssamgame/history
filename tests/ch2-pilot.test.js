// 고려 2장 시범(2026-10-26)과 작전 부품 상자(chapters/kit/ops.js): 판 다시 하기·쉬운 모드, 지휘판 배치 판정, 호위, 말풍선, 지킴이 고르기,
// 꼭 듣는 대사 수, 지휘판 화면 배치, 놀이 화면 그리기 조각 수.
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { runRounds, commandBoard, escort, talk, pickGuardian, savedGuardian, finale } from '../chapters/kit/ops.js';
import ch2Script from '../chapters/ch2/script.js';
import ch2 from '../chapters/ch2/chapter.js';
import { touchSetup, sleep } from './bot.js';
import { bakeLevel } from '../core/bake.js';
import { drawPieces } from '../core/figures.js';

const ZONES = [{ label: '왼쪽' }, { label: '가운데' }, { label: '오른쪽' }];
const step = (s, sec) => { for (let t = 0; t < sec; t += 0.05) s.w.step(0.05, { x: 0, z: 0 }); };
const zoneBtn = (s, i) => s.ui.querySelector(`.ops-zone[data-zone="${i}"]`);

test('ch2-pilot: runRounds repeats only the failed round and turns easy after two failures', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const seen = [], plan = [false, false, true, true]; // 1판을 두 번 틀리고 세 번째에 성공, 2판은 한 번에
    const auto = setInterval(() => { if (s.dialogue.isOpen()) s.dialogue.advance(); }, 5);
    const r = await runRounds(s.ctx, ['a', 'b'], async (round, { index, easy }) => { seen.push(`${round}${index}${easy ? '쉬움' : ''}`); return plan.shift(); }, { failHint: '다시' });
    clearInterval(auto);
    eq(seen, ['a0', 'a0', 'a0쉬움', 'b1쉬움']);
    eq(r, { first: false, easyModeUsed: true, fails: 2 });
    const r2 = await runRounds(s.ctx, [1], async () => true);
    eq(r2, { first: true, easyModeUsed: false, fails: 0 });
  } finally { s.done(); }
});

test('ch2-pilot: command board — a soldier in the zone pushes the ladder away, an empty zone lets it reach the top', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const events = [];
    const scene = { spawn: th => ({ zone: th.zone }), end: (h, how) => events.push(`${h.zone}:${how}`) };
    const p = commandBoard(s.ctx, { zones: ZONES, units: 3, threats: [{ at: 0, zone: 0 }, { at: 0, zone: 2 }], scene, maxBreach: 3, timing: { climb: 2 } });
    step(s, 0.2);
    eq(zoneBtn(s, 0).dataset.short, '1', 'zone 0 needs a soldier');
    ok(zoneBtn(s, 0).classList.contains('danger'), 'zone 0 blinks');
    zoneBtn(s, 0).click(); // 대기 병사가 바로 간다
    eq(zoneBtn(s, 0).dataset.count, '1');
    eq(s.ui.querySelectorAll('.ops-token:not([hidden])').length, 2, 'one token left the tray');
    step(s, 6);
    const ok1 = await p;
    eq(events.sort(), ['0:blocked', '2:breach']);
    eq(ok1, true, 'one breach is not a failure');
  } finally { s.done(); }
});

test('ch2-pilot: command board — a big ladder needs two soldiers, three breaches fail the round', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const events = [];
    const scene = { spawn: th => ({ zone: th.zone }), end: (h, how) => events.push(`${h.zone}:${how}`) };
    const p = commandBoard(s.ctx, { zones: ZONES, units: 4, threats: [{ at: 0, zone: 1, need: 2 }], scene, timing: { climb: 3 } });
    step(s, 0.2);
    zoneBtn(s, 1).click();
    step(s, 3);
    eq(zoneBtn(s, 1).dataset.short, '1', 'one soldier is not enough');
    zoneBtn(s, 1).click();
    step(s, 2);
    eq(await p, true); eq(events, ['1:blocked']);
    const q = commandBoard(s.ctx, { zones: ZONES, units: 3, threats: [0, 1, 2].map(zone => ({ at: 0, zone })), scene: {}, timing: { climb: 1 } });
    step(s, 5);
    eq(await q, false, 'three ladders at the top: try this round again');
    ok(!s.ui.querySelector('.ops-board'), 'board removed');
  } finally { s.done(); }
});

test('ch2-pilot: command board — pick a token then a zone, drag a token onto a zone, keyboard arrows and space', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const p = commandBoard(s.ctx, { zones: ZONES, units: 3, practice: true });
    const tok = i => s.ui.querySelector(`.ops-token[data-unit="${i}"]`);
    tok(1).click(); ok(tok(1).classList.contains('picked'), 'token picked');
    zoneBtn(s, 2).click(); eq(zoneBtn(s, 2).dataset.count, '1', 'tap token, then zone');
    // 끌어 놓기
    const r = tok(0).getBoundingClientRect(), z = zoneBtn(s, 0).getBoundingClientRect();
    const ev = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 9, clientX: x, clientY: y, bubbles: true }));
    ev(tok(0), 'pointerdown', r.left + 10, r.top + 10);
    ev(window, 'pointermove', r.left + 40, r.top - 20);
    ev(window, 'pointermove', z.left + z.width / 2, z.top + z.height / 2);
    ev(window, 'pointerup', z.left + z.width / 2, z.top + z.height / 2);
    eq(zoneBtn(s, 0).dataset.count, '1', 'dragged onto zone 0');
    // 키보드: 가운데(처음 커서)에 스페이스
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    ok(zoneBtn(s, 1).classList.contains('cursor'), 'cursor on the middle zone');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    step(s, 0.1);
    eq(await p, true, 'practice ends when every zone has a soldier');
  } finally { s.done(); }
});

function escortSetup(s) {
  const L = s.w.level;
  const mk = () => { const g = new THREE.Group(); L.add(g); return g; };
  const field = { bounds: { x0: -9, x1: 9, z0: -38, z1: -20 }, start: [0, -22], safeZ: -23.4, lostZ: -37, band: [-30, -25] };
  const groups = [[-6, -33], [6, -33]].map(start => ({ root: mk(), start }));
  const guards = [-6, 0, 6].map(x => { const g = mk(); g.position.set(x, 0, -27.5); return g; });
  return { field, lanes: [{ x: -6 }, { x: 0 }, { x: 6 }], waves: [{ groups: [0, 1], blocked: [1] }], groups, guards, need: 2, seconds: 60 };
}
test('ch2-pilot: escort — a group follows once reached and is saved at the safe line; a blocked lane loses it', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const o = escortSetup(s);
    const p = escort(s.ctx, o);
    const P = s.w.player.position;
    ok(o.guards[1].visible && !o.guards[0].visible, 'only the blocked lane shows a guard');
    const g0 = o.groups[0].root;
    // 첫 무리 옆으로 옮겨 가면 따라온다
    P.set(-6, 0, -32.4); step(s, 0.1);
    const before = g0.position.clone();
    P.set(-6, 0, -29); s.w.player.rotation.y = 0; step(s, 1.5);
    ok(g0.position.z > before.z + 1, 'group follows the player');
    // 막힌 가운데 길로 지나가면 놓친다
    P.set(0, 0, -27.5); step(s, 0.1);
    const z1 = g0.position.z; step(s, 1);
    ok(g0.position.z < z1, 'released: the group is led away again');
    // 다시 데려와 안전선을 넘는다
    P.set(g0.position.x, 0, g0.position.z + 0.5); step(s, 0.1);
    P.set(-6, 0, -22); step(s, 0.2);
    ok(s.ui.textContent.includes('구한 백성 1/2'), 'one group saved');
    // 두 번째 무리는 그냥 두면 멀리 끌려가 놓친다
    step(s, 25);
    eq(await p, false, 'only one of two saved');
  } finally { s.done(); }
});

test('ch2-pilot: speech bubbles sit over the speaker and the dialogue box goes back to the bottom afterwards', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const m = new THREE.Object3D(); m.position.set(0, 0, -3); s.w.level.add(m);
    s.w.player.position.set(0, 0, 0); s.w.snapCamera();
    const p = talk(s.ctx, [{ who: 'soldier', text: '거란 왕이 직접 대군을 이끌고 왔대!', src: ['S3'] }, { who: 'narr', text: '해설', src: ['S3'] }], { soldier: m });
    await sleep(10); s.w.step(0.016, { x: 0, z: 0 });
    const dlg = s.ui.querySelector('.dlg');
    ok(dlg.classList.contains('ops-bubble'), 'bubble while the soldier speaks');
    ok(dlg.style.top, 'placed on screen');
    s.dialogue.advance(); s.dialogue.advance(); await sleep(10);
    ok(!dlg.classList.contains('ops-bubble'), 'narration goes to the bottom box');
    s.dialogue.advance(); s.dialogue.advance(); await p;
    eq(dlg.style.top, '');
  } finally { s.done(); }
});

test('ch2-pilot: a speech bubble never covers the goal box at the top left', async () => {
  const s = touchSetup(ch2Script.speakers);
  const hud = document.createElement('div'); hud.className = 'hud';
  Object.assign(hud.style, { position: 'fixed', left: '0px', top: '0px', width: '45%', height: '55%' });
  s.ui.append(hud);
  try {
    const m = new THREE.Object3D(); m.position.set(-4, 0, -30); s.w.level.add(m); // 멀리 왼쪽: 말풍선이 화면 왼쪽 위로 간다
    s.w.player.position.set(0, 0, 0); s.w.snapCamera();
    const p = talk(s.ctx, [{ who: 'soldier', text: '거란 왕이 직접 대군을 이끌고 왔대!', src: ['S3'] }], { soldier: m });
    await sleep(10); s.w.step(0.016, { x: 0, z: 0 });
    const a = s.ui.querySelector('.dlg').getBoundingClientRect(), b = hud.getBoundingClientRect();
    ok(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom, `bubble ${Math.round(a.left)},${Math.round(a.top)} overlaps the goal box`);
    s.dialogue.advance(); s.dialogue.advance(); await p;
  } finally { hud.remove(); s.done(); }
});

test('ch2-pilot: guardian pick saves one new key; skipping keeps the default', async () => {
  const s = touchSetup(ch2Script.speakers);
  const key = 'goryeo-game:guardian-test';
  try {
    try { localStorage.removeItem(key); } catch {}
    const opts = [{ id: 'a', name: '가', color: '#2f6b9e' }, { id: 'b', name: '나', color: '#b8452f' }];
    let p = pickGuardian(s.ctx, { key, options: opts });
    s.ui.querySelector('.ops-pick .skip').click();
    eq(await p, 'a'); eq(savedGuardian(key, null), null, 'skip saves nothing');
    p = pickGuardian(s.ctx, { key, options: opts });
    s.ui.querySelector('.ops-pick .opt[data-id="b"]').click(); s.ui.querySelector('.ops-pick .primary').click();
    eq(await p, 'b'); eq(savedGuardian(key, null), 'b');
  } finally { try { localStorage.removeItem(key); } catch {} s.done(); }
});

test('ch2-pilot: finale stamps the seal and writes the wisdom card into the notebook', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const got = []; s.ctx.notebook = { record: l => got.push(l.text) };
    const p = finale(s.ctx, { stamp: '지킴', sub: '흥화진을 지켰다!', stars: 2, card: ch2Script.wall.done[0], hold: 10 });
    await sleep(20);
    ok(s.ui.querySelector('.ops-stamp'), 'stamp'); ok(s.ui.textContent.includes('★★☆'), 'stars');
    ok(s.ui.querySelector('.ops-wisdom').textContent.includes('함락하지 못했어요'), 'wisdom card');
    await p;
    eq(got, ['거란군은 흥화진을 끝내 함락하지 못했어요.']);
  } finally { s.done(); }
});

test('ch2-pilot: required lines are 7 or fewer, and every bubble line fits in two lines', () => {
  const S = ch2Script, n = S.npc;
  const required = [S.start, n.soldier.first, n.yanggyu.first, S.wall.done, S.rescue.done, S.result];
  eq(required.flat().length <= 7, true, `required ${required.flat().length}`);
  eq(S.rescue.intro, undefined, 'no extra intro line before the escort');
  for (const l of [n.soldier.first, n.soldier.later, n.yanggyu.first, n.yanggyu.later, n.yanggyu.tooEarly, n.villager.always].flat()) ok([...l.text].length <= 46, `${l.text} (${[...l.text].length})`);
  // 사실 문장은 지금과 같다(출처 그대로)
  eq(n.soldier.first[0], { who: 'soldier', text: '거란 왕이 직접 대군을 이끌고 왔대!', src: ['S3'] });
  eq(n.yanggyu.first[0].src, ['S2']); eq(S.wall.done[0].src, ['S15']); eq(S.rescue.done[0].src, ['S15']);
});

test('ch2-pilot: board view draw pieces stay small after baking (people merged per person)', async () => {
  const s = touchSetup(ch2Script.speakers);
  try {
    const sc = ch2.buildScene(s.w, s.ctx);
    bakeLevel(s.w, sc);
    // 지휘판 가장 바쁜 때(3파): 성벽 위 병사 넷, 사다리 셋(큰 사다리 하나에 둘이 오른다), 성 밖 거란군, 깃발 셋
    sc.khitanCrowd.visible = true; sc.waveFlags.forEach(f => { f.visible = true; });
    for (const d of sc.defenders) d.visible = true;
    sc.ladders.forEach((l, i) => { l.group.visible = true; l.fx.carrier.visible = false; l.fx.climber.visible = true; l.fx.climber2.visible = i === 1; l.big.visible = i === 1; l.normal.visible = i !== 1; });
    for (const id of ['soldier', 'yanggyu', 'villager']) s.w.npcs.get(id).mesh.visible = false;
    s.w.player.visible = false;
    const n = drawPieces(s.w.scene);
    ok(n <= 240, `board view draw pieces ${n}`);
  } finally { s.done(); }
});

// 지휘판이 화면 크기마다 화면 안에 들고, 손가락으로 누를 만큼 크고, 서로 겹치지 않는다(게이지와도)
const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]];
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
test('layout: ch2 command board fits, can be tapped and does not overlap the gauge', async () => {
  for (const [w, h] of SIZES) {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=ops'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.ops-board button'); i++) await sleep(20);
      await sleep(50);
      const btns = [...d.querySelectorAll('.ops-board button')].filter(b => !b.hidden);
      eq(btns.length, 7, `${w}x${h}: 4 tokens and 3 zones`);
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${w}x${h}: ${b.className} outside`);
        ok(r.height >= 44 && r.width >= 44, `${w}x${h}: ${b.className} too small (${Math.round(r.width)}x${Math.round(r.height)})`);
        const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(top && (top === b || b.contains(top)), `${w}x${h}: ${b.className} covered`);
      }
      for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) ok(!overlap(btns[i].getBoundingClientRect(), btns[j].getBoundingClientRect()), `${w}x${h}: buttons overlap`);
      const g = d.querySelector('.ops-gauge').getBoundingClientRect(), b = d.querySelector('.ops-board').getBoundingClientRect();
      ok(!overlap(g, b), `${w}x${h}: gauge overlaps the board`);
      const hb = d.querySelector('.hud:not([hidden])').getBoundingClientRect();
      ok(!overlap(g, hb), `${w}x${h}: gauge overlaps the goal box`);
      ok(!overlap(hb, b), `${w}x${h}: goal box overlaps the board`);
      ok(g.left >= 0 && g.right <= w && g.top >= 0, `${w}x${h}: gauge on screen`);
    } finally { frame.remove(); }
  }
}, { timeout: 60000 });
