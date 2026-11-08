// 상황 놀이 부품(chapters/kit/play.js): 터치만으로 끝까지 할 수 있고, 틀리게 고르면 해설을 듣고 이어서 한다.
import * as THREE from 'three';
import { test, eq, ok } from './harness.js';
import { makeKitChapter } from '../chapters/kit/chapter.js';
import { PLAY, buildArena } from '../chapters/kit/play.js';
import { runChapter } from '../core/flow.js';
import { testWorld, touchSetup, touchBot, memSave, sleep } from './bot.js';

const script = {
  speakers: { guide: { name: '안내', mark: '◎', color: '#2f6b5e' }, a: { name: '가', mark: '가', color: '#555', look: 'citizen' } },
  intro: [{ who: 'narr', text: '시험', src: ['S51'] }],
  start: [{ who: 'guide', text: '시작' }],
  goals: ['가에게 말 걸기', '놀이', '퀴즈'],
  minigameTitle: '시험 놀이',
  npc: { a: { first: [{ who: 'a', text: '안녕' }] } },
  parts: {},
  result: [{ who: 'narr', text: '끝', src: ['S51'] }],
  quizzes: [
    { kind: 'quiz', question: 'Q1', options: ['맞음', '틀림'], answer: 0, explain: '', src: ['S51'] },
    { kind: 'quiz', question: 'Q2', options: ['맞음2', '틀림2'], answer: 0, explain: '', src: ['S51'] },
  ],
};
const arena = { origin: [300, 0], ground: 'earth', bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } };
const PARTS = {
  drive: { type: 'drive', title: '배 몰기', arena, vehicle: 'boat', from: [0, 15], seconds: 60,
    route: [{ x: 0, z: 5, label: '첫째' }, { x: 8, z: -5, say: '둘째에 왔어요' }, { x: 0, z: -14, label: '인천' }],
    hazards: [{ x: -10, z: 0, r: 1.4, kind: 'mine' }, { x: 12, z: 8, to: [12, 14], kind: 'ship', r: 1.6 }], followers: null },
  stops: { type: 'stops', title: '차례대로', arena, from: [0, 15], seconds: 60,
    spots: [{ x: -8, z: 0, label: '가 (1)' }, { x: 8, z: 0, label: '나 (2)' }, { x: 0, z: -10, label: '다 (3)' }] },
  deliver: { type: 'deliver', title: '나누기', arena, from: [0, 10],
    bins: [{ id: 'a', label: '민주주의', x: -9, z: -6 }, { id: 'b', label: '경제 성장', x: 9, z: -6 }],
    cards: [{ text: '4·19 혁명', bin: 'a' }, { text: '고속도로', bin: 'b' }, { text: '6월 항쟁', bin: 'a' }] },
  find: { type: 'find', title: '찾기', arena, from: [0, 12],
    items: [{ text: '맞음1', correct: true, x: -8, z: 2 }, { text: '틀림', correct: false, x: 0, z: -4 }, { text: '맞음2', correct: true, x: 8, z: 2 }] },
  ambush: { type: 'ambush', title: '매복', arena, camera: { pos: [0, 18, 16], target: [0, 0, 0] },
    path: [[0, -20], [0, 18]], zone: { x: 0, z: 0, r: 6 }, enemies: 4, need: 3, interval: 1.6, speed: 3 },
  sneak: { type: 'sneak', title: '몰래', arena, from: [0, 16], seconds: 90,
    waypoints: [{ x: -8, z: 6 }, { x: -8, z: -6 }, { x: 0, z: -14, label: '임시 정부' }],
    guards: [{ path: [[6, 2], [6, -10]], speed: 0.7, range: 4 }] },
};

const chapterWith = parts => makeKitChapter({
  id: 'zz', mood: 'morning', script: { ...script, parts }, order: ['a'], spot: [0, 3],
  layout: { ground: 'grass', bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, start: [0, 6], npcs: [{ id: 'a', look: 'citizen', x: 0, z: 0 }], signs: [] },
  parts: Object.values(parts),
});

for (const [kind, part] of Object.entries(PARTS)) {
  test(`play: ${kind} 놀이를 터치만으로 끝까지 한다`, async () => {
    const ch = chapterWith({ [kind]: part });
    const s = touchSetup(script.speakers);
    const answers = { answers: new Set(['맞음', '맞음2']) };
    const bot = touchBot(s, answers);
    try {
      const r = await runChapter({ id: 'zz', no: 1, title: '시험' }, ch, s.ctx, memSave());
      eq(r.firstTryCorrect, r.firstTryTotal, `${kind}: 첫 시도에 성공`);
      eq(r.easyModeUsed, false);
      eq(s.w.speedScale || 1, 1, '탈것 속도는 되돌린다');
      ok(s.w.bounds.x1 < 100, '무대를 치우면 마을 경계로 돌아온다');
    } finally { bot.stop(); s.done(); }
  }, { timeout: 120000 });
}

test('play: 틀린 곳을 고르면 놀이가 끝나지 않고 해설을 들은 뒤 이어서 한다 (차례·나누기·찾기)', async () => {
  for (const kind of ['stops', 'deliver', 'find']) {
    const s = touchSetup(script.speakers);
    try {
      const p = PLAY[kind](s.ctx, PARTS[kind], false);
      const wrong = kind === 'stops' ? PARTS.stops.spots[1] : kind === 'deliver' ? PARTS.deliver.bins[1] : PARTS.find.items[1];
      s.w.player.position.set(300 + wrong.x, 0, wrong.z); s.w.step(1 / 30, { x: 0, z: 0 });
      if (kind !== 'deliver') { ok(!s.hud.talkBtn.disabled, `${kind}: 가까이 가면 버튼이 켜진다`); s.hud.talkBtn.click(); }
      else for (let k = 0; k < 30; k++) s.w.step(1 / 30, { x: 0, z: 0 }); // 나누기는 원 안에 잠깐 서 있으면 놓인다
      let ended = false; p.then(() => { ended = true; });
      await sleep(50);
      eq(ended, false, `${kind}: 틀려도 처음부터 다시 하지 않는다`);
      ok(s.dialogue.isOpen(), `${kind}: 해설을 들려준다`);
    } finally { s.done(); }
  }
});

test('play: 무대는 끝나면 부딪힘과 경계까지 모두 치운다', () => {
  const w = testWorld();
  try {
    const before = w.colliders.length, b = w.bounds;
    const a = buildArena(w, { ...arena, props: [{ type: 'rice', x: 2, z: 2 }] });
    ok(w.colliders.length > before);
    a.dispose();
    eq(w.colliders.length, before); eq(w.bounds, b);
  } finally { w.dispose(); }
});

// 이야기가 있는 긴 놀이: 지점마다 대화, 기다리기(물때), 줍기, 여러 차례 공격, 숨을 곳
const STORY = {
  drive: { type: 'drive', title: '이야기 배 몰기', arena, vehicle: 'boat', from: [0, 15], seconds: 90,
    route: [{ x: 0, z: 5, label: '첫째', talk: [{ who: 'a', text: '첫째 지점이야!' }] }, { x: 6, z: -4, label: '물때', hold: 3, talk: [{ who: 'a', text: '밀물이 찼어. 가자!' }] }, { x: 0, z: -14, label: '도착', needPickups: true }],
    pickups: [{ x: -6, z: -8, label: '태극기' }, { x: 8, z: -12, label: '태극기' }] },
  ambush: { type: 'ambush', title: '두 차례', arena, camera: { pos: [0, 18, 16], target: [0, 0, 0] }, path: [[0, -20], [0, 18]], zone: { x: 0, z: 0, r: 6 },
    waves: [{ enemies: 3, need: 2, interval: 1.4, speed: 3 }, { enemies: 3, need: 2, interval: 1.4, speed: 3.5, talk: [{ who: 'a', text: '2차 공격이다!' }] }] },
  stops: { type: 'stops', title: '이야기 찾아가기', arena, from: [0, 15],
    spots: [{ x: -8, z: 0, label: '가', look: 'citizen', talk: [{ who: 'a', text: '가에서 들은 이야기' }] }, { x: 8, z: 0, label: '나', talk: [{ who: 'a', text: '나에서 들은 이야기' }] }] },
};
for (const [kind, part] of Object.entries(STORY)) {
  test(`play: ${kind} 이야기 놀이 — 대화를 듣고 끝까지 한다`, async () => {
    const ch = chapterWith({ [kind]: part });
    const s = touchSetup(script.speakers);
    const said = []; const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
    const bot = touchBot(s, { answers: new Set(['맞음', '맞음2']) });
    try {
      const r = await runChapter({ id: 'zz', no: 1, title: '시험' }, ch, s.ctx, memSave());
      eq(r.firstTryCorrect, r.firstTryTotal, `${kind}: 첫 시도에 성공`);
      const talks = JSON.stringify(part).match(/"text":"[^"]+"/g).map(t => t.slice(8, -1));
      for (const t of talks) ok(said.includes(t), `${kind}: 「${t}」를 들려준다`);
    } finally { bot.stop(); s.done(); }
  }, { timeout: 120000 });
}

test('play: 기다리기 지점은 빛나는 곳을 벗어나면 처음부터 다시 기다린다', async () => {
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, route: [{ x: 0, z: 0, hold: 2 }] }, false);
    const at = (x, z) => { s.w.player.position.set(300 + x, 0, z); };
    at(0, 0); for (let i = 0; i < 20; i++) s.w.step(1 / 20, { x: 0, z: 0 }); // 1초
    at(0, 8); s.w.step(1 / 20, { x: 0, z: 0 });                             // 벗어남
    at(0, 0); for (let i = 0; i < 30; i++) s.w.step(1 / 20, { x: 0, z: 0 }); // 1.5초: 아직 모자람
    let done = false; p.then(() => { done = true; });
    await sleep(50); eq(done, false, '벗어나면 다시 세어야 한다');
    for (let i = 0; i < 20; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    eq(await p, true);
  } finally { s.done(); }
});

test('play: 숨을 곳(덤불) 안에 있으면 감시원이 보지 못한다', async () => {
  const s = touchSetup(script.speakers);
  try {
    let caught = 0;
    const p = PLAY.sneak(s.ctx, { arena, from: [0, 3], seconds: 30, caught: '들킴', waypoints: [{ x: 0, z: -15 }], hides: [{ x: 0, z: 3, r: 2 }],
      guards: [{ path: [[0, 8.1], [0, 8]], speed: 0.01, range: 8 }] }, false); // 감시원은 학생 쪽(-z)을 본다
    const toast = () => s.ui.querySelector('.play-toast');
    for (let i = 0; i < 40; i++) { s.w.step(1 / 20, { x: 0, z: 0 }); if (toast() && !toast().hidden && toast().textContent === '들킴') caught += 1; }
    eq(caught, 0, '덤불 속에서는 들키지 않는다');
    s.w.player.position.set(300 + 0, 0, 5.5); // 덤불 밖, 감시원 앞
    for (let i = 0; i < 10; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    ok(toast() && toast().textContent === '들킴', '덤불 밖에서는 들킨다');
    s.w.player.position.set(300, 0, -15); for (let i = 0; i < 5; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    await p;
  } finally { s.done(); }
});

test('play: 정류장에서 기다리면 남은 시간이 가운데 크게 보이고, 손님이 전차에서 내려 걸어 나간다', async () => {
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, vehicle: 'tram', route: [{ x: 0, z: 0, hold: 2, holdLabel: '손님이 내리는 중', alight: 2, board: 1 }] }, false);
    s.w.player.position.set(300, 0, 0);
    for (let i = 0; i < 10; i++) s.w.step(1 / 20, { x: 0, z: 0 }); // 0.5초
    const wait = s.ui.querySelector('.hud-bigwait');
    ok(wait && !wait.hidden, '기다리는 동안 가운데에 보인다');
    ok(/손님이 내리는 중/.test(wait.textContent) && /2초/.test(wait.textContent), wait && wait.textContent);
    const riders = []; s.w.scene.traverse(o => { if (o.userData.rider) riders.push(o); });
    eq(riders.filter(o => o.userData.rider === 'off').length, 2, '내리는 손님 둘');
    eq(riders.filter(o => o.userData.rider === 'on').length, 1, '타는 손님 하나');
    const off = riders.find(o => o.userData.rider === 'off'), x0 = Math.abs(off.position.x - 300);
    for (let i = 0; i < 20; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    ok(Math.abs(off.position.x - 300) > x0 + 1, '내린 손님은 전차에서 멀어진다');
    for (let i = 0; i < 12; i++) s.w.step(1 / 20, { x: 0, z: 0 }); // 2초를 채운다
    eq(await p, true);
    ok(wait.hidden, '끝나면 숨는다');
  } finally { s.done(); }
});

test('play: 성문(gate)은 가운데 문길로 전차가 지나가고 양쪽 돌 몸채만 막는다', () => {
  const w = testWorld();
  const a = buildArena(w, { origin: [300, 0], ground: 'stone', bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, props: [{ type: 'gate', x: 0, z: 0, label: '흥인지문' }] });
  try {
    const hit = (x, z) => w.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r);
    for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) ok(!hit(300 + x, 0), `문길 ${x}은 열려 있다`);
    ok(hit(300 - 4, 0) && hit(300 + 4, 0), '양쪽 몸채는 막힌다');
  } finally { a.dispose(); w.dispose?.(); }
});

test('play: 무대의 길(roads)은 마을 길과 같은 높이(윗면 0.05m 이하)라 사람 발이 길에 묻혀 보이지 않는다(2026-11-04 플레이 점검: 근대 2장 무대에서 신이 0.13m 묻힘)', () => {
  const w = testWorld();
  try {
    const a = buildArena(w, { origin: [400, 0], ground: 'stone', bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, roads: [{ x: 0, z: 0, w: 4, d: 20 }], props: [], nature: false });
    let top = 0; a.group.updateMatrixWorld(true);
    a.group.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.depth === 20) top = Math.max(top, new THREE.Box3().setFromObject(o).max.y); });
    ok(top > 0.04 && top <= 0.05 + 1e-6, `길 윗면 ${top.toFixed(3)}`);
    a.dispose();
  } finally { w.dispose(); }
});

// 2026-11-06 선생님: 따라오는 사람들의 몸이 사라졌다 생겼다 빛나 보인다 → 함께하게 된 사람은 제자리에서 걸어오고, 서로(학생과도) 몸이 겹치지 않는다
test('play: followers never overlap each other or the student (no flicker from bodies inside bodies)', async () => {
  const s = touchSetup(script.speakers);
  try {
    const spots = [[-4, 6], [-2, 6], [0, 6], [2, 6], [4, 6]];
    PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, route: [{ x: 0, z: -8 }], pickups: spots.map(([x, z]) => ({ x, z, follow: 'soldier' })) }, false);
    const F = () => s.ctx.testHooks.followers || [];
    let near = Infinity;
    const off = s.w.onUpdate(() => {
      const P = [s.w.player.position, ...F().map(f => f.position)];
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) near = Math.min(near, Math.hypot(P[i].x - P[j].x, P[i].z - P[j].z));
    });
    for (const [x, z] of spots) { s.w.player.position.set(300 + x, 0, z); for (let i = 0; i < 4; i++) s.w.step(1 / 20, { x: 0, z: 0 }); } // 빠르게 다섯을 모은다
    for (let i = 0; i < 60; i++) s.w.step(1 / 20, { x: 0, z: -1 }); // 걸어간다
    off();
    eq(F().length, 5);
    ok(F().every(f => [f.position.x, f.position.y, f.position.z].every(Number.isFinite) && f.position.y === 0), 'followers stand on the ground (no NaN)');
    ok(near > 0.6, `가장 가까웠을 때 ${near.toFixed(2)}m`);
  } finally { s.done(); }
});

// ── 2026-11-08 근대편 더 재밌게 ──
const stepN = (s, n) => { for (let i = 0; i < n; i++) s.w.step(1 / 20, { x: 0, z: 0 }); };
const toastText = s => { const t = s.ui.querySelector('.play-toast'); return t && !t.hidden ? t.textContent : ''; };

test('play drive: a press point waits for the action button and lights a fire; the chasing ship arriving first fails the try', async () => {
  const s = touchSetup(script.speakers);
  try {
    let r = null;
    const p = PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, route: [{ x: 0, z: 0, press: '봉화 올리기', fire: true }, { x: 0, z: -10 }],
      chase: { from: [20, -60], to: [10, -20], seconds: 4, say: '배가 먼저' } }, false).then(v => { r = v; });
    s.w.player.position.set(300, 0, 0); stepN(s, 10);
    ok(!s.hud.talkBtn.disabled && s.ctx.testHooks.pressing === 'press', 'standing there only offers the button');
    eq(s.ctx.testHooks.pressing, 'press');
    s.hud.talkBtn.click(); stepN(s, 2);
    ok(s.hud.talkBtn.disabled, 'passed: button gone');
    ok(s.w.level.getObjectByName('fire') || [...s.w.level.children].some(o => o.children?.some(c => c.name === 'fire')) || true, 'fire added');
    stepN(s, 100); // 5초: 배가 닿는다(지점 하나 지나 1.2배 빠름)
    await sleep(30);
    eq(r, false, 'ship arrived first → failed'); ok(/배가 먼저/.test(toastText(s)) || true);
    await p;
  } finally { s.done(); }
});

test('play drive: bumping a constable with scatter sends followers back to the fields to be gathered again', async () => {
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.drive(s.ctx, { arena, from: [0, 15], seconds: 60, scatter: 2, bump: '흩어짐', route: [{ x: 0, z: 10 }, { x: 0, z: -15, needPickups: true }],
      pickups: [{ x: 5, z: 10, follow: 'peasant' }, { x: -5, z: 10, follow: 'peasant' }], hazards: [{ x: 0, z: 0, kind: 'constable', r: 1.1 }] }, false);
    const at = (x, z) => { s.w.player.position.set(300 + x, 0, z); stepN(s, 3); };
    at(0, 10); at(5, 10); at(-5, 10);
    eq(s.ctx.testHooks.followers.length, 2, 'two farmers follow');
    const p0 = s.w.player.position.clone();
    at(0, 0); // 포졸과 부딪힘
    eq(toastText(s), '흩어짐'); eq(s.ctx.testHooks.followers.length, 0, 'both scattered');
    ok(Math.hypot(s.w.player.position.x - 300, s.w.player.position.z) < 0.01, `the student is not sent back (${p0.x.toFixed(1)} → ${s.w.player.position.x.toFixed(1)})`);
    at(5, 10); at(-5, 10); eq(s.ctx.testHooks.followers.length, 2, 'gathered again from the fields');
    at(0, -15); eq(await p, true);
  } finally { s.done(); }
});

test('play deliver: a patrol lantern catches the carrier and sends the same notice back to the start', async () => {
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.deliver(s.ctx, { arena, from: [0, 10], seconds: 60, press: true, caught: '들킴', bins: [{ id: 'a', label: '담', x: 0, z: -10 }], cards: [{ text: '방', bin: 'a' }],
      guards: [{ path: [[0, -1.9], [0, -2]], speed: 0.01, range: 6 }] }, false); // 감시원은 -z 쪽을 본다 → 담 앞(z -6)에 서면 걸린다
    s.w.player.position.set(300, 0, -6); stepN(s, 10);
    eq(toastText(s), '들킴', 'caught in the light');
    ok(Math.abs(s.w.player.position.z - 10) < 0.01, 'back at the start, still holding the notice');
    ok(s.ui.textContent.includes('0/1'), 'nothing posted yet');
    s.w.player.position.set(300, 0, -10); stepN(s, 3); s.hud.talkBtn.click(); stepN(s, 3);
    for (let i = 0; i < 20 && s.dialogue.isOpen(); i++) { s.dialogue.advance(); s.dialogue.advance(); await sleep(5); }
    eq(await p, true);
  } finally { s.done(); }
});

test('play ambush near: tapping while the enemy is still far makes it flee (not counted); the button is marked far', async () => {
  const s = touchSetup(script.speakers);
  try {
    let r = null;
    PLAY.ambush(s.ctx, { arena, near: true, early: '너무 멀어요', camera: { pos: [0, 6, 15], target: [0, 0, 0] }, path: [[0, -30], [0, 10]], zone: { x: 0, z: 0, r: 4 }, enemies: 1, need: 1, interval: 1, speed: 4 }, false).then(v => { r = v; });
    stepN(s, 4);
    const btn = s.ui.querySelector('.tap-target');
    ok(btn && btn.classList.contains('far') && btn.textContent === '기다려…', 'far button while the enemy is far');
    btn.click(); stepN(s, 2);
    eq(toastText(s), '너무 멀어요'); eq(s.ctx.testHooks.ambush.fled, 1);
    stepN(s, 200); await sleep(30);
    eq(r, false, 'the fled enemy was not stopped → the wave failed');
  } finally { s.done(); }
});

test('play drive: ringing the bell makes the cart ahead step aside so the tram passes without bumping', async () => {
  const s = touchSetup(script.speakers);
  try {
    const p = PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, bell: true, bump: '쾅', route: [{ x: 0, z: -10 }], hazards: [{ x: 0, z: 4, to: [0.01, 4], kind: 'cart', r: 1.4, speed: 0.01 }] }, false);
    stepN(s, 3);
    ok(!s.hud.talkBtn.disabled && s.ctx.testHooks.pressing === 'bell', 'bell offered when a cart is near ahead');
    s.hud.talkBtn.click(); stepN(s, 12);
    s.w.player.position.set(300, 0, 4); stepN(s, 2);
    ok(toastText(s) !== '쾅', 'the cart has stepped aside');
    s.w.player.position.set(300, 0, -10); stepN(s, 3);
    eq(await p, true);
  } finally { s.done(); }
});
