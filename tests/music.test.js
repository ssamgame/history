import { test, eq, ok } from './harness.js';
import { THEMES, SCALE, SCALES, MAP_THEMES, barEvents, createMusic, noteFreq, playLevel } from '../core/music.js';
import { runChapter } from '../core/flow.js';
import { memSave } from './bot.js';

// 소리 장치 대신 쓰는 가짜: 만든 소리 마디 수만 센다
function fakeAudioContext() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = extra => ({ connect(n) { return n; }, disconnect() {}, start() {}, stop() {}, ...extra });
  const c = {
    made: 0, currentTime: 0, state: 'running', destination: node(), sampleRate: 8000,
    resume() { c.state = 'running'; return Promise.resolve(); },
    createOscillator() { c.made += 1; return node({ type: 'sine', frequency: param(), detune: param() }); },
    createGain() { return node({ gain: param() }); },
    createBiquadFilter() { return node({ type: 'lowpass', frequency: param(), Q: param() }); },
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
    createBufferSource() { c.made += 1; return node({ buffer: null, playbackRate: param() }); },
  };
  return c;
}

test('music: every chapter has its own theme on a known scale', async () => {
  const { ALL_CHAPTERS } = await import('../chapters/index.js');
  eq(Object.keys(THEMES).sort(), ALL_CHAPTERS.map(c => c.id).sort());
  eq(SCALE.length, 5);
  for (const [id, t] of Object.entries(THEMES)) ok(Object.values(SCALES).includes(t.scale || SCALE), `${id} scale`);
  const tempos = new Set(Object.values(THEMES).map(t => t.tempo));
  ok(tempos.size >= 4, 'chapters do not all sound alike');
  for (const [id, t] of Object.entries(THEMES)) {
    ok(t.root > 40 && t.root < 200, `${id} root`);
    ok(t.motif.length >= 4 && t.motif.every(([s, deg]) => Number.isInteger(s) && Number.isInteger(deg)), `${id} motif`);
  }
});

test('music: battle bars are busier and louder than calm bars in every chapter', () => {
  for (const id of Object.keys(THEMES)) {
    const calm = barEvents(THEMES[id], 'calm', 0), battle = barEvents(THEMES[id], 'battle', 0);
    const hits = evs => evs.filter(e => ['drum', 'wood', 'clack', 'snare', 'soft'].includes(e.kind)).length;
    ok(hits(battle) > hits(calm), `${id}: ${hits(battle)} vs ${hits(calm)} hits`);
    const peak = evs => Math.max(...evs.map(e => e.vel || 0));
    ok(peak(battle) >= peak(calm), `${id} louder`);
  }
});

test('music: plays a chapter theme, changes intensity, stops, and stays silent when off', () => {
  const ac = fakeAudioContext();
  const m = createMusic({ makeContext: () => ac });
  m.play('ch3');
  eq(m.state.theme, 'ch3'); eq(m.state.level, 'calm'); ok(m.state.playing);
  m.tick(); // 다음 몇 박자를 미리 예약한다
  ok(ac.made > 0, 'notes scheduled');
  m.setLevel('battle'); eq(m.state.level, 'battle');
  m.stop(); eq(m.state.playing, false);
  const before = ac.made;
  m.setEnabled(false);
  m.play('ch2'); m.tick();
  eq(ac.made, before, 'silent when turned off');
  eq(m.state.theme, 'ch2', 'remembers the theme for when it is turned back on');
  m.setEnabled(true); ok(m.state.playing, 'resumes when turned on');
  m.stop();
});

test('music: calm while exploring, battle during the minigame, calm for the quiz', async () => {
  const levels = [];
  const ch = {
    script: { intro: [] }, quizzes: [{ question: 'Q', options: ['a', 'b'], answer: 0, explain: '' }],
    buildScene() {}, async explore() { levels.push(`explore:${music.state.level}`); },
    async minigame() { levels.push(`minigame:${music.state.level}`); return { firstTryCorrect: 0, firstTryTotal: 0, easyModeUsed: false }; },
  };
  const music = { state: { level: null }, setLevel(l) { this.state.level = l; } };
  const ctx = { music, screens: { showIntroCard: async () => {} }, dialogue: { quiz: async () => { levels.push(`quiz:${music.state.level}`); return { correct: true }; }, close() {} } };
  await runChapter({ id: 'fake', no: 1, title: 'x' }, ch, ctx, memSave());
  eq(levels, ['explore:calm', 'minigame:battle', 'quiz:calm']);
});

test('menu: separate music switch', async () => {
  const { showMenu } = await import('../core/screens.js');
  const el = document.createElement('div'); document.body.appendChild(el);
  const changes = [];
  const p = showMenu(el, { muted: false, music: true, quality: 'medium' }, c => changes.push(c));
  const b = [...el.querySelectorAll('button')].find(x => x.textContent.includes('음악'));
  ok(b && b.textContent.includes('켜짐'), 'music switch');
  b.click();
  eq(changes, [{ music: false }]); ok(b.textContent.includes('꺼짐') && el.querySelector('.menu'), '눌러도 메뉴는 열려 있고 상태만 바뀐다');
  [...el.querySelectorAll('button')].find(x => x.textContent === '닫기').click();
  await p; el.remove();
});

// 시대와 상황에 맞는 음악
test('music: 시대마다 악기와 음계가 다르다', () => {
  const ids = p => Object.keys(THEMES).filter(id => id.match(p));
  const insts = p => new Set(ids(p).map(id => THEMES[id].inst || 'daegeum'));
  eq([...insts(/^(ch|j)\d$/)], ['daegeum'], '고려·조선은 국악(대금)');
  ok(insts(/^h\d$/).has('piano'), '현대에는 피아노');
  ok(insts(/^i\d$/).has('organ'), '일제 강점기에는 풍금');
  ok(insts(/^k\d$/).has('reed'), '근대에는 태평소');
  ok(ids(/^i\d$/).filter(id => THEMES[id].scale === SCALES.minor).length >= 3, '일제 강점기는 단조가 많다');
  ok(new Set(Object.values(THEMES).map(t => t.inst || 'daegeum')).size >= 5, '악기가 다섯 가지 이상');
});

test('music: 미니게임 음악은 장의 상황에 맞다 (전투는 세게, 잔치는 신나게, 슬픈 장면은 잔잔하게)', () => {
  for (const id of ['ch3', 'j4', 'k3', 'i4', 'h3']) eq(playLevel(THEMES[id], 'battle'), 'battle', id);
  for (const id of ['k4', 'k5', 'h1', 'h6']) eq(playLevel(THEMES[id], 'battle'), 'lively', id);
  for (const id of ['ch5', 'j2', 'i1', 'h4', 'h5']) eq(playLevel(THEMES[id], 'battle'), 'gentle', id);
  for (const id of Object.keys(THEMES)) eq(playLevel(THEMES[id], 'calm'), 'calm', `${id} 탐험은 잔잔하게`);
  const t = THEMES.h1;
  ok(!barEvents(t, 'lively', 0).some(e => e.kind === 'pulse'), '신나는 음악에는 전투 맥박이 없다');
  const peak = evs => Math.max(...evs.map(e => e.vel || 0));
  ok(peak(barEvents(t, 'gentle', 0)) < peak(barEvents(t, 'battle', 0)), '잔잔한 쪽이 더 작다');
});

test('music: 일곱 음 음계는 일곱 칸마다 한 옥타브', () => {
  eq(Math.round(noteFreq(100, 7, SCALES.major)), 200);
  eq(Math.round(noteFreq(100, 5, SCALE)), 200);
});

test('music: 시대 지도마다 그 시대 음악이 있고, 새 악기도 소리를 낸다', () => {
  eq(Object.keys(MAP_THEMES).sort(), ['map:colonial', 'map:goryeo', 'map:joseon', 'map:modern', 'map:present']);
  const ac = fakeAudioContext();
  const m = createMusic({ makeContext: () => ac });
  for (const id of ['map:present', 'h6', 'i2', 'k4', 'h4']) {
    const before = ac.made;
    m.play(id); m.setLevel('battle'); ac.currentTime += 3; m.tick();
    ok(ac.made > before, `${id} 소리 남`);
  }
  m.stop();
});
