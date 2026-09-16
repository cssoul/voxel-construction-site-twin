/** 实体大类（左侧面板分组 & 右侧详情展示用） */
export type TwinEntityType =
  | 'crane'
  | 'excavator'
  | 'truck'
  | 'mixer'
  | 'loader'
  | 'worker'
  | 'workerGroup'
  | 'zone';

/** 实体静态定义（数据层下发，可由接口替换） */
export interface TwinEntityDef {
  id: string;
  name: string;
  en: string;
  type: TwinEntityType;
  /** 左侧面板分组名 */
  group: string;
  desc: string;
  /** 相机聚焦点（世界坐标） */
  focus: [number, number, number];
  /** 聚焦距离（可选，默认 14） */
  focusDist?: number;
}

/** 实体实时状态（由场景 TwinManager 每帧回写） */
export interface TwinEntityState {
  label: string;
  details: Array<{ k: string; v: string }>;
}

export type WeatherKind = 'clear' | 'rain' | 'snow';

/** 天气显示文案（UI 各处共用） */
export const WEATHER_TEXT: Record<WeatherKind, { cn: string; en: string }> = {
  clear: { cn: '晴', en: 'CLEAR' },
  rain: { cn: '暴雨', en: 'RAIN' },
  snow: { cn: '降雪', en: 'SNOW' },
};

/** 相机视角预设 */
export interface ViewPreset {
  id: string;
  name: string;
  en: string;
  yaw: number;
  pitch: number;
  dist: number;
  target: [number, number, number];
}

export interface CraneCfg {
  x: number;
  z: number;
  h: number;
  jib: number;
  yawLim: number;
  trolleyMin: number;
  trolleyMax: number;
}

export interface SiteConfig {
  ground: number;
  bound: { x: number; z: number };
  pit: { x0: number; x1: number; z0: number; z1: number; depth: number; cx: number; cz: number; w: number; d: number };
  bld: { cx: number; cz: number; w: number; d: number; floors: number; fh: number };
  cr1: CraneCfg;
  cr2: CraneCfg;
  shed: { cx: number; cz: number; w: number; d: number };
  gate: { x0: number; x1: number; z: number };
  desk: { w: number; d: number; h: number };
  road: { hw: number; hh: number; r: number; w: number };
  presets: {
    /** 仿真速度档位（SPEED 旋钮 / 全局机械速度倍率） */
    speed: number[];
    /** 昼夜流速档位（TIME 旋钮：暂停/慢/正常/快） */
    flow: number[];
    /** 尘土强度档位（DUST 旋钮） */
    dust: number[];
    /** 游戏小时 / 真实秒 基准速率 */
    timeBase: number;
  };
  defaults: {
    timeOfDay: number;
    weather: WeatherKind;
    autoTime: boolean;
    speedIdx: number;
    flowIdx: number;
    dustIdx: number;
  };
  entities: TwinEntityDef[];
  workerCount: number;
  views: ViewPreset[];
}
