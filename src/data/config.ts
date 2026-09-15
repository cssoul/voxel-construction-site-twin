import type { SiteConfig, TwinEntityDef } from './types';

/**
 * 场景静态配置 + 实体清单（mock 数据源）。
 * 后期接入真实接口时，只需让 src/data/api.ts 的 fetchSiteConfig 返回同构数据即可。
 */

const PIT = { x0: -22.9, x1: -15.9, z0: -2.2, z1: 7.0, depth: 1.7 };

function entity(def: TwinEntityDef): TwinEntityDef {
  return def;
}

export const SITE_CONFIG: SiteConfig = {
  ground: 1.1,
  bound: { x: 22.4, z: 15.4 },
  pit: { ...PIT, cx: (PIT.x0 + PIT.x1) / 2, cz: (PIT.z0 + PIT.z1) / 2, w: PIT.x1 - PIT.x0, d: PIT.z1 - PIT.z0 },
  bld: { cx: 5.5, cz: -1.8, w: 8.6, d: 6.2, floors: 10, fh: 1.35 },
  cr1: { x: -3.2, z: 2.8, h: 19.0, jib: 13.0, yawLim: 99, trolleyMin: 1.6, trolleyMax: 12.4 },
  cr2: { x: -18.6, z: -4.9, h: 14.5, jib: 12.0, yawLim: 1.83, trolleyMin: 1.6, trolleyMax: 11.4 },
  shed: { cx: -17, cz: -13, w: 7, d: 4.6 },
  gate: { x0: 6.3, x1: 11.7, z: 16.65 },
  desk: { w: 76, d: 46, h: 1.6 },
  road: { hw: 13, hh: 8, r: 4.5, w: 3.4 },
  presets: {
    speed: [0.2, 0.5, 1, 2, 3],
    flow: [0, 0.5, 1, 3],
    dust: [0.45, 0.85, 1.35],
    timeBase: 0.045,
  },
  defaults: {
    timeOfDay: 12.0, // 默认中午
    weather: 'clear',
    autoTime: false,
    speedIdx: 2,
    flowIdx: 2,
    dustIdx: 1,
  },
  workerCount: 28,
  views: [
    { id: 'overview', name: '全局总览', en: 'OVERVIEW', yaw: -0.52, pitch: 0.36, dist: 58, target: [0, 3, 1] },
    { id: 'tower-crane', name: '塔吊作业', en: 'TOWER CRANE', yaw: -0.75, pitch: 0.2, dist: 26, target: [-3.2, 9, 2.8] },
    { id: 'pit', name: '基坑开挖', en: 'EXCAVATION', yaw: 2.55, pitch: 0.5, dist: 16, target: [-19, 0, 2.4] },
    { id: 'building', name: '在建主楼', en: 'TOWER BLDG', yaw: -0.85, pitch: 0.26, dist: 24, target: [5.5, 7, -1.8] },
    { id: 'gate', name: '工地大门', en: 'SITE GATE', yaw: -0.25, pitch: 0.32, dist: 17, target: [9, 2, 14.5] },
  ],
  entities: [
    entity({ id: 'crane-1', name: '1 号塔吊', en: 'TOWER CRANE A', type: 'crane', group: '塔吊', desc: '服务在建主楼，负责钢筋/料斗/砌块吊运', focus: [-3.2, 10, 2.8], focusDist: 22 }),
    entity({ id: 'crane-2', name: '2 号塔吊', en: 'TOWER CRANE B', type: 'crane', group: '塔吊', desc: '服务基坑与钢筋棚，回转限角防越界', focus: [-18.6, 8, -4.9], focusDist: 20 }),

    entity({ id: 'dig-1', name: '1 号挖掘机', en: 'EXCAVATOR 01', type: 'excavator', group: '挖运机械', desc: '基坑西侧挖掘作业，负责装车', focus: [-17.4, 0, 1.6], focusDist: 12 }),
    entity({ id: 'dig-2', name: '2 号挖掘机', en: 'EXCAVATOR 02', type: 'excavator', group: '挖运机械', desc: '基坑南侧挖掘作业，坑内倒运', focus: [-20.2, 0, 5.3], focusDist: 12 }),
    entity({ id: 'truck-1', name: '1 号渣土车', en: 'DUMP TRUCK 01', type: 'truck', group: '挖运机械', desc: '环路运渣：基坑装料 → 渣土区倾卸', focus: [-13, 1, 1.6], focusDist: 12 }),
    entity({ id: 'truck-2', name: '2 号渣土车', en: 'DUMP TRUCK 02', type: 'truck', group: '挖运机械', desc: '环路运渣：基坑装料 → 渣土区倾卸', focus: [13, 1, -8], focusDist: 12 }),
    entity({ id: 'truck-3', name: '3 号渣土车', en: 'DUMP TRUCK 03', type: 'truck', group: '挖运机械', desc: '环路运渣：基坑装料 → 渣土区倾卸', focus: [9, 1, 8], focusDist: 12 }),
    entity({ id: 'mixer-1', name: '搅拌车', en: 'MIXER TRUCK', type: 'mixer', group: '挖运机械', desc: '沿环路低速巡驶，主楼旁定点浇筑', focus: [13, 1, 0.5], focusDist: 12 }),
    entity({ id: 'loader-1', name: '装载机', en: 'WHEEL LOADER', type: 'loader', group: '挖运机械', desc: '渣土区铲装 → 物料区卸料循环', focus: [19, 1, -5.4], focusDist: 12 }),

    entity({ id: 'wgroup-pit', name: '基坑班组', en: 'PIT CREW', type: 'workerGroup', group: '工人班组', desc: '坑底绑扎/开挖配合、坑边巡视、坡道引导', focus: [-19.4, 0, 2.4], focusDist: 14 }),
    entity({ id: 'wgroup-main', name: '主体班组', en: 'STRUCTURE CREW', type: 'workerGroup', group: '工人班组', desc: '主楼 8~10 层与核心筒作业人员', focus: [5.5, 13, -1.8], focusDist: 16 }),
    entity({ id: 'wgroup-shed', name: '钢筋班组', en: 'REBAR CREW', type: 'workerGroup', group: '工人班组', desc: '钢筋棚内绑扎、切断、码放', focus: [-17, 1, -12], focusDist: 12 }),
    entity({ id: 'wgroup-signal', name: '塔吊指挥', en: 'SIGNALMAN', type: 'workerGroup', group: '工人班组', desc: '1 号塔吊吊装信号指挥', focus: [-0.6, 1, 1.6], focusDist: 8 }),
    entity({ id: 'wgroup-guard', name: '安保门卫', en: 'GUARD', type: 'workerGroup', group: '工人班组', desc: '大门值守与人员登记', focus: [13.9, 1, 13.4], focusDist: 8 }),
    entity({ id: 'wgroup-patrol', name: '场内巡查', en: 'PATROL', type: 'workerGroup', group: '工人班组', desc: '道路/物料区/办公区流动巡查', focus: [0, 1, 0], focusDist: 26 }),

    entity({ id: 'zone-pit', name: '基坑开挖区', en: 'EXCAVATION PIT', type: 'zone', group: '功能分区', desc: '大型基坑：分层坑壁、钢支撑、出土坡道、警示围栏', focus: [-19.4, 0.5, 2.4], focusDist: 18 }),
    entity({ id: 'zone-building', name: '在建高层', en: 'TOWER BUILDING', type: 'zone', group: '功能分区', desc: '10 层主楼：核心筒爬升、脚手架、施工升降机', focus: [5.5, 7, -1.8], focusDist: 20 }),
    entity({ id: 'zone-shed', name: '钢筋加工棚', en: 'REBAR SHED', type: 'zone', group: '功能分区', desc: '钢筋堆放/切割/绑扎棚，A 字架料架', focus: [-17, 1.5, -13], focusDist: 12 }),
    entity({ id: 'zone-material', name: '物料堆放区', en: 'MATERIAL YARD', type: 'zone', group: '功能分区', desc: '水泥袋、砖垛、钢管、木方、砂石、预制板', focus: [18.9, 1, -2], focusDist: 16 }),
    entity({ id: 'zone-dump', name: '渣土堆放区', en: 'DUMP ZONE', type: 'zone', group: '功能分区', desc: '渣土车倾卸点，体素土堆堆存', focus: [-4.5, 1, -13], focusDist: 14 }),
    entity({ id: 'zone-office', name: '板房办公区', en: 'SITE OFFICES', type: 'zone', group: '功能分区', desc: '临时板房 ×3、公告栏、水电设施', focus: [-12.4, 1, 14.6], focusDist: 14 }),
    entity({ id: 'zone-gate', name: '工地大门', en: 'SITE GATE', type: 'zone', group: '功能分区', desc: '门柱/门头标语/道闸/检查区/减速带', focus: [9, 2, 16], focusDist: 12 }),
  ],
};

/** 工人岗位 → 名称前缀（Workers 模块注册实体时使用） */
export const WORKER_GROUP_NAMES: Record<string, { name: string; id: string }> = {
  pit: { name: '基坑班组', id: 'wgroup-pit' },
  structure: { name: '主体班组', id: 'wgroup-main' },
  rebarShed: { name: '钢筋班组', id: 'wgroup-shed' },
  signal: { name: '塔吊指挥', id: 'wgroup-signal' },
  guard: { name: '安保门卫', id: 'wgroup-guard' },
  patrol: { name: '场内巡查', id: 'wgroup-patrol' },
};
