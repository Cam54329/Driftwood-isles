'use strict';
/* Driftwood Isles — extras: Tide Wells and the Drowned Hollow, little sea events, the Tidewater Casino,
   and riding along in a friend's boat. */

/* ================= TIDE WELLS =================
   On a shared clock (the same on every device), every WELL_CYCLE seconds a whirling Tide Well opens off every island
   for WELL_LEN seconds. Fishing inside one only catches Rare fish or better, and its fish live nowhere else. Their
   value follows the island the well opened by. Sail into the middle and dive to find the Drowned Hollow. */
const WELL_CYCLE=480,WELL_LEN=210,WELL_R=9,WELL_REF=ZONE_BASE.well;
const hashN=(a,b)=>{let h=(a*2654435761^b*40503)>>>0;h=(h^(h>>>15))*2246822519>>>0;return (h^(h>>>13))>>>0;};
function wellSpots(){const out=[];for(const k of ISL){const I=ZONES[k];for(let i=0;i<4;i++){const a=i/4*TAU+I.p1+.4;out.push({x:I.x+Math.cos(a)*I.R*2.02,z:I.z+Math.sin(a)*I.R*2.02,isl:k,i});}}return out;}
let WSPOTS=null;
function activeWells(){if(!WSPOTS)WSPOTS=wellSpots();const now=Date.now()/1000,k=Math.floor(now/WELL_CYCLE),ph=now-k*WELL_CYCLE;let left=WELL_LEN-ph;
 if(DEV.wellUntil&&Date.now()<DEV.wellUntil)left=(DEV.wellUntil-Date.now())/1000;else if(left<=0)return{list:[],next:WELL_CYCLE-ph};
 const list=[];for(const isl of ISL){const opts=WSPOTS.filter(s=>s.isl===isl);list.push(opts[hashN(k,isl.length*31+isl.charCodeAt(0))%opts.length]);}return{list,left};}
function wellAt(x,z){const A=activeWells();for(const w of A.list)if(Math.hypot(x-w.x,z-w.z)<WELL_R)return w;return null;}
const TWV={pool:[],state:false,t:0,near:null};
function wellMat(){return new THREE.ShaderMaterial({uniforms:{uT:WIND.uTime,uA:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'varying vec2 vP;void main(){vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uT;uniform float uA;varying vec2 vP;void main(){float r=length(vP)/${WELL_R.toFixed(1)};if(r>1.)discard;float a=atan(vP.y,vP.x);
  float sw=.5+.5*sin(a*3.+r*14.-uT*3.2);float edge=smoothstep(1.,.82,r)*smoothstep(.0,.25,r);float core=smoothstep(.35,.0,r);
  vec3 c=mix(vec3(.05,.35,.9),vec3(.35,1.,.95),sw*r)+vec3(.6,.9,1.)*core*.8;gl_FragColor=vec4(c*(edge*(.35+.65*sw)+core)*uA,1.);}`});}
function buildWellFx(){for(let i=0;i<3;i++){const g=new THREE.Group();const geo=new THREE.CircleGeometry(WELL_R,48);geo.rotateX(-Math.PI/2);const disc=new THREE.Mesh(geo,wellMat());disc.renderOrder=3;g.add(disc);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(WELL_R,.16,6,56),new THREE.MeshBasicMaterial({color:new THREE.Color(1.2,2.6,3),transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;g.add(ring);
  const bg=new THREE.CylinderGeometry(1.2,2.2,60,20,1,true);bg.translate(0,30,0);const beam=new THREE.Mesh(bg,new THREE.ShaderMaterial({uniforms:{uA:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
   vertexShader:'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uA;varying float vY;void main(){gl_FragColor=vec4(vec3(.3,.9,1.)*pow(1.-vY,2.)*uA*.6,1.);}'}));g.add(beam);
  g.visible=false;g.userData={disc,ring,beam,w:null};g.traverse(o=>{o.userData.noAO=true;o.frustumCulled=false;});scene.add(g);reflHide.push(g);TWV.pool.push(g);}}
function updateWells(dt){if(!TWV.pool.length)buildWellFx();const A=activeWells(),T=WIND.uTime.value,cp=camera.position;
 const near=A.list.map(w=>({w,d:Math.hypot(w.x-cp.x,w.z-cp.z)})).filter(o=>o.d<520).sort((a,b)=>a.d-b.d).slice(0,TWV.pool.length);
 TWV.pool.forEach((g,i)=>{const o=near[i];if(!o||MENU.on){g.visible=false;return;}const w=o.w,fade=Math.min(1,(A.left||0)/8)*Math.min(1,(WELL_LEN-(A.left||0))/4+.2);g.visible=true;
  g.position.set(w.x,waveH(w.x,w.z,T)+.06,w.z);g.userData.disc.material.uniforms.uA.value=fade;g.userData.ring.material.opacity=.8*fade;g.userData.ring.scale.setScalar(1+Math.sin(T*2)*.03);g.userData.beam.material.uniforms.uA.value=fade*(1-(env.cave||0));
  if(o.d<120&&Math.random()<dt*3)splash(new THREE.Vector3(w.x+rand(-3,3),g.position.y,w.z+rand(-3,3)),3,2.5);});
 TWV.near=near[0]?near[0].w:null;
 const on=A.list.length>0;if(on!==TWV.state){TWV.state=on;if(on&&!MENU.on){const nw=near[0];toast(nw&&nw.d<400?`A Tide Well has opened off ${ZONES[nw.w.isl].n}! Fish inside it for rare catches, or dive in.`:'Tide Wells have opened off every island for a few minutes!','gold');AU.enchant();}}}
/* sailing into a well */
function wellPrompt(){if(player.mode!=='boat'||F.st!=='idle')return null;const w=wellAt(boat.pos.x,boat.pos.z);if(!w||Math.hypot(boat.pos.x-w.x,boat.pos.z-w.z)>WELL_R*.6)return null;return{label:'Dive into the Tide Well',kind:'Dive',act:()=>diveWell(w)};}

/* ================= THE DROWNED HOLLOW ================= */
let HOLLOW_RET=null;
function fadeTo(fn){const f=$('#fadeOver');f.classList.add('on');setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),250);},650);}
function diveWell(w){if(F.st!=='idle')cancelFishing();stopEmote();AU.splash(1.2);AU.leap();splash(boat.pos.clone(),26,6);
 fadeTo(()=>{HOLLOW_RET={x:boat.pos.x,z:boat.pos.z,yaw:boat.yaw};const sp=world.spawn.hollow;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.tdist=12;
  if(!state.tips.hollow){state.tips.hollow=1;setTimeout(()=>toast('You found a secret place: the Drowned Hollow. Its fish live nowhere else. The ring of light takes you back up.','gold'),900);}save();});}
/* the Sunless Deep opens once every Drowned Hollow fish is in your Bestiary (the Drowned King needs level 30) */
function hollowProgress(){const all=SPECIES.filter(s=>s.zone==='hollow'||s.zone==='pond_hollow');return{have:all.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length,total:all.length};}
function tryDescend(){const P=hollowProgress();if(P.have<P.total){const king=!(state.dex.drowned_king&&state.dex.drowned_king.n);AU.escape();
  toast(`The seal holds. Catch every Drowned Hollow fish to open it (${P.have}/${P.total}).${king?state.level<30?' The Drowned King only bites for anglers of level 30 or higher.':' The Drowned King rises once every other Hollow fish is caught.':''}`);return;}
 fadeTo(()=>{const sp=world.spawn.abyss;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.tdist=12;
  if(!state.tips.abyss){state.tips.abyss=1;if(typeof grantTitle==='function')grantTitle('Abyss Diver');setTimeout(()=>toast('You reached the Sunless Deep, the last chamber under the sea. Its fish are the most valuable anywhere.','gold'),900);}save();AU.level();});}
function toHollow(){fadeTo(()=>{const sp=world.spawn.hollow;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;});}
function surfaceFromHollow(){fadeTo(()=>{if(HOLLOW_RET){boat.pos.set(HOLLOW_RET.x,0,HOLLOW_RET.z);boat.yaw=HOLLOW_RET.yaw;boat.speed=0;player.mode='boat';cam.tdist=17;}
  else{const k=state.last||'cove',sp=world.spawn[k];player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);placeBoatAt(k);}HOLLOW_RET=null;AU.splash(.9);});}

/* ================= LITTLE SEA EVENTS =================
   Every few minutes something turns up on the water near you: a floating chest, a message in a bottle,
   or a bubbling fish school (bites come fast and luck runs high while you fish inside it). */
const LE={items:[],t:70};
const BOTTLE_NOTES=['"Tide Wells open around every island every few minutes. Dive into one, if you dare."','"The rarest fish rise for the patient. And for the lucky."','"I buried nothing. The sea took it all. — Captain M."',
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
 if(it.type==='chest'){const c=Math.round(b*rand(18,45)/10)*10;state.coins+=c;state.earned+=c;let extra='';const r=Math.random();if(r<.06){state.relics++;extra=' and a Tide Relic';}else if(r<.35){const bt=pick(BAITS.slice(0,6));state.bait[bt.id]=(state.bait[bt.id]||0)+3;extra=' and 3 '+bt.n;}
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
function drawExtraMap(x,toX,toY,S,opt){const A=activeWells();for(const w of A.list){x.strokeStyle='#8af0ff';x.fillStyle='rgba(120,230,255,.35)';x.lineWidth=2;x.beginPath();x.arc(toX(w.x),toY(w.z),Math.max(4,WELL_R*S),0,TAU);x.fill();x.stroke();}
 for(const it of LE.items){x.fillStyle=it.type==='chest'?'#ffd27a':it.type==='bottle'?'#c8ffe8':'#8af0ff';x.beginPath();x.arc(toX(it.x),toY(it.z),3.5,0,TAU);x.fill();}
 if((env.cave||0)>.3){const I=ZONES[player.zone==='abyss'?'abyss':'hollow'];x.fillStyle='#0c1e24';x.fillRect(0,0,9999,9999);x.fillStyle='#2a3a40';islPath(x,I,toX,toY,1);x.fill();for(const p of I.ponds||[]){x.fillStyle='#1f6a74';x.beginPath();x.arc(toX(p.x),toY(p.z),p.r*S,0,TAU);x.fill();}}}

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

/* ================= per-frame ================= */
let updT=0;
function updateExtra(dt){updateWells(dt);updateLittleEvents(dt);updateCasino();
 /* show what's new once after each update */
 if(!MENU.on&&!JOIN.on&&state.tips.joined&&state.tips.intro&&state.seenVer!==GAME_VER&&!panelCtx){if(!updT)updT=performance.now();if(performance.now()-updT>2500){state.seenVer=GAME_VER;save();openUpdates();}}if(Net.uid)noteRiders();}
