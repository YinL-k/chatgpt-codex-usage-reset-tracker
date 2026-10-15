/* Uses the native ChatGPT composer. No private API, model proxy or generated JS. */
(() => {
  'use strict';
  function create(h) {
    let enabled=false, pending=null, restoreChat=false, claimedDraft='',writing=false,modeControl=null,modeButton=null,modeMenu=null,activityButton=null,activityPanel=null,activity={events:[]};
    // Use the adapter's editor confirmation semantics. ProseMirror can turn
    // newlines into paragraph boundaries, NBSPs and a trailing empty paragraph.
    const equivalent=(a,b)=>String(a||'').replace(/\s+/g,' ').trim()===String(b||'').replace(/\s+/g,' ').trim();
    function write(el,text){try{writing=true;h.write(el,text);}finally{writing=false;}}
    function closeMenus(){
      for(const [button,panel] of [[modeButton,modeMenu],[activityButton,activityPanel]]){if(panel)panel.hidden=true;button?.setAttribute('aria-expanded','false');}
    }
    function place(panel,button){
      const r=button.getBoundingClientRect(),width=panel===modeMenu?210:340;
      panel.style.width=Math.min(width,innerWidth-24)+'px';
      panel.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';
      panel.style.bottom=Math.max(12,innerHeight-r.top+8)+'px';
    }
    function toggle(panel,button){
      const open=panel.hidden;closeMenus();if(open){panel.hidden=false;button.setAttribute('aria-expanded','true');place(panel,button);}
    }
    function renderActivity(){
      if(!activityButton)return;
      activityButton.hidden=!enabled;activityButton.textContent=activity.label||'Activity';
      activityPanel.replaceChildren();
      const status=document.createElement('div');status.className='sakura-agent-activity-state';status.textContent=activity.status||'';status.setAttribute('role','status');activityPanel.append(status);
      const list=document.createElement('ol');
      for(const text of activity.events||[]){const li=document.createElement('li');li.textContent=text;list.append(li);}
      if(list.children.length)activityPanel.append(list);
      else {const empty=document.createElement('p');empty.textContent=activity.empty||'No activity yet';activityPanel.append(empty);}
      if(!enabled){activityPanel.hidden=true;activityButton.setAttribute('aria-expanded','false');}
    }
    function renderMode(){
      const el=h.composer(),root=el?.closest('[data-composer-body],form');
      const plus=root?.querySelector('button[data-testid="composer-plus-btn"],button[aria-label="Add files and more"],button[aria-label="添加文件和更多内容"],button[aria-label="添加文件及更多内容"]');
      if(!plus){closeMenus();modeControl?.remove();return;}
      if(!modeControl){
        const style=document.createElement('style');style.id='sakura-agent-composer-style';style.textContent=`
#sakura-agent-controls{display:inline-flex;align-items:center;gap:2px;flex:none;margin-inline:3px;color:inherit;font:12px/1.4 system-ui,sans-serif}
#sakura-agent-controls button{font:inherit;color:inherit;cursor:pointer}
#sakura-agent-mode,#sakura-agent-activity{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;height:30px;padding:4px 7px;border:1px solid transparent;border-radius:9px;background:transparent;transition:background .15s,border-color .15s}
#sakura-agent-mode .sakura-agent-chevron{display:block;width:12px;height:12px;flex:0 0 12px;align-self:center;transition:transform .15s}#sakura-agent-mode[aria-expanded="true"] .sakura-agent-chevron{transform:rotate(180deg)}
#sakura-agent-mode:hover,#sakura-agent-activity:hover,#sakura-agent-controls button[aria-expanded="true"]{background:color-mix(in srgb,currentColor 7%,transparent);border-color:color-mix(in srgb,currentColor 12%,transparent)}
#sakura-agent-controls button:focus-visible{outline:2px solid #dca2bb;outline-offset:2px}
.sakura-agent-popover{position:fixed;z-index:2147483646;box-sizing:border-box;max-width:calc(100vw - 24px);max-height:45vh;overflow:auto;padding:6px;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:15px;background:linear-gradient(125deg,rgba(37,27,35,.96),rgba(18,17,22,.96));color:rgba(247,240,244,.95);box-shadow:inset 0 1px 0 #ffe7f10e,0 12px 36px #0006,0 0 20px #ef9dc112;backdrop-filter:blur(22px);font:12px/1.5 system-ui,sans-serif}
html[data-sakura-sidechat-theme="light"] .sakura-agent-popover{background:linear-gradient(125deg,rgba(255,248,251,.97),rgba(255,255,255,.95));color:rgba(67,42,54,.95);box-shadow:inset 0 1px 0 #ffffffcc,0 12px 36px #6f3c541c,0 0 20px #cc689414}
#sakura-agent-controls [hidden]{display:none!important}
#sakura-agent-mode-menu button{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;border-radius:9px;background:transparent;padding:9px 10px;text-align:start}
#sakura-agent-mode-menu button:hover,#sakura-agent-mode-menu button:focus-visible{background:color-mix(in srgb,currentColor 7%,transparent)}
#sakura-agent-mode-menu button[aria-checked="true"]{background:color-mix(in srgb,#dca2bb 17%,transparent)}
#sakura-agent-activity{opacity:.75;padding-inline:6px}
#sakura-agent-activity-panel{padding:12px 14px}.sakura-agent-activity-state{font-weight:600;margin-bottom:8px}
#sakura-agent-activity-panel ol{margin:0;padding-left:19px;opacity:.8}#sakura-agent-activity-panel li{margin:5px 0;overflow-wrap:anywhere}#sakura-agent-activity-panel p{margin:0;opacity:.65}
`;document.head.append(style);
        modeControl=document.createElement('span');modeControl.id='sakura-agent-controls';
        modeButton=document.createElement('button');modeButton.id='sakura-agent-mode';modeButton.type='button';modeButton.setAttribute('aria-label','Chat / Agent');modeButton.setAttribute('aria-haspopup','menu');modeButton.setAttribute('aria-controls','sakura-agent-mode-menu');modeButton.setAttribute('aria-expanded','false');
        modeButton.innerHTML='<span class="sakura-agent-mode-label"></span><svg class="sakura-agent-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        modeMenu=document.createElement('div');modeMenu.id='sakura-agent-mode-menu';modeMenu.className='sakura-agent-popover';modeMenu.setAttribute('role','menu');modeMenu.setAttribute('aria-label','Chat / Agent');modeMenu.hidden=true;
        for(const [value,label] of [['chat','Chat'],['agent','Agent · Beta']]){
          const option=document.createElement('button');option.type='button';option.dataset.mode=value;option.setAttribute('role','menuitemradio');option.textContent=label;
          option.addEventListener('click',()=>{const value=option.dataset.mode==='agent';closeMenus();setMode(value);h.post({type:'SC_AGENT_SET_MODE',enabled:value});modeButton.focus();});modeMenu.append(option);
        }
        activityButton=document.createElement('button');activityButton.type='button';activityButton.id='sakura-agent-activity';activityButton.setAttribute('aria-controls','sakura-agent-activity-panel');activityButton.setAttribute('aria-expanded','false');
        activityPanel=document.createElement('div');activityPanel.id='sakura-agent-activity-panel';activityPanel.className='sakura-agent-popover';activityPanel.setAttribute('role','region');activityPanel.setAttribute('aria-label','Agent activity');activityPanel.hidden=true;
        modeButton.addEventListener('click',()=>{toggle(modeMenu,modeButton);if(!modeMenu.hidden)modeMenu.querySelector('[aria-checked="true"]')?.focus();});
        activityButton.addEventListener('click',()=>toggle(activityPanel,activityButton));
        modeControl.append(modeButton,activityButton,modeMenu,activityPanel);
        document.addEventListener('pointerdown',e=>{if(!modeControl.contains(e.target))closeMenus();},true);
        modeControl.addEventListener('keydown',e=>{
          if(e.key==='Escape'){e.preventDefault();const button=!modeMenu.hidden?modeButton:activityButton;closeMenus();button.focus();}
          if(!modeMenu.hidden&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const options=[...modeMenu.children],index=options.indexOf(document.activeElement);options[e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:options.length-1))%options.length].focus();}
        });
      }
      if(plus.nextElementSibling!==modeControl)plus.after(modeControl);
      const label=enabled?'Agent · Beta':'Chat',labelNode=modeButton.querySelector('.sakura-agent-mode-label');if(labelNode.textContent!==label)labelNode.textContent=label;
      for(const option of modeMenu.children){const checked=String((option.dataset.mode==='agent')===enabled);if(option.getAttribute('aria-checked')!==checked)option.setAttribute('aria-checked',checked);}
      activityButton.hidden=!enabled;if(!modeMenu.hidden)place(modeMenu,modeButton);if(!activityPanel.hidden)place(activityPanel,activityButton);
    }
    // ChatGPT can add a prefix/trailing slash or assign a new conversation ID
    // when the first native message is saved. Bind that transition to the exact
    // submitted request instead of treating every pathname change as a switch.
    const routePath=()=>location.pathname.replace(/\/+$/,'')||'/';
    const conversationID=path=>path.match(/(?:^|\/)c\/([^/]+)(?:\/|$)/)?.[1]||'';
    const completed=new Map();
    function messages(role){
      const selector=role==='user'?'[data-message-author-role="user"],[data-chatgpt-search-unit-key$=":user"],[data-user-message-bubble]':'[data-message-author-role="assistant"],[data-chatgpt-search-unit-key$=":assistant"]';
      // New ChatGPT uses search-unit containers; legacy layouts expose author-role.
      // Return one outer container per message when both markers coexist.
      return [...document.querySelectorAll(selector)].filter(node=>!node.parentElement?.closest(selector));
    }
    const users=()=>messages('user');
    const assistants=()=>messages('assistant');
    const stopButton=()=>[...document.querySelectorAll('button[data-testid*="stop"],button[aria-label^="Stop"],button[aria-label^="停止"]')].find(el=>el.getClientRects().length&&!el.hidden);
    function cancel() {
      const p=pending;pending=null;
      if(p && equivalent(h.read(h.composer()),p.text))write(h.composer(),p.draft||'');
    }
    function setMode(value) {
      if(enabled&&!value){restoreChat=true;cancel();}
      enabled=value;
      renderMode();renderActivity();
    }
    function intercept(event) {
      if(!enabled)return false;
      const el=h.composer(),task=h.read(el);
      if(!task.trim())return false;
      event.preventDefault();event.stopImmediatePropagation();
      if(pending)return true;
      claimedDraft=task;
      h.post({type:'SC_AGENT_TASK',task});
      return true;
    }
    function plain(question) {
      if(!restoreChat)return question;
      restoreChat=false;
      return 'SakuraMeter is now in Chat mode. The Agent run is stopped. Answer the following request normally; do not emit Agent protocol actions.\n\n'+question;
    }
    function send(m) {
      if(!enabled||pending||typeof m.text!=='string'||m.text.length>90000)return h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:m.request_id,error:'send_unavailable'});
      const el=h.composer(),draft=h.read(el);
      if(!el||stopButton()||(draft.trim()&&draft!==claimedDraft))return h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:m.request_id,error:'composer_busy'});
      const p={request_id:m.request_id,run_id:m.run_id,text:m.text,summary:m.summary||'Agent',draft,at:Date.now(),beforeUser:new Set(users()),beforeAssistant:new Set(assistants()),phase:'prepare',stableText:'',stableAt:0,user:null,route:routePath(),navigation:null};
      pending=p;claimedDraft='';
      try{write(el,m.text);}catch{cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:m.request_id,error:'editor_rejected'});}
    }
    let layoutLast='';
    function layout(){
      const el=h.composer(),surface=el?.closest('[data-composer-surface-variant],form,[data-composer-body]')||el;
      const box=surface?.getBoundingClientRect();
      if(!box||box.height<=0)return;
      const composerTop=Math.round(Math.max(0,Math.min(innerHeight,box.top))),key=composerTop+':'+innerHeight;
      if(key===layoutLast)return;layoutLast=key;
      h.post({type:'SC_AGENT_LAYOUT',composerTop,viewportHeight:innerHeight});
    }
    function tick() {
      renderMode();layout();
      const p=pending;if(!p)return;
      const now=Date.now();
      const path=routePath(),currentUsers=users();
      const submitted=currentUsers.find(n=>!p.beforeUser.has(n)&&(n.textContent||'').includes(p.request_id));
      if(path!==p.route){
        const from=conversationID(p.route),to=conversationID(path);
        if(from&&from===to){p.route=path;p.navigation=null;}
        else if(!p.beforeUser.size&&p.phase==='wait'&&to){
          // Allow only creation of this request's first conversation. A different
          // conversation's messages never count as proof, even on a /c/ route.
          if(!p.navigation||p.navigation.path!==path)p.navigation={path,at:now};
          if((currentUsers.length&&!submitted)||now-p.navigation.at>3000){cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'conversation_changed'});return;}
          if(!submitted||now-p.navigation.at<300)return;
          p.route=path;p.navigation=null;
        }else {cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'conversation_changed'});return;}
      }
      if(now-p.at>180000){cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'response_timeout'});return;}
      const el=h.composer();
      if(p.phase==='prepare'){
        if(!equivalent(h.read(el),p.text)){cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'draft_changed'});return;}
        const b=h.sendButton(el);
        if(!b||b.disabled||b.getAttribute('aria-disabled')==='true'){if(now-p.at>10000){cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'send_unavailable'});}return;}
        p.phase='wait';h.submit(b,p);return;
      }
      if(!p.user||!currentUsers.includes(p.user))p.user=submitted;
      if(!p.user)return;
      if(users().some(n=>n!==p.user&&(p.user.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))){cancel();h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'conversation_interrupted'});return;}
      const node=assistants().filter(n=>!p.beforeAssistant.has(n)&&(p.user.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING)).at(-1);
      if(!node||stopButton()){p.stableAt=0;return;}
      const content=node.querySelector('[data-markdown-text-style="assistant-message"],.markdown')||node;
      const raw=(content.innerText||content.textContent||'').trim();
      if(!raw)return;
      if(raw!==p.stableText){p.stableText=raw;p.stableAt=now;return;}
      // Require a completion affordance, not just a pause in streamed tokens.
      const turn=node.closest('[data-talvt-turn-state],article,[data-testid^="conversation-turn"],[data-turn-id]')||node;
      if(turn.hasAttribute('data-talvt-turn-state')&&turn.getAttribute('data-talvt-turn-state')!=='complete'){p.stableAt=0;return;}
      const complete=turn.querySelector('button[data-testid="copy-turn-action-button"],button[data-testid="good-response-turn-action-button"],button[data-testid="bad-response-turn-action-button"],button[aria-label="Copy"],button[aria-label="复制"]');
      if(!complete||now-p.stableAt<900)return;
      const blocks=[...content.querySelectorAll('pre')];
      let text=raw;
      if(blocks.length===1){const clone=content.cloneNode(true);clone.querySelector('pre').remove();if(!clone.textContent.trim())text=blocks[0].querySelector('code')?.textContent||blocks[0].textContent;}
      pending=null;
      completed.set(p.request_id,node);if(completed.size>40)completed.delete(completed.keys().next().value);
      h.post({type:'SC_AGENT_RESPONSE',run_id:p.run_id,request_id:p.request_id,text});
    }
    function receive(m) {
      if(m.type==='SC_AGENT_ACTIVITY'){activity={label:m.label,status:m.status,empty:m.empty,events:Array.isArray(m.events)?m.events.slice(-40):[]};renderActivity();return true;}
      if(m.type==='SC_AGENT_PRESENT'){const node=completed.get(m.request_id);if(node?.isConnected)h.present?.(node,{marker:m.request_id,question:String(m.summary||'Agent'),agent:true});return true;}
      if(m.type==='SC_AGENT_MODE'){setMode(m.enabled===true);return true;}
      if(m.type==='SC_AGENT_CANCEL'){cancel();return true;}
      if(m.type==='SC_AGENT_SEND'){send(m);return true;}
      return false;
    }
    function onInput(event){
      const el=h.composer();
      if(writing||!pending||!el||!(event?.target===el||el.contains(event?.target)))return;
      if((pending.phase==='prepare'&&(event.isTrusted||!equivalent(h.read(el),pending.text)))||(event.isTrusted&&h.read(el).trim()&&pending.phase==='wait')){
        const p=pending;pending=null; // Preserve even whitespace-only user edits.
        h.post({type:'SC_AGENT_TRANSPORT_ERROR',request_id:p.request_id,error:'draft_changed'});
      }
    }
    return {receive,intercept,plain,tick,cancel,onInput,get enabled(){return enabled;}};
  }
  globalThis.SakuraAgentTransport={create};
})();
