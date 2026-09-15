import * as THREE from 'three';
import { bx, cy } from './voxel';
import {
  blueprintTexture, tapeTexture, warningSignTexture, consoleLabelTexture,
} from './props/Textures';
import { radialTexture } from './canvas';
import type { SceneCtx } from './types';

export interface ConsoleGlue {
  knobMeshes: THREE.Mesh[];
  /** 由交互模块在拖拽旋钮时调用：写入 store 并同步旋钮外观 */
  applyKnob: (i: number, t: number) => void;
}

/** 室内房间 + 桌面 + 桌面道具 + 实体旋钮控制台 */
export function buildEnvironment(ctx: SceneCtx): ConsoleGlue {
  const { scene, cfg, M } = ctx;
  const GY = cfg.ground;

  // 房间（内表面暗盒）+ 地毯
  const roomMat = new THREE.MeshLambertMaterial({ color: 0x232830, side: THREE.BackSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(132, 40, 104), roomMat);
  room.position.set(0, 11, 4);
  scene.add(room);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(140, 112), new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 1 }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = -9.05;
  carpet.receiveShadow = true;
  scene.add(carpet);

  // 木质桌面
  const desk = new THREE.Mesh(new THREE.BoxGeometry(cfg.desk.w, cfg.desk.h, cfg.desk.d), M.wood);
  desk.position.y = -cfg.desk.h / 2;
  desk.receiveShadow = true;
  desk.castShadow = true;
  scene.add(desk);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(cfg.desk.w + 0.5, 0.14, cfg.desk.d + 0.5), new THREE.MeshStandardMaterial({ color: 0x2e2013, roughness: 0.75 }));
  edge.position.y = -0.07;
  edge.receiveShadow = true;
  scene.add(edge);
  const legG = new THREE.BoxGeometry(2.2, 7.4, 2.2);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 0.82 });
  for (const p of [[-34, -19], [34, -19], [-34, 19], [34, 19]] as const) {
    const leg = new THREE.Mesh(legG, legMat);
    leg.castShadow = true;
    leg.position.set(p[0], -cfg.desk.h - 3.7, p[1]);
    scene.add(leg);
  }

  buildDeskProps(ctx);
  return buildConsole(ctx);
}

function buildDeskProps(ctx: SceneCtx): void {
  const { scene, M } = ctx;
  // 蓝图 ×2
  const bpMat = new THREE.MeshStandardMaterial({ map: blueprintTexture(), roughness: 0.9 });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.5), bpMat);
  bp.rotation.x = -Math.PI / 2;
  bp.rotation.z = 0.3;
  bp.position.set(-20.4, 0.03, 19.5);
  bp.receiveShadow = true;
  scene.add(bp);
  const bp2 = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.1), bpMat);
  bp2.rotation.x = -Math.PI / 2;
  bp2.rotation.z = -0.5;
  bp2.position.set(-17.6, 0.02, 20.4);
  bp2.receiveShadow = true;
  scene.add(bp2);

  // 钢卷尺
  const tape = new THREE.Group();
  tape.position.set(17.6, 0, 19.4);
  tape.rotation.y = -0.4;
  scene.add(tape);
  cy(new THREE.MeshStandardMaterial({ color: 0xf2c231, roughness: 0.5, metalness: 0.4 }), 0.55, 0.28, 0, 0.14, 0, tape);
  cy(M.black, 0.57, 0.06, 0, 0.29, 0, tape);
  cy(M.black, 0.57, 0.06, 0, 0.01, 0, tape);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3), new THREE.MeshStandardMaterial({ map: tapeTexture(), roughness: 0.7 }));
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(1.5, 0.035, 0);
  tape.add(strip);
  bx(M.steel, 0.12, 0.05, 0.3, 2.7, 0.03, 0, tape);
  bx(M.white, 0.34, 0.02, 0.3, 0, 0.305, 0, tape);

  // 安全帽（体素堆叠）
  const helm = new THREE.Group();
  helm.position.set(13.2, 0, 19.6);
  helm.rotation.y = 0.7;
  scene.add(helm);
  const hm = new THREE.MeshStandardMaterial({ color: 0xf2c231, roughness: 0.55 });
  bx(hm, 0.9, 0.1, 0.9, 0, 0.05, 0, helm);
  bx(hm, 0.78, 0.12, 0.78, 0, 0.15, 0, helm);
  bx(hm, 0.66, 0.12, 0.66, 0, 0.26, 0, helm);
  bx(hm, 0.46, 0.12, 0.46, 0, 0.37, 0, helm);
  bx(hm, 0.24, 0.1, 0.24, 0, 0.47, 0, helm);
  bx(hm, 0.95, 0.05, 0.3, 0, 0.1, 0.42, helm);

  // 水平仪
  const lv = new THREE.Group();
  lv.position.set(-12.2, 0, 20.3);
  lv.rotation.y = 0.12;
  scene.add(lv);
  bx(M.steel, 4.6, 0.32, 0.5, 0, 0.16, 0, lv);
  bx(M.black, 4.6, 0.06, 0.52, 0, 0.34, 0, lv);
  for (const px of [-1.6, 0, 1.6]) {
    bx(M.glass, 0.5, 0.16, 0.3, px, 0.2, 0, lv);
    bx(new THREE.MeshStandardMaterial({ color: 0x7de83a, roughness: 0.3 }), 0.3, 0.06, 0.16, px, 0.14, 0, lv);
  }

  // 铅笔
  const pen = new THREE.Group();
  pen.position.set(-15.3, 0, 18.7);
  pen.rotation.y = 1.1;
  scene.add(pen);
  cy(new THREE.MeshStandardMaterial({ color: 0xe8b62e, roughness: 0.6 }), 0.07, 2.2, 0, 0.07, 0, pen).rotation.z = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 0.8 }));
  tip.rotation.z = -Math.PI / 2;
  tip.position.set(1.2, 0.07, 0);
  pen.add(tip);
  cy(new THREE.MeshStandardMaterial({ color: 0xe88a8a, roughness: 0.7 }), 0.075, 0.16, -1.18, 0.07, 0, pen).rotation.z = Math.PI / 2;

  // 小型警示牌（桌面）
  const ds = new THREE.Group();
  ds.position.set(20.9, 0, 19.2);
  ds.rotation.y = -0.4;
  scene.add(ds);
  bx(M.black, 0.9, 0.05, 0.7, 0, 0.03, 0, ds);
  const dsp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: warningSignTexture(), roughness: 0.8 }));
  dsp.position.set(0, 0.5, 0);
  ds.add(dsp);
  const dsp2 = dsp.clone();
  dsp2.rotation.y = Math.PI;
  dsp2.position.z = -0.01;
  ds.add(dsp2);
  bx(M.black, 0.08, 0.5, 0.08, -0.36, 0.25, 0, ds);
  bx(M.black, 0.08, 0.5, 0.08, 0.36, 0.25, 0, ds);
}

const knobValueOf = (ctx: SceneCtx, i: number): number => {
  const store = ctx.store;
  const n = i === 0 ? store.config.presets.speed.length : i === 1 ? store.config.presets.flow.length : store.config.presets.dust.length;
  const cur = i === 0 ? store.speedIdx : i === 1 ? store.flowIdx : store.dustIdx;
  return cur / (n - 1);
};

/** 三个实体控制旋钮 SPEED / TIME / DUST（与 store 双向同步） */
function buildConsole(ctx: SceneCtx): ConsoleGlue {
  const { scene, M, store } = ctx;
  const g = new THREE.Group();
  g.position.set(0, 0, 20.6);
  scene.add(g);
  bx(new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.55, metalness: 0.5 }), 17, 0.34, 2.9, 0, 0.27, 0, g);
  bx(new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.5, metalness: 0.6 }), 17.2, 0.08, 3.1, 0, 0.1, 0, g);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(17, 2.66), new THREE.MeshStandardMaterial({ map: consoleLabelTexture(), roughness: 0.5, metalness: 0.4 }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(0, 0.445, 0.1);
  g.add(top);

  const knobMeshes: THREE.Mesh[] = [];
  const knobs: Array<{ knob: THREE.Group }> = [];
  const knobLEDs: THREE.Mesh[][] = [];
  const kx = [-5.2, 0, 5.2];
  for (let i = 0; i < 3; i++) {
    const kg = new THREE.Group();
    kg.position.set(kx[i], 0.45, 0.15);
    g.add(kg);
    bx(M.black, 1.7, 0.05, 1.7, 0, 0.02, 0, kg);
    cy(new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.5, metalness: 0.6 }), 0.82, 0.2, 0, 0.13, 0, kg);
    const knob = new THREE.Group();
    knob.position.y = 0.28;
    kg.add(knob);
    cy(new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.42, metalness: 0.7 }), 0.55, 0.42, 0, 0.21, 0, knob);
    cy(new THREE.MeshStandardMaterial({ color: 0x4a525c, roughness: 0.4, metalness: 0.7 }), 0.58, 0.07, 0, 0.4, 0, knob);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      bx(M.steelDark, 0.06, 0.4, 0.06, Math.cos(a) * 0.55, 0.21, Math.sin(a) * 0.55, knob);
    }
    bx(new THREE.MeshStandardMaterial({ color: 0x10331f, emissive: 0x54ff9a, emissiveIntensity: 1.8 }), 0.1, 0.3, 0.12, 0, 0.44, 0.4, knob);
    const leds: THREE.Mesh[] = [];
    for (let k = 0; k < 5; k++) leds.push(bx(M.ledOff, 0.22, 0.06, 0.12, (k - 2) * 0.34, 0.03, 1.05, kg));
    knobLEDs.push(leds);
    kg.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.userData.knob = i;
        knobMeshes.push(o as THREE.Mesh);
      }
    });
    knobs.push({ knob });
  }

  const paintKnob = (i: number): void => {
    const storeN = i === 0 ? store.config.presets.speed.length : i === 1 ? store.config.presets.flow.length : store.config.presets.dust.length;
    const idx = i === 0 ? store.speedIdx : i === 1 ? store.flowIdx : store.dustIdx;
    const t = idx / (storeN - 1);
    knobs[i].knob.rotation.y = 2.35 - 4.7 * t;
    knobLEDs[i].forEach((led, li) => {
      led.material = li <= idx ? M.ledOn : M.ledOff;
    });
  };

  const applyKnob = (i: number, t: number): void => {
    const n = i === 0 ? store.config.presets.speed.length : i === 1 ? store.config.presets.flow.length : store.config.presets.dust.length;
    const idx = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
    if (i === 0) store.speedIdx = idx;
    else if (i === 1) store.flowIdx = idx;
    else store.dustIdx = idx;
    paintKnob(i);
  };

  for (let i = 0; i < 3; i++) paintKnob(i);
  ctx.sys.consoleKnobMeshes = knobMeshes;
  ctx.sys.applyKnob = applyKnob;
  void knobValueOf;
  return { knobMeshes, applyKnob };
}

export { radialTexture };
