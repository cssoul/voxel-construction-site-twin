import * as THREE from 'three';

/**
 * 降水粒子系统（雨 / 雪）
 * 参考 voxel-playground-demo 的 Particles 实现：
 * BufferGeometry + Points + ShaderMaterial，程序化生成；
 * 雨为竖直拉丝、雪为柔光圆点，均支持距离淡出与强度控制
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSway;
  uniform float uSlant;
  uniform float uHeight;
  uniform float uSize;
  uniform float uPR;
  uniform float uFadeNear;
  uniform float uFadeFar;
  attribute float aSeed;
  attribute float aScale;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // 下落（不同粒子速度略有差异），落至地面高度后循环
    float fall = mod(p.y - uTime * uSpeed * (0.65 + aSeed * 0.7), uHeight);
    p.y = 1.1 + fall;

    // 风斜 + 侧向摆动（雨轻微、雪明显）
    p.x += p.y * uSlant;
    p.x += sin(uTime * (0.5 + aSeed) + aSeed * 12.0) * uSway;
    p.z += cos(uTime * (0.4 + aSeed * 0.6) + aSeed * 8.0) * uSway * 0.7;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // 按视图距离淡出：近处清晰、远处渐隐
    float dist = length(mv.xyz);
    vAlpha = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    vAlpha *= 0.55 + 0.45 * aScale;

    gl_PointSize = uSize * aScale * uPR;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uStreak;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;

    float a;
    if (uStreak > 0.5) {
      // 雨：竖直拉丝（细线 + 两端柔化）
      float line = 1.0 - smoothstep(0.05, 0.16, abs(c.x));
      float ends = 1.0 - smoothstep(0.4, 0.5, abs(c.y));
      a = line * ends;
    } else {
      // 雪：柔光圆点
      float d = length(c);
      if (d > 0.5) discard;
      a = 1.0 - smoothstep(0.12, 0.5, d);
    }

    a *= vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface PrecipLayer {
  pts: THREE.Points;
  mat: THREE.ShaderMaterial;
}

function createLayer(
  count: number,
  area: { x: number; y: number; z: number },
  opts: {
    color: number;
    size: number;
    speed: number;
    sway: number;
    slant: number;
    opacity: number;
    height: number;
    streak: boolean;
  },
): PrecipLayer {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * area.x;
    positions[i * 3 + 1] = Math.random() * area.y;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * area.z;
    seeds[i] = Math.random();
    scales[i] = 0.6 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: opts.speed },
      uSway: { value: opts.sway },
      uSlant: { value: opts.slant },
      uHeight: { value: opts.height },
      uSize: { value: opts.size },
      uPR: { value: Math.min(devicePixelRatio, 2) },
      uFadeNear: { value: 30 },
      uFadeFar: { value: 150 },
      uColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: 0 },
      uStreak: { value: opts.streak ? 1 : 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });

  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.visible = false;
  return { pts, mat };
}

/** 雨雪粒子：强度 0~1 由 WeatherSim 驱动，时间统一用 store.elapsed */
export class PrecipSystem {
  readonly group = new THREE.Group();
  private rainL: PrecipLayer;
  private snowL: PrecipLayer;
  private rainBase = 0.62;
  private snowBase = 0.92;

  constructor(scene: THREE.Scene) {
    this.group.name = 'precip';
    // 覆盖整个沙盘并留出边缘余量（沙盘 48×34）
    const area = { x: 29, y: 30, z: 20 };
    this.rainL = createLayer(5200, area, {
      color: 0xd6efff, size: 6.5, speed: 19, sway: 0.3, slant: 0.05,
      opacity: this.rainBase, height: area.y, streak: true,
    });
    this.snowL = createLayer(3000, area, {
      color: 0xffffff, size: 4.4, speed: 2.1, sway: 1.7, slant: 0.015,
      opacity: this.snowBase, height: area.y, streak: false,
    });
    this.group.add(this.rainL.pts, this.snowL.pts);
    scene.add(this.group);
  }

  /** 设置雨 / 雪强度（0~1，含渐入渐出） */
  setIntensity(rain: number, snow: number): void {
    this.rainL.mat.uniforms.uOpacity.value = this.rainBase * rain;
    this.rainL.pts.visible = rain > 0.02;
    this.snowL.mat.uniforms.uOpacity.value = this.snowBase * snow;
    this.snowL.pts.visible = snow > 0.02;
  }

  update(elapsed: number): void {
    this.rainL.mat.uniforms.uTime.value = elapsed;
    this.snowL.mat.uniforms.uTime.value = elapsed;
  }

  dispose(): void {
    [this.rainL, this.snowL].forEach((l) => {
      l.pts.geometry.dispose();
      l.mat.dispose();
    });
  }
}
