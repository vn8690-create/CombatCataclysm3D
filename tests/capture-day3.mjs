import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('../docs/day3/', import.meta.url);
await mkdir(out, {recursive:true});
const port=8012;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser;
try {
  for(let i=0;i<40;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const evidence=[];
  for(const [width,height] of [[1440,900],[960,540]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(`http://127.0.0.1:${port}`,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{
      const {CAST,until}=await import('/tests/browser-characters.js');
      window.__game.goto('roster');
      document.querySelector('[data-character="manager"]').click();
      await until(()=>CAST.every(id=>document.querySelector(`[data-character="${id}"] img`)?.naturalWidth>0),'roster art load');
      await until(()=>window.__game.currentScene.previewUnit.group.userData.assetState==='ready','roster preview load');
      window.__game.currentScene.render(window.__game.renderer);
    });
    await page.screenshot({path:fileURLToPath(new URL(`roster-${width}.jpg`,out)),type:'jpeg',quality:86});
    await page.evaluate(async()=>{
      const {CAST,until}=await import('/tests/browser-characters.js');
      const {UNIT_MAP}=await import('/src/config/units.js');const {ENEMY_MAP}=await import('/src/config/enemies.js');
      const g=window.__game;g.startBattle(1);const b=g.currentScene;b.paused=true;
      b.waveManager.update=()=>{};b._updateControlledChaos=()=>{};b.economy.money=9999;b.captureTrace=[];b.capturePoses=[];
      const world=b._worldSnapshot.bind(b);
      b._worldSnapshot=()=>({...world(),onCombatEvent:e=>b.captureTrace.push({time:+b.time.toFixed(4),event:e.type,id:e.actor?.config?.id,
        target:e.target?.isBase?'base':e.target?.config?.id,damage:e.damage,phase:e.actor?.attackTimeline?.posePhase})});
      for(const id of CAST){b._spawnUnit({...UNIT_MAP[id],hp:5000});}
      const xs=[-1.8,-5,-1.6,-3.9];b.units.forEach((u,i)=>u.group.position.x=xs[i]);
      for(let i=0;i<3;i++)b._spawnEnemy({...ENEMY_MAP.angry_printer,hp:5000},1.8);
      await until(()=>b.units.every(u=>u.group.userData.assetState==='ready'),'battle sprite load');
      b.step=()=>{b.paused=false;b.update(1/60);b.paused=true;
        for(const u of b.units)if(u.capturePhase!==u.animationState){
          b.capturePoses.push({time:+b.time.toFixed(4),id:u.config.id,phase:u.animationState,
            position:u.body.position.toArray(),rotation:u.mat.rotation,scale:u.body.scale.toArray()});u.capturePhase=u.animationState;
        }
      };
      for(let i=0;i<240;i++)b.step();
      b.render(g.renderer);
    });
    await page.screenshot({path:fileURLToPath(new URL(`battle-${width}.jpg`,out)),type:'jpeg',quality:88});
    evidence.push(await page.evaluate(({width,height})=>{
      const b=window.__game.currentScene;
      return {width,height,scenario:'four cast vs three printers; capture-only 5000 troop HP, waves/comedy disabled',
        time:b.time,actors:b.units.map(u=>({id:u.config.id,hp:u.hp,position:u.group.position.toArray(),phase:u.animationState,assetState:u.group.userData.assetState})),
        trace:b.captureTrace,poses:b.capturePoses};
    },{width,height}));
    await page.evaluate(()=>{
      const b=window.__game.currentScene;
      b.enemies.forEach(e=>e.destroy());b.enemies=[];b.combat.clear();b.vfx.clear();
      const xs=[-4,-7,-.6,2.8];
      b.units.forEach((u,i)=>{u.group.position.x=xs[i];u.attackTimeline.cancel();});
      b.step();b.render(window.__game.renderer);
    });
    await page.screenshot({path:fileURLToPath(new URL(`march-${width}.jpg`,out)),type:'jpeg',quality:86});
    if(errors.length)throw Error(errors.join('\n'));
    await page.close();
  }
  await writeFile(new URL('trace.json',out),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence.map(e=>({width:e.width,height:e.height,time:e.time,actors:e.actors,events:e.trace.length}))));
} finally {await browser?.close();server.kill();}
