import * as THREE from 'three';
import { Unit } from '../src/entities/Unit.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Base } from '../src/entities/Base.js';
import { UNIT_MAP } from '../src/config/units.js';
import { ENEMY_MAP } from '../src/config/enemies.js';
import { defaultStats } from '../src/config/upgrades.js';
import { FormationSystem } from '../src/systems/FormationSystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { getCharacterTexture } from '../src/systems/CharacterAssets.js';
import { portraitMarkup, bindPortraits } from '../src/ui/CharacterPortrait.js';
import { SaveSystem } from '../src/core/SaveSystem.js';

export const CAST = ['gym_uncle','manager','drunk_uncle','supermarket_auntie'];
const check = (ok, message) => { if (!ok) throw Error(message); };
export async function until(fn, message) {
  const end = performance.now() + 8000;
  while (!fn()) { if (performance.now() > end) throw Error(message); await new Promise(r => setTimeout(r, 20)); }
}
function rig() {
  const scene = new THREE.Scene(), w = { units:[], enemies:[], formation:new FormationSystem(), combat:new CombatSystem(scene),
    playerBase:new Base({scene,isPlayer:true,x:-10,maxHp:10000}), enemyBase:new Base({scene,x:10,maxHp:10000}) };
  const add = (id, x, enemy = false) => {
    const a = enemy ? new Enemy({scene,config:{...ENEMY_MAP.angry_printer,hp:10000},x})
      : new Unit({scene,config:UNIT_MAP[id],stats:defaultStats(),x});
    (enemy ? w.enemies : w.units).push(a); w.formation.register(a); return a;
  };
  const tick = () => { w.formation.prepare(1/60,w); w.units.forEach(a=>a.update(1/60,w));
    w.enemies.forEach(a=>a.update(1/60,w)); w.combat.update(1/60,w); };
  const dispose = () => { [...w.units,...w.enemies].forEach(a=>a.destroy()); w.combat.clear(); w.playerBase.destroy();w.enemyBase.destroy(); };
  return {scene,w,add,tick,dispose};
}

export async function runCharacterRegression() {
  const results = [], trace = [], game = window.__game;
  const save = localStorage.getItem('cc3d_save_v1');
  game.startBattle(1);
  let b = game.currentScene; b.paused = true; b.economy.money = 9999;
  for (const id of CAST) document.querySelector(`.deploySlot[data-unit="${id}"]`).click();
  check(b.units.length === 4 && b.economy.money === 9999 - CAST.reduce((s,id)=>s+UNIT_MAP[id].cost,0), 'actual four HUD deployments charge unchanged costs');
  check(CAST.every(id=>b.deployCd[id]>0),'deployment cooldowns preserved');
  await until(()=>b.units.every(u=>u.group.userData.assetState==='ready'),'all battlefield SVGs decode');
  for (const u of b.units) {
    check(u.body.children[0].visible && !u.group.userData.fallbackVisible, `${u.config.id} visible sprite`);
    check(u.barBg.position.y > u.config.battleSpriteHeight && u.barBg.parent === u.group,'bar above owned sprite');
    const svg = await (await fetch(u.config.battleSprite)).text();
    check(!new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror'),'valid browser SVG XML');
  }
  results.push('four actual HUD deployments, unchanged costs/cooldowns, decoded SVGs and attached HP bars');

  const shared = b.units.map(u=>u.mat.map);
  let textureDisposed = 0;
  shared.forEach(t=>t.addEventListener('dispose',()=>textureDisposed++));
  for (let i=0;i<3;i++) {
    game.startBattle(1); b=game.currentScene;b.paused=true;b.economy.money=9999;
    for (const id of CAST) {b._spawnUnit(UNIT_MAP[id]);b.deployCd[id]=0;b._spawnUnit(UNIT_MAP[id]);}
    for(let j=0;j<4;j++) {
      const [a,c]=b.units.slice(j*2,j*2+2);
      check(a.mat!==c.mat && a.mat.map===c.mat.map && a.mat.map===shared[j],'per-actor material, shared cached texture across scenes');
      a.die(); check(c.alive && c.body.children[0].visible,'duplicate remains visible after death');
    }
  }
  check(textureDisposed===0,'scene exit and death never dispose shared textures');
  game.goto('menu');
  results.push('three scene cycles: independent materials, shared texture reuse, survivor visibility');

  const scene = new THREE.Scene();
  const broken = 'data:image/svg+xml,broken-character';
  const record = getCharacterTexture(broken);
  const failed = new Unit({scene,config:{...UNIT_MAP.manager,battleSprite:broken},stats:defaultStats(),x:0});
  const late = new Unit({scene,config:{...UNIT_MAP.manager,battleSprite:broken},stats:defaultStats(),x:0});
  let disposals=0; late.mat.addEventListener('dispose',()=>disposals++);
  late.destroy();late.destroy();
  check(disposals===1 && record.subscriberCount===1,'destroy releases pending subscription/material exactly once');
  await until(()=>record.status==='error','broken image completes error');
  check(failed.group.userData.fallbackVisible && failed.body.children[1].visible && !failed.body.children[0].visible,'broken sprite visibly falls back');
  check(record.subscriberCount===0 && late.group.userData.assetState==='loading' && !late.group.parent,'late callback cannot touch dead actor');
  failed.destroy();
  const missing = new Unit({scene,config:{...UNIT_MAP.manager,battleSprite:null},stats:defaultStats(),x:0});
  check(!missing.isSpriteBody && missing.body.visible,'missing sprite uses existing visible procedural body'); missing.destroy();
  const host=document.createElement('div'); host.innerHTML=portraitMarkup({...UNIT_MAP.manager,portrait:broken});document.body.append(host);bindPortraits(host);
  await until(()=>host.firstElementChild.dataset.assetState==='error','broken portrait completes');
  check(host.querySelector('span').style.visibility==='visible','portrait failure exposes icon');host.remove();
  results.push('broken/missing image fallbacks, cancelled late load, idempotent disposal, portrait fallback');

  for(const id of CAST) {
    const t=rig(),p=t.add(id,0),e=t.add('',1.3,true); e.applyKnockback=()=>{};
    let time=0;t.w.onCombatEvent=event=>trace.push({id,time:+time.toFixed(4),event:event.type,damage:event.damage,phase:p.attackTimeline.posePhase});
    const step=dt=>{time+=dt;p.update(dt,t.w);};
    step(1/60);step(p.attackTimeline.windup-.001);
    check(e.hp===10000 && t.w.combat.projectiles.length===0,`${id}: no premature damage/release`);
    step(.001);
    check(p.animationState==='strike',`${id}: strike at contact`);
    if(p.attackType==='ranged') {
      check(t.w.combat.projectiles.length===1 && e.hp===10000,'release once before collision');
      check(t.w.combat.projectiles[0].pos.y===p.config.projectileOrigin.y,'projectile starts at configured prop height');
      time+=.5;t.w.combat.update(.5,t.w);
    }
    check(e.hp===10000-p.attack,`${id}: one configured hit`);
    step(p.attackTimeline.strike+.001);t.w.combat.update(1,t.w);
    check(p.animationState==='recovery' && e.hp===10000-p.attack,`${id}: recovery cannot damage twice`);
    t.dispose();
    const q=rig(),a=q.add(id,0),target=q.add('',1.3,true);a.update(1/60,q.w);a.die();a.update(1,q.w);q.w.combat.update(1,q.w);
    check(target.hp===10000 && q.w.combat.projectiles.length===0,`${id}: death cancels pending contact`);q.dispose();
  }
  results.push('four personalities: unchanged timeline contact/release, one damage, recovery and death cancellation');

  {
    const t=rig(); const ps=['drunk_uncle','manager','supermarket_auntie'].map(id=>t.add(id,-3));
    ps.forEach(p=>p.hp=p.maxHp=10000);
    const es=Array.from({length:3},()=>t.add('',3,true));
    const hits=new Set();t.w.onCombatEvent=e=>{if(e.type==='impact')hits.add(e.actor);};
    for(let i=0;i<900;i++)t.tick();
    check(ps.every(p=>hits.has(p)) && es.some(e=>e.hp<10000),'all three mixed roles land damage');
    check(ps.every(p=>es.every(e=>p.group.position.x<e.group.position.x)),'new art does not cross enemy ground front');
    for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)check(ps[i].group.position.distanceTo(ps[j].group.position)>1,'mixed allies retain spacing');
    es.forEach(e=>e.die());
    for(let i=0;i<1800 && t.w.enemyBase.hp===10000;i++)t.tick();
    check(t.w.enemyBase.hp<10000,'mixed winners advance and siege');t.dispose();
    const q=rig(),p=q.add('supermarket_auntie',-8);p.die();q.add('',-8,true);
    for(let i=0;i<300;i++)q.tick();
    check(q.w.playerBase.hp<10000,'enemy survivors attack reverse base after new sprite death');q.dispose();
    results.push('mixed 3v3: role damage, no crossing/ally overlap, advance and both base sieges');
  }

  game.goto('roster');
  await until(()=>CAST.every(id=>document.querySelector(`[data-character="${id}"] img`)?.naturalWidth>0),'all four roster portraits decode');
  for(const id of CAST) {
    document.querySelector(`[data-character="${id}"]`).click();
    const preview=game.currentScene.previewUnit;
    check(preview.config.id===id && preview.mat.map===shared[CAST.indexOf(id)],'roster uses actual Unit and cached battle art');
    game.currentScene.render(game.renderer);
    check(!game.renderer.getScissorTest(),'roster restores shared renderer scissor state');
  }
  game.goto('menu');
  check(textureDisposed===0,'roster preview cleanup retains shared texture');
  check(localStorage.getItem('cc3d_save_v1')===save,'character presentation does not change saved progression');
  check(SaveSystem.load().version===JSON.parse(save).version,'existing version loads');
  results.push('four roster portraits/real preview, preview cleanup and existing save compatibility');
  return {results,trace};
}
