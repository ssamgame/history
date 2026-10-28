// 안내판: 나무 기둥 두 개와 제목을 쓴 판. 마을 곳곳에 세워 두고, 다가가 말을 걸 듯이 누르면 해설을 읽는다.
// 꼭 읽지 않아도 장을 마칠 수 있다(볼거리).
import * as THREE from 'three';
import { mat } from './people.js';

export const SIGN_CANVAS = { w: 512, h: 200 }; // 판(2.6 × 1.0)과 같은 비율
const FONT = size => `bold ${size}px "Nanum Myeongjo", Batang, serif`;

// 제목을 판에 크게 쓰는 방법: 한 줄로 크게 들어가면 한 줄, 길면 띄어쓰기에서 두 줄로 나눈다.
export function signTextLayout(c, title) {
  const maxW = SIGN_CANVAS.w * 0.88;
  const fits = (lines, size) => { c.font = FONT(size); return lines.every(l => c.measureText(l).width <= maxW); };
  for (let size = 100; size >= 72; size -= 4) if (fits([title], size)) return { lines: [title], size, font: FONT(size) };
  const words = title.split(' ');
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
      const longest = Math.max(...lines.map(l => l.length));
      if (!best || longest < best.longest) best = { lines, longest };
    }
    for (let size = 84; size >= 56; size -= 4) if (fits(best.lines, size)) return { lines: best.lines, size, font: FONT(size) };
  }
  for (let size = 72; size > 30; size -= 4) if (fits([title], size)) return { lines: [title], size, font: FONT(size) };
  return { lines: [title], size: 30, font: FONT(30) };
}

export function makeSign(title) {
  const g = new THREE.Group();
  g.userData.title = title; // '새 장소 발견'에 쓰는 이름
  for (const x of [-1.1, 1.1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.6, 6), mat(0x5a3f2a, 'wood', 'object'));
    post.position.set(x, 1.3, -0.15); post.castShadow = true; g.add(post); // 기둥은 판 뒤에: 글자 양끝을 가리지 않게
  }
  const { w, h } = SIGN_CANVAS;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = '#efe3c6'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#6b4a32'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
  const L = signTextLayout(c, title);
  c.fillStyle = '#231c14'; c.font = L.font; c.textAlign = 'center'; c.textBaseline = 'middle';
  const gap = L.size * 1.05, top = h / 2 - (gap * (L.lines.length - 1)) / 2 + L.size * 0.04;
  L.lines.forEach((line, i) => c.fillText(line, w / 2, top + i * gap));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.MeshLambertMaterial({ map: tex });
  const edge = mat(0x6b4a32, 'wood', 'object');
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.08), [edge, edge, edge, edge, face, face]);
  board.position.set(0, 2.0, 0); board.castShadow = true; g.add(board);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.09, 0.4), mat(0x3d4846, 'tile', 'object'));
  roof.position.set(0, 2.56, 0); g.add(roof);
  g.name = `sign:${title}`;
  return g;
}

// 건물 간판(현판, C-03 2026-10-28): 길 위에 따로 세운 안내판 대신 건물 벽(처마 아래)에 단 검은 판에 흰 글씨.
// 돌려주는 묶음의 자리는 건물 앞 땅(학생이 서서 읽는 곳)이고, 판은 위(y)와 뒤(back, 건물 쪽)로 옮겨 단다.
// world.addSpot에 넣으면 인물처럼 다가가 읽는다(대사는 script.npc[id].always 그대로).
export function makePlaque(title, { y = 2.9, back = 1.2 } = {}) {
  const g = new THREE.Group();
  g.userData.title = title;
  const { w, h } = SIGN_CANVAS;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = '#2b2118'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#c99a3c'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);
  const L = signTextLayout(c, title);
  c.fillStyle = '#f4ead2'; c.font = L.font; c.textAlign = 'center'; c.textBaseline = 'middle';
  const gap = L.size * 1.05, top = h / 2 - (gap * (L.lines.length - 1)) / 2 + L.size * 0.04;
  L.lines.forEach((line, i) => c.fillText(line, w / 2, top + i * gap));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.MeshLambertMaterial({ map: tex });
  const edge = mat(0x4a3322, 'wood', 'object');
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.88, 0.1), [edge, edge, edge, edge, face, face]);
  board.position.set(0, y, -back); board.rotation.x = -0.12; board.castShadow = true; g.add(board); // 아래에서 읽기 좋게 살짝 숙인다
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.06, 0.06), mat(0x7a2a1e, 'wood', 'object'));
  frame.position.set(0, y, -back - 0.05); frame.rotation.x = -0.12; g.add(frame);
  g.name = `sign:${title}`;
  g.userData.plaque = true; g.userData.markY = y + 0.85; g.userData.markZ = -back + 0.2;
  return g;
}
// 안내판 하나 만들기: plaque가 있으면 건물 간판, 없으면 예전 기둥 안내판
export function signOrPlaque(s) { return s.plaque ? makePlaque(s.title, s.plaque === true ? {} : s.plaque) : makeSign(s.title); }
