import * as THREE from 'three';
import type { TwinEntityDef, TwinEntityState } from '../../data/types';
import type { BurstSystem } from '../fx/Burst';

export interface TwinLiveEntry {
  name: string;
  radius: number;
  getPos: (out: THREE.Vector3) => THREE.Vector3;
  getState: () => TwinEntityState;
  /** 0~1 进度（机械工况用，可选） */
  getProgress?: () => number;
}

/** 孪生实体管理：注册/拾取/选中环/实时状态（右侧面板数据源） */
export class TwinManager {
  private live = new Map<string, TwinLiveEntry>();
  private defs = new Map<string, TwinEntityDef>();
  pickRoots: THREE.Object3D[] = [];
  burst: BurstSystem | null = null;
  private ring: THREE.Mesh;
  selectionId: string | null = null;
  private tmp = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    const ringGeo = new THREE.RingGeometry(0.92, 1.08, 40);
    this.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x5affa0, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false,
    }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    scene.add(this.ring);
  }

  registerDef(def: TwinEntityDef): void {
    this.defs.set(def.id, def);
  }

  register(id: string, entry: TwinLiveEntry): void {
    this.live.set(id, entry);
  }

  registerStatic(id: string, name: string, focus: [number, number, number], radius: number, state: TwinEntityState): void {
    this.register(id, {
      name,
      radius,
      getPos: (out) => out.set(focus[0], focus[1], focus[2]),
      getState: () => state,
    });
  }

  markPickable(root: THREE.Object3D, id: string): void {
    root.userData.entityId = id;
    root.traverse((o) => {
      o.userData.entityId = id;
    });
    this.pickRoots.push(root);
  }

  markWorkerPickable(mesh: THREE.InstancedMesh, workerSystem: unknown): void {
    mesh.userData.workerSystem = workerSystem;
    this.pickRoots.push(mesh);
  }

  resolveWorkerId(instanceId: number): string {
    return `worker-${Math.floor(instanceId / 2)}`;
  }

  select(id: string | null): void {
    this.selectionId = id;
    this.ring.visible = id !== null;
  }

  has(id: string): boolean {
    return this.live.has(id);
  }

  getName(id: string): string {
    return this.live.get(id)?.name ?? this.defs.get(id)?.name ?? id;
  }

  getDef(id: string): TwinEntityDef | undefined {
    return this.defs.get(id);
  }

  getPos(id: string, out: THREE.Vector3): THREE.Vector3 | null {
    const e = this.live.get(id);
    if (!e) return null;
    return e.getPos(out);
  }

  getState(id: string): TwinEntityState | null {
    return this.live.get(id)?.getState() ?? null;
  }

  getProgress(id: string): number | null {
    const e = this.live.get(id);
    if (!e?.getProgress) return null;
    return e.getProgress();
  }

  spawnBurst(x: number, y: number, z: number, n: number, spread: number): void {
    this.burst?.spawn(x, y, z, n, spread);
  }

  /** 选中环跟随 + 脉冲（每帧） */
  updateRing(elapsed: number): void {
    if (!this.ring.visible || !this.selectionId) return;
    const e = this.live.get(this.selectionId);
    if (!e) return;
    e.getPos(this.tmp);
    this.ring.position.set(this.tmp.x, this.tmp.y + 0.06, this.tmp.z);
    const pulse = 1 + 0.08 * Math.sin(elapsed * 4.5);
    this.ring.scale.setScalar(e.radius * pulse);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.65 + 0.25 * Math.sin(elapsed * 4.5);
  }
}
