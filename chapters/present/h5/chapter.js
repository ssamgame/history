// 현대편 5장 「전쟁 뒤의 삶」(D-52): 1950년대 부산 피란민 마을(비탈의 판잣집, 우물, 항구).
// 「피란민 마을」 문으로 들어와 행상 아주머니·밀면집 할머니·학생 이야기를 아무 차례로 듣고(모두 들어야 피란민 할아버지),
// 할아버지에게 가면 학생의 결심 → 구호물품 밀가루 포대를 나눠 받는 줄 →
// ① 밀면 만들기(반죽 → 국수틀 → 찬물에 헹구기 → 손님상) ② 할아버지에게 말을 걸면 1983년 이산가족 찾기(벽보 쓰기 → 붙이기 → 방송 → 만남).
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, toast } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, meet, minigameWithMeet, facingShare, sitDown, SEAT_Y } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['mother', 'grandma', 'student'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const cyl = (g, rt, rb, h, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
const ring = (g, x, z, r = 0.9) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.visible = false; g.add(m); return m; };
const sack = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.34), mat(0xe8e0cc, 'cloth', 'object')); m.castShadow = true; return m; };
const bowl = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.14, 12), mat(0xd8d0c0, 'stone', 'object')); g.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 12), mat(0xe8d8a8, 'grain', 'object')); n.position.y = 0.06; g.add(n); return g; };
function canvasBoard(w, h, px = 128) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  return { mesh, c: cv.getContext('2d'), cv, tex };
}

// ── 무대(마을에서 떨어진 x 400) ──
// 구호물품 배급(탐험 끝 장면): 북쪽 탁자와 트럭의 밀가루 포대, 남쪽으로 길게 줄 선 피란민. 카메라는 탁자 쪽에서 줄을 본다
export const RELIEF = { edge: { style: 'shanty', seed: 1953 },
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -14, x1: 14, z0: -12, z1: 14 },
  props: [{ type: 'shack', x: -10, z: 4 }, { type: 'shack', x: 10, z: 6 }, { type: 'shack', x: -11, z: -6 }, { type: 'well', x: 9, z: -4 }],
  table: [0, -6], watch: [-5, 3],
};
// 밀면집 부엌 마당: 반죽 함지 → 국수틀과 가마솥 → 찬물 함지, 남쪽에 손님 상 셋
export const KITCHEN = { edge: { style: 'shanty', seed: 527 },
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -10, x1: 10, z0: -8, z1: 10 },
  props: [{ type: 'shack', x: 0, z: -11 }, { type: 'jars', x: -8.5, z: -6 }, { type: 'woodpile', x: 8.5, z: -6 }],
  from: [0, 8], st: { dough: [-4.5, -3.5], press: [0.5, -4.5], rinse: [5, -3] }, tables: [[-5, 4], [0, 5.2], [5, 4]],
};
// 1983년 이산가족 찾기: 북쪽 벽에 벽보가 빼곡하고, 서쪽에 벽보 쓰는 책상, 동쪽에 방송 촬영 자리
export const PLAZA = { edge: { style: 'city', seed: 1983 },
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a898, bounds: { x0: -14, x1: 14, z0: -8, z1: 12 },
  props: [{ type: 'concrete', x: -10, z: -15, floors: 4, w: 8, color: 0xc8c2b4, shop: false }, { type: 'concrete', x: 10, z: -15, floors: 5, w: 8, color: 0xbab2a2, shop: false }, { type: 'tree', x: -12, z: 9, kind: 'poplar' }],
  from: [0, 10], desk: [-7, 3], wall: [-2, -8.4], studio: [7, -2],
};

// ── 탐험 끝 장면: 구호물품 밀가루를 나눠 받는 줄(줄 선 사람들이 탁자 쪽 카메라를 본다) ──
export async function reliefScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.relief.lines, A = RELIEF, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const [tx, tz] = A.table;
  blk(g, 3.4, 0.8, 1, 0x6b4a32, tx, 0.4, tz);
  const truck = new THREE.Group(); truck.position.set(tx - 5, 0, tz - 2); truck.rotation.y = Math.PI / 2; g.add(truck); BUILD.truck(truck, { color: 0x55603f });
  for (let i = 0; i < 4; i++) { const s = sack(); s.position.set(tx - 0.9 + i * 0.6, 0.8 + 0.31, tz - 0.3); g.add(s); }
  const workers = [person(g, 'gentleman', tx - 2.2, tz - 0.4, 0), person(g, 'citizen', tx + 2.2, tz - 0.4, 0)]; // 카메라(탁자 뒤)를 가리지 않게 탁자 양 끝에
  const looks = ['woman', 'grandma', 'peasant', 'kidModern', 'citizen', 'woman', 'grandma', 'student', 'peasant', 'woman', 'citizen', 'schoolgirl'];
  const line = looks.map((look, i) => person(g, look, tx + Math.sin(i * 0.8) * 0.5, tz + 1.5 + i * 1.15, Math.PI));
  const hook = ctx.testHooks.relief = { people: line.length, given: 0, facing: 0 };
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI * 0.8);
  const C = a.at(tx + 0.4, tz - 3.4), T = a.at(tx, tz + 6);
  const view = () => world.setFixedCamera([C.x, 4.4, C.z], [T.x, 1, T.z]); // 탁자 뒤 높은 곳에서 줄 선 사람들의 얼굴을 내려다본다
  try {
    view();
    hook.facing = facingShare(world, line);
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    for (let n = 0; n < 2; n++) { // 맨 앞 사람이 포대를 받아 안고 옆으로 비켜나고, 줄이 한 칸씩 앞으로
      const first = line.shift(); setCarry(first, sack(), 'arms');
      const f0 = first.position.clone(), p0 = line.map(p => p.position.clone()), side = n ? 1 : -1;
      await wait(world, 1.6, k => {
        first.position.set(f0.x + side * 5 * ease(k), 0, f0.z + 2 * ease(k)); face(first, f0.x + side * 9, f0.z + 3);
        line.forEach((p, i) => { p.position.z = p0[i].z - 1.15 * ease(k); });
      });
      first.visible = false; hook.given += 1;
    }
    await say(L[1], line[0]);
    dialogue.close();
    view();
    await dialogue.say(L[2]);
    dialogue.close();
    void workers;
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

// ── 놀이 ①: 밀면 만들기. 자리마다 대화 버튼을 여러 번 눌러 반죽·국수틀·헹구기를 하고, 손님상에 밀면을 낸다 ──
export async function noodlePlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.noodle, A = KITCHEN;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.noodle = { steps: [], presses: 0, served: 0 };
  const { dough: D, press: R, rinse: N } = A.st;
  // 반죽 함지와 반죽 덩이
  blk(g, 1.6, 0.7, 1, 0x6b4a32, D[0], 0.35, D[1]);
  cyl(g, 0.55, 0.4, 0.22, 0x8a6a48, D[0], 0.81, D[1]);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(0xf0e6cc, 'cloth', 'object')); ball.position.set(D[0], 0.9, D[1]); ball.scale.set(1.2, 0.35, 1.2); g.add(ball);
  // 가마솥(아궁이 위)과 국수틀
  blk(g, 1.6, 0.7, 1.4, 0x7a6a5a, R[0], 0.35, R[1], 'stone');
  cyl(g, 0.6, 0.45, 0.4, 0x2a2a2a, R[0], 0.9, R[1], 'stone');
  const steam = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })); steam.scale.set(1.2, 0.5, 1.2); steam.position.set(R[0], 1.25, R[1]); g.add(steam);
  for (const s of [-1, 1]) blk(g, 0.12, 2.2, 0.12, 0x5a3f2a, R[0] + s * 0.9, 1.1, R[1] - 0.2);
  blk(g, 2, 0.14, 0.2, 0x5a3f2a, R[0], 2.2, R[1] - 0.2);
  const lever = new THREE.Group(); lever.position.set(R[0] - 0.9, 2.05, R[1] - 0.2); g.add(lever); blk(lever, 2.2, 0.1, 0.1, 0x6b4a32, 1.1, 0, 0);
  const noodles = new THREE.Group(); noodles.position.set(R[0], 1.3, R[1]); noodles.visible = false; g.add(noodles);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), mat(0xe8d8a8, 'grain', 'object')); m.position.set((i % 3 - 1) * 0.08, 0, (Math.floor(i / 3) - 1) * 0.08); noodles.add(m); }
  // 찬물 함지
  blk(g, 1.4, 0.6, 1, 0x6b4a32, N[0], 0.3, N[1]);
  const water = cyl(g, 0.5, 0.5, 0.06, 0x6a9ab8, N[0], 0.64, N[1], 'stone');
  const grandma = person(g, 'grandma', R[0] + 1.6, R[1] + 0.4, 0);
  // 손님 상과 손님(상 뒤에서 남쪽을 보고 앉는다)
  const guests = A.tables.map(([x, z], i) => { // 상 뒤 걸상에 앉아 남쪽(학생)을 본다
    blk(g, 1.4, 0.5, 0.9, 0x7a5a3c, x, 0.25, z); blk(g, 0.6, 0.06, 0.6, 0x6b4a32, x, SEAT_Y - 0.03, z - 1.05);
    for (const [lx, lz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) blk(g, 0.06, SEAT_Y - 0.06, 0.06, 0x5e432c, x + lx, (SEAT_Y - 0.06) / 2, z - 1.05 + lz);
    const p = person(g, ['citizen', 'peasant', 'woman'][i], x, z - 1.2, 0); sitDown(p); return p;
  });
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx), total = P.steps.length + 1;
  try {
    await ctx.fade?.(false);
    for (const [i, st] of P.steps.entries()) {
      hud.setCounter(`${P.counter} ${i}/${total}`);
      const [sx, sz] = A.st[st.id], mk = ring(g, sx, sz + 1.4); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(sx, sz + 1.4), label: st.act, r: 1.4 });
      ctx.input.enabled = false;
      mk.visible = false;
      const S = a.at(sx, sz); world.setFixedCamera([S.x + 2.2, 2.6, S.z + 3.6], [S.x, 1, S.z]);
      await say(st.line, grandma);
      dialogue.close();
      world.setFixedCamera([S.x + 2.2, 2.6, S.z + 3.6], [S.x, 1, S.z]);
      for (let k = 0; k < st.presses; k++) {
        if (k) { ctx.input.enabled = true; await waitInteract(ctx, { pos: a.at(sx, sz + 1.4), label: `${st.act} ${k + 1}/${st.presses}`, r: 1.4 }); ctx.input.enabled = false; }
        audio.play('tap'); hook.presses += 1;
        if (st.id === 'dough') await wait(world, 0.4, u => { const s = 0.35 + (k + u) / st.presses * 0.65; ball.scale.set(1.2 - 0.3 * (k + u) / st.presses, s, 1.2 - 0.3 * (k + u) / st.presses); });
        if (st.id === 'press') { if (!k) ball.visible = false; noodles.visible = true; await wait(world, 0.4, u => { lever.rotation.z = -0.35 * Math.sin(u * Math.PI); noodles.scale.y = (k + u) / st.presses; noodles.position.y = 1.6 - 0.3 * (k + u) / st.presses; }); }
        if (st.id === 'rinse') { noodles.visible = false; await wait(world, 0.6, u => { water.position.y = 0.64 + Math.sin(u * Math.PI * 4) * 0.03; }); }
      }
      hook.steps.push(st.id);
      toast(ctx, `○ ${st.act}`, 'good');
      world.camMode = 'follow';
    }
    // 손님상에 밀면을 낸다
    hud.setCounter(`${P.counter} ${P.steps.length}/${total}`);
    for (const [i, gu] of guests.entries()) {
      setCarry(world.player, bowl(), 'arms');
      const [x, z] = A.tables[i], mk = ring(g, x, z + 1.3); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(x, z + 1.3), label: '밀면 내기', r: 1.4 });
      ctx.input.enabled = false;
      mk.removeFromParent();
      setCarry(world.player, null);
      const b = bowl(); b.position.set(x, 0.57, z - 0.2); g.add(b);
      audio.play('correct'); hook.served += 1;
      await say(P.serve[i], gu);
      dialogue.close();
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${total}/${total}`);
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
  } finally {
    await leaveArena(ctx, a);
  }
  return true;
}

// ── 놀이 ②: 1983년 이산가족 찾기. 할아버지 이야기대로 벽보 빈칸을 고르고, 벽에 붙이고, 방송에 나가 동생을 만난다 ──
export async function familyPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.family, A = PLAZA;
  world.closeView = true;
  await ctx.fade?.(true);
  world.setMood('noon');
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.family = { filled: [], posted: false, aired: false, met: false };
  // 북쪽 벽보 벽: 흰 종이가 빼곡하다
  blk(g, 18, 3, 0.3, 0x9a948a, A.wall[0], 1.5, A.wall[1] - 0.2, 'stone');
  const papers = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.65), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 }), 120); g.add(papers);
  const mm = new THREE.Matrix4();
  for (let i = 0; i < 120; i++) { const x = A.wall[0] - 8.4 + (i % 30) * 0.58, y = 0.6 + Math.floor(i / 30) * 0.7; if (Math.abs(x - A.wall[0]) < 0.6 && y < 2) { mm.makeTranslation(0, -9, 0); } else mm.makeTranslation(x, y, A.wall[1] - 0.03 + (i % 3) * 0.002); papers.setMatrixAt(i, mm); }
  // 벽보 쓰는 책상, 방송 자리(큰 텔레비전과 촬영기)
  const [dx, dz] = A.desk; blk(g, 1.6, 0.75, 0.8, 0x6b4a32, dx, 0.375, dz);
  const [sx, sz] = A.studio;
  const tv = new THREE.Group(); tv.position.set(sx + 1.5, 0, sz - 1.4); tv.scale.setScalar(1.8); tv.rotation.y = -0.5; g.add(tv); BUILD.tv(tv);
  for (const [ox, oz] of [[-2.8, 1.6], [-1.6, 3]]) { const c = new THREE.Group(); c.position.set(sx + ox, 0, sz + oz); g.add(c); for (const r of [0, 2.1, 4.2]) { const l = blk(c, 0.05, 1.3, 0.05, 0x3a3a3a, Math.sin(r) * 0.25, 0.62, Math.cos(r) * 0.25, 'stone'); l.rotation.z = Math.sin(r) * 0.2; } blk(c, 0.4, 0.35, 0.6, 0x2a2a2a, 0, 1.4, 0, 'stone'); }
  const host = person(g, 'gentleman', sx - 0.6, sz, Math.PI / 6);
  const sister = person(g, 'grandma', sx + 0.8, sz - 0.5, -Math.PI / 6); sister.visible = false;
  const grandpa = person(g, 'peasant', dx + 1.4, dz + 0.4, -Math.PI / 2);
  const crowd = ['citizen', 'woman', 'grandma', 'gentleman', 'peasant', 'woman', 'citizen', 'grandma'].map((look, i) => { const p = person(g, look, -9 + i * 2.4, -5.8 + (i % 2) * 0.7, Math.PI); return p; });
  // 벽보(캔버스)
  const poster = canvasBoard(0.9, 1.2, 160);
  const drawPoster = () => {
    const { c, cv } = poster; c.fillStyle = '#f6f0de'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#2b241c'; c.textAlign = 'center'; c.font = 'bold 22px sans-serif'; c.fillText('가족을 찾습니다', cv.width / 2, 34);
    P.fields.forEach((f, i) => { c.font = '15px sans-serif'; c.fillText(f.label, cv.width / 2, 72 + i * 42); c.font = 'bold 19px sans-serif'; c.fillText(hook.filled[i] || '(     )', cv.width / 2, 94 + i * 42); });
    poster.tex.needsUpdate = true;
  };
  drawPoster();
  poster.mesh.rotation.x = -Math.PI / 2; poster.mesh.position.set(dx, 0.77, dz); g.add(poster.mesh);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    // ① 벽보 쓰기
    hud.setCounter(`${P.counter} 0/3`);
    let mk = ring(g, dx, dz + 1.4); mk.visible = true;
    await waitInteract(ctx, { pos: a.at(dx, dz + 1.4), label: '벽보 쓰기', r: 1.5 });
    ctx.input.enabled = false; mk.removeFromParent();
    await say(P.story, grandpa);
    const B = a.at(dx, dz); world.setFixedCamera([B.x + 0.2, 2.3, B.z + 1.5], [B.x, 0.8, B.z]);
    for (const f of P.fields) {
      for (;;) {
        ctx.testHooks.choice = f.options.indexOf(f.answer);
        const k = await dialogue.choose({ who: 'guide', text: `「${f.label}」 칸에 무엇을 쓸까?` }, f.options);
        ctx.testHooks.choice = null;
        if (f.options[k] === f.answer) break;
        audio.play('wrong'); await dialogue.say({ who: 'guide', text: `× ${P.wrong}` });
      }
      hook.filled.push(f.answer); drawPoster(); audio.play('tap');
    }
    dialogue.close();
    toast(ctx, '○ 벽보를 다 썼어요', 'good');
    world.camMode = 'follow';
    // ② 벽보 붙이기
    hud.setCounter(`${P.counter} 1/3`);
    g.remove(poster.mesh); poster.mesh.rotation.set(0, 0, 0); poster.mesh.position.set(0, 0, 0); setCarry(world.player, poster.mesh, 'arms');
    const [wx, wz] = A.wall;
    mk = ring(g, wx, wz + 1.4); mk.visible = true;
    await waitInteract(ctx, { pos: a.at(wx, wz + 1.4), label: P.wall.act, r: 1.5 });
    ctx.input.enabled = false; mk.removeFromParent();
    setCarry(world.player, null); poster.mesh.position.set(wx, 1.4, wz + 0.02); g.add(poster.mesh);
    audio.play('tap'); hook.posted = true;
    const Wv = a.at(wx, wz); world.setFixedCamera([Wv.x + 1.4, 1.8, Wv.z + 3.4], [Wv.x, 1.4, Wv.z]);
    grandpa.position.set(wx + 1.3, 0, wz + 1.4); face(grandpa, wx, wz);
    await dialogue.say(P.wall.line);
    dialogue.close();
    world.camMode = 'follow';
    // ③ 방송에 나가기 → 만남
    hud.setCounter(`${P.counter} 2/3`);
    mk = ring(g, sx, sz + 1.2); mk.visible = true;
    await waitInteract(ctx, { pos: a.at(sx, sz + 1.2), label: P.studio.act, r: 1.5 });
    ctx.input.enabled = false; mk.removeFromParent();
    grandpa.position.set(sx - 0.2, 0, sz + 0.6); face(grandpa, sx + 2, sz - 1);
    const Q = a.at(sx - 4.2, sz + 3.6); placePlayer(world, [Q.x, Q.z], Math.PI * 0.75); // 학생은 촬영기 뒤에서 지켜본다
    const S = a.at(sx, sz); const studio = () => world.setFixedCamera([S.x + 3.4, 2.1, S.z + 3.8], [S.x + 0.2, 1.2, S.z]);
    studio(); hook.aired = true;
    await dialogue.say(P.studio.lines[0]);
    sister.visible = true;
    await dialogue.say(P.studio.lines[1]);
    // 두 사람이 다가가 끌어안는다
    const g0 = grandpa.position.clone(), s0 = sister.position.clone(), mid = g0.clone().lerp(s0, 0.5);
    face(grandpa, s0.x, s0.z); face(sister, g0.x, g0.z);
    await wait(world, 1.2, k => { grandpa.position.lerpVectors(g0, mid, ease(k) * 0.8); sister.position.lerpVectors(s0, mid, ease(k) * 0.8); for (const p of [grandpa, sister]) p.userData.arms?.forEach((ar, j) => ar.rotation.set(-1.3 * ease(k), 0, (j ? -0.6 : 0.6) * ease(k))); });
    hook.met = true; audio.play('correct');
    studio();
    await dialogue.say(P.studio.lines[2]);
    hud.setCounter(`${P.counter} 3/3`);
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
    void crowd; void host;
  } finally {
    ctx.testHooks.choice = null;
    world.setMood(base.mood);
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h5', mood: 'sea', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['mother', 'grandma', 'student', 'grandpa'],
  spot: SPOT,
  layout: {
    // 1950년대 부산 피란민 마을: 바다를 내려다보는 비탈에 축대를 쌓고 층층이 지은 판잣집, 아래 골목길과 우물가, 항구의 배와 부두
    ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -16, x1: 16, z0: -7, z1: 11 }, start: [0, 9], hill: 2.0,
    roads: [{ x: 0, z: 2, w: 34, d: 4, color: 0x7a6a56 }],
    props: [
      { type: 'water', x: 0, z: -40, w: 260, d: 50 },
      { type: 'steamship', x: 10, z: -22, ry: Math.PI / 2, solid: false }, { type: 'pier', x: -6, z: -15, w: 8, d: 3, solid: false }, { type: 'boat', x: -12, z: -17, ry: 0.3 },
      { type: 'shack', x: -13, z: 8 }, { type: 'shack', x: 13, z: 8 },
      { type: 'terrace', x: -11, z: -5.5, w: 9, d: 4, h: 1.2, stepX: 3 }, { type: 'shack', x: -13, z: -5.6, y: 1.2 }, { type: 'shack', x: -9, z: -5.8, y: 1.2, ry: 0.1 },
      { type: 'terrace', x: 12, z: -5.5, w: 8, d: 4, h: 1.2, stepX: -2.5 }, { type: 'shack', x: 12.5, z: -5.6, y: 1.2 },
      { type: 'terrace', x: -17.5, z: 1, w: 4, d: 9, h: 2.2, steps: false }, { type: 'shack', x: -17.5, z: 1, y: 2.2, ry: Math.PI / 2 },
      { type: 'terrace', x: 17.5, z: 2, w: 4, d: 9, h: 2.2, steps: false }, { type: 'shack', x: 17.5, z: 2, y: 2.2, ry: -Math.PI / 2 },
      { type: 'rice', x: 4, z: -5, n: 6 }, { type: 'desk', x: 8, z: -2 }, { type: 'well', x: -3.5, z: 9.5 },
      { type: 'crowd', x: -3, z: -5, n: 6, cols: 3, looks: ['student', 'schoolgirl'], face: Math.PI },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x7a6a56, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x7a6a56, solid: false },
    ],
    npcs: [
      { id: 'mother', look: 'woman', x: -4.5, z: 5.5, ry: Math.PI * 0.8, work: 'carry' },
      { id: 'grandma', look: 'grandma', x: 7, z: 5, ry: -Math.PI * 0.6 },
      { id: 'student', look: 'student', x: 1, z: -2, ry: 0 },
      { id: 'grandpa', look: 'peasant', x: -8.5, z: 3.6, ry: Math.PI * 0.4 },
    ],
    // 길 위 안내판 대신 판잣집 간판(C-03): 「밀면집」·「구호소」. 안내판 글(이산가족 찾기·평화 통일)은 놀이 대사로 옮겼다
    signs: [{ id: 'signNoodle', title: '밀면집', x: 13, z: 9.5, ry: 0, plaque: { y: 1.7, back: 0 } },
      { id: 'signRelief', title: '구호소', x: -13, z: 9.5, ry: 0, plaque: { y: 1.7, back: 0 } }],
  },
  parts: [
    { ...script.parts.noodle, goal: script.goals[3], play: ctx => noodlePlay(ctx) },
    { ...script.parts.family, goal: script.goals[4], intro: meet('grandpa', '피란민 할아버지와 이야기하기', script.parts.family.intro), play: ctx => familyPlay(ctx) },
  ],
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '피란민 마을', 3.2, GATE_Z - 1.6);
    world.closeView = true;
    return { gate, board };
  },
});

// 장 도입(C-03): ① 보따리를 지고 도시로 몰려드는 사람들 ② 판잣집 앞에서 다시 일하는 사람들. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const add = (look, x, z, ry) => { const p = person(L, look, x, z, ry); p.visible = false; return p; };
  const walkers = [[-2.4, 4, 'woman'], [-0.8, 5, 'peasant'], [0.8, 4.4, 'grandma'], [2.4, 5.2, 'citizen'], [0, 6.2, 'kidModern']].map(([x, z, l]) => add(l, x, z, 0));
  walkers.forEach(p => setCarry(p, sack(), 'arms'));
  const workers = [[-2, 1.6, 'woman'], [0, 1, 'citizen'], [2, 1.6, 'student']].map(([x, z, l]) => add(l, x, z, 0));
  const hide = on => { for (const id of [...PEOPLE, 'grandpa']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const show = list => { for (const o of [...walkers, ...workers]) o.visible = list.includes(o); };
  return {
    shots: [
      { cam: [0.6, 2.2, 10.5], look: [0, 1.2, 4.6], to: { cam: [0.4, 2.2, 10], look: [0, 1.2, 4.6] }, act: () => { hide(false); show(walkers); } },
      { cam: [3.5, 2.4, 6.5], look: [0, 1.1, 1.2], to: { cam: [3, 2.3, 6], look: [0, 1.1, 1.2] }, act: () => show(workers) },
    ],
    done: () => { hide(true); for (const o of [...walkers, ...workers]) o.removeFromParent(); },
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
  // 모두 들은 뒤 할아버지에게 가면 학생의 결심 → 구호물품 밀가루를 나눠 받는 줄
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'grandpa', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await reliefScene(ctx);
  },
  minigame: ctx => minigameWithMeet(base, ctx),
};
