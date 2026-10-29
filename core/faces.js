// 만화풍 얼굴 그리기: 3D 인물 얼굴 무늬와 대화창 초상화가 같은 규칙으로 그린다.
import * as THREE from 'three';
import { LOOKS } from '../content/characters.js';

const SKIN = '#f0c9a2', SKIN_SHADE = '#d9a57f', INK = '#2b241c';

// (cx, cy)를 얼굴 가운데로, R을 얼굴 반지름으로 이목구비를 그린다.
// face: eyes(round·kind·stern), brows(normal·stern·worried), mouth(smile·flat·open),
//       beard(null·mustache·thin·thick·walrus·goatee·full), beardColor, browColor, glasses('round'), age('old'), blush
export function drawFeatures(g, face = {}, cx, cy, R) {
  const { eyes = 'round', brows = 'normal', mouth = 'smile', beard = null, beardColor = INK, browColor = INK, glasses = null, age = null } = face;
  const LINE = '#8a5a40', SHADE = 'rgba(150, 95, 65, 0.55)';
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (face.blush) {
    g.fillStyle = 'rgba(232, 120, 110, 0.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.52 * R, cy + 0.22 * R, 0.17 * R, 0.1 * R, 0, 0, Math.PI * 2); g.fill(); }
  }
  // 얼굴 입체감(D-54 생김새를 조금 더 사실적으로): 볼과 턱 아래 옅은 그늘, 콧등·이마의 밝은 빛, 광대 아래 그늘
  if (face.shade !== false) {
    const jaw = g.createRadialGradient(cx, cy + 0.05 * R, 0.7 * R, cx, cy + 0.05 * R, 1.05 * R);
    jaw.addColorStop(0, 'rgba(150, 95, 65, 0)'); jaw.addColorStop(1, 'rgba(150, 95, 65, 0.18)');
    g.fillStyle = jaw; g.beginPath(); g.ellipse(cx, cy + 0.05 * R, 1.05 * R, 1.05 * R, 0, 0, Math.PI * 2); g.fill();
    const hi = g.createRadialGradient(cx, cy - 0.35 * R, 0, cx, cy - 0.35 * R, 0.5 * R);
    hi.addColorStop(0, 'rgba(255, 240, 225, 0.35)'); hi.addColorStop(1, 'rgba(255, 240, 225, 0)');
    g.fillStyle = hi; g.beginPath(); g.ellipse(cx, cy - 0.3 * R, 0.5 * R, 0.55 * R, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(150, 95, 65, 0.13)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.5 * R, cy + 0.28 * R, 0.16 * R, 0.26 * R, sx * 0.3, 0, Math.PI * 2); g.fill(); }
  }
  // 어른 남자(수염이 있거나 sex가 정해지지 않은 어른): 옅은 팔자 주름. 아이·젊은이(age: 'young')는 그리지 않는다
  if (age !== 'young' && age !== 'old' && face.sex !== 'f') {
    g.strokeStyle = 'rgba(150, 95, 65, 0.3)'; g.lineWidth = Math.max(1.2, 0.022 * R);
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 0.14 * R, cy + 0.16 * R); g.quadraticCurveTo(cx + sx * 0.27 * R, cy + 0.3 * R, cx + sx * 0.24 * R, cy + 0.46 * R); g.stroke(); }
  }
  // 수염 자국(군인·일꾼 stubble)
  if (face.stubble) {
    g.fillStyle = 'rgba(70, 60, 55, 0.16)';
    g.beginPath(); g.moveTo(cx - 0.55 * R, cy + 0.25 * R); g.quadraticCurveTo(cx - 0.45 * R, cy + 0.92 * R, cx, cy + 0.96 * R); g.quadraticCurveTo(cx + 0.45 * R, cy + 0.92 * R, cx + 0.55 * R, cy + 0.25 * R); g.quadraticCurveTo(cx, cy + 0.5 * R, cx - 0.55 * R, cy + 0.25 * R); g.fill();
  }
  // 주름(나이 든 인물): 이마 두 줄, 팔자 주름, 눈 밑
  if (age === 'old') {
    g.strokeStyle = SHADE; g.lineWidth = Math.max(1.5, 0.025 * R);
    for (const dy of [-0.62, -0.52]) { g.beginPath(); g.moveTo(cx - 0.32 * R, cy + dy * R); g.quadraticCurveTo(cx, cy + (dy - 0.05) * R, cx + 0.32 * R, cy + dy * R); g.stroke(); }
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(cx + sx * 0.16 * R, cy + 0.12 * R); g.quadraticCurveTo(cx + sx * 0.3 * R, cy + 0.3 * R, cx + sx * 0.26 * R, cy + 0.5 * R); g.stroke();
      g.beginPath(); g.arc(cx + sx * 0.33 * R, cy + 0.02 * R, 0.11 * R, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    }
  }
  // 코: 콧날 그림자와 콧구멍
  g.strokeStyle = LINE; g.lineWidth = Math.max(1.5, 0.035 * R);
  g.beginPath(); g.moveTo(cx - 0.03 * R, cy + 0.0 * R); g.quadraticCurveTo(cx - 0.08 * R, cy + 0.17 * R, cx - 0.07 * R, cy + 0.2 * R); g.stroke();
  g.beginPath(); g.moveTo(cx - 0.1 * R, cy + 0.22 * R); g.quadraticCurveTo(cx, cy + 0.27 * R, cx + 0.1 * R, cy + 0.22 * R); g.stroke();
  // 입: 윗입술 선과 아랫입술
  const my = cy + 0.46 * R;
  g.lineWidth = Math.max(2, 0.045 * R); g.strokeStyle = '#5a2e24';
  if (mouth === 'smile') { g.beginPath(); g.arc(cx, my - 0.12 * R, 0.17 * R, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  else if (mouth === 'open') { g.fillStyle = '#7a2a22'; g.beginPath(); g.ellipse(cx, my, 0.1 * R, 0.08 * R, 0, 0, Math.PI * 2); g.fill(); }
  else {
    const lip = face.sex === 'f' ? 'rgba(190, 90, 85, 0.75)' : 'rgba(168, 100, 90, 0.5)', lw = face.sex === 'f' ? 0.13 : 0.15;
    g.fillStyle = lip; // 윗입술(가운데가 살짝 파인 활 모양)과 도톰한 아랫입술
    g.beginPath(); g.moveTo(cx - lw * R, my); g.quadraticCurveTo(cx - 0.06 * R, my - 0.055 * R, cx, my - 0.03 * R); g.quadraticCurveTo(cx + 0.06 * R, my - 0.055 * R, cx + lw * R, my); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - lw * 0.85 * R, my + 0.005 * R); g.quadraticCurveTo(cx, my + 0.1 * R, cx + lw * 0.85 * R, my + 0.005 * R); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - lw * R, my); g.quadraticCurveTo(cx, my + 0.012 * R, cx + lw * R, my); g.stroke();
    g.fillStyle = 'rgba(150, 95, 65, 0.22)'; g.beginPath(); g.ellipse(cx, my + 0.17 * R, 0.08 * R, 0.035 * R, 0, 0, Math.PI * 2); g.fill(); // 아랫입술 밑 그늘
  }
  // 수염
  g.fillStyle = beardColor;
  if (beard === 'full') {
    g.beginPath();
    g.moveTo(cx - 0.62 * R, cy + 0.12 * R);
    g.quadraticCurveTo(cx - 0.6 * R, cy + 1.05 * R, cx, cy + 1.12 * R);
    g.quadraticCurveTo(cx + 0.6 * R, cy + 1.05 * R, cx + 0.62 * R, cy + 0.12 * R);
    g.quadraticCurveTo(cx, cy + 0.55 * R, cx - 0.62 * R, cy + 0.12 * R);
    g.fill();
  } else if (beard === 'goatee') {
    g.beginPath(); g.moveTo(cx - 0.14 * R, cy + 0.54 * R); g.quadraticCurveTo(cx, cy + 0.6 * R, cx + 0.14 * R, cy + 0.54 * R); g.lineTo(cx, cy + 0.98 * R); g.closePath(); g.fill();
  }
  if (beard === 'walrus') { // 크게 처진 콧수염(입을 덮는다)
    g.beginPath(); g.moveTo(cx - 0.36 * R, cy + 0.52 * R);
    g.quadraticCurveTo(cx - 0.3 * R, cy + 0.2 * R, cx, cy + 0.24 * R);
    g.quadraticCurveTo(cx + 0.3 * R, cy + 0.2 * R, cx + 0.36 * R, cy + 0.52 * R);
    g.quadraticCurveTo(cx, cy + 0.4 * R, cx - 0.36 * R, cy + 0.52 * R); g.fill();
  } else if (beard === 'thick') { // 짙고 끝이 살짝 올라간 콧수염
    g.beginPath(); g.moveTo(cx - 0.34 * R, cy + 0.26 * R);
    g.quadraticCurveTo(cx - 0.18 * R, cy + 0.22 * R, cx, cy + 0.27 * R);
    g.quadraticCurveTo(cx + 0.18 * R, cy + 0.22 * R, cx + 0.34 * R, cy + 0.26 * R);
    g.quadraticCurveTo(cx + 0.2 * R, cy + 0.4 * R, cx, cy + 0.36 * R);
    g.quadraticCurveTo(cx - 0.2 * R, cy + 0.4 * R, cx - 0.34 * R, cy + 0.26 * R); g.fill();
  } else if (beard === 'thin') {
    g.strokeStyle = beardColor; g.lineWidth = Math.max(1.5, 0.035 * R);
    g.beginPath(); g.moveTo(cx - 0.2 * R, cy + 0.33 * R); g.quadraticCurveTo(cx, cy + 0.28 * R, cx + 0.2 * R, cy + 0.33 * R); g.stroke();
  } else if (beard === 'mustache' || beard === 'goatee' || beard === 'full') {
    g.beginPath();
    for (const sx of [-1, 1]) g.ellipse(cx + sx * 0.15 * R, cy + 0.31 * R, 0.16 * R, 0.05 * R, sx * 0.3, 0, Math.PI * 2);
    g.fill();
  }
  // 눈: 흰자(아몬드꼴), 갈색 눈동자, 윗눈꺼풀 선. kind는 지그시 감은 눈
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 0.33 * R, ey = cy - 0.06 * R;
    if (eyes === 'kind') {
      g.strokeStyle = INK; g.lineWidth = Math.max(2, 0.05 * R);
      g.beginPath(); g.arc(ex, ey + 0.05 * R, 0.13 * R, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      continue;
    }
    const h = eyes === 'stern' ? 0.072 * R : 0.09 * R, w = 0.17 * R;
    g.fillStyle = '#f7f1e6';
    g.beginPath(); g.moveTo(ex - w, ey); g.quadraticCurveTo(ex, ey - h * 1.6, ex + w, ey); g.quadraticCurveTo(ex, ey + h * 1.2, ex - w, ey); g.fill();
    g.save(); g.clip();
    g.fillStyle = '#4a3020'; g.beginPath(); g.arc(ex, ey + 0.005 * R, 0.078 * R, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#120c08'; g.beginPath(); g.arc(ex, ey + 0.005 * R, 0.04 * R, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.02 * R, ey - 0.02 * R, 0.018 * R, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = Math.max(2, (face.sex === 'f' ? 0.06 : 0.045) * R);
    g.beginPath(); g.moveTo(ex - w * 1.05, ey + 0.005 * R); g.quadraticCurveTo(ex, ey - h * 1.7, ex + w * 1.05, ey); g.stroke();
    // 쌍꺼풀 대신 옅은 눈두덩 선과 아래 눈꺼풀
    g.strokeStyle = 'rgba(150, 95, 65, 0.4)'; g.lineWidth = Math.max(1.2, 0.022 * R);
    g.beginPath(); g.moveTo(ex - w * 0.8, ey - h * 1.25); g.quadraticCurveTo(ex, ey - h * 2.3, ex + w * 0.95, ey - h * 1.1); g.stroke();
    g.beginPath(); g.moveTo(ex - w * 0.7, ey + h * 0.75); g.quadraticCurveTo(ex, ey + h * 1.35, ex + w * 0.8, ey + h * 0.6); g.stroke();
  }
  // 안경: 검은 둥근 테와 다리
  if (glasses === 'round') {
    g.strokeStyle = '#1a1614'; g.lineWidth = Math.max(2, 0.05 * R);
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 0.33 * R, cy - 0.05 * R, 0.19 * R, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 0.14 * R, cy - 0.07 * R); g.quadraticCurveTo(cx, cy - 0.13 * R, cx + 0.14 * R, cy - 0.07 * R); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 0.52 * R, cy - 0.07 * R); g.lineTo(cx + sx * 0.8 * R, cy - 0.12 * R); g.stroke(); }
  }
  // 눈썹
  g.strokeStyle = browColor; g.lineWidth = Math.max(2, (face.sex === 'f' ? 0.055 : face.brow === 'thick' ? 0.1 : 0.075) * R);
  for (const sx of [-1, 1]) {
    const bx = cx + sx * 0.33 * R, by = cy - 0.33 * R;
    g.beginPath();
    // 안쪽 끝(코 쪽)이 내려가면 근엄하고, 올라가면 걱정스러워 보인다
    if (brows === 'stern') { g.moveTo(bx - sx * 0.17 * R, by + 0.07 * R); g.quadraticCurveTo(bx, by - 0.04 * R, bx + sx * 0.16 * R, by - 0.05 * R); }
    else if (brows === 'worried') { g.moveTo(bx - sx * 0.17 * R, by - 0.08 * R); g.lineTo(bx + sx * 0.15 * R, by + 0.06 * R); }
    else { g.moveTo(bx - 0.16 * R, by); g.quadraticCurveTo(bx, by - 0.1 * R, bx + 0.16 * R, by); }
    g.stroke();
  }
  g.restore();
}

// 3D 머리 앞쪽에 입힐 얼굴 무늬 (배경 투명). 같은 얼굴은 한 번만 만든다.
const faceCache = new Map();
export function faceTexture(face = {}) {
  const key = JSON.stringify(face);
  if (faceCache.has(key)) return faceCache.get(key);
  // 3D 얼굴 판은 눈 아래(코·입·턱)를 1.5배 길게 늘여 붙인다(D-54: 턱이 있는 달걀꼴 머리에서 입이 코에 붙지 않게)
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = 384;
  drawFeatures(tmp.getContext('2d'), face, 192, 186, 176);
  const cv = document.createElement('canvas'); cv.width = cv.height = 384;
  const c = cv.getContext('2d'), cut = 190, f = 1.5;
  c.drawImage(tmp, 0, 0, 384, cut, 0, 0, 384, cut);
  c.drawImage(tmp, 0, cut, 384, 384 - cut, 0, cut, 384, (384 - cut) * f);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  faceCache.set(key, tex);
  return tex;
}

const hex = n => `#${n.toString(16).padStart(6, '0')}`;

function drawHat(g, hat, cx, cy, R, hairColor = '#1e1c1a') {
  g.save();
  if (hat === 'official') {             // 복두: 검은 관과 양옆으로 뻗은 날개
    g.fillStyle = '#1e1c1a';
    g.fillRect(cx - 1.55 * R, cy - 0.95 * R, 3.1 * R, 0.12 * R);
    g.beginPath(); g.roundRect(cx - 0.72 * R, cy - 1.42 * R, 1.44 * R, 0.62 * R, 0.18 * R); g.fill();
  } else if (hat === 'helmet' || hat === 'general') {   // 투구
    g.fillStyle = hat === 'general' ? '#8a8478' : '#6b6862';
    g.beginPath(); g.ellipse(cx, cy - 0.62 * R, 0.98 * R, 0.62 * R, 0, Math.PI, 0); g.fill();
    g.fillRect(cx - 1.02 * R, cy - 0.66 * R, 2.04 * R, 0.14 * R);
    g.fillStyle = '#b8452f';
    g.beginPath(); g.arc(cx, cy - 1.28 * R, (hat === 'general' ? 0.2 : 0.13) * R, 0, Math.PI * 2); g.fill();
  } else if (hat === 'fur') {           // 털모자
    g.fillStyle = '#5a4130';
    g.beginPath(); g.roundRect(cx - 0.95 * R, cy - 1.18 * R, 1.9 * R, 0.62 * R, 0.25 * R); g.fill();
  } else if (hat === 'buzz') {          // 아주 짧게 깎은 머리(김구): 머리 모양을 따라 옅게
    g.fillStyle = hairColor; g.globalAlpha = 0.75;
    g.beginPath(); g.ellipse(cx, cy - 0.38 * R, 0.99 * R, 0.66 * R, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1;
  } else if (hat === 'swept') {         // 뒤로 빗어 넘긴 머리(이승만)
    g.fillStyle = hairColor;
    g.beginPath(); g.ellipse(cx, cy - 0.48 * R, 1.0 * R, 0.6 * R, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(cx + 0.1 * R, cy - 0.98 * R, 0.78 * R, 0.2 * R, -0.08, 0, Math.PI * 2); g.fill();
  } else if (hat === 'bald') {          // 스님: 깎은 머리
  } else if (hat === 'gat') {           // 갓: 머리카락 위에 넓은 챙과 높은 모자(말총이라 조금 비친다)
    g.fillStyle = '#1e1c1a';
    g.beginPath(); g.ellipse(cx, cy - 0.45 * R, 0.98 * R, 0.62 * R, 0, Math.PI, 0); g.fill();
    g.globalAlpha = 0.88;
    g.beginPath(); g.ellipse(cx, cy - 0.78 * R, 1.62 * R, 0.16 * R, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.roundRect(cx - 0.42 * R, cy - 1.5 * R, 0.84 * R, 0.76 * R, 0.08 * R); g.fill();
    g.globalAlpha = 1;
  } else if (hat === 'ikseon') {        // 익선관: 둥근 관과 위로 선 날개
    g.fillStyle = '#1e1c1a';
    g.beginPath(); g.ellipse(cx, cy - 0.5 * R, 1.0 * R, 0.72 * R, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.roundRect(cx - 0.6 * R, cy - 1.32 * R, 1.2 * R, 0.5 * R, 0.2 * R); g.fill();
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.42 * R, cy - 1.42 * R, 0.18 * R, 0.3 * R, sx * 0.4, 0, Math.PI * 2); g.fill(); }
  } else if (hat === 'jeollip') {       // 전립: 챙과 둥근 모자, 붉은 술
    g.fillStyle = '#2a2622';
    g.beginPath(); g.ellipse(cx, cy - 0.62 * R, 1.4 * R, 0.15 * R, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx, cy - 0.66 * R, 0.86 * R, 0.62 * R, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#b8452f'; g.beginPath(); g.arc(cx, cy - 1.36 * R, 0.17 * R, 0, Math.PI * 2); g.fill();
  } else if (hat === 'fedora') {        // 중절모
    g.fillStyle = '#3a3530';
    g.beginPath(); g.ellipse(cx, cy - 0.7 * R, 1.35 * R, 0.16 * R, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.roundRect(cx - 0.72 * R, cy - 1.38 * R, 1.44 * R, 0.7 * R, 0.22 * R); g.fill();
    g.fillStyle = '#1e1c1a'; g.fillRect(cx - 0.72 * R, cy - 0.86 * R, 1.44 * R, 0.14 * R);
  } else if (hat === 'cap') {           // 챙 달린 모자(학생·군인)
    g.fillStyle = '#22262e';
    g.beginPath(); g.roundRect(cx - 0.9 * R, cy - 1.15 * R, 1.8 * R, 0.55 * R, 0.2 * R); g.fill();
    g.fillStyle = '#111214'; g.beginPath(); g.ellipse(cx, cy - 0.6 * R, 0.8 * R, 0.13 * R, 0, 0, Math.PI); g.fill();
  } else if (hat === 'steel') {         // 철모
    g.fillStyle = '#5a6448';
    g.beginPath(); g.ellipse(cx, cy - 0.5 * R, 1.08 * R, 0.85 * R, 0, Math.PI, 0); g.fill();
    g.fillRect(cx - 1.12 * R, cy - 0.55 * R, 2.24 * R, 0.12 * R);
  } else if (hat === 'bun' || hat === 'braid' || hat === 'short') { // 쪽진 머리·땋은 머리·짧은 머리
    g.fillStyle = hairColor;
    g.beginPath(); g.ellipse(cx, cy - 0.45 * R, 0.98 * R, hat === 'short' ? 0.55 * R : 0.65 * R, 0, Math.PI, 0); g.fill();
    if (hat !== 'short') { // 가운데 가르마, 귀 뒤로 넘겨 묶은 머리
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.6 * R, cy - 0.85 * R); g.quadraticCurveTo(cx + s * 1.12 * R, cy - 0.55 * R, cx + s * 1.04 * R, cy + 0.35 * R); g.lineTo(cx + s * 0.82 * R, cy + 0.3 * R); g.quadraticCurveTo(cx + s * 0.86 * R, cy - 0.3 * R, cx + s * 0.55 * R, cy - 0.55 * R); g.closePath(); g.fill(); } // 귀를 덮고 내려온 옆머리
      g.strokeStyle = SKIN; g.lineWidth = Math.max(1.5, 0.04 * R); g.beginPath(); g.moveTo(cx, cy - 1.02 * R); g.lineTo(cx, cy - 0.72 * R); g.stroke();
    }
  } else if (hat === 'kunfa') {        // 거란 곤발: 깎은 정수리, 귀 앞으로 늘어뜨린 머리
    g.fillStyle = hairColor;
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect(cx + s * 0.92 * R - 0.09 * R, cy - 0.55 * R, 0.18 * R, 0.95 * R, 0.08 * R); g.fill(); }
  } else if (hat === 'mongol') {       // 몽골 모자: 털 두른 챙과 둥근 모자, 붉은 술
    g.fillStyle = '#6a5038'; g.beginPath(); g.roundRect(cx - 1.05 * R, cy - 0.85 * R, 2.1 * R, 0.3 * R, 0.12 * R); g.fill();
    g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(cx, cy - 0.85 * R, 0.8 * R, 0.6 * R, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#b8452f'; g.beginPath(); g.arc(cx, cy - 1.48 * R, 0.13 * R, 0, Math.PI * 2); g.fill();
  } else if (hat === 'daenggi') {      // 땋은 머리와 붉은 댕기: 가운데 가르마
    g.fillStyle = hairColor; g.beginPath(); g.ellipse(cx, cy - 0.45 * R, 0.98 * R, 0.62 * R, 0, Math.PI, 0); g.fill();
    g.strokeStyle = SKIN; g.lineWidth = Math.max(1.5, 0.04 * R); g.beginPath(); g.moveTo(cx, cy - 1.05 * R); g.lineTo(cx, cy - 0.75 * R); g.stroke();
  } else if (hat === 'qing') {          // 청나라 모자: 낮은 원뿔과 붉은 술
    g.fillStyle = '#3a3028';
    g.beginPath(); g.moveTo(cx - 1.12 * R, cy - 0.55 * R); g.lineTo(cx + 1.12 * R, cy - 0.55 * R); g.lineTo(cx, cy - 1.3 * R); g.closePath(); g.fill();
    g.fillStyle = '#b8452f'; g.beginPath(); g.arc(cx, cy - 1.32 * R, 0.16 * R, 0, Math.PI * 2); g.fill();
  } else {                              // 맨머리와 상투
    g.fillStyle = '#1e1c1a';
    g.beginPath(); g.ellipse(cx, cy - 0.45 * R, 0.98 * R, 0.62 * R, 0, Math.PI, 0); g.fill();
    if (hat === 'topknot') { g.beginPath(); g.arc(cx, cy - 1.12 * R, 0.2 * R, 0, Math.PI * 2); g.fill(); g.fillStyle = '#141210'; g.fillRect(cx - 0.96 * R, cy - 0.72 * R, 1.92 * R, 0.13 * R); } // 상투와 망건
  }
  g.restore();
}

export const drawHatForTest = drawHat; // 테스트용

// 대화창 초상화: 둥근 배경 위에 어깨, 머리, 모자, 얼굴. 같은 인물은 한 번만 그린다.
// lookId는 LOOKS 이름이나 생김새 묶음(학생 역할처럼 LOOKS에 없는 생김새)
const portraitCache = new Map();
export function portraitURL(lookId) {
  if (typeof lookId === 'object') lookId = JSON.stringify(lookId);
  if (portraitCache.has(lookId)) return portraitCache.get(lookId);
  const L = LOOKS[lookId] || JSON.parse(lookId);
  const cv = document.createElement('canvas'); cv.width = cv.height = 160;
  const g = cv.getContext('2d', { willReadFrequently: true }); // CPU 그림판: 어느 브라우저에서나 그린 그대로 이미지가 된다
  g.fillStyle = '#e9dcc3'; g.beginPath(); g.arc(80, 80, 80, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(80, 80, 80, 0, Math.PI * 2); g.clip();
  g.fillStyle = hex(L.robe); g.beginPath(); g.ellipse(80, 168, 66, 46, 0, 0, Math.PI * 2); g.fill();
  if (L.outfit === 'suit') { // 양복: 흰 셔츠와 넥타이
    g.fillStyle = '#f2efe8'; g.beginPath(); g.moveTo(64, 126); g.lineTo(96, 126); g.lineTo(80, 160); g.closePath(); g.fill();
    g.fillStyle = '#7a2a2a'; g.beginPath(); g.moveTo(76, 130); g.lineTo(84, 130); g.lineTo(86, 158); g.lineTo(80, 162); g.lineTo(74, 158); g.closePath(); g.fill();
  } else if (L.outfit === 'armor') { // 찰갑 조각
    g.fillStyle = hex(L.armor ?? 0x6b665e); g.beginPath(); g.ellipse(80, 170, 70, 46, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(30, 26, 22, 0.45)'; g.lineWidth = 1.5;
    for (let y = 130; y < 160; y += 7) for (let x = 14 + (y % 14 ? 4 : 0); x < 146; x += 8) g.strokeRect(x, y, 7, 6);
  } else if (L.outfit === 'danryeong' || L.outfit === 'deel' || L.outfit === 'uniform') { // 둥근 깃
    g.strokeStyle = hex(L.outfit === 'uniform' ? L.robe : (L.trim ?? 0x2b241c)); g.lineWidth = 6; g.beginPath(); g.arc(80, 132, 20, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    if (L.outfit === 'deel') { g.strokeStyle = hex(L.trim ?? 0x2b241c); g.lineWidth = 5; g.beginPath(); g.moveTo(84, 150); g.lineTo(104, 166); g.stroke(); }
  } else if (L.outfit === 'jangsam') { g.fillStyle = '#8a3a2a'; g.beginPath(); g.moveTo(40, 132); g.lineTo(58, 126); g.lineTo(130, 168); g.lineTo(108, 170); g.closePath(); g.fill(); }
  else if (L.trim) { g.fillStyle = hex(L.trim); g.fillRect(14, 150, 132, 6); }
  const cx = 80, cy = 92, R = 42;
  const shape = L.face && L.face.shape, sx = shape === 'long' ? 0.88 : shape === 'round' ? 1.06 : 1, sy = shape === 'long' ? 1.1 : 1;
  const skinCol = { light: '#f4d2b0', tan: '#d9a77e', old: '#e8c4a0' }[L.skin || (L.face?.age === 'old' ? 'old' : '')] || SKIN;
  g.fillStyle = SKIN_SHADE; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.98 * sx, cy + 4, 7, 10, 0, 0, Math.PI * 2); g.fill(); } // 귀
  g.fillStyle = skinCol; g.beginPath(); g.ellipse(cx, cy + (sy - 1) * R * 0.4, R * sx, R * sy, 0, 0, Math.PI * 2); g.fill();
  drawHat(g, L.hat, cx, cy, R, L.hairColor);
  drawFeatures(g, L.face, cx, cy + 4, R * 0.95);
  g.restore();
  const url = cv.toDataURL('image/png');
  portraitCache.set(lookId, url);
  return url;
}
