// 5장 「팔만대장경」(D-17): 작업장 문을 열고 들어와 스님의 이야기 → 장인 네 사람의 "그다음엔…"(어느 차례로든) →
// 스님이 건넨 나무판을 들고 빛나는 여섯 곳을 돌며 경판 만들기 → 그 경판에 大藏經을 새겨 서가에 꽂기 → 퀴즈.
import { buildCh5Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { traceGlyph, showHowTo } from '../../core/minigame.js';
import { labelSprite, setCarry } from '../../core/people.js';
import { enterThroughGate } from '../kit/gate.js';
import script from './script.js';

const ARTISANS = ['artisan1', 'artisan2', 'artisan3', 'artisan4'];
const NEAR = 1.3;      // 빛나는 자리에 닿았다고 보는 거리
const WORK_TIME = 1.2; // 판을 내려놓고 모습이 바뀔 때까지(초)
const WRONG_NEAR = 0.9, WRONG_STAY = 0.5; // 차례가 아닌 자리에 이만큼 가까이 이만큼 머물면 스님이 알려 준다
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

function addNumberTags(world) {
  ARTISANS.forEach((id, i) => {
    const m = world.npcs.get(id).mesh;
    if (m.getObjectByName('numTag')) return;
    const tag = labelSprite(`${i + 1}번 장인`); tag.name = 'numTag'; tag.scale.set(2.6, 0.75, 1); tag.position.set(0, 4.3, 0); m.add(tag);
  });
}

// 장인의 말: 자기 일을 그대로 말하고, 앞 번호 장인 중 아직 안 들은 사람이 있으면 가장 앞 번호 한 사람만 한 줄로 알려 준다(막지 않는다)
export function artisanTalk(id, heard) {
  const i = ARTISANS.indexOf(id);
  const miss = ARTISANS.slice(0, i).findIndex(a => !heard.has(a));
  return miss < 0 ? script.npc[id] : [...script.npc[id], script.earlier(id, miss + 1)];
}

// 판을 학생 두 팔에 안긴다
function hold(world) { scene.plank.visible = true; scene.plank.scale.setScalar(1); scene.plank.rotation.set(0, 0, 0); setCarry(world.player, scene.plank, 'arms'); }
// 판을 작업 자리(put)에 내려놓는다
function putDown(world, [x, y, z]) {
  setCarry(world.player, null);
  world.level.add(scene.plank); scene.plank.position.set(x, y, z); scene.plank.rotation.set(0, 0, 0);
}

// 놀이 1: 경판 만들기. 지금 차례인 자리만 빛나고, 가까이 가면 판을 내려놓고 잠깐 뒤 모습이 한 단계 바뀐 판을 다시 든다.
// 다른 자리에 가면 스님이 짧게 알려 준다(실패로 세지 않고 다시 하기도 없다). 한 번도 틀리지 않으면 first: true
export function makeBlock(ctx) {
  const { world, hud, dialogue, audio } = ctx;
  const S = scene.stations;
  let k = 0, work = -1, first = true, began = false, wasInput = false;
  const stay = new Map(), told = new Set(); // 다른 자리에 머문 시간, 이번에 머무는 동안 이미 알려 준 자리
  scene.setStage(0);
  return new Promise(resolve => {
    const show = () => {
      S.forEach((s, i) => { s.ring.visible = i === k && work < 0; });
      world.setGoal(work < 0 && S[k] ? { x: S[k].spot[0], z: S[k].spot[1] } : null);
      hud.setCounter(`경판 만들기 ${k}/${S.length}`);
    };
    const off = world.onUpdate(dt => {
      if (!began) { began = true; hold(world); show(); return; } // 스님이 나무판을 건넨다
      const p = world.player.position;
      if (work >= 0) { // 판을 내려놓고 일하는 중
        work += dt;
        if (work < WORK_TIME) return;
        work = -1; k += 1; scene.setStage(k); hold(world); audio.play('correct');
        if (k >= S.length) { ctx.input.enabled = wasInput; off(); S.forEach(s => { s.ring.visible = false; }); hud.setCounter(null); world.setGoal(null); resolve({ first }); return; }
        ctx.input.enabled = wasInput; show(); return;
      }
      S.forEach((s, i) => {
        const d = Math.hypot(p.x - s.spot[0], p.z - s.spot[1]);
        if (i === k) { if (d < NEAR) { putDown(world, s.put); work = 0; wasInput = ctx.input.enabled; ctx.input.enabled = false; audio.play('tap'); show(); } return; }
        // 다른 자리: 지나가기만 하면 괜찮고, 그 자리에 잠깐 머물면 스님이 알려 준다
        if (d >= WRONG_NEAR) { stay.delete(i); return; }
        const t = (stay.get(i) || 0) + dt; stay.set(i, t);
        if (t < WRONG_STAY || told.has(i)) return;
        told.add(i);
        if (!dialogue.isOpen()) { first = false; dialogue.say(script.making.failHint).then(() => dialogue.close()); }
      });
      for (const i of told) if (!stay.has(i)) told.delete(i);
    });
  });
}

// 놀이 2: 방금 만든 경판을 새기는 자리로 가져가 大藏經을 새기고(글자판), 그 경판을 들고 서가에 꽂는다. 화면 전환 없이 같은 장면에서 잇는다
export async function carveAndShelve(ctx) {
  const { world, dialogue, hud, input } = ctx;
  const C = scene.stations.find(s => s.id === 'carve'), H = scene.shelf;
  const walkTo = (spot, ring) => new Promise(resolve => {
    ring.visible = true; world.setGoal({ x: spot[0], z: spot[1] });
    const was = input.enabled; input.enabled = true;
    const off = world.onUpdate(() => {
      const p = world.player.position;
      if (Math.hypot(p.x - spot[0], p.z - spot[1]) >= NEAR) return;
      off(); ring.visible = false; world.setGoal(null); input.enabled = was; resolve();
    });
  });
  if (scene.plank.parent !== world.player) hold(world);
  await dialogue.say(script.carving.go); dialogue.close();
  await walkTo(C.spot, C.ring);
  putDown(world, C.put);
  ctx.audio.play('tap');
  await sayAll(dialogue, script.carving.intro);
  dialogue.close();
  const glyphs = script.carving.glyphs;
  for (let i = 0; i < glyphs.length; i++) { await traceGlyph(ctx, glyphs[i]); scene.setCarved(i + 1); hud.setCounter(`새긴 글자 ${i + 1}/${glyphs.length}`); }
  hud.setCounter(null);
  ctx.audio.play('correct');
  hold(world);
  scene.library.visible = true;
  await dialogue.say(script.carving.shelve); dialogue.close();
  await walkTo(H.spot, H.ring);
  shelve();
  ctx.audio.play('correct');
}

// 들어온 뒤 문을 천천히 닫는다(열린 문짝이 낮은 카메라 앞을 가리지 않게)
function closeGate(world) {
  let k = 1;
  const off = world.onUpdate(dt => { k = Math.max(0, k - dt / 0.8); scene.gate.setOpen(k); if (!k) off(); });
}

export const devScene = () => scene; // 개발용(사진 찍기·콘솔): 지은 장면

// 새긴 경판을 서가 맨 위 칸 빈자리에 세워 꽂는다
function shelve() {
  const pl = scene.plank;
  if (pl.parent && pl.parent.userData.carry) setCarry(pl.parent, null);
  scene.library.add(pl);
  pl.visible = true; pl.scale.setScalar(0.6);
  pl.position.set(...scene.shelf.slot); pl.rotation.set(0, Math.PI / 2, Math.PI / 2);
}

export default {
  id: 'ch5',
  mood: 'forest',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh5Scene(world); addNumberTags(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { scene.gate.setOpen(0); placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') {
      scene.gate.setOpen(0); scene.setStage(6); scene.setCarved(3); scene.library.visible = true; shelve();
      placePlayer(ctx.world, scene.start); ctx.setGoal(script.goals[4]);
    }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world);
    const heard = new Set();
    let monk = false;
    const mark = () => {
      world.npcs.get('monk').mark.visible = !monk;
      ARTISANS.forEach(id => { world.npcs.get(id).mark.visible = monk && !heard.has(id); });
      const next = !monk ? 'monk' : ARTISANS.find(id => !heard.has(id));
      const n = next && world.npcs.get(next);
      world.setGoal(n ? { x: n.mesh.position.x, z: n.mesh.position.z } : null);
      ctx.setGoal(script.goals[monk ? 1 : 0]);
      hud.setCounter(monk ? `들은 이야기 ${heard.size}/4` : null);
    };
    mark();
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (id === 'monk') { await sayAll(dialogue, monk ? script.npc.monk.later : script.npc.monk.open); monk = true; }
          else if (ARTISANS.includes(id)) { await sayAll(dialogue, artisanTalk(id, heard)); heard.add(id); }
          mark();
          if (monk && heard.size === ARTISANS.length) { hud.setCounter(null); stop(); setTimeout(resolve, 0); }
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    world.closeView = true;
    input.enabled = false;
    for (const id of [...ARTISANS, 'monk']) world.npcs.get(id).mark.visible = false;
    ctx.setGoal(script.goals[2]);
    await sayAll(dialogue, script.making.give);
    dialogue.close();
    await showHowTo(ctx.ui, script.making.howto);
    input.enabled = true;
    const a = await makeBlock(ctx);
    input.enabled = false;
    await sayAll(dialogue, script.making.done);
    dialogue.close();

    ctx.setGoal(script.goals[3]);
    await carveAndShelve(ctx);
    input.enabled = false;
    await sayAll(dialogue, script.result);
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect: a.first ? 1 : 0, firstTryTotal: 1, easyModeUsed: false };
  },
};
