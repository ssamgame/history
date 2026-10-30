// 5장 「팔만대장경」(D-17, D-32): 작업장 문을 열고 들어와 스님의 이야기 → 장인 네 사람의 "그다음엔…"(어느 차례로든) →
// 스님이 건넨 나무판을 들고 빛나는 여섯 곳에서 E를 눌러 경판 만들기(자리마다 과정 그림, 3번 장인 자리에서 大藏經을 바로 새김) → 서가에 꽂기 → 퀴즈.
import { buildCh5Scene, drawMakingStep } from './scene.js';
import { roam } from '../../core/flow.js';
import { traceGlyph, showHowTo } from '../../core/minigame.js';
import { labelSprite, setCarry } from '../../core/people.js';
import { enterThroughGate, closeGate } from '../kit/gate.js';
import { burning } from '../kit/fire.js';
import { waitInteract } from '../../core/portal.js';
import { makePerson } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';
import * as THREE from 'three';
import script from './script.js';
import { tripitakaScene } from './story.js';
import { doWork, shelveFirstPerson, carryPlank } from './work.js';

const ARTISANS = ['artisan1', 'artisan2', 'artisan3', 'artisan4'];
const NEAR = 1.3;      // 서가 앞 빛나는 자리에 닿았다고 보는 거리
const WORK_NEAR = 1.0; // 일하는 자리(작은 빛나는 원) 위에서 E를 누를 수 있는 거리: 일할 자리까지 몇 걸음만 걷는다
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
function hold(world) { scene.plank.visible = true; scene.plank.rotation.set(0, 0, 0); carryPlank(world.player, scene.plank); }

// 과정 그림(D-32): 그 자리의 일을 그린 그림과 그 아래 설명 한 줄. '다음'(또는 E)을 누르면 닫힌다.
// i는 일하는 자리 차례(그림 모양), 글은 그 자리의 id로 찾는다(글자 새기기는 직접 새기므로 그림이 없다)
export function showStepPicture(ctx, i) {
  const P = script.making.pictures.find(p => p.id === scene.stations[i].id);
  if (!P) return Promise.resolve();
  return new Promise(resolve => {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const screen = el('section', 'screen doc ch5-step'); screen.dataset.step = P.id;
    const card = el('div', 'card'); Object.assign(card.style, { padding: '16px 20px', gap: '10px' });
    const cv = drawMakingStep(document.createElement('canvas'), i);
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', P.title);
    Object.assign(cv.style, { display: 'block', justifySelf: 'center', width: 'clamp(140px, calc((100dvh - 300px) * 1.43), 360px)', height: 'auto', borderRadius: '4px', border: '2px solid #6b4a32' });
    const ok = el('button', 'btn primary doc-ok', '다음'); ok.type = 'button';
    card.append(el('div', 'eyebrow', `경판 만들기 ${i + 1} / ${scene.stations.length}`), el('h2', null, P.title), cv, el('p', null, P.text), ok);
    screen.append(card); ctx.ui.append(screen);
    let unbind = null, done = false;
    const close = () => { if (done) return; done = true; clearTimeout(arm); unbind?.(); screen.remove(); resolve(); };
    ok.addEventListener('click', close);
    const arm = setTimeout(() => { unbind = ctx.onAction?.(close) || null; }, 300); // 방금 누른 E가 바로 닫지 않게 잠깐 뒤부터 받는다
  });
}

// 3번 장인 자리에서 내려놓은 판에 大藏經 세 글자를 바로 새긴다(글자판)
async function carve(ctx) {
  const { dialogue, hud } = ctx;
  await sayAll(dialogue, script.carving.intro);
  dialogue.close();
  const glyphs = script.carving.glyphs;
  for (let i = 0; i < glyphs.length; i++) { await traceGlyph(ctx, glyphs[i]); scene.setCarved(i + 1); hud.setCounter(`새긴 글자 ${i + 1}/${glyphs.length}`); }
}

// 놀이: 경판 만들기. 지금 차례인 자리만 빛나고, 그 자리에서 E(대화 버튼)를 누르면 판을 내려놓고 그 일의 과정 그림이 뜬다.
// 그림을 닫으면 판이 한 단계 바뀌고 다시 든다. 3번 장인 자리(글자 새기기)에서는 그 자리에서 바로 大藏經을 새기고, 새긴 경판을 들고 4번 장인에게 간다.
// 다른 자리에 머물면 스님이 짧게 알려 준다(실패로 세지 않고 다시 하기도 없다). 한 번도 틀리지 않으면 first: true
export async function makeBlock(ctx) {
  const { world, hud, dialogue, audio } = ctx;
  const S = scene.stations;
  let k = 0, first = true, busy = false;
  const stay = new Map(), told = new Set(); // 다른 자리에 머문 시간, 이번에 머무는 동안 이미 알려 준 자리
  scene.setStage(0); scene.setCarved(0); hold(world); // 스님이 나무판을 건넨다
  const show = () => {
    S.forEach((s, i) => { s.ring.visible = i === k && !busy; });
    hud.setCounter(`경판 만들기 ${k}/${S.length}`);
  };
  const offHint = world.onUpdate(dt => {
    if (busy) return;
    const p = world.player.position;
    S.forEach((s, i) => {
      if (i <= k) return; // 지금 차례인 자리와 이미 마친 자리(방금 일을 마치고 그대로 서 있어도)는 알려 주지 않는다
      const d = Math.hypot(p.x - s.spot[0], p.z - s.spot[1]);
      if (d >= WRONG_NEAR) { stay.delete(i); return; } // 지나가기만 하면 괜찮고, 그 자리에 잠깐 머물면 스님이 알려 준다
      const t = (stay.get(i) || 0) + dt; stay.set(i, t);
      if (t < WRONG_STAY || told.has(i)) return;
      told.add(i);
      if (!dialogue.isOpen()) { first = false; dialogue.say(script.making.failHint).then(() => dialogue.close()); }
    });
    for (const i of told) if (!stay.has(i)) told.delete(i);
  });
  while (k < S.length) {
    busy = false; show();
    const st = S[k];
    ctx.testHooks.closer = true; // 테스트 봇: 작은 원 위까지 걸어 들어간다
    await waitInteract(ctx, { pos: { x: st.spot[0], z: st.spot[1] }, label: script.making.steps[k], r: WORK_NEAR, mark: false });
    ctx.testHooks.closer = false;
    busy = true; show();
    const was = ctx.input.enabled; ctx.input.enabled = false;
    ctx.testHooks.work = ctx.testHooks.work || {};
    await doWork(ctx, scene, st.id, (ctx.testHooks.work[st.id] = {}), async () => { // 몸으로 일하고(판 내려놓기 → 도구질) 그 자리에서 과정 그림, 3번 자리에서는 大藏經 새기기
      await showStepPicture(ctx, k);
      if (st.id === 'carve') await carve(ctx);
    });
    k += 1; scene.setStage(k); audio.play('correct');
    if (st.id === 'carve') { hud.setCounter(`경판 만들기 ${k}/${S.length}`); await dialogue.say(script.carving.toEnds); dialogue.close(); }
    ctx.input.enabled = was;
  }
  offHint();
  S.forEach(s => { s.ring.visible = false; }); hud.setCounter(null); world.setGoal(null);
  return { first };
}

// 다 만든 경판을 들고 서가에 꽂는다. 화면 전환 없이 같은 장면에서 잇는다
export async function shelveBlock(ctx) {
  const { world, dialogue, input } = ctx;
  const H = scene.shelf;
  if (world.player.userData.carry?.obj !== scene.plank) hold(world);
  scene.library.visible = true;
  await dialogue.say(script.carving.shelve); dialogue.close();
  const was = await new Promise(resolve => {
    H.ring.visible = true; world.setGoal({ x: H.spot[0], z: H.spot[1] });
    const was = input.enabled; input.enabled = true;
    const off = world.onUpdate(() => {
      const p = world.player.position;
      if (Math.hypot(p.x - H.spot[0], p.z - H.spot[1]) >= NEAR) return;
      off(); H.ring.visible = false; world.setGoal(null); input.enabled = false; resolve(was);
    });
  });
  ctx.testHooks.shelf = await shelveFirstPerson(ctx, scene, {}); // 1인칭으로 서가의 빈자리에 꽂는다(2026-10-30)
  input.enabled = was;
}

export const devScene = () => scene; // 개발용(사진 찍기·콘솔): 지은 장면

// (이어 하기) 새긴 경판을 서가 위 칸 빈자리에 다른 경판과 같은 자세로 세워 둔다(크기는 그대로)
function shelve() {
  const pl = scene.plank;
  if (pl.parent && pl.parent.userData.carry) setCarry(pl.parent, null);
  scene.library.add(pl);
  pl.visible = true; pl.scale.setScalar(1);
  pl.position.set(...scene.shelf.slot);
  pl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1)));
}

export default {
  id: 'ch5',
  mood: 'forest',
  script,
  quizzes: script.quizzes,
  stories: { tripitaka: tripitakaScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildCh5Scene(world); addNumberTags(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  // 장 도입(C-03): ① 몽골 군사들이 옛 대장경 경판 더미를 불태우는 모습 ② 고려 사람들이 작업장에서 다시 만드는 모습
  introScene(ctx) {
    const { world } = ctx;
    const people = [...world.npcs.values()];
    const g = new THREE.Group(); g.name = 'introBurn'; g.position.set(0, 0, 2);
    for (let k = 0; k < 14; k++) { // 쌓아 올린 옛 경판
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.5), new THREE.MeshLambertMaterial({ color: 0x9a7650 }));
      b.position.set((k % 2) * 0.1, 0.06 + k * 0.11, 0); b.rotation.y = (k % 3 - 1) * 0.1; g.add(b);
    }
    const soldiers = [[-3.4, -0.6, -0.5], [3.4, -0.6, 0.5], [-1.5, -2.6, 0.2], [1.7, -2.4, -0.2]].map(([x, z, ry]) => {
      const m = makePerson(LOOKS.mongol); m.position.set(x, 0, z); m.rotation.y = ry; m.userData.noWalk = true; g.add(m); return m;
    });
    const fire = burning(world, { parent: g, x: 0, y: 0.5, z: 0, size: 2.2, level: 0 });
    let off = null;
    return {
      shots: [
        { cam: [3, 2.4, 7.5], look: [0, 1.8, 0], to: { cam: [-2, 2.4, 6.5], look: [0, 2.0, 0] },
          act: () => {
            people.forEach(n => { n.mesh.visible = false; }); world.level.add(g); g.visible = true; let t = 0;
            off = world.onUpdate(dt => { t += dt; fire.setLevel(Math.min(1, t / 2.5)); });
          } },
        { cam: [-9, 3.2, 8], look: [-5, 1.4, -2], to: { cam: [9, 3.2, 8], look: [5, 1.4, -2] },
          act: () => { off?.(); off = null; g.visible = false; fire.setLevel(0); people.forEach(n => { n.mesh.visible = true; }); } },
      ],
      done: () => { off?.(); off = null; fire.setLevel(0); g.removeFromParent(); people.forEach(n => { n.mesh.visible = true; }); },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 마당 오른쪽 아래 빈 땅, 학생 쪽(남쪽)을 본다
  portal: { at: [5.5, 6], ry: 0 },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { scene.gate.setOpen(0); placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') {
      scene.gate.setOpen(0); scene.setStage(6); scene.setCarved(3); scene.library.visible = true; shelve();
      placePlayer(ctx.world, scene.start);
    }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    let monk = false;
    const mark = () => {
      world.npcs.get('monk').mark.visible = !monk;
      ARTISANS.forEach(id => { world.npcs.get(id).mark.visible = monk && !heard.has(id); });
      const next = !monk ? 'monk' : ARTISANS.find(id => !heard.has(id)); // 모두 들었으면 아래에서 스님 쪽으로
      const n = next && world.npcs.get(next);
      world.setGoal(n ? { x: n.mesh.position.x, z: n.mesh.position.z } : null);
      const all = monk && heard.size === ARTISANS.length; // 모두 들어야 스님이 이야기를 이어 간다(C-01)
      world.npcs.get('monk').mark.visible = !monk || all;
      if (all) { const m = world.npcs.get('monk').mesh.position; world.setGoal({ x: m.x, z: m.z }); }
      ctx.setGoal(script.goals[!monk ? 0 : all ? 2 : 1]);
      hud.setCounter(monk && !all ? `들은 이야기 ${heard.size}/4` : null);
    };
    mark();
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (id === 'monk') {
            if (monk && heard.size === ARTISANS.length) { // 모두 들은 뒤: 스님이 나무판을 건네며 일을 맡긴다
              await sayAll(dialogue, script.making.give);
              world.npcs.get('monk').mark.visible = false; world.setGoal(null); hud.setCounter(null);
              stop(); setTimeout(resolve, 0); return;
            }
            await sayAll(dialogue, monk ? script.npc.monk.later : script.npc.monk.open); monk = true;
          } else if (ARTISANS.includes(id)) { await sayAll(dialogue, artisanTalk(id, heard)); heard.add(id); }
          mark();
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    world.closeView = true;
    input.enabled = false;
    for (const id of [...ARTISANS, 'monk']) world.npcs.get(id).mark.visible = false;
    ctx.setGoal(script.goals[3]);
    dialogue.close();
    await showHowTo(ctx.ui, script.making.howto);
    input.enabled = true;
    const a = await makeBlock(ctx);
    input.enabled = false;
    // 다음 일은 저절로 시작하지 않는다: 스님에게 가서 말을 걸어야 서가에 꽂는 일이 시작된다(C-05)
    const monk = world.npcs.get('monk');
    monk.mark.visible = true;
    await waitInteract(ctx, { pos: monk.mesh.position, quest: script.goals[4], label: '스님과 이야기하기', mark: false });
    monk.mark.visible = false;
    input.enabled = false;
    world.setTalkCamera(monk.mesh);
    await sayAll(dialogue, script.making.done);
    dialogue.close(); world.camMode = 'follow';
    ctx.setGoal(script.goals[5]);
    await shelveBlock(ctx);
    input.enabled = false;
    dialogue.close();
    await tripitakaScene(ctx); // 끝 해설 장면(D-58): 16년 동안 만든 경판이 서가를 채운다
    return { firstTryCorrect: a.first ? 1 : 0, firstTryTotal: 1, easyModeUsed: false };
  },
};
