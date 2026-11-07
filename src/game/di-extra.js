'use strict';
/* Driftwood Isles — extras: storm twisters and the Drowned Hollow, little sea events, the Tidewater Casino,
   and riding along in a friend's boat. */

/* ================= STORM TWISTERS =================
   On a shared clock (the same on every device), every WELL_CYCLE seconds a storm front rolls over the isles for WELL_LEN
   seconds and a twister forms off every island, drifting slowly over the sea. The churned water round its base (the
   Storm's Eye) only gives up Rare fish or better, and those fish live nowhere else; their value follows the nearby island.
   Sail or swim into a twister and it lifts you away to the Drowned Hollow. */
const WELL_CYCLE=600,WELL_LEN=210,WELL_R=16,TW_CORE=4.6,TW_H=96,WELL_REF=ZONE_BASE.well;
const hashN=(a,b)=>{let h=(a*2654435761^b*40503)>>>0;h=(h^(h>>>15))*2246822519>>>0;return (h^(h>>>13))>>>0;};
function wellSpots(){const out=[];for(const k of ISL){const I=ZONES[k];for(let i=0;i<4;i++){const a=i/4*TAU+I.p1+.4;out.push({x:I.x+Math.cos(a)*I.R*2.1,z:I.z+Math.sin(a)*I.R*2.1,isl:k,i});}}return out;}
let WSPOTS=null;
function activeWells(){if(!WSPOTS)WSPOTS=wellSpots();const now=Date.now()/1000,k=Math.floor(now/WELL_CYCLE),ph=now-k*WELL_CYCLE;let left=WELL_LEN-ph,el=ph;
 if(DEV.wellUntil&&Date.now()<DEV.wellUntil){left=(DEV.wellUntil-Date.now())/1000;el=WELL_LEN-left;}else if(left<=0)return{list:[],next:WELL_CYCLE-ph};
 const list=[];for(const isl of ISL){const opts=WSPOTS.filter(s=>s.isl===isl),b=opts[hashN(k,isl.length*31+isl.charCodeAt(0))%opts.length],a=el*.05+b.i*1.7;list.push({x:b.x+Math.cos(a)*10,z:b.z+Math.sin(a*1.3)*10,isl,i:b.i});}return{list,left};}
function wellAt(x,z){const A=activeWells();for(const w of A.list)if(Math.hypot(x-w.x,z-w.z)<WELL_R)return w;return null;}
const TWV={pool:[],state:false,t:0,near:null};let TW_LIFT=null;
function twisterMat(inner){return new THREE.ShaderMaterial({uniforms:{uT:WIND.uTime,uA:{value:0},uH:{value:TW_H},uR0:{value:inner?1.8:3.2},uR1:{value:inner?14:22},uSpin:{value:inner?8:5},uIn:{value:inner?1:0},uLit:{value:new THREE.Color(1,1,1)},uFogC:{value:new THREE.Color()},uFogN:{value:100},uFogF:{value:400}},
 transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:`uniform float uT;uniform float uH;uniform float uR0;uniform float uR1;varying float vH;varying float vAng;varying float vD;
  void main(){float h=position.y;float r=mix(uR0,uR1,pow(h,1.45))+5.*exp(-h*26.);vec2 wob=vec2(sin(h*3.1+uT*.7),cos(h*2.3+uT*.55))*h*7.+vec2(sin(uT*.9+h*9.),cos(uT*.8+h*7.))*.6;
   vec3 p=vec3(position.x*r+wob.x,h*uH-3.,position.z*r+wob.y);vH=h;vAng=atan(position.z,position.x);vec4 wp=modelMatrix*vec4(p,1.);vD=distance(wp.xyz,cameraPosition);gl_Position=projectionMatrix*viewMatrix*wp;}`,
 fragmentShader:`uniform float uT;uniform float uA;uniform float uSpin;uniform float uIn;uniform vec3 uLit;uniform vec3 uFogC;uniform float uFogN;uniform float uFogF;varying float vH;varying float vAng;varying float vD;
  float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
  void main(){float a=vAng/6.28318+.5;vec2 q=vec2(a*7.+vH*2.5-uT*uSpin*.12,vH*9.-uT*.9);float s=n2(q)*.6+n2(q*2.3+3.1)*.3+n2(q*5.1+7.)*.1;
   float bands=smoothstep(.3,.8,s);float edge=smoothstep(0.,.04,vH)*(1.-smoothstep(.86,1.,vH));float dust=exp(-vH*14.);
   float al=(.34+bands*.5+dust*.35)*edge*uA*mix(1.,.8,uIn);vec3 col=mix(vec3(.13,.15,.18),vec3(.58,.63,.69),bands*.75+vH*.12)*mix(1.,.7,uIn);col=mix(col,vec3(.42,.38,.33),dust*.55);col*=uLit;
   col=mix(col,uFogC,smoothstep(uFogN,uFogF*1.6,vD)*.6);gl_FragColor=vec4(col,al);`+OUT_CHUNKS+`}`});}
function twisterBaseMat(){return new THREE.ShaderMaterial({uniforms:{uT:WIND.uTime,uA:{value:0}},transparent:true,depthWrite:false,
 vertexShader:'varying vec2 vP;void main(){vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uT;uniform float uA;varying vec2 vP;void main(){float r=length(vP)/16.;if(r>1.)discard;float a=atan(vP.y,vP.x);float sw=.5+.5*sin(a*5.+r*18.-uT*5.);
  float foam=smoothstep(.55,1.,sw)*smoothstep(1.,.35,r)*smoothstep(.05,.2,r);gl_FragColor=vec4(vec3(.9,.95,1.),foam*.7*uA);`+OUT_CHUNKS+`}`});}
function buildWellFx(){const fg=new THREE.CylinderGeometry(1,1,1,40,30,true);fg.translate(0,.5,0);const cg=new THREE.SphereGeometry(1,24,12),bg=new THREE.CircleGeometry(16,56);bg.rotateX(-Math.PI/2);
 for(let i=0;i<3;i++){const g=new THREE.Group();const outer=new THREE.Mesh(fg,twisterMat(false)),inner=new THREE.Mesh(fg,twisterMat(true));outer.renderOrder=4;inner.renderOrder=3;g.add(outer,inner);
  const cap=new THREE.Mesh(cg,new THREE.MeshLambertMaterial({color:'#3a4048',transparent:true,opacity:.92,depthWrite:false}));cap.scale.set(60,11,60);cap.position.y=TW_H*.98;g.add(cap);
  const base=new THREE.Mesh(bg,twisterBaseMat());base.renderOrder=3;g.add(base);
  g.visible=false;g.userData={funnels:[outer,inner],cap,base};g.traverse(o=>{o.userData.noAO=true;o.frustumCulled=false;});scene.add(g);reflHide.push(g);TWV.pool.push(g);}}
function updateWells(dt){if(!TWV.pool.length)buildWellFx();const A=activeWells(),T=WIND.uTime.value,cp=camera.position;
 const near=A.list.map(w=>({w,d:Math.hypot(w.x-cp.x,w.z-cp.z)})).filter(o=>o.d<900).sort((a,b)=>a.d-b.d).slice(0,TWV.pool.length),lit=lerp(.32,1,env.day)+(env.flash||0)*.8;
 TWV.pool.forEach((g,i)=>{const o=near[i];if(!o||MENU.on||(env.cave||0)>.5){g.visible=false;return;}const w=o.w,fade=Math.min(1,(A.left||0)/10)*Math.min(1,(WELL_LEN-(A.left||0))/8+.05);g.visible=true;
  g.position.set(w.x,0,w.z);const U=g.userData;for(const m of U.funnels){const u=m.material.uniforms;u.uA.value=fade;u.uLit.value.setScalar(lit);u.uFogC.value.copy(scene.fog.color);u.uFogN.value=scene.fog.near;u.uFogF.value=scene.fog.far;}
  U.cap.material.opacity=.92*fade;U.cap.rotation.y+=dt*.15;U.base.position.y=waveH(w.x,w.z,T)+.12;U.base.material.uniforms.uA.value=fade;
  if(o.d<180&&Math.random()<dt*12){const a=Math.random()*TAU,r=2+Math.random()*5;splash(new THREE.Vector3(w.x+Math.cos(a)*r,waveH(w.x,w.z,T),w.z+Math.sin(a)*r),4,4.5);}});
 TWV.near=near[0]?near[0].w:null;
 /* the storm front brings storm weather (unless the weather is locked in Settings) */
 const on=A.list.length>0,fw=state.settings.weather,auto=!fw||fw==='auto';
 if(on&&auto&&!MENU.on){if(env.weather!=='storm')setWeather('storm',true);env.wTimer=Math.max(env.wTimer,(A.left||0)+5);}
 if(on!==TWV.state){TWV.state=on;if(on&&!MENU.on){const nw=near[0];toast(nw&&nw.d<500?`A storm front is rolling in! A twister is forming off ${ZONES[nw.w.isl].n}. Fish round its base for rare catches, or sail straight into it…`:'A storm front is rolling in! Twisters are forming off every island for a few minutes.','gold');AU.thunder(60);}
  else if(!on&&auto)env.wTimer=Math.min(env.wTimer,4);}
 /* touching a twister lifts you away */
 if(TW_LIFT){TW_LIFT.t+=dt;cam.yaw+=dt*(3+TW_LIFT.t*6);return;}
 if(on&&!MENU.on&&!(typeof PHOTO!=='undefined'&&PHOTO.on)&&!(typeof RIDE!=='undefined'&&RIDE)){const onBoat=player.mode==='boat',p=onBoat?boat.pos:player.pos;
  if((onBoat&&(boat.alt||0)<40)||(!onBoat&&groundH(p.x,p.z)<-.6))for(const w of A.list)if(Math.hypot(p.x-w.x,p.z-w.z)<TW_CORE){twisterLift(w);break;}}}
function wellPrompt(){return null;}
function twisterLift(w){if(TW_LIFT)return;if(F.st!=='idle')cancelFishing();stopEmote();const onBoat=player.mode==='boat',p=onBoat?boat.pos:player.pos;TW_LIFT={t:0,w};
 AU.thunder(25);AU.splash(1.4);AU.leap();camShake(1.4);splash(new THREE.Vector3(p.x,0,p.z),30,8);toast('The twister lifts you clean off the sea!','gold');
 const dx=p.x-w.x,dz=p.z-w.z,dl=Math.hypot(dx,dz)||1,rx=w.x+dx/dl*(WELL_R+14),rz=w.z+dz/dl*(WELL_R+14);
 fadeTo(()=>{HOLLOW_RET={x:rx,z:rz,yaw:onBoat?boat.yaw:Math.atan2(dx,dz)};const sp=world.spawn.hollow;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.tdist=12;TW_LIFT=null;
  if(!state.tips.hollow){state.tips.hollow=1;setTimeout(()=>toast('The twister set you down in a secret place: the Drowned Hollow. Its fish live nowhere else. The ring of light takes you back up.','gold'),900);}save();});}

/* ================= THE DROWNED HOLLOW ================= */
let HOLLOW_RET=null;
function fadeTo(fn){const f=$('#fadeOver');f.classList.add('on');setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),250);},650);}
function diveWell(w){twisterLift(w||{x:boat.pos.x,z:boat.pos.z});}
/* the Lightless Trench opens once every Drowned Hollow fish is in your Journal (the Drowned King needs level 30) */
function hollowProgress(){const all=SPECIES.filter(s=>s.zone==='hollow'||s.zone==='pond_hollow');return{have:all.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length,total:all.length};}
function tryDescend(){const P=hollowProgress();if(P.have<P.total){const king=!(state.dex.drowned_king&&state.dex.drowned_king.n);AU.escape();
  toast(`The seal holds. Catch every Drowned Hollow fish to open it (${P.have}/${P.total}).${king?state.level<30?' The Drowned King only bites for anglers of level 30 or higher.':' The Drowned King rises once every other Hollow fish is caught.':''}`);return;}
 fadeTo(()=>{const sp=world.spawn.abyss;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.tdist=12;
  if(!state.tips.abyss){state.tips.abyss=1;if(typeof grantTitle==='function')grantTitle('Abyss Diver');setTimeout(()=>toast('You reached the Lightless Trench, the last chamber under the sea. Its fish are the most valuable anywhere.','gold'),900);}save();AU.level();});}
/* the linked caves: walk through a ring of light to reach the next cave */
const CAVE_INTRO={kelp:'The Kelp Cathedral: a drowned forest lit gold from above. Its fish live nowhere else.',ruins:'The Sunken Ruins: a city the sea took long ago. Its fish are rich and rare.'};
function caveProgress(z){const all=SPECIES.filter(s=>s.zone===z);return{have:all.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length,total:all.length};}
function goCave(k){fadeTo(()=>{const sp=world.spawn[k];if(!sp)return;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.tdist=12;
 if(!state.tips['cave_'+k]){state.tips['cave_'+k]=1;if(CAVE_INTRO[k])setTimeout(()=>toast(CAVE_INTRO[k],'gold'),900);if(k==='ruins'&&typeof grantTitle==='function')grantTitle('Ruin Diver');if(k==='kelp'&&typeof grantTitle==='function')grantTitle('Kelp Wanderer');}save();AU.splash(.6);});}
function tryRuins(){const P=caveProgress('kelp');if(P.have<5){AU.escape();toast(`The tunnel is choked with kelp. Catch 5 different Kelp Cathedral fish to clear it (${P.have}/5).`);return;}goCave('ruins');}
function tryRuinsDeep(){if(!state.tips.abyss){AU.escape();toast('A great seal blocks the passage. It opens from the other side once you reach the Lightless Trench through the Drowned Hollow.');return;}goCave('abyss');}
function toHollow(){fadeTo(()=>{const sp=world.spawn.hollow;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;});}
function surfaceFromHollow(){fadeTo(()=>{if(HOLLOW_RET){boat.pos.set(HOLLOW_RET.x,0,HOLLOW_RET.z);boat.yaw=HOLLOW_RET.yaw;boat.speed=0;boat.alt=0;boat.fly=false;player.mode='boat';cam.tdist=17;}
  else{const k=state.last||'cove',sp=world.spawn[k];player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);placeBoatAt(k);}HOLLOW_RET=null;AU.splash(.9);});}

/* ================= LITTLE SEA EVENTS =================
   Every few minutes something turns up on the water near you: a floating chest, a message in a bottle,
   or a bubbling fish school (bites come fast and luck runs high while you fish inside it). */
const LE={items:[],t:70};
const BOTTLE_NOTES=['"When a storm front rolls in, twisters form off every island. Sail into one, if you dare."','"The rarest fish rise for the patient. And for the lucky."','"I buried nothing. The sea took it all. — Captain M."',
 '"Lucky Lou\'s wheel has a 5× slice. I saw it once. Once."','"At night the Mirror Pool shows a second moon."','"Glowflies at night, shrimp by day. That\'s the whole secret."','"Pull against a running fish and it tires twice as fast."'];
function leMesh(type){const g=new THREE.Group();
 if(type==='chest'){const w=pbr('#8a5a32','wood'),gold=new THREE.MeshStandardMaterial({color:'#f2c14e',metalness:.9,roughness:.3});const b=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.75),w);b.position.y=.1;g.add(b);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.375,.375,1.1,10,1,false,0,Math.PI),w);lid.rotation.z=Math.PI/2;lid.position.y=.4;g.add(lid);for(const x of[-.4,.4]){const s=new THREE.Mesh(new THREE.BoxGeometry(.08,.95,.8),gold);s.position.set(x,.25,0);g.add(s);}
  const lk=new THREE.Mesh(new THREE.BoxGeometry(.16,.2,.06),gold);lk.position.set(0,.32,.4);g.add(lk);}
 else if(type==='bottle'){const gl=new THREE.MeshPhysicalMaterial({color:'#8ad8b8',roughness:.1,transmission:.6,transparent:true,opacity:.8});const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.6,12),gl);b.rotation.z=Math.PI/2.3;g.add(b);
  const n=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.25,10),gl);n.position.set(.36,.15,0);n.rotation.z=Math.PI/2.3;g.add(n);const c=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.1,8),pbr('#a8784a','wood'));c.position.set(.47,.2,0);c.rotation.z=Math.PI/2.3;g.add(c);
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.4,8),new THREE.MeshStandardMaterial({color:'#f0e4c8'}));p.rotation.z=Math.PI/2.3;g.add(p);}
 else{const r=new THREE.Mesh(new THREE.RingGeometry(3.2,7,40),new THREE.MeshBasicMaterial({color:new THREE.Color(.6,1.4,1.6),transparent:true,opacity:.18,depthWrite:false}));r.rotation.x=-Math.PI/2;g.add(r);}
 const h=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.halo,color:type==='chest'?0xffd27a:type==='bottle'?0xc8ffe8:0x8af0ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));h.scale.set(3,3,1);h.position.y=.6;g.add(h);
 g.traverse(o=>{o.userData.noAO=true;});scene.add(g);return g;}
function spawnLittleEvent(){const base=player.mode==='boat'?boat.pos:player.pos;if((env.cave||0)>.5||MENU.on||JOIN.on)return;const type=pick(['chest','chest','bottle','school','school']);
 for(let tr=0;tr<12;tr++){const a=Math.random()*TAU,d=rand(14,34),x=base.x+Math.cos(a)*d,z=base.z+Math.sin(a)*d;if(groundH(x,z)>-1.6||pondAt(x,z)||world.seaRocks.some(r=>Math.hypot(r.x-x,r.z-z)<r.r+3))continue;
  const it={type,x,z,t:0,life:type==='school'?120:150,g:leMesh(type),ph:Math.random()*TAU};LE.items.push(it);
  toast(type==='chest'?'A floating chest is bobbing nearby! Sail into it or cast onto it.':type==='bottle'?'A message in a bottle drifts by. Sail into it or cast onto it.':'A fish school is boiling the water nearby! Cast into it for fast bites and better luck.');AU.bell(1318.5,.5,.06);return;}}
function leNear(x,z,r,types){for(const it of LE.items)if((!types||types.includes(it.type))&&Math.hypot(it.x-x,it.z-z)<r)return it;return null;}
function collectLE(it){LE.items.splice(LE.items.indexOf(it),1);disposeHeld(it.g);splash(new THREE.Vector3(it.x,0,it.z),14,4);const isl=nearestIslandKey(it.x,it.z),b=ZONE_BASE[isl]||14;
 if(it.type==='chest'){const c=Math.round(b*rand(18,45)/10)*10;state.coins+=c;state.earned+=c;let extra='';const r=Math.random();if(r<.06){state.relics++;extra=' and some Sea Glass';}else if(r<.35){const bt=pick(BAITS.slice(0,6));state.bait[bt.id]=(state.bait[bt.id]||0)+3;extra=' and 3 '+bt.n;}
  AU.sell(4);coinBurst(8);toast(`You hauled in a floating chest: ${fmt(c)} coins${extra}!`,'gold');}
 else{const c=Math.round(b*rand(6,14)/10)*10;state.coins+=c;state.earned+=c;AU.coin();toast(`A note in the bottle: ${pick(BOTTLE_NOTES)} (+${fmt(c)} coins)`);}
 save();updateHUD();}
function nearestIslandKey(x,z){let best='sea',bd=1e9;for(const k of ISL){const I=ZONES[k],d=Math.hypot(I.x-x,I.z-z)-I.R;if(d<bd){bd=d;best=k;}}return bd<400?best:'sea';}
function updateLittleEvents(dt){const T=WIND.uTime.value;LE.t-=dt;if(LE.t<=0){LE.t=rand(150,300);if(LE.items.length<3)spawnLittleEvent();}
 for(const it of LE.items.slice()){it.t+=dt;const y=waveH(it.x,it.z,T);it.g.position.set(it.x,y+(it.type==='school'?.04:-.05),it.z);if(it.type!=='school'){it.g.rotation.y+=dt*.3;it.g.rotation.z=Math.sin(T*1.4+it.ph)*.12;}
  else if(Math.random()<dt*10){const a=Math.random()*TAU,d=Math.random()*6;splash(new THREE.Vector3(it.x+Math.cos(a)*d,y,it.z+Math.sin(a)*d),3,3);if(Math.random()<.2)addRipple(it.x+Math.cos(a)*d,it.z+Math.sin(a)*d,.6);}
  const fade=Math.min(1,(it.life-it.t)/4);it.g.children[it.g.children.length-1].material.opacity=.5*fade;
  if(it.t>it.life){LE.items.splice(LE.items.indexOf(it),1);disposeHeld(it.g);continue;}
  if(it.type!=='school'&&player.mode==='boat'&&Math.hypot(boat.pos.x-it.x,boat.pos.z-it.z)<3.6)collectLE(it);}}
/* casting onto a chest or bottle hooks it; casting into a school gives the bonus */
function onCastLanded(){const it=leNear(F.to.x,F.to.z,3,['chest','bottle']);if(it){collectLE(it);cancelFishing();return true;}F.inSchool=!!leNear(F.to.x,F.to.z,7,['school']);if(F.inSchool)toast('Casting into the school: fast bites and +40% luck!');return false;}
function drawExtraMap(x,toX,toY,S,opt){const A=activeWells();for(const w of A.list){const cx=toX(w.x),cy=toY(w.z),R=Math.max(5,WELL_R*S);x.fillStyle='rgba(60,70,84,.55)';x.beginPath();x.arc(cx,cy,R,0,TAU);x.fill();x.strokeStyle='#e8eef4';x.lineWidth=1.6;x.beginPath();for(let t=0;t<=1.001;t+=.04){const a=t*TAU*2.2,rr=R*(.15+.85*t);if(t===0)x.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);else x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}x.stroke();}
 for(const it of LE.items){x.fillStyle=it.type==='chest'?'#ffd27a':it.type==='bottle'?'#c8ffe8':'#8af0ff';x.beginPath();x.arc(toX(it.x),toY(it.z),3.5,0,TAU);x.fill();}
 if((env.cave||0)>.3){const I=ZONES[CAVE_LOOK[player.zone]?player.zone:'hollow'];x.fillStyle='#0c1e24';x.fillRect(0,0,9999,9999);x.fillStyle='#2a3a40';islPath(x,I,toX,toY,1);x.fill();for(const p of I.ponds||[]){x.fillStyle='#1f6a74';x.beginPath();x.arc(toX(p.x),toY(p.z),p.r*S,0,TAU);x.fill();}}}

/* ================= RIDING IN A FRIEND'S BOAT =================
   Walk up to a friend's boat that has a free seat and press E. Your game places you in that seat every frame
   from their boat's position, and your presence tells everyone which boat and seat you are in. */
let RIDE=null;
const seatsOf=bt=>(BOATM[bt]||BOATS[0]).seats||2;
function seatLocal(g,i){const s=g.userData.seats;return s&&s[i]?s[i]:[0,g.userData.seat];}
function seatWorld(g,yaw,i,cx,cz,out){const[sx,sz]=seatLocal(g,i),c=Math.cos(yaw),s=Math.sin(yaw);return out.set(cx+sx*c+sz*s,g.position.y+g.userData.seatY,cz-sx*s+sz*c);}
function ridersOf(uid){const out=[];for(const r of Net.remotes.values())if(r.p&&r.p.rb===uid)out.push(r);return out;}
function hostOf(uid){for(const r of Net.remotes.values())if(r.uid===uid)return r;return null;}
function ridePrompt(){if(player.mode!=='walk'||!Net.uid)return null;let best=null,bd=1e9;for(const r of Net.remotes.values()){if(!r.onBoat||!r.boat||!r.uid)continue;const d=Math.hypot(r.pos.x-player.pos.x,r.pos.z-player.pos.z);
  if(d<7&&d<bd&&1+ridersOf(r.uid).length<seatsOf(r.p.bt)){bd=d;best=r;}}
 return best?{label:`Ride with ${best.name}`,kind:'Ride',d:bd,act:()=>startRide(best)}:null;}
function startRide(r){const taken=new Set(ridersOf(r.uid).map(o=>o.p.sk));let seat=1;while(taken.has(seat))seat++;if(seat>=seatsOf(r.p.bt)){toast('That boat is full.');return;}
 if(F.st!=='idle')cancelFishing();stopEmote();RIDE={uid:r.uid,seat,name:r.name};player.mode='ride';cam.tdist=17;AU.splash(.4);toast(`You hopped aboard ${r.name}'s ${(BOATM[r.p.bt]||BOATS[0]).n}. Press E to hop off.`);}
const _rv=new THREE.Vector3();
function updateRide(dt){const h=RIDE&&hostOf(RIDE.uid);if(!h||!h.onBoat||!h.boat){stopRide(true);return;}seatWorld(h.boat,h.byaw,RIDE.seat,h.pos.x,h.pos.z,_rv);player.pos.copy(_rv);if(F.st==='idle'&&h.spd>.6)player.face=h.byaw;}
function stopRide(auto){const name=RIDE?RIDE.name:'';RIDE=null;if(F.st!=='idle')cancelFishing();const s=findDisembark(player.pos);
 if(s){player.mode='walk';player.pos.set(s.x,s.g,s.z);player.vy=0;cam.tdist=12;}else{boat.pos.set(player.pos.x+2,0,player.pos.z+2);boat.speed=0;player.mode='boat';toast('You climbed into your own boat.');}
 if(auto&&name)toast(`${name}'s boat is gone, so you hopped off.`);}
/* where a remote passenger sits: in my boat, or in another remote player's boat */
function remoteSeat(r,out){const rb=r.p&&r.p.rb;if(!rb)return false;const sk=clamp(Math.round(num(r.p.sk,1)),1,9);
 if(rb===Net.uid){if(player.mode!=='boat')return false;seatWorld(boat.g,boat.yaw,sk,boat.pos.x,boat.pos.z,out);return true;}
 const h=hostOf(rb);if(!h||!h.onBoat||!h.boat)return false;seatWorld(h.boat,h.byaw,sk,h.pos.x,h.pos.z,out);return true;}
function noteRiders(){const mine=ridersOf(Net.uid).map(r=>r.uid).sort().join(',');if(mine!==noteRiders.k){const was=noteRiders.k?noteRiders.k.split(','):[];for(const r of ridersOf(Net.uid))if(!was.includes(r.uid))toast(`${r.name} hopped aboard your boat!`);noteRiders.k=mine;}}

/* ================= CASINOS =================
   The Tidewater Casino hall on Pebble Cove (Lucky Lou's slots, Vera's Wheel of Tides, Dex's High or Low) and a booth on
   every other island with its own game. Every game keeps a small house edge, so the casino is a coin sink over time. */
const SLOT_SYM=[['🐟',30,3],['🐚',25,4],['⚓',18,6],['🎣',12,10],['⭐',8,20],['💎',5,50],['👑',2,150]],SLOT_PAIR=1.5;
const WHEEL=[0,1.5,0,2,0,.5,0,1.5,0,3,0,.5,0,1.5,0,.5,0,2,0,5];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const CAS={bet:100,busy:false,res:'',reels:['🎣','🐟','⭐'],wheelRot:0,hl:null,coin:null,shells:null,dice:[1,6],lan:null,bj:null,crash:null,rou:null,rnum:17,mines:null};
function casPay(bet,win){if(win>0){state.coins+=win;if(win>bet)state.earned+=win-bet;}save();updateHUD();}
function casTake(bet){if(state.coins<bet){toast('Not enough coins for that bet.');return false;}state.coins-=bet;updateHUD();return true;}
function slotRoll(){const W=SLOT_SYM.reduce((s,x)=>s+x[1],0);let r=Math.random()*W;for(const s of SLOT_SYM){r-=s[1];if(r<=0)return s;}return SLOT_SYM[0];}
function hlMul(c,dir){const wins=dir==='hi'?13-c:c-1;return wins>0?Math.max(1,.95*12/wins):0;}
function cardName(v){return ({1:'A',11:'J',12:'Q',13:'K'})[v]||String(v);}
const SUITS=['♠','♥','♦','♣'];const drawCard=()=>({v:1+Math.floor(Math.random()*13),s:pick(SUITS)});
const cardHtml=(c,hide)=>hide?'<div class="pcard sm back">?</div>':`<div class="pcard sm ${c.s==='♥'||c.s==='♦'?'red':''}">${cardName(c.v)}<small>${c.s}</small></div>`;
function bjTotal(h){let t=0,a=0;for(const c of h){t+=c.v>=10?10:c.v===1?11:c.v;if(c.v===1)a++;}while(t>21&&a){t-=10;a--;}return t;}
const minesMul=k=>{let m=.97;for(let i=0;i<k;i++)m*=(25-i)/(21-i);return m;};
const DICE='⚀⚁⚂⚃⚄⚅';
function betBar(locked){return `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="muted">Bet</span>${[100,1000,10000,100000].map(b=>`<button class="btn sm ${CAS.bet===b?'':'ghost'}" data-act="cbet" data-id="${b}" ${b>state.coins||locked?'disabled':''}>${fmt(b)}</button>`).join('')}<span class="grow"></span><b>${fmt(state.coins)}c</b></div>`;}
const GAME_RENDER={
 slots:()=>`<div class="reels">${CAS.reels.map((s,i)=>`<div class="reel" id="reel${i}">${s}</div>`).join('')}</div><button class="btn" data-act="spin" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Spin · ${fmt(CAS.bet)}c</button>
  <div class="muted">Three of a kind: ${SLOT_SYM.map(s=>s[0]+' ×'+s[2]).join(' · ')}. Any two alike pay ×${SLOT_PAIR}.</div>`,
 wheel:()=>{const seg=360/WHEEL.length,cols=['#2a3440','#c8a040','#2a3440','#3fa457','#2a3440','#7a5a8a','#2a3440','#c8a040','#2a3440','#3a7fc0','#2a3440','#7a5a8a','#2a3440','#c8a040','#2a3440','#7a5a8a','#2a3440','#3fa457','#2a3440','#c94c40'];
  const paths=WHEEL.map((m,i)=>{const a0=(i*seg-90-seg/2)*Math.PI/180,a1=((i+1)*seg-90-seg/2)*Math.PI/180,am=(a0+a1)/2,tx=100+70*Math.cos(am),ty=100+70*Math.sin(am);return `<path d="M100 100 L${100+95*Math.cos(a0)} ${100+95*Math.sin(a0)} A95 95 0 0 1 ${100+95*Math.cos(a1)} ${100+95*Math.sin(a1)} Z" fill="${cols[i]}" stroke="#14161a" stroke-width="1"/><text x="${tx}" y="${ty+4}" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" transform="rotate(${i*seg} ${tx} ${ty})">${m?m+'×':'✕'}</text>`;}).join('');
  return `<div class="wheelBox"><svg viewBox="0 0 200 200" id="wheelSvg" style="transform:rotate(${CAS.wheelRot}deg)">${paths}<circle cx="100" cy="100" r="14" fill="#f4f1ea"/></svg><i class="wheelPin"></i></div><button class="btn" data-act="wheel" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Spin the wheel · ${fmt(CAS.bet)}c</button><div class="muted">Win the multiplier you land on. ✕ loses the bet.</div>`;},
 hilo:()=>{const H=CAS.hl;return H?`<div class="cards"><div class="pcard">${cardName(H.card)}</div></div><div class="muted">Pot: <b>${fmt(Math.floor(H.pot))}c</b> · streak ${H.n}</div>
   <div class="row" style="gap:8px;justify-content:center"><button class="btn" data-act="hl" data-id="hi" ${H.card>=13?'disabled':''}>Higher ×${hlMul(H.card,'hi').toFixed(2)}</button><button class="btn" data-act="hl" data-id="lo" ${H.card<=1?'disabled':''}>Lower ×${hlMul(H.card,'lo').toFixed(2)}</button></div>
   <button class="btn sky" data-act="hlcash" ${H.n?'':'disabled'}>Cash out ${fmt(Math.floor(H.pot))}c</button>`:`<div class="muted">Guess if the next card is higher or lower. Each right guess grows the pot, a wrong one loses it, a tie draws again. Cash out any time.</div><button class="btn" data-act="hlstart" ${state.coins<CAS.bet?'disabled':''}>Deal · ${fmt(CAS.bet)}c</button>`;},
 coin:()=>`<div class="coinBig ${CAS.busy?'flip':''}" id="coinBig">${CAS.coin||'🪙'}</div><div class="row" style="gap:8px;justify-content:center"><button class="btn" data-act="coin" data-id="H" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Heads ×1.9</button><button class="btn" data-act="coin" data-id="T" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Tails ×1.9</button></div><div class="muted">Call it in the air.</div>`,
 shells:()=>{const S=CAS.shells;return `<div class="shells">${[0,1,2].map(i=>`<button class="shellB ${S&&S.done&&S.pearl===i?'win':''}" data-act="shell" data-id="${i}" ${!S||S.done?'disabled':''}>${S&&S.done?(S.pearl===i?'⚪':'🐚'):'🐚'}</button>`).join('')}</div>
   ${S&&!S.done?'<div class="muted">The shells are shuffled. Pick the one hiding the pearl.</div>':`<button class="btn" data-act="shellgo" ${state.coins<CAS.bet?'disabled':''}>Shuffle · ${fmt(CAS.bet)}c</button><div class="muted">Find the pearl under one of three shells to win ×2.85.</div>`}`;},
 dice:()=>`<div class="diceRow ${CAS.busy?'roll':''}"><span id="d0">${DICE[CAS.dice[0]-1]}</span><span id="d1">${DICE[CAS.dice[1]-1]}</span></div>
  <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" data-act="dice" data-id="u" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Under 7 ×2.3</button><button class="btn" data-act="dice" data-id="s" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Lucky 7 ×5.5</button><button class="btn" data-act="dice" data-id="o" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Over 7 ×2.3</button></div><div class="muted">Two dice. Bet on the total.</div>`,
 lanterns:()=>{const L=CAS.lan;return `<div class="lanterns">${[0,1,2,3,4].map(i=>`<button class="lanB ${L&&L.done&&L.pick===i?'win':''}" data-act="lan" data-id="${i}" ${!L||L.done?'disabled':''}>${L&&L.done?`<b>${L.m[i]?L.m[i]+'×':'✕'}</b>`:'🏮'}</button>`).join('')}</div>
   ${L&&!L.done?'<div class="muted">Pick a lantern.</div>':`<button class="btn" data-act="langgo" ${state.coins<CAS.bet?'disabled':''}>Light the lanterns · ${fmt(CAS.bet)}c</button><div class="muted">Five lanterns hide ✕, 0.5×, 1×, 1.4× and 1.7×. Pick one.</div>`}`;},
 blackjack:()=>{const B=CAS.bj;if(!B)return `<div class="muted">Get closer to 21 than the dealer without going over. Blackjack pays 3 to 2. The dealer stands on 17.</div><button class="btn" data-act="bjdeal" ${state.coins<CAS.bet?'disabled':''}>Deal · ${fmt(CAS.bet)}c</button>`;
  return `<div class="muted">Dealer ${B.done?'· '+bjTotal(B.d):''}</div><div class="cards">${B.d.map((c,i)=>cardHtml(c,i===1&&!B.done)).join('')}</div><div class="muted">You · ${bjTotal(B.p)}</div><div class="cards">${B.p.map(c=>cardHtml(c)).join('')}</div>
   ${B.done?`<button class="btn" data-act="bjdeal" ${state.coins<CAS.bet?'disabled':''}>Deal again · ${fmt(CAS.bet)}c</button>`:`<div class="row" style="gap:8px;justify-content:center"><button class="btn" data-act="bjhit">Hit</button><button class="btn sky" data-act="bjstand">Stand</button><button class="btn ghost" data-act="bjdouble" ${B.p.length>2||state.coins<B.bet?'disabled':''}>Double</button></div>`}`;},
 crash:()=>{const C=CAS.crash;return `<div class="crashBox ${C&&C.dead?'dead':''}"><b id="crashM">${C?C.m.toFixed(2):'1.00'}×</b><div class="crashBar"><i id="crashBar" style="width:${C?Math.min(100,(C.m-1)*25):0}%"></i></div></div>
   ${C&&!C.dead&&!C.out?`<button class="btn sky" data-act="crashout">Cash out</button>`:`<button class="btn" data-act="crashgo" ${state.coins<CAS.bet?'disabled':''}>Launch · ${fmt(CAS.bet)}c</button>`}<div class="muted">The multiplier climbs until the volcano erupts. Cash out before it blows.</div>`;},
 roulette:()=>{const R=CAS.rou;const col=n=>n===0?'green':RED.has(n)?'red':'black';return `<div class="rouNum ${R?col(R.n):''} ${CAS.busy?'spin':''}" id="rouNum">${R?R.n:'?'}</div>
   <div class="row" style="gap:6px;justify-content:center;flex-wrap:wrap">${[['red','Red ×2'],['black','Black ×2'],['odd','Odd ×2'],['even','Even ×2'],['low','1–18 ×2'],['high','19–36 ×2']].map(([k,t])=>`<button class="btn sm" data-act="rou" data-id="${k}" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>${t}</button>`).join('')}</div>
   <div class="row" style="gap:6px;justify-content:center"><select id="rouPick">${Array.from({length:37},(_,i)=>`<option ${i===CAS.rnum?'selected':''}>${i}</option>`).join('')}</select><button class="btn sm" data-act="rou" data-id="num" ${CAS.busy||state.coins<CAS.bet?'disabled':''}>Single number ×36</button></div><div class="muted">Numbers 0 to 36. Zero is green and loses every outside bet.</div>`;},
 mines:()=>{const M=CAS.mines;return `<div class="mines">${Array.from({length:25},(_,i)=>{const open=M&&M.open.has(i),boom=M&&M.dead&&M.bad.has(i);return `<button class="mineB ${open?'ok':''} ${boom?'boom':''}" data-act="mine" data-id="${i}" ${!M||M.dead||M.out||open?'disabled':''}>${open?'💎':boom?'💥':''}</button>`;}).join('')}</div>
   ${M&&!M.dead&&!M.out?`<div class="muted">Next crystal pays ×${minesMul(M.open.size+1).toFixed(2)}</div><button class="btn sky" data-act="minecash" ${M.open.size?'':'disabled'}>Cash out ${fmt(Math.floor(M.bet*minesMul(M.open.size)))}c</button>`:`<button class="btn" data-act="minego" ${state.coins<CAS.bet?'disabled':''}>New grid · ${fmt(CAS.bet)}c</button><div class="muted">25 tiles, 4 cracks. Every crystal you find raises the payout.</div>`}`;}};
function openCasino(n){const line=npcSay(n);const gid=n.game||'slots';openPanel(n.name,n.title,()=>{panelCtx.kind='casino';
 const locked=CAS.busy||(gid==='hilo'&&CAS.hl)||(gid==='blackjack'&&CAS.bj&&!CAS.bj.done)||(gid==='crash'&&CAS.crash&&!CAS.crash.dead&&!CAS.crash.out)||(gid==='mines'&&CAS.mines&&!CAS.mines.dead&&!CAS.mines.out)||(gid==='shells'&&CAS.shells&&!CAS.shells.done)||(gid==='lanterns'&&CAS.lan&&!CAS.lan.done);
 body(`${line}${betBar(locked)}<div class="card cas">${GAME_RENDER[gid]()}</div>${CAS.res?`<div class="say"><span class="who">${esc(n.name)}</span>${esc(CAS.res)}</div>`:''}`);
 const win=(bet,mul,msg)=>{const w=Math.floor(bet*mul);casPay(bet,w);CAS.res=msg.replace('#',fmt(w));if(mul>=3){AU.level();coinBurst(10);}else if(mul>1)AU.coin();else if(mul>0)AU.ui();else AU.escape();};
 bindPanel({cbet:id=>{CAS.bet=Number(id);rerender();},
  spin:()=>{if(CAS.busy||!casTake(CAS.bet))return;CAS.busy=true;CAS.res='';const res=[slotRoll(),slotRoll(),slotRoll()];rerender();const els=[0,1,2].map(k=>$('#reel'+k));els.forEach(e=>e&&e.classList.add('spin'));
   const iv=setInterval(()=>{els.forEach(e=>{if(e&&e.classList.contains('spin'))e.textContent=pick(SLOT_SYM)[0];});AU.tick();},70);
   [700,1100,1500].forEach((t,k)=>setTimeout(()=>{const e=$('#reel'+k);if(e){e.classList.remove('spin');e.textContent=res[k][0];}CAS.reels[k]=res[k][0];AU.reelTick(.6);if(k===2){clearInterval(iv);CAS.busy=false;
    const s=res.map(r=>r[0]),three=s[0]===s[1]&&s[1]===s[2],two=!three&&(s[0]===s[1]||s[1]===s[2]||s[0]===s[2]);win(CAS.bet,three?res[0][2]:two?SLOT_PAIR:0,three?`Three ${s[0]}! You win # coins.`:two?'A pair! # coins back.':'No luck this time.');if(three)AU.catch(Math.min(6,SLOT_SYM.findIndex(x=>x[0]===s[0])));rerender();}},t));},
  wheel:()=>{if(CAS.busy||!casTake(CAS.bet))return;CAS.busy=true;CAS.res='';const i=Math.floor(Math.random()*WHEEL.length),seg=360/WHEEL.length,target=CAS.wheelRot-((CAS.wheelRot%360)+360)%360+360*5-i*seg;rerender();
   const svg=$('#wheelSvg');if(svg){svg.style.transition='transform 3.2s cubic-bezier(.15,.85,.25,1)';requestAnimationFrame(()=>{svg.style.transform=`rotate(${target}deg)`;});}
   const iv=setInterval(()=>AU.tick(),80);setTimeout(()=>{clearInterval(iv);CAS.wheelRot=target;CAS.busy=false;const m=WHEEL[i];win(CAS.bet,m,m?`The wheel stops on ${m}×. You win # coins!`:'The wheel stops on ✕. Better luck next spin.');rerender();},3300);},
  hlstart:()=>{if(!casTake(CAS.bet))return;CAS.hl={card:1+Math.floor(Math.random()*13),pot:CAS.bet,n:0,bet:CAS.bet};CAS.res='';AU.ui();rerender();},
  hl:id=>{const H=CAS.hl;if(!H)return;const nx=1+Math.floor(Math.random()*13);if(nx===H.card){CAS.res=`Another ${cardName(nx)}. A tie, draw again.`;AU.tick();rerender();return;}
   if(id==='hi'?nx>H.card:nx<H.card){H.pot=Math.min(2e6,H.pot*hlMul(H.card,id));H.n++;H.card=nx;CAS.res=`${cardName(nx)}! Right. The pot is ${fmt(Math.floor(H.pot))}.`;AU.coin();}else{CAS.res=`${cardName(nx)}. Wrong guess, the pot is gone.`;CAS.hl=null;AU.escape();save();}rerender();},
  hlcash:()=>{const H=CAS.hl;if(!H||!H.n)return;CAS.hl=null;win(H.bet,H.pot/H.bet,`Cashed out # coins after ${H.n} right guesses.`);rerender();},
  coin:id=>{if(CAS.busy||!casTake(CAS.bet))return;CAS.busy=true;CAS.res='';rerender();const r=Math.random()<.5?'H':'T';const iv=setInterval(()=>AU.tick(),120);
   setTimeout(()=>{clearInterval(iv);CAS.busy=false;CAS.coin=r==='H'?'👑':'🐟';win(CAS.bet,r===id?1.9:0,r===id?`${r==='H'?'Heads':'Tails'}! You win # coins.`:`${r==='H'?'Heads':'Tails'}. The bog keeps your coins.`);rerender();},1100);},
  shellgo:()=>{if(!casTake(CAS.bet))return;CAS.shells={pearl:Math.floor(Math.random()*3),done:false,bet:CAS.bet};CAS.res='';AU.shake();rerender();},
  shell:id=>{const S=CAS.shells;if(!S||S.done)return;S.done=true;const ok=Number(id)===S.pearl;win(S.bet,ok?2.85:0,ok?'You found the pearl! # coins.':'Empty shell. The pearl was elsewhere.');rerender();},
  dice:id=>{if(CAS.busy||!casTake(CAS.bet))return;CAS.busy=true;CAS.res='';rerender();const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);const iv=setInterval(()=>{const e0=$('#d0'),e1=$('#d1');if(e0)e0.textContent=pick([...DICE]);if(e1)e1.textContent=pick([...DICE]);AU.tick();},80);
   setTimeout(()=>{clearInterval(iv);CAS.busy=false;CAS.dice=[a,b];const t=a+b,ok=id==='u'?t<7:id==='o'?t>7:t===7;win(CAS.bet,ok?(id==='s'?5.5:2.3):0,ok?`${t}! You win # coins.`:`${t}. Not this time.`);rerender();},1000);},
  'langgo':()=>{if(!casTake(CAS.bet))return;const m=[0,.5,1,1.4,1.7];for(let i=m.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[m[i],m[j]]=[m[j],m[i]];}CAS.lan={m,done:false,bet:CAS.bet,pick:-1};CAS.res='';AU.ui();rerender();},
  lan:id=>{const L=CAS.lan;if(!L||L.done)return;L.done=true;L.pick=Number(id);const m=L.m[L.pick];win(L.bet,m,m?`${m}× lantern! # coins.`:'An empty lantern. It flickers out.');rerender();},
  bjdeal:()=>{if(!casTake(CAS.bet))return;const B={p:[drawCard(),drawCard()],d:[drawCard(),drawCard()],bet:CAS.bet,done:false};CAS.bj=B;CAS.res='';AU.ui();
   if(bjTotal(B.p)===21){B.done=true;const dbj=bjTotal(B.d)===21;win(B.bet,dbj?1:2.5,dbj?'Both blackjack. Push, # back.':'Blackjack! You win # coins.');}rerender();},
  bjhit:()=>{const B=CAS.bj;if(!B||B.done)return;B.p.push(drawCard());AU.tick();if(bjTotal(B.p)>21){B.done=true;win(B.bet,0,`Bust at ${bjTotal(B.p)}. The house wins.`);}rerender();},
  bjstand:()=>{const B=CAS.bj;if(!B||B.done)return;bjFinish(B,win);rerender();},
  bjdouble:()=>{const B=CAS.bj;if(!B||B.done||B.p.length>2||!casTake(B.bet))return;B.bet*=2;B.p.push(drawCard());if(bjTotal(B.p)>21){B.done=true;win(B.bet,0,`Bust at ${bjTotal(B.p)}.`);}else bjFinish(B,win);rerender();},
  crashgo:()=>{if(!casTake(CAS.bet))return;const r=Math.random(),cp=Math.max(1,Math.floor(96/(1-r))/100);const C={m:1,crash:cp,bet:CAS.bet,dead:false,out:false,t0:performance.now()};CAS.crash=C;CAS.res='';rerender();
   C.iv=setInterval(()=>{const t=(performance.now()-C.t0)/1000;C.m=Math.min(C.crash,Math.exp(.16*t));const e=$('#crashM'),bar=$('#crashBar');if(e)e.textContent=C.m.toFixed(2)+'×';if(bar)bar.style.width=Math.min(100,(C.m-1)*25)+'%';if(Math.random()<.3)AU.tick();
    if(C.m>=C.crash){clearInterval(C.iv);C.dead=true;AU.thunder(60);CAS.res=`The volcano erupted at ${C.crash.toFixed(2)}×!`;if(panelCtx&&panelCtx.kind==='casino')rerender();}
    else if(!(panelCtx&&panelCtx.kind==='casino')){clearInterval(C.iv);C.out=true;casPay(C.bet,Math.floor(C.bet*C.m));toast(`Lava Rise: cashed out ${fmt(Math.floor(C.bet*C.m))} coins at ${C.m.toFixed(2)}× when you left.`);}},60);},
  crashout:()=>{const C=CAS.crash;if(!C||C.dead||C.out)return;clearInterval(C.iv);C.out=true;win(C.bet,C.m,`Cashed out at ${C.m.toFixed(2)}×: # coins. It would have erupted at ${C.crash.toFixed(2)}×.`);rerender();},
  rou:id=>{if(CAS.busy||!casTake(CAS.bet))return;const pk=$('#rouPick');if(pk)CAS.rnum=Number(pk.value);CAS.busy=true;CAS.res='';rerender();const n=Math.floor(Math.random()*37);const iv=setInterval(()=>{const e=$('#rouNum');if(e)e.textContent=Math.floor(Math.random()*37);AU.tick();},70);
   setTimeout(()=>{clearInterval(iv);CAS.busy=false;CAS.rou={n};const ok=id==='num'?n===CAS.rnum:n===0?false:id==='red'?RED.has(n):id==='black'?!RED.has(n):id==='odd'?n%2===1:id==='even'?n%2===0:id==='low'?n<=18:n>=19;
    win(CAS.bet,ok?(id==='num'?36:2):0,ok?`${n}! You win # coins.`:`${n}${n===0?' (green)':RED.has(n)?' (red)':' (black)'}. The house wins.`);rerender();},1600);},
  minego:()=>{if(!casTake(CAS.bet))return;const bad=new Set();while(bad.size<4)bad.add(Math.floor(Math.random()*25));CAS.mines={bad,open:new Set(),bet:CAS.bet,dead:false,out:false};CAS.res='';AU.ui();rerender();},
  mine:id=>{const M=CAS.mines;if(!M||M.dead||M.out)return;const i=Number(id);if(M.bad.has(i)){M.dead=true;CAS.res='Crack! The crystals shatter and the bet is lost.';AU.snap();save();}else{M.open.add(i);AU.bell(1568+M.open.size*90,.4,.06);if(M.open.size===21){M.out=true;win(M.bet,minesMul(21),'Every crystal found! # coins.');}}rerender();},
  minecash:()=>{const M=CAS.mines;if(!M||M.dead||M.out||!M.open.size)return;M.out=true;win(M.bet,minesMul(M.open.size),`Cashed out # coins with ${M.open.size} crystals.`);rerender();}});});}
function bjFinish(B,win){while(bjTotal(B.d)<17)B.d.push(drawCard());B.done=true;const p=bjTotal(B.p),d=bjTotal(B.d);
 if(d>21||p>d)win(B.bet,2,`You ${p} against ${d>21?'a dealer bust':d}. You win # coins!`);else if(p===d)win(B.bet,1,`${p} each. Push, # back.`);else win(B.bet,0,`Dealer ${d} beats your ${p}.`);}
/* the hall: hide its roof while you're inside and pull the camera in */
const CASINO={inside:false,keep:null};
function updateCasino(){const H=world.casino;if(!H)return;const dx=player.pos.x-H.x,dz=player.pos.z-H.z,c=Math.cos(H.ry),s=Math.sin(H.ry),lx=dx*c-dz*s,lz=dx*s+dz*c;const inside=player.mode==='walk'&&Math.abs(lx)<H.W/2&&Math.abs(lz)<H.D/2;
 if(inside!==CASINO.inside){CASINO.inside=inside;H.roof.visible=!inside;if(H.sign)H.sign.visible=!inside;if(inside){CASINO.keep={d:cam.tdist,p:cam.pitch};cam.tdist=Math.min(cam.tdist,10);cam.pitch=Math.max(cam.pitch,.8);toast('Welcome to the Tidewater Casino!');}else if(CASINO.keep){cam.tdist=CASINO.keep.d;cam.pitch=CASINO.keep.p;CASINO.keep=null;}}}


/* ================= ROD DISPLAYS =================
   Every island lays its rods out on stands beside the arrival path. Walk up to one and press E to look it over,
   buy it or equip it. The same rods are also in the rodmakers' shops. */
const ROD_RACKS={cove:['pine','bamboo','tidepool','coral','reed'],moss:['bogwood','willow','moss'],atoll:['reefcomber','pearl'],frost:['frostbite','glacier','auroral'],petal:['petalwind','blossom','storm'],
 amber:['harvestmoon','thornwood','magma','twin'],ember:['cinderheart','sage','star','lantern'],dune:['mirage','dune','scarab'],kelp:['kelpweaver'],ruins:['scepter'],glim:['prismheart','amethyst','spine','celestial','tidebreaker'],hollow:['drowncrown']};
const RACK={built:false,list:[]};
function rodState(r){return state.rod===r.id?'eq':state.rods.includes(r.id)?'own':rodLocked(r)?'lock':'buy';}
function rackLabel(it){const r=it.r,s=rodState(r);const sub=s==='eq'?'Equipped':s==='own'?'Owned · press E to equip':s==='lock'?rodLocked(r):fmt(r.price)+' coins';const col=s==='eq'?'#9be07a':s==='own'?'#a6d4f7':s==='lock'?'#ff9a8a':'#f2c14e';
 if(it.key===s+sub)return;it.key=s+sub;if(it.label){it.g.remove(it.label);it.label.material.map.dispose();it.label.material.dispose();}it.label=tagSprite(null,r.n,sub,col);it.label.position.set(0,3.9,0);it.g.add(it.label);}
function buildRodRacks(){RACK.built=true;for(const key in ROD_RACKS){const ids=ROD_RACKS[key].filter(id=>RODM[id]);if(!ids.length)continue;const shops=world.shops[key]||[];const st=shops.find(s=>s.role==='rods')||shops.find(s=>s.role==='merchant');
  const b=new Builder();let spots=[];
  if(st){/* rods lean on two racks either side of the shop's stall */const c=Math.cos(st.ry),s=Math.sin(st.ry),wp=(lx,lz)=>({x:st.x+lx*c+lz*s,z:st.z-lx*s+lz*c}),half=Math.ceil(ids.length/2);
   for(const side of[-1,1]){const n=side<0?half:ids.length-half;if(!n)continue;const rx=side*(st.W/2+1.25),z0=-.9,z1=z0+(n-1)*.85+.5;
    for(const zz of[z0-.3,z1]){const q=wp(rx,zz),gy=groundH(q.x,q.z);b.M(TL.wood);b.add(G.box,'#5a3e26',q.x,gy+.8,q.z,.12,1.6,.12,0,st.ry,0);}
    const qa=wp(rx,(z0-.3+z1)/2),ga=groundH(qa.x,qa.z);b.add(G.box,'#6a4a2c',qa.x,ga+1.55,qa.z,.1,.1,z1-z0+.45,0,st.ry,0);b.add(G.box,'#6a4a2c',qa.x,ga+.35,qa.z,.08,.08,z1-z0+.45,0,st.ry,0);
    for(let i=0;i<n;i++){const q=wp(rx+side*.42,z0+i*.85);spots.push({x:q.x,z:q.z,ry:st.ry,lean:side*.2});}}}
  else{const sp=world.spawn[key];if(!sp)continue;const fx=Math.sin(sp.yaw),fz=Math.cos(sp.yaw),sx=Math.cos(sp.yaw),sz=-Math.sin(sp.yaw);
   ids.forEach((id,i)=>{const x=sp.x+sx*6+fx*(i-(ids.length-1)/2)*1.2,z=sp.z+sz*6+fz*(i-(ids.length-1)/2)*1.2;spots.push({x,z,ry:sp.yaw,lean:0,stand:true});});}
  ids.forEach((id,i)=>{const r=RODM[id],sp2=spots[i];if(!sp2)return;const y=groundH(sp2.x,sp2.z);
   if(sp2.stand){b.M(TL.wood);b.add(G.cyl12,'#6a4a2e',sp2.x,y+.12,sp2.z,.5,.24,.5);b.M(0);}
   const g=new THREE.Group();g.position.set(sp2.x,y,sp2.z);g.rotation.y=sp2.ry;const rod=buildRod(r,state.ench[id]||null);rod.g.rotation.set(0,0,sp2.lean);rod.g.position.set(0,.05,0);{const bm=bakeMeshes(rod.g);if(bm){bm.position.copy(rod.g.position);bm.quaternion.copy(rod.g.quaternion);g.add(bm);}else g.add(rod.g);}scene.add(g);
   const it={r,g,rod,x:sp2.x,z:sp2.z,label:null,key:'',lean:sp2.lean};RACK.list.push(it);world.colliders.push({x:sp2.x,z:sp2.z,r:.3});
   world.inter.push({x:sp2.x,z:sp2.z,r:1.9,get label(){const s=rodState(r);return s==='eq'?`${r.n} (equipped)`:s==='own'?`Equip the ${r.n}`:s==='lock'?`Look at the ${r.n}`:`Buy the ${r.n} · ${fmt(r.price)}c`;},get kind(){const s=rodState(r);return s==='buy'?'Buy':s==='own'?'Equip':'Look';},act:()=>openRodView(r)});});
  if(b.p.length){const m=b.mesh(worldMat);m.castShadow=true;m.receiveShadow=true;scene.add(m);}}}
function updateRodRacks(dt){if(!RACK.built){if(world.spawn.cove)buildRodRacks();return;}const p=player.pos;let near=null,nd=4;
 for(const it of RACK.list){const d=Math.hypot(it.x-p.x,it.z-p.z);it.g.visible=d<160;if(d<nd){nd=d;near=it;}}
 for(const it of RACK.list){const show=it===near&&state.settings.tags;if(show){rackLabel(it);it.label.visible=true;}else if(it.label)it.label.visible=false;}}
function openRodView(r){openPanel(r.n,rodState(r)==='buy'?fmt(r.price)+' coins':'Rod',()=>{panelCtx.kind='rodview';const s=rodState(r),lock=rodLocked(r);
 body(`<div class="card ${s==='eq'?'eq':''}"><div class="row"><img class="thumb" src="${rodThumb(r)}" alt=""><div class="grow"><h3>${esc(r.n)}</h3>${r.perk?`<div class="muted">Perk: ${esc(r.perk.d)}</div>`:''}</div></div>${statBars(r)}
  <div class="row" style="justify-content:flex-end;gap:8px">${s==='eq'?'<span class="pill" style="--c:#9be07a">Equipped</span>':s==='own'?`<button class="btn sky" data-act="req" data-id="${r.id}">Equip</button>`:lock&&s!=='own'?`<span class="muted">${esc(lock)}</span>`:`<span class="muted">You have ${fmt(state.coins)}c</span><button class="btn" data-act="rbuy" data-id="${r.id}" ${state.coins<r.price?'disabled':''}>Buy · ${fmt(r.price)}c</button>`}</div></div>`);
 bindPanel({rbuy:id=>{const R=RODM[id];if(state.coins<R.price||rodLocked(R)||state.rods.includes(id))return;state.coins-=R.price;state.rods.push(id);state.rod=id;equipRodModel();AU.coin();coinBurst(6);questEvent('rod');toast(`You bought the ${R.n}!`,'gold');save();updateHUD();rerender();},
  req:id=>{if(!state.rods.includes(id))return;state.rod=id;equipRodModel();AU.ui();save();updateHUD();rerender();}});});}

/* ================= ROD PATH: which rod to aim for next, and where it is sold ================= */
const ROD_HOME={};for(const k in ROD_RACKS)for(const id of ROD_RACKS[k])ROD_HOME[id]=k;
const NR={key:'',t:0,guide:null,beam:null,afford:null};
const rodWhere=id=>{const h=ROD_HOME[id];return !h?'':ZONES[h].n;};
function rodNeed(r){const l=rodLocked(r);if(l)return l;const h=ROD_HOME[r.id];if(h&&ISL.includes(h)&&!state.unlocked.includes(h))return 'Sold on '+ZONES[h].n+': buy its chart first';if(h&&!ISL.includes(h)&&!state.tips['cave_'+h]&&h!=='hollow')return 'Sold in '+ZONES[h].n;return null;}
function rodPathList(){const out=[];for(const k of ISL.concat(['hollow','kelp','ruins']))for(const id of(ROD_RACKS[k]||[]).filter(i=>RODM[i]).sort((a,b)=>RODM[a].price-RODM[b].price))out.push(RODM[id]);return out;}
function nextRodPick(){let best=0;for(const id of state.rods){const r=RODM[id];if(r&&r.luck>best)best=r.luck;}
 const c=rodPathList().filter(r=>r.price>0&&!state.rods.includes(r.id)&&r.luck>best).sort((a,b)=>a.price-b.price||a.luck-b.luck);return c.find(r=>!rodNeed(r))||c[0]||null;}
const rodIcon=r=>`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 6v10.5" stroke="#e8eef4" stroke-width="1" opacity=".75"/><path d="M6 26 26 6" stroke="${r.shaft}" stroke-width="2.6" stroke-linecap="round"/><path d="M5 27l5-5" stroke="${r.handle}" stroke-width="4.2" stroke-linecap="round"/><circle cx="11.6" cy="22" r="3.1" fill="${r.reelC}" stroke="#0d1117" stroke-width="1.3"/><circle cx="26" cy="18" r="1.7" fill="${r.glow||'#ff6a4a'}"/></svg>`;
function nextRodTick(dt){NR.t-=dt;if(NR.t>0)return;NR.t=.4;const el=document.getElementById('nextRod');if(!el)return;
 const r=state.settings.nextRod===false?null:nextRodPick();if(!r){if(!el.hidden){el.hidden=true;NR.key='';}return;}
 const need=rodNeed(r),where=rodWhere(r.id),ready=!need&&state.coins>=r.price,pct=need?1:Math.min(1,state.coins/r.price);
 const key=[r.id,need,ready,fmt(state.coins),Math.round(pct*200)].join('|');
 if(key!==NR.key){NR.key=key;el.hidden=false;el.className=ready?'ready':need?'lock':'';el.title='Open the rod path';
  el.innerHTML=`<span class="nrI">${rodIcon(r)}</span><small>${ready?'Ready to buy':'Next rod'}</small><b>${esc(r.n)}</b><em>${esc(need||'Tackle & Rods · '+where)}</em><span class="nrBar"><i style="width:${(pct*100).toFixed(1)}%"></i><span>${need?'Locked':ready?'Go get it · '+fmt(r.price)+'c':fmt(state.coins)+' / '+fmt(r.price)+'c'}</span></span>`;}
 if(NR.afford===null)NR.afford=ready?r.id:'';else if(ready&&NR.afford!==r.id){NR.afford=r.id;toast(`You can afford the ${r.n}! It's on the rod rack at ${where}.`,'gold');AU.ui&&AU.ui();}else if(!ready)NR.afford='';}
function openRodPath(){openPanel('Rod path','Every rod, island by island',()=>{panelCtx.kind='rodpath';const nx=nextRodPick(),all=rodPathList();const own=all.filter(r=>state.rods.includes(r.id)).length;
 let h=`<div class="rpTop"><div><b>${own} / ${all.length}</b><small>rods owned</small></div><div><b>+${RODM[state.rod].luck}%</b><small>luck now</small></div><div class="grow"></div><button class="btn sm ${state.settings.nextRod===false?'sky':'ghost'}" data-act="nrtog">${state.settings.nextRod===false?'Show tracker':'Hide tracker'}</button></div>`;
 if(nx){const need=rodNeed(nx);h+=`<div class="card eq rpNext"><div class="row"><span class="nrI big">${rodIcon(nx)}</span><div class="grow"><small class="kick">Aim for next</small><h3>${esc(nx.n)}</h3><div class="muted">${esc(need||(state.coins>=nx.price?'You can afford it now':'Need '+fmt(nx.price-state.coins)+' more coins'))} · sold at ${esc(rodWhere(nx.id))}</div></div><button class="btn" data-act="guide" data-id="${nx.id}">Show me the way</button></div></div>`;}
 else h+=`<div class="card eq"><h3>Every rod on the racks is yours</h3><div class="muted">Quest rods are listed at the bottom.</div></div>`;
 for(const k of ISL.concat(['hollow','kelp','ruins'])){const ids=(ROD_RACKS[k]||[]).filter(i=>RODM[i]).sort((a,b)=>RODM[a].price-RODM[b].price);if(!ids.length)continue;const open=!ISL.includes(k)||state.unlocked.includes(k);
  h+=`<div class="rpIsl${open?'':' shut'}"><h4><i style="--c:${ISL_COL[k]||'#6ad0e0'}"></i>${esc(ZONES[k].n)}${open?'':'<span>chart needed</span>'}</h4>`;
  for(const id of ids){const r=RODM[id],s=rodState(r),need=rodNeed(r),isN=nx&&nx.id===id;
   h+=`<div class="rpRow ${s}${isN?' next':''}"><span class="nrI">${rodIcon(r)}</span><div class="grow"><b>${esc(r.n)}${isN?'<em>Next</em>':''}</b><small>+${r.luck}% luck${r.perk?' · '+esc(r.perk.d):''}</small></div><div class="rpR">${s==='eq'?'<span class="tag ok">Equipped</span>':s==='own'?'<span class="tag own">Owned</span>':need?`<span class="tag lock">${esc(need)}</span>`:`<span class="tag buy">${fmt(r.price)}c</span>`}${s==='eq'||s==='own'?'':`<button class="btn sm ghost" data-act="guide" data-id="${id}" title="Mark it on your compass">Find</button>`}</div></div>`;}
  h+='</div>';}
 const qr=RODS.filter(r=>r.req&&(r.req.quest||r.req.relic||r.req.secret||r.req.bounties||r.req.dex||r.req.derby));if(qr.length){h+=`<div class="rpIsl"><h4><i style="--c:#ffd76e"></i>Quests, sea glass and secrets</h4>`+qr.map(r=>{const s=rodState(r);return `<div class="rpRow ${s}"><span class="nrI">${rodIcon(r)}</span><div class="grow"><b>${esc(r.n)}</b><small>+${r.luck}% luck${r.perk?' · '+esc(r.perk.d):''}</small></div><div class="rpR">${s==='eq'?'<span class="tag ok">Equipped</span>':s==='own'?'<span class="tag own">Owned</span>':`<span class="tag lock">${esc(rodLocked(r)||'')}</span>`}</div></div>`;}).join('')+'</div>';}
 body(h);bindPanel({guide:id=>{setRodGuide(id);closePanel();},nrtog:()=>{state.settings.nextRod=state.settings.nextRod===false;NR.key='';save();rerender();}});});}
function guideBeam(){const g=new THREE.CylinderGeometry(.16,.3,60,12,1,true);g.translate(0,30,0);
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:{uT:{value:0},uA:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT;uniform float uA;varying float vY;void main(){float a=pow(1.-vY,2.6)*(.3+.1*sin(uT*2.6-vY*14.))*uA;gl_FragColor=vec4(vec3(1.,.72,.3)*a,1.);}'}));
 m.frustumCulled=false;m.renderOrder=5;reflHide.push(m);scene.add(m);return m;}
function setRodGuide(id){const it=RACK.list.find(i=>i.r.id===id);if(!it){toast('That rod is not on display yet.');return;}
 NR.guide={x:it.x,z:it.z,id};if(!NR.beam)NR.beam=guideBeam();NR.beam.position.set(it.x,groundH(it.x,it.z),it.z);NR.beam.visible=true;
 const h=ROD_HOME[id],far=h&&h!=='hollow'&&zoneAt(player.pos.x,player.pos.z)!==h;toast(far?`The ${RODM[id].n} is on ${rodWhere(id)}. Follow the gold pin on your compass.`:`Follow the gold pin on your compass to the ${RODM[id].n}.`);}
function clearRodGuide(){NR.guide=null;if(NR.beam)NR.beam.visible=false;const pin=document.getElementById('guidePin');if(pin)pin.hidden=true;}
function guideTick(){const pin=document.getElementById('guidePin');if(!pin)return;if(!NR.guide){if(!pin.hidden)pin.hidden=true;return;}
 const g=NR.guide,p=player.mode==='boat'?boat.pos:player.pos,dx=g.x-p.x,dz=g.z-p.z,d=Math.hypot(dx,dz);
 if(d<3||state.rods.includes(g.id)||(env.cave&&ROD_HOME[g.id]!=='hollow')){if(d<3||state.rods.includes(g.id))clearRodGuide();else pin.hidden=true;return;}
 camera.getWorldDirection(_cf);const head=Math.atan2(_cf.x,-_cf.z)*180/Math.PI,brg=Math.atan2(dx,-dz)*180/Math.PI,rel=((brg-head)%360+540)%360-180;
 const w=document.getElementById('compass').clientWidth,max=w/2-18,x=clamp(rel*COMP.ppd,-max,max);
 pin.hidden=false;pin.style.transform=`translateX(calc(-50% + ${x.toFixed(1)}px))`;pin.classList.toggle('edge',Math.abs(rel*COMP.ppd)>max);
 const t=d>=1000?(d/1000).toFixed(1)+' km':Math.round(d)+' m';const s=pin.lastChild;if(s.textContent!==t)s.textContent=t;
 if(NR.beam){const u=NR.beam.material.uniforms;u.uT.value=performance.now()/1000;u.uA.value=smooth(4,16,d)*(1-env.day*.35);}}

/* ================= LOST PAGES: twelve torn journal pages hidden around the isles ================= */
const PAGES_N=12,PAGES={built:false,list:[]};
const PAGE_TXT=['Day one. The ferryman says the isles move when no one is looking. I laughed. I have stopped laughing.','The keeper of the lighthouse leaves a lamp lit on foggy nights, "for the one that swims up the beam."','Moss grows thickest where the old altar hums. Sister Fen says the sea glass sings back to it.','Under the atoll the coral rings like a bell at dawn. Something large answers.','Frostmere ice is clear as glass. I saw a shape below it longer than my boat.','The cherry blossoms on Petalshore only fall when the stars do. The koi there watch the sky.','Amberglen\'s farmers fish at harvest moon. They throw the first catch back, always.','The volcano breathes at night. The fish near the vents have eyes like coals.','In the dunes I found a ship\'s wheel, a hundred miles from any sea that could have carried it.','The crystals of Glimmerholt keep the light of every lamp that ever shone on them.','Where the tide wells open, the water goes down forever. I have heard a king sing there.','My rod is driftwood, like the first one. It has caught everything worth catching. Leave it where it can be found.'];
const PAGE_ISL=['cove','cove','moss','atoll','frost','petal','amber','ember','dune','glim','moss','cove'];
function pageMesh(){const g=new THREE.Group(),pm=new THREE.MeshStandardMaterial({color:'#efe2c0',roughness:.85}),rm=new THREE.MeshStandardMaterial({color:'#a83a2a',roughness:.6});
 const roll=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.55,10),pm);roll.rotation.z=Math.PI/2;roll.position.y=.12;g.add(roll);const flap=new THREE.Mesh(new THREE.BoxGeometry(.5,.012,.32),pm);flap.position.set(0,.03,.16);flap.rotation.x=-.12;g.add(flap);
 const rib=new THREE.Mesh(new THREE.TorusGeometry(.095,.018,6,12),rm);rib.rotation.y=Math.PI/2;rib.position.y=.12;g.add(rib);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.halo,color:0xffe6a0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));sp.scale.set(1.3,1.3,1);sp.position.y=.3;g.add(sp);g.userData.glow=sp;
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
function buildPages(){PAGES.built=true;const r=rng(4242);
 PAGE_ISL.forEach((k,i)=>{const I=ZONES[k];if(!I)return;let spot=null;for(let t=0;t<120&&!spot;t++){const a=r()*TAU,f=.22+r()*.62,R=islandR(I,a),x=I.x+Math.cos(a)*R*f,z=I.z+Math.sin(a)*R*f,y=groundH(x,z);
   if(y<.7||world.colliders.some(c=>Math.abs(c.x-x)<c.r+1.4&&Math.abs(c.z-z)<c.r+1.4&&Math.hypot(c.x-x,c.z-z)<c.r+1.2))continue;spot={x,y,z};}
  if(!spot||state.pages.includes(i))return;const g=pageMesh();g.position.set(spot.x,spot.y+.02,spot.z);g.rotation.y=r()*TAU;scene.add(g);
  const it={i,g,x:spot.x,z:spot.z,k};const inter={x:spot.x,z:spot.z,r:2.2,label:'Pick up the Lost Page',kind:'Take',act:()=>takePage(it,inter)};world.inter.push(inter);PAGES.list.push(it);});}
function takePage(it,inter){if(state.pages.includes(it.i))return;state.pages.push(it.i);scene.remove(it.g);const k=world.inter.indexOf(inter);if(k>=0)world.inter.splice(k,1);PAGES.list.splice(PAGES.list.indexOf(it),1);
 AU.bell(1046,.5,.08);setTimeout(()=>AU.bell(1568,.6,.06),140);const n=state.pages.length,all=n>=PAGES_N;
 if(all&&!state.rods.includes('driftking')){state.rods.push('driftking');grantTitle('Pagekeeper');}
 save();openPanel(`Lost Page ${n} of ${PAGES_N}`,ZONES[it.k].n,()=>{body(`<div class="card page"><div class="pageTxt">${esc(PAGE_TXT[it.i])}</div></div>${all?`<div class="card eq"><h3>The journal is whole</h3><div class="muted">Tucked in the last page is a map to a driftwood rod. The Driftwood King is yours (+175% luck), along with the title Pagekeeper.</div><div class="row" style="justify-content:flex-end"><button class="btn" data-act="eqk">Equip it</button></div></div>`:`<div class="muted">${PAGES_N-n} more page${PAGES_N-n>1?'s':''} hidden around the isles. Look for a faint glow.</div>`}`);
  bindPanel({eqk:()=>{state.rod='driftking';equipRodModel();save();closePanel();}});});}
function updatePages(){if(!PAGES.built){if(world.spawn.cove&&state&&Array.isArray(state.pages))buildPages();return;}const p=player.pos,T=WIND.uTime.value;
 for(const it of PAGES.list){const d=Math.abs(it.x-p.x)+Math.abs(it.z-p.z);it.g.visible=d<140;if(d<60){it.g.userData.glow.material.opacity=.35+Math.sin(T*2.4+it.i)*.15+(isNight()?.2:0);it.g.rotation.y+=.004;}}}

/* ================= BOUNTY BOARD: three new jobs every day, the same for everyone ================= */
const BOARD={built:false,list:[]};
const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function bountyPay(){let best=9;for(const k of state.unlocked)best=Math.max(best,ZONE_BASE[k]||9);return best;}
function makeBounties(){const day=todayKey();if(state.bounty.day===day&&state.bounty.list.length)return;let h=0;for(const ch of day)h=(h*31+ch.charCodeAt(0))>>>0;const r=rng(h%100000+7);
 const isl=state.unlocked.filter(k=>ZONES[k]),pickI=()=>isl[Math.floor(r()*isl.length)]||'cove',pay=bountyPay(),L=[];
 {const k=pickI(),pool=SPECIES.filter(s=>s.zone===k&&s.r<=2&&!s.cond);const sp=pool[Math.floor(r()*pool.length)]||SPM.pebble_perch;L.push({t:'species',sp:sp.id,need:sp.r>=2?1:3,n:0,coins:Math.round(pay*(sp.r>=2?60:35)),txt:`Catch ${sp.r>=2?'a':'3'} ${sp.name}${sp.r>=2?'':''}`,where:ZONES[sp.zone].n});}
 {const k=pickI(),need=8+Math.floor(r()*8);L.push({t:'count',zone:k,need,n:0,coins:Math.round(pay*need*3.2),txt:`Catch ${need} fish around ${ZONES[k].n}`,where:ZONES[k].n});}
 {const roll=r();if(roll<.4){const k=pickI(),pool=SPECIES.filter(s=>s.zone===k&&s.r<=3&&s.maxW>=1);const sp=pool[Math.floor(r()*pool.length)]||SPM.pebble_perch,w=Math.round(sp.maxW*.62*10)/10;L.push({t:'heavy',sp:sp.id,w,need:1,n:0,coins:Math.round(pay*90),crate:1,txt:`Land a ${sp.name} over ${fmtW(w)} kg`,where:ZONES[sp.zone].n});}
  else if(roll<.75){L.push({t:'rare',need:2,n:0,coins:Math.round(pay*80),crate:1,txt:'Catch 2 Rare-or-better fish',where:'Anywhere'});}
  else{L.push({t:'mut',need:1,n:0,coins:Math.round(pay*85),crate:1,txt:'Catch a fish with a variant',where:'Anywhere'});}}
 state.bounty={day,list:L,all:false};save();}
function bountyCatch(c,zone){if(!c||c.relic||!state.bounty)return;makeBounties();let ch=false;
 for(const b of state.bounty.list){if(b.n>=b.need)continue;let hit=false;const isl=c.sp&&(c.sp.zone.startsWith('pond_')?c.sp.zone.slice(5):c.sp.zone);
  if(b.t==='species')hit=c.sp.id===b.sp;else if(b.t==='count')hit=isl===b.zone||zone===b.zone;else if(b.t==='heavy')hit=c.sp.id===b.sp&&c.w>=b.w;else if(b.t==='rare')hit=c.r>=2;else if(b.t==='mut')hit=!!c.mut;
  if(hit){b.n++;ch=true;if(b.n>=b.need)setTimeout(()=>toast(`Bounty done: ${b.txt}. Claim it at any Bounty Board.`,'gold'),900);}}
 if(ch)save();}
function openBounties(){makeBounties();openPanel('Bounty Board','New bounties every day · the same for everyone',()=>{panelCtx.kind='bounty';const B=state.bounty;
 body(`<div class="muted">Finish all three for a bonus Sea Glass. Rewards grow as you unlock new islands.</div><div class="list">${B.list.map((b,i)=>{const done=b.n>=b.need;return `<div class="card ${b.claimed?'eq':''}"><div class="row"><div class="grow"><h3>${esc(b.txt)}</h3><div class="muted">${esc(b.where)} · reward ${fmt(b.coins)}c${b.crate?' + a Mystery Crate':''}</div><div class="bbar"><i style="width:${Math.min(100,b.n/b.need*100)}%"></i><span>${Math.min(b.n,b.need)} / ${b.need}</span></div></div>${b.claimed?'<span class="pill" style="--c:#9be07a">Claimed</span>':`<button class="btn sm" data-act="claim" data-id="${i}" ${done?'':'disabled'}>Claim</button>`}</div></div>`;}).join('')}</div>
  <div class="card"><div class="row"><div class="grow"><h3>Fishing Derby</h3><div class="muted">Three minutes against four rival anglers: land the heaviest fish. Prizes for the top three, a Mystery Crate for the winner. Derby wins: ${state.derbyWins||0}.</div></div><button class="btn sm" data-act="derby" ${DERBY.on?'disabled':''}>${DERBY.on?'Running':'Start'}</button></div></div>
  <div class="card"><div class="row"><div class="grow"><h3>Daily bonus</h3><div class="muted">${B.all?'Claimed today. Come back tomorrow for new bounties.':'Claim all three bounties for some Sea Glass.'}</div></div>${B.all?'<span class="pill" style="--c:#5fd6ff">Sea glass claimed</span>':''}</div></div>`);
 bindPanel({derby:()=>startDerby(),claim:v=>{const b=state.bounty.list[+v];if(!b||b.claimed||b.n<b.need)return;b.claimed=true;state.bountiesDone=(state.bountiesDone||0)+1;checkEarnedRods();state.coins+=b.coins;state.earned+=b.coins;AU.coin();coinBurst(8);if(b.crate)grantCrate('a bounty');
  if(!state.bounty.all&&state.bounty.list.every(q=>q.claimed)){state.bounty.all=true;state.relics++;toast('All bounties done! +1 Sea Glass','gold');}save();updateHUD();rerender();}});});}
function buildBoards(){BOARD.built=true;const b=new Builder();
 for(const k of ISL){const sp=world.spawn[k];if(!sp)continue;let spot=null;for(const off of[[-4.5,1.5],[4.5,1.5],[-5.5,-2],[5.5,-2],[-3.5,4]]){const sx=Math.cos(sp.yaw),sz=-Math.sin(sp.yaw),fx=Math.sin(sp.yaw),fz=Math.cos(sp.yaw);const x=sp.x+sx*off[0]+fx*off[1],z=sp.z+sz*off[0]+fz*off[1],y=groundH(x,z);
   if(y<.4||world.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.1))continue;spot={x,y,z};break;}if(!spot)continue;const ry=sp.yaw+Math.PI,{x,y,z}=spot,c=Math.cos(ry),s=Math.sin(ry);
  b.M(TL.wood);for(const sx of[-1,1])b.add(G.box,'#5a3e26',x+c*sx*.9,y+1.1,z-s*sx*.9,.14,2.2,.14,0,ry,0);b.add(G.box,'#8a6440',x,y+1.5,z,2.1,1.25,.1,0,ry,0);b.add(G.box,'#5a3e26',x,y+2.3,z,2.5,.12,.5,.0,ry,0);
  b.M(TL.paint);const cols=['#f4ead2','#efe2c0','#f8f0dc'];for(let i=0;i<3;i++){const ox=(i-1)*.62;b.add(G.box,cols[i],x+c*ox+s*.07,y+1.5+(i===1?.08:-.04),z-s*ox+c*.07,.5,.66,.02,0,ry,(i-1)*.06);b.add(G.box,'#c8402e',x+c*ox+s*.085,y+1.78+(i===1?.08:-.04),z-s*ox+c*.085,.06,.06,.02,0,ry,0);}
  b.M(0);world.colliders.push({x,z,r:1.1});const label=tagSprite(null,'Bounty Board','Daily jobs','#f2c14e');label.position.set(x,y+3,z);scene.add(label);BOARD.list.push({x,z,label});
  world.inter.push({x,z,r:2.6,label:'Read the Bounty Board',kind:'Read',act:openBounties});}
 if(b.p.length){const m=b.mesh(worldMat);m.castShadow=true;m.receiveShadow=true;scene.add(m);}}
function updateBoards(){if(!BOARD.built){if(world.spawn.cove)buildBoards();return;}const p=player.pos;for(const it of BOARD.list){const d=Math.abs(it.x-p.x)+Math.abs(it.z-p.z);it.label.visible=state.settings.tags&&d<30;}
 for(const c of world.caveTags||[]){const d=Math.abs(c.x-p.x)+Math.abs(c.z-p.z);c.tg.visible=state.settings.tags&&d<40;}}

/* ================= LIFE ON THE WATER: fish leap now and then near you ================= */
const LEAP={t:4,list:[]};
function updateLeaps(dt){LEAP.t-=dt;const T=WIND.uTime.value;
 if(LEAP.t<=0){LEAP.t=rand(3.5,8);const p=player.mode==='boat'?boat.pos:player.pos;if(!env.cave&&!MENU.on){for(let tr=0;tr<8;tr++){const a=Math.random()*TAU,d=rand(12,38),x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;if(groundH(x,z)>-1.6||pondAt(x,z))continue;
   const zone=zoneAt(x,z),pool=SPECIES.filter(s=>s.zone===zone&&s.r<=1&&s.shape!=='ray'&&s.shape!=='flat');const sp=pick(pool.length?pool:SPECIES.filter(s=>s.zone==='cove'&&s.r===0));
   let L=LEAP.list.find(q=>q.k>=1);if(!L){if(LEAP.list.length>=3)break;L={m:null,k:1};LEAP.list.push(L);}if(L.m){scene.remove(L.m);disposeHeld(L.m);}L.m=buildFish(sp,null);L.m.scale.setScalar(fishScale(sp,(sp.minW+sp.maxW)/2)*.9);scene.add(L.m);
   L.x=x;L.z=z;L.a=Math.random()*TAU;L.k=0;L.h=rand(.8,1.6);L.len=rand(1.4,2.6);L.dur=rand(.7,1);splash(new V3(x,surfY(x,z,T),z),8,3.5);break;}}}
 for(const L of LEAP.list){if(L.k>=1){if(L.m&&L.m.visible)L.m.visible=false;continue;}L.k+=dt/L.dur;const k=Math.min(1,L.k),hx=Math.cos(L.a),hz=Math.sin(L.a),x=L.x+hx*L.len*k,z=L.z+hz*L.len*k;
  L.m.visible=true;L.m.position.set(x,surfY(x,z,T)+Math.sin(k*Math.PI)*L.h-.15,z);L.m.rotation.set(0,-L.a,(.5-k)*2.4);if(L.m.userData.tail)L.m.userData.tail.rotation.y=Math.sin(L.k*40)*.6;
  if(L.k>=1){const pp=new V3(x,surfY(x,z,T),z);splash(pp,12,4);addRipple(x,z,1.1);if(Math.hypot(x-player.pos.x,z-player.pos.z)<26)AU.splash(.3);}}}
/* rods you earn by playing rather than buying */
function checkEarnedRods(){const got=[];for(const r of RODS){if(!r.req||state.rods.includes(r.id))continue;if(r.req.bounties&&(state.bountiesDone||0)>=r.req.bounties)got.push(r);else if(r.req.dex&&SPECIES.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length>=r.req.dex)got.push(r);else if(r.req.derby&&(state.derbyWins||0)>=r.req.derby)got.push(r);}
 for(const r of got){state.rods.push(r.id);setTimeout(()=>toast(`You earned the ${r.n}! Equip it from your tackle.`,'gold'),600);}if(got.length)save();}

/* ================= FISHING DERBY: three minutes, heaviest fish wins ================= */
const DERBY={on:false,t:0,dur:180,best:0,bestSp:'',rivals:[],isl:'cove'};
function startDerby(){if(DERBY.on)return;const now=Date.now();if(now<(state.derbyCool||0)){toast(`The next derby can start in ${Math.ceil((state.derbyCool-now)/60000)} min.`);return;}
 const z=zoneAt(player.pos.x,player.pos.z),isl=ISL.includes(z)?z:(state.last||'cove'),pool=SPECIES.filter(s=>s.zone===isl&&s.r<=3&&!s.cond),typ=pool.reduce((a,s)=>a+(s.minW+s.maxW)/2,0)/Math.max(1,pool.length);
 const names=['Marlo','Tess','Kai','Wren','Rook','Hazel','Pip','Nalu','Juniper'].sort(()=>Math.random()-.5).slice(0,4);
 DERBY.rivals=names.map((n,i)=>({n,w:0,goal:typ*rand(.7,1.5)*(1+i*.1),next:rand(12,40)}));Object.assign(DERBY,{on:true,t:DERBY.dur,best:0,bestSp:'',isl});state.derbyCool=now+8*60000;save();
 toast(`Derby on ${ZONES[isl].n}! Land the heaviest fish in 3 minutes.`,'gold');AU.level();closePanel();}
function derbyCatch(c){if(!DERBY.on||!c||c.relic)return;if(c.w>DERBY.best){DERBY.best=c.w;DERBY.bestSp=c.sp.name;setTimeout(()=>floatTip('Derby best: '+fmtW(c.w)+' kg'),1200);}}
function renderDerby(){const el=document.getElementById('derbyHud');if(!el)return;if(!DERBY.on){if(!el.hidden)el.hidden=true;return;}
 const all=[{n:'You',w:DERBY.best,me:1},...DERBY.rivals].sort((a,b)=>b.w-a.w),pl=all.findIndex(a=>a.me)+1,s=Math.max(0,Math.ceil(DERBY.t));
 const h=`<b>Derby · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</b>${all.slice(0,4).map((a,i)=>`<div class="${a.me?'me':''}"><span>${i+1}. ${esc(a.n)}</span><span>${a.w>0?fmtW(a.w)+' kg':'—'}</span></div>`).join('')}${pl>4?`<div class="me"><span>${pl}. You</span><span>${DERBY.best>0?fmtW(DERBY.best)+' kg':'—'}</span></div>`:''}`;
 if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h;}if(el.hidden)el.hidden=false;}
function updateDerby(dt){if(!DERBY.on)return;DERBY.t-=dt;for(const r of DERBY.rivals){r.next-=dt;if(r.next<=0){r.next=rand(16,48);const w=r.goal*rand(.35,1.05);if(w>r.w)r.w=Math.round(w*100)/100;}}renderDerby();if(DERBY.t<=0)endDerby();}
function endDerby(){DERBY.on=false;renderDerby();const all=[{n:'You',w:DERBY.best,me:1},...DERBY.rivals].sort((a,b)=>b.w-a.w),place=all.findIndex(a=>a.me)+1,pay=bountyPay();
 const rw=DERBY.best>0?{1:{c:Math.round(pay*120),crate:1},2:{c:Math.round(pay*60)},3:{c:Math.round(pay*30)}}[place]:null;
 if(rw){state.coins+=rw.c;state.earned+=rw.c;if(rw.crate)grantCrate('winning a derby');AU.coin();coinBurst(8);}
 if(place===1&&DERBY.best>0){state.derbyWins=(state.derbyWins||0)+1;if(state.derbyWins>=3&&typeof grantTitle==='function')grantTitle('Derby Champion');checkEarnedRods();}
 save();updateHUD();openPanel('Derby results',ZONES[DERBY.isl].n,()=>{body(`<div class="list">${all.map((a,i)=>`<div class="card ${a.me?'eq':''}"><div class="row"><div class="grow"><h3>${i+1}. ${esc(a.n)}</h3>${a.me&&DERBY.bestSp?`<div class="muted">${esc(DERBY.bestSp)}</div>`:''}</div><b>${a.w>0?fmtW(a.w)+' kg':'—'}</b></div></div>`).join('')}</div>
  <div class="muted">${DERBY.best<=0?'You didn\'t land anything this time.':rw?`You placed ${place}${['st','nd','rd'][place-1]}: +${fmt(rw.c)}c${rw.crate?' and a Mystery Crate':''}.`:'No prize this time.'} Derby wins: ${state.derbyWins||0} (5 earns the Derby Trophy Rod). The next derby can start in 8 minutes.</div>`);bindPanel({});});}

/* ================= CRAB POTS: drop up to three from your boat, come back to haul them ================= */
const POTS={list:[],built:false,FILL:6*60*1000};
function potMesh(){const g=new THREE.Group(),m1=new THREE.MeshStandardMaterial({color:'#f07a2a',roughness:.5}),m2=new THREE.MeshStandardMaterial({color:'#f4f1ea',roughness:.6});
 const b=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.7,14),m1);b.position.y=.2;g.add(b);const band=new THREE.Mesh(new THREE.CylinderGeometry(.34,.36,.14,14),m2);band.position.y=.32;g.add(band);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.4,6),m2);pole.position.y=1.1;g.add(pole);const flag=new THREE.Mesh(new THREE.BoxGeometry(.5,.32,.02),m1);flag.position.set(.26,1.62,0);g.add(flag);g.userData.flag=flag;scene.add(g);return g;}
function potsSync(){for(const p of POTS.list)scene.remove(p.g);POTS.list=state.pots.map(d=>({d,g:potMesh()}));POTS.built=true;}
function potReady(d){return Date.now()-d.t0>=POTS.FILL;}
function dropPot(){if(state.pots.length>=3){toast('You already have three pots out. Haul one first.');return;}const p=boat.pos,fx=Math.sin(boat.yaw),fz=Math.cos(boat.yaw),x=p.x-fz*2.4,z=p.z+fx*2.4;
 if(groundH(x,z)>-1.5){toast('Too shallow here. Drop pots in open water.');return;}const d={x,z,t0:Date.now(),zone:zoneAt(x,z)};state.pots.push(d);POTS.list.push({d,g:potMesh()});AU.splash(.8);splash(new V3(x,0,z),14,4);save();
 toast(`Crab pot dropped. Come back in ${Math.round(POTS.FILL/60000)} minutes to haul it (${state.pots.length}/3 out).`);}
function haulPot(it){const d=it.d;if(!potReady(d)){const left=Math.ceil((POTS.FILL-(Date.now()-d.t0))/1000);toast(`Still filling: ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')} to go.`);return;}
 const zb=Math.max(ZONE_BASE[ISL.includes(d.zone)?d.zone:'sea']||14,bountyPay()*.6),n=2+Math.floor(Math.random()*4),coins=Math.round(zb*n*rand(9,16));state.coins+=coins;state.earned+=coins;let extra='';
 if(Math.random()<.08){state.relics++;extra=' and some Sea Glass';}else if(Math.random()<.04){grantCrate('a lucky crab pot');}
 state.pots.splice(state.pots.indexOf(d),1);scene.remove(it.g);POTS.list.splice(POTS.list.indexOf(it),1);AU.coin();coinBurst(6);splash(it.g.position.clone(),12,4);save();updateHUD();
 toast(`Hauled ${n} crabs and a lobster or two: +${fmt(coins)}c${extra}.`,'gold');}
function potPrompt(){if(!POTS.built)return null;const p=player.mode==='boat'?boat.pos:player.pos;let best=null,bd=5.5;for(const it of POTS.list){const dd=Math.hypot(it.d.x-p.x,it.d.z-p.z);if(dd<bd){bd=dd;best=it;}}
 if(best){const r=potReady(best.d),left=Math.ceil((POTS.FILL-(Date.now()-best.d.t0))/1000);return{label:r?'Haul the crab pot':`Crab pot filling (${Math.floor(left/60)}:${String(left%60).padStart(2,'0')})`,kind:'Haul',act:()=>haulPot(best),d:bd};}
 if(player.mode==='boat'&&!boat.fly&&Math.abs(boat.speed)<2&&state.level>=5&&state.pots.length<3&&F.st==='idle'&&groundH(p.x,p.z)<-1.5&&!(env.cave>.3))return{label:`Drop a crab pot (${state.pots.length}/3 out)`,kind:'Pot',act:dropPot,d:9};return null;}
function updatePots(){if(!POTS.built){if(world.spawn.cove&&Array.isArray(state.pots))potsSync();return;}const T=WIND.uTime.value;
 for(const it of POTS.list){const d=it.d;it.g.position.set(d.x,waveH(d.x,d.z,T)-.05,d.z);it.g.rotation.z=Math.sin(T*1.7+d.x)*.08;it.g.userData.flag.material.color.set(potReady(d)?'#4cbb5a':'#f07a2a');}}
/* ================= per-frame ================= */
let updT=0;
function updateExtra(dt){updateWells(dt);updateLittleEvents(dt);updateCasino();updateRodRacks(dt);nextRodTick(dt);guideTick();updatePages();updateBoards();updateLeaps(dt);updateDerby(dt);updatePots();
 /* show what's new once after each update */
 if(!MENU.on&&!JOIN.on&&state.tips.joined&&state.tips.intro&&state.seenVer!==GAME_VER&&!panelCtx){if(!updT)updT=performance.now();if(performance.now()-updT>2500){state.seenVer=GAME_VER;save();openUpdates();}}if(Net.uid)noteRiders();}
