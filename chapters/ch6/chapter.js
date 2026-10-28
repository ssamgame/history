// 6장 「삼별초의 항쟁」(D-19): 포구 문으로 들어와 관리·병사·백성의 말 → 배중손의 결심 → 배중손을 따라 부두로 →
// 바닷길(진도) → 내려서 용장성의 김통정에게 → 바닷길(제주) → 항파두리의 김통정에게 → 퀴즈. (편 복습 퀴즈는 6장 뒤 core/review.js)
import { buildCh6Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { leadWalk } from '../kit/lead.js';
import { waitInteract } from '../../core/portal.js';
import * as THREE from 'three';
import script from './script.js';

const PEOPLE = ['minister', 'sambyeolcho', 'villager'];
const SAIL_CAM = { offset: [0, 2.9, 5.4], lookY: 1.3 }; // 배 바로 뒤 낮은 눈높이(1인칭 같은 3인칭, D-20)

const CATCH_R = 2.4;
const CHASE_DELAY = 2.5;
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 바닷길 한 구간: 도착 원에 닿으면 성공, 몽골 배에 잡히면 실패. 배 바로 뒤 낮은 카메라, 몽골 배는 앞쪽 양옆에서 다가온다(D-20)
export function sailLeg(ctx, leg, easy) {
  const { world, hud, audio, input } = ctx;
  const speed = easy ? 2.2 : 3.6;
  let t = 0; // 출발 뒤 CHASE_DELAY초 동안은 추격선이 기다린다
  toSea(ctx, leg);
  scene.ring.position.set(leg.to.x, 0.1, leg.to.z); scene.ring.visible = true;
  world.setGoal({ x: leg.to.x, z: leg.to.z });
  scene.pursuers.forEach((p, i) => { p.visible = true; p.position.set(leg.chasers[i][0], -0.3, leg.chasers[i][1]); });
  input.enabled = true;
  let done = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); input.enabled = false; input.releaseJoystick?.();
      world.followOffset = null; world.followLookY = null;
      scene.ring.visible = false; scene.pursuers.forEach(p => { p.visible = false; });
      world.setGoal(null); hud.setCounter(null);
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      const b = world.player.position;
      const left = Math.hypot(b.x - leg.to.x, b.z - leg.to.z);
      hud.setCounter(`${leg.name}까지 남은 뱃길: 노 젓기 ${Math.ceil(left / 2)}번`); // 바다에서는 걸음 대신 노 젓기로 센다
      if (left < leg.to.r) { audio.play('correct'); return finish(true); }
      t += dt;
      if (t < CHASE_DELAY) return;
      for (const p of scene.pursuers) {
        const dx = b.x - p.position.x, dz = b.z - p.position.z, d = Math.hypot(dx, dz);
        if (d < CATCH_R) { audio.play('wrong'); return finish(false); }
        p.position.x += (dx / d) * speed * dt; p.position.z += (dz / d) * speed * dt;
        p.rotation.y = Math.atan2(dx, dz);
      }
    });
  });
}

// 장면 전환 동안 배에 태워 바닷길 출발점에 둔다(어두운 화면이 걷힐 때 바다가 보이게)
function toSea(ctx, leg) {
  const { world } = ctx;
  world.closeView = false; world.bounds = scene.seaBounds;
  world.followOffset = new THREE.Vector3(...SAIL_CAM.offset); world.followLookY = SAIL_CAM.lookY;
  scene.setSailing(true); placePlayer(world, leg.from); world.player.visible = false;
}

// 배에서 내려 걷는 땅(진도 용장성 앞·제주 항파두리 앞): 낮은 카메라, 해안에 서고 김통정이 성 앞에 선다
export function landAt(ctx, id) {
  const { world } = ctx;
  const A = scene.lands[id];
  scene.setSailing(false);
  world.closeView = true; world.followOffset = null; world.followLookY = null;
  world.bounds = A.bounds;
  world.moveNpc('kimtongjeong', A.kim[0], A.kim[1], 0);
  world.npcs.get('kimtongjeong').mesh.visible = true;
  placePlayer(world, A.shore);
}

// 땅에 내려 김통정에게 걸어가 이야기를 듣는다
function talkToKim(ctx, lines) {
  const { world, dialogue } = ctx;
  const kim = world.npcs.get('kimtongjeong');
  kim.mark.visible = true;
  world.setGoal({ x: kim.mesh.position.x, z: kim.mesh.position.z });
  ctx.input.enabled = true;
  return new Promise(resolve => {
    const stop = roam(ctx, {
      async onTalk(id) {
        if (id !== 'kimtongjeong') return;
        await sayAll(dialogue, lines);
        kim.mark.visible = false; world.setGoal(null);
        stop(); setTimeout(resolve, 0);
      },
    });
  });
}

// 마을(강화도 포구)로 돌아온다: 이어서 큰 문이 선다(C-02)
function returnToPort(ctx) {
  const { world } = ctx;
  scene.setSailing(false);
  world.closeView = true; world.followOffset = null; world.followLookY = null;
  world.bounds = scene.portBounds;
  for (const id of ['baejungson', 'sambyeolcho', ...PEOPLE]) { const n = world.npcs.get(id); n.mesh.visible = true; n.mark.visible = false; }
  world.npcs.get('kimtongjeong').mesh.visible = false;
  placePlayer(world, scene.start);
}

let devWorld = null;
export const devScene = () => scene; // 개발용(사진 찍기·콘솔)
export const devLand = id => landAt({ world: devWorld }, id);
export const devSail = () => { const leg = scene.legs[0]; toSea({ world: devWorld }, leg); scene.pursuers.forEach((p, i) => { p.visible = true; p.position.set(leg.chasers[i][0] * 0.5, -0.3, leg.from[1] - 22 - i * 6); p.rotation.y = Math.PI / 2 * (i % 2 ? -1 : 1); }); };

export default {
  id: 'ch6',
  mood: 'sea',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh6Scene(world); devWorld = world;
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  // 장 도입(C-03): ① 포구에서 관리가 조정의 결정을 전하는 모습 ② 삼별초 군사들이 배중손 곁에서 주먹을 들어 반대하는 모습
  introScene(ctx) {
    const { world } = ctx;
    const raise = ['sambyeolcho', 'baejungson'].map(id => world.npcs.get(id).mesh);
    const all = ['minister', 'sambyeolcho', 'baejungson', 'villager'].map(id => world.npcs.get(id).mesh), ry0 = all.map(m => m.rotation.y);
    const face = (m, [cx, , cz]) => { m.rotation.y = Math.atan2(cx - m.position.x, cz - m.position.z); }; // 카메라 쪽을 본다(얼굴이 보이게)
    let off = null;
    return {
      shots: [
        { cam: [-3.5, 2.3, 71], look: [-8, 1.8, 76], to: { cam: [-6, 2.3, 71.5], look: [-8, 1.8, 76] },
          act: () => { face(all[0], [-3.5, 0, 71]); face(all[3], [-3.5, 0, 71]); } },
        { cam: [-1, 2.6, 66.5], look: [2, 1.8, 72], to: { cam: [3, 2.6, 67], look: [3, 1.8, 72] },
          act: () => {
            face(all[1], [-1, 0, 66.5]); face(all[2], [-1, 0, 66.5]);
            raise.forEach(m => { m.userData.manual = true; });
            off = world.onUpdate((dt, t) => raise.forEach((m, i) => {
              const a = m.userData.arms, w = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7);
              a[0].rotation.x = a[1].rotation.x = -2.2 - 0.5 * w; a[0].rotation.z = -0.15; a[1].rotation.z = 0.15;
            }));
          } },
      ],
      done: () => { off?.(); off = null; all.forEach((m, i) => { m.rotation.y = ry0[i]; }); raise.forEach(m => { for (const a of m.userData.arms) a.rotation.set(0, 0, 0); m.userData.manual = false; }); },
    };
  },
  // 미니게임 뒤 큰 문(C-02, 편의 마지막 장): 포구 가운데 빈 땅, 학생 쪽(남쪽)을 본다
  portal: { at: [-13, 79], ry: 1.49 }, // 학생(0, 80) 왼쪽 풀밭, 학생 쪽을 본다(잔교·사람을 막지 않게)

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.closeView = true; ctx.world.bounds = scene.portBounds; scene.setSailing(false); placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') returnToPort(ctx);
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    world.bounds = scene.portBounds;
    scene.setSailing(false);
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    world.bounds = scene.portBounds;
    ctx.setGoal(script.goals[0]);
    const heard = new Set();
    const bj = world.npcs.get('baejungson');
    const mark = () => {
      PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
      bj.mark.visible = heard.size === PEOPLE.length; // 모두 들어야 배중손이 이야기한다(C-01)
      const nx = PEOPLE.find(id => !heard.has(id)), n = world.npcs.get(nx || 'baejungson');
      world.setGoal({ x: n.mesh.position.x, z: n.mesh.position.z });
      ctx.setGoal(script.goals[nx ? 0 : 1]);
      hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
    };
    mark();
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (PEOPLE.includes(id)) { await sayAll(dialogue, script.npc[id]); heard.add(id); mark(); return; }
          if (id !== 'baejungson') return;
          if (heard.size < PEOPLE.length) { await sayAll(dialogue, script.npc.baejungson.wait); return; }
          await sayAll(dialogue, script.npc.baejungson.decide);
          PEOPLE.forEach(k => { world.npcs.get(k).mark.visible = false; }); bj.mark.visible = false;
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    const G = script.goals;
    input.enabled = false;
    // 1. 배중손을 따라 부두 끝으로
    ctx.setGoal(G[2]);
    await sayAll(dialogue, script.npc.baejungson.lead);
    dialogue.close();
    await leadWalk(ctx, { id: 'baejungson', path: scene.leadPath, stand: scene.leadStand, ring: scene.standRing, face: 0 });
    // 배에 오르는 것도 저절로 시작하지 않는다: 배중손에게 말을 걸어야 한다(C-05)
    const bj = world.npcs.get('baejungson');
    bj.mark.visible = true;
    await waitInteract(ctx, { pos: bj.mesh.position, quest: G[2], label: '배중손과 이야기하기', mark: false });
    bj.mark.visible = false; input.enabled = false;
    world.setTalkCamera(bj.mesh);
    await sayAll(dialogue, script.npc.baejungson.board);
    dialogue.close(); world.camMode = 'follow';
    // 2. 강화도 → 진도
    await ctx.fade(true);
    for (const id of ['baejungson', 'sambyeolcho', ...PEOPLE]) world.npcs.get(id).mesh.visible = false;
    toSea(ctx, scene.legs[0]);
    ctx.setGoal(G[3]);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.sail.howto);
    const a = await runWithRetries(ctx, easy => sailLeg(ctx, scene.legs[0], easy), { failHint: script.sail.failHint });
    // 3. 진도에 내려 용장성의 김통정에게
    await ctx.fade(true);
    landAt(ctx, 'jindo');
    ctx.setGoal(G[4]);
    await ctx.fade(false);
    await sayAll(dialogue, script.jindo.arrive);
    dialogue.close();
    await talkToKim(ctx, script.jindo.talk);
    // 4. 진도 → 제주
    await ctx.fade(true);
    world.npcs.get('kimtongjeong').mesh.visible = false;
    toSea(ctx, scene.legs[1]);
    ctx.setGoal(G[5]);
    await ctx.fade(false);
    const b = await runWithRetries(ctx, easy => sailLeg(ctx, scene.legs[1], easy), { failHint: script.sail.failHint });
    // 5. 제주에 내려 항파두리의 김통정에게
    await ctx.fade(true);
    landAt(ctx, 'jeju');
    ctx.setGoal(G[6]);
    await ctx.fade(false);
    await sayAll(dialogue, script.jeju.arrive);
    dialogue.close();
    await talkToKim(ctx, script.jeju.talk);
    input.enabled = false;
    // 마을(포구)로 돌아온다: 이어서 큰 문이 선다(C-02)
    await ctx.fade(true);
    returnToPort(ctx);
    await ctx.fade(false);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
