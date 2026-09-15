import * as THREE from 'three';
import { bx, cy, wheel } from '../voxel';
import { clamp, clamp01, ease } from '../random';
import { Follower, clampPosition, type RouteCorner } from '../paths';
import { poolGlowOf } from './glow';
import type { SceneCtx, VehicleUnit } from '../types';

const TRUCK_ROUTE: RouteCorner[] = [
  { x: 9, z: 8 },
  { x: -13, z: 8 },
  { x: -13, z: 1.6, stop: { dur: 7, act: 'load' } },
  { x: -13, z: -8 },
  { x: -4.6, z: -8 },
  { x: -4.6, z: -11.2 },
  { x: -1.6, z: -12.6 },
  { x: 1.4, z: -12.6, stop: { dur: 6, act: 'dump' } },
  { x: 1.4, z: -8 },
  { x: 13, z: -8 },
  { x: 13, z: 8 },
];

const MIXER_ROUTE: RouteCorner[] = [
  { x: 9, z: 8 },
  { x: -13, z: 8 },
  { x: -13, z: -8 },
  { x: 13, z: -8 },
  { x: 13, z: 0.5, stop: { dur: 9, act: 'pour' } },
  { x: 13, z: 8 },
];

const LOADER_ROUTE: RouteCorner[] = [
  { x: -14, z: -8.8 },
  { x: -2.4, z: -8.8 },
  { x: -2.4, z: -10.0 },
  { x: -1.5, z: -10.9 },
  { x: -0.9, z: -10.4, stop: { dur: 5, act: 'dumpL' } },
  { x: 0.3, z: -10.7 },
  { x: 1.3, z: -9.7 },
  { x: 2.2, z: -8.8 },
  { x: 13.2, z: -8.8 },
  { x: 15.1, z: -7.2 },
  { x: 15.7, z: -5.6 },
  { x: 15.9, z: -4.3 },
  { x: 16.6, z: -5.4 },
  { x: 19.0, z: -5.4, stop: { dur: 5, act: 'scoopL' } },
  { x: 21.6, z: -5.4 },
  { x: 21.9, z: -4.5 },
  { x: 21.4, z: -3.8 },
  { x: 19.4, z: -3.8 },
  { x: 16.1, z: -3.8 },
  { x: 15.0, z: -5.2 },
  { x: 14.0, z: -7.2 },
  { x: -14, z: -7.2 },
];

function std2(color: number, r = 0.5, m = 0.3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });
}

export function truckTotalLength(): number {
  return new Follower(TRUCK_ROUTE, 0).total;
}

export function buildTruck(ctx: SceneCtx, color: number, s0: number, entityId: string): void {
  const { scene, M, sys, cfg } = ctx;
  const g = new THREE.Group();
  scene.add(g);
  bx(M.black, 2.5, 0.16, 0.8, 0.05, 0.36, 0, g);
  bx(std2(color), 0.7, 0.62, 0.88, 0.85, 0.86, 0, g);
  bx(M.cabGlass, 0.1, 0.34, 0.72, 1.22, 0.92, 0, g);
  bx(std2(color), 0.66, 0.1, 0.92, 0.85, 1.22, 0, g);
  bx(M.beacon, 0.12, 0.09, 0.5, 0.85, 1.31, 0, g);
  bx(M.headLight, 0.08, 0.12, 0.18, 1.32, 0.5, 0.3, g);
  bx(M.headLight, 0.08, 0.12, 0.18, 1.32, 0.5, -0.3, g);
  bx(M.steel, 0.05, 0.28, 0.05, 1.26, 0.95, 0.5, g);
  bx(M.steel, 0.05, 0.28, 0.05, 1.26, 0.95, -0.5, g);
  cy(M.steelDark, 0.05, 0.5, 0.45, 0.72, 0.45, g);
  const bed = new THREE.Group();
  bed.position.set(-0.35, 0.64, 0);
  g.add(bed);
  const bm = std2(color, 0.6, 0.2);
  bx(bm, 1.74, 0.08, 1.0, 0.75, 0.05, 0, bed);
  bx(bm, 1.74, 0.46, 0.07, 0.75, 0.3, 0.47, bed);
  bx(bm, 1.74, 0.46, 0.07, 0.75, 0.3, -0.47, bed);
  bx(bm, 0.07, 0.46, 1.0, 1.58, 0.3, 0, bed);
  bx(M.steelDark, 0.07, 0.4, 0.96, -0.1, 0.26, 0, bed);
  bx(M.dirtA, 1.4, 0.26, 0.8, 0.75, 0.28, 0, bed);
  const rearMk = new THREE.Object3D();
  rearMk.position.set(-0.12, 0.3, 0);
  bed.add(rearMk);
  const wheels = [
    wheel(0.24, 0.2, 1.0, 0.24, 0.44, g), wheel(0.24, 0.2, 1.0, 0.24, -0.44, g),
    wheel(0.24, 0.2, -0.5, 0.24, 0.44, g), wheel(0.24, 0.2, -0.5, 0.24, -0.44, g),
    wheel(0.24, 0.2, -1.15, 0.24, 0.44, g), wheel(0.24, 0.2, -1.15, 0.24, -0.44, g),
  ];
  const poolGlow = poolGlowOf(sys);
  if (poolGlow) {
    const hp = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.2), poolGlow);
    hp.rotation.x = -Math.PI / 2;
    hp.position.set(2.6, 0.05, 0);
    g.add(hp);
  }
  sys.vehicles.push({
    g, fol: new Follower(TRUCK_ROUTE, s0), baseSpeed: 2.3, v: 0, wheels, bed, rearMk,
    dwell: 0, dwellTotal: 1, actT: 0, act: '', spin: 0, kind: 'truck', entityId, stateLabel: '行驶中',
  });
  void cfg;
}

export function buildMixer(ctx: SceneCtx, s0: number, entityId: string): void {
  const { scene, M, sys } = ctx;
  const g = new THREE.Group();
  scene.add(g);
  bx(M.black, 2.8, 0.16, 0.84, 0, 0.36, 0, g);
  bx(std2(0x2e6cb5), 0.7, 0.6, 0.9, 1.05, 0.85, 0, g);
  bx(M.cabGlass, 0.1, 0.32, 0.74, 1.42, 0.9, 0, g);
  bx(std2(0x2e6cb5), 0.66, 0.1, 0.94, 1.05, 1.2, 0, g);
  bx(M.headLight, 0.08, 0.12, 0.18, 1.52, 0.5, 0.3, g);
  bx(M.headLight, 0.08, 0.12, 0.18, 1.52, 0.5, -0.3, g);
  const drumG = new THREE.Group();
  drumG.position.set(-0.35, 1.05, 0);
  drumG.rotation.z = -0.1;
  g.add(drumG);
  const dgeo = new THREE.CylinderGeometry(0.5, 0.34, 1.7, 10);
  const drum = new THREE.Mesh(dgeo, M.drum);
  drum.rotation.z = Math.PI / 2;
  drum.castShadow = true;
  drumG.add(drum);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.18, 10), M.orange);
  band.rotation.z = Math.PI / 2;
  band.position.x = 0.3;
  drumG.add(band);
  const band2 = band.clone();
  band2.position.x = -0.35;
  drumG.add(band2);
  bx(M.steelDark, 0.5, 0.3, 0.5, -1.35, 0.75, 0, g);
  const chute = new THREE.Group();
  chute.position.set(-1.3, 1.0, 0);
  g.add(chute);
  bx(M.steel, 0.9, 0.08, 0.4, -0.45, 0, 0, chute);
  bx(M.steel, 0.7, 0.06, 0.3, -1.15, -0.28, 0, chute);
  const wheels = [
    wheel(0.26, 0.22, 1.1, 0.26, 0.46, g), wheel(0.26, 0.22, 1.1, 0.26, -0.46, g),
    wheel(0.26, 0.22, -0.6, 0.26, 0.46, g), wheel(0.26, 0.22, -0.6, 0.26, -0.46, g),
    wheel(0.26, 0.22, -1.3, 0.26, 0.46, g), wheel(0.26, 0.22, -1.3, 0.26, -0.46, g),
  ];
  sys.vehicles.push({
    g, fol: new Follower(MIXER_ROUTE, s0), baseSpeed: 1.05, v: 0, wheels,
    drum: drumG, chute,
    dwell: 0, dwellTotal: 1, actT: 0, act: '', spin: 0, kind: 'mixer', entityId, stateLabel: '行驶中',
  });
}

export function buildLoader(ctx: SceneCtx, s0: number, entityId: string): void {
  const { scene, M, sys } = ctx;
  const g = new THREE.Group();
  scene.add(g);
  bx(M.yellow, 1.15, 0.4, 0.8, -0.05, 0.5, 0, g);
  bx(M.yellow, 0.5, 0.34, 0.72, -0.62, 0.78, 0, g);
  bx(M.black, 0.52, 0.06, 0.74, -0.62, 0.97, 0, g);
  bx(M.cabGlass, 0.06, 0.5, 0.7, 0.28, 0.95, 0, g);
  bx(M.yellow, 0.6, 0.07, 0.76, 0.3, 1.24, 0, g);
  bx(M.black, 0.06, 0.55, 0.06, 0.6, 0.9, 0.34, g);
  bx(M.black, 0.06, 0.55, 0.06, 0.6, 0.9, -0.34, g);
  const wheels = [
    wheel(0.24, 0.22, 0.48, 0.24, 0.42, g), wheel(0.24, 0.22, 0.48, 0.24, -0.42, g),
    wheel(0.24, 0.22, -0.5, 0.24, 0.42, g), wheel(0.24, 0.22, -0.5, 0.24, -0.42, g),
  ];
  const arms = new THREE.Group();
  arms.position.set(0.45, 0.44, 0);
  g.add(arms);
  bx(M.yellow, 1.15, 0.12, 0.1, 0.55, 0.12, 0.3, arms);
  bx(M.yellow, 1.15, 0.12, 0.1, 0.55, 0.12, -0.3, arms);
  bx(M.black, 0.7, 0.05, 0.05, 0.6, 0.32, 0.3, arms);
  bx(M.black, 0.7, 0.05, 0.05, 0.6, 0.32, -0.3, arms);
  const bucket = new THREE.Group();
  bucket.position.set(1.12, 0.1, 0);
  arms.add(bucket);
  bx(M.steelDark, 0.55, 0.06, 0.72, 0.2, -0.06, 0, bucket);
  bx(M.steelDark, 0.06, 0.42, 0.72, -0.1, 0.12, 0, bucket);
  for (const dz of [-0.36, 0.36]) bx(M.steelDark, 0.5, 0.4, 0.05, 0.12, 0.08, dz, bucket);
  for (let i = -1; i <= 1; i++) bx(M.steel, 0.12, 0.14, 0.05, 0.44, -0.14, i * 0.24, bucket);
  sys.vehicles.push({
    g, fol: new Follower(LOADER_ROUTE, s0), baseSpeed: 1.15, v: 0, wheels, arms, bucket,
    dwell: 0, dwellTotal: 1, actT: 0, act: '', spin: 0, kind: 'loader', entityId, stateLabel: '行驶中',
  });
}

const TMP1 = { x: 0, z: 0 };
const TMP2 = { x: 0, z: 0 };
const TMP3 = { x: 0, z: 0 };
const TMP_V = new THREE.Vector3();

export function updateVehicles(ctx: SceneCtx, dt: number): void {
  const { sys, store, cfg } = ctx;
  const mult = store.config.presets.speed[store.speedIdx] ?? 1;
  const ahead = { x: 0, z: 0 };
  for (const v of sys.vehicles) {
    const fol = v.fol;
    if (v.dwell > 0) {
      v.dwell -= dt;
      v.actT += dt;
      if (v.kind === 'truck' && v.act === 'dump') truckDump(ctx, v);
      else if (v.kind === 'mixer') mixerPour(v);
      else if (v.kind === 'loader') loaderWork(v);
      if (v.kind !== 'truck' || v.act !== 'dump') v.stateLabel = dwellLabel(v);
    } else {
      v.stateLabel = '行驶中';
      let target = v.baseSpeed * mult;
      fol.posAt(fol.s + 2.0, ahead);
      for (const o of sys.vehicles) {
        if (o === v) continue;
        const dx = o.g.position.x - ahead.x;
        const dz = o.g.position.z - ahead.z;
        if (dx * dx + dz * dz < 2.1 * 2.1) {
          target = 0;
          break;
        }
      }
      if (target === 0) v.stateLabel = '避让停车';
      v.v += clamp(target - v.v, -dt * 7, dt * 2.4);
      const ds = v.v * dt;
      const nx = fol.s + ds;
      const st = fol.stops[fol.stopIdx];
      if (st && fol.s < st.s && nx >= st.s) {
        fol.s = st.s;
        v.dwell = st.dur;
        v.dwellTotal = st.dur;
        v.actT = 0;
        v.act = st.act;
        v.v = 0;
        fol.stopIdx = (fol.stopIdx + 1) % Math.max(1, fol.stops.length);
      } else {
        fol.s = nx;
      }
    }
    const p = fol.posAt(fol.s, TMP1);
    const h1 = fol.posAt(fol.s - 0.5, TMP2);
    const h2 = fol.posAt(fol.s + 0.5, TMP3);
    v.g.position.set(p.x, cfg.ground, p.z);
    const yaw = Math.atan2(-(h2.z - h1.z), h2.x - h1.x);
    let dy = yaw - v.g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    v.g.rotation.y += dy * Math.min(1, dt * 8);
    clampPosition(v.g.position, cfg.bound, cfg.ground - cfg.pit.depth - 0.2);
    v.spin += v.v * dt / 0.24;
    v.wheels.forEach((w) => (w.rotation.z = -v.spin));
    if (v.drum) v.drum.rotation.y += dt * 2.3 * mult;
  }
}

function dwellLabel(v: VehicleUnit): string {
  if (v.kind === 'truck') return v.act === 'dump' ? '倾卸渣土' : '基坑装料';
  if (v.kind === 'mixer') return '定点浇筑';
  return v.act === 'scoopL' ? '铲装物料' : '卸料';
}

function truckDump(ctx: SceneCtx, v: VehicleUnit): void {
  const D = 6;
  const k = v.actT / D;
  let tilt: number;
  if (k < 0.22) tilt = ease(k / 0.22);
  else if (k < 0.72) tilt = 1;
  else tilt = 1 - ease((k - 0.72) / 0.28);
  if (v.bed) v.bed.rotation.z = tilt * 0.85;
  if (k > 0.2 && k < 0.75 && Math.random() < 0.5 && v.rearMk) {
    v.rearMk.getWorldPosition(TMP_V);
    ctx.twins.spawnBurst(TMP_V.x, TMP_V.y - 0.1, TMP_V.z, 3, 0.55);
  }
  if (v.dwell <= 0 && v.bed) v.bed.rotation.z = 0;
}

function mixerPour(v: VehicleUnit): void {
  if (!v.chute) return;
  const target = v.actT > 1.2 && v.dwell > 2.5 ? 1.15 : 0.35;
  v.chute.rotation.z += (target - v.chute.rotation.z) * 0.06;
}

function loaderWork(v: VehicleUnit): void {
  if (!v.arms || !v.bucket) return;
  const D = 5;
  const k = v.actT / D;
  const arms = v.arms;
  const bk = v.bucket;
  let aT: number;
  let bT: number;
  if (v.act === 'scoopL') {
    if (k < 0.3) {
      aT = -0.3 + (0.5 + 0.3) * (1 - ease(k / 0.3));
      bT = -0.45;
    } else if (k < 0.62) {
      aT = -0.3;
      bT = -0.45 + (0.65 + 0.45) * ease((k - 0.3) / 0.32);
    } else {
      const kk = ease((k - 0.62) / 0.38);
      aT = -0.3 + (0.55 + 0.3) * kk;
      bT = -0.45 + (0.35 + 0.45) * kk;
    }
  } else {
    if (k < 0.3) {
      aT = 0.2 + 0.4 * ease(k / 0.3);
      bT = 0.3;
    } else if (k < 0.6) {
      aT = 0.6;
      bT = 0.3 - 1.0 * ease((k - 0.3) / 0.3);
    } else {
      const kk = ease((k - 0.6) / 0.4);
      aT = 0.6 - 0.55 * kk;
      bT = -0.7 + 0.6 * kk;
    }
  }
  arms.rotation.z = aT;
  bk.rotation.z = bT;
  if (v.dwell <= 0) {
    arms.rotation.z = 0.05;
    bk.rotation.z = -0.1;
  }
}

/** 工况进度 0~1：停靠作业按时间，行驶按当前速度占比 */
export function vehicleProgress(v: VehicleUnit): number {
  if (v.dwell > 0) return clamp01(v.actT / Math.max(0.001, v.dwellTotal));
  return clamp01(v.v / Math.max(0.001, v.baseSpeed));
}
