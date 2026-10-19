/* Shared settings, predictive readout and minute-precision countdowns. */
(()=>{
  'use strict';
  const C=SakuraResetPolicy.CONFIG,$=id=>document.getElementById(id),t=k=>GPTTrackerI18n.t(k);
  let prefs={mode:'standard',enabled:true},state=null,display=null,settings=null,prediction=null;
  async function load(){const d=await chrome.storage.local.get([C.key,C.prefsKey,C.displayKey]);display=d[C.displayKey];prefs={mode:'standard',enabled:true,...d[C.prefsKey]};state=d[C.key];render();}
  function render(){
    const p=display?.snapshot||state?.snapshot,valid=p&&Number.isFinite(p.at)&&p.at<=Date.now()&&[p.h6,p.h24].every(v=>Number.isFinite(v)&&v>=0&&v<=1);
    const cached=valid&&((display?display.error:state?.error)||Date.now()-p.at>C.staleMs);
    const threshold=C.modes[prefs.mode]||C.modes.standard;
    const level=state?.snapshot?.at===p?.at?state?.level:(valid&&(p.h24>=threshold.h24||p.h6>=threshold.h6)?'alert':valid&&(p.h24>=C.watch.h24||p.h6>=C.watch.h6)?'watch':'normal');
    const statusText=t(!valid?'rn_unavailable':cached?'rn_cached':'rn_'+(level||'normal'));
    const timestamp=valid?new Date(p.at).toLocaleString(document.documentElement.lang||undefined):'';
    for(const h of [6,24]){const n=$('codexReset'+h),bar=$('codexResetBar'+h);if(n)n.textContent=valid?Math.round(p['h'+h]*100)+'%':'—';if(bar)bar.style.width=(valid?p['h'+h]*100:0)+'%';}
    const status=$('codexResetForecastStatus');if(status){status.replaceChildren();const a=document.createElement('a');a.href='https://codex.lunarwerx.com/';a.target='_blank';a.rel='noopener';a.textContent='LunarWerx';a.addEventListener('click',e=>e.stopPropagation());status.append(a,document.createTextNode(' · '+statusText));status.title=timestamp;}
    // LunarWerx is the second source row of the Overview forecast card; both windows keep their slots while unavailable.
    if(prediction){const values=prediction.querySelector('.rn-prediction-values');values.replaceChildren();for(const key of ['h6','h24']){const value=valid?p[key]*100:0,windowValue=document.createElement('span');windowValue.className='rn-window';const label=document.createElement('span');label.className='rn-window-label';label.textContent=t(key==='h6'?'rn_6':'rf_24')+' ';const number=document.createElement('strong');number.textContent=valid?Math.round(value)+'%':'—';const track=document.createElement('span');track.className='rn-window-track';track.setAttribute('role','meter');track.setAttribute('aria-label',key==='h6'?'6h':'24h');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(value));const fill=document.createElement('span');fill.style.width=value+'%';track.append(fill);windowValue.append(label,number,track);values.append(windowValue);}values.title=timestamp;prediction.querySelector('.rn-prediction-state').textContent=statusText;const notify=prediction.querySelector('.rn-notify');notify.title=t('rn_note');notify.querySelector('.rn-notify-label').textContent=t('rn_enable');notify.querySelector('.rn-notify-value').textContent=prefs.enabled===false?t('rn_off'):t('rn_on')+' · '+t(prefs.mode==='low'?'rn_low':'rn_standard');}
    if(settings){
      settings.querySelector('h3').textContent=t('rn_title');settings.querySelector('.rn-note').textContent=t('rn_note');
      settings.querySelector('[data-enabled-label]').textContent=t('rn_enable');settings.querySelector('input').checked=prefs.enabled!==false;
      for(const b of settings.querySelectorAll('[data-mode]')){const mode=b.dataset.mode,th=C.modes[mode];b.textContent=t(mode==='low'?'rn_low':'rn_standard')+` · 24h ≥${th.h24*100}% / 6h ≥${th.h6*100}%`;b.setAttribute('aria-pressed',String(mode===prefs.mode));}
    }
    for(const el of document.querySelectorAll('.reset-countdown')){
      const ts=Number(el.dataset.resetAt),minutes=Math.max(0,Math.ceil((ts-Date.now())/60000));
      el.textContent=!Number.isFinite(ts)?'—':minutes===0?t('rn_waiting'):`${Math.floor(minutes/1440)}d : ${Math.floor(minutes%1440/60)}h : ${minutes%60}m`;
      el.dataset.waiting=String(minutes===0);
      el.closest('.reset-item')?.setAttribute('data-countdown',el.textContent);
    }
  }
  async function save(){const result=await chrome.runtime.sendMessage({type:'RN_PREFS',...prefs}).catch(()=>null);if(!result?.ok){await load();if(settings)settings.querySelector('.rn-save-status').textContent=t('action_failed');}}
  function openSettings(){$('tab-usage')?.click();const panel=document.querySelector('.advanced-panel');if(!panel)return;panel.open=true;(settings||panel).scrollIntoView({block:'center'});}
  function mount(){
    if($('resetForecast')&&!prediction){prediction=document.createElement('section');prediction.className='rn-settings rn-prediction';prediction.innerHTML='<div class="rn-prediction-head"><a href="https://codex.lunarwerx.com/" target="_blank" rel="noopener">LunarWerx ↗</a><span class="rn-prediction-state"></span></div><div class="rn-prediction-values"></div><button type="button" class="rn-notify"><span class="rn-notify-label"></span><strong class="rn-notify-value"></strong><span class="rn-notify-arrow" aria-hidden="true">›</span></button>';prediction.querySelector('.rn-notify').addEventListener('click',openSettings);$('resetForecast').querySelector('.rf-note').before(prediction);}
    const host=document.querySelector('.advanced-body');if(host&&!settings){
      settings=document.createElement('section');settings.className='rn-settings';
      settings.innerHTML='<h3></h3><label><input type="checkbox"><span data-enabled-label></span></label><div class="rn-modes"><button type="button" data-mode="standard"></button><button type="button" data-mode="low"></button></div><p class="rn-note"></p><p class="rn-save-status" role="status"></p>';
      host.prepend(settings);
      settings.querySelector('input').addEventListener('change',e=>{prefs.enabled=e.target.checked;void save();});
      settings.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{prefs.mode=b.dataset.mode;render();void save();}));
    }
    render();
  }
  let tooltip=null;
  function hide(){tooltip?.remove();tooltip=null;}
  function show(el,x,y){hide();if(!el.dataset.cacheTip)return;tooltip=document.createElement('div');tooltip.className='cache-tooltip';tooltip.id='cache-tooltip';tooltip.setAttribute('role','tooltip');tooltip.textContent=el.dataset.cacheTip;document.body.append(tooltip);tooltip.style.left=Math.max(8,Math.min(x+12,innerWidth-tooltip.offsetWidth-8))+'px';tooltip.style.top=Math.max(8,Math.min(y+14,innerHeight-tooltip.offsetHeight-8))+'px';}
  document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-cache-tip]');if(el)show(el,e.clientX,e.clientY);});
  document.addEventListener('pointerout',e=>{if(e.target.closest('[data-cache-tip]'))hide();});
  document.addEventListener('focusin',e=>{const el=e.target.closest('[data-cache-tip]');if(el){const r=el.getBoundingClientRect();show(el,r.left,r.bottom);}});
  document.addEventListener('focusout',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  document.addEventListener('gpt-language-changed',mount);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes[C.key]||changes[C.prefsKey]||changes[C.displayKey]))void load();});
  const observer=new MutationObserver(()=>{mount();});
  const root=$('usagePanel');if(root)observer.observe(root,{childList:true});
  const resets=$('overviewResets');if(resets)new MutationObserver(render).observe(resets,{childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  void load();
  const refresh=()=>{if(!document.hidden)void chrome.runtime.sendMessage({type:'RN_REFRESH'}).catch(()=>{});};
  refresh();document.addEventListener('visibilitychange',refresh);setInterval(()=>{render();refresh();},60000);
})();
