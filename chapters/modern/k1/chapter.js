// 근대편 1장 「흥선 대원군과 강화도 조약」(D-28): 강화도 바닷가 마을과 관아, 바다 위의 배.
// 마을 문으로 걸어 들어와 어르신·선비의 이야기를 아무 차례로 듣고(막지 않음), 관아 앞 관리에게 가면 학생의 결심 →
// 물건을 안고 흥선 대원군이 한 일의 자리로 → 해안 순찰 → 연무당에서 조약문 읽기 → 사람들의 말이 조약과 맞는지 가려내기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { burning } from '../../kit/fire.js';
import { makePerson } from '../../../core/people.js';
import { waitInteract } from '../../../core/portal.js';
import { LOOKS } from '../../../content/characters.js';
import script from './script.js';

const PEOPLE = ['elder', 'scholar'];
const GATE_Z = 12.5, INTRO_FROM = [0, 15.5];

// 미니게임 무대(마을에서 떨어진 x 400)
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const PALACE = { edge: { style: 'tile', seed: 462 }, center: [{ type: 'woodpile', x: -16, z: 1 }, { type: 'cart', x: -5, z: -11, ry: 0.5, load: true }, { type: 'cargo', x: 3, z: -11, kind: 'crate', n: 2 }], // 왼쪽 경복궁 공사장, 가운데 세금 거두는 관아, 오른쪽 흥선 대원군(바다 너머 서양 배)
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -20, x1: 20, z0: -14, z1: 14 },
  props: [
    { type: 'hanok', x: -12, z: -12, tile: true, scale: 1.4 }, { type: 'woodpile', x: -17, z: -6 }, { type: 'tree', x: -18, z: 6, kind: 'pine' },
    { type: 'hanok', x: 0, z: -13, tile: true }, { type: 'rice', x: -3.5, z: -8.5, n: 3 },
    { type: 'hanok', x: 13, z: -12, tile: true, ry: -0.2 }, { type: 'steamship', x: 16, z: -26, ry: Math.PI / 2, solid: false, old: true },
    { type: 'water', x: 20, z: -34, w: 60, d: 16 },
  ],
};
const COAST = { edge: { style: 'thatch', seed: 515 }, center: [{ type: 'cannon', x: -8, z: -8, ry: Math.PI }, { type: 'cannon', x: -2, z: -9, ry: Math.PI }, { type: 'cargo', x: -15, z: -6, kind: 'barrel', n: 3 }, { type: 'firepit', x: 15, z: 4 }, { type: 'cannon', x: -7, z: 16, ry: Math.PI }, { type: 'firepit', x: 9, z: 9 }], // 강화도 해안: 갯벌 길, 망루, 포대, 연무당. 먼바다에 군함
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -20, x1: 20, z0: -14, z1: 24 },
  props: [
    { type: 'water', x: 0, z: -80, w: 240, d: 120 }, // 육지 앞쪽은 모두 바다(D-30 D-03: 군함이 산을 뚫고 오지 않게). 일본 군함은 망루에 오르면 먼바다에서 다가온다(warshipArrives)
    { type: 'pavilion', x: -16, z: 12 }, { type: 'watchtower', x: -15, z: -2.4 }, { type: 'wall', x: 9, z: -6, w: 8, color: 0x8c8577 }, { type: 'rice', x: 13, z: -3, n: 3 },
    { type: 'hanok', x: 10, z: 18, tile: true }, { type: 'tree', x: -16, z: 18, kind: 'pine' }, { type: 'tree', x: 17, z: 8, kind: 'pine' },
    { type: 'boat', x: 8, z: -22, ry: 0.4 }, { type: 'boat', x: 13, z: -24, ry: -0.2, color: 0x6b4a32 },
  ],
};
const YEONMU = { edge: { style: 'tile', seed: 47 }, center: [{ type: 'papers', x: 0, z: -8.5, kind: 'book', n: 2 }, { type: 'cargo', x: -15, z: -4, kind: 'crate', n: 3 }, { type: 'cargo', x: 15, z: -4, kind: 'barrel', n: 3 }], // 강화도 연무당: 조약을 맺은 곳. 앞마당에 소문을 말하는 사람들
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'pavilion', x: 0, z: -11 }, { type: 'desk', x: 0, z: -6 },
    { type: 'crowd', x: -4, z: -5, n: 2, cols: 2, looks: ['joseonOfficial'], face: Math.PI / 2 }, { type: 'crowd', x: 4, z: -5, n: 2, cols: 2, looks: ['gentleman'], face: -Math.PI / 2 },
    { type: 'water', x: 0, z: -80, w: 240, d: 120 }, { type: 'steamship', x: -16, z: -30, ry: Math.PI / 2, solid: false, old: true }, // 앞쪽은 모두 바다(D-03)
  ],
};

// 망루에 오르면: 먼바다에서 일본 군함(옛 증기선)이 다가오고, 뱃전에서 대포를 쏘아 번쩍 빛과 흰 연기가 피어오른다(D-28).
// 카메라는 망루 뒤에서 바다를 내려다본다. 약 7.5초 뒤 따라가기 카메라로 돌아오고, 군함은 그 자리에 머문다
export function warshipArrives(ctx, s, g) {
  const { world, audio } = ctx;
  const ship = new THREE.Group(); BUILD.steamship(ship, { old: true }); ship.position.set(-6, 0.3, -80); g.add(ship);
  const eye = s.at(-5, 8), look = s.at(-7, -40); // 망루(-15, -2.4)·정자를 피한 망루 뒤쪽 높은 곳
  world.setFixedCamera([eye.x, 8, eye.z], [look.x, 2, look.z]);
  const puffs = [];
  const shoot = side => { // 뱃전의 대포 한 방: 번쩍 빛 하나와 흰 연기 네 덩이
    audio.play('boom');
    const muzzle = new THREE.Vector3(side * 2.8, 2.4, 1 + Math.random() * 3);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true }));
    flash.position.copy(muzzle); ship.add(flash); puffs.push({ m: flash, t: 0, flash: true });
    fire(muzzle.clone().add(ship.position), TARGETS[nShot++ % TARGETS.length]);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe2ddd2, transparent: true, opacity: 0.9, depthWrite: false }));
      m.position.copy(muzzle).add(new THREE.Vector3(side * (0.6 + i * 0.7), i * 0.3, (Math.random() - 0.5) * 1.2)); m.scale.setScalar(0.5); ship.add(m);
      puffs.push({ m, t: -i * 0.08, side });
    }
  };
  // 포탄(D-30 D-04): 대포를 쏘면 검은 포탄이 활처럼 날아가 바닷가 땅에 떨어져 터진다(불꽃·흙먼지·소리). 망루(-12, 0)·포대와 떨어진 갯벌 쪽
  const TARGETS = [[-17, -15], [3, -15.5], [-6, -16.5]];
  const shells = [], blasts = [];
  const heavy = (world.quality?.particles ?? 0.9) >= 0.9; // 불길은 화질 '보통·높음'에서만
  const fire = (from, to) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshLambertMaterial({ color: 0x1d1b19 }));
    m.name = 'shell'; m.position.copy(from); g.add(m);
    shells.push({ m, a: from.clone(), b: new THREE.Vector3(to[0], 0, to[1]), k: 0 });
  };
  const blast = at => {
    audio.play('boom');
    const b = new THREE.Group(); b.name = 'blast'; b.position.set(at.x, 0, at.z); g.add(b);
    const glowM = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false });
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), glowM(0xfff0b0)); flash.position.y = 0.6; b.add(flash);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), glowM(0xff7a1e)); ball.position.y = 0.8; b.add(ball);
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2e2618, transparent: true, opacity: 0.8 })); scorch.position.y = 0.06; b.add(scorch);
    const dirt = [], dust = [];
    for (let i = 0; i < 12; i++) { // 튀어 오르는 흙덩이
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), new THREE.MeshLambertMaterial({ color: i % 2 ? 0x6b5536 : 0x4e3e28 }));
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      c.position.y = 0.3; b.add(c); dirt.push({ c, v: new THREE.Vector3(Math.cos(a) * sp, 5 + Math.random() * 4, Math.sin(a) * sp) });
    }
    for (let i = 0; i < 6; i++) { // 피어오르는 흙먼지
      const d = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: i % 2 ? 0x9a8a6c : 0x857356, transparent: true, opacity: 0.75, depthWrite: false }));
      d.position.set((Math.random() - 0.5) * 1.6, 0.6 + i * 0.25, (Math.random() - 0.5) * 1.6); d.scale.setScalar(0.6); b.add(d); dust.push(d);
    }
    b.userData.dust = dust.length;
    const f = heavy ? burning(world, { parent: b, x: 0.3, y: 0, z: 0.2, size: 1.1, level: 1 }) : null;
    blasts.push({ b, flash, ball, dirt, dust, f, t: 0 });
  };
  const shots = [[4.3, 1], [5.0, -1], [5.8, 1]];
  let t = 0, nShot = 0;
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      t += dt;
      const k = Math.min(1, t / 4); ship.position.z = -80 + 46 * (1 - (1 - k) * (1 - k)); // 다가오다 천천히 멈춘다
      ship.rotation.z = Math.sin(t * 1.3) * 0.02;
      while (shots.length && t >= shots[0][0]) shoot(shots.shift()[1]);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.t += dt;
        if (p.t < 0) continue;
        if (p.flash) { p.m.material.opacity = Math.max(0, 1 - p.t / 0.25); p.m.scale.setScalar(1 + p.t * 3); }
        else { const u = p.t / 3.2; p.m.scale.setScalar(0.8 + u * 4.5); p.m.position.y += dt * 0.8; p.m.position.x += p.side * dt * 0.6; p.m.material.opacity = Math.max(0, 0.9 * (1 - u)); }
        if ((p.flash && p.t > 0.25) || p.t > 3.2) { ship.remove(p.m); puffs.splice(i, 1); }
      }
      for (let i = shells.length - 1; i >= 0; i--) { // 포탄: 1.1초 동안 활처럼 날아가 땅에 떨어진다
        const sh = shells[i]; sh.k = Math.min(1, sh.k + dt / 1.1);
        sh.m.position.lerpVectors(sh.a, sh.b, sh.k); sh.m.position.y += Math.sin(sh.k * Math.PI) * 7;
        if (sh.k >= 1) { g.remove(sh.m); shells.splice(i, 1); blast(sh.b); }
      }
      for (const x of blasts) { // 번쩍 → 불덩이 → 흙덩이가 튀었다 떨어지고 → 흙먼지가 퍼지며 옅어진다
        x.t += dt; const u = x.t;
        x.flash.visible = u < 0.3; x.flash.scale.setScalar(0.5 + u * 9); x.flash.material.opacity = Math.max(0, 1 - u / 0.3);
        x.ball.visible = u < 0.8; x.ball.scale.setScalar(0.6 + u * 3); x.ball.material.opacity = Math.max(0, 0.95 - u / 0.8);
        for (const d of x.dirt) { if (d.c.position.y <= 0.1 && d.v.y < 0) continue; d.v.y -= 18 * dt; d.c.position.addScaledVector(d.v, dt); d.c.rotation.x += dt * 6; if (d.c.position.y < 0.1) d.c.position.y = 0.1; }
        for (const [k, d] of x.dust.entries()) { const w = Math.min(1, u / 2.6); d.scale.setScalar(0.6 + w * (1.9 + k * 0.25)); d.position.y += dt * 0.5; d.material.opacity = Math.max(0, 0.75 * (1 - w)); }
        x.f?.setLevel(Math.max(0, 1 - u / 3));
      }
      if (t >= 9.2) { off(); clearFx(); world.camMode = 'follow'; world.snapCamera(); resolve(); }
    });
    // 끝나면 포탄·불·흙먼지를 치우고 그을린 자국만 남긴다(무대와 함께 치운다)
    const clearFx = () => { shells.forEach(x => g.remove(x.m)); shells.length = 0; for (const x of blasts) { x.f?.setLevel(0); for (const o of [x.flash, x.ball, ...x.dust, ...x.dirt.map(d => d.c)]) x.b.remove(o); } };
    s.cleanup(() => { off(); clearFx(); });
  });
}

// 다음 놀이 앞에서 기다리기(D-30 C-05): 부분 intro 맨 앞에 { meet } 표시를 두면, k1의 minigame이 그 표시를 만났을 때
// 마을의 그 사람 머리 위에 느낌표를 띄우고 학생이 가서 대화 버튼을 누를 때까지 기다린 뒤, 그 사람이 놀이를 알려 준다
function meet(who, label, lines) { return [{ meet: { who, label } }, ...lines]; }
async function meetPerson(ctx, { who, label }) {
  const { world } = ctx, npc = world.npcs.get(who);
  npc.mark.visible = true;
  await waitInteract(ctx, { pos: npc.mesh.position, label, mark: false });
  npc.mark.visible = false;
  world.setTalkCamera(npc.mesh);
}

const base = makeKitChapter({
  id: 'k1', mood: 'sea', script,
  player: { robe: 0xddd2bb, hat: 'topknot', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['elder', 'scholar', 'official'],
  spot: [0, 2],
  layout: {
    // 강화도 바닷가 마을(1870년대): 북쪽은 바다와 갯벌 포구, 가운데 돌 축대 위의 관아, 양옆 초가와 소나무, 뒤로 높은 언덕
    ground: 'grass', groundColor: 0x6a8a52, bounds: { x0: -15, x1: 15, z0: -9, z1: 11 }, start: [0, 8], hill: 1.5,
    roads: [{ x: 0, z: 4, w: 4, d: 26 }, { x: 0, z: -3, w: 30, d: 4 }, { x: -12, z: -11, w: 3, d: 6, color: 0x8a7a5a }],
    props: [
      { type: 'water', x: 0, z: -45, w: 260, d: 60 },
      { type: 'steamship', x: 14, z: -32, ry: 0.3, solid: false, old: true },
      { type: 'pier', x: -12, z: -16, w: 3, d: 6, solid: false }, { type: 'boat', x: -15, z: -18, ry: 0.2 }, { type: 'boat', x: -9, z: -19, ry: -0.3, color: 0x6b4a32 },
      { type: 'wall', x: -9, z: -11, w: 12, h: 2.4, solid: false }, { type: 'wall', x: 9, z: -11, w: 12, h: 2.4, solid: false },
      { type: 'terrace', x: -3, z: -7.6, w: 8.6, d: 5.6, h: 0.9 }, { type: 'hanok', x: -3, z: -8, y: 0.9, tile: true, scale: 1.3 },
      { type: 'flagpole', x: 3, z: -6, color: 0xd9a441 },
      { type: 'hanok', x: -11, z: 4 }, { type: 'hanok', x: 11, z: 3, ry: -0.2 }, { type: 'hanok', x: -11, z: -3, ry: 0.15 }, { type: 'hanok', x: 12, z: 9, ry: -0.4 },
      { type: 'straw', x: 14.5, z: -2 }, { type: 'cart', x: 8, z: -6.8, ry: 1.2 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.6, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.6, solid: false }, // 마을 어귀 돌담
      { type: 'tree', x: 8.5, z: 10, kind: 'pine' }, { type: 'tree', x: -14.5, z: 9.5, kind: 'pine' }, { type: 'tree', x: 14, z: -8, kind: 'pine' },
    ],
    npcs: [
      { id: 'elder', look: 'commoner', x: -6, z: 5, ry: Math.PI * 0.8 },
      { id: 'scholar', look: 'scholar', x: 7, z: 1, ry: -Math.PI * 0.6 },
      { id: 'official', look: 'joseonOfficial', x: 0, z: -3.5, ry: 0 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 관아 처마 아래 「강화도 조약」, 서쪽 초가 벽에 「서양과의 조약」. x, z는 읽는 자리(건물 앞 땅)
    signs: [{ id: 'signTreaty', title: '강화도 조약', x: -3, z: -4.2, plaque: { y: 3.75, back: 1.1 } }, { id: 'signWest', title: '서양과의 조약', x: -10.6, z: -0.4, ry: 0.15, plaque: { y: 2.3, back: 1.7 } }],
    scatter: [{ kind: 'grass', count: 60, area: { x0: -15, x1: 15, z0: -8, z1: 12 }, avoid: [{ x: 0, z: 2, r: 3 }], seed: 201 }],
  },
  parts: [
    // 물건 셋을 저마다 그 일의 자리로(D-30 D-01): 경복궁 공사장 · 세금 거두는 관아 · 흥선 대원군(바다 너머 서양 배)
    { ...script.parts.regent, goal: script.goals[2], arena: PALACE, from: [0, 10], bins: xy(script.parts.regent.bins, [{ x: -11, z: -4 }, { x: 0, z: -5 }, { x: 11, z: -4 }]) },
    // 둘째 놀이부터는 마을의 그 사람에게 가서 말을 걸어야 시작한다(D-30 C-05, intro 앞의 meet)
    { ...script.parts.coast, goal: script.goals[3], arena: COAST, from: [0, 21], intro: meet('elder', '마을 어르신과 이야기하기', script.parts.coast.intro),
      route: xy(script.parts.coast.route, [{ x: -4, z: 12 }, { x: -12, z: 0 }, { x: 6, z: -2 }, { x: 6, z: 14 }]).map((r, i) => i === 1 ? { ...r, scene: warshipArrives, holdCenter: true } : r) }, // 망루: 남은 시간을 화면 가운데 크게(D-02)
    { ...script.parts.paper, goal: script.goals[4], arena: YEONMU, from: [0, -3.6], view: { eye: [2.5, 3.2, -1.2], at: [0, 1, -6.5] }, scroll: true, // 연무당 탁자 앞에서 낡은 두루마리 조약문을 읽는다(D-05)
      intro: meet('official', '조선 관리와 이야기하기', script.parts.paper.intro) },
    { ...script.parts.rumor, goal: script.goals[5], arena: YEONMU, from: [0, 11], mark: '!', intro: meet('scholar', '젊은 선비와 이야기하기', script.parts.rumor.intro), // 머리 위는 느낌표(D-06)
      items: xy(script.parts.rumor.items, [{ x: -10, z: 4, ry: 0.5 }, { x: -4, z: 8, ry: 0.2 }, { x: 4, z: 8, ry: -0.2 }, { x: 10, z: 4, ry: -0.5 }]) },
  ],
  decorate(world) { // 마을 어귀 나무 문과 「강화도」 이름판(S51). 문짝은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    nameBoard(world.level, '강화도', 3, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate };
  },
});

let scene = null;
// 마을 사람 대사: 다른 사람 이야기를 먼저 들었으면 이어 주는 말(bridge)로 시작한다. 다시 말 걸면 later
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);

export const devScene = () => scene; // 개발용(사진 찍기)

// 장 도입(D-30 C-03): ① 관아 돌 축대 위, 어린 고종 곁으로 아버지 흥선 대원군이 걸어 나와 마을을 내려다본다(대신 다스림)
// ② 바닷가: 서양 배가 다가오다 뱃머리를 돌려 먼바다로 돌아가고, 흥선 대원군은 바다를 보고 선다(교류 거절). 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level, T = 0.9; // T: 돌 축대 높이
  const young = { ...LOOKS.gojongKing, face: { ...LOOKS.gojongKing.face, beard: null } };
  const king = makePerson(young); king.scale.setScalar(0.8); king.position.set(-2.2, T, -5.0); L.add(king);
  const regent = makePerson(LOOKS.daewongun); regent.position.set(-3.9, T, -7.4); L.add(regent);
  const ship = new THREE.Group(); BUILD.steamship(ship, { old: true }); ship.position.set(-16, 0.3, -40); L.add(ship);
  let off = null, t = 0;
  const run = fn => { off?.(); t = 0; off = world.onUpdate(dt => { t += dt; fn(t); }); };
  return {
    shots: [
      { cam: [-3.4, 2.4, 0.4], look: [-3, 2.5, -6], to: { cam: [-3.1, 2.3, -0.8], look: [-3, 2.5, -6] },
        act: () => run(u => { // 대원군이 관아 안에서 왕 곁으로 걸어 나와 마을 쪽을 본다
          regent.position.set(-3.9, T, -7.4 + 2.6 * Math.min(1, u / 2.2));
        }) },
      { cam: [1.8, 2.6, -8.4], look: [-1.5, 1.5, -30], to: { cam: [1.6, 2.4, -9.4], look: [-2.5, 1.5, -32] }, // 관아 뒤 담 사이 바닷가
        act: () => {
          regent.position.set(1.2, 0, -12.6); regent.rotation.y = Math.PI; king.visible = false; ship.position.set(-5, 0.3, -40);
          run(u => { // 배가 다가오다 뱃머리를 돌려 먼바다로 돌아가고, 대원군은 바다를 등지고 돌아선다
            if (u < 2.2) ship.position.z = -40 + u * 2;
            else if (u < 3.8) ship.rotation.y = Math.PI * (u - 2.2) / 1.6;
            else { ship.rotation.y = Math.PI; ship.position.z = -35.6 - (u - 3.8) * 3; ship.position.x = -5 - (u - 3.8) * 1.5; }
            regent.rotation.y = u < 2.6 ? Math.PI : Math.PI * Math.max(0, 1 - (u - 2.6) / 1.2);
          });
        } },
    ],
    done: () => { off?.(); off = null; for (const o of [king, regent, ship]) o.removeFromParent(); },
  };
}

export default {
  ...base,
  anyOrder: true, // 마을 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [5, 5.5], ry: -Math.PI / 2 }, // 미니게임 뒤 빛나는 문(C-02): 큰길 동쪽 빈 마당, 앞면은 큰길(서쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  explore(ctx) { return walkInAndTalk(ctx, script, { people: PEOPLE, final: 'official', gate: scene.gate, from: INTRO_FROM, to: base.layout.start }); },
  // 공용 kit 미니게임을 그대로 돌리되, 부분 intro 앞의 { meet } 표시에서 그 사람에게 말을 걸 때까지 기다린다(C-05)
  async minigame(ctx) {
    const d = ctx.dialogue, say = d.say;
    d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : say.call(d, line));
    try { return await base.minigame(ctx); } finally { d.say = say; ctx.setGoal(null); } // 퀴즈 목표는 빛나는 문이 대신(C-01)
  },
};
