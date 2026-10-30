// Gölge analizi: çizilen engellerin (baca, komşu bina, ağaç) panellere düşen doğrudan güneşi kesme oranı.
// Her ayın tipik gününde saat saat panel merkezinden güneşe ışın atılır. Dağınık ışık gölgeden az etkilendiği
// için kayıp, doğrudan ışık payıyla çarpılır. Dizi (string) etkisi hesaba katılmaz; ön değerlendirmedir.

import { cellPose, toXY, type FaceFrame, type LatLon, type LayoutSettings, type Obstacle, type PanelCell, type XY } from "./geometry";

const ORTA_GUN = [15, 46, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
const DOGRUDAN_PAY = 0.7;
const MAX_PANEL = 40;
const MENZIL = 80;
const ADIM = 0.75;

function inside(p: XY, ring: XY[]) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.n > p.n !== b.n > p.n && p.x < ((b.x - a.x) * (p.n - a.n)) / (b.n - a.n) + a.x) hit = !hit;
  }
  return hit;
}

/** Güneş vektörü: x doğu, n kuzey, y yukarı. */
function sun(lat: number, month: number, hour: number) {
  const phi = (lat * Math.PI) / 180;
  const decl = (23.45 * Math.PI * Math.sin((2 * Math.PI * (284 + ORTA_GUN[month])) / 365)) / 180;
  const ha = ((hour - 12) * 15 * Math.PI) / 180;
  const y = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha);
  const cosEl = Math.max(1e-3, Math.sqrt(1 - y * y));
  const west = (Math.cos(decl) * Math.sin(ha)) / cosEl;
  const south = (y * Math.sin(phi) - Math.sin(decl)) / (cosEl * Math.cos(phi));
  return { x: -west * cosEl, n: -south * cosEl, y };
}

/** Yüzey başına 12 aylık kayıp oranı (0-1). Engel yoksa boş döner. */
export function shadeLosses(frames: FaceFrame[], cells: PanelCell[], layout: LayoutSettings, obstacles: Obstacle[], center: LatLon, lat: number): Record<string, number[]> {
  if (!obstacles.length) return {};
  const obs = obstacles.map((o) => ({ h: o.height, ring: o.points.map((p) => toXY(p, center)) })).filter((o) => o.ring.length >= 3);
  const out: Record<string, number[]> = {};
  for (const fr of frames) {
    const own = cells.filter((c) => c.faceId === fr.face.id);
    if (!own.length) continue;
    // Büyük çatılarda örnekleme yeterli.
    const step = Math.max(1, Math.floor(own.length / MAX_PANEL));
    const sample = own.filter((_, i) => i % step === 0).map((c) => cellPose(fr, c, layout));
    out[fr.face.id] = ORTA_GUN.map((_, month) => {
      let total = 0;
      let shaded = 0;
      for (let hour = 5; hour <= 20; hour += 0.5) {
        const s = sun(lat, month, hour);
        if (s.y <= 0.03) continue;
        const flat = Math.hypot(s.x, s.n) || 1;
        for (const pose of sample) {
          const w = Math.max(0, s.x * pose.normal.x + s.n * pose.normal.n + s.y * pose.normal.y);
          if (w <= 0) continue;
          total += w;
          blocked: for (let d = ADIM; d < MENZIL; d += ADIM) {
            const z = pose.center.y + (d * s.y) / flat;
            const q = { x: pose.center.x + (d * s.x) / flat, n: pose.center.n + (d * s.n) / flat };
            for (const o of obs) {
              if (z < o.h && inside(q, o.ring)) {
                shaded += w;
                break blocked;
              }
            }
          }
        }
      }
      return total > 0 ? (shaded / total) * DOGRUDAN_PAY : 0;
    });
  }
  return out;
}
