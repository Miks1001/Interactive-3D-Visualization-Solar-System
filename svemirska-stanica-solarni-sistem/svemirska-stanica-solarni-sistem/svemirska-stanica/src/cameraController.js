import * as THREE from 'three';

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Upravlja glatkim prelazima kamere izmedju pregleda celog sistema
 * i priblizavanja pojedinacnom telu (planeti / stanici / Suncu).
 */
export class CameraController {
  constructor(camera, controls, overview) {
    this.camera = camera;
    this.controls = controls;
    this.overview = overview; // { position, target, minDistance, maxDistance }
    this.isTweening = false;
  }

  /** Leti ka datom mesh-u i prilagodjava OrbitControls granice njegovoj velicini. */
  focusOn(mesh, onComplete) {
    mesh.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(mesh);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    // fallback ako telo jos nije ucitano/vidljivo (npr. stanica pre GLTF loada)
    const radius = sphere.radius > 0 ? sphere.radius : 3;
    const center = sphere.radius > 0 ? sphere.center : mesh.position.clone();

    const dir = new THREE.Vector3(0.55, 0.4, 1).normalize();
    const distance = Math.max(radius * 4.5, radius + 4);
    const endPos = center.clone().add(dir.multiplyScalar(distance));

    this._tweenTo(endPos, center, () => {
      this.controls.minDistance = Math.max(radius * 1.6, 0.5);
      this.controls.maxDistance = radius * 12 + 5;
      if (onComplete) onComplete();
    });
  }

  /** Vraca kameru na pocetni pregled celog Suncevog sistema. */
  resetToOverview(onComplete) {
    this._tweenTo(this.overview.position.clone(), this.overview.target.clone(), () => {
      this.controls.minDistance = this.overview.minDistance;
      this.controls.maxDistance = this.overview.maxDistance;
      if (onComplete) onComplete();
    });
  }

  _tweenTo(endPos, endTarget, onComplete) {
    this.isTweening = true;
    this.controls.enabled = false;

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const duration = 1500;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const e = easeInOutQuad(t);
      this.camera.position.lerpVectors(startPos, endPos, e);
      this.controls.target.lerpVectors(startTarget, endTarget, e);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.isTweening = false;
        this.controls.enabled = true;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(step);
  }
}
