import * as THREE from 'three';

export interface DustSystem {
  mat: THREE.ShaderMaterial;
  pts: THREE.Points;
}

/** 尘土：Shader Points，缓慢上飘 + 水平漂移（强度由 DUST 旋钮/天气控制） */
export function makeDust(scene: THREE.Scene): DustSystem {
  const N = 700;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const size = new Float32Array(N);
  const zones: Array<[number, number, number, number]> = [
    [-22, 15.9, -2, 7],
    [-9.4, 0.4, -16, -10],
    [-13, 13, -8, 8],
    [15.4, 22.4, -8, 4],
    [6.5, 11.5, 8, 16],
  ];
  let s = 13;
  const sr = (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < N; i++) {
    const z0 = zones[(sr() * zones.length) | 0];
    pos[i * 3] = z0[0] + (z0[1] - z0[0]) * sr();
    pos[i * 3 + 1] = sr() * 4.2;
    pos[i * 3 + 2] = z0[2] + (z0[3] - z0[2]) * sr();
    seed[i] = sr() * 100;
    size[i] = 5 + sr() * 11;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 }, uPR: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `
      attribute float aSeed; attribute float aSize;
      uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        vec3 p=position;
        p.y=1.1+mod(p.y+uTime*(0.22+fract(aSeed*0.37)*0.4), 4.2);
        p.x+=sin(uTime*0.4+aSeed)*0.55;
        p.z+=cos(uTime*0.31+aSeed*1.3)*0.55;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vA=sin(3.14159*clamp((p.y-1.1)/4.2,0.0,1.0));
        gl_PointSize=aSize*uPR*(6.0/max(1.0,-mv.z));
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float uIntensity; varying float vA;
      void main(){
        vec2 d=gl_PointCoord-0.5; float r=length(d);
        float a=smoothstep(0.5,0.1,r)*vA*0.26*uIntensity;
        if(a<0.012) discard;
        gl_FragColor=vec4(0.63,0.54,0.42,a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  return { mat, pts };
}
