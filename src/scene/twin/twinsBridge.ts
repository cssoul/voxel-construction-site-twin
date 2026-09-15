import type * as THREE from 'three';
import type { TwinManager } from './TwinManager';
import type { WorkerSystem } from '../actors/Workers';

/** SceneApp 与 UI 组件之间的桥（非响应式，方法调用读取实时状态） */
export const twinsBridge: {
  twins: TwinManager | null;
  workers: WorkerSystem | null;
  actions: {
    applyView: (id: string) => void;
    resetView: () => void;
  } | null;
  layerFlags: { groups: Record<string, THREE.Group> } | null;
} = { twins: null, workers: null, actions: null, layerFlags: null };
