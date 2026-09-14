// VFXSystem manages transient particle / spark / explosion effects.
import * as THREE from 'three';

const MAX_PARTICLES = 240;

export class VFXSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this._sharedGeo = new THREE.SphereGeometry(0.12, 6, 4);
  }

  _spawnParticle(pos, color, life, velocity, scale = 1) {
    if (this.particles.length >= MAX_PARTICLES) {
      const old = this.particles.shift();
      if (old.mesh) {
        this.scene.remove(old.mesh);
        old.mesh.material.dispose();
      }
    }
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this._sharedGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);
    this.particles.push({
      mesh, mat,
      pos: pos.clone(),
      vel: velocity.clone(),
      life, maxLife: life,
      gravity: -3,
    });
  }

  spawnHitSpark(pos, color) {
    for (let i = 0; i < 6; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 2);
      this._spawnParticle(pos.clone(), color, 0.4, v, 0.6);
    }
  }

  spawnDeathBurst(pos, color) {
    for (let i = 0; i < 16; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5 + 1, (Math.random() - 0.5) * 3);
      this._spawnParticle(pos.clone(), color, 0.7, v, 0.9);
    }
    this.spawnShockwave(pos, color, 1.2);
  }

  spawnExplosion(pos, color, radius) {
    const n = Math.min(30, Math.floor(radius * 12));
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * radius * 4, Math.random() * radius * 3, (Math.random() - 0.5) * radius * 2);
      this._spawnParticle(pos.clone(), color, 0.5, v, 1.0);
    }
    this.spawnShockwave(pos, color, radius);
  }

  spawnShockwave(pos, color, radius = 1.5) {
    const geo = new THREE.RingGeometry(0.1, 0.3, 24);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.particles.push({
      mesh: ring, mat,
      pos: pos.clone(),
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.4, maxLife: 0.4,
      gravity: 0,
      isRing: true,
      maxRadius: radius * 1.5,
    });
  }

  spawnCoinBurst(pos, amount) {
    const n = Math.min(12, Math.max(4, Math.floor(amount / 5)));
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 4 + 2, (Math.random() - 0.5) * 2);
      this._spawnParticle(pos.clone(), 0xffcc33, 0.6, v, 0.5);
    }
  }

  spawnDashTrail(pos) {
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Vector3(-Math.random() * 2, Math.random() * 0.5, 0);
      this._spawnParticle(pos.clone(), 0xffaa44, 0.3, v, 0.4);
    }
  }

  spawnConeBreath(pos, color) {
    for (let i = 0; i < 20; i++) {
      const v = new THREE.Vector3(-Math.random() * 6 - 1, (Math.random() - 0.3) * 3, (Math.random() - 0.5) * 1.5);
      this._spawnParticle(pos.clone(), color, 0.6, v, 0.8);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry && p.mesh.geometry !== this._sharedGeo) p.mesh.geometry.dispose();
        if (p.mat) p.mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      if (p.isRing) {
        const t = 1 - p.life / p.maxLife;
        const r = p.maxRadius * t;
        p.mesh.scale.setScalar(Math.max(0.1, r));
        p.mat.opacity = (1 - t) * 0.8;
      } else {
        p.vel.y += p.gravity * dt;
        p.pos.add(p.vel.clone().multiplyScalar(dt));
        p.mesh.position.copy(p.pos);
        const t = p.life / p.maxLife;
        p.mat.opacity = t;
        p.mesh.scale.setScalar(0.6 + 0.6 * t);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.geometry && p.mesh.geometry !== this._sharedGeo) p.mesh.geometry.dispose();
      if (p.mat) p.mat.dispose();
    }
    this.particles.length = 0;
    if (this._sharedGeo) {
      this._sharedGeo.dispose();
      this._sharedGeo = null;
    }
  }
}
