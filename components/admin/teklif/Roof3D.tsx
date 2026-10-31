"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { BarChart3, Cloud, CloudRain, CloudSun, Maximize2, Orbit, Pause, Play, Sun } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cellPose, heightAt, toXY, type FaceFrame, type LatLon, type LayoutSettings, type Obstacle, type PanelCell } from "@/lib/teklif/geometry";
import { ESRI, getImagery, tileUrl } from "@/lib/teklif/imagery";
import { SIM_DEFAULT, WEATHERS, flowAt, pvLimit, simulateDay, type SimState, type Weather } from "@/lib/teklif/simulate";
import type { AboneGrubu } from "@/lib/elektrik-tarife";

// 3B görünüm: uydu görüntüsü zemin, çizilen çatı yüzeyleri (bina kütlesiyle) ve paneller.
// Sahne koordinatı: X doğu, Y yukarı, Z güney (Z = -kuzey). Uydu görüntüsü çatıya da kaplanır;
// güneş seçilen ay ve saatte gerçek konumundadır, gölgeler buna göre düşer.
// Teklif PDF'i için perspektif ve üstten görüntü alınabilir.

export type VideoOptions = { title: string; lines: string[]; footer: string; seconds?: number; onProgress?: (pct: number) => void };
export type Roof3DHandle = { snapshot: (view: "perspective" | "top") => string | null; record: (o: VideoOptions) => Promise<{ blob: Blob; ext: string } | null> };

/** Verilirse sahnenin altında o anki üretim, tüketim ve şebeke akışı görünür. */
export type RoofSim = { monthlyPv: number[]; monthlyLoad: number[]; abone: AboneGrubu; azimuth: number; batteryKwh: number; dcKwp: number; acKw: number };
type Props = { center: LatLon; frames: FaceFrame[]; cells: PanelCell[]; layout: LayoutSettings; lat: number; obstacles?: Obstacle[]; sim?: RoofSim; state?: SimState; onState?: (s: SimState) => void };

const WX_ICON = { ortalama: BarChart3, acik: Sun, gunesli: CloudSun, bulutlu: Cloud, yagmurlu: CloudRain };
// Hava görünümü: güneş gücü, ortam ışığı, gökyüzü (üst, orta, ufuk), bulut sayısı ve rengi.
const WX: Record<Weather, { sun: number; hemi: number; sky: [string, string, string]; clouds: number; cloud: string; fog: string; rain: boolean }> = {
  ortalama: { sun: 0.85, hemi: 0.7, sky: ["#6fa3d8", "#c4dcf0", "#eef3f7"], clouds: 5, cloud: "#ffffff", fog: "#dbe7f1", rain: false },
  acik: { sun: 1, hemi: 0.72, sky: ["#2f7fd6", "#9fd0f5", "#e6f3fb"], clouds: 0, cloud: "#ffffff", fog: "#d6e9f6", rain: false },
  gunesli: { sun: 0.92, hemi: 0.72, sky: ["#4c91da", "#b4d8f3", "#ecf4f9"], clouds: 10, cloud: "#ffffff", fog: "#dbe9f3", rain: false },
  bulutlu: { sun: 0.26, hemi: 0.88, sky: ["#8c97a5", "#b4bcc6", "#d3d8de"], clouds: 26, cloud: "#a9b1bb", fog: "#c6ccd3", rain: false },
  yagmurlu: { sun: 0.08, hemi: 0.58, sky: ["#4e5763", "#737c88", "#99a0a9"], clouds: 32, cloud: "#6f7883", fog: "#8f969f", rain: true },
};
const NIGHT = ["#050a1c", "#0c1732", "#1a2541"];

const mix = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), k).getStyle();

// Yumuşak bulut dokusu: üst üste binen ışık lekeleri.
function cloudTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  for (const [x, y, r] of [[70, 76, 44], [120, 62, 56], [176, 74, 46], [100, 86, 38], [150, 88, 40]]) {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(255,255,255,.95)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const V = (x: number, y: number, n: number) => new THREE.Vector3(x, y, -n);

// Panel yüzeyi: hücre, bara ve alüminyum çerçeve çizgili doku (bir kez üretilir).
function panelTexture() {
  const c = document.createElement("canvas");
  c.width = 264;
  c.height = 528;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a1730";
  g.fillRect(0, 0, c.width, c.height);
  const cols = 6;
  const rows = 12;
  const w = c.width / cols;
  const h = c.height / rows;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const grad = g.createLinearGradient(i * w, j * h, (i + 1) * w, (j + 1) * h);
      grad.addColorStop(0, "#14305e");
      grad.addColorStop(1, "#0c1f42");
      g.fillStyle = grad;
      g.fillRect(i * w + 1.5, j * h + 1.5, w - 3, h - 3);
      g.fillStyle = "rgba(190,205,225,.28)";
      for (const f of [0.33, 0.66]) g.fillRect(i * w + w * f, j * h + 1.5, 1, h - 3);
    }
  g.strokeStyle = "#d5dbe3";
  g.lineWidth = 7;
  g.strokeRect(3.5, 3.5, c.width - 7, c.height - 7);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Gökyüzü: üstten aşağı açılan renk geçişi.
function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const paint = (top: string, mid: string, low: string) => {
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, top);
    grad.addColorStop(0.65, mid);
    grad.addColorStop(1, low);
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    t.needsUpdate = true;
  };
  paint("#6fa3d8", "#c4dcf0", "#eef3f7");
  return { t, paint };
}

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const ORTA_GUN = [15, 46, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

/** Güneş yönü (birim vektör, sahne ekseninde) ve yüksekliği; saat yerel güneş saatidir. */
function sunDirection(lat: number, month: number, hour: number) {
  const phi = (lat * Math.PI) / 180;
  const decl = (23.45 * Math.PI * Math.sin((2 * Math.PI * (284 + ORTA_GUN[month])) / 365)) / 180;
  const ha = ((hour - 12) * 15 * Math.PI) / 180;
  const sinEl = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha);
  const el = Math.asin(sinEl);
  const cosEl = Math.max(1e-3, Math.cos(el));
  // Güneyden batıya pozitif azimut: sabah doğu (+X), öğleden sonra batı (-X).
  const west = (Math.cos(decl) * Math.sin(ha)) / cosEl;
  const south = (sinEl * Math.sin(phi) - Math.sin(decl)) / (cosEl * Math.cos(phi));
  return { dir: new THREE.Vector3(-west * cosEl, sinEl, south * cosEl).normalize(), el };
}

// Uydu zemini: merkezin çevresindeki karoları tuvalde birleştirir.
async function satelliteGround(center: LatLon, sizeM: number) {
  const z = 19;
  const n = 2 ** z;
  const lon2x = (lon: number) => ((lon + 180) / 360) * n;
  const lat2y = (lat: number) => ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  const x2lon = (x: number) => (x / n) * 360 - 180;
  const y2lat = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const dLat = sizeM / 2 / 110540;
  const dLon = sizeM / 2 / (111320 * Math.cos((center[0] * Math.PI) / 180));
  const x0 = Math.floor(lon2x(center[1] - dLon));
  const x1 = Math.floor(lon2x(center[1] + dLon));
  const y0 = Math.floor(lat2y(center[0] + dLat));
  const y1 = Math.floor(lat2y(center[0] - dLat));
  const canvas = document.createElement("canvas");
  canvas.width = (x1 - x0 + 1) * 256;
  canvas.height = (y1 - y0 + 1) * 256;
  const g = canvas.getContext("2d")!;
  const im = await getImagery();
  await Promise.all(
    Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, (_, k) => {
      const tx = x0 + (k % (x1 - x0 + 1));
      const ty = y0 + Math.floor(k / (x1 - x0 + 1));
      return new Promise<void>((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          g.drawImage(img, (tx - x0) * 256, (ty - y0) * 256);
          res();
        };
        // Karo gelmezse (Google kota/ödeme vb.) aynı karo Esri'den denenir.
        img.onerror = () => {
          if (img.dataset.fallback || im.source === "esri") return res();
          img.dataset.fallback = "1";
          img.src = tileUrl(ESRI, z, tx, ty);
        };
        img.src = tileUrl(im, z, tx, ty);
      });
    })
  );
  const nw = toXY([y2lat(y0), x2lon(x0)], center);
  const se = toXY([y2lat(y1 + 1), x2lon(x1 + 1)], center);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, nw, se };
}

const Roof3D = forwardRef<Roof3DHandle, Props>(function Roof3D({ center, frames, cells, layout, lat, obstacles, sim, state, onState }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; content: THREE.Group; ground: THREE.Group; sun: THREE.DirectionalLight } | null>(null);
  const panelTex = useRef<THREE.Texture | null>(null);
  const recording = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [imagery, setImagery] = useState<{ tex: THREE.Texture; nw: { x: number; n: number }; se: { x: number; n: number } } | null>(null);
  const [own, setOwn] = useState<SimState>(SIM_DEFAULT);
  const st = state ?? own;
  const { month, hour, weather } = st;
  const stRef = useRef(st);
  const latRef = useRef(lat);
  useEffect(() => {
    stRef.current = st;
    latRef.current = lat;
  });
  const setSim = (x: Partial<SimState>) => {
    const next = { ...stRef.current, ...x };
    stRef.current = next;
    if (onState) onState(next);
    else setOwn(next);
  };
  const [playing, setPlaying] = useState(false);
  const [spin, setSpin] = useState(false);
  // Ortamı uygular: güneş, gökyüzü, ışık, bulut ve yağmur. Görsel alma ve video da bunu kullanır.
  const applyEnv = useRef<(w: Weather, m: number, h: number) => void>(() => {});

  // Gün boyu oynatma: 24 saat yaklaşık 15 saniye.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSim({ hour: (stRef.current.hour + 0.125) % 24 }), 80);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSim güncel değeri ref'ten okur
  }, [playing]);

  useImperativeHandle(ref, () => ({
    snapshot(view) {
      const c = ctx.current;
      if (!c) return null;
      const { camera, controls, renderer, scene } = c;
      const saved = { pos: camera.position.clone(), target: controls.target.clone() };
      const box3 = new THREE.Box3().setFromObject(c.content);
      const mid = box3.isEmpty() ? new THREE.Vector3() : box3.getCenter(new THREE.Vector3());
      const size = box3.isEmpty() ? 20 : Math.max(10, box3.getSize(new THREE.Vector3()).length());
      // Teklif görselleri her zaman açık havada ve öğlen alınır.
      applyEnv.current("acik", 5, 13);
      if (view === "top") camera.position.set(mid.x, size * 1.6, mid.z + 0.01);
      else camera.position.set(mid.x + size * 0.55, size * 0.6, mid.z + size * 0.85);
      camera.lookAt(mid);
      controls.target.copy(mid);
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL("image/jpeg", 0.88);
      camera.position.copy(saved.pos);
      controls.target.copy(saved.target);
      controls.update();
      applyEnv.current(stRef.current.weather, stRef.current.month, stRef.current.hour);
      return url;
    },
    // Müşteri videosu: dikey (720×1280), kamera binanın çevresinde döner, güneş gün boyu ilerler.
    // Tamamen tarayıcıda üretilir; dışarıya bağlı değildir.
    async record({ title, lines, footer, seconds = 12, onProgress }) {
      const c = ctx.current;
      if (!c || typeof MediaRecorder === "undefined") return null;
      const W = 720;
      const H = 1280;
      const { renderer, scene, camera, controls, sun } = c;
      const el = renderer.domElement;
      const saved = { pos: camera.position.clone(), target: controls.target.clone(), aspect: camera.aspect, w: el.clientWidth, h: el.clientHeight, ratio: renderer.getPixelRatio(), auto: controls.autoRotate };
      const box3 = new THREE.Box3().setFromObject(c.content);
      const mid = box3.isEmpty() ? new THREE.Vector3() : box3.getCenter(new THREE.Vector3());
      const size = box3.isEmpty() ? 25 : Math.max(14, box3.getSize(new THREE.Vector3()).length());
      recording.current = true;
      applyEnv.current("acik", 5, 13);
      controls.enabled = false;
      controls.autoRotate = false;
      renderer.setPixelRatio(1);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      sun.target.position.copy(mid);

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const g = out.getContext("2d")!;
      const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
      const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
      const rec = new MediaRecorder(out.captureStream(30), { mimeType: mime, videoBitsPerSecond: 5_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: mime.split(";")[0] }))));
      rec.start();

      const draw = (t: number) => {
        const a = 0.7 + t * Math.PI * 1.6;
        const r = size * 1.25;
        camera.position.set(mid.x + Math.sin(a) * r, mid.y + size * (0.85 - 0.25 * t), mid.z + Math.cos(a) * r);
        camera.lookAt(mid);
        const { dir, el: elev } = sunDirection(lat, 5, 7.5 + t * 10.5);
        sun.position.copy(mid).addScaledVector(dir, 70);
        sun.intensity = 0.9 + 2 * Math.min(1, Math.sin(Math.max(0, elev)) * 1.6);
        renderer.render(scene, camera);
        g.drawImage(el, 0, 0, W, H);
        // Üst başlık ve alt kartvizit.
        const top = g.createLinearGradient(0, 0, 0, 300);
        top.addColorStop(0, "rgba(8,21,41,.85)");
        top.addColorStop(1, "rgba(8,21,41,0)");
        g.fillStyle = top;
        g.fillRect(0, 0, W, 300);
        g.fillStyle = "#fff";
        g.font = "700 44px Segoe UI, Arial, sans-serif";
        g.fillText(title, 40, 88);
        g.font = "500 30px Segoe UI, Arial, sans-serif";
        lines.forEach((l, i) => g.fillText(l, 40, 138 + i * 42));
        const bottom = g.createLinearGradient(0, H - 220, 0, H);
        bottom.addColorStop(0, "rgba(8,21,41,0)");
        bottom.addColorStop(1, "rgba(8,21,41,.92)");
        g.fillStyle = bottom;
        g.fillRect(0, H - 220, W, 220);
        g.fillStyle = "#f5b301";
        g.font = "700 34px Segoe UI, Arial, sans-serif";
        g.fillText("AKTÜRK ENERJİ", 40, H - 82);
        g.fillStyle = "#fff";
        g.font = "500 26px Segoe UI, Arial, sans-serif";
        g.fillText(footer, 40, H - 42);
      };
      await new Promise<void>((res) => {
        const start = performance.now();
        const timer = setInterval(() => {
          const t = Math.min(1, (performance.now() - start) / (seconds * 1000));
          draw(t);
          onProgress?.(Math.round(t * 100));
          if (t >= 1) {
            clearInterval(timer);
            res();
          }
        }, 1000 / 30);
      });
      rec.stop();
      const blob = await done;

      renderer.setPixelRatio(saved.ratio);
      renderer.setSize(saved.w, saved.h, false);
      camera.aspect = saved.aspect;
      camera.updateProjectionMatrix();
      camera.position.copy(saved.pos);
      controls.target.copy(saved.target);
      controls.enabled = true;
      controls.autoRotate = saved.auto;
      recording.current = false;
      applyEnv.current(stRef.current.weather, stRef.current.month, stRef.current.hour);
      return { blob, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
    },
  }));

  // Sahne bir kez kurulur.
  useEffect(() => {
    const el = box.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    // Tuval CSS boyutu kapsayıcıya bağlı kalır; aksi halde ızgara sütununu genişletir.
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const sky = skyTexture();
    scene.background = sky.t;
    scene.fog = new THREE.Fog("#dbe7f1", 170, 340);
    // Panel camında gökyüzü yansıması için ortam ışığı.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.5, 1500);
    camera.position.set(22, 20, 32);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 5;
    controls.maxDistance = 200;

    const hemi = new THREE.HemisphereLight("#ffffff", "#7a8a70", 0.7);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#fff4e0", 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.normalBias = 0.03;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);

    const content = new THREE.Group();
    const ground = new THREE.Group();
    scene.add(content, ground);
    panelTex.current = panelTexture();

    // Bulutlar: yavaşça sürüklenen yarı saydam kartlar.
    const clouds = new THREE.Group();
    const cloudTex = cloudTexture();
    const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    for (let i = 0; i < 32; i++) {
      const sp = new THREE.Sprite(cloudMat);
      const w = 42 + ((i * 37) % 46);
      sp.scale.set(w, w * 0.5, 1);
      sp.position.set(((i * 61) % 300) - 150, 52 + ((i * 13) % 26), ((i * 47) % 300) - 150);
      clouds.add(sp);
    }
    scene.add(clouds);

    // Yağmur: kameranın önünde düşen ince çizgiler.
    const DROPS = 1100;
    const rainPos = new Float32Array(DROPS * 6);
    for (let i = 0; i < DROPS; i++) {
      const x = (Math.random() - 0.5) * 110;
      const y = Math.random() * 70;
      const z = (Math.random() - 0.5) * 110;
      rainPos.set([x, y, z, x + 0.05, y - 1.1, z], i * 6);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#d3e0ec", transparent: true, opacity: 0.5 }));
    rain.frustumCulled = false;
    rain.visible = false;
    scene.add(rain);

    applyEnv.current = (w, m, h) => {
      const x = WX[w];
      const { dir, el: elev } = sunDirection(latRef.current, m, h);
      const above = elev > 0.02;
      // 0 gece, 1 gündüz; alacakaranlıkta yumuşak geçiş.
      const day = Math.max(0, Math.min(1, (elev + 0.08) / 0.3));
      const dusk = w === "bulutlu" || w === "yagmurlu" ? 0 : Math.max(0, 1 - Math.abs(elev - 0.08) / 0.2);
      sky.paint(mix(NIGHT[0], x.sky[0], day), mix(mix(NIGHT[1], x.sky[1], day), "#ffb27a", dusk * 0.55), mix(mix(NIGHT[2], x.sky[2], day), "#ff9a5c", dusk * 0.75));
      sun.visible = above;
      sun.position.copy(sun.target.position).addScaledVector(dir, 70);
      sun.intensity = above ? (0.9 + 2 * Math.min(1, Math.sin(elev) * 1.6)) * x.sun : 0;
      sun.color.set(elev < 0.3 ? "#ffd2a0" : "#fff4e0");
      hemi.intensity = x.hemi * (0.14 + 0.86 * day);
      scene.environmentIntensity = (above ? 0.45 : 0.14) * (0.5 + 0.5 * x.sun);
      (scene.fog as THREE.Fog).color.set(mix(NIGHT[2], x.fog, day));
      cloudMat.color.set(mix("#232c44", x.cloud, day));
      clouds.children.forEach((sp, i) => (sp.visible = i < x.clouds));
      rain.visible = x.rain;
    };

    let raf = 0;
    const loop = () => {
      // Video kaydında kamera ve çizim kayıt döngüsündedir.
      if (!recording.current) {
        for (const sp of clouds.children) {
          sp.position.x += 0.025;
          if (sp.position.x > 170) sp.position.x = -170;
        }
        if (rain.visible) {
          const a = rainGeo.getAttribute("position") as THREE.BufferAttribute;
          const arr = a.array as Float32Array;
          for (let i = 0; i < DROPS; i++) {
            let y = arr[i * 6 + 1] - 1.5;
            if (y < 0) y += 70;
            arr[i * 6 + 1] = y;
            arr[i * 6 + 4] = y - 1.1;
          }
          a.needsUpdate = true;
          rain.position.set(controls.target.x, 0, controls.target.z);
        }
        controls.update();
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);
    ctx.current = { renderer, scene, camera, controls, content, ground, sun };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      ctx.current = null;
    };
  }, []);

  // Güneş ve hava: seçilen ay, saat ve hava koşulu.
  useEffect(() => {
    applyEnv.current(weather, month, hour);
  }, [lat, month, hour, weather, frames]);

  // Otomatik tur (sunum ve video kaydı için).
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    c.controls.autoRotate = spin;
    c.controls.autoRotateSpeed = 1.1;
  }, [spin]);

  // Uydu zemini (merkez değişince).
  useEffect(() => {
    let cancel = false;
    const c = ctx.current;
    if (!c) return;
    satelliteGround(center, 240).then(({ tex, nw, se }) => {
      if (cancel || !ctx.current) return;
      c.ground.clear();
      const w = se.x - nw.x;
      const h = nw.n - se.n;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(nw.x + w / 2, 0, -(se.n + h / 2));
      plane.receiveShadow = true;
      c.ground.add(plane);
      // Uydu karosunun dışı: ufka kadar sisle eriyen düz zemin (görüntünün köşesi havada kalmasın).
      const base = new THREE.Mesh(new THREE.CircleGeometry(900, 48), new THREE.MeshStandardMaterial({ color: "#8d927f", roughness: 1 }));
      base.rotation.x = -Math.PI / 2;
      base.position.y = -0.08;
      c.ground.add(base);
      setImagery({ tex, nw, se });
    });
    return () => {
      cancel = true;
    };
  }, [center]);

  // Çatı ve paneller (her tasarım değişikliğinde).
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    c.content.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    c.content.clear();

    // Uydu görüntüsü geldiyse çatıya kaplanır; böylece gerçek çatı görünür.
    const roofMat = imagery ? new THREE.MeshStandardMaterial({ map: imagery.tex, roughness: 0.9, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: "#a65a3a", roughness: 0.85, side: THREE.DoubleSide });
    const flatMat = imagery ? roofMat : new THREE.MeshStandardMaterial({ color: "#b9b4ab", roughness: 0.95, side: THREE.DoubleSide });
    const wallMat = new THREE.MeshStandardMaterial({ color: "#efe9df", roughness: 0.9, side: THREE.DoubleSide });

    for (const fr of frames) {
      const pts = fr.face.points.map((p) => toXY(p, center));
      if (pts.length < 3) continue;
      const hs = pts.map((p) => heightAt(fr, p));
      // Çatı yüzeyi: yatay çokgen üçgenlenir, köşelere yükseklik verilir.
      const tris = THREE.ShapeUtils.triangulateShape(
        pts.map((p) => new THREE.Vector2(p.x, p.n)),
        []
      );
      const pos: number[] = [];
      const uv: number[] = [];
      for (const t of tris)
        for (const k of t) {
          pos.push(pts[k].x, hs[k], -pts[k].n);
          if (imagery) uv.push((pts[k].x - imagery.nw.x) / (imagery.se.x - imagery.nw.x), (pts[k].n - imagery.se.n) / (imagery.nw.n - imagery.se.n));
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      if (imagery) geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      const roof = new THREE.Mesh(geo, fr.face.pitch < 3 ? flatMat : roofMat);
      roof.castShadow = true;
      roof.receiveShadow = true;
      c.content.add(roof);
      // Bina kütlesi: yüzey kenarlarından zemine inen duvarlar.
      const wall: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const ha = hs[i];
        const hb = hs[(i + 1) % pts.length];
        wall.push(a.x, 0, -a.n, b.x, 0, -b.n, b.x, hb, -b.n, a.x, 0, -a.n, b.x, hb, -b.n, a.x, ha, -a.n);
      }
      const wg = new THREE.BufferGeometry();
      wg.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3));
      wg.computeVertexNormals();
      const walls = new THREE.Mesh(wg, wallMat);
      walls.castShadow = true;
      walls.receiveShadow = true;
      c.content.add(walls);
      // Saçak çizgisi.
      const edge = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts.map((p, i) => V(p.x, hs[i] + 0.01, p.n))),
        new THREE.LineBasicMaterial({ color: "#5b2f1e" })
      );
      c.content.add(edge);
    }

    // Engeller: gri kütle.
    const obstacleMat = new THREE.MeshStandardMaterial({ color: "#8a8f98", roughness: 0.9, side: THREE.DoubleSide });
    for (const o of obstacles ?? []) {
      const pts = o.points.map((p) => toXY(p, center));
      if (pts.length < 3) continue;
      const tris = THREE.ShapeUtils.triangulateShape(pts.map((p) => new THREE.Vector2(p.x, p.n)), []);
      const pos: number[] = [];
      for (const t of tris) for (const k of t) pos.push(pts[k].x, o.height, -pts[k].n);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        pos.push(a.x, 0, -a.n, b.x, 0, -b.n, b.x, o.height, -b.n, a.x, 0, -a.n, b.x, o.height, -b.n, a.x, o.height, -a.n);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, obstacleMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      c.content.add(mesh);
    }

    // Paneller: çerçeveli ince kutu; üst yüzde hücre dokusu. Düz çatıda sehpa ayakları.
    const frameMat = new THREE.MeshStandardMaterial({ color: "#c9d0d9", metalness: 0.7, roughness: 0.35 });
    const topMat = new THREE.MeshPhysicalMaterial({ map: panelTex.current, metalness: 0.35, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    const legMat = new THREE.MeshStandardMaterial({ color: "#9aa3ad", metalness: 0.5, roughness: 0.5 });
    const byId = new Map(frames.map((f) => [f.face.id, f]));
    for (const cell of cells) {
      const fr = byId.get(cell.faceId);
      if (!fr) continue;
      const pose = cellPose(fr, cell, layout);
      const geo = new THREE.BoxGeometry(pose.width, 0.035, pose.length);
      // Kutu yüzleri: +y üst yüz (dokulu), diğerleri çerçeve.
      const mesh = new THREE.Mesh(geo, [frameMat, frameMat, topMat, frameMat, frameMat, frameMat]);
      const ex = new THREE.Vector3(pose.eAxis.x, 0, -pose.eAxis.n).normalize();
      const ny = new THREE.Vector3(pose.normal.x, pose.normal.y, -pose.normal.n).normalize();
      const ez = new THREE.Vector3().crossVectors(ex, ny).normalize();
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, ny, ez));
      mesh.position.set(pose.center.x, pose.center.y, -pose.center.n);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      c.content.add(mesh);
      if (fr.face.pitch < 3) {
        // Arka ayaklar (sehpanın yüksek kenarı).
        const up = new THREE.Vector3(pose.upAxis.x, pose.upAxis.y, -pose.upAxis.n);
        const top = new THREE.Vector3(pose.center.x, pose.center.y, -pose.center.n).addScaledVector(up, pose.length / 2);
        const legH = top.y - fr.face.eaveHeight;
        for (const side of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, legH, 0.04), legMat);
          leg.position.copy(top).addScaledVector(ex, (side * pose.width) / 2.4);
          leg.position.y = fr.face.eaveHeight + legH / 2;
          leg.castShadow = true;
          c.content.add(leg);
        }
      }
    }

    // Kamerayı ilk tasarımda bina üzerine odakla.
    const b = new THREE.Box3().setFromObject(c.content);
    if (!b.isEmpty() && c.controls.target.length() < 0.01) {
      const mid = b.getCenter(new THREE.Vector3());
      const size = Math.max(12, b.getSize(new THREE.Vector3()).length());
      c.controls.target.copy(mid);
      c.camera.position.set(mid.x + size * 0.6, size * 0.7, mid.z + size * 0.9);
      c.sun.target.position.copy(mid);
    }
  }, [frames, cells, layout, center, imagery, obstacles]);

  // O anki enerji akışı.
  const pvM = sim?.monthlyPv[month] ?? 0;
  const loadM = sim?.monthlyLoad[month] ?? 0;
  const day = useMemo(
    () => (sim ? simulateDay({ month, monthlyPv: pvM, monthlyLoad: loadM, abone: sim.abone, lat, azimuth: sim.azimuth, batteryKwh: sim.batteryKwh, weather, pvCap: pvLimit(sim.dcKwp, sim.acKw) }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sim her çizimde yeni nesne; değerleri izlenir
    [month, weather, lat, pvM, loadM, sim?.abone, sim?.azimuth, sim?.batteryKwh, sim?.dcKwp, sim?.acKw]
  );
  const f = day ? flowAt(day, hour) : null;
  const dayPv = day ? day.reduce((a, d) => a + d.pv, 0) : 0;
  const kw = (v: number) => `${v.toLocaleString("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} kW`;
  const hasLoad = Boolean(sim?.monthlyLoad.some((v) => v > 0));
  const pct = (v: number) => (f && f.load > 0 ? (v / f.load) * 100 : 0);
  const hud = "rounded-lg bg-black/55 px-3 py-2 text-[12.5px] font-semibold text-white backdrop-blur";
  return (
    <div ref={wrap} className={`relative w-full overflow-hidden rounded-2xl border border-line bg-[#c4dcf0] ${sim ? "h-[580px] sm:h-[640px]" : "h-[420px] sm:h-[560px]"}`}>
      <div ref={box} className="h-full w-full" />
      <div className="absolute left-3 right-[92px] top-3 flex flex-col items-start gap-2 sm:right-[120px]">
        <div className={`flex flex-wrap items-center gap-2.5 ${hud}`}>
          <select value={month} onChange={(e) => setSim({ month: Number(e.target.value) })} aria-label="Ay" className="rounded bg-white/15 px-1.5 py-1 outline-none [&>option]:text-black">
            {AYLAR.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
          <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Durdur" : "Günü oynat"} className="rounded bg-white/15 p-1">{playing ? <Pause size={14} /> : <Play size={14} />}</button>
          <span className="font-mono-data">{String(Math.floor(hour)).padStart(2, "0")}:{String(Math.floor((hour % 1) * 4) * 15).padStart(2, "0")}</span>
          <input type="range" min={0} max={23.75} step={0.25} value={hour} onChange={(e) => setSim({ hour: Number(e.target.value) })} aria-label="Saat" className="w-24 accent-sun sm:w-44" />
        </div>
        <div className="flex gap-1 rounded-lg bg-black/55 p-1 backdrop-blur" role="group" aria-label="Hava durumu">
          {WEATHERS.map(({ key, ad }) => {
            const Icon = WX_ICON[key];
            return (
              <button key={key} onClick={() => setSim({ weather: key })} title={ad} aria-label={ad} aria-pressed={weather === key} className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold ${weather === key ? "bg-sun text-[#1a1205]" : "text-white hover:bg-white/15"}`}>
                <Icon size={15} />
                <span className="hidden sm:inline">{ad}</span>
              </button>
            );
          })}
        </div>
      </div>
      {f && sim && (
        <div className="absolute inset-x-3 bottom-3 rounded-xl bg-black/65 p-3 text-white backdrop-blur">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div><p className="text-[11px] text-white/70">Anlık üretim</p><p className="font-mono-data text-[19px] font-semibold text-[#ffd166]">{kw(f.pv)}</p></div>
            {hasLoad && <div><p className="text-[11px] text-white/70">Anlık tüketim</p><p className="font-mono-data text-[19px] font-semibold text-[#8fdcff]">{kw(f.load)}</p></div>}
            {hasLoad && <div><p className="text-[11px] text-white/70">{f.toGrid > 0.05 ? "Şebekeye veriliyor" : f.fromGrid > 0.05 ? "Şebekeden alınıyor" : "Şebeke"}</p><p className="font-mono-data text-[19px] font-semibold">{kw(f.toGrid > 0.05 ? f.toGrid : f.fromGrid)}</p></div>}
            {sim.batteryKwh > 0 ? (
              <div><p className="text-[11px] text-white/70">{f.toBattery > 0.05 ? "Batarya şarj oluyor" : f.fromBattery > 0.05 ? "Bataryadan kullanılıyor" : "Batarya"}</p><p className="font-mono-data text-[19px] font-semibold text-[#7ff0bd]">%{Math.round(f.soc * 100)}</p></div>
            ) : (
              <div><p className="text-[11px] text-white/70">Bu havada günlük üretim</p><p className="font-mono-data text-[19px] font-semibold">{Math.round(dayPv).toLocaleString("tr-TR")} kWh</p></div>
            )}
          </div>
          {hasLoad && f.load > 0 && (
            <div className="mt-2">
              <div className="flex h-2 overflow-hidden rounded-full bg-white/15">
                <div style={{ width: `${pct(f.direct)}%`, background: "#ffb547" }} />
                <div style={{ width: `${pct(f.fromBattery)}%`, background: "#7ff0bd" }} />
                <div style={{ width: `${pct(f.fromGrid)}%`, background: "#9aa6b8" }} />
              </div>
              <p className="mt-1 text-[11px] text-white/80">Tüketimin %{Math.round(pct(f.direct))}&apos;i güneşten{f.fromBattery > 0.05 ? `, %${Math.round(pct(f.fromBattery))}'i bataryadan` : ""}{f.fromGrid > 0.05 ? `, %${Math.round(pct(f.fromGrid))}'i şebekeden` : ""} karşılanıyor.</p>
            </div>
          )}
        </div>
      )}
      <div className="absolute right-3 top-3 flex gap-2">
        <button onClick={() => setSpin((v) => !v)} className={`inline-flex items-center gap-1.5 ${hud} ${spin ? "ring-2 ring-sun" : ""}`}><Orbit size={14} /> <span className="hidden sm:inline">Tur</span></button>
        <button onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen())} className={`inline-flex items-center gap-1.5 ${hud}`} aria-label="Tam ekran"><Maximize2 size={14} /></button>
      </div>
    </div>
  );
});

export default Roof3D;
