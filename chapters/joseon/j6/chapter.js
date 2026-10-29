// 조선편 6장 「영조·정조와 수원 화성」(D-27, D-30): 공사장 문으로 들어와 관리·일꾼의 이야기(아무 차례, 모두 들어야) → 정조의 명 →
// 정약용에게 가서 말을 걸면 도르래 세 틀을 길게 눌러 당겨 보고(눈높이에서 올려다봄) 가장 가벼운 것 고르기 →
// 물레에 가서 길게 눌러 거중기로 돌을 들고, 돌을 끌어(방향키도 됨) 성벽 빈자리에 내려놓기 →
// 정조에게 말을 걸어 장안문 곁 성벽 위에서 완성된 화성 둘러보기 → 빛나는 문 → 퀴즈.
import * as THREE from 'three';
import { buildJ6Scene, GAPS, WALL_Z, WALL_H, TRACK } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { waitInteract } from '../../../core/portal.js';
import { LOOKS } from '../../../content/characters.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts, visitAny } from '../common.js';
import { holdPress, dragStone } from './hold.js';
import script from './script.js';

const PEOPLE = ['official', 'worker'];
const SPOT = [-2, 2];
// 길게 누르기(J-05): 가 → 나 → 다 → 물레로 갈수록 오래 눌러야 한다(초)
export const HOLD_SEC = { pulley: [2.4, 1.9, 1.4], winch: 2.9 }; // 가→나→다로 갈수록 짧게: 도르래가 많을수록 가볍게 들린다(2026-10-29 선생님). 물레 거중기가 가장 길다
let scene = null;

function markYard(ctx, heard) {
  const { world, hud } = ctx;
  const all = heard.size === PEOPLE.length;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('jeongjo').mark.visible = all; // 모두 들어야 정조가 퀘스트를 준다(C-01)
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'jeongjo').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[all ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
export function yardTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 1) 도르래 당겨 보기: 세 틀을 아무 차례로 찾아가 큰 버튼(E)을 길게 누르면 줄이 당겨져 돌이 올라간다.
// 당기는 동안은 학생 눈높이에서 그 틀을 올려다본다(J-04). 움직도르래가 많을수록 가볍게 높이 쑥 올라간다
export async function tryPulleys(ctx, easy) {
  const { world, dialogue, audio } = ctx;
  const P = script.pulley;
  const spots = scene.pulleys.map((r, i) => ({ x: r.x, z: r.z + 2.3, r, i }));
  const anim = (sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); f(t); if (t >= 1) { off(); res(); } }); });
  await visitAny(ctx, spots, async sp => {
    const { r } = sp, high = [0.35, 0.9, 1.6][r.n], shake = [0.03, 0.012, 0][r.n]; // 무거울수록 조금만 오르고 줄이 떨린다
    world.player.visible = false; scene.setCarriers(false); // 틀 뒤로 지나가는 백성이 돌을 가리지 않게
    world.setFixedCamera([r.x, 1.45, r.z + 4.2], [r.x, 1.8, r.z]);
    audio.play('tap');
    let tt = 0;
    await holdPress(ctx, {
      label: `「${r.label}」 줄 당기기 — 길게 누르기`, sec: HOLD_SEC.pulley[r.n],
      onProgress: (p, on, dt) => { tt += dt; r.setH(high * p); r.load.position.x = on ? Math.sin(tt * 38) * shake : 0; },
    });
    r.load.position.x = 0;
    await dialogue.say(P.feel[r.n]);
    await anim(0.8, t => r.setH(high * (1 - t)));
    dialogue.close();
    world.player.visible = true; world.camMode = 'follow'; scene.setCarriers(true);
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

// 2) 거중기로 성 쌓기: 성벽을 정면에서 보며 물레를 길게 눌러 돌려 돌을 들고(J-05), 매단 돌을 끌거나 방향키로 옮겨
// 빛나는 빈자리에 내려놓는다(J-06). 빈자리가 아닌 곳에서 내리면 성벽 위에 걸려 해설만 듣는다(틀림으로 셈, 다시 옮기면 된다)
export async function buildWall(ctx, easy) {
  const { world, dialogue, hud, audio } = ctx;
  const W = script.wall;
  GAPS.forEach((_, i) => scene.fill(i, false));
  scene.pulleys.forEach(r => { r.g.visible = false; }); // 도르래 틀과 나르는 백성은 성벽 앞을 가리니 이 놀이 동안 치운다
  scene.setCarriers(false);
  const f = scene.wallFit;
  world.fitFixedCamera(f.target, f.dir, f.points, f.margin);
  const joyWas = hud.joyZone ? hud.joyZone.hidden : null;
  if (hud.joyZone) hud.joyZone.hidden = true; // 화면을 끌면 조이스틱 대신 돌이 움직인다
  // 빈자리마다 채울 돌 모양으로 빛나는 자리
  const ghosts = GAPS.map(g => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.2, 2.44), new THREE.MeshBasicMaterial({ color: 0xf2c45a, transparent: true, opacity: 0.35, depthWrite: false }));
    m.position.set(g, WALL_H - 0.6, WALL_Z); world.level.add(m); return m;
  });
  const glow = world.onUpdate((dt, t) => ghosts.forEach(m => { m.material.opacity = 0.42 + Math.sin(t * 4) * 0.16; }));
  const SPAN = WALL_H + 2.2; // 돌 가운데 높이 = h × SPAN
  let missed = false;
  const filled = new Set();
  try {
    while (filled.size < GAPS.length) {
      // 빈 갈고리가 돌 더미에서 돌을 잡은 뒤, 물레를 길게 눌러 돌리면 돌이 성벽보다 높이 올라간다
      await scene.slideTo(TRACK[0] + 0.1); await scene.liftTo(scene.PICK_H); scene.stone.visible = true;
      hud.setCounter(`채운 빈자리 ${filled.size}/${GAPS.length} · 물레를 돌리자`);
      if (!filled.size) { await dialogue.say(W.wind); dialogue.close(); }
      const a0 = scene.drum.rotation.x, h0 = scene.PICK_H;
      await holdPress(ctx, { label: '물레 돌리기 — 길게 누르기', sec: HOLD_SEC.winch, onProgress: p => { scene.drum.rotation.x = a0 + p * Math.PI * 4; scene.setLift(h0 + (1 - h0) * p); } });
      audio.play('tap');
      if (!filled.size) { await dialogue.say(W.up); dialogue.close(); }
      hud.setCounter(`채운 빈자리 ${filled.size}/${GAPS.length} · 돌을 빈자리로 옮기자`);
      const at = await dragStone(ctx, {
        get: () => ({ x: scene.trolley.position.x, h: scene.stoneH() }),
        set: (x, h) => { scene.trolley.position.x = x; scene.setLift(h); },
        planeZ: WALL_Z, yOf: h => h * SPAN, hOf: y => y / SPAN,
        gaps: GAPS.map((g, i) => (filled.has(i) ? null : g)), track: TRACK,
        topH: (WALL_H + 0.65) / SPAN, bottomH: scene.GAP_H,
        onBump: async () => { missed = true; audio.play('wrong'); await dialogue.say({ who: 'guide', text: W.notGap }); dialogue.close(); },
      });
      audio.play('correct');
      await scene.placeAt(at); filled.add(at);
      ghosts[at].visible = false;
    }
  } finally {
    glow(); ghosts.forEach(m => world.level.remove(m));
    scene.pulleys.forEach(r => { r.g.visible = true; });
    scene.setCarriers(true);
    if (hud.joyZone && joyWas !== null) hud.joyZone.hidden = joyWas;
    world.camMode = 'follow'; hud.setCounter(null); ctx.input.enabled = false;
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
  const me = world.player.clone(true); me.position.set(-15, WALL_H, WALL_Z + 0.2); me.rotation.y = 0; me.visible = true; world.level.add(me);
  world.player.visible = false;
  // 높은 곳에서 성벽·장안문·거중기를 한눈에(학생과 정조 뒤에서 내려다보며 천천히 옆으로). 둘은 같은 곳(성 밖 북쪽)을 바라본다
  let t = 0;
  const off = world.onUpdate(dt => {
    t += dt; const a = -0.25 + Math.min(1, t / 16) * 0.5;
    jj.mesh.rotation.y = 0; me.rotation.y = 0; // 둘 다 성 밖(북쪽)을 바라본다(카메라는 뒤에서)
    world.setFixedCamera([-12 + Math.sin(a) * 20, 17, WALL_Z + Math.cos(a) * 20], [-9, 1.5, WALL_Z - 4]);
  });
  await ctx.fade(false);
  await sayAll(dialogue, script.tour);
  await sayAll(dialogue, script.result);
  dialogue.close();
  off();
  await ctx.fade(true);
  world.level.remove(me); world.player.visible = true;
  jj.mesh.position.y = 0; world.moveNpc('jeongjo', -10, -3, 0); jj.collider.r = 0.5;
  placePlayer(world, SPOT);
  world.camMode = 'follow';
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

  // 장 도입(C-03): 차일 아래의 정조(탕평을 이어 간 임금)에서 시작해, 돌을 나르는 백성과 거중기가 돌을 옮기는 성벽 공사장으로 카메라가 옮겨 간다
  introScene(ctx) {
    const { world } = ctx;
    const x0 = scene.trolley.position.x, h0 = scene.stoneH();
    let off = null;
    return {
      shots: [
        { cam: [-10.6, 2.05, 1.2], look: [-10, 1.95, -3], to: { cam: [4, 8.5, 12], look: [0, 3.5, -9] },
          act: () => { let tt = 0; off = world.onUpdate(dt => { tt += dt; scene.trolley.position.x = x0 + Math.min(1, tt / 9) * (GAPS[1] - x0); }); } },
      ],
      done: () => { off?.(); off = null; scene.trolley.position.x = x0; scene.setLift(h0); },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 마을 가운데 빈 땅, 학생(서쪽 SPOT) 쪽을 본다
  portal: { at: [2.5, 1.5], ry: -Math.PI / 2 },

  enterStage(ctx, stage) {
    scene.yardGate.setOpen(0);
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') GAPS.forEach((_, i) => scene.fill(i));
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
          if (id !== 'jeongjo') return;
          if (heard.size < PEOPLE.length) { await sayAll(dialogue, n.wait); return; } // 모두 들어야 진행(C-01)
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
    // 1) 정약용에게 가서 말을 걸어야 시작한다(J-03·C-05: 정조의 말 바로 뒤에 저절로 시작하지 않는다)
    const jy = world.npcs.get('jeongyakyong');
    jy.mark.visible = true;
    await waitInteract(ctx, { pos: jy.mesh.position, quest: script.goals[2], label: '정약용과 이야기하기', mark: false });
    jy.mark.visible = false;
    ctx.input.enabled = false;
    ctx.setGoal(script.goals[3]);
    world.setTalkCamera(jy.mesh);
    await sayAll(dialogue, script.npc.jeongyakyong.first); dialogue.close();
    world.camMode = 'follow';
    await showHowTo(ctx.ui, script.pulley.howto);
    parts.push(await tryPart(ctx, easy => tryPulleys(ctx, easy), script.pulley.fail));
    await sayAll(dialogue, script.pulley.done); dialogue.close();
    // 2) 거중기 물레로 가서 눌러야 시작한다(C-05)
    await waitInteract(ctx, { pos: { x: scene.winch.x, z: scene.winch.z }, quest: script.goals[4], label: '거중기 물레 돌리기', markY: 2.4 });
    ctx.input.enabled = false;
    const blockers = ['jeongyakyong', 'worker'].map(id => world.npcs.get(id));
    blockers.forEach(n => { n.mesh.visible = false; n.collider.r = 0; }); // 성벽 앞을 가리지 않게 잠시 비켜 둔다
    await showHowTo(ctx.ui, script.wall.howto);
    parts.push(await tryPart(ctx, easy => buildWall(ctx, easy), script.wall.notGap));
    blockers.forEach(n => { n.mesh.visible = true; n.collider.r = 0.5; });
    await sayAll(dialogue, script.wall.done); dialogue.close();
    // 3) 차일 아래의 정조에게 가서 말을 걸면 함께 화성을 둘러본다(C-05)
    const jj = world.npcs.get('jeongjo');
    jj.mark.visible = true;
    await waitInteract(ctx, { pos: jj.mesh.position, quest: script.goals[5], label: '정조와 이야기하기', mark: false });
    jj.mark.visible = false;
    ctx.input.enabled = false;
    await hwaseongTour(ctx);
    return sumParts(parts);
  },
};
