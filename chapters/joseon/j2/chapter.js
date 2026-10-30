// 조선편 3장 「세종과 훈민정음」(D-24·D-30): 궁궐 문으로 들어와 백성·학자의 이야기(아무 차례, 모두 들어야) → 단상 위 세종의 결심 →
// 집현전 앞마당에서 소리 내는 모양 그림판 앞에 서서 자음 고르기(ㄴ에서 획 더하기) → 세종에게 다시 가서 → 하늘·땅·사람 모형을 찾아가 모음 →
// 세종에게 다시 가서 → 마당에 흩어진 낱자를 소리 나는 차례대로 주워 '나무'·'한글' 모으기 → 빛나는 문 → 퀴즈.
import * as THREE from 'three';
import { buildJ2Scene } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { SHAPES } from './pictures.js';
import { PLAY, buildArena, labelSprite } from '../../kit/play.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { makePerson, mat } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, tryPart, sumParts, standPick, visitAny } from '../common.js';
import { waitInteract } from '../../../core/portal.js';
import script from './script.js';
import { proclaimScene } from './story.js';

// 미니게임 무대(마을에서 떨어진 x 400): 집현전 앞마당
export const YARD = {
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -18, x1: 18, z0: -14, z1: 14 },
  props: [{ type: 'hanok', x: 0, z: -15, tile: true, scale: 1.6 }, { type: 'tree', x: -16, z: 10, color: 0xd8a0b0 }, { type: 'tree', x: 16, z: 10, color: 0xd8a0b0 }],
};
// 자음 그림판 다섯(차례는 글자와 다르게)과 그 앞에 서는 자리(+z 2.4)
export const BOARDS = [
  { shape: 'tongue', x: -12, z: -6 }, { shape: 'mouth', x: -6, z: -8 }, { shape: 'root', x: 0, z: -9 }, { shape: 'throat', x: 6, z: -8 }, { shape: 'teeth', x: 12, z: -6 },
];
// 하늘·땅·사람 모형 자리
export const MODELS = { sky: { x: -9, z: 2 }, earth: { x: 0, z: -1 }, person: { x: 9, z: 2 } };
// 낱자를 흩어 놓는 자리(차례와 다르게)
export const LETTER_SPOTS = [{ x: -10, z: -7 }, { x: 9, z: -5 }, { x: -3, z: 3 }, { x: 11, z: 6 }, { x: 2, z: -8 }, { x: -11, z: 6 }];
const LETTER_ORDER = [[2, 4, 0, 3], [1, 5, 2, 0, 4, 3]]; // 낱말마다 낱자가 놓이는 자리 번호

const PEOPLE = ['commoner', 'scholar'];
const NEAR_SEJONG = [0, -1.2]; // 단상 앞(놀이를 마치고 돌아오는 곳)
const AFTER = [-7, 5.5]; // 미니게임을 다 마친 뒤 서는 곳(앞에 빛나는 문)
let scene = null;
// 세종에게 말 거는 자리: 단상 앞 계단 아래(세종은 단상 위에 앉아 있어 그 자리까지는 못 간다)
const talkSpot = world => { const p = world.npcs.get('sejong').mesh.position; return { x: p.x, z: p.z + 1.4 }; };

// 탐험 표시: 아직 안 들은 사람에게 느낌표, 모두 들어야 세종에게도(C-01)
export function markCourt(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('sejong').mark.visible = heard.size === PEOPLE.length;
  const who = PEOPLE.find(id => !heard.has(id));
  const next = who ? world.npcs.get(who).mesh.position : talkSpot(world); // 세종은 단상 위라 단상 앞 계단 아래를 가리킨다
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
export function courtTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 세종의 결심 장면: 백성과 학자가 세종 곁으로 걸어와 선다
function gatherToSejong(world) {
  const [sx, sz] = scene.sejongAt;
  const to = { commoner: [sx - 3.3, sz + 1.2], scholar: [sx + 3.3, sz + 1.2] }; // 품계석 줄 바깥, 단상 양옆
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      let moving = false;
      for (const id of PEOPLE) {
        const n = world.npcs.get(id), m = n.mesh.position, [tx, tz] = to[id], dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
        n.collider.r = 0;
        if (d > 0.1) { moving = true; const st = Math.min(d, 4 * dt); world.moveNpc(id, m.x + dx / d * st, m.z + dz / d * st, Math.atan2(dx, dz)); }
        else n.mesh.rotation.y = Math.atan2(sx - m.x, sz - m.z);
      }
      if (!moving) { off(); resolve(); }
    });
  });
}

// 단상 위에 앉은 세종과 이야기하기: 보통 대화 카메라는 서 있는 사람 얼굴 높이에 맞춰져 있어, 높이 앉은 세종의 얼굴을 정면에서 크게 본다
async function talkSejong(ctx, lines) {
  const { world, dialogue } = ctx;
  const sj = world.npcs.get('sejong').mesh, face = (sj.userData.seatLift || 0) + 2.15;
  sj.rotation.y = 0; // 어좌에 앉아 남쪽(마당)을 본다
  const shown = world.player.visible;
  world.player.visible = false;
  world.setFixedCamera([sj.position.x, face + 0.05, sj.position.z + 2.7], [sj.position.x, face - 0.35, sj.position.z]);
  try { await sayAll(dialogue, lines); } finally {
    dialogue.close();
    world.player.visible = shown;
    world.camMode = 'follow'; world.snapCamera();
  }
}
// 놀이 사이(K-02·C-05): 세종에게 다시 가서 말을 걸어야 다음 놀이를 받는다
async function questFromSejong(ctx, quest, lines) {
  const { world } = ctx;
  const sj = world.npcs.get('sejong');
  sj.mark.visible = true;
  await waitInteract(ctx, { pos: talkSpot(world), quest, label: '세종과 이야기하기', mark: false, r: 1.8 });
  sj.mark.visible = false;
  ctx.input.enabled = false;
  await talkSejong(ctx, lines);
}

// SVG 그림을 3D 그림판에 그린다(그림이 다 그려지면 텍스처를 바꾼다)
function pictureBoard(svg) {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 220;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => { const c = cv.getContext('2d'); if (c) { c.drawImage(img, 0, 0, 320, 220); tex.needsUpdate = true; } };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.95, 0.12), mat(0x6b4a32, 'wood'));
  frame.position.y = 1.9; g.add(frame);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.72), new THREE.MeshBasicMaterial({ map: tex }));
  pic.position.set(0, 1.9, 0.07); g.add(pic);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), mat(0x5a3f2a, 'wood')); leg.position.set(sx * 1.1, 0.5, 0); g.add(leg); }
  return g;
}
// 하늘(둥근 것)·땅(평평한 것)·사람(서 있는 것) 모형
function vowelModel(shape) {
  const g = new THREE.Group();
  if (shape === 'sky') {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6), mat(0x5a3f2a, 'wood')); post.position.y = 0.7; g.add(post);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 12), new THREE.MeshLambertMaterial({ color: 0x6fa6d8 })); ball.position.y = 2.1; g.add(ball);
  } else if (shape === 'earth') {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 1.6), new THREE.MeshLambertMaterial({ color: 0x8a6a45 })); slab.position.y = 0.2; g.add(slab);
    const grass = new THREE.Mesh(new THREE.BoxGeometry(4, 0.06, 1.6), new THREE.MeshLambertMaterial({ color: 0x6a8a4c })); grass.position.y = 0.43; g.add(grass);
  } else {
    const p = makePerson(LOOKS.commoner); p.userData.noWalk = true; p.scale.setScalar(1.2); g.add(p);
  }
  return g;
}

// 1) 자음: 그림판 다섯을 아무 차례로 찾아가 그 모양을 본뜬 글자를 고른다. ㄴ을 맞히면 그 자리에서 획 더하기(ㄷ, ㅌ)
async function makeConsonants(ctx, easy, arena) {
  const { dialogue } = ctx;
  const C = script.consonants, S = script.strokes;
  let missed = false;
  const spots = BOARDS.map(b => {
    const pic = C.pictures.find(p => p.shape === b.shape);
    const g = pictureBoard(SHAPES[b.shape]); g.position.set(b.x, 0, b.z); arena.group.add(g);
    const w = arena.at(b.x, b.z + 2.4);
    return { ...w, pic, board: g, label: pic.caption };
  });
  // 고르기: 맞을 때까지(틀리면 해설). 테스트 봇에게는 답 번호를 알려 준다
  const ask = async (prompt, options, answer) => {
    for (;;) {
      ctx.testHooks.choice = options.indexOf(answer);
      const i = await dialogue.choose(prompt, options);
      ctx.testHooks.choice = null;
      if (options[i] === answer) { ctx.audio.play('correct'); return; }
      missed = true; ctx.audio.play('wrong');
      await dialogue.say({ who: 'guide', text: `「${options[i]}」이 아니에요. ${C.fail}` });
    }
  };
  const carve = (board, text) => { const old = board.getObjectByName('carved'); if (old) board.remove(old); const s = labelSprite(text, { size: 1.3 }); s.name = 'carved'; s.position.set(0, 3.5, 0.1); board.add(s); };
  ctx.testHooks.carved = [];
  await visitAny(ctx, spots, async sp => {
    await ask(C.ask(sp.pic.caption), C.options, sp.pic.answer);
    carve(sp.board, sp.pic.answer); ctx.testHooks.carved.push(sp.pic.answer);
    if (sp.pic.answer === 'ㄴ') { // 소리가 세지면 획을 더한다: ㄴ → ㄷ → ㅌ
      for (const st of S.steps) { await ask(S.ask(st.base), st.options, st.answer); }
      carve(sp.board, 'ㄴ → ㄷ → ㅌ');
      await sayAll(dialogue, S.done);
    }
    dialogue.close();
  });
  return missed ? 'missed' : true;
}

// 모형 이름표 높이: '사람'은 사람 모형 머리 위로(얼굴을 가리지 않게, K-03)
export const VOWEL_LABEL_Y = { sky: 3.4, earth: 2.8, person: 4.3 };
// 만들 모음을 마당 바닥에 크게 쓴 판(K-03)
function floorLetter(letter) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  if (c) {
    c.fillStyle = 'rgba(239,227,198,0.92)'; c.beginPath(); c.arc(128, 128, 122, 0, 7); c.fill();
    c.strokeStyle = '#6b4a32'; c.lineWidth = 10; c.stroke();
    c.fillStyle = '#231c14'; c.font = 'bold 170px "Nanum Myeongjo", Batang, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(letter, 128, 136);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.name = 'floorLetter'; m.userData.text = letter;
  return m;
}

// 2) 모음: 바닥에 크게 쓴 모음이 본뜬 모형(하늘·땅·사람) 앞에 가서 누른다
async function makeVowels(ctx, easy, arena) {
  const { dialogue } = ctx;
  const V = script.vowels;
  const tiles = V.models.map(m => {
    const at = MODELS[m.shape], g = vowelModel(m.shape); g.position.set(at.x, 0, at.z); arena.group.add(g);
    const lab = labelSprite(m.label, { size: 1 }); lab.position.set(at.x, VOWEL_LABEL_Y[m.shape], at.z); arena.group.add(lab);
    return { ...arena.at(at.x, at.z + 2.4), label: m.label, letter: m.letter };
  });
  let missed = false, floor = null;
  ctx.testHooks.floorLetters = [];
  try {
    for (const letter of V.rounds) {
      if (floor) floor.removeFromParent();
      floor = floorLetter(letter); floor.position.set(0, 0.07, 5); arena.group.add(floor); // 학생이 서는 곳(남쪽)과 모형 사이 바닥
      ctx.testHooks.floorLetters.push(letter);
      await dialogue.say(V.ask(letter)); dialogue.close();
      const r = await standPick(ctx, tiles, tiles.findIndex(t => t.letter === letter), { easy, hint: V.fail });
      if (r === 'missed') missed = true;
    }
  } finally { if (floor) floor.removeFromParent(); }
  return missed ? 'missed' : true;
}

// 집현전 앞마당 무대를 세우고 학생을 남쪽에 세운 뒤 play(arena)를 하고 치운다
// 끝나면 궁궐 마당의 세종 단상 앞으로 돌아온다
async function inYard(ctx, play) {
  const { world } = ctx;
  await ctx.fade(true);
  const arena = buildArena(world, YARD);
  const p = arena.at(0, 11);
  placePlayer(world, [p.x, p.z]);
  await ctx.fade(false);
  try { return await play(arena); } finally {
    await ctx.fade(true);
    arena.dispose();
    placePlayer(world, NEAR_SEJONG);
    await ctx.fade(false);
  }
}

// 3) 낱자 주워 모으기: 흩어진 낱자를 소리 나는 차례대로 찾아가 누르면 글자판에 낱말이 모인다(차례가 아니면 줍지 못한다)
function gatherWord(ctx, w, k, easy) {
  let board = null;
  return PLAY.stops(ctx, {
    arena: YARD, from: [0, 11], counter: `「${w.word}」 모은 낱자`, fail: script.wordsFail,
    spots: w.cards.map((label, i) => ({ label, ...LETTER_SPOTS[LETTER_ORDER[k][i]] })),
    act: (i, s) => {
      if (board) s.arena.group.remove(board);
      board = labelSprite(w.build[i], { size: 2 }); board.position.set(0, 4.2, -10); s.arena.group.add(board);
      ctx.testHooks.word = w.build[i];
    },
  }, easy);
}

export const devScene = () => scene; // 개발용(사진 찍기)
export const devVowels = ctx => inYard(ctx, arena => makeVowels(ctx, false, arena)); // 개발용(모음 놀이 사진)

export default {
  id: 'j2',
  mood: 'spring',
  player: LOOKS.kid,
  script,
  quizzes: script.quizzes,
  stories: { proclaim: proclaimScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildJ2Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  // 장 도입(C-03): ① 한자로 쓴 방 앞에서 글을 읽지 못하는 백성 ② 근정전 앞 단상 위에 앉아 백성을 생각하는 세종
  introScene() {
    const [sx, sz] = scene.sejongAt;
    return {
      shots: [
        { cam: [-0.8, 2.4, 10.6], look: [-5, 1.6, 7.4], to: { cam: [-1.8, 2.2, 9.7], look: [-5, 1.6, 7.4] } },
        { cam: [sx + 1.2, 2.4, sz + 6], look: [sx, 3.2, sz], to: { cam: [sx + 0.3, 3.4, sz + 3.4], look: [sx, 3.4, sz] } },
      ],
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 마당 서쪽 빈 땅, 남쪽(학생이 서는 곳)을 본다
  portal: { at: [-7, -0.5], ry: 0 },

  enterStage(ctx, stage) {
    scene.gate.setOpen(0);
    if (stage === 'minigame') placePlayer(ctx.world, NEAR_SEJONG);
    if (stage === 'quiz') placePlayer(ctx.world, AFTER);
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markCourt(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, courtTalk(id, heard));
            heard.add(id); markCourt(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (id !== 'sejong') return;
          if (heard.size < PEOPLE.length) { await talkSejong(ctx, n.wait); return; } // 모두 들어야 진행(C-01)
          [...PEOPLE, 'sejong'].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          await gatherToSejong(world); // 결심 장면: 백성과 학자가 곁으로 모인다
          await talkSejong(ctx, n.first);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    const G = script.goals;
    input.enabled = false;
    world.closeView = true;
    [...PEOPLE, 'sejong'].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    const S = script.npc.sejong;
    // 1) 자음(집현전 앞마당, 짧은 장면 전환). 탐험 끝의 세종 대화가 이 놀이를 준다
    ctx.setGoal(G[2]);
    await showHowTo(ctx.ui, script.consonants.howto);
    parts.push(await tryPart(ctx, easy => inYard(ctx, arena => makeConsonants(ctx, easy, arena)), script.consonants.fail));
    await sayAll(dialogue, script.consonants.done); dialogue.close();
    // 2) 모음: 세종에게 다시 가서 말을 걸어야 시작한다(K-02)
    await questFromSejong(ctx, G[3], S.vowelQuest);
    ctx.setGoal(G[4]);
    await showHowTo(ctx.ui, script.vowels.howto);
    parts.push(await tryPart(ctx, easy => inYard(ctx, arena => makeVowels(ctx, easy, arena)), script.vowels.fail));
    await sayAll(dialogue, script.vowels.done); dialogue.close();
    // 3) 낱자 주워 모으기: 나무, 한글. 이것도 세종에게 가서 받는다
    await questFromSejong(ctx, G[5], S.wordQuest);
    ctx.setGoal(G[6]);
    await showHowTo(ctx.ui, script.wordsHowto);
    parts.push(await tryPart(ctx, async easy => {
      let missed = false;
      for (const [k, w] of script.words.entries()) {
        await dialogue.say(w.intro); dialogue.close();
        const r = await gatherWord(ctx, w, k, easy);
        if (!r) return false;
        if (r === 'missed') missed = true;
      }
      return missed ? 'missed' : true;
    }, script.wordsFail));
    await sayAll(dialogue, script.wordsDone);
    dialogue.close();
    await proclaimScene(ctx); // 끝 해설 장면(D-58): 1446년 훈민정음을 널리 알린다(result 앞 두 문장)
    await sayAll(dialogue, script.result.slice(2));
    dialogue.close();
    await ctx.fade(true);
    placePlayer(world, AFTER);
    await ctx.fade(false);
    return sumParts(parts);
  },
};
