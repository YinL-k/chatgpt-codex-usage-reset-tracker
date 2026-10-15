((root) => {
  'use strict';
  const P=root.SakuraAgentProtocol || (typeof require==='function'?require('./agent-protocol.js'):null);
  class AgentLoop {
    constructor(h){this.h=h;this.run=null;this.mode=false;this.format='json';this.maxSteps=20;this.epoch=0;}
    notify(status,detail=''){this.h.status({status,detail,steps:this.run?.steps||0,format:this.run?.format||this.format});}
    async stop(reason='stopped'){
      ++this.epoch;this.run=null;this.h.cancel();this.notify(reason);
      try{await this.h.rpc({op:'stop'});}catch{}
    }
    async setMode(mode){this.mode=mode;this.h.mode(mode);await this.stop(mode?'ready':'chat');}
    async task(task){
      if(!this.mode||!task.trim()||task.length>16000)return;
      if(this.run?.status==='ask_user'){
        const run=this.run,epoch=this.epoch;run.user_reply=task;run.status='observing';this.notify('observing');
        try{const fresh=await this.h.rpc({op:'observe',run_id:run.id});if(!this.active(run,epoch))return;if(!fresh.ok)throw Error(fresh.error);run.observation=fresh.observation;this.next(run);}
        catch(e){if(this.active(run,epoch))void this.stop('error:'+e.message);}return;
      }
      await this.stop('starting');if(!this.mode)return;
      const run={id:crypto.randomUUID(),task,format:this.format,steps:0,repairs:0,status:'observing',request:null,observation:null};
      this.run=run;const epoch=this.epoch;this.notify('observing');
      try{
        const reply=await this.h.rpc({op:'start',run_id:run.id,windowId:this.h.windowId()});
        if(!this.active(run,epoch))return;if(!reply.ok)throw Error(reply.error);
        run.observation=reply.observation;this.next(run);
      }catch(e){if(this.active(run,epoch))void this.stop('error:'+e.message);}
    }
    active(run,epoch=this.epoch){return this.mode&&this.run===run&&this.epoch===epoch;}
    next(run,repair=null){
      if(!this.active(run))return;
      const request_id=crypto.randomUUID();run.request=request_id;run.status='waiting';
      const text=P.prompt({format:run.format,run_id:run.id,request_id,task:run.task,observation:run.observation,result:run.result,user_reply:run.user_reply,repair});
      this.notify(repair?'repairing':'waiting');this.h.send({type:'SC_AGENT_SEND',run_id:run.id,request_id,text,summary:run.steps===0&&!repair?run.task:`Agent · ${run.format.toUpperCase()} · ${run.steps}${repair?' · format repair':''}`});
    }
    async response(m){
      const run=this.run;if(!run||!this.active(run)||run.status!=='waiting'||m.run_id!==run.id||m.request_id!==run.request)return;
      // Consume a delivery once, even if the same DOM message is received again.
      run.status='processing';
      let v;
      try{v=P.parse(m.text,run.format,{run_id:run.id,request_id:run.request,snapshot_id:run.observation.snapshot_id});}
      catch(e){if(++run.repairs<=2){this.next(run,{error:String(e.message).slice(0,400),instruction:'The previous reply was not executed. Return one valid response for THIS request.'});}else await this.stop('error:invalid_response');return;}
      run.repairs=0;
      this.h.present?.(v);
      if(v.type==='done'){this.h.answer(v.answer,v.status);await this.stop('done:'+v.status);return;}
      if(v.type==='ask_user'){run.status='ask_user';this.notify('ask_user',v.question);return;}
      if(run.steps>=this.maxSteps){await this.stop('step_limit');return;}
      await this.execute(run,v,false);
    }
    async execute(run,v,approved){
      if(!this.active(run))return;
      const epoch=this.epoch;run.status='executing';this.notify('executing',v.action.name+(v.action.target?' '+v.action.target:''));
      try{
        const reply=await this.h.rpc(approved?{op:'approve',run_id:run.id,request_id:v.request_id}:{op:'execute',run_id:run.id,response:v});
        if(!this.active(run,epoch))return;
        if(reply.approval){run.pending=v;run.status='approval';this.notify('approval',reply.label);return;}
        if(!reply.ok)throw Error(reply.error);
        run.pending=null;run.steps++;run.result=reply.result;run.observation=reply.observation;
        this.next(run);
      }catch(e){if(this.active(run,epoch))await this.stop('error:'+e.message);}
    }
    approve(){const run=this.run;if(run?.status==='approval')return this.execute(run,run.pending,true);}
    error(m){if(this.run&&(!m.request_id||m.request_id===this.run.request))void this.stop('error:'+m.error);}
  }
  root.SakuraAgentLoop=AgentLoop;
  if(typeof module!=='undefined')module.exports=AgentLoop;
})(globalThis);
