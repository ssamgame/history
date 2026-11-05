// 현대편 6장 「민주주의와 경제 성장」(D-53): 1960~80년대 서울 거리(큰길, 간판 단 시멘트 건물, 전봇대).
// 「서울」 문으로 들어와 대학생·시민·공장 노동자 이야기를 아무 차례로 듣고(모두 들어야 고속도로 일꾼),
// 일꾼에게 가면 학생의 결심 → 1970년 7월 경부고속도로가 열리는 날(줄을 끊자 차들이 달린다) →
// ① 수출 공장에서 옷 만들기(재봉틀 박음질 → 상자 → 수출 트럭) ② 시민에게 말을 걸면 1988년 서울 올림픽 개회식 굴렁쇠 굴리기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite, toast } from '../../kit/play.js';
import { BUILD, holdFlag, cheerFlag } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, meet, minigameWithMeet, facingShare, sitDown, SEAT_Y } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { setWork, playAction } from '../../../core/motion.js';
import { handOf } from '../../../core/interact.js';
import { holdPress } from '../../ch5/work.js';
import { burning } from '../../kit/fire.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['student', 'citizen', 'worker'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const ring = (g, x, z, r = 0.9) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.visible = false; g.add(m); return m; };
function canvasBoard(w, h, px = 128) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  return { mesh, c: cv.getContext('2d'), cv, tex };
}
// 「수출」이라고 쓴 종이 상자(작은 영어 글씨는 뭉개져 보여 뺐다, 2026-11-05 선생님)
let exportTex = null;
function exportBox() {
  if (!exportTex) { const b = canvasBoard(0.5, 0.36, 128); b.c.fillStyle = '#c8a878'; b.c.fillRect(0, 0, b.cv.width, b.cv.height); b.c.fillStyle = '#7a2f24'; b.c.font = 'bold 34px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif'; b.c.textAlign = 'center'; b.c.textBaseline = 'middle'; b.c.fillText('수출', b.cv.width / 2, b.cv.height / 2); b.tex.needsUpdate = true; exportTex = b.tex; }
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.4), [mat(0xb8956a, 'cloth', 'object'), mat(0xb8956a, 'cloth', 'object'), new THREE.MeshLambertMaterial({ map: exportTex }), mat(0xb8956a, 'cloth', 'object'), new THREE.MeshLambertMaterial({ map: exportTex }), mat(0xb8956a, 'cloth', 'object')]);
  m.castShadow = true; return m;
}

// ── 무대(마을에서 떨어진 x 400) ──
// 경부고속도로 개통(탐험 끝 장면): 남북으로 뻗은 넓은 찻길, 가운데 줄과 일꾼들, 길 양쪽 구경꾼, 북쪽에 줄지어 선 차들
export const HWY = { edge: { style: 'forest', seed: 1970 },
  origin: [400, 0], ground: 'grass', groundColor: 0x7a8a5a, bounds: { x0: -14, x1: 14, z0: -24, z1: 12 },
  roads: [{ x: 0, z: -6, w: 9, d: 44, color: 0x45444a }],
  props: [{ type: 'tree', x: -11, z: -16, kind: 'poplar' }, { type: 'tree', x: 11, z: -12, kind: 'poplar' }, { type: 'flagpole', x: -6, z: -1.5 }, { type: 'flagpole', x: 6, z: -1.5 }],
  tape: 0, watch: [-9, 6],
};
// 수출 공장: 재봉틀 책상이 줄지어 있고, 동쪽에 상자 싸는 책상, 서쪽 문밖에 수출 트럭
export const FACTORY = { edge: { style: 'city', seed: 1964 },
  origin: [400, 0], ground: 'stone', groundColor: 0xa8a49a, bounds: { x0: -12, x1: 10, z0: -9, z1: 9 },
  props: [{ type: 'concrete', x: 2, z: -15, floors: 2, w: 16, color: 0xbab2a2, shop: false }],
  from: [0, 7], machine: [2.6, -1.2], pack: [6.5, 2.5], truck: [-9, 4],
  rows: [-4.5, -1.2, 2.1], cols: [-4.6, -1, 2.6],
};
// 올림픽 주경기장: 가운데 잔디밭, 둘레 붉은 달리기 길과 관중석
export const STADIUM = {
  origin: [400, 0], ground: 'grass', groundColor: 0x5f8f4a, nature: false, hill: 0.2, bounds: { x0: -22, x1: 22, z0: -12, z1: 12 },
  from: [-19, 0], marks: [[-12, -1.5], [-6, 1.5], [0, -1.5], [6, 1.5], [12, -1]], end: [19, 0], torch: [0, -27],
};

// ── 탐험 끝 장면: 1970년 7월 경부고속도로가 열리는 날. 줄을 끊자 차들이 남쪽(카메라)으로 달려온다 ──
export async function openingScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.opening.lines, A = HWY, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  // 길 가운데 흰 점선
  for (let z = -26; z < 14; z += 3) blk(g, 0.18, 0.02, 1.4, 0xe8e4d8, 0, 0.07, z, 'stone');
  // 끊을 줄(왼쪽 반·오른쪽 반)과 줄 기둥
  const halves = [-1, 1].map(s => { const h = new THREE.Group(); h.position.set(s * 4.4, 1.1, A.tape); g.add(h); const m = blk(h, 4.4, 0.12, 0.04, 0xc8282c, -s * 2.2, 0, 0, 'cloth'); m.castShadow = false; return h; });
  for (const s of [-1, 1]) blk(g, 0.12, 1.2, 0.12, 0xe8e4d8, s * 4.4, 0.6, A.tape, 'stone');
  const chiefs = [-1.4, 0, 1.4].map(x => person(g, x ? 'gentleman' : 'builder', x, A.tape - 0.9, 0));
  // 차 앞(모형의 -z)이 달려오는 남쪽(카메라)을 보게 돌려 놓는다(2026-11-05 선생님)
  const cars = [[-2, -9], [2, -12], [-2, -16], [2, -19]].map(([x, z], i) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = Math.PI; g.add(c); BUILD.truck(c, { color: [0x3f6a8a, 0x8a3a2a, 0x55603f, 0xd8c8a0][i] }); return c; });
  const looks = ['citizen', 'woman', 'student', 'schoolgirl', 'gentleman', 'kidModern', 'woman', 'citizen', 'builder', 'grandma'];
  const crowd = looks.map((look, i) => { const s = i % 2 ? 1 : -1, row = Math.floor(i / 2); const p = person(g, look, s * (5.8 + (row % 2) * 1.1), -0.5 + row * 1.6, 0); holdFlag(p); return p; });
  const C = a.at(0.6, 11.5), T = a.at(0, -3);
  const front = () => world.setFixedCamera([C.x, 2.8, C.z], [T.x, 1.3, T.z]); // 길 남쪽에서 구경꾼과 달려오는 차들을 본다
  crowd.forEach(p => face(p, C.x - a.at(0, 0).x, C.z - a.at(0, 0).z)); // 구경꾼은 카메라 쪽을 본다(D-45)
  const hook = ctx.testHooks.opening = { cut: false, cars: 0, crowd: crowd.length, cheers: 0, facing: 0 };
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI * 0.9);
  try {
    front();
    hook.facing = facingShare(world, crowd);
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    await say(L[1], chiefs[1]);
    dialogue.close();
    front();
    ctx.audio?.play?.('tap');
    // 끊긴 줄이 양쪽 기둥에서 아래로 늘어진다
    await wait(world, 0.8, k => halves.forEach((h, i) => { h.rotation.z = (i ? 1 : -1) * 1.3 * ease(k); }));
    hook.cut = true;
    chiefs.forEach((p, i) => { p.position.x = (i - 1) * 3.6; }); // 일꾼들이 길 밖으로 비켜선다
    chiefs[0].position.x = -5; chiefs[1].position.x = -6.2; chiefs[2].position.x = 5; // 가운데 사람도 찻길 밖으로(차가 지나가게)
    const c0 = cars.map(c => c.position.z);
    const go = wait(world, 4, k => cars.forEach((c, i) => { c.position.z = c0[i] + 14 * ease(Math.min(1, k * 1.2)); }));
    for (let n = 0; n < 2; n++) {
      ctx.audio?.play?.('correct');
      await wait(world, 0.9, k => crowd.forEach((p, i) => cheerFlag(p, Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI))));
      hook.cheers += 1;
    }
    await go;
    hook.cars = cars.filter((c, i) => c.position.z > c0[i] + 10).length;
    await dialogue.say(L[2]);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    a.dispose();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

async function leaveArena(ctx, a) {
  const { world, hud } = ctx;
  await ctx.fade?.(true);
  hud.setCounter(null); world.setGoal(null);
  setCarry(world.player, null);
  a.dispose();
  placePlayer(world, SPOT);
  world.camMode = 'follow'; world.snapCamera();
  ctx.input.enabled = false;
  await ctx.fade?.(false);
}

// 재봉틀 책상(앞이 -z): 책상, 재봉틀 몸통과 팔, 바늘, 천
function sewingDesk(g, x, z) {
  const d = new THREE.Group(); d.position.set(x, 0, z); g.add(d);
  blk(d, 1.3, 0.72, 0.7, 0x6b4a32, 0, 0.36, 0);
  blk(d, 0.42, 0.2, 0.24, 0x2a2a2a, 0.15, 0.82, -0.1, 'stone'); blk(d, 0.1, 0.32, 0.18, 0x2a2a2a, 0.32, 0.98, -0.1, 'stone'); blk(d, 0.5, 0.1, 0.16, 0x2a2a2a, 0.1, 1.12, -0.1, 'stone');
  const needle = blk(d, 0.02, 0.18, 0.02, 0xc8c8c8, -0.12, 0.96, -0.1, 'stone');
  blk(d, 0.4, 0.02, 0.4, 0xd8c8a0, -0.25, 0.73, 0.05, 'cloth');
  // 걸상(남쪽)
  blk(d, 0.6, 0.06, 0.55, 0x5e432c, 0, SEAT_Y - 0.03, 0.85);
  for (const [lx, lz] of [[-0.24, 0.62], [0.24, 0.62], [-0.24, 1.08], [0.24, 1.08]]) blk(d, 0.06, SEAT_Y - 0.06, 0.06, 0x5e432c, lx, (SEAT_Y - 0.06) / 2, lz);
  return { d, needle };
}

// ── 놀이 ①: 수출 공장에서 옷 만들기. 재봉틀에서 박음질 → 상자 싸는 책상 → 수출 트럭, 상자 셋 ──
export async function factoryPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.factory, A = FACTORY;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.factory = { stitches: 0, shirts: 0, boxes: 0, loaded: 0, drove: false };
  // 공장 벽(북·동), 서쪽은 트럭이 서는 문
  blk(g, 22, 3.6, 0.3, 0xc8c2b4, -1, 1.8, -8.8, 'stone'); blk(g, 0.3, 3.6, 18, 0xc8c2b4, 9.8, 1.8, 0, 'stone');
  // 재봉틀 책상들과 일하는 노동자(학생 자리만 비어 있다)
  const [mx, mz] = A.machine;
  let mine = null;
  for (const z of A.rows) for (const x of A.cols) {
    const s = sewingDesk(g, x, z);
    if (x === mx && z === mz) { mine = s; continue; }
    const p = person(g, (x + z) % 2 ? 'woman' : 'schoolgirl', x, z + 0.85, Math.PI); sitDown(p);
  }
  const shirtCanvas = canvasBoard(0.4, 0.4, 160); shirtCanvas.mesh.rotation.x = -Math.PI / 2; shirtCanvas.mesh.position.set(mx - 0.25, 0.745, mz + 0.05); g.add(shirtCanvas.mesh);
  const drawStitch = n => {
    const { c, cv } = shirtCanvas; c.fillStyle = '#d8c8a0'; c.fillRect(0, 0, cv.width, cv.height);
    c.strokeStyle = '#2f4a6a'; c.lineWidth = 4; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(12, cv.height / 2); c.lineTo(12 + (cv.width - 24) * n / P.stitches, cv.height / 2); c.stroke(); c.setLineDash([]);
    shirtCanvas.tex.needsUpdate = true;
  };
  // 상자 싸는 책상
  const [kx, kz] = A.pack; blk(g, 1.6, 0.8, 0.9, 0x7a5a3c, kx, 0.4, kz);
  const packer = person(g, 'woman', kx + 1.2, kz, -Math.PI / 2);
  // 수출 트럭(앞이 남쪽)
  const [tx, tz] = A.truck;
  const truck = new THREE.Group(); truck.position.set(tx, 0, tz); truck.rotation.y = Math.PI; g.add(truck); BUILD.truck(truck, { color: 0x3f6a8a }); // 앞이 떠나는 쪽(남쪽)
  const say = sayer(ctx);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  try {
    await ctx.fade?.(false);
    for (let b = 0; b < P.boxes; b++) {
      hud.setCounter(`${P.counter} ${b}/${P.boxes}`);
      // 박음질
      drawStitch(0);
      const mk = ring(g, mx, mz + 1.6, 0.7); mk.visible = true;
      const M = a.at(mx, mz);
      // 재봉틀 앞 걸상에 앉아 1인칭으로(2026-11-05 선생님): 대화 버튼(E)을 몇 초 꾹 누르는 동안 바늘이 오르내리며 박음질 선이 이어진다
      await waitInteract(ctx, { pos: a.at(mx, mz + 1.6), label: '재봉틀 앞에 앉기', r: 1.3 });
      ctx.input.enabled = false;
      const seat = a.at(mx, mz + 0.85); placePlayer(world, [seat.x, seat.z], Math.PI); world.player.visible = false;
      world.setFixedCamera([M.x + 0.05, 1.3, M.z + 0.95], [M.x - 0.15, 0.72, M.z - 0.05]); // 앉은 눈높이에서 재봉틀과 천을 내려다본다
      let tN = 0;
      hook.seated = true;
      const HP = a.at(mx, mz + 0.4);
      await holdPress(ctx, '꾹 눌러 박음질', new THREE.Vector3(HP.x, 1.2, HP.z), P.holdSec, k => {
        const on = ctx.input?.actionHeld?.(); tN += on ? 0.016 : 0;
        mine.needle.position.y = 0.96 - (on ? 0.06 * Math.abs(Math.sin(tN * 40)) : 0);
        const n = Math.floor(k * P.stitches * 4) / 4; if (n !== hook.stitchK) { hook.stitchK = n; drawStitch(n); }
      });
      hook.stitches += P.stitches; drawStitch(P.stitches); audio.play('tap');
      world.player.visible = true; hook.seated = false;
      ctx.input.enabled = false;
      mk.visible = false; mk.removeFromParent();
      hook.shirts += 1;
      if (!b) { await dialogue.say(P.sewn); dialogue.close(); }
      world.camMode = 'follow';
      // 옷을 들고 상자 싸는 책상으로
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.34), mat(0xd8c8a0, 'cloth', 'object')); // 다 만든 옷
      setCarry(world.player, shirt, 'arms');
      const m2 = ring(g, kx - 1.4, kz, 0.7); m2.visible = true;
      await waitInteract(ctx, { pos: a.at(kx - 1.4, kz), label: '상자에 담기', r: 1.3 });
      ctx.input.enabled = false; m2.removeFromParent();
      audio.play('tap');
      const box = exportBox(); setCarry(world.player, box, 'arms'); hook.boxes += 1;
      if (!b) { const K = a.at(kx, kz); world.setFixedCamera([K.x - 2.4, 1.9, K.z + 2.2], [K.x, 0.9, K.z]); await say({ who: 'worker', text: '상자에 「수출」이라고 쓰여 있지요? 다른 나라로 가는 옷이에요.' }, packer); dialogue.close(); world.camMode = 'follow'; }
      // 트럭에 싣기
      const m3 = ring(g, tx + 2, tz - 1.4, 0.8); m3.visible = true;
      await waitInteract(ctx, { pos: a.at(tx + 2, tz - 1.4), label: '트럭에 싣기', r: 1.5 });
      ctx.input.enabled = false; m3.removeFromParent();
      setCarry(world.player, null);
      box.position.set(-0.4 + (b % 2) * 0.8, 1.2 + Math.floor(b / 2) * 0.38, 1.3); // 짐칸(모형의 +z 쪽) box.rotation.set(0, 0, 0); truck.add(box);
      audio.play('correct'); hook.loaded += 1;
      toast(ctx, `○ 수출 상자 ${b + 1}`, 'good');
      ctx.input.enabled = true;
    }
    ctx.input.enabled = false;
    hud.setCounter(`${P.counter} ${P.boxes}/${P.boxes}`);
    // 트럭이 고속도로로 떠난다
    const T = a.at(tx, tz); world.setFixedCamera([T.x + 5, 2.6, T.z + 7], [T.x, 1, T.z + 2]);
    await dialogue.say(P.done[0]);
    const z0 = truck.position.z;
    await wait(world, 2.2, k => { truck.position.z = z0 + 14 * ease(k); });
    hook.drove = true;
    await dialogue.say(P.done[1]);
    dialogue.close();
  } finally {
    await leaveArena(ctx, a);
  }
  return true;
}

// 관중석: 운동장 둘레에 층층이 앉은 관중(한 덩어리로), 둘레 깃대에 여러 빛깔 깃발
function stands(g) {
  const st = new THREE.Group(); g.add(st);
  const colors = [0xc8402c, 0x2f6b9a, 0xe0b830, 0xe8e4d8, 0x3a8a4a, 0x8a3a8a];
  const head = new THREE.SphereGeometry(0.28, 6, 5), body = new THREE.BoxGeometry(0.5, 0.5, 0.4);
  const heads = new THREE.InstancedMesh(head, mat(0xe0b896, 'cloth'), 420), bodies = new THREE.InstancedMesh(body, new THREE.MeshLambertMaterial(), 420);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let n = 0;
  for (let tier = 0; tier < 5; tier++) {
    const rx = 30 + tier * 1.6, rz = 20 + tier * 1.6, h = 0.6 + tier * 0.8;
    const step = new THREE.Mesh(new THREE.RingGeometry(1, 1.06, 48).rotateX(-Math.PI / 2), mat(0x8a8478, 'stone')); step.scale.set(rx, 1, rz); step.position.y = h; st.add(step);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, h, 48, 1, true), mat(0x9a948a, 'stone')); wall.material.side = THREE.DoubleSide; wall.scale.set(rx, 1, rz); wall.position.y = h / 2; st.add(wall);
    for (let i = 0; i < 84 && n < 420; i++, n++) {
      const t = i / 84 * Math.PI * 2, x = Math.cos(t) * (rx + 0.8), z = Math.sin(t) * (rz + 0.8);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-x, -z));
      m.compose(new THREE.Vector3(x, h + 0.25, z), q, new THREE.Vector3(1, 1, 1)); bodies.setMatrixAt(n, m); bodies.setColorAt(n, c.set(colors[(i * 7 + tier) % colors.length]));
      m.compose(new THREE.Vector3(x, h + 0.75, z), q, new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(n, m);
    }
  }
  st.add(heads, bodies);
  for (let i = 0; i < 16; i++) { // 둘레 깃대(여러 나라를 뜻하는 여러 빛깔 깃발)
    const t = i / 16 * Math.PI * 2, x = Math.cos(t) * 26, z = Math.sin(t) * 16.5;
    blk(st, 0.08, 4, 0.08, 0xd8d8d8, x, 2, z, 'stone');
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.66), new THREE.MeshLambertMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide })); f.position.set(x + 0.5, 3.6, z); st.add(f);
  }
  const track = new THREE.Mesh(new THREE.RingGeometry(1, 1.16, 64).rotateX(-Math.PI / 2), mat(0xb0503a, 'earth')); track.scale.set(24, 1, 14); track.position.y = 0.04; st.add(track);
  return st;
}

// ── 놀이 ②: 1988년 서울 올림픽 개회식. 굴렁쇠를 굴리며 운동장을 가로지르고, 빛나는 곳마다 톡 쳐 준다 ──
export async function hoopPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.hoop, A = STADIUM;
  world.closeView = true;
  await ctx.fade?.(true);
  world.setMood('noon');
  const a = buildArena(world, A), g = a.group;
  stands(g);
  const banner = labelSprite('제24회 서울 올림픽 1988', { size: 1.6 }); banner.position.set(-11, 8.5, -24); g.add(banner);
  // 성화대(2026-11-05 선생님: 더 구체적으로): 관중석 앞 세 층 받침과 높은 기둥, 위에 넓은 성화 그릇(테 무늬), 기둥 옆 오르는 계단과 점화대.
  // 성화를 든 주자가 계단을 올라 그릇에 불을 붙이면 큰 불꽃(kit/fire.js)이 타오른다
  const [cx, cz] = A.torch, TOP = 9;
  [[5, 0.6], [3.8, 0.6], [2.6, 0.6]].forEach(([w, h], i) => blk(g, w, h, w, [0xc8c0b0, 0xb8b0a0, 0xa8a090][i], cx, 0.3 + i * 0.6, cz, 'stone'));
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, TOP - 1.8, 12), mat(0xd8d0c0, 'stone')); col.position.set(cx, 1.8 + (TOP - 1.8) / 2, cz); col.castShadow = true; g.add(col);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.78 - i * 0.02, 0.05, 6, 20), mat(0xc8a050, 'stone')); r.rotation.x = Math.PI / 2; r.position.set(cx, 3 + i * 1.6, cz); g.add(r); } // 금빛 띠
  const cup = new THREE.Mesh(new THREE.LatheGeometry([[0.5, 0], [1.6, 0.5], [2.1, 1.2], [2.2, 1.35], [2.0, 1.35]].map(([x, y]) => new THREE.Vector2(x, y)), 24), mat(0xc8a050, 'stone')); cup.material = cup.material.clone(); cup.material.side = THREE.DoubleSide; cup.position.set(cx, TOP, cz); cup.castShadow = true; g.add(cup);
  for (let i = 0; i < 12; i++) { const sh = (TOP - 0.5) / 12; blk(g, 1.6, sh * (i + 1), 0.32, 0xb8b0a0, cx + 2.2, sh * (i + 1) / 2, cz + 3.9 - i * 0.3, 'stone'); } // 점화대로 오르는 계단(남쪽·동쪽)
  blk(g, 1.6, 0.2, 1.4, 0xb8b0a0, cx + 2.2, TOP - 0.4, cz + 0.4, 'stone'); // 그릇 옆 점화대
  const flameFx = burning(world, { parent: g, x: cx, y: TOP + 0.9, z: cz, size: 2.6, level: 0 }), flame = flameFx.group;
  const runner = person(g, 'student', cx + 2.2, cz + 4.6, Math.PI); runner.visible = false;
  const torch = new THREE.Group(); blk(torch, 0.08, 0.6, 0.08, 0xd8c070, 0, 0, 0, 'stone'); const tf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xffa030 })); tf.position.y = 0.45; torch.add(tf); // 성화 봉
  setCarry(runner, torch, 'side');
  const hook = ctx.testHooks.hoop = { marks: 0, rolled: 0, lit: false };
  // 굴렁쇠와 막대
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 24), mat(0x8a8a88, 'stone', 'object')); hoop.castShadow = true; g.add(hoop);
  // 막대(2026-11-05 선생님: 손과 굴렁쇠가 맞게): 들고 다니게 붙이지 않고, 프레임마다 오른손에서 굴렁쇠 뒤쪽 테까지 잇는다. 오른팔은 앞으로 내민다
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 5), mat(0x6b4a32, 'wood', 'object')); stick.castShadow = true; g.add(stick);
  const reachArm = playAction(world.player, { dur: 9999, fadeIn: 0.3, fadeOut: 0.1, name: 'hoop', pose: () => ({ arms: [null, [-0.75, 0, -0.12]] }) });
  void reachArm;
  const vH = new THREE.Vector3(), vC = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI / 2);
  const O = a.at(0, 0), last = new THREE.Vector3().copy(world.player.position);
  let spin = 0;
  const off = world.onUpdate(dt => { // 굴렁쇠는 학생 앞에서 굴러간다
    const pl = world.player, fwd = new THREE.Vector3(Math.sin(pl.rotation.y), 0, Math.cos(pl.rotation.y));
    hoop.position.set(pl.position.x - O.x + fwd.x * 0.95, 0.46, pl.position.z - O.z + fwd.z * 0.95);
    hoop.rotation.set(0, pl.rotation.y + Math.PI / 2, 0);
    const d = last.distanceTo(pl.position); last.copy(pl.position); hook.rolled += d;
    spin += d / 0.42 + dt * 2; hoop.rotateZ(-spin);
    handOf(pl, 1).getWorldPosition(vH); g.worldToLocal(vH);
    vC.set(hoop.position.x - fwd.x * 0.3, 0.46 + 0.3, hoop.position.z - fwd.z * 0.3); // 굴렁쇠 뒤쪽 위 테(학생 쪽)
    const dir = vC.clone().sub(vH), len = dir.length();
    stick.position.copy(vH).addScaledVector(dir, 0.5); stick.scale.set(1, len, 1); stick.quaternion.setFromUnitVectors(up, dir.normalize());
    hook.stickGap = Math.hypot(vC.x - hoop.position.x, vC.z - hoop.position.z);
  });
  try {
    await ctx.fade?.(false);
    for (const l of P.start) await dialogue.say(l);
    dialogue.close();
    for (const [i, [x, z]] of A.marks.entries()) {
      hud.setCounter(`${P.counter} ${i}/${A.marks.length}`);
      const mk = ring(g, x, z, 0.8); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(x, z), label: '굴렁쇠 톡 치기', r: 1.4 });
      ctx.input.enabled = false;
      mk.removeFromParent();
      audio.play('tap'); hook.marks += 1;
      toast(ctx, i === A.marks.length - 1 ? '○ 끝까지 굴렸어요' : '○ 톡!', 'good');
      ctx.input.enabled = true;
    }
    ctx.input.enabled = false;
    hud.setCounter(`${P.counter} ${A.marks.length}/${A.marks.length}`);
    // 성화대에 불이 붙고 관중이 환호
    const F = a.at(cx, cz); world.setFixedCamera([F.x + 10, 8.5, F.z + 13], [F.x + 1, 8.6, F.z]); // 관중석 위에서 성화대를 가까이
    // 성화 주자가 계단을 올라 점화대에 서서 그릇에 불을 붙인다
    runner.visible = true;
    const r0 = new THREE.Vector3(cx + 2.2, 0, cz + 4.6), r1 = new THREE.Vector3(cx + 2.2, TOP - 0.3, cz + 0.4);
    await wait(world, 3.2, k => { runner.position.lerpVectors(r0, r1, ease(k)); face(runner, cx + 2.2, cz - 2); });
    face(runner, cx, cz);
    await playAction(runner, { dur: 0.8, fadeIn: 0.15, fadeOut: 0.01, name: 'light', pose: t => { const u = Math.min(1, t / 0.6); return { arms: [null, [-2.4 * u, 0, 0.3 * u]] }; } }); // 성화 봉을 그릇 쪽으로 높이 든다
    hook.lit = true; audio.play('correct'); hook.cauldron = true;
    await wait(world, 1.6, k => flameFx.setLevel(0.2 + 0.8 * ease(k)));
    for (const l of P.end) await dialogue.say(l);
    dialogue.close();
  } finally {
    off(); const pu = world.player.userData; pu.act?.resolve?.(); pu.act = null; stick.removeFromParent();
    world.setMood(base.mood);
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h6', mood: 'noon', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'citizen', 'worker', 'builder'],
  spot: SPOT,
  layout: {
    // 1960~80년대 서울: 검은 아스팔트 큰길, 간판을 단 3~4층 시멘트 건물과 가게, 전봇대와 가로수, 멀리 높은 빌딩들
    ground: 'stone', groundColor: 0xa8a49a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.2,
    skyline: { style: 'concrete', color: 0x5a5c60 },
    roads: [{ x: 0, z: 2, w: 34, d: 5, color: 0x55545a }],
    props: [
      { type: 'concrete', x: -10, z: -12, w: 9, d: 5, floors: 4, color: 0xc8c2b4, sign: '약국', awning: 0x2f6b5e },
      { type: 'western', x: 1, z: -13, w: 10, d: 6, h: 12, color: 0x9a948a },
      { type: 'concrete', x: 12, z: -12, w: 8, d: 5, floors: 3, color: 0xd6cfc0, sign: '전파사', awning: 0x8a2f24 },
      { type: 'poles', x: -14, z: -7.5, n: 6, gap: 6 },
      { type: 'crowd', x: -9, z: -3.5, n: 10, cols: 2, looks: ['student', 'schoolgirl', 'citizen', 'woman'], flags: 0.6, face: 0 },
      { type: 'flagpole', x: 6, z: -6 },
      { type: 'truck', x: -12, z: 7.5, ry: Math.PI / 2, color: 0x3f6a8a },
      { type: 'concrete', x: 18.5, z: 6, w: 6, d: 5, floors: 2, color: 0xbab2a2, ry: -Math.PI / 2, sign: '다방', awning: 0x6b4a32 },
      { type: 'tree', x: -14.5, z: -3, kind: 'poplar' }, { type: 'tree', x: 15, z: 3, kind: 'poplar' }, { type: 'lamp', x: 9, z: 4.8 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x9a948a, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x9a948a, solid: false },
    ],
    npcs: [
      { id: 'student', look: 'student', x: -3, z: 6, ry: Math.PI * 0.8 },
      { id: 'builder', look: 'builder', x: 7, z: 5.5, ry: -Math.PI * 0.6, work: 'hammer' },
      { id: 'citizen', look: 'citizen', x: 1, z: -3, ry: 0 },
      { id: 'worker', look: 'woman', x: -5.6, z: 3.6, ry: Math.PI * 0.6 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 「고속도로 건설 사무소」·「올림픽 안내소」. 안내판 글은 대사·장면·놀이로 옮겼다
    signs: [{ id: 'signRoad', title: '고속도로 건설 사무소', x: -10, z: -9.4, ry: 0, plaque: { y: 2.55, back: 0.45 } },
      { id: 'signOlympic', title: '올림픽 안내소', x: 12, z: -9.4, ry: 0, plaque: { y: 2.55, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.factory, ownDone: true, goal: script.goals[3], play: ctx => factoryPlay(ctx) },
    { ...script.parts.hoop, goal: script.goals[4], intro: meet('citizen', '시민과 이야기하기', script.parts.hoop.intro), play: ctx => hoopPlay(ctx) },
  ],
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '서울', 3.2, GATE_Z - 1.6);
    world.closeView = true;
    return { gate, board };
  },
});

// 장 도입(C-03): ① 다시 일어서는 사람들(일꾼·노동자) ② 민주주의를 지키려는 학생과 시민. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  // 장 도입(2026-11-05 선생님: 태극기 대신 저마다 제자리에서 일하는 모습): ① 건설 현장(망치질·벽돌 나르기) ② 공장의 재봉틀·가발 만들기와 시장 가게
  const site = new THREE.Group(), shop = new THREE.Group(); site.visible = shop.visible = false; L.add(site, shop);
  const add = (g, look, x, z, ry) => person(g, look, x, z, ry);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) blk(site, 0.5, 0.25, 0.3, 0x9a4a32, -2.9 + j * 0.52 + i * 0.26, 0.13 + i * 0.26, 3.4, 'stone'); // 벽돌 더미
  blk(site, 2.6, 1.4, 0.3, 0x9a4a32, 1.6, 0.7, 3.0, 'stone'); // 쌓아 올리는 벽
  const b1 = setWork(add(site, 'builder', 0.9, 3.7, 0), 'hammer'), b2 = setWork(add(site, 'builder', 2.4, 3.7, 0), 'hammer');
  const carrier = add(site, 'builder', -1.2, 4.4, Math.PI / 2); setCarry(carrier, (() => { const m = new THREE.Group(); for (let i = 0; i < 3; i++) blk(m, 0.5, 0.22, 0.3, 0x9a4a32, 0, i * 0.23, 0, 'stone'); return m; })(), 'arms');
  // 공장: 재봉틀 둘(일하는 사람이 카메라 쪽을 보게 책상을 돌려 놓는다), 가발 틀이 놓인 책상
  const sewers = [-3, -1.5].map(x => { const sd = sewingDesk(shop, x, 3.6); sd.d.rotation.y = Math.PI; const p = add(shop, 'woman', x, 3.6 - 0.85, 0); sitDown(p); setWork(p, 'sew'); return p; });
  blk(shop, 1.2, 0.75, 0.6, 0x6b4a32, 0.3, 0.375, 3.6);
  for (const dx of [-0.35, 0.35]) { blk(shop, 0.05, 0.25, 0.05, 0x3a3a3a, 0.3 + dx, 0.875, 3.6, 'stone'); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xe0c8a8, 'cloth', 'object')); hd.position.set(0.3 + dx, 1.1, 3.6); shop.add(hd); const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(0x1e1a16, 'cloth', 'object')); hair.position.set(0.3 + dx, 1.13, 3.6); shop.add(hair); } // 가발 틀
  const wig = setWork(add(shop, 'schoolgirl', 0.3, 2.9, 0), 'sew');
  // 시장 가게: 노점과 상인, 물건을 고르는 손님
  const stall = new THREE.Group(); stall.position.set(2.8, 0, 3.4); shop.add(stall); BUILD.stall(stall, { w: 2.4 });
  const seller = add(shop, 'grandma', 2.8, 2.5, 0), buyer = add(shop, 'citizen', 3.9, 4.6, -Math.PI * 0.8);
  void b1; void b2; void sewers; void wig; void seller; void buyer;
  const hide = on => { for (const id of [...PEOPLE, 'builder']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const show = list => { for (const o of [site, shop]) o.visible = list.includes(o); };
  const wi = (ctx.testHooks || {}).workIntro = { flags: 0, workers: 0 };
  return {
    shots: [
      { cam: [0.6, 2.2, 10.5], look: [0, 1.1, 3.6], to: { cam: [0.4, 2.2, 10], look: [0, 1.1, 3.6] }, act: () => { hide(false); show([site]); wi.workers += 3; } },
      { cam: [0.2, 2.4, 10.5], look: [0, 1.0, 3.4], to: { cam: [0.2, 2.3, 10], look: [0, 1.0, 3.4] }, act: () => { show([shop]); wi.workers += 5; } },
    ],
    done: () => { hide(true); site.removeFromParent(); shop.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene;

export default {
  ...base,
  anyOrder: true,
  introScene,
  portal: { at: [0, 3.4], ry: 0 },
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 일꾼에게 가면 학생의 결심 → 경부고속도로가 열리는 날
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'builder', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await openingScene(ctx);
  },
  minigame: ctx => minigameWithMeet(base, ctx),
};
