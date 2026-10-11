'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {server,root,out}=require('./browser.cjs');
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:420,height:820}});
  await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>
   body{margin:0;background:#0e0e0e;color:#ddd;font:16px Arial} .thread-scroll-container{height:100vh;overflow:auto;scrollbar-width:thin}
   article{padding:70px 24px 220px;min-height:1700px} form{position:fixed;bottom:25px;left:16px;right:16px;height:140px;border-radius:25px;background:#242424;padding:14px;box-sizing:border-box}textarea{background:transparent;color:white;border:0;width:90%;height:65px}button{float:right}
   </style><main id="conversation" class="thread-scroll-container" data-app-action-timeline-scroll><article>Conversation content<br>Visible rose ambient light<p style="margin-top:1450px">Last message</p></article></main><form onsubmit="return false"><textarea id="prompt-textarea" placeholder="Ask ChatGPT"></textarea><button type="submit" data-testid="send-button">Send</button></form>`}));
  await ctx.addInitScript(base=>{
   window.chrome={runtime:{getURL:p=>base+'/'+p,connect:()=>({onMessage:{addListener:f=>window.emitState=f},onDisconnect:{addListener(){}},postMessage(){},disconnect(){}})},storage:{sync:{get:async()=>({gptTrackerLang:'en'}),set:async()=>{}},onChanged:{addListener(){}}},windows:{getCurrent:async()=>({id:1})}};
   localStorage.setItem('gptTrackerTheme','dark');
  },base);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/sidechat/panel.html');await p.waitForFunction(()=>window.emitState);
  const positions=()=>p.locator('.sm-ambient-flow i').evaluateAll(es=>es.map(e=>e.style.left+e.style.top));
  const first=await positions();await p.reload();await p.waitForFunction(()=>window.emitState);assert.notDeepEqual(await positions(),first);
  await p.evaluate(()=>emitState({type:'SC_STATE',state:{enabled:false,embedAllowed:true}}));
  await p.waitForFunction(()=>document.querySelector('iframe').src.startsWith('https://chatgpt.com'));
  const frame=await (async()=>{for(let i=0;i<50;i++){const f=p.frames().find(f=>f.url().startsWith('https://chatgpt.com'));if(f)return f;await p.waitForTimeout(50);}throw Error('frame missing');})();
  for(const file of ['sidechat/core.js','model-resolver.js','sidechat/view.js','sidechat/adapter.js'])await frame.addScriptTag({path:path.join(root,file)});
  await p.evaluate(()=>emitState({type:'SC_STATE',state:{enabled:true,embedAllowed:true}}));
  await p.waitForFunction(()=>document.body.dataset.sideStage==='chat');
  const stable=await positions();
  const lights=await p.locator('.sm-ambient-flow i').evaluateAll(es=>es.map(e=>({opacity:getComputedStyle(e).opacity,rect:e.getBoundingClientRect().toJSON(),animation:getComputedStyle(e).animationName})));
  assert(lights.every(e=>Number(e.opacity)===0&&e.animation==='none'));
  assert.notEqual(await p.locator('.sm-ambient-rest').evaluate(e=>getComputedStyle(e).boxShadow),'none');
  assert.equal(await p.locator('.sm-ambient-rest').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert(lights.some(e=>e.rect.x<0)&&lights.some(e=>e.rect.right>420));
  assert.equal(await p.locator('.sm-ambient-flow').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  async function boundary(){
   await frame.waitForFunction(()=>{const r=document.querySelector('#sakura-chat-scrollbar'),f=document.querySelector('form');return r&&!r.hidden&&r.getBoundingClientRect().bottom<=f.getBoundingClientRect().top-7;});
   return frame.locator('#sakura-chat-scrollbar').boundingBox();
  }
  await boundary();
  await frame.locator('#prompt-textarea').fill('Composer remains clickable');
  await frame.locator('#sakura-chat-scrollbar').focus();await p.keyboard.press('End');
  await frame.waitForFunction(()=>{const s=document.querySelector('main');return s.scrollTop+s.clientHeight>=s.scrollHeight-1;});
  await p.screenshot({path:path.join(out,'sidechat-fixed-dark.png')});
  await frame.evaluate(()=>document.querySelector('form').style.height='260px');await boundary();
  await p.setViewportSize({width:320,height:640});await boundary();
  await frame.locator('#sakura-chat-scrollbar').focus();await p.keyboard.press('Home');
  await frame.waitForFunction(()=>document.querySelector('main').scrollTop===0);
  const rail=await boundary();await p.mouse.move(rail.x+4,rail.y+8);await p.mouse.down();await p.mouse.move(rail.x+4,rail.y+rail.height-2);await p.mouse.up();
  await frame.waitForFunction(()=>document.querySelector('main').scrollTop>100);
  assert.deepEqual(await positions(),stable);
  await p.screenshot({path:path.join(out,'sidechat-fixed-narrow.png')});
  // A replacement conversation scroller must bind and remain usable after navigation.
  await frame.evaluate(()=>{const old=document.querySelector('main');old.replaceWith(old.cloneNode(true));});await boundary();
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.evaluate(()=>{emitState({type:'SC_STATE',state:{enabled:false,embedAllowed:true}});emitState({type:'SC_STATE',state:{enabled:true,embedAllowed:true}});});
  assert.equal(await p.locator('body').getAttribute('data-side-stage'),'chat');
  const d=await ctx.newPage();await d.goto(base+'/fixture');
  await d.setContent('<body class="dark"><div class="rn-window"><strong>6%</strong></div><div class="rf-metric"><span class="rf-value">19%</span></div><div class="rf-metric rf-last"><span class="rf-value">Oct 11, 2026</span></div></body>');
  for(const file of ['reset-forecast.css','prediction-ui.css'])await d.addStyleTag({path:path.join(root,file)});
  for(const dark of [true,false]){
   await d.evaluate(dark=>document.body.classList.toggle('dark',dark),dark);
   const styles=await d.locator('.rn-window strong,.rf-value').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return [s.font,s.backgroundImage,s.color,s.letterSpacing];}));
   assert.deepEqual(styles[0],styles[1]);assert.notDeepEqual(styles[1],styles[2]);
  }
  assert.deepEqual(errors,[]);console.log('PASS: randomized/stable positions, lights absorbed into retained edge glow, input clicks, dynamic composer/resize boundary, keyboard/drag scrolling, scroller replacement, reduced motion, matching light/dark number styles');
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close();});
