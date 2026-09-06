"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Module-level cache so each unique URL is only rendered once per session
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function renderThumbnail(url: string): Promise<string> {
  if (cache.has(url)) return Promise.resolve(cache.get(url)!);
  if (pending.has(url)) return pending.get(url)!;

  const p = new Promise<string>((resolve) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 200);
    camera.position.set(0.6, 0.9, 2.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(480, 480);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 7, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8888ff, 0.3);
    rim.position.set(-4, -2, -4);
    scene.add(rim);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Exclude floor/ground-plane meshes (extremely flat: smallest dim < 4% of largest)
        // so a backdrop plane doesn't dominate the bounding box and shrink the instrument.
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
        else box.setFromObject(model);

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        // Angle the model for a nice 3/4 view
        model.rotation.y = Math.PI / 5;
        model.rotation.x = Math.PI / 14;
        scene.add(model);

        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL("image/png");
        renderer.dispose();
        cache.set(url, dataUrl);
        pending.delete(url);
        resolve(dataUrl);
      },
      undefined,
      () => {
        // Fallback dark thumbnail on error
        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL("image/png");
        renderer.dispose();
        cache.set(url, dataUrl);
        pending.delete(url);
        resolve(dataUrl);
      },
    );
  });

  pending.set(url, p);
  return p;
}

export default function Model3dTile({ url, alt }: { readonly url: string; readonly alt: string }) {
  const [src, setSrc] = useState<string | null>(cache.get(url) ?? null);

  useEffect(() => {
    if (src) return;
    let cancelled = false;
    renderThumbnail(url).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl);
    });
    return () => { cancelled = true; };
  }, [url, src]);

  if (!src) {
    return (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg,#0e0e0e,#161625)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 6, color: "#444",
        }}
      >
        <span style={{ fontSize: 28 }}>⟳</span>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>3D</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
