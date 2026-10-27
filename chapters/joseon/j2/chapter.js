// 조선편 2장 「세종과 훈민정음」: 궁궐 탐험(백성·집현전 학자·세종) → 글자 만들기(기본 자음, 획 더하기, 모음, 낱말 모으기) → 퀴즈.
import { buildJ2Scene } from './scene.js';
import { showHowTo, chooseCards } from '../../../core/minigame.js';
import { SHAPES, NATURE, TREE, LETTERS as LETTER_TILES, plusStroke } from './pictures.js';
import { PLAY } from '../../kit/play.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../common.js';
import script from './script.js';

// 미니게임 무대(마을에서 떨어진 x 400): 집현전 앞마당. 모양 팻말 자리, 글자 이름표가 흩어져 있다.
export const YARD = {
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -18, x1: 18, z0: -14, z1: 14 },
  props: [{ type: 'hanok', x: 0, z: -15, tile: true, scale: 1.6 }, { type: 'tree', x: -16, z: 10, color: 0xd8a0b0 }, { type: 'tree', x: 16, z: 10, color: 0xd8a0b0 }],
};
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const bins = board => board.slots.map(s => ({ id: s.id, label: s.label }));
const cards = board => board.items.map(it => ({ text: it.label, bin: board.slots.find(s => s.answer === it.id).id }));
export const C_BINS = [{ x: -12, z: -6 }, { x: 0, z: -7 }, { x: 12, z: -6 }, { x: -7, z: 4 }, { x: 7, z: 4 }];
const V_BINS = [{ x: -11, z: -4 }, { x: 0, z: -6 }, { x: 11, z: -4 }];
const LETTERS = [{ x: -10, z: -7 }, { x: 9, z: -5 }, { x: -3, z: 3 }, { x: 11, z: 6 }, { x: 2, z: -8 }, { x: -11, z: 6 }]; // 낱자 이름표 자리(차례와 다르게)
const letterStops = (letters, order) => letters.map((label, i) => ({ label, ...LETTERS[order[i]] }));

const ORDER = ['commoner', 'scholar', 'sejong'];
const NEAR_SEJONG = [0, -2];
let scene = null;

// 기본 자음 판: 글자 다섯을 본뜬 모양 자리에 놓는다(자리 순서는 글자 순서와 다르게)
export const CONSONANTS = {
  items: [{ id: 'g', label: 'ㄱ' }, { id: 'n', label: 'ㄴ' }, { id: 'm', label: 'ㅁ' }, { id: 's', label: 'ㅅ' }, { id: 'o', label: 'ㅇ' }],
  slots: [
    { id: 'mouth', label: '입 모양', xy: [18, 28], answer: 'm' },
    { id: 'tongue', label: '혀가 윗잇몸에 붙는 모양', xy: [50, 28], answer: 'n' },
    { id: 'throat', label: '목구멍 모양', xy: [82, 28], answer: 'o' },
    { id: 'root', label: '혀뿌리가 목구멍을 막는 모양', xy: [30, 72], answer: 'g' },
    { id: 'teeth', label: '이 모양', xy: [70, 72], answer: 's' },
  ],
};
export const VOWELS = {
  items: [{ id: 'dot', label: 'ㆍ' }, { id: 'flat', label: 'ㅡ' }, { id: 'stand', label: 'ㅣ' }],
  slots: [
    { id: 'person', label: '사람(서 있어요)', xy: [20, 50], answer: 'stand' },
    { id: 'sky', label: '하늘(둥글어요)', xy: [50, 50], answer: 'dot' },
    { id: 'earth', label: '땅(평평해요)', xy: [80, 50], answer: 'flat' },
  ],
};

export default {
  id: 'j2',
  mood: 'spring',
  player: LOOKS.kid,
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildJ2Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame') placePlayer(ctx.world, NEAR_SEJONG);
    if (stage === 'quiz') { placePlayer(ctx.world, NEAR_SEJONG); ctx.setGoal(script.goals[4]); }
  },

  explore(ctx) { return talkInOrder(ctx, script, ORDER, scene.start); },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setTalkStep(ctx, script, ORDER, 3);
    world.setGoal(null);
    await showHowTo(ctx.ui, {
      title: '글자 만들기',
      steps: ['그림을 보고 알맞은 글자 카드를 골라요.', '기본 자음은 소리를 낼 때의 입·혀·이·목구멍 모양을 본떴어요.', '모음은 하늘·땅·사람을 본떴어요.', '틀리게 고르면 해설을 보고 다시 골라요.'],
      keyboard: '카드를 눌러 골라요', touch: '카드를 눌러 골라요',
    });
    // 그림 한 장씩: 맞는 카드 하나를 고른다. 한 차례(라운드) 안에서 한 번이라도 틀리면 그 차례는 'missed'
    const round = (screens, hint) => async easy => {
      let missed = false;
      for (const sc of screens) {
        const r = await chooseCards(ctx, { title: sc.title, prompt: sc.prompt, figure: sc.figure, cards: sc.options.map(t => ({ text: t, correct: t === sc.answer })), easy, hint });
        if (r !== true) missed = true;
      }
      return missed ? 'missed' : true;
    };
    const C = script.consonants, S = script.strokes, V = script.vowels;
    const parts = [];
    parts.push(await tryPart(ctx, round(C.pictures.map((p, i) => ({ title: `${C.title} (${i + 1}/${C.pictures.length})`, prompt: `그림은 「${p.caption}」이에요. 이 모양을 본떠 만든 글자는?`, figure: SHAPES[p.shape], options: C.options, answer: p.answer })), C.fail), C.fail));
    await sayAll(dialogue, C.done); dialogue.close();
    parts.push(await tryPart(ctx, round(S.steps.map(st => ({ title: S.title, prompt: `「${st.base}」에 획을 하나 더하면 어떤 글자가 될까요?`, figure: plusStroke(st.base), options: st.options, answer: st.answer })), S.fail), S.fail));
    await sayAll(dialogue, S.done); dialogue.close();
    parts.push(await tryPart(ctx, round(V.pictures.map(p => ({ title: V.title, prompt: `그림은 「${p.caption}」이에요. 이것을 본떠 만든 모음은?`, figure: NATURE[p.shape], options: V.options, answer: p.answer })), V.fail), V.fail));
    await sayAll(dialogue, V.done); dialogue.close();
    parts.push(await tryPart(ctx, round(script.words.map((w, k) => ({ title: w.title, prompt: w.prompt, figure: k ? LETTER_TILES(w.cards) : TREE, options: w.options, answer: w.answer })), script.wordsFail), script.wordsFail));
    await sayAll(dialogue, script.wordsDone);
    await sayAll(dialogue, script.result);
    dialogue.close();
    placePlayer(world, NEAR_SEJONG);
    ctx.setGoal(script.goals[4]);
    return sumParts(parts);
  },
};
