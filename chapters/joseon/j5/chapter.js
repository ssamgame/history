// 조선편 5장 「병자호란과 남한산성」: 산성 탐험(병사·창고지기·김상헌·최명길) → 척화·주화 나누기 → 화톳불 다시 켜기 → 항복 해설 → 퀴즈.
import { buildJ5Scene } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { PLAY, buildArena } from '../../kit/play.js';
import * as THREE from 'three';
import { mat, makePerson } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../common.js';
import script from './script.js';

// 행궁 마당(마을에서 떨어진 x 400): 왼쪽에 김상헌(척화), 오른쪽에 최명길(주화). 말을 그 생각을 한 사람에게 가져간다.
const HALL = {
  origin: [400, 0], ground: 'stone', groundColor: 0xd8dade, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'hanok', x: 0, z: -14, tile: true, scale: 1.6 },
    { type: 'crowd', x: -10, z: -8.5, n: 1, looks: ['kimsangheon'] }, { type: 'crowd', x: 10, z: -8.5, n: 1, looks: ['choemyeonggil'] },
  ],
};
const SORT_BINS = [{ x: -10, z: -5 }, { x: 10, z: -5 }];

const ORDER = ['soldier', 'keeper', 'kimsangheon', 'choemyeonggil'];
const SPOT = [0, -3];
let scene = null;

export const PLAYER = { robe: 0x4a556a, hat: 'jeollip', gear: 'spear', trim: 0xd8d0bc, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };

// 화톳불 켜기 한 번: 시간 안에 여섯 개 모두 켜면 성공. 꺼진 불 가까이(2.2 안)에서 대화 버튼을 누르면 켜진다.
// 화살표는 가장 가까운 꺼진 불을 가리킨다.
function lightFires(ctx, easy) {
  const { world, hud, audio } = ctx;
  const duration = easy ? 110 : 75;
  scene.resetFires();
  placePlayer(world, SPOT);
  ctx.input.enabled = true;
  let t = 0, done = false, near = null;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); unbind(); hud.setTimer(null); hud.setCounter(null); world.setGoal(null); hud.setPrompt?.(null); hud.setTalkEnabled?.(false); ctx.input.enabled = false;
      resolve(ok);
    };
    const unbind = ctx.onAction(() => {
      if (done || !near) return;
      scene.light(near); audio.play('correct'); near = null;
    });
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const p = world.player.position;
      let nearest = null, nd = Infinity;
      near = null;
      for (const f of scene.fires) {
        if (f.lit) continue;
        const d = Math.hypot(p.x - f.x, p.z - f.z);
        if (d < 2.2 && (!near || d < Math.hypot(p.x - near.x, p.z - near.z))) near = f;
        if (d < nd) { nd = d; nearest = f; }
      }
      hud.setTalkEnabled?.(!!near);
      hud.setPrompt?.(near ? new THREE.Vector3(near.x, 0, near.z) : null);
      const lit = scene.fires.filter(f => f.lit).length;
      hud.setTimer(duration - t);
      hud.setCounter(`켠 화톳불 ${lit}/${scene.fires.length}`);
      world.setGoal(nearest ? { x: nearest.x, z: nearest.z } : null);
      if (lit === scene.fires.length) return finish(true);
      if (t >= duration) finish(false);
    });
  });
}

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
  lightFires: (ctx, easy) => lightFires(ctx, easy), // 시험·개발용
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
    await showHowTo(ctx.ui, {
      title: '남한산성의 겨울',
      steps: ['머리 위의 말을 척화(김상헌)나 주화(최명길) 자리로 가져가 그 안에서 멈춰 잠깐 서 있어요. 놓으면 처음 자리로 돌아와 다음 것을 들어요.', '눈보라에 꺼진 화톳불 여섯 개를 찾아가, 불 옆에서 대화 버튼을 눌러 다시 켜요.'],
      keyboard: '걷기는 W A S D 또는 방향키, 불 켜기는 E', touch: '화면 왼쪽을 끌어 걷고, 대화 버튼으로 불을 켜요',
    });
    const parts = [];
    parts.push(await tryPart(ctx, easy => PLAY.deliver(ctx, { arena: HALL, from: [0, 11], counter: '전한 말', bins: script.sort.bins.map((b, i) => ({ ...b, ...SORT_BINS[i] })), cards: script.sort.cards.map((c, i) => ({ ...c, talk: i === 0 ? [{ who: 'kimsangheon', text: '그렇소. 끝까지 싸워 나라의 뜻을 지켜야 하오.' }] : i === 2 ? [{ who: 'choemyeonggil', text: '백성과 나라를 살리려면 화의해야 하오.' }] : null })) }, easy), script.sort.fail));
    await sayAll(dialogue, script.fires.howto); dialogue.close();
    parts.push(await tryPart(ctx, easy => lightFires(ctx, easy), script.fires.fail));
    await sayAll(dialogue, script.fires.done);
    await sayAll(dialogue, script.result.slice(0, 1)); dialogue.close(); // 강화도 함락 → 항복하기로
    await samjeondo(ctx); // 삼전도의 항복(삼궤구고두례)
    await sayAll(dialogue, script.result.slice(2)); // 볼모
    dialogue.close();
    placePlayer(world, SPOT);
    ctx.setGoal(script.goals[5]);
    return sumParts(parts);
  },
};
