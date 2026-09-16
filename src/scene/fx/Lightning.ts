import * as THREE from 'three';
import { clamp01 } from '../random';

/**
 * 雷暴闪电：雨强 > 0.55 时随机触发，
 * 单次闪电为主闪 + 次闪 + 余辉的双击画面增亮，
 * 同时提供一盏无阴影的方向光补充场景亮度
 */
export class LightningSim {
  readonly light: THREE.DirectionalLight;
  /** 当前闪光强度 0~1（供背景 / 雾 / 环境光提亮） */
  flash = 0;
  private t = -1; // <0 表示空闲
  private dur = 0.55;
  private nextIn = 2.5;

  constructor(scene: THREE.Scene) {
    this.light = new THREE.DirectionalLight(0xd6e4ff, 0);
    this.light.castShadow = false;
    scene.add(this.light);
    scene.add(this.light.target);
    this.reposition();
  }

  /** 随机闪电方位（避开固定方向，避免每次闪电观感一致） */
  private reposition(): void {
    const a = Math.random() * Math.PI * 2;
    this.light.position.set(Math.cos(a) * 42, 40 + Math.random() * 14, Math.sin(a) * 42);
    this.light.target.position.set((Math.random() - 0.5) * 16, 0, (Math.random() - 0.5) * 12);
  }

  update(dt: number, rain: number): void {
    if (rain > 0.55) {
      this.nextIn -= dt;
      if (this.nextIn <= 0) {
        this.t = 0;
        this.dur = 0.45 + Math.random() * 0.35;
        this.nextIn = 3.5 + Math.random() * 7.5;
        this.reposition();
      }
    }

    this.flash = 0;
    if (this.t >= 0) {
      this.t += dt;
      const u = this.t / this.dur;
      if (u >= 1) {
        this.t = -1;
      } else {
        // 双闪包络：主闪（快而亮）+ 次闪 + 尾部余辉
        const s1 = Math.max(0, 1 - Math.abs((u - 0.1) / 0.09));
        const s2 = Math.max(0, 1 - Math.abs((u - 0.4) / 0.14)) * 0.6;
        const tail = Math.max(0, 1 - u) * 0.1;
        this.flash = clamp01(s1 + s2 + tail);
      }
    }
    this.light.intensity = this.flash * 7.5;
  }

  dispose(): void {
    this.light.dispose();
  }
}
