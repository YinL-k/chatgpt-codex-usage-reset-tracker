(() => {
  'use strict';
  const words={
    en:{agentSettings:'Agent settings',agentFormat:'Response format',agentFormatNote:'JSON is the default. XML uses the same actions. Changes apply to the next task.',agentNote:'Uses your signed-in ChatGPT. Reads and operates the active authorized tab. You can stop at any time. Passwords and file uploads are excluded.',agentLimit:'Maximum actions per task',agentStop:'Stop',agentApprove:'Approve this action',agentDismiss:'Cancel task',agentLog:'Activity',agentNoActivity:'No activity yet',chat:'Chat',ready:'Enter a task in ChatGPT',starting:'Starting',observing:'Reading the page',waiting:'Waiting for ChatGPT',repairing:'Requesting a valid response',executing:'Executing',ask_user:'Reply in ChatGPT to continue',approval:'Confirm this action',stopped:'Stopped',step_limit:'Action limit reached',error:'Paused',done:'Finished',success:'Completed',partial:'Partially completed',blocked:'Blocked',agentEmpty:'Enable Agent to operate the current page. Chat keeps normal replies.'},
    zh:{agentSettings:'Agent 设置',agentFormat:'回复格式',agentFormatNote:'默认 JSON；XML 使用相同动作。修改后从下一项任务生效。',agentNote:'使用已登录的 ChatGPT，读取并操作当前已授权标签页。可随时停止；不处理密码或文件上传。',agentLimit:'每项任务最多执行动作数',agentStop:'停止',agentApprove:'允许本次操作',agentDismiss:'取消任务',agentLog:'活动',agentNoActivity:'暂无活动',chat:'Chat',ready:'在 ChatGPT 输入任务',starting:'正在启动',observing:'正在读取网页',waiting:'等待 ChatGPT',repairing:'正在请求修正格式',executing:'正在执行',ask_user:'在 ChatGPT 回复后继续',approval:'请确认本次操作',stopped:'已停止',step_limit:'已达到动作上限',error:'已暂停',done:'已结束',success:'已完成',partial:'部分完成',blocked:'无法完成',agentEmpty:'开启 Agent 后可操作当前网页；Chat 保持普通问答。'}
  };
  function create(h){
    const $=id=>document.getElementById(id),requests=new Map();let port=null,lang='en',last={status:'chat'},busyToggle=false;
    const t=k=>words[lang][k]||k;
    function connect(){
      if(port)return;
      port=chrome.runtime.connect({name:'SC_AGENT_PANEL'});
      port.onMessage.addListener(m=>{
        if(m.event==='stopped'){loop.error(m);return;}
        const job=requests.get(m.id);if(job){requests.delete(m.id);clearTimeout(job.timer);job.resolve(m);}
      });
      port.onDisconnect.addListener(()=>{port=null;for(const job of requests.values()){clearTimeout(job.timer);job.reject(Error('connection_lost'));}requests.clear();loop.error({error:'connection_lost'});});
    }
    function rpc(m){connect();return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{requests.delete(id);reject(Error('worker_timeout'));},20000);requests.set(id,{resolve,reject,timer});try{port.postMessage({...m,id});}catch(e){clearTimeout(timer);requests.delete(id);reject(e);}});}
    function render(){
      $('sakura-agent-bar').hidden=!h.enabled()||!loop.mode;
      $('agent-format').value=loop.format;$('agent-limit').value=String(loop.maxSteps);
      const [status,code]=last.status.split(':');
      $('agent-state').textContent=(status==='chat'?t('agentEmpty'):t(status)+(code?' · '+t(code):''))+(last.steps?' · '+last.steps:'');
      $('agent-detail').textContent=last.detail||'';
      $('agent-stop').hidden=!loop.run;
      $('agent-approve').hidden=status!=='approval';$('agent-deny').hidden=status!=='approval';
      $('agent-format').disabled=!!loop.run;$('agent-limit').disabled=!!loop.run;
      document.querySelectorAll('[data-agent-t]').forEach(el=>el.textContent=t(el.dataset.agentT));
      h.send({type:'SC_AGENT_ACTIVITY',label:t('agentLog'),empty:t('agentNoActivity'),status:$('agent-state').textContent,events:[...$('agent-events').children].map(el=>el.textContent)});
    }
    const loop=new SakuraAgentLoop({rpc,windowId:h.windowId,send:h.send,cancel:()=>h.send({type:'SC_AGENT_CANCEL'}),mode:enabled=>h.send({type:'SC_AGENT_MODE',enabled}),
      present:v=>h.send({type:'SC_AGENT_PRESENT',request_id:v.request_id,summary:v.type==='done'?v.answer:v.type==='ask_user'?v.question:'Agent · '+v.action.name+(v.action.target?' · '+v.action.target:'')}),
      status:s=>{last=s;if(s.status!=='chat'&&s.status!=='ready'){const li=document.createElement('li');li.textContent=new Date().toLocaleTimeString()+' · '+t(s.status.split(':')[0])+(s.detail?' · '+s.detail:'');$('agent-events').append(li);while($('agent-events').children.length>40)$('agent-events').firstChild.remove();}render();},
      answer:(answer,status)=>{$('agent-answer').textContent=answer;$('agent-answer').hidden=false;}
    });
    async function changeMode(enabled){if(busyToggle){h.send({type:'SC_AGENT_MODE',enabled:loop.mode});return;}busyToggle=true;try{await loop.setMode(enabled);}finally{busyToggle=false;render();}}
    $('agent-stop').addEventListener('click',()=>void loop.stop());
    $('agent-deny').addEventListener('click',()=>void loop.stop());
    $('agent-approve').addEventListener('click',()=>void loop.approve());
    $('agent-format').addEventListener('change',()=>{loop.format=$('agent-format').value==='xml'?'xml':'json';void save();});
    $('agent-limit').addEventListener('change',()=>{loop.maxSteps=Math.max(1,Math.min(50,Number($('agent-limit').value)||20));render();void save();});
    async function save(){await chrome.storage.local.set({__sakuraAgentPrefsV1:{format:loop.format,maxSteps:loop.maxSteps}});}
    void (chrome.storage.local?.get('__sakuraAgentPrefsV1')||Promise.resolve({})).then(d=>{const p=d.__sakuraAgentPrefsV1;if(p){loop.format=p.format==='xml'?'xml':'json';loop.maxSteps=Math.max(1,Math.min(50,p.maxSteps||20));}render();});
    window.addEventListener('pagehide',()=>{void loop.stop();port?.disconnect();});
    return {render,language:value=>{lang=value==='zh'?'zh':'en';render();},sync:()=>h.send({type:'SC_AGENT_MODE',enabled:loop.mode}),stop:()=>loop.stop(),
      receive:m=>{if(m.type==='SC_AGENT_LAYOUT'){
        if(Number.isFinite(m.composerTop)&&Number.isFinite(m.viewportHeight)&&m.viewportHeight>0){
          const frame=$('chat-frame').getBoundingClientRect(),top=frame.top+frame.height*Math.max(0,Math.min(1,m.composerTop/m.viewportHeight));
          $('sakura-agent-bar').style.setProperty('--agent-bottom',Math.max(12,innerHeight-top+8)+'px');
          $('sakura-agent-bar').style.setProperty('--agent-room',Math.max(40,top-68)+'px');
        }return true;
      }if(m.type==='SC_AGENT_SET_MODE'){void changeMode(m.enabled===true);return true;}if(m.type==='SC_AGENT_TASK'){if(!loop.run)$('agent-answer').hidden=true;void loop.task(m.task);return true;}if(m.type==='SC_AGENT_RESPONSE'){void loop.response(m);return true;}if(m.type==='SC_AGENT_TRANSPORT_ERROR'){loop.error(m);return true;}return false;}};
  }
  globalThis.SakuraAgentUI={create};
})();
