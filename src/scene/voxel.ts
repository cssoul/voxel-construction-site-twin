import * as THREE from 'three';

/** 共享单位几何体 */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cone4: new THREE.ConeGeometry(0.5, 1, 4),
  cable: new THREE.CylinderGeometry(0.022, 0.022, 1, 5, 1, true),
};
G.cone4.rotateY(Math.PI / 4);
G.cone4.translate(0, 0.5, 0);
G.cable.translate(0, -0.5, 0);

/**
 * 静态体素批处理池：同材质的小构件先收集变换，最后合并为一个 InstancedMesh。
 */
export class InstPool {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  cast: boolean;
  receive: boolean;
  items: number[][] = [];

  constructor(geo: THREE.BufferGeometry, mat: THREE.Material, opts: { shadow?: boolean; receive?: boolean } = {}) {
    this.geo = geo;
    this.mat = mat;
    this.cast = opts.shadow !== false;
    this.receive = opts.receive !== false;
  }

  add(
    x: number, y: number, z: number,
    sx: number, sy: number, sz: number,
    ry = 0, rx = 0, rz = 0, color: number | null = null,
  ): void {
    this.items.push([x, y, z, sx, sy, sz, ry, rx, rz, color as number]);
  }

  build(name: string, scene: THREE.Scene): THREE.InstancedMesh | null {
    const n = this.items.length;
    if (!n) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, n);
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    const q = new THREE.Quaternion();
    const qy = new THREE.Quaternion();
    const qx = new THREE.Quaternion();
    const qz = new THREE.Quaternion();
    const AX = new THREE.Vector3(1, 0, 0);
    const AY = new THREE.Vector3(0, 1, 0);
    const AZ = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < n; i++) {
      const it = this.items[i];
      d.position.set(it[0], it[1], it[2]);
      d.scale.set(it[3], it[4], it[5]);
      qy.setFromAxisAngle(AY, it[6]);
      qx.setFromAxisAngle(AX, it[7]);
      qz.setFromAxisAngle(AZ, it[8]);
      q.copy(qy).multiply(qx).multiply(qz);
      d.quaternion.copy(q);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      if (it[9] != null) im.setColorAt(i, c.set(it[9]));
    }
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = this.cast;
    im.receiveShadow = this.receive;
    im.frustumCulled = false;
    im.name = name;
    scene.add(im);
    return im;
  }
}

/** 动态小方块（机械/车辆等少量对象用普通 Mesh） */
export function bx(
  mat: THREE.Material, w: number, h: number, d: number,
  x: number, y: number, z: number, parent?: THREE.Object3D | null,
): THREE.Mesh {
  const m = new THREE.Mesh(G.box, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  (parent ?? null)?.add(m);
  return m;
}

export function bxr(
  mat: THREE.Material, w: number, h: number, d: number,
  x: number, y: number, z: number, parent?: THREE.Object3D | null,
  rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const m = bx(mat, w, h, d, x, y, z, parent);
  m.rotation.set(rx, ry, rz);
  return m;
}

export function cy(
  mat: THREE.Material, r: number, len: number,
  x: number, y: number, z: number, parent?: THREE.Object3D | null, axis: 'x' | 'y' | 'z' = 'y',
): THREE.Mesh {
  const m = new THREE.Mesh(G.cyl, mat);
  m.scale.set(r * 2, len, r * 2);
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = true;
  m.receiveShadow = true;
  (parent ?? null)?.add(m);
  return m;
}

export function wheel(r: number, w: number, x: number, y: number, z: number, parent: THREE.Object3D): THREE.Group {
  const h = new THREE.Group();
  h.position.set(x, y, z);
  parent.add(h);
  cy(WHEEL_MATS.rubber, r, w, 0, 0, 0, h, 'z');
  cy(WHEEL_MATS.steel, r * 0.45, w + 0.02, 0, 0, 0, h, 'z');
  return h;
}

// wheel 需要材质；为避免循环依赖，运行时由 materials 模块注入
import type { Materials } from './materials';
const WHEEL_MATS: { rubber: THREE.Material; steel: THREE.Material } = {
  rubber: new THREE.MeshBasicMaterial(),
  steel: new THREE.MeshBasicMaterial(),
};
export function bindWheelMats(m: Materials): void {
  WHEEL_MATS.rubber = m.rubber;
  WHEEL_MATS.steel = m.steel;
}
