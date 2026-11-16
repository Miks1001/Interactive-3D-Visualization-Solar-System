import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const cache = new Map();

/**
 * Ucitava teksturu sa diska (uz kesiranje da se ista slika ne ucitava
 * vise puta). srgb=true za obicne "boja" teksture (fotografije povrsina),
 * srgb=false za teksture koje se koriste kao maske/alpha/podaci.
 */
export function loadTexture(path, { srgb = true } = {}) {
  const cacheKey = path + '|' + srgb;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const texture = loader.load(path);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 4;
  cache.set(cacheKey, texture);
  return texture;
}
