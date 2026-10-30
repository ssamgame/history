// 조선편 1장 「위화도 회군과 조선 건국」(D-22): 목책 문으로 들어와 군사들의 걱정(아무 차례) → 이성계 → 이성계가 직접 말하는 4불가론, 까닭과 소문 가려내기 →
// 이성계의 결심 → 회군 지도 장면 → 관리를 따라 한양 터 둘러보기 → 궁궐·종묘·사직단 짓기 → 퀴즈.
import { buildJ1Scene, buildCourt, COURT, groundH } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo, runWithRetries } from '../../../core/minigame.js';
import { PLAY, buildArena, mapSpot, labelSprite } from '../../kit/play.js';
import { makePerson, animateWalk, setCarry, mat } from '../../../core/people.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { leadWalk } from '../../kit/lead.js';
import { LOOKS } from '../../../content/characters.js';
import { geunjeongjeon, jongmyo, sajikdan } from '../landmarks.js';
import * as THREE from 'three';
import script from './script.js';
import { coronationScene } from './story.js';
import { waitInteract } from '../../../core/portal.js';

// 미니게임 무대(마을에서 떨어진 x 400)
// 1) 비 내리는 위화도 진영: 군사들이 하는 말(팻말) 가운데 이성계가 든 까닭을 찾는다
export const CAMP = {
  origin: [400, 0], ground: 'grass', groundColor: 0x6a8656, // 2026-10-25: 장맛비 그늘에 너무 어두워 한 단계 밝게
  bounds: { x0: -18, x1: 18, z0: -14, z1: 14 },
  props: [
    { type: 'water', x: 0, z: -36, w: 140, d: 30, color: 0x5a7a86 }, { type: 'water', x: 0, z: 34, w: 140, d: 30, color: 0x5a7a86 },
    { type: 'tent', x: -14, z: -9, color: 0xb8a888 }, { type: 'tent', x: 14, z: -9, color: 0xb8a888 }, { type: 'tent', x: 0, z: -12, color: 0x9a3a2a },
    { type: 'crowd', x: -3, z: -7, n: 4, cols: 4, looks: ['soldier'], face: Math.PI },
  ],
};
// 진영 곳곳에서 이성계의 말을 전해 주는 병사들(자리)
export const REASON_SPOTS = [{ x: -11, z: -2 }, { x: -6, z: 7 }, { x: 0, z: -1 }, { x: 11, z: -2 }, { x: 6, z: 7 }, { x: -12, z: 8 }];
// 2) 큰 지도 위의 위화도 회군: 위화도 → 개경(고려의 도읍) → 조선 건국 → 한양
const MAP = { x: 0, z: 0, w: 40, line38: false };
const MAP_ARENA = { origin: [400, 260], ground: 'earth', groundColor: 0x7d7158, bounds: { x0: -24, x1: 24, z0: -30, z1: 30 }, map: MAP };
const MP = mapSpot(MAP);
export const MARCH = { wihwa: MP(15, 18), mid: MP(27, 31), gaegyeong: MP(37, 46), hanyang: MP(43, 51) };
// 3) 새 도읍 한양 터: 북쪽에 백악(산). 학생은 남쪽에서 들어온다(카메라와 학생 사이를 가리는 것이 없게 남쪽 담은 두지 않는다)
export const HANYANG_SITE = {
  origin: [400, 0], ground: 'grass', groundColor: 0x6a8a4c, bounds: { x0: -20, x1: 20, z0: -18, z1: 16 },
  props: [{ type: 'island', x: 0, z: -30, r: 12, color: 0x4f6a3e, sand: 0x6a7a4c, peak: 11 }], // 북쪽 산 백악(둘러볼 때 보인다)
};
const SITES = [{ id: 'north', label: '북쪽 터', x: 0, z: -11 }, { id: 'east', label: '동쪽 터', x: 12, z: -1 }, { id: 'west', label: '서쪽 터', x: -12, z: -1 }, { id: 'south', label: '남쪽 터', x: 0, z: 9 }];

const PEOPLE = ['archer', 'soldier'];
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

// 탐험 표시: 아직 안 들은 군사에게 느낌표, 한 명이라도 들었으면 이성계에게도. 화살표는 다음 사람
function markCamp(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('yiseonggye').mark.visible = heard.size === PEOPLE.length; // 모두 들어야 이성계가 이야기한다(C-01)
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'yiseonggye').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 걱정 ${heard.size}/${PEOPLE.length}`);
}

// 군사의 말: 다른 군사 말을 먼저 들었으면 그 말을 받아 잇는 한 줄로 시작한다
export function campTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  const other = PEOPLE.some(k => k !== id && heard.has(k));
  return other ? [n.bridge, ...n.first] : n.first;
}

// 한양 터 둘러보기(D-22): 관리가 앞장서 북쪽(백악) → 동쪽 → 서쪽으로 걷고, 자리마다 한 줄씩 말한다. 짓기 무대 안에서 한다
export const TOUR = { start: [0, 9], stops: [{ at: [0, -5], stand: [0, -2.5], key: 'north', face: Math.PI }, { at: [6.5, -1], stand: [4, 0.5], key: 'east', face: -Math.PI / 2 }, { at: [-6.5, -1], stand: [-4, 0.5], key: 'west', face: Math.PI / 2 }] };
export async function tourHanyang(ctx, s) {
  const { world, dialogue } = ctx;
  const T = script.hanyang.tour, at = (x, z) => s.at(x, z);
  const p0 = at(...TOUR.start);
  if (!world.npcs.has('minister')) world.addNpc('minister', LOOKS.minister, p0.x, p0.z, Math.PI);
  const m = world.npcs.get('minister');
  m.mesh.visible = true; world.moveNpc('minister', p0.x, p0.z + 0, Math.PI);
  ctx.setGoal(script.goals[5]);
  await sayAll(dialogue, T.start); dialogue.close();
  for (const st of TOUR.stops) {
    const a = at(...st.at), b = at(...st.stand);
    await leadWalk(ctx, { id: 'minister', path: [[a.x, a.z]], stand: [b.x, b.z], face: st.face });
    await sayAll(dialogue, T[st.key]); dialogue.close();
  }
  m.mesh.visible = false; m.collider.r = 0; m.mark.visible = false;
  ctx.setGoal(script.goals[6]);
}

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 한양 판: 북쪽 산 아래 가운데, 동쪽(오른쪽), 서쪽(왼쪽), 그리고 헷갈리게 남쪽 빈자리
export const HANYANG = {
  items: [{ id: 'palace', label: '경복궁(궁궐)' }, { id: 'jongmyo', label: '종묘' }, { id: 'sajik', label: '사직단' }],
  slots: [
    { id: 'north', xy: [50, 30], answer: 'palace' },
    { id: 'east', xy: [80, 56], answer: 'jongmyo' },
    { id: 'west', xy: [20, 56], answer: 'sajik' },
    { id: 'south', xy: [50, 80], answer: null },
  ],
  decor: [
    { label: '▲ 백악(북쪽 산)', xy: [50, 9] },
    { label: '서쪽 ←', xy: [9, 92] }, { label: '→ 동쪽', xy: [91, 92] }, { label: '↓ 남쪽', xy: [50, 95] },
  ],
};

const scaled = (o, k) => { o.scale.setScalar(k); return o; };

// 지도 위의 군대(H-02): 6줄 × 4명 = 24명이 다리를 움직여 걷는다. 맨 앞줄만 다 그린 인물이고, 뒤 줄은 몸·머리·투구·팔다리만 있는
// 간단한 인물(멀리서 작게 보이므로 그리기 수를 줄인다). 깃발 든 사람 셋은 오른손을 들어 깃대를 잡는다(setCarry 'shoulder', D-18).
// 걸음 박자는 줄마다 조금씩 다르다.
const simpleGeos = () => ({ // 한 번 회군할 때마다 새로 만든다(무대를 치울 때 함께 버려진다)
    leg: new THREE.BoxGeometry(0.22, 0.6, 0.24).translate(0, -0.3, 0), body: new THREE.CylinderGeometry(0.38, 0.58, 1.25, 7),
    arm: new THREE.BoxGeometry(0.18, 0.8, 0.2).translate(0, -0.38, 0), head: new THREE.SphereGeometry(0.42, 10, 8), helmet: new THREE.ConeGeometry(0.5, 0.62, 7),
});
function simpleSoldier(look, G) {
  const g = new THREE.Group(), legs = [], arms = [];
  const add = (geo, color, x, y, z, parent = g, cast = false) => { const m = new THREE.Mesh(geo, mat(color, 'cloth', 'object')); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m; };
  for (const sx of [-0.16, 0.16]) { const piv = new THREE.Group(); piv.position.set(sx, 0.55, 0); g.add(piv); add(G.leg, 0x2b241c, 0, 0, 0, piv); legs.push(piv); }
  add(G.body, look.robe, 0, 1.12, 0, g, true);
  for (const sx of [-0.5, 0.5]) { const piv = new THREE.Group(); piv.position.set(sx, 1.65, 0); g.add(piv); add(G.arm, look.robe, 0, 0, 0, piv); arms.push(piv); }
  const head = new THREE.Group(); head.position.set(0, 2.1, 0); g.add(head);
  add(G.head, 0xe8c9a0, 0, 0, 0, head); add(G.helmet, 0x5d5a55, 0, 0.42, -0.04, head).rotation.x = -0.3;
  g.userData = { legs, arms, walk: 0, head, ph: 0 };
  return g;
}
function marchFlag(color) {
  const f = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6), mat(0x5a3f2a, 'wood', 'object')); pole.position.y = 0.6; f.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7).translate(0.65, 0, 0).rotateY(Math.PI / 2), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  cloth.position.y = 1.9; cloth.name = 'cloth'; f.add(cloth); // 깃폭은 걷는 쪽 뒤로 날린다
  return f;
}
export const MARCH_ROWS = 6, MARCH_COLS = 4;
function marchArmy() {
  const army = new THREE.Group(), people = [], flags = [], G = simpleGeos();
  const FLAGS = { '1:0': 0xb8452f, '3:3': 0xd9a441, '5:1': 0xb8452f };
  for (let r = 0; r < MARCH_ROWS; r++) for (let c = 0; c < MARCH_COLS; c++) {
    const look = (r + c) % 3 === 0 ? LOOKS.archer : LOOKS.soldier;
    const p = r === 0 ? makePerson(look) : simpleSoldier(look, G);
    p.userData.manual = true; // 걸음은 아래 onUpdate가 맡는다(걷기 자동 움직임에서 뺀다)
    p.userData.ph = r * 1.15 + c * 0.35 + (r * 7 + c * 3) % 5 * 0.12; // 줄마다, 사람마다 조금씩 다른 박자
    p.position.set((c - 1.5) * 1.15, 0, -r * 1.35 + 3);
    const fc = FLAGS[`${r}:${c}`];
    if (fc) { const f = marchFlag(fc); setCarry(p, f, 'shoulder'); flags.push(f.getObjectByName('cloth')); }
    army.add(p); people.push(p);
  }
  return { army, people, flags };
}
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

// 회군(진영): 이성계의 결심 뒤 진영의 군대가 줄마다 조금씩 늦게 천천히 돌아서서(북 → 남) 동쪽 통로로 걸어 나간다.
// 걸음은 걷기 자동 움직임(animateWalkers)이 맡는다. 장면이 끝나면 setTurn(1)이 제자리로 돌려놓는다.
export async function campTurnBack(ctx) {
  const { world } = ctx;
  placePlayer(world, [-3, 1.5]); // 군대가 지나갈 길을 비운다
  world.setFixedCamera([12, 3.6, 7.5], [6.5, 1.3, -6]); // 카메라 예외: 군대 전체가 돌아서는 모습이 보여야 한다
  const heading = Math.atan2(0.22, 1); // 남쪽으로, 지휘 천막을 비켜 조금 동쪽으로
  const men = scene.army.children.map((p, i) => ({ p, delay: Math.floor(i / 6) * 0.35 + (i % 6) * 0.06, from: p.rotation.y }));
  await new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      for (const m of men) {
        const k = Math.min(1, Math.max(0, (t - m.delay) / 1.0)), e = k * k * (3 - 2 * k); // 천천히 돌아선다
        m.p.rotation.y = m.from + wrapAngle(heading - m.from) * e;
        const w = Math.max(0, t - m.delay - 0.8); // 거의 돌아서면 걷기 시작(처음엔 천천히)
        if (w > 0) { const v = 1.8 * Math.min(1, w / 0.5); m.p.position.x += Math.sin(heading) * v * dt; m.p.position.z += Math.cos(heading) * v * dt; }
      }
      if (t >= 4.6) { off(); resolve(); }
    });
  });
}

// 위화도 회군을 큰 지도 위에서: 군대가 위화도에서 개경으로 내려오고, 고려라는 이름이 물러나 조선이 선 뒤 도읍이 한양으로 옮겨진다
export async function marchOnMap(ctx) {
  const { world, dialogue } = ctx;
  const T = script.turnback;
  await ctx.fade(true);
  const arena = buildArena(world, MAP_ARENA);
  const g = arena.group, at = p => arena.at(p.x, p.z);
  const was = world.player.visible; world.player.visible = false;
  const pts = [MARCH.wihwa, MARCH.gaegyeong, MARCH.hanyang].map(p => { const w = at(p); return [w.x, 1, w.z]; });
  world.fitFixedCamera([at(MARCH.mid).x, 0, (at(MARCH.wihwa).z + at(MARCH.hanyang).z) / 2], [0, 1.5, 1], pts, 0.7);
  const tag = (text, p, size = 1.2, opt) => { const s = labelSprite(text, { size, ...opt }); s.position.set(p.x, 2.6, p.z); g.add(s); return s; };
  tag('위화도', MARCH.wihwa);
  const goryeo = tag('고려 (도읍 개경)', MARCH.gaegyeong, 1.4, { color: '#5a2a20' });
  // 군대: 24명(깃발 든 사람 셋). '나' 표시는 없다(H-02)
  const SCALE = 0.55;
  const { army, people, flags } = marchArmy(); army.scale.setScalar(SCALE); g.add(army);
  army.position.set(MARCH.wihwa.x, 0, MARCH.wihwa.z);
  army.rotation.y = Math.atan2(MARCH.mid.x - MARCH.wihwa.x, MARCH.mid.z - MARCH.wihwa.z);
  ctx.testHooks.march = { done: false, joseon: false, army };
  // 걸음: 걷는 동안 다리를 움직이고(빠르기에 맞춰 박자를 조금 빠르게), 방향은 천천히 돌린다. 멈추면 걸음이 잦아든다
  const mv = { moving: false, gait: 1, heading: army.rotation.y };
  const offGait = world.onUpdate((dt, t) => {
    army.rotation.y += wrapAngle(mv.heading - army.rotation.y) * Math.min(1, dt * 2.5);
    for (const p of people) animateWalk(p, mv.moving, dt); // 걸음 박자는 실제로 간 거리(지도 크기에 맞춘 빠르기)에서 나온다
    flags.forEach((f, i) => { f.rotation.y = Math.sin(t * 3 + i * 1.7) * 0.25; });
  });
  await ctx.fade(false);
  ctx.audio.play('whoosh');
  // 길을 따라 걷는다: path의 점들을 seconds 동안
  const walk = (path, seconds) => new Promise(resolve => {
    const lens = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.z - path[i].z)), total = lens.reduce((x, y) => x + y, 0);
    mv.gait = Math.min(1.8, Math.max(0.8, total / seconds / SCALE / 1.9)); mv.moving = true; // 1.9: 보통 걸음 한 박자에 나아가는 빠르기
    let t = 0;
    const off = world.onUpdate(dt => {
      t = Math.min(1, t + dt / seconds);
      let d = t * total, k = 0;
      while (k < lens.length - 1 && d > lens[k]) { d -= lens[k]; k += 1; }
      const a = path[k], b = path[k + 1], f = Math.min(1, d / lens[k]);
      army.position.set(a.x + (b.x - a.x) * f, 0, a.z + (b.z - a.z) * f);
      mv.heading = Math.atan2(b.x - a.x, b.z - a.z);
      if (t >= 1) { off(); mv.moving = false; resolve(); }
    });
  });
  await dialogue.say(T[0]);
  dialogue.close();
  await walk([MARCH.wihwa, MARCH.mid, MARCH.gaegyeong], 7);
  await dialogue.say(T[1]);
  dialogue.close();
  // 고려라는 이름이 흐려지고 그 자리에 조선이 선다
  await new Promise(resolve => {
    let t = 0;
    const joseon = tag('조선 건국 (1392)', MARCH.gaegyeong, 1.6, { color: '#2f4a6b' }); joseon.material.opacity = 0;
    const off = world.onUpdate(dt => {
      t = Math.min(1, t + dt / 2.2);
      goryeo.material.opacity = 1 - t; joseon.material.opacity = t; joseon.position.y = 2.6 + t * 0.8;
      if (t >= 1) { off(); goryeo.visible = false; ctx.testHooks.march.joseon = true; resolve(); }
    });
  });
  ctx.audio.play('correct');
  await coronationScene(ctx); // 이야기 장면(D-58): 1392년 이성계가 왕위에 오른다(T[2]를 장면 위에)
  world.fitFixedCamera([at(MARCH.mid).x, 0, (at(MARCH.wihwa).z + at(MARCH.hanyang).z) / 2], [0, 1.5, 1], pts, 0.7); // 다시 지도 위로
  world.player.visible = false;
  tag('한양 (1394)', MARCH.hanyang, 1.3, { color: '#2f4a6b' });
  await walk([MARCH.gaegyeong, MARCH.hanyang], 3);
  await dialogue.say(T[3]);
  dialogue.close();
  ctx.testHooks.march.done = true;
  await ctx.fade(true);
  offGait();
  arena.dispose();
  world.player.visible = was;
  placePlayer(world, [-3, 1.5]);
  scene.setTurn(1); // 진영의 군대는 이미 떠났다
  await ctx.fade(false);
}

// 진영 곳곳에서 이성계의 말을 전하는 군사 여섯(R.people): 마을 안 자리
export const RUMOR_SPOTS = [[-10.5, 0.4, 0.6], [-3.6, 6.6, 2.6], [5.2, 4.2, -2.4], [8.6, 0.8, -1.2], [7.4, 9.4, 3.0], [-17, -2.2, 1.4]];
const rumorId = i => `rumor${i}`;
function addRumorPeople(world) {
  script.reasons.people.forEach((p, i) => {
    if (world.npcs.has(rumorId(i))) return;
    const [x, z, ry] = RUMOR_SPOTS[i], base = LOOKS[p.look];
    world.addNpc(rumorId(i), { ...base, robe: new THREE.Color(base.robe).offsetHSL(0, 0, (i % 3 - 1) * 0.05).getHex() }, x, z, ry);
    world.npcs.get(rumorId(i)).mesh.position.y = groundH(x, z);
  });
}

// 까닭과 소문 가려내기(마을 탐색): ① 진영을 돌며 여섯 군사(느낌표)의 말을 듣는다 ② 이성계에게 돌아가면 들은 말을 하나씩 '까닭/소문'으로 가린다.
// 틀리면 그 까닭을 듣고 같은 말을 다시 가린다(실패로 끝나지 않는다). 한 번도 틀리지 않으면 first
export async function rumorWalk(ctx) {
  const { world, dialogue, hud } = ctx, R = script.reasons, N = R.people.length;
  addRumorPeople(world);
  const heard = [], yi = world.npcs.get('yiseonggye');
  const ids = R.people.map((_, i) => rumorId(i));
  const mark = () => {
    ids.forEach((id, i) => { world.npcs.get(id).mark.visible = !heard.includes(i); });
    yi.mark.visible = heard.length === N;
    hud.setCounter(`${R.heardAs} ${heard.length}/${N}`);
    const p = world.player.position, left = ids.map((id, i) => [i, world.npcs.get(id).mesh.position]).filter(([i]) => !heard.includes(i));
    const next = left.length ? left.sort((a, b) => a[1].distanceTo(p) - b[1].distanceTo(p))[0][1] : yi.mesh.position;
    world.setGoal({ x: next.x, z: next.z });
    ctx.setGoal(script.goals[2]);
  };
  ctx.testHooks.rumors = { heard };
  mark();
  ctx.input.enabled = true;
  await new Promise(resolve => {
    const stop = roam(ctx, {
      async onTalk(id) {
        const i = ids.indexOf(id);
        if (i >= 0) {
          await sayAll(dialogue, R.people[i].talk);
          if (!heard.includes(i)) heard.push(i);
          if (heard.length === N) await dialogue.say(R.back);
          mark(); return;
        }
        if (id !== 'yiseonggye') return;
        if (heard.length < N) { await dialogue.say(R.notYet); return; }
        stop(); setTimeout(resolve, 0);
      },
    });
  });
  ctx.input.enabled = false;
  world.setGoal(null); hud.setCounter(null); yi.mark.visible = false;
  world.setTalkCamera(yi.mesh);
  await dialogue.say(R.judgeIntro);
  let first = true;
  for (const i of heard) { // 들은 차례대로
    const P = R.people[i], text = P.talk.map(l => l.text).join(' ');
    for (;;) {
      ctx.testHooks.choice = P.correct ? 0 : 1;
      const pick = await dialogue.choose(`「${text}」 ${R.question}`, R.options);
      if ((pick === 0) === P.correct) { await dialogue.say({ who: 'guide', text: `○ 맞아요. ${P.correct ? '이성계가 직접 든 까닭이에요.' : '이성계가 하지 않은 말, 떠도는 소문이에요.'}` }); break; }
      first = false;
      await dialogue.say({ who: 'guide', text: `× 다시 생각해 봐요. ${P.why || R.fail}` });
    }
  }
  ctx.testHooks.choice = null;
  ids.forEach(id => { world.npcs.get(id).mesh.visible = false; world.npcs.get(id).mark.visible = false; });
  dialogue.close(); world.camMode = 'follow';
  return { first };
}

// 한양 궁궐 마당으로: 마당을 짓고(한 번만), 이성계(곤룡포를 입은 왕)를 단 위에 세우고, 학생을 마당 남쪽에 둔다
function toCourt(ctx) {
  const { world } = ctx;
  if (!scene.court) scene.court = buildCourt(world);
  const C = scene.court;
  const yi = world.npcs.get('yiseonggye');
  if (!yi.mesh.userData.king) { // 왕이 된 이성계: 곤룡포와 익선관, 얼굴은 이성계
    const king = makePerson({ ...LOOKS.sejong, face: LOOKS.yiseonggye.face, named: true }, { stable: true });
    king.userData.king = true; king.add(yi.mark); yi.mesh.removeFromParent(); world.level.add(king); yi.mesh = king;
  }
  yi.mesh.position.set(C.dais[0], COURT.top, C.dais[1]); yi.mesh.rotation.y = 0; yi.collider.x = C.dais[0]; yi.collider.z = C.dais[1];
  scene.rain.points.visible = false; world.setMood?.('morning');
  world.bounds = C.bounds;
  placePlayer(world, C.start, Math.PI);
  return C;
}

export default {
  id: 'j1',
  mood: 'monsoon',
  script,
  quizzes: script.quizzes,
  stories: { coronation: coronationScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildJ1Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  // 장 도입(C-03): 비 내리는 위화도 진영. ① 북쪽 강가의 군대가 요동 쪽으로 늘어서 나아가고 ② 지휘 천막 앞 이성계의 근심 어린 얼굴
  introScene(ctx) {
    const { world } = ctx, a0 = scene.army.position.clone();
    let off = null;
    return {
      shots: [
        { cam: [7, 7, 6], look: [7, 1, -14], to: { cam: [7, 4.5, -3], look: [7, 1.5, -22] },
          act: () => { off = world.onUpdate(dt => { scene.army.position.z -= dt * 0.9; }); } }, // 요동(북쪽)을 보고 나아간다
        { cam: [2.6, 2.3, 2.8], look: [0, 2.0, -2.4], to: { cam: [-1.4, 2.2, 2.2], look: [0, 2.05, -2.4] },
          act: () => { off?.(); off = null; } },
      ],
      done: () => { off?.(); scene.setTurn(0); scene.army.position.copy(a0); },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 군대가 떠난 동쪽 통로, 학생 쪽(서쪽)을 본다.
  // 한양 궁궐 마당으로 옮긴 뒤에는 마당 동쪽(학생 쪽을 본다)에 선다(2026-10-30)
  portal: () => (scene?.court ? { at: [COURT.x + 7, COURT.z + 8], ry: -Math.PI / 2 } : { at: [6, -0.5], ry: -Math.PI / 2 }),

  enterStage(ctx, stage) {
    if (stage === 'minigame') { scene.gate.setOpen(0); placePlayer(ctx.world, [0, 1.5]); }
    if (stage === 'quiz') { scene.setTurn(1); toCourt(ctx); } // 새로고침해도 한양 궁궐 마당에서 잇는다
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markCamp(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, campTalk(id, heard));
            heard.add(id); markCamp(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.npc.more);
            return;
          }
          if (id !== 'yiseonggye') return;
          if (heard.size < PEOPLE.length) { await sayAll(dialogue, script.npc.yiseonggye.wait); return; } // 모두 들어야 진행(C-01)
          await sayAll(dialogue, script.npc.yiseonggye.first);
          [...PEOPLE, 'yiseonggye'].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    world.closeView = true;
    ctx.setGoal(script.goals[2]);
    [...PEOPLE, 'yiseonggye'].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    // 1) 이성계가 반대한 네 까닭을 직접 말하고(H-01), 진영 병사들의 말이 그 까닭인지 소문인지 가려낸다
    const yi = world.npcs.get('yiseonggye');
    world.setTalkCamera(yi.mesh);
    await sayAll(dialogue, script.npc.yiseonggye.reasons);
    dialogue.close(); world.camMode = 'follow';
    let tries = 0, firstTryCorrect = 0;
    const R = script.reasons;
    await showHowTo(ctx.ui, R.howto);
    const a = await rumorWalk(ctx); // 진영을 돌며 여섯 군사의 말을 듣고, 이성계에게 돌아와 하나씩 가린다(2026-10-30)
    if (a.first) firstTryCorrect += 1;
    await sayAll(dialogue, R.done);
    dialogue.close();
    // 다음 놀이는 저절로 시작하지 않는다: 이성계에게 가서 말을 걸어야 회군이 시작된다(C-05)
    yi.mark.visible = true;
    await waitInteract(ctx, { pos: yi.mesh.position, quest: script.goals[3], label: '이성계와 이야기하기', mark: false });
    yi.mark.visible = false;
    world.setTalkCamera(yi.mesh);
    await sayAll(dialogue, script.npc.yiseonggye.turn); // 이성계의 결심
    dialogue.close();
    await campTurnBack(ctx); // 진영의 군대가 돌아서서 남쪽으로 걸어 나간다
    world.camMode = 'follow';

    // 2) 위화도 회군: 큰 지도 위에서 이성계의 군대가 위화도에서 개경으로 돌아오고, 고려가 물러나 조선이 선다
    await marchOnMap(ctx);

    // 3) 새 도읍 한양 짓기: 진영에 남은 관리에게 말을 걸어야 시작한다(C-05). 알맞은 터에서 버튼을 누르면 그 자리에 지어진다
    const mi = world.npcs.get('minister') || world.addNpc('minister', LOOKS.minister, -5, 4.5, Math.PI * 0.8);
    mi.mesh.visible = true; mi.mark.visible = true;
    await waitInteract(ctx, { pos: mi.mesh.position, quest: script.goals[4], label: '관리와 이야기하기', mark: false });
    mi.mark.visible = false;
    world.setTalkCamera(mi.mesh);
    await sayAll(dialogue, script.npc.minister.first);
    dialogue.close(); world.camMode = 'follow';
    world.setGoal(null);
    await showHowTo(ctx.ui, script.hanyang.howto);
    tries = 0;
    ctx.testHooks.built = [];
    const BUILDS = [
      { id: 'palace', text: '경복궁(궁궐)', site: 'north', make: () => scaled(geunjeongjeon(), 0.32) },
      { id: 'jongmyo', text: '종묘', site: 'east', make: () => scaled(jongmyo(9), 0.3) },
      { id: 'sajik', text: '사직단', site: 'west', make: () => scaled(sajikdan(), 0.42) },
    ];
    const b = await runWithRetries(ctx, async easy => { // 관리를 따라 터를 둘러보는 것은 처음 한 번만
      tries += 1; ctx.testHooks.built = [];
      const ok = await PLAY.build(ctx, { arena: HANYANG_SITE, from: [0, 13], fail: script.hanyang.fail, sites: SITES, before: tries === 1 ? sv => tourHanyang(ctx, sv) : null, builds: BUILDS.map(x => ({ ...x, make: () => { ctx.testHooks.built.push(x.id); return x.make(); } })) }, easy);
      if (ok === true && tries === 1) firstTryCorrect += 1;
      return ok;
    }, { failHint: script.hanyang.fail });
    await sayAll(dialogue, script.hanyang.done);
    dialogue.close();

    // 한양에 도읍을 정한 뒤에는 위화도로 돌아가지 않는다: 이성계가 왕이 된 한양 궁궐 마당으로 옮겨, 관리가 다음 일을 알려 준다(2026-10-30)
    await ctx.fade(true);
    toCourt(ctx);
    await ctx.fade(false);
    const co = world.npcs.get('courtOfficial');
    co.mark.visible = true;
    await waitInteract(ctx, { pos: co.mesh.position, quest: script.court.goal, label: '관리와 이야기하기', mark: false });
    co.mark.visible = false;
    world.setTalkCamera(co.mesh);
    await sayAll(dialogue, script.court.official);
    dialogue.close(); world.camMode = 'follow';
    return { firstTryCorrect, firstTryTotal: 2, easyModeUsed: !!b.easyModeUsed };
  },
};
