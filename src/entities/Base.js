// Player or enemy base. Stationary structure with HP.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';

export class Base {
  constructor(opts) {
    this.scene = opts.scene;
    this.isPlayer = !!opts.isPlayer;
    this.x = opts.x;
    this.maxHp = opts.maxHp;
    this.hp = this.maxHp;
    this.alive = true;
    this.vfx = opts.vfx;
    this.color = opts.color || (this.isPlayer ? 0x4477ff : 0xff4444);
    this.accent = opts.accent || 0xffffff;
    this.label = opts.label || (this.isPlayer ? 'HQ' : 'ENEMY');

    this.group = new THREE.Group();
    this.group.position.set(this.x, 0, 0);
    this.buildMesh();
    this.scene.add(this.group);
  }

  buildMesh() {
    const ped = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 })
    );
    ped.position.y = 0.2;
    ped.castShadow = true;
    ped.receiveShadow = true;
    this.group.add(ped);

    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.4, 1.6),
      new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.6, metalness: 0.3 })
    );
    tower.position.y = 1.6;
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.tower = tower;
    this.group.add(tower);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.3, 1.0, 4),
      new THREE.MeshStandardMaterial({ color: this.accent, roughness: 0.5, metalness: 0.4 })
    );
    roof.position.y = 3.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    this.group.add(roof);

    this.barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x220000 })
    );
    this.barBg.position.y = 4.0;
    this.barBg.lookAt(0, 4.0, 13);
    this.group.add(this.barBg);

    this.barFill = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.25),
      new THREE.MeshBasicMaterial({ color: this.isPlayer ? 0x50d070 : 0xd04040 })
    );
    this.barFill.position.y = 4.0;
    this.barFill.position.z = 0.01;
    this.group.add(this.barFill);

    if (!this.isPlayer) this.group.scale.x = -1;
  }

  takeDamage(amount, source) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.vfx) this.vfx.spawnHitSpark(new THREE.Vector3(this.x, 2.0, 0), this.isPlayer ? 0x4488ff : 0xff4444);
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.die();
    }
    this.updateBar();
  }

  heal(amount) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateBar();
  }

  die() {
    if (this.vfx) {
      for (let i = 0; i < 30; i++) {
        this.vfx.spawnHitSpark(
          new THREE.Vector3(this.x + (Math.random() - 0.5) * 2, 1 + Math.random() * 2, 0),
          this.isPlayer ? 0x4488ff : 0xff4444
        );
      }
    }
    this.tower.material.color.set(0x333333);
    this.tower.scale.y = 0.3;
    this.tower.position.y = 0.6;
  }

  updateBar() {
    const f = Math.max(0, this.hp / this.maxHp);
    this.barFill.scale.x = f;
    this.barFill.position.x = -(1.0 * (1 - f));
  }

  update(dt) {
    this.barBg.lookAt(0, 4.0, 13);
    this.barFill.lookAt(0, 4.0, 13);
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
