// 화질 3단계(+자동 조절만 쓰는 '가볍게' lite)와 자동 하향. 처음 3초 평균이 40fps 아래면 한 단계 낮추고 다시 잰다.
// 2026-11-10 선생님(S6 Lite에서 가끔 끊김): ① 보통 → 낮음 사이에 lite(해상도 1.0·또렷한 그림자 1024·풀 0.6)를 두어 한 번에 확 나빠지지 않게,
// ② 처음 한 번 재고 끝내지 않고 계속 지켜본다: 5초 평균이 32fps 아래인 구간이 두 번 이어지면 한 단계 더 낮춘다(전투·큰 무대처럼 나중에 무거워지는 장면).
export const QUALITY = {
  low: { pixelRatio: 0.75, shadows: 'off', particles: 0.3, water: 'flat' },
  lite: { pixelRatio: 1, shadows: 'hard', particles: 0.6, water: 'waves' },
  // 2026-10-23: 학생 태블릿에서 넉넉히 돌아가서 보통·높음을 한 단계씩 올렸다(더 선명하게, 부드러운 그림자, 풀·나무 더 많이)
  medium: { pixelRatio: 1.25, shadows: 'soft', particles: 0.9, water: 'waves' },
  high: { pixelRatio: 1.75, shadows: 'soft', particles: 1.3, water: 'waves' },
};
const ORDER = ['low', 'lite', 'medium', 'high'];
const WATCH_SECONDS = 5, WATCH_FPS = 32;
const WINDOW_SECONDS = 3;
const MIN_FPS = 40;
const MAX_FRAME = 0.5; // 탭 전환처럼 멈췄던 프레임은 무시

export function guessInitialQuality({ dpr = 1, cores = 4, memory } = {}) {
  if ((memory !== undefined && memory <= 4) || cores <= 4) return 'medium';
  if (dpr >= 2 && memory >= 8) return 'high';
  return 'medium';
}

export function createQualityController({ initial = 'medium', onChange = () => {} } = {}) {
  let elapsed = 0, frames = 0, auto = true, manual = false, slow = 0;
  const q = {
    level: initial,
    sample(dt) {
      if (manual || q.level === 'low' || dt > MAX_FRAME) return;
      elapsed += dt; frames += 1;
      if (elapsed < (auto ? WINDOW_SECONDS : WATCH_SECONDS)) return;
      const fps = frames / elapsed;
      elapsed = 0; frames = 0;
      if (auto) { // 장을 시작한 첫 구간
        if (fps < MIN_FPS) { q.level = ORDER[ORDER.indexOf(q.level) - 1]; onChange(q.level); }
        else auto = false; // 충분히 빠르면 그 뒤로는 지켜보기만 한다
        return;
      }
      slow = fps < WATCH_FPS ? slow + 1 : 0; // 지켜보기: 느린 구간이 두 번 이어질 때만(잠깐의 멈칫으로는 낮추지 않는다)
      if (slow >= 2) { slow = 0; q.level = ORDER[ORDER.indexOf(q.level) - 1]; onChange(q.level); }
    },
    set(level) { auto = false; manual = true; q.level = level; onChange(level); },
    // 장이 시작될 때 다시 잰다 (첫 화면은 장면이 가벼워서 측정에 쓰지 않는다). 직접 고른 화질은 그대로 둔다.
    restart() { if (!manual) { auto = true; elapsed = 0; frames = 0; slow = 0; } },
  };
  return q;
}
