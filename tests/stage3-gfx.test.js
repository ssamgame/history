// 3단계(2026-10-25) 그래픽·역사책 그림 검사 — 디자인 팀원 담당
// G1~G17: docs/superpowers/specs/2026-10-25-stage3-plan.md 그래픽 표, B1~B30: 역사책 표
import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { testWorld } from './bot.js';
import { MOODS } from '../core/world.js';

const kitChapters = async () => {
  const { MODERN, COLONIAL, PRESENT } = await import('../chapters/index.js');
  const out = [];
  for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) out.push({ id: meta.id, ch: (await meta.load()).default });
  return out;
};

// ── G1: 출발 자리와 따라가는 카메라(뒤 +z 13, 위 8.5) 사이에 키 큰 부품이 없다 ──
const TALL = /pavilion|hanok|western|shop|concrete|tree|tent|barracks|gate|steamship|lanehouse|banner|shack|watchtower|arch|tram|truck|crowd|stage|terrace/;
test('stage3 G1: 근대~현대 무대·마을의 출발 자리 뒤(카메라 쪽)에 키 큰 부품이 없다', async () => {
  for (const { id, ch } of await kitChapters()) {
    const L = ch.layout, s = L.start || [0, 9];
    for (const q of L.props || []) if (TALL.test(q.type)) ok(!(Math.abs(q.x - s[0]) < 5 && q.z > s[1] - 1 && q.z < s[1] + 13), `${id} 마을 ${q.type}(${q.x},${q.z})`);
    ch.parts.forEach((p, i) => {
      if (!p.arena || !p.from) return;
      for (const q of [...(p.arena.props || []), ...(p.arena.center || [])]) {
        if (!TALL.test(q.type)) continue;
        ok(!(Math.abs(q.x - p.from[0]) < 5 && q.z > p.from[1] - 1 && q.z < p.from[1] + 13), `${id} 부분${i} 출발 (${p.from}) 뒤 ${q.type}(${q.x},${q.z})`);
      }
    });
  }
});

// ── G5: 가져다 놓기 칸 이름표가 왼쪽 위 목표 상자(HUD) 밑에 숨지 않는다 ──
// 1000×560 화면, 따라가는 카메라(world.js CAM_OFFSET (0, 8.5, 12), 앞 4m를 봄), HUD는 왼쪽 위 16~416 × 12~130 안에 있다고 본다.
const projectLabel = (from, b, lab, BIN_LABEL) => {
  const cam = new THREE.PerspectiveCamera(50, 1000 / 560, 0.5, 400);
  cam.position.set(from[0], 8.5, from[1] + 12); cam.lookAt(from[0], 1, from[1] - 4); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const half = lab.scale.x / 2, out = [];
  for (const dx of [-half, 0, half]) {
    const v = new THREE.Vector3(b.x + dx, BIN_LABEL.y + lab.scale.y / 2, b.z + BIN_LABEL.dz).project(cam);
    out.push({ x: (v.x + 1) / 2 * 1000, y: (1 - v.y) / 2 * 560 });
  }
  return out;
};
test('stage3 G5: 가져다 놓기(deliver) 칸 이름표가 목표 상자(HUD) 자리와 겹치지 않는다', async () => {
  const { labelSprite, BIN_LABEL } = await import('../chapters/kit/play.js');
  ok(BIN_LABEL && typeof BIN_LABEL.y === 'number', 'BIN_LABEL을 내보낸다');
  const cases = [];
  for (const { id, ch } of await kitChapters()) for (const p of ch.parts) if (p.type === 'deliver') cases.push({ id, from: p.from, bins: p.bins });
  const j5 = (await import('../chapters/joseon/j5/script.js')).default;
  cases.push({ id: 'j5', from: [0, 11], bins: j5.sort.bins.map((b, i) => ({ ...b, ...[{ x: -10, z: -5 }, { x: 10, z: -5 }][i] })) });
  ok(cases.length >= 10, `가져다 놓기 ${cases.length}곳`);
  for (const c of cases) for (const b of c.bins) {
    const lab = labelSprite(b.label, { size: 1.25 });
    const pts = projectLabel(c.from, b, lab, BIN_LABEL);
    const top = Math.min(...pts.map(p => p.y)), left = Math.min(...pts.map(p => p.x));
    ok(!(left < 416 && top < 130), `${c.id} 「${b.label}」 이름표 왼쪽 ${left | 0}, 위 ${top | 0}`);
    ok(top > 0, `${c.id} 「${b.label}」 화면 안`);
  }
});

// ── G3·G4·G10·G11·G17: 분위기 밝기 값 ──
test('stage3 G3·G4·G10·G11·G17: 어두운 분위기는 밝히고 눈은 덜 하얗게', () => {
  ok(MOODS.overcast.sun.intensity >= 1.1 && MOODS.overcast.hemi[2] >= 1.0, `흐린 날 해 ${MOODS.overcast.sun.intensity}, 하늘빛 ${MOODS.overcast.hemi[2]}`);
  ok(MOODS.storm.sun.intensity >= 0.7 && MOODS.storm.hemi[2] >= 0.9, '비바람');
  ok(MOODS.snow.hemi[2] <= 0.78, `눈 하늘빛 ${MOODS.snow.hemi[2]}`);
  ok(MOODS.winterDusk && MOODS.winterDusk.hemi[2] >= 0.8, 'k2용 겨울 저녁 분위기');
  const lum = hex => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
  const sat = hex => { const h = {}; new THREE.Color(hex).getHSL(h); return h.s; };
  ok(sat(MOODS.forest.fog[0]) < sat(0xc8d8c8), '숲 안개가 덜 연두빛');
  ok(lum(MOODS.forest.hemi[1]) > lum(0x405a38), '숲 땅빛이 밝다');
});
test('stage3 G4·G8: k2는 겨울 저녁, i4 마을 풀색은 한 단계 밝다', async () => {
  const k2 = (await import('../chapters/modern/k2/chapter.js')).default, i4 = (await import('../chapters/colonial/i4/chapter.js')).default;
  eq(k2.mood, 'winterDusk');
  const l = hex => { const h = {}; new THREE.Color(hex).getHSL(h); return h.l; };
  ok(l(i4.layout.groundColor) > l(0x4f6b3e), 'i4 풀색');
});

// ── G6: 흙·돌 바닥 도시의 바깥 언덕은 맨흙이 아니라 풀빛 ──
const hillGreen = mesh => {
  const p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color; let r = 0, g = 0, n = 0;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 3) { r += c.getX(i); g += c.getY(i); n++; }
  return { r: r / n, g: g / n, n };
};
const groundOf = root => { let m = null; root.traverse(o => { if (o.isMesh && o.geometry.attributes.color && o.geometry.attributes.position.count > 4000) m = o; }); return m; };
test('stage3 G6: 돌·흙 바닥 마을과 무대의 바깥 언덕은 풀빛(초록이 붉은빛보다 짙다)', async () => {
  const { buildTown } = await import('../chapters/kit/town.js');
  const { buildArena } = await import('../chapters/kit/play.js');
  for (const ground of ['stone', 'earth']) {
    const w = testWorld();
    try {
      w.setMood('summer');
      buildTown(w, { ground, groundColor: 0x8f7a5c, bounds: { x0: -12, x1: 12, z0: -10, z1: 10 }, start: [0, 6], props: [], nature: false });
      const h = hillGreen(groundOf(w.level));
      ok(h.n > 50 && h.g > h.r, `마을 ${ground}: 언덕 r ${h.r.toFixed(2)} g ${h.g.toFixed(2)}`);
      const a = buildArena(w, { origin: [400, 0], ground, groundColor: 0x9a8a6a, bounds: { x0: -15, x1: 15, z0: -10, z1: 12 }, props: [], nature: false });
      const ha = hillGreen(groundOf(a.group));
      ok(ha.n > 50 && ha.g > ha.r, `무대 ${ground}: 언덕 r ${ha.r.toFixed(2)} g ${ha.g.toFixed(2)}`);
      a.dispose();
    } finally { w.dispose(); }
  }
});
test('stage3 G6: 눈 바닥은 언덕도 그대로 하얗다', async () => {
  const { buildTown } = await import('../chapters/kit/town.js');
  const w = testWorld();
  try {
    w.setMood('snow');
    buildTown(w, { ground: 'earth', groundColor: 0xe6e8ec, bounds: { x0: -12, x1: 12, z0: -10, z1: 10 }, start: [0, 6], props: [], nature: false });
    const h = hillGreen(groundOf(w.level));
    ok(h.r > 0.55, `눈 언덕 r ${h.r.toFixed(2)}`);
  } finally { w.dispose(); }
});

// ── G7: 물 바로 뒤 땅이 수직 절벽처럼 솟지 않는다 ──
test('stage3 G7: 바다·강가 땅은 물에서 멀어질수록 완만하게 오른다', async () => {
  const { terrainField } = await import('../chapters/kit/terrain.js');
  const f = terrainField({ bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, props: [{ type: 'water', x: 0, z: -60, w: 200, d: 60 }] });
  // 물 칸 끝 z -30(여유 2 → -28). 걷는 곳에서 먼 x 40 쪽에서 물가를 따라 잰다
  let worst = 0;
  for (let x = 30; x <= 60; x += 5) { const h = f.heightAt(x, -27); worst = Math.max(worst, h); }
  ok(worst < 1.2, `물가 바로 뒤 높이 ${worst.toFixed(2)}`);
  ok(f.heightAt(45, -10) > f.heightAt(45, -26), '물에서 멀어지면 높아진다');
});

// ── G9: i4 마을 흙길 위에 바위가 없다 ──
test('stage3 G9: i4 마을의 흩뿌린 바위는 흙길(가운데 길)을 피한다', async () => {
  const i4 = (await import('../chapters/colonial/i4/chapter.js')).default;
  const w = testWorld();
  try {
    i4.buildScene(w);
    const road = i4.layout.roads[0], m4 = new THREE.Matrix4(), v = new THREE.Vector3();
    let bad = 0, n = 0;
    w.level.traverse(o => {
      if (!o.isInstancedMesh || o.name !== 'props:rock') return;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); n++; if (Math.abs(v.x - road.x) < road.w / 2 + 1 && Math.abs(v.z - road.z) < road.d / 2) bad++; }
    });
    ok(n > 0, `바위 ${n}개`);
    eq(bad, 0, '길 위 바위');
  } finally { w.dispose(); }
});

// ── G16: 1951년 피란길에 빨간 픽업트럭이 지나가지 않는다 ──
test('stage3 G16: h4 피란길의 지나가는 차는 군용 트럭', async () => {
  const h4 = (await import('../chapters/present/h4/chapter.js')).default;
  for (const p of h4.parts) for (const hz of p.hazards || []) ok(hz.kind !== 'car', `h4 ${p.type} ${hz.kind}`);
});

// ── G2: 서희 담판 카메라는 해를 등지고 본다 ──
test('stage3 G2: ch1 담판 카메라는 노을 해를 등지고, 학생은 카메라와 서희 사이를 막지 않는다', async () => {
  const { buildCh1Scene } = await import('../chapters/ch1/scene.js');
  const w = testWorld();
  try {
    w.setMood('sunset');
    const sc = buildCh1Scene(w), n = sc.negotiationSpot;
    const cam = new THREE.Vector3(...n.cam.pos), tgt = new THREE.Vector3(...n.cam.target), sun = new THREE.Vector3(...MOODS.sunset.sun.dir).normalize();
    ok(cam.clone().sub(tgt).setY(0).normalize().dot(sun.clone().setY(0).normalize()) > 0.3, '해가 카메라 뒤쪽');
    const segDist = (p, a, b) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); return p.distanceTo(a.clone().addScaledVector(ab, t)); };
    const flat = v => new THREE.Vector3(v.x, 0, v.z);
    const player = new THREE.Vector3(n.player[0], 0, n.player[1]), seohui = new THREE.Vector3(n.seohui[0], 0, n.seohui[1]);
    ok(segDist(player, flat(cam), seohui) > 1.0, '학생이 서희를 가리지 않는다');
  } finally { w.dispose(); }
});

// ── 역사책 그림(B) ──
const D = async () => (await import('../chapters/modern/dioramas.js')).DIORAMA;
test('stage3 B1·B2·B26: 디오라마 사람에게 높이(y)를 주면 단·연단·기단 위에 선다', async () => {
  const { buildDioramaScene } = await import('../chapters/kit/diorama.js');
  const DI = await D();
  const want = { hwangudan: ['gojong', 1.8], forum: ['scholarModern', 0.8], declaration: ['student', 0.6] };
  for (const [pic, [look, y]] of Object.entries(want)) {
    const p = DI[pic].people.find(q => q[0] === look);
    ok(p && Math.abs((p[4]?.y || 0) - y) < 0.05, `${pic} ${look} y ${p?.[4]?.y}`);
    const { scene } = buildDioramaScene(DI[pic]);
    let found = false; scene.children.forEach(o => { if (o.userData?.look === look && Math.abs(o.position.y - y) < 0.05) found = true; });
    ok(found, `${pic}: ${look}가 y ${y}에 선다`);
  }
});
const types = spec => (spec.props || []).map(p => p.type);
test('stage3 B3·B4·B5·B9·B11·B12·B21·B25·B27: 쪽 글에 맞는 소품', async () => {
  const DI = await D();
  ok(!types(DI.forum).includes('arch') && types(DI.forum).filter(t => t === 'shop').length >= 2, 'B3 만민 공동회: 독립문 대신 종로 가게');
  ok(types(DI.outdoor).includes('noticeBoard'), 'B4 운동장 칠판');
  ok(DI.outdoor.people.every(p => p[2] > -3.5), 'B4 선생님은 운동장에');
  ok(types(DI.sanmi).includes('steamship') && !types(DI.sanmi).includes('boat'), 'B5 쌀을 싣는 기선');
  ok(types(DI.election).includes('ballot') && !types(DI.election).includes('desk'), 'B9 투표함');
  ok(types(DI.reunion).some(t => t === 'noticeBoard' || t === 'papers') && types(DI.reunion).includes('tv'), 'B11 쪽지와 텔레비전');
  ok(DI.reunion.props.find(p => p.type === 'concrete').floors <= 2, 'B11 건물 낮게');
  const train = DI.railway.props.find(p => p.type === 'train');
  ok(train.x >= -0.5 && types(DI.railway).includes('steamship'), 'B12 기관차가 보이고 항구에 기선');
  ok(types(DI.ww1end).some(t => t === 'noticeBoard' || t === 'papers'), 'B21 소식을 알리는 게시판');
  ok(DI.un.props.find(p => p.type === 'concrete').floors <= 3, 'B25 유엔 건물이 그림 안에');
  ok(types(DI.tojisa).includes('surveyPole'), 'B27 측량 막대');
});
test('stage3 B7·B8·B17: 전화기, 켜진 가로등, 국숫집', async () => {
  const DI = await D();
  const { BUILD } = await import('../chapters/kit/town.js');
  const { LOOKS } = await import('../content/characters.js');
  ok(types(DI.telephone).includes('telephone') && BUILD.telephone, 'B7 전화기 부품');
  ok(DI.lamp.props.filter(p => p.type === 'lamp').every(p => p.lit), 'B8 가로등 켜짐');
  const g = new THREE.Group(); BUILD.lamp(g, { lit: true });
  let glow = false; g.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial) glow = true; });
  ok(glow, 'B8 켜진 전구는 스스로 빛난다');
  ok(!types(DI.milmyeon).includes('desk') && types(DI.milmyeon).includes('bowls'), 'B17 국수 그릇');
  const kid = DI.milmyeon.people.find(p => p[0].startsWith('kid'));
  ok(kid && LOOKS[kid[0]].hat !== 'topknot', 'B17 1950년대 아이는 상투가 없다');
  ok(DI.milmyeon.people.every(p => p[4]?.work !== 'sweep'), 'B17 비질 없음');
});
test('stage3 B30: 바꾼 쪽의 평면 그림도 내용이 맞다', async () => {
  const { PIC } = await import('../chapters/modern/pictures.js');
  ok(!/#8a5a4a/.test(PIC.forum), 'forum 평면 그림: 서양 건물 대신 가게');
});
test('stage3 B10·B23·B24·G14: 검토 판정대로(왕 고종 붉은 옷, 제복 교사, 정전 회담 천막, k1 옛 증기선)', async () => {
  const DI = await D();
  const { LOOKS } = await import('../content/characters.js');
  const g = DI.agwan.people.find(p => p[0].startsWith('gojong'));
  const red = new THREE.Color(LOOKS[g[0]].robe); ok(red.r > red.g * 2, 'B10 아관 파천 쪽 고종은 붉은 곤룡포');
  eq(DI.hwangudan.people[0][0], 'gojong', 'B10 대한 제국 쪽은 노란 옷');
  ok(!DI.classroom.people.some(p => p[0] === 'gendarme') && types(DI.classroom).includes('noticeBoard'), 'B23 헌병 대신 칠판 앞 교사');
  ok(!types(DI.talks).includes('fence') && types(DI.talks).includes('tent'), 'B24 철조망 대신 천막');
  const k1 = (await import('../chapters/modern/k1/chapter.js')).default;
  const ships = [...k1.layout.props, ...k1.parts.flatMap(p => p.arena?.props || [])].filter(p => p.type === 'steamship');
  ok(ships.length > 0 && ships.every(s => s.old), 'G14 k1 배는 모두 옛 증기선');
  const { PIC } = await import('../chapters/modern/pictures.js');
  ok(!/#5b92c8/.test(PIC.talks) && /#a3262a/.test(PIC.agwan), 'B30 평면 그림도 맞춤');
});
