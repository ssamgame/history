// 근대편 1장 「흥선 대원군과 강화도 조약」(D-28): 강화도 바닷가 마을과 관아, 바다 위의 배.
// 마을 문으로 걸어 들어와 어르신·선비의 이야기를 아무 차례로 듣고(막지 않음), 관아 앞 관리에게 가면 학생의 결심 →
// 물건을 안고 흥선 대원군이 한 일의 자리로 → 해안 순찰 → 연무당에서 조약문 읽기 → 사람들의 말이 조약과 맞는지 가려내기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard, enterThroughGate, closeGate } from '../../kit/gate.js';
import { roam } from '../../../core/flow.js';
import { sayAll, placePlayer } from '../../joseon/common.js';
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
    { type: 'water', x: 0, z: -40, w: 160, d: 40 }, // 일본 군함은 망루에 오르면 먼바다에서 다가온다(warshipArrives)
    { type: 'pavilion', x: -14, z: 7 }, { type: 'wall', x: 9, z: -6, w: 8, color: 0x8c8577 }, { type: 'rice', x: 13, z: -3, n: 3 },
    { type: 'hanok', x: 10, z: 18, tile: true }, { type: 'tree', x: -16, z: 18, kind: 'pine' }, { type: 'tree', x: 17, z: 8, kind: 'pine' },
    { type: 'boat', x: 8, z: -22, ry: 0.4 }, { type: 'boat', x: 13, z: -24, ry: -0.2, color: 0x6b4a32 },
  ],
};
const YEONMU = { edge: { style: 'tile', seed: 47 }, center: [{ type: 'papers', x: 0, z: -8.5, kind: 'book', n: 2 }, { type: 'cargo', x: -15, z: -4, kind: 'crate', n: 3 }, { type: 'cargo', x: 15, z: -4, kind: 'barrel', n: 3 }], // 강화도 연무당: 조약을 맺은 곳. 앞마당에 소문을 말하는 사람들
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'pavilion', x: 0, z: -11 }, { type: 'desk', x: 0, z: -6 },
    { type: 'crowd', x: -4, z: -5, n: 2, cols: 2, looks: ['joseonOfficial'], face: Math.PI / 2 }, { type: 'crowd', x: 4, z: -5, n: 2, cols: 2, looks: ['gentleman'], face: -Math.PI / 2 },
    { type: 'water', x: 0, z: -40, w: 160, d: 30 }, { type: 'steamship', x: -16, z: -24, ry: Math.PI / 2, solid: false, old: true },
  ],
};

// 망루에 오르면: 먼바다에서 일본 군함(옛 증기선)이 다가오고, 뱃전에서 대포를 쏘아 번쩍 빛과 흰 연기가 피어오른다(D-28).
// 카메라는 망루 뒤에서 바다를 내려다본다. 약 7.5초 뒤 따라가기 카메라로 돌아오고, 군함은 그 자리에 머문다
export function warshipArrives(ctx, s, g) {
  const { world, audio } = ctx;
  const ship = new THREE.Group(); BUILD.steamship(ship, { old: true }); ship.position.set(-6, 0.3, -80); g.add(ship);
  const eye = s.at(-5, 8), look = s.at(-7, -40); // 정자(-14, 7)를 피한 망루 뒤쪽 높은 곳
  world.setFixedCamera([eye.x, 8, eye.z], [look.x, 2, look.z]);
  const puffs = [];
  const shoot = side => { // 뱃전의 대포 한 방: 번쩍 빛 하나와 흰 연기 네 덩이
    audio.play('boom');
    const muzzle = new THREE.Vector3(side * 2.8, 2.4, 1 + Math.random() * 3);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true }));
    flash.position.copy(muzzle); ship.add(flash); puffs.push({ m: flash, t: 0, flash: true });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe2ddd2, transparent: true, opacity: 0.9, depthWrite: false }));
      m.position.copy(muzzle).add(new THREE.Vector3(side * (0.6 + i * 0.7), i * 0.3, (Math.random() - 0.5) * 1.2)); m.scale.setScalar(0.5); ship.add(m);
      puffs.push({ m, t: -i * 0.08, side });
    }
  };
  const shots = [[4.3, 1], [5.0, -1], [5.8, 1]];
  let t = 0;
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
      if (t >= 7.5) { off(); world.camMode = 'follow'; world.snapCamera(); resolve(); }
    });
    s.cleanup(() => { off(); });
  });
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
    signs: [{ id: 'signTreaty', title: '강화도 조약', x: -8.6, z: -6.2 }, { id: 'signWest', title: '서양과의 조약', x: 11, z: -8.2 }], // 관아 옆, 바다가 보이는 담 앞
    scatter: [{ kind: 'grass', count: 60, area: { x0: -15, x1: 15, z0: -8, z1: 12 }, avoid: [{ x: 0, z: 2, r: 3 }], seed: 201 }],
  },
  parts: [
    { ...script.parts.regent, goal: script.goals[2], arena: PALACE, from: [0, 10], bins: xy(script.parts.regent.bins, [{ x: -11, z: -4 }, { x: 0, z: -5 }, { x: 11, z: -4 }, { x: 13, z: 7 }]) },
    { ...script.parts.coast, goal: script.goals[3], arena: COAST, from: [0, 21], route: xy(script.parts.coast.route, [{ x: -4, z: 12 }, { x: -12, z: 0 }, { x: 6, z: -2 }, { x: 6, z: 14 }]).map((r, i) => i === 1 ? { ...r, scene: warshipArrives } : r) },
    { ...script.parts.paper, goal: script.goals[4], arena: YEONMU, from: [0, -3.6], view: { eye: [2.5, 3.2, -1.2], at: [0, 1, -6.5] } }, // 연무당 탁자 앞에서 읽는다
    { ...script.parts.rumor, goal: script.goals[4], arena: YEONMU, from: [0, 11], items: xy(script.parts.rumor.items, [{ x: -10, z: 4, ry: 0.5 }, { x: -4, z: 8, ry: 0.2 }, { x: 4, z: 8, ry: -0.2 }, { x: 10, z: 4, ry: -0.5 }]) },
  ],
  decorate(world) { // 마을 어귀 나무 문과 「강화도」 이름판(S51). 문짝은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    nameBoard(world.level, '강화도', 3, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate };
  },
});

let scene = null;
function markVillage(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('official').mark.visible = heard.size > 0;
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'official').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
// 마을 사람 대사: 다른 사람 이야기를 먼저 들었으면 이어 주는 말(bridge)로 시작한다. 다시 말 걸면 later
export function villageTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 마을 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, INTRO_FROM);
    await enterThroughGate(ctx, { from: INTRO_FROM, to: base.layout.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markVillage(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, villageTalk(id, heard));
            heard.add(id); markVillage(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (id !== 'official') { await sayAll(dialogue, n.always); return; } // 안내판
          if (!heard.size) { await sayAll(dialogue, n.wait); return; }
          await sayAll(dialogue, n.first);
          [...PEOPLE, 'official'].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },
};
