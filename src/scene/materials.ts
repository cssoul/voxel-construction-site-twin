import * as THREE from 'three';
import { bindWheelMats } from './voxel';
import { woodTexture } from './props/Textures';

export interface Materials {
  wood: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  concDark: THREE.MeshStandardMaterial;
  cement: THREE.MeshStandardMaterial;
  dirtA: THREE.MeshStandardMaterial;
  dirtB: THREE.MeshStandardMaterial;
  dirtC: THREE.MeshStandardMaterial;
  dirtFresh: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
  sand: THREE.MeshStandardMaterial;
  gravel: THREE.MeshStandardMaterial;
  brick: THREE.MeshStandardMaterial;
  bag: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  rust: THREE.MeshStandardMaterial;
  yellow: THREE.MeshStandardMaterial;
  orange: THREE.MeshStandardMaterial;
  red: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  blue: THREE.MeshStandardMaterial;
  blueD: THREE.MeshStandardMaterial;
  navy: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  plank: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
  pants: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  beacon: THREE.MeshStandardMaterial;
  cabGlass: THREE.MeshStandardMaterial;
  headLight: THREE.MeshStandardMaterial;
  lampOn: THREE.MeshStandardMaterial;
  ledOff: THREE.MeshStandardMaterial;
  ledOn: THREE.MeshStandardMaterial;
  drum: THREE.MeshStandardMaterial;
}

function std(c: number, r = 0.85, m = 0, e = 0, ec = 0xffffff): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: ec, emissiveIntensity: e });
}

export function createMaterials(): Materials {
  const M: Materials = {
    wood: new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.68, metalness: 0.05 }),
    concrete: std(0xb7bbbf, 0.92),
    concDark: std(0x8b9196, 0.9),
    cement: std(0xd9dcde, 0.85),
    dirtA: std(0x8a6a46, 0.96),
    dirtB: std(0x6f5536, 0.96),
    dirtC: std(0x5a4227, 0.97),
    dirtFresh: std(0x7d6040, 0.96),
    soil: std(0x5e4a30, 0.95),
    sand: std(0xcbb283, 0.95),
    gravel: std(0x9a948a, 0.95),
    brick: std(0xa34f36, 0.9),
    bag: std(0xe2ded2, 0.9),
    steel: std(0x9aa2a9, 0.45, 0.6),
    steelDark: std(0x3c4248, 0.6, 0.4),
    rust: std(0x8a4a2c, 0.9, 0.15),
    yellow: std(0xf0b02f, 0.6, 0.1),
    orange: std(0xe0781c, 0.6, 0.05),
    red: std(0xd63f2c, 0.6),
    white: std(0xeeeff1, 0.7),
    blue: std(0x2e6cb5, 0.7),
    blueD: std(0x27507f, 0.7),
    navy: std(0x2e3d55, 0.8),
    black: std(0x24272b, 0.7),
    rubber: std(0x1c1f22, 0.95),
    plank: std(0xb08a4a, 0.8),
    skin: std(0xdfb08c, 0.85),
    pants: std(0x33373d, 0.9),
    glass: new THREE.MeshStandardMaterial({ color: 0x27313d, roughness: 0.18, metalness: 0.55, emissive: 0xffc27a, emissiveIntensity: 0 }),
    beacon: new THREE.MeshStandardMaterial({ color: 0x571512, roughness: 0.4, emissive: 0xff2418, emissiveIntensity: 0.35 }),
    cabGlass: new THREE.MeshStandardMaterial({ color: 0x1d2a36, roughness: 0.2, metalness: 0.5, emissive: 0xffdf9e, emissiveIntensity: 0 }),
    headLight: new THREE.MeshStandardMaterial({ color: 0xfffbe8, roughness: 0.3, emissive: 0xfff3c8, emissiveIntensity: 0 }),
    lampOn: new THREE.MeshStandardMaterial({ color: 0xfff6dc, roughness: 0.4, emissive: 0xffedbb, emissiveIntensity: 0 }),
    ledOff: std(0x14251c, 0.6),
    ledOn: new THREE.MeshStandardMaterial({ color: 0x123524, emissive: 0x54ff9a, emissiveIntensity: 1.6 }),
    drum: std(0xe8e4da, 0.5, 0.3),
  };
  bindWheelMats(M);
  return M;
}
