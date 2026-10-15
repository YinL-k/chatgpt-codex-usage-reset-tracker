/* Injected into the isolated world of the user-authorized active target tab. */
(() => {
  'use strict';
  if (globalThis.SakuraAgentPage) return;
  let last = null, sequence = 0;
  const clean = (v, n = 300) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const sensitive = el => el.matches('input[type=password],input[type=file],input[type=hidden]') || /password|passwd|secret|token|credit.?card|card.?number|cvc|cvv|密码|验证码|支付密码/i.test([el.name, el.id, el.autocomplete, el.getAttribute('aria-label')].join(' '));
  function visible(el) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[inert],[aria-hidden=true]');
  }
  function collect(root = document) {
    const found = [];
    for (const el of root.querySelectorAll('*')) {
      if (el.matches('button,a[href],input,textarea,select,[role=button],[role=checkbox],[role=radio],[role=combobox],[contenteditable=true]') && visible(el) && !sensitive(el)) found.push(el);
      if (el.shadowRoot) found.push(...collect(el.shadowRoot));
      if (found.length >= 200) break;
    }
    return found.slice(0, 160);
  }
  function name(el) {
    return clean(el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.getAttribute('placeholder') || el.innerText || el.title || el.name || el.getAttribute('role') || el.tagName);
  }
  function gather() {
    const nodes = collect();
    const elements = nodes.map((el, i) => ({
      id:'e'+(i+1), role:el.getAttribute('role') || el.tagName.toLowerCase(), name:name(el),
      ...(el.matches('input,textarea,select') ? {value:String(el.value).slice(0, 2000)} : {}),
      ...(el.matches('input[type=checkbox],input[type=radio]') ? {checked:el.checked} : {}),
      focused:el===document.activeElement || el===el.getRootNode().activeElement,
      ...(el.matches('select') ? {options:[...el.options].slice(0,80).map(o=>({value:o.value,label:clean(o.label),disabled:o.disabled}))} : {}),
      enabled:!el.disabled && el.getAttribute('aria-disabled') !== 'true',
      ...(el.matches('a[href]') ? {href:el.href} : {})
    }));
    const body = (document.body?.innerText || '').slice(0,16000);
    const data = {url:location.href,title:document.title,text:body,text_truncated:(document.body?.innerText || '').length>16000,elements,
      frames:[...document.querySelectorAll('iframe')].slice(0,12).map(f=>({title:f.title,src:f.src,supported:false})),
      scroll:{x:Math.round(scrollX),y:Math.round(scrollY)}};
    return {nodes,data,signature:JSON.stringify(data)};
  }
  function snapshot(token) {
    const current = gather();
    last = {...current, token, snapshot_id:crypto.randomUUID(), at:Date.now()};
    return {...current.data,snapshot_id:last.snapshot_id};
  }
  function confirmation(el, action) {
    if (action.name === 'press' && action.key === 'Enter') return true;
    if (action.name !== 'click') return false;
    return (el.matches('button,input') && el.form && ['submit','image'].includes(el.type)) || /\b(send|submit|delete|remove|purchase|buy|pay|confirm|publish|book|order|unsubscribe)\b|发送|提交|删除|购买|付款|支付|确认|发布|预订|下单|注销/i.test(name(el));
  }
  async function run(m) {
    if (m.op === 'stop') { sequence++; last = null; return {ok:true}; }
    if (m.op === 'observe') return {ok:true,observation:snapshot(m.token)};
    if (!last || last.token !== m.token || last.snapshot_id !== m.snapshot_id || Date.now()-last.at>180000) return {ok:false,error:'stale_snapshot'};
    const current = gather();
    if (last.signature !== current.signature || last.nodes.some((el,i)=>el!==current.nodes[i])) return {ok:false,error:'stale_snapshot'};
    const a = m.action, el = a.target ? last.nodes[Number(a.target.slice(1))-1] : null;
    if (a.target && (!el?.isConnected || !visible(el) || sensitive(el) || el.disabled || el.getAttribute('aria-disabled')==='true')) return {ok:false,error:'target_unavailable'};
    if (el && confirmation(el,a) && !m.approved) return {ok:false,approval:true,label:name(el)};
    const epoch=sequence;
    if (a.name === 'observe') return {ok:true,observation:snapshot(m.token)};
    if (a.name === 'click') {
      if(el.matches('a[href]')){const u=new URL(el.href);if(!['http:','https:'].includes(u.protocol)||u.origin!==location.origin||el.target==='_blank'||el.hasAttribute('download'))return {ok:false,error:'link_requires_user_navigation'};}
      el.scrollIntoView({block:'center',behavior:'instant'});
      const r=el.getBoundingClientRect(),hit=(el.getRootNode().elementFromPoint?.(r.left+r.width/2,r.top+r.height/2)||document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));
      if(!hit||!(hit===el||el.contains(hit)))return {ok:false,error:'target_obscured'};
      el.click();
    } else if (a.name === 'fill') {
      if (!el.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]') || el.readOnly) return {ok:false,error:'not_editable'};
      el.focus();
      if(el.isContentEditable){const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);if(!document.execCommand('insertText',false,a.value))return {ok:false,error:'editor_rejected'};}
      else {const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,a.value);el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:a.value}));el.dispatchEvent(new Event('change',{bubbles:true}));}
      if((el.isContentEditable?el.innerText:el.value)!==a.value)return {ok:false,error:'fill_unconfirmed'};
    } else if (a.name === 'select') {
      if(!el.matches('select')||![...el.options].some(o=>o.value===a.value&&!o.disabled))return {ok:false,error:'invalid_option'};
      el.value=a.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
    } else if (a.name === 'press') {
      el.focus();
      if(a.key==='Enter' && el.form) el.form.requestSubmit();
      else if(a.key==='Enter' && el.matches('button,a[href]')) return {ok:false,error:'use_click'};
      else if(a.key==='Tab'){const focusable=collect().filter(n=>n.tabIndex>=0&&!n.disabled);const index=focusable.indexOf(el);focusable[(index+1)%focusable.length]?.focus();}
      else if(['ArrowDown','ArrowUp'].includes(a.key)&&el.matches('select')){const options=[...el.options].filter(o=>!o.disabled),index=options.findIndex(o=>o.selected),next=options[Math.max(0,Math.min(options.length-1,index+(a.key==='ArrowDown'?1:-1)))];if(next){el.value=next.value;el.dispatchEvent(new Event('change',{bubbles:true}));}}
      else {el.dispatchEvent(new KeyboardEvent('keydown',{key:a.key,bubbles:true,cancelable:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:a.key,bubbles:true}));}
    } else if(a.name==='scroll') window.scrollBy({top:(a.direction==='down'?1:-1)*Math.max(300,innerHeight*.75),behavior:'instant'});
    else if(a.name!=='wait') return {ok:false,error:'unsupported_action'};
    // An acknowledgement means dispatch only; observation determines the outcome.
    last=null;
    await new Promise(r=>setTimeout(r,a.name==='wait'?1000:350));
    if(epoch!==sequence)return {ok:false,error:'cancelled'};
    return {ok:true,dispatched:true};
  }
  globalThis.SakuraAgentPage = {run};
})();
