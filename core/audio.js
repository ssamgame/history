// 소리 파일 없이 Web Audio로 합성하는 짧은 효과음. 교실을 생각해 기본 볼륨은 작게.
const SOUNDS = {
  tap: [{ f: 660, d: 0.06, type: 'triangle' }],
  correct: [{ f: 660, d: 0.1, type: 'triangle' }, { f: 880, d: 0.16, type: 'triangle', at: 0.1 }],
  wrong: [{ f: 220, d: 0.18, type: 'sawtooth' }],
  whoosh: [{ f: 180, d: 0.35, type: 'sine', to: 60 }],
  water: [{ f: 120, d: 0.6, type: 'sine', to: 40 }],
  boom: [{ f: 110, d: 0.7, type: 'sawtooth', to: 28 }, { f: 60, d: 0.5, type: 'sine', to: 25, at: 0.02 }], // 먼바다 군함의 대포(D-28)
  bell: [{ f: 523, d: 0.9, type: 'sine' }, { f: 90, d: 0.3, type: 'triangle', at: 0.45 }], // 자격루의 종과 북(D-23)
};

export function createAudio() {
  let ctx = null;
  const audio = {
    volume: 0.3,
    muted: false,
    setMuted(b) { audio.muted = b; },
    play(name) {
      if (audio.muted || !SOUNDS[name]) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t0 = ctx.currentTime;
        for (const n of SOUNDS[name]) {
          const o = ctx.createOscillator(), g = ctx.createGain();
          const start = t0 + (n.at || 0);
          o.type = n.type; o.frequency.setValueAtTime(n.f, start);
          if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, start + n.d);
          g.gain.setValueAtTime(audio.volume * 0.4, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + n.d);
          o.connect(g).connect(ctx.destination);
          o.start(start); o.stop(start + n.d + 0.02);
        }
      } catch { /* 소리를 낼 수 없는 환경 */ }
    },
  };
  return audio;
}
