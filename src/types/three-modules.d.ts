// three.js 0.185 ships no .d.ts files. @types/three covers the main "three"
// module but its GLTFLoader/OrbitControls declarations pull in DRACOLoader /
// KTX2Loader sub-dependencies that don't resolve through a simple re-export.
// These inline declarations cover exactly what the project needs.

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  import type * as THREE from "three";

  interface GLTF {
    scene: THREE.Group;
    scenes: THREE.Group[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset: {
      copyright?: string;
      generator?: string;
      version?: string;
      minVersion?: string;
    };
    userData: Record<string, unknown>;
  }

  class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (err: unknown) => void,
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF>;
  }

  export { GLTFLoader, GLTF };
}

declare module "three/examples/jsm/controls/OrbitControls.js" {
  import type * as THREE from "three";

  class OrbitControls {
    constructor(camera: THREE.Camera, domElement: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    enablePan: boolean;
    enableRotate: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    zoomSpeed: number;
    minDistance: number;
    maxDistance: number;
    target: THREE.Vector3;
    update(): void;
    dispose(): void;
  }

  export { OrbitControls };
}
