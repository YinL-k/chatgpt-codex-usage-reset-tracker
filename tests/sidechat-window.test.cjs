'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),K=require('../sidechat/core');
const wait=()=>new Promise(r=>setTimeout(r,5));
async function until(f){for(let i=0;i<100;i++){if(f())return;await wait();}throw Error('timeout');}
function boot(data={}){
 let connect,receive,removed;const stopped=[],closed=[],injected=[];
 const event=()=>({addListener(){}}),tabs=new Map([1,2].map(id=>[id,{id,windowId:id,active:true,url:`https://example.com/${id}`} ]));
 const chrome={runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onConnect:{addListener:f=>connect=f},onMessage:{addListener:f=>receive=f},onStartup:event()},
 storage:{session:{get:async()=>data,set:async v=>Object.assign(data,v),setAccessLevel:async()=>{}},local:{get:async()=>({__sakuraSidePrefsV1:{enabled:true}})}},
 tabs:{get:async id=>({...tabs.get(id)}),query:async q=>[tabs.get(q.windowId)],sendMessage:async(id,m)=>{stopped.push([id,m.type]);return {ok:true};},onActivated:event(),onUpdated:event(),onRemoved:event()},
 windows:{get:async id=>({id}),onRemoved:{addListener:f=>removed=f}},sidePanel:{close:async o=>closed.push(o.windowId)},
 permissions:{contains:async()=>true,onAdded:event(),onRemoved:event()},scripting:{executeScript:async o=>injected.push(o.target.tabId)},declarativeNetRequest:{updateSessionRules:async()=>{}},commands:{onCommand:event()}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sidechat/worker'),'utf8'),{SakuraSideCore:K,chrome,console,Map,Set});
 function panel(id){let send,disconnect;const messages=[];connect({name:'SC_PANEL_LIFETIME',sender:{id:'test',url:'chrome-extension://test/sidechat/panel.html'},onMessage:{addListener:f=>send=f},onDisconnect:{addListener:f=>disconnect=f},postMessage:m=>messages.push(m),disconnect:()=>disconnect()});send({type:'SC_HELLO',windowId:id});return {send,disconnect,messages,state:()=>messages.filter(m=>m.type==='SC_STATE').at(-1)?.state};}
 function request(m,id=1,popup=false){return new Promise(resolve=>{const handled=receive(m,{id:'test',url:popup?'chrome-extension://test/popup.html':tabs.get(id).url,tab:popup?undefined:tabs.get(id),frameId:0,documentId:'doc'+id},resolve);if(!handled)resolve(null);});}
 return {panel,request,data,closed,stopped,injected,removed};
}
test('only the bound window captures; an incidental second panel cannot steal ownership',async()=>{
 const h=boot(),a=h.panel(1);await until(()=>a.state());assert.equal(a.state().enabled,true);
 const b=h.panel(2);await until(()=>b.state());assert.equal(b.state().status,'bound-elsewhere');assert.equal(b.state().embedAllowed,false);
 await until(()=>h.closed.includes(2));assert.ok(!h.injected.includes(2));
 assert.equal((await h.request({type:'SC_PAGE_CONTEXT',text:'wrong window'},2)).ok,false);
 assert.equal((await h.request({type:'SC_BIND_WINDOW',windowId:2},2)),null,'webpage must not move the binding');
 assert.equal((await h.request({type:'SC_BIND_WINDOW',windowId:2},2,true)).ok,true);
 b.send({type:'SC_REFRESH'});await until(()=>b.state().enabled);assert.ok(h.closed.includes(1));
 assert.equal((await h.request({type:'SC_PAGE_CONTEXT',text:'old window'},1)).ok,false);
 assert.equal((await h.request({type:'SC_PAGE_CONTEXT',text:'new window'},2)).ok,true);
});
test('pause and binding survive worker restart and panel reconnect',async()=>{
 const h=boot(),a=h.panel(1);await until(()=>a.state());a.send({type:'SC_PAUSE',value:true});await until(()=>a.state().paused);
 a.disconnect();const replacement=h.panel(1);await until(()=>replacement.state());assert.equal(replacement.state().paused,true);
 const restarted=boot(h.data),b=restarted.panel(2);await until(()=>b.state());assert.equal(b.state().enabled,false);
 const again=restarted.panel(1);await until(()=>again.state());assert.equal(again.state().paused,true);
 again.send({type:'SC_PAUSE',value:false});await until(()=>!again.state().paused);
 restarted.removed(1);const next=restarted.panel(2);await until(()=>next.state());assert.equal(next.state().enabled,true);
});
test('simultaneous incidental panels claim at most one window',async()=>{
 const h=boot(),a=h.panel(1),b=h.panel(2);await until(()=>a.state()&&b.state());
 assert.equal(Number(a.state().enabled)+Number(b.state().enabled),1);
 assert.equal(h.data.__sakuraSideContextsV1Window,1);
});
test('popup opens within the click gesture while window binding is pending',async()=>{
 let click,resolveBinding,inGesture=false,opened=0,closed=false;
 const button={querySelector:()=>({}),addEventListener:(type,f)=>{if(type==='click')click=f;}};
 const chrome={windows:{getCurrent:async()=>({id:7})},runtime:{sendMessage:m=>{assert.equal(m.windowId,7);return new Promise(r=>resolveBinding=r);}},sidePanel:{open:async o=>{assert.equal(inGesture,true);assert.equal(o.windowId,7);opened++;}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sidechat/popup-entry'),'utf8'),{chrome,Promise,document:{getElementById:()=>button,documentElement:{lang:'en'},addEventListener(){}},window:{close:()=>{closed=true;}}});
 await wait();inGesture=true;click();inGesture=false;assert.equal(opened,1);assert.equal(closed,false);
 resolveBinding({ok:true});await until(()=>closed);
});
