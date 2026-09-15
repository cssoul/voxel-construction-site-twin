import * as THREE from 'three';

export interface RainSystem {
  mat: THREE.ShaderMaterial;
  pts: THREE.Points;
}

/** 暴雨：Shader Points 高速下落 + 风斜 */
export function makeRain(scene: THREE.Scene): RainSystem {
  const N = 1500;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const size = new Float32Array(N);
  let s = 31;
  const sr = (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (sr() * 2 - 1) * 27;
    pos[i * 3 + 1] = sr() * 26.0;
    pos[i * 3 + 2] = (sr() * 2 - 1) * 19;
    seed[i] = sr() * 100;
    size[i] = 1.15 + sr() * 1.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uRain: { value: 0 }, uPR: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `
      attribute float aSeed; attribute float aSize;
      uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        vec3 p=position;
        p.y=1.0+mod(p.y-uTime*(17.0+fract(aSeed*0.53)*11.0), 26.0);
        p.x+=p.y*0.05;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vA=0.55+0.45*fract(aSeed*0.71);
        gl_PointSize=aSize*uPR*(12.5/max(1.0,-mv.z));
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float uRain; varying float vA;
      void main(){
        vec2 d=gl_PointCoord-0.5;
        float a=smoothstep(0.5,0.0,abs(d.x)*2.6)*smoothstep(0.5,0.1,abs(d.y)*1.7)*vA*0.68*uRain;
        if(a<0.01) discard;
        gl_FragColor=vec4(0.72,0.8,0.92,a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.visible = false;
  scene.add(pts);
  return { mat, pts };
}
