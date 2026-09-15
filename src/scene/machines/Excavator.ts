import * as THREE from 'three';
import { bx, bxr } from '../voxel';
import { clamp01, ease } from '../random';
import type { SceneCtx, DigUnit } from '../types';

const DIG_SEQ: Array<{ d: number; b?: number; s?: number; k?: number; w?: string; r?: boolean; puff?: number }> = [
  { d: 0.9, r: true },
  { d: 1.05, b: -0.55, s: 0.62, k: 0.55 },
  { d: 0.85, b: -0.5, s: 0.72, k: 1.35, puff: 1 },
  { d: 0.95, b: 0.5, s: 0.45, k: 0.95 },
  { d: 1.4, b: 0.34, s: 0.4, k: 0.9, w: 'd' },
  { d: 1.05, b: 0.34, s: 0.28, k: -0.35, puff: 2 },
  { d: 1.4, r: true },
];

export const DIG_PHASE_LABELS = ['待机', '挖斗下落', '铲装', '抬臂', '回转', '卸土', '回位'];

export function buildExcavator(ctx: SceneCtx, opt: DigUnit['opt'], entityId: string): void {
  const { scene, M, sys } = ctx;
  const g = new THREE.Group();
  g.position.set(opt.x, opt.y, opt.z);
  g.rotation.y = opt.bodyYaw;
  scene.add(g);
  for (const dz of [0.44, -0.44]) {
    const tr = new THREE.Group();
    tr.position.set(-0.1, 0.3, dz);
    g.add(tr);
    bx(M.rubber, 1.7, 0.3, 0.32, 0, 0, 0, tr);
    bx(M.rubber, 1.7, 0.14, 0.36, 0, 0.2, 0, tr);
    for (const wx of [-0.6, -0.1, 0.5]) {
      const w = bx(M.steelDark, 0.26, 0.26, 0.32, wx, -0.02, 0, tr);
      w.castShadow = false;
    }
  }
  bx(M.yellow, 1.3, 0.24, 0.95, -0.05, 0.54, 0, g);
  const swing = new THREE.Group();
  swing.position.set(-0.1, 0.74, 0);
  swing.rotation.y = opt.restW;
  g.add(swing);
  bx(M.yellow, 1.5, 0.34, 0.9, -0.25, 0.16, 0, swing);
  bx(M.orange, 0.6, 0.26, 0.78, -1.0, 0.4, 0, swing);
  bx(M.steelDark, 0.5, 0.5, 0.75, -1.35, 0.32, 0, swing);
  bx(M.black, 0.09, 0.45, 0.09, -0.75, 0.62, 0, swing);
  bx(M.yellow, 0.55, 0.6, 0.6, 0.28, 0.6, -0.24, swing);
  bx(M.cabGlass, 0.07, 0.42, 0.5, 0.57, 0.62, -0.24, swing);
  bx(M.yellow, 0.62, 0.08, 0.66, 0.28, 0.94, -0.24, swing);
  bx(M.beacon, 0.09, 0.1, 0.09, 0.28, 1.03, -0.24, swing);
  const boom = new THREE.Group();
  boom.position.set(0.68, 1.02, 0);
  swing.add(boom);
  bx(M.yellow, 1.8, 0.2, 0.32, 0.85, 0, 0, boom);
  bxr(M.black, 0.9, 0.06, 0.06, 0.35, 0.42, 0.2, boom, 0, 0, 0.5);
  bxr(M.steelDark, 0.5, 0.09, 0.09, 0.95, 0.55, 0.2, boom, 0, 0, 0.5);
  const stick = new THREE.Group();
  stick.position.set(1.7, 0, 0);
  boom.add(stick);
  bx(M.yellow, 1.4, 0.16, 0.24, 0.65, 0, 0, stick);
  bxr(M.black, 0.7, 0.05, 0.05, 0.3, 0.26, 0.15, stick, 0, 0, 0.62);
  const bucket = new THREE.Group();
  bucket.position.set(1.3, 0, 0);
  stick.add(bucket);
  bx(M.steelDark, 0.34, 0.3, 0.56, 0.1, -0.1, 0, bucket);
  bx(M.steelDark, 0.42, 0.06, 0.56, 0.28, -0.26, 0, bucket);
  for (const dz of [-0.28, 0.28]) bx(M.steelDark, 0.42, 0.28, 0.05, 0.2, -0.12, dz, bucket);
  for (let i = -1; i <= 1; i++) bx(M.steel, 0.1, 0.13, 0.06, 0.47, -0.3, i * 0.2, bucket);

  const ex: DigUnit = {
    g, swing, boom, stick, bucket, opt,
    i: 0, t: opt.phase || 0,
    cur: { b: opt.rest.b, s: opt.rest.s, k: opt.rest.k, w: opt.restW },
    from: { b: 0, s: 0, k: 0, w: 0 },
    tgtB: opt.rest.b, tgtS: opt.rest.s, tgtK: opt.rest.k, tgtW: opt.restW,
    puffDone: true,
    entityId,
    stateLabel: '待机',
  };
  initDigItem(ex);
  sys.digs.push(ex);
}

function initDigItem(ex: DigUnit): void {
  const it = DIG_SEQ[ex.i];
  const rest = ex.opt.rest;
  ex.from = { ...ex.cur };
  ex.tgtW = it.w === 'd' ? ex.opt.dumpW : it.r ? rest.w : ex.cur.w;
  ex.tgtB = it.r ? rest.b : it.b ?? ex.cur.b;
  ex.tgtS = it.r ? rest.s : it.s ?? ex.cur.s;
  ex.tgtK = it.r ? rest.k : it.k ?? ex.cur.k;
  if (it.puff) {
    ex.puffDone = false;
  } else {
    ex.puffDone = true;
  }
}

const TMP_V = new THREE.Vector3();

export function updateDigs(ctx: SceneCtx, dt: number): void {
  const mult = ctx.store.config.presets.speed[ctx.store.speedIdx] ?? 1;
  for (const ex of ctx.sys.digs) {
    ex.t += dt * mult * ex.opt.rate;
    const it = DIG_SEQ[ex.i];
    const k = ease(clamp01(ex.t / it.d));
    ex.cur.b = ease2(ex.from.b, ex.tgtB, k);
    ex.cur.s = ease2(ex.from.s, ex.tgtS, k);
    ex.cur.k = ease2(ex.from.k, ex.tgtK, k);
    ex.cur.w = ease2(ex.from.w, ex.tgtW, k);
    ex.stateLabel = DIG_PHASE_LABELS[ex.i] ?? '作业中';
    ex.swing.rotation.y = ex.cur.w;
    ex.boom.rotation.z = ex.cur.b;
    ex.stick.rotation.z = ex.cur.s;
    ex.bucket.rotation.z = ex.cur.k;
    if (!ex.puffDone && ex.t >= it.d * 0.75) {
      ex.puffDone = true;
      ex.bucket.getWorldPosition(TMP_V);
      ctx.twins.spawnBurst(TMP_V.x, TMP_V.y, TMP_V.z, 12, 0.45);
    }
    if (ex.t >= it.d) {
      ex.t = 0;
      ex.i = (ex.i + 1) % DIG_SEQ.length;
      initDigItem(ex);
    }
  }
}

function ease2(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function digProgress(ex: DigUnit): number {
  return clamp01(ex.t / Math.max(0.001, DIG_SEQ[ex.i].d));
}
