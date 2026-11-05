// 2026-11-05 선생님: 말이 삐그덕거리며 걷는다 → 몸통 높이·다리·무릎이 한 프레임에 툭 튀지 않고 부드럽게 움직인다
import { test, ok } from './harness.js';
import * as THREE from 'three';
import { makeHorse, mount, animateHorse } from '../core/horse.js';
import { makePerson } from '../core/people.js';
import { LOOKS } from '../content/characters.js';

function run(v, frames, dtOf) {
  const h = makeHorse(), r = makePerson(LOOKS.mongol); mount(h, r); h.rotation.y = Math.PI / 2;
  const B = h.userData.body, L = h.userData.legs;
  let jerk = 0, kneeJump = 0, legJump = 0, prev = null, prev2 = null, pk = null, pl = null;
  for (let i = 0; i < frames; i++) {
    const dt = dtOf(i); h.position.x += v * dt; h.updateMatrixWorld(true); animateHorse(h, dt);
    if (i < 60) continue; // 걸음이 자리 잡은 뒤
    const y = B.position.y / h.scale.y, k = L.map(l => l.userData.knee.rotation.x), a = L.map(l => l.rotation.x);
    if (prev2 != null) jerk = Math.max(jerk, Math.abs(y - 2 * prev + prev2) / (dt * dt)); // 높이의 가속도(m/s²): 툭 꺾이면 커진다
    if (pk) kneeJump = Math.max(kneeJump, ...k.map((x, j) => Math.abs(x - pk[j]) / dt));
    if (pl) legJump = Math.max(legJump, ...a.map((x, j) => Math.abs(x - pl[j]) / dt));
    prev2 = prev; prev = y; pk = k; pl = a;
  }
  return { jerk, kneeJump, legJump };
}
test('horse smooth: walk/trot/canter body bob has no kinks and knees do not snap (60fps and uneven frames)', () => {
  // 고치기 전(60fps): 높이가속 평보 14·속보 103·구보 915, 무릎 57·105·126rad/s(한 프레임에 1라디안 넘게 툭 펴졌다)
  const LIM = { walk: [4, 28], trot: [85, 60], canter: [450, 95] }; // 고친 뒤(다섯 마리 중 가장 나쁜 값): 평보 약 1/20, 속보 약 75/49, 구보 약 313/83(빨리 달릴수록 무릎을 빨리 접어야 발굽이 땅에 끌리지 않는다)
  for (const [v, name] of [[1.4, 'walk'], [3.2, 'trot'], [6, 'canter']]) {
    const worst = list => list.reduce((x, y) => ({ jerk: Math.max(x.jerk, y.jerk), kneeJump: Math.max(x.kneeJump, y.kneeJump) }));
    const a = worst([0, 1, 2, 3, 4].map(() => run(v, 300, () => 1 / 60))), b = worst([0, 1, 2].map(() => run(v, 300, i => (i % 3 ? 1 / 60 : 1 / 25)))); // 말마다 크기·박자가 조금 달라 다섯 마리 중 가장 나쁜 값. 고르지 않은 프레임(태블릿)에서는 무릎만 본다
    const [J, K] = LIM[name], msg = `${name} 높이가속 ${a.jerk.toFixed(1)} 무릎 ${a.kneeJump.toFixed(1)}/${b.kneeJump.toFixed(1)}rad/s`;
    ok(a.jerk < J && a.kneeJump < K && b.kneeJump < K, msg);
  }
});
