import * as THREE from 'three';

// Images belong to the application, materials and subscriptions to each actor.
// A failed load is evicted so a later deployment can retry a repaired URL.
const textures = new Map();
export function getCharacterTexture(url) {
  if (textures.has(url)) return textures.get(url);
  const listeners = new Set();
  const record = {
    texture: null, status: 'loading',
    get subscriberCount() { return listeners.size; },
    subscribe(fn) {
      if (record.status === 'loading') listeners.add(fn);
      fn(record.status);
      return () => listeners.delete(fn);
    },
  };
  textures.set(url, record);
  const finish = status => {
    record.status = status;
    if (status === 'error') textures.delete(url);
    for (const fn of listeners) fn(status);
    listeners.clear();
  };
  record.texture = new THREE.TextureLoader().load(url,
    () => finish('ready'), undefined, () => finish('error'));
  record.texture.colorSpace = THREE.SRGBColorSpace;
  return record;
}
