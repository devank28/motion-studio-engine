/* Motion Studio engine v2.1, part 3 of 3. Loaded by the Gem's Canvas page. */
/* =====================================================================
   6) ENGINE: TIMELINE, TRANSITIONS, VOICE, PLAYER, EXPORT. Do not edit.
   ===================================================================== */
const ASSETS={};
const FPS=()=>VIDEO.fps;
const TRANSITIONS={
fade:{in:(c,p)=>{c.globalAlpha*=p;},out:(c,p)=>{c.globalAlpha*=1-p;}},
blur:{in:(c,p)=>{c.globalAlpha*=p;setBlur(c,(1-p)*S(18));zoomAt(c,lerp(1.05,1,p));},
out:(c,p)=>{c.globalAlpha*=1-p;setBlur(c,p*S(18));zoomAt(c,lerp(1,0.96,p));}},
slide:{in:(c,p)=>{c.translate((1-p)*W(),0);setBlur(c,Math.sin(Math.PI*p)*S(8));},
out:(c,p)=>{c.translate(-p*W()*0.3,0);c.globalAlpha*=1-p;}},
slideUp:{in:(c,p)=>{c.translate(0,(1-p)*H());setBlur(c,Math.sin(Math.PI*p)*S(8));},
out:(c,p)=>{c.translate(0,-p*H()*0.3);c.globalAlpha*=1-p;}},
push:{in:(c,p)=>{c.translate((1-p)*W(),0);setBlur(c,Math.sin(Math.PI*p)*S(10));},
out:(c,p)=>{c.translate(-p*W(),0);setBlur(c,Math.sin(Math.PI*p)*S(10));}},
pushUp:{in:(c,p)=>{c.translate(0,(1-p)*H());setBlur(c,Math.sin(Math.PI*p)*S(10));},
out:(c,p)=>{c.translate(0,-p*H());setBlur(c,Math.sin(Math.PI*p)*S(10));}},
wipe:{in:(c,p)=>{c.beginPath();c.rect(0,0,W()*p,H());c.clip();},
out:(c,p)=>{c.beginPath();c.rect(W()*p,0,W()*(1-p),H());c.clip();}},
zoom:{in:(c,p)=>{c.globalAlpha*=p;zoomAt(c,lerp(0.86,1,p));setBlur(c,(1-p)*S(10));},
out:(c,p)=>{c.globalAlpha*=1-p;zoomAt(c,lerp(1,1.3,p));setBlur(c,p*S(10));}},
circle:{in:(c,p)=>{c.beginPath();c.arc(W()/2,H()/2,Math.hypot(W(),H())/2*p,0,Math.PI*2);c.clip();},
out:(c,p)=>{c.beginPath();c.rect(0,0,W(),H());c.arc(W()/2,H()/2,Math.hypot(W(),H())/2*p,0,Math.PI*2,true);c.clip();}},
};
TRANSITIONS.iris=TRANSITIONS.circle;
TRANSITIONS.wipeUp={in:(c,p)=>{c.beginPath();c.rect(0,H()*(1-p),W(),H()*p);c.clip();},out:(c,p)=>{c.beginPath();c.rect(0,0,W(),H()*(1-p));c.clip();}};
TRANSITIONS.wipeDown={in:(c,p)=>{c.beginPath();c.rect(0,0,W(),H()*p);c.clip();},out:(c,p)=>{c.beginPath();c.rect(0,H()*p,W(),H()*(1-p));c.clip();}};
const T_EASE=Easing.inOutQuart;
function transOf(s){return s.transitionIn||{type:s.accentT?LOOK.accentTransition:LOOK.transition,duration:LOOK.tDur};}
const overlapOf=s=>{const t=transOf(s);return t.type!=="none"&&TRANSITIONS[t.type]?(t.duration??LOOK.tDur):0;};
function buildTimeline(){
let cursor=0;const out=[];
SCENES.forEach((s,i)=>{
const ti={...transOf(s)};if(ti.duration==null)ti.duration=LOOK.tDur;
const t=(i>0&&ti.type!=="none"&&TRANSITIONS[ti.type])?Math.min(ti.duration||0,s.duration,out[i-1].duration):0;
const start=Math.max(0,cursor-t);
out.push({...s,transitionIn:ti,index:i,start,tIn:t});cursor=start+s.duration;
});
return{scenes:out,total:Math.max(1,cursor)};
}
let TL=buildTimeline();
function renderFrame(ctx,frame){
ctx.save();BOIL=LOOK.boil?Math.floor(frame/4):0;
ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
if("filter"in ctx)ctx.filter="none";
try{drawBackground(ctx,frame);}catch(e){fillBg(ctx,BRAND.bg);console.error(e);}
const sc=TL.scenes;
for(let i=0;i<sc.length;i++){
const s=sc[i];
if(frame<s.start||frame>=s.start+s.duration)continue;
const f=frame-s.start,nx=sc[i+1];
ctx.save();
if(nx&&nx.tIn>0&&frame>=nx.start)TRANSITIONS[nx.transitionIn.type].out(ctx,T_EASE((frame-nx.start)/nx.tIn));
if(s.tIn>0&&f<s.tIn)TRANSITIONS[s.transitionIn.type].in(ctx,T_EASE(f/s.tIn));
const drift=s.drift??LOOK.drift,br=LOOK.breathe??1;
if(!s.world)zoomAt(ctx,1+drift*f/Math.max(1,s.duration)+br*0.004*Math.sin(f/FPS()*1.6));
if(!s.world&&nx&&nx.tIn===0&&f>s.duration-10){const e=Easing.inExpo((f-(s.duration-10))/10);ctx.globalAlpha*=1-e;ctx.translate(0,-e*S(24));}
if(LOOK.boil)ctx.translate((random("bx"+BOIL)-0.5)*S(2.4),(random("by"+BOIL)-0.5)*S(2.4));
const sf=LOOK.steps?Math.floor(f/LOOK.steps)*LOOK.steps:f;
CUR=s;
try{s.draw(ctx,sf,s.duration);}catch(e){showStatus(`Scene "${s.name}" error at frame ${f}: ${e.message}`);console.error(e);}
CUR=null;
ctx.restore();
if(s.tIn>0&&f<s.tIn){const tp=T_EASE(f/s.tIn),ty=s.transitionIn.type;ctx.fillStyle=BRAND.accent;
if(ty==="wipe")ctx.fillRect(W()*tp-S(5),0,S(10),H());
else if(ty==="wipeUp")ctx.fillRect(0,H()*(1-tp)-S(5),W(),S(10));
else if(ty==="wipeDown")ctx.fillRect(0,H()*tp-S(5),W(),S(10));
else if(ty==="iris")circle(ctx,W()/2,H()/2,Math.hypot(W(),H())/2*tp,null,BRAND.accent,S(8));
}
}
try{finishFrame(ctx,frame);}catch(e){console.error(e);}
try{if(SETTINGS.subs!=="off")voiceCaptions(ctx,frame);}catch(e){console.error(e);}
try{if(SETTINGS.progress)OVERLAY(ctx,frame,TL.total);}catch(e){console.error(e);}
ctx.restore();
}
const AUDIO={ctx:null,buffers:{},clips:{},live:[],music:{},jobs:{}};
function audioCtx(){
if(!AUDIO.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;AUDIO.ctx=new AC();}
if(AUDIO.ctx.state==="suspended")AUDIO.ctx.resume();
return AUDIO.ctx;
}
const voiceLine=s=>String(s.voice||"").trim();
const liveClip=i=>{const c=AUDIO.clips[i],s=TL.scenes[i];return c&&s&&c.text===voiceLine(s)?c:null;};
const hasClips=()=>TL.scenes.some((s,i)=>liveClip(i));
const moodOf=()=>SETTINGS.music==="auto"?(preset(SETTINGS.style).music||"corporate"):SETTINGS.music;
const isBuf=b=>!!(b&&b.getChannelData);
const musicBuffer=()=>SETTINGS.music==="upload"?AUDIO.buffers.music:(isBuf(AUDIO.music[moodOf()])?AUDIO.music[moodOf()]:null);
const hasAudio=()=>hasClips()||!!AUDIO.buffers["voice-over"]||!!musicBuffer();
function stopAudio(){AUDIO.live.forEach(n=>{try{n.stop();}catch(e){}});AUDIO.live=[];}
function voiceSpans(){
const out=[],vb=AUDIO.buffers["voice-over"];
if(vb){const st=(AUDIO_SLOTS.find(a=>a.name==="voice-over")||{}).start||0;out.push([st,st+vb.duration]);}
else TL.scenes.forEach((s,i)=>{const c=liveClip(i);if(c){const a=s.start/FPS()+VOICE.leadIn;out.push([a,a+c.buffer.duration]);}});
const m=[];out.sort((a,b)=>a[0]-b[0]).forEach(sp=>{const l=m[m.length-1];if(l&&sp[0]-l[1]<0.8)l[1]=Math.max(l[1],sp[1]);else m.push([...sp]);});
return m;
}
function startAudio(fromFrame,extraDest){
stopAudio();const ac=audioCtx();if(!ac||!hasAudio())return;
const now=ac.currentTime+0.03,t=fromFrame/FPS(),end=TL.total/FPS();
const bus=vol=>{const g=ac.createGain();g.gain.value=vol;g.connect(ac.destination);if(extraDest)g.connect(extraDest);return g;};
const play=(buf,at,dest,loop)=>{
const src=ac.createBufferSource();src.buffer=buf;src.loop=!!loop;src.connect(dest);
const startIn=Math.max(0,at-t),offset=Math.max(0,t-at);
if(!loop&&offset>=buf.duration)return;
src.start(now+startIn,loop?offset%buf.duration:offset);
src.stop(now+Math.max(0,end-t));AUDIO.live.push(src);
};
const vg=bus(SETTINGS.voiceVol),vb=AUDIO.buffers["voice-over"];
if(vb)play(vb,(AUDIO_SLOTS.find(a=>a.name==="voice-over")||{}).start||0,vg,false);
else TL.scenes.forEach((s,i)=>{const c=liveClip(i);if(c)play(c.buffer,s.start/FPS()+VOICE.leadIn,vg,false);});
const mb=musicBuffer();
if(mb&&SETTINGS.musicVol>0){
const v=SETTINGS.musicVol,low=v*0.35,pts=[[0,0],[0.6,v]];
voiceSpans().forEach(([a,b])=>{pts.push([Math.max(0.6,a-0.3),v],[Math.max(0.65,a),low],[b+0.1,low],[b+0.6,v]);});
pts.push([Math.max(0.7,end-1.2),v],[end-0.05,0]);
pts.sort((p,q)=>p[0]-q[0]);
const at=x=>{if(x<=pts[0][0])return pts[0][1];for(let k=1;k<pts.length;k++)if(x<=pts[k][0]){const[x0,y0]=pts[k-1],[x1,y1]=pts[k];return x1===x0?y1:y0+(y1-y0)*(x-x0)/(x1-x0);}return pts[pts.length-1][1];};
const mg=bus(0);mg.gain.setValueAtTime(at(t),now);
pts.forEach(([x,y])=>{if(x>t)mg.gain.linearRampToValueAtTime(y,now+x-t);});
play(mb,0,mg,true);
}
}
const MOODS={
upbeat:{label:"Upbeat pop",bpm:122,key:60,prog:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],per:1,drums:"four",lead:"pluck",bass:"octave",pump:true,cut:2600},
corporate:{label:"Corporate",bpm:108,key:62,prog:[[0,"M"],[5,"M"],[9,"m"],[7,"M"]],per:1,drums:"soft",lead:"pluck",bass:"quarter",pump:false,cut:2000},
calm:{label:"Calm piano",bpm:76,key:65,prog:[[0,"M7"],[5,"M7"],[9,"m7"],[7,"sus"]],per:2,drums:"none",lead:"piano",bass:"whole",pump:false,cut:1300},
cinematic:{label:"Cinematic",bpm:70,key:50,prog:[[0,"m"],[8,"M"],[3,"M"],[10,"M"]],per:2,drums:"boom",lead:"ostinato",bass:"whole",pump:false,cut:1600},
tech:{label:"Tech pulse",bpm:118,key:57,prog:[[0,"m"],[8,"M"],[3,"M"],[10,"M"]],per:1,drums:"four",lead:"arp16",bass:"offbeat",pump:true,cut:1800},
};
const CHORDS={M:[0,4,7],m:[0,3,7],M7:[0,4,7,11],m7:[0,3,7,10],sus:[0,5,7]};
async function makeMusic(name){
const m=MOODS[name],OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
if(!m||!OAC)return null;
const rate=44100,beat=60/m.bpm,bars=8,L=bars*4*beat,tail=2.5,oc=new OAC(2,Math.ceil((L+tail)*rate),rate);
let seed=99;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
const noise=oc.createBuffer(1,rate,rate);{const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;}
const comp=oc.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;comp.connect(oc.destination);
const dry=oc.createGain();dry.connect(comp);
const verb=oc.createConvolver(),ir=oc.createBuffer(2,Math.floor(rate*2.4),rate);
for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(rnd()*2-1)*Math.pow(1-i/d.length,3.2);}
verb.buffer=ir;const wet=oc.createGain();wet.gain.value=0.32;verb.connect(wet);wet.connect(comp);
const sendTo=g=>{g.connect(dry);g.connect(verb);};
const pump=oc.createGain();sendTo(pump);
if(m.pump)for(let b=0;b<bars*4+4;b++){const tb=b*beat;pump.gain.setValueAtTime(0.4,tb);pump.gain.linearRampToValueAtTime(1,tb+beat*0.55);}
const hz=n=>440*Math.pow(2,(n-69)/12);
const osc=(type,f,t0,t1,dest,detune=0)=>{const o=oc.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=detune;o.connect(dest);o.start(t0);o.stop(t1);return o;};
const envGain=(t,a,peak,rel,hold)=>{const g=oc.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);
if(hold)g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+(hold||0)+rel);return g;};
const lowpass=(f,q=0.5)=>{const b=oc.createBiquadFilter();b.type="lowpass";b.frequency.value=f;b.Q.value=q;return b;};
const pad=(t,dur,notes,lvl)=>{const g=envGain(t,Math.min(0.8,dur*0.25),lvl,1.2,dur-Math.min(0.8,dur*0.25)),lp=lowpass(m.cut);
lp.connect(g);g.connect(pump);notes.forEach(n=>{osc("sawtooth",hz(n),t,t+dur+1.3,lp,-9);osc("sawtooth",hz(n),t,t+dur+1.3,lp,9);osc("triangle",hz(n-12),t,t+dur+1.3,lp);});};
const pluck=(t,n,len,lvl,type="triangle",cut=3600)=>{const g=envGain(t,0.004,lvl,len),lp=lowpass(cut,1);
lp.frequency.setValueAtTime(cut,t);lp.frequency.exponentialRampToValueAtTime(420,t+len);lp.connect(g);g.connect(pump);osc(type,hz(n),t,t+len+0.05,lp);};
const piano=(t,n,lvl)=>{const g=envGain(t,0.006,lvl,2.2);sendTo(g);osc("sine",hz(n),t,t+2.4,g);const g2=envGain(t,0.004,lvl*0.35,0.6);g2.connect(g);osc("triangle",hz(n+12),t,t+0.8,g2);};
const bass=(t,n,len,lvl)=>{const g=envGain(t,0.01,lvl,Math.max(0.15,len*0.9)),lp=lowpass(380,0.7);lp.connect(g);g.connect(dry);osc("triangle",hz(n),t,t+len+0.1,lp);osc("sine",hz(n-12),t,t+len+0.1,lp);};
const kick=(t,lvl)=>{const g=envGain(t,0.002,lvl,0.38);g.connect(dry);const o=osc("sine",150,t,t+0.45,g);o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(44,t+0.14);};
const hit=(t,len,type,f,lvl,toVerb=false)=>{const src=oc.createBufferSource();src.buffer=noise;const bq=oc.createBiquadFilter();bq.type=type;bq.frequency.value=f;
const g=envGain(t,0.002,lvl,len);src.connect(bq);bq.connect(g);if(toVerb)sendTo(g);else g.connect(dry);src.start(t,rnd()*0.5);src.stop(t+len+0.05);};
const clap=(t,lvl)=>{[0,0.012,0.024].forEach(d=>hit(t+d,0.16,"bandpass",1500,lvl,true));};
const boom=t=>{const g=envGain(t,0.01,0.9,2.2);sendTo(g);const o=osc("sine",80,t,t+2.4,g);o.frequency.setValueAtTime(80,t);o.frequency.exponentialRampToValueAtTime(32,t+0.9);hit(t,1.2,"lowpass",260,0.5,true);};
const voiced=(root,q)=>CHORDS[q].map(i=>{let n=root+i;while(n<55)n+=12;while(n>=67)n-=12;return n;}).sort((a,b)=>a-b);
for(let bar=0;bar<bars;bar++){
const t0=bar*4*beat,[deg,q]=m.prog[Math.floor(bar/m.per)%m.prog.length],root=m.key+deg,notes=voiced(root,q),b0=root-12-(root-12>=48?12:0);
if(bar%m.per===0)pad(t0,m.per*4*beat,notes,m.lead==="piano"?0.035:0.045);
for(let k=0;k<4;k++){const tb=t0+k*beat;
if(m.bass==="octave"){bass(tb,b0,beat*0.45,0.5);bass(tb+beat/2,b0+12,beat*0.4,0.38);}
else if(m.bass==="quarter")bass(tb,b0,beat*0.85,0.45);
else if(m.bass==="offbeat")bass(tb+beat/2,b0,beat*0.42,0.5);
else if(k===0&&bar%m.per===0)bass(tb,b0,m.per*4*beat*0.95,0.42);
if(m.drums==="four"){kick(tb,0.95);hit(tb+beat/2,0.05,"highpass",8000,0.22);if(k%2)clap(tb,0.32);if(m.lead==="arp16")hit(tb+beat*0.75,0.03,"highpass",9000,0.1);}
else if(m.drums==="soft"){if(k%2===0)kick(tb,0.7);if(k===2)kick(tb+beat/2,0.45);if(k%2)clap(tb,0.2);hit(tb,0.04,"highpass",8500,0.12);hit(tb+beat/2,0.04,"highpass",8500,0.09);}
}
if(m.drums==="boom"&&bar%2===0)boom(t0);
const up=notes.map(n=>n+12);
if(m.lead==="pluck")[0,1,2,1,0,2,1,2].forEach((j,e)=>{if(e===3&&bar%2)return;pluck(t0+e*beat/2,up[j%up.length],beat*0.9,0.16);});
else if(m.lead==="arp16")for(let e=0;e<16;e++){const seqI=[0,1,2,3,2,1][e%6];pluck(t0+e*beat/4,up[seqI%up.length]+(e%8===7?12:0),beat*0.35,0.11,"sawtooth",2200);}
else if(m.lead==="piano")[0,1,2,3].forEach(k=>piano(t0+k*beat+(k%2?beat*0.02:0),up[[0,2,1,3][k]%up.length],0.2));
else if(m.lead==="ostinato"&&bar>=2)for(let e=0;e<8;e++)pluck(t0+e*beat/2,(e%2?notes[2]:notes[0])+12,beat*0.6,0.09+0.02*bar/bars,"sawtooth",1800);
}
const out=await oc.startRendering(),n=Math.floor(L*rate),tl=out.length-n;
const loop=oc.createBuffer(2,n,rate);let peak=0.001;
for(let c=0;c<2;c++){const s=out.getChannelData(c),d=loop.getChannelData(c);d.set(s.subarray(0,n));for(let i=0;i<tl&&i<n;i++)d[i]+=s[n+i];
for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(d[i]));}
for(let c=0;c<2;c++){const d=loop.getChannelData(c);for(let i=0;i<n;i++)d[i]*=0.9/peak;}
return loop;
}
function ensureMusic(){
const mood=moodOf();
if(SETTINGS.music==="upload"||!MOODS[mood])return Promise.resolve();
if(isBuf(AUDIO.music[mood]))return Promise.resolve();
if(!AUDIO.jobs[mood])AUDIO.jobs[mood]=makeMusic(mood).then(b=>{AUDIO.music[mood]=b;if(playing&&moodOf()===mood)startAudio(frame);})
.catch(e=>{console.error(e);vStatus(`Couldn't make the music here (${e.message}). You can still use Add music.`,true);});
return AUDIO.jobs[mood];
}
const estimateSec=line=>Math.max(0.8,line.split(/\s+/).filter(Boolean).length/2.5);
function captionChunks(line){
const words=line.split(/\s+/).filter(Boolean),chunks=[];let cur=[];
words.forEach((w,i)=>{cur.push(w);if(cur.length>=6||(/[.,;:!?]$/.test(w)&&cur.length>=3)||i===words.length-1){chunks.push(cur);cur=[];}});
return chunks;
}
function captionCues(){
const cues=[];
for(const s of TL.scenes){
const line=voiceLine(s);if(!line)continue;
const c=liveClip(s.index),dur=c?c.buffer.duration:estimateSec(line),st=s.start/FPS()+VOICE.leadIn;
const chunks=captionChunks(line),total=chunks.reduce((a,k)=>a+k.length,0);let acc=0;
chunks.forEach((k,j)=>{const a=st+acc/total*dur;acc+=k.length;const b=st+acc/total*dur;
const lens=k.map(w=>w.length+1),tl=lens.reduce((x,y)=>x+y,0);let c2=0;
const wt=k.map(w=>{const v=a+c2/tl*(b-a);c2+=w.length+1;return v;});
cues.push({start:a,end:j===chunks.length-1?b+0.25:b,text:k.join(" "),words:k,wt});});
}
return cues;
}
function voiceCaptions(ctx,frame){
const t=frame/FPS(),cue=captionCues().find(c=>t>=c.start&&t<c.end);if(!cue)return;
const size=S(isTall()?40:36)*(SETTINGS.subSize||1),a=clamp((t-cue.start)*FPS()/4+0.2);
const full=measure(ctx,cue.text,size,600,BRAND.fontBody),sz=full>W()*0.84?size*W()*0.84/full:size,tw=Math.min(full,W()*0.84);
const y=SETTINGS.subs==="top"?(isTall()?H()*0.1:S(80)):(isTall()?H()*0.84:H()-S(78)-(size-S(36))*0.6);
ctx.save();ctx.globalAlpha=a;
roundRect(ctx,W()/2-tw/2-S(26),y-size*0.85,tw+S(52),size*1.7,size*0.85,"rgba(8,10,16,0.7)","rgba(255,255,255,0.12)",S(1.5));
text(ctx,cue.text,W()/2,y+size*0.04,{size:sz,weight:600,family:BRAND.fontBody,color:"#FFFFFF",depth:0});
let wi=-1;cue.wt.forEach((v,i)=>{if(t>=v)wi=i;});
if(wi>=0){const pre=cue.words.slice(0,wi).join(" ")+(wi?" ":""),hx=W()/2-tw/2+measure(ctx,pre,sz,600,BRAND.fontBody);
const hc=isHex(BRAND.accent)&&lum(BRAND.accent)<0.4?mix(BRAND.accent,"#FFFFFF",0.45):BRAND.accent;
text(ctx,cue.words[wi],hx,y+size*0.04,{size:sz,weight:600,family:BRAND.fontBody,color:hc,align:"left",depth:0});}
ctx.restore();
}
function saveSrt(){
const cues=captionCues();if(!cues.length){showStatus("No voice lines, so there are no subtitles to save.");return;}
const p=(n,k=2)=>String(n).padStart(k,"0");
const ts=x=>{const ms=Math.round(x*1000);return`${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;};
download(new Blob([cues.map((c,i)=>`${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n")],{type:"text/plain"}),`${VIDEO.title}.srt`);
showStatus(`Saved ${VIDEO.title}.srt (${cues.length} subtitles). Upload it with the video on Teams, YouTube or your intranet.`);
}
function fitScenes(){
SCENES.forEach(s=>{if(s._base==null)s._base=s.duration;});
const need=SCENES.map((s,i)=>{
const line=voiceLine(s);if(!line||VOICE.autoFit===false)return 0;
const c=AUDIO.clips[i]&&AUDIO.clips[i].text===line?AUDIO.clips[i].buffer.duration:estimateSec(line);
const nx=SCENES[i+1];return Math.ceil((VOICE.leadIn+c+0.5)*FPS())+(nx?overlapOf(nx):0);
}).map((v,i)=>SETTINGS.length>0?v:Math.max(v,Math.ceil(readSec(SCENES[i])*FPS())+(SCENES[i+1]?overlapOf(SCENES[i+1]):0)));
let k=1;
if(SETTINGS.length>0){
const target=SETTINGS.length*FPS()+SCENES.reduce((a,s,i)=>a+(i?overlapOf(s):0),0);
k=target/Math.max(1,SCENES.reduce((a,s)=>a+s._base,0));
for(let it=0;it<4;it++){let fixed=0,free=0;
SCENES.forEach((s,i)=>{if(need[i]>=Math.round(s._base*k))fixed+=need[i];else free+=s._base;});
if(free>0)k=Math.max(0.35,(target-fixed)/free);}
}
SCENES.forEach((s,i)=>{s.duration=Math.max(SETTINGS.length>0?36:1,Math.round(s._base*k),need[i]);});
TL=buildTimeline();
if(ui.scrub)ui.scrub.max=TL.total-1;
}
const apiKey="";
const TTS={models:["gemini-2.5-flash-preview-tts","gemini-3.1-flash-tts-preview","gemini-2.5-pro-preview-tts"],cache:{},busy:false};
const VOICES=[["Puck","upbeat"],["Charon","informative"],["Kore","firm"],["Fenrir","excitable"],["Leda","youthful"],["Aoede","breezy"],["Zephyr","bright"],["Orus","firm"],["Sulafat","warm"],["Achird","friendly"],["Sadachbia","lively"],["Laomedeia","upbeat"],["Callirrhoe","easy-going"],["Autonoe","bright"],["Enceladus","breathy"],["Iapetus","clear"],["Umbriel","easy-going"],["Algieba","smooth"],["Despina","smooth"],["Erinome","clear"],["Algenib","gravelly"],["Rasalgethi","informative"],["Achernar","soft"],["Alnilam","firm"],["Schedar","even"],["Gacrux","mature"],["Pulcherrima","forward"],["Zubenelgenubi","casual"],["Vindemiatrix","gentle"],["Sadaltager","knowledgeable"]];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ttsFetch(line,voiceName){
let lastErr=null;
for(const model of TTS.models){
for(let attempt=0;attempt<3;attempt++){
let r;
try{
r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{
method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({contents:[{parts:[{text:line}]}],
generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName}}}}}),
});
}catch(e){lastErr=e;if(attempt>=1)throw e;await sleep(800);continue;}
if(r.ok){
const j=await r.json();const parts=(j&&j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
const part=parts.find(p=>p.inlineData&&p.inlineData.data);
if(part)return part.inlineData;
lastErr=new Error("no audio in the reply");if(attempt>=1)break;await sleep(600);continue;
}
lastErr=new Error(`voice service answered ${r.status}`);
if(r.status===429||r.status>=500){await sleep(1500*2**attempt);continue;}
break;
}
}
throw lastErr||new Error("no voice model answered");
}
function b64ToBytes(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
async function toAudioBuffer(ac,inline){
const bytes=b64ToBytes(inline.data),mime=inline.mimeType||"";
const riff=bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46;
let buf;
if(riff||/wav|mpeg|mp3|ogg|webm|aac/i.test(mime))buf=await ac.decodeAudioData(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));
else{
const rate=+((mime.match(/rate=(\d+)/)||[])[1]||24000),n=Math.floor(bytes.length/2);
const dv=new DataView(bytes.buffer,bytes.byteOffset,n*2);
buf=ac.createBuffer(1,Math.max(1,n),rate);const ch=buf.getChannelData(0);
for(let i=0;i<n;i++)ch[i]=dv.getInt16(i*2,true)/32768;
}
return trimSilence(ac,buf);
}
function trimSilence(ac,buf){
const d=buf.getChannelData(0),th=0.012,pad=Math.floor(buf.sampleRate*0.05);
let a=0,b=d.length-1;while(a<d.length&&Math.abs(d[a])<th)a++;while(b>a&&Math.abs(d[b])<th)b--;
a=Math.max(0,a-pad);b=Math.min(d.length-1,b+pad);if(b-a<pad)return buf;
const out=ac.createBuffer(buf.numberOfChannels,b-a+1,buf.sampleRate);
for(let c=0;c<buf.numberOfChannels;c++)out.getChannelData(c).set(buf.getChannelData(c).subarray(a,b+1));
return out;
}
function vStatus(msg,err=false){ui.vstatus.textContent=msg;ui.vstatus.className=err?"err":"";}
async function generateVoice(){
if(TTS.busy||recording)return;
const ac=audioCtx();if(!ac){vStatus("This browser can't play sound.",true);return;}
const jobs=TL.scenes.map((s,i)=>[i,voiceLine(s)]).filter(j=>j[1]);
if(!jobs.length){vStatus("No voice lines yet. Type a line for a scene in the script below, or ask the Gem to write the voice-over.",true);ui.script.open=true;return;}
TTS.busy=true;ui.gen.disabled=true;ui.rec.disabled=true;
if(playing)ui.play.click();
const voiceName=ui.voice.value,made={};
try{
for(let k=0;k<jobs.length;k++){
const[i,line]=jobs[k],key=`${voiceName}|${VOICE.style}|${line}`;
vStatus(`Making the voice-over… line ${k + 1} of ${jobs.length}`);
if(!TTS.cache[key]){TTS.cache[key]=await toAudioBuffer(ac,await ttsFetch(`${VOICE.style} ${line}`.trim(),voiceName));await sleep(250);}
made[i]={buffer:TTS.cache[key],text:line};
}
}catch(e){
console.error(e);
vStatus(`Couldn't make the voice-over here (${e.message}). Try Generate again in a minute. Or record it yourself: open the script below, read it aloud with your phone's voice recorder, then press "Add voice-over".`,true);
ui.script.open=true;TTS.busy=false;ui.gen.disabled=false;ui.rec.disabled=false;return;
}
AUDIO.clips=made;delete AUDIO.buffers["voice-over"];resetUploadLabel("voice-over");
const before=TL.total;fitScenes();refreshScript();setFrame(0);
const secs=(TL.total/FPS()).toFixed(1);
vStatus(`Voice-over ready (${voiceName}). Press Play to hear it. Download video includes it. Video length ${secs}s${TL.total !== before ? " (scenes adjusted to fit the voice)" : ""}.`);
ui.gen.textContent="↻ Regenerate voice";ui.wav.hidden=false;
TTS.busy=false;ui.gen.disabled=false;ui.rec.disabled=false;
}
async function saveVoiceWav(){
const rate=24000,len=Math.ceil(TL.total/FPS()*rate);
const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OAC||!hasClips())return;
const oc=new OAC(1,len,rate);
TL.scenes.forEach((s,i)=>{const c=liveClip(i);if(!c)return;const src=oc.createBufferSource();src.buffer=c.buffer;src.connect(oc.destination);src.start(s.start/FPS()+VOICE.leadIn);});
const out=await oc.startRendering(),d=out.getChannelData(0),b=new DataView(new ArrayBuffer(44+d.length*2));
const w=(o,s)=>{for(let i=0;i<s.length;i++)b.setUint8(o+i,s.charCodeAt(i));};
w(0,"RIFF");b.setUint32(4,36+d.length*2,true);w(8,"WAVE");w(12,"fmt ");b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);
b.setUint32(24,rate,true);b.setUint32(28,rate*2,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,"data");b.setUint32(40,d.length*2,true);
for(let i=0;i<d.length;i++)b.setInt16(44+i*2,clamp(d[i],-1,1)*32767,true);
download(new Blob([b],{type:"audio/wav"}),`${VIDEO.title}-voice.wav`);
}
const canvas=document.getElementById("stage");
const ctx=canvas.getContext("2d");
function el(id){return document.getElementById(id);}
const ui={play:el("play"),scrub:el("scrub"),time:el("time"),png:el("png"),rec:el("rec"),status:el("status"),check:el("check"),assets:el("assets"),
voice:el("voice"),gen:el("gen"),wav:el("wav"),vstatus:el("vstatus"),script:el("script"),lines:el("lines"),
style:el("style"),music:el("music"),length:el("length"),format:el("format"),subs:el("subs"),quality:el("quality"),subSize:el("subSize"),
voiceVol:el("voiceVol"),musicVol:el("musicVol"),logoOn:el("logoOn"),progOn:el("progOn"),srt:el("srt"),chk:el("chk"),
dsum:el("dsum"),dlist:el("dlist"),cAccent:el("cAccent"),cPrimary:el("cPrimary"),cSecondary:el("cSecondary"),kitSave:el("kitSave"),kitUse:el("kitUse"),kitCopy:el("kitCopy"),colReset:el("colReset")};
function showStatus(msg){ui.status.textContent=msg;}
const FORMATS={"16:9":[1920,1080,"16:9 wide"],"9:16":[1080,1920,"9:16 vertical"],"1:1":[1080,1080,"1:1 square"],"4:5":[1080,1350,"4:5 portrait"]};
const nearestFormat=()=>Object.keys(FORMATS).reduce((b,k)=>Math.abs(FORMATS[k][0]/FORMATS[k][1]-VIDEO.width/VIDEO.height)<Math.abs(FORMATS[b][0]/FORMATS[b][1]-VIDEO.width/VIDEO.height)?k:b,"16:9");
const SETTINGS={style:PRESETS[STYLE]?STYLE:(PRESET_ALIAS[STYLE]||"corporate"),music:MUSIC.mood||"auto",musicVol:MUSIC.volume??0.18,voiceVol:VOICE.volume??1,
length:+VIDEO.length||0,format:nearestFormat(),quality:Math.min(VIDEO.width,VIDEO.height)>=1000?"1080":"720",
subs:VOICE.captions===false?"off":"bottom",subSize:1,logo:true,progress:true};
const diff=(cur,base)=>Object.fromEntries(Object.entries(cur).filter(([k,v])=>base[k]!==v));
const OVR={brand:diff(BRAND,preset(SETTINGS.style).brand),look:diff(LOOK,preset(SETTINGS.style).look)};
let COLORS={};
const KIT_KEY="motionStudio.brandKit";
const readKit=()=>{try{return JSON.parse(localStorage.getItem(KIT_KEY)||"null");}catch(e){return null;}};
function fontsReady(){
try{const fams=[...new Set([BRAND.fontHeading,BRAND.fontBody])];
return Promise.race([Promise.all(fams.flatMap(f=>[400,500,600,700,800,900].map(wt=>document.fonts.load(`${wt} 40px "${f}"`)))),new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
}catch(e){return Promise.resolve();}
}
function applyStyle(name){
SETTINGS.style=PRESETS[name]?name:"corporate";const p=preset(SETTINGS.style);
Object.keys(BRAND).forEach(k=>delete BRAND[k]);Object.assign(BRAND,p.brand,OVR.brand,COLORS);
Object.keys(LOOK).forEach(k=>delete LOOK[k]);Object.assign(LOOK,p.look,OVR.look);
LIGHT_BG=lum(BRAND.bg)>0.5;Springs.style=Springs[LOOK.motion]||Springs.smooth;
syncColors();fitScenes();refreshScript();setFrame(Math.min(frame,TL.total-1));changed();
fontsReady().then(()=>setFrame(frame));
if(SETTINGS.music==="auto")ensureMusic().then(()=>playing&&startAudio(frame));
}
function applyDims(){
const[w,h]=FORMATS[SETTINGS.format],q=SETTINGS.quality==="720"?2/3:1;
VIDEO.width=Math.round(w*q/2)*2;VIDEO.height=Math.round(h*q/2)*2;
canvas.width=VIDEO.width;canvas.height=VIDEO.height;setFrame(frame);changed();
}
function syncColors(){[["accent",ui.cAccent],["primary",ui.cPrimary],["secondary",ui.cSecondary]].forEach(([k,inp])=>{if(inp&&isHex(BRAND[k]))inp.value=mix(BRAND[k],BRAND[k],0);});}
function changed(){delete ui.rec.dataset.ok;ui.rec.textContent="⬇ Download video";ui.check.textContent="";}
function opt(sel,value,label){const o=document.createElement("option");o.value=value;o.textContent=label;sel.appendChild(o);return o;}
function lengthLabel(){return`${(TL.total / FPS()).toFixed(1)}s`;}
function buildSettingsUI(){
STYLE_GROUPS.forEach(gname=>{const og=document.createElement("optgroup");og.label=gname;
Object.entries(PRESETS).filter(([,p])=>(p.group||"Calm and premium")===gname).forEach(([k,p])=>opt(og,k,p.label));if(og.children.length)ui.style.appendChild(og);});
if(!PRESETS[SETTINGS.style])SETTINGS.style=PRESET_ALIAS[SETTINGS.style]||"corporate";
ui.style.value=SETTINGS.style;
ui.style.onchange=()=>{applyStyle(ui.style.value);showStatus(`${preset(SETTINGS.style).label} style. Your text, voice and settings are kept.`);};
opt(ui.music,"auto","Auto (matches style)");Object.entries(MOODS).forEach(([k,m])=>opt(ui.music,k,m.label));opt(ui.music,"none","No music");
ui.music.value=MOODS[SETTINGS.music]||SETTINGS.music==="none"?SETTINGS.music:"auto";SETTINGS.music=ui.music.value;
ui.music.onchange=async()=>{SETTINGS.music=ui.music.value;changed();
if(SETTINGS.music==="none"){vStatus("No music.");if(playing)startAudio(frame);return;}
vStatus("Making the music…");await ensureMusic();
vStatus(SETTINGS.music==="upload"?"Using your music.":`Music: ${MOODS[moodOf()].label}. It dips under the voice and fades out at the end.`);if(playing)startAudio(frame);};
opt(ui.length,"0","As built");[10,20,30,45,60,90].forEach(s=>opt(ui.length,String(s),`${s} seconds`));
if(SETTINGS.length&&![10,20,30,45,60,90].includes(SETTINGS.length))opt(ui.length,String(SETTINGS.length),`${SETTINGS.length} seconds`);
ui.length.value=String(SETTINGS.length);
ui.length.onchange=()=>{SETTINGS.length=+ui.length.value;fitScenes();refreshScript();setFrame(0);changed();
const real=TL.total/FPS();
showStatus(SETTINGS.length&&real>SETTINGS.length+1?`The voice-over needs about ${real.toFixed(0)}s, so the video is ${real.toFixed(1)}s. Shorten some voice lines in Edit scenes, or pick a longer length.`
:`Video length ${lengthLabel()}. Scenes were re-timed to fit${SETTINGS.length >= 45 && SCENES.length < SETTINGS.length / 8 ? "; for a long video, ask the Gem for more scenes so nothing holds too long" : ""}.`);};
Object.entries(FORMATS).forEach(([k,f])=>opt(ui.format,k,f[2]));ui.format.value=SETTINGS.format;
ui.format.onchange=()=>{SETTINGS.format=ui.format.value;applyDims();showStatus(`${FORMATS[SETTINGS.format][2]}, ${VIDEO.width}x${VIDEO.height}. Scenes re-arrange themselves; scrub through to check.`);};
ui.quality.value=SETTINGS.quality;ui.quality.onchange=()=>{SETTINGS.quality=ui.quality.value;applyDims();};
opt(ui.subs,"bottom","On (bottom)");opt(ui.subs,"top","On (top)");opt(ui.subs,"off","Off");ui.subs.value=SETTINGS.subs;
ui.subs.onchange=()=>{SETTINGS.subs=ui.subs.value;setFrame(frame);changed();};
ui.subSize.onchange=()=>{SETTINGS.subSize=+ui.subSize.value;setFrame(frame);};
ui.voiceVol.value=SETTINGS.voiceVol;ui.musicVol.value=SETTINGS.musicVol;
ui.voiceVol.oninput=()=>{SETTINGS.voiceVol=+ui.voiceVol.value;if(playing)startAudio(frame);};
ui.musicVol.oninput=()=>{SETTINGS.musicVol=+ui.musicVol.value;if(playing)startAudio(frame);};
ui.logoOn.onchange=()=>{SETTINGS.logo=ui.logoOn.checked;setFrame(frame);changed();};
ui.progOn.onchange=()=>{SETTINGS.progress=ui.progOn.checked;setFrame(frame);};
[["accent",ui.cAccent],["primary",ui.cPrimary],["secondary",ui.cSecondary]].forEach(([k,inp])=>{inp.oninput=()=>{COLORS[k]=inp.value;applyStyle(SETTINGS.style);};});
ui.colReset.onclick=()=>{COLORS={};applyStyle(SETTINGS.style);showStatus("Colors back to the style's own.");};
ui.kitSave.onclick=()=>{const kit={accent:BRAND.accent,primary:BRAND.primary,secondary:BRAND.secondary,style:SETTINGS.style};
try{localStorage.setItem(KIT_KEY,JSON.stringify(kit));ui.kitUse.disabled=false;showStatus("Brand kit saved in this browser. Press Use my brand kit on any Motion Studio video. To use it everywhere, press Copy brand kit and paste it into the Gem chat.");}
catch(e){showStatus("This browser won't let the page save it. Press Copy brand kit and paste it into the Gem chat instead.");}};
ui.kitUse.disabled=!readKit();
ui.kitUse.onclick=()=>{const kit=readKit();if(!kit)return;COLORS={accent:kit.accent,primary:kit.primary,secondary:kit.secondary};
if(kit.style&&PRESETS[kit.style])ui.style.value=kit.style;applyStyle(kit.style||SETTINGS.style);showStatus("Your brand kit is on.");};
ui.kitCopy.onclick=async()=>{const t=`My brand kit for Motion Studio: style ${SETTINGS.style}, accent ${BRAND.accent}, primary ${BRAND.primary}, secondary ${BRAND.secondary}.`;
try{await navigator.clipboard.writeText(t);showStatus("Copied. Paste it into the Gem chat (or the Gem's brand kit file) and every new video starts with it.");}catch(e){showStatus(t);}};
syncColors();
}
let frame=0,playing=false,recording=false,lastT=0,acc=0;
function setFrame(n){
frame=((Math.floor(n)%TL.total)+TL.total)%TL.total;
const t0=performance.now();
renderFrame(ctx,frame);
const dt=performance.now()-t0;
if((playing||recording)&&!PERF.fast){
PERF.t.push(dt);if(PERF.t.length>30)PERF.t.shift();
if(PERF.t.length===30&&PERF.t.reduce((a,b)=>a+b,0)/30>24){PERF.fast=true;showStatus("This computer draws blur and shadows slowly, so I switched to a lighter look to keep the motion smooth.");}
}
ui.scrub.value=frame;
ui.time.textContent=`${(frame / FPS()).toFixed(2)}s / ${(TL.total / FPS()).toFixed(1)}s`;
}
function tick(t){
if(playing&&!recording){
acc+=(t-lastT)/1000;lastT=t;
const steps=Math.floor(acc*FPS());
if(steps>0){acc-=steps/FPS();const before=frame;setFrame(frame+steps);if(frame<before)startAudio(0);}
}else lastT=t;
requestAnimationFrame(tick);
}
ui.play.onclick=()=>{playing=!playing;lastT=performance.now();acc=0;ui.play.textContent=playing?"❚❚ Pause":"▶ Play";
if(playing)startAudio(frame);else stopAudio();};
ui.scrub.oninput=()=>{playing=false;stopAudio();ui.play.textContent="▶ Play";setFrame(+ui.scrub.value);};
document.addEventListener("keydown",e=>{if(e.code==="Space"&&e.target===document.body){e.preventDefault();ui.play.click();}});
function download(blob,name){
const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
ui.png.onclick=()=>{EXPORTING=true;renderFrame(ctx,frame);
canvas.toBlob(b=>b?download(b,`${VIDEO.title}-poster.png`):showStatus("PNG export failed"),"image/png");
EXPORTING=false;setFrame(frame);showStatus("Saved this frame as a poster image. Scrub to the best moment first, for a thumbnail.");};
ui.srt.onclick=()=>saveSrt();
ui.gen.onclick=()=>generateVoice();
ui.wav.onclick=()=>saveVoiceWav().catch(e=>vStatus(`Couldn't save the WAV (${e.message}).`,true));
function contrast(a,b){const L=h=>{const c=hexToRgb(h).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};
const x=L(a),y=L(b);return(Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
const SKIP_WORDS=new Set(["voice","hero","heroMotion","effect","traveller","swarm","motion","sync","rainbow","transitionIn","duration","ring","decimals","stagger","size","mode","charsPerSecond","highlightMax","color","icons","highlight","slot","frame"]);
function lettersIn(v){if(v==null)return 0;if(typeof v==="number")return String(v).length;if(typeof v==="string")return(v.match(/[\p{L}\p{N}]/gu)||[]).length;
if(Array.isArray(v))return v.reduce((a,x)=>a+lettersIn(x),0);if(typeof v==="object")return Object.values(v).reduce((a,x)=>a+lettersIn(x),0);return 0;}
function readSec(s){if(!s||!s.opts)return 0;const n=Object.entries(s.opts).reduce((a,[k,v])=>a+(SKIP_WORDS.has(k)?0:lettersIn(v)),0);return n?1.5+n/15:0;}
function wordsIn(v){if(v==null)return 0;if(typeof v==="number")return 1;if(typeof v==="string")return v.split(/\s+/).filter(Boolean).length;
if(Array.isArray(v))return v.reduce((a,x)=>a+wordsIn(x),0);if(typeof v==="object")return Object.values(v).reduce((a,x)=>a+wordsIn(x),0);return 0;}
function runCheck(){
const out=[],lines=TL.scenes.filter(s=>voiceLine(s)).length,secs=TL.total/FPS();
if(lines&&!hasClips()&&!AUDIO.buffers["voice-over"])out.push("The voice-over isn't made yet. Press Generate voice-over (or Add voice-over) to include it.");
if(isHex(BRAND.text)&&isHex(BRAND.bg)){const cr=contrast(BRAND.text,BRAND.bg);if(cr<4.5)out.push(`Text is hard to read on this background (contrast ${cr.toFixed(1)}:1, aim for 4.5). Pick other brand colors or another style.`);}
if(SETTINGS.length&&secs>SETTINGS.length+1)out.push(`You picked ${SETTINGS.length}s but the voice-over needs ${secs.toFixed(0)}s. Shorten some voice lines in Edit scenes, or pick a longer length.`);
TL.scenes.forEach(s=>{if(!s.opts)return;const n=Object.entries(s.opts).reduce((a,[k,v])=>a+(SKIP_WORDS.has(k)?0:wordsIn(v)),0),need=readSec(s);
if(n>3&&s.duration/FPS()<need)out.push(`Scene ${s.index + 1} (${s.name}) shows ${n} words for ${(s.duration / FPS()).toFixed(1)}s; people need about ${need.toFixed(0)}s to read it.`);});
if(lines&&SETTINGS.subs==="off")out.push("Subtitles are off. Most people watch at work without sound, so subtitles usually help.");
const usesLogo=SCENES.some(s=>String(s.draw).includes('"logo"'))||DIRECTOR.beats.some(b=>b.logo);
if(usesLogo&&SETTINGS.logo&&!ASSETS.logo)out.push("No logo added, so the logo spot will be empty. Press Add logo, or untick Logo under More settings.");
if(SETTINGS.length>=45&&SCENES.length<SETTINGS.length/8)out.push(`Only ${SCENES.length} scenes for ${SETTINGS.length}s, so each one holds a long time. Ask the Gem for more scenes.`);
return out;
}
ui.chk.onclick=()=>{const r=runCheck();ui.check.textContent=r.length?"Before you download:\n• "+r.join("\n• "):"All good: voice, timing, contrast and subtitles look ready.";};
function pickMime(withAudio){
const av=["video/mp4;codecs=avc1.640028,mp4a.40.2","video/mp4;codecs=avc1,mp4a.40.2","video/mp4;codecs=avc1,opus","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus"];
if(withAudio){const m=av.find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m));if(m)return m;}
const list=["video/mp4;codecs=avc1.640028","video/mp4;codecs=avc1.4d002a","video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
return list.find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||"";
}
const LOCK=()=>[ui.rec,ui.play,ui.png,ui.scrub,ui.gen,ui.style,ui.music,ui.length,ui.format,ui.subs,ui.quality,ui.srt];
ui.rec.onclick=async()=>{
if(recording||TTS.busy)return;
if(!ui.rec.dataset.ok){const r=runCheck();ui.rec.dataset.ok="1";
if(r.length){ui.check.textContent="Before you download:\n• "+r.join("\n• ")+"\nFix what you want, or press Download anyway.";ui.rec.textContent="⬇ Download anyway";return;}}
if(!canvas.captureStream||!window.MediaRecorder){showStatus("This browser can't record video. Try Chrome or Edge, or use Save poster.");return;}
ui.check.textContent="";await ensureMusic();
const withAudio=hasAudio()&&!!audioCtx();
const mime=pickMime(withAudio);const ext=mime.includes("mp4")?"mp4":"webm";
const stream=canvas.captureStream(FPS());
let audioDest=null;
if(withAudio){audioDest=AUDIO.ctx.createMediaStreamDestination();audioDest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));}
const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:SETTINGS.quality==="720"?6_000_000:12_000_000}:undefined);
const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
const done=new Promise(r=>(rec.onstop=r));
recording=true;EXPORTING=true;playing=false;ui.play.textContent="▶ Play";
LOCK().forEach(b=>(b.disabled=true));
stopAudio();setFrame(0);rec.start(250);
if(withAudio)startAudio(0,audioDest);
const t0=performance.now();
await new Promise(resolve=>{
const step=()=>{
const f=Math.floor((performance.now()-t0)/1000*FPS());
if(f>=TL.total)return resolve();
if(f!==frame)setFrame(f);
showStatus(`Recording ${ext.toUpperCase()}${withAudio ? " with sound" : ""}… ${Math.round(f / TL.total * 100)}% (keep this tab visible)`);
requestAnimationFrame(step);
};
requestAnimationFrame(step);
});
setFrame(TL.total-1);
await new Promise(r=>setTimeout(r,300));
rec.stop();await done;stopAudio();stream.getTracks().forEach(t=>t.stop());
download(new Blob(chunks,{type:mime||"video/webm"}),`${VIDEO.title}.${ext}`);
recording=false;EXPORTING=false;LOCK().forEach(b=>(b.disabled=false));changed();
showStatus(`Saved ${VIDEO.title}.${ext} (${(TL.total / FPS()).toFixed(1)}s, ${VIDEO.width}x${VIDEO.height}${withAudio ? ", with sound" : ", silent"}). Save subtitles (SRT) and a poster are under More settings.`);
setFrame(0);
};
function buildAssetButtons(){
ASSET_SLOTS.forEach(name=>{
const label=document.createElement("label");label.className="btn";label.textContent=`Add ${name}`;
const input=document.createElement("input");input.type="file";input.accept="image/*";
input.onchange=()=>{const file=input.files[0];if(!file)return;
const img=new Image();img.onload=()=>{ASSETS[name]=img;label.firstChild.textContent=`✓ ${name}`;setFrame(frame);changed();};
img.src=URL.createObjectURL(file);};
label.appendChild(input);ui.assets.appendChild(label);
});
}
const UPLOAD_LABELS={};
function resetUploadLabel(name){if(UPLOAD_LABELS[name])UPLOAD_LABELS[name].firstChild.textContent=`Add ${name}`;}
function buildAudioButtons(){
AUDIO_SLOTS.forEach(a=>{
const label=document.createElement("label");label.className="btn";label.appendChild(document.createTextNode(`Add ${a.name}`));
const input=document.createElement("input");input.type="file";input.accept="audio/*";
input.onchange=async()=>{const file=input.files[0];if(!file)return;
const ac=audioCtx();if(!ac){showStatus("This browser can't play added sound.");return;}
try{
AUDIO.buffers[a.name]=await ac.decodeAudioData(await file.arrayBuffer());
if(a.name==="voice-over"){AUDIO.clips={};ui.gen.textContent="🎙 Generate voice-over";ui.wav.hidden=true;vStatus("Using your recorded voice-over instead of a generated one.");}
if(a.name==="music"){if(![...ui.music.options].some(o=>o.value==="upload"))opt(ui.music,"upload","Your music");ui.music.value="upload";SETTINGS.music="upload";}
const secs=AUDIO.buffers[a.name].duration,video=TL.total/FPS();
label.firstChild.textContent=`✓ ${a.name} ${secs.toFixed(1)}s`;changed();
showStatus(a.name==="voice-over"&&(a.start||0)+secs>video+0.1
?`Your voice-over is ${secs.toFixed(1)}s but the video is ${video.toFixed(1)}s: pick a longer Length, or the end gets cut.`
:`${a.name} added (${secs.toFixed(1)}s). Press Play to hear it with the video.`);
if(playing)startAudio(frame);
}catch(e){showStatus(`Couldn't read that sound file (${e.message}). Try mp3, m4a or wav.`);}
};
label.appendChild(input);ui.assets.appendChild(label);UPLOAD_LABELS[a.name]=label;
});
}
function buildVoiceUI(){
VOICES.forEach(([n,d])=>opt(ui.voice,n,`${n} · ${d}`));
ui.voice.value=VOICES.some(v=>v[0]===VOICE.voice)?VOICE.voice:"Puck";
ui.voice.onchange=()=>{if(hasClips())vStatus(`Press Regenerate voice to hear ${ui.voice.value}.`);};
refreshScript();
}
const FIELD_LABELS={title:"Title",subtitle:"Subtitle",eyebrow:"Small label",kicker:"Small label",words:"Headline",line:"Text",label:"Label",value:"Number",
prefix:"Before the number",suffix:"After the number",unit:"Unit",items:"Items (one per line)",steps:"Steps (one per line)",data:"Chart (label | number per line)",
milestones:"Milestones (when | what per line)",quote:"Quote",author:"Author",name:"Name",role:"Role",caption:"Caption",sub:"Small line",cta:"Button",
number:"Number",hero:"Main picture (emoji)",traveller:"Moving picture (emoji)",from:"Start (emoji, label)",to:"End (emoji, label)",stops:"Stops (emoji | label per line)",swarm:"Swarm picture (emoji)",before:"Before (title | lines)",after:"After (title | lines)",highlight:"Highlight words (one per line)",props:"Small pictures (emoji | label per line)",by:"Who said it"};
const NO_EDIT=new Set(["voice","heroMotion","effect","sync","motion","rainbow","transitionIn","duration","ring","decimals","stagger","size","mode","charsPerSecond","highlightMax","color","icons","slot","frame"]);
const toNum=x=>/^-?\d+(\.\d+)?$/.test(x)?+x:x;
function editorFor(v){
if(typeof v==="string")return{kind:"input",val:v,parse:x=>x};
if(typeof v==="number")return{kind:"number",val:String(v),parse:x=>+x||0};
if(Array.isArray(v)&&v.every(x=>typeof x==="string"||typeof x==="number"))return{kind:"area",val:v.join("\n"),parse:x=>x.split("\n").map(s=>s.trim()).filter(Boolean).map(toNum)};
if(Array.isArray(v)&&v.every(Array.isArray))return{kind:"area",val:v.map(r=>r.join(" | ")).join("\n"),parse:x=>x.split("\n").map(s=>s.trim()).filter(Boolean).map(r=>r.split("|").map(c=>toNum(c.trim())))};
if(v&&typeof v==="object"&&"title"in v&&Array.isArray(v.lines))return{kind:"input",val:[v.title,...v.lines].join(" | "),parse:x=>{const p=x.split("|").map(c=>c.trim());return{title:p[0]||"",lines:p.slice(1)};}};
return null;
}
function rebuildScene(i,opts){
const old=SCENES[i],ns=old.rebuild(opts);
Object.assign(ns,{voice:old.voice,_base:old._base,drift:old.drift});
SCENES[i]=ns;fitScenes();refreshScript();setFrame(Math.min(Math.max(frame,TL.scenes[i].start+30),TL.total-1));changed();
showStatus(`Scene ${i + 1} updated. Press Play to see it.`);
}
function refreshScript(){
ui.lines.innerHTML="";
TL.scenes.forEach((s,i)=>{
const box=document.createElement("div");box.className="ln scene";
const head=document.createElement("b");head.textContent=`${i + 1}. ${s.name} · starts ${(s.start / FPS()).toFixed(1)}s · ${(s.duration / FPS()).toFixed(1)}s`;
head.style.cursor="pointer";head.onclick=()=>{playing=false;stopAudio();ui.play.textContent="▶ Play";setFrame(s.start+Math.min(45,s.duration-1));};
box.appendChild(head);
const field=(labelText,node)=>{const r=document.createElement("div");r.className="fld";const l=document.createElement("span");l.textContent=labelText;r.appendChild(l);r.appendChild(node);box.appendChild(r);};
const src=SCENES[i];
if(src.opts&&src.rebuild)Object.entries(src.opts).forEach(([k,v])=>{
if(NO_EDIT.has(k))return;const ed=editorFor(v);if(!ed)return;
const node=document.createElement(ed.kind==="area"?"textarea":"input");
if(ed.kind!=="area")node.type=ed.kind==="number"?"number":"text";
node.value=ed.val;node.onchange=()=>rebuildScene(i,{...SCENES[i].opts,[k]:ed.parse(node.value)});
field(FIELD_LABELS[k]||k,node);
});
const ta=document.createElement("textarea");ta.value=src.voice||"";ta.placeholder="No voice for this scene";
ta.onchange=()=>{SCENES[i].voice=ta.value;fitScenes();refreshScript();setFrame(Math.min(frame,TL.total-1));changed();
vStatus("Voice line changed. Press Generate voice-over to hear it.");};
field("Voice",ta);
ui.lines.appendChild(box);
});
}
async function boot(){
canvas.width=VIDEO.width;canvas.height=VIDEO.height;
buildSettingsUI();
fitScenes();
buildAssetButtons();
buildAudioButtons();
buildVoiceUI();
await fontsReady();
setFrame(0);
if(DIRECTOR.film){const n=DIRECTOR.fixes.length;ui.dsum.textContent=n?`Director check: ${n} fix${n > 1 ? "es" : ""} made to the plan`:"Director check: the plan looks good";
ui.dlist.textContent=(n?"• "+DIRECTOR.fixes.join("\n• ")+"\n":"")+"Always on: one continuous world, the camera travels between beats, nothing teleports, every element enters the same calm way and lands on the spoken word, and nothing exits before the camera moves on.";}
else ui.dsum.parentNode.hidden=true;
const lines=TL.scenes.filter(s=>voiceLine(s)).length;
showStatus(`${preset(SETTINGS.style).label} · ${SCENES.length} scenes · ${lengthLabel()} · ${VIDEO.width}x${VIDEO.height}. Change style, music, length or format below, then Download video.`);
vStatus(lines?`${lines} voice lines ready. Pick a voice and press Generate voice-over, then Play.`:"No voice-over in this video. Type lines under Edit scenes, then press Generate voice-over.");
ensureMusic();
requestAnimationFrame(t=>{lastT=t;tick(t);});
}
boot();
