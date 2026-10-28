// 조선편 2장(폴더 j3) 「세종 때의 과학 기술」(D-23·D-30): 도입 장면 → 문으로 들어와 백성·장영실·세자의 이야기(아무 차례, 모두) →
// 앙부일구에 다가가 그림자가 닿은 시각 칸 누르기 → 보루각 자격루에 다가가 물을 부으면 한 장면으로 움직임 →
// 측우기에 다가가 소나기 뒤 측우기 속 물 높이 눈금 누르기 → 빛나는 문 → 퀴즈.
import * as THREE from 'three';
import { buildJ3Scene } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { waitInteract } from '../../../core/portal.js';
import { labelSprite } from '../../kit/play.js';
import { hourAngle } from '../landmarks.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts } from '../common.js';
import script from './script.js';

const PEOPLE = ['commoner', 'jangyeongsil', 'crownPrince'];
const SPOT = [-4, 3];
let scene = null;

// 앙부일구의 시각 칸(서쪽 → 북쪽 → 동쪽): 시각 이름과 지금 시계로 나타낸 시간(D-30 S-01)
export const HOURS = [['묘시', '5~7시'], ['진시', '7~9시'], ['사시', '9~11시'], ['오시', '11~13시'], ['미시', '13~15시'], ['신시', '15~17시'], ['유시', '17~19시']];
export const HOUR_ANGLES = HOURS.map((_, k) => hourAngle(k));
// 그림자가 닿는 시각 칸 번호(해가 움직여 세 번 바뀐다)
export const DIAL_ROUNDS = [1, 4, 6];
// 측우기에 고이는 빗물 높이(눈금). 소나기가 두 번 온다
export const GAUGE_ROUNDS = [5, 3];
// 자격루 장면의 차례: 물 붓기 → 물이 차오름 → 잣대가 떠오름 → 구슬이 구름 → 인형이 종·북을 침
export const CLOCK_STEPS = ['pour', 'rise', 'rod', 'ball', 'strike'];

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

// 화면 위 단추로 고르기: items[i].at(세계 좌표)를 화면에 비춘 자리에 단추를 띄우고, answer 단추를 누르면 끝.
// 맞으면 true, 틀렸다 고치면 'missed'. 테스트 봇은 .screen.choose의 카드 가운데 testHooks.chooseAnswer 글자를 누른다
function pickOnScreen(ctx, { cls, items, answer, easy, hint, width = 92 }) {
  const { world, ui, dialogue, audio } = ctx;
  const el = document.createElement('div');
  el.className = `screen choose ${cls}`;
  el.style.cssText = 'background:transparent;display:block;padding:0;pointer-events:none;overflow:hidden';
  const btns = items.map((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'order-card'; b.dataset.k = String(i);
    b.style.cssText = `position:absolute;left:0;top:0;width:${width}px;min-height:52px;padding:4px 6px;font-size:16px;line-height:1.2;pointer-events:auto;transform:translate(-50%,-50%);box-shadow:0 2px 6px rgba(0,0,0,.35)`;
    const t = document.createElement('b'); t.textContent = it.text; b.append(t);
    if (it.sub) { const sm = document.createElement('small'); sm.textContent = it.sub; sm.style.display = 'block'; b.append(sm); }
    el.append(b); return b;
  });
  const place = () => {
    const W = innerWidth, H = innerHeight, cam = world.camera, bh = 58, bw = width + 6;
    cam.updateMatrixWorld();
    const pts = items.map(it => { const v = it.at.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H }; });
    for (let n = 0; n < 40; n++) { // 겹치는 단추는 서로 밀어 낸다
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, ox = bw - Math.abs(dx), oy = bh - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) { const s = (dx >= 0 ? 1 : -1) * ox / 2; a.x -= s; b.x += s; } else { const s = (dy >= 0 ? 1 : -1) * oy / 2; a.y -= s; b.y += s; }
      }
      for (const p of pts) { p.x = Math.min(W - bw / 2 - 6, Math.max(bw / 2 + 6, p.x)); p.y = Math.min(H - bh / 2 - 6, Math.max(bh / 2 + 6, p.y)); }
    }
    pts.forEach((p, i) => { btns[i].style.left = `${Math.round(p.x)}px`; btns[i].style.top = `${Math.round(p.y)}px`; });
  };
  let missed = false, busy = false;
  const showHint = () => { if (easy || missed) btns[answer].classList.add('hint'); };
  showHint();
  ctx.testHooks.chooseAnswer = [btns[answer].textContent];
  ui.append(el); place();
  (ctx.testHooks.picks ||= []).push({ cls, n: btns.length, onScreen: btns.every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }) });
  const off = world.onUpdate(place);
  ctx.input.enabled = false;
  return new Promise(resolve => {
    el.addEventListener('click', async e => {
      const b = e.target.closest('.order-card'); if (!b || busy) return;
      busy = true;
      if (Number(b.dataset.k) === answer) {
        audio.play('correct'); b.classList.add('picked');
        await ctx.wait(450);
        off(); el.remove(); resolve(missed ? 'missed' : true); return;
      }
      audio.play('wrong'); b.classList.add('wrong'); missed = true;
      el.classList.remove('choose'); el.hidden = true; // 해설을 듣는 동안 단추를 치운다
      await dialogue.say({ who: 'guide', text: hint }); dialogue.close();
      b.classList.remove('wrong'); el.hidden = false; el.classList.add('choose'); showHint();
      busy = false;
    });
  });
}

// 1) 커다란 앙부일구 속을 가까이: 해가 움직여 그림자가 시각 칸을 옮겨 가고, 학생은 그림자가 닿은 칸의 단추를 누른다
async function readDial(ctx, easy) {
  const { world, dialogue } = ctx;
  const d = scene.dial.position, y = 2.25 * scene.dial.scale.x;
  world.setFixedCamera([d.x, y + 3.6, d.z + 3.2], [d.x, y - 0.9, d.z - 0.5]); // 그릇 안이 다 보이게 남쪽 위에서(놀이 카메라 예외)
  scene.showHourTags(false);
  const items = HOURS.map(([text, sub], k) => ({ text, sub, at: scene.hourPoint(k) }));
  let missed = false;
  try {
    for (const [i, h] of DIAL_ROUNDS.entries()) {
      if (i) { await dialogue.say(script.dial.again); dialogue.close(); }
      await scene.moveShadow(h); // 해가 움직여 그림자가 그 시각 칸으로
      (ctx.testHooks.shadowErr ||= []).push(Math.abs(scene.shadow.rotation.y - HOUR_ANGLES[h]));
      const r = await pickOnScreen(ctx, { cls: 'dial-pick', items, answer: h, easy, hint: script.dial.fail });
      if (r === 'missed') missed = true;
    }
  } finally { scene.showHourTags(true); placePlayer(world, scene.dialStand); ctx.input.enabled = false; }
  return missed ? 'missed' : true;
}

// 3) 측우기: 소나기가 오면 측우기 속(단면)에 빗물이 차오르고, 비가 그치면 물 윗면과 같은 눈금 단추를 누른다
async function readGauge(ctx, easy) {
  const { world, dialogue } = ctx;
  const g = scene.gauge.position;
  scene.showGauge(true);
  world.setFixedCamera([g.x + 0.2, 4.5, g.z + 3.3], [g.x + 0.25, 4.15, g.z]); // 측우기 속이 크게 보이게(놀이 카메라 예외)
  const items = [1, 2, 3, 4, 5, 6].map(n => ({ text: `${n}`, sub: '눈금', at: scene.tickPoint(n) }));
  ctx.testHooks.gaugeLevels = [];
  let missed = false;
  try {
    for (const lv of GAUGE_ROUNDS) {
      scene.setRain(true);
      await dialogue.say(script.rain.shower); dialogue.close();
      await scene.fillGauge(lv);
      scene.setRain(false);
      ctx.testHooks.gaugeLevels.push(lv);
      await dialogue.say(script.rain.read); dialogue.close();
      const r = await pickOnScreen(ctx, { cls: 'gauge-pick', items, answer: lv - 1, easy, hint: script.rain.fail, width: 70 });
      if (r === 'missed') missed = true;
    }
  } finally { scene.setRain(false); scene.showGauge(false); placePlayer(world, scene.gaugeStand); ctx.input.enabled = false; }
  return missed ? 'missed' : true;
}

// 2) 자격루 한 장면(D-30 S-03): 물을 부으면 물그릇을 차례로 흘러 물통에 차오르고, 잣대가 떠올라 구슬이 굴러 가고, 인형이 종·북을 친다.
// 카메라가 움직이는 곳을 따라간다. 설명 대사는 넣지 않고 부분 이름만 잠깐 띄운다(출처 S31 문장보다 자세히 말하지 않는다)
async function clockScene(ctx) {
  const { world, audio } = ctx;
  const clock = scene.clock, u = clock.userData, tween = scene.tween;
  clock.updateWorldMatrix(true, true);
  const W = (x, y, z) => clock.localToWorld(new THREE.Vector3(x, y, z));
  const lm = c => new THREE.MeshLambertMaterial({ color: c });
  const made = [];
  const put = o => { clock.add(o); made.push(o); return o; };
  let lastTag = null; // 부분 이름은 한 번에 하나만
  const tag = (text, x, y, z) => { lastTag?.removeFromParent(); const t = lastTag = put(labelSprite(text, { size: 0.3 })); t.position.set(x, y, z); return t; };
  ctx.testHooks.clockActs = [];
  const act = k => ctx.testHooks.clockActs.push(CLOCK_STEPS[k]);
  // 카메라: 지금 자리에서 (cam, look)으로 옮겨 가며(앞쪽 60%), f(k)도 함께 부른다
  const cur = { cam: W(-2.2, 3.0, 3.0), look: W(-2.4, 2.6, 0) };
  const shot = (cam, look, seconds, f) => {
    const c0 = cur.cam.clone(), l0 = cur.look.clone(), c1 = W(...cam), l1 = W(...look);
    return tween(seconds, k => {
      const e = Math.min(1, k * 1.6), s = e * e * (3 - 2 * e);
      cur.cam.lerpVectors(c0, c1, s); cur.look.lerpVectors(l0, l1, s);
      world.setFixedCamera(cur.cam.toArray(), cur.look.toArray());
      f?.(k);
    });
  };
  world.setFixedCamera(cur.cam.toArray(), cur.look.toArray());
  world.player.visible = false; ctx.ui.classList.add('filming'); // 장면 동안 퀘스트 칸을 숨긴다(도입 장면과 같은 방식)
  // 0) 물 붓기: 물동이를 기울이면 물이 맨 위 물그릇으로, 다시 아래 물그릇으로 흘러내린다
  act(0); tag('물', -3, 4.1, 0.3); audio.play('water');
  const bucket = put(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.36, 12), lm(0x6b4a32))); bucket.position.set(-3.45, 3.75, 0.1);
  const stream = (x, y0, y1) => { const m = put(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 6), lm(0x6fb0d8))); m.position.set(x, y0, 0.05); m.scale.y = 0.001; m.userData.span = [y0, y1]; return m; };
  const falls = [stream(-3.05, 3.7, 3.0), stream(-2.4, 3.05, 2.2), stream(-0.95, 2.25, 1.4)];
  await shot([-2.0, 3.0, 2.9], [-2.2, 2.5, 0], 3.2, k => {
    bucket.rotation.z = -Math.min(1, k * 3) * 1.1;
    falls.forEach((m, i) => { const f = Math.max(0, Math.min(1, k * 3 - i * 0.7)); const [y0, y1] = m.userData.span; m.scale.y = Math.max(0.001, (y0 - y1) * f); m.position.y = y0 - (y0 - y1) * f / 2; });
  });
  // 1) 물이 긴 물통에 차오른다(물통 앞에 물 기둥을 보인다)
  act(1); tag('물통', 1.3, 3.1, 0.6); audio.play('water');
  const level = [-0.4, 0.4].map(dz => { const w = put(new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 1, 14), new THREE.MeshLambertMaterial({ color: 0x5a9ac0, transparent: true, opacity: 0.9 }))); w.position.set(1.3, 0.02, dz + 0.01); w.scale.y = 0.001; return w; });
  await shot([0.7, 1.9, 2.8], [1.3, 1.5, 0], 3, k => { for (const w of level) { w.scale.y = Math.max(0.001, 2.5 * k); w.position.y = 0.02 + 1.25 * k; } });
  falls.forEach(m => { m.visible = false; });
  // 2) 잣대가 떠오른다
  act(2); tag('잣대', 1.0, 3.5, 0.4); audio.play('tap');
  await shot([0.9, 2.8, 2.6], [1.4, 2.9, 0], 2, k => { for (const r of u.rods) r.position.y = r.userData.y0 + 0.55 * k; });
  // 3) 쇠구슬이 비탈 홈을 굴러 나무 상자로
  act(3); tag('쇠구슬', 2.0, 3.4, 0.4); audio.play('tap');
  const { from, to } = u.chute;
  await shot([2.2, 2.9, 2.6], [2.4, 2.5, 0], 1.8, k => { const f = Math.min(1, k * 1.2); u.ball.position.lerpVectors(from, to, f * f); u.ball.rotation.z = -f * 9; u.ball.visible = f < 1; });
  // 4) 나무 인형이 종·북을 친다
  act(4); tag('나무 인형', 3.4, 4.25, 0.3);
  let rang = 0;
  await shot([3.3, 3.0, 2.7], [3.4, 3.2, -0.1], 3.2, k => {
    u.puppets.forEach((p, i) => { const s = Math.max(0, Math.sin(k * 18 - i * 2)); p.rotation.x = -s * 0.5; p.position.y = 2.8 + s * 0.08; });
    const n = Math.floor(k * 3); if (n >= rang && n < 3) { rang = n + 1; audio.play('bell'); }
  });
  u.puppets.forEach(p => { p.rotation.x = 0; p.position.y = 2.8; });
  await ctx.wait(400);
  // 정리: 장면에서 더한 물·이름을 치우고 잣대·구슬을 제자리로
  made.forEach(o => o.removeFromParent());
  for (const r of u.rods) r.position.y = r.userData.y0;
  u.ball.position.copy(from); u.ball.visible = true; u.ball.rotation.z = 0;
  world.player.visible = true; ctx.ui.classList.remove('filming');
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

  // 장 도입(C-03): ① 소나기 내리는 한양, 서운관 마당의 측우기와 길가의 앙부일구를 위에서 ② 앙부일구의 그림자가 움직이고, 보루각의 자격루 인형이 종·북을 친다
  introScene(ctx) {
    const { world } = ctx;
    let off = null;
    return {
      shots: [
        { cam: [6, 11, 16], look: [-6, 1, -4], to: { cam: [-12, 9, 12], look: [-7, 1.5, -6] },
          act: () => { scene.setRain(true); } },
        { cam: [-8, 9.5, 11.5], look: [-8, 4.6, 4.4], to: { cam: [6.5, 3.3, 3.5], look: [9.6, 2.6, -4] },
          act: () => { scene.setRain(false); let t = 0; off = world.onUpdate(dt => { t += dt; scene.shadow.rotation.y = Math.PI + Math.sin(t * 0.6) * 1.1; }); setTimeout(() => scene.ringClock(), 3500); } },
      ],
      done: () => { off?.(); scene.setRain(false); scene.shadow.rotation.y = 0; },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 마을 가운데 박석 마당 앞, 학생 쪽(남쪽)을 본다
  portal: { at: [-4, -3], ry: 0 },

  enterStage(ctx, stage) {
    if (stage === 'minigame' || stage === 'quiz') { scene.gate.setOpen(0); placePlayer(ctx.world, SPOT); }
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
          if (!PEOPLE.includes(id)) return;
          const isNew = !heard.has(id);
          await sayAll(dialogue, townTalk(id, heard));
          heard.add(id); markTown(ctx, heard);
          if (heard.size === PEOPLE.length) { world.setGoal(null); hud.setCounter(null); stop(); setTimeout(resolve, 0); return; }
          if (isNew) await dialogue.say(script.more);
        },
      });
    });
    await sayAll(dialogue, script.heardAll); dialogue.close(); // 모두 들었으면 기구를 하나씩 직접 살펴본다(C-01)
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    world.closeView = true;
    PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = false; });
    world.setGoal(null);
    ctx.testHooks.j3Started = [];
    const parts = [];
    // 1) 앙부일구: 다가가서 살펴보면 시작(C-05)
    await waitInteract(ctx, { pos: scene.dialFront, quest: script.goals[1], label: '앙부일구 살펴보기', markY: 3.4 });
    ctx.testHooks.j3Started.push('dial');
    await sayAll(dialogue, script.dial.intro); dialogue.close();
    await showHowTo(ctx.ui, script.dial.howto);
    parts.push(await tryPart(ctx, easy => readDial(ctx, easy), script.dial.fail));
    await sayAll(dialogue, script.dial.done); dialogue.close();
    // 2) 자격루: 보루각에 가서 물을 부으면 한 장면으로 움직인다(점수에 넣지 않는 장면)
    await waitInteract(ctx, { pos: scene.clockFront, quest: script.goals[2], label: '자격루에 물 붓기', markY: 3.2 });
    ctx.testHooks.j3Started.push('clock');
    input.enabled = false;
    await clockScene(ctx);
    placePlayer(world, [scene.clockFront.x, scene.clockFront.z]);
    await sayAll(dialogue, script.clock.done); dialogue.close();
    // 3) 측우기: 서운관 마당에 가서 살펴보면 시작
    await waitInteract(ctx, { pos: scene.gaugeFront, quest: script.goals[3], label: '측우기 살펴보기', markY: 3 });
    ctx.testHooks.j3Started.push('gauge');
    await sayAll(dialogue, script.rain.intro); dialogue.close();
    await showHowTo(ctx.ui, script.rain.howto);
    parts.push(await tryPart(ctx, easy => readGauge(ctx, easy), script.rain.fail));
    await sayAll(dialogue, script.rain.done); dialogue.close();
    placePlayer(world, SPOT);
    return sumParts(parts);
  },
};
