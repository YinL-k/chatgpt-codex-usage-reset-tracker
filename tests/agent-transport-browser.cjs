'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {server,root}=require('./browser.cjs');
const P=require('../sidechat/agent-protocol.js');
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage();await p.goto('http://127.0.0.1:'+server.address().port+'/fixture');await p.addScriptTag({path:path.join(root,'sidechat/agent-transport.js')});
  await p.evaluate(()=>{
   window.events=[];window.sends=0;const editor=document.querySelector('textarea');
   window.a=SakuraAgentTransport.create({composer:()=>editor,read:e=>e?.value||'',write:(e,t)=>e.value=t,sendButton:()=>document.querySelector('[data-testid=send-button]'),post:m=>events.push(m),submit:(b,p)=>{
    sends++;const u=document.createElement('div');u.dataset.messageAuthorRole='user';u.textContent=p.text;document.querySelector('#messages').append(u);editor.value='';
   }});
   a.receive({type:'SC_AGENT_MODE',enabled:true});
   a.receive({type:'SC_AGENT_SEND',request_id:'r1',run_id:'run',text:'request r1'});
   a.receive({type:'SC_AGENT_MODE',enabled:false});a.tick();
  });
  assert.equal(await p.evaluate(()=>sends),0);assert.equal(await p.locator('textarea').inputValue(),'');
  await p.evaluate(()=>{
   a.receive({type:'SC_AGENT_MODE',enabled:true});a.receive({type:'SC_AGENT_SEND',request_id:'r2',run_id:'run',text:'request r2'});a.tick();
   const article=document.createElement('article');article.innerHTML='<div data-message-author-role="assistant"><div class="markdown">{"request_id":"r2"}</div></div>';document.querySelector('#messages').append(article);window.article=article;a.tick();
  });
  await p.waitForTimeout(1000);await p.evaluate(()=>a.tick());assert.equal(await p.evaluate(()=>events.filter(e=>e.type==='SC_AGENT_RESPONSE').length),0,'Stable text alone must not count as completion');
  await p.evaluate(()=>{const copy=document.createElement('button');copy.dataset.testid='copy-turn-action-button';article.append(copy);const stop=document.createElement('button');stop.dataset.testid='stop-button';stop.textContent='Stop';document.body.append(stop);a.tick();});
  await p.waitForTimeout(1000);await p.evaluate(()=>a.tick());assert.equal(await p.evaluate(()=>events.filter(e=>e.type==='SC_AGENT_RESPONSE').length),0,'Copy control from a stale turn cannot bypass streaming');
  await p.evaluate(()=>{document.querySelector('[data-testid=stop-button]').remove();a.tick();});await p.waitForTimeout(1000);await p.evaluate(()=>{a.tick();a.tick();});
  assert.equal(await p.evaluate(()=>events.filter(e=>e.type==='SC_AGENT_RESPONSE').length),1);
  await p.evaluate(()=>{a.receive({type:'SC_AGENT_SEND',request_id:'r3',run_id:'run',text:'request r3'});document.querySelector('textarea').value='my edited draft';a.tick();});
  assert.equal(await p.locator('textarea').inputValue(),'my edited draft');assert.equal(await p.evaluate(()=>sends),1);assert(await p.evaluate(()=>events.some(e=>e.error==='draft_changed')));
  await p.evaluate(()=>{document.querySelector('textarea').value='';a.receive({type:'SC_AGENT_SEND',request_id:'r4',run_id:'run',text:'request r4'});a.tick();history.pushState({},'', '/c/other');a.tick();});
  assert(await p.evaluate(()=>events.some(e=>e.error==='conversation_changed')));
  // Saving an initial message can normalize project/temporary routes. Bind the
  // new route to the unique request, while still rejecting real thread switches.
  const navigation=await browser.newPage();await navigation.goto('http://127.0.0.1:'+server.address().port+'/fixture');
  await navigation.addScriptTag({path:path.join(root,'sidechat/agent-transport.js')});
  await navigation.evaluate(()=>{
   history.replaceState({},'', '/c/provisional');window.navEvents=[];const editor=document.querySelector('textarea');
   window.nav=SakuraAgentTransport.create({composer:()=>editor,read:e=>e.value,write:(e,t)=>e.value=t,sendButton:()=>document.querySelector('[data-testid=send-button]'),post:m=>navEvents.push(m),submit:(b,p)=>{
    const u=document.createElement('div');u.dataset.messageAuthorRole='user';u.textContent=p.text;document.querySelector('#messages').append(u);editor.value='';
   }});
   nav.receive({type:'SC_AGENT_MODE',enabled:true});nav.receive({type:'SC_AGENT_SEND',request_id:'nav1',text:'request nav1'});nav.tick();
   history.replaceState({},'', '/c/saved/');nav.tick();
  });
  await navigation.waitForTimeout(350);await navigation.evaluate(()=>{
   nav.tick();history.replaceState({},'', '/g/project/c/saved/');nav.tick();
   const article=document.createElement('article');article.innerHTML='<div data-message-author-role="assistant"><div class="markdown">{"request_id":"nav1"}</div></div><button data-testid="copy-turn-action-button">Copy</button>';document.querySelector('#messages').append(article);nav.tick();
  });
  await navigation.waitForTimeout(950);await navigation.evaluate(()=>nav.tick());
  assert.equal(await navigation.evaluate(()=>navEvents.filter(e=>e.type==='SC_AGENT_RESPONSE').length),1,'Saved first conversation must deliver its completed reply');
  assert.equal(await navigation.evaluate(()=>navEvents.filter(e=>e.type==='SC_AGENT_TRANSPORT_ERROR').length),0);
  await navigation.evaluate(()=>{nav.receive({type:'SC_AGENT_SEND',request_id:'nav2',text:'request nav2'});nav.tick();history.replaceState({},'', '/c/unrelated');nav.tick();});
  assert(await navigation.evaluate(()=>navEvents.some(e=>e.error==='conversation_changed')),'Switching an existing conversation must still cancel');
  await navigation.close();
  // Real contenteditable paragraphs normalize whitespace unlike a textarea.
  await p.evaluate(()=>{
   const old=document.querySelector('textarea'),el=document.createElement('div');el.contentEditable='true';el.id='rich';el.style.whiteSpace='pre-wrap';old.replaceWith(el);
   window.richEvents=[];window.richSends=0;
   window.rich=SakuraAgentTransport.create({composer:()=>el,read:e=>e.innerText,write:(e,text)=>{
    e.replaceChildren(...text.split('\n').map(line=>{const p=document.createElement('p');p.textContent=line||'\u00a0';return p;}));
    e.dispatchEvent(new InputEvent('input',{bubbles:true}));
   },sendButton:()=>document.querySelector('[data-testid=send-button]'),post:m=>richEvents.push(m),submit:()=>{richSends++;el.replaceChildren();}});
   el.addEventListener('input',e=>rich.onInput(e));
   rich.receive({type:'SC_AGENT_MODE',enabled:true});
   rich.receive({type:'SC_AGENT_SEND',request_id:'rich1',text:'First paragraph\nSecond paragraph\n\n{"request_id":"rich1"}\n'});
   if(el.innerText==='First paragraph\nSecond paragraph\n\n{"request_id":"rich1"}\n')throw Error('Fixture must normalize editor text');
   rich.tick();rich.tick();
  });
  assert.equal(await p.evaluate(()=>richSends),1,'Paragraph normalization must not cancel Agent sending');
  assert.deepEqual(await p.evaluate(()=>richEvents),[]);
  await p.evaluate(()=>{rich.cancel();rich.receive({type:'SC_AGENT_SEND',request_id:'rich2',text:'First\nSecond'});});
  await p.locator('#rich').press('End');await p.locator('#rich').press('Space');
  const edited=await p.locator('#rich').innerText();await p.evaluate(()=>rich.tick());
  assert.equal(await p.evaluate(()=>richSends),1,'Even a whitespace-only user edit cancels pending delivery');
  assert.equal(await p.locator('#rich').innerText(),edited,'User edit must be preserved');
  assert(await p.evaluate(()=>richEvents.some(e=>e.error==='draft_changed')));
  // Reproduce the live rich editor's asynchronous URL-token decoration. The
  // original prompt grows by an icon and a space per URL after h.write returns.
  const request={format:'json',run_id:'run',request_id:'links',task:'找一个和ChatGPT有关的视频然后点开',observation:{snapshot_id:'s1',elements:Array.from({length:54},(_,i)=>({id:'e'+i,href:'https://www.bilibili.com/video/'+i})),text:'Page https://www.bilibili.com/'}};
  const prompt=P.prompt(request);
  await p.evaluate(text=>{
   const el=document.querySelector('#rich');el.replaceChildren();window.linkSends=0;window.linkEvents=[];
   window.links=SakuraAgentTransport.create({composer:()=>el,read:e=>e.innerText,write:(e,text)=>{
    e.textContent=text;
    queueMicrotask(()=>{const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
     for(const node of nodes){const parts=node.data.split(/(https?:\/\/[^\s"<>]+)/g);if(parts.length<2)continue;const frag=document.createDocumentFragment();for(const part of parts){if(/^https?:\/\//.test(part)){const token=document.createElement('span');token.contentEditable='false';token.textContent='🌐 '+part;frag.append(token);}else frag.append(document.createTextNode(part));}node.replaceWith(frag);}
    });
   },sendButton:()=>document.querySelector('[data-testid=send-button]'),post:m=>linkEvents.push(m),submit:()=>{linkSends++;el.replaceChildren();}});
   links.receive({type:'SC_AGENT_MODE',enabled:true});links.receive({type:'SC_AGENT_SEND',request_id:'links',run_id:'run',text});
  },prompt);
  await p.evaluate(()=>links.tick());
  assert.equal(await p.evaluate(()=>linkSends),1,'URL data must survive editor reconciliation and send once');
  assert.deepEqual(await p.evaluate(()=>linkEvents),[]);
  // Prove that this fixture actually reproduces the unfixed URL-token failure.
  await p.evaluate(text=>{links.cancel();links.receive({type:'SC_AGENT_SEND',request_id:'old-links',run_id:'run',text});},prompt.replace(/\\\//g,'/'));
  await p.evaluate(()=>links.tick());
  assert.equal(await p.evaluate(()=>linkSends),1,'Unescaped URLs must reproduce the blocked send');
  assert(await p.evaluate(()=>linkEvents.some(e=>e.error==='draft_changed')),'Fixture must reproduce the actual guard failure');
  console.log('PASS: no execution on stream pauses; requires completed turn; duplicate reply suppression; stop before send; preserve edits; cancel conversation navigation');
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
