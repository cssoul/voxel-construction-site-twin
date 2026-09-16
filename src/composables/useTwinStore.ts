import { reactive } from 'vue';
import { api } from '../data/api';
import { SITE_CONFIG } from '../data/config';
import type { SiteConfig, TwinEntityDef, WeatherKind } from '../data/types';

/**
 * 全局孪生状态（单一数据源）：
 * - UI 面板（左侧/右侧/HUD）与 3D 场景（旋钮/交互）都读写这里；
 * - 初始数据通过 src/data/api.ts 加载，便于后期替换为真实接口。
 */
export interface TwinLayers {
  tower: boolean;      // 塔吊
  excavator: boolean;  // 挖掘机
  vehicle: boolean;    // 运输车辆
  worker: boolean;     // 工人
  dust: boolean;       // 尘土粒子
  flag: boolean;       // 彩旗标识
}

export interface TwinStore {
  ready: boolean;
  loadError: string;
  config: SiteConfig;

  // —— 控制量（旋钮 & 面板共享）——
  speedIdx: number;   // SPEED 旋钮档位
  flowIdx: number;    // TIME 旋钮档位（昼夜流速）
  dustIdx: number;    // DUST 旋钮档位
  weather: WeatherKind;
  timeOfDay: number;  // 0~24
  autoTime: boolean;  // 时间自动流逝
  autoOrbit: boolean; // 相机自动环绕
  layers: TwinLayers; // 图层可见性

  // —— 回显状态 ——
  clockText: string;
  fps: number;
  elapsed: number;

  // —— 实体 ——
  entityDefs: TwinEntityDef[];
  selectionId: string | null;
}

const d = SITE_CONFIG.defaults;

const store = reactive<TwinStore>({
  ready: false,
  loadError: '',
  config: SITE_CONFIG,
  speedIdx: d.speedIdx,
  flowIdx: d.flowIdx,
  dustIdx: d.dustIdx,
  weather: d.weather,
  timeOfDay: d.timeOfDay,
  autoTime: d.autoTime,
  autoOrbit: true,
  layers: { tower: true, excavator: true, vehicle: true, worker: true, dust: true, flag: true },
  clockText: '12:00',
  fps: 0,
  elapsed: 0,
  entityDefs: [],
  selectionId: null,
});

// —— 档位取值 ——
export const speedMult = (s: TwinStore): number => s.config.presets.speed[s.speedIdx] ?? 1;
export const flowMult = (s: TwinStore): number => s.config.presets.flow[s.flowIdx] ?? 1;
export const dustAmt = (s: TwinStore): number => s.config.presets.dust[s.dustIdx] ?? 1;

// —— 动作 ——
export function selectEntity(id: string | null): void {
  store.selectionId = id;
}

export function toggleWeather(): void {
  store.weather = store.weather === 'clear' ? 'rain' : store.weather === 'rain' ? 'snow' : 'clear';
}

export function setWeather(w: WeatherKind): void {
  store.weather = w;
}

export function setTimeOfDay(t: number): void {
  store.timeOfDay = ((t % 24) + 24) % 24;
}

/** 从数据层加载配置与实体清单（可替换为真实接口） */
export async function loadTwinData(): Promise<void> {
  try {
    const config = await api.fetchSiteConfig();
    const entities = await api.fetchEntities();
    store.config = config;
    store.entityDefs = entities;
    if (import.meta.env.DEV) console.info(`[twin] loaded ${entities.length} entities (api: mock/remote)`);
  } catch (err) {
    store.loadError = err instanceof Error ? err.message : String(err);
    // 失败时兜底使用内置配置，保证页面可用
    store.entityDefs = SITE_CONFIG.entities;
  }
}

export function useTwinStore(): TwinStore {
  return store;
}
