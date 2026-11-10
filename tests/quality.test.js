import { test, eq, ok } from './harness.js';
import { QUALITY, createQualityController, guessInitialQuality } from '../core/quality.js';

test('quality: levels match spec', () => {
  eq(QUALITY.low.pixelRatio, 0.75); eq(QUALITY.medium.pixelRatio, 1.25); eq(QUALITY.high.pixelRatio, 1.75);
  eq(QUALITY.low.shadows, 'off'); eq(QUALITY.medium.shadows, 'soft'); eq(QUALITY.high.shadows, 'soft');
  ok(QUALITY.medium.particles >= 0.9 && QUALITY.high.particles > 1, 'denser scenery since tablets run well (2026-10-23)');
});

test('quality: drops one level after 3s under 40fps', () => {
  const changes = [];
  const q = createQualityController({ initial: 'medium', onChange: l => changes.push(l) });
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'lite', '보통 다음은 가볍게(lite): 해상도 1.0·또렷한 그림자');
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'low');
  eq(changes, ['lite', 'low']);
});

test('quality: high drops to medium, then low on a second slow window', () => {
  const q = createQualityController({ initial: 'high' });
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'medium');
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'lite');
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'low');
  for (let i = 0; i < 100; i++) q.sample(1 / 10);
  eq(q.level, 'low');
});

test('quality: stays when fps is fine', () => {
  const q = createQualityController({ initial: 'medium' });
  for (let i = 0; i < 400; i++) q.sample(1 / 60);
  eq(q.level, 'medium');
});

test('quality: manual set stops auto changes', () => {
  const q = createQualityController({ initial: 'medium' });
  q.set('high');
  for (let i = 0; i < 100; i++) q.sample(1 / 20);
  eq(q.level, 'high');
});

test('quality: a single long frame (tab switch) is ignored', () => {
  const q = createQualityController({ initial: 'medium' });
  q.sample(2.5);
  for (let i = 0; i < 200; i++) q.sample(1 / 60);
  eq(q.level, 'medium');
});

test('quality: S6 Lite guess is medium', () => eq(guessInitialQuality({ dpr: 2, cores: 8, memory: 4 }), 'medium'));
test('quality: strong device guess is high', () => eq(guessInitialQuality({ dpr: 2, cores: 8, memory: 8 }), 'high'));
test('quality: unknown memory guess is medium', () => eq(guessInitialQuality({ dpr: 1, cores: 8, memory: undefined }), 'medium'));

test('quality: restart measures again after an earlier fast window', () => {
  const q = createQualityController({ initial: 'medium' });
  for (let i = 0; i < 200; i++) q.sample(1 / 60); // 첫 화면은 빠르다
  q.restart();                                     // 장이 시작되면 다시 잰다
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'lite');
});

test('quality: restart keeps a manual choice', () => {
  const q = createQualityController({ initial: 'medium' });
  q.set('high'); q.restart();
  for (let i = 0; i < 100; i++) q.sample(1 / 30);
  eq(q.level, 'high');
});

test('quality: 처음에 빨랐어도 계속 지켜본다 — 5초 평균 32fps 아래가 두 번 이어지면 한 단계 낮춘다(2026-11-10 S6 Lite 끊김)', () => {
  const changes = [], q = createQualityController({ initial: 'medium', onChange: l => changes.push(l) });
  for (let i = 0; i < 200; i++) q.sample(1 / 60);          // 처음 3초는 빠르다
  for (let i = 0; i < 26 * 5 + 5; i++) q.sample(1 / 26);   // 느린 5초 한 번: 아직 그대로
  eq(q.level, 'medium');
  for (let i = 0; i < 60 * 5 + 5; i++) q.sample(1 / 60);   // 다시 빨라지면 세던 것을 지운다
  for (let i = 0; i < 26 * 5 + 5; i++) q.sample(1 / 26);
  eq(q.level, 'medium', '잠깐 느린 것으로는 낮추지 않는다');
  for (let i = 0; i < 26 * 5 + 5; i++) q.sample(1 / 26);   // 느린 구간이 두 번 이어짐
  eq(q.level, 'lite'); eq(changes, ['lite']);
  q.set('high'); for (let i = 0; i < 26 * 20; i++) q.sample(1 / 26); eq(q.level, 'high', '직접 고른 화질은 그대로');
  ok(QUALITY.lite.pixelRatio === 1 && QUALITY.lite.shadows === 'hard');
});
