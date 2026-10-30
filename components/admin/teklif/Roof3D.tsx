"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cellPose, heightAt, toXY, type FaceFrame, type LatLon, type LayoutSettings, type PanelCell } from "@/lib/teklif/geometry";
import { ESRI, getImagery, tileUrl } from "@/lib/teklif/imagery";

// 3B görünüm: uydu görüntüsü zemin, çizilen çatı yüzeyleri (bina kütlesiyle) ve paneller.
// Sahne koordinatı: X doğu, Y yukarı, Z güney (Z = -kuzey). Güneş öğle saatinde güneyden gelir;
// gölgeler açık. Teklif PDF'i için perspektif ve üstten görüntü alınabilir.

export type Roof3DHandle = { snapshot: (view: "perspective" | "top") => string | null };

type Props = { center: LatLon; frames: FaceFrame[]; cells: PanelCell[]; layout: LayoutSettings; lat: number };

const V = (x: number, y: number, n: number) => new THREE.Vector3(x, y, -n);

// Panel yüzeyi: hücre çizgili koyu mavi doku (bir kez üretilir).
function panelTexture() {
  const c = document.createElement("canvas");
  c.width = 132;
  c.height = 264;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d1f3c";
  g.fillRect(0, 0, c.width, c.height);
  const cols = 6;
  const rows = 12;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const w = c.width / cols;
      const h = c.height / rows;
      const grad = g.createLinearGradient(i * w, j * h, (i + 1) * w, (j + 1) * h);
      grad.addColorStop(0, "#1b3a6b");
      grad.addColorStop(1, "#102446");
      g.fillStyle = grad;
      g.fillRect(i * w + 1, j * h + 1, w - 2, h - 2);
    }
  g.strokeStyle = "#c9d3df";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, c.width - 3, c.height - 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
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

const Roof3D = forwardRef<Roof3DHandle, Props>(function Roof3D({ center, frames, cells, layout, lat }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; content: THREE.Group; ground: THREE.Group; sun: THREE.DirectionalLight } | null>(null);
  const panelTex = useRef<THREE.Texture | null>(null);

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
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dfe8f2");
    scene.fog = new THREE.Fog("#dfe8f2", 160, 320);
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.5, 1000);
    camera.position.set(22, 20, 32);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 5;
    controls.maxDistance = 200;

    scene.add(new THREE.HemisphereLight("#ffffff", "#7a8a70", 0.9));
    const sun = new THREE.DirectionalLight("#fff6e5", 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
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
      controls.update();
      renderer.render(scene, camera);
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

  // Güneş: öğle vakti, enleme göre yükseklik (ekinoks).
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    const elev = ((90 - Math.abs(lat)) * Math.PI) / 180;
    c.sun.position.set(-8, Math.sin(elev) * 60, Math.cos(elev) * 60);
  }, [lat]);

  // Uydu zemini (merkez değişince).
  useEffect(() => {
    let cancel = false;
    const c = ctx.current;
    if (!c) return;
    satelliteGround(center, 140).then(({ tex, nw, se }) => {
      if (cancel || !ctx.current) return;
      c.ground.clear();
      const w = se.x - nw.x;
      const h = nw.n - se.n;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(nw.x + w / 2, 0, -(se.n + h / 2));
      plane.receiveShadow = true;
      c.ground.add(plane);
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

    const roofMat = new THREE.MeshStandardMaterial({ color: "#a65a3a", roughness: 0.85, side: THREE.DoubleSide });
    const flatMat = new THREE.MeshStandardMaterial({ color: "#b9b4ab", roughness: 0.95, side: THREE.DoubleSide });
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
      for (const t of tris) for (const k of t) pos.push(pts[k].x, hs[k], -pts[k].n);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
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

    // Paneller: çerçeveli ince kutu; üst yüzde hücre dokusu. Düz çatıda sehpa ayakları.
    const frameMat = new THREE.MeshStandardMaterial({ color: "#c4ccd6", metalness: 0.6, roughness: 0.35 });
    const topMat = new THREE.MeshStandardMaterial({ map: panelTex.current, metalness: 0.3, roughness: 0.25 });
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
  }, [frames, cells, layout, center]);

  return <div ref={box} className="h-[560px] w-full overflow-hidden rounded-2xl border border-line" />;
});

export default Roof3D;
