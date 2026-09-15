import * as THREE from 'three';
import { clamp01, lerp, pad2 } from './random';
import type { StudioLights } from './Studio';
import type { Materials } from './materials';
import type { WeatherSim } from './Weather';
import type { TwinStore } from '../composables/useTwinStore';
import { flowMult } from '../composables/useTwinStore';

interface SkyKey {
  t: number;
  sky: number;
  sun: number;
  sunI: number;
  hemi: number;
  amb: number;
}

const SKY_KEYS: SkyKey[] = [
  { t: 0.0, sky: 0x0b1020, sun: 0x8fb3ff, sunI: 0.14, hemi: 0.11, amb: 0.17 },
  { t: 4.6, sky: 0x0b1020, sun: 0x8fb3ff, sunI: 0.14, hemi: 0.11, amb: 0.17 },
  { t: 6.3, sky: 0x364260, sun: 0xffb27a, sunI: 0.75, hemi: 0.34, amb: 0.3 },
  { t: 8.5, sky: 0x74a8d8, sun: 0xfff0d8, sunI: 1.55, hemi: 0.5, amb: 0.42 },
  { t: 13.0, sky: 0x7db8e8, sun: 0xffffff, sunI: 1.95, hemi: 0.58, amb: 0.5 },
  { t: 16.8, sky: 0x6f9cc8, sun: 0xffd9a8, sunI: 1.45, hemi: 0.46, amb: 0.42 },
  { t: 18.6, sky: 0x9a5a48, sun: 0xff8a4a, sunI: 0.85, hemi: 0.3, amb: 0.3 },
  { t: 19.8, sky: 0x2c2a48, sun: 0xd87a5a, sunI: 0.26, hemi: 0.17, amb: 0.22 },
  { t: 21.2, sky: 0x0d1224, sun: 0x8fb3ff, sunI: 0.14, hemi: 0.11, amb: 0.17 },
  { t: 24.0, sky: 0x0b1020, sun: 0x8fb3ff, sunI: 0.14, hemi: 0.11, amb: 0.17 },
];

const _colA = new THREE.Color();
const _colB = new THREE.Color();
const _sky = new THREE.Color();
const _gray = new THREE.Color(0x3a4048);

/** 昼夜系统：太阳/天空/环境光/夜间灯效（数据来自 store.timeOfDay / store.autoTime） */
export class DayNight {
  private lights: StudioLights;
  private M: Materials;
  private scene: THREE.Scene;
  private store: TwinStore;
  private weather: WeatherSim;
  nightF = 0;

  constructor(scene: THREE.Scene, lights: StudioLights, M: Materials, store: TwinStore, weather: WeatherSim) {
    this.scene = scene;
    this.lights = lights;
    this.M = M;
    this.store = store;
    this.weather = weather;
  }

  /** 返回 HUD 时钟文本（每帧调用，文本 4Hz 内部节流由外部处理） */
  update(dt: number, elapsed: number): string {
    const store = this.store;
    const cfg = store.config;
    if (store.autoTime) {
      store.timeOfDay = (store.timeOfDay + dt * cfg.presets.timeBase * flowMult(store)) % 24;
    }
    const t = store.timeOfDay;

    let i = 0;
    while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].t < t) i++;
    const a = SKY_KEYS[i];
    const b = SKY_KEYS[i + 1];
    const k = clamp01((t - a.t) / Math.max(0.001, b.t - a.t));
    const rain = this.weather.rain;

    _sky.setHex(a.sky).lerp(_colB.setHex(b.sky), k);
    const sunI = lerp(a.sunI, b.sunI, k);
    const hemiI = lerp(a.hemi, b.hemi, k);
    const ambI = lerp(a.amb, b.amb, k);
    _sky.lerp(_gray, rain * 0.68);
    (this.scene.background as THREE.Color).copy(_sky);
    (this.scene.fog as THREE.FogExp2).color.copy(_sky);
    (this.scene.fog as THREE.FogExp2).density = 0.0046 + 0.004 * rain;

    const ang = ((t - 6) / 12) * Math.PI;
    const elevN = Math.sin(ang);
    this.lights.sun.position.set(-Math.cos(ang) * 34, Math.max(5, elevN * 30 + 2), 16);
    this.lights.sun.color.setHex(a.sun).lerp(_colA.setHex(b.sun), k);
    this.lights.sun.intensity = sunI * (1 - 0.72 * rain);
    this.lights.hemi.intensity = hemiI * (1 - 0.4 * rain) + 0.04;
    this.lights.amb.intensity = ambI * (1 - 0.3 * rain);

    const nightF = this.nightF = clamp01((0.14 - elevN) / 0.32);
    const M = this.M;
    M.glass.emissiveIntensity = nightF * 1.5 + rain * 0.12;
    M.cabGlass.emissiveIntensity = nightF * 0.9;
    M.headLight.emissiveIntensity = nightF * 1.7;
    M.lampOn.emissiveIntensity = 0.06 + nightF * 1.9;
    this.weather.lampGlow.opacity = clamp01(nightF * 1.15 - 0.06) * (0.8 + 0.4 * rain);
    this.weather.poolGlow.opacity = this.weather.lampGlow.opacity * 0.7;
    M.beacon.emissiveIntensity = 0.15 + nightF * (1.0 + 1.0 * Math.sin(elapsed * 4.6));
    this.lights.spotPit.intensity = nightF * (85 + 55 * rain);
    this.lights.spotBld.intensity = nightF * (65 + 45 * rain);

    const hh = Math.floor(t);
    const mm = Math.floor((t % 1) * 60);
    return `${pad2(hh)}:${pad2(mm)}`;
  }
}
