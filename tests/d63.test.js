// D-63(2026-11-03 선생님): 인물 생김새 점검. 장수의 칼은 칼집에 넣어 왼쪽 허리에 비스듬히 찬다(손에 세워 든 것처럼 보이지 않게).
import { test, ok } from './harness.js';
import * as THREE from 'three';
import { LOOKS } from '../content/characters.js';
import { makePerson } from '../core/people.js';
import { faceBlockers } from './faces.test.js';

test('d63: 칼은 칼집째 허리에 비스듬히 찬다(칼자루는 앞으로, 칼집 끝은 뒤로)', () => {
  for (const id of ['yanggyu', 'gangamchan', 'sonn']) {
    const p = makePerson(LOOKS[id], { track: false, stable: true }); p.updateMatrixWorld(true);
    const s = p.getObjectByName('sword'); ok(s, `${id}: 칼`);
    const top = s.localToWorld(new THREE.Vector3(0, 0.5, 0)), tip = s.localToWorld(new THREE.Vector3(0, -0.65, 0));
    const d = top.clone().sub(tip), tilt = Math.acos(d.y / d.length()) * 180 / Math.PI;
    ok(tilt > 40 && tilt < 80, `${id}: 칼집 기울기 ${tilt.toFixed(0)}°(곧게 서면 손에 든 것처럼 보인다)`);
    ok(top.z > tip.z + 0.3, `${id}: 칼자루는 앞, 칼집 끝은 뒤(${top.z.toFixed(2)} / ${tip.z.toFixed(2)})`);
    ok(top.y < 1.25, `${id}: 칼자루가 허리 높이(${top.y.toFixed(2)})`);
  }
});

test('d63: 조선·근대 관리는 사모(둥근 모자 뒤 짧은 날개), 고려 관리는 복두(양옆으로 긴 각)', () => {
  const width = id => { const p = makePerson(LOOKS[id], { track: false, stable: true }); p.updateMatrixWorld(true); const h = p.getObjectByName('head').parent, b = new THREE.Box3();
    for (const c of h.children) if (c.name !== 'head' && c.isMesh) b.union(new THREE.Box3().setFromObject(c)); return b.max.x - b.min.x; };
  for (const id of ['joseonOfficial', 'kimsangheon', 'choemyeonggil', 'jobyeonggap', 'daewongun']) {
    ok(LOOKS[id].hat === 'samo', `${id}: 사모`);
    const w = width(id); ok(w < 1.0, `${id}: 모자 너비 ${w.toFixed(2)}(복두 각처럼 길지 않다)`);
    const bl = faceBlockers(LOOKS[id]); ok(bl.length === 0, `${id}: 사모가 눈썹·눈을 가리지 않는다 ${bl.slice(0, 2)}`);
  }
  for (const id of ['seohui', 'officer']) { ok(LOOKS[id].hat === 'official', `${id}: 복두`); ok(width(id) > 1.1, `${id}: 복두 각`); }
});
