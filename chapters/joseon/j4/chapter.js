// 조선편 4장 「임진왜란과 한산도 대첩」(D-25): 포구 문으로 들어와 수군·백성의 이야기(아무 차례) → 이순신의 출전 명령 →
// 판옥선을 몰아 견내량 입구까지 가서 적을 꾀어내고 넓은 바다로 달아나기 → 대장선의 이순신에게 배를 몰고 가 말 걸기(D-30 C-05) →
// 펼쳐진 학익진의 빈자리로 배를 몰아 넣기 → 거북선이 앞장서 나서고(S43) 한꺼번에 공격 → 빛나는 문 → 퀴즈.
import * as THREE from 'three';
import { buildJ4Scene, STRAIT_Z } from './scene.js';
import { MAP_OUTLINE } from '../../../core/screens.js';
export { STRAIT_Z };
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { LOOKS } from '../../../content/characters.js';
import { makePerson } from '../../../core/people.js';
import { toast } from '../../kit/play.js';
import { waitInteract } from '../../../core/portal.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts } from '../common.js';
import script from './script.js';
import { victoryScene } from './story.js';

const PEOPLE = ['navy', 'commoner'];
const SPOT = [-5, 7.5];
const SAIL_CAM = { offset: [0, 6, 11], lookY: 3 }; // 배 바로 뒤 낮은 시점(고려 6장과 같은 방식, 판옥선이 커서 조금 뒤로)
export const LURE = { start: [0, -30], mouth: { x: 0, z: STRAIT_Z + 4, r: 3.5 }, open: { x: 4, z: -37, r: 4 } }; // D-68: 넓은 바다 도착 지점을 대장선 가까이(더 멀리 몰고 내려온다)
const CATCH = 5;
let scene = null;

function markPort(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('yisunsin').mark.visible = heard.size === PEOPLE.length; // 모두 들어야 이순신이 출전 명령을 내린다(C-01)
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'yisunsin').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
export function portTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 판옥선에 태운다: 학생 몸은 숨고 배가 따라가며, 카메라는 배 바로 뒤 낮게
function board(ctx, [x, z]) {
  const { world } = ctx;
  world.closeView = false; world.bounds = scene.seaBounds;
  world.followOffset = new THREE.Vector3(...SAIL_CAM.offset); world.followLookY = SAIL_CAM.lookY;
  placePlayer(world, [x, z]); scene.myShip.visible = true; world.player.visible = false;
  for (const o of [scene.lure, scene.flagship, ...scene.portShips]) o.visible = false; // D-68: 내 배가 다른 배와 겹쳐 보이지 않게(바다에는 내 배와 적선만)
  world.goalArrowLift = 3.2; world.goalArrowScale = 2.4; // 어디로 갈지 알려 주는 노란 화살표를 배 위에 크게(D-68)
}
export const boardForTest = (ctx, at) => board(ctx, at); // 시험용
function unboard(ctx) {
  const { world } = ctx;
  scene.myShip.visible = false; world.followOffset = null; world.followLookY = null; world.closeView = true;
  world.goalArrowLift = null; world.goalArrowScale = null;
}
export const unboardForTest = ctx => unboard(ctx); // 시험용

// 원에 닿을 때까지 몬다: 닿으면 true. chase가 있으면 매 프레임 부르고, false를 돌려주면(잡힘) 실패
function sailTo(ctx, ring, chase = null) {
  const { world } = ctx;
  scene.goalRing.position.set(ring.x, 0.1, ring.z); scene.goalRing.scale.setScalar(ring.r / 4.5); scene.goalRing.visible = true;
  world.setGoal({ x: ring.x, z: ring.z });
  ctx.input.enabled = true;
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      if (chase && chase(dt) === false) { done(false); return; }
      if (Math.hypot(p.x - ring.x, p.z - ring.z) < ring.r) done(true);
    });
    const done = ok => { off(); scene.goalRing.visible = false; world.setGoal(null); ctx.input.enabled = false; ctx.input.releaseJoystick?.(); resolve(ok); };
  });
}

// 1) 꾀어내기: 견내량 입구까지 가면 적이 보고 쫓아온다. 잡히지 않고 넓은 바다의 원까지 가면 성공
export async function lureEnemy(ctx, easy) {
  const { world, dialogue, audio } = ctx;
  scene.setStage('sail');
  scene.enemy.position.set(0, 0, STRAIT_Z - 28); scene.enemy.rotation.y = Math.PI; // 견내량 안 깊이 있는 적(D-67: 유인 지점에서 멀리, 30척)
  scene.setFormation(0); // 꾀어내기 전에는 넓게 흩어진 대열
  board(ctx, LURE.start);
  await sailTo(ctx, LURE.mouth);
  await dialogue.say(script.lure.seen); dialogue.close();
  audio.play('whoosh');
  const speed = easy ? 3 : 4.2; // 학생 배(6.5)보다 느리다: 머뭇거리면 잡힌다
  const e = scene.enemy.position;
  e.set(0, 0, STRAIT_Z - 28); scene.enemy.rotation.y = Math.PI; // 견내량 안에 있던 적이 뱃머리를 돌려 남쪽(학생 쪽)으로
  let t = 0, hinted = false; // 쫓아오기 시작하면 3초 동안 촘촘한 대열로 모인다(D-67)
  const ok = await sailTo(ctx, LURE.open, dt => {
    t += dt; scene.setFormation(Math.min(1, t / 3));
    if (!hinted && t > 4 && !dialogue.isBlocking()) { hinted = true; dialogue.say(script.lure.hint).then(() => dialogue.close()); } // D-67: 쫓기는 동안 한 번 더 길을 알려 준다
    const p = world.player.position, lead = e.z; // 적 무리의 맨 앞 줄(남쪽을 보면 앞줄이 e.z)
    if (Math.hypot(p.x - e.x, p.z - lead) < CATCH) { audio.play('wrong'); e.set(0, 0, STRAIT_Z - 28); scene.setFormation(0); return false; } // 잡히면 적선을 견내량 안으로 되돌린다(D-68: 내 배 위에 겹쳐 보였다)
    const dx = p.x - e.x, dz = p.z - lead, d = Math.hypot(dx, dz) || 1;
    e.x += dx / d * speed * dt * 0.4; e.z += dz / d * speed * dt;
    return true;
  });
  return ok;
}

// 꾀어내기와 학익진 사이(D-30 C-05): 바다에 나타난 대장선으로 배를 몰고 가 이순신에게 말을 걸어야 다음 놀이가 시작된다
export async function meetFlagship(ctx) {
  const { dialogue } = ctx;
  scene.enemy.position.set(0, 0, -74); scene.enemy.rotation.y = Math.PI; // 적은 견내량 입구 밖에서 따라 나오는 중
  scene.flagship.visible = true;
  const f = scene.flagship.position;
  await waitInteract(ctx, { pos: { x: f.x - 4.5, z: f.z + 1 }, quest: script.goals[3], label: '대장선의 이순신과 이야기하기', mark: true, markY: 5.5 });
  ctx.input.enabled = false; ctx.input.releaseJoystick?.();
  await sayAll(dialogue, script.wing.call); dialogue.close();
}

// 2) 학익진: 우리 배들이 날개 모양으로 펼쳐지고, 학생은 날개의 빈자리로 배를 몬다(D-30 I-02: 틀린 뒷줄 자리는 없다)
export async function fillWing(ctx, easy) {
  const { world, dialogue, audio } = ctx;
  await ctx.fade(true);
  scene.setStage('wing');
  scene.enemy.position.set(0, 0, -68); scene.enemy.rotation.y = Math.PI;
  board(ctx, [0, -13]);
  await ctx.fade(false);
  await dialogue.say(script.wing.spread); dialogue.close();
  await scene.spreadFleet(easy ? 2 : 3);
  const rings = [scene.slot, ...scene.decoys].map((s, i) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.3, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2; r.position.set(s.x, 0.1, s.z); world.level.add(r); return { ...s, r, ok: i === 0 };
  });
  ctx.testHooks.walkTo = { x: scene.slot.x, z: scene.slot.z };
  let missed = false, told = new Set();
  ctx.input.enabled = true;
  if (easy) world.setGoal({ x: scene.slot.x, z: scene.slot.z });
  await new Promise(resolve => {
    const off = world.onUpdate(() => {
      if (dialogue.isBlocking()) return;
      const p = world.player.position;
      for (const r of rings) {
        const inside = Math.hypot(p.x - r.x, p.z - r.z) < 2;
        if (!inside) { told.delete(r); continue; }
        if (r.ok) { off(); resolve(); return; }
        if (told.has(r)) continue;
        told.add(r); missed = true; audio.play('wrong');
        world.setGoal({ x: scene.slot.x, z: scene.slot.z });
        dialogue.say({ who: 'guide', text: script.wing.fail }).then(() => dialogue.close());
      }
    });
  });
  audio.play('correct');
  for (const r of rings) world.level.remove(r.r);
  world.setGoal(null); ctx.testHooks.walkTo = null; ctx.input.enabled = false; ctx.input.releaseJoystick?.();
  world.player.rotation.y = scene.slot.ry - Math.PI; // D-67: 다른 판옥선처럼 옆구리(포혈)를 적 쪽으로(학생 배는 학생 방향 + 180도)
  return missed ? 'missed' : true;
}

// 3) 포격 신호(2026-11-07 선생님: 한 척씩 쏘는 놀이는 길고 지루해서 뺌): 적이 날개 안에 들어오면 이순신의 신호와 함께 대화 버튼이 켜지고,
// 학생이 그 버튼(E)을 꾹 누르고 있는 동안만 모든 함선이 한꺼번에 포격한다. 손을 떼면 포격이 멈춘다. 점수에는 넣지 않는다
export async function holdVolley(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const V = script.volley;
  await sayAll(dialogue, V.ready); dialogue.close();
  await ctx.wait(900);
  toast(ctx, V.signal, 'good'); audio.play('correct'); // 신호
  hud.setPrompt?.(null, V.label); hud.setTalkEnabled?.(true); ctx.testHooks.holding = 'volley';
  const held = () => !!ctx.input?.actionHeld?.() && !dialogue.isBlocking();
  let heldSec = 0;
  const off = world.onUpdate(dt => {
    if (held()) heldSec += dt;
    const sunk = scene.enemy.children.filter(e => !e.visible).length;
    hud.setCounter(held() ? `포격 중! 가라앉힌 적선 ${sunk}/${scene.enemy.children.length}` : `대화 버튼을 꾹 누르면 포격! 가라앉힌 적선 ${sunk}/${scene.enemy.children.length}`);
  });
  ctx.testHooks.volley = { heldSec: () => heldSec };
  const n = await scene.playBattle(audio, { paused: () => !held() });
  off(); hud.setCounter(null); hud.setPrompt?.(null); hud.setTalkEnabled?.(false); ctx.testHooks.holding = null;
  return n;
}

// 4) 거북선을 앞세우고 공격: 거북선을 따라 낮게 비추는 큰 장면(S43), 적이 날개 안으로 들어오면 한꺼번에 포를 쏜다
export async function turtleAndBattle(ctx) {
  const { world, dialogue } = ctx;
  scene.leadTurtle.position.set(0, -0.2, -18);
  world.player.visible = false;
  const cam = new THREE.Vector3(), tgt = new THREE.Vector3();
  const follow = world.onUpdate(() => { // 거북선 옆 뒤에서 낮게 따라간다
    const t = scene.leadTurtle.position;
    cam.set(t.x + 3, 6.5, t.z + 11); tgt.set(t.x, 1.2, t.z - 6);
    world.setFixedCamera(cam.toArray(), tgt.toArray());
  });
  await sayAll(dialogue, [script.turtle[0]]); dialogue.close();
  ctx.audio.play('whoosh');
  await scene.turtleCharge(3.5);
  await sayAll(dialogue, [script.turtle[1]]); dialogue.close();
  follow();
  await new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / 2.5); scene.setAdvance(k * scene.FIRE_AT); if (k >= 1) { off(); resolve(); } }); }); // 적이 날개 안으로
  ctx.setGoal(script.goals[5]);
  world.fitFixedCamera([0, 0, -42], [0.9, 1.25, 0.45], [[-28, 0, -30], [28, 0, -30], [-6, 0, -60], [6, 0, -64]], 0.9); // 멀리 떨어진 두 함대가 함께 보이게(D-67)
  ctx.testHooks.sunk = await holdVolley(ctx); // 학생이 대화 버튼을 꾹 누르는 동안 모든 함선이 포격한다
  scene.setStage('won');
}

// 선조의 피란길 지도(D-67): 화면 오른쪽에 한반도 지도를 띄우고 한양에서 의주까지 북쪽으로 올라가는 길을 그려 나간다(S34 문장 그대로, 들른 곳은 적지 않는다)
function routeMap(ui) {
  if (!ui) return null;
  const box = document.createElement('div'); box.className = 'route-map';
  box.innerHTML = `<svg viewBox="0 0 300 400" aria-hidden="true"><polygon points="${MAP_OUTLINE}" fill="#d9cfa8" stroke="#6b5a3a" stroke-width="3"/>
    <path class="route" d="M132 228 C 118 200, 108 170, 98 140 S 70 95, 55 82" fill="none" stroke="#a3262a" stroke-width="6" stroke-linecap="round" stroke-dasharray="6 10" pathLength="100"/>
    <circle cx="132" cy="228" r="7" fill="#2b241c"/><circle cx="55" cy="82" r="7" fill="#a3262a"/>
    <text x="142" y="236" font-size="22" font-weight="bold" fill="#2b241c">한양</text><text x="64" y="76" font-size="22" font-weight="bold" fill="#a3262a">의주</text></svg>`;
  Object.assign(box.style, { position: 'absolute', right: '3%', top: '12%', height: '58%', aspectRatio: '3 / 4', background: 'rgba(127,168,191,0.92)', border: '4px solid #6b4a32', borderRadius: '10px', zIndex: 5, pointerEvents: 'none' });
  const r = box.querySelector('.route');
  r.animate([{ strokeDashoffset: 100, opacity: 0.2 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 2600, fill: 'forwards' });
  ui.appendChild(box);
  return { removeFromParent: () => box.remove() };
}

export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  id: 'j4',
  mood: 'sea',
  player: LOOKS.navy,
  script,
  quizzes: script.quizzes,
  stories: { victory: victoryScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildJ4Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  // 장 도입(C-03): ① 일본 배들이 바다를 건너 포구 쪽으로 몰려온다(부산으로 쳐들어옴) ② 바닷가 길로 임금(선조)과 신하·군사가
  // 서둘러 떠난다(의주로 피란). 끝나면 배와 사람을 치우고 포구를 처음 모습으로 돌린다.
  introScene(ctx) {
    const { world } = ctx, offs = [], temp = [];
    let mapBox = null;
    return {
      shots: [
        { cam: [9, 5, 12], look: [0, 1.5, -20], to: { cam: [4, 4, 8], look: [0, 1.5, -28] },
          act: () => {
            scene.enemy.visible = true; scene.enemy.position.set(0, 0, -64); scene.enemy.rotation.y = Math.PI; // 뱃머리를 포구(남쪽) 쪽으로
            offs.push(world.onUpdate(dt => { scene.enemy.position.z = Math.min(-24, scene.enemy.position.z + dt * 4.5); }));
          } },
        { cam: [12, 3.2, 13.4], look: [8, 1.5, 8], to: { cam: [3, 3.2, 13.4], look: [0.5, 1.5, 8] }, // 떠나는 임금 일행을 따라간다
          act: () => {
            mapBox = routeMap(ctx.ui); // D-67: 한반도 지도에 한양에서 의주까지 피란길
            const KING = LOOKS.injo; // 임금 차림(붉은 곤룡포와 익선관)
            [[KING, 0], [LOOKS.minister, 1.6], [LOOKS.minister, 2.6], [LOOKS.joseonSoldier, -1.6], [LOOKS.joseonSoldier, 3.8]].forEach(([look, dx], i) => {
              const p = makePerson(look); p.position.set(10 + dx, 0, 8.2 + (i % 2) * 0.7); p.rotation.y = -Math.PI / 2; world.level.add(p); temp.push(p);
            });
            offs.push(world.onUpdate(dt => { for (const p of temp) p.position.x -= dt * 1.3; })); // 서둘러 길을 떠난다
          } },
      ],
      done: () => { offs.forEach(f => f()); temp.forEach(p => p.removeFromParent()); mapBox?.removeFromParent(); scene.setStage('harbor'); },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 포구 앞 빈 땅, 학생 쪽(서쪽)을 본다
  portal: { at: [0.5, 8.5], ry: -Math.PI / 2 },
  spawn: () => ({ at: scene.introFrom, to: scene.start, gate: scene.gate }), // 도착 연출 자리(타임머신 틀, 2026-11-09): 탐험이 시작되는 곳(문 밖 길)과 같게

  enterStage(ctx, stage) {
    scene.gate.setOpen(0);
    if (stage === 'minigame') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.setStage('won'); placePlayer(ctx.world, SPOT); }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markPort(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, portTalk(id, heard));
            heard.add(id); markPort(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (id !== 'yisunsin') return;
          if (heard.size < PEOPLE.length) { await sayAll(dialogue, n.wait); return; } // 모두 들어야 진행(C-01)
          await sayAll(dialogue, n.first);
          [...PEOPLE, 'yisunsin'].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    [...PEOPLE, 'yisunsin'].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    // 1) 꾀어내기(바다로 짧은 장면 전환)
    ctx.setGoal(script.goals[2]);
    await showHowTo(ctx.ui, script.sail);
    await ctx.fade(true);
    scene.setStage('sail'); board(ctx, LURE.start);
    await ctx.fade(false);
    await sayAll(dialogue, script.lure.go); dialogue.close();
    parts.push(await tryPart(ctx, easy => lureEnemy(ctx, easy), script.lure.fail));
    await sayAll(dialogue, script.lure.done); dialogue.close();
    await meetFlagship(ctx); // 다음 놀이는 대장선에 가서 말을 걸어야 시작한다(C-05)
    // 2) 학익진
    ctx.setGoal(script.goals[4]);
    await showHowTo(ctx.ui, script.wing.howto);
    parts.push(await tryPart(ctx, easy => fillWing(ctx, easy), script.wing.fail));
    await sayAll(dialogue, script.wing.done); dialogue.close();
    // 3) 거북선을 앞세우고 공격(큰 장면)
    unboard(ctx);
    scene.myShip.visible = true; // 학생 배는 날개 자리에 그대로 남는다
    await turtleAndBattle(ctx);
    scene.myShip.visible = false;
    await ctx.wait(600);
    await victoryScene(ctx); // 끝 해설 장면(D-58): 돌아오는 수군과 포구 사람들, 해 질 녘 판옥선

    await ctx.fade(true);
    world.bounds = { x0: -16, x1: 16, z0: 4.5, z1: 14 };
    placePlayer(world, SPOT);
    await ctx.fade(false);
    return sumParts(parts);
  },
};
