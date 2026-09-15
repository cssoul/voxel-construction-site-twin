import * as THREE from 'three';
import { G } from '../voxel';
import { srand, TAU } from '../random';
import { Follower } from '../paths';
import type { SceneCtx } from '../types';

interface JobStyle {
  body: number;
  helm: number;
  label: string;
}

const JOBS: Record<string, JobStyle> = {
  labor: { body: 0xd97a2a, helm: 0xf2c231, label: '普工' },
  rebar: { body: 0x3f6bb0, helm: 0xf2c231, label: '钢筋工' },
  elec: { body: 0xdadce0, helm: 0x3a6fd8, label: '电工' },
  signal: { body: 0xd8402f, helm: 0xe07818, label: '塔吊指挥' },
  guard: { body: 0x2e3d55, helm: 0xd8402f, label: '安保' },
};

type WorkMode = 'walk' | 'bend' | 'hammer' | 'signal' | 'idle';

const MODE_LABEL: Record<WorkMode, string> = {
  walk: '行走巡查',
  bend: '弯腰作业',
  hammer: '绑扎/锤击',
  signal: '指挥信号',
  idle: '站立值守',
};

export interface WorkerGroupDef {
  job: string;
  mode: WorkMode;
  pos?: [number, number];
  y?: number;
  face?: number;
  speed?: number;
  path?: Array<[number, number]> | null;
  groupName: string;
  groupId: string;
}

interface Worker extends WorkerGroupDef {
  ph: number;
  fol: Follower | null;
  x: number;
  z: number;
}

export class WorkerSystem {
  workers: Worker[] = [];
  meshes: { legs: THREE.InstancedMesh; arms: THREE.InstancedMesh; body: THREE.InstancedMesh; head: THREE.InstancedMesh; helm: THREE.InstancedMesh } | null = null;
  private q = new THREE.Quaternion();
  private qy = new THREE.Quaternion();
  private qx = new THREE.Quaternion();
  private qz = new THREE.Quaternion();
  private m = new THREE.Matrix4();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private c = new THREE.Vector3();
  private AX = new THREE.Vector3(1, 0, 0);
  private AY = new THREE.Vector3(0, 1, 0);
  private AZ = new THREE.Vector3(0, 0, 1);
  private t1 = { x: 0, z: 0 };
  private t2 = { x: 0, z: 0 };
  private t3 = { x: 0, z: 0 };

  add(def: WorkerGroupDef): void {
    const w: Worker = {
      ...def,
      ph: srand() * 9,
      fol: def.path ? new Follower(def.path.map((p) => ({ x: p[0], z: p[1] })), srand() * 50, 2) : null,
      x: def.pos ? def.pos[0] : 0,
      z: def.pos ? def.pos[1] : 0,
    };
    this.workers.push(w);
  }

  buildMeshes(scene: THREE.Scene): void {
    const N = this.workers.length;
    const whiteBody = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
    const whiteHelm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const legs = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.9 }), N * 2);
    const arms = new THREE.InstancedMesh(G.box, whiteBody, N * 2);
    const body = new THREE.InstancedMesh(G.box, whiteBody, N);
    const head = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({ color: 0xdfb08c, roughness: 0.85 }), N);
    const helm = new THREE.InstancedMesh(G.box, whiteHelm, N);
    [legs, arms, body, head, helm].forEach((m) => {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      scene.add(m);
    });
    const c = new THREE.Color();
    this.workers.forEach((w, i) => {
      const j = JOBS[w.job] ?? JOBS.labor;
      arms.setColorAt(i * 2, c.set(j.body));
      arms.setColorAt(i * 2 + 1, c.set(j.body));
      body.setColorAt(i, c.set(j.body));
      helm.setColorAt(i, c.set(j.helm));
    });
    if (arms.instanceColor) arms.instanceColor.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (helm.instanceColor) helm.instanceColor.needsUpdate = true;
    this.meshes = { legs, arms, body, head, helm };
  }

  get count(): number {
    return this.workers.length;
  }

  infoAt(i: number): { label: string; job: string; group: string; groupId: string } {
    const w = this.workers[i];
    return { label: MODE_LABEL[w.mode], job: JOBS[w.job]?.label ?? '工人', group: w.groupName, groupId: w.groupId };
  }

  update(dt: number, t: number, speedMult: number): void {
    const MESH = this.meshes;
    if (!MESH) return;
    for (let i = 0; i < this.workers.length; i++) {
      const w = this.workers[i];
      let x = w.x;
      let z = w.z;
      let yaw = w.face ?? 0;
      let bob = 0;
      let legA = 0;
      let armA = 0;
      let bend = 0;
      let armRx = 0;
      let armRz = 0;
      let idleSway = 0;
      if (w.mode === 'walk' && w.fol) {
        w.fol.advance((w.speed ?? 0.5) * speedMult * dt);
        const p = w.fol.posAt(w.fol.s, this.t1);
        const h1 = w.fol.posAt(w.fol.s - 0.4, this.t2);
        const h2 = w.fol.posAt(w.fol.s + 0.4, this.t3);
        x = p.x;
        z = p.z;
        yaw = Math.atan2(-(h2.z - h1.z), h2.x - h1.x);
        w.ph += (w.speed ?? 0.5) * speedMult * dt * 5.2;
        legA = Math.sin(w.ph) * 0.72;
        armA = -Math.sin(w.ph) * 0.55;
        bob = Math.abs(Math.sin(w.ph)) * 0.035;
        w.x = x;
        w.z = z;
      } else {
        const t2 = t * 1.3 + w.ph;
        if (w.mode === 'bend') {
          bend = 0.5 * (0.5 + 0.5 * Math.sin(t2 * 1.3));
          armRx = -1.05 - bend * 0.6;
        } else if (w.mode === 'hammer') {
          bend = 0.22;
          armRx = -2.2 + 1.5 * Math.max(0, Math.sin(t2 * 2.8));
          idleSway = 0.03 * Math.sin(t2);
        } else if (w.mode === 'signal') {
          armRx = -2.5;
          armRz = Math.sin(t2 * 5.5) * 0.5;
        } else {
          idleSway = 0.045 * Math.sin(t2 * 0.9);
        }
      }
      const y = (w.y ?? 0) + bob;
      this.limb(MESH.legs, i * 2, x, y, z, yaw, 0, 0.32, 0.09, legA, 0, 0.32, 0.09, 0.09);
      this.limb(MESH.legs, i * 2 + 1, x, y, z, yaw, 0, 0.32, -0.09, -legA, 0, 0.32, 0.09, 0.09);
      this.limb(MESH.arms, i * 2, x, y, z, yaw, 0, 0.58, 0.16, armA, 0, 0.26, 0.07, 0.07);
      this.limb(MESH.arms, i * 2 + 1, x, y, z, yaw, 0, 0.58, -0.16, w.mode === 'walk' ? -armA : armRx, armRz, 0.26, 0.07, 0.07);
      this.limb(MESH.body, i, x, y, z, yaw, 0, 0.3, 0, bend, idleSway, 0.32, 0.26, 0.15);
      this.limb(MESH.head, i, x, y, z, yaw, 0, 0.72, 0, 0, 0, 0.14, 0.13, 0.13);
      this.limb(MESH.helm, i, x, y, z, yaw, 0, 0.815, 0, 0, 0, 0.075, 0.175, 0.175);
    }
    MESH.legs.instanceMatrix.needsUpdate = true;
    MESH.arms.instanceMatrix.needsUpdate = true;
    MESH.body.instanceMatrix.needsUpdate = true;
    MESH.head.instanceMatrix.needsUpdate = true;
    MESH.helm.instanceMatrix.needsUpdate = true;
  }

  private limb(
    mesh: THREE.InstancedMesh, idx: number,
    x: number, y: number, z: number, yaw: number,
    jx: number, jy: number, jz: number,
    rx: number, rz: number, len: number, sx: number, sz: number,
  ): void {
    this.qy.setFromAxisAngle(this.AY, yaw);
    this.qx.setFromAxisAngle(this.AX, rx);
    this.qz.setFromAxisAngle(this.AZ, rz);
    this.q.copy(this.qy).multiply(this.qx).multiply(this.qz);
    this.p.set(jx, jy, jz).applyQuaternion(this.qy);
    this.p.x += x;
    this.p.y += y;
    this.p.z += z;
    this.c.set(0, -len / 2, 0).applyQuaternion(this.q);
    this.p.add(this.c);
    this.s.set(sx, len, sz);
    this.m.compose(this.p, this.q, this.s);
    mesh.setMatrixAt(idx, this.m);
  }
}

export function buildWorkers(ctx: SceneCtx): WorkerSystem {
  const sys = new WorkerSystem();
  const pitY = ctx.cfg.ground - ctx.cfg.pit.depth + 0.02;
  const GY = ctx.cfg.ground;
  const slabTopY = (k: number): number => GY + 0.5 + (k - 1) * ctx.cfg.bld.fh + 0.22;

  const add = (job: string, mode: WorkMode, groupName: string, groupId: string, o: {
    pos?: [number, number]; y?: number; face?: number; speed?: number; path?: Array<[number, number]> | null;
  } = {}): void => {
    sys.add({ job, mode, groupName, groupId, pos: o.pos, y: o.y, face: o.face, speed: o.speed, path: o.path ?? null });
  };

  add('labor', 'bend', '基坑班组', 'wgroup-pit', { pos: [-18.2, -1.0], y: pitY });
  add('rebar', 'hammer', '基坑班组', 'wgroup-pit', { pos: [-20.3, 3.8], y: pitY });
  add('rebar', 'bend', '基坑班组', 'wgroup-pit', { pos: [-17.2, 4.9], y: pitY });
  add('labor', 'walk', '基坑班组', 'wgroup-pit', { speed: 0.5, path: [[-15.2, 8.2], [-22.2, 8.2], [-22.2, -3.6], [-15.2, -3.6]] });
  add('labor', 'idle', '基坑班组', 'wgroup-pit', { pos: [-16.7, 8.0], face: Math.PI });
  add('labor', 'bend', '主体班组', 'wgroup-main', { pos: [4.6, -3.4], y: slabTopY(10) });
  add('rebar', 'hammer', '主体班组', 'wgroup-main', { pos: [7.0, 0.3], y: slabTopY(10) });
  add('rebar', 'bend', '主体班组', 'wgroup-main', { pos: [2.6, -1.0], y: slabTopY(9) });
  add('labor', 'hammer', '主体班组', 'wgroup-main', { pos: [6.2, -3.9], y: slabTopY(9) });
  add('rebar', 'bend', '主体班组', 'wgroup-main', { pos: [8.9, -2.2], y: slabTopY(8) });
  add('labor', 'hammer', '主体班组', 'wgroup-main', { pos: [3.4, 0.6], y: slabTopY(8) });
  add('labor', 'idle', '主体班组', 'wgroup-main', { pos: [2.9, -3.5], y: 17.13 });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.42, path: [[1.2, 2.4], [9.4, 2.4], [9.4, 2.0], [1.2, 2.0]] });
  add('labor', 'bend', '场内巡查', 'wgroup-patrol', { pos: [10.4, -4.6] });
  add('signal', 'signal', '塔吊指挥', 'wgroup-signal', { pos: [-0.6, 1.6], face: 0.5 });
  add('rebar', 'hammer', '钢筋班组', 'wgroup-shed', { pos: [-18.5, -12.1] });
  add('rebar', 'bend', '钢筋班组', 'wgroup-shed', { pos: [-15.7, -11.9] });
  add('labor', 'walk', '钢筋班组', 'wgroup-shed', { speed: 0.4, path: [[-19.4, -11.3], [-14.7, -11.3], [-14.7, -12.3], [-19.4, -12.3]] });
  add('labor', 'bend', '物料班组', 'wgroup-patrol', { pos: [16.9, 1.4] });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.48, path: [[16.4, 3.4], [21.9, 3.4], [21.9, -4.0], [16.4, -4.0]] });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.45, path: [[-2.6, -10.9], [-0.7, -10.9], [-0.7, -14.6], [-2.6, -14.6]] });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.55, path: [[-18, 11.4], [12.5, 11.4], [12.5, 10.7], [-18, 10.7]] });
  add('rebar', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.55, path: [[12.5, 11.1], [-18, 11.1], [-18, 10.4], [12.5, 10.4]] });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.5, path: [[3.0, -10.55], [11.5, -10.55], [11.5, -9.95], [3.0, -9.95]] });
  add('labor', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.45, path: [[-19.6, 12.6], [-6.0, 12.6], [-6.0, 11.8], [-19.6, 11.8]] });
  add('guard', 'idle', '安保门卫', 'wgroup-guard', { pos: [13.9, 13.4], face: Math.PI });
  add('labor', 'bend', '场内巡查', 'wgroup-patrol', { pos: [11.6, 10.1] });
  add('elec', 'walk', '场内巡查', 'wgroup-patrol', { speed: 0.5, path: [[7, -14.8], [21.3, -14.8], [21.3, -14.1], [7, -14.1]] });

  sys.buildMeshes(ctx.scene);
  ctx.scene.userData.workers = sys;
  void TAU;
  return sys;
}
