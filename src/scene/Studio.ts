import * as THREE from 'three';

/** 灯光影棚：与静态版一致的光源配置 */
export interface StudioLights {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  amb: THREE.AmbientLight;
  spotPit: THREE.SpotLight;
  spotBld: THREE.SpotLight;
}

export function createStudio(scene: THREE.Scene, groundY: number): StudioLights {
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -27;
  sc.right = 27;
  sc.top = 22;
  sc.bottom = -22;
  sc.near = 2;
  sc.far = 110;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xbfd4e8, 0x4a3b2a, 0.5);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);

  const spotPit = new THREE.SpotLight(0xffedc0, 0, 20, 0.62, 0.5, 1.4);
  spotPit.position.set(-14.2, groundY + 2.6, -4.6);
  spotPit.target.position.set(-18.6, groundY - 1.5, 2.2);
  scene.add(spotPit);
  scene.add(spotPit.target);

  const spotBld = new THREE.SpotLight(0xffedc0, 0, 22, 0.6, 0.5, 1.4);
  spotBld.position.set(12.4, groundY + 2.6, 3.2);
  spotBld.target.position.set(6.5, groundY + 6, -2);
  scene.add(spotBld);
  scene.add(spotBld.target);

  return { sun, hemi, amb, spotPit, spotBld };
}
