// 조선편 5장 「병자호란과 남한산성」: 산성 탐험(병사·창고지기·김상헌·최명길) → 놀이 「의견 저울」(chapters/kit/scale.js, 2026-10-27) → 항복 해설 · 삼전도 → 퀴즈.
import { buildJ5Scene } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { buildArena } from '../../kit/play.js';
import { scale } from '../../kit/scale.js';
import * as THREE from 'three';
import { mat, makePerson } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../common.js';
import script from './script.js';

const ORDER = ['soldier', 'keeper', 'kimsangheon', 'choemyeonggil'];
const SPOT = [0, -3];
let scene = null;

export const PLAYER = { robe: 0x4a556a, hat: 'jeollip', gear: 'spear', trim: 0xd8d0bc, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };

// 삼전도: 수항단 위의 청 태종, 단 아래로 걸어 나온 인조가 세 번 무릎 꿇고 아홉 번 머리를 조아린다(뒤의 세자·신하들도 함께)
const SAMJEON = {
  origin: [400, 220], ground: 'earth', groundColor: 0xcfd5dc, bounds: { x0: -16, x1: 16, z0: -12, z1: 14 },
  props: [{ type: 'water', x: 0, z: -30, w: 200, d: 24, color: 0x5a7a8a }],
};
async function samjeondo(ctx) {
  const { world, dialogue } = ctx;
  const L = script.samjeondo;
  await ctx.fade(true);
  const arena = buildArena(world, SAMJEON), g = arena.group, O = arena.at(0, 0);
  const was = world.player.visible; world.player.visible = false;
  // 아홉 층 단과 노란 차양, 단 위에 앉은 청 태종
  for (let i = 0; i < 9; i++) { const w = 9 - i * 0.7; const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, w * 0.8), mat(0xc2baa8, 'stone')); m.position.set(0, 0.16 + i * 0.32, -6); m.castShadow = m.receiveShadow = true; g.add(m); }
  const top = 9 * 0.32;
  for (const [x, z] of [[-1.3, -7], [1.3, -7], [-1.3, -5], [1.3, -5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), mat(0x8a2f24)); p.position.set(x, top + 1.3, z); g.add(p); }
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.0, 4), mat(0xd9a441, 'cloth')); canopy.rotation.y = Math.PI / 4; canopy.position.set(0, top + 3.0, -6); g.add(canopy);
  const emperor = makePerson({ robe: 0xd9a441, hat: 'qing', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } });
  emperor.position.set(0, top - 0.35, -6.2); emperor.userData.noWalk = true; g.add(emperor);
  // 청나라 군사와 깃발이 양쪽에 늘어선다
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const q = makePerson(LOOKS.qingSoldier); q.position.set(s * (6 + (i % 2) * 1.4), 0, -4 + i * 2.6); q.rotation.y = -s * Math.PI / 2; q.userData.noWalk = true; g.add(q);
    if (i % 2 === 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6).translate(0.6, 0, 0), new THREE.MeshLambertMaterial({ color: i % 4 ? 0x3c5a7a : 0xd9a441, side: THREE.DoubleSide })); f.position.set(s * 8.2, 3.4, -4 + i * 2.6); g.add(f); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), mat(0x5a3f2a)); pole.position.set(s * 8.2, 2.1, -4 + i * 2.6); g.add(pole); }
  }
  // 인조(쪽빛 옷)와 뒤따르는 세자·신하들
  // 사람마다 바깥 묶음(자리·방향: 단을 바라본다) 안에 몸을 두고, 몸은 엉덩이를 축으로 숙인다
  const holder = (look, off) => { const h = new THREE.Group(); h.rotation.y = Math.PI; h.userData.off = off; const p = makePerson(look); p.userData.noWalk = true; h.add(p); h.userData.body = p; g.add(h); return h; };
  const injo = holder({ ...LOOKS.injo, robe: 0x3c4a6a }, [0, 0]);
  const follow = [[-1.4, 2.2], [1.4, 2.2], [-2.6, 3.6], [0, 3.6], [2.6, 3.6]].map(([x, z], i) => holder(i === 0 ? { ...LOOKS.injo, robe: 0x4a556a, hat: 'official' } : LOOKS.joseonOfficial, [x, z]));
  const bowers = [injo, ...follow];
  const place = z => bowers.forEach(h => h.position.set(h.userData.off[0], 0, z + h.userData.off[1]));
  place(12);
  world.setFixedCamera([O.x + 13, 7.5, O.z + 12], [O.x, 1.8, O.z - 1.5]);
  await ctx.fade(false);
  await dialogue.say(L[0]); dialogue.close();
  const anim = (sec, fn) => new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); fn(t); if (t >= 1) { off(); resolve(); } }); });
  await anim(3, k => place(12 - k * 10)); // 단 아래까지 걸어 나온다
  await dialogue.say(L[1]); dialogue.close();
  await dialogue.say(L[2]); dialogue.close();
  const HIP = 1.0; // 무릎 꿇은 몸이 엉덩이를 축으로 앞으로 숙는다
  const pose = (y, lean) => bowers.forEach(h => { const p = h.userData.body; p.rotation.x = lean; p.position.set(0, y + HIP * (1 - Math.cos(lean)), -HIP * Math.sin(lean)); });
  const done = { kneels: 0, bows: 0 };
  for (let k = 0; k < 3; k++) {
    await anim(0.6, t => pose(-0.55 * t, 0.12 * t)); done.kneels += 1;  // 무릎을 꿇는다
    for (let b = 0; b < 3; b++) { await anim(0.45, t => pose(-0.55, 0.12 + 0.8 * t)); await anim(0.4, t => pose(-0.55, 0.92 - 0.8 * t)); done.bows += 1; } // 머리를 조아린다
    await anim(0.5, t => pose(-0.55 * (1 - t), 0.12 * (1 - t))); // 일어선다
  }
  ctx.testHooks.samjeondo = done;
  await ctx.wait(500);
  await ctx.fade(true);
  arena.dispose();
  world.player.visible = was;
  placePlayer(world, SPOT);
  await ctx.fade(false);
}

export default {
  id: 'j5',
  samjeondo: ctx => samjeondo(ctx),
  mood: 'snow',
  player: PLAYER,
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildJ5Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.allLit(); ctx.setGoal(script.goals[5]); }
  },

  explore(ctx) { return talkInOrder(ctx, script, ORDER, scene.start); },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setTalkStep(ctx, script, ORDER, 4);
    world.setGoal(null);
    await showHowTo(ctx.ui, script.sort.howto);
    // 놀이 「의견 저울」(2026-10-27, 가져가기 대신): 말풍선을 같은 생각의 접시에 놓으면 저울이 수평이 된다(옳고 그름 점수 없음)
    const S = script.sort;
    const parts = [await tryPart(ctx, easy => scale(ctx, { bins: S.bins, cards: S.cards, title: S.title, prompt: S.prompt, hint: S.fail, easy })
      .then(r => (r.ok ? (r.wrong ? 'missed' : true) : false)), S.fail)];
    await sayAll(dialogue, script.result.slice(0, 1)); dialogue.close(); // 강화도 함락 → 항복하기로
    await samjeondo(ctx); // 삼전도의 항복(삼궤구고두례)
    await sayAll(dialogue, script.result.slice(2)); // 볼모
    dialogue.close();
    placePlayer(world, SPOT);
    ctx.setGoal(script.goals[5]);
    return sumParts(parts);
  },
};
