// 출렁이는 바다·물(D-62, 2026-10-31 선생님: 바다가 파도치고 물결이 움직이게).
// - 물결 무늬(캔버스)가 늘 천천히 흐른다: 화질 '낮음'에서도 물이 움직여 보인다.
// - 화질 '보통·높음'(quality.water === 'waves')에서는 판의 꼭짓점을 겹친 물결로 오르내린다(각진 면 그늘로 파도가 보인다).
// - 굳히기(core/bake.js)에서 빠지도록 userData.dynamic을 단다.
// - 움직임은 core/world.js가 매 프레임 stepSeas로 돌린다(장 코드·마을 부품은 makeSea로 만들기만 한다).
import * as THREE from 'three';

let rippleTex = null;
function ripple() {
  if (rippleTex) return rippleTex;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // 물결 줄: 옅은 어두운 골과 밝은 물마루(끝이 가늘어지는 짧은 곡선)
  for (let i = 0; i < 70; i++) {
    const x = rnd() * S, y = rnd() * S, len = 18 + rnd() * 40, bright = rnd() < 0.45;
    g.strokeStyle = bright ? 'rgba(255,255,255,0.9)' : 'rgba(150,170,180,0.55)';
    g.lineWidth = bright ? 1.6 + rnd() * 1.4 : 2 + rnd() * 2; g.lineCap = 'round';
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { // 이어 붙여도 끊기지 않게 둘레로 한 번씩 더
      g.beginPath(); g.moveTo(x + dx - len / 2, y + dy); g.quadraticCurveTo(x + dx, y + dy - 3 - rnd() * 3, x + dx + len / 2, y + dy); g.stroke();
    }
  }
  rippleTex = new THREE.CanvasTexture(cv);
  rippleTex.wrapS = rippleTex.wrapT = THREE.RepeatWrapping; rippleTex.colorSpace = THREE.SRGBColorSpace;
  return rippleTex;
}

// w·d 판 크기, amp 물결 높이(바다 0.18, 강·연못은 작게), tile 물결 무늬 한 장의 크기(m), flow 흐르는 방향과 빠르기([x, z] m/s)
const seas = new Set();
export function makeSea({ w = 200, d = 60, color = 0x3f7d9a, opacity = 0.93, shininess = 50, specular = 0x9ac4d6, amp = 0.18, tile = 14, flow = [0.25, 0.4], seg } = {}) {
  const sx = seg ?? Math.min(90, Math.max(8, Math.round(w / 4))), sz = seg ?? Math.min(90, Math.max(8, Math.round(d / 4)));
  const geo = new THREE.PlaneGeometry(w, d, sx, sz).rotateX(-Math.PI / 2);
  const tex = ripple().clone(); tex.needsUpdate = true; tex.repeat.set(w / tile, d / tile);
  const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, map: tex, shininess, specular, flatShading: true, transparent: opacity < 1, opacity }));
  m.receiveShadow = true; m.userData.dynamic = true; m.userData.sea = { amp };
  const pos = geo.attributes.position, base = Float32Array.from(pos.array), arr = pos.array;
  // 판 가장자리 6m 안은 물결을 줄여 0으로(D-67: 물 칸 가장자리가 곧 바닷가인 무대에서 물결이 땅을 덮었다 드러냈다 하며 경계가 바뀌어 보였다)
  const calm = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { const e = Math.min(w / 2 - Math.abs(base[i * 3]), d / 2 - Math.abs(base[i * 3 + 2])); calm[i] = Math.min(1, Math.max(0, e / 6)); }
  let flat = true, t0 = 0;
  const step = (dt, t, quality) => {
    tex.offset.x = (tex.offset.x + dt * flow[0] / tile) % 1; tex.offset.y = (tex.offset.y + dt * flow[1] / tile) % 1;
    if (quality?.water !== 'waves' || amp <= 0) { if (!flat) { arr.set(base); pos.needsUpdate = true; flat = true; } return; }
    t0 = t; flat = false;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] + m.position.x, z = base[i + 2] + m.position.z; // 판을 옮겨도 이웃 판과 물결이 맞게 세상 자리로
      arr[i + 1] = calm[i / 3] * amp * (Math.sin(x * 0.21 + t * 1.3) * 0.55 + Math.sin(z * 0.27 - t * 1.05) * 0.35 + Math.sin((x + z) * 0.53 + t * 2.1) * 0.18);
    }
    pos.needsUpdate = true;
  };
  m.userData.sea.step = step;
  m.userData.sea.height = (x, z) => flat ? 0 : amp * (Math.sin(x * 0.21 + t0 * 1.3) * 0.55 + Math.sin(z * 0.27 - t0 * 1.05) * 0.35 + Math.sin((x + z) * 0.53 + t0 * 2.1) * 0.18);
  m.userData.sea.gone = 0; seas.add(m);
  return m;
}

const inScene = o => { while (o.parent) o = o.parent; return o.isScene; };
// 장면에 붙은 바다만 움직이고, 오래 떨어져 있는 것(치운 장의 바다)은 목록에서 뺀다
export function stepSeas(dt, t, quality) {
  for (const m of seas) {
    if (!inScene(m)) { if (++m.userData.sea.gone > 300) seas.delete(m); continue; }
    m.userData.sea.gone = 0; if (m.visible) m.userData.sea.step(dt, t, quality);
  }
}
export const seaCount = () => seas.size;
