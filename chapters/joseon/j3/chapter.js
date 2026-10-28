// 조선편 3장 「세종 때의 과학 기술」(D-23): 문으로 들어와 백성·장영실·세자의 이야기(아무 차례) →
// 커다란 앙부일구의 그림자가 가리키는 동물 자리에 서기 → 자격루를 차례로 직접 움직이기 → 소나기 뒤 측우기의 물 높이 눈금 자리에 서기 → 퀴즈.
import * as THREE from 'three';
import { buildJ3Scene } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { PLAY } from '../../kit/play.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts, standPick, tileRow } from '../common.js';
import script from './script.js';

// 자격루 마당(마을에서 떨어진 x 400): 커다란 자격루 앞의 네 자리를 차례로 찾아가 누르면 그 부분이 움직인다
export const CLOCKYARD = {
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -16, x1: 16, z0: -10, z1: 14 },
  props: [{ type: 'landmark', name: 'jagyeongnu', x: 0, z: -7, scale: 1.4, rect: [10, 3] }, { type: 'hanok', x: 0, z: -14, tile: true, scale: 1.6, solid: false }],
};
// 물 붓는 곳(물항아리 앞) → 구슬이 놓인 곳(긴 물통 옆) → 인형 상자 앞 → 종·북 앞
export const CLOCK_SPOTS = [{ x: -4, z: -3.6 }, { x: 1, z: -3.6 }, { x: 4.2, z: -3.8 }, { x: 6.6, z: -1.2 }];

const PEOPLE = ['commoner', 'jangyeongsil', 'crownPrince'];
const SPOT = [-4, 3];
let scene = null;

// 앙부일구의 낮 시각선(인시~술시, 서쪽→동쪽)과 12지신 동물. 가운데(오시)가 자오선이다.
export const HOURS = [['호랑이', '🐯'], ['토끼', '🐰'], ['용', '🐲'], ['뱀', '🐍'], ['말', '🐴'], ['양', '🐑'], ['원숭이', '🐵'], ['닭', '🐔'], ['개', '🐶']];
// 그림자가 닿는 시각선 번호(해가 움직여 세 번 바뀐다)
export const DIAL_ROUNDS = [4, 2, 6];
// 측우기에 고이는 빗물 높이(눈금). 소나기가 두 번 온다
export const GAUGE_ROUNDS = [5, 3];
const TILE_GAP = 2.6; // 고르는 자리 사이(가까이 선 자리 하나만 고르게, common.js REACH 1.3)

// 탐험 표시: 아직 안 들은 사람에게 느낌표, 화살표는 다음 사람
function markTown(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  const nx = PEOPLE.find(id => !heard.has(id)), n = nx && world.npcs.get(nx).mesh.position;
  world.setGoal(n ? { x: n.x, z: n.z } : null);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
// 사람의 말: 다른 사람 이야기를 먼저 들었으면 받아 잇는 한 줄로 시작한다(막지 않는다)
export function townTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 1) 커다란 앙부일구: 해가 움직여 그림자가 시각선을 옮겨 가고, 학생은 그림자가 가리키는 동물 자리에 서서 누른다
export function dialTiles() {
  const [dx, dz] = scene.dialAt, row = dz - 5.2;
  return HOURS.map((h, k) => ({ k, x: dx + (k - 4) * TILE_GAP, z: row, label: `${h[1]} ${h[0]}` }));
}
async function readDial(ctx, easy) {
  const { world, dialogue } = ctx;
  const tiles = dialTiles(), rowUI = tileRow(world, tiles);
  world.followOffset = new THREE.Vector3(0, 9, 8); world.followLookY = 1; // 그릇 안 그림자가 보이게 위에서(놀이 동안만)
  let missed = false;
  try {
    for (const [i, h] of DIAL_ROUNDS.entries()) {
      await scene.moveShadow(tiles[h]); // 해가 움직여 그림자가 그 동물 자리 쪽으로
      if (i) { await dialogue.say(script.dial.again); dialogue.close(); }
      const r = await standPick(ctx, tiles, h, { easy, hint: script.dial.fail });
      if (r === 'missed') missed = true;
    }
  } finally { rowUI.remove(); world.followOffset = null; world.followLookY = null; ctx.input.enabled = false; }
  return missed ? 'missed' : true;
}

// 3) 측우기: 소나기가 오면 빗물이 차오르고, 비가 그치면 자의 눈금과 같은 번호 자리에 서서 누른다
export function gaugeTiles() {
  const [gx, gz] = scene.gaugeAt;
  return [1, 2, 3, 4, 5, 6].map((n, i) => ({ n, x: gx + (i - 2.5) * TILE_GAP, z: gz + 3.8, label: `눈금 ${n}` }));
}
async function readGauge(ctx, easy) {
  const { world, dialogue } = ctx;
  const tiles = gaugeTiles(), rowUI = tileRow(world, tiles, { size: 0.8 });
  scene.showGauge(true);
  world.followOffset = new THREE.Vector3(0, 4.5, 7); world.followLookY = 2.2; // 측우기와 자가 크게 보이게(놀이 동안만)
  let missed = false;
  try {
    for (const lv of GAUGE_ROUNDS) {
      scene.setRain(true);
      await dialogue.say(script.rain.shower); dialogue.close();
      await scene.fillGauge(lv);
      scene.setRain(false);
      await dialogue.say(script.rain.read); dialogue.close();
      const r = await standPick(ctx, tiles, lv - 1, { easy, hint: script.rain.fail });
      if (r === 'missed') missed = true;
    }
  } finally { rowUI.remove(); scene.showGauge(false); world.followOffset = null; world.followLookY = null; ctx.input.enabled = false; }
  return missed ? 'missed' : true;
}

// 2) 자격루를 직접 움직이기: 물 붓기 → 구슬 → 인형 → 종·북. 차례가 아니면 움직이지 않는다(PLAY.stops가 해설)
export function runClock(ctx, easy) {
  return PLAY.stops(ctx, {
    arena: CLOCKYARD, from: [0, 12], counter: '움직인 곳', fail: script.clock.fail,
    spots: script.clock.cards.map((label, i) => ({ label, talk: script.clock.talk[i], ...CLOCK_SPOTS[i] })),
    act: (i, s) => clockAct(ctx, s, i),
  }, easy);
}
// 무대의 자격루 모형에 움직임을 붙인다: 0 물이 차오름, 1 구슬이 굴러 떨어짐, 2 인형이 움직임, 3 종과 북이 울림
function clockAct(ctx, s, i) {
  const g = s.arena.group;
  let clock = null; g.traverse(o => { if (o.userData.puppets) clock = o; });
  if (!clock) return;
  const u = clock.userData, mat = c => new THREE.MeshLambertMaterial({ color: c });
  if (i === 0) {
    u.water = [-0.4, 0.4].map(dz => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 14), mat(0x5a9ac0)); w.position.set(1.3, 0.05, dz); w.scale.y = 0.01; clock.add(w); return w; });
    const fall = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), mat(0x6fb0d8)); fall.position.set(-0.75, 1.9, 0); clock.add(fall); // 물그릇에서 흘러내리는 물줄기
    let k = 0; s.update(dt => { if (k >= 1) { fall.visible = false; return; } k = Math.min(1, k + dt / 2.2); for (const w of u.water) { w.scale.y = 2.4 * k; w.position.y = 0.05 + 1.2 * k; } });
    ctx.audio.play('water');
  } else if (i === 1) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat(0x4a4a48)); ball.position.set(1.3, 2.75, 0); clock.add(ball);
    let k = 0; s.update(dt => { if (k >= 1) return; k = Math.min(1, k + dt / 1.4); ball.position.set(1.3 + 1.45 * k, 2.75 - 0.4 * k * k, 0.2); ball.rotation.z = -k * 8; });
    ctx.audio.play('tap');
  } else if (i === 2) {
    let t = 0; s.update(dt => { t += dt; u.puppets.forEach((p, k) => { p.position.y = 2.8 + (t < 3 ? Math.max(0, Math.sin(t * 6 - k * 2)) * 0.25 : 0); }); });
  } else {
    ctx.audio.play('bell');
    let t = 0; s.update(dt => { t += dt; clock.rotation.z = t < 1.2 ? Math.sin(t * 40) * 0.006 * (1.2 - t) : 0; }); // 종·북 울림에 자격루가 살짝 떤다
  }
  ctx.testHooks.clockActs = [...(ctx.testHooks.clockActs || []), i];
}

export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  id: 'j3',
  mood: 'summer',
  player: { robe: 0x4a6a7a, hat: 'topknot', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildJ3Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame' || stage === 'quiz') { scene.gate.setOpen(0); placePlayer(ctx.world, SPOT); }
    if (stage === 'quiz') ctx.setGoal(script.goals[4]);
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    ctx.setGoal(script.goals[0]);
    const heard = new Set();
    markTown(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (!PEOPLE.includes(id)) { await sayAll(dialogue, n.always); return; } // 유물 옆 안내판
          const isNew = !heard.has(id);
          await sayAll(dialogue, townTalk(id, heard));
          heard.add(id); markTown(ctx, heard);
          if (heard.size === PEOPLE.length) { world.setGoal(null); hud.setCounter(null); stop(); setTimeout(resolve, 0); return; }
          if (isNew) await dialogue.say(script.more);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    world.closeView = true;
    PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    // 1) 앙부일구
    ctx.setGoal(script.goals[1]);
    placePlayer(world, SPOT);
    await sayAll(dialogue, script.dial.intro); dialogue.close();
    await showHowTo(ctx.ui, script.dial.howto);
    parts.push(await tryPart(ctx, easy => readDial(ctx, easy), script.dial.fail));
    await sayAll(dialogue, script.dial.done); dialogue.close();
    // 2) 자격루를 직접 움직이기(보루각 안, 짧은 장면 전환)
    ctx.setGoal(script.goals[2]);
    await showHowTo(ctx.ui, script.clock.howto);
    ctx.testHooks.clockActs = [];
    parts.push(await tryPart(ctx, easy => runClock(ctx, easy), script.clock.fail));
    scene.ringClock(); ctx.audio.play('bell');
    await sayAll(dialogue, script.clock.done); dialogue.close();
    // 3) 측우기
    ctx.setGoal(script.goals[3]);
    placePlayer(world, scene.gaugeStand);
    await sayAll(dialogue, script.rain.intro); dialogue.close();
    await showHowTo(ctx.ui, script.rain.howto);
    parts.push(await tryPart(ctx, easy => readGauge(ctx, easy), script.rain.fail));
    await sayAll(dialogue, script.rain.done); dialogue.close();
    placePlayer(world, SPOT);
    ctx.setGoal(script.goals[4]);
    return sumParts(parts);
  },
};
