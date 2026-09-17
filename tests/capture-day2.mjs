import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('../docs/day2/', import.meta.url);
await mkdir(out, {recursive:true});
const port = 8012;
const server = spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser;
try {
 for(let i=0;i<40;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 const all=[];
 for(const [width,height] of [[1440,900],[960,540]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(`http://127.0.0.1:${port}`,{waitUntil:'networkidle'});
  for(const scene of ['enemy','base','3v3']) {
   await page.evaluate(async scene=>{
    const {UNIT_MAP}=await import('/src/config/units.js'); const {ENEMY_MAP}=await import('/src/config/enemies.js');
    const g=window.__game;g.startBattle(1); const b=g.currentScene;b.paused=true;
    b.waveManager.update=()=>{};b._updateControlledChaos=()=>{};
    b.economy.money=9999;b.captureTrace=[];
    const world=b._worldSnapshot.bind(b);
    b._worldSnapshot=()=>({...world(),onCombatEvent:e=>b.captureTrace.push({time:+b.time.toFixed(4),event:e.type,actor:e.actor?.config?.id,target:e.target?.isBase?'base':e.target?.config?.id,damage:e.damage,position:e.position?.toArray()})});
    for(let i=0;i<(scene==='3v3'?3:1);i++){
     b.deployCd.gym_uncle=0;b._spawnUnit({...UNIT_MAP.gym_uncle,hp:50000});
     b.units.at(-1).group.position.x=scene==='base'?8.6:-.7;
     if(scene!=='base')b._spawnEnemy({...ENEMY_MAP.angry_printer,hp:50000},.7);
    }
    b.step=()=>{b.paused=false;b.update(1/60);b.paused=true;};
    b.step();
   },scene);
   if(width===1440 && scene==='enemy'){
    await page.evaluate(()=>{const b=window.__game.currentScene;for(let i=0;i<12;i++)b.step();});
    await page.screenshot({path:fileURLToPath(new URL('gym-anticipation-1440.jpg',out)),type:'jpeg',quality:82});
   }
   const trace=await page.evaluate(()=>{
    const b=window.__game.currentScene;
    for(let i=0;i<180&&!b.captureTrace.some(e=>e.event==='impact'&&e.actor==='gym_uncle');i++)b.step();
    return {trace:b.captureTrace,phase:b.units[0].animationState,hp:b.enemies[0]?.hp??b.enemyBase.hp,particles:b.vfx.particles.length};
   });
   await page.screenshot({path:fileURLToPath(new URL(`${scene}-contact-${width}.jpg`,out)),type:'jpeg',quality:82});
   all.push({width,height,scene,...trace});
   if(width===1440 && scene==='enemy') {
    await page.evaluate(()=>{const b=window.__game.currentScene;for(let i=0;i<12;i++)b.step();});
    await page.screenshot({path:fileURLToPath(new URL('gym-recovery-1440.jpg',out)),type:'jpeg',quality:82});
   }
  }
  if(width===1440){
   const stress=await page.evaluate(async()=>{
    const {UNIT_MAP}=await import('/src/config/units.js');const {ENEMY_MAP}=await import('/src/config/enemies.js');
    const g=window.__game;g.startBattle(1);const b=g.currentScene;b.paused=true;
    b.waveManager.update=()=>{};b._updateControlledChaos=()=>{};
    for(let i=0;i<10;i++){
     b.economy.money=9999;b.deployCd.gym_uncle=0;b._spawnUnit({...UNIT_MAP.gym_uncle,hp:50000});b.units.at(-1).group.position.x=-2-(i/3|0)*1.5;
     b._spawnEnemy({...ENEMY_MAP.angry_printer,hp:50000},2+(i/3|0)*1.5);
    }
    b.paused=false;
    const samples=[];let prev=performance.now(),peak=0,texts=0;
    await new Promise(resolve=>{function sample(now){samples.push(now-prev);prev=now;peak=Math.max(peak,b.vfx.particles.length);texts=Math.max(texts,b.vfx.particles.filter(p=>p.isText).length);if(samples.length<180)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});
    b.paused=true;samples.shift();samples.sort((a,b)=>a-b);
    return {actors:b.units.length+b.enemies.length,frames:samples.length,medianFrameMs:samples[samples.length>>1],p95FrameMs:samples[Math.floor(samples.length*.95)],peakEffects:peak,peakTexts:texts};
   });
   all.push({stress});await page.screenshot({path:fileURLToPath(new URL('stress-20-1440.jpg',out)),type:'jpeg',quality:82});
  }
  await page.close();
 }
 await writeFile(new URL('trace.json',out),JSON.stringify(all,null,2)+'\n');
 console.log(JSON.stringify(all));
}finally{await browser?.close();server.kill();}
