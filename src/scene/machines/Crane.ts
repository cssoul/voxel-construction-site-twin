import * as THREE from 'three';
import { bx, bxr, cy, G } from '../voxel';
import { clamp, clamp01, ease, lerp, TAU } from '../random';
import type { SceneCtx, CraneUnit, CraneTask, CraneSeqItem } from '../types';
import type { CraneCfg } from '../../data/types';

function mkEnd(cfg: CraneCfg, groundSlewY: number, x: number, z: number, y: number): { φ: number; r: number; len: number } {
  let φ = Math.atan2(z - cfg.z, x - cfg.x);
  if (cfg.yawLim < 10) φ = clamp(φ, -cfg.yawLim, cfg.yawLim);
  return {
    φ,
    r: clamp(Math.hypot(x - cfg.x, z - cfg.z), cfg.trolleyMin, cfg.trolleyMax),
    len: groundSlewY - 0.8 - y,
  };
}

/** 塔吊（回转/变幅/钢丝绳/吊运状态机） */
export function buildCrane(ctx: SceneCtx, cfg: CraneCfg, cruiseClearY: number, tasks: CraneTask[], loadKinds: string[], entityId: string): void {
  const { scene, cfg: site, M, sys } = ctx;
  const GY = site.ground;
  const g = new THREE.Group();
  g.position.set(cfg.x, GY, cfg.z);
  scene.add(g);
  bx(M.concDark, 2.4, 0.4, 2.4, 0, 0.2, 0, g);
  bx(M.yellow, 1.3, 0.25, 1.3, 0, 0.5, 0, g);
  const H = cfg.h;
  const cell = 1.0;
  for (const dx of [-0.45, 0.45]) {
    for (const dz of [-0.45, 0.45]) bx(M.yellow, 0.1, H, 0.1, dx, H / 2 + 0.6, dz, g);
  }
  for (let y = 0.6; y < H + 0.5; y += cell) {
    const s = Math.round((y - 0.6) / cell) % 2 ? 0.72 : -0.72;
    bx(M.yellow, 1.0, 0.07, 0.07, 0, y + cell / 2, -0.45, g);
    bx(M.yellow, 1.0, 0.07, 0.07, 0, y + cell / 2, 0.45, g);
    bx(M.yellow, 0.07, 0.07, 1.0, -0.45, y + cell / 2, 0, g);
    bx(M.yellow, 0.07, 0.07, 1.0, 0.45, y + cell / 2, 0, g);
    bxr(M.yellow, 1.25, 0.055, 0.055, 0, y + cell / 2, -0.45, g, 0, 0, s);
    bxr(M.yellow, 1.25, 0.055, 0.055, 0, y + cell / 2, 0.45, g, 0, 0, -s);
  }
  const slew = new THREE.Group();
  slew.position.y = H + 0.6;
  g.add(slew);
  bx(M.yellow, 0.6, 1.0, 0.6, 0, 0.5, 0, slew);
  bx(M.yellow, 0.62, 0.62, 0.7, 0, -0.62, -0.78, slew);
  bx(M.cabGlass, 0.5, 0.4, 0.06, 0, -0.66, -0.41, slew);
  bx(M.beacon, 0.1, 0.12, 0.1, 0, -0.26, -0.78, slew);
  const jibL = cfg.jib;
  const cbL = 4.4;
  bx(M.yellow, jibL, 0.09, 0.09, 0.5 + jibL / 2, 0.15, -0.4, slew);
  bx(M.yellow, jibL, 0.09, 0.09, 0.5 + jibL / 2, 0.15, 0.4, slew);
  bx(M.yellow, jibL, 0.09, 0.09, 0.5 + jibL / 2, 0.85, 0, slew);
  for (let x = 0; x < jibL - 0.4; x += 1.05) {
    const s = Math.round(x / 1.05) % 2 ? 0.62 : -0.62;
    bxr(M.yellow, 1.12, 0.05, 0.05, 1.05 + x, 0.5, -0.4, slew, 0, 0, s);
    bxr(M.yellow, 1.12, 0.05, 0.05, 1.05 + x, 0.5, 0.4, slew, 0, 0, -s);
    bxr(M.yellow, 0.9, 0.05, 0.05, 1.05 + x, 0.5, 0, slew, 0.62, 0, 0);
  }
  bx(M.yellow, cbL, 0.09, 0.09, -cbL / 2 - 0.35, 0.15, -0.4, slew);
  bx(M.yellow, cbL, 0.09, 0.09, -cbL / 2 - 0.35, 0.15, 0.4, slew);
  bx(M.yellow, cbL, 0.09, 0.09, -cbL / 2 - 0.35, 0.62, 0, slew);
  bx(M.concDark, 0.7, 1.05, 1.5, -cbL + 0.25, -0.3, 0, slew);
  bx(M.concDark, 0.45, 0.85, 1.3, -cbL + 0.95, -0.22, 0, slew);
  cy(M.steelDark, 0.2, 1.1, -1.7, 0.1, 0, slew, 'x');
  cy(M.steelDark, 0.12, 0.9, -2.5, 0.1, 0, slew, 'x');
  bx(M.steelDark, 0.5, 0.7, 0.6, -3.4, 0.35, 0, slew);
  const pend = (x1: number, y1: number, x2: number, y2: number) => {
    const l = Math.hypot(x2 - x1, y2 - y1);
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (const dz of [-0.3, 0.3]) bxr(M.steelDark, l, 0.035, 0.035, (x1 + x2) / 2, (y1 + y2) / 2, dz, slew, 0, 0, a);
  };
  pend(0.1, 1.15, 0.5 + jibL * 0.62, 0.9);
  pend(0.1, 1.15, -cbL * 0.62, 0.66);
  bx(M.beacon, 0.13, 0.13, 0.13, 0.5 + jibL - 0.25, 1.02, 0, slew);
  bx(M.beacon, 0.12, 0.12, 0.12, 0, 1.08, 0, slew);

  const trolley = new THREE.Group();
  slew.add(trolley);
  bx(M.orange, 0.42, 0.14, 0.5, 0, -0.08, 0, trolley);
  bx(M.steelDark, 0.52, 0.08, 0.6, 0, -0.17, 0, trolley);
  const cable = new THREE.Mesh(G.cable, M.black);
  cable.position.y = -0.16;
  cable.castShadow = false;
  trolley.add(cable);
  const hookG = new THREE.Group();
  trolley.add(hookG);
  bx(M.steelDark, 0.16, 0.26, 0.16, 0, 0, 0, hookG);
  bx(M.black, 0.09, 0.13, 0.09, 0, -0.19, 0, hookG);
  const loadG = new THREE.Group();
  loadG.position.y = -0.42;
  hookG.add(loadG);

  const loads: Record<string, THREE.Group> = {};
  loadKinds.forEach((kind) => {
    const lg = new THREE.Group();
    lg.visible = false;
    loadG.add(lg);
    loads[kind] = lg;
    if (kind === 'rebar') {
      for (let i = 0; i < 8; i++) cy(M.rust, 0.045, 3.2, 0, 0.05, -0.32 + i * 0.09, lg, 'x');
      bx(M.steelDark, 0.12, 0.1, 0.8, -1.1, 0.05, 0, lg);
      bx(M.steelDark, 0.12, 0.1, 0.8, 1.1, 0.05, 0, lg);
    } else if (kind === 'skip') {
      bx(M.yellow, 1.0, 0.55, 1.0, 0, 0.42, 0, lg);
      const fn = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.42, 4), M.yellow);
      fn.rotation.x = Math.PI;
      fn.rotation.y = Math.PI / 4;
      fn.position.y = 0.02;
      fn.castShadow = true;
      lg.add(fn);
      bx(M.steelDark, 1.06, 0.08, 1.06, 0, 0.72, 0, lg);
    } else if (kind === 'blocks') {
      bx(M.plank, 1.15, 0.1, 1.15, 0, 0.05, 0, lg);
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 2; b++) {
          for (let c = 0; c < 2; c++) bx(M.concDark, 0.34, 0.34, 0.34, -0.36 + a * 0.36, 0.27 + c * 0.36, -0.18 + b * 0.36, lg);
        }
      }
    } else if (kind === 'pipes') {
      for (let i = 0; i < 6; i++) cy(M.steel, 0.09, 3.0, 0, 0.09 + i * 0.2, -0.3 + i * 0.05, lg, 'x');
    }
  });

  const groundSlewY = GY + 0.6 + H;
  const mk = (t: CraneTask, isPick: boolean) =>
    mkEnd(cfg, groundSlewY, isPick ? t.px : t.dx, isPick ? t.pz : t.dz, isPick ? t.py : t.dy);
  const cruise = groundSlewY - 0.8 - cruiseClearY;
  const seq: CraneSeqItem[] = [];
  tasks.forEach((t) => {
    const p = mk(t, true);
    const d = mk(t, false);
    seq.push({ do: 'slew', φ: p.φ, r: p.r });
    seq.push({ do: 'cable', len: p.len });
    seq.push({ do: 'grab', dur: 1.0, load: t.load });
    seq.push({ do: 'cable', len: cruise });
    seq.push({ do: 'slew', φ: d.φ, r: d.r });
    seq.push({ do: 'cable', len: d.len });
    seq.push({ do: 'drop', dur: 1.0, load: t.load, dust: 1 });
    seq.push({ do: 'cable', len: cruise });
  });

  const unit: CraneUnit = {
    g, slew, trolley, cable, hookG, loads, seq, i: 0, pt: 0,
    φ: 0, r: 3, len: 4, vel: 0, prevφ: 0, tilt: 0,
    cfg: { ...cfg },
    entityId,
    stateLabel: '待机',
  };
  initCraneItem(unit);
  sys.cranes.push(unit);
}

function initCraneItem(cr: CraneUnit): void {
  const it = cr.seq[cr.i];
  if (it.do === 'slew') {
    it.φ0 = cr.φ;
    it.r0 = cr.r;
    if (cr.cfg.yawLim < 10) {
      let tgt = it.φ ?? 0;
      while (tgt - it.φ0 > Math.PI) tgt -= TAU;
      while (tgt - it.φ0 < -Math.PI) tgt += TAU;
      it.φ = clamp(tgt, -cr.cfg.yawLim, cr.cfg.yawLim);
    } else {
      let d = (it.φ ?? 0) - it.φ0;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      it.φ = it.φ0 + d;
    }
    it.dur = Math.abs((it.φ ?? 0) - it.φ0) / 0.3 + 0.5;
  } else if (it.do === 'cable') {
    it.l0 = cr.len;
    if (it.r === undefined) it.r = cr.r;
    it.dur = Math.abs((it.len ?? cr.len) - it.l0) / 2.4 + 0.35;
  } else {
    it.dur = it.dur ?? 1;
    it.fired = false;
  }
}

const PHASE_LABEL: Record<string, string> = {
  slew: '回转/变幅',
  cable: '升降吊钩',
  grab: '吊起物料',
  drop: '吊放物料',
};

const TMP_V = new THREE.Vector3();

export function updateCranes(ctx: SceneCtx, dt: number): void {
  const mult = ctx.store.config.presets.speed[ctx.store.speedIdx] ?? 1;
  for (const cr of ctx.sys.cranes) {
    cr.pt += dt * mult;
    const it = cr.seq[cr.i];
    const dur = it.dur ?? 1;
    const k = ease(clamp01(cr.pt / dur));
    cr.stateLabel = PHASE_LABEL[it.do] ?? '作业中';
    if (it.do === 'slew') {
      cr.φ = lerp(it.φ0 ?? cr.φ, it.φ ?? cr.φ, k);
      cr.r = lerp(it.r0 ?? cr.r, it.r ?? cr.r, k);
      cr.slew.rotation.y = -cr.φ;
      cr.trolley.position.x = cr.r;
      cr.vel = (cr.φ - cr.prevφ) / Math.max(dt, 1e-4);
      cr.prevφ = cr.φ;
    } else if (it.do === 'cable') {
      cr.len = lerp(it.l0 ?? cr.len, it.len ?? cr.len, k);
      cr.r = lerp(cr.r, it.r ?? cr.r, Math.min(1, dt * 1.5));
      cr.trolley.position.x = cr.r;
      cr.vel *= 0.9;
    } else {
      cr.vel *= 0.9;
      if (!it.fired && cr.pt >= dur * 0.5) {
        it.fired = true;
        Object.values(cr.loads).forEach((l) => (l.visible = false));
        if (it.do === 'grab') {
          const lg = cr.loads[it.load ?? ''];
          if (lg) lg.visible = true;
        }
        if (it.do === 'drop') {
          cr.hookG.getWorldPosition(TMP_V);
          ctx.twins.spawnBurst(TMP_V.x, TMP_V.y - 0.4, TMP_V.z, 10, 0.3);
        }
      }
    }
    cr.cable.scale.y = Math.max(0.3, cr.len);
    cr.hookG.position.y = -0.16 - cr.len;
    cr.tilt += (clamp(-cr.vel * 0.18, -0.09, 0.09) - cr.tilt) * Math.min(1, dt * 4);
    cr.hookG.rotation.x = cr.tilt;
    if (cr.pt >= dur) {
      cr.i = (cr.i + 1) % cr.seq.length;
      cr.pt = 0;
      initCraneItem(cr);
    }
  }
}
