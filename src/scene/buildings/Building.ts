import * as THREE from 'three';
import { bx } from '../voxel';
import { srand } from '../random';
import { bannerTexture } from '../props/Textures';
import type { SceneCtx } from '../types';

/** 在建高层（模块化拼装）：基础/柱/楼板/带窗墙/核心筒/脚手架/升降机/横幅 */
export function buildBuilding(ctx: SceneCtx): void {
  const { scene, cfg, M, P, sys } = ctx;
  const BLD = cfg.bld;
  const GY = cfg.ground;
  const x0 = BLD.cx - BLD.w / 2;
  const x1 = BLD.cx + BLD.w / 2;
  const z0 = BLD.cz - BLD.d / 2;
  const z1 = BLD.cz + BLD.d / 2;
  const slabTopY = (k: number): number => GY + 0.5 + (k - 1) * BLD.fh + 0.22;

  // 基础
  P.concDark.add(BLD.cx, GY + 0.25, BLD.cz, BLD.w + 0.8, 0.5, BLD.d + 0.8);
  P.cement.add(BLD.cx, GY + 0.52, BLD.cz, BLD.w + 0.4, 0.1, BLD.d + 0.4);
  const colH = BLD.fh - 0.22;
  const colXs = [-3.9, -1.3, 1.3, 3.9];
  const colZs = [-2.5, 0, 2.5];

  const wallRun = (ax: number, az: number, bx2: number, bz2: number, k: number, n = 6, winW = 1.0): void => {
    const len = Math.hypot(bx2 - ax, bz2 - az);
    const wallT = 0.24;
    const cxm = (ax + bx2) / 2;
    const czm = (az + bz2) / 2;
    const ry = Math.atan2(-(bz2 - az), bx2 - ax);
    const sy = slabTopY(k);
    P.concrete.add(cxm, sy + 0.16, czm, len, 0.32, wallT, ry);
    P.concrete.add(cxm, sy + colH - 0.16, czm, len, 0.32, wallT, ry);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      P.concrete.add(ax + (bx2 - ax) * t, sy + colH / 2, az + (bz2 - az) * t, 0.62, colH - 0.64, wallT, ry);
    }
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      P.glass.add(ax + (bx2 - ax) * t, sy + colH / 2, az + (bz2 - az) * t, winW, colH - 0.7, 0.3, ry);
    }
  };

  for (let k = 1; k <= 10; k++) {
    const sy = slabTopY(k) - 0.22;
    const fresh = k >= 9;
    const pool = fresh ? P.cement : P.concrete;
    pool.add(BLD.cx, sy + 0.11, BLD.cz, BLD.w + 0.3, 0.22, BLD.d + 0.3);
    if (k < 10) {
      colXs.forEach((lx) => colZs.forEach((lz) => {
        P.concrete.add(BLD.cx + lx, sy + 0.22 + colH / 2, BLD.cz + lz, 0.4, colH, 0.4);
      }));
    }
    if (k <= 7) {
      wallRun(x0 + 0.12, z1 - 0.12, x1 - 0.12, z1 - 0.12, k);
      wallRun(x0 + 0.12, z0 + 0.12, x1 - 0.12, z0 + 0.12, k);
      wallRun(x0 + 0.12, z0 + 0.12, x0 + 0.12, z1 - 0.12, k, 3, 0.9);
      wallRun(x1 - 0.12, z0 + 0.12, x1 - 0.12, z1 - 0.12, k, 3, 0.9);
    } else if (k === 8) {
      wallRun(x0 + 0.12, z1 - 0.12, BLD.cx + 1, z1 - 0.12, k);
      wallRun(x1 - 0.12, z0 + 0.12, x1 - 0.12, z1 - 0.12, k, 3, 0.9);
    }
    if (k >= 9) {
      P.plank.add(BLD.cx, sy + 0.3, BLD.cz - 0.5, BLD.w, 0.5, 0.06);
      P.plank.add(BLD.cx, sy + 0.3, BLD.cz + 0.5, BLD.w, 0.5, 0.06);
    }
  }

  // 顶部插筋
  const topY = slabTopY(10);
  colXs.forEach((lx) => colZs.forEach((lz) => {
    for (let r = 0; r < 2; r++) P.rod.add(BLD.cx + lx + (r ? -0.1 : 0.1), topY + 0.5, BLD.cz + lz, 0.05, 0.9, 0.05);
  }));
  for (let i = 0; i < 10; i++) {
    P.rod.add(x0 + 0.5 + srand() * (BLD.w - 1), topY + 0.45, z0 + 0.4 + srand() * (BLD.d - 0.8), 0.045, 0.8, 0.045, srand() * 0.4 - 0.2);
  }
  P.brick.add(2.6, topY + 0.18, z0 + 0.7, 1.1, 0.35, 0.7);
  P.brick.add(3.0, topY + 0.5, z0 + 0.75, 0.8, 0.3, 0.55, 0, 0.1);
  P.red.add(8.4, topY + 0.22, 0.6, 0.7, 0.44, 0.7);

  // 核心筒（爬升模板）
  const coreH = 16.7 - (GY + 0.5);
  P.concrete.add(2.9, GY + 0.5 + coreH / 2, -3.5, 2.9, coreH, 2.9);
  for (let b = 0; b < 11; b++) P.concDark.add(2.9, GY + 1.2 + b * 1.35, -3.5, 3.02, 0.1, 3.02);
  P.yellow.add(2.9, 16.85, -3.5, 3.1, 0.16, 3.1);
  P.beacon.add(2.9, 17.05, -3.5, 0.12, 0.16, 0.12);

  // 脚手架（前 + 东）
  const scaffoldRun = (ax: number, az: number, bx2: number, bz2: number, hMax: number): void => {
    const len = Math.hypot(bx2 - ax, bz2 - az);
    const n = Math.max(2, Math.round(len / 1.7));
    const ry = Math.atan2(-(bz2 - az), bx2 - ax);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      P.pole.add(ax + (bx2 - ax) * t, GY + hMax / 2, az + (bz2 - az) * t, 0.09, hMax, 0.09);
    }
    const m = Math.round(n / 2);
    for (let lv = 1; lv <= Math.floor(hMax / 1.35); lv++) {
      const y = GY + lv * 1.35;
      P.pole.add((ax + bx2) / 2, y, (az + bz2) / 2, len, 0.07, 0.07, ry);
      if (lv % 2 === 0) P.plank.add((ax + bx2) / 2, y + 0.05, (az + bz2) / 2, len * 0.94, 0.06, 0.7, ry);
    }
    for (let i = 1; i < m; i++) {
      const t = i / m;
      P.pole.add(ax + (bx2 - ax) * t, GY + hMax / 2, az + (bz2 - az) * t, 0.07, hMax, 0.07);
    }
  };
  scaffoldRun(x0 - 0.4, 1.85, x1 + 0.4, 1.85, 11.2);
  scaffoldRun(10.2, z0 - 0.3, 10.2, z1 + 0.3, 11.2);

  // 施工升降机（动笼）
  const mastX = 11.5;
  for (const dz of [-0.35, 0.35]) {
    for (const dx of [-0.22, 0.22]) P.yellow.add(mastX + dx, GY + 6.4, z0 + 0.9 + dz, 0.09, 12.8, 0.09);
  }
  for (let lv = 0; lv < 9; lv++) P.yellow.add(mastX, GY + 1.5 + lv * 1.4, z0 + 0.9, 0.6, 0.08, 0.8);
  const cage = new THREE.Group();
  scene.add(cage);
  bx(M.yellow, 1.1, 1.15, 1.0, 0, 0.62, 0, cage);
  bx(M.black, 0.9, 0.85, 0.06, 0, 0.62, 0.5, cage);
  bx(M.black, 0.06, 0.85, 0.9, 0.55, 0.62, 0, cage);
  sys.dyn.push((_dt, t) => {
    const y = GY + 1.0 + (Math.sin(t * 0.24) * 0.5 + 0.5) * 9.5;
    cage.position.set(mastX, y, z0 + 0.9);
  });

  // 楼层标牌横幅
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.85), new THREE.MeshStandardMaterial({ map: bannerTexture(), roughness: 0.8 }));
  banner.position.set(BLD.cx, 10.4, z1 + 1.95);
  scene.add(banner);
  const banner2 = banner.clone();
  banner2.rotation.y = Math.PI;
  banner2.position.z = z1 + 1.9;
  scene.add(banner2);
}
