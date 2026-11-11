// 타임머신(2026-11-10 선생님 시안 D 「캡슐 로켓」): 통통한 백자빛 몸통에 큰 유리창, 단청 붉은 코, 쪽빛 옆 부스터 둘, 다리 넷, 앞에 시계.
// 장을 시작할 때 문 밖에 내려앉아 세워 두고(core/arrival.js), 장 끝에는 마을로 불러 복습 퀴즈를 풀고 탄다(core/portal.js).
// 장에서 장으로·편에서 편으로 넘어가는 장면(core/travel.js)에도 같은 모형이 난다. 색은 게임의 건물·옷 빛깔(백자·단청·쪽빛·금빛)에 맞췄다.
import * as THREE from 'three';
import { mat } from './people.js';

export const TM_SCALE = 0.8, TM_R = 1.9; // 게임 속 크기(키 약 4.5m), 부딪힘 반지름
const glowMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, depthWrite: false });

// 타임머신 키우기(2026-11-10·11 선생님: 성장의 변화가 확실히 보이게 화려하게, 3~4장마다 하나씩): 마친 장 수에 따라 부품을 얻는다
// (content/growth.js TM_STAGES·tmLevel). 부품 아홉 개는 늘 만들어 두고 붙인 것만 보인다 — 「타임머신 꾸미기」에서 언제든 떼었다 붙인다
// (parts: 붙일 부품 번호들, setParts로 바로 바꿈. level만 주면 1~level을 모두 붙인다). 1 금빛 시계 2 단청 날개 3 청사초롱 4 꼬리 날개와 쌍부스터 5 단청 띠와 깃발
// 6 시간 고리 7 금관 8 별 조각과 푸른 겹고리 9 시간의 달인(발밑 빛 고리·푸른 불꽃·머리 위 큰 별)
export function makeTimeMachine({ scale = TM_SCALE, level = 0, parts = null } = {}) {
  const g = new THREE.Group(); g.name = 'timeMachine'; g.userData.dynamic = true; g.scale.setScalar(scale);
  const body = mat(0xece4d0), red = mat(0xb3271e), navy = mat(0x2f4a7a), gold = mat(0xe0b043), dark = mat(0x3a3530), wood = mat(0x6b4a32);
  const glass = new THREE.MeshPhongMaterial({ color: 0x9fd8ee, transparent: true, opacity: 0.42, shininess: 90, depthWrite: false });
  let cur = g; // 지금 조각을 넣을 곳(부품을 지을 때는 그 부품 묶음)
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, p = cur) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; p.add(o); return o; };
  const C = THREE.CylinderGeometry, S = THREE.SphereGeometry, T = THREE.TorusGeometry, K = THREE.ConeGeometry, B = THREE.BoxGeometry;
  add(new S(1.5, 18, 14), body, 0, 2.7, 0).scale.y = 1.35;                         // 몸통
  add(new K(0.6, 1.0, 12), red, 0, 4.95, 0); add(new S(0.14, 8, 8), glowMat(0xffe9a0), 0, 5.55, 0); // 코와 끝 불빛
  add(new S(0.95, 16, 12), glass, 0, 3.2, 0.75); add(new T(0.92, 0.09, 8, 24), gold, 0, 3.2, 1.1); // 큰 유리창
  add(new T(1.3, 0.1, 8, 36), red, 0, 3.95, 0, Math.PI / 2); add(new T(1.18, 0.1, 8, 36), navy, 0, 1.3, 0, Math.PI / 2); // 띠(시계를 가리지 않게 아래 띠는 낮게)
  const flames = [];
  const flame = (x, y, r, len) => { const f = add(new K(r, len, 8), glowMat(0xffb040), x, y - len / 2, 0, Math.PI); f.userData.y0 = y; f.userData.len = len; f.visible = false; f.castShadow = false; flames.push(f); };
  for (const sx of [-1, 1]) { // 옆 부스터
    add(new C(0.4, 0.4, 2.2, 10), navy, sx * 1.75, 1.9, 0); add(new K(0.4, 0.7, 10), red, sx * 1.75, 3.35, 0); add(new C(0.3, 0.2, 0.3, 10), dark, sx * 1.75, 0.7, 0);
    add(new B(0.5, 0.14, 0.3), gold, sx * 1.42, 2.3, 0); add(new B(0.5, 0.14, 0.3), gold, sx * 1.42, 1.5, 0);
    flame(sx * 1.75, 0.55, 0.24, 1.0);
  }
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { add(new C(0.07, 0.07, 1.3, 6), wood, x * 1.05, 0.6, z * 1.05, z * -0.3, 0, x * 0.3); add(new C(0.24, 0.24, 0.08, 10), dark, x * 1.22, 0.04, z * 1.22); } // 다리
  add(new C(0.6, 0.4, 0.4, 12), dark, 0, 0.8, 0); flame(0, 0.6, 0.4, 1.5);
  // 앞문(2026-11-10 선생님: 타임머신 안에서 내리고 안으로 탄다): 닫히면 쪽빛 문짝, 열리면 안쪽 불빛이 보인다. 시계는 문 위(창 위)로 올렸다
  add(new B(1.05, 1.75, 0.1), gold, 0, 1.6, 1.3, -0.12);
  const door = add(new B(0.85, 1.55, 0.14), navy, 0, 1.6, 1.33, -0.12), inside = add(new B(0.85, 1.55, 0.12), glowMat(0xffe9b0), 0, 1.6, 1.33, -0.12); inside.visible = false; inside.castShadow = false;
  add(new B(1.1, 0.12, 0.7), wood, 0, 0.72, 1.55); add(new B(1.1, 0.12, 0.5), wood, 0, 0.36, 1.95); // 디딤판 두 단
  const clock = new THREE.Group(); clock.position.set(0, 4.32, 0.95); clock.rotation.x = -0.8; clock.scale.setScalar(0.85); g.add(clock);              // 앞 시계
  add(new C(0.45, 0.45, 0.08, 24), mat(0xf6f1e2), 0, 0, 0, Math.PI / 2, 0, 0, clock); add(new T(0.45, 0.06, 8, 24), gold, 0, 0, 0, 0, 0, 0, clock);
  const hour = add(new B(0.06, 0.22, 0.04), dark, 0, 0, 0.07, 0, 0, 0, clock), min = add(new B(0.05, 0.34, 0.04), dark, 0, 0, 0.08, 0, 0, 0, clock);
  hour.geometry.translate(0, 0.1, 0); min.geometry.translate(0, 0.15, 0);
  // ---- 단계별 부품 ----
  const R = y => 1.5 * Math.sqrt(Math.max(0, 1 - ((y - 2.7) / 2.025) ** 2)); // 그 높이의 몸통 반지름
  const teal = mat(0x3f8f8a), spin = [];                                      // spin: tick에서 돌리는 것 [물체, 축, 빠르기]
  const wings = [], groups = {};                                              // groups[n]: n번 부품을 이루는 묶음들(보이기·숨기기)
  const part = n => { cur = new THREE.Group(); g.add(cur); groups[n] = [cur]; };
  const sub = (n, parent) => { const o = new THREE.Group(); parent.add(o); groups[n].push(o); return o; }; // 다른 부품(날개)에 얹히는 조각: 날개를 떼면 함께 안 보인다
  { part(1); // 금빛 시계
    add(new T(0.6, 0.13, 8, 24), gold, 0, 4.32, 0.95, -0.8);                                   // 시계 둘레 굵은 금테
    add(new T(0.95, 0.14, 8, 28), gold, 0, 3.2, 1.08);                                         // 창틀을 굵게
    add(new S(0.3, 12, 10), glowMat(0xffe08a), 0, 5.62, 0); add(new T(0.34, 0.06, 6, 18), gold, 0, 5.36, 0, Math.PI / 2); // 꼭대기 큰 불빛
  }
  { part(2); // 단청 날개: 붉은 날개에 금빛 앞테와 청록·쪽빛·흰 줄
    for (const sx of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sx * 2.05, 3.0, -0.25); w.rotation.z = sx * 0.34; w.rotation.y = sx * -0.25; cur.add(w); wings.push([w, sx]);
      add(new B(2.5, 0.16, 1.5), red, sx * 1.25, 0, 0, 0, 0, 0, w); add(new B(2.5, 0.2, 0.22), gold, sx * 1.25, 0, 0.7, 0, 0, 0, w);
      add(new B(0.22, 0.19, 1.3), teal, sx * 0.7, 0, -0.05, 0, 0, 0, w); add(new B(0.22, 0.19, 1.3), navy, sx * 1.35, 0, -0.05, 0, 0, 0, w); add(new B(0.22, 0.19, 1.3), body, sx * 2.0, 0, -0.05, 0, 0, 0, w);
    }
  }
  { part(3); // 청사초롱: 날개 끝 등불, 문 양옆에 붉고 푸른 초롱, 금빛 허리띠와 부스터 금테
    for (const [w0, sx] of wings) { const w = sub(3, w0); add(new S(0.26, 10, 8), glowMat(0xffd27a), sx * 2.65, 0.05, 0.1, 0, 0, 0, w); add(new K(0.2, 0.5, 8), gold, sx * 2.65, 0.45, 0.1, 0, 0, 0, w); }
    for (const sx of [-1, 1]) { // 청사초롱(위는 붉고 아래는 푸른 초롱)
      add(new C(0.03, 0.03, 0.5, 6), dark, sx * 0.85, 2.55, 1.45); add(new C(0.2, 0.2, 0.3, 10), glowMat(0xe2503c), sx * 0.85, 2.2, 1.45); add(new C(0.2, 0.2, 0.3, 10), glowMat(0x4a78d8), sx * 0.85, 1.9, 1.45);
      add(new C(0.22, 0.22, 0.05, 10), gold, sx * 0.85, 2.37, 1.45); add(new C(0.22, 0.22, 0.05, 10), gold, sx * 0.85, 1.73, 1.45);
    }
    add(new T(R(2.55) + 0.02, 0.13, 8, 40), gold, 0, 2.55, 0, Math.PI / 2);
    for (const sx of [-1, 1]) for (const y of [0.92, 2.95]) add(new T(0.42, 0.07, 6, 16), gold, sx * 1.75, y, 0, Math.PI / 2);
  }
  { part(4); // 꼬리 날개와 쌍부스터
    add(new B(0.16, 1.7, 1.3), red, 0, 4.15, -1.25, 0.5); add(new B(0.2, 1.7, 0.2), gold, 0, 4.45, -0.75, 0.5);
    for (const sx of [-1, 1]) {
      const x = sx * 1.0, z = -1.45;
      add(new C(0.36, 0.36, 2.0, 10), navy, x, 1.9, z); add(new K(0.36, 0.65, 10), red, x, 3.22, z); add(new C(0.27, 0.18, 0.3, 10), dark, x, 0.78, z);
      for (const y of [1.2, 2.6]) add(new T(0.38, 0.06, 6, 14), gold, x, y, z, Math.PI / 2);
      const f = add(new K(0.22, 1.0, 8), glowMat(0xffb040), x, 0.13, z, Math.PI); f.userData.y0 = 0.63; f.userData.len = 1.0; f.visible = false; f.castShadow = false; flames.push(f);
    }
  }
  { part(5); // 단청 무늬 띠와 깃발: 네 빛깔 조각이 몸통을 한 바퀴, 날개 위에 붉고 푸른 깃발
    const cols = [red, teal, gold, navy];
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, rr = R(3.62) + 0.03; add(new B(0.34, 0.26, 0.1), cols[k % 4], Math.sin(a) * rr, 3.62, Math.cos(a) * rr, 0, a, 0); }
    for (const [w0, sx] of wings) { const w = sub(5, w0); add(new C(0.035, 0.035, 1.3, 6), gold, sx * 1.7, 0.7, -0.4, 0, 0, 0, w); add(new B(0.7, 0.42, 0.04), sx > 0 ? red : navy, sx * 1.7 - 0.36, 1.1, -0.4, 0, 0, 0, w); add(new S(0.07, 8, 6), gold, sx * 1.7, 1.38, -0.4, 0, 0, 0, w); }
  }
  { part(6); // 시간 고리: 몸통 둘레를 도는 금 고리와 빛 구슬 셋
    const ring = add(new T(2.55, 0.08, 8, 56), gold, 0, 2.7, 0, Math.PI / 2 - 0.45, 0, 0); ring.castShadow = false; spin.push([ring, 'z', 0.9]);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; add(new S(0.14, 8, 6), glowMat(0xffe9a0), Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0, 0, 0, 0, ring); }
  }
  { part(7); // 금관: 코 둘레에 솟은 금빛 뿔과 구슬
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(new K(0.11, k % 2 ? 0.5 : 0.8, 6), gold, Math.sin(a) * 0.62, 4.75 + (k % 2 ? 0.25 : 0.4), Math.cos(a) * 0.62, Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3); if (!(k % 2)) add(new S(0.08, 8, 6), glowMat(0xff8a6a), Math.sin(a) * 0.74, 5.22, Math.cos(a) * 0.74); }
    add(new T(0.66, 0.07, 6, 24), gold, 0, 4.6, 0, Math.PI / 2);
  }
  { part(8); // 별 조각과 푸른 겹고리
    const ring2 = add(new T(2.9, 0.06, 8, 56), glowMat(0x9fe8ff), 0, 2.7, 0, Math.PI / 2 + 0.5, 0.4, 0); ring2.castShadow = false; spin.push([ring2, 'z', -0.6]);
    const stars = new THREE.Group(); stars.position.y = 2.9; cur.add(stars); spin.push([stars, 'y', 0.7]);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, o = add(new THREE.OctahedronGeometry(k % 2 ? 0.2 : 0.28), glowMat(k % 2 ? 0x9fe8ff : 0xffe08a), Math.cos(a) * 3.1, Math.sin(k * 1.7) * 1.3, Math.sin(a) * 3.1, 0, 0, 0, stars); o.castShadow = false; }
  }
  { part(9); // 시간의 달인: 발밑 빛 고리, 푸른 불꽃, 머리 위에서 도는 큰 별
    for (const [rr, c] of [[2.5, 0xffe08a], [3.0, 0x9fe8ff]]) { const h = add(new T(rr, 0.05, 6, 48), glowMat(c), 0, 0.08, 0, Math.PI / 2); h.castShadow = false; }
    const big = add(new THREE.OctahedronGeometry(0.5), glowMat(0xfff3b0), 0, 6.6, 0); big.castShadow = false; spin.push([big, 'y', 1.6]);
    const halo = add(new T(0.8, 0.04, 6, 32), glowMat(0x9fe8ff), 0, 6.6, 0, Math.PI / 2); halo.castShadow = false;
  }
  cur = g;
  let power = 0, on = new Set();
  const setParts = ids => { // 붙일 부품 번호들. 9번(시간의 달인)을 붙이면 불꽃이 푸르다
    on = new Set(ids);
    for (const [n, list] of Object.entries(groups)) for (const o of list) o.visible = on.has(Number(n));
    for (const f of flames) f.material.color.setHex(on.has(9) ? 0x8fd8ff : 0xffb040);
  };
  setParts(parts || Array.from({ length: level }, (_, i) => i + 1));
  return {
    group: g, H: 5.6 * scale, setParts, get parts() { return [...on].sort((a, b) => a - b); },
    setDoor(open) { door.visible = !open; inside.visible = open; },
    setFlame(k) { power = Math.max(0, k); for (const f of flames) f.visible = power > 0.02; },
    // t: 흐른 시간(초). 시곗바늘이 돌고(불꽃이 셀수록 빨리) 불꽃이 떨린다
    tick(t) {
      min.rotation.z = -t * (0.6 + power * 9); hour.rotation.z = -t * (0.05 + power * 0.8);
      for (const [o, ax, sp] of spin) o.rotation[ax] = t * sp * (1 + power);
      for (const [i, f] of flames.entries()) if (f.visible) { const s = power * (0.85 + 0.25 * Math.sin(t * 31 + i * 2)); f.scale.set(1, s, 1); f.position.y = f.userData.y0 - f.userData.len * s / 2; }
    },
    dispose() { g.removeFromParent(); g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); },
  };
}
