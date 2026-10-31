// 2026-10-31 자동 점검: 사람이 높이 0에서 걷는데 그 밑 땅(굴곡·마당 높이)이 0.07~0.12m 올라와 발이 묻혀 보였다.
// 학생이 걷는 곳(world.bounds)의 땅 판은 높이 0 가까이여야 한다.
import { test, ok } from './harness.js';
import * as THREE from 'three';
import { touchSetup } from './bot.js';
import j1 from '../chapters/joseon/j1/chapter.js';
import j4 from '../chapters/joseon/j4/chapter.js';
import j5 from '../chapters/joseon/j5/chapter.js';
import j1Script from '../chapters/joseon/j1/script.js';
import j4Script from '../chapters/joseon/j4/script.js';
import j5Script from '../chapters/joseon/j5/script.js';

function worstGround(w, area) {
  w.scene.updateMatrixWorld(true);
  const planes = []; w.level.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width >= 60 && o.material?.vertexColors) planes.push(o); }); // 색칠한 땅 판(바다·물 판은 뺀다)
  const rc = new THREE.Raycaster(); let worst = 0, at = '';
  for (let x = area.x0; x <= area.x1; x += 0.9) for (let z = area.z0; z <= area.z1; z += 0.9) {
    rc.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
    const h = rc.intersectObjects(planes)[0]; if (h && h.point.y > worst) { worst = h.point.y; at = `${x.toFixed(1)},${z.toFixed(1)}`; }
  }
  return { n: planes.length, worst, at };
}

for (const [name, ch, script] of [['j1', j1, j1Script], ['j4', j4, j4Script], ['j5', j5, j5Script]]) {
  test(`ground: ${name} 학생이 걷는 곳의 땅이 사람 발보다 높지 않다`, () => {
    const s = touchSetup(script.speakers);
    try {
      ch.buildScene(s.w, s.ctx);
      const b = s.w.bounds, r = worstGround(s.w, b);
      ok(r.n >= 1, 'ground plane');
      ok(r.worst < 0.04, `땅 높이 ${r.worst.toFixed(3)}m (${r.at})`);
    } finally { s.done(); }
  });
}
