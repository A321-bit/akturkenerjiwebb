// Teklif Stüdyosu geometri motoru.
//
// Koordinatlar: tasarım merkezine göre metre; x doğu, n kuzey. Yön (azimut) PVGIS kuralıyla:
// 0 güney, 90 batı, -90 doğu. Her çatı yüzeyi uydu üzerinde çizilen bir çokgen + eğim + eğim
// yönü (suyun aktığı yön) + saçak yüksekliğinden oluşur. Paneller yüzeyin kendi düzleminde
// (u: saçak boyunca, v: eğim yukarı) tam sayılı ızgara hücrelerine yerleşir; böylece elle
// ekleme/çıkarma ızgaraya oturur ve 3B görünüm aynı veriden üretilir.

export type LatLon = [number, number];
export type XY = { x: number; n: number };

export type PanelModel = { name: string; wp: number; lengthM: number; widthM: number; price?: number; slug?: string };

export type RoofFace = {
  id: string;
  name: string;
  /** Uydu üzerinde çizilen çokgen (enlem, boylam). */
  points: LatLon[];
  /** Çatı eğimi (°); 0-3 arası düz çatı sayılır. */
  pitch: number;
  /** Eğim yönü: suyun aktığı, panellerin baktığı yön (PVGIS azimutu). */
  azimuth: number;
  /** Saçak (en alçak kenar) yüksekliği, m. */
  eaveHeight: number;
  /** Düz çatı / arazide sehpa eğimi (°). */
  mountTilt: number;
  orientation: "dikey" | "yatay";
  /** Izgara kaydırma (m): panelleri yüzeyde ince ayarla kaydırmak için. */
  offsetU: number;
  offsetV: number;
};

export type PanelCell = { faceId: string; i: number; j: number };

export type LayoutSettings = { setbackM: number; gapM: number; lat: number };

const M_PER_DEG_LAT = 110540;
const rad = (d: number) => (d * Math.PI) / 180;

export function toXY(p: LatLon, center: LatLon): XY {
  return { x: (p[1] - center[1]) * 111320 * Math.cos(rad(center[0])), n: (p[0] - center[0]) * M_PER_DEG_LAT };
}

export function toLatLon(p: XY, center: LatLon): LatLon {
  return [center[0] + p.n / M_PER_DEG_LAT, center[1] + p.x / (111320 * Math.cos(rad(center[0])))];
}

/** Çokgen alanı (m², yatay izdüşüm). */
export function polygonArea(pts: XY[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.n - q.x * p.n;
  }
  return Math.abs(a) / 2;
}

export const isFlat = (f: Pick<RoofFace, "pitch">) => f.pitch < 3;

/** Yüzeyin düzlem eksenleri: s eğim yukarı (yatay), e saçak boyunca. */
export function faceAxes(f: Pick<RoofFace, "azimuth">) {
  const a = rad(f.azimuth);
  return { s: { x: Math.sin(a), n: Math.cos(a) }, e: { x: Math.cos(a), n: -Math.sin(a) } };
}

const dot = (p: XY, d: XY) => p.x * d.x + p.n * d.n;

export type FaceFrame = {
  face: RoofFace;
  /** Köşelerin yüzey koordinatları (u, v): v düz çatıda yatay, eğimli çatıda eğim boyunca ölçülür. */
  poly: { u: number; v: number }[];
  oU: number;
  oS: number;
  cosP: number;
  /** Panelin u ve v yönündeki boyutu (yüzeyde); flat: v = sehpanın yatay izdüşümü. */
  pw: number;
  ph: number;
  /** Panelin eğim boyunca gerçek uzunluğu (sehpada). */
  slopeLen: number;
  stepU: number;
  stepV: number;
  tilt: number;
};

/** Kışın öğle güneşinde sıralar birbirini gölgelemesin diye sıra aralığı. */
function rowPitch(slopeLen: number, tilt: number, lat: number) {
  const elev = Math.max(15, 90 - Math.abs(lat) - 23.45);
  return slopeLen * Math.cos(rad(tilt)) + (slopeLen * Math.sin(rad(tilt))) / Math.tan(rad(elev));
}

export function faceFrame(face: RoofFace, center: LatLon, model: PanelModel, s: LayoutSettings): FaceFrame {
  const { s: sAx, e: eAx } = faceAxes(face);
  const pts = face.points.map((p) => toXY(p, center));
  const oU = Math.min(...pts.map((p) => dot(p, eAx)));
  const oS = Math.min(...pts.map((p) => dot(p, sAx)));
  const flat = isFlat(face);
  const cosP = flat ? 1 : Math.cos(rad(face.pitch));
  const poly = pts.map((p) => ({ u: dot(p, eAx) - oU, v: (dot(p, sAx) - oS) / cosP }));
  const long = model.lengthM;
  const short = model.widthM;
  const pw = face.orientation === "dikey" ? short : long;
  const slopeLen = face.orientation === "dikey" ? long : short;
  const tilt = flat ? face.mountTilt : face.pitch;
  const ph = flat ? slopeLen * Math.cos(rad(face.mountTilt)) : slopeLen;
  const stepV = flat ? rowPitch(slopeLen, face.mountTilt, s.lat) : slopeLen + s.gapM;
  return { face, poly, oU, oS, cosP, pw, ph, slopeLen, stepU: pw + s.gapM, stepV, tilt };
}

function inside(pt: { u: number; v: number }, poly: { u: number; v: number }[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.v > pt.v !== b.v > pt.v && pt.u < ((b.u - a.u) * (pt.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}

function distToEdges(pt: { u: number; v: number }, poly: { u: number; v: number }[]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const du = b.u - a.u;
    const dv = b.v - a.v;
    const len2 = du * du + dv * dv || 1e-9;
    const t = Math.max(0, Math.min(1, ((pt.u - a.u) * du + (pt.v - a.v) * dv) / len2));
    d = Math.min(d, Math.hypot(pt.u - (a.u + t * du), pt.v - (a.v + t * dv)));
  }
  return d;
}

/** Hücrenin yüzeydeki dikdörtgeni (u0, v0 alt-sol köşe). */
export function cellRect(fr: FaceFrame, i: number, j: number, s: LayoutSettings) {
  const u0 = s.setbackM + fr.face.offsetU + i * fr.stepU;
  const v0 = s.setbackM + fr.face.offsetV + j * fr.stepV;
  return { u0, v0, u1: u0 + fr.pw, v1: v0 + fr.ph };
}

export function cellFits(fr: FaceFrame, i: number, j: number, s: LayoutSettings) {
  const r = cellRect(fr, i, j, s);
  const corners = [
    { u: r.u0, v: r.v0 },
    { u: r.u1, v: r.v0 },
    { u: r.u1, v: r.v1 },
    { u: r.u0, v: r.v1 },
  ];
  // Kenar boşluğu çokgen kenarlarına göre; 1 cm tolerans.
  return corners.every((c) => inside(c, fr.poly) && distToEdges(c, fr.poly) >= s.setbackM - 0.01);
}

/** Yüzeye sığan tüm hücreler (otomatik doldurma). */
export function autoFill(fr: FaceFrame, s: LayoutSettings): PanelCell[] {
  const maxU = Math.max(...fr.poly.map((p) => p.u));
  const maxV = Math.max(...fr.poly.map((p) => p.v));
  const out: PanelCell[] = [];
  for (let j = 0; j * fr.stepV < maxV; j++) for (let i = 0; i * fr.stepU < maxU; i++) if (cellFits(fr, i, j, s)) out.push({ faceId: fr.face.id, i, j });
  return out;
}

/** Yüzeydeki bir noktayı (u, v) hücreye çevirir. */
export function cellAt(fr: FaceFrame, p: XY, s: LayoutSettings) {
  const { s: sAx, e: eAx } = faceAxes(fr.face);
  const u = dot(p, eAx) - fr.oU;
  const v = (dot(p, sAx) - fr.oS) / fr.cosP;
  const i = Math.floor((u - s.setbackM - fr.face.offsetU) / fr.stepU);
  const j = Math.floor((v - s.setbackM - fr.face.offsetV) / fr.stepV);
  return { i, j, u, v };
}

export function pointInFace(fr: FaceFrame, p: XY) {
  const { s: sAx, e: eAx } = faceAxes(fr.face);
  return inside({ u: dot(p, eAx) - fr.oU, v: (dot(p, sAx) - fr.oS) / fr.cosP }, fr.poly);
}

/** Yüzey koordinatından yatay konuma (x, n). */
export function faceToXY(fr: FaceFrame, u: number, v: number): XY {
  const { s: sAx, e: eAx } = faceAxes(fr.face);
  const a = fr.oU + u;
  const b = fr.oS + v * fr.cosP;
  return { x: a * eAx.x + b * sAx.x, n: a * eAx.n + b * sAx.n };
}

/** Bir noktadaki çatı yüksekliği (m). */
export function heightAt(fr: FaceFrame, p: XY) {
  if (isFlat(fr.face)) return fr.face.eaveHeight;
  const { s: sAx } = faceAxes(fr.face);
  return fr.face.eaveHeight + (dot(p, sAx) - fr.oS) * Math.tan(rad(fr.face.pitch));
}

/** Panelin uydu üzerindeki izdüşümü (harita çizimi için). */
export function cellFootprint(fr: FaceFrame, c: PanelCell, s: LayoutSettings): XY[] {
  const r = cellRect(fr, c.i, c.j, s);
  return [faceToXY(fr, r.u0, r.v0), faceToXY(fr, r.u1, r.v0), faceToXY(fr, r.u1, r.v1), faceToXY(fr, r.u0, r.v1)];
}

/** Panelin 3B yerleşimi: merkez, eksenler (x doğu, y yukarı, n kuzey) ve boyut. */
export function cellPose(fr: FaceFrame, c: PanelCell, s: LayoutSettings) {
  const r = cellRect(fr, c.i, c.j, s);
  const { s: sAx, e: eAx } = faceAxes(fr.face);
  const t = rad(fr.tilt);
  const flat = isFlat(fr.face);
  // Eğim yukarı birim vektör (3B) ve yüzey normali.
  const up = { x: sAx.x * Math.cos(t), y: Math.sin(t), n: sAx.n * Math.cos(t) };
  const normal = { x: -sAx.x * Math.sin(t), y: Math.cos(t), n: -sAx.n * Math.sin(t) };
  const base = faceToXY(fr, (r.u0 + r.u1) / 2, r.v0);
  const baseY = flat ? fr.face.eaveHeight + 0.25 : heightAt(fr, base) + 0.12;
  const half = fr.slopeLen / 2;
  return {
    center: { x: base.x + up.x * half + normal.x * 0.02, y: baseY + up.y * half + normal.y * 0.02, n: base.n + up.n * half + normal.n * 0.02 },
    eAxis: { x: eAx.x, y: 0, n: eAx.n },
    upAxis: up,
    normal,
    width: fr.pw,
    length: fr.slopeLen,
    standHeight: flat ? 0.25 + fr.slopeLen * Math.sin(t) : 0.12,
  };
}

/** Eğim yönünü çokgenin en uzun kenarına dik olacak şekilde tahmin eder (iki seçenekten güneye yakın olanı). */
export function guessAzimuth(points: LatLon[], center: LatLon) {
  const pts = points.map((p) => toXY(p, center));
  let best = { len: 0, dx: 1, dn: 0 };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.n - a.n);
    if (len > best.len) best = { len, dx: (b.x - a.x) / len, dn: (b.n - a.n) / len };
  }
  // Kenara dik iki yön; azimut = atan2(-dx, -dn) kuralıyla (aşağı eğim vektörü d = (-sin a, -cos a)).
  const cands = [
    { x: -best.dn, n: best.dx },
    { x: best.dn, n: -best.dx },
  ].map((d) => Math.round((Math.atan2(-d.x, -d.n) * 180) / Math.PI));
  return cands.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a)) || 0;
}

export const YON_ADI = (az: number) => {
  const a = ((az % 360) + 540) % 360 - 180; // -180..180
  const names: [number, string][] = [
    [0, "Güney"],
    [45, "Güneybatı"],
    [90, "Batı"],
    [135, "Kuzeybatı"],
    [180, "Kuzey"],
    [-135, "Kuzeydoğu"],
    [-90, "Doğu"],
    [-45, "Güneydoğu"],
  ];
  return names.reduce((best, cur) => (Math.abs(((cur[0] - a + 540) % 360) - 180) < Math.abs(((best[0] - a + 540) % 360) - 180) ? cur : best))[1];
};
