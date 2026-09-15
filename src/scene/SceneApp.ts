import * as THREE from 'three';
import { InstPool, G } from './voxel';
import { createMaterials, type Materials } from './materials';
import { createStudio, type StudioLights } from './Studio';
import { resetSeed } from './random';
import { createSystems, type SceneCtx } from './types';
import { TwinManager } from './twin/TwinManager';
import { buildSandbox } from './Sandbox';
import { buildEnvironment } from './Environment';
import { buildBuilding } from './buildings/Building';
import { buildZones, makeMound } from './props/Zones';
import { buildCrane, updateCranes } from './machines/Crane';
import { buildExcavator, updateDigs, digProgress } from './machines/Excavator';
import { buildTruck, buildMixer, buildLoader, updateVehicles, truckTotalLength, vehicleProgress } from './machines/GroundVehicle';
import { buildWorkers, WorkerSystem } from './actors/Workers';
import { makeDust, type DustSystem } from './fx/Dust';
import { makeRain, type RainSystem } from './fx/Rain';
import { makeBurst } from './fx/Burst';
import { DayNight } from './DayNight';
import { WeatherSim } from './Weather';
import { CameraController } from './CameraController';
import { InteractionManager } from './InteractionManager';
import { Performance } from './Performance';
import { twinsBridge } from './twin/twinsBridge';
import { clamp01 } from './random';
import { speedMult } from '../composables/useTwinStore';
import type { TwinLayers, TwinStore } from '../composables/useTwinStore';

function createPools(M: Materials): Record<string, InstPool> {
  const P: Record<string, InstPool> = {};
  const box = (mat: THREE.Material, opts?: { shadow?: boolean; receive?: boolean }) => new InstPool(G.box, mat, opts);
  P.concrete = box(M.concrete);
  P.concDark = box(M.concDark);
  P.cement = box(M.cement);
  P.soil = box(M.soil);
  P.dirtA = box(M.dirtA);
  P.dirtB = box(M.dirtB);
  P.dirtC = box(M.dirtC);
  P.dirtFresh = box(M.dirtFresh);
  P.sand = box(M.sand);
  P.gravel = box(M.gravel);
  P.brick = box(M.brick);
  P.bag = box(M.bag);
  P.plank = box(M.plank);
  P.white = box(M.white);
  P.blue = box(M.blue);
  P.blueD = box(M.blueD);
  P.red = box(M.red);
  P.yellow = box(M.yellow);
  P.orange = box(M.orange);
  P.steel = box(M.steel);
  P.steelDark = box(M.steelDark);
  P.black = box(M.black);
  P.rust = box(M.rust);
  P.glass = box(M.glass, { shadow: false });
  P.beacon = box(M.beacon, { shadow: false });
  P.lampOn = box(M.lampOn, { shadow: false });
  P.rod = new InstPool(G.cyl6, M.rust);
  P.pipe = new InstPool(G.cyl, M.steel);
  P.pole = new InstPool(G.cyl, M.steelDark);
  P.cone = new InstPool(G.cone4, M.orange);
  P.coneBase = box(M.black);
  return P;
}

function buildStaticPools(ctx: SceneCtx): void {
  const { P, scene } = ctx;
  const entries = Object.entries(P);
  for (const [name, pool] of entries) pool.build(`pool-${name}`, scene);
}

/** 场景总装：渲染器/相机/灯光/全部装配/动画循环 */
export class SceneApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private ctx: SceneCtx;
  private lights: StudioLights;
  private workers: WorkerSystem;
  private dust: DustSystem;
  private rain: RainSystem;
  private burst: ReturnType<typeof makeBurst>;
  private dayNight: DayNight;
  private weather: WeatherSim;
  private cameraCtrl: CameraController;
  private interaction: InteractionManager;
  private perf = new Performance();
  private layerGroups: Record<string, THREE.Group> = {};
  private raf = 0;
  private disposed = false;
  private readyFired = false;
  private clockAcc = 0;

  constructor(private container: HTMLElement, private store: TwinStore) {
    // 渲染器 / 场景 / 相机
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.13;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x0b1020);
    this.scene.fog = new THREE.FogExp2(0x0b1020, 0.0046);
    this.camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.5, 300);
    this.lights = createStudio(this.scene, store.config.ground);
    for (const key of ['tower', 'excavator', 'vehicle', 'worker', 'dust', 'flag']) {
      const grp = new THREE.Group();
      grp.name = `layer-${key}`;
      this.scene.add(grp);
      this.layerGroups[key] = grp;
    }

    const M = createMaterials();
    const P = createPools(M);
    const twins = new TwinManager(this.scene);
    this.ctx = {
      scene: this.scene,
      cfg: store.config,
      M,
      P,
      store,
      twins,
      sys: createSystems(),
    };
    const ctx = this.ctx;

    resetSeed(7);
    store.config.entities.forEach((d) => twins.registerDef(d));

    // —— 装配（与静态版顺序一致）——
    buildEnvironment(ctx);
    buildSandbox(ctx);
    buildBuilding(ctx);
    buildZones(ctx);
    buildStaticPools(ctx);
    this.buildCranes();
    this.buildExcavators();
    this.buildVehicles();
    this.burst = makeBurst(this.scene);
    twins.burst = this.burst;
    this.workers = buildWorkers(ctx);
    this.dust = makeDust(this.scene);
    this.rain = makeRain(this.scene);
    this.weather = new WeatherSim(store, ctx.sys.wetMats, ctx.sys.lampGlowMat!, ctx.sys.poolGlowMat!, this.dust, this.rain);
    this.dayNight = new DayNight(this.scene, this.lights, M, store, this.weather);

    this.cameraCtrl = new CameraController(this.camera);
    this.interaction = new InteractionManager({
      dom: this.renderer.domElement,
      camera: this.camera,
      knobMeshes: ctx.sys.consoleKnobMeshes,
      applyKnob: ctx.sys.applyKnob!,
      knobValue: (i: number): number => {
        const n = i === 0 ? store.config.presets.speed.length : i === 1 ? store.config.presets.flow.length : store.config.presets.dust.length;
        const cur = i === 0 ? store.speedIdx : i === 1 ? store.flowIdx : store.dustIdx;
        return cur / (n - 1);
      },
      twins,
      cameraCtrl: this.cameraCtrl,
      onSelect: (id) => {
        store.selectionId = id;
      },
    });

    // 图层归组（不改变世界坐标，仅便于可见性开关）
    const L = this.layerGroups;
    const sys = this.ctx.sys;
    sys.cranes.forEach((c) => L.tower.add(c.g));
    sys.digs.forEach((d) => L.excavator.add(d.g));
    sys.vehicles.forEach((v) => L.vehicle.add(v.g));
    if (this.workers.meshes) {
      Object.values(this.workers.meshes).forEach((m) => L.worker.add(m));
    }
    L.dust.add(this.dust.pts);
    sys.flagObjects.forEach((o) => L.flag.add(o));
    this.applyLayers(store.layers);
    this.registerTwins();
    twinsBridge.twins = twins;
    twinsBridge.workers = this.workers;
    twinsBridge.layerFlags = { groups: L };
    twinsBridge.actions = {
      applyView: (id) => this.applyView(id),
      resetView: () => this.applyView('overview'),
    };

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private buildCranes(): void {
    const { cfg } = this.ctx;
    const slabTopY = (k: number): number => cfg.ground + 0.5 + (k - 1) * cfg.bld.fh + 0.22;
    buildCrane(this.ctx, cfg.cr1, 17.9, [
      { px: -6.5, pz: -2.5, py: cfg.ground, dx: 7.9, dz: -0.9, dy: slabTopY(10), load: 'rebar' },
      { px: -2.0, pz: 4.6, py: cfg.ground, dx: 4.5, dz: 0.4, dy: slabTopY(9), load: 'skip' },
      { px: -6.5, pz: 0.6, py: cfg.ground, dx: 8.2, dz: -1.0, dy: slabTopY(8), load: 'blocks' },
    ], ['rebar', 'skip', 'blocks'], 'crane-1');
    buildCrane(this.ctx, cfg.cr2, 8.6, [
      { px: -15.0, pz: -9.9, py: cfg.ground, dx: -19.6, dz: 4.4, dy: cfg.ground - cfg.pit.depth, load: 'rebar' },
      { px: -15.0, pz: -9.9, py: cfg.ground, dx: -17.6, dz: 5.6, dy: cfg.ground - cfg.pit.depth, load: 'pipes' },
      { px: -13.9, pz: -9.9, py: cfg.ground, dx: -18.6, dz: 5.2, dy: cfg.ground - cfg.pit.depth, load: 'skip' },
    ], ['rebar', 'skip', 'pipes'], 'crane-2');
  }

  private buildExcavators(): void {
    const { cfg } = this.ctx;
    const py = cfg.ground - cfg.pit.depth + 0.02;
    buildExcavator(this.ctx, {
      x: -17.4, y: py, z: 1.6, bodyYaw: 2.95, restW: 2.95, dumpW: -0.1, rate: 1.0, phase: 0,
      rest: { b: -0.12, s: 0.35, k: 0.65, w: 2.95 },
    }, 'dig-1');
    buildExcavator(this.ctx, {
      x: -20.2, y: py, z: 5.3, bodyYaw: 2.35, restW: 2.35, dumpW: 5.72, rate: 0.85, phase: 2.3,
      rest: { b: -0.12, s: 0.35, k: 0.65, w: 2.35 },
    }, 'dig-2');
    makeMound(this.ctx, -18.3, 4.0, 2.0, 1.8, 0.7, 'dirtB', 0x6f5536, py + 0.18);
  }

  private buildVehicles(): void {
    const total = truckTotalLength();
    buildTruck(this.ctx, 0xd66a2a, 0.5, 'truck-1');
    buildTruck(this.ctx, 0x2e6cb5, total / 3, 'truck-2');
    buildTruck(this.ctx, 0x9a2d22, (total * 2) / 3 + 1.2, 'truck-3');
    buildMixer(this.ctx, 9.0, 'mixer-1');
    buildLoader(this.ctx, 17.0, 'loader-1');
  }

  /** 实体注册：机器可点选拾取；工人 InstancedMesh 拾取；区域/班组为静态聚焦点 */
  private registerTwins(): void {
    const { twins, sys, store } = this.ctx;
    const defName = (id: string): string => store.config.entities.find((e) => e.id === id)?.name ?? id;

    sys.cranes.forEach((cr) => {
      const id = cr.entityId;
      twins.markPickable(cr.g, id);
      twins.register(id, {
        name: defName(id),
        radius: 2.4,
        getPos: (out) => out.copy(cr.g.position).setY(cr.cfg.h * 0.6),
        getProgress: () => clamp01(cr.pt / Math.max(0.001, cr.seq[cr.i].dur ?? 1)),
        getState: () => ({
          label: cr.stateLabel,
          details: [
            { k: '回转角', v: `${((cr.φ * 180) / Math.PI).toFixed(0)}°` },
            { k: '小车幅度', v: `${cr.r.toFixed(1)} m` },
            { k: '起升高度', v: `${cr.len.toFixed(1)} m` },
            { k: '塔身高度', v: `${cr.cfg.h.toFixed(1)} m` },
          ],
        }),
      });
    });
    sys.digs.forEach((ex) => {
      const id = ex.entityId;
      twins.markPickable(ex.g, id);
      twins.register(id, {
        name: defName(id),
        radius: 1.6,
        getPos: (out) => out.copy(ex.g.position),
        getProgress: () => digProgress(ex),
        getState: () => ({
          label: ex.stateLabel,
          details: [
            { k: '动臂', v: `${((ex.cur.b * 180) / Math.PI).toFixed(0)}°` },
            { k: '斗杆', v: `${((ex.cur.s * 180) / Math.PI).toFixed(0)}°` },
            { k: '铲斗', v: `${((ex.cur.k * 180) / Math.PI).toFixed(0)}°` },
            { k: '作业面', v: '基坑' },
          ],
        }),
      });
    });
    sys.vehicles.forEach((v) => {
      const id = v.entityId;
      twins.markPickable(v.g, id);
      twins.register(id, {
        name: defName(id),
        radius: 1.5,
        getPos: (out) => out.copy(v.g.position),
        getProgress: () => vehicleProgress(v),
        getState: () => ({
          label: v.stateLabel,
          details: [
            { k: '车速', v: `${v.v.toFixed(1)} m/s` },
            { k: '朝向', v: `${((v.g.rotation.y * 180) / Math.PI).toFixed(0)}°` },
            { k: '工况', v: v.act || '巡航' },
          ],
        }),
      });
    });
    const ws = this.workers;
    if (ws.meshes) {
      const tags: Array<[THREE.InstancedMesh, string]> = [
        [ws.meshes.legs, 'legs'], [ws.meshes.arms, 'arms'],
        [ws.meshes.body, 'body'], [ws.meshes.head, 'head'], [ws.meshes.helm, 'helm'],
      ];
      tags.forEach(([mesh, tag]) => {
        mesh.userData.workerMesh = tag;
        twins.markWorkerPickable(mesh, ws);
      });
    }
    ws.workers.forEach((w, i) => {
      const id = `worker-${i}`;
      const info = ws.infoAt(i);
      twins.register(id, {
        name: `工人 #${i + 1} · ${info.job}`,
        radius: 0.6,
        getPos: (out) => out.set(w.x, w.y ?? 0, w.z),
        getState: () => ({
          label: info.label,
          details: [
            { k: '工种', v: info.job },
            { k: '班组', v: info.group },
            { k: '位置', v: `${w.x.toFixed(1)}, ${w.z.toFixed(1)}` },
          ],
        }),
      });
    });
    store.config.entities
      .filter((e) => e.type === 'zone' || e.type === 'workerGroup')
      .forEach((def) => {
        twins.registerStatic(def.id, def.name, def.focus, (def.focusDist ?? 14) / 4, {
          label: '正常运行',
          details: [
            { k: '说明', v: def.desc },
            { k: '分组', v: def.group },
          ],
        });
      });
  }

  /** 图层可见性（store.layers 驱动，每帧同步，代价可忽略） */
  private applyLayers(layers: TwinLayers): void {
    const keys: Array<keyof TwinLayers> = ['tower', 'excavator', 'vehicle', 'worker', 'dust', 'flag'];
    for (const key of keys) {
      this.layerGroups[key].visible = layers[key] !== false;
    }
  }

  /** 应用视角预设 */
  applyView(id: string): void {
    const v = this.store.config.views.find((x) => x.id === id) ?? this.store.config.views[0];
    this.cameraCtrl.setView(v);
  }

  /** 选中实体：选中环 + 相机聚焦（由 composable 在 selectionId 变化时调用） */
  focusSelection(id: string | null): void {
    this.ctx.twins.select(id);
    if (!id) return;
    const def = this.ctx.twins.getDef(id);
    const target = new THREE.Vector3();
    const pos = this.ctx.twins.getPos(id, target);
    if (!pos) return;
    this.cameraCtrl.flyTo(pos, def?.focusDist ?? 14);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const store = this.store;
    store.elapsed += dt;

    updateVehicles(this.ctx, dt);
    updateDigs(this.ctx, dt);
    updateCranes(this.ctx, dt);
    this.workers.update(dt, store.elapsed, speedMult(store));
    this.ctx.sys.dyn.forEach((f) => f(dt, store.elapsed));

    if (this.ctx.sys.barrierArm) {
      let near = 1e9;
      this.ctx.sys.vehicles.forEach((v) => {
        const d = Math.hypot(v.g.position.x - 8.4, v.g.position.z - 13.6);
        if (d < near) near = d;
      });
      const tgt = near < 5 ? 1.3 : 0;
      this.ctx.sys.barrierArm.rotation.z += (tgt - this.ctx.sys.barrierArm.rotation.z) * Math.min(1, dt * 3);
    }

    this.weather.update(dt);
    const clockText = this.dayNight.update(dt, store.elapsed);
    this.clockAcc += dt;
    if (this.clockAcc >= 0.25) {
      this.clockAcc = 0;
      store.clockText = clockText;
    }
    if (this.ctx.sys.flagMat) this.ctx.sys.flagMat.uniforms.uTime.value = store.elapsed;
    this.burst.update(dt);
    this.ctx.twins.updateRing(store.elapsed);
    this.applyLayers(store.layers);
    this.cameraCtrl.update(dt, store.autoOrbit && this.interaction.idleMs > 3000);
    const fps = this.perf.update(dt);
    if (fps !== null) store.fps = fps;
    this.renderer.render(this.scene, this.camera);

    if (!this.readyFired) {
      this.readyFired = true;
      store.ready = true;
    }
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.interaction.dispose();
    twinsBridge.twins = null;
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
