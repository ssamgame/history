// 전쟁 지도(2026-11-05 선생님: 6·25 남침에서 낙동강까지, 중국군이 밀고 내려온 길): 화면 오른쪽 한반도 지도에
// 38도선(점선)과 강을 그리고, 화살표 길을 stops 차례로 이어 그린다. to(i)로 i번 곳까지 늘린다. 좌표는 지도 300×400(core/screens.js MAP_OUTLINE).
import { MAP_OUTLINE } from '../../core/screens.js';

export const LINE38 = [[84, 196], [216, 196]];
export const NAKDONG = [[176, 262], [184, 286], [186, 306], [196, 330], [204, 342]];

export function warMap(ui, { stops, color = '#a3262a', river = NAKDONG }) {
  if (!ui) return null;
  const box = document.createElement('div'); box.className = 'route-map war-map';
  Object.assign(box.style, { position: 'absolute', right: '3%', top: '12%', height: '58%', aspectRatio: '3 / 4', background: 'rgba(127,168,191,0.92)', border: '4px solid #6b4a32', borderRadius: '10px', zIndex: 5, pointerEvents: 'none' });
  ui.appendChild(box);
  const pl = pts => pts.map(q => q.join(',')).join(' ');
  const draw = n => {
    const pts = stops.slice(0, n + 1), last = pts[pts.length - 1];
    const tip = pts.length > 1 ? (() => { const [a, b] = [pts[pts.length - 2], last], ang = Math.atan2(b[2] - a[2], b[1] - a[1]) * 180 / Math.PI; return `<polygon points="0,-6 12,0 0,6" fill="${color}" transform="translate(${b[1]},${b[2]}) rotate(${ang})"/>`; })() : '';
    box.innerHTML = `<svg viewBox="0 0 300 400" aria-hidden="true"><polygon points="${MAP_OUTLINE}" fill="#d9cfa8" stroke="#6b5a3a" stroke-width="3"/>
      <polyline points="${pl(LINE38)}" stroke="#2b241c" stroke-width="2.5" stroke-dasharray="8 6"/><text x="220" y="200" font-size="15" font-weight="bold" fill="#2b241c">38도선</text>
      ${river ? `<polyline points="${pl(river)}" fill="none" stroke="#2f6b9a" stroke-width="4" stroke-linecap="round"/>` : ''}
      <polyline points="${pts.map(q => `${q[1]},${q[2]}`).join(' ')}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>${tip}
      ${pts.map((q, i) => `<circle cx="${q[1]}" cy="${q[2]}" r="${i === n ? 6 : 4}" fill="${i === n ? color : '#2b241c'}"/><text x="${q[1] + (q[3] ?? 8)}" y="${q[2] + 5}" font-size="${i === n ? 19 : 15}" font-weight="bold" fill="${i === n ? color : '#2b241c'}"${(q[3] ?? 8) < 0 ? ' text-anchor="end"' : ''}>${q[0]}</text>`).join('')}</svg>`;
  };
  draw(0);
  return { to: i => draw(i), count: stops.length, remove: () => box.remove(), box };
}

// 이어 그리기: dur초 동안 0번부터 끝까지 한 곳씩
export function playWarMap(map, world, dur) {
  if (!map) return () => {};
  let t = 0, shown = 0;
  return world.onUpdate(dt => { t += dt; const n = Math.min(map.count - 1, Math.floor(t / dur * map.count)); if (n !== shown) { shown = n; map.to(n); } });
}
