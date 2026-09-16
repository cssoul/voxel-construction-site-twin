import * as THREE from 'three';
import type { WetMatEntry } from './types';
import type { TwinStore } from '../composables/useTwinStore';
import { dustAmt } from '../composables/useTwinStore';
import type { DustSystem } from './fx/Dust';
import type { PrecipSystem } from './fx/Precip';
import type { SnowEntry } from './materials';
import { snowWhiteColor } from './materials';
import { lerp } from './random';

const SNOW_WHITE = new THREE.Color(snowWhiteColor);

/** 天气系统：暴雨/降雪渐入渐出 / 地面湿润 / 覆雪 / 尘土 & 降水粒子参数 */
export class WeatherSim {
  rain = 0;
  snow = 0;
  /** 地面积雪覆盖 0~1（慢积慢融，切回晴天不会瞬间消失） */
  cover = 0;
  wet = 0;
  lampGlow: THREE.SpriteMaterial;
  poolGlow: THREE.MeshBasicMaterial;
  private wetMats: WetMatEntry[];
  private snowMats: SnowEntry[];
  private ground: WetMatEntry | null;
  private dust: DustSystem | null;
  private precip: PrecipSystem | null;
  private store: TwinStore;

  constructor(
    store: TwinStore,
    wetMats: WetMatEntry[],
    lampGlow: THREE.SpriteMaterial,
    poolGlow: THREE.MeshBasicMaterial,
    dust: DustSystem | null,
    precip: PrecipSystem | null,
    snowMats: SnowEntry[] = [],
  ) {
    this.store = store;
    this.wetMats = wetMats;
    this.ground = wetMats[0] ?? null;
    this.snowMats = snowMats;
    this.lampGlow = lampGlow;
    this.poolGlow = poolGlow;
    this.dust = dust;
    this.precip = precip;
  }

  update(dt: number, elapsed: number): void {
    const w = this.store.weather;
    const rainT = w === 'rain' ? 1 : 0;
    const snowT = w === 'snow' ? 1 : 0;
    this.rain += (rainT - this.rain) * Math.min(1, dt * 0.8);
    this.snow += (snowT - this.snow) * Math.min(1, dt * 0.7);
    // 积雪：堆积较快、融化稍慢
    const coverRate = snowT > this.cover ? 0.35 : 0.22;
    this.cover += (snowT - this.cover) * Math.min(1, dt * coverRate);
    const wetT = rainT;
    this.wet += (wetT - this.wet) * Math.min(1, dt * 0.16);

    // 地面湿润：变暗 + 粗糙度下降
    this.wetMats.forEach((wm) => {
      wm.mat.roughness = lerp(wm.baseRough, 0.34, this.wet);
      wm.mat.color.copy(wm.baseColor).multiplyScalar(1 - 0.24 * this.wet);
    });

    // 覆雪：普通户外材质向雪白混色；带纹理的地面以提亮 + 自发光模拟积雪反光
    this.snowMats.forEach((s) => {
      s.mat.color.copy(s.base).lerp(SNOW_WHITE, this.cover * s.amount);
    });
    if (this.ground) {
      const g = this.ground.mat;
      g.color.copy(this.ground.baseColor).multiplyScalar((1 - 0.24 * this.wet) * (1 + 0.85 * this.cover));
      const f = this.cover * 0.42;
      g.emissive.setRGB(f, f, Math.min(1, f * 1.15));
    }

    if (this.dust) {
      this.dust.mat.uniforms.uTime.value = elapsed;
      this.dust.mat.uniforms.uIntensity.value = dustAmt(this.store) * (1 - this.rain * 0.9) * (1 - this.snow * 0.95);
    }
    if (this.precip) {
      this.precip.update(elapsed);
      this.precip.setIntensity(this.rain, this.snow);
    }
  }
}
