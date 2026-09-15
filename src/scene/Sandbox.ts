import * as THREE from 'three';
import { Shape, Path, ShapeGeometry } from 'three';
import { G, bx } from './voxel';
import { lerp } from './random';
import { groundTextureCanvas } from './props/Textures';
import type { SceneCtx } from './types';

/** 沙盘：托盘底座 / 围挡 / 地面（挖出基坑洞口）/ 基坑 */
export function buildSandbox(ctx: SceneCtx): THREE.MeshStandardMaterial {
  const { scene, cfg, M, P } = ctx;
  const GY = cfg.ground;
  const PIT = cfg.pit;

  // 托盘底座 + 边墙
  const woodTray = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.78 });
  const base = bx(woodTray, 48, GY, 34, 0, GY / 2, 0, scene);
  base.receiveShadow = true;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c1f14, roughness: 0.8 });
  bx(wallMat, 48, 0.9, 0.7, 0, GY + 0.45, 16.65, scene);
  bx(wallMat, 48, 0.9, 0.7, 0, GY + 0.45, -16.65, scene);
  bx(wallMat, 0.7, 0.9, 32.6, 23.65, GY + 0.45, 0, scene);
  bx(wallMat, 0.7, 0.9, 32.6, -23.65, GY + 0.45, 0, scene);
  const rim = new THREE.MeshStandardMaterial({ color: 0x241a10, roughness: 0.7 });
  bx(rim, 46.6, 0.06, 0.14, 0, GY + 0.02, 16.24, scene);
  bx(rim, 46.6, 0.06, 0.14, 0, GY + 0.02, -16.24, scene);
  bx(rim, 0.14, 0.06, 32.6, 23.24, GY + 0.02, 0, scene);
  bx(rim, 0.14, 0.06, 32.6, -23.24, GY + 0.02, 0, scene);

  // 围挡（蓝白彩钢板 + 立柱 + 警示灯）
  const panelY = GY + 1.32;
  const gap0 = cfg.gate.x0;
  const gap1 = cfg.gate.x1;
  for (let x = -23.2; x < 23.2; x += 3.3) {
    if (x > gap0 - 1.0 && x < gap1) continue; // 大门开口
    P.blue.add(x, panelY, 16.32, 3.14, 0.86, 0.07);
    P.white.add(x, panelY, 16.34, 3.14, 0.2, 0.075);
    P.steelDark.add(x + 1.65, GY + 0.9, 16.32, 0.1, 0.95, 0.1);
  }
  for (let x = -23.2; x < 23.2; x += 3.3) {
    P.blue.add(x, panelY, -16.32, 3.14, 0.86, 0.07);
    P.white.add(x, panelY, -16.34, 3.14, 0.2, 0.075);
    P.steelDark.add(x + 1.65, GY + 0.9, -16.32, 0.1, 0.95, 0.1);
  }
  for (let z = -14.7; z < 15.4; z += 3.3) {
    P.blue.add(-23.32, panelY, z, 0.07, 0.86, 3.14);
    P.blue.add(23.32, panelY, z, 0.07, 0.86, 3.14);
    P.white.add(-23.34, panelY, z, 0.075, 0.2, 3.14);
    P.white.add(23.34, panelY, z, 0.075, 0.2, 3.14);
    P.steelDark.add(-23.32, GY + 0.9, z + 1.65, 0.1, 0.95, 0.1);
    P.steelDark.add(23.32, GY + 0.9, z + 1.65, 0.1, 0.95, 0.1);
  }
  for (let x = -20; x <= 20; x += 8) {
    P.beacon.add(x, GY + 1.86, 16.28, 0.14, 0.14, 0.14);
    P.beacon.add(-x, GY + 1.86, -16.28, 0.14, 0.14, 0.14);
  }

  // —— 地面（Shape 挖出基坑洞口，UV 映射到程序地面纹理）——
  const shape = new Shape();
  shape.moveTo(-23.3, -16.3);
  shape.lineTo(23.3, -16.3);
  shape.lineTo(23.3, 16.3);
  shape.lineTo(-23.3, 16.3);
  shape.closePath();
  const hole = new Path();
  hole.moveTo(PIT.x0, -PIT.z0);
  hole.lineTo(PIT.x0, -PIT.z1);
  hole.lineTo(PIT.x1, -PIT.z1);
  hole.lineTo(PIT.x1, -PIT.z0);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new ShapeGeometry(shape, 4);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + 24) / 48, (17 - pos.getZ(i)) / 34);
  }
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTextureCanvas(cfg), roughness: 0.95, metalness: 0 });
  ctx.sys.wetMats.push({ mat: groundMat, baseRough: 0.95, baseColor: new THREE.Color(0xffffff) });
  const gmesh = new THREE.Mesh(geo, groundMat);
  gmesh.position.y = GY + 0.02;
  gmesh.receiveShadow = true;
  scene.add(gmesh);

  buildPit(ctx);
  return groundMat;
}

function buildPit(ctx: SceneCtx): void {
  const { scene, cfg, M, P } = ctx;
  const GY = cfg.ground;
  const { w, d, cx, cz, depth: dp } = cfg.pit;
  const PIT = cfg.pit;

  const ringBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(G.box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  };
  const ring = (wi: number, di: number, y0: number, h: number, mat: THREE.Material) => {
    const t = 1.6;
    ringBox(cx, y0 + h / 2, cz - di / 2 - t / 2, wi + 2 * t, h, t, mat);
    ringBox(cx, y0 + h / 2, cz + di / 2 + t / 2, wi + 2 * t, h, t, mat);
    ringBox(cx - wi / 2 - t / 2, y0 + h / 2, cz, t, h, di, mat);
    ringBox(cx + wi / 2 + t / 2, y0 + h / 2, cz, t, h, di, mat);
  };

  ring(w, d, GY - 0.6, 0.6, M.soil);
  ring(w - 0.7, d - 0.7, GY - 1.15, 0.55, M.dirtA);
  ring(w - 1.4, d - 1.4, GY - 1.72, 0.57, M.sand);
  P.dirtB.add(cx, GY - dp - 0.06, cz, w - 1.5, 0.16, d - 1.5);
  P.dirtC.add(cx + 1.6, GY - dp - 0.02, cz - 2.6, 1.6, 0.1, 1.4);

  // 钢支撑（横跨，避开机械活动区）+ 锚板
  for (const sz of [PIT.z0 + 1.0, PIT.z1 - 0.8]) {
    P.pipe.add(cx, GY - 0.5, sz, 0.13, w - 1.6, 0.13, 0, 0, Math.PI / 2);
  }
  for (let i = 0; i < 14; i++) {
    const side = i % 2;
    const t = i >> 1;
    if (side === 0) P.steelDark.add(PIT.x0 + 0.15 + ((t * (w - 0.4)) / 6), GY - 1.05, PIT.z0 + 0.15, 0.5, 0.9, 0.08);
    else P.steelDark.add(PIT.x1 - 0.15 - ((t * (w - 0.4)) / 6), GY - 1.05, PIT.z1 - 0.15, 0.5, 0.9, 0.08);
  }

  // 出土坡道（东南角）
  const rampL = 4.6;
  const ang = Math.atan2(dp, rampL);
  const ramp = new THREE.Mesh(G.box, M.dirtA);
  ramp.scale.set(2.3, 0.24, Math.hypot(dp, rampL));
  ramp.position.set(PIT.x1 - 1.3, GY - dp / 2, PIT.z1 - 0.6);
  ramp.rotation.x = -ang;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  scene.add(ramp);
  P.plank.add(PIT.x1 - 2.5, GY - 0.8, PIT.z1 + 0.1, 0.18, 0.3, rampL + 0.5);
  P.plank.add(PIT.x1 - 0.3, GY - 0.9, PIT.z1 + 0.1, 0.18, 0.3, rampL + 0.2);

  // 基坑周边警示栏杆
  const railY = GY + 0.62;
  const railSpans: Array<[number, number, number, number]> = [
    [PIT.x0 - 0.5, PIT.z0 - 0.55, PIT.x1 + 0.5, PIT.z0 - 0.55],
    [PIT.x0 - 0.5, PIT.z1 + 0.55, PIT.x1 + 0.5, PIT.z1 + 0.55],
    [PIT.x0 - 0.55, PIT.z0 - 0.55, PIT.x0 - 0.55, PIT.z1 + 0.55],
  ];
  railSpans.forEach((sp) => {
    const [x0, z0, x1, z1] = sp;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const a2 = Math.atan2(-(z1 - z0), x1 - x0);
    const n = Math.round(len / 1.6);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      P.steelDark.add(lerp(x0, x1, t), GY + 0.4, lerp(z0, z1, t), 0.07, 0.9, 0.07);
    }
    P.red.add((x0 + x1) / 2, railY, (z0 + z1) / 2, len, 0.05, 0.05, a2);
    P.white.add((x0 + x1) / 2, railY - 0.14, (z0 + z1) / 2, len, 0.05, 0.05, a2);
  });

  // 基坑警示灯
  [PIT.z0 - 0.7, PIT.z1 + 0.7].forEach((z) => {
    for (let x = PIT.x0; x <= PIT.x1; x += 3.4) P.beacon.add(x, GY + 0.86, z, 0.12, 0.16, 0.12);
  });
}
