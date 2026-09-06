"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ModelViewer({ url, className, style }: { readonly url: string; readonly className?: string; readonly style?: CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.001, 1000);
    // Start far away — will zoom in once model loads
    camera.position.set(0.9, 1.6, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, 2, -4);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.06;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 1.5;
    controls.enablePan       = false;
    controls.enableZoom      = true;
    controls.enableRotate    = true;
    controls.minDistance     = 0.4;
    controls.maxDistance     = 12;
    controls.zoomSpeed       = 1.2;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    // Zoom-in state: lerp from start pos to target pos after model loads
    const zoomFrom = new THREE.Vector3(0.9, 1.6, 7);
    const zoomTo   = new THREE.Vector3(0.5, 0.8, 3.8);
    let zoomT = 0;          // 0 = not started, -1 = done
    let userHasInteracted = false;

    // Size the renderer to the container. The container may have zero dimensions
    // on first paint (e.g. mounted inside the dome overlay before layout settles),
    // so we retry with rAF until we get non-zero values.
    const sizeRenderer = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return false;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      return true;
    };
    const trySize = () => { if (!sizeRenderer()) requestAnimationFrame(trySize); };
    trySize();

    // Also respond to the overlay finishing its CSS size transition
    const ro = new ResizeObserver(() => sizeRenderer());
    ro.observe(container);

    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const model = gltf.scene;

      // Exclude floor/ground-plane meshes: extremely flat ones (smallest dimension
      // < 4% of largest) are almost always backdrop planes and would dominate the
      // bounding box, shrinking the actual instrument down to almost nothing.
      const relevant: THREE.Object3D[] = [];
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const cb = new THREE.Box3().setFromObject(child);
        const cs = cb.getSize(new THREE.Vector3());
        const lo = Math.min(cs.x, cs.y, cs.z);
        const hi = Math.max(cs.x, cs.y, cs.z);
        if (hi > 0 && lo / hi >= 0.04) relevant.push(child);
      });

      const box = new THREE.Box3();
      if (relevant.length > 0) relevant.forEach(m => box.expandByObject(m));
      else box.setFromObject(model); // fall back if every mesh is flat

      const size   = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = 2 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      scene.add(model);
      controls.target.set(0, 0, 0);
      controls.update();
      // Kick off zoom-in
      zoomT = 0.001;
    });

    let animId: number;
    const ZOOM_DURATION = 1.6; // seconds
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt  = (now - lastTime) / 1000;
      lastTime  = now;

      // Smooth zoom-in until user grabs the model
      if (zoomT > 0 && zoomT < 1 && !userHasInteracted) {
        zoomT = Math.min(1, zoomT + dt / ZOOM_DURATION);
        // Ease-out cubic: decelerates as it arrives
        const ease = 1 - Math.pow(1 - zoomT, 3);
        camera.position.lerpVectors(zoomFrom, zoomTo, ease);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onUserInteract = () => {
      userHasInteracted = true;
      zoomT = -1; // stop zoom animation
      controls.autoRotate = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { controls.autoRotate = true; }, 3000);
    };
    renderer.domElement.addEventListener("pointerdown", onUserInteract);
    renderer.domElement.addEventListener("wheel", onUserInteract);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (idleTimer) clearTimeout(idleTimer);
      renderer.domElement.removeEventListener("pointerdown", onUserInteract);
      renderer.domElement.removeEventListener("wheel", onUserInteract);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) renderer.domElement.remove();
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 320, height: "100%", width: "100%", cursor: "grab", pointerEvents: "auto", ...style }}
      title="Drag to rotate · scroll to zoom"
    />
  );
}
