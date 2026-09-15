import * as THREE from 'three';
import { bx, cy } from '../voxel';
import { srand, TAU } from '../random';
import { radialTexture } from '../canvas';
import {
  boardTexture, gateSignTexture, signTexture, type SignKind,
} from './Textures';
import type { SceneCtx } from '../types';

/** 功能分区与工地细节：钢筋棚/物料区/渣土区/板房/大门/灯杆/电杆/锥桶/彩旗/标识牌 */
export function buildZones(ctx: SceneCtx): void {
  buildSteelShed(ctx);
  buildMaterialZone(ctx);
  buildDumpZone(ctx);
  buildOffices(ctx);
  buildGate(ctx);
  buildLamps(ctx);
  buildPolesWires(ctx);
  buildDetails(ctx);
}

export function makeMound(ctx: SceneCtx, cx: number, cz: number, w: number, d: number, h: number, poolKey: string, base: number, baseY?: number): void {
  const P = ctx.P;
  const GY = ctx.cfg.ground;
  const y0 = baseY ?? GY + 0.2;
  const step = 0.42;
  for (let gx = -w / 2; gx <= w / 2; gx += step) {
    for (let gz = -d / 2; gz <= d / 2; gz += step) {
      const r = Math.hypot(gx / (w / 2), gz / (d / 2));
      if (r > 1) continue;
      const hh = h * (1 - r * r) * (0.75 + srand() * 0.5);
      for (let y = 0; y < hh; y += step) {
        if (srand() < 0.12 && y > hh - step * 1.5) continue;
        const c = new THREE.Color(base).offsetHSL(0, (srand() - 0.5) * 0.06, (srand() - 0.5) * 0.1);
        P[poolKey].add(
          cx + gx + (srand() - 0.5) * 0.08, y0 + y, cz + gz + (srand() - 0.5) * 0.08,
          step * (0.9 + srand() * 0.2), step, step * (0.9 + srand() * 0.2),
          srand() * 0.4, 0, 0, c.getHex(),
        );
      }
    }
  }
}

function buildSteelShed(ctx: SceneCtx): void {
  const { scene, cfg, M, P } = ctx;
  const GY = cfg.ground;
  const { cx, cz, w, d } = cfg.shed;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  P.gravel.add(cx, GY + 0.03, cz, w + 1.4, 0.06, d + 1.4);
  const colY = GY + 1.4;
  for (const px of [x0, x1]) {
    for (const pz of [z0, z1]) P.steelDark.add(px, colY, pz, 0.2, 2.8, 0.2);
  }
  P.steelDark.add(cx, colY, z0, 0.16, 2.8, 0.16);
  P.steelDark.add(cx, colY, z1, 0.16, 2.8, 0.16);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.steel);
  roof.scale.set(w + 1.2, 0.12, d + 1.0);
  roof.position.set(cx, GY + 3.0, cz);
  roof.rotation.z = 0.08;
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);
  P.steelDark.add(cx, GY + 2.85, cz, w + 1.2, 0.12, 0.14);

  for (const bz of [z0 + 1.1, z0 + 2.2]) {
    P.plank.add(cx + 0.4, GY + 0.62, bz, 3.4, 0.09, 0.7);
    for (const dx of [-1.5, 1.5]) P.steelDark.add(cx + 0.4 + dx, GY + 0.3, bz, 0.09, 0.6, 0.6);
  }
  const cutter = new THREE.Group();
  cutter.position.set(cx - 1.6, GY + 0.75, cz + 1.65);
  scene.add(cutter);
  bx(M.yellow, 0.8, 0.35, 0.6, 0, 0.12, 0, cutter);
  cy(M.steel, 0.3, 0.06, 0.25, 0.45, 0, cutter, 'z');
  bx(M.orange, 0.5, 0.3, 0.14, -0.1, 0.5, 0, cutter);

  for (const rx of [x0 + 1.0, x0 + 2.6]) {
    P.steelDark.add(rx, GY + 0.5, cz - 1.2, 0.12, 1.0, 0.12, 0, 0, 0.3);
    P.steelDark.add(rx, GY + 0.5, cz - 1.2, 0.12, 1.0, 0.12, 0, 0, -0.3);
    for (let lv = 0; lv < 3; lv++) {
      for (let b = 0; b < 4; b++) P.rod.add(rx, GY + 0.55 + lv * 0.5, cz - 1.7 + b * 0.35, 0.07, 3.6, 0.07, 0, 0, Math.PI / 2);
    }
  }
  for (let i = 0; i < 10; i++) {
    P.rod.add(x1 - 0.6 + (srand() - 0.5) * 0.5, GY + 0.85, z1 - 0.8 + (srand() - 0.5) * 0.5, 0.05, 1.7, 0.05, srand() * 0.2 - 0.1);
  }
  P.steelDark.add(x1 - 0.6, GY + 0.06, z1 - 0.8, 1.1, 0.12, 1.1);
  for (let lv = 0; lv < 2; lv++) {
    for (let b = 0; b < 3; b++) P.rod.add(cx + 1.9, GY + 0.25 + lv * 0.22, cz + 0.4 + b * 0.28, 0.06, 3.2, 0.06, 0, 0, Math.PI / 2);
  }
}

function buildMaterialZone(ctx: SceneCtx): void {
  const { scene, cfg, M, P } = ctx;
  const GY = cfg.ground;

  const bagStack = (sx: number, sz: number, cols: number, rows: number, lvls: number) => {
    for (let a = 0; a < cols; a++) {
      for (let b = 0; b < rows; b++) {
        for (let c = 0; c < lvls; c++) {
          if (c === lvls - 1 && (a + b) % 2 === 0) continue;
          P.bag.add(
            sx + a * 0.62, GY + 0.16 + c * 0.3, sz + b * 0.5, 0.56, 0.28, 0.44, (srand() - 0.5) * 0.1, 0, 0,
            new THREE.Color(0xe2ded2).offsetHSL(0, 0, (srand() - 0.5) * 0.08).getHex(),
          );
        }
      }
    }
  };
  bagStack(16.2, 0.2, 3, 2, 4);
  bagStack(18.4, 0.4, 2, 2, 3);

  const brickPallet = (px: number, pz: number) => {
    P.plank.add(px, GY + 0.07, pz, 1.4, 0.14, 1.0);
    for (let l = 0; l < 4; l++) {
      for (let a = 0; a < 5; a++) {
        for (let b = 0; b < 2; b++) {
          P.brick.add(
            px - 0.5 + a * 0.25, GY + 0.2 + l * 0.13, pz - 0.2 + b * 0.4, 0.22, 0.11, 0.34, (srand() - 0.5) * 0.06, 0, 0,
            new THREE.Color(0xa34f36).offsetHSL(0, (srand() - 0.5) * 0.04, (srand() - 0.5) * 0.08).getHex(),
          );
        }
      }
    }
  };
  brickPallet(19.2, 1.9);
  brickPallet(21.0, 1.9);

  const pipeRack = (rx: number) => {
    P.steelDark.add(rx, GY + 0.5, -2.7, 0.12, 1.0, 0.12, 0, 0, 0.32);
    P.steelDark.add(rx, GY + 0.5, -2.7, 0.12, 1.0, 0.12, 0, 0, -0.32);
    const lens = [5, 4, 3];
    lens.forEach((cnt, li) => {
      for (let i = 0; i < cnt; i++) P.pipe.add(rx, GY + 0.35 + li * 0.26, -2.9 + (4 - cnt) * 0.18 + i * 0.36, 0.1, 4.0, 0.1, 0, 0, Math.PI / 2);
    });
  };
  pipeRack(16.6);
  pipeRack(18.1);

  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 8; i++) {
      P.plank.add(20.8, GY + 0.05 + i * 0.07, -1.4 + s * 0.75, 3.0, 0.06, 0.55, (srand() - 0.5) * 0.06, 0, (srand() - 0.5) * 0.02);
    }
  }
  for (let i = 0; i < 4; i++) P.concDark.add(22.1, GY + 1.05, 3.0 - i * 0.5, 0.14, 2.1, 0.9, 0, 0, -0.24);
  P.concDark.add(21.7, GY + 0.15, 2.4, 0.5, 0.3, 2.2);

  makeMound(ctx, 17.8, -5.8, 3.4, 2.8, 1.1, 'sand', 0xcbb283);
  makeMound(ctx, 20.8, -5.6, 3.0, 2.6, 0.9, 'gravel', 0x9a948a);

  for (let b = 0; b < 3; b++) {
    for (let r = 0; r < 5; r++) P.rod.add(21.7, GY + 0.25 + (b % 2) * 0.12, -0.9 + b * 0.3, 0.06, 3.4, 0.06, 0, 0, Math.PI / 2);
  }
  P.plank.add(-6.5, GY + 0.09, -2.5, 1.3, 0.18, 3.8);
  for (let l = 0; l < 2; l++) {
    for (let b = 0; b < 5; b++) P.rod.add(-6.5, GY + 0.28 + l * 0.24, -3.9 + b * 0.35, 0.07, 3.4, 0.07, 0, 0, Math.PI / 2);
  }
  P.plank.add(-6.5, GY + 0.09, 0.7, 1.2, 0.16, 1.2);
  for (let l = 0; l < 2; l++) {
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 2; b++) P.concDark.add(-6.9 + a * 0.4, GY + 0.3 + l * 0.42, 0.35 + b * 0.42, 0.36, 0.38, 0.38);
    }
  }
  // 混凝土料斗（待吊）
  const skip = new THREE.Group();
  skip.position.set(-2.0, GY, 4.6);
  scene.add(skip);
  bx(M.yellow, 1.0, 0.55, 1.0, 0, 0.75, 0, skip);
  const fun = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.5, 4), M.yellow);
  fun.rotation.x = Math.PI;
  fun.rotation.y = Math.PI / 4;
  fun.position.y = 0.35;
  fun.castShadow = true;
  skip.add(fun);
  cy(M.steelDark, 0.4, 0.08, 0, 1.06, 0, skip);
}

function buildDumpZone(ctx: SceneCtx): void {
  makeMound(ctx, -6.6, -13.2, 4.6, 3.4, 1.7, 'dirtA', 0x8a6a46);
  makeMound(ctx, -3.2, -13.7, 4.0, 3.0, 1.9, 'dirtB', 0x6f5536);
  makeMound(ctx, 0.3, -13.2, 2.6, 2.2, 1.0, 'dirtFresh', 0x7d6040);
  makeMound(ctx, -8.3, -11.2, 2.0, 1.8, 0.6, 'dirtA', 0x8a6a46);
  wheelbarrow(ctx, 1.6, -11.2, 0.5);
}

function wheelbarrow(ctx: SceneCtx, wx: number, wz: number, ry: number): void {
  const { scene, M } = ctx;
  const GY = ctx.cfg.ground;
  const g = new THREE.Group();
  g.position.set(wx, GY, wz);
  g.rotation.y = ry;
  scene.add(g);
  bx(M.red, 0.7, 0.22, 0.55, 0, 0.35, 0, g);
  bx(M.red, 0.6, 0.05, 0.45, 0, 0.24, 0, g);
  cy(M.rubber, 0.16, 0.08, -0.42, 0.16, 0, g, 'z');
  bx(M.steelDark, 0.5, 0.04, 0.04, 0.3, 0.18, 0.2, g);
  bx(M.steelDark, 0.5, 0.04, 0.04, 0.3, 0.18, -0.2, g);
  bx(M.steelDark, 0.04, 0.3, 0.04, 0.3, 0.12, 0.18, g);
  bx(M.steelDark, 0.04, 0.3, 0.04, 0.3, 0.12, -0.2, g);
}

function buildOffices(ctx: SceneCtx): void {
  const { scene, M, P } = ctx;
  const GY = ctx.cfg.ground;
  const cabin = (cx: number, body: 'white' | 'blue') => {
    const cz = 14.6;
    const w = 4.6;
    const d = 2.7;
    P.gravel.add(cx, GY + 0.03, cz, w + 1.2, 0.06, d + 1.2);
    const pm = body === 'white' ? P.white : P.blue;
    pm.add(cx, GY + 1.15, cz, w, 2.1, d);
    P.blueD.add(cx, GY + 2.28, cz, w + 0.4, 0.14, d + 0.5);
    P.glass.add(cx - 1.1, GY + 1.35, cz - d / 2 - 0.02, 0.8, 0.7, 0.08);
    P.glass.add(cx + 1.1, GY + 1.35, cz - d / 2 - 0.02, 0.8, 0.7, 0.08);
    P.glass.add(cx - 1.1, GY + 1.35, cz + d / 2 + 0.02, 0.8, 0.7, 0.08);
    P.steelDark.add(cx - 0.1, GY + 0.95, cz - d / 2 - 0.06, 0.8, 1.7, 0.06);
    bx(M.white, 0.7, 0.5, 0.3, cx + w / 2 + 0.25, GY + 1.5, cz + 0.6, scene);
    bx(M.black, 0.5, 0.05, 0.2, cx + w / 2 + 0.25, GY + 1.78, cz + 0.6, scene);
    P.concDark.add(cx - 0.1, GY + 0.12, cz - d / 2 - 0.35, 1.0, 0.24, 0.6);
    if (body === 'blue') {
      bx(M.steelDark, 0.6, 0.8, 0.25, cx - w / 2 - 0.3, GY + 1.4, cz + 0.5, scene);
      P.red.add(cx - w / 2 - 0.3, GY + 1.85, cz + 0.5, 0.14, 0.14, 0.1);
    }
  };
  cabin(-18.4, 'white');
  cabin(-12.4, 'blue');
  cabin(-6.4, 'white');

  const bb = new THREE.Group();
  bb.position.set(-3.2, GY, 12.9);
  bb.rotation.y = Math.PI;
  scene.add(bb);
  bx(M.steelDark, 0.09, 1.6, 0.09, -0.75, 0.8, 0, bb);
  bx(M.steelDark, 0.09, 1.6, 0.09, 0.75, 0.8, 0, bb);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.85 }));
  board.position.set(0, 1.15, 0.05);
  bb.add(board);
}

function buildGate(ctx: SceneCtx): void {
  const { scene, M, P, sys, cfg } = ctx;
  const GY = cfg.ground;
  const GATE = cfg.gate;
  const py = (GATE.x0 + GATE.x1) / 2;
  for (const px of [GATE.x0 - 0.4, GATE.x1 + 0.4]) {
    P.concDark.add(px, GY + 1.35, 16.6, 0.85, 2.7, 0.85);
    P.blue.add(px, GY + 2.82, 16.6, 1.0, 0.24, 1.0);
    P.beacon.add(px, GY + 3.05, 16.6, 0.16, 0.16, 0.16);
  }
  P.blue.add(py, GY + 3.0, 16.6, GATE.x1 - GATE.x0 + 2.2, 0.7, 0.5);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 0.7), new THREE.MeshStandardMaterial({ map: gateSignTexture(), roughness: 0.7 }));
  sign.position.set(py, GY + 3.0, 16.33);
  scene.add(sign);
  const sign2 = sign.clone();
  sign2.rotation.y = Math.PI;
  sign2.position.z = 16.87;
  scene.add(sign2);

  const post = new THREE.Group();
  post.position.set(5.4, GY, 14.9);
  scene.add(post);
  cy(M.steelDark, 0.16, 1.1, 0, 0.55, 0, post);
  bx(M.steelDark, 0.5, 0.4, 0.4, 0, 1.25, 0, post);
  const arm = new THREE.Group();
  arm.position.set(0, 1.32, 0);
  post.add(arm);
  for (let i = 0; i < 7; i++) {
    const seg = bx(i % 2 ? M.red : M.white, 0.95, 0.1, 0.1, 0.55 + i * 0.92, 0, 0, arm);
    seg.castShadow = true;
  }
  sys.barrierArm = arm;

  for (let i = 0; i < 4; i++) {
    addCone(ctx, 6.6 + i * 1.5, 14.0);
    addCone(ctx, 6.6 + i * 1.5, 13.2);
  }
  for (let i = 0; i < 5; i++) P.yellow.add(7 + i * 1.2, GY + 0.06, 15.6, 1.0, 0.12, 0.5);
}

export function addCone(ctx: SceneCtx, x: number, z: number): void {
  const GY = ctx.cfg.ground;
  ctx.P.coneBase.add(x, GY + 0.04, z, 0.4, 0.08, 0.4);
  ctx.P.cone.add(x, GY + 0.06, z, 0.34, 0.52, 0.34);
}

function buildLamps(ctx: SceneCtx): void {
  const { scene, P, sys } = ctx;
  const GY = ctx.cfg.ground;
  const lampGlowMat = new THREE.SpriteMaterial({
    map: radialTexture(), color: 0xffd9a0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const poolGlowMat = new THREE.MeshBasicMaterial({
    map: radialTexture(), color: 0xffcf90, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  sys.lampGlowMat = lampGlowMat;
  sys.poolGlowMat = poolGlowMat;
  const lamp = (lx: number, lz: number) => {
    P.pole.add(lx, GY + 1.7, lz, 0.09, 3.4, 0.09);
    P.pole.add(lx + 0.45, GY + 3.35, lz, 0.9, 0.07, 0.07);
    P.lampOn.add(lx + 0.9, GY + 3.22, lz, 0.5, 0.14, 0.3);
    const sp = new THREE.Sprite(lampGlowMat);
    sp.position.set(lx + 0.9, GY + 3.2, lz);
    sp.scale.set(2.6, 2.6, 1);
    scene.add(sp);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), poolGlowMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(lx + 0.9, GY + 0.05, lz);
    scene.add(pool);
  };
  lamp(-15.4, -9.8);
  lamp(15.2, -9.8);
  lamp(15.2, 9.8);
  lamp(-15.4, 9.8);
  lamp(11.4, 12.4);
}

function buildPolesWires(ctx: SceneCtx): void {
  const { scene, M, P } = ctx;
  const GY = ctx.cfg.ground;
  const pxs = [-22, -13, -3, 7];
  const tops: Array<[number, number, number]> = [];
  pxs.forEach((px) => {
    P.pole.add(px, GY + 2.3, -15.8, 0.13, 4.6, 0.13);
    P.steelDark.add(px, GY + 4.35, -15.8, 1.5, 0.09, 0.09);
    for (const dx of [-0.6, 0, 0.6]) P.white.add(px + dx, GY + 4.5, -15.8, 0.08, 0.14, 0.08);
    tops.push([px, GY + 4.45, -15.8]);
  });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x14161a });
  for (let i = 0; i < tops.length - 1; i++) {
    for (const dz of [-0.6, 0, 0.6]) {
      const a = new THREE.Vector3(tops[i][0], tops[i][1], tops[i][2] + dz);
      const b = new THREE.Vector3(tops[i + 1][0], tops[i + 1][1], tops[i + 1][2] + dz);
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= 0.55;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(14)), wireMat));
    }
  }
  const drop = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-13, GY + 4.2, -15.8),
    new THREE.Vector3(-15, GY + 3.2, 0),
    new THREE.Vector3(-16, GY + 2.5, 12.9),
  );
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(drop.getPoints(16)), wireMat));

  cy(M.plank, 0.5, 0.5, -12.3, GY + 0.5, -14.5, scene).rotation.z = Math.PI / 2;
  cy(M.plank, 0.14, 0.6, -12.3, GY + 0.5, -14.5, scene).rotation.z = Math.PI / 2;
  cy(M.plank, 0.5, 0.5, -11.3, GY + 0.5, -14.5, scene).rotation.z = Math.PI / 2;
  cy(M.plank, 0.14, 0.6, -11.3, GY + 0.5, -14.5, scene).rotation.z = Math.PI / 2;
  bx(M.steelDark, 0.7, 1.0, 0.3, -3, GY + 1.6, -15.4, scene);
  P.red.add(-3, GY + 2.16, -15.4, 0.1, 0.14, 0.06);

  for (let i = 0; i < 6; i++) cy(M.steel, 0.07, 2.2, -8 + i * 2.2, GY + 0.08, 8.8, scene, 'x');
  const hose = new THREE.LineBasicMaterial({ color: 0x2a6db5 });
  const hpts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    hpts.push(new THREE.Vector3(-4 + 6 * t + 8, GY + 0.06, 8.8 + Math.sin(t * 9) * 0.35));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hpts), hose));
  const valve = cy(M.red, 0.16, 0.1, 9.2, GY + 0.25, 8.8, scene);
  valve.scale.set(0.32, 0.1, 0.32);
}

function buildDetails(ctx: SceneCtx): void {
  const { scene, M, P, sys } = ctx;
  const GY = ctx.cfg.ground;
  const conePos: Array<[number, number]> = [
    [6.2, 12.8], [11.8, 12.8], [12.6, 9.2], [13.4, 4.2], [-14.6, 8.2], [-11.2, 8.6],
    [15.8, -9.0], [17.4, -9.0], [12.0, 1.0], [11.2, -3.4], [-6.4, -8.4], [-2.6, -8.4],
    [9.0, -8.6], [2.4, 6.4],
  ];
  conePos.forEach((p) => addCone(ctx, p[0], p[1]));

  const tapeSpan = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ry = Math.atan2(-(z1 - z0), x1 - x0);
    P.red.add((x0 + x1) / 2, GY + 0.72, (z0 + z1) / 2, len, 0.05, 0.02, ry, 0, Math.sin(ry) * 0.06);
    P.white.add((x0 + x1) / 2, GY + 0.64, (z0 + z1) / 2, len, 0.05, 0.02, ry);
  };
  tapeSpan(6.2, 12.8, 11.8, 12.8);
  tapeSpan(12.6, 9.2, 13.4, 4.2);
  tapeSpan(-14.6, 8.2, -11.2, 8.6);

  const shovel = (sx: number, sz: number, ry: number) => {
    const st = cy(M.plank, 0.04, 1.3, sx, GY + 0.62, sz, scene);
    st.rotation.z = 0.28;
    st.rotation.y = ry;
    const bl = bx(M.steel, 0.26, 0.34, 0.04, 0, 0, 0, scene);
    bl.position.set(sx + 0.36, GY + 0.12, sz);
  };
  shovel(-13.4, -10.6, 0.4);
  shovel(-15.9, 6.6, 1.2);

  bx(M.red, 0.8, 0.4, 0.45, -14.6, GY + 0.25, -11.3, scene);
  bx(M.red, 0.6, 0.08, 0.3, -14.6, GY + 0.49, -11.3, scene);

  const fog = new THREE.Group();
  fog.position.set(13.0, GY, -4.6);
  scene.add(fog);
  bx(M.orange, 0.9, 0.5, 0.7, 0, 0.45, 0, fog);
  cy(M.steel, 0.22, 1.1, 0, 1.3, 0, fog).rotation.z = -0.9;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture(), color: 0xcfe8ff, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spr.position.set(0.9, 1.7, 0);
  spr.scale.set(2.4, 2.4, 1);
  fog.add(spr);

  buildFlags(ctx);

  makeSign(ctx, 'dig', -14.6, 8.9, 0.3);
  makeSign(ctx, 'helmet', 12.9, 15.3, -0.5);
  makeSign(ctx, 'speed5', 15.9, 5.1, 0.4);
  makeSign(ctx, 'fire', -13.4, -9.7, 0.2);
  makeSign(ctx, 'shock', -4.4, -14.9, 0.5);
  makeSign(ctx, 'dig', -16.4, -1.6, 1.35);
}

function makeSign(ctx: SceneCtx, kind: SignKind, x: number, z: number, ry: number): void {
  const { scene, M } = ctx;
  const grp = new THREE.Group();
  grp.position.set(x, ctx.cfg.ground, z);
  grp.rotation.y = ry;
  scene.add(grp);
  cy(M.steelDark, 0.05, 1.5, 0, 0.75, 0, grp);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshStandardMaterial({ map: signTexture(kind), roughness: 0.8 }));
  bd.position.y = 1.55;
  grp.add(bd);
  const bd2 = bd.clone();
  bd2.rotation.y = Math.PI;
  bd2.position.z = -0.02;
  grp.add(bd2);
}

function buildFlags(ctx: SceneCtx): void {
  const { scene, sys } = ctx;
  const GY = ctx.cfg.ground;
  const geo = new THREE.PlaneGeometry(0.62, 0.4, 4, 2);
  geo.translate(0.31, 0, 0);
  const flagMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aCol; attribute float aPhase;
      uniform float uTime; varying vec3 vCol;
      void main(){
        vec3 p=position;
        float w=uv.x;
        p.z += sin(uTime*5.0+aPhase+w*4.5)*0.1*w;
        p.y += sin(uTime*5.0+aPhase)*0.02;
        vCol = aCol*(0.82+0.18*sin(w*3.0+aPhase));
        gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);
      }`,
    fragmentShader: `varying vec3 vCol; void main(){ gl_FragColor=vec4(vCol,1.0); }`,
  });
  const N = 12;
  const im = new THREE.InstancedMesh(geo, flagMat, N);
  const cols = [0xd8402f, 0xf2c231, 0x2e6cb5, 0x3fae5a];
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  const aCol = new Float32Array(N * 3);
  const aPhase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = -20 + i * 2.9;
    d.position.set(x, GY + 4.12, -15.8);
    d.rotation.y = (srand() - 0.5) * 0.4;
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    col.set(cols[i % 4]);
    aCol[i * 3] = col.r;
    aCol[i * 3 + 1] = col.g;
    aCol[i * 3 + 2] = col.b;
    aPhase[i] = srand() * TAU;
  }
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(aPhase, 1));
  im.frustumCulled = false;
  scene.add(im);
  sys.flagMat = flagMat;
  sys.flagObjects.push(im);

  const strMat = new THREE.LineBasicMaterial({ color: 0x222222 });
  const spts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    spts.push(new THREE.Vector3(-20.6 + 33 * t, GY + 4.32 - Math.sin(t * Math.PI) * 0.25, -15.8));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spts), strMat);
  scene.add(line);
  sys.flagObjects.push(line);
}
