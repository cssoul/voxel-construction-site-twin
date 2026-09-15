import * as THREE from 'three';

export interface BurstSystem {
  spawn(x: number, y: number, z: number, n: number, spread: number): void;
  update(dt: number): void;
}

/** 卸料/挖掘扬尘爆点（CPU 积分的小型粒子池） */
export function makeBurst(scene: THREE.Scene): BurstSystem {
  const N = 240;
  const pos = new Float32Array(N * 3);
  const life = new Float32Array(N);
  const vel = new Float32Array(N * 3);
  const maxL = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aLife', new THREE.BufferAttribute(life, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uPR: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `
      attribute float aLife; varying float vL; uniform float uPR;
      void main(){
        vL=aLife;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=(2.0+aLife*7.0)*uPR*(6.0/max(1.0,-mv.z));
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vL;
      void main(){
        vec2 d=gl_PointCoord-0.5;
        float a=smoothstep(0.5,0.1,length(d))*vL*0.5;
        if(a<0.01) discard;
        gl_FragColor=vec4(0.58,0.48,0.36,a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  let cursor = 0;
  return {
    spawn(x, y, z, n, spread) {
      for (let k = 0; k < n; k++) {
        cursor = (cursor + 1) % N;
        const i = cursor;
        pos[i * 3] = x + (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 1] = y + Math.random() * 0.2;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
        vel[i * 3] = (Math.random() - 0.5) * spread * 2.2;
        vel[i * 3 + 1] = Math.random() * spread * 2.4 + 0.6;
        vel[i * 3 + 2] = (Math.random() - 0.5) * spread * 2.2;
        maxL[i] = 0.7 + Math.random() * 0.7;
        life[i] = 1;
      }
      geo.attributes.position.needsUpdate = true;
    },
    update(dt) {
      let any = false;
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt / maxL[i];
        vel[i * 3 + 1] -= dt * 4.5;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (life[i] < 0) life[i] = 0;
      }
      if (any) {
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aLife.needsUpdate = true;
      }
    },
  };
}
