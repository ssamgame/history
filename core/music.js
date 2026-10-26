// 배경음악: 소리 파일 없이 Web Audio로 그 자리에서 연주한다(저작권 걱정 없고 오프라인에서도 된다).
// 시대마다 악기와 음계가 다르다: 고려·조선은 국악(대금·북·목탁), 근대는 태평소·군악대·풍금, 일제 강점기는 단조 풍금·피아노·행진,
// 현대는 장조 피아노·나팔(전쟁 장면은 단조). 탐험은 잔잔하게(calm), 미니게임은 장의 상황에 맞게 전투(battle)·신나게(lively)·잔잔하게(gentle).

export const SCALE = [0, 3, 5, 7, 10]; // 계면조 느낌의 5음(라 도 레 미 솔)

// motif: [시작 칸, 음계 단계, 길이(칸)] — 두 마디(meter×2 칸)짜리 가락
export const THEMES = {
  ch1: { name: '담판의 긴장', tempo: 66, root: 110, meter: 16, perc: 'drum',
    motif: [[0, 5, 6], [8, 7, 4], [12, 6, 4], [16, 5, 8], [26, 4, 6]] },
  ch2: { name: '흥화진의 눈보라', tempo: 100, root: 73.42, meter: 16, perc: 'drum',
    motif: [[0, 5, 2], [2, 6, 2], [4, 7, 4], [8, 6, 2], [10, 5, 2], [12, 4, 4], [16, 5, 4], [20, 8, 4], [24, 7, 8]] },
  ch3: { name: '귀주의 폭풍', tempo: 112, root: 65.41, meter: 16, perc: 'drum',
    motif: [[0, 7, 3], [3, 8, 3], [6, 7, 2], [8, 5, 4], [12, 6, 4], [16, 7, 2], [18, 9, 2], [20, 8, 4], [24, 7, 4], [28, 5, 4]] },
  ch4: { name: '처인성의 활', tempo: 96, root: 82.41, meter: 16, perc: 'drum',
    motif: [[0, 5, 4], [4, 4, 2], [6, 5, 2], [8, 7, 6], [16, 6, 4], [20, 5, 2], [22, 4, 2], [24, 3, 8]] },
  ch5: { name: '대장경을 새기는 마음', tempo: 60, root: 98, meter: 16, perc: 'wood',
    motif: [[0, 5, 8], [8, 6, 4], [12, 7, 4], [16, 6, 8], [24, 5, 8]] },
  // 2026-10-26 고려편 장 구성 변경: 옛 6장(ch6, 삼별초) 곡 대신 새 4장(ch7, 윤관 · 별무반) 곡. 삼별초는 새 6장(ch5)에 합쳐졌다
  ch7: { name: '별무반의 진군', tempo: 104, root: 61.74, meter: 16, perc: 'drum',
    motif: [[0, 5, 2], [2, 5, 2], [4, 7, 4], [8, 8, 4], [12, 7, 2], [14, 6, 2], [16, 5, 4], [20, 7, 4], [24, 9, 8]] },
  // 조선편
  j1: { name: '장맛비 속 회군', tempo: 84, root: 87.31, meter: 16, perc: 'drum',
    motif: [[0, 5, 4], [4, 6, 2], [6, 5, 2], [8, 4, 4], [12, 3, 4], [16, 5, 6], [22, 7, 2], [24, 6, 8]] },
  j2: { name: '집현전의 봄', tempo: 70, root: 130.81, meter: 12, perc: 'wood',
    motif: [[0, 5, 3], [3, 6, 3], [6, 7, 6], [12, 8, 3], [15, 7, 3], [18, 5, 6]] },
  j3: { name: '물시계와 해시계', tempo: 80, root: 116.54, meter: 16, perc: 'wood',
    motif: [[0, 5, 2], [2, 7, 2], [4, 6, 4], [8, 5, 2], [10, 4, 2], [12, 5, 4], [16, 7, 4], [20, 8, 4], [24, 7, 8]] },
  j4: { name: '한산도 앞바다', tempo: 108, root: 61.74, meter: 12, perc: 'drum',
    motif: [[0, 5, 2], [2, 7, 2], [4, 8, 2], [6, 9, 6], [12, 8, 2], [14, 7, 2], [16, 5, 2], [18, 7, 6]] },
  j5: { name: '남한산성의 겨울', tempo: 62, root: 69.3, meter: 16, perc: 'drum',
    motif: [[0, 5, 8], [8, 4, 4], [12, 3, 4], [16, 4, 6], [22, 5, 2], [24, 3, 8]] },
  j6: { name: '화성을 쌓는 소리', tempo: 96, root: 98, meter: 12, perc: 'drum',
    motif: [[0, 5, 3], [3, 7, 3], [6, 8, 3], [9, 7, 3], [12, 9, 3], [15, 8, 3], [18, 7, 6]] },
};

// 음계: 국악 계면조 5음(기본), 밝은 5음, 서양 장조·단조 7음(근대 이후 들어온 풍금·피아노·군악대 노래)
export const SCALES = { gyemyeon: SCALE, pentaMajor: [0, 2, 4, 7, 9], major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const { pentaMajor, major, minor } = SCALES;

// 고려·조선편 미니게임의 분위기(없으면 전투): 담판·과학·축성은 신나게, 대장경·훈민정음은 잔잔하게
Object.assign(THEMES.ch1, { mg: 'lively' }); Object.assign(THEMES.ch5, { mg: 'gentle' });
Object.assign(THEMES.j1, { mg: 'lively' }); Object.assign(THEMES.j2, { mg: 'gentle' });
Object.assign(THEMES.j3, { mg: 'lively' }); Object.assign(THEMES.j6, { mg: 'lively' });

// 근대(k)·일제 강점기(i)·현대(h)편: 시대마다 악기와 음계를 바꾼다.
// inst: daegeum(대금) reed(태평소) organ(풍금) piano(피아노) brass(군악대 나팔) / perc: drum wood snare(작은북) soft(낮고 여린 북)
// mg: 미니게임 때 분위기 battle(전투) lively(신나게) gentle(잔잔하게)
Object.assign(THEMES, {
  k1: { name: '강화도의 파도', tempo: 76, root: 92.5, meter: 16, perc: 'drum', mg: 'lively',
    motif: [[0, 5, 6], [6, 6, 2], [8, 7, 4], [12, 5, 4], [16, 4, 6], [22, 5, 2], [24, 3, 8]] },
  k2: { name: '우정총국의 밤', tempo: 96, root: 87.31, meter: 16, perc: 'drum', inst: 'reed', mg: 'battle',
    motif: [[0, 7, 2], [2, 8, 2], [4, 7, 2], [6, 5, 2], [8, 6, 4], [12, 5, 4], [16, 7, 2], [18, 9, 2], [20, 8, 4], [24, 7, 8]] },
  k3: { name: '들판의 함성', tempo: 104, root: 98, meter: 12, perc: 'drum', inst: 'reed', mg: 'battle',
    motif: [[0, 5, 2], [2, 7, 1], [3, 8, 3], [6, 7, 3], [9, 5, 3], [12, 6, 2], [14, 7, 1], [15, 8, 3], [18, 5, 6]] },
  k4: { name: '독립문 아래', tempo: 92, root: 98, meter: 16, perc: 'snare', inst: 'brass', scale: pentaMajor, mg: 'lively',
    motif: [[0, 5, 4], [4, 7, 2], [6, 6, 2], [8, 5, 4], [12, 7, 4], [16, 8, 4], [20, 7, 2], [22, 6, 2], [24, 5, 8]] },
  k5: { name: '전차가 달린다', tempo: 100, root: 110, meter: 12, perc: 'soft', inst: 'organ', scale: major, mg: 'lively',
    motif: [[0, 7, 3], [3, 9, 3], [6, 11, 3], [9, 9, 3], [12, 8, 3], [15, 10, 3], [18, 9, 6]] },
  k6: { name: '나라를 지키는 마음', tempo: 70, root: 82.41, meter: 16, perc: 'drum', scale: minor, mg: 'battle',
    motif: [[0, 7, 6], [6, 6, 2], [8, 5, 4], [12, 4, 4], [16, 5, 6], [22, 4, 2], [24, 2, 8]] },
  i1: { name: '빼앗긴 들', tempo: 60, root: 77.78, meter: 16, perc: 'soft', inst: 'organ', scale: minor, mg: 'gentle',
    motif: [[0, 7, 8], [8, 6, 4], [12, 5, 4], [16, 4, 8], [24, 2, 4], [28, 3, 4]] },
  i2: { name: '만세의 물결', tempo: 88, root: 87.31, meter: 16, perc: 'snare', inst: 'organ', scale: minor, mg: 'lively',
    motif: [[0, 4, 4], [4, 7, 4], [8, 6, 2], [10, 7, 2], [12, 9, 4], [16, 8, 4], [20, 7, 2], [22, 6, 2], [24, 7, 8]] },
  i3: { name: '상하이의 등불', tempo: 72, root: 77.78, meter: 12, perc: 'soft', inst: 'piano', scale: minor, mg: 'gentle',
    motif: [[0, 7, 3], [3, 9, 3], [6, 8, 6], [12, 6, 3], [15, 7, 3], [18, 4, 6]] },
  i4: { name: '청산리 골짜기', tempo: 108, root: 73.42, meter: 16, perc: 'snare', inst: 'brass', scale: minor, mg: 'battle',
    motif: [[0, 4, 2], [2, 7, 2], [4, 9, 4], [8, 8, 2], [10, 7, 2], [12, 6, 4], [16, 7, 2], [18, 9, 2], [20, 11, 4], [24, 10, 8]] },
  i5: { name: '우리말을 지켜라', tempo: 66, root: 98, meter: 16, perc: 'wood', mg: 'gentle',
    motif: [[0, 5, 4], [4, 6, 4], [8, 7, 8], [16, 8, 4], [20, 7, 4], [24, 5, 8]] },
  i6: { name: '광복군의 행진', tempo: 96, root: 82.41, meter: 16, perc: 'snare', inst: 'brass', scale: minor, mg: 'battle',
    motif: [[0, 7, 4], [4, 7, 2], [6, 8, 2], [8, 9, 4], [12, 7, 4], [16, 11, 4], [20, 10, 2], [22, 9, 2], [24, 7, 8]] },
  h1: { name: '광복의 노래', tempo: 104, root: 98, meter: 16, perc: 'snare', inst: 'brass', scale: major, mg: 'lively',
    motif: [[0, 4, 2], [2, 7, 2], [4, 9, 4], [8, 11, 4], [12, 9, 4], [16, 10, 4], [20, 9, 2], [22, 8, 2], [24, 7, 8]] },
  h2: { name: '첫 선거', tempo: 84, root: 110, meter: 12, perc: 'soft', inst: 'piano', scale: major, mg: 'lively',
    motif: [[0, 7, 3], [3, 8, 3], [6, 9, 6], [12, 11, 3], [15, 9, 3], [18, 7, 6]] },
  h3: { name: '전쟁의 그림자', tempo: 100, root: 73.42, meter: 16, perc: 'drum', inst: 'brass', scale: minor, mg: 'battle',
    motif: [[0, 7, 2], [2, 7, 2], [4, 8, 4], [8, 7, 2], [10, 6, 2], [12, 4, 4], [16, 7, 2], [18, 9, 2], [20, 8, 4], [24, 7, 8]] },
  h4: { name: '휴전선', tempo: 58, root: 82.41, meter: 16, perc: 'soft', inst: 'organ', scale: minor, mg: 'gentle',
    motif: [[0, 7, 8], [8, 8, 4], [12, 6, 4], [16, 5, 8], [24, 4, 8]] },
  h5: { name: '다시 일어서다', tempo: 76, root: 98, meter: 12, perc: 'soft', inst: 'piano', scale: pentaMajor, mg: 'gentle',
    motif: [[0, 5, 3], [3, 6, 3], [6, 7, 6], [12, 8, 3], [15, 7, 3], [18, 6, 6]] },
  h6: { name: '함께 이룬 나라', tempo: 108, root: 110, meter: 16, perc: 'snare', inst: 'piano', scale: major, mg: 'lively',
    motif: [[0, 7, 2], [2, 9, 2], [4, 11, 4], [8, 9, 2], [10, 11, 2], [12, 12, 4], [16, 11, 4], [20, 9, 4], [24, 11, 8]] },
});

// 시대 지도(장 고르기 화면)에서 흐르는 음악: 그 시대의 잔잔한 가락
export const MAP_THEMES = {
  'map:goryeo': { ...THEMES.ch5, name: '고려의 하늘', tempo: 64 },
  'map:joseon': { ...THEMES.j2, name: '한양의 아침', tempo: 68 },
  'map:modern': { ...THEMES.k5, name: '새 문물의 거리', tempo: 80 },
  'map:colonial': { ...THEMES.i3, name: '되찾을 나라', tempo: 64 },
  'map:present': { ...THEMES.h5, name: '오늘의 대한민국', tempo: 72 },
};

// 미니게임 때 실제 분위기: 장마다 정한 mg(없으면 전투). 탐험·퀴즈는 늘 잔잔하게.
export const playLevel = (theme, level) => (level === 'battle' ? theme.mg || 'battle' : level);

// 음계 단계 → 주파수 (음계 음 수만큼마다 한 옥타브 위)
export function noteFreq(root, deg, scale = SCALE) {
  const n = scale.length, oct = Math.floor(deg / n), i = ((deg % n) + n) % n;
  return root * 2 ** ((12 * oct + scale[i]) / 12);
}

// 장단(타악기 자리와 세기). 12칸은 6/8 느낌. calm·gentle은 여리게, lively는 행진처럼, battle은 몰아치게.
const PERC = {
  16: { calm: [[0, 0.8], [10, 0.45]], lively: [[0, 0.9], [4, 0.5], [8, 0.8], [12, 0.5], [14, 0.4]], battle: [[0, 1], [3, 0.6], [6, 0.75], [8, 0.9], [11, 0.6], [12, 0.85], [14, 0.7]] },
  12: { calm: [[0, 0.8], [6, 0.5]], lively: [[0, 0.9], [3, 0.45], [6, 0.75], [9, 0.45]], battle: [[0, 1], [2, 0.55], [3, 0.7], [6, 0.9], [8, 0.55], [9, 0.75], [11, 0.6]] },
};
const CLACK = { 16: [4, 12], 12: [3, 9] };
const MELODY_VEL = { calm: 0.5, gentle: 0.42, lively: 0.6, battle: 0.7 };

// 한 마디에 연주할 소리 목록 (순수 함수: 시험과 연주가 같이 쓴다). level은 calm·gentle·lively·battle.
export function barEvents(theme, level, bar) {
  const battle = level === 'battle', m = theme.meter, ev = [];
  const perc = ['wood', 'snare', 'soft'].includes(theme.perc) ? theme.perc : 'drum';
  const pat = battle ? 'battle' : level === 'lively' ? 'lively' : 'calm';
  const soft = level === 'gentle' ? 0.7 : 1;
  for (const [step, vel] of PERC[m][pat]) ev.push({ kind: perc, step, vel: vel * soft });
  if (battle || level === 'lively') for (const step of CLACK[m]) ev.push({ kind: 'clack', step, vel: battle ? 0.5 : 0.35 });
  if (battle) for (let step = 0; step < m; step += 2) ev.push({ kind: 'pulse', step, vel: 0.5 });
  const phrase = Math.floor(bar / 2), half = (bar % 2) * m;
  if (level !== 'calm' || phrase % 2 === 0) { // 잔잔할 때만 가락을 한 번씩 쉰다
    const lift = battle && phrase % 2 === 1 ? 2 : 0; // 전투 때는 가락을 한 번씩 높여 몰아친다
    for (const [s, deg, len] of theme.motif) {
      if (s >= half && s < half + m) ev.push({ kind: 'note', step: s - half, deg: deg + lift, len, vel: MELODY_VEL[level] ?? 0.5 });
    }
  }
  return ev;
}

export function createMusic({ makeContext = () => new (window.AudioContext || window.webkitAudioContext)() } = {}) {
  let ac = null, master = null, droneGain = null, drones = [], noise = null, timer = null;
  let enabled = true, want = false, nextTime = 0, step = 0, bar = 0;
  const state = { theme: null, level: 'calm', playing: false };
  const VOLUME = 0.11; // 교실을 생각해 작게 (효과음보다 조금 작게)

  const theme = () => THEMES[state.theme] || MAP_THEMES[state.theme];
  const level = () => playLevel(theme(), state.level); // 미니게임 때는 장마다 정한 분위기로
  const DRONE = { daegeum: 1, reed: 1, organ: 0.75, brass: 0.6, piano: 0.4 }; // 서양 악기는 낮은 지속음을 줄인다
  const droneLevel = () => (level() === 'battle' ? 0.2 : 0.14) * (DRONE[theme().inst] ?? 1);
  const stepDur = () => 60 / theme().tempo / (theme().meter === 12 ? 3 : 4);

  function ensure() {
    if (ac) return true;
    try {
      ac = makeContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      const len = Math.floor(ac.sampleRate * 0.4); // 타악기용 짧은 잡음
      noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch { ac = null; return false; }
  }

  const env = (g, t, peak, attack, decay) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };
  const osc = (type, f) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, 0); return o; };
  const noiseHit = (t, vel, type, freq, decay) => {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
    const g = ac.createGain(); env(g, t, vel, 0.002, decay);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + decay + 0.05);
  };

  function sound(e, t) {
    const T = theme(), sd = stepDur();
    if (e.kind === 'drum') { // 북: 낮게 울리며 떨어지는 소리 + 가죽 소리
      const o = osc('sine', 130); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
      const g = ac.createGain(); env(g, t, 0.9 * e.vel, 0.005, 0.45);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.5);
      noiseHit(t, 0.25 * e.vel, 'lowpass', 400, 0.08);
    } else if (e.kind === 'wood') { // 목탁
      const o = osc('sine', 880); o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(640, t + 0.06);
      const g = ac.createGain(); env(g, t, 0.45 * e.vel, 0.002, 0.12);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.15);
    } else if (e.kind === 'clack') { // 장구 채편
      noiseHit(t, 0.3 * e.vel, 'bandpass', 2600, 0.06);
    } else if (e.kind === 'pulse') { // 전투 때 낮게 몰아치는 맥박
      const o = osc('sawtooth', T.root); o.frequency.setValueAtTime(T.root, t);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(320, t);
      const g = ac.createGain(); env(g, t, 0.22 * e.vel, 0.01, sd * 1.6);
      o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + sd * 2);
    } else if (e.kind === 'snare') { // 작은북(군악대·행진): 높은 잡음 + 짧은 몸통 소리
      noiseHit(t, 0.32 * e.vel, 'highpass', 1600, 0.11);
      const o = osc('triangle', 190); o.frequency.setValueAtTime(190, t);
      const g = ac.createGain(); env(g, t, 0.25 * e.vel, 0.002, 0.07);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.1);
    } else if (e.kind === 'soft') { // 낮고 여린 북(풍금·피아노 곡의 바닥)
      const o = osc('sine', 95); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.2);
      const g = ac.createGain(); env(g, t, 0.45 * e.vel, 0.01, 0.3);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.35);
    } else if (e.kind === 'note') {
      const f0 = noteFreq(T.root * 4, e.deg, T.scale || SCALE), dur = e.len * sd, inst = T.inst || 'daegeum';
      const g = ac.createGain();
      if (inst === 'piano') { // 피아노: 탁 치고 서서히 사라진다(배음 하나를 얹어 맑게)
        const o = osc('triangle', f0), o2 = osc('sine', f0 * 2), g2 = ac.createGain();
        o.frequency.setValueAtTime(f0, t); o2.frequency.setValueAtTime(f0 * 2, t); g2.gain.setValueAtTime(0.35, t);
        env(g, t, 0.42 * e.vel, 0.005, Math.min(1.6, dur + 0.6));
        o.connect(g); o2.connect(g2).connect(g); g.connect(master);
        o.start(t); o2.start(t); o.stop(t + dur + 0.8); o2.stop(t + dur + 0.8);
        return;
      }
      if (inst === 'organ') { // 풍금: 떨림 없이 고르게 이어지는 바람 소리
        const o = osc('square', f0), o2 = osc('sine', f0 / 2), lp = ac.createBiquadFilter();
        o.frequency.setValueAtTime(f0, t); o2.frequency.setValueAtTime(f0 / 2, t);
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(1500, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * e.vel, t + 0.05);
        g.gain.setValueAtTime(0.13 * e.vel, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
        o.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
        o.start(t); o2.start(t); o.stop(t + dur + 0.2); o2.stop(t + dur + 0.2);
        return;
      }
      if (inst === 'brass') { // 군악대 나팔: 소리가 부풀며 밝아진다
        const o = osc('sawtooth', f0), lp = ac.createBiquadFilter();
        o.frequency.setValueAtTime(f0, t);
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2200, t + 0.08);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * e.vel, t + 0.06);
        g.gain.setValueAtTime(0.16 * e.vel, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
        o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.2);
        return;
      }
      // 대금(기본)·태평소(reed): 아래에서 밀어 올리는 시김새와 점점 깊어지는 떨림(농음). 태평소는 코맹맹이 소리로 더 날카롭게.
      const reed = inst === 'reed';
      const o = osc(reed ? 'sawtooth' : 'triangle', f0);
      o.frequency.setValueAtTime(f0 * 0.94, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.09);
      const lfo = osc('sine', 5.2), depth = ac.createGain();
      depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(f0 * 0.012, t + dur);
      lfo.connect(depth).connect(o.frequency);
      const peak = (reed ? 0.15 : 0.32) * e.vel;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.07);
      g.gain.setValueAtTime(peak, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
      if (reed) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1400, t); bp.Q.setValueAtTime(1.2, t); o.connect(bp).connect(g); } else o.connect(g);
      g.connect(master);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
    }
  }
  function tick() {
    if (!state.playing) return;
    const m = theme().meter;
    while (nextTime < ac.currentTime + 0.25) {
      if (step === 0) music._bar = barEvents(theme(), level(), bar);
      for (const e of music._bar) if (e.step === step) sound(e, nextTime);
      nextTime += stepDur();
      step += 1;
      if (step >= m) { step = 0; bar += 1; }
    }
  }

  function startSound() {
    if (state.playing || !want || !enabled || !state.theme || !ensure()) return;
    if (ac.state === 'suspended' && ac.resume) {
      ac.resume().catch(() => {});
      // 화면을 아직 누르지 않아 브라우저가 소리를 막았으면, 처음 누를 때 다시 켠다
      if (typeof addEventListener === 'function') addEventListener('pointerdown', () => ac.resume().catch(() => {}), { once: true });
    }
    const t = ac.currentTime, T = theme();
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(0.0001, t); master.gain.linearRampToValueAtTime(VOLUME, t + 1.5);
    droneGain = ac.createGain(); droneGain.gain.setValueAtTime(droneLevel(), t);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t);
    drones = [osc('sine', T.root), osc('sine', T.root * 1.5), osc('triangle', T.root / 2)];
    drones.forEach((o, i) => { o.frequency.setValueAtTime([T.root, T.root * 1.5, T.root / 2][i], t); o.connect(lp); o.start(t); });
    lp.connect(droneGain).connect(master);
    state.playing = true; nextTime = t + 0.1; step = 0; bar = 0;
    tick();
    timer = setInterval(tick, 100);
  }

  function stopSound() {
    if (!state.playing) return;
    state.playing = false;
    clearInterval(timer); timer = null;
    const t = ac.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(0.0001, t, 0.3);
    for (const o of drones) o.stop(t + 1.5);
    drones = [];
  }

  const music = {
    state, _bar: [],
    get enabled() { return enabled; },
    play(id) {
      if (!THEMES[id] && !MAP_THEMES[id]) return;
      if (state.theme !== id) stopSound();
      state.theme = id; state.level = 'calm'; want = true;
      startSound();
    },
    setLevel(level) {
      state.level = level;
      if (state.playing && droneGain) droneGain.gain.setTargetAtTime(droneLevel(), ac.currentTime, 0.5);
    },
    stop() { want = false; stopSound(); },
    setEnabled(on) { enabled = !!on; if (enabled) startSound(); else stopSound(); },
    tick,
  };
  return music;
}
