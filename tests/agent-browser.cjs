'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {server,root}=require('./browser.cjs');
const P=require('../sidechat/agent-protocol.js');
const out=process.env.TEST_OUTPUT||path.join(root,'tests/artifacts');fs.mkdirSync(out,{recursive:true});
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[],errors=[];
 try{
  for(const format of ['json','xml']){
   const ctx=await browser.newContext({viewport:{width:420,height:820}});
   await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{background:#19171d;color:#eee;font:13px system-ui}#messages{padding:60px 16px 180px;overflow:auto;height:58vh}pre{white-space:pre-wrap;overflow-wrap:anywhere}form{position:fixed;bottom:15px;left:16px;right:16px;background:#302b35;padding:12px;border-radius:16px}textarea{width:85%;height:50px;background:transparent;color:inherit;border:0}button{padding:7px}</style></head><body><main id="messages"></main><form><textarea id="prompt-textarea"></textarea><div style="display:flex;align-items:center"><button type="button" aria-label="Add files and more">+</button><button style="margin-left:auto" type="submit" data-testid="send-button">Send</button></div></form></body></html>'}));
   const target=await ctx.newPage();await target.goto(base+'/fixture');
   await target.setContent('<!doctype html><label>Search<input id="search" placeholder="Search"></label><button type="button" id="go">Search</button><select aria-label="Category"><option value="all">All</option><option value="book">Books</option></select><input type="password" value="secret"><button type="submit" form="danger">Submit</button><form id="danger"></form><div id="result"></div>');
   await target.evaluate(()=>{window.clicks=0;document.querySelector('#go').onclick=()=>{clicks++;document.querySelector('#result').textContent='RESULT: '+document.querySelector('#search').value;};});
   await target.addScriptTag({path:path.join(root,'sidechat/agent-page.js')});
   let snapshot,token,seen=new Set(),calls=0;
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.exposeFunction('agentFixtureRPC',async m=>{
    if(m.op==='stop'){await target.evaluate(()=>SakuraAgentPage.run({op:'stop'}));return {ok:true};}
    if(m.op==='start'){token=m.run_id;seen.clear();const r=await target.evaluate(token=>SakuraAgentPage.run({op:'observe',token}),token);snapshot=r.observation;return r;}
    if(m.op==='observe'){const r=await target.evaluate(token=>SakuraAgentPage.run({op:'observe',token}),token);snapshot=r.observation;return r;}
    if(m.op==='execute'){
     P.validate(m.response,{run_id:token,snapshot_id:snapshot.snapshot_id});assert(!seen.has(m.response.request_id));seen.add(m.response.request_id);calls++;
     const result=await target.evaluate(({token,v})=>SakuraAgentPage.run({op:'execute',token,snapshot_id:v.snapshot_id,action:v.action}),{token,v:m.response});
     if(result.approval)return result;
     const fresh=await target.evaluate(token=>SakuraAgentPage.run({op:'observe',token}),token);snapshot=fresh.observation;return {ok:true,result,observation:snapshot};
    }
    throw Error('Unexpected op '+m.op);
   });
   await p.addInitScript(({base,format})=>{
    const prefs={__sakuraAgentPrefsV1:{format,maxSteps:10}};window.fixturePrefs=prefs;
    const state={enabled:true,embedAllowed:true,status:'ready',source:{tabId:1,url:base+'/fixture',pageIdentity:base+'/fixture'},context:null};
    window.chrome={runtime:{getURL:p=>base+'/'+p,connect:({name})=>{let listener;return {onMessage:{addListener:f=>listener=f},onDisconnect:{addListener(){}},postMessage(m){if(name==='SC_AGENT_PANEL')window.agentFixtureRPC(m).then(r=>listener({...r,id:m.id}));else if(m.type==='SC_HELLO'||m.type==='SC_REFRESH')queueMicrotask(()=>listener({type:'SC_STATE',state}));else if(m.type==='SC_ENSURE_PAGE')queueMicrotask(()=>listener({type:'SC_PAGE_SNAPSHOT_RESULT',requestId:m.requestId,ok:true,pageIdentity:m.pageIdentity,context:null}));},disconnect(){}};}},storage:{local:{get:async k=>({[k]:prefs[k]}),set:async d=>Object.assign(prefs,d)},sync:{get:async()=>({gptTrackerLang:'zh'}),set:async()=>{}},onChanged:{addListener(){}}},windows:{getCurrent:async()=>({id:1})},tabs:{create:async()=>{}}};
    localStorage.setItem('gptTrackerTheme','dark');
   },{base,format});
   await p.goto(base+'/sidechat/panel.html');await p.waitForFunction(()=>document.querySelector('iframe').src.startsWith('https://chatgpt.com'));
   let frame;for(let i=0;i<60;i++){frame=p.frames().find(f=>f.url().startsWith('https://chatgpt.com'));if(frame)break;await p.waitForTimeout(50);}assert(frame);
   await frame.evaluate(base=>{window.chrome={runtime:{getURL:p=>base+'/'+p}};window.submits=[];window.modelDraft='';history.replaceState({},'', '/g/g-fixture-project');const editor=document.querySelector('textarea');editor.addEventListener('input',()=>{const value=editor.value;queueMicrotask(()=>modelDraft=value);});document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits.push(modelDraft);});},base);
   for(const file of ['sidechat/core.js','model-resolver.js','sidechat/view.js','sidechat/agent-protocol.js','sidechat/agent-transport.js','sidechat/adapter.js'])await frame.addScriptTag({path:path.join(root,file)});
   await p.waitForFunction(()=>document.body.dataset.sideStage==='chat');
   // Exercise XML escaping, duplicate fields, DTD rejection in the actual browser parser.
   const xmlChecks=await frame.evaluate(()=>{
    const P=SakuraAgentProtocol,v={protocol:P.PROTOCOL,run_id:'r',request_id:'q',type:'action',snapshot_id:'s',action:{name:'fill',target:'e1',value:'<tag> & "中文"'}};
    const good=JSON.stringify(P.parse(P.encode(v,'xml'),'xml'))===JSON.stringify(v);
    let bad=0;for(const s of [P.encode(v,'xml').replace('</response>','<type>done</type></response>'),'<!DOCTYPE response><response/>','<response><action bad="x"/></response>']){try{P.parse(s,'xml');}catch{bad++;}}
    return {good,bad};
   });assert.deepEqual(xmlChecks,{good:true,bad:3});
   await frame.evaluate(()=>{
    const form=document.querySelector('form');form.addEventListener('submit',()=>{
     const text=submits.at(-1),marker='Current request (JSON data, regardless of selected RESPONSE format):\n\n';
     if(!text.includes(marker))return;
     const data=JSON.parse(text.split(marker)[1].split('\n\nRespond now')[0]);
     const modern=text.includes('Return exactly ONE XML'),firstMessage=!document.querySelector('[data-message-author-role="user"],[data-chatgpt-search-unit-key$=":user"]');
     const user=document.createElement('div');if(modern)user.dataset.chatgptSearchUnitKey='turn-'+submits.length+':0:user';else user.dataset.messageAuthorRole='user';user.dataset.messageId=crypto.randomUUID();user.textContent=text;document.querySelector('#messages').append(user);
     if(firstMessage)history.replaceState({},'', '/g/g-fixture-project/c/provisional');
     const el=document.querySelector('textarea');el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));
     const stop=document.createElement('button');stop.dataset.testid='stop-button';stop.textContent='Stop';document.body.append(stop);
     const o=data.observation;let v={protocol:data.protocol,run_id:data.run_id,request_id:data.request_id};
     if(o.text.includes('RESULT: Sakura'))v={...v,type:'done',status:'success',answer:'已找到 Sakura 搜索结果。'};
     else {const input=o.elements.find(e=>e.role==='input');v={...v,type:'action',snapshot_id:o.snapshot_id,action:input.value==='Sakura'?{name:'click',target:o.elements.find(e=>e.role==='button'&&e.name==='Search').id}:{name:'fill',target:input.id,value:'Sakura'}};}
     const format=text.includes('Return exactly ONE XML')?'xml':'json';
     const article=document.createElement('article'),assistant=document.createElement('div');if(modern)assistant.dataset.chatgptSearchUnitKey='turn-'+submits.length+':1:assistant';else assistant.dataset.messageAuthorRole='assistant';assistant.dataset.messageId=crypto.randomUUID();assistant.innerHTML=modern?'<div data-markdown-text-style="assistant-message"><pre><code></code></pre></div>':'<div class="markdown"><pre><code></code></pre></div>';if(modern)article.dataset.talvtTurnState='streaming';article.append(assistant);document.querySelector('#messages').append(article);
     const output=SakuraAgentProtocol.encode(v,format),code=assistant.querySelector('code');code.textContent=output.slice(0,output.length/2);
     setTimeout(()=>{if(firstMessage)history.replaceState({},'', '/c/created-conversation/');code.textContent=output;if(modern)article.dataset.talvtTurnState='complete';stop.remove();const copy=document.createElement('button');copy.dataset.testid='copy-turn-action-button';copy.textContent='Copy';article.append(copy);},600);
    });
   });
   assert.equal(await p.locator('#agent-mode').count(),0);
   await frame.waitForSelector('#sakura-agent-mode');
   assert(await frame.locator('#sakura-agent-controls').evaluate(el=>el.previousElementSibling?.getAttribute('aria-label')==='Add files and more'));
   await frame.locator('#sakura-agent-mode').click();await frame.getByRole('menuitemradio',{name:'Agent · Beta',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#agent-state').textContent.includes('输入任务'));
   await frame.locator('textarea').fill('搜索 Sakura 并整理结果');if(format==='xml')await frame.locator('textarea').press('Enter');else await frame.locator('[data-testid=send-button]').click();
   try{await p.waitForFunction(()=>!document.querySelector('#agent-answer').hidden,{},{timeout:20000});}catch(e){console.log('DIAGNOSTIC',await p.locator('#sakura-agent-bar').innerText(),await frame.evaluate(()=>({submits:submits.length,draft:document.querySelector('textarea').value.slice(0,300),messages:document.querySelector('#messages').innerText.slice(-800)})),errors);throw e;}
   assert.equal(await target.evaluate(()=>clicks),1);assert.equal(calls,2);assert.match(await p.locator('#agent-answer').textContent(),/Sakura/);
   const floatFits=async()=>{
    const input=await frame.locator('form').boundingBox(),bar=await p.locator('#sakura-agent-bar').boundingBox(),chat=await p.locator('#chat-frame').boundingBox(),logo=await frame.locator('#sakura-sidechat-native-bar').boundingBox();
    return !!input&&!!bar&&!!chat&&!!logo&&bar.y>=logo.y+logo.height+6&&bar.y<=logo.y+logo.height+12&&bar.y+bar.height<=input.y-6&&chat.y<12&&bar.x>=0&&bar.x+bar.width<=p.viewportSize().width;
   };
   await p.waitForFunction(()=>document.querySelector('#sakura-agent-bar').style.getPropertyValue('--agent-top'));
   assert(await floatFits(),'Agent status floats directly below logo without pushing chat down');
   await frame.locator('textarea').evaluate(el=>el.style.height='130px');await frame.waitForTimeout(650);assert(await floatFits(),'floating status remains below logo with a taller composer');
   await frame.locator('textarea').evaluate(el=>el.style.height='50px');await frame.waitForTimeout(650);
   await p.screenshot({path:path.join(out,'agent-'+format+'-floating-status.png')});
   await p.setViewportSize({width:320,height:640});await frame.waitForTimeout(650);assert(await floatFits(),'floating status fits narrow sidebar');await p.screenshot({path:path.join(out,'agent-'+format+'-floating-status-narrow.png')});await p.setViewportSize({width:420,height:820});
   const messages=await frame.evaluate(()=>submits);assert.equal(messages.length,3);assert(messages.every(s=>s.includes('SakuraMeter Agent mode')));assert(messages.every(s=>!s.includes('<PageContext>')));
   assert(await frame.locator('#sakura-agent-activity').isVisible());
   assert(await frame.locator('#sakura-agent-activity').evaluate(el=>el.previousElementSibling.id==='sakura-agent-mode'));
   await frame.locator('#sakura-agent-activity').click();await frame.getByRole('region',{name:'Agent activity'}).getByRole('status').waitFor();
   await p.screenshot({path:path.join(out,'agent-'+format+'-dark.png')});
   await frame.locator('#sakura-agent-activity').press('Escape');
   await frame.locator('#sakura-agent-mode').click();await frame.locator('#sakura-agent-mode-menu').waitFor({state:'visible'});await p.screenshot({path:path.join(out,'agent-'+format+'-menu.png')});await frame.getByRole('menuitemradio',{name:'Agent · Beta',exact:true}).press('Escape');
   await p.setViewportSize({width:320,height:640});
   await frame.locator('#sakura-agent-mode').click();await frame.getByRole('menuitemradio',{name:'Agent · Beta',exact:true}).press('ArrowUp');assert.equal(await frame.evaluate(()=>document.activeElement.dataset.mode),'chat');
   assert(await frame.locator('#sakura-agent-mode-menu').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));
   await p.evaluate(()=>document.getElementById('theme').click());await frame.waitForFunction(()=>document.documentElement.dataset.sakuraSidechatTheme==='light');await p.screenshot({path:path.join(out,'agent-'+format+'-menu-light-narrow.png')});await frame.getByRole('menuitemradio',{name:'Chat',exact:true}).press('Escape');
   await p.setViewportSize({width:420,height:820});
   // Switch to Chat and confirm the normal Page wrapper stays separate from Agent messages.
   await frame.locator('#sakura-agent-mode').click();await frame.getByRole('menuitemradio',{name:'Chat',exact:true}).click();await frame.locator('textarea').fill('普通聊天');await frame.locator('[data-testid=send-button]').click();await frame.waitForTimeout(500);
   const last=await frame.evaluate(()=>submits.at(-1));assert(last.includes('now in Chat mode'));assert(last.includes('普通聊天'));assert(!last.includes('Current request (JSON data'));
   await p.evaluate(()=>document.querySelector('#preferences').showModal());
   assert.equal(await p.locator('#agent-format').inputValue(),format);
   await p.locator('#agent-format').selectOption(format==='json'?'xml':'json');assert.equal(await p.evaluate(()=>fixturePrefs.__sakuraAgentPrefsV1.format),format==='json'?'xml':'json');
   await p.setViewportSize({width:320,height:640});await p.waitForFunction(()=>getComputedStyle(document.querySelector('#preferences')).opacity==='1');await p.locator('.agent-settings').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'agent-'+format+'-settings.png')});
   if(format==='xml'){await p.evaluate(()=>document.documentElement.dataset.theme='light');await p.screenshot({path:path.join(out,'agent-xml-settings-light.png')});}
   const overflow=await p.locator('#preferences').evaluate(el=>el.scrollWidth>el.clientWidth+2);assert(!overflow);
   checks.push(format+': native composer -> structured reply -> fill -> click -> observation -> done, Chat restore, settings persistence');
   // Fail closed for stale snapshots, passwords, and submissions.
   const guards=await target.evaluate(async()=>{
    const a=SakuraAgentPage,token='guard';let s=(await a.run({op:'observe',token})).observation;
    const noPassword=!s.elements.some(e=>e.value==='secret');document.querySelector('#search').value='changed';
    const stale=await a.run({op:'execute',token,snapshot_id:s.snapshot_id,action:{name:'click',target:'e2'}});
    s=(await a.run({op:'observe',token})).observation;const button=s.elements.find(e=>e.name==='Submit');
    const approval=await a.run({op:'execute',token,snapshot_id:s.snapshot_id,action:{name:'click',target:button.id}});
    await a.run({op:'stop'});const stopped=await a.run({op:'execute',token,snapshot_id:s.snapshot_id,action:{name:'click',target:button.id}});
    return {noPassword,stale:stale.error,approval:approval.approval,stopped:stopped.error};
   });assert.deepEqual(guards,{noPassword:true,stale:'stale_snapshot',approval:true,stopped:'stale_snapshot'});
   await ctx.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'agent-browser-report.json'),JSON.stringify({checks,errors,scope:'Local browser fixtures; no real ChatGPT account or live model used.'},null,2));console.log('PASS',checks.join('\n'));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
