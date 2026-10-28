// 6장 「삼별초의 항쟁」(D-19): 포구 문으로 들어와 관리·병사·백성의 말 → 배중손의 결심 → 배중손을 따라 부두로 →
// 바닷길(진도) → 내려서 용장성의 김통정에게 → 바닷길(제주) → 항파두리의 김통정에게 → 바닷가의 고려 사람들을 만나기 → 퀴즈.
import { buildCh6Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { leadWalk } from '../kit/lead.js';
import script from './script.js';

const PEOPLE = ['minister', 'sambyeolcho', 'villager'];
const MEET_START = [2, 4, 0, 3, 1]; // 인물이 처음 서 있는 자리(표지판 차례와 섞어 둔다)

const CATCH_R = 2.4;
const CHASE_DELAY = 2.5;
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 바닷길 한 구간: 도착 원에 닿으면 성공, 추격선에 잡히면 실패. 뒤쫓는 배가 보이도록 바다에서만 조금 높은 카메라(상시 규칙 예외)
export function sailLeg(ctx, leg, easy) {
  const { world, hud, audio, input } = ctx;
  const speed = easy ? 2.2 : 3.6;
  let t = 0; // 출발 뒤 CHASE_DELAY초 동안은 추격선이 기다린다
  world.bounds = scene.seaBounds;
  world.closeView = false;
  scene.setSailing(true);
  placePlayer(world, leg.from);
  world.player.visible = false;
  scene.ring.position.set(leg.to.x, 0.1, leg.to.z); scene.ring.visible = true;
  world.setGoal({ x: leg.to.x, z: leg.to.z });
  scene.pursuers.forEach((p, i) => { p.visible = true; p.position.set(leg.chasers[i][0], -0.3, leg.chasers[i][1]); });
  input.enabled = true;
  let done = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); input.enabled = false; input.releaseJoystick?.();
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
  scene.setSailing(true); placePlayer(world, leg.from); world.player.visible = false;
}

// 배에서 내려 걷는 땅(진도 용장성 앞·제주 항파두리 앞): 낮은 카메라, 해안에 서고 김통정이 성 앞에 선다
export function landAt(ctx, id) {
  const { world } = ctx;
  const A = scene.lands[id];
  scene.setSailing(false);
  world.closeView = true;
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

// 마무리(D-19): 바닷가의 다섯 인물을 아무 차례로 만나면 한 줄을 말하고 자기 사건 표지판 옆으로 걸어가 선다
export function meetPeople(ctx) {
  const { world, dialogue, hud } = ctx;
  const A = scene.lands.jeju, M = script.meet.people;
  world.npcs.get('kimtongjeong').mesh.visible = false;
  M.forEach((p, i) => {
    const [x, z] = A.people[MEET_START[i]];
    world.moveNpc(p.id, x, z, 0);
    const n = world.npcs.get(p.id); n.mesh.visible = true; n.mark.visible = true;
  });
  const met = new Set(), walking = new Map();
  const next = () => {
    const p = M.find(q => !met.has(q.id));
    const m = p && world.npcs.get(p.id).mesh.position;
    world.setGoal(m ? { x: m.x, z: m.z } : null);
    hud.setCounter(`만난 사람 ${met.size}/${M.length}`);
  };
  next();
  ctx.input.enabled = true;
  const offWalk = world.onUpdate(dt => { // 표지판으로 걸어간다
    for (const [id, b] of walking) {
      const m = world.npcs.get(id).mesh.position, dx = b.x - m.x, dz = b.z - m.z, d = Math.hypot(dx, dz), step = 2.4 * dt;
      if (d <= step) { world.moveNpc(id, b.x, b.z, 0); walking.delete(id); }
      else world.moveNpc(id, m.x + dx / d * step, m.z + dz / d * step, Math.atan2(dx, dz));
    }
  });
  return new Promise(resolve => {
    const stop = roam(ctx, {
      async onTalk(id) {
        const p = M.find(q => q.id === id);
        if (!p) return;
        await dialogue.say(p.line);
        if (met.has(id)) return;
        met.add(id); world.npcs.get(id).mark.visible = false;
        walking.set(id, scene.boards[id]);
        next();
        if (met.size === M.length) {
          stop();
          const wait = world.onUpdate(() => { if (walking.size) return; wait(); offWalk(); hud.setCounter(null); resolve(); });
        }
      },
    });
  });
}

function showAftermath(ctx) {
  landAt(ctx, 'jeju');
  ctx.world.npcs.get('kimtongjeong').mesh.visible = false;
  script.meet.people.forEach(p => { const b = scene.boards[p.id], n = ctx.world.npcs.get(p.id); ctx.world.moveNpc(p.id, b.x, b.z, 0); n.mesh.visible = true; n.mark.visible = false; });
  ctx.setGoal(script.goals[7]);
}

let devWorld = null;
export const devScene = () => scene; // 개발용(사진 찍기·콘솔)
export const devLand = id => landAt({ world: devWorld }, id);
export const devMeet = () => showAftermath({ world: devWorld, setGoal() {} });

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

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.closeView = true; ctx.world.bounds = scene.portBounds; scene.setSailing(false); placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') showAftermath(ctx);
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
      bj.mark.visible = heard.size > 0;
      const nx = PEOPLE.find(id => !heard.has(id)), n = world.npcs.get(nx || 'baejungson');
      world.setGoal({ x: n.mesh.position.x, z: n.mesh.position.z });
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
          if (!heard.size) { await sayAll(dialogue, script.npc.baejungson.wait); return; }
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
    ctx.setGoal(G[1]);
    await sayAll(dialogue, script.npc.baejungson.lead);
    dialogue.close();
    await leadWalk(ctx, { id: 'baejungson', path: scene.leadPath, stand: scene.leadStand, ring: scene.standRing, face: 0 });
    // 2. 강화도 → 진도
    await ctx.fade(true);
    for (const id of ['baejungson', 'sambyeolcho', ...PEOPLE]) world.npcs.get(id).mesh.visible = false;
    toSea(ctx, scene.legs[0]);
    ctx.setGoal(G[2]);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.sail.howto);
    const a = await runWithRetries(ctx, easy => sailLeg(ctx, scene.legs[0], easy), { failHint: script.sail.failHint });
    // 3. 진도에 내려 용장성의 김통정에게
    await ctx.fade(true);
    landAt(ctx, 'jindo');
    ctx.setGoal(G[3]);
    await ctx.fade(false);
    await sayAll(dialogue, script.jindo.arrive);
    dialogue.close();
    await talkToKim(ctx, script.jindo.talk);
    // 4. 진도 → 제주
    await ctx.fade(true);
    world.npcs.get('kimtongjeong').mesh.visible = false;
    toSea(ctx, scene.legs[1]);
    ctx.setGoal(G[4]);
    await ctx.fade(false);
    const b = await runWithRetries(ctx, easy => sailLeg(ctx, scene.legs[1], easy), { failHint: script.sail.failHint });
    // 5. 제주에 내려 항파두리의 김통정에게
    await ctx.fade(true);
    landAt(ctx, 'jeju');
    ctx.setGoal(G[5]);
    await ctx.fade(false);
    await sayAll(dialogue, script.jeju.arrive);
    dialogue.close();
    await talkToKim(ctx, script.jeju.talk);
    // 6. 바닷가의 고려 사람들을 만나기
    ctx.setGoal(G[6]);
    await sayAll(dialogue, script.meet.intro);
    dialogue.close();
    await meetPeople(ctx);
    input.enabled = false;
    await sayAll(dialogue, script.meet.done); dialogue.close();
    ctx.setGoal(G[7]);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
