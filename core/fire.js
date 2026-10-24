// 불(화톳불·횃불): 겹친 불꽃(바깥 주황 → 안쪽 노랑, 빛이 더해지게), 바닥과 공기의 은은한 빛, 튀어 오르는 불티, 피어오르는 연기.
// 무거운 실제 조명(PointLight)은 쓰지 않는다(태블릿 성능). 화질이 낮으면 불티와 연기를 줄인다.
import * as THREE from 'three';

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,150,60,.9)'); g.addColorStop(0.35, 'rgba(230,90,20,.45)'); g.addColorStop(1, 'rgba(200,60,10,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(cv); glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}
const additive = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

// size: 불 크기(1이면 화톳불), detail: 0~1(화질). 돌려주는 것: { group, setLit(on), update(dt, t), lit }
export function makeFire({ size = 1, detail = 1 } = {}) {
  const group = new THREE.Group();
  const flames = new THREE.Group(); group.add(flames);
  // 불꽃 세 겹: 끝이 뾰족한 물방울 모양(원뿔 아래를 둥글게)
  const tear = (r, h) => { const pts = [[0, 0], [r * 0.8, h * 0.08], [r, h * 0.25], [r * 0.7, h * 0.55], [r * 0.25, h * 0.85], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 10); };
  const layers = [
    new THREE.Mesh(tear(0.42 * size, 1.25 * size), additive(0xd8400a, 0.75)),
    new THREE.Mesh(tear(0.3 * size, 0.95 * size), additive(0xe87a1a, 0.7)),
    new THREE.Mesh(tear(0.16 * size, 0.6 * size), additive(0xf0c060, 0.65)),
  ];
  layers.forEach((m, i) => { m.position.y = 0.05 * i; flames.add(m); });
  // 작은 불길 둘(옆으로 흔들린다)
  const tongues = [-1, 1].map(s => { const m = new THREE.Mesh(tear(0.14 * size, 0.7 * size), additive(0xd85a14, 0.7)); m.position.set(s * 0.22 * size, 0, 0.05); flames.add(m); return m; });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.85 }));
  glow.scale.setScalar(3 * size); glow.position.y = 0.5 * size; group.add(glow);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.8 * size, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  floor.position.y = -0.55 * size; group.add(floor);
  // 불티: 위로 튀어 올라 사라졌다가 다시 생긴다
  const n = Math.max(4, Math.round(18 * detail));
  const ep = new Float32Array(n * 3), life = new Float32Array(n), vel = [];
  for (let i = 0; i < n; i++) { life[i] = Math.random(); vel.push([(Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.9, (Math.random() - 0.5) * 0.5]); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffb050, size: 0.09 * size, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(embers);
  // 연기: 회색 덩이가 천천히 오르며 커지고 옅어진다
  const smokes = Array.from({ length: detail > 0.5 ? 3 : 1 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.35 * size, 8, 6), new THREE.MeshLambertMaterial({ color: 0x6f6a66, transparent: true, opacity: 0.35, depthWrite: false }));
    m.userData.k = i / 3; group.add(m); return m;
  });
  const fire = {
    group, lit: false, emberCount: n, // 불티 수(화질이 낮으면 적다)
    setLit(on) { fire.lit = on; flames.visible = glow.visible = floor.visible = embers.visible = on; smokes.forEach(s => { s.visible = on; }); },
    update(dt, t) {
      if (!fire.lit) return;
      const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3 + 1) * 0.07;
      layers.forEach((m, i) => { m.scale.set(1 + Math.sin(t * 9 + i) * 0.06, f * (1 + i * 0.04), 1 + Math.cos(t * 8 + i) * 0.06); m.rotation.y = t * (0.6 + i * 0.3); });
      tongues.forEach((m, i) => { m.scale.y = 0.8 + Math.sin(t * 11 + i * 2) * 0.3; m.rotation.z = Math.sin(t * 5 + i * 3) * 0.25; });
      glow.material.opacity = 0.5 + Math.sin(t * 10) * 0.1; floor.material.opacity = 0.35 + Math.sin(t * 9) * 0.08;
      for (let i = 0; i < n; i++) {
        life[i] += dt * 0.7;
        if (life[i] > 1) { life[i] -= 1; vel[i] = [(Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.9, (Math.random() - 0.5) * 0.5]; }
        const k = life[i];
        ep[i * 3] = vel[i][0] * k * size; ep[i * 3 + 1] = (0.3 + vel[i][1] * k * 2) * size; ep[i * 3 + 2] = vel[i][2] * k * size;
      }
      eg.attributes.position.needsUpdate = true;
      for (const s of smokes) {
        s.userData.k = (s.userData.k + dt * 0.25) % 1; const k = s.userData.k;
        s.position.set(Math.sin(t + k * 6) * 0.2 * size, (1.3 + k * 2.4) * size, 0); s.scale.setScalar(0.8 + k * 1.6); s.material.opacity = 0.2 * (1 - k);
      }
    },
  };
  fire.setLit(false);
  return fire;
}
