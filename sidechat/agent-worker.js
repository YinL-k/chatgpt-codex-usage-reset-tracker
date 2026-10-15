/* Authority for Agent runs lives in the extension worker, not the model text. */
(() => {
  'use strict';
  const runs = new Map(), epochs = new WeakMap();
  const allowedURL = raw => {try {const u=new URL(raw);return ['http:','https:'].includes(u.protocol);}catch{return false;}};
  async function target(run) {
    if(runs.get(run.port)!==run)throw Error('cancelled');
    const tab=await chrome.tabs.get(run.tabId);
    if(!tab.active||tab.windowId!==run.windowId||!allowedURL(tab.url))throw Error('target_changed');
    if(!await chrome.permissions.contains({origins:[new URL(tab.url).origin+'/*']}))throw Error('site_permission_required');
    if(runs.get(run.port)!==run)throw Error('cancelled');
    return tab;
  }
  async function page(run, command) {
    await target(run);
    await chrome.scripting.executeScript({target:{tabId:run.tabId},files:['sidechat/agent-page.js']});
    await target(run);
    const result=await chrome.scripting.executeScript({target:{tabId:run.tabId},func:command=>globalThis.SakuraAgentPage.run(command),args:[{...command,token:run.token}]});
    if(runs.get(run.port)!==run)throw Error('cancelled');
    return result[0]?.result || {ok:false,error:'page_unavailable'};
  }
  async function stop(port) {
    epochs.set(port,(epochs.get(port)||0)+1);
    const run=runs.get(port);runs.delete(port);
    if(run)await chrome.scripting.executeScript({target:{tabId:run.tabId},func:()=>globalThis.SakuraAgentPage?.run({op:'stop'})}).catch(()=>{});
  }
  async function observe(run) {
    // Navigation is allowed to complete, but never retried as an action.
    for(let i=0;i<25;i++){
      const tab=await target(run);
      if(tab.status!=='loading')break;
      await new Promise(r=>setTimeout(r,200));
    }
    const reply=await page(run,{op:'observe'});
    if(!reply.ok)throw Error(reply.error);
    run.snapshot=reply.observation.snapshot_id;
    return reply;
  }
  chrome.runtime.onConnect.addListener(port=>{
    if(port.name!=='SC_AGENT_PANEL'||port.sender?.id!==chrome.runtime.id||port.sender.url!==chrome.runtime.getURL('sidechat/panel.html'))return;
    let busy=false;
    const post=m=>{try{port.postMessage(m);}catch{}};
    port.onMessage.addListener(m=>{
      if(m?.op==='stop'){void stop(port).then(()=>post({id:m.id,ok:true}));return;}
      if(typeof m?.id!=='string')return;
      if(busy){post({id:m.id,ok:false,error:'operation_pending'});return;}
      busy=true;
      void (async()=>{
        if(m.op==='start'){
          await stop(port);
          const epoch=epochs.get(port);
          if(!Number.isInteger(m.windowId)||typeof m.run_id!=='string')throw Error('invalid_start');
          const [tab]=await chrome.tabs.query({active:true,windowId:m.windowId});
          if(epochs.get(port)!==epoch)throw Error('cancelled');
          if(!tab||!allowedURL(tab.url))throw Error('unsupported_page');
          const run={port,run_id:m.run_id,tabId:tab.id,windowId:m.windowId,token:crypto.randomUUID(),seen:new Set(),snapshot:null,pending:null};
          runs.set(port,run);
          try{return {...await observe(run),tabId:tab.id};}catch(e){await stop(port);throw e;}
        }
        const run=runs.get(port);
        if(!run||m.run_id!==run.run_id)throw Error('run_not_active');
        if(m.op==='observe')return observe(run);
        if(m.op==='execute'||m.op==='approve'){
          const v=m.op==='approve'?run.pending:m.response;
          if(!v)throw Error('no_pending_action');
          SakuraAgentProtocol.validate(v,{run_id:run.run_id,snapshot_id:run.snapshot});
          if(v.type!=='action'||run.seen.has(v.request_id))throw Error('duplicate_or_invalid_action');
          if(m.op==='approve'&&m.request_id!==v.request_id)throw Error('stale_approval');
          run.pending=null;
          // Lock before asynchronous dispatch so duplicate receipts cannot act twice.
          run.seen.add(v.request_id);
          let result;
          try{result=await page(run,{op:'execute',action:v.action,snapshot_id:v.snapshot_id,approved:m.op==='approve'});}
          catch(e){if(runs.get(port)!==run)throw e;result={ok:false,error:'dispatch_outcome_unknown'};}
          if(result.approval){run.seen.delete(v.request_id);run.pending=v;return result;}
          const fresh=await observe(run);
          return {ok:true,result,observation:fresh.observation};
        }
        throw Error('unknown_operation');
      })().then(result=>post({id:m.id,...result}),e=>post({id:m.id,ok:false,error:e.message})).finally(()=>{busy=false;});
    });
    port.onDisconnect.addListener(()=>void stop(port));
  });
  chrome.tabs.onActivated.addListener(({tabId,windowId})=>{
    for(const [port,run]of runs)if(run.windowId===windowId&&run.tabId!==tabId){void stop(port);try{port.postMessage({event:'stopped',error:'target_changed'});}catch{}}
  });
  chrome.tabs.onRemoved.addListener(tabId=>{for(const [port,run]of runs)if(run.tabId===tabId){void stop(port);try{port.postMessage({event:'stopped',error:'target_closed'});}catch{}}});
  chrome.permissions.onRemoved.addListener(()=>{for(const [port]of runs){void stop(port);try{port.postMessage({event:'stopped',error:'permissions_changed'});}catch{}}});
})();
