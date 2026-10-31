// 조선편 4장 장면: 남해안 포구(부두, 판옥선과 거북선, 지휘소)와 북쪽 바다. 바다 북쪽 끝의 두 섬 사이가 좁은 견내량,
// 서쪽 섬이 한산도. 미니게임은 높은 데서 내려다보는 고정 카메라로 바다 위에서 한다.
import * as THREE from 'three';
import { groundMaterial } from '../../../core/textures.js';
import { mat, makePerson } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { panokseon, geobukseon, japaneseShip, rowShip } from '../ships.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { burning } from '../../kit/fire.js';
import { hanok, pier, boat, jars } from '../../kit/buildings.js';

export const STRAIT_Z = -78;       // 견내량 입구
// 적 배가 기다리는 곳: 견내량 안쪽 깊이(미끼 배가 돌아설 때 넉넉히 떨어져 있게)
export const ENEMY_WAIT = STRAIT_Z - 32;
export const WING = { x: 0, z: -44, r: 15 }; // 학익진 가운데와 반지름
const SLOT = 4; // 학익진에서 학생 배가 들어갈 빈자리 번호(동쪽 날개 가운데)
// 학익진 배 자리(D-30 I-02): 배 사이를 넓게(이웃 배와 7 이상) 둥글게 휜 한 줄. 가운데 빈 곳은 거북선이 나서는 길
const WING_X = [-18.5, -11.5, -4, 4, 11.5, 18.5], WING_R = 20;

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 배 모형은 ../ships.js (판옥선·거북선·일본 배)

export function buildJ4Scene(world) {
  const L = world.level, rand = seeded(41);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const harbor = { x0: -16, x1: 16, z0: 4.5, z1: 14 };
  world.bounds = harbor;

  // 바다와 포구 땅
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x3f7d9a, shininess: 60, specular: 0x9ac4d6, transparent: true, opacity: 0.94 }));
  sea.position.y = -0.4; L.add(sea);
  {
    const g = new THREE.PlaneGeometry(120, 40, 40, 14); g.rotateX(-Math.PI / 2); g.translate(0, 0, 22);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i);
      const h = z < 6 ? -0.8 + (z - 2) * 0.2 : Math.max(0, z - 20) * 0.25; // 포구 땅은 높이 0(사람·건물이 서는 높이, 2026-10-31 자동 점검: 0.1m 높아 발이 묻혀 보였다)
      p.setY(i, Math.min(h, 4));
      const j = rand() * 0.04;
      if (z < 7.5) c.setRGB(0.66 + j, 0.6 + j, 0.46 + j); else c.setRGB(0.34 + j, 0.47 + j, 0.29 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass')); t.receiveShadow = true; L.add(t);
  }
  // 부두(나무 다리)와 배들
  const put = (fn, x, y, z, ry = 0, p = {}) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; L.add(g); fn(g, p); return g; };
  put(pier, 6, -0.5, 1.5, Math.PI / 2, { w: 9, d: 3 }); // 기둥 위 나무 부두
  const turtle = geobukseon(); turtle.position.set(10.5, -0.2, 0); L.add(turtle);
  for (const [x, z] of [[-4, -1], [-12, 0], [1, -3]]) { const s = panokseon(); s.position.set(x, -0.2, z); s.rotation.y = x * 0.02; L.add(s); }
  // 포구 마을: 지휘소, 초가, 그물 말리기
  put(hanok, -10, 0, 11, Math.PI, { tile: true }).scale.setScalar(1.15); // 지휘소(기와집)
  world.addCollider({ x: -10, z: 11, r: 2.8 });
  for (const [x, z, ry] of [[16, 12.5, Math.PI + 0.3], [-19, 6, Math.PI / 2]]) { put(hanok, x, 0, z, ry, {}); world.addCollider({ x, z, r: 2.3 }); } // 포구 초가
  put(jars, -6.5, 0, 13.5, Math.PI, { n: 5 });
  for (const [x, z, ry] of [[-20, 1.5, 0.6], [20, 2.5, -0.4]]) put(boat, x, -0.75, z, ry, { len: 4.2 }); // 물가에 끌어 올린 고깃배
  for (const x of [-15, -13]) mk(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 5), 0x5a3f2a, x, 0.9, 7.2); // 그물 말리기(이순신 앞을 가리지 않게 서쪽으로)
  const net = mk(new THREE.PlaneGeometry(2, 1.2), 0x6b6152, -14, 1.2, 7.2); net.material = net.material.clone(); net.material.side = THREE.DoubleSide;
  scatter(world, { kind: 'grass', count: 70, area: { x0: -30, x1: 30, z0: 8.5, z1: 20 }, avoid: [{ x: -10, z: 11, r: 4 }, { x: 16, z: 12.5, r: 3 }, { x: -19, z: 6, r: 3 }, { x: -14, z: 7.2, r: 2 }, { x: -2.2, z: 5.3, r: 1.5 }], seed: 81, color: 0x7a9450 });
  scatter(world, { kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: 22, z1: 40 }, seed: 82, scale: [1.1, 1.6], ground: () => 1.5 });

  // 바다 북쪽: 견내량(두 섬 사이 좁은 물길)과 서쪽의 한산도
  const island = (x, z, sx, sz, h) => { const m = mk(new THREE.ConeGeometry(1, 1, 9), 0x4f6b4a, x, h / 2 - 0.6, z, L, false); m.scale.set(sx, h, sz); return m; };
  island(-28, STRAIT_Z - 6, 20, 12, 10); island(28, STRAIT_Z - 6, 20, 12, 11); // 두 섬 사이 물길은 배가 지나갈 만큼(x −9~9)
  island(-46, -46, 14, 12, 8);
  // 암초: 좁은 견내량 물길 가장자리(배가 지나는 길(x −6~6) 밖). 이 좁고 위험한 물길 때문에 적을 넓은 바다로 끌어냈다
  for (const [x, z] of [[-8.2, STRAIT_Z + 2], [8.4, STRAIT_Z - 3], [-8.8, STRAIT_Z - 8]]) mk(new THREE.DodecahedronGeometry(0.9, 0), 0x6b6862, x, -0.2, z);

  // 미니게임에 쓰는 배들
  const lure = new THREE.Group(); L.add(lure);
  for (let i = 0; i < 3; i++) { const s = panokseon(); s.position.set((i - 1) * 3.6, -0.2, i % 2 * 3); lure.add(s); }
  const enemy = new THREE.Group(); L.add(enemy);
  for (let i = 0; i < 8; i++) { const s = japaneseShip(); s.position.set(((i % 4) - 1.5) * 3.3, -0.2, Math.floor(i / 4) * 7); enemy.add(s); }
  const fleet = new THREE.Group(); L.add(fleet); // 학익진으로 펼치는 우리 배 6척(가운데는 거북선)
  const wingSpots = WING_X.map(x => { const a = Math.asin(x / WING_R); return [WING.x + x, WING.z + Math.cos(a) * WING_R * 0.55 + 6, a]; });
  wingSpots.forEach(([x, z, a], i) => { if (i === SLOT) return; const s = panokseon(); s.position.set(x, -0.2, z); s.rotation.y = a * 0.6; s.userData.spot = [x, z]; fleet.add(s); }); // 뱃머리가 북쪽(적)을 보며 안쪽으로 조금 돈다. 한 자리(SLOT)는 학생 배가 들어갈 자리
  // 학생이 모는 판옥선(D-25): 바다 놀이 동안만 보이고 학생 자리를 따라간다. 노를 젓는다
  const myShip = panokseon(); myShip.visible = false; L.add(myShip);
  // 대장선(D-30 C-05): 꾀어내기가 끝나면 바다에 나타나고, 학생이 배를 몰아 다가가 이순신과 이야기해야 학익진이 시작된다
  const flagship = panokseon(); flagship.visible = false; flagship.position.set(9, -0.2, -40); flagship.rotation.y = 0.3; L.add(flagship);
  { const yi = makePerson(LOOKS.yisunsin); yi.position.set(0, 2.2, 0.6); yi.rotation.y = -Math.PI / 2 - 0.3; yi.userData.noWalk = true; flagship.add(yi); }
  const bigFlag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2).translate(0.8, 0, 0), new THREE.MeshLambertMaterial({ color: 0xd9a441, side: THREE.DoubleSide }));
  bigFlag.position.set(0, 6.2, 0.3); flagship.add(bigFlag);
  // 학익진 앞에 선 거북선 (S43): 날개 가운데, 우리 배보다 조금 앞(북쪽)
  const leadTurtle = geobukseon(); leadTurtle.position.set(WING.x, -0.2, WING.z + WING.r * 0.6 + 5); L.add(leadTurtle);
  const goalRing = new THREE.Mesh(new THREE.RingGeometry(4, 5, 32), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  goalRing.rotation.x = -Math.PI / 2; goalRing.visible = false; L.add(goalRing);

  // 상태: 'harbor'(탐험), 'lure'(미끼 배 출발), 'wing'(학익진), 'won'(끝)
  const setStage = s => {
    lure.visible = s === 'lure';
    enemy.visible = s !== 'harbor';
    fleet.visible = s === 'wing' || s === 'won';
    leadTurtle.visible = fleet.visible;
    flagship.visible = false;
    goalRing.visible = false;
    enemy.children.forEach(e => { e.userData.smoke.visible = s === 'won'; });
    if (s === 'lure') { lure.position.set(0, 0, -30); enemy.position.set(0, 0, ENEMY_WAIT); enemy.rotation.y = 0; }
    if (s === 'wing') { enemy.position.set(0, 0, -78); }
    if (s === 'won') { enemy.position.set(0, 0, -50); }
    if (s !== 'won') enemy.children.forEach(e => { // 다시 하기·이어하기 때 배를 되살린다(붙은 불도 치운다)
      e.visible = true; e.userData.sink = 0; e.rotation.set(0, 0, 0);
      for (const f of e.children.filter(c => c.name === 'fire')) e.remove(f);
    });
  };
  // 미끼 배 진행: 0 = 출발(-30), 1 = 견내량 깊숙이(STRAIT_Z - 6)
  const setLure = k => { lure.position.z = -30 + k * (STRAIT_Z - 6 + 30); lure.rotation.y = 0; };
  // 적이 쫓아 나옴: 0 = 견내량 안쪽 깊이, 1 = 넓은 바다(-68). 미끼 배와 늘 25 이상 떨어져 있다.
  const setChase = k => { enemy.position.z = ENEMY_WAIT + k * (-68 - ENEMY_WAIT); enemy.rotation.y = Math.PI; lure.position.z = STRAIT_Z + 4 + k * 40; lure.rotation.y = Math.PI; };
  // 적이 날개 안으로 들어옴: 0 = -70, 1 = -36(날개 안쪽 끝, 우리 배와 겹치지 않음)
  const setAdvance = k => { enemy.position.z = -70 + k * 34; enemy.rotation.y = Math.PI; };
  setStage('harbor');

  // 공격(D-30 I-03): 우리 배들이 차례로 포를 쏘고(포구 연기와 날아가는 포탄), 맞은 일본 배에 불이 붙어 타오르다가
  // 기울며 물 아래로 가라앉는다. 가라앉는 동안 검은 연기가 피어오르고, 다 잠기면 물보라만 남는다(전투 불꽃 허용, 2026-10-27 선생님).
  const fx = new THREE.Group(); L.add(fx);
  const ballGeo = new THREE.SphereGeometry(0.28, 8, 6), ballMat = new THREE.MeshLambertMaterial({ color: 0x1e1c1a });
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  const puff = (p, r, color = 0xe8e6e0) => { const m = new THREE.Mesh(puffGeo, new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false })); m.scale.setScalar(r); m.position.copy(p); fx.add(m); return m; };
  const BURN = 1.0, SINK = 3.4, DEPTH = 6.8; // 불이 붙은 뒤 가라앉기 시작할 때까지, 가라앉는 시간, 잠기는 깊이(돛대 끝까지 물 아래)
  const playBattle = (audio = null) => new Promise(resolve => {
    const shooters = [...fleet.children, leadTurtle], targets = [...enemy.children];
    const shots = targets.map((tg, i) => ({ at: 0.4 + i * 0.5, from: shooters[i % shooters.length], to: tg, state: 'wait' }));
    const effects = [];
    const wp = new THREE.Vector3(), tp = new THREE.Vector3();
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      for (const sh of shots) {
        if (sh.state === 'wait' && t >= sh.at) {
          sh.from.getWorldPosition(wp); wp.y += 2.2; sh.to.getWorldPosition(tp); tp.y += 1;
          effects.push({ m: puff(wp, 0.9), k: 0, life: 1.2, grow: 2.2 }); // 포구 연기
          const ball = new THREE.Mesh(ballGeo, ballMat); ball.position.copy(wp); fx.add(ball);
          sh.ball = ball; sh.a = wp.clone(); sh.b = tp.clone(); sh.k = 0; sh.state = 'fly';
          audio?.play('whoosh');
        }
        if (sh.state === 'fly') {
          sh.k = Math.min(1, sh.k + dt / 0.9);
          sh.ball.position.lerpVectors(sh.a, sh.b, sh.k); sh.ball.position.y += Math.sin(sh.k * Math.PI) * 6;
          if (sh.k >= 1) {
            fx.remove(sh.ball); sh.state = 'hit'; sh.hitT = 0; sh.smokeT = 0;
            const s = puff(sh.b, 1.6, 0xf2f6f8); s.scale.set(1.3, 3.8, 1.3); effects.push({ m: s, k: 0, life: 1, grow: 1.4 }); // 물보라
            sh.to.userData.smoke.visible = true;
            if (world.quality?.particles !== 0) { // 맞은 배에 불이 붙는다: 누각 지붕 위와 앞 갑판 두 곳
              const f1 = burning(world, { parent: sh.to, x: 0, y: 2.6, z: 1.5, size: 2.1, level: 0.3 }), f2 = burning(world, { parent: sh.to, x: 0.2, y: 1.2, z: -1.6, size: 1.5, level: 0.3 });
              sh.fire = { setLevel: v => { f1.setLevel(v); f2.setLevel(v * 0.9); } };
            }
          }
        }
        if (sh.state === 'hit') {
          sh.hitT += dt;
          const burnK = Math.min(1, sh.hitT / BURN), e = Math.min(1, Math.max(0, sh.hitT - BURN) / SINK), ee = e * e;
          sh.fire?.setLevel(e < 0.55 ? 0.3 + burnK * 0.7 : Math.max(0, 1 - (e - 0.55) / 0.3)); // 타오르다가 물에 잠기며 꺼진다
          sh.to.userData.sink = ee * DEPTH; sh.to.rotation.z = e * 0.6; sh.to.rotation.x = -e * 0.35; // 옆으로 기울고 뱃머리부터 잠긴다
          sh.smokeT += dt;
          if (sh.smokeT > 0.5) { // 타는 배에서 검은 연기가 줄지어 피어오른다
            sh.smokeT = 0; sh.to.getWorldPosition(tp); tp.y = Math.max(0.4, tp.y + 4.5);
            effects.push({ m: puff(tp, 0.6 + Math.random() * 0.3, 0x4a4846), k: 0, life: 2.4, grow: 1.6, rise: 2.2, op: 0.5 });
          }
          if (e >= 1) {
            sh.state = 'sunk'; sh.to.visible = false; sh.fire?.setLevel(0);
            sh.to.getWorldPosition(tp); tp.y = -0.3;
            const ring = puff(tp, 2.2, 0xe8f0f2); ring.scale.set(2.6, 0.25, 2.6); effects.push({ m: ring, k: 0, life: 1.4, grow: 1.2 }); // 잠긴 자리의 물보라
          }
        }
      }
      for (const e of effects) {
        e.k += dt / e.life;
        if (!e.base) e.base = e.m.scale.clone();
        e.m.scale.copy(e.base).multiplyScalar(1 + Math.min(1, e.k) * e.grow * 0.5); e.m.material.opacity = Math.max(0, (e.op ?? 0.85) * (1 - e.k)); // 연기는 조금씩 커지며 옅어진다
        if (e.rise) e.m.position.y += dt * e.rise;
        if (e.k >= 1 && e.m.parent) { fx.remove(e.m); e.m.material.dispose(); }
      }
      if (shots.every(s => s.state === 'sunk') && effects.every(e => e.k >= 1)) { off(); resolve(shots.length); }
    });
  });

  // 포구 문(시작 장면, D-25): 낮은 나무 울타리 사이 문, 길옆 이름판(작업 이름 그대로)
  const GATE_Z = 15.2;
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) mk(new THREE.CylinderGeometry(0.15, 0.17, 1.4, 6), 0x6b4a32, sx * (2.4 + k * 1.6), 0.7, GATE_Z);
    mk(new THREE.BoxGeometry(5.2, 0.12, 0.1), 0x5a3f2a, sx * 4.8, 1.05, GATE_Z);
    mk(new THREE.BoxGeometry(0.32, 2.3, 0.32), 0x5a3f2a, sx * 2.05, 1.15, GATE_Z);
  }
  const gate = gateLeaves(L, { x: 0, z: GATE_Z, width: 3.7, height: 1.9, color: 0x6b4a32, inward: 1 });
  nameBoard(L, '수군 포구', 2.8, 12.6); // 이순신 함대가 모인 포구(출처에 포구 이름은 따로 없다)

  world.addNpc('navy', LOOKS.navy, 7, 6.5, Math.PI);
  world.addNpc('commoner', LOOKS.commoner, -3, 9.6, Math.PI);
  world.addNpc('yisunsin', LOOKS.yisunsin, -2.2, 5.3, 0); // 포구 앞 한가운데, 바다와 배를 뒤로 하고 학생 쪽을 본다

  // 노 젓기(D-30 I-01): 움직이는 우리 배는 모든 노를 한 박자로 젓고, 멈추면 노를 천천히 물 위로 들어 쉰다
  const rowers = [myShip, ...fleet.children, leadTurtle, ...lure.children];
  const rp = new THREE.Vector3();
  const rowOne = (sh, dt) => {
    const u = sh.userData.row ||= { ph: 0, k: 0, last: null };
    sh.getWorldPosition(rp);
    const speed = u.last ? Math.hypot(rp.x - u.last.x, rp.z - u.last.z) / dt : 0;
    (u.last ||= new THREE.Vector3()).copy(rp);
    u.k += ((speed > 0.3 ? 1 : 0) - u.k) * Math.min(1, dt * 2.2); // 출발하면 힘이 붙고 멈추면 천천히 잦아든다
    if (u.k < 0.002) u.k = 0;
    u.ph += dt * (2.6 + 2.4 * u.k) * u.k;
    rowShip(sh, u.ph, u.k);
  };
  world.onUpdate((dt, t) => {
    if (myShip.visible) { // 학생 배: 학생 자리를 따라간다
      const p = world.player.position;
      myShip.position.set(p.x, -0.2 + Math.sin(t * 1.4) * 0.08, p.z); myShip.rotation.y = world.player.rotation.y + Math.PI;
      world.player.visible = false;
    }
    if (dt) for (const sh of rowers) if (sh.visible && sh.parent?.visible !== false) rowOne(sh, dt);
    if (goalRing.visible) goalRing.material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
    for (const g of [lure, enemy, fleet, { children: [leadTurtle] }]) g.children.forEach((s, i) => { s.position.y = -0.2 + Math.sin(t * 1.4 + i) * 0.08 - (s.userData.sink || 0); });
    enemy.children.forEach(e => { if (e.userData.smoke.visible) e.userData.smoke.children.forEach((p, i) => { p.position.y = 2.4 + i * 0.8 + Math.sin(t * 2 + i) * 0.2; }); });
  });

  return {
    start: [0, 6.5], introFrom: [0, 19], gate, turtle, leadTurtle, flagship, lure, enemy, fleet, goalRing, myShip, setStage, setLure, setChase, setAdvance, playBattle,
    slot: { x: wingSpots[SLOT][0], z: wingSpots[SLOT][1] }, decoys: [], // 학익진 빈자리(D-30 I-02: 뒷줄의 틀린 자리 둘은 뺐다)
    seaBounds: { x0: -22, x1: 22, z0: STRAIT_Z - 4, z1: -10 },
    // 우리 배들이 한 줄로 오다가 학이 날개를 편 모양으로 펼쳐진다(seconds 동안)
    spreadFleet(seconds = 3) {
      const ships = fleet.children;
      ships.forEach((sh, i) => { sh.userData.from = [-16, -14 - i * 3.5]; }); // 서쪽에서 한 줄로 오다가
      return new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / seconds); const e = k * k * (3 - 2 * k); ships.forEach(sh => { const [fx, fz] = sh.userData.from, [tx, tz] = sh.userData.spot; sh.position.x = fx + (tx - fx) * e; sh.position.z = fz + (tz - fz) * e; }); if (k >= 1) { off(); resolve(); } }); });
    },
    // 거북선이 날개 뒤에서 맨 앞으로 힘차게 나선다(S43)
    turtleCharge(seconds = 3.5) {
      leadTurtle.visible = true;
      return new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / seconds); leadTurtle.position.z = -18 + (-35 + 18) * k * k * (3 - 2 * k); leadTurtle.position.x = 0; leadTurtle.rotation.y = 0; if (k >= 1) { off(); resolve(); } }); });
    },
    // 바다 장면 카메라: 미끼 배 출발점부터 견내량 안쪽 적까지, 학익진 양 끝이 모두 보이게 맞춘다
    seaFit: { target: [0, 0, -54], dir: [0, 1, 0.6], margin: 0.78,
      points: [[0, 0, -30], [0, 0, STRAIT_Z + 2], [-8, 0, ENEMY_WAIT], [8, 0, ENEMY_WAIT + 7], [WING.x - WING.r, 0, WING.z + 6], [WING.x + WING.r, 0, WING.z + 6], [0, 0, -40]] },
  };
}
