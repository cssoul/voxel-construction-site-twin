import * as THREE from 'three';
import type { InstPool } from './voxel';
import type { Materials } from './materials';
import type { SiteConfig } from '../data/types';
import type { TwinStore } from '../composables/useTwinStore';
import type { TwinManager } from './twin/TwinManager';

export interface WetMatEntry {
  mat: THREE.MeshStandardMaterial;
  baseRough: number;
  baseColor: THREE.Color;
}

export interface VehicleUnit {
  g: THREE.Group;
  fol: import('./paths').Follower;
  baseSpeed: number;
  v: number;
  wheels: THREE.Group[];
  bed?: THREE.Group;
  rearMk?: THREE.Object3D;
  drum?: THREE.Object3D;
  chute?: THREE.Group;
  arms?: THREE.Group;
  bucket?: THREE.Group;
  dwell: number;
  dwellTotal: number;
  actT: number;
  act: string;
  spin: number;
  kind: 'truck' | 'mixer' | 'loader';
  entityId: string;
  stateLabel: string;
}

export interface DigUnit {
  g: THREE.Group;
  swing: THREE.Group;
  boom: THREE.Group;
  stick: THREE.Group;
  bucket: THREE.Group;
  opt: {
    x: number; y: number; z: number;
    bodyYaw: number; restW: number; dumpW: number; rate: number; phase: number;
    rest: { b: number; s: number; k: number; w: number };
  };
  i: number;
  t: number;
  cur: { b: number; s: number; k: number; w: number };
  from: { b: number; s: number; k: number; w: number };
  tgtB: number; tgtS: number; tgtK: number; tgtW: number;
  puffDone: boolean;
  entityId: string;
  stateLabel: string;
}

export interface CraneTask {
  px: number; pz: number; py: number;
  dx: number; dz: number; dy: number;
  load: string;
}

export interface CraneUnit {
  g: THREE.Group;
  slew: THREE.Group;
  trolley: THREE.Group;
  cable: THREE.Mesh;
  hookG: THREE.Group;
  loads: Record<string, THREE.Group>;
  seq: CraneSeqItem[];
  i: number;
  pt: number;
  φ: number;
  r: number;
  len: number;
  vel: number;
  prevφ: number;
  tilt: number;
  cfg: { x: number; z: number; h: number; jib: number; yawLim: number; trolleyMin: number; trolleyMax: number };
  entityId: string;
  stateLabel: string;
}

export interface CraneSeqItem {
  do: 'slew' | 'cable' | 'grab' | 'drop';
  φ?: number;
  r?: number;
  len?: number;
  dur?: number;
  load?: string;
  dust?: number;
  fired?: boolean;
  φ0?: number;
  r0?: number;
  l0?: number;
}

export interface Systems {
  vehicles: VehicleUnit[];
  digs: DigUnit[];
  cranes: CraneUnit[];
  dyn: Array<(dt: number, t: number) => void>;
  flagMat: THREE.ShaderMaterial | null;
  flagObjects: THREE.Object3D[];
  barrierArm: THREE.Object3D | null;
  lampGlowMat: THREE.SpriteMaterial | null;
  poolGlowMat: THREE.MeshBasicMaterial | null;
  wetMats: WetMatEntry[];
  nightMats: THREE.MeshStandardMaterial[];
  consoleKnobMeshes: THREE.Mesh[];
  applyKnob: ((i: number, t: number) => void) | null;
}

export function createSystems(): Systems {
  return {
    vehicles: [],
    digs: [],
    cranes: [],
    dyn: [],
    flagMat: null,
    flagObjects: [],
    barrierArm: null,
    lampGlowMat: null,
    poolGlowMat: null,
    wetMats: [],
    nightMats: [],
    consoleKnobMeshes: [],
    applyKnob: null,
  };
}

export interface SceneCtx {
  scene: THREE.Scene;
  cfg: SiteConfig;
  M: Materials;
  P: Record<string, InstPool>;
  store: TwinStore;
  twins: TwinManager;
  sys: Systems;
}
