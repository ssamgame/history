// 놀이 부품 「흔들리는 거중기」(2026-10-27, 조선편 수원 화성). 돌을 매단 거중기가 성벽 위를 좌우로 오간다(끝에서 되돌아옴).
// 빛나는 빈자리 위에 올 때 '내리기'(큰 단추 · 스페이스 · E). 맞으면 돌이 놓이고 다음 칸, 칸마다 빨라진다.
// 빗나가면 틀림 하나(돌은 계속 오가고 다시 누르면 된다, onMiss로 장이 힌트를 보인다), maxWrong번이면 실패. easy면 허용 폭이 넓고 0.7배 느리다.
// 3D는 장이 넘겨 준 scene({ set(k), kOf(i) → 칸의 k, pickUp() → Promise, place(i) → Promise, showGap(i|null) })이 맡는다.
import { actionButton } from '../../core/minigame.js';

export function crane(ctx, { gaps, scene, label = '내리기', period = 4, speeds = [0.9, 1.1, 1.3], window = 0.055, easyWindow = 0.08, easy = false, maxWrong = 2, onMiss = null } = {}) {
  const w = easy ? easyWindow : window;
  return new Promise(async resolve => {
    let wrong = 0;
    for (let i = 0; i < gaps; i++) {
      await scene.pickUp?.();
      scene.showGap?.(i);
      const k0 = scene.kOf(i), sp = (speeds[i] ?? speeds[speeds.length - 1]) * (easy ? 0.7 : 1);
      ctx.testHooks.armed = false; ctx.testHooks.ready = false;
      const btn = actionButton(ctx, label);
      let t = 0, k = 0, done = false;
      const ok = await new Promise(res => {
        const off = ctx.world.onUpdate(dt => {
          if (done) return;
          t += dt;
          k = 0.5 - 0.5 * Math.cos((2 * Math.PI * t * sp) / period); // 0 → 1 → 0 … 오간다
          scene.set(k);
          ctx.testHooks.ready = Math.abs(k - k0) < w - 0.01 && t > 0.4;
          ctx.testHooks.armed = t > 0.4; // 테스트 봇: 일부러 빗나가게 누르는 시험은 이때부터
        });
        const press = () => btn.wait().then(() => {
          if (done) return;
          if (t < 0.4) return press();
          if (Math.abs(k - k0) <= w) { done = true; off(); res(true); return; }
          wrong += 1; ctx.audio?.play('wrong'); onMiss?.(wrong);
          if (wrong >= maxWrong) { done = true; off(); res(false); return; }
          press();
        });
        press();
      });
      btn.remove(); ctx.testHooks.ready = false; ctx.testHooks.armed = undefined;
      scene.showGap?.(null);
      if (!ok) return resolve({ ok: false, wrong });
      ctx.audio?.play('tap');
      await scene.place?.(i);
    }
    resolve({ ok: true, wrong });
  });
}
