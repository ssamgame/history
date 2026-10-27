// 조선편 3장 「세종 때의 과학 기술」: 한양 탐험(백성·장영실·세자) → 놀이 「해 그림자 맞추기」(chapters/kit/dial.js, 2026-10-27) → 자격루 · 측우기 짧은 장면 → 퀴즈.
import { buildJ3Scene } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { dial } from '../../kit/dial.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../common.js';
import script from './script.js';

// 자격루 장면에서 장영실이 자격루가 돌아가는 모습을 차례로 설명한다
const CLOCK_TALK = [
  [{ who: 'jangyeongsil', text: '물항아리에서 물이 일정하게 흘러 들어와 차오르지.' }],
  [{ who: 'jangyeongsil', text: '물이 차면 쇠구슬이 굴러 떨어진다네.' }],
  [{ who: 'jangyeongsil', text: '떨어진 구슬이 나무 인형을 움직이지.' }],
  [{ who: 'jangyeongsil', text: '인형이 종과 북을 울려 시간을 알린다! 사람이 손대지 않아도 말이야.' }],
];

const ORDER = ['commoner', 'jangyeongsil', 'crownPrince'];
const SPOT = [-4, -3];
let scene = null;

// 앙부일구의 낮 시각선(인시~술시, 서쪽→동쪽)과 12지신 동물. 가운데(오시)가 자오선이다.
export const HOURS = [['호랑이', '🐯'], ['토끼', '🐰'], ['용', '🐲'], ['뱀', '🐍'], ['말', '🐴'], ['양', '🐑'], ['원숭이', '🐵'], ['닭', '🐔'], ['개', '🐶']];
// 그림자가 닿는 시각선 번호와 보기 순서(정답 자리가 매번 다르게)
export const DIAL_ROUNDS = [{ h: 4, opts: [5, 4, 3] }, { h: 2, opts: [2, 3, 1] }, { h: 6, opts: [7, 5, 6] }];
// 측우기 물 높이(눈금)와 보기
export const GAUGE_ROUNDS = [{ lv: 5, opts: [6, 5, 4] }, { lv: 3, opts: [3, 5, 2] }];

// 앙부일구를 위에서 본 그림: 그릇 둘레, 세로 시각선, 줄 아래 동물 그림, 그림자(검은 줄)
export function dialSVG(hour) {
  const x = i => 50 + i * 25;
  const lines = HOURS.map((h, i) => `<line x1="${x(i)}" y1="34" x2="${x(i)}" y2="134" stroke="#5a4130" stroke-width="1.4"/><text x="${x(i)}" y="152" font-size="19" text-anchor="middle">${h[1]}</text>`).join('');
  return `<svg viewBox="0 0 300 160" role="img" aria-label="앙부일구"><ellipse cx="150" cy="80" rx="128" ry="58" fill="#c9a86a" stroke="#6b4a32" stroke-width="3"/>
    ${lines}<line x1="${x(hour)}" y1="30" x2="${x(hour)}" y2="126" stroke="#1b1f1d" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <circle cx="150" cy="28" r="4" fill="#3a3028"/><text x="150" y="16" font-size="11" text-anchor="middle" fill="#3a3028">그림자 바늘</text></svg>`;
}
// 측우기를 옆에서 자른 그림: 쇠 원통, 고인 빗물, 옆의 자 눈금 1~6
export function gaugeSVG(level) {
  const y = n => 140 - n * 20;
  const ticks = Array.from({ length: 7 }, (_, n) => `<line x1="182" y1="${y(n)}" x2="202" y2="${y(n)}" stroke="#3a3028" stroke-width="2.5"/>${n ? `<text x="208" y="${y(n) + 6}" font-size="17" font-weight="700">${n}</text>` : ''}`).join('');
  return `<svg viewBox="0 0 300 160" role="img" aria-label="측우기"><rect x="100" y="16" width="70" height="124" fill="#e9e4da" stroke="#4a4a48" stroke-width="6"/>
    <rect x="103" y="${y(level)}" width="64" height="${140 - y(level)}" fill="#6fa6c8"/><line x1="103" y1="${y(level)}" x2="167" y2="${y(level)}" stroke="#2f5f75" stroke-width="2"/>
    <rect x="178" y="12" width="20" height="130" fill="#d8c9a0" stroke="#6b4a32"/>${ticks}<text x="135" y="155" font-size="12" text-anchor="middle">측우기</text><text x="190" y="155" font-size="12" text-anchor="middle">자</text></svg>`;
}

export default {
  id: 'j3',
  mood: 'summer',
  player: { robe: 0x4a6a7a, hat: 'topknot', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildJ3Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') ctx.setGoal(script.goals[4]);
  },

  explore(ctx) { return talkInOrder(ctx, script, ORDER, scene.start); },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setTalkStep(ctx, script, ORDER, 3);
    world.setGoal(null);
    await showHowTo(ctx.ui, script.dial.howto);
    // 놀이 「해 그림자 맞추기」(2026-10-27, 카드 대신): 해를 옮겨 그림자를 목표 시각 줄에 맞춘다. 세 번 모두 맞히면 성공
    const D = script.dial;
    const parts = [await tryPart(ctx, async easy => {
      let missed = false;
      for (const { h } of DIAL_ROUNDS) {
        const r = await dial(ctx, { hours: HOURS, target: h, title: D.title, prompt: D.prompt(HOURS[h]), hint: D.fail, easy });
        if (!r.ok) return false;
        if (r.wrong) missed = true;
      }
      return missed ? 'missed' : true;
    }, D.fail)];
    await sayAll(dialogue, D.done); dialogue.close();
    // 자격루(장면): 물이 차고 구슬이 구르고 인형이 종 · 북을 울린다
    scene.ringClock(); ctx.audio.play('tap');
    await sayAll(dialogue, [...CLOCK_TALK.flat(), ...script.clock.done]); dialogue.close();
    // 측우기(장면): 소나기가 지나가고 빗물을 잰다
    scene.setRain(true);
    await sayAll(dialogue, script.rain.shower); dialogue.close();
    await ctx.wait(1500);
    scene.setRain(false);
    await sayAll(dialogue, script.rain.done); dialogue.close();
    placePlayer(world, SPOT);
    ctx.setGoal(script.goals[4]);
    return sumParts(parts);
  },
};
