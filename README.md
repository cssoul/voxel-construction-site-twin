# VOXEL CONSTRUCTION SITE TWIN — 体素微缩建筑工地数字孪生沙盘

一个可以直接在 Chrome 中双击打开的单文件 Three.js Demo：一张深色实木办公桌上摆着一个正在运行的体素微缩建筑工地沙盘。

本目录包含两套交付：

1. `construction-site-twin.html` — 纯静态单文件版（双击即开）
2. `src/` — **Vue 3 + TypeScript + Three.js 工程版**（完全复刻静态版，并增加数据层与左右控制/信息面板）

## Vue 工程版

```bash
npm install        # 首次安装依赖
npm run dev        # 开发：http://localhost:5173
npm run build      # 类型检查 (vue-tsc) + 产物构建 (dist/)
npm run preview    # 预览构建产物
```

### 目录结构

```text
src/
  components/            Vue UI 组件
    PanelLeft.vue        左侧面板：一天的时间(默认正午/滑杆/黎明-正午-黄昏-夜晚/自动流逝)、天气(晴/暴雨/降雪)、实体按钮(分组列表)
    PanelRight.vue       右侧面板：点选场景实体或左面板按钮后显示实时状态详情
    HudPanel.vue         顶部数字孪生 HUD（状态/时钟/天气/尘土/速度/机械/工人/卡车/塔吊/FPS）
    LoadingOverlay.vue   加载层
  composables/
    usePlaygroundScene.ts  数据加载 → SceneApp 装配 → store↔场景联动（选中/空格暴雨/?select= 深链）
    useTwinStore.ts        全局响应式状态（单一数据源）
    useWeather.ts          天气控制
    useDayNight.ts         一天的时间控制（滑杆/预设/自动流逝）
  data/                  数据层（后期可替换为接口）
    config.ts            场景几何常量 + 实体清单（mock 数据源）
    api.ts               fetchSiteConfig / fetchEntities（VITE_TWIN_API_BASE 存在时走远端，否则 mock）
    types.ts             SiteConfig / TwinEntityDef / TwinEntityState
  scene/
    SceneApp.ts            场景总装（渲染器/相机/装配/动画循环/dispose）
    CameraController.ts    透视相机环绕/缩放/聚焦飞行/自动环绕
    InteractionManager.ts  旋钮拖拽 / 相机拖拽 / 射线拾取实体 / 滚轮缩放
    Studio.ts              灯光影棚（太阳/半球/环境/夜间投光灯）
    DayNight.ts            昼夜系统（四态关键帧 + 夜间灯效）
    Weather.ts             天气系统（暴雨/降雪渐变、地面湿润、覆雪、闪电、尘土与降水粒子）
    Performance.ts         FPS 计量
    Sandbox.ts             托盘/围挡/地面(挖洞)/基坑
    Environment.ts         房间/桌面/道具/实体旋钮控制台(与 store 双向同步)
    buildings/Building.ts  在建高层（模块化拼装）
    props/Zones.ts         钢筋棚/物料区/渣土区/板房/大门/灯杆/电杆/锥桶/彩旗/标识牌
    props/Textures.ts      全部程序化 CanvasTexture（木纹/地面/蓝图/标识/标签…）
    machines/Crane.ts        塔吊（回转/变幅/钢丝绳/吊运状态机）
    machines/Excavator.ts    挖掘机（挖掘循环状态机）
    machines/GroundVehicle.ts 渣土车×3/搅拌车/装载机（waypoint 路径系统）
    actors/Workers.ts      工人 ×28（InstancedMesh 程序动画）
    fx/Dust.ts fx/Rain.ts fx/Burst.ts   Shader 粒子
    twin/TwinManager.ts    孪生实体注册/拾取/选中环/实时状态
    twin/twinsBridge.ts    TwinManager 与 UI 的桥
    voxel.ts paths.ts materials.ts random.ts canvas.ts types.ts
```

### 数据层与接口替换

- 页面所有业务数据（场景常量、实体清单、默认控制量）都经 `src/data/api.ts` 获取；
- 默认 `api` 为本地 mock（`config.ts`），离线可用；
- 接入后端：设置环境变量 `VITE_TWIN_API_BASE=http://xxx/api/twin`，并提供：
  - `GET ${VITE_TWIN_API_BASE}/site-config` → `SiteConfig`
  - `GET ${VITE_TWIN_API_BASE}/entities` → `TwinEntityDef[]`
- 协议不同只需改写 `api.ts` 的 `remoteApi`，UI 与场景零改动。

### 交互补充（相对静态版新增）

- 左侧面板：时间滑杆与黎明/正午/黄昏/夜晚预设（默认正午）、自动流逝开关、晴/暴雨/降雪切换、按分组的实体按钮（点击选中并让相机聚焦飞行）
- 右侧面板：点选场景中的塔吊/机械/工人（或左面板按钮）后，实时显示状态、回转角/幅度/起升/车速/工种/班组等明细
- 深链：`?select=crane-1` 打开页面即选中并聚焦指定实体
- 3D 桌面旋钮保留，与左面板共享同一份数据状态

### 浮层布局（参考数字孪生大屏风格重构）

- **左上标题卡**：体素工地·数字孪生 + 项目部徽标 + LIVE 状态灯
- **右上胶囊条**：时钟(秒) / 天气 / 尘土 / 仿真速度 / 当前选中 / FPS
- **左侧控制面板**（可滚动）：
  - 视角预设 5 组（全局总览 / 塔吊作业 / 基坑开挖 / 在建主楼 / 工地大门）+ 复位视角
  - 图层开关（塔吊 / 挖掘机 / 运输车辆 / 作业工人 / 尘土粒子 / 彩旗标识）
  - 系统开关（相机自动环绕、触发暴雨演练）
  - 一天的时间（滑杆 + 预设 + 自动流逝，默认正午）
  - 天气控制（晴 / 暴雨 / 降雪）
  - 设备清单 9 台：实时状态点 + 名称 + 工况 + 进度条（点击选中）
  - 实体索引：功能分区 / 工人班组快捷按钮
- **右侧面板**（两个 Tab，选中实体时自动切到详情）：
  - 全局总览：4 个指标瓦片 + 实时工况构成条形图 + 机械运行状态列表（状态点/进度百分比）
  - 实体详情：STATUS / 回转角·幅度·起升·车速·坐标等实时明细 + 关闭
- **底部快报条**：运行模式 / 昼夜时钟 / 天气 / 仿真速度 / 作业机械 / 流动巡查

对应场景层新增：图层分组（`layerGroups`）、相机视角预设（`CameraController.setView`，yaw/pitch/距离/目标点平滑过渡）、机械工况进度接口（`TwinManager.getProgress`）。

---

## 静态单文件版

## 交互

| 操作 | 作用 |
| --- | --- |
| 左键拖拽 | 环绕相机（Orbit 风格，手写实现） |
| 滚轮 | 缩放 |
| 空格 | 开关暴雨（雨滴粒子 + 天色变暗 + 地面湿润反光 + 灯光增强） |
| 拖动/点击桌前 3 个实体旋钮 | SPEED（0.2×/0.5×/1×/2×/3× 全局仿真速度）、TIME（暂停/0.5×/1×/3× 昼夜流速）、DUST（LOW/MEDIUM/HIGH 尘土强度） |
| 静置 3 秒 | 相机自动缓慢环绕，一操作即恢复 |

## 已实现功能

- 桌面场景：深色胡桃木桌面（程序木纹）、房间环境、蓝图 ×2、钢卷尺、安全帽、水平仪、铅笔、警示牌、3 个可交互实体旋钮控制台（带 LED 电平条与刻度标签）
- 沙盘：木托盘底座 + 蓝白围挡 + 警示灯 + 大门（门柱、门头标语、道闸会抬杆、检查区锥桶与减速带）
- 分区：基坑开挖区（分层坑壁、钢支撑、锚板、坡道、警示围栏）、钢筋加工棚（A 字架、成捆钢筋、切割机、工作台）、物料区（水泥袋/砖垛/钢管/木方/预制板/砂石堆）、渣土区（体素土堆 ×4）、板房办公区 ×3（空调外机、台阶、水电箱、公告栏）、环形施工道路 + 大门引道 + 渣土支路
- 在建高层：10 层模块化拼装（筏板/柱/梁/楼板/带窗墙/楼梯核心筒/顶部插筋/脚手架/施工升降机动笼/楼层标语），顶部两层为暴露梁柱 + 插筋的未完成态
- 机械：塔吊 ×2（360° 回转限位、小车变幅、钢丝绳实时伸缩、吊钩吊运钢筋/混凝土料斗/砌块的状态机循环）、挖掘机 ×2（待机→挖装→回转→卸土全循环、参数/相位差异化）、渣土卡车 ×3（waypoint 循环：基坑装料→渣土区倾卸卸料动画→返回）、搅拌车 ×1（低速、罐体持续旋转、定点浇筑伸槽）、装载机 ×1（铲料→运料→卸料循环）
- 工人 ×28：InstancedMesh 程序动画（行走/弯腰/绑扎/指挥/站岗），按工种着色（普工/钢筋工/电工/信号工/安保）
- 系统：昼夜循环（黎明/正午/黄昏/夜晚四态 + 夜间窗光、路灯+光池、塔吊红灯闪烁、基坑/楼侧投光灯）、尘土 Shader 粒子（旋钮调档）、暴雨（雨滴 Shader 粒子 + 湿地材质参数模拟 + 灯光增益）、卸料/挖掘扬尘粒子、基础碰撞（车辆间跟车避让 + `clampPosition()` 沙盘边界硬限制 + 塔吊回转限角）
- HUD：深色半透明绿光数字孪生面板（状态/时钟/天气/尘土/速度/机械/工人/卡车/塔吊/FPS）

## 性能设计（目标：桌面 Chrome 稳定 60 FPS）

- 全部静态重复构件（围挡、砌块、水泥袋、砖、钢筋、管道、锥桶、栏杆、土方立方块等）走 **InstancedMesh 池**（按材质分 30 个池，全部静态合批）
- 工人 28 人仅 5 个 InstancedMesh，每帧只更新 instanceMatrix
- 尘土 / 雨滴 / 扬尘均为 **BufferGeometry + Points + 自定义 Shader**，GPU 循环，无逐粒子对象
- 几何与材质全局共享（单位 Box/Cylinder 缩放复用），塔吊顶红灯、窗户发光等用共享材质统一驱动
- 真实光源仅 1 个投影平行光（2048 阴影）+ 半球 + 环境 + 2 个夜间投光灯；光晕用加法混合 Sprite/面片模拟
- 动画全部由 `deltaTime` 驱动单一 Clock，不依赖帧率

## 后续可优化方向

- 静态池按区域做视锥/距离剔除，或用 `BufferGeometryUtils.mergeGeometries` 进一步减 draw call
- 塔吊/挖掘机卸料与卡车装料的精确时序联动（目前为节拍近似同步）
- 雨天积水镜面（计划中的 planar reflection 或 matcap 模拟）、雨声 WebAudio（程序合成）
- 工人路径与车辆路径的横向避让；行人过街节点
- 移动端触控双指缩放、`prefers-reduced-motion` 降级
