// 소리 파일 없이 Web Audio로 합성하는 짧은 효과음. 교실을 생각해 기본 볼륨은 작게.
const SOUNDS = {
  tap: [{ f: 660, d: 0.06, type: 'triangle' }],
  correct: [{ f: 660, d: 0.1, type: 'triangle' }, { f: 880, d: 0.16, type: 'triangle', at: 0.1 }],
  wrong: [{ f: 220, d: 0.18, type: 'sawtooth' }],
  whoosh: [{ f: 180, d: 0.35, type: 'sine', to: 60 }],
  water: [{ f: 120, d: 0.6, type: 'sine', to: 40 }],
  boom: [{ f: 110, d: 0.7, type: 'sawtooth', to: 28 }, { f: 60, d: 0.5, type: 'sine', to: 25, at: 0.02 }], // 먼바다 군함의 대포(D-28)
  bell: [{ f: 523, d: 0.9, type: 'sine' }, { f: 90, d: 0.3, type: 'triangle', at: 0.45 }], // 자격루의 종과 북(D-23)
  // 대화·행동 효과음(2026-11-12 선생님이 미리듣기에서 고름): 대사 넘기기 A5 물방울, 대화 시작 B1 두 음 올림, 상호작용 C1 맑은 딩(안내판 읽기도 같은 소리)
  next: [{ f: 900, d: 0.07, type: 'sine', to: 1500, v: 0.8 }],
  talk: [{ f: 523, d: 0.08, type: 'triangle' }, { f: 784, d: 0.14, type: 'triangle', at: 0.08 }],
  act: [{ f: 880, d: 0.18, type: 'triangle' }, { f: 1320, d: 0.22, type: 'sine', at: 0.03, v: 0.5 }],
  shot: [{ f: 190, d: 0.14, type: 'sawtooth', to: 45 }, { f: 70, d: 0.22, type: 'sine', to: 30, at: 0.01 }], // 의병의 총소리(D-37)
};

export function createAudio() {
  let ctx = null, actAt = -1e9;
  const audio = {
    volume: 0.3,
    muted: false,
    setMuted(b) { audio.muted = b; },
    play(name) {
      const now = performance.now();
      if (name === 'tap' && now - actAt < 120) return; // 행동 소리(act)가 방금 났으면 장이 따로 내는 톡 소리는 겹치지 않게 뺀다
      if (name === 'act') actAt = now;
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

// 대사가 뜰 때의 소리(2026-11-12 선생님): 대화가 열려 있지 않다가 사람 말·해설이 뜨면 '대화 시작', 이어지는 대사는 '대사 넘기기'.
// 시간지기 안내(guide)는 소리 없이 뜬다. wasOpen: 이 대사 바로 앞에 대화창·자막이 떠 있었는지
export function sayCue(audio, line, wasOpen) {
  if (!line || line.who === 'guide') return;
  audio.play(wasOpen ? 'next' : 'talk');
}
