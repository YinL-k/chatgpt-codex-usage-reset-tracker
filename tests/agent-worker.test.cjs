'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),P=require('../sidechat/agent-protocol.js');
async function harness(sender){
 let connect,listener,activation,removedPermission,disconnect,allowed=true,snapshot=0,dispatches=0,approve=false,releaseQuery=null;
 const messages=[],tab={id:7,windowId:1,active:true,status:'complete',url:'https://example.com/page'};
 const event=()=>({addListener(){}});
 const chrome={runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onConnect:{addListener:f=>connect=f}},
  tabs:{get:async()=>({...tab}),query:async()=>{if(releaseQuery)await new Promise(r=>releaseQuery.resolve=r);return [{...tab}];},onActivated:{addListener:f=>activation=f},onRemoved:event()},
  permissions:{contains:async()=>allowed,onRemoved:{addListener:f=>removedPermission=f}},
  scripting:{executeScript:async m=>{if(m.files)return [];const cmd=m.args?.[0];if(!cmd||cmd.op==='stop')return [{result:{ok:true}}];if(cmd.op==='observe')return [{result:{ok:true,observation:{snapshot_id:'s'+(++snapshot),elements:[]}}}];if(cmd.op==='execute'){if(approve&&!cmd.approved)return [{result:{ok:false,approval:true,label:'Submit'}}];dispatches++;return [{result:{ok:true,dispatched:true}}];}throw Error('bad cmd');}}
 };
 vm.runInNewContext(fs.readFileSync(require.resolve('../sidechat/agent-worker.js'),'utf8'),{chrome,SakuraAgentProtocol:P,crypto,URL,console,setTimeout,Map,WeakMap,Set});
 connect({name:'SC_AGENT_PANEL',sender:sender||{id:'test',url:'chrome-extension://test/sidechat/panel.html'},onMessage:{addListener:f=>listener=f},onDisconnect:{addListener:f=>disconnect=f},postMessage:m=>messages.push(m)});
 async function send(m){if(!listener)return null;const id=crypto.randomUUID();listener({...m,id});for(let i=0;i<100;i++){const reply=messages.find(x=>x.id===id);if(reply)return reply;await new Promise(r=>setTimeout(r,5));}throw Error('response timeout');}
 const response=(request_id='q',snapshot_id='s1')=>({protocol:P.PROTOCOL,run_id:'r',request_id,type:'action',snapshot_id,action:{name:'click',target:'e1'}});
 return {send,response,tab,messages,get dispatches(){return dispatches;},setAllowed:v=>allowed=v,setApproval:v=>approve=v,activate:()=>activation({tabId:8,windowId:1}),revoke:()=>removedPermission(),disconnect:()=>disconnect?.(),hold:()=>releaseQuery={},release:()=>{releaseQuery.resolve();releaseQuery=null;}};
}
test('worker only accepts its owned panel; rejects unsupported targets and missing permission',async()=>{
 for(const sender of [{id:'other',url:'chrome-extension://test/sidechat/panel.html'},{id:'test',url:'https://example.com'}])assert.equal(await (await harness(sender)).send({op:'start'}),null);
 const h=await harness();h.tab.url='chrome://settings/';assert.equal((await h.send({op:'start',run_id:'r',windowId:1})).error,'unsupported_page');h.tab.url='https://example.com/';h.setAllowed(false);assert.equal((await h.send({op:'start',run_id:'r',windowId:1})).error,'site_permission_required');assert.equal(h.dispatches,0);
});
test('worker rejects replay, obsolete snapshot and model-supplied approval',async()=>{
 const h=await harness();await h.send({op:'start',run_id:'r',windowId:1});let r=await h.send({op:'execute',run_id:'r',response:h.response()});assert(r.ok);assert.equal(h.dispatches,1);
 r=await h.send({op:'execute',run_id:'r',response:h.response('q','s2')});assert.equal(r.error,'duplicate_or_invalid_action');
 r=await h.send({op:'execute',run_id:'r',response:{...h.response('new','s2'),approved:true}});assert.equal(r.ok,false);assert.equal(h.dispatches,1);
});
test('approval needs a separate panel operation and is tied to the exact pending action',async()=>{
 const h=await harness();h.setApproval(true);await h.send({op:'start',run_id:'r',windowId:1});const a=await h.send({op:'execute',run_id:'r',response:h.response()});assert(a.approval);assert.equal(h.dispatches,0);
 assert.equal((await h.send({op:'approve',run_id:'r',request_id:'wrong'})).error,'stale_approval');assert((await h.send({op:'approve',run_id:'r',request_id:'q'})).ok);assert.equal(h.dispatches,1);
});
test('switching tabs or revoking permissions ends the run; stop cancels an awaiting start',async()=>{
 for(const op of ['activate','revoke','disconnect']){const h=await harness();await h.send({op:'start',run_id:'r',windowId:1});h[op]();assert.equal((await h.send({op:'execute',run_id:'r',response:h.response()})).error,'run_not_active');assert.equal(h.dispatches,0);}
 const h=await harness();h.hold();const start=h.send({op:'start',run_id:'r',windowId:1});await new Promise(r=>setTimeout(r,10));await h.send({op:'stop'});h.release();assert.equal((await start).error,'cancelled');
});

test('worker allows ChatGPT main domain and subdomains as authorized targets',async()=>{
 for(const url of ['https://chatgpt.com/c/test','https://www.chatgpt.com/','https://test.chatgpt.com/']){const h=await harness();h.tab.url=url;assert.equal((await h.send({op:'start',run_id:'r',windowId:1})).ok,true);}
});
