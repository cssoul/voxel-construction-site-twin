import type { WetMatEntry } from './types';
import type { TwinStore } from '../composables/useTwinStore';
import { dustAmt } from '../composables/useTwinStore';
import type { DustSystem } from './fx/Dust';
import type { RainSystem } from './fx/Rain';

/** 天气系统：暴雨渐入渐出 / 地面湿润 / 尘土 & 雨粒子参数 */
export class WeatherSim {
  rain = 0;
  wet = 0;
  lampGlow: THREE.SpriteMaterial;
  poolGlow: THREE.MeshBasicMaterial;
  private wetMats: WetMatEntry[];
  private dust: DustSystem | null;
  private rainFx: RainSystem | null;
  private store: TwinStore;

  constructor(
    store: TwinStore,
    wetMats: WetMatEntry[],
    lampGlow: THREE.SpriteMaterial,
    poolGlow: THREE.MeshBasicMaterial,
    dust: DustSystem | null,
    rainFx: RainSystem | null,
  ) {
    this.store = store;
    this.wetMats = wetMats;
    this.lampGlow = lampGlow;
    this.poolGlow = poolGlow;
    this.dust = dust;
    this.rainFx = rainFx;
  }

  update(dt: number): void {
    const target = this.store.weather === 'rain' ? 1 : 0;
    this.rain += (target - this.rain) * Math.min(1, dt * 0.8);
    this.wet += (target - this.wet) * Math.min(1, dt * 0.16);

    this.wetMats.forEach((w) => {
      w.mat.roughness = lerp(w.baseRough, 0.34, this.wet);
      w.mat.color.copy(w.baseColor).multiplyScalar(1 - 0.24 * this.wet);
    });
    if (this.dust) {
      this.dust.mat.uniforms.uTime.value = this.store.elapsed;
      this.dust.mat.uniforms.uIntensity.value = dustAmt(this.store) * (1 - this.rain * 0.9);
    }
    if (this.rainFx) {
      this.rainFx.mat.uniforms.uTime.value = this.store.elapsed;
      this.rainFx.mat.uniforms.uRain.value = this.rain;
      this.rainFx.pts.visible = this.rain > 0.015;
    }
  }
}

// 仅用于类型位置的 THREE 引用（保持模块自洽）
import * as THREE from 'three';
import { lerp } from './random';
