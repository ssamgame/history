// 소리 파일 없이 Web Audio로 합성하는 짧은 효과음. 교실을 생각해 기본 볼륨은 작게.
const SOUNDS = {
  tap: [{ f: 660, d: 0.06, type: 'triangle' }],
  correct: [{ f: 660, d: 0.1, type: 'triangle' }, { f: 880, d: 0.16, type: 'triangle', at: 0.1 }],
  wrong: [{ f: 220, d: 0.18, type: 'sawtooth' }],
  whoosh: [{ f: 180, d: 0.35, type: 'sine', to: 60 }],
  water: [{ f: 120, d: 0.6, type: 'sine', to: 40 }],
  boom: [{ f: 110, d: 0.7, type: 'sawtooth', to: 28 }, { f: 60, d: 0.5, type: 'sine', to: 25, at: 0.02 }], // 먼바다 군함의 대포(D-28)
  bell: [{ f: 523, d: 0.9, type: 'sine' }, { f: 90, d: 0.3, type: 'triangle', at: 0.45 }], // 자격루의 종과 북(D-23)
  // 행동 효과음(2026-11-12 선생님: E·행동 단추를 누를 때 상황에 맞는 소리만. 대사가 넘어갈 때는 소리 없음) — actionSound가 단추 글자로 고른다
  talk: [{ f: 523, d: 0.08, type: 'triangle' }, { f: 784, d: 0.14, type: 'triangle', at: 0.08 }],                              // 말 걸기: 두 음 올림
  act: [{ f: 880, d: 0.18, type: 'triangle' }, { f: 1320, d: 0.22, type: 'sine', at: 0.03, v: 0.5 }],                           // 그 밖의 행동: 맑은 딩
  read: [{ f: 1800, d: 0.16, type: 'triangle', to: 600, v: 0.3 }, { f: 700, d: 0.12, type: 'sine', to: 420, at: 0.05, v: 0.4 }], // 읽기·보기: 두루마리 펼침
  pick: [{ f: 330, d: 0.14, type: 'sine', to: 660 }],                                                                           // 줍기·받기·싣기: 집어 올림
  put: [{ f: 300, d: 0.07, type: 'triangle', to: 150 }, { f: 1200, d: 0.02, type: 'square', v: 0.2 }],                          // 놓기·붙이기·찍기: 나무 딱
  push: [{ f: 160, d: 0.16, type: 'sine', to: 80 }, { f: 320, d: 0.04, type: 'triangle', v: 0.4 }],                             // 밀기·치기·당기기: 북 톡
  shot: [{ f: 190, d: 0.14, type: 'sawtooth', to: 45 }, { f: 70, d: 0.22, type: 'sine', to: 30, at: 0.01 }], // 의병의 총소리(D-37)
};

export function createAudio() {
  let ctx = null, actAt = -1e9;
  const audio = {
    volume: 0.3,
    muted: false,
    setMuted(b) { audio.muted = b; },
    // E·행동 단추를 눌렀을 때: 단추 글자에 맞는 소리
    action(word) { actAt = performance.now(); audio.play(actionSound(word)); },
    play(name) {
      const now = performance.now();
      if (name === 'tap' && now - actAt < 120) return; // 행동 소리가 방금 났으면 장이 따로 내는 톡 소리는 겹치지 않게 뺀다
      audio.last = name; // 마지막으로 내려던 소리(테스트용)
      if (audio.muted || !SOUNDS[name]) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t0 = ctx.currentTime;
        for (const n of SOUNDS[name]) {
          const o = ctx.createOscillator(), g = ctx.createGain();
          const start = t0 + (n.at || 0);
          o.type = n.type; o.frequency.setValueAtTime(n.f, start);
          if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, start + n.d);
          g.gain.setValueAtTime(audio.volume * 0.4 * (n.v || 1), start); // v: 그 음만 작게
          g.gain.exponentialRampToValueAtTime(0.001, start + n.d);
          o.connect(g).connect(ctx.destination);
          o.start(start); o.stop(start + n.d + 0.02);
        }
      } catch { /* 소리를 낼 수 없는 환경 */ }
    },
  };
  return audio;
}

// 행동 단추의 글자(core/screens.js buttonWord: '대화'·'줍기'·'읽기'…)로 그 행동에 맞는 소리 이름을 고른다
const ACTION_SOUNDS = [
  ['talk', /^대화$|인사|배웅/],
  ['read', /읽|보기|살펴|펼치|듣기/],
  ['water', /붓|헹구|긷|젓|씻|담그|삶/],
  ['pick', /줍|받|들기|집기|싣|모으|올리|꺼내|챙기|뽑/],
  ['put', /놓|붙이|넣|찍|세우|쌓|달기|꽂|심|걸기|짓/],
  ['push', /밀|치기|당기|누르|두드|박기|새기|쏘|던지|끄기|켜기/],
];
export const actionSound = word => (ACTION_SOUNDS.find(([, re]) => re.test(word || '')) || ['act'])[0];
