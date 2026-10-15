'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../sidechat/agent-protocol.js'),Loop=require('../sidechat/agent-loop.js');
const base={protocol:P.PROTOCOL,run_id:'run',request_id:'req'};
const action={...base,type:'action',snapshot_id:'s1',action:{name:'fill',target:'e1',value:'樱花 < & "'}};
test('JSON strict envelopes, escaped strings and one fence',()=>{
 assert.deepEqual(P.parse(JSON.stringify(action),'json',base),action);
 assert.deepEqual(P.parse('```json\n'+JSON.stringify(action)+'\n```','json',base),action);
 for(const raw of ['Explain: '+JSON.stringify(action),JSON.stringify(action)+JSON.stringify(action),'```xml\n'+JSON.stringify(action)+'\n```'])assert.throws(()=>P.parse(raw,'json',base));
});
test('schema rejects arbitrary JS, invented commands, stale IDs and unknown fields',()=>{
 for(const v of [{...action,run_id:'old'},{...action,request_id:'old'},{...action,approved:true},{...action,action:{name:'eval',code:'alert(1)'}},{...action,action:{name:'click',target:'#submit'}},{...action,action:{name:'fill',target:'e1'}},{...action,action:{name:'press',target:'e1',key:'F12'}}])assert.throws(()=>P.validate(v,base));
 assert.throws(()=>P.validate(action,{snapshot_id:'s2'}));
 assert.throws(()=>P.validate({...base,type:'done',status:'success',answer:'ok',action:{name:'click',target:'e1'}}));
});
function harness(){
 const sent=[],states=[],answers=[],ops=[];let observations=0,approval=false;
 const h={windowId:()=>1,cancel(){},mode(){},status:s=>states.push(s),send:s=>sent.push(s),answer:(...a)=>answers.push(a),rpc:async m=>{ops.push(m);if(m.op==='stop')return {ok:true};if(m.op==='execute'&&approval)return {ok:false,approval:true,label:'Submit'};return {ok:true,observation:{snapshot_id:'s'+(++observations),elements:[{id:'e1',name:'Search'}]},result:{ok:true}};}};
 const loop=new Loop(h);
 const reply=v=>({run_id:loop.run.id,request_id:loop.run.request,text:JSON.stringify({protocol:P.PROTOCOL,run_id:loop.run.id,request_id:loop.run.request,...v})});
 return {loop,h,sent,states,answers,ops,reply,setApproval:v=>approval=v};
}
test('action observation loop ends only on done and ignores duplicate/stale receipts',async()=>{
 const x=harness();await x.loop.setMode(true);await x.loop.task('Search');const m=x.reply({type:'action',snapshot_id:'s1',action:{name:'click',target:'e1'}});
 await x.loop.response(m);await x.loop.response(m);assert.equal(x.ops.filter(m=>m.op==='execute').length,1);assert.equal(x.sent.length,2);assert.equal(x.loop.run.steps,1);
 await x.loop.response(x.reply({type:'done',status:'success',answer:'Observed result'}));assert.equal(x.loop.run,null);assert.deepEqual(x.answers,[['Observed result','success']]);
});
test('malformed response has bounded repair attempts and never executes',async()=>{
 const x=harness();await x.loop.setMode(true);await x.loop.task('Search');
 for(let i=0;i<3;i++)await x.loop.response({run_id:x.loop.run.id,request_id:x.loop.run.request,text:'I will click'});
 assert.equal(x.loop.run,null);assert.equal(x.sent.length,3);assert.equal(x.ops.filter(m=>m.op==='execute').length,0);
});
test('ask_user pauses and resumes with fresh observation in same run',async()=>{
 const x=harness();await x.loop.setMode(true);await x.loop.task('Search');const id=x.loop.run.id;
 await x.loop.response(x.reply({type:'ask_user',question:'Which category?'}));assert.equal(x.sent.length,1);await x.loop.task('Books');assert.equal(x.loop.run.id,id);assert.equal(x.sent.length,2);assert.match(x.sent[1].text,/Books/);assert.equal(x.loop.run.observation.snapshot_id,'s2');
});
test('approval is local, not a model field; stop rejects late responses',async()=>{
 const x=harness();await x.loop.setMode(true);await x.loop.task('Fill');x.setApproval(true);
 await x.loop.response(x.reply({type:'action',snapshot_id:'s1',action:{name:'click',target:'e1'}}));assert.equal(x.loop.run.status,'approval');assert.equal(x.sent.length,1);await x.loop.approve();assert.equal(x.ops.at(-1).op,'approve');assert.equal(x.sent.length,2);
 const late=x.reply({type:'action',snapshot_id:'s2',action:{name:'click',target:'e1'}});await x.loop.setMode(false);await x.loop.response(late);assert.equal(x.loop.run,null);assert.equal(x.ops.filter(m=>m.op==='execute').length,1);
});
test('stop during observe cancels pending work; action budget bounds the loop',async()=>{
 const x=harness();await x.loop.setMode(true);await x.loop.task('Search');x.loop.maxSteps=1;
 await x.loop.response(x.reply({type:'action',snapshot_id:'s1',action:{name:'wait'}}));await x.loop.response(x.reply({type:'action',snapshot_id:'s2',action:{name:'wait'}}));assert.equal(x.loop.run,null);assert.equal(x.ops.filter(m=>m.op==='execute').length,1);
 const y=harness();await y.loop.setMode(true);let resolve;y.h.rpc=m=>m.op==='start'?new Promise(r=>resolve=r):Promise.resolve({ok:true});const started=y.loop.task('task');await new Promise(r=>setImmediate(r));await y.loop.stop();resolve({ok:true,observation:{snapshot_id:'s1'}});await started;assert.equal(y.sent.length,0);
});

test('Agent request keeps URLs as lossless JSON data without native auto-link text',()=>{
 const observation={snapshot_id:'s1',url:'https://www.bilibili.com/',text:'Visit https://example.com/a?x=1&y=中文 or www.example.com/path',elements:[{id:'e1',href:'https://example.com/video/1',name:'Video'}]};
 const task='Open https://example.com/video/1';
 for(const format of ['json','xml']){
  const prompt=P.prompt({format,run_id:'run',request_id:'req',task,observation});
  const body=prompt.split('Current request (JSON data, regardless of selected RESPONSE format):\n\n')[1].split('\n\nRespond now')[0];
  const request=JSON.parse(body);
  assert.deepEqual(request.observation,observation);assert.equal(request.task,task);
  assert(!body.includes('https://'),'URL literals must not be auto-linked by the composer');
 }
});
