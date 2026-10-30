"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Maximize2, Orbit } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cellPose, heightAt, toXY, type FaceFrame, type LatLon, type LayoutSettings, type Obstacle, type PanelCell } from "@/lib/teklif/geometry";
import { ESRI, getImagery, tileUrl } from "@/lib/teklif/imagery";

// 3B görünüm: uydu görüntüsü zemin, çizilen çatı yüzeyleri (bina kütlesiyle) ve paneller.
// Sahne koordinatı: X doğu, Y yukarı, Z güney (Z = -kuzey). Uydu görüntüsü çatıya da kaplanır;
// güneş seçilen ay ve saatte gerçek konumundadır, gölgeler buna göre düşer.
// Teklif PDF'i için perspektif ve üstten görüntü alınabilir.

export type VideoOptions = { title: string; lines: string[]; footer: string; seconds?: number; onProgress?: (pct: number) => void };
export type Roof3DHandle = { snapshot: (view: "perspective" | "top") => string | null; record: (o: VideoOptions) => Promise<{ blob: Blob; ext: string } | null> };

type Props = { center: LatLon; frames: FaceFrame[]; cells: PanelCell[]; layout: LayoutSettings; lat: number; obstacles?: Obstacle[] };

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
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#6fa3d8");
  grad.addColorStop(0.65, "#c4dcf0");
  grad.addColorStop(1, "#eef3f7");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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

const Roof3D = forwardRef<Roof3DHandle, Props>(function Roof3D({ center, frames, cells, layout, lat, obstacles }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; content: THREE.Group; ground: THREE.Group; sun: THREE.DirectionalLight } | null>(null);
  const panelTex = useRef<THREE.Texture | null>(null);
  const recording = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [imagery, setImagery] = useState<{ tex: THREE.Texture; nw: { x: number; n: number }; se: { x: number; n: number } } | null>(null);
  const [month, setMonth] = useState(5);
  const [hour, setHour] = useState(13);
  const [spin, setSpin] = useState(false);

  useImperativeHandle(ref, () => ({
    snapshot(view) {
      const c = ctx.current;
      if (!c) return null;
      const { camera, controls, renderer, scene } = c;
      const saved = { pos: camera.position.clone(), target: controls.target.clone() };
      const box3 = new THREE.Box3().setFromObject(c.content);
      const mid = box3.isEmpty() ? new THREE.Vector3() : box3.getCenter(new THREE.Vector3());
      const size = box3.isEmpty() ? 20 : Math.max(10, box3.getSize(new THREE.Vector3()).length());
      if (view === "top") camera.position.set(mid.x, size * 1.6, mid.z + 0.01);
      else camera.position.set(mid.x + size * 0.55, size * 0.6, mid.z + size * 0.85);
      camera.lookAt(mid);
      controls.target.copy(mid);
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL("image/jpeg", 0.88);
      camera.position.copy(saved.pos);
      controls.target.copy(saved.target);
      controls.update();
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
      setHour((h) => h + 0.0001);
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
    scene.background = skyTexture();
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

    scene.add(new THREE.HemisphereLight("#ffffff", "#7a8a70", 0.7));
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

    let raf = 0;
    const loop = () => {
      // Video kaydında kamera ve çizim kayıt döngüsündedir.
      if (!recording.current) {
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

  // Güneş: seçilen ay ve saatteki gerçek konumu.
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    const { dir, el } = sunDirection(lat, month, hour);
    const above = el > 0.02;
    c.sun.visible = above;
    c.sun.position.copy(c.sun.target.position).addScaledVector(dir, 70);
    c.sun.intensity = above ? 0.9 + 2 * Math.min(1, Math.sin(el) * 1.6) : 0;
    c.sun.color.set(el < 0.3 ? "#ffd2a0" : "#fff4e0");
    c.scene.environmentIntensity = above ? 0.45 : 0.18;
  }, [lat, month, hour, frames]);

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

  const hud = "rounded-lg bg-black/55 px-3 py-2 text-[12.5px] font-semibold text-white backdrop-blur";
  return (
    <div ref={wrap} className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-line bg-[#c4dcf0] sm:h-[560px]">
      <div ref={box} className="h-full w-full" />
      <div className={`absolute left-3 top-3 flex flex-wrap items-center gap-3 ${hud}`}>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Ay" className="rounded bg-white/15 px-1.5 py-1 outline-none [&>option]:text-black">
          {AYLAR.map((a, i) => <option key={a} value={i}>{a}</option>)}
        </select>
        <label className="flex items-center gap-2">
          <span className="font-mono-data">{String(Math.floor(hour)).padStart(2, "0")}:{hour % 1 ? "30" : "00"}</span>
          <input type="range" min={5} max={20} step={0.5} value={hour} onChange={(e) => setHour(Number(e.target.value))} aria-label="Saat" className="w-20 accent-sun sm:w-36" />
        </label>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        <button onClick={() => setSpin((v) => !v)} className={`inline-flex items-center gap-1.5 ${hud} ${spin ? "ring-2 ring-sun" : ""}`}><Orbit size={14} /> <span className="hidden sm:inline">Tur</span></button>
        <button onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen())} className={`inline-flex items-center gap-1.5 ${hud}`} aria-label="Tam ekran"><Maximize2 size={14} /></button>
      </div>
    </div>
  );
});

export default Roof3D;
