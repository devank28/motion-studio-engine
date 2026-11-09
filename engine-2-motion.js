/* Motion Studio engine v2.1, part 2 of 3. Loaded by the Gem's Canvas page. */
/* =====================================================================
   4) ENGINE: MOTION TOOLKIT (Remotion-style). Do not edit.
   ===================================================================== */
const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
const lerp=(a,b,t)=>a+(b-a)*t;
function bezier(x1,y1,x2,y2){
const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx;
const cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
const sx=t=>((ax*t+bx)*t+cx)*t;
const sy=t=>((ay*t+by)*t+cy)*t;
const dsx=t=>(3*ax*t+2*bx)*t+cx;
return x=>{
if(x<=0)return 0;if(x>=1)return 1;
let t=x;
for(let i=0;i<8;i++){const d=dsx(t);if(Math.abs(d)<1e-6)break;t-=(sx(t)-x)/d;}
t=clamp(t);
if(Math.abs(sx(t)-x)>1e-4){let lo=0,hi=1;t=x;
for(let i=0;i<30;i++){if(sx(t)<x)lo=t;else hi=t;t=(lo+hi)/2;}}
return sy(t);
};
}
const Easing={
linear:t=>t,
in:bezier(0.42,0,1,1),
out:bezier(0,0,0.58,1),
inOut:bezier(0.42,0,0.58,1),
outExpo:bezier(0.16,1,0.3,1),
outQuart:bezier(0.25,1,0.5,1),
inExpo:bezier(0.7,0,0.84,0),
inOutExpo:bezier(0.87,0,0.13,1),
inOutQuart:bezier(0.76,0,0.24,1),
outBack:bezier(0.34,1.56,0.64,1),
bezier,
};
function interpolate(value,input,output,opts={}){
const{easing=Easing.linear,extrapolateLeft="clamp",extrapolateRight="clamp"}=opts;
if(input.length!==output.length||input.length<2)throw new Error("interpolate: ranges must match and have 2+ points");
let i=1;
while(i<input.length-1&&value>input[i])i++;
const i0=input[i-1],i1=input[i],o0=output[i-1],o1=output[i];
let t=i1===i0?1:(value-i0)/(i1-i0);
if(t<0&&extrapolateLeft==="clamp")t=0;
if(t>1&&extrapolateRight==="clamp")t=1;
if(t<0&&extrapolateLeft==="identity")return value;
if(t>1&&extrapolateRight==="identity")return value;
const e=(t>=0&&t<=1)?easing(t):t;
return o0+(o1-o0)*e;
}
function hexToRgb(hex){
let h=String(hex).replace("#","");
if(h.length===3)h=h.split("").map(c=>c+c).join("");
const n=parseInt(h.slice(0,6),16);
return[(n>>16)&255,(n>>8)&255,n&255];
}
const rgba=(hex,a=1)=>{const[r,g,b]=hexToRgb(hex);return`rgba(${r},${g},${b},${clamp(a)})`;};
function interpolateColors(value,input,colors,opts={}){
const rgbs=colors.map(hexToRgb);
const ch=k=>Math.round(interpolate(value,input,rgbs.map(c=>c[k]),opts));
return`rgb(${ch(0)},${ch(1)},${ch(2)})`;
}
function spring({frame,fps=VIDEO.fps,from=0,to=1,delay=0,config={}}){
const{damping=10,mass=1,stiffness=100,overshootClamping=false}=config;
const t=Math.max(0,frame-delay)/fps;
const w0=Math.sqrt(stiffness/mass);
const zeta=damping/(2*Math.sqrt(stiffness*mass));
let x;
if(zeta<1){
const wd=w0*Math.sqrt(1-zeta*zeta);
x=Math.exp(-zeta*w0*t)*(-Math.cos(wd*t)-(zeta*w0/wd)*Math.sin(wd*t));
}else{
x=(-1-w0*t)*Math.exp(-w0*t);
}
let p=1+x;
if(overshootClamping)p=Math.min(p,1);
return from+(to-from)*p;
}
const Springs={
smooth:{damping:200},
snappy:{damping:20,stiffness:200},
bouncy:{damping:8},
heavy:{damping:15,stiffness:80,mass:2},
};
Springs.style=Springs[LOOK.motion]||Springs.smooth;
function random(seed){
let h=2166136261;
const s=String(seed);
for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
h+=0x6D2B79F5;let t=h;
t=Math.imul(t^(t>>>15),t|1);
t^=t+Math.imul(t^(t>>>7),t|61);
return((t^(t>>>14))>>>0)/4294967296;
}
const seq=(f,from,dur,easing=Easing.outExpo)=>interpolate(f,[from,from+dur],[0,1],{easing});
const envelope=(f,inStart,inDur,outStart,outDur)=>
interpolate(f,[inStart,inStart+inDur,outStart,outStart+outDur],[0,1,1,0]);
const W=()=>VIDEO.width,H=()=>VIDEO.height;
const S=n=>n*Math.min(VIDEO.width,VIDEO.height)/1080;
const isTall=()=>VIDEO.height>VIDEO.width;
const PERF={fast:false,t:[]};
const hw=family=>family===BRAND.fontHeading?(LOOK.headingWeight||700):500;
function setBlur(ctx,px){if(!PERF.fast&&px>0.4&&"filter"in ctx)ctx.filter=`blur(${px.toFixed(1)}px)`;}
const zoomAt=(ctx,s,cx=W()/2,cy=H()/2)=>{ctx.translate(cx,cy);ctx.scale(s,s);ctx.translate(-cx,-cy);};
function layer(ctx,{x=0,y=0,scale=1,rotate=0,opacity=1,blur=0,anchorX=0,anchorY=0}={},fn){
if(opacity<=0)return;
ctx.save();
ctx.globalAlpha*=clamp(opacity);
setBlur(ctx,blur);
ctx.translate(x,y);
if(rotate)ctx.rotate(rotate*Math.PI/180);
if(scale!==1)ctx.scale(scale,scale);
ctx.translate(-anchorX,-anchorY);
fn(ctx);
ctx.restore();
}
function withShadow(ctx,{color="rgba(0,0,0,0.35)",blur=S(30),x=0,y=S(14)}={},fn){
ctx.save();
if(!PERF.fast){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetX=x;ctx.shadowOffsetY=y;}
fn(ctx);ctx.restore();
}
function withGlow(ctx,color,amount,fn){
if(!amount||amount<=0)return fn(ctx);
withShadow(ctx,{color,blur:S(26)*amount,x:0,y:0},fn);
}
function font(size,weight,family=BRAND.fontHeading){return`${weight ?? hw(family)} ${size}px "${family}", system-ui, sans-serif`;}
function text(ctx,str,x,y,{size=S(64),weight,family=BRAND.fontHeading,color=BRAND.text,align="center",baseline="middle",letterSpacing=0,maxWidth,upper=false,depth}={}){
const s=upper?String(str).toUpperCase():String(str);
ctx.font=font(size,weight,family);
ctx.textAlign=align;ctx.textBaseline=baseline;
if("letterSpacing"in ctx)ctx.letterSpacing=`${letterSpacing}px`;
const dz=depth??(LOOK.extrude&&family===BRAND.fontHeading&&size>=S(54)?LOOK.extrude:0);
if(dz>0&&!PERF.fast){
const n=Math.max(3,Math.min(14,Math.round(size*dz/S(1.8)))),step=size*dz/n;
ctx.save();ctx.shadowColor="transparent";ctx.fillStyle=shadeOf(color);
for(let k=n;k>=1;k--){if(maxWidth)ctx.fillText(s,x+k*step*0.55,y+k*step,maxWidth);else ctx.fillText(s,x+k*step*0.55,y+k*step);}
ctx.restore();
}
if(LOOK.misregister&&family===BRAND.fontHeading&&size>=S(40)){
const o=S(4)*LOOK.misregister;ctx.save();ctx.globalCompositeOperation=LIGHT_BG?"multiply":"screen";ctx.fillStyle=rgba(BRAND.secondary,0.8);
if(maxWidth)ctx.fillText(s,x+o,y+o*0.7,maxWidth);else ctx.fillText(s,x+o,y+o*0.7);ctx.restore();}
ctx.fillStyle=color;
if(maxWidth)ctx.fillText(s,x,y,maxWidth);else ctx.fillText(s,x,y);
if("letterSpacing"in ctx)ctx.letterSpacing="0px";
}
function measure(ctx,str,size,weight,family=BRAND.fontHeading){ctx.font=font(size,weight,family);return ctx.measureText(String(str)).width;}
function fitSize(ctx,str,maxWidth,size,weight,family=BRAND.fontHeading){const w=measure(ctx,str,size,weight,family);return w>maxWidth?size*maxWidth/w:size;}
function wrapLines(ctx,str,maxWidth,size,weight,family=BRAND.fontHeading){
ctx.font=font(size,weight,family);
const words=String(str).split(/\s+/).filter(Boolean);const lines=[];let line="";
for(const w of words){const test=line?line+" "+w:w;
if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w;}else line=test;}
if(line)lines.push(line);
return lines;
}
function roundRect(ctx,x,y,w,h,r,fill,stroke,lineWidth=2){
r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));
ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
if(fill){ctx.fillStyle=fill;ctx.fill();}
if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
}
function circle(ctx,x,y,r,fill,stroke,lineWidth=2){
ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);
if(fill){ctx.fillStyle=fill;ctx.fill();}
if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
}
function drawPath(ctx,points,progress,{color=BRAND.primary,width=S(6),cap="round"}={}){
if(points.length<2||progress<=0)return points[0];
const segs=[];let total=0;
for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);segs.push(d);total+=d;}
let remain=total*clamp(progress),tip=points[0];
ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
for(let i=1;i<points.length&&remain>0;i++){
const d=segs[i-1]||1e-6,t=Math.min(1,remain/d);
tip=[lerp(points[i-1][0],points[i][0],t),lerp(points[i-1][1],points[i][1],t)];
ctx.lineTo(tip[0],tip[1]);remain-=d;
}
ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap=cap;ctx.lineJoin="round";ctx.stroke();
return tip;
}
function fillBg(ctx,color=BRAND.bg){ctx.fillStyle=color;ctx.fillRect(0,0,W(),H());}
function gradientBg(ctx,c1,c2,angleDeg=135){
const a=angleDeg*Math.PI/180,cx=W()/2,cy=H()/2,r=Math.hypot(W(),H())/2;
const g=ctx.createLinearGradient(cx-Math.cos(a)*r,cy-Math.sin(a)*r,cx+Math.cos(a)*r,cy+Math.sin(a)*r);
g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,W(),H());
}
const lum=hex=>{const[r,g,b]=hexToRgb(hex);return(0.2126*r+0.7152*g+0.0722*b)/255;};
let LIGHT_BG=lum(BRAND.bg)>0.5;
function blob(ctx,x,y,r,color,alpha){
const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));
g.addColorStop(0,rgba(color,alpha));g.addColorStop(1,rgba(color,0));
ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function softLight(ctx,x,y,r,color,alpha){
if(LIGHT_BG&&lum(color)<0.35){color=BRAND.accent;alpha*=0.5;}
blob(ctx,x,y,r,color,alpha);
}
function mix(a,b,t){const x=hexToRgb(a),y=hexToRgb(b);return"#"+x.map((v,i)=>Math.round(lerp(v,y[i],t)).toString(16).padStart(2,"0")).join("");}
const isHex=c=>/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c));
function shadeOf(color){const sh=BRAND.shade||mix(BRAND.bg,"#000000",0.3);return isHex(color)?mix(color,sh,0.72):sh;}
function vGrad(ctx,y0,y1,c0,c1){const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;}
function hGrad(ctx,x0,x1,c0,c1){const g=ctx.createLinearGradient(x0,0,x1,0);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;}
function card(ctx,x,y,w,h,{r=S(LOOK.radius),style=LOOK.cards,accent=null,fill=null}={}){
if(style==="glass"){
withShadow(ctx,{color:"rgba(0,0,0,0.32)",blur:S(40),y:S(18)},c=>roundRect(c,x,y,w,h,r,fill||rgba(BRAND.surface,0.62)));
roundRect(ctx,x,y,w,h,r,vGrad(ctx,y,y+h,"rgba(255,255,255,0.13)","rgba(255,255,255,0.02)"),"rgba(255,255,255,0.16)",S(1.5));
}else if(style==="neon"){
roundRect(ctx,x,y,w,h,r,fill||rgba(BRAND.surface,0.72));
withGlow(ctx,accent||BRAND.primary,0.9,c=>roundRect(c,x,y,w,h,r,null,rgba(accent||BRAND.primary,0.9),S(2.5)));
}else if(style==="paper"){
withShadow(ctx,{color:"rgba(60,40,10,0.14)",blur:S(26),y:S(10)},c=>roundRect(c,x,y,w,h,r,fill||BRAND.surface));
roundRect(ctx,x,y,w,h,r,null,rgba(BRAND.text,0.1),S(1.5));
}else if(style==="pop"){
roundRect(ctx,x+S(9),y+S(11),w,h,r,rgba(BRAND.text,0.92));
roundRect(ctx,x,y,w,h,r,fill||BRAND.surface,BRAND.text,S(4));
}else if(style==="bold"){
roundRect(ctx,x,y,w,h,r,fill||BRAND.surface);
}else if(style==="block"){
const d=S(16),side=BRAND.shade||mix(BRAND.surface,"#000000",0.45);
withShadow(ctx,{color:"rgba(0,0,0,0.45)",blur:S(40),y:S(24)},c=>roundRect(c,x+d,y+d,w,h,r,side));
for(let k=d-S(2);k>0;k-=S(2.5))roundRect(ctx,x+k,y+k,w,h,r,side);
roundRect(ctx,x,y,w,h,r,fill||vGrad(ctx,y,y+h,mix(BRAND.surface,"#FFFFFF",0.1),BRAND.surface),"rgba(255,255,255,0.16)",S(1.5));
}else if(style==="frost"){
withShadow(ctx,{color:"rgba(40,50,90,0.14)",blur:S(44),y:S(18)},c=>roundRect(c,x,y,w,h,r,fill||"rgba(255,255,255,0.6)"));
roundRect(ctx,x,y,w,h,r,vGrad(ctx,y,y+h,"rgba(255,255,255,0.55)","rgba(255,255,255,0.12)"),"rgba(255,255,255,0.95)",S(2));
}else if(style==="sketch"){
roundRect(ctx,x,y,w,h,r,fill||(LIGHT_BG?BRAND.surface:rgba(BRAND.text,0.06)));
sketchRect(ctx,x,y,w,h,LIGHT_BG?BRAND.text:rgba(BRAND.text,0.85),S(3));
}else if(style==="comic"){
roundRect(ctx,x+S(10),y+S(10),w,h,r,"#111111");
roundRect(ctx,x,y,w,h,r,fill||BRAND.surface,"#111111",S(5));
}else if(style==="papercut"){
withShadow(ctx,{color:"rgba(70,35,10,0.28)",blur:S(22),y:S(10)},c=>roundRect(c,x+S(8),y+S(10),w,h,r,mix(BRAND.surface,BRAND.primary,0.35)));
withShadow(ctx,{color:"rgba(70,35,10,0.22)",blur:S(16),y:S(6)},c=>roundRect(c,x,y,w,h,r,fill||BRAND.surface));
}else if(style==="flat"){
ctx.fillStyle=fill||BRAND.surface;ctx.fillRect(x,y,w,h);ctx.fillStyle=BRAND.text;ctx.fillRect(x,y,w,S(5));
}else if(style==="pixel"){
const P=Math.max(3,Math.round(S(8)));
const notch=(dx,dy,ww,hh)=>{ctx.beginPath();ctx.moveTo(dx+P,dy);ctx.lineTo(dx+ww-P,dy);ctx.lineTo(dx+ww-P,dy+P);ctx.lineTo(dx+ww,dy+P);ctx.lineTo(dx+ww,dy+hh-P);ctx.lineTo(dx+ww-P,dy+hh-P);ctx.lineTo(dx+ww-P,dy+hh);ctx.lineTo(dx+P,dy+hh);ctx.lineTo(dx+P,dy+hh-P);ctx.lineTo(dx,dy+hh-P);ctx.lineTo(dx,dy+P);ctx.lineTo(dx+P,dy+P);ctx.closePath();};
notch(x+P,y+P,w,h);ctx.fillStyle="rgba(0,0,0,0.45)";ctx.fill();
notch(x,y,w,h);ctx.fillStyle=fill||BRAND.surface;ctx.fill();ctx.lineWidth=P*0.75;ctx.strokeStyle=accent||BRAND.primary;ctx.stroke();
ctx.fillStyle=rgba("#FFFFFF",0.12);ctx.fillRect(x+P,y+P,w-P*2,P);
}else if(style==="hud"){
roundRect(ctx,x,y,w,h,r,fill||rgba(BRAND.surface,0.55),rgba(BRAND.primary,0.35),S(1.5));
const k=Math.min(S(26),w/4,h/4);ctx.save();ctx.strokeStyle=accent||BRAND.primary;ctx.lineWidth=S(3);
[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([cx,cy,sx,sy])=>{ctx.beginPath();ctx.moveTo(cx,cy+sy*k);ctx.lineTo(cx,cy);ctx.lineTo(cx+sx*k,cy);ctx.stroke();});
ctx.restore();
}else if(style==="chrome"){
withShadow(ctx,{color:"rgba(0,0,0,0.55)",blur:S(40),y:S(20)},c=>roundRect(c,x,y,w,h,r,fill||vGrad(c,y,y+h,"#1E2126","#101215")));
roundRect(ctx,x,y,w,h,r,null,vGrad(ctx,y,y+h,"rgba(255,255,255,0.55)","rgba(255,255,255,0.08)"),S(2));
}else if(style==="clay"){
withShadow(ctx,{color:"rgba(90,70,50,0.22)",blur:S(30),y:S(14)},c=>roundRect(c,x,y,w,h,r,fill||BRAND.surface));
roundRect(ctx,x,y,w,h,r,vGrad(ctx,y,y+h,"rgba(255,255,255,0.7)","rgba(0,0,0,0.04)"),"rgba(255,255,255,0.9)",S(2));
}else if(style==="longshadow"){
const L=Math.max(w,h)*0.6;ctx.save();ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w+L,y+L);ctx.lineTo(x+L,y+h+L);ctx.lineTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.closePath();
ctx.fillStyle=hGrad(ctx,x,x+w+L,"rgba(0,0,0,0.22)","rgba(0,0,0,0)");ctx.fill();ctx.restore();
roundRect(ctx,x,y,w,h,r,fill||BRAND.surface);
}else if(style==="riso"){
roundRect(ctx,x+S(6),y+S(6),w,h,r,rgba(BRAND.secondary,0.55));
roundRect(ctx,x,y,w,h,r,fill||rgba(BRAND.surface,0.92),rgba(BRAND.primary,0.85),S(3));
}else if(style==="deco"){
roundRect(ctx,x,y,w,h,0,fill||rgba(BRAND.surface,0.92),rgba(BRAND.primary,0.85),S(2.5));
ctx.strokeStyle=rgba(BRAND.primary,0.5);ctx.lineWidth=S(1);ctx.strokeRect(x+S(8),y+S(8),w-S(16),h-S(16));
const k=S(14);ctx.fillStyle=BRAND.primary;[[x,y],[x+w-k,y],[x,y+h-k],[x+w-k,y+h-k]].forEach(([cx,cy])=>ctx.fillRect(cx,cy,k,k));
}else if(style==="line"){
roundRect(ctx,x,y,w,h,r,fill||rgba(BRAND.surface,0.55),rgba(BRAND.text,0.16),S(1.5));
}else{
withShadow(ctx,{},c=>roundRect(c,x,y,w,h,r,fill||BRAND.surface));
}
if(accent&&style!=="neon"){ctx.save();roundRect(ctx,x,y,w,h,r);ctx.clip();ctx.fillStyle=accent;ctx.fillRect(x,y,S(8),h);ctx.restore();}
}
function shine(ctx,x,y,w,h,p,{r=S(LOOK.radius),alpha=0.32}={}){
if(p<=0||p>=1)return;
ctx.save();roundRect(ctx,x,y,w,h,r);ctx.clip();
const bx=lerp(x-w*0.6,x+w*1.6,p),g=ctx.createLinearGradient(bx-w*0.3,y,bx+w*0.3,y+h);
g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(0.5,`rgba(255,255,255,${alpha})`);g.addColorStop(1,"rgba(255,255,255,0)");
ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.restore();
}
const ICONS={
check:c=>{c.moveTo(5,12.5);c.lineTo(10,17.5);c.lineTo(19,7);},
arrow:c=>{c.moveTo(4,12);c.lineTo(19,12);c.moveTo(13,6);c.lineTo(19,12);c.lineTo(13,18);},
bolt:c=>{c.moveTo(13,2.5);c.lineTo(4.5,13.5);c.lineTo(11,13.5);c.lineTo(10,21.5);c.lineTo(19.5,9.5);c.lineTo(13,9.5);c.closePath();},
shield:c=>{c.moveTo(12,2.5);c.lineTo(20,5.5);c.lineTo(20,11.5);c.bezierCurveTo(20,16.5,16.5,20,12,21.5);c.bezierCurveTo(7.5,20,4,16.5,4,11.5);c.lineTo(4,5.5);c.closePath();},
clock:c=>{c.arc(12,12,9,0,Math.PI*2);c.moveTo(12,7);c.lineTo(12,12);c.lineTo(15.5,14);},
star:c=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?4.2:9.5;c[i?"lineTo":"moveTo"](12+Math.cos(a)*r,12.5+Math.sin(a)*r);}c.closePath();},
chart:c=>{c.moveTo(4,20);c.lineTo(20,20);c.moveTo(7,16.5);c.lineTo(7,12);c.moveTo(12,16.5);c.lineTo(12,6.5);c.moveTo(17,16.5);c.lineTo(17,9.5);},
user:c=>{c.arc(12,8,4,0,Math.PI*2);c.moveTo(4.5,20.5);c.bezierCurveTo(4.5,15,19.5,15,19.5,20.5);},
lock:c=>{c.rect(5,11,14,10);c.moveTo(8,11);c.lineTo(8,7.5);c.arc(12,7.5,4,Math.PI,0);c.lineTo(16,11);},
spark:c=>{c.moveTo(12,2.5);c.quadraticCurveTo(13,11,21.5,12);c.quadraticCurveTo(13,13,12,21.5);c.quadraticCurveTo(11,13,2.5,12);c.quadraticCurveTo(11,11,12,2.5);c.closePath();},
chat:c=>{c.moveTo(5,5);c.lineTo(19,5);c.lineTo(19,15);c.lineTo(11,15);c.lineTo(7,19);c.lineTo(7,15);c.lineTo(5,15);c.closePath();},
doc:c=>{c.moveTo(6,3);c.lineTo(14,3);c.lineTo(18,7);c.lineTo(18,21);c.lineTo(6,21);c.closePath();c.moveTo(9,12);c.lineTo(15,12);c.moveTo(9,16);c.lineTo(15,16);},
globe:c=>{c.arc(12,12,9,0,Math.PI*2);c.moveTo(3,12);c.lineTo(21,12);c.moveTo(12,3);c.bezierCurveTo(7,8,7,16,12,21);c.moveTo(12,3);c.bezierCurveTo(17,8,17,16,12,21);},
};
function icon(ctx,name,x,y,size,color=BRAND.text,lineWidth=2){
const fn=ICONS[name]||ICONS.spark;
ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);
ctx.beginPath();fn(ctx);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();ctx.restore();
}
function iconBubble(ctx,name,x,y,r,color=BRAND.primary){
if(LOOK.cards==="pop"){circle(ctx,x,y,r,color,BRAND.text,S(3));icon(ctx,name,x,y,r*1.1,BRAND.surface,2.4);return;}
if(LOOK.cards==="bold"){circle(ctx,x,y,r,color);icon(ctx,name,x,y,r*1.1,BRAND.bg,2.6);return;}
withGlow(ctx,color,LOOK.glow*0.7,c=>circle(c,x,y,r,rgba(color,0.16),rgba(color,0.55),S(2)));
icon(ctx,name,x,y,r*1.1,color,2);
}
function eyebrow(ctx,str,x,y,f,{delay=0,color=BRAND.accent,align="center",size=S(28)}={}){
const p=seq(f,delay,20),s=String(str).toUpperCase(),sp=size*0.22;
if(p<=0)return;
ctx.save();ctx.globalAlpha*=p;
const w=measure(ctx,s,size,700,BRAND.fontBody)+sp*s.length,ln=S(44)*p;
text(ctx,s,x,y+(1-p)*S(14),{size,weight:700,family:BRAND.fontBody,color,align,letterSpacing:sp});
ctx.fillStyle=color;
if(align==="center"){ctx.fillRect(x-w/2-S(18)-ln,y-S(1.5),ln,S(3));ctx.fillRect(x+w/2+S(18),y-S(1.5),ln,S(3));}
else if(align==="left")ctx.fillRect(x+w+S(16),y-S(1.5),ln,S(3));
ctx.restore();
}
function kText(ctx,str,x,y,f,o={}){
const family=o.family||BRAND.fontHeading;
const{size=S(110),color=BRAND.text,highlight=[],hlColor=BRAND.accent,align="center",maxWidth=W()*0.84,
lineHeight=1.14,delay=0,stagger=4,mode=LOOK.textMode,config=Springs.style,hlStyle=LOOK.highlight,
upper=!!LOOK.uppercase&&family===BRAND.fontHeading,opacity=1,markerText=LOOK.markerInk==="text"?BRAND.text:BRAND.bg}=o;
const weight=o.weight??hw(family);
const words=(Array.isArray(str)?str:String(str).split(/\s+/)).filter(Boolean);
const shown=words.map(w=>upper?w.toUpperCase():w);
const times=o.times||(o.sync?syncDelays(words):null);
const clean=w=>String(w).replace(/[^\p{L}\p{N}%$€£₹#+-]/gu,"").toLowerCase();
const hlSet=highlight.map(h=>typeof h==="number"?h:clean(h));
let sz=size;ctx.font=font(sz,weight,family);
const widest=Math.max(1,...shown.map(w=>ctx.measureText(w).width));
if(widest>maxWidth){sz*=maxWidth/widest;ctx.font=font(sz,weight,family);}
const gap=sz*0.27,widths=shown.map(w=>ctx.measureText(w).width);
const lines=[[]];let lw=0;
shown.forEach((w,i)=>{const cur=lines[lines.length-1],add=(cur.length?gap:0)+widths[i];
if(lw+add>maxWidth&&cur.length){lines.push([i]);lw=widths[i];}else{cur.push(i);lw+=add;}});
const lh=sz*lineHeight,top=y-(lines.length-1)*lh/2;
if(opacity<=0)return{top:top-sz/2,bottom:top+(lines.length-1)*lh+sz/2,size:sz};
lines.forEach((ln,li)=>{
const total=ln.reduce((a,i)=>a+widths[i],0)+gap*(ln.length-1);
let wx=align==="center"?x-total/2:align==="left"?x:x-total;
const cy=top+li*lh;
ln.forEach(i=>{
const d=times&&times[i]!=null?times[i]:delay+i*stagger,ww=widths[i],cx=wx+ww/2;
const p=spring({frame:f,delay:d,config}),q=clamp(p);
const hl=hlSet.includes(i)||hlSet.includes(clean(words[i]));
ctx.save();ctx.globalAlpha*=opacity;
if(hl&&hlStyle==="marker"){
const m=seq(f,d+4,16),pad=sz*0.16;
if(m>0)roundRect(ctx,wx-pad,cy-sz*0.56,(ww+pad*2)*m,sz*1.1,sz*0.12,hlColor);
}
if(mode==="mask"){
const e=seq(f,d,22,Easing.outExpo);
ctx.beginPath();ctx.rect(wx-sz,cy-sz*0.75,ww+sz*2,sz*1.5);ctx.clip();
ctx.translate(0,(1-e)*sz*1.1);
}else if(mode==="blur"){
ctx.globalAlpha*=q;setBlur(ctx,(1-q)*S(20));zoomAt(ctx,lerp(1.08,1,q),cx,cy);
}else if(mode==="pop"){
ctx.globalAlpha*=clamp(p*2.5);zoomAt(ctx,Math.max(0.01,lerp(0.35,1,p)),cx,cy);
}else if(mode==="flip"){
const a=Math.min(1.5,Math.max(0,1-p)*1.5);
ctx.globalAlpha*=clamp(p*2);ctx.translate(cx,cy+(1-q)*sz*0.3);
ctx.transform(1,0,-Math.sin(a)*0.3,Math.max(0.03,Math.cos(a)),0,0);ctx.translate(-cx,-cy);
if(LOOK.motionBlur)setBlur(ctx,(1-q)*S(6));
}else if(mode==="write"){
const e=seq(f,d,Math.max(8,Math.round(ww/S(24))),Easing.inOut);
ctx.beginPath();ctx.rect(wx-sz*0.25,cy-sz,(ww+sz*0.5)*e,sz*2);ctx.clip();
}else if(mode==="step"){
const q3=f<d?0:Math.min(1,(Math.floor((f-d)/3)+1)/3);
ctx.globalAlpha*=q3>0?1:0;zoomAt(ctx,Math.max(0.01,q3<1?0.55+q3*0.5:1),cx,cy);
}else if(mode==="fade"){
ctx.globalAlpha*=q;
}else{
ctx.globalAlpha*=clamp(p*1.6);ctx.translate(0,(1-p)*sz*0.55);if(LOOK.motionBlur)setBlur(ctx,(1-q)*S(10));
}
const col=hl?(hlStyle==="marker"?markerText:hlColor):color;
const glow=hl&&hlStyle==="glow"?Math.max(1,LOOK.glow)*1.3:LOOK.glow*0.55;
withGlow(ctx,hl?hlColor:BRAND.primary,glow,c=>text(c,shown[i],cx,cy,{size:sz,weight,family,color:col}));
if(hl&&hlStyle==="underline"){
const u=seq(f,d+10,18);ctx.fillStyle=hlColor;ctx.fillRect(wx,cy+sz*0.5,ww*u,Math.max(S(4),sz*0.06));
}
ctx.restore();
wx+=ww+gap;
});
});
return{top:top-sz/2,bottom:top+(lines.length-1)*lh+sz/2,size:sz};
}
function particles(ctx,f,{count=60,color=LIGHT_BG?BRAND.accent:BRAND.primary,speed=0.6,maxR=4,alpha=1}={}){
for(let i=0;i<count;i++){
const x=(random("px"+i)*W()+Math.sin(f/60+i)*S(12)),y0=random("py"+i)*H(),r=S(1+random("pr"+i)*maxR);
const y=((y0-f*speed*S(1)*(0.5+random("ps"+i)))%H()+H())%H();
const a=(0.15+0.4*random("pa"+i))*alpha*(0.6+0.4*Math.sin(f/20+i*1.7));
circle(ctx,x,y,r*3,rgba(color,a*0.18));circle(ctx,x,y,r,rgba(color,a));
}
}
let EXPORTING=false;
function drawAsset(ctx,name,x,y,w,h,{cover=false}={}){
if(name==="logo"&&typeof SETTINGS!=="undefined"&&!SETTINGS.logo)return;
const img=ASSETS[name];
if(img){const r=(cover?Math.max:Math.min)(w/img.width,h/img.height);const dw=img.width*r,dh=img.height*r;
ctx.save();if(cover){roundRect(ctx,x,y,w,h,0);ctx.clip();}
ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();return;}
if(EXPORTING)return;
ctx.save();if(ctx.setLineDash)ctx.setLineDash([S(10),S(8)]);
roundRect(ctx,x,y,w,h,S(16),rgba(BRAND.text,0.04),rgba(BRAND.muted,0.7),S(2.5));ctx.restore();
text(ctx,`${name.toUpperCase()} · add yours`,x+w/2,y+h/2,{size:S(24),color:BRAND.muted,weight:600,family:BRAND.fontBody,maxWidth:w*0.9,depth:0});
}
function recipeScene(fn,opts,scene){scene.rebuild=o=>fn(o);scene.opts={...(opts||{})};return scene;}
function cube(ctx,cx,cy,size,ry,rx,color,alpha=1){
const V=[];for(let i=0;i<8;i++){let x=i&1?1:-1,y=i&2?1:-1,z=i&4?1:-1;
[x,z]=[x*Math.cos(ry)-z*Math.sin(ry),x*Math.sin(ry)+z*Math.cos(ry)];
[y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];V.push([x,y,z]);}
const F=[[0,1,3,2],[4,6,7,5],[0,2,6,4],[1,5,7,3],[0,4,5,1],[2,3,7,6]],L=[-0.4,-0.75,-0.55];
const P=V.map(([x,y,z])=>{const k=4/(4+z);return[cx+x*size*k,cy+y*size*k];});
F.map(f=>{const c=[0,1,2].map(a=>f.reduce((s,i)=>s+V[i][a],0)/4);
const u=[0,1,2].map(a=>V[f[1]][a]-V[f[0]][a]),v=[0,1,2].map(a=>V[f[3]][a]-V[f[0]][a]);
let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
if(n[0]*c[0]+n[1]*c[1]+n[2]*c[2]<0)n=n.map(q=>-q);
const len=Math.hypot(...n)||1;n=n.map(q=>q/len);
return{f,z:c[2],n};}).filter(o=>o.n[2]<0).sort((a,b)=>b.z-a.z).forEach(o=>{
const lit=0.35+0.65*Math.max(0,-(o.n[0]*L[0]+o.n[1]*L[1]+o.n[2]*L[2])/Math.hypot(...L));
ctx.beginPath();o.f.forEach((i,k)=>ctx[k?"lineTo":"moveTo"](P[i][0],P[i][1]));ctx.closePath();
ctx.fillStyle=rgba(isHex(color)?mix("#000000",color,lit):color,alpha);ctx.fill();
ctx.strokeStyle=rgba("#FFFFFF",0.18*alpha);ctx.lineWidth=S(1.2);ctx.stroke();});
}
const EMOJI_FONT='"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
function motionOf(kind,f,seed=1,amt=1){
const t=f/FPS(),ph=random("mo"+seed)*6.283,o={x:0,y:0,r:0,s:1,sx:1,sy:1};
if(kind==="float"){o.y=Math.sin(t*1.6+ph)*S(14)*amt;o.r=Math.sin(t*1.1+ph)*0.04*amt;}
else if(kind==="pulse")o.s=1+Math.sin(t*4+ph)*0.06*amt;
else if(kind==="spin")o.r=t*1.4*amt;
else if(kind==="wiggle")o.r=Math.sin(t*9+ph)*0.12*amt;
else if(kind==="bounce"){const b=Math.abs(Math.sin(t*3.2+ph)),sq=Math.pow(1-b,6)*0.14*amt;o.y=-b*S(46)*amt;o.sx=1+sq;o.sy=1-sq;}
else if(kind==="drift"){o.x=t*S(36)*amt;o.y=Math.sin(t*1.3+ph)*S(6);}
else if(kind==="grow")o.s=1+Math.min(1,t/4)*0.25*amt;
else if(kind==="orbit"){o.x=Math.cos(t*1.5+ph)*S(60)*amt;o.y=Math.sin(t*1.5+ph)*S(26)*amt;}
else if(kind==="shake")o.x=Math.sin(t*40+ph)*S(5)*amt;
else if(kind!=="none")o.s=1+Math.sin(t*1.6+ph)*0.015;
return o;
}
function kmix(a,b,t){const h=x=>{x=String(x).replace("#","");if(x.length===3)x=x.split("").map(c=>c+c).join("");return[0,2,4].map(i=>parseInt(x.slice(i,i+2),16)||0);};
const A=h(a),B=h(b);return"#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("");}
function kitPal(){
const p=BRAND.primary,s=BRAND.secondary,a=BRAND.accent;
const line=["whiteboard","chalk","blueprint","terminal","dotmatrix","maths","holo","graphite","pixel"].includes(typeof SETTINGS!=="undefined"?SETTINGS.style:STYLE);
return{p,s,a,pD:kmix(p,"#000000",0.3),pL:kmix(p,"#FFFFFF",0.4),sD:kmix(s,"#000000",0.28),sL:kmix(s,"#FFFFFF",0.45),aD:kmix(a,"#000000",0.25),
w:"#FFFFFF",g:"#E9EDF5",gD:"#B7C0D2",dk:"#273047",skin:"#F1C3A0",skinD:"#D79E78",hair:"#3A2A24",line,
ink:LIGHT_BG?"#1F2433":BRAND.text};
}
function kitPen(c,P){
const lw=6;
const paint=f=>{if(P.line){c.fillStyle=kmix(f,BRAND.bg,0.8);c.fill();c.lineWidth=lw;c.lineJoin="round";c.lineCap="round";c.strokeStyle=P.ink;c.stroke();}else{c.fillStyle=f;c.fill();}};
const rr=(x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
return{
rect(x,y,w,h,r,f){rr(x,y,w,h,r);paint(f);},
circ(x,y,r,f){c.beginPath();c.arc(x,y,r,0,Math.PI*2);paint(f);},
ell(x,y,rx,ry,f,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);paint(f);},
poly(pts,f){c.beginPath();pts.forEach(([x,y],i)=>c[i?"lineTo":"moveTo"](x,y));c.closePath();paint(f);},
arc(x,y,r,a0,a1,f){c.beginPath();c.moveTo(x,y);c.arc(x,y,r,a0,a1);c.closePath();paint(f);},
line(pts,col,w=6){c.beginPath();pts.forEach(([x,y],i)=>c[i?"lineTo":"moveTo"](x,y));c.strokeStyle=P.line?P.ink:col;c.lineWidth=w;c.lineCap="round";c.lineJoin="round";c.stroke();},
shine(x,y,w,h,r){if(P.line)return;rr(x,y,w,h,r);c.fillStyle="rgba(255,255,255,0.28)";c.fill();},
};
}
const KIT={
laptop(c,P,k){k.rect(-78,-62,156,104,10,P.dk);k.rect(-68,-52,136,84,4,P.p);k.rect(-60,-44,60,10,3,P.pL);k.rect(-60,-26,90,8,3,P.pL);k.rect(-60,-12,74,8,3,P.pL);k.rect(8,2,52,22,4,P.a);
k.poly([[-96,46],[96,46],[84,62],[-84,62]],P.gD);k.rect(-24,46,48,6,3,P.g);},
phone(c,P,k){k.rect(-46,-88,92,176,18,P.dk);k.rect(-38,-76,76,146,10,P.p);k.rect(-28,-62,56,30,6,P.pL);k.rect(-28,-24,56,10,4,P.w);k.rect(-28,-8,40,10,4,P.w);k.rect(-28,14,56,34,6,P.a);k.rect(-12,76,24,4,2,P.gD);},
document(c,P,k){k.poly([[-60,-86],[32,-86],[64,-54],[64,86],[-60,86]],P.w);k.poly([[32,-86],[64,-54],[32,-54]],P.gD);
[-40,-16,8,32].forEach((y,i)=>k.rect(-40,y,i===0?60:84,9,4,i===0?P.p:P.g));k.circ(30,62,18,P.a);k.line([[21,62],[28,69],[40,55]],P.w,6);},
chart(c,P,k){k.rect(-86,-76,172,152,14,P.w);k.line([[-66,54],[70,54]],P.gD,5);[[-54,22,P.pL],[-20,-6,P.p],[14,-30,P.s],[48,-54,P.a]].forEach(([x,top,col])=>k.rect(x,top,24,54-top,5,col));
k.line([[-50,10],[-10,-18],[24,-30],[60,-62]],P.pD,6);},
pie(c,P,k){k.circ(0,0,82,P.g);k.arc(0,0,82,-Math.PI/2,Math.PI*0.55,P.p);k.arc(0,0,82,Math.PI*0.55,Math.PI*1.05,P.s);k.arc(6,-6,82,Math.PI*1.05,Math.PI*1.5,P.a);k.circ(0,0,34,P.w);},
server(c,P,k){[-70,-20,30].forEach((y,i)=>{k.rect(-72,y,144,42,8,i===1?P.pD:P.dk);k.circ(-50,y+21,7,i===1?P.a:P.s);k.rect(-30,y+17,50,8,4,P.gD);k.rect(40,y+15,20,12,3,P.p);});k.rect(-60,74,120,10,4,P.gD);},
cloud(c,P,k){k.circ(-40,14,38,P.pL);k.circ(8,-14,52,P.pL);k.circ(52,14,36,P.pL);k.rect(-78,10,166,44,22,P.pL);k.circ(8,-14,30,P.w);},
database(c,P,k){[40,0,-40].forEach((y,i)=>{k.rect(-62,y-20,124,44,6,i%2?P.p:P.pD);k.ell(0,y+24,62,16,i%2?P.p:P.pD);});k.ell(0,-60,62,18,P.pL);k.circ(36,-2,6,P.a);k.circ(36,38,6,P.a);},
shield(c,P,k){k.poly([[0,-92],[74,-64],[70,10],[0,92],[-70,10],[-74,-64]],P.p);k.poly([[0,-92],[74,-64],[70,10],[0,92]],P.pD);k.line([[-30,0],[-6,24],[36,-26]],P.w,12);},
lock(c,P,k){c.beginPath();c.arc(0,-26,44,Math.PI,0);c.strokeStyle=P.line?P.ink:P.gD;c.lineWidth=18;c.stroke();k.rect(-66,-30,132,112,16,P.a);k.rect(-66,-30,66,112,16,P.aD);k.circ(0,16,14,P.dk);k.rect(-5,18,10,30,4,P.dk);},
key(c,P,k){k.circ(-44,0,40,P.a);k.circ(-44,0,16,BRAND.bg);k.rect(-8,-11,104,22,6,P.a);k.rect(54,8,14,28,4,P.a);k.rect(78,8,14,20,4,P.a);},
person(c,P,k){k.rect(-50,16,100,84,40,P.p);k.rect(-50,40,100,60,10,P.p);k.rect(-12,6,24,20,6,P.skinD);k.circ(0,-34,40,P.skin);k.poly([[-42,-40],[-36,-70],[0,-82],[38,-68],[42,-40],[26,-56],[-20,-54]],P.hair);
k.circ(-14,-32,5,P.dk);k.circ(14,-32,5,P.dk);c.beginPath();c.arc(0,-20,12,0.15*Math.PI,0.85*Math.PI);c.strokeStyle=P.dk;c.lineWidth=4;c.stroke();k.rect(-8,34,16,34,6,P.a);},
team(c,P,k){[[-58,18,0.72,P.s],[58,18,0.72,P.a],[0,0,0.9,P.p]].forEach(([x,y,s,col])=>{c.save();c.translate(x,y);c.scale(s,s);k.rect(-50,16,100,84,40,col);k.circ(0,-34,40,P.skin);k.poly([[-42,-40],[-36,-70],[0,-82],[38,-68],[42,-40],[0,-56]],P.hair);k.circ(-13,-32,5,P.dk);k.circ(13,-32,5,P.dk);c.restore();});},
building(c,P,k){k.rect(-64,-88,128,180,8,P.p);k.rect(-64,-88,30,180,8,P.pD);for(let r=0;r<5;r++)for(let q=0;q<3;q++)k.rect(-22+q*28,-72+r*30,18,20,3,r===2&&q===1?P.a:P.pL);k.rect(-14,62,28,30,4,P.dk);},
store(c,P,k){k.rect(-82,-20,164,104,8,P.w);k.poly([[-92,-20],[-80,-70],[80,-70],[92,-20]],P.p);for(let i=0;i<5;i++)k.poly([[-92+i*36.8,-20],[-80+i*32,-70],[-64+i*32,-70],[-73+i*36.8,-20]],i%2?P.p:P.w);
k.rect(-64,4,60,50,6,P.pL);k.rect(14,4,46,80,6,P.s);k.circ(50,46,4,P.w);},
factory(c,P,k){k.poly([[-90,84],[-90,-10],[-40,-40],[-40,-10],[10,-40],[10,-10],[60,-40],[60,84]],P.p);k.rect(60,-84,28,168,4,P.pD);k.circ(74,-98,14,P.g);k.circ(92,-112,10,P.g);
[-70,-30,10].forEach(x=>k.rect(x,20,26,24,4,P.a));},
truck(c,P,k){k.rect(-96,-54,120,92,8,P.w);k.rect(-96,-54,120,18,6,P.p);k.rect(24,-24,66,62,10,P.p);k.rect(40,-14,34,24,4,P.pL);k.rect(-96,30,186,14,4,P.dk);
[-60,52].forEach(x=>{k.circ(x,50,22,P.dk);k.circ(x,50,9,P.gD);});},
box(c,P,k){k.poly([[-78,-30],[0,-64],[78,-30],[0,4]],P.aD);k.poly([[-78,-30],[0,4],[0,92],[-78,56]],P.a);k.poly([[78,-30],[0,4],[0,92],[78,56]],P.aD);k.poly([[-40,-48],[38,-14],[38,10],[-40,-24]],P.w);},
cart(c,P,k){k.line([[-96,-60],[-70,-60],[-46,40],[62,40]],P.dk,10);k.poly([[-62,-40],[86,-40],[70,18],[-50,18]],P.p);k.line([[-30,-40],[-20,18]],P.pD,5);k.line([[14,-40],[14,18]],P.pD,5);k.line([[54,-40],[46,18]],P.pD,5);
k.circ(-36,66,14,P.dk);k.circ(50,66,14,P.dk);k.rect(-38,-76,40,34,6,P.a);k.rect(10,-66,30,24,6,P.s);},
coin(c,P,k){k.ell(10,10,74,74,P.aD);k.circ(0,0,74,P.a);k.circ(0,0,56,P.aD);k.circ(-3,-3,54,P.a);c.font="800 72px Inter, sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle=P.line?P.ink:P.aD;c.fillText("$",0,4);},
money(c,P,k){[24,8,-8].forEach((y,i)=>{k.rect(-88,y-30,176,74,8,i===2?P.s:P.sD);});k.circ(0,-1,24,P.sL);k.rect(-74,-32,22,22,11,P.sL);k.rect(52,14,22,22,11,P.sL);},
gear(c,P,k){c.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?66:86;const a2=a+Math.PI/16;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a2)*r,Math.sin(a2)*r);}c.closePath();
if(P.line){c.fillStyle=kmix(P.p,BRAND.bg,0.8);c.fill();c.strokeStyle=P.ink;c.lineWidth=6;c.stroke();}else{c.fillStyle=P.p;c.fill();}k.circ(0,0,44,P.pD);k.circ(0,0,22,BRAND.bg);},
rocket(c,P,k){k.poly([[-20,50],[-52,80],[-46,30]],P.pD);k.poly([[20,50],[52,80],[46,30]],P.pD);k.poly([[0,-96],[36,-40],[30,56],[-30,56],[-36,-40]],P.w);k.poly([[0,-96],[36,-40],[-36,-40]],P.p);
k.circ(0,-6,18,P.pL);k.circ(0,-6,10,P.p);k.poly([[-18,56],[18,56],[0,98]],P.a);k.poly([[-9,56],[9,56],[0,80]],P.w);},
bulb(c,P,k){if(!P.line){c.save();c.globalAlpha=0.25;c.beginPath();c.arc(0,-24,92,0,Math.PI*2);c.fillStyle=P.a;c.fill();c.restore();}k.circ(0,-24,62,P.a);k.rect(-28,30,56,20,6,P.a);k.rect(-26,50,52,14,5,P.gD);k.rect(-22,66,44,12,5,P.gD);k.rect(-12,80,24,10,5,P.dk);
k.line([[-16,30],[-10,-10],[0,6],[10,-10],[16,30]],P.aD,5);k.shine(-34,-64,20,40,10);},
globe(c,P,k){k.circ(0,0,84,P.p);k.poly([[-50,-52],[-10,-66],[8,-40],[-20,-10],[-46,-20]],P.s);k.poly([[18,-10],[56,-24],[70,12],[40,50],[16,30]],P.s);k.poly([[-60,20],[-30,30],[-34,64],[-58,46]],P.s);
c.beginPath();c.ellipse(0,0,84,30,0,0,Math.PI*2);c.strokeStyle=P.line?P.ink:"rgba(255,255,255,0.35)";c.lineWidth=4;c.stroke();},
calendar(c,P,k){k.rect(-80,-70,160,156,14,P.w);k.rect(-80,-70,160,46,14,P.p);k.rect(-80,-40,160,16,0,P.p);[-44,44].forEach(x=>k.rect(x-7,-88,14,34,7,P.dk));
for(let r=0;r<3;r++)for(let q=0;q<4;q++)k.rect(-62+q*33,-6+r*28,22,18,4,r===1&&q===2?P.a:P.g);},
clock(c,P,k){k.circ(0,0,86,P.p);k.circ(0,0,70,P.w);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;k.circ(Math.cos(a)*56,Math.sin(a)*56,i%3?3:6,P.dk);}k.line([[0,0],[0,-46]],P.dk,8);k.line([[0,0],[34,18]],P.a,7);k.circ(0,0,8,P.dk);},
mail(c,P,k){k.rect(-88,-56,176,116,12,P.w);k.poly([[-88,-50],[0,18],[88,-50],[88,-56],[-88,-56]],P.g);k.line([[-84,-50],[0,16],[84,-50]],P.p,7);k.circ(70,-52,22,P.a);},
chat(c,P,k){k.rect(-88,-70,130,88,22,P.p);k.poly([[-60,14],[-74,46],[-30,14]],P.p);k.rect(-24,-14,112,80,22,P.a);k.poly([[50,60],[70,90],[72,60]],P.a);
[-60,-36,-12].forEach(x=>k.circ(x,-26,8,P.w));k.rect(-6,10,70,10,5,P.w);k.rect(-6,32,48,10,5,P.w);},
search(c,P,k){k.line([[34,34],[86,86]],P.dk,24);k.circ(-14,-14,66,P.p);k.circ(-14,-14,48,P.pL);k.shine(-48,-48,26,26,13);},
target(c,P,k){[86,64,42,20].forEach((r,i)=>k.circ(0,0,r,i%2?P.w:P.p));k.line([[0,0],[70,-70]],P.dk,7);k.poly([[70,-70],[96,-76],[76,-96]],P.a);},
trophy(c,P,k){k.rect(-30,44,60,22,6,P.aD);k.rect(-50,66,100,22,6,P.dk);k.rect(-12,20,24,30,4,P.aD);c.beginPath();c.arc(-56,-40,26,Math.PI*0.5,Math.PI*1.5);c.arc(56,-40,26,-Math.PI*0.5,Math.PI*0.5);c.strokeStyle=P.line?P.ink:P.aD;c.lineWidth=12;c.stroke();
k.poly([[-60,-76],[60,-76],[50,-10],[0,26],[-50,-10]],P.a);k.shine(-40,-68,18,50,9);},
plant(c,P,k){k.poly([[-44,30],[44,30],[34,92],[-34,92]],P.aD);k.line([[0,32],[0,-40]],P.sD,8);k.ell(-34,-26,36,16,P.s,-0.6);k.ell(34,-48,36,16,P.s,0.6);k.ell(0,-84,14,26,P.sL);},
heart(c,P,k){c.beginPath();c.moveTo(0,80);c.bezierCurveTo(-110,10,-70,-90,0,-40);c.bezierCurveTo(70,-90,110,10,0,80);c.closePath();if(P.line){c.fillStyle=kmix(P.a,BRAND.bg,0.8);c.fill();c.strokeStyle=P.ink;c.lineWidth=6;c.stroke();}else{c.fillStyle=P.a;c.fill();}k.shine(-56,-46,26,26,13);},
warning(c,P,k){k.poly([[0,-88],[92,76],[-92,76]],P.a);k.rect(-9,-30,18,62,9,P.dk);k.circ(0,52,10,P.dk);},
check(c,P,k){k.circ(0,0,84,P.s);k.line([[-38,2],[-10,30],[42,-28]],P.w,18);},
pin(c,P,k){c.beginPath();c.moveTo(0,92);c.bezierCurveTo(-30,40,-66,10,-66,-26);c.arc(0,-26,66,Math.PI,0);c.bezierCurveTo(66,10,30,40,0,92);c.closePath();if(P.line){c.fillStyle=kmix(P.a,BRAND.bg,0.8);c.fill();c.strokeStyle=P.ink;c.lineWidth=6;c.stroke();}else{c.fillStyle=P.a;c.fill();}k.circ(0,-26,26,P.w);},
robot(c,P,k){k.line([[0,-70],[0,-92]],P.dk,6);k.circ(0,-94,10,P.a);k.rect(-70,-70,140,104,24,P.pL);k.rect(-52,-50,104,62,16,P.dk);k.circ(-24,-20,12,P.s);k.circ(24,-20,12,P.s);k.rect(-18,2,36,6,3,P.s);
k.rect(-50,42,100,50,12,P.p);k.rect(-86,-30,16,40,8,P.pD);k.rect(70,-30,16,40,8,P.pD);},
chip(c,P,k){for(let i=0;i<5;i++){const o=-48+i*24;k.rect(o-4,-92,8,24,3,P.gD);k.rect(o-4,68,8,24,3,P.gD);k.rect(-92,o-4,24,8,3,P.gD);k.rect(68,o-4,24,8,3,P.gD);}
k.rect(-70,-70,140,140,16,P.dk);k.rect(-46,-46,92,92,10,P.p);c.font="800 44px Inter, sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle=P.line?P.ink:P.w;c.fillText("AI",0,2);},
folder(c,P,k){k.poly([[-88,-60],[-30,-60],[-14,-42],[88,-42],[88,70],[-88,70]],P.aD);k.rect(-60,-54,120,80,6,P.w);k.poly([[-92,-20],[92,-20],[84,76],[-84,76]],P.a);},
bell(c,P,k){c.beginPath();c.moveTo(-64,46);c.bezierCurveTo(-50,30,-54,-60,0,-66);c.bezierCurveTo(54,-60,50,30,64,46);c.closePath();if(P.line){c.fillStyle=kmix(P.a,BRAND.bg,0.8);c.fill();c.strokeStyle=P.ink;c.lineWidth=6;c.stroke();}else{c.fillStyle=P.a;c.fill();}
k.rect(-74,42,148,16,8,P.aD);k.circ(0,70,14,P.dk);k.circ(0,-72,10,P.aD);},
wallet(c,P,k){k.rect(-86,-50,172,120,16,P.pD);k.rect(-74,-70,130,40,8,P.s);k.rect(-86,-40,172,110,16,P.p);k.rect(30,-4,64,40,12,P.pD);k.circ(54,16,8,P.a);},
handshake(c,P,k){k.rect(-96,-20,60,40,10,P.p);k.rect(36,-20,60,40,10,P.s);k.ell(-12,4,44,30,P.skin,-0.2);k.ell(14,-2,44,28,P.skinD,0.2);[-20,-4,12].forEach(x=>k.rect(x,-24,12,30,6,P.skin));},
megaphone(c,P,k){k.poly([[-60,-24],[50,-76],[50,76],[-60,24]],P.a);k.rect(-86,-30,34,60,10,P.aD);k.rect(-64,22,24,50,8,P.dk);k.ell(52,0,16,76,P.aD);[0,1,2].forEach(i=>k.line([[78+i*6,-30-i*14],[92+i*6,-40-i*16]],P.p,6));},
idea:null,
};
KIT.idea=KIT.bulb;KIT.ai=KIT.chip;KIT.email=KIT.mail;KIT.message=KIT.chat;KIT.people=KIT.team;KIT.user=KIT.person;KIT.office=KIT.building;KIT.shop=KIT.store;
KIT.package=KIT.box;KIT.delivery=KIT.truck;KIT.security=KIT.shield;KIT.data=KIT.database;KIT.money2=KIT.money;KIT.growth=KIT.chart;KIT.time=KIT.clock;KIT.done=KIT.check;
KIT.launch=KIT.rocket;KIT.goal=KIT.target;KIT.settings=KIT.gear;KIT.location=KIT.pin;KIT.alert=KIT.warning;KIT.computer=KIT.laptop;KIT.mobile=KIT.phone;KIT.doc=KIT.document;KIT.report=KIT.document;
const kitName=ch=>{const n=String(ch||"").trim().toLowerCase().replace(/^kit:/,"");return KIT[n]?n:null;};
function drawKit(ctx,name,x,y,size){
const fn=KIT[kitName(name)];if(!fn)return false;
const P=kitPal();ctx.save();ctx.translate(x,y);ctx.scale(size/200,size/200);
try{fn(ctx,P,kitPen(ctx,P));}catch(e){console.error(e);}ctx.restore();return true;
}
function emoji(ctx,ch,x,y,size,{alpha=1}={}){
if(kitName(ch)){ctx.save();ctx.globalAlpha*=alpha;drawKit(ctx,ch,x,y,size*1.05);ctx.restore();return;}
ctx.save();ctx.globalAlpha*=alpha;ctx.font=`${Math.round(size)}px ${EMOJI_FONT}`;
ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=BRAND.text;ctx.fillText(ch,x,y+size*0.06);ctx.restore();
}
function pathAt(path,f){
if(!path||!path.length)return null;if(f<=path[0][0])return[path[0][1],path[0][2]];
for(let i=1;i<path.length;i++)if(f<=path[i][0]){const a=path[i-1],b=path[i],q=Easing.inOut((f-a[0])/Math.max(1,b[0]-a[0]));
return[lerp(a[1],b[1],q),lerp(a[2],b[2],q)];}
const z=path[path.length-1];return[z[1],z[2]];
}
function picture(ctx,ch,x,y,size,f,{delay=0,motion="breathe",seed,path,glow=0,shadow=true,amount=1}={}){
const p=spring({frame:f,delay,config:{damping:11,stiffness:170}});if(p<=0.002)return;
const m=motionOf(motion,Math.max(0,f-delay),seed??String(ch).codePointAt(0),amount),at=pathAt(path,f);
const px=(at?at[0]:x)+m.x,py=(at?at[1]:y);
if(shadow){ctx.save();ctx.globalAlpha*=clamp(p)*(LIGHT_BG?0.16:0.32)/(1+Math.abs(m.y)/S(60));
ctx.translate(px,py+size*0.52);ctx.scale(1,0.22);circle(ctx,0,0,size*0.36*(1-Math.abs(m.y)/S(200)),"#000000");ctx.restore();}
ctx.save();ctx.globalAlpha*=clamp(p*1.8);ctx.translate(px,py+m.y+(1-clamp(p))*S(30));ctx.rotate(m.r+(1-clamp(p))*-0.25);
const k=Math.max(0.01,lerp(0.4,1,p))*m.s;ctx.scale(k*m.sx,k*m.sy);
withGlow(ctx,BRAND.primary,glow,c=>emoji(c,ch,0,0,size));ctx.restore();
}
function rays(ctx,cx,cy,f,{count=14,r0=S(90),r1=Math.max(W(),H())*0.75,color=BRAND.accent,alpha=0.16,spin=0.06,fan=Math.PI*2,angle=-Math.PI/2,rainbow=false,delay=0}={}){
const p=seq(f,delay,30,Easing.outExpo);if(p<=0)return;
const t=f/FPS(),cols=rainbow?["#FF4D4D","#FF9F1C","#FFE14D","#3DDC84","#3D8BFF","#7B61FF","#C04DFF"]:null;
ctx.save();ctx.translate(cx,cy);ctx.rotate(t*spin);
for(let i=0;i<count;i++){
const a=fan>=6.28?i/count*Math.PI*2:angle-fan/2+fan*(i+0.5)/count,wdt=(fan>=6.28?Math.PI/count:fan/count)*0.45;
const c=cols?cols[i%cols.length]:color,R=lerp(r0,r1,p);
const gr=ctx.createRadialGradient(0,0,r0,0,0,R);gr.addColorStop(0,rgba(c,alpha*1.6));gr.addColorStop(1,rgba(c,0));
ctx.beginPath();ctx.moveTo(Math.cos(a-wdt)*r0,Math.sin(a-wdt)*r0);ctx.lineTo(Math.cos(a-wdt)*R,Math.sin(a-wdt)*R);
ctx.lineTo(Math.cos(a+wdt)*R,Math.sin(a+wdt)*R);ctx.lineTo(Math.cos(a+wdt)*r0,Math.sin(a+wdt)*r0);ctx.closePath();ctx.fillStyle=gr;ctx.fill();
}
ctx.restore();
}
function beam(ctx,x1,y1,x2,y2,p,{color=BRAND.primary,width=S(10),glow=1,f=0}={}){
if(p<=0)return;const ex=lerp(x1,x2,clamp(p)),ey=lerp(y1,y2,clamp(p));
ctx.save();ctx.lineCap="round";
withGlow(ctx,color,glow,c=>{c.strokeStyle=rgba(color,0.55);c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(ex,ey);c.stroke();});
ctx.strokeStyle=rgba("#FFFFFF",0.85);ctx.lineWidth=width*0.3;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(ex,ey);ctx.stroke();
const q=((f/FPS())*0.8)%1;if(p>=1)circle(ctx,lerp(x1,x2,q),lerp(y1,y2,q),width*0.7,rgba("#FFFFFF",0.9));
ctx.restore();
}
function swarm(ctx,f,{x=W()/2,y=H()/2,w=W()*0.6,h=H()*0.5,count=26,kind="jitter",emoji:ch=null,size=S(12),color=BRAND.primary,alpha=0.85,seed="sw",delay=0}={}){
const p=seq(f,delay,24);if(p<=0)return;const t=f/FPS();
for(let i=0;i<count;i++){
const rx=random(seed+"x"+i),ry=random(seed+"y"+i),sp=0.6+random(seed+"s"+i);
let px=x+(rx-0.5)*w,py=y+(ry-0.5)*h;
if(kind==="jitter"){px+=Math.sin(t*7*sp+i)*S(6);py+=Math.cos(t*6*sp+i*2)*S(6);}
else if(kind==="rain")py=y-h/2+((ry*h+t*S(260)*sp)%h);
else if(kind==="rise")py=y+h/2-((ry*h+t*S(90)*sp)%h);
else if(kind==="orbit"){const a=rx*6.283+t*sp,R=(0.3+ry*0.7);px=x+Math.cos(a)*w/2*R;py=y+Math.sin(a)*h/2*R;}
const a=alpha*clamp(p*1.5-i/count*0.5);
if(ch)emoji(ctx,ch,px,py,size*(0.8+random(seed+"z"+i)*0.5),{alpha:a});
else circle(ctx,px,py,size*0.5*(0.6+random(seed+"z"+i)*0.8),rgba(color,a));
}
}
function ground(ctx,y=H()*0.76,{color=BRAND.muted,p=1}={}){
if(p<=0)return;const w=W()*clamp(p);
ctx.fillStyle=hGrad(ctx,W()/2-w/2,W()/2,rgba(color,0),rgba(color,0.55));ctx.fillRect(W()/2-w/2,y,w/2,S(4));
ctx.fillStyle=hGrad(ctx,W()/2,W()/2+w/2,rgba(color,0.55),rgba(color,0));ctx.fillRect(W()/2,y,w/2,S(4));
}
function svgPath(ctx,d,x,y,size,p,{color=BRAND.primary,width=3,fill=null,length=400}={}){
if(p<=0||typeof Path2D==="undefined")return;let path;try{path=new Path2D(d);}catch(e){return;}
ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/100,size/100);
if(fill&&p>0.8){ctx.globalAlpha*=(p-0.8)/0.2;ctx.fillStyle=fill;ctx.fill(path);ctx.globalAlpha=1;}
if(ctx.setLineDash){ctx.setLineDash([length,length]);ctx.lineDashOffset=length*(1-clamp(p));}
ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke(path);ctx.restore();
}
let BOIL=0;
function sketchRect(ctx,x,y,w,h,color,width){
const j=k=>(random("sk"+Math.round(x)+"_"+Math.round(y)+"_"+k+"_"+BOIL)-0.5)*S(5);
ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";
for(let pass=0;pass<2;pass++){ctx.beginPath();const o=pass*7;
ctx.moveTo(x+j(o),y+j(o+1));ctx.lineTo(x+w+j(o+2),y+j(o+3));ctx.lineTo(x+w+j(o+4),y+h+j(o+5));
ctx.lineTo(x+j(o+6),y+h+j(o+7));ctx.closePath();ctx.globalAlpha=pass?0.45:1;ctx.stroke();}
ctx.restore();
}
let CUR=null;
function syncDelays(words,fallback=4){
const s=CUR;if(!s)return null;const wf=wordFrames(s.index);if(!wf)return null;
const clean=w=>String(w).replace(/[^\p{L}\p{N}]/gu,"").toLowerCase(),vw=wf.words,at=wf.at;
let j=0,prev=-fallback;
return words.map(w=>{const cw=clean(w);let v=null;
for(let k=j;k<vw.length;k++)if(cw&&clean(vw[k])===cw){j=k+1;v=at[k];break;}
prev=v==null?prev+fallback:Math.max(v-3,prev+1);return Math.max(0,Math.round(prev));});
}
function proj(x,y,z,{yaw=0,pitch=0.3,dist=10,fov=0.9,cx=W()/2,cy=H()/2}={}){
const cy1=Math.cos(yaw),sy1=Math.sin(yaw),x1=x*cy1-z*sy1,z1=x*sy1+z*cy1;
const cp=Math.cos(pitch),sp=Math.sin(pitch),y2=y*cp-z1*sp,z2=y*sp+z1*cp+dist;
const fl=(Math.min(W(),H())/2)/Math.tan(fov/2),k=fl/Math.max(0.1,z2);
return[cx+x1*k,cy-y2*k,k,z2];
}
function ball(ctx,x,y,r,color,kind="glossy",alpha=1){
if(r<0.5)return;ctx.save();ctx.globalAlpha*=alpha;
if(kind==="chrome"){
const g=ctx.createLinearGradient(x,y-r,x,y+r);
g.addColorStop(0,"#FDFEFF");g.addColorStop(0.42,"#9AA1AB");g.addColorStop(0.5,"#2B2F36");g.addColorStop(0.62,"#5E646D");g.addColorStop(1,"#E4E8EE");
circle(ctx,x,y,r,g);
const hl=ctx.createRadialGradient(x-r*0.35,y-r*0.45,0,x-r*0.35,y-r*0.45,r*0.5);hl.addColorStop(0,"rgba(255,255,255,0.95)");hl.addColorStop(1,"rgba(255,255,255,0)");
circle(ctx,x,y,r,hl);circle(ctx,x,y,r,null,rgba(color,0.35),Math.max(1,r*0.04));
}else if(kind==="clay"){
const g=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r*1.05);
g.addColorStop(0,mix(color,"#FFFFFF",0.35));g.addColorStop(0.65,color);g.addColorStop(1,mix(color,"#000000",0.28));circle(ctx,x,y,r,g);
}else{
const g=ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.05,x,y,r);
g.addColorStop(0,rgba("#FFFFFF",0.85));g.addColorStop(0.25,rgba(color,0.75));g.addColorStop(1,rgba(mix(color,"#000000",0.5),0.55));circle(ctx,x,y,r,g);
circle(ctx,x,y,r,null,rgba("#FFFFFF",0.35),Math.max(1,r*0.03));
}
ctx.restore();
}
function dotFloor(ctx,cam,{color=BRAND.muted,gap=0.6,size=0.035,reach=12,alpha=0.6}={}){
for(let gx=-reach;gx<=reach;gx+=gap)for(let gz=-reach;gz<=reach;gz+=gap){
const[sx,sy,k,z]=proj(gx,0,gz,cam);if(z<1||sx<-20||sx>W()+20||sy<0||sy>H()+20)continue;
const a=alpha*clamp(1-Math.hypot(gx,gz)/reach);if(a<0.02)continue;
ctx.fillStyle=rgba(color,a);ctx.fillRect(sx-size*k/2,sy-size*k/2,Math.max(1,size*k),Math.max(1,size*k));
}
}
const sceneAt=g=>{let i=0;TL.scenes.forEach((s,k)=>{if(g>=s.start)i=k;});return i;};
function drawBackground(ctx,g){
const w=W(),h=H(),t=g/VIDEO.fps,M=Math.max(w,h),kind=LOOK.background;
fillBg(ctx,BRAND.bg);
if(kind==="none")return;
if(kind==="aurora"){
gradientBg(ctx,BRAND.bg,BRAND.surface,135);
softLight(ctx,w*(0.2+0.08*Math.sin(t*0.35)),h*(0.25+0.1*Math.cos(t*0.27)),M*0.55,BRAND.primary,0.32);
softLight(ctx,w*(0.85+0.06*Math.cos(t*0.31)),h*(0.78+0.08*Math.sin(t*0.23)),M*0.5,BRAND.secondary,0.2);
softLight(ctx,w*(0.62+0.12*Math.sin(t*0.19+1)),h*(0.08+0.1*Math.sin(t*0.29)),M*0.32,BRAND.accent,0.1);
}else if(kind==="grid"){
const hz=h*(isTall()?0.7:0.64);
softLight(ctx,w*0.5,hz,M*0.6,BRAND.secondary,0.3);
softLight(ctx,w*(0.2+0.1*Math.sin(t*0.3)),h*0.18,M*0.4,BRAND.primary,0.16);
ctx.save();ctx.beginPath();ctx.rect(0,hz,w,h-hz);ctx.clip();
ctx.strokeStyle=rgba(BRAND.primary,0.5);ctx.lineWidth=S(2);
for(let i=0;i<16;i++){const z=(i+(t*0.5)%1)/16,y=hz+(h-hz)*z*z;
ctx.globalAlpha=z*0.9;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
ctx.globalAlpha=0.5;
for(let i=-14;i<=14;i++){ctx.beginPath();ctx.moveTo(w/2+i*w*0.01,hz);ctx.lineTo(w/2+i*w*0.14,h);ctx.stroke();}
ctx.restore();
ctx.fillStyle=hGrad(ctx,0,w,rgba(BRAND.primary,0),rgba(BRAND.primary,0.9));ctx.fillRect(0,hz-S(1.5),w/2,S(3));
ctx.fillStyle=hGrad(ctx,w/2,w,rgba(BRAND.primary,0.9),rgba(BRAND.primary,0));ctx.fillRect(w/2,hz-S(1.5),w/2,S(3));
}else if(kind==="stripes"){
ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-0.38);
const band=S(150),off=(t*S(36))%(band*2);
ctx.fillStyle=rgba(BRAND.text,0.035);
for(let x=-M*1.2-band*2;x<M*1.2;x+=band*2)ctx.fillRect(x+off,-M,band,M*2);
ctx.restore();
softLight(ctx,w*(0.82+0.05*Math.sin(t*0.4)),h*0.18,M*0.42,BRAND.accent,0.1);
softLight(ctx,w*0.1,h*0.95,M*0.4,BRAND.secondary,0.08);
}else if(kind==="paper"){
ctx.strokeStyle=rgba(BRAND.text,0.055);ctx.lineWidth=S(1.5);
const cols=isTall()?6:12;
for(let i=1;i<cols;i++){const x=w*i/cols;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
softLight(ctx,w*(0.8+0.05*Math.sin(t*0.2)),h*0.2,M*0.45,BRAND.accent,0.07);
softLight(ctx,w*0.1,h*0.9,M*0.4,BRAND.secondary,0.06);
}else if(kind==="shapes"){
softLight(ctx,w*0.15,h*0.2,M*0.45,BRAND.primary,0.12);
softLight(ctx,w*0.9,h*0.85,M*0.45,BRAND.secondary,0.14);
const cols=[BRAND.primary,BRAND.secondary,BRAND.accent];
for(let i=0;i<12;i++){
const x=random("sx"+i)*w+Math.sin(t*0.5+i)*S(30),y=random("sy"+i)*h+Math.cos(t*0.4+i*2)*S(30);
const s=S(30+random("ss"+i)*70),col=cols[i%3],k=i%4;
ctx.save();ctx.translate(x,y);ctx.rotate(t*(random("sr"+i)-0.5)*0.8+i);ctx.globalAlpha=0.22;
if(k===0)circle(ctx,0,0,s/2,col);
else if(k===1)roundRect(ctx,-s/2,-s/2,s,s,s*0.25,col);
else if(k===2){ctx.beginPath();ctx.moveTo(0,-s/2);ctx.lineTo(s/2,s/2);ctx.lineTo(-s/2,s/2);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
else circle(ctx,0,0,s/2,null,col,S(10));
ctx.restore();
}
}else if(kind==="depth"){
gradientBg(ctx,BRAND.bg,BRAND.surface,90);
const hz=h*(isTall()?0.64:0.62);
softLight(ctx,w*0.5,hz,M*0.55,BRAND.primary,0.24);
ctx.save();ctx.beginPath();ctx.rect(0,hz,w,h-hz);ctx.clip();
ctx.strokeStyle=rgba(BRAND.primary,0.42);ctx.lineWidth=S(1.5);
for(let i=0;i<14;i++){const z=(i+(t*0.35)%1)/14,y=hz+(h-hz)*z*z;
ctx.globalAlpha=z;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
ctx.globalAlpha=0.6;
for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(w/2+i*w*0.02,hz);ctx.lineTo(w/2+i*w*0.17,h);ctx.stroke();}
ctx.restore();
const cols=[BRAND.primary,BRAND.secondary,BRAND.accent];
for(let i=0;i<6;i++){
const side=i%2?0.06+random("cx"+i)*0.2:0.74+random("cx"+i)*0.2;
const cx=(isTall()?0.15+random("cx"+i)*0.7:side)*w,cy=(isTall()?(i%2?0.08:0.86)+random("cy"+i)*0.08:0.1+random("cy"+i)*0.45)*h+Math.sin(t*0.6+i)*S(16);
cube(ctx,cx,cy,S(34+random("cs"+i)*46),t*(0.25+random("cr"+i)*0.35)+i,0.55+0.25*Math.sin(t*0.3+i),cols[i%3],0.75);
}
}else if(kind==="blueprint"){
gradientBg(ctx,BRAND.bg,mix(BRAND.bg,"#000000",0.28),90);
const g1=S(40),g2=S(200),ox=(t*S(10))%g2,oy=(t*S(6))%g2;
ctx.lineWidth=S(1);
ctx.strokeStyle=rgba(BRAND.text,0.07);ctx.beginPath();
for(let x=-g2+ox;x<w;x+=g1){ctx.moveTo(x,0);ctx.lineTo(x,h);}
for(let y=-g2+oy;y<h;y+=g1){ctx.moveTo(0,y);ctx.lineTo(w,y);}
ctx.stroke();ctx.strokeStyle=rgba(BRAND.text,0.17);ctx.lineWidth=S(1.5);ctx.beginPath();
for(let x=-g2+ox;x<w;x+=g2){ctx.moveTo(x,0);ctx.lineTo(x,h);}
for(let y=-g2+oy;y<h;y+=g2){ctx.moveTo(0,y);ctx.lineTo(w,y);}
ctx.stroke();
softLight(ctx,w*(0.5+0.3*Math.sin(t*0.2)),h*0.3,M*0.5,BRAND.secondary,0.12);
ctx.strokeStyle=rgba(BRAND.text,0.45);ctx.lineWidth=S(2);const m=S(46),k=S(26);
[[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x,y+sy*k);ctx.lineTo(x,y);ctx.lineTo(x+sx*k,y);ctx.stroke();});
}else if(kind==="sunset"){
const hz=h*(isTall()?0.6:0.62),sky=vGrad(ctx,0,hz,BRAND.bg,mix(BRAND.primary,BRAND.bg,0.5));
ctx.fillStyle=sky;ctx.fillRect(0,0,w,hz);
for(let i=0;i<40;i++){const a=0.25+0.5*(0.5+0.5*Math.sin(t*2+i*3.1));circle(ctx,random("st"+i)*w,random("sy"+i)*hz*0.7,S(1+random("sr"+i)*1.6),rgba("#FFFFFF",a));}
const R=Math.min(w,h)*0.24,sx=w/2,sy=hz-R*0.32;
blob(ctx,sx,sy,R*2.2,BRAND.primary,0.35);
ctx.save();ctx.beginPath();ctx.arc(sx,sy,R,0,Math.PI*2);ctx.clip();
ctx.fillStyle=vGrad(ctx,sy-R,sy+R,BRAND.secondary,BRAND.primary);ctx.fillRect(sx-R,sy-R,R*2,R*2);
ctx.fillStyle=sky;
for(let i=0;i<7;i++){const y=sy+R*(0.05+i*0.15)+((t*S(8))%(R*0.15)),th=R*(0.012+i*0.012);ctx.fillRect(sx-R,y,R*2,th);}
ctx.restore();
ctx.fillStyle=BRAND.bg;ctx.fillRect(0,hz,w,h-hz);
ctx.save();ctx.beginPath();ctx.rect(0,hz,w,h-hz);ctx.clip();ctx.strokeStyle=rgba(BRAND.primary,0.7);ctx.lineWidth=S(2);
for(let i=0;i<14;i++){const z=(i+(t*0.6)%1)/14,y=hz+(h-hz)*z*z;ctx.globalAlpha=z;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
ctx.globalAlpha=0.7;for(let i=-14;i<=14;i++){ctx.beginPath();ctx.moveTo(w/2+i*w*0.012,hz);ctx.lineTo(w/2+i*w*0.15,h);ctx.stroke();}
ctx.restore();
ctx.fillStyle=hGrad(ctx,0,w,rgba(BRAND.secondary,0),rgba(BRAND.secondary,0.9));ctx.fillRect(0,hz-S(1.5),w/2,S(3));
ctx.fillStyle=hGrad(ctx,w/2,w,rgba(BRAND.secondary,0.9),rgba(BRAND.secondary,0));ctx.fillRect(w/2,hz-S(1.5),w/2,S(3));
}else if(kind==="mesh"){
blob(ctx,w*(0.18+0.08*Math.sin(t*0.3)),h*(0.22+0.08*Math.cos(t*0.25)),M*0.55,BRAND.primary,0.26);
blob(ctx,w*(0.86+0.06*Math.cos(t*0.27)),h*(0.3+0.1*Math.sin(t*0.2)),M*0.5,BRAND.accent,0.2);
blob(ctx,w*(0.6+0.1*Math.sin(t*0.22+1)),h*(0.92+0.05*Math.cos(t*0.3)),M*0.55,BRAND.secondary,0.22);
blob(ctx,w*(0.1+0.05*Math.cos(t*0.35)),h*0.95,M*0.4,BRAND.accent,0.1);
}else if(kind==="iso"){
gradientBg(ctx,BRAND.bg,BRAND.surface,90);
softLight(ctx,w*0.5,h*0.55,M*0.6,BRAND.primary,0.18);
const g1=S(70),tn=Math.tan(Math.PI/6),off=(t*S(14))%(g1*2);
ctx.strokeStyle=rgba(BRAND.primary,0.13);ctx.lineWidth=S(1.2);ctx.beginPath();
for(let k=-M*2;k<M*2;k+=g1*2){const c=k+off;
ctx.moveTo(0,c);ctx.lineTo(w,c+w*tn);ctx.moveTo(0,c+w*tn);ctx.lineTo(w,c);}
ctx.stroke();
const cols=[BRAND.primary,BRAND.secondary,BRAND.accent];
for(let i=0;i<7;i++){
const edge=i%2?0.05+random("ix"+i)*0.2:0.75+random("ix"+i)*0.2;
const cx=(isTall()?0.12+random("ix"+i)*0.76:edge)*w,cy=(isTall()?(i%2?0.07:0.86)+random("iy"+i)*0.08:0.12+random("iy"+i)*0.72)*h;
cube(ctx,cx,cy+Math.sin(t*0.9+i*1.7)*S(14),S(30+random("is"+i)*40),Math.PI/4,0.6155,cols[i%3],0.85);
}
}else if(kind==="whiteboard"){
for(let i=0;i<5;i++)blob(ctx,random("wx"+i)*w,random("wy"+i)*h,M*(0.12+random("wr"+i)*0.16),"#8A8F98",0.05);
const m=S(16);ctx.strokeStyle="rgba(0,0,0,0.10)";ctx.lineWidth=S(10);ctx.strokeRect(m,m,w-m*2,h-m*2);
ctx.strokeStyle="rgba(255,255,255,0.9)";ctx.lineWidth=S(2);ctx.strokeRect(m+S(6),m+S(6),w-m*2-S(12),h-m*2-S(12));
blob(ctx,w*(0.25+0.04*Math.sin(t*0.2)),h*0.15,M*0.4,"#FFFFFF",0.7);
}else if(kind==="chalk"){
gradientBg(ctx,mix(BRAND.bg,"#FFFFFF",0.04),mix(BRAND.bg,"#000000",0.25),120);
ctx.save();ctx.lineCap="round";
for(let i=0;i<9;i++){const cx=random("cx"+i)*w,cy=random("cy"+i)*h,r=M*(0.08+random("cr"+i)*0.14);
ctx.strokeStyle=rgba("#FFFFFF",0.035);ctx.lineWidth=r*0.5;ctx.beginPath();ctx.arc(cx,cy,r,random("ca"+i)*6,random("ca"+i)*6+2.4);ctx.stroke();}
ctx.restore();
const fr=S(22);ctx.strokeStyle="#6B4A2E";ctx.lineWidth=fr;ctx.strokeRect(fr/2,fr/2,w-fr,h-fr);
ctx.strokeStyle="rgba(0,0,0,0.35)";ctx.lineWidth=S(3);ctx.strokeRect(fr,fr,w-fr*2,h-fr*2);
particles(ctx,g,{count:24,color:"#FFFFFF",speed:0.15,maxR:1.6,alpha:0.35});
}else if(kind==="halftone"){
const sp=S(30),cx0=w*0.92,cy0=h*0.08,R=Math.hypot(w,h)*0.75,pulse=0.85+0.15*Math.sin(t*1.2);
ctx.fillStyle=rgba(BRAND.accent,0.55);
for(let y=sp/2;y<h;y+=sp)for(let x=sp/2+((y/sp)%2)*sp/2;x<w;x+=sp){
const d=1-Math.hypot(x-cx0,y-cy0)/R;if(d<=0.05)continue;
ctx.beginPath();ctx.arc(x,y,sp*0.42*d*pulse,0,Math.PI*2);ctx.fill();}
ctx.save();ctx.translate(w*0.1,h*0.95);ctx.strokeStyle=rgba(BRAND.text,0.06);ctx.lineWidth=S(5);
for(let i=0;i<26;i++){const a=-Math.PI/2+(i/25-0.5)*1.6+Math.sin(t*0.4)*0.05;ctx.beginPath();ctx.moveTo(Math.cos(a)*M*0.35,Math.sin(a)*M*0.35);ctx.lineTo(Math.cos(a)*M*1.3,Math.sin(a)*M*1.3);ctx.stroke();}
ctx.restore();
}else if(kind==="papercut"){
blob(ctx,w*0.78,h*0.3,M*0.4,BRAND.accent,0.35);
circle(ctx,w*0.78,h*(0.3+0.01*Math.sin(t*0.6)),Math.min(w,h)*0.09,BRAND.accent);
const layers=[[0.58,mix(BRAND.bg,BRAND.secondary,0.35),0.18],[0.68,mix(BRAND.bg,BRAND.secondary,0.6),0.32],[0.78,mix(BRAND.bg,BRAND.primary,0.55),0.5],[0.88,mix(BRAND.bg,BRAND.primary,0.85),0.8]];
layers.forEach(([base,col,sp],li)=>{
const amp=h*(0.05-li*0.006),fq=2.2+li*0.9,sh=t*sp*0.25+li*1.7;
ctx.save();if(!PERF.fast){ctx.shadowColor="rgba(60,30,10,0.28)";ctx.shadowBlur=S(26);ctx.shadowOffsetY=-S(6);}
ctx.beginPath();ctx.moveTo(0,h);
for(let x=0;x<=w+S(20);x+=S(20))ctx.lineTo(x,h*base+Math.sin(x/w*fq*Math.PI+sh)*amp+Math.sin(x/w*fq*2.7+sh*1.3)*amp*0.35);
ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.restore();});
}else if(kind==="swiss"){
ctx.strokeStyle=rgba(BRAND.text,0.06);ctx.lineWidth=S(1.5);const cols=isTall()?6:12;
for(let i=1;i<cols;i++){const x=w*i/cols;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
const R=Math.min(w,h)*0.26;circle(ctx,w*(0.97+0.015*Math.sin(t*0.4)),h*0.12,R,BRAND.accent);
ctx.fillStyle=BRAND.text;ctx.fillRect(-S(10)+Math.sin(t*0.35)*S(30),h*0.9,w*0.28,S(18));
ctx.fillStyle=BRAND.secondary;ctx.fillRect(w*0.06,h*(0.1+0.01*Math.cos(t*0.5)),S(40),S(40));
}else if(kind==="pixel"){
const P=Math.max(4,Math.round(S(12))),bands=8;
for(let i=0;i<bands;i++){ctx.fillStyle=mix(BRAND.bg,BRAND.surface,i/(bands-1));ctx.fillRect(0,Math.floor(h*i/bands/P)*P,w,Math.ceil(h/bands/P+1)*P);}
for(let i=0;i<46;i++){if(Math.floor(t*2+i*7)%5===0)continue;const x=Math.floor(random("px"+i)*w/P)*P,y=Math.floor(random("py"+i)*h*0.6/P)*P;
ctx.fillStyle=rgba("#FFFFFF",0.4+0.5*random("pa"+i));ctx.fillRect(x,y,P*(i%7===0?2:1),P*(i%7===0?2:1));}
const scroll=Math.floor(t*3)*P;
[[0.78,mix(BRAND.surface,BRAND.secondary,0.25),0.5],[0.86,mix(BRAND.bg,"#000000",0.35),1]].forEach(([base,col,sp],li)=>{
ctx.fillStyle=col;
for(let x=-P*4;x<w+P*4;x+=P*2){const gx=x+(scroll*sp)%(P*2),k=Math.floor((x+scroll*sp)/(P*2));
const hh=Math.floor((Math.sin(k*0.37+li)*0.5+Math.sin(k*0.11+li*3)*0.5+1)*4+2)*P;
ctx.fillRect(gx,Math.floor(h*base/P)*P-hh,P*2,h);}});
}else if(kind==="watercolor"){
ctx.save();ctx.globalCompositeOperation="multiply";
const cols=[BRAND.primary,BRAND.secondary,BRAND.accent,BRAND.primary];
for(let i=0;i<4;i++){
const bx=w*[0.12,0.88,0.75,0.2][i]+Math.sin(t*0.15+i)*S(20),by=h*[0.18,0.2,0.9,0.88][i]+Math.cos(t*0.12+i)*S(14),R=M*(0.2+random("wr"+i)*0.1);
for(let k=0;k<7;k++)blob(ctx,bx+(random("wkx"+i+k)-0.5)*R*0.9,by+(random("wky"+i+k)-0.5)*R*0.7,R*(0.45+random("wks"+i+k)*0.5),cols[i],0.13);
ctx.strokeStyle=rgba(cols[i],0.09);ctx.lineWidth=S(3);ctx.beginPath();
for(let a=0;a<=6.3;a+=0.3){const rr=R*(0.62+0.12*Math.sin(a*3+i)+0.06*Math.sin(a*7+i*2));ctx[a?"lineTo":"moveTo"](bx+Math.cos(a)*rr,by+Math.sin(a)*rr*0.8);}
ctx.closePath();ctx.stroke();
}
ctx.restore();
}else if(kind==="dotgrid"){
const sp=S(36);ctx.fillStyle=rgba(BRAND.text,0.12);
for(let y=sp/2;y<h;y+=sp)for(let x=sp/2;x<w;x+=sp)ctx.fillRect(x-S(1.5),y-S(1.5),S(3),S(3));
blob(ctx,w*(0.9+0.03*Math.sin(t*0.3)),h*0.12,M*0.35,BRAND.primary,0.1);blob(ctx,w*0.05,h*0.95,M*0.3,BRAND.accent,0.08);
}else if(kind==="terminal"){
gradientBg(ctx,BRAND.bg,mix(BRAND.bg,BRAND.primary,0.05),90);
const cw=S(34),chars="01<>/{}[]=+*#$%&ABCDEF0123456789";
ctx.font=`500 ${Math.round(S(22))}px "JetBrains Mono", monospace`;ctx.textAlign="center";ctx.textBaseline="middle";
for(let c=0;c<w/cw;c++){if(random("tc"+c)<0.45)continue;
const sp=0.5+random("ts"+c),head=((random("th"+c)*h*1.6+t*S(140)*sp)%(h*1.6))-h*0.3;
for(let k=0;k<14;k++){const y=head-k*S(28);if(y<-S(20)||y>h+S(20))continue;
const ch=chars[Math.floor(random("tk"+c+"_"+k+"_"+Math.floor(t*4+k))*chars.length)];
ctx.fillStyle=rgba(k===0?"#FFFFFF":BRAND.primary,(k===0?0.35:0.2)*(1-k/14));ctx.fillText(ch,c*cw+cw/2,y);}}
ctx.fillStyle="rgba(0,0,0,0.18)";for(let y=0;y<h;y+=S(4))ctx.fillRect(0,y,w,S(1.5));
softLight(ctx,w*0.5,h*0.5,M*0.5,BRAND.primary,0.06);
}else if(kind==="auroralines"){
blob(ctx,w*(0.3+0.1*Math.sin(t*0.13)),-h*0.1,M*0.75,BRAND.primary,0.32);
blob(ctx,w*(0.75+0.08*Math.cos(t*0.11)),h*0.05,M*0.6,BRAND.secondary,0.22);
blob(ctx,w*(0.55+0.1*Math.sin(t*0.17+2)),h*0.2,M*0.35,BRAND.accent,0.12);
ctx.save();ctx.lineWidth=S(1.2);
for(let i=0;i<6;i++){const yy=h*(0.55+i*0.08),ph=t*0.25+i;
ctx.strokeStyle=hGrad(ctx,0,w,rgba(BRAND.secondary,0),rgba(i%2?BRAND.accent:BRAND.secondary,0.35-i*0.04));
ctx.beginPath();for(let x=0;x<=w;x+=S(30))ctx[x?"lineTo":"moveTo"](x,yy+Math.sin(x/w*3+ph)*S(24)-(x/w)*S(60));ctx.stroke();}
ctx.restore();
}else if(kind==="dots"){
const sp=S(24),r=sp*0.32,ox=w*(0.5+0.3*Math.sin(t*0.21)),oy=h*(0.5+0.3*Math.cos(t*0.17));
ctx.fillStyle="#262626";ctx.beginPath();
const lit=[];
for(let y=sp/2;y<h;y+=sp)for(let x=sp/2;x<w;x+=sp){
const v=Math.sin(Math.hypot(x-ox,y-oy)/S(70)-t*3);if(v>0.965)lit.push(x,y);else{ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.2832);}}
ctx.fill();ctx.fillStyle=rgba(BRAND.primary,0.38);ctx.beginPath();
for(let i=0;i<lit.length;i+=2){ctx.moveTo(lit[i]+r,lit[i+1]);ctx.arc(lit[i],lit[i+1],r,0,6.2832);}ctx.fill();
}else if(kind==="glassworld"){
gradientBg(ctx,BRAND.surface,BRAND.bg,90);
blob(ctx,w*(0.15+0.05*Math.sin(t*0.2)),h*0.25,M*0.45,BRAND.primary,0.45);
blob(ctx,w*(0.85+0.05*Math.cos(t*0.17)),h*0.3,M*0.4,BRAND.secondary,0.3);
blob(ctx,w*(0.7+0.06*Math.sin(t*0.15)),h*0.9,M*0.4,BRAND.accent,0.25);
blob(ctx,w*0.2,h*0.85,M*0.3,"#FF5FA8",0.18);
const cam={yaw:t*0.05,pitch:0.12,dist:12},items=[];
for(let i=0;i<9;i++){const a=random("gw"+i)*6.283,R=7+random("gr"+i)*4;
items.push([Math.cos(a)*R,(random("gy"+i)-0.5)*5+Math.sin(t*0.6+i)*0.25,Math.sin(a)*R,0.3+random("gs"+i)*0.4,i]);}
items.map(o=>[...proj(o[0],o[1],o[2],cam),o[3],o[4]]).sort((a,b)=>b[3]-a[3]).forEach(([sx,sy,k,z,rr,i])=>{
if(z<7)return;const near=clamp(1.2-z/22);
if(i%3===0){ctx.save();ctx.strokeStyle=rgba(BRAND.secondary,0.5*near);ctx.lineWidth=Math.max(1,rr*k*0.12);ctx.beginPath();ctx.ellipse(sx,sy,rr*k,rr*k*0.38,0.3+i,0,6.283);ctx.stroke();ctx.restore();}
else ball(ctx,sx,sy,rr*k,[BRAND.primary,BRAND.secondary,"#FF5FA8"][i%3],"glossy",0.85*near);});
const pts=[[0.02,0.9],[0.28,0.8],[0.55,0.88],[0.8,0.76],[1.02,0.82]].map(([x,y])=>[x*w,y*h]),pr=clamp(g/Math.max(1,TL.total-1))*0.92+0.08;
ctx.save();ctx.globalAlpha=0.45;
withGlow(ctx,BRAND.accent,1.2,c=>{const tp=drawPath(c,pts,pr,{color:rgba(BRAND.accent,0.8),width:S(5)});circle(c,tp[0],tp[1],S(9),"#FFFFFF");});
ctx.restore();
particles(ctx,g,{count:40,color:"#FFFFFF",speed:0.2,maxR:1.5,alpha:0.5});
}else if(kind==="metal"){
gradientBg(ctx,"#1C1E24",BRAND.bg,90);
const hz=h*(isTall()?0.74:0.66),cam={yaw:Math.sin(t*0.12)*(isTall()?0.06:0.25),pitch:0.16,dist:11,cy:hz-h*0.05};
ctx.fillStyle=vGrad(ctx,hz,h,"#15171B","#07080A");ctx.fillRect(0,hz,w,h-hz);
ctx.fillStyle=hGrad(ctx,0,w,"rgba(255,255,255,0)","rgba(255,255,255,0.14)");ctx.fillRect(0,hz,w/2,S(2));
ctx.fillStyle=hGrad(ctx,w/2,w,"rgba(255,255,255,0.14)","rgba(255,255,255,0)");ctx.fillRect(w/2,hz,w/2,S(2));
blob(ctx,w*0.5,h*0.05,M*0.45,"#FFB070",0.08);
const sph=isTall()?[[-4.2,0.6,1.5],[4.3,0.75,1.0],[-4.6,0.45,-2.5],[4.8,0.4,-3.5]]:[[-10.2,0.8,1.0],[-8.6,0.5,-2.4],[10.0,1.0,0.4],[8.6,0.55,-2.8],[11.8,0.45,-4.5]];
sph.map(([x,r,z],i)=>{const lift=Math.max(0,Math.sin(t*1.1+i*1.7))*0.25*(i%2);return[...proj(x,r+lift,z,cam),r,i,lift,proj(x,0,z,cam)];})
.sort((a,b)=>b[3]-a[3]).forEach(([sx,sy,k,z,r,i,lift,fl])=>{
ctx.save();ctx.translate(fl[0],fl[1]);ctx.scale(1,0.22);circle(ctx,0,0,r*k*1.05,"rgba(0,0,0,0.55)");ctx.restore();
ctx.save();ctx.globalAlpha=0.22;ctx.translate(sx,fl[1]*2-sy);ctx.scale(1,-1);ball(ctx,0,0,r*k,BRAND.accent,"chrome");ctx.restore();
ball(ctx,sx,sy,r*k,BRAND.accent,"chrome");
if(i===0)withGlow(ctx,BRAND.accent,1,c=>{c.strokeStyle=rgba(BRAND.accent,0.8+0.2*Math.sin(t*3));c.lineWidth=S(3);c.beginPath();c.ellipse(fl[0],fl[1],r*k*1.6,r*k*0.36,0,0,6.283);c.stroke();});});
}else if(kind==="clay"){
gradientBg(ctx,"#FBF8F3","#ECE6DC",90);
const cam={yaw:isTall()?Math.sin(t*0.1)*0.06:0.5+Math.sin(t*0.1)*0.12,pitch:0.55,dist:15,cy:h*0.42};
dotFloor(ctx,cam,{color:"#B9B2A6",gap:0.7,size:0.06,reach:14,alpha:0.7});
const cols=["#F29E7C","#6FB6EA","#F2CF5B","#7FD1A6","#B39CE8"];
const objs=isTall()?[[-5.6,0.8,-6],[5.8,1.0,-7],[-6.8,0.6,7],[6.8,0.7,7.5]]:[[-10,1.0,-1],[-8.5,0.6,3],[10,1.2,-2.5],[8.8,0.7,2.5],[-11.5,0.8,-7],[11.5,0.7,-7.5],[-7,0.45,6.5]];
objs.map(([x,r,z],i)=>{const b=Math.abs(Math.sin(t*1.4+i*1.3))*0.35*(i%3===0?1:0);return[...proj(x,r+b,z,cam),r,i,b,proj(x,0,z,cam)];})
.sort((a,b)=>b[3]-a[3]).forEach(([sx,sy,k,z,r,i,b,fl])=>{
ctx.save();ctx.translate(fl[0],fl[1]);ctx.scale(1,0.4);circle(ctx,0,0,r*k*(1-b*0.4),"rgba(80,60,40,0.16)");ctx.restore();
ball(ctx,sx,sy,r*k,cols[i%cols.length],"clay");});
}else if(kind==="holo"){
gradientBg(ctx,BRAND.bg,mix(BRAND.bg,BRAND.secondary,0.6),90);
for(let i=0;i<120;i++)circle(ctx,random("hs"+i)*w,random("hy"+i)*h,S(0.8+random("hr"+i)*1.4),rgba("#CFE9FF",0.2+0.4*(0.5+0.5*Math.sin(t*1.5+i))));
const R=Math.min(w,h)*(isTall()?0.3:0.36),gx=isTall()?w*0.5:w*0.72,gy=isTall()?h*0.3:h*0.5,rot=t*0.18;
blob(ctx,gx,gy,R*1.6,BRAND.primary,0.12);circle(ctx,gx,gy,R,rgba(BRAND.surface,0.85));
withGlow(ctx,BRAND.primary,0.8,c=>circle(c,gx,gy,R,null,rgba(BRAND.primary,0.45),S(2)));
const N=1100,ga=Math.PI*(3-Math.sqrt(5));ctx.fillStyle=BRAND.primary;
for(let i=0;i<N;i++){const yy=1-(i/(N-1))*2,rr=Math.sqrt(1-yy*yy),th=ga*i,lon=th%6.283,lat=Math.asin(yy);
const land=Math.sin(lon*2.1+1.3)*Math.cos(lat*3.2)+Math.sin(lon*4.7-lat*2.2)*0.55+Math.cos(lon*1.3+lat*5.1)*0.35;if(land<0.35)continue;
const x=Math.cos(th+rot)*rr,z=Math.sin(th+rot)*rr;if(z<-0.05)continue;
ctx.globalAlpha=0.25+0.75*z;const s2=S(2.2)*(0.6+0.4*z);ctx.fillRect(gx+x*R-s2/2,gy-yy*R-s2/2,s2,s2);}
ctx.globalAlpha=1;
const P=(lon,lat)=>{const x=Math.cos(lon+rot)*Math.cos(lat),z=Math.sin(lon+rot)*Math.cos(lat);return[gx+x*R,gy-Math.sin(lat)*R,z];};
[[0.3,0.6,2.0,0.2],[2.0,0.2,3.4,0.7],[0.3,0.6,3.4,0.7]].forEach(([l1,a1,l2,a2],i)=>{
const p=clamp(((t*0.3+i*0.33)%1.2)),A=P(l1,a1),B=P(l2,a2);if(A[2]<0||B[2]<0)return;
const mx=(A[0]+B[0])/2+(gy-(A[1]+B[1])/2)*0.0,my=Math.min(A[1],B[1])-R*0.35;
ctx.save();withGlow(ctx,BRAND.accent,1,c=>{c.strokeStyle=BRAND.accent;c.lineWidth=S(2.5);c.beginPath();c.moveTo(A[0],A[1]);
for(let q=0.05;q<=p+0.001;q+=0.05){const u=1-q;c.lineTo(u*u*A[0]+2*u*q*mx+q*q*B[0],u*u*A[1]+2*u*q*my+q*q*B[1]);}c.stroke();});
circle(ctx,A[0],A[1],S(5),BRAND.accent);if(p>=1){circle(ctx,B[0],B[1],S(6),"#FFFFFF");circle(ctx,B[0],B[1],S(10+8*((t*2)%1)),null,rgba(BRAND.accent,1-(t*2)%1),S(2));}ctx.restore();});
const m=S(40),k=S(30);ctx.strokeStyle=rgba(BRAND.primary,0.6);ctx.lineWidth=S(2);
[[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x,y+sy*k);ctx.lineTo(x,y);ctx.lineTo(x+sx*k,y);ctx.stroke();});
const tc=`T+${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(Math.floor((t % 1) * 30)).padStart(2, "0")}`;
text(ctx,tc,w-m-S(10),m+S(4),{size:S(20),family:"JetBrains Mono",weight:500,color:rgba(BRAND.primary,0.8),align:"right",depth:0});
}else if(kind==="paperland"){
const cam={yaw:0.6+Math.sin(t*0.08)*0.15,pitch:0.5,dist:16,cy:h*(isTall()?0.5:0.4)};
dotFloor(ctx,cam,{color:"#C9C3B8",gap:0.8,size:0.06,reach:16,alpha:0.8});
const Z=(x,z)=>Math.sin(x*0.55+t*0.6)*Math.cos(z*0.45-t*0.4)*1.1+1.2,N=22,S0=9;
ctx.save();ctx.lineWidth=S(1.4);
for(let pass=0;pass<2;pass++)for(let a=0;a<=N;a++){ctx.beginPath();
for(let b=0;b<=N;b++){const u=-S0+2*S0*(pass?a:b)/N,v=-S0+2*S0*(pass?b:a)/N,[sx,sy]=proj(u,Z(u,v),v,cam);ctx[b?"lineTo":"moveTo"](sx,sy);}
ctx.strokeStyle=rgba(BRAND.primary,0.22+0.2*(a/N));ctx.stroke();}
ctx.restore();
const bu=Math.sin(t*0.35)*6,bv=Math.cos(t*0.27)*6,[bx,by,bk]=proj(bu,Z(bu,bv)+0.35,bv,cam);
withGlow(ctx,BRAND.accent,0.6,c=>circle(c,bx,by,0.35*bk,BRAND.accent));
const m=S(56);ctx.fillStyle=rgba(BRAND.text,0.85);ctx.fillRect(m,m,w-m*2,S(2));
text(ctx,String(VIDEO.title||"").replace(/-/g," ").toUpperCase(),m,m+S(24),{size:S(18),family:"JetBrains Mono",weight:500,color:BRAND.muted,align:"left",depth:0});
const si=sceneAt(g);text(ctx,`${String(si + 1).padStart(2, "0")} / ${String(TL.scenes.length).padStart(2, "0")}`,w-m,m+S(24),{size:S(18),family:"JetBrains Mono",weight:500,color:BRAND.muted,align:"right",depth:0});
}else if(kind==="storybook"){
blob(ctx,w*0.5,-h*0.1,M*0.7,BRAND.secondary,0.25);
blob(ctx,w*0.8,h*0.22,M*0.25,BRAND.primary,0.35);circle(ctx,w*0.8,h*(0.22+0.01*Math.sin(t*0.5)),Math.min(w,h)*0.07,rgba(BRAND.primary,0.8));
for(let i=0;i<3;i++){const cx=((random("cl"+i)*w+t*S(14)*(1+i*0.3))%(w+S(400)))-S(200),cy=h*(0.12+i*0.09);
[[0,0,60],[55,10,45],[-55,12,42],[25,-25,40]].forEach(([dx,dy,r])=>circle(ctx,cx+S(dx),cy+S(dy),S(r),rgba("#FFFFFF",0.85)));}
[[0.74,mix(BRAND.bg,BRAND.accent,0.45),0.08],[0.84,mix(BRAND.bg,BRAND.accent,0.75),0.15]].forEach(([base,col,sp],li)=>{
ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w+S(30);x+=S(30))ctx.lineTo(x,h*base+Math.sin(x/w*(3+li)+t*sp+li*2)*h*0.04);ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=col;ctx.fill();});
}else if(kind==="riso"){
ctx.save();ctx.globalCompositeOperation="multiply";
[[BRAND.primary,0.92,0.1,0],[BRAND.secondary,0.08,0.92,S(5)]].forEach(([col,ax,ay,off])=>{
const sp=S(26),R=Math.hypot(w,h)*0.7;ctx.fillStyle=rgba(col,0.55);
for(let y=sp/2;y<h;y+=sp)for(let x=sp/2;x<w;x+=sp){const d=1-Math.hypot(x-w*ax,y-h*ay)/R;if(d<0.2)continue;
ctx.beginPath();ctx.arc(x+off,y+off,sp*0.45*(d-0.2)*(0.92+0.08*Math.sin(t)),0,6.283);ctx.fill();}});
ctx.restore();
}else if(kind==="maths"){
const sp=S(80),ox=w/2,oy=h*0.62;ctx.lineWidth=S(1);
ctx.strokeStyle=rgba("#FFFFFF",0.06);ctx.beginPath();
for(let x=ox%sp;x<w;x+=sp){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=oy%sp;y<h;y+=sp){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
ctx.strokeStyle=rgba("#FFFFFF",0.2);ctx.lineWidth=S(2);ctx.beginPath();ctx.moveTo(0,oy);ctx.lineTo(w,oy);ctx.moveTo(ox,0);ctx.lineTo(ox,h);ctx.stroke();
const cyc=(t%10)/10,pts=[];for(let x=0;x<=w*Math.min(1,cyc*1.4);x+=S(8))pts.push([x,oy-Math.sin((x-ox)/sp*1.2+t*0.4)*sp*1.2]);
if(pts.length>1){ctx.save();ctx.globalAlpha=0.35*(1-clamp((cyc-0.85)/0.15));drawPath(ctx,pts,1,{color:BRAND.primary,width:S(4)});ctx.restore();}
}else if(kind==="flatspace"){
for(let i=0;i<50;i++)circle(ctx,random("fs"+i)*w,random("fy"+i)*h,S(1.5+random("fr"+i)*2),rgba("#FFFFFF",0.25+0.3*random("fa"+i)));
[[0.88,0.2,0.16,BRAND.primary],[0.1,0.82,0.11,BRAND.secondary],[0.7,0.92,0.06,BRAND.accent]].forEach(([px,py,pr,col],i)=>{
const x=w*px+Math.sin(t*0.2+i)*S(14),y=h*py+Math.cos(t*0.17+i)*S(10),R=Math.min(w,h)*pr;
ctx.save();ctx.beginPath();ctx.moveTo(x-R*0.707,y+R*0.707);ctx.lineTo(x-R*0.707+M,y+R*0.707+M);ctx.lineTo(x+R*0.707+M,y-R*0.707+M);ctx.lineTo(x+R*0.707,y-R*0.707);ctx.closePath();
ctx.fillStyle="rgba(0,0,0,0.18)";ctx.fill();ctx.restore();
circle(ctx,x,y,R,col);circle(ctx,x-R*0.25,y-R*0.2,R*0.28,rgba("#FFFFFF",0.14));
if(i===0){ctx.strokeStyle=rgba("#FFFFFF",0.3);ctx.lineWidth=S(3);ctx.beginPath();ctx.ellipse(x,y,R*1.7,R*0.45,-0.3,0,6.283);ctx.stroke();}});
}else if(kind==="deco"){
gradientBg(ctx,"#1E1913",BRAND.bg,90);
ctx.save();ctx.translate(w/2,h*1.05);ctx.strokeStyle=rgba(BRAND.primary,0.22);ctx.lineWidth=S(2);
for(let i=0;i<=24;i++){const a=Math.PI+i/24*Math.PI;ctx.beginPath();ctx.moveTo(Math.cos(a)*M*0.12,Math.sin(a)*M*0.12);ctx.lineTo(Math.cos(a)*M*1.2,Math.sin(a)*M*1.2);ctx.stroke();}
[0.2,0.32].forEach(r=>{ctx.beginPath();ctx.arc(0,0,M*r,Math.PI,2*Math.PI);ctx.stroke();});ctx.restore();
const m=S(36),m2=S(52);ctx.strokeStyle=rgba(BRAND.primary,0.75);ctx.lineWidth=S(2.5);ctx.strokeRect(m,m,w-m*2,h-m*2);
ctx.lineWidth=S(1.2);ctx.strokeRect(m2,m2,w-m2*2,h-m2*2);
const nb=isTall()?9:15;for(let i=0;i<nb;i++){const x=w*(i+0.5)/nb,on=(Math.floor(t*4)-i)%nb===0||(Math.floor(t*4)+i)%nb===0;
circle(ctx,x,m*0.5+S(4),S(5),on?"#FFF3C4":rgba(BRAND.primary,0.35));if(on&&!PERF.fast)blob(ctx,x,m*0.5+S(4),S(26),"#FFE08A",0.5);}
}else if(kind==="spotlight"){
softLight(ctx,w*0.5,h*(0.34+0.03*Math.sin(t*0.5)),M*0.62,BRAND.primary,0.09+0.02*Math.sin(t*0.7));
softLight(ctx,w*0.5,h*1.1,M*0.5,BRAND.accent,0.07);
}else{
gradientBg(ctx,BRAND.bg,BRAND.surface,135);
}
if(LOOK.particles)particles(ctx,g,{count:LOOK.particles,color:BRAND.primary,speed:0.4,maxR:3,alpha:0.8});
}
let GRAIN=null;
function grainTile(){
if(GRAIN!==null)return GRAIN;
GRAIN=false;
try{
const c=document.createElement("canvas");if(!c.getContext)return GRAIN;
c.width=c.height=256;const g=c.getContext("2d"),img=g.createImageData(256,256);
let s=1234567;
for(let i=0;i<img.data.length;i+=4){s=(Math.imul(s,1664525)+1013904223)>>>0;const v=128+((s>>>24)-128)*0.9;
img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}
g.putImageData(img,0,0);GRAIN=c;
}catch(e){GRAIN=false;}
return GRAIN;
}
function finishFrame(ctx,g){
if(LOOK.vignette>0){
const vg=ctx.createRadialGradient(W()/2,H()/2,Math.min(W(),H())*0.32,W()/2,H()/2,Math.hypot(W(),H())*0.6);
vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,`rgba(0,0,0,${0.6 * LOOK.vignette})`);
ctx.fillStyle=vg;ctx.fillRect(0,0,W(),H());
}
const tile=LOOK.grain>0&&!PERF.fast&&grainTile();
if(tile){
const pat=ctx.createPattern(tile,"repeat");if(!pat)return;
ctx.save();ctx.globalAlpha=0.1*LOOK.grain;ctx.globalCompositeOperation="overlay";
const ox=Math.floor(random("gx"+g)*256),oy=Math.floor(random("gy"+g)*256);
ctx.translate(-ox,-oy);ctx.fillStyle=pat;ctx.fillRect(0,0,W()+256,H()+256);ctx.restore();
}
}
/* =====================================================================
   4b) ENGINE: THE DIRECTOR. Do not edit.
   Turns the FILM plan (section 5) into scenes that live in ONE continuous world:
   every beat is a station on a long stage, the camera travels between stations,
   and the hero rides along a track, so nothing resets, pops or teleports.
   Every element enters the same way (expo-out, 2-3 properties, a small spring
   overshoot, automatic stagger, keyed to the spoken word), idles gently, and
   leaves only when the camera moves on. The director check fixes the plan first.
   ===================================================================== */
const DIRECTOR={fixes:[],beats:[],film:null};
const CALM={damping:14,stiffness:140};
const LIVELY={damping:11,stiffness:160};
const CAM={pre:12,post:28};
const SHOTS=["title","point","stat","steps","compare","quote","screen","finale","custom"];
const STOP=new Set(["the","and","for","with","your","you","our","its","it's","this","that","are","was","but","not","all","one","out","get","has","have","into","from","then","them","they","just","every","here","how"]);
const cleanW=w=>String(w).replace(/[^\p{L}\p{N}%]/gu,"").toLowerCase();
const stack=()=>W()/H()<1.3;
const SP=()=>W()*1.08;
function directorCheck(film){
const fx=[],F={...film},hi=F.energy==="high";
let beats=(Array.isArray(F.beats)?F.beats:[]).map(b=>({...b}));
if(!beats.length){beats=[{shot:"title",title:VIDEO.title||"Your video"}];fx.push("The plan had no beats, so a title beat was added.");}
const icons=beats.map(b=>b.icon).filter(Boolean);
if(!F.hero||(typeof F.hero==="object"&&!F.hero.emoji)){F.hero={emoji:icons[0]||"⭐"};fx.push(`No hero was set, so ${F.hero.emoji} carries the story from beat to beat.`);}
if(typeof F.hero==="string")F.hero={emoji:F.hero};
let counted=0;
beats.forEach((b,i)=>{
const n=i+1;
if(b.draw&&b.shot!=="custom")b.shot="custom";
if(!SHOTS.includes(b.shot)){if(b.shot)fx.push(`Beat ${n}: "${b.shot}" isn't a shot type, so it plays as a point.`);b.shot=b.value!=null?"stat":"point";}
if(b.shot==="point"&&!b.icon){b.icon="bulb";fx.push(`Beat ${n} had no picture, so it shows a light bulb. Pick a kit picture that fits (file 08).`);}
if(Array.isArray(b.props)&&b.props.length>3){b.props=b.props.slice(0,3);fx.push(`Beat ${n}: kept 3 of the small pictures so one thing stays the hero.`);}
if(Array.isArray(b.items)&&b.items.length>4){b.items=b.items.slice(0,4);fx.push(`Beat ${n}: kept 4 steps; more won't read.`);}
if(b.props)b.props=b.props.map(p=>Array.isArray(p)?p:[p,""]);
if(b.items)b.items=b.items.map(p=>Array.isArray(p)?p:["",p]);
const readable=(b.title?1:0)+(b.caption?1:0)+(b.props||[]).filter(p=>p[1]).length+(b.items||[]).length+(b.count?1:0);
if(readable>6){
if(b.caption){delete b.caption;fx.push(`Beat ${n}: dropped the caption, there was too much to read at once.`);}
else if(b.props){b.props=b.props.map(p=>[p[0],""]);fx.push(`Beat ${n}: dropped the small labels, there was too much to read at once.`);}
}
const tw=String(b.title||"").split(/\s+/).filter(Boolean).length;
if(b.shot==="title"?tw>7:tw>5){b.tScale=Math.max(0.6,(b.shot==="title"?7:5)/tw);fx.push(`Beat ${n}: the title has ${tw} words, so it's set smaller. Titles are labels now: ${b.shot === "title" ? "7" : "4"} words or fewer, and the voice says the rest.`);}
const vw=String(b.voice||"").split(/\s+/).filter(Boolean).length;
if(vw>24)fx.push(`Beat ${n}: the voice line has ${vw} words, so the beat holds longer. Split it in two for pace.`);
const calmIdle={bounce:"float",shake:"float",wiggle:"float",spin:"float",jump:"float",hop:"float"};
if(!hi&&calmIdle[b.idle]){fx.push(`Beat ${n}: "${b.idle}" keeps things jumping, so it was calmed to a gentle float.`);b.idle="float";}
if(b.shot==="custom")fx.push(`Beat ${n} is a custom drawing; it fades in and out, but the director can't smooth what's inside it.`);
if(b.count)b.countN=++counted;
});
beats.forEach(b=>{if(b.count)b.countOf=counted;});
for(let i=2;i<beats.length;i++)if(beats[i].shot===beats[i-1].shot&&beats[i].shot===beats[i-2].shot&&beats[i].shot!=="point")
{fx.push(`Beats ${i - 1} to ${i + 1} use the same shot; mixing shots keeps it lively.`);break;}
const words=beats.reduce((a,b)=>a+String(b.voice||"").split(/\s+/).filter(Boolean).length,0);
if(VIDEO.length&&words/2.5>VIDEO.length+2)fx.push(`The voice is about ${Math.round(words / 2.5)}s of speech for a ${VIDEO.length}s video; it will run longer unless lines are trimmed.`);
const fin=beats.findIndex(b=>b.shot==="finale");
if(fin>=0&&fin!==beats.length-1){beats.push(beats.splice(fin,1)[0]);fx.push("The finale was moved to the end.");}
F.beats=beats;return{film:F,fixes:fx};
}
function voicedMap(buf){
if(buf._vm)return buf._vm;const d=buf.getChannelData(0),hop=Math.max(1,Math.round(buf.sampleRate/100)),env=[];
for(let i=0;i<d.length;i+=hop){let s=0;const e=Math.min(d.length,i+hop);for(let k=i;k<e;k++)s+=d[k]*d[k];env.push(Math.sqrt(s/Math.max(1,e-i)));}
const sorted=[...env].sort((a,b)=>a-b),th=(sorted[Math.floor(sorted.length*0.95)]||0)*0.16;
const on=env.map((v,i)=>(env[i-1]||0)+v+(env[i+1]||0)>th*3);const cum=[0];
on.forEach((v,i)=>cum.push(cum[i]+(v?1:0)));
return(buf._vm={cum,step:hop/buf.sampleRate,total:cum[cum.length-1]||1});
}
function wordFrames(i){
const s=TL.scenes[i];if(!s)return null;const line=voiceLine(s);if(!line)return null;
const vw=line.split(/\s+/).filter(Boolean),tot=vw.reduce((a,w)=>a+w.length+1,0),c=liveClip(i),lead=VOICE.leadIn;
let acc=0;const frac=vw.map(w=>{const v=acc/tot;acc+=w.length+1;return v;});
if(!c){const dur=estimateSec(line);return{words:vw,at:frac.map(q=>Math.round((lead+q*dur)*FPS()))};}
const m=voicedMap(c.buffer);
const at=frac.map(q=>{const want=q*m.total;let lo=0,hi=m.cum.length-1;
while(lo<hi){const mid=(lo+hi)>>1;if(m.cum[mid]<want)lo=mid+1;else hi=mid;}
return Math.round((lead+lo*m.step)*FPS());});
return{words:vw,at};
}
function cueFrame(i,label,fallback){
const wf=wordFrames(i);if(!wf||!label)return fallback;
const keys=String(label).split(/\s+/).map(cleanW).filter(w=>w.length>=3&&!STOP.has(w));
for(const k of keys){const j=wf.words.findIndex(w=>{const c=cleanW(w);return c.length>=3&&(c.startsWith(k.slice(0,5))||k.startsWith(c.slice(0,5)));});if(j>=0)return wf.at[j]-3;}
return fallback;
}
function worldScenes(){return TL.scenes.filter(s=>s.world);}
function camAt(g){
const ws=worldScenes(),M=CAM.pre+CAM.post;let k=0;
for(let j=1;j<ws.length;j++)if(g>=ws[j].start-CAM.pre)k=j;
const e=k?Easing.inOutQuart(clamp((g-(ws[k].start-CAM.pre))/M)):1;
let h;if(e<1)h=1-e;else{const ds=ws[k].start+CAM.post,de=(ws[k+1]?ws[k+1].start:TL.total+60)-CAM.pre;h=Easing.inOut(clamp((g-ds)/Math.max(1,de-ds)));}
const mv=k?Math.sin(Math.PI*e):0;
return{x:k?(k-1+e)*SP():0,k,e,mv,zoom:(1+0.03*h)*(1-0.06*mv),lift:-S(22)*mv};
}
function heroHome(){return stack()?-W()*0.3:-W()*0.36;}
function groundY(){return stack()?H()*(isTall()?0.75:0.82):H()*0.82;}
function heroAt(g){
const ws=worldScenes(),M=CAM.pre+CAM.post;let k=0;
for(let j=1;j<ws.length;j++)if(g>=ws[j].start-CAM.pre)k=j;
const e=k?Easing.inOutQuart(clamp((g-(ws[k].start-CAM.pre))/M)):1;
let x=(k?(k-1+e):0)*SP()+heroHome(),mv=k?Math.sin(Math.PI*e):0;
if(!k){const q=clamp((g-4)/34);x+=-W()*0.5*(1-Easing.outBack(q));mv=q<1?Math.sin(Math.PI*q):0;}
return{x,mv,k};
}
function drawWorldBack(ctx,cam,g){
const gy=groundY(),x0=cam.x-W()*0.9,x1=cam.x+W()*0.9;
ctx.save();ctx.translate(-cam.x*0.45,0);
for(let i=Math.floor((x0*0.45-W())/(W()*0.55));i<Math.ceil((x1*0.45+W())/(W()*0.55));i++){
const r=random("wb"+i),cx=i*W()*0.55+r*W()*0.3,cy=H()*(0.18+random("wy"+i)*0.4),rr=S(120+160*random("wr"+i));
softLight(ctx,cx+W()/2,cy,rr,[BRAND.primary,BRAND.secondary,BRAND.accent][Math.abs(i)%3],LIGHT_BG?0.1:0.14);
}
ctx.restore();
ctx.save();ctx.translate(W()/2-cam.x,0);
ctx.fillStyle=hGrad(ctx,x0,cam.x,rgba(BRAND.muted,0),rgba(BRAND.muted,0.4));ctx.fillRect(x0,gy,cam.x-x0,S(3));
ctx.fillStyle=hGrad(ctx,cam.x,x1,rgba(BRAND.muted,0.4),rgba(BRAND.muted,0));ctx.fillRect(cam.x,gy,x1-cam.x,S(3));
if(DIRECTOR.film&&DIRECTOR.film.hero.role!=="none"){
const hx=heroAt(g).x,n=worldScenes().length;
ctx.save();if(ctx.setLineDash)ctx.setLineDash([S(2),S(16)]);ctx.lineCap="round";ctx.strokeStyle=rgba(BRAND.accent,0.85);ctx.lineWidth=S(6);
ctx.beginPath();ctx.moveTo(Math.max(x0,heroHome()-W()*0.2),gy+S(18));ctx.lineTo(Math.min(x1,hx),gy+S(18));ctx.stroke();ctx.restore();
const ws=worldScenes();
for(let i=0;i<n;i++){const mx=i*SP()+heroHome();if(mx<x0-S(40)||mx>x1+S(40))continue;
const reached=hx>=mx-S(4),t=g-(ws[i].start+(i?CAM.post-6:30));
circle(ctx,mx,gy+S(18),S(13),reached?BRAND.accent:rgba(BRAND.muted,0.5));
if(reached&&t>=0&&t<24)circle(ctx,mx,gy+S(18),S(13)+S(34)*Easing.outExpo(t/24),null,rgba(BRAND.accent,1-t/24),S(3));}
}
ctx.restore();
}
function drawHero(ctx,cam,g){
const film=DIRECTOR.film;if(!film||film.hero.role==="none")return;
const h=heroAt(g),size=S(stack()?120:128),gy=groundY(),t=g/FPS();
const x=W()/2+h.x-cam.x,bob=S(5)*Math.abs(Math.sin(t*9))*h.mv,y=gy-size*0.48-bob+Math.sin(t*1.4)*S(2)*(1-h.mv);
ctx.save();ctx.globalAlpha*=(LIGHT_BG?0.18:0.32);ctx.translate(x,gy+S(2));ctx.scale(1,0.2);circle(ctx,0,0,size*0.36,"#000000");ctx.restore();
ctx.save();ctx.translate(x,y);ctx.rotate(-0.07*h.mv);const s=1+Math.sin(t*1.6)*0.012*(1-h.mv);ctx.scale(film.hero.flip?-s:s,s);
withGlow(ctx,BRAND.primary,LOOK.glow*0.5,c=>emoji(c,film.hero.emoji,0,0,size));ctx.restore();
}
function enter(ctx,lf,d,x,y,fn,{from="rise",amp=1}={}){
const cfg=DIRECTOR.film&&DIRECTOR.film.energy==="high"?LIVELY:CALM;
const p=spring({frame:lf,delay:d,config:cfg});if(p<=0.002)return 0;const q=clamp(p);
let dx=0,dy=(1-p)*S(36)*amp,sc=lerp(0.9,1,p),rot=0;
if(from==="slide"){dx=-(1-p)*S(220);dy=0;}
else if(from==="drive"){dx=-(1-Easing.outExpo(clamp((lf-d)/40)))*W()*0.42;dy=0;sc=1;}
else if(from==="drop"){dy=-(1-p)*S(220);}
else if(from==="grow"){sc=lerp(0.3,1,p);dy=0;}
else if(from==="spin"){rot=(1-p)*-1.2;sc=lerp(0.5,1,p);dy=0;}
else if(from==="lift"){dy=(1-p)*S(120);}
ctx.save();ctx.globalAlpha*=clamp(q*1.5);ctx.translate(x+dx,y+dy);if(rot)ctx.rotate(rot);ctx.scale(sc,sc);fn(ctx);ctx.restore();return q;
}
function idleOf(kind,lf,seed){const t=lf/FPS(),ph=seed*1.7;
if(kind==="none")return[0,0,1];if(kind==="float")return[0,Math.sin(t*1.3+ph)*S(7),1];
if(kind==="pulse")return[0,0,1+Math.sin(t*2.4+ph)*0.03];
if(["bounce","jump","hop"].includes(kind))return[0,-Math.abs(Math.sin(t*3+ph))*S(14),1];
return[0,Math.sin(t*1.1+ph)*S(3),1+Math.sin(t*1.6+ph)*0.012];}
function pic(ctx,ch,x,y,size,lf,d,{from,idle="breathe",seed=1,halo=false}={}){
return enter(ctx,lf,d,x,y,c=>{const[ix,iy,is]=idleOf(idle,Math.max(0,lf-d),seed);
if(halo){softLight(c,0,0,size*1.05,BRAND.primary,LIGHT_BG?0.22:0.3);circle(c,0,0,size*0.68,rgba(BRAND.primary,LIGHT_BG?0.1:0.14),rgba(BRAND.primary,0.35),S(2));}
c.save();c.globalAlpha*=LIGHT_BG?0.14:0.28;c.translate(ix,size*0.5);c.scale(1,0.18);circle(c,0,0,size*0.3,"#000000");c.restore();
c.translate(ix,iy);c.scale(is,is);emoji(c,ch,0,0,size);},{from});
}
function burst(ctx,x,y,lf,d){
const t=lf-d;if(t<0||t>30)return;const e=Easing.outExpo(t/30),cols=[BRAND.accent,BRAND.primary,BRAND.secondary];
for(let i=0;i<14;i++){const a=i/14*Math.PI*2+random("bu"+i)*0.4,r=S(60)+S(110)*e*(0.7+random("br"+i)*0.5);
circle(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r,S(7)*(1-e*0.7),rgba(cols[i%3],1-t/30));}
}
function chip(ctx,str,x,y,lf,d){
enter(ctx,lf,d,x,y,c=>{const sz=S(34),w=measure(c,str,sz,700,BRAND.fontBody)+S(48);
roundRect(c,-w/2,-sz*0.9,w,sz*1.8,sz*0.9,BRAND.accent);text(c,str,0,0,{size:sz,weight:700,family:BRAND.fontBody,color:LIGHT_BG||lum(BRAND.accent)<0.5?"#FFFFFF":"#111111"});});
}
function kLine(ctx,str,x,y,lf,d,o={}){if(!str||lf<d-2)return null;const b=DIRECTOR.cur;
if(b&&b.tScale&&str===b.title&&o.size)o={...o,size:o.size*b.tScale};return kText(ctx,str,x,y,lf,{delay:d,stagger:3,config:CALM,...o});}
const SHOT_DRAW={
title(ctx,b,x,lf,D,i){
const st=stack(),a=i?CAM.post-18:10;
if(b.eyebrow)eyebrow(ctx,b.eyebrow,b.icon&&!st?x-W()*0.12:x,H()*(st?0.2:0.3),lf,{delay:a});
const tx=b.icon&&!st?x-W()*0.12:x;
const r=kLine(ctx,b.title,tx,H()*(st?0.3:0.44),lf,a+4,{size:S(st?92:104),highlight:b.highlight||[],maxWidth:W()*(st?0.86:b.icon?0.52:0.72),stagger:4});
if(b.sub)kLine(ctx,b.sub,tx,(r?r.bottom:H()*0.5)+S(60),lf,a+16,{size:S(44),family:BRAND.fontBody,weight:600,color:BRAND.muted,maxWidth:W()*0.7,mode:"fade"});
if(b.icon)pic(ctx,b.icon,x+(st?0:W()*0.27),H()*(st?0.6:0.46),S(st?330:380),lf,a+14,{idle:b.idle||"float",seed:3,halo:true});
},
point(ctx,b,x,lf,D,i){
const st=stack(),a=CAM.post-18,last=D-34,hasProps=(b.props||[]).length>0;
const mx=x+(st||!hasProps?0:-W()*0.13),vy=H()*(st?0.38:0.5),vs=S(st?380:430);
if(b.count)chip(ctx,`${DIRECTOR.film.count || "Step"} ${b.countN} of ${b.countOf}`,x,H()*(st?0.07:0.09),lf,a-4);
kLine(ctx,b.title,x,H()*(st?0.15:0.17),lf,a,{size:S(st?66:72),highlight:b.highlight||[],maxWidth:W()*(st?0.88:0.7)});
pic(ctx,b.icon,mx,vy,vs,lf,a+4,{from:b.move||"rise",idle:b.idle||"breathe",seed:i,halo:true});
const spots=st?[[-0.3,0.2],[0,0.23],[0.3,0.2]]:[[0.15,-0.2],[0.2,0.02],[0.15,0.24]];
let lastIn=a+4;
(b.props||[]).forEach(([ch,lab],j)=>{
const[sx,sy]=spots[j],px=x+W()*sx,py=vy+H()*sy,ps=S(st?150:170);
const d=Math.min(last,Math.max(a+14+j*6,cueFrame(i,lab||b.on&&b.on[j],a+16+j*9)));lastIn=Math.max(lastIn,d);
pic(ctx,ch,px,py,ps,lf,d,{idle:"breathe",seed:i*7+j,from:"rise"});
const lx=st?px:px+ps*0.62;
if(lab)kLine(ctx,lab,lx,st?py+ps*0.68:py,lf,d+4,{size:S(st?40:44),family:BRAND.fontBody,weight:700,color:BRAND.text,maxWidth:st?W()*0.27:Math.min(W()*0.24,W()*0.95-(lx-x+W()/2)),mode:"fade",align:st?"center":"left"});
});
if(b.caption)kLine(ctx,b.caption,mx,Math.min(vy+vs*0.62,H()*(st?0.7:0.76)),lf,Math.min(last,Math.max(a+18,lastIn+6)),{size:S(st?40:44),family:BRAND.fontBody,weight:600,color:BRAND.muted,maxWidth:W()*(st?0.86:0.5),mode:"fade"});
if(b.celebrate??!!b.count){const d=Math.min(D-30,Math.max(a+30,lastIn+14)),cx=mx+vs*0.42,cy=vy-vs*0.4;
burst(ctx,cx,cy,lf,d);pic(ctx,b.badge||"check",cx,cy,S(110),lf,d,{from:"grow",idle:"none"});}
},
stat(ctx,b,x,lf,D,i){
const st=stack(),a=CAM.post-18,y=H()*(st?0.36:0.42);
if(b.title)kLine(ctx,b.title,x,H()*(st?0.16:0.2),lf,a,{size:S(st?70:76),maxWidth:W()*0.7});
if(b.icon)pic(ctx,b.icon,x-(st?0:W()*0.22),st?H()*0.6:y,S(st?280:330),lf,a+2,{halo:true,idle:b.idle||"breathe",seed:i});
const nx=x+(b.icon&&!st?W()*0.08:0),d=Math.max(a+6,cueFrame(i,b.on||"",a+6)),p=Easing.outExpo(clamp((lf-d)/50)),v=(+b.value||0)*p;
enter(ctx,lf,d,nx,y,c=>withGlow(c,BRAND.accent,LOOK.glow,cc=>text(cc,`${b.prefix || ""}${v.toLocaleString("en-US", { minimumFractionDigits: b.decimals || 0, maximumFractionDigits: b.decimals || 0 })}${b.suffix || ""}`,0,0,{size:S(st?170:190),color:BRAND.accent})));
if(b.label)kLine(ctx,b.label,nx,y+S(st?130:140),lf,d+10,{size:S(46),family:BRAND.fontBody,weight:600,color:BRAND.muted,maxWidth:W()*0.6,mode:"fade"});
},
steps(ctx,b,x,lf,D,i){
const st=stack(),a=CAM.post-18,items=b.items||[],n=Math.max(1,items.length);
if(b.title)kLine(ctx,b.title,x,H()*(st?0.12:0.17),lf,a,{size:S(st?66:72),maxWidth:W()*0.8,highlight:b.highlight||[]});
const ds=items.map(([ch,lab],j)=>Math.min(D-34,Math.max(a+8+j*8,cueFrame(i,lab,a+10+j*12))));
if(st){
const top=H()*0.22,gapY=Math.min(H()*0.14,H()*0.48/Math.max(1,n-1||1)),px=x-W()*0.2,ps=S(Math.min(170,520/n+40));
for(let k=1;k<n;k++){const p=Easing.inOut(clamp((lf-ds[k]+8)/14));if(p>0){ctx.save();ctx.strokeStyle=rgba(BRAND.accent,0.8);ctx.lineWidth=S(5);ctx.lineCap="round";ctx.beginPath();const y0=top+gapY*(k-1)+ps*0.55,y1=top+gapY*k-ps*0.55;ctx.moveTo(px,y0);ctx.lineTo(px,lerp(y0,y1,p));ctx.stroke();ctx.restore();}}
items.forEach(([ch,lab],k)=>{const y=top+gapY*k;
if(ch)pic(ctx,ch,px,y,ps,lf,ds[k],{halo:false,idle:"breathe",seed:i*5+k});
else enter(ctx,lf,ds[k],px,y,c=>{circle(c,0,0,S(46),BRAND.primary);text(c,String(k+1),0,0,{size:S(44),color:BRAND.bg});});
if(lab)kLine(ctx,lab,px+ps*0.7,y,lf,ds[k]+4,{size:S(50),family:BRAND.fontBody,weight:700,maxWidth:W()*0.5,mode:"fade",align:"left"});});
if(b.caption)kLine(ctx,b.caption,x,top+gapY*(n-1)+S(150),lf,Math.min(D-30,ds[n-1]+10),{size:S(42),family:BRAND.fontBody,weight:600,color:BRAND.muted,maxWidth:W()*0.86,mode:"fade"});
return;
}
const y=H()*0.5,span=W()*0.66,xs=items.map((_,k)=>x-span/2+span*(n===1?0.5:k/(n-1)));
for(let j=1;j<n;j++){const p=Easing.inOut(clamp((lf-ds[j]+8)/14));
if(p>0){ctx.save();ctx.strokeStyle=rgba(BRAND.accent,0.8);ctx.lineWidth=S(5);ctx.lineCap="round";ctx.beginPath();ctx.moveTo(xs[j-1]+S(128),y);ctx.lineTo(lerp(xs[j-1]+S(128),xs[j]-S(128),p),y);ctx.stroke();ctx.restore();}}
items.forEach(([ch,lab],j)=>{if(ch)pic(ctx,ch,xs[j],y,S(220),lf,ds[j],{halo:false,idle:"breathe",seed:i*5+j});
else enter(ctx,lf,ds[j],xs[j],y,c=>{circle(c,0,0,S(46),BRAND.primary);text(c,String(j+1),0,0,{size:S(44),color:BRAND.bg});});
if(lab)kLine(ctx,lab,xs[j],y+S(168),lf,ds[j]+4,{size:S(46),family:BRAND.fontBody,weight:700,maxWidth:span/n*0.95,mode:"fade"});});
if(b.caption)kLine(ctx,b.caption,x,H()*0.72,lf,Math.min(D-30,ds[n-1]+10),{size:S(44),family:BRAND.fontBody,weight:600,color:BRAND.muted,maxWidth:W()*0.7,mode:"fade"});
},
compare(ctx,b,x,lf,D,i){
const st=stack(),a=CAM.post-18,y=H()*(st?0.42:0.48),dx=W()*(st?0.24:0.2),sides=[b.before||["","Before"],b.after||["","After"]];
if(b.title)kLine(ctx,b.title,x,H()*(st?0.16:0.2),lf,a,{size:S(76),maxWidth:W()*0.8});
sides.forEach(([ch,lab],j)=>{const sx=x+(j?dx:-dx),d=j?Math.max(a+24,cueFrame(i,lab,a+26)):a+6;
const k=st?0.9:1.3;enter(ctx,lf,d,sx,y,c=>{c.globalAlpha*=j?1:0.75;card(c,-S(170*k),-S(150*k),S(340*k),S(300*k),{accent:j?BRAND.accent:null});if(ch)emoji(c,ch,0,-S(40*k),S(150*k));
text(c,lab,0,S(80*k),{size:S(38*Math.min(k,1.15)),weight:700,family:BRAND.fontBody,color:j?BRAND.text:BRAND.muted,maxWidth:S(310*k)});});
if(j){const p=Easing.inOut(clamp((lf-d+10)/14));if(p>0){ctx.save();ctx.globalAlpha*=p;ctx.strokeStyle=BRAND.accent;ctx.fillStyle=BRAND.accent;ctx.lineWidth=S(8);ctx.lineCap="round";const L=S(st?34:46);ctx.beginPath();ctx.moveTo(x-L,y);ctx.lineTo(x+L-S(10),y);ctx.stroke();ctx.beginPath();ctx.moveTo(x+L+S(8),y);ctx.lineTo(x+L-S(18),y-S(20));ctx.lineTo(x+L-S(18),y+S(20));ctx.closePath();ctx.fill();ctx.restore();}}});
},
quote(ctx,b,x,lf,D,i){
const a=CAM.post-18,r=kLine(ctx,`“${b.quote || b.title || ""}”`,x,H()*0.42,lf,a,{size:S(stack()?64:72),maxWidth:W()*0.7,stagger:2,mode:"fade"});
if(b.by)kLine(ctx,`— ${b.by}`,x,(r?r.bottom:H()*0.5)+S(60),lf,a+20,{size:S(38),family:BRAND.fontBody,weight:600,color:BRAND.muted,mode:"fade"});
},
screen(ctx,b,x,lf,D,i){
const st=stack(),a=CAM.post-18,phone=b.frame==="phone",top=H()*(st?0.14:0.16);
if(b.title)kLine(ctx,b.title,x,top,lf,a,{size:S(st?70:76),maxWidth:W()*0.8});
const availH=H()*(st?0.5:0.56);let w=W()*(phone?(st?0.5:0.24):(st?0.86:0.6)),h=phone?w*2.05:w*0.62;
if(h>availH){h=availH;w=phone?h/2.05:h/0.62;}
const cy=top+S(60)+h/2,zoom=1+0.05*Easing.inOut(clamp(lf/Math.max(1,D)));
enter(ctx,lf,a+6,x,cy,c=>{const r=phone?S(40):S(16),bar=phone?0:S(40),pad=phone?S(12):0;
withShadow(c,{color:"rgba(0,0,0,0.4)",blur:S(50),y:S(20)},cc=>roundRect(cc,-w/2,-h/2,w,h,r,phone?"#0B0C10":(LIGHT_BG?"#FFFFFF":"#1A1D26")));
if(bar)[0,1,2].forEach(k=>circle(c,-w/2+S(26)+k*S(22),-h/2+bar/2,S(6),["#FF5F57","#FEBC2E","#28C840"][k]));
const ix=-w/2+pad,iy=-h/2+bar+pad,iw=w-pad*2,ih=h-bar-pad*2;
c.save();roundRect(c,ix,iy,iw,ih,phone?S(30):0);c.clip();c.translate(ix+iw/2,iy+ih/2);c.scale(zoom,zoom);
drawAsset(c,b.slot||"screenshot",-iw/2,-ih/2,iw,ih,{cover:true});c.restore();},{amp:2});
if(b.caption)kLine(ctx,b.caption,x,cy+h/2+S(56),lf,a+20,{size:S(40),family:BRAND.fontBody,weight:600,color:BRAND.muted,mode:"fade",maxWidth:W()*0.8});
},
finale(ctx,b,x,lf,D,i,cam){
const st=stack(),a=CAM.post-16,y=H()*(st?0.32:0.34),icons=(b.gather===false?[]:DIRECTOR.beats.filter(o=>o.icon&&o.shot!=="finale"&&o.shot!=="title").map(o=>o.icon)).slice(0,6);
const n=icons.length,gap=Math.min(S(230),W()*0.84/Math.max(1,n)),done=a+6+n*4+26;
icons.forEach((ch,j)=>{const tx=x-gap*(n-1)/2+gap*j,sx=x-W()*1.1+j*S(40),q=Easing.inOutQuart(clamp((lf-a-j*4)/28));
const px=lerp(sx,tx,q),py=y-Math.sin(Math.PI*q)*S(90)+(q>=1?Math.sin(lf/FPS()*1.3+j)*S(3):0);if(q<=0)return;
ctx.save();ctx.translate(px,py);ctx.rotate((1-q)*-0.4);emoji(ctx,ch,0,0,S(st?130:170));ctx.restore();});
if(n)burst(ctx,x,y,lf,done-4);
if(b.logo)enter(ctx,lf,n?done-14:a+2,x,n?y-S(150):y,c=>drawAsset(c,"logo",-S(140),-S(70),S(280),S(140)));
const r=kLine(ctx,b.line||b.title,x,H()*(st?0.5:0.56),lf,n?done-10:a+4,{size:S(st?84:96),highlight:b.highlight||[],maxWidth:W()*0.8});
if(b.cta)enter(ctx,lf,(n?done:a+16)+8,x,(r?r.bottom:H()*0.62)+S(70),c=>{const sz=S(40),w=measure(c,b.cta,sz,700,BRAND.fontBody)+S(80);
roundRect(c,-w/2,-sz*1.05,w,sz*2.1,sz*1.05,BRAND.accent);text(c,b.cta,0,0,{size:sz,weight:700,family:BRAND.fontBody,color:lum(BRAND.accent)<0.55?"#FFFFFF":"#111111"});});
},
custom(ctx,b,x,lf,D,i){
if(typeof b.draw!=="function")return;const e=envelope(lf,0,14,D-12,12);
ctx.save();ctx.globalAlpha*=e;ctx.translate(x-W()/2,(1-e)*S(20));b.draw(ctx,lf,D);ctx.restore();
},
};
function drawStation(ctx,k,g,cam){
const s=worldScenes()[k],b=DIRECTOR.beats[s.beat];if(!b)return;
const x=W()/2+k*SP()-cam.x;if(x<-W()*0.8||x>W()*1.8)return;
const lf=g-s.start;if(lf<-CAM.pre-2)return;
const cx=x+(stack()||b.shot==="title"||b.shot==="finale"?0:W()*0.06);
DIRECTOR.cur=b;try{SHOT_DRAW[b.shot](ctx,b,cx,lf,s.duration,s.index,cam);}catch(e){showStatus(`Beat ${k + 1} error: ${e.message}`);console.error(e);}
}
function drawWorld(ctx,g){
const cam=camAt(g);cam.x=cam.k?(cam.k-1+cam.e)*SP():0;
ctx.save();ctx.translate(0,cam.lift);zoomAt(ctx,cam.zoom,W()/2,H()*0.55);
drawWorldBack(ctx,cam,g);
const ws=worldScenes();for(let k=Math.max(0,cam.k-1);k<=Math.min(ws.length-1,cam.k+1);k++)drawStation(ctx,k,g,cam);
drawHero(ctx,cam,g);ctx.restore();
}
function beatOpts(b){const o={};["title","sub","caption","value","label","line","cta","quote","by","props","items"].forEach(k=>{if(b[k]!=null)o[k]=b[k];});return o;}
function beatScene(i,b){
const words=String(b.voice||"").split(/\s+/).filter(Boolean).length;
const base=b.seconds?Math.round(b.seconds*30):Math.max(b.shot==="finale"?120:96,Math.round((words/2.5+1.6)*30)+CAM.post);
return{name:b.name||(b.title||b.line||b.shot).toString().slice(0,28),duration:base,voice:b.voice||"",transitionIn:{type:"none"},drift:0,world:true,beat:i,
opts:beatOpts(b),rebuild(o){DIRECTOR.beats[i]={...DIRECTOR.beats[i],...o};return beatScene(i,DIRECTOR.beats[i]);},
draw(ctx,f){const s=CUR;if(!s)return;drawWorld(ctx,s.start+f);}};
}
function direct(film){
const{film:F,fixes}=directorCheck(film||{});DIRECTOR.film=F;DIRECTOR.fixes=fixes;DIRECTOR.beats=F.beats;
return F.beats.map((b,i)=>beatScene(i,b));
}
