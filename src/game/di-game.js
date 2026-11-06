'use strict';
/* Driftwood Isles — gameplay: input, camera, environment, fishing, player, boat, life */
let player=null,prig=null,panim=null,rodObj=null,bobber=null,fline=null,boat=null,exclaim=null;
const V3=THREE.Vector3;
function profileOr(){return state.profile||{name:'Angler',color:SHIRTS[0],hatC:SHIRTS[2],skin:SKINS[1],hat:'bucket'};}
function playerLook(){const p=profileOr();return{skin:p.skin,shirt:p.color,pants:'#3f4a6a',hat:p.hatC,hatType:p.hat};}
function setupPlayer(){const sp=world.spawn[state.last]||world.spawn.cove;player={pos:new V3(sp.x,groundH(sp.x,sp.z),sp.z),vy:0,onGround:true,face:sp.yaw,mode:'walk',speed:0,zone:null,emote:null,emT:0,emId:null,emFish:null};
 rebuildPlayerRig();bobber=makeBobber();fline=makeLine();boat={g:makeBoat(profileOr().color,state.boat,state.bup[state.boat],state.skin&&state.skin[state.boat]),pos:new V3(),yaw:0,speed:0,wake:0};placeBoatAt(state.last);
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(255,253,249,.95)';x.beginPath();x.arc(64,64,52,0,TAU);x.fill();x.font='800 84px Manrope, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#f39d7c';x.fillText('!',64,70);
 exclaim=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));exclaim.scale.set(1.3,1.3,1);exclaim.visible=false;exclaim.renderOrder=6;scene.add(exclaim);}
function rebuildPlayerRig(){const pos=prig?prig.root.position.clone():player.pos.clone();const ry=prig?prig.root.rotation.y:player.face;disposeRig(prig);prig=makeChar(playerLook());prig.root.position.copy(pos);prig.root.rotation.y=ry;scene.add(prig.root);
 panim=new CharAnim(prig);panim.onStep=footstep;rodObj=null;equipRodModel();if(F.held)prig.root.add(F.held);myTag=null;rebuildPlayerTag();
 if(boat){const p=boat.g.position.clone(),r=boat.g.rotation.clone();scene.remove(boat.g);boat.g=makeBoat(profileOr().color,state.boat,state.bup[state.boat],state.skin&&state.skin[state.boat]);boat.g.position.copy(p);boat.g.rotation.copy(r);}}
function equipRodModel(){if(rodObj&&rodObj.g.parent)rodObj.g.parent.remove(rodObj.g);rodObj=buildRod(RODM[state.rod],state.ench[state.rod]);prig.aR.hand.add(rodObj.g);}
function placeBoatAt(key){const d=world.boatDock[key];boat.pos.set(d.x,0,d.z);boat.yaw=d.yaw;boat.speed=0;}
function footstep(){if(!player||player.mode!=='walk'||!player.onGround||player.speed<1)return;const x=player.pos.x,z=player.pos.z;const kind=onDock(x,z)?'wood':player.zone==='frost'?'snow':groundH(x,z)<1?'sand':'grass';AU.step(kind);
 if(player.speed>9&&kind!=='wood')spawnPuff(x,player.pos.y,z,kind==='snow'?'#f4f8ff':kind==='grass'?'#c9d6a6':'#e2cfa4');}
const puffs=[];function spawnPuff(x,y,z,col){let p=puffs.find(q=>q.t>=q.d);if(!p){if(puffs.length>=20)return;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.smoke,transparent:true,depthWrite:false,opacity:0}));scene.add(s);reflHide.push(s);p={s,t:1,d:1};puffs.push(p);}
 p.t=0;p.d=rand(.5,.8);p.s.position.set(x+rand(-.25,.25),y+.15,z+rand(-.25,.25));p.s.material.color.set(col);p.s.visible=true;}

/* ---------- input ---------- */
const keys={},input={x:0,y:0,rot:0},joy={x:0,y:0,id:null};
const cam={yaw:0,pitch:.44,dist:12,tdist:12,target:new V3(),goal:null,manualT:9,fov:55};
const ptrs=new Map();let pinch=null,camBtn=0;
const typing=()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA');};
function uiBlocked(){return !$('#panelWrap').hidden||!$('#joinWrap').hidden||PAUSE.on||MENU.on;}
addEventListener('keydown',e=>{const k=e.code;if(typing()){if(k==='Escape')document.activeElement.blur();return;}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault();AU.init();
 if(e.repeat){keys[k]=true;return;}keys[k]=true;
 if(MENU.on){if(k==='Escape')closePanel();else menuKey(k);return;}
 if(k==='Backquote'&&DEV.on){toggleDev();return;}
 if(k==='Escape'){if(PHOTO.on)togglePhoto(false);else if(!$('#panelWrap').hidden)closePanel();else if(PAUSE.on)closePause();else if(!$('#emoteMenu').hidden)hideEmotes();else if(!JOIN.on)openPause();return;}
 if(PHOTO.on){if(k==='KeyP')togglePhoto(false);return;}
 if(uiBlocked())return;
 if((F.st==='reeling'||F.st==='bite')&&(k==='Space'||k==='KeyF'||k==='Enter')){fishPress(true);e.preventDefault();return;}
 if(F.st==='waiting'&&k==='Space'){fishPress(true);return;}
 if(k==='Enter'){openChat();e.preventDefault();return;}
 if(k==='Space')doJump();if(k==='KeyE')doInteract();if(k==='KeyF')castDown();if(k==='KeyB')openBag();if(k==='KeyG')openDex();if(k==='KeyL')openLeaderboard();if(k==='KeyK')openStats();if(k==='KeyO')openOnline();if(k==='KeyP')togglePhoto(true);if(k==='KeyM')openMap();if(k==='KeyQ')openQuests();
 if(k==='Comma')snapCam(1);if(k==='Period')snapCam(-1);
 const dg=/^Digit([1-8])$/.exec(k);if(dg){const n=+dg[1];if(!$('#emoteMenu').hidden&&n<=4)playEmote(['wave','dance','cheer','show'][n-1]);else hotbarKey(n);}});
addEventListener('keyup',e=>{const k=e.code;keys[k]=false;if(F.st==='reeling'&&(k==='Space'||k==='KeyF'||k==='Enter'))fishPress(false);else if(k==='KeyF')castUp();});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;if(F.st==='reeling')reelHold(false);if(F.st==='charging')castUp();camBtn=0;});
function snapCam(dir){cam.goal=(cam.goal==null?cam.yaw:cam.goal)+dir*Math.PI/4;cam.manualT=0;}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{AU.init();canvas.focus({preventScroll:true});hideEmotes();try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 const p={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),btn:e.button,type:e.pointerType,mode:'pending'};ptrs.set(e.pointerId,p);
 if(ptrs.size===2){const a=[...ptrs.values()];a.forEach(q=>{if(q.mode==='charge')castUp();q.mode='pinch';});pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),dist:cam.tdist};}
 else if(e.button===2||e.pointerType!=='mouse'||PHOTO.on)p.mode='drag';});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(p.mode==='pinch'&&pinch&&ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cam.tdist=clamp(pinch.dist*pinch.d/Math.max(d,1),4,PHOTO.on?60:32);return;}
 if(p.mode==='pending'&&Math.hypot(p.x-p.sx,p.y-p.sy)>6)p.mode='drag';
 if(p.mode==='drag'){cam.yaw-=dx*.0058*(state.settings.sens??1);cam.pitch=clamp(cam.pitch+dy*.0048*(state.settings.sens??1)*(state.settings.invY?-1:1),.04,1.35);cam.goal=null;cam.manualT=0;}});
const endPtr=e=>{const p=ptrs.get(e.pointerId);if(!p)return;if(p.mode==='charge')castUp();else if(p.mode==='pending'&&e.type==='pointerup'&&F.st==='waiting'&&!uiBlocked())fishPress(true);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;};
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.tdist=clamp(cam.tdist*(1+e.deltaY*.0011),4,PHOTO.on?60:32);},{passive:false});
function checkPendingPtrs(){const now=performance.now();for(const p of ptrs.values()){if(p.mode==='pending'&&p.type==='mouse'&&p.btn===0&&now-p.t>170){if(canStartCast()){p.mode='charge';startCharge();}else p.mode='drag';}}}
const joyEl=$('#joy'),knob=joyEl.querySelector('i');
joyEl.addEventListener('pointerdown',e=>{AU.init();joy.id=e.pointerId;try{joyEl.setPointerCapture(e.pointerId);}catch(_){}joyMove(e);});
joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)joyMove(e);});
const joyEnd=e=>{if(e.pointerId!==joy.id)return;joy.id=null;joy.x=joy.y=0;knob.style.transform='';};
joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
function joyMove(e){const r=joyEl.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const d=Math.hypot(dx,dy),m=50;if(d>m){dx*=m/d;dy*=m/d;}knob.style.transform=`translate(${dx}px,${dy}px)`;joy.x=dx/m;joy.y=-dy/m;}
const holdBtn=(el,down,up)=>{el.addEventListener('pointerdown',e=>{e.preventDefault();AU.init();try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('on');down();});const u=()=>{el.classList.remove('on');up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);};
holdBtn($('#castBtn'),()=>castDown(),()=>castUp());
holdBtn($('#camL'),()=>{camBtn=1;cam.goal=null;},()=>{camBtn=0;});holdBtn($('#camR'),()=>{camBtn=-1;cam.goal=null;},()=>{camBtn=0;});
$('#jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();AU.init();doJump();});
$('#actBtn').addEventListener('click',()=>{AU.init();doInteract();});
const rc=$('#reelCatch');let rcP=null;
rc.addEventListener('pointerdown',e=>{e.preventDefault();AU.init();try{rc.setPointerCapture(e.pointerId);}catch(_){}rcP={id:e.pointerId,x:e.clientX};fishPress(true);});
rc.addEventListener('pointermove',e=>{if(!rcP||e.pointerId!==rcP.id||!F.reel)return;F.reel.touchSteer=clamp((e.clientX-rcP.x)/70,-1,1);});
const rcUp=e=>{if(rcP&&e.pointerId!==rcP.id)return;rcP=null;if(F.reel)F.reel.touchSteer=0;fishPress(false);};rc.addEventListener('pointerup',rcUp);rc.addEventListener('pointercancel',rcUp);
function readInput(dt){let x=0,y=0,rot=camBtn;if(!typing()){if(keys.KeyD)x+=1;if(keys.KeyA)x-=1;if(keys.KeyW||keys.ArrowUp)y+=1;if(keys.KeyS||keys.ArrowDown)y-=1;if(keys.ArrowLeft)rot+=1;if(keys.ArrowRight)rot-=1;}
 x+=joy.x;y+=joy.y;const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}input.x=x;input.y=y;input.rot=clamp(rot,-1,1);
 if(input.rot){cam.yaw+=input.rot*2.3*dt;cam.goal=null;cam.manualT=0;}else if(cam.goal!=null){const d=cam.goal-cam.yaw;cam.yaw+=d*(1-Math.exp(-8*dt));if(Math.abs(d)<.002)cam.goal=null;}cam.manualT+=dt;}
function doJump(){if(!uiBlocked()&&!PHOTO.on&&player.mode==='boat'){const w=F.st==='idle'&&!boat.fly&&wellPrompt();if(w){w.act();return;}if(isPlane()){planeToggle();return;}}if(uiBlocked()||PHOTO.on||player.mode!=='walk'||!player.onGround)return;if(['reeling','caught','bite'].includes(F.st))return;if(F.st!=='idle')cancelFishing();stopEmote();player.vy=11.5;player.onGround=false;AU.jump();}

/* ---------- environment ---------- */
const env={t:.3,dayLen:600,weather:'clear',wTimer:90,rain:0,fog:0,cloud:0,wet:0,event:null,eventT:0,nextEvent:150,day:1,dusk:0,flash:0,boltT:3,rainbow:0,snowK:0};
const WX={clear:'Clear',cloudy:'Cloudy',rain:'Rain',storm:'Storm',fog:'Fog'};const WXW=[['clear',30],['cloudy',20],['rain',22],['storm',18],['fog',10]];
function pickWeather(ex){const o=WXW.filter(w=>w[0]!==ex);let r=Math.random()*o.reduce((s,w)=>s+w[1],0);for(const w of o){r-=w[1];if(r<=0)return w[0];}return 'clear';}
const wxTarget=w=>({rain:w==='rain'?1:w==='storm'?1.3:0,cloud:w==='clear'?.08:w==='cloudy'?.55:w==='rain'?.9:w==='storm'?1:.6,fog:w==='fog'?1:w==='storm'?.22:0});
function setWeather(w,quiet){const prev=env.weather;if(w===prev)return;env.weather=w;if((prev==='rain'||prev==='storm')&&(w==='clear'||w==='cloudy')&&env.day>.45)env.rainbow=80;
 if(!quiet)toast({rain:'A gentle rain rolls in. Some fish only bite now.',storm:'Thunder rumbles… a storm is coming in!',fog:'A soft fog settles over the sea…',cloudy:'Clouds drift across the sky.',clear:'The skies clear up.'}[w]);}
function initWeather(){const f=state.settings.weather;env.weather=f&&f!=='auto'?f:(Math.random()<.42?'rain':pick(['clear','clear','cloudy']));const t=wxTarget(env.weather);env.rain=t.rain;env.cloud=t.cloud;env.fog=t.fog;env.wet=t.rain?.7:0;}
function isNight(){return env.day<.35;}
const evIs=id=>!!(env.event&&env.event.id===id);
const FORCE_EV=(()=>{const m=/[?&]event=([a-z]+)/.exec(location.search);return m&&BIG_EVENTS.find(e=>e.id===m[1])||null;})();
/* the big-event clock: every BIG_CYCLE seconds one big event runs for BIG_LEN seconds, picked the same way on every device */
function bigSchedule(){if(DEV.ev&&Date.now()<DEV.ev.until)return{ev:DEV.ev.ev,left:(DEV.ev.until-Date.now())/1000};const now=Date.now()/1000,k=Math.floor(now/BIG_CYCLE),ph=now-k*BIG_CYCLE,pickK=i=>BIG_EVENTS[((i*2654435761)>>>0)%BIG_EVENTS.length];
 if(FORCE_EV)return{ev:FORCE_EV,left:BIG_LEN-((now-FORCE_T)%BIG_LEN)};
 if(ph>=BIG_START&&ph<BIG_START+BIG_LEN)return{ev:pickK(k),left:BIG_START+BIG_LEN-ph};
 return ph<BIG_START?{soon:pickK(k),warn:BIG_START-ph}:{soon:pickK(k+1),warn:BIG_CYCLE-ph+BIG_START};}
const FORCE_T=Date.now()/1000;
function tickEvents(dt){const b=bigSchedule();env.bigSoon=b.soon?{ev:b.soon,warn:b.warn}:null;
 if(b.ev){if(!env.event||env.event.id!==b.ev.id){if(env.event&&env.event.big)bigEventEnd(env.event.id);env.event=b.ev;toast(b.ev.n+'! '+b.ev.d,'gold');AU.level();bigEventStart(b.ev.id);}env.eventT=b.left;return;}
 if(env.event&&env.event.big){toast(env.event.n+' has ended. See you next time!');bigEventEnd(env.event.id);env.event=null;env.nextEvent=rand(200,360);}
 if(env.bigSoon&&env.bigSoon.warn<=BIG_WARN&&env.warnedFor!==env.bigSoon.ev.id){env.warnedFor=env.bigSoon.ev.id;toast(env.bigSoon.ev.n+' begins in about a minute…');}
 if(env.event){env.eventT-=dt;if(env.eventT<=0){toast(env.event.n+' has ended.');env.event=null;env.nextEvent=rand(300,480);}}
 else if(!(env.bigSoon&&env.bigSoon.warn<150)){env.nextEvent-=dt;if(env.nextEvent<=0){env.event=pick(EVENTS);env.eventT=120;toast(env.event.n+'! '+env.event.d,'gold');AU.level();}}}
const EC={moon:new THREE.Color('#a8bcf2'),hemiD:new THREE.Color('#dfe8ee'),hemiN:new THREE.Color('#3e5282'),gD:new THREE.Color('#6a7a58'),gN:new THREE.Color('#1c2232'),nightHor:new THREE.Color('#1b2a52'),
 deepD:new THREE.Color('#063250'),deepN:new THREE.Color('#020d18'),shalD:new THREE.Color('#13867f'),shalN:new THREE.Color('#0a2836'),scat:new THREE.Color('#2fbfa4'),grey:new THREE.Color('#5c6670'),
 white:new THREE.Color(1,1,1),duskTint:new THREE.Color(1.06,1,.94),nightTint:new THREE.Color(.9,.96,1.1)};
const WAVE_W={clear:1.15,cloudy:1.4,rain:1.9,storm:3.1,fog:.9};
const sunDir=new V3(),lightDir=new V3(),_c1=new THREE.Color(),_c2=new THREE.Color(),_c3=new THREE.Color(),_sunC=new THREE.Color(),_fogC=new THREE.Color(),_zen=new THREE.Color(),_hor=new THREE.Color();
const _rad=[0,0,0],_tr=[0,0,0],_hd=new V3(),_fw=new V3();let lampT=0;
function updateEnv(dt){if(!PHOTO.on||!PHOTO.timeSet)env.t=(env.t+dt/(env.dayLen*(state.settings.chill?1.6:1)))%1;
 const fw=state.settings.weather;if(fw&&fw!=='auto'){if(env.weather!==fw)setWeather(fw);}else{env.wTimer-=dt;if(env.wTimer<=0){setWeather(pickWeather(env.weather));env.wTimer=rand(120,240);}}
 const k=1-Math.exp(-dt*.35),wt=wxTarget(env.weather);env.rain=lerp(env.rain,wt.rain,k);env.fog=lerp(env.fog,wt.fog,k);env.cloud=lerp(env.cloud,wt.cloud,k);
 env.wet=clamp(env.wet+(env.rain>.4?dt/25:-dt/60),0,1);env.flash=Math.max(0,env.flash-dt*4.5);if(env.rainbow>0)env.rainbow-=dt;
 if(env.weather==='storm'&&env.rain>.8&&!(env.cave>.5)){env.boltT-=dt;if(env.boltT<=0){env.boltT=rand(4,11);const d=strikeBolt();env.flash=1;AU.thunder(d);}}
 tickEvents(dt);
 // waves build up in rain and storms and settle in fog
 WAVE.ampT=WAVE_W[env.weather]||1;if(evIs('swell'))WAVE.ampT=Math.max(WAVE.ampT,3.4);WAVE.amp=lerp(WAVE.amp,WAVE.ampT,1-Math.exp(-dt*.08));
 const a=(env.t-.25)*TAU,sy=Math.sin(a);sunDir.set(Math.cos(a)*.85,sy,.38).normalize();
 const day=smooth(-.1,.22,sy);env.day=day;const dusk=clamp(1-Math.abs(sy-.05)/.36,0,1)*(sy>-.22?1:0);env.dusk=dusk;const ov=clamp(env.cloud*.75+env.fog*.5,0,1),nightK=1-day;
 // sky
 const dark=clamp((env.cloud-.42)*1.5+env.fog*.45,0,1);
 skyU.uSun.value.copy(sunDir);skyU.uCov.value=clamp(.42+env.cloud*.62,0,1);skyU.uDark.value=dark;skyU.uNight.value=nightK*(1-dark*.4);skyU.uTurb.value=lerp(2.6,9,ov);skyU.uFlash.value=env.flash;
 skyU.uDisc.value=1-clamp(env.cloud*1.1+env.fog,0,1)*.95;
 // the sun's colour is the atmosphere's transmittance along its path (white at noon, amber at dusk)
 SKYJS.sunTrans(sunDir,_tr);const mx=Math.max(_tr[0],_tr[1],_tr[2],1e-4);_sunC.setRGB(_tr[0]/mx,_tr[1]/mx,_tr[2]/mx).lerp(EC.white,.45*smooth(.1,.5,sy));
 SKYJS.radiance(_hd.set(0,1,0),sunDir,_rad);_zen.setRGB(_rad[0],_rad[1],_rad[2]);
 camera.getWorldDirection(_fw);const fa=Math.atan2(_fw.z,_fw.x);_hor.setRGB(0,0,0);{const L=[];for(let i=0;i<6;i++){const az=fa+i/6*TAU;SKYJS.radiance(_hd.set(Math.cos(az)*.998,.06,Math.sin(az)*.998).normalize(),sunDir,_rad);L.push([_rad[0],_rad[1],_rad[2],_rad[0]*.3+_rad[1]*.55+_rad[2]*.15]);}const med=L.map(l=>l[3]).sort((a,b)=>a-b)[2]+1e-5;for(const l of L){const k=Math.min(1,med*1.6/l[3])*(l===L[0]?2:1);_hor.r+=l[0]*k;_hor.g+=l[1]*k;_hor.b+=l[2]*k;}_hor.multiplyScalar(1/7);}
 const night=EC.nightHor;_hor.add(_c1.copy(night).multiplyScalar(skyU.uNight.value));_zen.add(_c1.copy(night).multiplyScalar(skyU.uNight.value*.6));
 const greyOf=c=>{const g=c.r*.3+c.g*.55+c.b*.15;return _c2.setRGB(g*.92,g*.96,g*1.04);};
 _hor.lerp(greyOf(_hor),dark*.7).multiplyScalar(1-dark*.35);_zen.lerp(greyOf(_zen),dark*.7).multiplyScalar(1-dark*.35);
 _fogC.copy(_hor);{camera.getWorldDirection(_fw);const fd=Math.max(0,_fw.x*sunDir.x+_fw.z*sunDir.z)/Math.max(.001,Math.hypot(sunDir.x,sunDir.z));const glow=Math.pow(fd,3)*smooth(-.04,.08,sunDir.y)*(1-smooth(.35,.7,sunDir.y))*(1-dark*.8);
  _c3.copy(_sunC).multiplyScalar((_hor.r*.3+_hor.g*.55+_hor.b*.15)*1.6);_fogC.lerp(_c3,glow*.55);}if(env.flash>0)_fogC.lerp(EC.white,env.flash*.3);
 skyU.uFogC.value.copy(_fogC);skyU.uFogK.value=clamp(.42+env.fog*.55+env.rain*.25,0,1);
 const sunVis=smooth(-.03,.1,sy);
 skyU.uCloudSun.value.copy(_sunC).multiplyScalar((_hor.r*.3+_hor.g*.55+_hor.b*.15)*1.9*sunVis*(1-dark*.5)+.02);skyU.uCloudAmb.value.copy(_zen).lerp(_hor,.5).multiplyScalar(.85).add(_c1.copy(night).multiplyScalar(nightK*.25));
 scene.fog.color.copy(_fogC);const far=TT().far;scene.fog.near=lerp(lerp(45,25,env.rain),8,env.fog);scene.fog.far=lerp(lerp(far,200,Math.min(env.rain,1)),85,env.fog);
 // lights: sun by day, a cool moon by night, sky light from the captured environment
 const isMoon=sy<-.02;if(isMoon)lightDir.set(-sunDir.x,Math.max(-sy,.3),-sunDir.z).normalize();else lightDir.copy(sunDir).setY(Math.max(sunDir.y,.05)).normalize();
 if(isMoon){sun.color.copy(EC.moon);sun.intensity=.75*(1-env.cloud*.6)*smooth(-.02,-.2,sy);}else{sun.color.copy(_sunC);sun.intensity=3.3*sunVis*(1-env.cloud*.72)*(1-env.fog*.55);}
 hemi.intensity=.08+.52*nightK+env.flash*2.5;hemi.color.copy(EC.hemiN).lerp(EC.hemiD,day);hemi.groundColor.copy(EC.gN).lerp(EC.gD,day);
 scene.environmentIntensity=lerp(.62,1,day)*(1-dark*.15);
 renderer.toneMappingExposure=lerp(2.6,.97,day)*(1+ov*.28)+env.flash*.4;
 const t=TT(),fp=player?player.pos:new V3();if(t.shadow){const snap=2*t.ext/t.shadow;const cx=Math.round(fp.x/snap)*snap,cz=Math.round(fp.z/snap)*snap;sun.target.position.set(cx,0,cz);sun.position.set(cx+lightDir.x*140,lightDir.y*140,cz+lightDir.z*140);}
 else{sun.target.position.copy(fp);sun.position.set(fp.x+lightDir.x*100,lightDir.y*100,fp.z+lightDir.z*100);}
 // ocean
 waterU.uSunDir.value.copy(lightDir);waterU.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity*.26);waterU.uAmb.value.copy(_zen).lerp(_hor,.4).multiplyScalar(1.8).add(_c1.copy(night).multiplyScalar(nightK*.3));
 waterU.uDeep.value.copy(EC.deepN).lerp(EC.deepD,day).lerp(_c3.copy(EC.grey).multiplyScalar(.35*day+.05),ov*.45);waterU.uShal.value.copy(EC.shalN).lerp(EC.shalD,day).lerp(_c3.copy(EC.grey).multiplyScalar(.6*day+.08),ov*.35);
 waterU.uScatter.value.copy(EC.scat);waterU.uFogC.value.copy(_fogC);waterU.uFogN.value=scene.fog.near;waterU.uFogF.value=scene.fog.far;waterU.uRain.value=env.rain;waterU.uSpark.value=1-env.cloud*.75;
 waterU.uAmp.value=WAVE.amp;waterU.uFoamK.value=clamp((WAVE.amp-1)*.8,0,1.2);
 const cp=camera.position;sky.position.copy(cp);stars.position.copy(cp);starU.uA.value=nightK*(1-env.cloud)*(1-env.fog);starU.uT.value=WIND.uTime.value;
 const md=new V3(-sunDir.x,-sunDir.y,-sunDir.z);moon.position.copy(cp).addScaledVector(md,700);moon.lookAt(cp);moonHalo.position.copy(moon.position);const mo=clamp((-sy+.12)*5,0,1)*(1-env.cloud*.85)*(1-env.fog*.8);moon.material.opacity=mo;moon.material.color.setScalar(1.2+mo*.6);moonHalo.material.opacity=mo*.35;
 glowMat.color.setScalar(lerp(.85,2.6,nightK));
 /* the water shader shapes shorelines for the five nearest islands only */
 {const ws=LANDS.map(k=>{const I=ZONES[k];return[Math.hypot(cp.x-I.x,cp.z-I.z)-I.R,I];}).sort((a,b)=>a[0]-b[0]);for(let i=0;i<WATER_NI;i++){const I=ws[i][1];waterU.uIsl.value[i].set(I.x,I.z,I.R,I.p1);waterU.uIsl2.value[i].set(I.p2,0);waterU.uSand.value[i].set(I.sand);}}
 /* skip whole islands that are lost in the fog, and caves unless you are inside them */
 {const ff=scene.fog.far+70;for(const g of world.islGroups){const d=Math.hypot(cp.x-g.I.x,cp.z-g.I.z),on=g.I.cave?d<g.I.R*2.4:d-g.I.R*1.6<ff;if(g.grp.visible!==on)g.grp.visible=on;}}
 if(world.haloPts){const u=world.haloPts.material.uniforms;u.uNight.value=nightK;u.uCave.value=0;u.uScale.value=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360));}
 if(boat&&boat.g.userData.halo)boat.g.userData.halo.material.opacity=nightK*.55;
 ffU.uA.value=smooth(.5,.15,day)*(1-env.rain*.8);
 WIND.uStr.value=1+env.rain*.7+env.cloud*.3+(env.weather==='storm'?.9:0);
 WU.uWet.value=env.wet*.9;WU.uSunDirW.value.copy(lightDir);WU.uSunColW.value.copy(sun.color).multiplyScalar(sun.intensity*.3);
 puddleMat.opacity=env.wet*.85;world.puddles.forEach(p=>p.visible=env.wet>.02);
 if(GFX.rays){const u=GFX.rays.material.uniforms;_hd.copy(camera.position).addScaledVector(sunDir,500).project(camera);const onScr=_hd.z<1&&Math.abs(_hd.x)<1.6&&Math.abs(_hd.y)<1.6;camera.getWorldDirection(_fw);const facing=Math.max(0,_fw.dot(sunDir));
  u.uSun.value.set(_hd.x*.5+.5,_hd.y*.5+.5);u.uK.value=onScr&&!isMoon?smooth(.2,.75,facing)*smooth(-.02,.06,sy)*(1-env.cloud*.85)*(1-env.fog*.8)*(.38+dusk*.55):0;u.uCol.value.copy(_sunC);u.uTh.value=lerp(1.4,.9,dusk);GFX.rays.enabled=u.uK.value>.003;}
 if(GFX.bloom){GFX.bloom.threshold=lerp(GFX.hdr?2.4:.92,GFX.hdr?1.5:.85,dusk);GFX.bloom.strength=.2+dusk*.12+nightK*.06;}
 if(GFX.grade){const u=GFX.grade.material.uniforms;u.uHigh.value.setRGB(1+dusk*.08+.02,1+dusk*.01,1-dusk*.08-.02);u.uShadow.value.setRGB(.95-dusk*.03,.98,1.05+dusk*.04);u.uTint.value.copy(EC.white).lerp(EC.duskTint,dusk).lerp(EC.nightTint,nightK*.7);{const zt=ZTINT[player&&player.zone];env.ztK=damp(env.ztK||0,zt?1:0,1.5,dt);if(zt)env.ztC=zt;if(env.ztK>.01&&env.ztC)u.uTint.value.lerp(_c3.set(env.ztC),env.ztK*.6*(1-nightK*.5));}u.uSat.value=1.34+dusk*.06-ov*.16-nightK*.12;u.uCon.value=1.11+day*.04-ov*.05;u.uVig.value=.5;}
 lampT-=dt;if(lampT<=0){lampT=.25;updateLampLights(Math.max(nightK,env.cave||0));}
 /* islands glow warm at night: a soft light over the island you're on, and a warmer ground bounce */
 if(GFX.iglow){let best=null,bd=1e9;for(const k of ISL){const I=ZONES[k],d=Math.hypot(cp.x-I.x,cp.z-I.z)-I.R;if(d<bd){bd=d;best=I;}}const gl=GFX.iglow,near=best?1-smooth(best.R*.2,best.R*1.4,bd):0,nk=nightK*(1-(env.cave||0));
  if(best){gl.position.set(best.x,best.R*.32+14,best.z);gl.distance=best.R*3;}gl.intensity=nk*near*78;if(nk*near>.01){hemi.groundColor.lerp(_c2.set('#7a4a24'),nk*near*.6);hemi.color.lerp(_c2.set('#8a6a58'),nk*near*.25);}}
 {const fz=ZONES.frost,em=ZONES.ember,cv=ZONES.cove,am=ZONES.amber,px=cp.x,pz=cp.z;const na=1-smooth(am.R*1.2,am.R*2.4,Math.hypot(px-am.x,pz-am.z));const nf=1-smooth(fz.R*1.4,fz.R*3,Math.hypot(px-fz.x,pz-fz.z)),ne=1-smooth(em.R*1.2,em.R*2.6,Math.hypot(px-em.x,pz-em.z)),nc=Math.max(1-smooth(cv.R*1.1,cv.R*2.2,Math.hypot(px-cv.x,pz-cv.z)),(1-smooth(ZONES.petal.R*1.2,ZONES.petal.R*2.4,Math.hypot(px-ZONES.petal.x,pz-ZONES.petal.z)))*1.6);env.snowK=nf;
  const set=(k,a)=>{const d=drifts[k];if(!d)return;d.u.uAmt.value=a;d.pts.visible=a>.01;d.u.uCam.value.copy(cp);d.u.uLit.value=k==='ember'?1:lerp(.3,1,day);};set('snow',nf*(.35+Math.min(env.rain,1.3)*.8));set('ember',ne*(.7+(1-day)*.5));set('petal',nc*day*(1-Math.min(env.rain,1))*.8);set('leaf',na*(.4+.6*day)*(1-Math.min(env.rain,1)*.5));
  if(rainbow){const ra=clamp(env.rainbow/10,0,1)*clamp((80-env.rainbow)/6,0,1)*day*(1-Math.min(env.rain,1));rainbow.visible=ra>.01;if(rainbow.visible){const ax=-sunDir.x,az=-sunDir.z,l=Math.hypot(ax,az)||1;rainbow.position.set(cp.x+ax/l*650,cp.y-90,cp.z+az/l*650);rainbow.lookAt(cp.x,cp.y-90,cp.z);rainbow.material.uniforms.uA.value=ra;}}
  if(bolt&&bolt.visible){bolt.userData.t-=dt;bolt.material.opacity=Math.random()<.3?.3:1;if(bolt.userData.t<=0)bolt.visible=false;}}
 if(world.altarCrystal){const c=world.altarCrystal;c.rotation.y+=dt*.8;c.position.y=world.altarY+Math.sin(WIND.uTime.value*1.6)*.25;}
 // refresh the captured sky (reflections + lighting) every so often, sooner after a lightning flash
 updateBigFx(dt);
 /* inside a sea cave the cave takes over the lighting: teal in the Drowned Hollow, violet and ember in the Sunless Deep */
 {let hk=0,ck='hollow';for(const k in CAVE_LOOK){const H=ZONES[k],v=1-smooth(H.R*1.6,H.R*1.85,Math.hypot(cp.x-H.x,cp.z-H.z));if(v>hk){hk=v;ck=k;}}const CL=CAVE_LOOK[ck],deep=CL.mote==='moteV';env.cave=hk;env.caveK=ck;waterU.uCave.value=hk;
  for(const[k,on]of[['mote',!deep],['moteV',deep]]){const d=drifts[k];if(!d)continue;const a=on?hk:0;d.u.uAmt.value=a;d.pts.visible=a>.01;d.u.uCam.value.copy(cp);d.u.uLit.value=1;}
  if(hk>0){
  _c1.set(CL.fog);scene.fog.color.lerp(_c1,hk);scene.fog.near=lerp(scene.fog.near,10,hk);scene.fog.far=lerp(scene.fog.far,CL.far,hk);
  sun.intensity*=1-hk*.94;hemi.intensity=lerp(hemi.intensity,CL.hemiI,hk);hemi.color.lerp(_c2.set(CL.hemi),hk);hemi.groundColor.lerp(_c3.set(CL.gnd),hk);
  scene.environmentIntensity*=1-hk*.75;renderer.toneMappingExposure=lerp(renderer.toneMappingExposure,1.85,hk);
  waterU.uFogC.value.lerp(_c1,hk);waterU.uFogN.value=scene.fog.near;waterU.uFogF.value=scene.fog.far;waterU.uSunCol.value.multiplyScalar(1-hk);waterU.uSpark.value*=1-hk;
  waterU.uDeep.value.lerp(_c2.set(CL.deep),hk);waterU.uShal.value.lerp(_c3.set(CL.shal),hk);waterU.uBio.value=Math.max(waterU.uBio.value,hk*CL.bio);waterU.uAmb.value.lerp(_c1.set(CL.amb),hk*.6);
  glowMat.color.setScalar(lerp(glowMat.color.r,3.2,hk));starU.uA.value*=1-hk;moon.material.opacity*=1-hk;moonHalo.material.opacity*=1-hk;
  if(GFX.rays)GFX.rays.material.uniforms.uK.value*=1-hk;if(GFX.bloom)GFX.bloom.strength=lerp(GFX.bloom.strength,.5,hk);
  if(world.haloPts)world.haloPts.material.uniforms.uCave.value=hk;
  for(const r of world.caveRings)r.rotation.z+=dt*.6;}}
 ENV.t-=dt;if(ENV.t<=0||(env.flash>.9&&ENV.t<ENV.every-.1)){ENV.t=ENV.every;updateEnvMap();}}

/* ---------- stats & rolls ---------- */
function fxOk(c){if(!c)return true;if(c==='night')return isNight()||evIs('aurora');if(c==='rain')return env.weather==='rain'||env.weather==='storm';if(c==='deep')return !!player&&player.mode==='boat'&&player.zone==='sea';return true;}
function applyFx(S,fx,who){if(!fx||!fxOk(fx.cond))return;if(fx.luck)S.luck+=fx.luck;if(fx.wait)S.wait*=fx.wait;if(fx.mut)S.mut+=fx.mut;if(fx.wt)S.wt*=1+fx.wt;if(fx.xp)S.xp+=fx.xp;if(fx.dbl)S.dbl+=fx.dbl;if(fx.shake)S.shake*=fx.shake;if(fx.bar)S.barMul*=fx.bar;if(fx.drain)S.res=1-(1-S.res)*fx.drain;if(fx.reel)S.reel*=fx.reel;if(fx.hook)S.hook+=fx.hook;if(fx.tire)S.tire*=fx.tire;if(fx.sell)S.sell*=fx.sell;if(S.src&&fx.d)S.src.push([who,fx.d]);}
const ENCHFX={swift:{reel:1.2},lucky:{luck:40},steady:{bar:1.25},sturdy:{drain:.7},hefty:{wt:.25},mutant:{mut:.05},hasty:{wait:.7},midas:{sell:1.2}},EVFX={frenzy:{wait:.5},current:{luck:60},golden:{sell:1.25},leviathan:{luck:100,wt:.5},starfall:{mut:.06},aurora:{luck:40},swell:{wt:.4,luck:30}};
function boatStats(id){const B=BOATM[id||state.boat]||BOATS[0],u=state.bup[B.id]||{};return{B,u,speed:B.speed*(1+.08*(u.e||0)),turn:B.turn*(1+.05*(u.h||0)),storage:B.storage+5*(u.h||0),sonar:u.s||0};}
function maxInv(){return MAXINV+(player&&player.mode==='boat'?boatStats().storage:0);}
function rebuildBoat(){const p=boat.g.position.clone(),r=boat.g.rotation.clone();scene.remove(boat.g);boat.g=makeBoat(profileOr().color,state.boat,state.bup[state.boat],state.skin&&state.skin[state.boat]);boat.g.position.copy(p);boat.g.rotation.copy(r);}
function stats(detail){const r=RODM[state.rod],e=state.ench[state.rod],b=state.baitOn?BAITM[state.baitOn]:null;
 const S={luck:r.luck+(state.level-1)*1.5,reel:r.reel,ctrl:r.ctrl,res:r.res,wait:1,mut:.05,wt:1,sell:1,barMul:1,xp:1,dbl:0,shake:1,hook:0,tire:1,src:detail?[]:null};
 if(detail){S.src.push(['Rod: '+r.n,`+${r.luck}% luck, ${r.reel.toFixed(2)}× reel`]);S.src.push(['Level '+state.level,'+'+((state.level-1)*1.5).toFixed(1)+'% luck']);}
 applyFx(S,r.perk,'Rod perk');if(e)applyFx(S,Object.assign({d:ENCH[e].d},ENCHFX[e]),'Enchant: '+ENCH[e].n);
 if(b)applyFx(S,{luck:b.luck*(b.night&&isNight()?2:1),wait:b.wait,mut:b.mut,wt:b.wt,d:b.d},'Bait: '+b.n);
 if(player&&player.mode==='boat'){const bs=boatStats();applyFx(S,bs.B.fx,'Boat: '+bs.B.n);if(bs.sonar)applyFx(S,{luck:bs.sonar*6,d:'+'+bs.sonar*6+'% luck'},'Sonar level '+bs.sonar);}
 {const ln=LINEM[state.line];if(ln&&ln.r!=='basic')applyFx(S,ln.fx,'Line: '+ln.n);const lu=state.lure&&LUREM[state.lure];if(lu)applyFx(S,Object.assign({},lu.fx,{luck:(lu.fx.luck||0)*(lu.fx.night&&isNight()?2:1)}),'Lure: '+lu.n);}
 for(const k in state.buffs){const B=BUFFM[k];if(B&&state.buffs[k]>0)applyFx(S,B.fx,B.n);}
 if(state.charm)applyFx(S,{luck:state.charm*3,mut:state.charm*.004,d:`+${state.charm*3}% luck, +${(state.charm*.4).toFixed(1)}% mutation chance`},'Relic Charm level '+state.charm);
 const ev=env.event&&env.event.id;if(ev){if(ev==='surge'||ev==='starfall'){S.mut*=ev==='surge'?3:2;if(detail)S.src.push(['Event: Mutation Surge','Mutation chance ×3']);}else applyFx(S,Object.assign({d:env.event.d},EVFX[ev]),'Event: '+env.event.n);}
 if(F.inSchool&&F.st!=='idle'){S.luck+=40;S.wait*=.5;if(detail)S.src.push(['Fish school','+40% luck, bites twice as fast']);}
 S.luck/=100;return S;}
function fishValue(f){const sp=SPM[f.sp];const avg=(sp.minW+sp.maxW)/2;return Math.max(1,Math.round(sp.price*Math.pow(f.w/avg,.85)*(f.mut?MUTS[f.mut].m:1)*(f.vk||1)*stats().sell));}
function rollWeight(sp,wt){const r=Math.pow(Math.random(),1.7);let w=(sp.minW+(sp.maxW-sp.minW)*r)*wt;if(Math.random()<.02)w*=1.6;return Math.round(w*100)/100;}
function rollMutation(){const gold=env.event&&env.event.id==='golden';const ks=Object.keys(MUTS);let tot=0;const ws=ks.map(k=>{let w=MUTS[k].w;if(k==='golden'&&gold)w*=8;if((k==='glowing'||k==='prismatic')&&evIs('starfall'))w*=5;if(k==='frozen'&&zoneAt(player.pos.x,player.pos.z)==='frost')w*=2.5;tot+=w;return w;});let r=Math.random()*tot;for(let i=0;i<ks.length;i++){r-=ws[i];if(r<=0)return ks[i];}return 'shiny';}
function condOK(s){if(!s.cond)return true;if(s.cond.startsWith('secret'))return false;if(s.cond==='night')return isNight()||evIs('aurora');if(s.cond==='day')return !isNight();if(s.cond==='rain')return env.weather==='rain';if(s.cond==='fog')return env.weather==='fog';return true;}
/* secret fish: each only bites in one place, at one time, in one kind of weather */
const SECRET_HINTS={lighthouse_phantom:'A light on the hill, a fog or a rain at night…',bell_ray:'The atoll rings at first light.',star_koi:'When stars fall on the blossom isle…',frost_wyrm:'Frostmere, a storm, and no sun.'};
function secretCatch(zone,st){if(DEV.rar!=null||zone==='well')return null;const n=isNight(),w=env.weather,t=env.t,lh=ZONES.cove.lh;let id=null,p=0;
 if(zone==='cove'&&n&&(w==='fog'||w==='rain')&&lh&&Math.hypot(F.to.x-lh.x,F.to.z-lh.z)<90){id='lighthouse_phantom';p=.05;}
 else if(zone==='atoll'&&t>.2&&t<.3){id='bell_ray';p=.03;}else if(zone==='petal'&&evIs('starfall')){id='star_koi';p=.05;}else if(zone==='frost'&&n&&w==='storm'){id='frost_wyrm';p=.04;}
 if(!id||!SPM[id]||Math.random()>p*(1+st.luck*.15))return null;const sp=SPM[id];return{sp,w:rollWeight(sp,st.wt),mut:Math.random()<st.mut?rollMutation():null,r:sp.r};}
function rollCatch(zone){const st=stats();if(DEV.rar==null&&zone!=='well'&&Math.random()<.012*(1+st.luck*.4))return{relic:true,r:3};{const sc=secretCatch(zone,st);if(sc)return sc;}
 const pool=SPECIES.filter(s=>s.zone===zone&&condOK(s));const ws=rarityOdds(st.luck);let x=Math.random(),r=0;for(let i=0;i<ws.length;i++){x-=ws[i];if(x<=0){r=i;break;}}if(DEV.rar!=null){r=DEV.rar;DEV.rar=null;if(DEV.open)renderDev();}if(zone==='well')r=[2,2,3,4,5,6,6][r];
 let cands=[];for(let rr=r;rr>=0;rr--){cands=pool.filter(s=>s.r===rr);if(cands.length)break;}if(!cands.length)cands=pool.length?pool:SPECIES.filter(s=>s.zone==='cove'&&s.r===0);
 let sp=pick(cands);if(zone==='hollow'||zone==='pond_hollow'){const king=SPM.drowned_king,haveAll=SPECIES.filter(s=>(s.zone==='hollow'||s.zone==='pond_hollow')&&s!==king).every(s=>state.dex[s.id]&&state.dex[s.id].n);
  if(sp===king&&state.level<30){sp=pick(pool.filter(s=>s!==king&&s.r>=3))||pool[0];}else if(zone==='hollow'&&state.level>=30&&haveAll&&!(state.dex.drowned_king&&state.dex.drowned_king.n)&&Math.random()<.03)sp=king;}
 return{sp,w:rollWeight(sp,st.wt),mut:Math.random()<st.mut?rollMutation():null,r:sp.r};}
function isNotable(r,mut){return r>=3||(mut&&['golden','prismatic','shadow'].includes(mut))||(r>=2&&!!mut);}

/* ---------- fishing ----------
   Cast with a power swing. While the float bobs you can twitch the lure to tempt a bite; nibbles warn that a fish is close.
   When the float dives, strike. Then fight the fish on a classic reel: hold to wind in, ease off when the tension needle
   climbs into the red (or the line snaps), and pull against the fish's runs to tire it out. */
const F={st:'idle',t:0,power:0,dir:new V3(),from:new V3(),to:new V3(),flight:.8,arc:4,wait:0,nibT:0,nib:0,twT:0,twK:0,ripT:0,catch:null,reel:null,held:null,retFrom:new V3(),flyFrom:new V3(),zone:'cove',lastCatch:null,hookWin:1};
const SC={idle:'i',charging:'c',casting:'t',waiting:'w',bite:'b',reeling:'r',caught:'k',retract:'x'};
function canStartCast(){return F.st==='idle'&&!uiBlocked()&&!PHOTO.on&&!(player.mode==='boat'&&(Math.abs(boat.speed)>1.5||boat.alt>.3))&&!(player.mode==='ride'&&((hostOf(RIDE&&RIDE.uid)||{}).spd||0)>1.5);}
function castDown(){if(uiBlocked()||PHOTO.on)return;hideEmotes();if(F.st==='caught'){finishCatch();return;}if(F.st==='bite'){setHook();return;}if(F.st==='reeling'){reelHold(true);return;}if(F.st==='waiting'){cancelFishing();return;}
 if(canStartCast())startCharge();else if(player.mode==='boat'&&F.st==='idle')toast('Slow the boat down to cast.');}
function castUp(){if(F.st==='reeling'){reelHold(false);return;}if(F.st==='charging')releaseCast();}
/* the "action" press: a click or tap anywhere, or Space. Strikes on a bite, reels during a fight, twitches the lure while waiting */
function fishPress(on){if(on){if(F.st==='bite')setHook();else if(F.st==='reeling')reelHold(true);else if(F.st==='waiting')twitch();}else if(F.st==='reeling')reelHold(false);}
function startCharge(){if(state.inv.length>=maxInv()){toast('Your bag is full. Sell some fish at a merchant.');return;}stopEmote();F.st='charging';F.t=0;F.power=0;$('#power').hidden=false;AU.charge();}
function camFwd(){return new V3(-Math.sin(cam.yaw),0,-Math.cos(cam.yaw));}
function releaseCast(){$('#power').hidden=true;F.inSchool=false;const dir=camFwd();const base=player.mode==='boat'?boat.pos:player.pos;let dist=4+F.power*16,ok=false;
 for(let d=dist;d>=3;d-=.8){const x=base.x+dir.x*d,z=base.z+dir.z*d;if(groundH(x,z)<-.45&&!world.seaRocks.some(r=>Math.hypot(r.x-x,r.z-z)<r.r)){dist=d;ok=true;break;}}
 player.face=Math.atan2(dir.x,dir.z);if(!ok){F.st='idle';toast('Face the water and get closer to the edge to cast.');return;}
 setTackle(bobber,state.lure&&LUREM[state.lure]?LUREM[state.lure].style:TACKLE[state.baitOn||'none']||'classic');F.dir.copy(dir);rodObj.tip.getWorldPosition(F.from);F.to.set(base.x+dir.x*dist,0,base.z+dir.z*dist);F.flight=.55+F.power*.45;F.arc=2.5+F.power*4.5;F.st='casting';F.t=0;AU.cast(F.power);bobber.visible=true;fline.visible=true;}
function cancelFishing(){const was=F.st;biteShadow(false);F.biteFrom=null;if(was==='bite')re('hook').hidden=true;if(['casting','waiting','bite','reeling'].includes(was)){F.st='retract';F.t=0;F.retFrom.copy(bobber.position);AU.reelIn();}else if(was==='charging'){F.st='idle';$('#power').hidden=true;}exclaim.visible=false;endFightUI();}
function useBait(){if(!state.baitOn)return;state.bait[state.baitOn]=(state.bait[state.baitOn]||0)-1;if(state.bait[state.baitOn]<=0){delete state.bait[state.baitOn];toast('You ran out of '+BAITM[state.baitOn].n+'.');state.baitOn=null;}updateGear();}
function buzz(p){try{if(isTouch&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}
const RE={};const re=id=>RE[id]||(RE[id]=document.getElementById(id));
function fishTip(html,cls){const el=re('fishTip');if(!html){if(!el.hidden)el.hidden=true;return;}if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html;}const c=cls||'';if(el.className!==c)el.className=c;if(el.hidden)el.hidden=false;}
function twitch(){if(F.st!=='waiting'||F.twT>0)return;F.twT=.8;F.twK=1;F.twN=(F.twN||0)+1;const ch=state.settings.chill;
 if(F.twN>4&&!ch){F.wait+=rand(1.5,3);F.twN=2;fishTip('<b>Easy!</b> Too much twitching scares the fish off','nib');F.spookT=1.6;}
 else{F.wait-=(ch?1.3:1)*stats().shake;if(F.nib>0){if(ch||Math.random()<.65)F.wait=Math.min(F.wait,rand(.2,.6));else{F.wait+=rand(1,2.5);F.nib=0;F.spookT=1.2;}}}
 AU.twitch();splash(bobber.position,4,2);addRipple(bobber.position.x,bobber.position.z,.6);}

/* ---------- strike feel: hit-stop, the fish's shadow under the float, and a screen flash ---------- */
const HIT={t:0,k:1};
/* each island has its own colour mood */
const ZTINT={dune:'#fff0d4',frost:'#e6f2ff',petal:'#fff0f4',ember:'#ffe6d8',glim:'#efe8ff',moss:'#effbe8',atoll:'#eefffb',amber:'#fff4dc'};
let BSH=null;
function biteShadow(on){if(on&&!BSH){BSH=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0x061018,transparent:true,opacity:0,depthWrite:false,fog:false}));BSH.rotation.x=-Math.PI/2;BSH.renderOrder=2;scene.add(BSH);}
 if(!BSH)return;BSH.visible=on;if(on){const c=F.catch,s=c&&!c.relic?clamp(fishScale(c.sp,c.w)*1.1,.5,3.2):.8;BSH.userData.s=s;BSH.material.opacity=0;}}
function biteShadowAt(x,y,z,a,t){if(!BSH||!BSH.visible)return;const s=BSH.userData.s||1;BSH.position.set(x-Math.cos(a)*s*.5,y,z-Math.sin(a)*s*.5);BSH.rotation.z=-a;BSH.scale.set(s,s*.36,1);BSH.material.opacity=Math.min(.42,t*2.4)*(1-(env.cave||0)*.5);}
function strikeFx(kind){let el=document.getElementById('strikeFx');if(!el){el=document.createElement('div');el.id='strikeFx';document.body.appendChild(el);}el.className='';void el.offsetWidth;el.className=kind;}
function startBite(){F.catch=rollCatch(F.zone);F.st='bite';F.t=0;F.ripT=0;const S=stats(),c=F.catch,rr=c.relic?3:c.r;F.hookWin=state.settings.chill?1.4+S.ctrl*1.2+S.hook:Math.max(.42,(.62+S.ctrl*1.1+S.hook)*(1-.045*rr));
 F.biteA=Math.random()*TAU;F.biteFrom=F.to.clone();biteShadow(true);AU.bite();AU.splash(.7);splash(bobber.position,22,5.5);addRipple(bobber.position.x,bobber.position.z,1.6);fishTip(null);strikeFx('bite');cam.punch=Math.max(cam.punch||0,.35);
 const h=re('hook');h.style.setProperty('--hw',F.hookWin.toFixed(2)+'s');h.innerHTML=`<div class="hk-perfect"></div><div class="hk-ring"></div><div class="hk-core">STRIKE!<small>${isTouch?'Tap anywhere':'Click or Space'}</small></div>`;h.hidden=false;re('reelCatch').hidden=false;buzz(25);camShake(.12);}
function setHook(){if(F.st!=='bite')return;const q=F.t/F.hookWin,grade=q<.3?2:q<.65?1:0;re('hook').hidden=true;biteShadow(false);F.biteFrom=null;
 /* the strike: a beat of slow motion, a punch-in and a flash, scaled by how clean it was */
 if(grade>0&&!state.settings.chill){HIT.t=grade===2?.24:.13;HIT.k=grade===2?.22:.4;}cam.punch=grade===2?1:grade===1?.6:.25;strikeFx(grade===2?'perfect':grade===1?'good':'late');
 floatTip(grade===2?'Perfect strike!':grade===1?'Good strike':'Late strike! The hook is barely set');startFight(grade===2,grade);}
function missBite(){biteShadow(false);F.biteFrom=null;re('hook').hidden=true;re('reelCatch').hidden=true;exclaim.visible=false;F.st='retract';F.t=0;F.retFrom.copy(bobber.position);AU.escape();toast(F.catch&&F.catch.relic?'Too slow… something shiny slipped away.':'Too slow! The fish stole the bait.');}
function fightBase(){return player.mode==='boat'?boat.pos:player.pos;}
function startFight(perfect,grade){if(grade===undefined)grade=perfect?2:1;const c=F.catch,R=RAR[c.r],S=stats(),ch=state.settings.chill;const wN=c.relic?.4:clamp((c.w-c.sp.minW)/(c.sp.maxW-c.sp.minW||1),0,1.5);
 const base=fightBase(),d=clamp(Math.hypot(F.to.x-base.x,F.to.z-base.z),4,30),str=(.35+R.spd*2.6+wN*.35)*(ch?1:1.12);
 F.reel={dist:d,max:d+6+str*3.6,slack:0,jerk:rand(.7,1.6),tens:0,stam:grade===2?.72:grade===1?.88:1,loose:grade===0&&!ch?2.8:0,str,run:0,rest:grade===0?.05:R.int*rand(.6,1.2),runDir:1,danger:0,ang:0,
  reelSpd:2.3*S.reel*(ch?1.15:1),snapT:.36*(1+S.res)*(ch?2:1),restBase:R.int*(ch?1.56:1.05),runBase:1.35+R.err*3,stamK:(ch?1.4:1)*S.tire,riseK:S.barMul*(1+S.res*.8)*(ch?1.35:1),ctrl:S.ctrl,
  hold:false,steer:0,touchSteer:0,t:0,click:0,drag:0,yank:1,jumpT:(c.r>=2&&!c.relic)?rand(1.5,3.5):1e9,jump:-1,ja:0,jx:0,jz:0,fishM:null,known:false,hot:0,pull:0};
 {const sh=c.relic?'fish':c.sp.shape,Rf=F.reel;Rf.style=sh==='eel'?'eel':sh==='shark'?'shark':sh==='ray'?'ray':sh==='long'?'long':sh==='flat'?'flat':'fish';if(Rf.style==='long'&&Rf.jumpT<1e8)Rf.jumpT=rand(1,2.2);if(Rf.style==='shark'){Rf.runBase*=1.5;Rf.restBase*=.8;}
  const rd=RODM[state.rod],cap=6+rd.luck*1.7+(S.res||0)*40;Rf.heavy=c.relic||ch?0:Math.max(0,c.w/cap-1);if(Rf.heavy>0){const h=Math.min(1.5,Rf.heavy);Rf.riseK/=1+h*.45;Rf.snapT/=1+h*.35;Rf.str*=1+h*.2;}}
 F.st='reeling';F.t=0;exclaim.visible=false;re('reel').hidden=false;re('reelCatch').hidden=false;
 re('reelRar').innerHTML=c.relic?'<span class="pill" style="--c:#c6f4ff">Relic</span>':rarPill(c.r);re('reelName').textContent=c.relic?'Something glimmers…':'???';
 re('reel').style.setProperty('--rc',c.relic?'#9eeaff':RAR[c.r].c);re('reel').classList.toggle('big',c.r>=3||!!c.relic);
 AU.hookSet(perfect);buzz(perfect?[20,40,20]:30);camShake(grade===2?.34:.25);splash(bobber.position,c.r>=3||c.relic?24:14,c.r>=3?6:4.5);
 {const Rf=F.reel,st={eel:'Zigzags',shark:'Long runs',ray:'Dives deep',long:'Leaper',flat:'Stubborn',fish:''}[Rf.style];re('reelStyle').textContent=(Rf.heavy>0?'Heavy for your rod · ':'')+(st||'');re('reelStyle').classList.toggle('warn',Rf.heavy>0);if(Rf.heavy>.15)setTimeout(()=>floatTip('Heavy fish for this rod! Ease off early'),700);}
 if(!state.tips.reel2){state.tips.reel2=1;toast(isTouch?'Hold to reel in. Let go when the needle reaches red. Drag left or right against the fish.':'Hold click or Space to reel. Let go when the needle reaches red. A and D pull against the fish.');}}
function floatTip(txt){const el=document.createElement('div');el.className='floatTip';el.textContent=txt;document.body.appendChild(el);setTimeout(()=>el.remove(),1300);}
function reelHold(on){if(F.reel)F.reel.hold=on;}
function endFightUI(){re('reel').hidden=true;re('reelCatch').hidden=true;re('hook').hidden=true;re('rfSteer').className='';fishTip(null);if(F.reel){F.reel.hold=false;if(F.reel.fishM){disposeHeld(F.reel.fishM);F.reel.fishM=null;}}}
function updateReel(dt){const R=F.reel,T=WIND.uTime.value;R.t+=dt;R.yank=Math.max(0,R.yank-dt*4);
 const ks=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);R.steer=clamp(ks+R.touchSteer+joy.x,-1,1);
 // the fish rests, then makes runs to one side; a tired fish runs less and pulls softer
 if(R.run>0){R.run-=dt;if(R.run<=0)R.rest=R.restBase*rand(.7,1.4)*(1+(1-R.stam)*1.2);}
 else{R.rest-=dt;if(R.rest<=0){R.run=R.runBase*rand(.7,1.3)*(.45+R.stam*.55);R.runDir=Math.abs(R.ang)>.45?-Math.sign(R.ang):Math.random()<.5?-1:1;splash(bobber.position,8,3.5);AU.splash(.35);AU.run();camShake(.1);if(R.jumpT<=0&&R.jump<0)startJump();}}
 const running=R.run>0,pull=R.str*(running?1:.2)*(.3+.7*R.stam);R.pull=pull;
 /* eels zigzag mid-run; rays dive, so pulling sideways does nothing and reeling into a dive strains the line */
 if(running&&R.style==='eel'){R.zz=(R.zz||rand(.5,.9))-dt;if(R.zz<=0){R.zz=rand(.42,.8);R.runDir*=-1;}}
 const dive=running&&R.style==='ray';const counter=running&&!dive&&R.steer*R.runDir<-.3,along=running&&!dive&&R.steer*R.runDir>.3;
 let tgt=R.hold?.2+pull*.72:pull*.24;if(counter)tgt*=.68-R.ctrl;if(along)tgt*=1.15;if(dive&&R.hold)tgt*=1.28;if(!running&&R.style==='flat'&&R.hold)tgt+=.08;if(R.heavy>0)tgt*=1+Math.min(.3,R.heavy*.2);
 R.tens+=(tgt-R.tens)*(1-Math.exp(-(R.hold?3.8/R.riseK:3.4)*dt));
 /* head-shakes: a running fish jerks the line, spiking the tension without warning */
 if(running){R.jerk-=dt;if(R.jerk<=0){R.jerk=rand(.7,1.8);const k=rand(.12,.28)*Math.min(1.2,pull)*(state.settings.chill?.5:1);R.tens+=k;if(k>.12){camShake(.12);AU.creak(R.tens);splash(bobber.position,6,3.5);}}}
 const before=R.dist,wind=R.reelSpd*clamp(1-pull*.6,.1,1)*(!running&&R.style==='flat'?.65:1);
 if(R.hold)R.dist-=wind*dt;else R.dist+=(running?pull*1.25:.08)*dt;
 let slip=0;if(R.tens>.86){slip=(R.tens-.86)*7*pull;R.dist+=slip*dt;}
 if(R.tens>.98)R.danger+=dt;else R.danger=Math.max(0,R.danger-dt*1.5);
 /* a slack line during a run lets the fish throw the hook */
 R.loose=Math.max(0,(R.loose||0)-dt);if(running&&!R.hold&&R.tens<.12&&!state.settings.chill){R.slack+=dt;if(R.slack>(R.loose>0?.55:1.1)&&Math.random()<dt*(R.loose>0?1.3:.55)){loseFish('The line went slack and the fish shook the hook. Keep a little tension on it.');return;}}else R.slack=Math.max(0,R.slack-dt*2);
 const work=R.tens>.28?(R.tens<.9?1.5:.9):.3;R.stam=Math.max(0,R.stam-dt*.047*work*(counter?1.8:1)*R.stamK/Math.sqrt(R.str));
 // the fish swings left and right on its runs; pulling the other way brings it back in line
 if(running)R.ang+=R.runDir*dt*.32*(pull/R.str);R.ang-=R.steer*dt*.18;R.ang*=1-dt*.15;R.ang=clamp(R.ang,-.75,.75);R.jumpT-=dt;
 const base=fightBase(),ca=Math.cos(R.ang),sa=Math.sin(R.ang),dx=F.dir.x*ca-F.dir.z*sa,dz=F.dir.x*sa+F.dir.z*ca,fx=base.x+dx*R.dist,fz=base.z+dz*R.dist;F.to.set(fx,0,fz);
 bobber.position.set(fx+Math.sin(R.t*9)*.08*pull,Math.max(surfY(fx,fz,T)-.25-R.tens*.25-(dive?.4:0)+Math.sin(R.t*13)*.05,groundH(fx,fz)+.15),fz);player.face=Math.atan2(fx-base.x,fz-base.z);
 if(R.jump>=0)updateJump(dt);else surfaceFish(R,dt,fx,fz,base,running);
 F.ripT-=dt;if(F.ripT<=0){F.ripT=running?.22:.5;addRipple(fx,fz,running?.9:.6);}if(running&&Math.random()<dt*6)splash(bobber.position,3,2.5);
 // sound: the reel clicks as you wind, the drag buzzes when the fish takes line, the line creaks near breaking point
 if(R.hold&&R.dist<before){R.click-=dt*wind*7;if(R.click<=0){R.click=1;AU.reelTick(R.tens);}}
 if(slip>.05||(!R.hold&&running&&pull>.35)){R.drag-=dt*(12+Math.min(slip+pull,3)*12);if(R.drag<=0){R.drag=1;AU.dragTick(clamp(.45+slip*.5,0,1));}}
 if(R.tens>.9){R.hot+=dt;if(R.hot>.2){R.hot=0;AU.creak(R.tens);}camShake(.05);}
 drawReelHUD(R,running);
 if(R.danger>R.snapT){snapLine();return;}
 if(R.dist>=R.max){loseFish('The fish ran out all your line and got away!');return;}
 if(R.dist<=1.4)landCatch();}
function drawReelHUD(R,running){const t=clamp(R.tens,0,1),arc=re('rfArc');
 arc.setAttribute('stroke-dasharray',(t*100).toFixed(1)+' 100');arc.setAttribute('stroke',t>.86?'#ff6a4a':t>.68?'#f2c14e':'#7fe08a');
 re('rfNeedle').style.transform=`rotate(${(-90+t*180+(t>.9?Math.sin(R.t*70)*3:0)).toFixed(1)}deg)`;re('rfGauge').classList.toggle('hot',t>.86);
 re('rfDist').textContent=R.dist.toFixed(1);re('rfStam').style.width=(R.stam*100).toFixed(0)+'%';re('rfFish').style.left=clamp(R.dist/R.max*100,3,97).toFixed(1)+'%';
 const hint=re('reelHint');let h,w=false;
 if(t>.86){h='Ease off! The line is about to snap';w=true;}else if(R.slack>.6){h='The line is going slack. Reel a little!';w=true;}else if(R.max-R.dist<4){h='Reel in! It has almost all your line';w=true;}
 else if(running&&R.style==='ray')h=R.hold?'It\'s diving! Let go until it stops':'It\'s diving. Wait it out';
 else if(running)h=R.hold&&R.pull>.7?'It\'s running. Let go and let the drag work':isTouch?'Hold to reel · drag against the run':'Hold to reel · A / D against the run';
 else h=R.stam<.25?'It\'s tired. Wind it in!':isTouch?'Hold anywhere to reel in':'Hold click or Space to reel in';
 if(hint.textContent!==h)hint.textContent=h;hint.classList.toggle('warn',w);
 const sEl=re('rfSteer');if(running&&R.pull>.25){const want=-R.runDir,ok=R.steer*want>.3;const txt=ok?`<span class="ok">${want<0?'◀ ':''}Good pull!${want>0?' ▶':''}</span>`:want<0?'◀ Pull left':'Pull right ▶';if(sEl.dataset.h!==txt){sEl.innerHTML=txt;sEl.dataset.h=txt;}if(sEl.className!=='on')sEl.className='on';}else if(sEl.className)sEl.className='';}
function startJump(){const R=F.reel,c=F.catch;R.jumpT=R.style==='long'?rand(2.4,4.5):rand(4,8);R.jump=0;if(!R.fishM){R.fishM=buildFish(c.sp,c.mut);R.fishM.scale.setScalar(fishScale(c.sp,c.w));scene.add(R.fishM);}R.fishM.visible=true;
 R.ja=Math.atan2(F.dir.z,F.dir.x)+R.runDir*Math.PI/2;R.jx=bobber.position.x;R.jz=bobber.position.z;AU.leap();splash(bobber.position,16,5);
 if(!R.known){R.known=true;re('reelName').textContent=c.sp.name;}}
function updateJump(dt){const R=F.reel,T=WIND.uTime.value;R.jump+=dt;const k=R.jump/.9,hx=Math.cos(R.ja),hz=Math.sin(R.ja);
 if(k>=1){R.jump=-1;R.fishM.visible=false;const x=R.jx+hx*1.8,z=R.jz+hz*1.8,p=new V3(x,surfY(x,z,T),z);splash(p,22,5.5);addRipple(x,z,1.5);AU.splash(1);camShake(.18);return;}
 const x=R.jx+hx*1.8*k,z=R.jz+hz*1.8*k;R.fishM.position.set(x,surfY(x,z,T)+Math.sin(k*Math.PI)*(1.3+R.str*.45)-.2,z);R.fishM.rotation.set(0,-R.ja,(.5-k)*2.3);if(R.fishM.userData.tail)R.fishM.userData.tail.rotation.y=Math.sin(R.jump*32)*.6;}
function surfaceFish(R,dt,fx,fz,base,running){const c=F.catch,near=R.dist<6.5&&!c.relic,T=WIND.uTime.value;
 if(!near){if(R.fishM&&R.fishM.visible&&R.jump<0)R.fishM.visible=false;R.surf=0;return;}
 if(!R.fishM){R.fishM=buildFish(c.sp,c.mut);R.fishM.scale.setScalar(fishScale(c.sp,c.w));scene.add(R.fishM);}
 if(!R.surf){R.surf=1;splash(bobber.position,14,4.5);AU.splash(.6);if(!R.known){R.known=true;re('reelName').textContent=c.sp.name;floatTip(c.sp.name+'!');}}
 const m=R.fishM;m.visible=true;const a=Math.atan2(base.x-fx,base.z-fz),thr=(running?1:.5)+R.tens*.6,wig=Math.sin(R.t*(14+thr*10))*(.35+thr*.25);
 m.position.set(fx+Math.cos(a)*.35,surfY(fx,fz,T)-.18+Math.abs(Math.sin(R.t*7))*.12*thr,fz-Math.sin(a)*.35);m.rotation.set(0,a+Math.PI/2+wig*.5,Math.sin(R.t*11)*.35*thr);
 if(m.userData.tail)m.userData.tail.rotation.y=wig*1.2;if(Math.random()<dt*(3+thr*5))splash(m.position,3+Math.round(thr*3),2.5+thr);if(Math.random()<dt*2)addRipple(fx,fz,.7);}
function snapLine(){AU.snap();buzz([60,40,90]);camShake(.4);loseFish('Snap! The line broke. Let go of the reel when the needle reaches red.',true);}
function loseFish(msg,snapped){endFightUI();F.st='retract';F.t=0;F.retFrom.copy(bobber.position);if(!snapped)AU.escape();toast(F.catch&&F.catch.relic?'The relic slipped off the hook…':msg);}
function landCatch(){endFightUI();const c=F.catch;AU.catch(c.relic?3:c.r);buzz(c.r>=3?[30,50,30,50,60]:40);camShake(c.r>=3?.3:.16);splash(bobber.position,22,6);F.flyFrom.copy(bobber.position);if(c.r>=3||c.relic)catchBeam(bobber.position,c.relic?'#9eeaff':c.r===6?'#e8e0ff':RAR[c.r].c);addRipple(bobber.position.x,bobber.position.z,1.5);bobber.visible=false;fline.visible=false;
 let held,card;const id=rid();
 if(c.relic){state.relics++;questEvent('relic');held=buildRelic();held.scale.setScalar(.8);card=`<div class="cc-new">TIDE RELIC</div><div class="cc-name">Tide Relic</div><div class="cc-tags"><span class="pill" style="--c:#c6f4ff">Enchant item</span></div><div class="muted">Offer it at the Tide Altar on Mossreach to enchant your rod.</div>`;gainXP(80);F.lastCatch={i:id,sp:'relic',m:null,w:0};$('#catchCard').style.setProperty('--rc','#9eeaff');}
 else{const f={id:state.uid++,sp:c.sp.id,w:c.w,mut:c.mut,lock:false};if(c.sp.zone==='well'&&F.wellIsl)f.vk=Math.round(ZONE_BASE[F.wellIsl]/WELL_REF*100)/100;state.inv.push(f);const dx=state.dex[c.sp.id]||(state.dex[c.sp.id]={n:0,best:0,muts:[]});const isNew=dx.n===0;if(isNew&&c.r>=3)setTimeout(()=>grantCrate('a new '+RAR[c.r].n+' species'),1400);dx.n++;dx.best=Math.max(dx.best,c.w);if(c.mut&&!dx.muts.includes(c.mut))dx.muts.push(c.mut);if(Math.random()<stats().dbl&&state.inv.length<maxInv()){state.inv.push({id:state.uid++,sp:c.sp.id,w:rollWeight(c.sp,stats().wt),mut:c.mut,lock:false});dx.n++;setTimeout(()=>toast('Double catch! A second '+c.sp.name+' came up too.','gold'),600);}
  held=buildFish(c.sp,c.mut);held.scale.setScalar(fishScale(c.sp,c.w));
  card=`${isNew?'<div class="cc-new">NEW SPECIES</div>':''}<div class="cc-name">${c.mut?MUTS[c.mut].n+' ':''}${esc(c.sp.name)}</div><div class="cc-tags">${rarPill(c.r)}${c.mut?mutPill(c.mut):''}</div><div class="cc-stats"><span><b>${fmtW(c.w)} kg</b>Weight</span><span><b>${fmt(fishValue(f))}c</b>Value</span></div>`;
  const avg=(c.sp.minW+c.sp.maxW)/2;gainXP(RAR[c.r].xp*(c.mut?1.5:1)*clamp(c.w/avg,.6,2));F.lastCatch={i:id,sp:c.sp.id,m:c.mut||null,w:c.w};$('#catchCard').style.setProperty('--rc',RAR[c.r].c);
  {const pz=pondAt(F.to.x,F.to.z);if(typeof bountyCatch==='function')bountyCatch(c,F.zone);if(typeof checkEarnedRods==='function')checkEarnedRods();if(typeof derbyCatch==='function')derbyCatch(c);questEvent('catch',{sp:c.sp.id,w:c.w,mut:c.mut,r:c.r,zone:F.zone,isl:pz?pz.isl:zoneAt(F.to.x,F.to.z),night:isNight(),sea:player.mode==='boat'&&zoneAt(player.pos.x,player.pos.z)==='sea',ev:!!(env.event&&env.event.big)});card+=catchQuestInfo();}
  if(F.inSchool)F.inSchool=false;
  if(isNotable(c.r,c.mut)){addFeed(profileOr().name,c.sp,c.mut,c.w,profileOr().color,true,id);if(typeof netOnMyCatch==='function')netOnMyCatch(c,id);}}
 const cc=$('#catchCard');cc.innerHTML=card;cc.hidden=false;cc.onclick=()=>finishCatch();
 F.held=held;prig.root.add(held);prig.root.updateMatrixWorld(true);prig.root.worldToLocal(F.flyFrom);held.position.copy(F.flyFrom);rodObj.g.visible=false;player.face=cam.yaw;F.st='caught';F.t=0;save();updateHUD();}
function finishCatch(){if(F.st!=='caught')return;$('#catchCard').hidden=true;disposeHeld(F.held);F.held=null;rodObj.g.visible=true;F.st='idle';
 if(!state.tips.sell&&state.inv.length>=3){state.tips.sell=1;toast('Sell your catch to a Fish Merchant for coins.');}}
/* small motions that make the tackle feel alive: floats rock on the swell, lures point back up the line and wobble, spinner blades turn */
const _lc=new THREE.Color();
function lineLook(line,id,T){const L=LINEM[id]||LINEM.basic;_lc.set(L.c);if(L.shift)_lc.setHSL((T*.08)%1,.85,.65);if(L.glow)_lc.multiplyScalar(2.2);line.material.color.copy(_lc);line.material.opacity=L.r==='basic'?.7:.95;}
function updateTackle(dt,T){const u=bobber.userData,b=bobber,R=F.reel;const base=fightBase(),face=Math.atan2(base.x-b.position.x,base.z-b.position.z);
 if(u.blade)u.blade.rotation.y+=dt*(F.st==='reeling'&&R&&R.hold?34:F.twK>0?24:F.st==='retract'?30:1.5);
 const rock=F.st==='bite'?Math.sin(F.t*30)*.3:F.st==='reeling'?.35+Math.sin(F.t*14)*.15:Math.sin(T*2.1+1)*.08+F.twK*.25;
 if(u.flat){b.rotation.set(0,face+Math.PI+Math.sin(T*3)*.15*(F.st==='waiting'?1:.3),0);b.rotateZ(Math.sin(T*5)*.12+(F.st==='reeling'?Math.sin(F.t*20)*.3:0));}
 else{b.rotation.set(0,face,0);b.rotateX(-rock);}}
const tipPos=new V3();
function updateFishing(dt){F.t+=dt;const T=WIND.uTime.value;
 if(F.st==='charging'){const p=(F.t/1.15)%2;F.power=p>1?2-p:p;re('powFill').style.width=(F.power*100)+'%';re('powTxt').textContent=Math.round(F.power*100)+'%';const d=camFwd();player.face=Math.atan2(d.x,d.z);}
 else if(F.st==='casting'){const k=clamp(F.t/F.flight,0,1);const wy=surfY(F.to.x,F.to.z,T);bobber.position.set(lerp(F.from.x,F.to.x,k),lerp(F.from.y,wy,k)+Math.sin(k*Math.PI)*F.arc,lerp(F.from.z,F.to.z,k));F.trT=(F.trT||0)-dt;if(F.trT<=0&&k<.92){F.trT=.05;spawnPuff(bobber.position.x,bobber.position.y,bobber.position.z,'#e8f4ff');}
  if(k>=1){F.st='waiting';F.t=0;{const pd=pondAt(F.to.x,F.to.z);F.zone=pd?pd.key:zoneAt(F.to.x,F.to.z);{const w=!pd&&wellAt(F.to.x,F.to.z);F.wellIsl=w?w.isl:null;if(w){F.zone='well';if(!state.tips.well){state.tips.well=1;toast('You\'re fishing in a Tide Well! Only rare fish bite here, and they live nowhere else.','gold');}}}if(pd){ringAt(F.to.x,pd.y+.03,F.to.z,1.2,1.4);if(!state.tips['p_'+pd.key]){state.tips['p_'+pd.key]=1;toast(`You're fishing in ${ZONES[pd.key].n}. Its fish live nowhere else.`);}}}
   if(onCastLanded())return;F.wait=rand(8,16)*stats().wait;F.nibT=rand(2,4);F.nib=0;F.twT=0;F.twK=0;F.ripT=1.5;AU.splash(.8);AU.plop();splash(bobber.position,12,4);addRipple(F.to.x,F.to.z,1.2);useBait();
   if(!state.tips.strike){state.tips.strike=1;toast('Twitch the lure to tempt a fish. When the float dives under, strike!');}}}
 else if(F.st==='waiting'){F.twT-=dt;F.twK=Math.max(0,F.twK-dt*5);F.nib=Math.max(0,F.nib-dt);const dip=F.nib>0?Math.sin(F.nib/.5*Math.PI)*.2:0;
  bobber.position.set(F.to.x,surfY(F.to.x,F.to.z,T)+Math.sin(T*3)*.05-dip-F.twK*.12,F.to.z);F.wait-=dt;F.ripT-=dt;if(F.ripT<=0){F.ripT=rand(1.8,3);addRipple(F.to.x,F.to.z,.45);}
  F.nibT-=dt;if(F.nibT<=0&&F.wait>.8){F.nibT=F.wait<5?rand(1,2.2):rand(2.5,5);F.nib=.5;AU.nibble();addRipple(F.to.x,F.to.z,.5);}
  F.twN=Math.max(0,(F.twN||0)-dt*.6);F.spookT=Math.max(0,(F.spookT||0)-dt);if(!MENU.on&&!(F.spookT>0))fishTip(F.nib>0?'<b>Nibble!</b> Twitch now to tempt it':isTouch?'Tap to twitch the lure · <b>Reel</b> to pull it back':'<b>Space</b> or click to twitch the lure · <b>F</b> to reel back',F.nib>0?'nib':'');
  if(F.wait<=0)startBite();}
 else if(F.st==='bite'){const bk=Math.min(1,F.t*1.6),tow=Math.min(.9,F.t*1.4),shk=Math.sin(F.t*34)*(.16-bk*.08);if(F.biteFrom){F.to.x=F.biteFrom.x+Math.cos(F.biteA)*tow;F.to.z=F.biteFrom.z+Math.sin(F.biteA)*tow;}
  bobber.position.set(F.to.x+shk*.4,surfY(F.to.x,F.to.z,T)-.35-bk*.4+shk,F.to.z);biteShadowAt(F.to.x,surfY(F.to.x,F.to.z,T)-.5,F.to.z,F.biteA,F.t);exclaim.position.set(prig.root.position.x,prig.root.position.y+HEAD_TOP+1.25+Math.sin(F.t*12)*.15,prig.root.position.z);
  F.ripT-=dt;if(F.ripT<=0){F.ripT=.22;addRipple(F.to.x,F.to.z,.8);if(Math.random()<.5)splash(bobber.position,4,3);}if(F.t>F.hookWin)missBite();}
 else if(F.st==='reeling')updateReel(dt);
 else if(F.st==='retract'){rodObj.tip.getWorldPosition(tipPos);const k=clamp(F.t/.35,0,1);bobber.position.lerpVectors(F.retFrom,tipPos,k);if(k>=1){F.st='idle';bobber.visible=false;fline.visible=false;}}
 else if(F.st==='caught'){if(F.held){const k=clamp(F.t/.5,0,1),e=1-Math.pow(1-k,3),hy=HEAD_TOP+.75+Math.sin(F.t*4)*.08*k;F.held.position.set(lerp(F.flyFrom.x,0,e),lerp(F.flyFrom.y,hy,e)+Math.sin(k*Math.PI)*2.2,lerp(F.flyFrom.z,0,e));
   F.held.rotation.y=Math.sin(F.t*2)*.25;F.held.rotation.z=Math.sin(F.t*9)*.14*Math.max(0,1-F.t/2.5)+(1-e)*F.t*12;if(F.held.userData.tail)F.held.userData.tail.rotation.y=Math.sin(F.t*14)*.45;if(F.t>=.5&&F.t-dt<.5)AU.flop();}if(F.t>3.4)finishCatch();}
 if(fline.visible){rodObj.tip.getWorldPosition(tipPos);const sag=F.st==='reeling'&&F.reel?lerp(.8,.02,clamp(F.reel.tens*1.4,0,1))+(F.reel.tens>.75?Math.sin(F.t*60)*.05*(F.reel.tens-.75)*4:0):F.st==='casting'?.2:F.st==='bite'?.12:1.2;drawLine(fline,tipPos,bobber.position,sag,bobber.userData.top);updateTackle(dt,T);lineLook(fline,state.line,T);}
 if(isTouch){const cb=re('castBtn'),lb=F.st==='waiting'||F.st==='casting'?'REEL':F.st==='caught'?'DONE':'CAST';if(cb.textContent!==lb)cb.textContent=lb;}}

/* ---------- XP / HUD ---------- */
const xpNeed=l=>Math.round(80*Math.pow(l,1.45));
function gainXP(n){state.xp+=Math.round(n*stats().xp);let up=false;while(state.xp>=xpNeed(state.level)){state.xp-=xpNeed(state.level);state.level++;up=true;state.crates=(state.crates||0)+1;setTimeout(()=>toast('+1 Mystery Crate for reaching level '+state.level+'! Open it from your tackle (slot 2).','gold'),1600);const bonus=state.level*50;state.coins+=bonus;state.earned+=bonus;AU.level();toast(`Level ${state.level}! +${fmt(bonus)} coins, +1.5% luck`,'gold');}if(up){checkLevelTitles();rebuildPlayerTag();}}
function rarPill(r){const R=RAR[r];return `<span class="pill ${r===6?'secret':r===5?'exotic':''}" style="--c:${R.p}">${R.n}</span>`;}
function mutPill(m){return `<span class="pill" style="--c:${MUTS[m].c}">${MUTS[m].n} ×${MUTS[m].m}</span>`;}
const HUDC={last:null};
function coinPop(c){const prev=HUDC.last;HUDC.last=c;if(prev===null||prev===c)return;const box=document.querySelector('.coins');if(!box)return;const d=c-prev,el=document.createElement('span');el.className='cpop'+(d<0?' neg':'');el.textContent=(d>0?'+':'−')+Math.abs(d).toLocaleString('en-US');box.appendChild(el);setTimeout(()=>el.remove(),1400);box.classList.remove('bump');void box.offsetWidth;box.classList.add('bump');}
function updateHUD(){const c=Math.round(state.coins);$('#coinTxt').textContent=c>=1e9?fmt(c):c.toLocaleString('en-US');coinPop(c);const need=xpNeed(state.level);$('#lvlTxt').textContent='Level '+state.level;$('#wallet').title=`Level ${state.level} · ${fmt(state.xp)} / ${fmt(need)} XP${state.relics?' · '+state.relics+' relic'+(state.relics>1?'s':''):''}`;$('#lvlNum').textContent=state.level;$('#xpTxt').textContent=fmt(state.xp)+' / '+fmt(need)+' XP';$('#xpFill').style.width=Math.min(100,state.xp/need*100)+'%';$('#relicTxt').textContent=state.relics?state.relics+' relic'+(state.relics>1?'s':''):'';updateGear();}
function updateGear(){if(typeof renderHotbar==='function')renderHotbar();const r=RODM[state.rod],e=state.ench[state.rod];const b=state.baitOn?`${BAITM[state.baitOn].n} ×${state.bait[state.baitOn]||0}`:'No bait';$('#gear').textContent=`${r.n}${e?' · '+ENCH[e].n:''} · ${b} · Bag ${state.inv.length}/${maxInv()}${state.settings.chill?' · Chill':''}`;}
function coinBurst(n){const tgt=document.querySelector('.coins')||document.getElementById('coinTxt');if(!tgt)return;const r=tgt.getBoundingClientRect();for(let i=0;i<n;i++){const c=document.createElement('i');c.className='coinFly';c.style.left=(innerWidth/2+rand(-80,80))+'px';c.style.top=(innerHeight*.5+rand(-40,40))+'px';c.style.setProperty('--dx',(r.left+r.width/2-innerWidth/2)+'px');c.style.setProperty('--dy',(r.top+r.height/2-innerHeight*.5)+'px');c.style.animationDelay=(i*.05)+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),1100+i*50);}}
function toast(msg,cls){const el=document.createElement('div');el.className='toast glass'+(cls?' '+cls:'');el.textContent=msg;const box=$('#toasts');box.appendChild(el);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),450);},3000);}
let zoneTO=null;function showZone(k){const z=ZONES[k];const el=$('#zoneBan');el.innerHTML=`${esc(z.n)}<small>${esc(z.tag)}</small>`;el.classList.add('show');clearTimeout(zoneTO);zoneTO=setTimeout(()=>el.classList.remove('show'),2800);}
const ICO={"sun": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6\"/></svg>", "dusk": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 16a5 5 0 0 1 10 0\"/><path d=\"M3 16h18M5 20h14M12 5v3M5.6 9.6l1.6 1.4M18.4 9.6 16.8 11\"/></svg>", "moon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 14.6A7.6 7.6 0 0 1 9.4 5a7.6 7.6 0 1 0 9.6 9.6z\"/></svg>", "cloud": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 18a4.5 4.5 0 0 1 .4-9 6 6 0 0 1 11.3 2.3A3.4 3.4 0 0 1 17.6 18z\"/></svg>", "rain": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 14.5a4.2 4.2 0 0 1 .4-8.4 5.6 5.6 0 0 1 10.6 2.1 3.2 3.2 0 0 1-.6 6.3z\"/><path d=\"M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5\"/></svg>", "snow": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 14.5a4.2 4.2 0 0 1 .4-8.4 5.6 5.6 0 0 1 10.6 2.1 3.2 3.2 0 0 1-.6 6.3z\"/><path d=\"M8 19h.01M12 20.5h.01M16 19h.01\" stroke-width=\"2.8\"/></svg>", "storm": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 14.5a4.2 4.2 0 0 1 .4-8.4 5.6 5.6 0 0 1 10.6 2.1 3.2 3.2 0 0 1-.6 6.3z\"/><path d=\"M12.5 13.5 10 18h3.5L11 22\"/></svg>", "fog": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 9h12M6 13h14M4 17h11\"/></svg>", "wind": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 13h15a2.5 2.5 0 1 1-2.5 2.5M3 17h7\"/></svg>", "spark": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z\"/><path d=\"M18.5 15.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z\"/></svg>", "clover": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 12c-2.6-.2-4.6-1.6-4.6-3.6A2.2 2.2 0 0 1 12 7.6a2.2 2.2 0 0 1 4.6.8c0 2-2 3.4-4.6 3.6zm0 0c.2 2.6 1.6 4.6 3.6 4.6a2.2 2.2 0 0 0-.8-4.6M12 12c-.2 2.6-1.6 4.6-3.6 4.6a2.2 2.2 0 0 1 .8-4.6\"/><path d=\"M12 12c1 3.5 2.4 6 4.4 8.5\"/></svg>", "gem":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linejoin=\"round\"><path d=\"M12 3 19 10 12 21 5 10z\"/><path d=\"M5 10h14M12 3l-2.5 7L12 21l2.5-11z\"/></svg>","swirl": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 12.5a1.2 1.2 0 1 1 1.2-1.2 2.6 2.6 0 0 1-2.6 2.6A3.9 3.9 0 0 1 6.7 10a5.2 5.2 0 0 1 5.2-5.2 6.5 6.5 0 0 1 6.5 6.5 7.8 7.8 0 0 1-7.8 7.8\"/></svg>"};
let lastIco='';
function updateClockHUD(){const h=env.t*24,hh=Math.floor(h),mm=Math.floor((h-hh)*6)*10;$('#clockTxt').textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');{const si=document.getElementById('stIcons');if(si)si.title=$('#clockTxt').textContent+' · '+$('#wxTxt').textContent;}
 $('#wxTxt').textContent=env.dusk>.4&&env.day>.2?(env.t<.5?'Dawn':'Golden hour'):(isNight()?'Night':WX[env.weather]);const wl=env.snowK>.5&&(env.weather==='rain'||env.weather==='storm')?'Snow':WX[env.weather];if(env.snowK>.5&&wl==='Snow')$('#wxTxt').textContent=wl;if(isNight()&&env.weather!=='clear')$('#wxTxt').textContent='Night · '+wl;
 {const tI=isNight()?'moon':env.dusk>.4&&env.day>.2?'dusk':'sun',wI=env.weather==='storm'?'storm':env.weather==='rain'?(env.snowK>.5?'snow':'rain'):env.weather==='fog'?'fog':env.weather==='cloudy'?'cloud':'',wd=WAVE.amp>1.7&&env.weather!=='storm'?'wind':'';
  let ex='';if(env.event)ex+=`<i class="si ev" style="color:${env.event.c}" title="${env.event.n}">${ICO.spark}</i>`;if(typeof activeWells==='function'&&activeWells().length)ex+=`<i class="si well" title="A Tide Well is open">${ICO.swirl}</i>`;if(state.buffs&&Object.values(state.buffs).some(v=>v>0))ex+=`<i class="si buff" title="Brew active">${ICO.clover}</i>`;if(state.relics>0)ex+=`<i class="si relic" title="${state.relics} Tide Relic${state.relics>1?'s':''}: click to spend them">${ICO.gem}<b>${state.relics}</b></i>`;
  const key=ex+tI+wI+wd;if(key!==lastIco){lastIco=key;$('#stExtra').innerHTML=ex;$('#clockIco').innerHTML=(wd?`<i class="si" title="Windy">${ICO.wind}</i>`:'')+(wI?`<i class="si">${ICO[wI]}</i>`:'')+`<i class="si">${ICO[tI]}</i>`;}}
 const eb=$('#eventBan'),mmss2=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(env.event){eb.hidden=false;eb.classList.toggle('big',!!env.event.big);eb.style.setProperty('--ev',env.event.c);const s=Math.ceil(env.eventT);eb.innerHTML=`<i></i>${env.event.n} · ${mmss2(s)}<small>${env.event.d}</small>`;}
 else if(env.bigSoon&&env.bigSoon.warn<=BIG_WARN){eb.hidden=false;eb.classList.add('big');eb.style.setProperty('--ev',env.bigSoon.ev.c);eb.innerHTML=`<i></i>${env.bigSoon.ev.n} begins in ${mmss2(Math.ceil(env.bigSoon.warn))}<small>A big event is coming to the isles</small>`;}else eb.hidden=true;}

/* ---------- interaction ---------- */
let curInter=null,disembarkSpot=null,disTimer=0;
function findDisembark(p=boat.pos){let best=null,bd=1e9;for(let a=0;a<20;a++){for(const r of[3,4.5,6,7.5]){const x=p.x+Math.cos(a/20*TAU)*r,z=p.z+Math.sin(a/20*TAU)*r;const g=groundH(x,z);if(g>.35&&r<bd&&!world.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.6)){bd=r;best={x,z,g};}}}return best;}
function updateInteract(dt){let it=null;
 if(!uiBlocked()&&!PHOTO.on&&F.st==='idle'){
  if(player.mode==='ride'){it={label:`Hop off ${RIDE?RIDE.name+'\'s':'the'} boat`,kind:'Leave',act:()=>stopRide(false)};}
  else if(player.mode==='boat'&&isPlane()&&(boat.fly||boat.speed>BOATM[state.boat].speed*.55)){it=boat.fly?(boat.land?null:{label:'Land on the water',kind:'Land',act:planeToggle}):{label:'Take off',kind:'Fly',act:planeToggle};}
  else if(player.mode==='boat'){it=wellPrompt();if(!it){const pp=potPrompt();if(pp&&pp.d<5.5)it=pp;}if(!it){disTimer-=dt;if(disTimer<=0){disembarkSpot=findDisembark();disTimer=.3;}if(disembarkSpot&&Math.abs(boat.speed)<4)it={label:'Leave the boat',kind:'Leave',act:disembark};if(!it)it=potPrompt();}}
  else{let bd=1e9;for(const o of world.inter){const d=Math.hypot(o.x-player.pos.x,o.z-player.pos.z);if(d<o.r&&d<bd){bd=d;it=o;}}const db=Math.hypot(boat.pos.x-player.pos.x,boat.pos.z-player.pos.z);if(db<5.5&&db<bd)it={label:'Board the boat',kind:'Board',act:board};{const rp=ridePrompt();if(rp&&(!it||rp.d<Math.min(bd,db)))it=rp;}}}
 curInter=it;const pr=$('#prompt'),ab=$('#actBtn');
 if(it){pr.hidden=false;const html=(isTouch?'':'<kbd>E</kbd>')+esc(it.label);if(pr.dataset.h!==html){pr.innerHTML=html;pr.dataset.h=html;}ab.hidden=!isTouch;ab.textContent=it.kind||'Use';}else{pr.hidden=true;pr.dataset.h='';ab.hidden=true;}}
function doInteract(){if(uiBlocked()||PHOTO.on)return;if(curInter){AU.ui();curInter.act();}}
/* seaplanes: Space or E takes off once you're up to speed, and lands again on open water */
const isPlane=()=>!!(BOATM[state.boat]&&BOATM[state.boat].plane);
function planeToggle(){if(!isPlane())return;const B=BOATM[state.boat];
 if(!boat.fly){if(F.st!=='idle')cancelFishing();if(boat.speed<B.speed*.55){toast('Hold W to get up to speed, then take off.');return;}boat.fly=true;boat.land=false;boat.vy=2.5;boat.climb=0;AU.leap();splash(boat.pos.clone(),20,5);toast('Airborne! A / D to steer, W for full speed, S to slow down. Press Space or E over open water to land.');}
 else if(!boat.land){if(groundH(boat.pos.x,boat.pos.z)>-1.2){toast('Find open water to land.');return;}boat.land=true;toast('Coming in to land…');}}
function board(){stopEmote();player.mode='boat';cam.tdist=17;boat.speed=0;boat.alt=0;boat.fly=false;boat.land=false;boat.vy=0;boat.climb=0;boat.bank=0;if(isPlane())setTimeout(()=>toast('Seaplane: hold W to speed up, then press Space or E to take off.'),2600);toast(isTouch?'Joystick up to sail, left and right to steer.':'W/S to sail, A/D to steer, arrow keys turn the camera. Press E near land to get off.');}
function disembark(){const s=disembarkSpot||findDisembark();if(!s){toast('Steer closer to land or a dock to get off.');return;}player.mode='walk';player.pos.set(s.x,s.g,s.z);player.vy=0;cam.tdist=12;boat.speed=0;}

/* ---------- emotes ---------- */
function playEmote(t){if(uiBlocked()||PHOTO.on)return;hideEmotes();if(F.st!=='idle'){toast('Finish fishing first.');return;}if(player.mode==='boat'){toast('Hop off the boat to emote.');return;}
 let f=null;if(t==='show'){const best=state.inv.slice().sort((a,b)=>fishValue(b)-fishValue(a))[0];if(!best){toast('Catch a fish first, then show it off!');return;}f={sp:best.sp,m:best.mut||null,w:best.w};}
 stopEmote();player.emote=t;player.emType=t;player.emT=0;player.emId=rid();player.emFish=f;if(f){const sp=SPM[f.sp];const m=buildFish(sp,f.m);m.scale.setScalar(fishScale(sp,f.w));m.position.set(0,HEAD_TOP+.75,0);prig.root.add(m);player.emHeld=m;rodObj.g.visible=false;}
 if(t==='cheer')AU.cheer();if(t==='wave')player.face=cam.yaw;if(t==='show')player.face=cam.yaw;}
function stopEmote(){if(!player||!player.emote)return;player.emote=null;if(player.emHeld){disposeHeld(player.emHeld);player.emHeld=null;}if(rodObj&&F.st!=='caught')rodObj.g.visible=true;}
function hideEmotes(){$('#emoteMenu').hidden=true;}
$('#emoteBtn').addEventListener('click',()=>{AU.init();AU.ui();const m=$('#emoteMenu');m.hidden=!m.hidden;});
$('#emoteMenu').addEventListener('click',e=>{const b=e.target.closest('[data-emote]');if(b)playEmote(b.dataset.emote);});

/* ---------- photo mode ---------- */
const PHOTO={on:false,timeSet:false,idle:0};
function togglePhoto(on){if(on===PHOTO.on)return;PHOTO.on=on;document.body.classList.toggle('photo',on);$('#photoBar').hidden=!on;hideEmotes();
 if(on){if(F.st==='charging'){F.st='idle';$('#power').hidden=true;}PHOTO.timeSet=false;const r=$('#photoTime');r.value=env.t;r.style.setProperty('--p',(env.t*100)+'%');PHOTO.idle=0;$('#photoBar').classList.remove('dim');toast('Photo mode: drag to frame your shot. Press P or Exit to return.');}
 else{cam.tdist=clamp(cam.tdist,5,32);}}
$('#photoBtn').addEventListener('click',()=>{AU.init();togglePhoto(true);});$('#photoExit').addEventListener('click',()=>togglePhoto(false));
$('#photoTime').addEventListener('input',e=>{env.t=Number(e.target.value);PHOTO.timeSet=true;e.target.style.setProperty('--p',(env.t*100)+'%');});
addEventListener('pointermove',()=>{if(PHOTO.on){PHOTO.idle=0;$('#photoBar').classList.remove('dim');}});addEventListener('pointerdown',()=>{if(PHOTO.on){PHOTO.idle=0;$('#photoBar').classList.remove('dim');}});

/* ---------- player / boat / camera updates ---------- */
let lockToastT=0;
const _rgt=new V3(),_camT=new V3();
function updatePlayer(dt){const lock=uiBlocked()||['reeling','caught','bite'].includes(F.st);const ix=lock?0:input.x,iy=lock?0:input.y;const R=prig.root;
 if(player.mode==='walk'){const mag=Math.hypot(ix,iy);
  if(mag>.08){if(['charging','casting','waiting'].includes(F.st))cancelFishing();stopEmote();}
  const fwd=camFwd(),right=_rgt.set(Math.cos(cam.yaw),0,-Math.sin(cam.yaw));const mv=fwd.multiplyScalar(iy).add(right.multiplyScalar(ix));
  const run=!!(keys.ShiftLeft||keys.ShiftRight)||Math.hypot(joy.x,joy.y)>.95;player.speed=damp(player.speed,(run?12.5:7)*mag*(DEV.fast?3:1),run?10:18,dt);
  if(mag>.08){player.face=Math.atan2(mv.x,mv.z);player.dx=mv.x/mag;player.dz=mv.z/mag;}
  if(player.speed>.05&&player.dx!=null){const st=player.speed*dt,nx=player.pos.x+player.dx*st,nz=player.pos.z+player.dz*st;const ok=(x,z)=>{const g=groundH(x,z);return g>.1&&g<player.pos.y+.95;};
   if(ok(nx,nz)){player.pos.x=nx;player.pos.z=nz;}else if(ok(nx,player.pos.z))player.pos.x=nx;else if(ok(player.pos.x,nz))player.pos.z=nz;
   for(const c of world.colliders){const dx=player.pos.x-c.x,dz=player.pos.z-c.z,rr=c.r+.55,d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);const px=c.x+dx/d*rr,pz=c.z+dz/d*rr;if(ok(px,pz)){player.pos.x=px;player.pos.z=pz;}}}}
  const g=groundH(player.pos.x,player.pos.z);player.vy-=32*dt;player.pos.y+=player.vy*dt;const was=player.onGround;
  if(player.pos.y<=g){player.pos.y=g;player.vy=0;player.onGround=true;if(!was){AU.step('grass');if(player.zone!=='sea'&&!onDock(player.pos.x,player.pos.z))for(let i=0;i<3;i++)spawnPuff(player.pos.x,player.pos.y,player.pos.z,player.zone==='frost'?'#f4f8ff':'#d8d0b0');}}else if(player.onGround&&player.pos.y-g<.6&&player.vy<=0){player.pos.y=g;player.vy=0;}else player.onGround=false;
  if(g<-1){const sp=world.spawn[zoneAt(player.pos.x,player.pos.z)]||world.spawn.cove;player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);}
  R.position.copy(player.pos);
 }else if(player.mode==='ride'){updateRide(dt);R.position.copy(player.pos);}
 else if(isPlane()&&(boat.fly||boat.alt>.05)){/* seaplane in the air: steady cruise, smooth climbs, keeps clear of land, lands only on open water */
  const th=iy,steer=ix,B=BOATM[state.boat],cruise=B.fly*(DEV.fast?2:1);
  const tgtS=boat.land?Math.max(B.speed*.75,cruise*.5):cruise*(th>.1?1:th<-.1?.6:.8);boat.speed=damp(boat.speed,tgtS,.7,dt);
  boat.yaw-=steer*B.turn*.8*dt;boat.bank=damp(boat.bank||0,-steer*.42,3,dt);
  const fx=Math.sin(boat.yaw),fz=Math.cos(boat.yaw);boat.pos.x+=fx*boat.speed*dt;boat.pos.z+=fz*boat.speed*dt;
  /* look up to three seconds ahead so hills never take the plane by surprise */
  const look=Math.max(24,boat.speed*3);let clear=-5,near=-5;for(let i=0;i<=8;i++){const d=look*i/8,g=groundH(boat.pos.x+fx*d,boat.pos.z+fz*d);clear=Math.max(clear,g);if(d<=boat.speed*1.4)near=Math.max(near,g);}
  if(boat.land&&near>-1.2&&boat.alt>1.5){boat.land=false;toast('Land ahead, pulling up. Line up over open water to land.');}
  const tgt=boat.land?0:Math.max(26,clear+14),want=clamp((tgt-boat.alt)*.8,boat.land?-3.5:-4.5,6.5);
  boat.vy=damp(boat.vy||0,want,2.2,dt);boat.alt=Math.max(0,boat.alt+boat.vy*dt);
  {const floor=groundH(boat.pos.x,boat.pos.z)+3.5;if(boat.alt<floor&&!(boat.land&&floor<2.4)){boat.alt=lerp(boat.alt,floor,Math.min(1,dt*8));boat.vy=Math.max(boat.vy,3);}}
  boat.climb=clamp(Math.atan2(boat.vy,Math.max(10,boat.speed)),-.28,.28);
  if(boat.land&&boat.alt<.3){if(groundH(boat.pos.x,boat.pos.z)>-1.2){boat.land=false;boat.vy=3;toast('Find open water to land.');}else{boat.fly=false;boat.land=false;boat.alt=0;boat.vy=0;boat.climb=0;boat.bank=0;boat.speed=Math.min(boat.speed,B.speed*.5);splash(boat.pos.clone(),26,6);AU.splash(1);camShake(.15);toast('Landed. You can fish from the floats.');}}
  lockToastT-=dt;for(const k of ISL){if(state.unlocked.includes(k))continue;const I=ZONES[k];const dx=boat.pos.x-I.x,dz=boat.pos.z-I.z,d=Math.hypot(dx,dz),lim=I.R*1.8;if(d<lim){boat.pos.x=I.x+dx/d*lim;boat.pos.z=I.z+dz/d*lim;boat.yaw+=angDiff(boat.yaw,Math.atan2(dx,dz))*Math.min(1,dt*2.5);if(lockToastT<=0){toast(`${I.n} needs a sea chart. Buy one from a Harbormaster (${fmt(I.price)}c).`);lockToastT=4;}}}
  const bd=Math.hypot(boat.pos.x,boat.pos.z);if(bd>1250){boat.pos.x*=1250/bd;boat.pos.z*=1250/bd;boat.yaw+=angDiff(boat.yaw,Math.atan2(-boat.pos.x,-boat.pos.z))*Math.min(1,dt*2.5);if(lockToastT<=0){toast('Too far out. Turning back.');lockToastT=4;}}
  if(F.st!=='idle')cancelFishing();player.pos.copy(boat.pos);player.face=boat.yaw;{const ud=boat.g.userData;R.position.set(boat.pos.x+fx*ud.seat,boat.g.position.y+ud.seatY,boat.pos.z+fz*ud.seat);}}
 else{const th=iy,steer=ix;const bs=boatStats();boat.speed=damp(boat.speed,th*(th<0?bs.speed*.35:bs.speed)*(DEV.fast?2.5:1),1.3,dt);const tk=clamp(Math.abs(boat.speed)/5,.35,1)*(boat.speed<-.3?-1:1);boat.yaw-=steer*bs.turn*dt*tk;
  if(Math.abs(th)>.1&&['charging','casting','waiting'].includes(F.st))cancelFishing();
  const fx=Math.sin(boat.yaw),fz=Math.cos(boat.yaw);const nx=boat.pos.x+fx*boat.speed*dt,nz=boat.pos.z+fz*boat.speed*dt;const sg=boat.speed>=0?1:-1;const bl=boat.g.userData.len||2.8;const bx=nx+fx*bl*sg,bz=nz+fz*bl*sg;
  if(groundH(bx,bz)>-.9||world.seaRocks.some(r=>Math.hypot(r.x-bx,r.z-bz)<r.r)){if(Math.abs(boat.speed)>4){splash(new V3(bx,0,bz),8,3);AU.splash(.4);}boat.speed*=-.3;}else{boat.pos.x=nx;boat.pos.z=nz;}
  lockToastT-=dt;
  for(const k of ISL){if(state.unlocked.includes(k))continue;const I=ZONES[k];const dx=boat.pos.x-I.x,dz=boat.pos.z-I.z,d=Math.hypot(dx,dz),lim=I.R*1.8;if(d<lim){boat.pos.x=I.x+dx/d*lim;boat.pos.z=I.z+dz/d*lim;boat.speed*=.5;if(lockToastT<=0){toast(`${I.n} needs a sea chart. Buy one from a Harbormaster (${fmt(I.price)}c).`);lockToastT=4;}}}
  const bd=Math.hypot(boat.pos.x,boat.pos.z);if(bd>1250){boat.pos.x*=1250/bd;boat.pos.z*=1250/bd;boat.speed*=.5;if(lockToastT<=0){toast('The current is too strong out here. Turn back.');lockToastT=4;}}
  player.pos.copy(boat.pos);if(F.st==='idle'&&Math.abs(boat.speed)>.5)player.face=boat.yaw;
  boat.wake-=dt;if(Math.abs(boat.speed)>3&&boat.wake<=0){boat.wake=.32;addRipple(boat.pos.x-fx*(bl+.2),boat.pos.z-fz*(bl+.2),.8);if(Math.abs(boat.speed)>8)splash(new V3(boat.pos.x-fx*2.8,boat.g.position.y,boat.pos.z-fz*2.8),3,2);}
  {const ud=boat.g.userData;R.position.set(boat.pos.x+fx*ud.seat,boat.g.position.y+ud.seatY,boat.pos.z+fz*ud.seat);}}
 if(player.emote){player.emT+=dt;if(player.emote==='dance')player.face+=dt*1.2;if(player.emT>EMOTES[player.emote].d)stopEmote();}
 const pry=R.rotation.y;R.rotation.y+=angDiff(R.rotation.y,player.face)*(1-Math.exp(-20*dt));player.turn=damp(player.turn||0,angDiff(pry,R.rotation.y)/Math.max(dt,1e-3),8,dt);
 const fs=F.st==='caught'||player.emote==='show'?'caught':F.st;
 panim.update(dt,{spd:player.mode==='walk'?player.speed:0,ground:player.onGround,vy:player.vy,turn:player.mode==='walk'?player.turn:0,sit:player.mode==='boat'||player.mode==='ride',fish:fs,fishT:F.t,power:F.power,hold:F.st==='reeling'&&F.reel&&F.reel.hold,tens:F.reel?F.reel.tens:0,steer:F.reel?F.reel.steer:0,yank:F.reel?F.reel.yank:0,tw:F.twK,row:player.mode==='boat'?clamp(Math.abs(boat.speed)/12,0,1):0,oars:player.mode==='boat'&&(BOATM[state.boat]||BOATS[0]).m.type==='row',steerB:player.mode==='boat'?input.x:0,big:F.st==='caught'&&F.catch&&(F.catch.r>=3||!!F.catch.relic),emote:player.emote,emT:player.emT});
 if(rodObj){const rg=rodObj.g,R=F.reel;const bend=F.st==='casting'?(F.t<.16?-.55*Math.sin(F.t/.16*Math.PI):.12*Math.sin(F.t*30)*Math.max(0,1-F.t)):F.st==='charging'?-.18*F.power:F.st==='reeling'&&R?clamp(R.tens*1.1+(R.run>0?.12:0),0,1.2)+Math.sin(F.t*26)*.03*R.tens:F.st==='bite'?.58+Math.sin(F.t*30)*.14:F.st==='waiting'?F.twK*.35+(F.nib>0?.14:0):0;
  rodObj.bend=damp(rodObj.bend||0,bend,16,dt);setRodBend(rodObj,rodObj.bend);rg.rotation.x=Math.PI/2;if(rodObj.crank&&F.st==='reeling'&&R&&R.hold)rodObj.crank.rotation.x-=dt*R.reelSpd*5;
  if(rg.userData.ench){rg.userData.ench.rotation.y+=dt*3;rg.userData.ench.scale.setScalar(1+Math.sin(WIND.uTime.value*5)*.2);}}
 const z=zoneAt(player.pos.x,player.pos.z);if(z!==player.zone){player.zone=z;if(!MENU.on)showZone(z);if(z!=='sea')questEvent('visit',{zone:z});if(z!=='sea'&&state.unlocked.includes(z))state.last=z;}}
function updateBoat(dt){const T=WIND.uTime.value,p=boat.pos;if(boat.g.rotation.order!=='YXZ')boat.g.rotation.order='YXZ';const alt=boat.alt||0,y=waveH(p.x,p.z,T)*Math.max(0,1-alt/3);boat.g.position.set(p.x,y-.15+alt,p.z);boat.g.rotation.set(0,boat.yaw,0);
 if(boat.g.userData.prop)boat.g.userData.prop.rotation.z+=dt*(alt>.1?55:6+Math.abs(boat.speed)*1.6);if(boat.g.userData.radar)boat.g.userData.radar.rotation.y+=dt*2.4;
 if(alt>.3||boat.fly){const k=Math.min(1,alt/2);boat.g.rotation.x=-(boat.climb||0)*k-.03*k;boat.g.rotation.z=(boat.bank||0)*k;return;}
 const fx=Math.sin(boat.yaw),fz=Math.cos(boat.yaw);const pitch=(waveH(p.x+fx*2,p.z+fz*2,T)-waveH(p.x-fx*2,p.z-fz*2,T))/4;const roll=(waveH(p.x+fz,p.z-fx,T)-waveH(p.x-fz,p.z+fx,T))/2;
 boat.g.rotation.x=-pitch-boat.speed*.004;boat.g.rotation.z=roll;}
function updateNPCs(dt){for(const n of world.npcs){const d=Math.hypot(player.pos.x-n.x,player.pos.z-n.z);const R=n.rig.root,cd=camera.position.distanceTo(R.position);if(cd>170){R.visible=false;continue;}R.visible=true;
 if(n.imp===undefined){n.imp=bakeMeshes(n.rig.body)||null;if(n.imp){n.imp.visible=false;n.rig.body.parent.add(n.imp);n.imp.position.copy(n.rig.body.position);n.imp.quaternion.copy(n.rig.body.quaternion);n.imp.scale.copy(n.rig.body.scale);}}
 {const far=cd>30&&!!n.imp;if(n.imp){n.rig.body.visible=!far;n.imp.visible=far;}if(far){n.label.visible=false;continue;}}
 const tgt=d<9?Math.atan2(player.pos.x-n.x,player.pos.z-n.z):n.face;R.rotation.y+=angDiff(R.rotation.y,tgt)*(1-Math.exp(-4*dt));
 if(d<6&&!n.waved){n.waved=true;n.waveT=0;}if(d>12)n.waved=false;if(n.waveT!=null){n.waveT+=dt;if(n.waveT>2.4)n.waveT=null;}
 n.anim.update(dt,{spd:0,ground:true,emote:n.waveT!=null?'wave':null,emT:n.waveT||0});n.label.visible=state.settings.tags&&d<45;}}
function camShake(v){cam.shake=Math.max(cam.shake||0,v);}
function updateCamera(dt){const tgt=_camT.copy(player.mode==='boat'?boat.pos:player.pos);if(player.mode==='boat')tgt.y=boat.g.position.y+2.2+(boat.alt>.3?1.5:0);else tgt.y+=1.85;let want=cam.tdist*(player.mode==='boat'&&boat.alt>3?1.6:1);
 if((F.st==='reeling'||F.st==='bite')&&!PHOTO.on){want*=.78;tgt.lerp(_v.copy(bobber.position).setY(tgt.y-.5),.3);}if(F.st==='charging')want*=1.06;if(F.st==='casting'&&!PHOTO.on)tgt.lerp(_v.copy(bobber.position).setY(tgt.y),.22);if(F.st==='caught'||player.emote==='show')want*=.8;
 const k=state.settings.chill?8:13;cam.target.x=damp(cam.target.x,tgt.x,k,dt);cam.target.y=damp(cam.target.y,tgt.y,k,dt);cam.target.z=damp(cam.target.z,tgt.z,k,dt);cam.dist=damp(cam.dist,want,5,dt);
 if(player.mode==='boat'&&Math.abs(boat.speed)>3&&ptrs.size===0&&cam.manualT>2.5&&!PHOTO.on)cam.yaw+=angDiff(cam.yaw,boat.yaw+Math.PI)*(1-Math.exp(-1.1*dt));
 if(ptrs.size===0&&cam.manualT>2.5&&!PHOTO.on&&F.st==='idle'){const mv=player.mode==='boat'?Math.abs(boat.speed)>3:player.mode==='walk'&&Math.hypot(input.x,input.y)>.1;if(mv){const tp=player.mode==='boat'?(boat.alt>3?.42:.54):.52;cam.pitch+=(tp-cam.pitch)*(1-Math.exp(-1.3*dt));}}
 const cp=Math.cos(cam.pitch);camera.position.set(cam.target.x+Math.sin(cam.yaw)*cp*cam.dist,cam.target.y+Math.sin(cam.pitch)*cam.dist,cam.target.z+Math.cos(cam.yaw)*cp*cam.dist);
 const minY=Math.max(groundH(camera.position.x,camera.position.z)+.8,waveH(camera.position.x,camera.position.z,WIND.uTime.value)+.8);if(camera.position.y<minY)camera.position.y=minY;
 {const cpx=camera.position.x,cpz=camera.position.z;let blk=0;for(const c of world.colliders){const dx=c.x-cpx,dz=c.z-cpz;if(dx>4||dx<-4||dz>4||dz<-4)continue;const d=Math.hypot(dx,dz),rr=Math.max(c.r*3.2,1.4);if(d<rr&&c.r>=.35&&c.r<3)blk=Math.max(blk,1-d/rr);}cam.occ=damp(cam.occ||0,blk,6,dt);
  if(cam.occ>.02&&!PHOTO.on){const k=1-cam.occ*.55;camera.position.lerp(cam.target,1-k);}}
 camera.lookAt(cam.target);cam.shake=Math.max(0,(cam.shake||0)-dt*1.6);if(cam.shake>0&&!PHOTO.on&&!state.settings.noShake){const s=cam.shake*cam.shake*.6,tt=performance.now()/1000;camera.rotateX(Math.sin(tt*47)*s*.1);camera.rotateY(Math.sin(tt*39+1)*s*.1);}cam.punch=Math.max(0,(cam.punch||0)-dt*2.2);const fov=55+(player.mode==='boat'?clamp(Math.abs(boat.speed)/19,0,1)*6:0)-(cam.punch||0)*7;if(Math.abs(fov-camera.fov)>.01){camera.fov=cam.punch>0?damp(camera.fov,fov,14,dt):damp(camera.fov,fov,2,dt);camera.updateProjectionMatrix();}
 if(player.mode==='boat')camera.rotateZ(boat.g.rotation.z*.25);}

/* fish shadows drifting just under the surface around you (they scatter from a splashing float) */
const fishShadows=[];
function initFishShadows(){const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.filter='blur(5px)';x.fillStyle='rgba(6,22,30,1)';x.beginPath();x.ellipse(60,32,36,12,0,0,TAU);x.fill();x.beginPath();x.moveTo(30,32);x.lineTo(8,17);x.lineTo(13,32);x.lineTo(8,47);x.closePath();x.fill();
 const tex=new THREE.CanvasTexture(c),geo=new THREE.PlaneGeometry(1.6,.8);geo.rotateX(-Math.PI/2);
 for(let i=0;i<14;i++){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,depthWrite:false}));m.renderOrder=2;m.userData.noAO=true;m.visible=false;scene.add(m);reflHide.push(m);fishShadows.push({m,x:0,z:0,a:0,sp:0,t:0,life:0,s:1,pond:false});}}
function updateFishShadows(dt){if(!fishShadows.length)initFishShadows();const T=WIND.uTime.value,base=player.mode==='boat'?boat.pos:player.pos,vis=env.day>.15&&GFX.tier!=='low'&&!MENU.on;
 for(const f of fishShadows){if(f.life<=0){f.m.visible=false;if(!vis)continue;
   for(let tr=0;tr<5;tr++){const a=Math.random()*TAU,d=rand(5,26),x=base.x+Math.cos(a)*d,z=base.z+Math.sin(a)*d,pd=pondAt(x,z);if(pd||groundH(x,z)<-1.4){f.x=x;f.z=z;f.a=Math.random()*TAU;f.sp=rand(.4,1.3);f.life=rand(6,14);f.t=0;f.pond=!!pd;f.s=rand(.7,1.8)*(pd?.6:1);f.m.visible=true;break;}}if(f.life<=0)continue;}
  f.t+=dt;f.life-=dt;f.a+=Math.sin(f.t*.7+f.s*3)*dt*.6;const nx=f.x+Math.cos(f.a)*f.sp*dt,nz=f.z+Math.sin(f.a)*f.sp*dt;
  if(f.pond?!pondAt(nx,nz):groundH(nx,nz)>-1.2)f.a+=Math.PI*.8;else{f.x=nx;f.z=nz;}
  if(F.st!=='idle'&&bobber.visible){const dx=f.x-bobber.position.x,dz=f.z-bobber.position.z;if(dx*dx+dz*dz<9){f.a=Math.atan2(dz,dx);f.sp=3.2;}else f.sp=damp(f.sp,.8,.5,dt);}
  const fade=Math.min(1,f.t/1.5,f.life/1.5);f.m.material.opacity=fade*.24*(env.day*.75+.25)*(1-env.fog*.6);f.m.position.set(f.x,surfY(f.x,f.z,T)+.05,f.z);f.m.rotation.y=-f.a;f.m.scale.setScalar(f.s);}}
/* a column of light where a rare catch comes up */
const beams=[];
function catchBeam(p,col){const g=new THREE.CylinderGeometry(.7,1.1,46,20,1,true);g.translate(0,23,0);
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(col).multiplyScalar(1.6)},uA:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uC;uniform float uA;varying float vY;void main(){gl_FragColor=vec4(uC*pow(1.-vY,1.6)*uA,1.);}'}));
 m.position.copy(p);m.userData.noAO=true;m.frustumCulled=false;scene.add(m);reflHide.push(m);beams.push({m,t:0});}
function updateBeams(dt){for(let i=beams.length-1;i>=0;i--){const b=beams[i];b.t+=dt;const a=Math.min(1,b.t/.25)*clamp((3-b.t)/1.2,0,1);b.m.material.uniforms.uA.value=a;const s=1+Math.sin(b.t*6)*.08;b.m.scale.set(s,1,s);
  if(b.t>3){scene.remove(b.m);b.m.geometry.dispose();b.m.material.dispose();const k=reflHide.indexOf(b.m);if(k>=0)reflHide.splice(k,1);beams.splice(i,1);}}}

/* ---------- ambient life ---------- */
let jumpT=6;
function updateLife(dt){const T=WIND.uTime.value,cp=camera.position;updateFishShadows(dt);updateBeams(dt);
 const cell=water.userData.cell;water.position.set(Math.round(cam.target.x/cell)*cell,0,Math.round(cam.target.z/cell)*cell);
 for(const f of world.floaters){const dx=f.x-cam.target.x,dz=f.z-cam.target.z,far=dx*dx+dz*dz>170*170;if(f.m.visible===far)f.m.visible=!far;if(far)continue;f.m.position.y=waveH(f.x,f.z,T)+f.o;f.m.rotation.z=(f.drift?Math.PI/2:0)+Math.sin(T+f.ph)*.08;if(f.m.userData.light)f.m.userData.light.material.color.setScalar(lerp(1,3.6,1-env.day));}
 waterNrm.offset.set(T*.012,T*.008);
 for(const s of splashPool){if(s.life<=0)continue;s.life-=dt;s.v.y-=18*dt;s.m.position.addScaledVector(s.v,dt);s.m.scale.setScalar(Math.max(s.life*1.6,.01));if(s.life<=0)s.m.visible=false;}
 const tier=TT();
 const rv=Math.min(env.rain,1.3)*(1-env.snowK)*(1-(env.cave||0));if(rv>.02){rain.visible=true;rain.material.opacity=Math.min(.36*rv,.45);const a=rain.geometry.attributes.position.array;const cnt=Math.floor(Math.min(rain.userData.N,tier.rain)*Math.min(rv,1));rain.geometry.setDrawRange(0,cnt*2);
  for(let i=0;i<cnt;i++){const o=i*6;let y=a[o+1]-44*dt;if(y<cp.y-20){y=cp.y+22+Math.random()*10;const x=cp.x+rand(-40,40),z=cp.z+rand(-40,40);a[o]=x;a[o+2]=z;a[o+3]=x+.16+(env.weather==='storm'?.5:0);a[o+5]=z;}a[o+1]=y;a[o+4]=y-.95;}rain.geometry.attributes.position.needsUpdate=true;
  if(Math.random()<dt*34*rv){const ang=Math.random()*TAU,d=rand(1,16),x=player.pos.x+Math.cos(ang)*d,z=player.pos.z+Math.sin(ang)*d,g=groundH(x,z);if(g>.2)ringAt(x,g+.05,z,.7,.35+Math.random()*.3);}}
 else rain.visible=false;
 for(const r of rings){if(r.t>=r.d)continue;r.t+=dt;const k=r.t/r.d;r.m.scale.setScalar(r.s*(.2+k*1.3));r.m.material.opacity=(1-k)*.55;if(r.t>=r.d)r.m.visible=false;}
 for(const c of clouds){if(!c.visible)continue;c.position.x+=c.userData.v*dt*1.4;c.position.z+=c.userData.v*dt*.5;const dx=c.position.x-cp.x,dz=c.position.z-cp.z;if(dx>520)c.position.x-=1040;if(dx<-520)c.position.x+=1040;if(dz>520)c.position.z-=1040;if(dz<-520)c.position.z+=1040;}
 const birdVis=env.day>.25&&env.rain<.6;for(let i=0;i<birds.length;i++){const b=birds[i];if(i>=tier.birds){b.g.visible=false;continue;}b.g.visible=birdVis;if(!birdVis)continue;b.a+=b.sp*dt;const x=b.cx+Math.cos(b.a)*b.R,z=b.cz+Math.sin(b.a)*b.R,y=b.h+Math.sin(T*.5+b.ph)*2;
  b.g.position.set(x,y,z);b.g.rotation.y=Math.atan2(-Math.sin(b.a)*Math.sign(b.sp),Math.cos(b.a)*Math.sign(b.sp))+0;b.g.rotation.z=-Math.sign(b.sp)*.25;const fl=Math.sin(T*7+b.ph)>-.2||Math.sin(T*.6+b.ph)>.3?Math.sin(T*9+b.ph)*.55:.05;b.wings[0].rotation.z=-fl;b.wings[1].rotation.z=fl;}
 jumpT-=dt;if(jumpT<=0){jumpT=rand(5,12);const j=jumpers.find(q=>q.t>=1.2);if(j){for(let tr=0;tr<8;tr++){const ang=Math.random()*TAU,d=rand(12,34),x=player.pos.x+Math.cos(ang)*d,z=player.pos.z+Math.sin(ang)*d;if(groundH(x,z)<-1.6&&!pondAt(x,z)){j.t=0;j.x=x;j.z=z;j.dir=Math.random()*TAU;j.g.visible=true;splash(new V3(x,waveH(x,z,T),z),8,3.5);addRipple(x,z,.9);AU.plop(clamp((x-cp.x)/30,-1,1));break;}}}}
 for(const j of jumpers){if(j.t>=1.2)continue;j.t+=dt;const k=j.t/1.1;const dx=Math.cos(j.dir),dz=Math.sin(j.dir);const x=j.x+dx*k*2.4,z=j.z+dz*k*2.4;j.g.position.set(x,waveH(x,z,T)+Math.sin(k*Math.PI)*1.9-.2,z);j.g.rotation.set(0,-j.dir,(.5-k)*2.2);
  if(j.t>=1.1&&j.t-dt<1.1){splash(new V3(x,waveH(x,z,T),z),10,3.5);addRipple(x,z,1);AU.splash(.25,clamp((x-cp.x)/30,-1,1));}if(j.t>=1.2)j.g.visible=false;}
 for(const s of world.smoke){s.age+=dt;if(s.age>s.life){s.age-=s.life;s.dx=rand(-.4,.4);s.dz=rand(-.4,.4);}const k=s.age/s.life;s.s.position.set(s.o.x+s.dx*k*4+k*2,s.o.y+k*s.size*3.2,s.o.z+s.dz*k*4);const sc=s.size*(.5+k*1.6);s.s.scale.set(sc,sc,1);s.s.material.opacity=Math.sin(k*Math.PI)*.45*(s.size>2?1:.7);}
 for(const p of puffs){if(p.t>=p.d)continue;p.t+=dt;const k=p.t/p.d;const sc=.35+k*1.2;p.s.scale.set(sc,sc,1);p.s.position.y+=dt*.6;p.s.material.opacity=(1-k)*.5;if(p.t>=p.d)p.s.visible=false;}
 if(world.windmill)world.windmill.rotateZ(dt*(.35+WIND.uStr.value*.25));
 for(const m of animMats)m.color.setHSL((T*.25+m.userData.prism)%1,.85,.6);}

function renderFrame(){GFX.fc=(GFX.fc||0)+1;const every=GFX.tier==='ultra'?1:2;if(renderer.shadowMap.enabled&&(GFX.fc%every===0||GFX.tier==='high'))renderer.shadowMap.needsUpdate=true;if(GFX.refl&&(GFX.fc%every===0))renderRefl();if(GFX.composer)GFX.composer.render();else renderer.render(scene,camera);}
