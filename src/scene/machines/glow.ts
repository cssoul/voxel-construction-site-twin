import * as THREE from 'three';
import type { Systems } from '../types';

/** 从 Systems 取地面光斑材质（延迟创建，供车灯用） */
export function poolGlowOf(sys: Systems): THREE.MeshBasicMaterial | null {
  return sys.poolGlowMat;
}
