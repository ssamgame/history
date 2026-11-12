// 모자가 머리 위에 떠 있는지 잰다(2026-11-12 선생님: "인물들의 모자가 머리 위에 떠 있다", 점검·테스트용).
// 사람의 머리 묶음(userData.head)만 따로 그린다: 머리통·얼굴·귀·코·안경은 초록, 모자·머리카락은 빨강, 나머지는 그리지 않는다.
// 정면과 옆에서 직각으로 보고, 머리통이 보이는 기둥(가운데 절반)마다 머리통 맨 위에서 위로 이어진 머리카락·모자를 지나 빈칸(하늘)이 있다가 다시 빨강이 나오는지 센다.
// 기둥의 1/4 넘게 걸친 빈틈의 높이(m, 어른 키 기준)를 돌려준다(낮은 폴리곤 가장자리의 가는 틈새는 빼고 띠처럼 보이는 틈만).
import * as THREE from 'three';
const R = 160, SPAN = 1.6, NEAR = 0.3;
let renderer = null, rt = null;
const RED = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }), GREEN = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const SKULL = new Set(['head', 'face', 'ears', 'nose', 'noseTip', 'glasses']);
const isSkull = (o, hg) => { for (let p = o; p && p !== hg; p = p.parent) if (SKULL.has(p.name)) return true; return false; };
const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };

// view: 'front' | 'side'. 돌려주는 것 { gap(띠 모양 틈), thin(가장 큰 틈) } — 단위 m(사람 크기 1 기준)
export function hatGap(g, view) {
  renderer ||= new THREE.WebGLRenderer({ antialias: false }); rt ||= new THREE.WebGLRenderTarget(R, R);
  const hg = g.userData.head; let top = g; while (top.parent) top = top.parent;
  top.updateMatrixWorld(true);
  const c = hg.getWorldPosition(new THREE.Vector3()), sc = g.getWorldScale(new THREE.Vector3()).y, span = SPAN * sc;
  const cam = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 0.01, 20);
  const yaw = new THREE.Euler().setFromQuaternion(g.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  cam.position.copy(c).add((view === 'side' ? new THREE.Vector3(5, 0, 0) : new THREE.Vector3(0, 0, 5)).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
  cam.lookAt(c); cam.updateMatrixWorld(true);
  const swaps = new Map(), hidden = [];
  hg.traverse(o => { if (o.isMesh && shown(o)) { swaps.set(o, o.material); o.material = isSkull(o, hg) ? GREEN : RED; } });
  top.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && !swaps.has(o)) { o.visible = false; hidden.push(o); } });
  const bg = top.background, fog = top.fog; top.background = null; top.fog = null;
  const px = new Uint8Array(R * R * 4);
  try {
    renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(top, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, R, R, px);
  } finally {
    renderer.setRenderTarget(null); top.background = bg; top.fog = fog;
    for (const [o, m] of swaps) o.material = m; for (const o of hidden) o.visible = true;
  }
  const at = (x, y) => { const i = (y * R + x) * 4; return px[i] > 128 ? 'r' : px[i + 1] > 128 ? 'g' : '.'; }; // y 0 = 아래
  const xs = []; for (let x = 0; x < R; x++) for (let y = 0; y < R; y++) if (at(x, y) === 'g') { xs.push(x); break; }
  if (!xs.length) return { gap: 0, thin: 0 };
  const mid = (xs[0] + xs[xs.length - 1]) / 2, half = (xs[xs.length - 1] - xs[0]) / 4, gaps = [];
  for (let x = Math.ceil(mid - half); x <= mid + half; x++) {
    let t = -1; for (let y = R - 1; y >= 0; y--) if (at(x, y) === 'g') { t = y; break; }
    if (t < 0) continue;
    // 머리통 바로 위로 이어진 머리카락·모자를 지나 처음 나오는 빈칸만 센다(모자 꼭대기 장식이 모자 옆으로 튀어나온 것은 틈이 아니다)
    let y = t + 1; while (y < R && at(x, y) !== '.') y++;
    let run = 0; while (y < R && at(x, y) === '.') { run++; y++; }
    gaps.push(y < R && y - run - t < NEAR * R / SPAN ? run : 0); // 머리통 위 30cm 안에서 시작하는 틈만(투구 꼭대기 술이 뾰족한 끝 옆으로 튀어나온 것은 빼고)
  }
  gaps.sort((a, b) => b - a);
  const k = span / R / sc;
  return { gap: (gaps[Math.floor(gaps.length * 0.25)] || 0) * k, thin: (gaps[0] || 0) * k };
}
// 정면·옆 가운데 큰 쪽
export function hatFloat(g) { const a = hatGap(g, 'front'), b = hatGap(g, 'side'); return a.gap >= b.gap ? { ...a, view: 'front' } : { ...b, view: 'side' }; }
export const hatName = g => { let h = ''; g.userData.head.traverse(m => { if (m.name.startsWith('hat:')) h = m.name.slice(4); }); return h; };
