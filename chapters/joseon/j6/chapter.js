// 조선편 6장 「영조·정조와 수원 화성」(D-27): 공사장 문으로 들어와 관리·일꾼의 이야기(아무 차례) → 정조의 명 →
// 정약용 곁에서 도르래 세 틀을 직접 당겨 보고 가장 가벼운 것 고르기 → 물레를 돌려 거중기로 돌을 들고 성벽 빈자리에 내려놓기 →
// 정조와 함께 장안문 곁 성벽 위에서 완성된 화성 둘러보기 → 퀴즈.
import * as THREE from 'three';
import { buildJ6Scene, GAPS, WALL_Z, WALL_H, TRACK } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { LOOKS } from '../../../content/characters.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts, visitAny } from '../common.js';
import script from './script.js';

const PEOPLE = ['official', 'worker'];
const SPOT = [-2, 2];
const GAP_STAND = GAPS.map(x => ({ x, z: -6.1 })); // 빈자리 앞에 서는 곳
let scene = null;

function markYard(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('jeongjo').mark.visible = heard.size > 0;
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'jeongjo').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
export function yardTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 1) 도르래 당겨 보기: 세 틀을 아무 차례로 당기면(대화 버튼) 돌이 올라간다. 움직도르래가 많을수록 가볍게 높이 쑥 올라간다
export async function tryPulleys(ctx, easy) {
  const { dialogue, audio } = ctx;
  const P = script.pulley;
  const spots = scene.pulleys.map((r, i) => ({ x: r.x, z: r.z + 2.3, r, i }));
  const anim = (sec, f) => new Promise(res => { let t = 0; const off = ctx.world.onUpdate(dt => { t = Math.min(1, t + dt / sec); f(t); if (t >= 1) { off(); res(); } }); });
  await visitAny(ctx, spots, async sp => {
    const { r } = sp, high = [0.35, 0.9, 1.6][r.n], sec = [2.4, 1.6, 0.9][r.n]; // 무거울수록 천천히 조금만
    audio.play('tap');
    await anim(sec, t => r.setH(high * Math.sin(Math.min(1, t) * Math.PI / 2)));
    await dialogue.say(P.feel[r.n]);
    await anim(0.8, t => r.setH(high * (1 - t)));
    dialogue.close();
  });
  let missed = false;
  for (;;) {
    ctx.testHooks.choice = P.answer;
    const i = await dialogue.choose(P.ask, P.options);
    ctx.testHooks.choice = null;
    if (i === P.answer) { audio.play('correct'); break; }
    missed = true; audio.play('wrong');
    await dialogue.say({ who: 'guide', text: P.fail });
  }
  dialogue.close();
  return missed ? 'missed' : true;
}

// 2) 물레를 돌려 거중기로 성 쌓기: 물레에서 세 번 돌려 돌을 들고, 매단 돌은 학생을 따라 들보 위를 옮겨 간다.
// 빛나는 빈자리 앞에서 누르면 내려놓는다(빈자리가 아닌 곳에서 누르면 해설만, 실패 아님)
export async function buildWall(ctx, easy) {
  const { world, dialogue, hud, audio } = ctx;
  const W = script.wall;
  GAPS.forEach((_, i) => scene.fill(i, false));
  scene.pulleys.forEach(r => { r.g.visible = false; }); // 도르래 틀은 성벽 앞을 가리니 이 놀이 동안 치운다
  world.followOffset = new THREE.Vector3(0, 5.5, 10); world.followLookY = 3.5; // 성벽과 거중기 들보가 보이게(놀이 동안만)
  const rings = GAP_STAND.map(g => { const r = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(g.x, 0.08, g.z); world.level.add(r); return r; });
  let missed = false;
  const filled = new Set();
  ctx.input.enabled = true;
  try {
    while (filled.size < GAPS.length) {
      // 물레 돌리기: 빈 갈고리가 돌 더미에서 돌을 잡은 뒤, 세 번 돌려 들어 올린다
      await scene.slideTo(TRACK[0] + 0.1); await scene.liftTo(scene.PICK_H); scene.stone.visible = true;
      hud.setCounter(`채운 빈자리 ${filled.size}/${GAPS.length} · 물레를 돌리자`);
      if (!filled.size) { await dialogue.say(W.wind); dialogue.close(); }
      let turns = 0;
      await visitAny(ctx, [{ ...scene.winch }, { ...scene.winch, x: scene.winch.x + 0.001 }, { ...scene.winch, x: scene.winch.x + 0.002 }], async () => {
        turns += 1; audio.play('tap');
        await scene.turnWinch(scene.PICK_H + (1 - scene.PICK_H) * turns / 3);
      });
      await dialogue.say(W.up); dialogue.close();
      ctx.input.enabled = true; // visitAny가 끝나며 걷기를 막아 두므로 다시 연다
      // 돌을 매단 채 빈자리로: 들보 위 수레가 학생의 x를 따라간다
      const left = GAPS.map((x, i) => i).filter(i => !filled.has(i));
      hud.setCounter(`채운 빈자리 ${filled.size}/${GAPS.length} · 빈자리 앞에서 내려놓기`);
      const follow = world.onUpdate(() => { const x = Math.min(TRACK[1], Math.max(TRACK[0], world.player.position.x)); scene.trolley.position.x += (x - scene.trolley.position.x) * 0.2; });
      ctx.testHooks.walkTo = { x: GAP_STAND[left[0]].x, z: GAP_STAND[left[0]].z };
      if (easy || missed) world.setGoal(ctx.testHooks.walkTo);
      const near = () => { const p = world.player.position; return left.find(k => Math.hypot(p.x - GAP_STAND[k].x, p.z - GAP_STAND[k].z) < 1.3); };
      const tick = world.onUpdate(() => { const i = near(); hud.setTalkEnabled?.(!dialogue.isOpen()); hud.setPrompt?.(i != null ? new THREE.Vector3(GAP_STAND[i].x, 0, GAP_STAND[i].z) : null); });
      const at = await new Promise(resolve => {
        const unbind = ctx.onAction(async () => {
          if (dialogue.isOpen()) return;
          const i = near();
          if (i == null) { missed = true; audio.play('wrong'); await dialogue.say({ who: 'guide', text: W.notGap }); dialogue.close(); return; }
          unbind(); resolve(i);
        });
      });
      tick(); follow();
      world.setGoal(null); ctx.testHooks.walkTo = null; hud.setTalkEnabled?.(false); hud.setPrompt?.(null);
      ctx.input.enabled = false;
      audio.play('correct');
      await scene.placeAt(at); filled.add(at);
      rings[at].visible = false;
      ctx.input.enabled = true;
    }
  } finally {
    rings.forEach(r => world.level.remove(r));
    scene.pulleys.forEach(r => { r.g.visible = true; });
    world.followOffset = null; world.followLookY = null; hud.setCounter(null); ctx.input.enabled = false;
  }
  return missed ? 'missed' : true;
}

// 3) 마무리: 정조와 함께 장안문 곁 성벽 위에 올라 완성된 화성을 둘러본다(카메라가 천천히 돈다)
export async function hwaseongTour(ctx) {
  const { world, dialogue } = ctx;
  await ctx.fade(true);
  GAPS.forEach((_, i) => scene.fill(i, true));
  const jj = world.npcs.get('jeongjo');
  world.moveNpc('jeongjo', -16.4, WALL_Z, Math.PI); jj.mesh.position.y = WALL_H; jj.collider.r = 0;
  const me = world.player.clone(true); me.position.set(-15, WALL_H, WALL_Z + 0.2); me.rotation.y = Math.PI; me.visible = true; world.level.add(me);
  world.player.visible = false;
  let t = 0;
  const off = world.onUpdate(dt => { t += dt; const a = -0.6 + Math.min(1, t / 14) * 1.5; world.setFixedCamera([-16 + Math.sin(a) * 13, 7.5, WALL_Z + Math.cos(a) * 13], [-17, 2.5, WALL_Z - 1]); });
  await ctx.fade(false);
  await sayAll(dialogue, script.tour);
  await sayAll(dialogue, script.result);
  dialogue.close();
  off();
  await ctx.fade(true);
  world.level.remove(me); world.player.visible = true;
  jj.mesh.position.y = 0; world.moveNpc('jeongjo', -10, -3, 0);
  placePlayer(world, SPOT);
  await ctx.fade(false);
}

export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  id: 'j6',
  mood: 'autumn',
  player: LOOKS.worker,
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildJ6Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  enterStage(ctx, stage) {
    scene.yardGate.setOpen(0);
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { GAPS.forEach((_, i) => scene.fill(i)); ctx.setGoal(script.goals[5]); }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.yardGate, speed: 1 });
    closeGate(world, scene.yardGate);
    const heard = new Set();
    markYard(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, yardTalk(id, heard));
            heard.add(id); markYard(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (id === 'jeongyakyong') { await sayAll(dialogue, n.later); return; }
          if (id !== 'jeongjo') { await sayAll(dialogue, n.always); return; } // 장안문 옆 안내판
          if (!heard.size) { await sayAll(dialogue, n.wait); return; }
          await sayAll(dialogue, n.first);
          [...PEOPLE, 'jeongjo'].forEach(k => { world.npcs.get(k).mark.visible = false; });
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
    [...PEOPLE, 'jeongjo'].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    // 1) 정약용 곁에서 도르래 당겨 보기
    ctx.setGoal(script.goals[2]);
    placePlayer(world, [-4.6, -1.2]);
    world.setTalkCamera(world.npcs.get('jeongyakyong').mesh);
    await sayAll(dialogue, script.npc.jeongyakyong.first); dialogue.close();
    world.camMode = 'follow';
    await showHowTo(ctx.ui, script.pulley.howto);
    parts.push(await tryPart(ctx, easy => tryPulleys(ctx, easy), script.pulley.fail));
    await sayAll(dialogue, script.pulley.done); dialogue.close();
    // 2) 물레를 돌려 거중기로 성 쌓기
    ctx.setGoal(script.goals[3]);
    const blockers = ['jeongyakyong', 'worker'].map(id => world.npcs.get(id));
    blockers.forEach(n => { n.mesh.visible = false; n.collider.r = 0; }); // 성벽 앞을 가리지 않게 잠시 비켜 둔다
    await showHowTo(ctx.ui, script.wall.howto);
    placePlayer(world, [scene.winch.x + 1.5, scene.winch.z + 1.5]);
    parts.push(await tryPart(ctx, easy => buildWall(ctx, easy), script.wall.notGap));
    blockers.forEach(n => { n.mesh.visible = true; n.collider.r = 0.5; });
    await sayAll(dialogue, script.wall.done); dialogue.close();
    // 3) 정조와 함께 화성 둘러보기
    ctx.setGoal(script.goals[4]);
    await hwaseongTour(ctx);
    ctx.setGoal(script.goals[5]);
    return sumParts(parts);
  },
};
