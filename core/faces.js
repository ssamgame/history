// 만화풍 얼굴 그리기: 3D 인물 얼굴 무늬와 대화창 초상화가 같은 규칙으로 그린다.
import * as THREE from 'three';
import { LOOKS } from '../content/characters.js';
import { buildFace, resolve } from './facebuild.js';

const SKIN = '#f0c9a2', SKIN_SHADE = '#d9a57f', INK = '#2b241c';

// (cx, cy)를 얼굴 가운데로, R을 얼굴 반지름으로 이목구비를 그린다.
// face: eyes(round·kind·stern), brows(normal·stern·worried), mouth(smile·flat·open),
//       beard(null·mustache·thin·thick·walrus·goatee·full), beardColor, browColor, glasses('round'), age('old'), blush
export function drawFeatures(g, face = {}, cx, cy, R) {
  const { beard = null, beardColor = INK, browColor = INK, glasses = null, age = null } = face;
  // 얼굴 짜임(D-55, core/facebuild.js): 얼굴형·눈·눈썹·코·입 유형과 기본 인상·상황 표정을 합친 값. 없으면 그 자리에서 짠다
  const v = face.v || resolve(buildFace({ face }));
  const SHADE = 'rgba(150, 95, 65, 0.55)', soft = a => `rgba(150, 95, 65, ${a})`;
  const eyeY = cy + (-0.06 + v.eyeY) * R, my = cy + (0.46 + v.mouthY) * R;
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (face.blush) {
    g.fillStyle = 'rgba(232, 120, 110, 0.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.52 * R, cy + 0.22 * R, 0.17 * R, 0.1 * R, 0, 0, Math.PI * 2); g.fill(); }
  }
  // 얼굴 입체감: 턱 아래 아주 옅은 그늘, 볼(얼굴형이 넓을수록 넓게), 광대가 도드라진 사람은 광대 아래 그늘
  if (face.shade !== false) {
    const jaw = g.createRadialGradient(cx, cy + 0.05 * R, 0.7 * R, cx, cy + 0.05 * R, 1.05 * R);
    jaw.addColorStop(0, soft(0)); jaw.addColorStop(1, soft(0.07));
    g.fillStyle = jaw; g.beginPath(); g.ellipse(cx, cy + 0.05 * R, 1.05 * R, 1.05 * R, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = soft(0.05);
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.5 * R * v.cheek, cy + 0.28 * R, 0.16 * R * v.cheek, 0.26 * R, sx * 0.3, 0, Math.PI * 2); g.fill(); }
    if (v.cheekbone) { g.fillStyle = soft(0.13); for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.56 * R, cy + 0.22 * R, 0.2 * R, 0.07 * R, sx * -0.45, 0, Math.PI * 2); g.fill(); } }
  }
  // 어른의 팔자 주름(잔주름이 있는 사람은 더 또렷하게), 눈가 주름
  if (age !== 'young' && face.sex !== 'f') {
    g.strokeStyle = soft(v.lines ? 0.22 : 0.12); g.lineWidth = Math.max(1, 0.018 * R);
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 0.14 * R, cy + 0.16 * R); g.quadraticCurveTo(cx + sx * 0.27 * R, cy + 0.3 * R, cx + sx * 0.24 * R, my - 0.02 * R); g.stroke(); }
  }
  if (v.lines) for (const sx of [-1, 1]) { g.strokeStyle = soft(0.28); g.lineWidth = Math.max(1, 0.014 * R); for (const d of [-0.04, 0.03]) { g.beginPath(); g.moveTo(cx + sx * (0.33 * v.gap + 0.2) * R, eyeY + d * R); g.lineTo(cx + sx * (0.33 * v.gap + 0.29) * R, eyeY + (d * 1.8) * R); g.stroke(); } }
  // 수염 자국
  if (face.stubble || v.stubble) {
    g.fillStyle = 'rgba(70, 60, 55, 0.08)';
    g.beginPath(); g.moveTo(cx - 0.55 * R, cy + 0.25 * R); g.quadraticCurveTo(cx - 0.45 * R, cy + 0.92 * R, cx, cy + 0.96 * R); g.quadraticCurveTo(cx + 0.45 * R, cy + 0.92 * R, cx + 0.55 * R, cy + 0.25 * R); g.quadraticCurveTo(cx, cy + 0.5 * R, cx - 0.55 * R, cy + 0.25 * R); g.fill();
  }
  // 나이 든 인물: 이마 두 줄, 눈 밑 주름
  if (age === 'old') {
    g.strokeStyle = SHADE; g.lineWidth = Math.max(1.5, 0.022 * R);
    for (const dy of [-0.62, -0.52]) { g.beginPath(); g.moveTo(cx - 0.32 * R, cy + dy * R); g.quadraticCurveTo(cx, cy + (dy - 0.05) * R, cx + 0.32 * R, cy + dy * R); g.stroke(); }
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 0.33 * v.gap * R, eyeY + 0.08 * R, 0.11 * R, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  }
  // 흉터(볼에 옅은 줄)
  if (v.scar) { const [sd, sy] = v.scar; g.strokeStyle = 'rgba(200, 140, 120, 0.7)'; g.lineWidth = Math.max(1.5, 0.025 * R); g.beginPath(); g.moveTo(cx + sd * 0.42 * R, cy + sy * R); g.lineTo(cx + sd * 0.6 * R, cy + (sy + 0.2) * R); g.stroke(); }
  // 코: 콧대 선(길이·또렷함), 코끝 그늘(돌출할수록 진하게), 콧방울 너비
  {
    const nl = 0.22 * v.noseL, nw = 0.1 * v.noseW, top = cy + (0.22 - nl) * R, tipY = cy + 0.22 * R;
    if (v.noseBridge > 0.3) { g.strokeStyle = soft(0.25 + v.noseBridge * 0.25); g.lineWidth = Math.max(1.2, 0.022 * R); g.beginPath(); g.moveTo(cx - 0.04 * R, top); g.quadraticCurveTo(cx - 0.075 * R, tipY - 0.06 * R, cx - 0.065 * R * v.noseW, tipY - 0.02 * R); g.stroke(); }
    g.fillStyle = soft(0.08 + v.nosePro * 0.08); g.beginPath(); g.ellipse(cx + 0.02 * R, tipY - 0.01 * R, nw * R * v.noseTip * 0.8, 0.05 * R * v.noseTip, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(138, 90, 64, 0.65)'; g.lineWidth = Math.max(1.2, 0.025 * R);
    g.beginPath(); g.moveTo(cx - nw * R, tipY); g.quadraticCurveTo(cx, tipY + 0.05 * R * v.noseTip, cx + nw * R, tipY); g.stroke();
    g.fillStyle = 'rgba(110, 66, 48, 0.55)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * nw * 0.55 * R, tipY + 0.012 * R, 0.022 * R * v.noseW, 0.013 * R, 0, 0, Math.PI * 2); g.fill(); }
  }
  // 입: 너비·윗입술·아랫입술 두께·입꼬리, 표정에 따라 벌리거나 앙다문다
  {
    const lip = face.sex === 'f' ? 'rgba(190, 90, 85, 0.75)' : 'rgba(168, 100, 90, 0.52)';
    const lw = (face.sex === 'f' ? 0.13 : 0.15) * v.mouthW * R, cy2 = my + v.corner * R, up = 0.05 * v.lipUp * R * (v.tight ? 0.5 : 1), low = 0.085 * v.lipLow * R * (v.tight ? 0.55 : 1);
    const op = v.open * 0.15 * R;
    g.fillStyle = lip;
    g.beginPath(); g.moveTo(cx - lw, cy2); g.quadraticCurveTo(cx - lw * 0.4, my - up * 1.1, cx, my - up * 0.6); g.quadraticCurveTo(cx + lw * 0.4, my - up * 1.1, cx + lw, cy2); g.quadraticCurveTo(cx, my + 0.01 * R, cx - lw, cy2); g.fill(); // 윗입술(가운데가 살짝 파인 활 모양)
    g.beginPath(); g.moveTo(cx - lw * 0.85, cy2 + op * 0.4); g.quadraticCurveTo(cx, my + op + low * 1.25, cx + lw * 0.85, cy2 + op * 0.4); g.quadraticCurveTo(cx, my + op, cx - lw * 0.85, cy2 + op * 0.4); g.fill(); // 아랫입술
    if (op > 0) { g.fillStyle = '#5a2220'; g.beginPath(); g.moveTo(cx - lw * 0.8, cy2); g.quadraticCurveTo(cx, my - 0.005 * R, cx + lw * 0.8, cy2); g.quadraticCurveTo(cx, my + op * 1.1, cx - lw * 0.8, cy2); g.fill(); } // 벌린 입 안
    g.strokeStyle = '#5a2e24'; g.lineWidth = Math.max(1.5, (v.tight ? 0.04 : 0.032) * R);
    g.beginPath(); g.moveTo(cx - lw, cy2); g.quadraticCurveTo(cx, my + (op > 0 ? -0.005 : 0.012) * R, cx + lw, cy2); g.stroke();
    g.fillStyle = soft(0.2); g.beginPath(); g.ellipse(cx, my + op + low + 0.08 * R, 0.08 * R, 0.03 * R, 0, 0, Math.PI * 2); g.fill(); // 아랫입술 밑 그늘
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
  // 눈: 크기·가로세로·눈꼬리·윗눈꺼풀 꼭대기·눈꺼풀 모양(쌍꺼풀·홑꺼풀·덮인 눈꺼풀·움푹)·표정(눈을 크게, 가늘게, 눈웃음)
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 0.33 * R * v.gap, ey = eyeY;
    const w = 0.17 * R * v.eyeW, h = 0.072 * R * v.eyeH, sq = Math.max(-0.4, Math.min(0.75, v.squint));
    const topH = h * 1.6 * (1 - sq * 0.55), botH = h * 1.2 * (1 - Math.max(0, sq - 0.3) * 1.2), px = ex + sx * v.peak * w; // 위·아래 눈꺼풀 높이, 위 꼭대기 자리
    g.save(); g.translate(ex, ey); g.rotate(-sx * v.tilt); g.translate(-ex, -ey); // 눈꼬리가 올라가거나 처진 눈
    if (v.lid === 'deep') { g.fillStyle = soft(0.22); g.beginPath(); g.ellipse(ex, ey - h * 1.6, w * 1.15, h * 1.7, 0, Math.PI, 0); g.fill(); } // 움푹한 눈두덩
    const eyePath = () => { g.beginPath(); g.moveTo(ex - w, ey); g.quadraticCurveTo(px, ey - topH, ex + w, ey); g.quadraticCurveTo(ex, ey + botH, ex - w, ey); };
    g.fillStyle = '#f7f1e6'; eyePath(); g.fill();
    g.save(); eyePath(); g.clip();
    const ir = 0.078 * R * Math.min(1.15, Math.max(0.8, v.eyeH));
    g.fillStyle = v.iris; g.beginPath(); g.arc(ex, ey + 0.005 * R, ir, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#120c08'; g.beginPath(); g.arc(ex, ey + 0.005 * R, ir * 0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.02 * R, ey - 0.02 * R, 0.017 * R, 0, Math.PI * 2); g.fill();
    if (v.lid === 'hooded') { g.fillStyle = '#e0b08c'; g.beginPath(); g.moveTo(ex - w * 0.2 * sx, ey - topH); g.quadraticCurveTo(ex + sx * w * 0.6, ey - topH * 0.55, ex + sx * w * 1.1, ey + h * 0.15); g.lineTo(ex + sx * w * 1.2, ey - topH); g.closePath(); g.fill(); } // 바깥으로 덮인 눈꺼풀
    g.restore();
    g.strokeStyle = INK; g.lineWidth = Math.max(1.5, (face.sex === 'f' ? 0.045 : 0.032) * v.lidLine * R);
    g.beginPath(); g.moveTo(ex - w * 1.05, ey + 0.005 * R); g.quadraticCurveTo(px, ey - topH * 1.06, ex + w * 1.05, ey); g.stroke();
    g.strokeStyle = soft(0.28); g.lineWidth = Math.max(1, 0.016 * R);
    if (v.lid === 'double') { g.beginPath(); g.moveTo(ex - w * 0.8, ey - topH * 0.8); g.quadraticCurveTo(px, ey - topH * 1.45, ex + w * 0.95, ey - topH * 0.7); g.stroke(); } // 쌍꺼풀
    if (v.lid === 'hooded') { g.beginPath(); g.moveTo(ex - w * 0.6 * sx, ey - topH * 1.1); g.quadraticCurveTo(ex + sx * w * 0.5, ey - topH * 1.2, ex + sx * w * 1.15, ey + h * 0.1); g.stroke(); }
    g.beginPath(); g.moveTo(ex - w * 0.7, ey + botH * 0.6); g.quadraticCurveTo(ex, ey + botH * 1.1, ex + w * 0.8, ey + botH * 0.5); g.stroke(); // 아래 눈꺼풀
    g.restore();
  }
  // 안경: 검은 둥근 테와 다리
  if (glasses === 'round') {
    g.strokeStyle = '#1a1614'; g.lineWidth = Math.max(2, 0.05 * R);
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 0.33 * R, cy - 0.05 * R, 0.19 * R, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 0.14 * R, cy - 0.07 * R); g.quadraticCurveTo(cx, cy - 0.13 * R, cx + 0.14 * R, cy - 0.07 * R); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 0.52 * R, cy - 0.07 * R); g.lineTo(cx + sx * 0.8 * R, cy - 0.12 * R); g.stroke(); }
  }
  // 눈썹: 안쪽·가운데·바깥쪽 세 점을 잇는 굵기가 줄어드는 띠(유형마다 모양이 다르다), 인상·표정이 안쪽·바깥 높이를 바꾼다
  g.fillStyle = browColor;
  for (const sx of [-1, 1]) {
    const bx = cx + sx * 0.33 * R * v.gap, by = eyeY - 0.27 * R + (v.browY + (sx > 0 ? v.asym : 0)) * R, L = v.browL;
    const P = [[bx - sx * 0.17 * R * L, by + v.browIn * R], [bx + sx * 0.0 * R, by + v.browMid * R], [bx + sx * 0.17 * R * L, by + v.browOut * R]];
    const T = Math.max(1.5, (face.sex === 'f' ? 0.042 : 0.058) * R * v.browT * (face.brow === 'thick' ? 1.3 : 1));
    const pt = t => { const a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; return [a * P[0][0] + b * P[1][0] + c * P[2][0], a * P[0][1] + b * P[1][1] + c * P[2][1]]; };
    const top = [], bot = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, [x, y] = pt(t), th = T * (1 - v.browTaper * t) * (i === 0 ? 0.85 : 1); top.push([x, y - th * 0.55]); bot.push([x, y + th * 0.45]); }
    g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); bot.reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
  }
  if (v.mole) { g.fillStyle = 'rgba(70, 45, 35, 0.8)'; g.beginPath(); g.arc(cx + v.mole[0] * R, cy + v.mole[1] * R, 0.03 * R, 0, Math.PI * 2); g.fill(); } // 점
  g.restore();
}

// 예전 이름(faceVariant)을 남겨 둔다: 생김새 묶음(+군중 번호 L._n, 표정)으로 그릴 값을 만든다
export function faceVariant(L = {}, expr = 'neutral') { return resolve(buildFace(L, L._n || 0), expr); }

// 얼굴 무늬 판 배치: 크기 S, 얼굴 가운데 높이 cy·반지름 R(판 크기에 대한 비율), cut 아래(코·입·턱)를 f배 늘인다.
// 판은 머리 앞쪽 곡면(people.js faceGeo: 세로각 theta0부터 thetaLen)에 붙는다. 눈썹이 모자 아래로 숨지 않게 눈썹 높이를 예전 그대로(세로각 약 1.06) 둔다.
export const FACE_LAYOUT = { S: 320, cy: 0.389, R: 0.458, cut: 0.435, f: 1.9, theta0: 0.62, thetaLen: 1.85 };
// 판 위 높이(비율 py) → 머리 곡면 세로각
export const faceTheta = py => { const L = FACE_LAYOUT, q = py <= L.cut ? py : L.cut + (py - L.cut) * L.f; return L.theta0 + q * L.thetaLen; };

// 3D 머리 앞쪽에 입힐 얼굴 무늬 (배경 투명). 같은 얼굴은 한 번만 만든다.
const faceCache = new Map();
export function faceTexture(face = {}) {
  const key = JSON.stringify(face);
  if (faceCache.has(key)) return faceCache.get(key);
  // 3D 얼굴 판은 눈 아래(코·입·턱)를 1.5배 길게 늘여 붙인다(D-54: 턱이 있는 달걀꼴 머리에서 입이 코에 붙지 않게)
  const { S, cy, R, cut: cutK, f } = FACE_LAYOUT, tmp = document.createElement('canvas'); tmp.width = tmp.height = S;
  drawFeatures(tmp.getContext('2d'), face, S / 2, S * cy, S * R);
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'), cut = Math.round(S * cutK);
  c.drawImage(tmp, 0, 0, S, cut, 0, 0, S, cut);
  c.drawImage(tmp, 0, cut, S, S - cut, 0, cut, S, (S - cut) * f);
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
export function portraitURL(lookId, expr = 'neutral') {
  if (typeof lookId === 'object') lookId = JSON.stringify(lookId);
  const ck = expr === 'neutral' ? lookId : `${lookId}|${expr}`;
  if (portraitCache.has(ck)) return portraitCache.get(ck);
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
  const fs = faceVariant(L, expr).S, sx = fs.w * 0.97, sy = fs.h; // 얼굴형(D-55)
  const skinCol = { light: '#f6d8ba', tan: '#e8c09a', old: '#ecc9a8' }[L.skin || (L.face?.age === 'old' ? 'old' : '')] || SKIN;
  g.fillStyle = SKIN_SHADE; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.98 * sx, cy + 4, 7, 10, 0, 0, Math.PI * 2); g.fill(); } // 귀
  g.fillStyle = skinCol; g.beginPath(); g.ellipse(cx, cy + (sy - 1) * R * 0.4, R * sx, R * sy, 0, 0, Math.PI * 2); g.fill();
  drawHat(g, L.hat, cx, cy, R, L.hairColor);
  drawFeatures(g, { ...L.face, v: faceVariant(L, expr) }, cx, cy + 4, R * 0.95);
  g.restore();
  const url = cv.toDataURL('image/png');
  portraitCache.set(ck, url);
  return url;
}
