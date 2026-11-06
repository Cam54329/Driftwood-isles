'use strict';
/* Driftwood Isles — actors: characters, animation, rods, fish, boats, remote players */
/* low-poly materials: flat-shaded facets, soft roughness, no textures — the faceted look of the isles */
const matCacheA={};
function pbr(c,kind='cloth'){const k=c+'|'+kind;if(matCacheA[k])return matCacheA[k];const C=new THREE.Color(c);let m;
 const R={skin:.62,hair:.7,eye:.18,leather:.55,metal:.32,straw:.9,knit:.95,plastic:.38,cloth:.88}[kind]??.85;
 m=new THREE.MeshStandardMaterial({color:C,roughness:R,metalness:kind==='metal'?1:0,flatShading:true});
 return matCacheA[k]=m;}
const toon=c=>pbr(c,'cloth');
function outline(){}
const BLOBG=new THREE.CircleGeometry(.62,20);const BLOBM=new THREE.MeshBasicMaterial({map:TEX.soft,color:0x000000,transparent:true,opacity:.3,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const CG={sph:new THREE.IcosahedronGeometry(1,1),sphL:new THREE.SphereGeometry(1,7,5),limb:new THREE.CylinderGeometry(1,1,1,7),limbT:new THREE.CylinderGeometry(.82,1,1,7),torso:new THREE.CylinderGeometry(.46,.36,.95,8),
 cap:new THREE.SphereGeometry(1,9,4,0,TAU,0,Math.PI/2),brim:new THREE.CylinderGeometry(1,1,1,12),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,5),boot:new THREE.BoxGeometry(1,1,1)};
const hairCols=['#4a3326','#2e2420','#7a4a2a','#b88a50','#3a2e2a'];
const CHAR_S=.74,HEAD_TOP=2.45;
function makeChar(L){const root=new THREE.Group(),body=new THREE.Group();root.add(body);const vis=new THREE.Group();vis.scale.setScalar(CHAR_S);body.add(vis);
 const mk=(geo,mat,par,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=true;par.add(m);return m;};
 const T=pbr,hairC=L.hair||hairCols[(L.skin||'').charCodeAt(2)%hairCols.length||0],shirt=L.shirt,shirtD='#'+new THREE.Color(L.shirt).multiplyScalar(.72).getHexString(),pants=L.pants||'#3f4a6a',vest=new THREE.Color(L.shirt).lerp(new THREE.Color('#5a4a36'),.7).getStyle();
 const skin=T(L.skin,'skin'),hair=T(hairC,'hair');
 const hips=new THREE.Group();hips.position.y=1.5;vis.add(hips);mk(CG.limbT,T(pants),hips,0,.02,0,.36,.3,.26);
 const spine=new THREE.Group();spine.position.y=.1;hips.add(spine);
 mk(CG.torso,T(shirt),spine,0,.47,0,.98,1.02,.66);mk(CG.sphL,T(shirt),spine,0,.9,0,.46,.13,.28);for(const s of[-1,1])mk(CG.sphL,T(shirt),spine,s*.33,.86,0,.16,.12,.17);
 // fishing vest with pockets
 mk(CG.torso,T(vest,'cloth'),spine,0,.42,-.012,.96,.78,.74);mk(CG.box,T(vest,'cloth'),spine,-.17,.36,.27,.15,.14,.06,0,0,.06);mk(CG.box,T(vest,'cloth'),spine,.17,.36,.27,.15,.14,.06,0,0,-.06);
 mk(CG.box,T('#c8a24a','metal'),spine,-.17,.43,.3,.04,.03,.02);mk(CG.box,T('#c8a24a','metal'),spine,.17,.43,.3,.04,.03,.02);
 mk(CG.limb,T('#4a3426','leather'),spine,0,.02,0,.34,.08,.27);mk(CG.box,T('#c8a24a','metal'),spine,0,.02,.27,.1,.07,.03);
 mk(CG.box,T(shirtD),spine,0,.9,.2,.24,.08,.06,.3);
 const strap=mk(CG.limb,T('#6a4630','leather'),spine,0,.5,.29,.025,1.12,.025,0,0,.72);strap.position.z=.295;
 mk(CG.box,T('#7a5636','leather'),spine,.31,.08,.18,.26,.22,.14,0,-.3,0);mk(CG.box,T('#5e4028','leather'),spine,.31,.18,.2,.27,.06,.15,0,-.3,0);
 const neck=new THREE.Group();neck.position.y=.98;spine.add(neck);mk(CG.limb,skin,neck,0,.07,0,.1,.18,.1);
 const head=new THREE.Group();head.position.y=.13;head.scale.setScalar(.47);neck.add(head);
 mk(CG.sph,skin,head,0,.56,0,.56,.66,.6);mk(CG.box,skin,head,0,.28,.22,.38,.26,.34);           // head + jaw
 mk(CG.cone,skin,head,0,.5,.6,.07,.16,.07,Math.PI/2);                                            // nose
 for(const s of[-1,1])mk(CG.sphL,skin,head,s*.58,.5,0,.08,.12,.06);                              // ears
 const eyes=[];for(const s of[-1,1]){const e=new THREE.Group();e.position.set(s*.2,.58,.52);head.add(e);mk(CG.sphL,T('#1e1814','eye'),e,0,0,0,.05,.06,.03);eyes.push(e);
  mk(CG.box,hair,head,s*.21,.72,.52,.17,.04,.04,0,0,-s*.12);mk(CG.box,T('#e8a090','skin'),head,s*.34,.4,.47,.09,.05,.02);}
 mk(CG.box,T('#7a3a34','skin'),head,0,.31,.555,.14,.025,.02);                                      // mouth
 mk(CG.cap,hair,head,0,.6,-.03,.63,.5,.61);mk(CG.box,hair,head,0,.47,-.32,.92,.5,.3);for(const s of[-1,1])mk(CG.box,hair,head,s*.52,.46,-.06,.14,.34,.34);
 if(L.hatType==='none'){for(let i=-1;i<=1;i++)mk(CG.sphL,hair,head,i*.2,.96,.32,.2,.11,.16,.5,0,i*.2);mk(CG.sphL,hair,head,.05,1.1,.05,.15,.16,.13,0,0,-.4);}
 const hk=L.hatType==='beanie'?'knit':L.hatType==='sunhat'?'straw':'cloth',hc=T(L.hat||'#f2c230',hk),acc=T(shirtD);
 if(L.hatType==='bucket'){mk(CG.brim,hc,head,0,.95,0,.9,.05,.9);mk(CG.limbT,hc,head,0,1.13,0,.58,.38,.58);mk(CG.cap,hc,head,0,1.31,0,.48,.12,.48);}
 else if(L.hatType==='cap'){mk(CG.cap,hc,head,0,.68,0,.67,.52,.66);mk(CG.box,hc,head,0,.84,.56,.62,.04,.42,.12);mk(CG.sphL,T('#f2efe8'),head,0,1.2,0,.06,.04,.06);}
 else if(L.hatType==='beanie'){mk(CG.cap,hc,head,0,.64,0,.68,.64,.67);mk(CG.limb,hc,head,0,.76,0,.69,.18,.68);mk(CG.sphL,T('#f2efe8','knit'),head,0,1.32,0,.16,.16,.16);}
 else if(L.hatType==='sunhat'){mk(CG.brim,hc,head,0,.93,0,1.2,.04,1.2);mk(CG.limbT,hc,head,0,1.09,0,.55,.32,.55);mk(CG.cap,hc,head,0,1.25,0,.47,.1,.47);mk(CG.limb,acc,head,0,.99,0,.56,.08,.56);}
 else if(L.hatType==='top'){mk(CG.brim,hc,head,0,.95,0,.82,.05,.82);mk(CG.limb,hc,head,0,1.42,0,.47,.9,.47);mk(CG.limb,acc,head,0,1.05,0,.48,.12,.48);}
 const arm=s=>{const sh=new THREE.Group();sh.position.set(s*.47,.84,0);spine.add(sh);mk(CG.sphL,T(shirt),sh,0,0,0,.15,.15,.15);mk(CG.limbT,T(shirt),sh,0,-.17,0,.13,.36,.13);mk(CG.limb,T(shirtD),sh,0,-.36,0,.125,.06,.125);mk(CG.limb,skin,sh,0,-.42,0,.09,.1,.09);
  const el=new THREE.Group();el.position.y=-.46;sh.add(el);mk(CG.sphL,skin,el,0,0,0,.095,.095,.095);mk(CG.limbT,skin,el,0,-.19,0,.085,.38,.085);
  const hand=new THREE.Group();hand.position.y=-.4;el.add(hand);mk(CG.box,skin,hand,0,-.02,0,.13,.15,.11);return{sh,el,hand};};
 const leg=s=>{const hp=new THREE.Group();hp.position.set(s*.17,0,0);hips.add(hp);mk(CG.limbT,T(pants),hp,0,-.33,0,.15,.68,.15);
  const kn=new THREE.Group();kn.position.y=-.66;hp.add(kn);mk(CG.sphL,T(pants),kn,0,0,0,.13,.13,.13);mk(CG.limbT,T(pants),kn,0,-.27,0,.12,.46,.12);
  mk(CG.limb,T('#3a2c22','leather'),kn,0,-.56,0,.14,.26,.14);mk(CG.boot,T('#3a2c22','leather'),kn,0,-.73,.07,.19,.12,.33);mk(CG.box,T('#2a201a','leather'),kn,0,-.795,.07,.2,.035,.34);return{hp,kn};};
 const blob=new THREE.Mesh(BLOBG,BLOBM);blob.rotation.x=-Math.PI/2;blob.position.y=.05;blob.renderOrder=1;root.add(blob);
 return{root,body,hips,spine,neck,head,eyes,blob,aL:arm(-1),aR:arm(1),lL:leg(-1),lR:leg(1)};}
function disposeRig(rig){if(!rig)return;rig.root.parent&&rig.root.parent.remove(rig.root);}

class CharAnim{constructor(rig){this.r=rig;this.t=Math.random()*10;this.ph=0;this.blink=rand(1,4);this.blinkT=0;this.lookT=rand(2,5);this.look=0;this.c=null;this.lastStep=0;this.onStep=null;}
 update(dt,p){const r=this.r;this.t+=dt;const t=this.t,T={};const br=Math.sin(t*1.8);
  T.bodyY=0;T.lean=0;T.hipsRY=0;T.spX=.02+br*.012;T.twist=0;T.nY=this.look;T.nX=0;
  T.sLx=.05+Math.sin(t*.9)*.03;T.sLz=-.1;T.eL=-.2;T.sRx=.05+Math.sin(t*.9+1)*.03;T.sRz=.1;T.eR=-.2;T.hL=0;T.kL=0;T.hR=0;T.kR=0;
  this.lookT-=dt;if(this.lookT<=0){this.lookT=rand(2.5,6);this.look=Math.random()<.45?0:rand(-.6,.6);}
  const s=clamp((p.spd||0)/6.5,0,1),f=p.fish||'idle',ft=p.fishT||0;
  if(p.sit){T.hL=T.hR=-1.5;T.kL=T.kR=1.55;T.bodyY=-.36;T.nY=0;if(f==='idle'&&!p.emote){const rw=p.row||0;if(p.oars){this.rowP=(this.rowP||0)+dt*(2.4+rw*3.2);const a=this.rowP;T.sLx=T.sRx=-1.25+Math.sin(a)*.65*Math.max(rw,.12);T.eL=T.eR=-.85-Math.cos(a)*.45*Math.max(rw,.12);T.spX=.06+Math.sin(a)*.2*rw;T.sLz=-.32;T.sRz=.32;}else{T.sLx=T.sRx=-1.15;T.eL=T.eR=-.55;T.sLz=-.12;T.sRz=.12;T.sRx+=(p.steerB||0)*.25;T.sLx-=(p.steerB||0)*.25;T.spX=.05+rw*.06;}}}
  else if(!p.ground){T.hL=-.7;T.kL=1.1;T.hR=.25;T.kR=.5;T.sLz=-.6;T.sRz=.6;T.sLx=-.4;T.sRx=-.4;}
  else if(s>.04){const rn=smooth(8.5,11.5,p.spd);this.ph+=dt*p.spd*lerp(1.4,1.05,rn);const sw=Math.sin(this.ph),cs=Math.sin(this.ph+1.7),A=lerp(.62,1.02,rn)*s,K=lerp(.95,1.7,rn)*s,AR=lerp(.5,1.1,rn)*s;
   T.hL=-sw*A;T.hR=sw*A;T.kL=.08+Math.max(0,cs)*K;T.kR=.08+Math.max(0,-cs)*K;T.sLx=sw*AR;T.sRx=-sw*AR;T.eL=T.eR=lerp(-.25,-1.4,rn)*s-.15;T.sLz=-.1-rn*.12;T.sRz=.1+rn*.12;T.bodyY=Math.abs(Math.cos(this.ph))*lerp(.06,.16,rn)*s;T.lean=lerp(.07,.3,rn)*s;T.hipsRY=sw*lerp(.12,.2,rn)*s;T.twist=-sw*lerp(.1,.24,rn)*s;T.nY=0;T.nX=-T.lean*.45;
   const st=Math.floor(this.ph/Math.PI);if(st!==this.lastStep){this.lastStep=st;if(this.onStep)this.onStep();}}
  if(f==='charging'){T.sRx=-2.55-(p.power||0)*.35;T.sRz=.25;T.eR=-.45;T.twist=-.35;T.spX=-.06;T.sLx=-.75;T.eL=-.5;T.nY=0;}
  else if(f==='casting'){const k=clamp(ft/.28,0,1),e=1-Math.pow(1-k,3);T.sRx=lerp(-2.9,-.55,e);T.eR=-.42;T.twist=lerp(-.35,.22,e)*(1-clamp((ft-.3)/.4,0,1));T.spX=lerp(-.08,.14,e)*(1-clamp((ft-.4)/.4,0,1));T.sLx=-.4;T.nY=0;}
  else if(f==='waiting'||f==='retract'){const tw=p.tw||0;T.sRx=-.5+Math.sin(t*1.3)*.03-tw*.55;T.eR=-.38-tw*.2;T.sLx=-.35;T.eL=-.75;T.sLz=-.05;T.spX=.04;T.nX=.12;}
  else if(f==='bite'){T.sRx=-.85+Math.sin(t*32)*.09;T.eR=-.6;T.spX=.12;T.lean=.06;T.sLx=-.8;T.eL=-1;T.nX=.18;T.nY=0;if(!p.sit){T.hL=-.35;T.kL=.5;T.hR=.1;T.kR=.35;T.bodyY=-.08;}}
  else if(f==='reeling'){const te=p.tens||0,st=p.steer||0,yk=p.yank||0;this.crank=(this.crank||0)+dt*(p.hold?13:0);const ch=p.hold?1:0;
   T.sRx=-.8-te*.6-yk*1.2+Math.sin(t*22)*.035*te;T.sRz=.12+st*.28;T.eR=-.55-te*.25;T.sLx=-1.05+Math.sin(this.crank)*.24*ch;T.eL=-1.25+Math.cos(this.crank)*.3*ch;T.sLz=.3;
   T.spX=-.1-te*.24-yk*.1;T.twist=st*.3;T.hipsRY=-st*.14;T.nX=.06;T.nY=0;if(!p.sit){T.hL=-.32;T.kL=.38+te*.15;T.hR=.2;T.kR=.12+te*.22;T.bodyY=-te*.07;}}
  else if(f==='caught'){const big=p.big&&ft<1.6&&!p.sit;T.sLx=T.sRx=-2.95;T.sLz=-.3;T.sRz=.3;T.eL=T.eR=-.25;T.bodyY+=big?Math.abs(Math.sin(ft*7))*.35:Math.abs(Math.sin(t*5))*.06;if(big){T.kL=T.kR=(1-Math.abs(Math.sin(ft*7)))*.5;T.hL=T.hR=-T.kL*.6;}T.nX=-.15;T.nY=0;}
  const em=p.emote;if(em&&f==='idle'&&!p.sit){const et=p.emT||0;
   if(em==='wave'){T.sRx=-2.6;T.sRz=.45+Math.sin(et*9)*.35;T.eR=-.5+Math.sin(et*9)*.3;T.nX=.08;T.nY=0;}
   else if(em==='dance'){const b=Math.sin(et*7);T.bodyY=Math.abs(b)*.2;T.hipsRY=Math.sin(et*3.5)*.35;T.sLx=-1.6+b*1.1;T.sRx=-1.6-b*1.1;T.sLz=-.7;T.sRz=.7;T.eL=T.eR=-.8;T.hL=-Math.max(0,b)*.5;T.kL=Math.max(0,b)*.8;T.hR=-Math.max(0,-b)*.5;T.kR=Math.max(0,-b)*.8;T.nX=Math.sin(et*7)*.1;T.nY=Math.sin(et*3.5)*.3;}
   else if(em==='cheer'){const j=Math.abs(Math.sin(et*6.5));T.bodyY=j*.4;T.sLx=T.sRx=-2.9;T.sLz=-.55+Math.sin(et*13)*.1;T.sRz=.55-Math.sin(et*13)*.1;T.eL=T.eR=-.2;T.kL=T.kR=(1-j)*.6;T.hL=T.hR=-(1-j)*.35;T.nX=-.15;}
   else if(em==='show'){T.sLx=T.sRx=-2.95;T.sLz=-.3;T.sRz=.3;T.eL=T.eR=-.25;T.bodyY+=Math.abs(Math.sin(et*4))*.05;T.nX=-.15;}}
  T.roll=clamp(-(p.turn||0)*.05,-.28,.28)*Math.max(s,.2);
  if(f==='idle'&&!em&&!p.sit&&s<.04){this.fidT=(this.fidT==null?rand(6,12):this.fidT)-dt;if(this.fidT<=0){this.fid=1.6;this.fidT=rand(9,16);}}
  if(this.fid>0){this.fid-=dt;if(f!=='idle'||s>.04||em)this.fid=0;const k=Math.sin(clamp(1-this.fid/1.6,0,1)*Math.PI);T.sLx=lerp(T.sLx,-2.8,k);T.sRx=lerp(T.sRx,-2.8,k);T.sLz=lerp(T.sLz,-.35,k);T.sRz=lerp(T.sRz,.35,k);T.spX-=.12*k;T.nX=-.22*k;}
  if(s>.04&&p.ground)T.nX+=Math.sin(this.ph*2)*.04;
  if(!this.c)this.c=Object.assign({},T);const k=1-Math.exp(-20*dt),c=this.c;for(const key in T)c[key]=lerp(c[key],T[key],key==='bodyY'&&p.sit?1:k);
  r.body.position.y=c.bodyY;r.body.rotation.x=c.lean;r.hips.rotation.y=c.hipsRY;r.spine.rotation.x=c.spX;r.spine.rotation.y=c.twist;r.neck.rotation.y=c.nY;r.neck.rotation.x=c.nX;
  r.aL.sh.rotation.x=c.sLx;r.aL.sh.rotation.z=c.sLz;r.aL.el.rotation.x=c.eL;r.aR.sh.rotation.x=c.sRx;r.aR.sh.rotation.z=c.sRz;r.aR.el.rotation.x=c.eR;
  r.lL.hp.rotation.x=c.hL;r.lL.kn.rotation.x=c.kL;r.lR.hp.rotation.x=c.hR;r.lR.kn.rotation.x=c.kR;
  const gr=p.ground!==false;if(gr&&this.pg===false)this.sq=1;this.pg=gr;this.sq=Math.max(0,(this.sq||0)-dt*4);let sy=1-this.sq*.16,sx=1+this.sq*.09;if(!gr&&(p.vy||0)>2){sy=1.07;sx=.96;}
  r.body.scale.set(sx,sy,sx);r.body.rotation.z=c.roll;if(r.blob)r.blob.visible=gr&&!p.sit;
  this.blink-=dt;if(this.blink<=0){this.blinkT=.13;this.blink=rand(2.5,6);}if(this.blinkT>0){this.blinkT-=dt;r.eyes.forEach(e=>e.scale.y=.12);}else r.eyes.forEach(e=>e.scale.y=1);}}

/* rods */
function buildRod(def,ench){const g=new THREE.Group();const add=(geo,mat,y)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;g.add(m);return m;};const L=def.len,bendU={value:0},bendL=[];
 const cork=new THREE.MeshStandardMaterial({color:def.handle,roughness:.9,normalMap:detailTex('noise'),normalScale:new THREE.Vector2(.8,.8)}),chrome=pbr('#d8dce0','metal'),dark=new THREE.MeshStandardMaterial({color:'#2a2c30',roughness:.35,metalness:.8});
 add(new THREE.CylinderGeometry(.07,.085,.75,16),cork,.1);add(new THREE.CylinderGeometry(.09,.09,.08,16),dark,.5);
 const reelM=new THREE.MeshStandardMaterial({color:def.reelC,roughness:.3,metalness:.85});
 const reel=add(new THREE.CylinderGeometry(.14,.14,.12,24),reelM,.3);reel.rotation.z=Math.PI/2;reel.position.x=.13;const kn=add(new THREE.CylinderGeometry(.03,.03,.16,10),pbr('#20242a','plastic'),.3);kn.rotation.z=Math.PI/2;kn.position.x=.24;
 /* reel handle: turns while you wind in */
 const crank=new THREE.Group();crank.position.set(.31,.3,0);g.add(crank);{const arm=new THREE.Mesh(new THREE.BoxGeometry(.025,.2,.035),reelM);arm.position.y=.08;crank.add(arm);const nb=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.09,10),pbr('#20242a','plastic'));nb.rotation.z=Math.PI/2;nb.position.set(.05,.17,0);crank.add(nb);}
 /* the blank bends toward the fish under load (a vertex bend; the guides and tip follow it in setRodBend) */
 {const mat=new THREE.MeshPhysicalMaterial({color:def.shaft,roughness:def.metal?.28:.42,metalness:def.metal||0,clearcoat:1,clearcoatRoughness:.12});
  mat.onBeforeCompile=sh=>{sh.uniforms.uBend=bendU;sh.vertexShader='uniform float uBend;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n{float k=clamp((position.y+${(L/2).toFixed(3)})/${L.toFixed(3)},0.,1.);transformed.z+=uBend*k*k*${(L*.42).toFixed(3)};}`);};mat.customProgramCacheKey=()=>'rodbend'+L.toFixed(3);
  const sm=new THREE.Mesh(new THREE.CylinderGeometry(.02,.048,L,12,6),mat);sm.position.y=.5+L/2;sm.castShadow=true;g.add(sm);}
 if(def.wrap)for(let i=0;i<3;i++)add(new THREE.CylinderGeometry(.045,.045,.1,12),pbr(def.wrap,'cloth'),.72+i*.13);
 for(let i=1;i<4;i++){const rr=add(new THREE.TorusGeometry(.045,.008,6,14),chrome,.5+L*i/4);rr.rotation.x=Math.PI/2;bendL.push(rr);}
 const tip=new THREE.Object3D();tip.position.y=.5+L;g.add(tip);bendL.push(tip);
 if(def.glow){const gc=new THREE.MeshBasicMaterial({color:new THREE.Color(def.glow).multiplyScalar(3)});bendL.push(add(new THREE.OctahedronGeometry(.09,0),gc,.5+L));add(new THREE.OctahedronGeometry(.11,0),gc,.62);}
 /* signature details on the newer rods */
 if(def.deco){const gc=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.4)}),y0=.5+L;
  if(def.deco==='petals')for(let i=0;i<5;i++){const m=add(new THREE.OctahedronGeometry(.05,0),pbr('#f8b8d0','plastic'),.62+L*(.15+i*.17));m.position.x=.05*Math.cos(i*2.4);m.position.z=.05*Math.sin(i*2.4);m.scale.set(1,.4,1.6);bendL.push(m);}
  else if(def.deco==='sun'){const s=add(new THREE.TorusGeometry(.11,.02,6,16),gc('#ffb040'),.66);s.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const m=add(new THREE.ConeGeometry(.025,.08,4),gc('#ffd060'),.66);const a=i/8*TAU;m.position.x=Math.cos(a)*.15;m.position.z=Math.sin(a)*.15;m.rotation.set(Math.PI/2,0,-a+Math.PI/2);}}
  else if(def.deco==='crystal'){const m=add(new THREE.OctahedronGeometry(.13,0),gc('#c88aff'),-.38);m.scale.y=2;for(let i=0;i<3;i++){const s=add(new THREE.OctahedronGeometry(.05,0),gc('#e8c8ff'),.5+L*(.3+i*.2));s.position.x=.06;bendL.push(s);}}
  else if(def.deco==='compass'){const d=add(new THREE.CylinderGeometry(.12,.12,.03,20),pbr('#d8b060','metal'),.62);d.rotation.z=Math.PI/2;d.position.x=-.1;const n=add(new THREE.BoxGeometry(.01,.16,.02),gc('#ff5a4a'),.62);n.position.x=-.12;}
  else if(def.deco==='moon'){const m=add(new THREE.TorusGeometry(.09,.025,6,18,Math.PI*1.3),gc('#e8e8ff'),y0+.12);m.rotation.z=.8;bendL.push(m);}
  else if(def.deco==='stars'){for(let i=0;i<4;i++){const s=add(new THREE.OctahedronGeometry(.045,0),gc('#fff0a8'),.5+L*(.2+i*.22));s.position.x=.07*Math.cos(i*1.7);s.position.z=.07*Math.sin(i*1.7);bendL.push(s);}const r2=add(new THREE.TorusGeometry(.15,.008,4,24),gc('#fff0a8'),.66);r2.rotation.x=Math.PI/2.4;}}
 let e3=null;if(ench){e3=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:new THREE.Color(ENCH3D[ench]).multiplyScalar(2.6),transparent:true,opacity:.9}));e3.position.y=.5+L*.6;g.add(e3);bendL.push(e3);}
 g.rotation.x=Math.PI/2;g.scale.setScalar(1.15);g.userData.ench=e3;return{g,tip,crank,bendU,bendL,len:L};}
function setRodBend(rod,b){if(!rod.bendU||Math.abs(rod.bendU.value-b)<1e-4)return;rod.bendU.value=b;const L=rod.len;for(const o of rod.bendL){const k=clamp((o.position.y-.5)/L,0,1);o.position.z=b*k*k*L*.42;}}

/* fish models: faceted low-poly lofts — dark back, pale belly, angular fins */
const animMats=[];
function mutColors(sp,mut){const c1=new THREE.Color(sp.c1),c2=new THREE.Color(sp.c2);
 if(mut==='albino'){c1.set('#f3ece6');c2.set('#ffe2e6');}else if(mut==='golden'){c1.set('#e8b02a');c2.set('#ffe89a');}
 else if(mut==='frozen'){c1.lerp(new THREE.Color('#bfeaff'),.65);c2.lerp(new THREE.Color('#ffffff'),.6);}else if(mut==='shadow'){c1.set('#2a1840');c2.set('#6a44b8');}
 else if(mut==='shiny'){c1.lerp(new THREE.Color('#ffffff'),.22);c2.lerp(new THREE.Color('#ffffff'),.22);}return[c1,c2];}
function fishMat(col,mut){const m=new THREE.MeshStandardMaterial({color:col,vertexColors:true,roughness:.55,metalness:.04,flatShading:true,side:THREE.DoubleSide});
 if(mut==='shiny'){m.metalness=.4;m.roughness=.2;m.emissive=new THREE.Color('#2a2820');}
 if(mut==='glowing'){m.emissive=new THREE.Color(1,1,1);m.emissiveIntensity=.9;m.emissiveMap=null;}
 if(mut==='golden'){m.metalness=.9;m.roughness=.24;m.emissive=new THREE.Color('#2a1a00');}
 if(mut==='shadow'){m.emissive=new THREE.Color('#1a0638');}
 if(mut==='frozen'){m.roughness=.08;m.emissive=new THREE.Color('#0c2030');}
 if(mut==='prismatic'){m.emissive=new THREE.Color('#202020');m.userData.prism=0;animMats.push(m);}
 return m;}
/* geometry accumulator for flat faceted parts with per-face colour */
class FacetBuf{constructor(){this.p=[];this.c=[];}
 tri(a,b,c,col,j=.04){const k=1+(Math.random()-.5)*j*2;this.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);for(let i=0;i<3;i++)this.c.push(col.r*k,col.g*k,col.b*k);}
 poly(pts,col,j){for(let i=1;i<pts.length-1;i++)this.tri(pts[0],pts[i],pts[i+1],col,j);}
 fan(c,pts,col,j){for(let i=0;i<pts.length-1;i++)this.tri(c,pts[i],pts[i+1],col,j);}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.computeVertexNormals();g.computeBoundingSphere();return g;}}
/* body loft: stations [x, halfHeight, halfWidth, yCentre] from tail to nose; ridge on top, keel below */
function loftBody(fb,st,c1,c2,sides=8,opt={}){const R=st.map(([x,h,w,y])=>{const r=[];for(let k=0;k<sides;k++){const a=k/sides*TAU,ca=Math.cos(a),sa=Math.sin(a);r.push([x,y+h*Math.sign(sa)*Math.pow(Math.abs(sa),.9),w*ca*(1-(opt.flatTop||0)*Math.max(0,sa))]);}return r;});
 const col=new THREE.Color(),mid=c1.clone().lerp(c2,.45),band=opt.band?new THREE.Color(opt.band):null;
 const faceCol=(s,t)=>{const f=(s+1)/2;col.copy(c2).lerp(mid,smooth(.25,.55,f)).lerp(c1,smooth(.55,.85,f));if(band&&Math.abs(s)<.25)col.lerp(band,.55);if(opt.spots&&f>.5&&Math.sin(t*41.3+s*13.1)>.86)col.multiplyScalar(.78);return col;};
 for(let i=0;i<R.length-1;i++)for(let k=0;k<sides;k++){const k1=(k+1)%sides,a=R[i][k],b=R[i][k1],c=R[i+1][k1],d=R[i+1][k];const sm=Math.sin((k+.5)/sides*TAU);fb.tri(a,b,c,faceCol(sm,i));fb.tri(a,c,d,faceCol(sm,i+.5));}
 const nose=opt.nose||[st[st.length-1][0]+.08,st[st.length-1][3]-.02,0],last=R[R.length-1];for(let k=0;k<sides;k++){const sm=Math.sin((k+.5)/sides*TAU);fb.tri(last[k],last[(k+1)%sides],nose,faceCol(sm,99).clone().multiplyScalar(.95));}
 const first=R[0],tc=[st[0][0],st[0][3],0];for(let k=0;k<sides;k++)fb.tri(first[(k+1)%sides],first[k],tc,c1);return R;}
function hashStr(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))%9973;return h/9973;}
const FST=[0,.08,.2,.34,.48,.6,.72,.82,.91,1];
const FPROF={fish:{L:2.3,H:.6,W:.34,h:[.14,.2,.42,.68,.88,.96,.92,.76,.52,.2],w:[.08,.12,.26,.38,.46,.48,.44,.36,.24,.08],tail:'fork',dors:[.4,.66,.55]},
 tall:{L:2.05,H:.92,W:.3,h:[.14,.22,.5,.8,.96,1,.95,.78,.52,.18],w:[.08,.12,.26,.38,.46,.48,.44,.36,.24,.08],tail:'round',dors:[.22,.7,.36]},
 long:{L:3.3,H:.42,W:.3,h:[.18,.26,.44,.66,.82,.9,.9,.8,.6,.24],w:[.1,.14,.28,.4,.48,.5,.48,.4,.28,.1],tail:'fork',dors:[.2,.36,.6]},
 shark:{L:3.4,H:.62,W:.48,h:[.12,.2,.4,.66,.86,.96,.94,.8,.58,.24],w:[.1,.16,.32,.48,.58,.6,.58,.5,.36,.12],tail:'shark',dors:[.5,.62,1.25]}};
function finTri(fb,pts,col){fb.poly(pts,col,.03);}
function buildFish(sp,mut){const g=new THREE.Group();const[c1,c2]=mutColors(sp,mut);const mat=fishMat(new THREE.Color(1,1,1),mut);if(mut==='glowing')mat.emissive.copy(c1).multiplyScalar(.8);
 const hv=hashStr(sp.id),hv2=hashStr(sp.id+'x'),sh=sp.shape,fb=new FacetBuf(),tb=new FacetBuf();const finC=c1.clone().lerp(c2,.2).multiplyScalar(.82),finD=c1.clone().multiplyScalar(.7);
 const tailG=new THREE.Group();g.add(tailG);g.userData.tail=tailG;let eyeAt=null;
 if(FPROF[sh]){const P=FPROF[sh],L=P.L*(.92+hv*.16),H=P.H*(.88+hv2*.26),W=P.W*(.9+hv*.2),x0=-L/2;
  const st=FST.map((t,i)=>[x0+t*L,P.h[i]*H,P.w[i]*W,-Math.sin(t*Math.PI)*H*.06+(t>.85?-(t-.85)*H*.3:0)]);
  loftBody(fb,st,c1,c2,8,{band:hv>.6?c1.clone().lerp(new THREE.Color('#e86a5a'),.5):null,spots:hv2>.55});
  const at=t=>{const f=t*(FST.length-1),i=Math.min(FST.length-2,Math.floor(f)),u=f-i;const a=st[i],b=st[i+1];return[lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u),lerp(a[3],b[3],u)];};
  // dorsal fin(s)
  const[da,db,dh]=P.dors,A=at(FST[0]+da*.9+.05),B=at(da*.9+.05+(db-da)),dH=H*dh*(sp.feat==='sail'?2.6:1)*(.85+hv2*.3);
  finTri(fb,[[A[0],A[3]+A[1]*.95,0],[lerp(A[0],B[0],.25)-L*.06,A[3]+A[1]+dH,0],[B[0],B[3]+B[1]*.95,0]],finD);
  if(sh!=='tall'){const C=at(.2),D=at(.28);finTri(fb,[[C[0],C[3]+C[1]*.9,0],[C[0]-L*.03,C[3]+C[1]+H*.14,0],[D[0],D[3]+D[1]*.9,0]],finD);}
  // anal + pelvic + pectoral fins
  {const C=at(.18),D=at(sh==='tall'?.6:.34);finTri(fb,[[D[0],D[3]-D[1]*.92,0],[C[0]-L*.02,C[3]-C[1]-H*(sh==='tall'?.5:.24),0],[C[0],C[3]-C[1]*.9,0]],finC);}
  {const E=at(.5);for(const s of[-1,1])finTri(fb,[[E[0]+L*.04,E[3]-E[1]*.85,s*E[2]*.4],[E[0]-L*.1,E[3]-E[1]-H*.2,s*E[2]*.9],[E[0]-L*.02,E[3]-E[1]*.8,s*E[2]*.5]],finC);}
  {const E=at(.74);const pl=sh==='shark'?1.9:1;for(const s of[-1,1])finTri(fb,[[E[0],E[3]-E[1]*.2,s*E[2]*.98],[E[0]-L*.16*pl,E[3]-E[1]*.6*pl,s*(E[2]+W*.55*pl)],[E[0]-L*.04,E[3]-E[1]*.5,s*E[2]*.9]],finC);}
  // gill line + eye
  {const E=at(.8);for(const s of[-1,1]){const a=[E[0],E[3]+E[1]*.6,s*E[2]*1.01],b=[E[0]-.03,E[3]-E[1]*.6,s*E[2]*1.01],c=[E[0]+.04,E[3],s*E[2]*1.04];fb.tri(a,s>0?b:c,s>0?c:b,c1.clone().multiplyScalar(.6),0);}}
  const Ey=at(.9);eyeAt=[Ey[0],Ey[3]+Ey[1]*.25,Ey[2]*.86,H*.075];
  // tail
  const T0=st[0];tailG.position.x=T0[0];const tl=H*(sh==='shark'?1.3:1.05)*(.9+hv*.25),tw=L*.26;
  if(P.tail==='fork'||(P.tail!=='round'&&P.tail!=='shark'&&hv>.4)){const pts=[[.04,T0[1]*.8,0],[-tw,tl*.95,0],[-tw*.62,tl*.14,0],[-tw*.5,0,0],[-tw*.62,-tl*.14,0],[-tw,-tl*.9,0],[.04,-T0[1]*.8,0]];tb.fan([.02,0,0],pts,finD,.03);}
  else if(P.tail==='shark'){const pts=[[.04,T0[1],0],[-tw*1.1,tl*1.1,0],[-tw*.55,tl*.08,0],[-tw*.5,-tl*.42,0],[.04,-T0[1],0]];tb.fan([.02,0,0],pts,finD,.03);}
  else{const pts=[[.04,T0[1]*.8,0],[-tw*.7,tl*.7,0],[-tw*.92,tl*.25,0],[-tw*.95,-tl*.25,0],[-tw*.7,-tl*.68,0],[.04,-T0[1]*.8,0]];tb.fan([.02,0,0],pts,finD,.03);}
  if(sh==='long'){const N=st[st.length-1];finTri(fb,[[N[0],N[3]+H*.05,-.03],[N[0]+L*.22,N[3]-H*.02,0],[N[0],N[3]-H*.05,.03]],c1);finTri(fb,[[N[0],N[3]+H*.05,.03],[N[0]+L*.22,N[3]-H*.02,0],[N[0],N[3]-H*.05,-.03]],c1);}
  if(sh==='shark'){/* gill slits */const E=at(.72);for(const s of[-1,1])for(let i=0;i<3;i++){const x=E[0]+i*.07;fb.tri([x,E[3]+E[1]*.3,s*E[2]*1.02],[x+.02,E[3]-E[1]*.35,s*E[2]*1.02],[x+.035,E[3]+E[1]*.3,s*E[2]*1.02],c1.clone().multiplyScalar(.5),0);}}}
 else if(sh==='eel'){const L=4.2,H=.32,W=.24,N=16,st=[];for(let i=0;i<N;i++){const t=i/(N-1);st.push([-L/2+t*L,H*(.25+.75*Math.sin(Math.min(1,t*1.6+.1)*Math.PI*.5))*(t>.9?1-(t-.9)*4:1),W*(.3+.7*Math.sin(Math.min(1,t*1.4+.1)*Math.PI*.5)),Math.sin(t*6)*.08]);}
  loftBody(fb,st,c1,c2,7);for(let i=2;i<N-3;i++){const a=st[i],b=st[i+1];fb.poly([[a[0],a[3]+a[1]*.95,0],[a[0],a[3]+a[1]+.16,0],[b[0],b[3]+b[1]+.16,0],[b[0],b[3]+b[1]*.95,0]],finD,.02);if(i<N-6)fb.poly([[a[0],a[3]-a[1]*.95,0],[a[0],a[3]-a[1]-.12,0],[b[0],b[3]-b[1]-.12,0],[b[0],b[3]-b[1]*.95,0]],finC,.02);}
  const e=st[N-2];eyeAt=[e[0],e[3]+e[1]*.35,e[2]*.8,.05];tailG.position.x=st[0][0];tb.poly([[0,.12,0],[-.4,0,0],[0,-.12,0]],finD);}
 else if(sh==='flat'){const L=2.3,st=FST.map((t,i)=>[-L/2+t*L,.2*[.3,.3,.5,.75,.9,1,.95,.8,.55,.2][i],[.12,.2,.48,.74,.88,.92,.86,.7,.46,.12][i],0]);loftBody(fb,st,c1,c2,8,{spots:true});
  for(let i=1;i<8;i++){const a=st[i],b=st[i+1];for(const s of[-1,1])fb.poly([[a[0],0,s*a[2]],[a[0],0,s*(a[2]+.14)],[b[0],0,s*(b[2]+.14)],[b[0],0,s*b[2]]],finD,.02);}
  eyeAt=[st[8][0],.15,st[8][2]*.35,.06];tailG.position.x=st[0][0];tb.fan([.02,0,0],[[0,0,.2],[-.6,0,.42],[-.66,0,0],[-.6,0,-.42],[0,0,-.2]],finD,.03);}
 else if(sh==='ray'){const top=[0,.26,0],bot=[0,-.12,0],N=[1.2,0,0],R=[-.1,0,1.5],Lw=[-.1,0,-1.5],Tb=[-.95,0,0],m1=[.45,.06,.75],m2=[.45,.06,-.75],m3=[-.55,.04,.7],m4=[-.55,.04,-.7];
  const ring=[N,m1,R,m3,Tb,m4,Lw,m2,N];for(let i=0;i<8;i++){fb.tri(top,ring[i+1],ring[i],c1);fb.tri(bot,ring[i],ring[i+1],c2);}
  eyeAt=[.55,.16,.22,.06];tailG.position.x=-.95;for(let i=0;i<4;i++){const x0=-i*.42,x1=-(i+1)*.42,w=.05*(1-i*.2);tb.poly([[x0,.02,w],[x1,.01,w*.6],[x1,.01,-w*.6],[x0,.02,-w]],finD,.02);tb.poly([[x0,.02,-w],[x1,.01,-w*.6],[x1,.01,w*.6],[x0,.02,w]],finD,.02);}}
 else if(sh==='squid'){const st=[[-.6,.02,.02,0],[-.4,.28,.28,0],[0,.42,.42,0],[.5,.46,.46,0],[.95,.4,.4,0],[1.15,.3,.3,0]];loftBody(fb,st,c1,c2,7,{nose:[1.22,0,0]});
  for(const s of[-1,1])fb.poly([[-.55,0,0],[-.1,0,s*.75],[.15,0,s*.35],[-.2,0,0]],finD,.02);
  for(let i=0;i<8;i++){const a=i/8*TAU,y=Math.cos(a)*.22,z=Math.sin(a)*.22,len=1.2+(i%3)*.25;tb.poly([[0,y+.04,z],[-len,y*1.6,z*1.6],[0,y-.04,z]],c2.clone().lerp(c1,.3),.03);tb.poly([[0,y,z+.04],[-len,y*1.6,z*1.6],[0,y,z-.04]],c2.clone().lerp(c1,.3),.03);}
  tailG.position.x=-.62;tailG.rotation.y=Math.PI;eyeAt=[-.4,.12,.3,.12];g.rotation.y=0;}
 const bm=new THREE.Mesh(fb.geo(),mat);bm.castShadow=true;g.add(bm);const tm=new THREE.Mesh(tb.geo(),mat);tm.castShadow=true;tailG.add(tm);
 if(eyeAt){const eg=new THREE.IcosahedronGeometry(1,0),em=new THREE.MeshStandardMaterial({color:mut==='albino'?'#b8203a':'#0c0e12',roughness:.2,flatShading:true});for(const s of[-1,1]){const e=new THREE.Mesh(eg,em);e.position.set(eyeAt[0],eyeAt[1],s*eyeAt[2]);e.scale.setScalar(eyeAt[3]);g.add(e);}}
 const fl=new THREE.MeshStandardMaterial({color:c1.clone().multiplyScalar(.75),roughness:.5,flatShading:true});
 if(sp.feat==='whisk')for(const s of[1,-1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,.9,4),fl);w.position.set(1.1,-.12,s*.22);w.rotation.set(s*.5,0,1.9);g.add(w);}
 if(sp.feat==='lure'){const st2=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.85,4),fl);st2.position.set(.85,.95,0);st2.rotation.z=-.6;g.add(st2);const lb=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,3.6,2.8)}));lb.position.set(1.2,1.3,0);g.add(lb);}
 if(sp.feat==='tusk'){const t=new THREE.Mesh(new THREE.ConeGeometry(.07,1.6,5),new THREE.MeshStandardMaterial({color:'#f2ecd8',roughness:.4,flatShading:true}));t.rotation.z=-Math.PI/2;t.position.set(2.1,.02,0);g.add(t);}
 if(mut==='frozen'){const shell=new THREE.Mesh(bm.geometry,new THREE.MeshStandardMaterial({color:'#e6fbff',transparent:true,opacity:.3,roughness:.05,flatShading:true,depthWrite:false}));shell.scale.setScalar(1.12);g.add(shell);}
 if(mut==='glowing'||mut==='prismatic'||mut==='golden'){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft,color:mut==='glowing'?c1:mut==='golden'?0xffd060:0xffffff,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));h.scale.set(4.5,3,1);g.add(h);}
 return g;}
function buildRelic(){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.OctahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:'#7af0ff',emissive:'#2a9ac8',emissiveIntensity:1.3,flatShading:true,roughness:.2}));m.scale.y=1.4;g.add(m);
 const r=new THREE.Mesh(new THREE.TorusGeometry(1,.06,6,24),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1.2,2)}));r.rotation.x=Math.PI/2;g.add(r);return g;}
function fishScale(sp,w){return clamp(.42+.27*Math.log10(1+w)+sp.r*.03,.42,1.75);}
function disposeHeld(o){if(!o)return;o.traverse(x=>{if(x.material){const i=animMats.indexOf(x.material);if(i>=0)animMats.splice(i,1);}});o.parent&&o.parent.remove(o);}

/* bobber + line */
/* floats and lures: the tackle on the end of the line follows the bait you have equipped */
const TACKLE={none:'classic',worm:'classic',shrimp:'quill',glowfly:'glow',spinner:'spinner',prism:'spoon',popper:'popper',ink:'jig',feather:'fly'};
const tMat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.38,metalness:0},o));
function lathe(pts,mat,seg=20){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg),mat);}
function hookMesh(s=1,col='#c8ccd2'){const g=new THREE.Group(),m=tMat(col,{metalness:.9,roughness:.25});const sh=new THREE.Mesh(new THREE.CylinderGeometry(.006*s,.006*s,.09*s,5),m);sh.position.y=-.045*s;g.add(sh);
 const bend=new THREE.Mesh(new THREE.TorusGeometry(.028*s,.006*s,4,10,Math.PI*1.35),m);bend.position.set(.028*s,-.09*s,0);bend.rotation.z=Math.PI*1.05;g.add(bend);return g;}
function treble(s=1){const g=new THREE.Group();for(let i=0;i<3;i++){const h=hookMesh(s);h.rotation.y=i/3*TAU;g.add(h);}return g;}
function fillTackle(b,style){while(b.children.length){const c=b.children.pop();c.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
 const u=b.userData;u.style=style;u.blade=null;u.flat=false;u.top=.3;const add=(m,x=0,y=0,z=0)=>{m.position.set(x,y,z);m.castShadow=true;b.add(m);return m;};
 if(style==='classic'||style==='glow'){const top=style==='glow'?'#2a3a8a':'#e23a2a',tip=style==='glow'?new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,3.2,1.2)}):tMat('#ffd23a');
  add(lathe([[0,0],[.155,0],[.15,.045],[.125,.105],[.08,.15],[.03,.17],[0,.172]],tMat(top,{roughness:.32})));
  add(lathe([[0,-.172],[.03,-.17],[.08,-.15],[.125,-.105],[.15,-.045],[.155,0],[0,0]],tMat('#f4f1ea',{roughness:.4})));
  const band=add(new THREE.Mesh(new THREE.TorusGeometry(.156,.012,6,24),tMat('#1e2024')));band.rotation.x=Math.PI/2;
  add(new THREE.Mesh(new THREE.CylinderGeometry(.016,.02,.14,8),tMat(top)),0,.23,0);add(new THREE.Mesh(new THREE.SphereGeometry(style==='glow'?.04:.028,10,8),tip),0,.31,0);
  const eye=add(new THREE.Mesh(new THREE.TorusGeometry(.018,.005,4,8),tMat('#c8ccd2',{metalness:.9})),0,-.19,0);eye.rotation.y=Math.PI/2;u.top=.33;}
 else if(style==='quill'){add(lathe([[0,-.42],[.018,-.37],[.04,-.22],[.055,-.08],[.056,.02],[0,.02]],tMat('#efe6d2',{roughness:.5})));
  add(lathe([[0,.02],[.056,.02],[.048,.1],[.034,.2],[.02,.28],[0,.31]],tMat('#ff6a1a',{roughness:.3})));
  const ring=add(new THREE.Mesh(new THREE.TorusGeometry(.05,.008,5,16),tMat('#1e2024')),0,.06,0);ring.rotation.x=Math.PI/2;u.top=.31;}
 else if(style==='spoon'){const sp=new THREE.Mesh(new THREE.SphereGeometry(.1,18,10),tMat('#e0e6ff',{metalness:1,roughness:.12}));sp.scale.set(.75,.18,1.7);add(sp,0,.01,0);sp.material.userData.prism=Math.random();animMats.push(sp.material);
  const sr=add(new THREE.Mesh(new THREE.TorusGeometry(.025,.005,4,10),tMat('#c8ccd2',{metalness:.9})),0,.02,-.19);sr.rotation.y=Math.PI/2;const tr=treble(1.1);tr.rotation.x=-Math.PI/2;add(tr,0,.01,.2);u.flat=true;u.top=.04;}
 else if(style==='spinner'){const body=add(new THREE.Mesh(new THREE.CylinderGeometry(.022,.03,.16,10),tMat('#c89a3a',{metalness:.9,roughness:.25})),0,0,0);body.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++)add(new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),tMat(i===1?'#e23a2a':'#d8b048',{metalness:.8,roughness:.3})),0,0,-.1-i*.04);
  const bl=new THREE.Group();const blade=new THREE.Mesh(new THREE.SphereGeometry(.055,14,8),tMat('#e8d8a0',{metalness:1,roughness:.18}));blade.scale.set(1,.12,1.6);blade.position.x=.06;bl.add(blade);add(bl,0,0,-.17);bl.rotation.x=Math.PI/2;u.blade=bl;
  const tr=treble(1);tr.rotation.x=-Math.PI/2;add(tr,0,0,.1);for(let i=0;i<5;i++){const f=add(new THREE.Mesh(new THREE.ConeGeometry(.015,.09,4),tMat('#e23a2a',{roughness:.8})),0,0,.13);f.rotation.set(Math.PI/2+(Math.random()-.5)*.6,0,(Math.random()-.5)*.6);}u.flat=true;u.top=.03;}
 else if(style==='popper'){const bd=add(lathe([[0,-.17],[.05,-.15],[.065,-.05],[.06,.08],[.045,.15],[.06,.17],[0,.155]],tMat('#4aa83a',{roughness:.3})),0,.02,0);bd.rotation.x=Math.PI/2;
  const belly=add(new THREE.Mesh(new THREE.SphereGeometry(.062,12,8),tMat('#f2d84a')),0,-.01,0);belly.scale.set(.9,.6,2.4);
  for(const s of[-1,1]){add(new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),tMat('#f8f4e8')),s*.052,.045,.12);add(new THREE.Mesh(new THREE.SphereGeometry(.011,8,6),tMat('#14161a')),s*.064,.048,.128);}
  const t1=treble(1);t1.rotation.x=-Math.PI/2;add(t1,0,-.05,.02);const t2=treble(1);t2.rotation.x=-Math.PI/2;add(t2,0,0,-.19);u.flat=true;u.top=.08;}
 else if(style==='jig'){add(lathe([[0,-.02],[.05,0],[.06,.08],[.045,.18],[0,.26]],tMat('#3a1e4e',{roughness:.3,emissive:'#2a0a3a'})));
  for(let i=0;i<10;i++){const a=i/10*TAU,t=add(new THREE.Mesh(new THREE.CylinderGeometry(.008,.014,.2,4),tMat(i%2?'#6a2a8a':'#2a1238',{roughness:.6})),Math.cos(a)*.035,-.1,Math.sin(a)*.035);t.rotation.set(Math.sin(a)*.3,0,-Math.cos(a)*.3);}
  for(const s of[-1,1])add(new THREE.Mesh(new THREE.SphereGeometry(.016,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,2,.6)})),s*.05,.1,.02);u.top=.27;}
 else if(style==='fly'){const h=hookMesh(1.4,'#2a2a2a');h.rotation.x=Math.PI/2;add(h,0,0,0);const cols=['#e8742a','#c84a1a','#f0b050','#8a5a2a'];
  for(let i=0;i<9;i++){const f=add(new THREE.Mesh(new THREE.ConeGeometry(.02,.16,4),tMat(cols[i%4],{roughness:.9})),0,.03,-.02);f.rotation.set(-Math.PI/2+(Math.random()-.3)*.9,0,(Math.random()-.5)*1.2);}
  add(new THREE.Mesh(new THREE.SphereGeometry(.026,8,6),tMat('#14161a')),0,.02,-.07);u.flat=true;u.top=.04;}
 if(u.flat){for(const c of b.children)c.position.y+=.05;u.top+=.05;}
 const sc=u.flat?1.9:1.45;b.scale.setScalar(sc);u.top*=sc;}
function makeBobber(style='classic'){const b=new THREE.Group();fillTackle(b,style);b.visible=false;scene.add(b);return b;}
function setTackle(b,style){if(b.userData.style!==style)fillTackle(b,style);}
function makeLine(){const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(24*3),3));const l=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xe8ecf0,transparent:true,opacity:.7}));l.frustumCulled=false;l.visible=false;scene.add(l);return l;}
function drawLine(line,a,b,sag,top=.3){const arr=line.geometry.attributes.position.array;const d=a.distanceTo(b);for(let i=0;i<24;i++){const k=i/23;arr[i*3]=lerp(a.x,b.x,k);arr[i*3+1]=lerp(a.y,b.y+top,k)-Math.sin(k*Math.PI)*sag*Math.min(d/8,1.5);arr[i*3+2]=lerp(a.z,b.z,k);}line.geometry.attributes.position.needsUpdate=true;}

/* boats */
function makeBoat(accent,type){const BT=BOATM[type]||BOATS[0],M=BT.m,b=new Builder(),N=16,st=[];b.M(TL.paint);const L=M.L,W=M.W,H=M.H,D=M.D,z0=-L*.45;
 const white=new THREE.Color(M.hull),acc=new THREE.Color(M.stripe||accent||'#8a4a3a'),bot=new THREE.Color(M.bottom||'#4a3a32'),wood=new THREE.Color('#6e5a46');
 for(let i=0;i<=N;i++){const t=i/N,z=z0+t*L;const bowK=clamp((t-.55)/.45,0,1);const w=W*Math.sqrt(Math.max(0,1-bowK*bowK))*(t<.1?.88+t*1.2:1);const top=H+bowK*bowK*H*.5,bt=D-bowK*bowK*D*1.4;st.push({z,w,top,bt,chY:lerp(bt,top,.45)});}
 const T=M.type,V=THREE.Vector3,hulls=T==='catamaran'?[[-W*1.25,.5],[W*1.25,.5]]:T==='pontoon'?[[-W*1.05,.34],[W*1.05,.34]]:T==='seaplane'?[[-W*1.8,.45],[W*1.8,.45]]:[[0,1]];
 for(const[ox,wk]of hulls){b.M(TL.paint);
  const P=(s,k,i)=>{const S=st[i];if(k===0)return new V(ox+s*S.w*wk,S.top,S.z);if(k===1)return new V(ox+s*S.w*.9*wk,S.chY,S.z);return new V(ox,S.bt,S.z);};
  for(let i=0;i<N;i++)for(const s of[-1,1])for(let k=0;k<2;k++){const a=P(s,k,i),bb=P(s,k+1,i),c=P(s,k,i+1),d=P(s,k+1,i+1);const col=k===0?white:bot;if(s>0){b.tri(a,c,bb,col);b.tri(bb,c,d,col);}else{b.tri(a,bb,c,col);b.tri(bb,d,c,col);}}
  for(let i=0;i<N;i++)for(const s of[-1,1]){const a=P(s,0,i),c=P(s,0,i+1);a.y-=.12;c.y-=.12;const a2=a.clone(),c2=c.clone();a2.y-=.14;c2.y-=.14;const d1=s>0?[a,a2,c]:[a,c,a2],d2=s>0?[a2,c2,c]:[a2,c,c2];b.tri(...d1,acc);b.tri(...d2,acc);}
  const s0=st[0];const tl=new V(ox-s0.w*wk,s0.top,s0.z),tr=new V(ox+s0.w*wk,s0.top,s0.z),cl=new V(ox-s0.w*.9*wk,s0.chY,s0.z),cr=new V(ox+s0.w*.9*wk,s0.chY,s0.z),kb=new V(ox,s0.bt,s0.z);
  b.tri(tl,tr,cl,white);b.tri(cl,tr,cr,white);b.tri(cl,cr,kb,bot);
  b.M(TL.wood);for(let i=0;i<N;i++)for(const s of[-1,1]){const a=P(s,0,i),c=P(s,0,i+1);b.seg(G.cyl,wood,a,c,.07);}}
 const fl=T==='catamaran'||T==='pontoon'?H-.05:T==='seaplane'?H+.85:lerp(D,H,.3);b.M(TL.wood);if(T!=='seaplane')b.add(G.box,T==='pontoon'?'#c8b896':'#7d6850',0,fl,z0+L*(T==='pontoon'?.5:.42),T==='catamaran'?W*3.4:T==='pontoon'?W*2.9:W*1.55,.08,L*(T==='pontoon'?.92:.72));
 const seatZ=z0+L*(T==='jetski'?.38:T==='seaplane'?.58:T==='duck'?.4:.2),seatTop=fl+.42;if(T!=='jetski'&&T!=='pontoon'&&T!=='seaplane')b.add(G.box,'#8a7358',0,seatTop-.06,seatZ,W*1.5,.12,.7);
 const motor=x=>{const pm=b.mt;b.M(TL.metal);b.add(G.box,'#2e3338',x,H+.15,z0-.25,.6,.85,.6);b.add(G.box,'#41474e',x,H+.62,z0-.25,.66,.16,.66);b.add(G.cyl,'#2e3338',x,D+.45,z0-.45,.08,1.1,.08);b.M(pm);};
 if(T==='row'||T==='skiff'){b.add(G.box,'#8a7358',0,seatTop-.06,z0+L*.62,W*1.25,.12,.5);motor(0);if(T==='skiff')for(const s of[-1,1])b.seg(G.cyl,'#a89070',new V(s*W*.7,H+.1,z0+L*.35),new V(s*W*1.6,D+.2,z0+L*.1),.035);}
 if(T==='sail'){b.M(TL.wood);const mz=z0+L*.6,bz=z0+L*.12;b.add(G.cyl,'#6e5a44',0,H+3.6,mz,.09,7.2,.09);b.seg(G.cyl,'#6e5a44',new V(0,H+.95,mz),new V(0,H+.95,bz),.06);
  b.M(TL.cloth);const sc=new THREE.Color('#e4ded0'),p1=new V(0,H+1.05,mz-.1),p2=new V(0,H+7,mz),p3=new V(.02,H+1.05,bz+.2);b.tri(p1,p2,p3,sc);b.tri(p1,p3,p2,sc);
  const jc=new THREE.Color('#d6cfbf'),j1=new V(0,H+6.4,mz+.1),j2=new V(0,H+1,mz+.3),j3=new V(0,st[N].top+.1,z0+L-.15);b.tri(j1,j2,j3,jc);b.tri(j1,j3,j2,jc);b.seg(G.cyl,'#5a4a3a',new V(0,H+7,mz),j3,.02);}
 if(T==='cabin'||T==='runner'){b.M(TL.paint);const rn=T==='runner',cz=z0+L*(rn?.5:.55),cw=W*1.25,ch=rn?1.1:1.5,cln=L*(rn?.26:.28);b.add(G.box,rn?'#3a4650':'#d6d3cc',0,fl+ch/2+.05,cz,cw,ch,cln);b.add(G.box,rn?'#252d34':'#6e5e4c',0,fl+ch+.12,cz-.1,cw+.2,.12,cln+.5);
  b.M(TL.metal);for(const s of[-1,1])b.add(G.box,'#1a2228',s*(cw/2+.01),fl+ch*.62,cz,.04,ch*.35,cln*.75);b.add(G.box,'#1a2228',0,fl+ch*.62,cz+cln/2+.01,cw*.8,ch*.35,.04);b.M(TL.paint);motor(rn?-.45:0);if(rn){motor(.45);b.add(G.cyl,'#9aa0a6',0,fl+ch+.9,cz-.3,.03,1.6,.03);}}
 if(T==='outrigger'){b.add(G.box,'#8a7358',0,seatTop-.06,z0+L*.62,W*1.25,.12,.5);b.M(TL.wood);const fx=W*2.9;b.add(G.cyl,'#9a7a52',fx,D*.2+.12,z0+L*.5,.2,L*.6,.2,Math.PI/2);b.add(G.cone,'#9a7a52',fx,D*.2+.12,z0+L*.82,.2,.5,.2,Math.PI/2);b.add(G.cone,'#9a7a52',fx,D*.2+.12,z0+L*.18,.2,.5,.2,-Math.PI/2);
  for(const zz of[.35,.65])b.seg(G.cyl,'#6e5a44',new V(-W*.6,H+.05,z0+L*zz),new V(fx,D*.2+.3,z0+L*zz),.06);b.seg(G.box,'#a88a5a',new V(-W*1.4,H+.3,z0+L*.3),new V(W*1.6,H+.2,z0+L*.45),.04,.18);motor(0);}
 if(T==='catamaran'){b.M(TL.wood);const mz=z0+L*.55,bz=z0+L*.1;b.add(G.cyl,'#d8d4cc',0,H+4.2,mz,.1,8.4,.1);b.seg(G.cyl,'#d8d4cc',new V(0,H+1.1,mz),new V(0,H+1.1,bz),.06);
  b.M(TL.cloth);const sc=new THREE.Color('#f2efe6'),p1=new V(0,H+1.2,mz-.1),p2=new V(0,H+8.2,mz),p3=new V(.02,H+1.2,bz+.2);b.tri(p1,p2,p3,sc);b.tri(p1,p3,p2,sc);const jc=new THREE.Color(M.stripe||'#3a8ab0'),j1=new V(0,H+7.4,mz+.1),j2=new V(0,H+1.1,mz+.3),j3=new V(0,H+.4,z0+L-.4);b.tri(j1,j2,j3,jc);b.tri(j1,j3,j2,jc);
  b.M(TL.metal);for(const sx of[-1,1])b.seg(G.cyl,'#8a9096',new V(sx*W*1.25,H+.3,z0+L*.95),new V(0,H+8,mz),.015);motor(0);}
 if(T==='speedster'){b.M(TL.paint);b.add(G.box,'#e8e2d6',0,fl+.3,z0+L*.62,W*1.5,.18,L*.18);b.M(TL.metal);b.add(G.box,'#1a2a34',0,fl+.72,z0+L*.53,W*1.45,.5,.06,-.55);for(const sx of[-1,1])b.add(G.box,'#c8ccd0',sx*W*.73,fl+.72,z0+L*.53,.05,.5,.08,-.55);
  b.M(TL.cloth);for(const sx of[-.4,.4])b.add(G.box,'#2a2e34',sx*W,seatTop+.25,seatZ+.05,.5,.6,.12);b.M(TL.paint);motor(-.4);motor(.4);}
 if(T==='trawler'||T==='seiner'){b.M(TL.paint);const cz=z0+L*.45,cw=W*1.3,ch=2.1,cln=L*.22;b.add(G.box,'#d2cec6',0,fl+ch/2+.05,cz,cw,ch,cln);b.add(G.box,'#4a3e36',0,fl+ch+.15,cz,cw+.3,.16,cln+.4);
  b.M(TL.metal);for(const s of[-1,1])b.add(G.box,'#1a2228',s*(cw/2+.01),fl+ch*.68,cz,.04,ch*.3,cln*.75);b.add(G.box,'#1a2228',0,fl+ch*.68,cz+cln/2+.01,cw*.8,ch*.3,.04);b.M(TL.wood);b.add(G.cyl,'#55575c',0,fl+ch+.8,cz-.2,.12,1.4,.12);
  const mx=z0+L*.68;b.add(G.cyl,'#6e6052',0,fl+2.4,mx,.12,4.8,.12);b.seg(G.cyl,'#6e6052',new V(0,fl+4.4,mx),new V(0,fl+1.6,z0+L*.08),.07);
  for(const s of[-1,1])b.seg(G.cyl,'#6e6052',new V(s*W*.6,fl+3.8,mx),new V(s*W*3,fl+1.4,mx-.8),.05);b.add(G.box,'#3a4438',W*.45,fl+.35,z0+L*.09,W*.6,.6,1.1,0,0,0,null,.15);b.add(G.box,'#7a4a2e',0,fl+.3,z0+L*.82,.6,.6,.6);}
 if(T==='pontoon'){/* party deck: railings, benches down both sides, a canopy and the helm up front */
  b.M(TL.metal);const rw=W*1.42;for(const s of[-1,1]){b.seg(G.cyl,'#c8ccd0',new V(s*rw,fl+.95,z0+L*.08),new V(s*rw,fl+.95,z0+L*.92),.03);for(let i=0;i<=6;i++)b.add(G.cyl,'#c8ccd0',s*rw,fl+.5,z0+L*(.08+i*.14),.025,.9,.025);}
  b.seg(G.cyl,'#c8ccd0',new V(-rw,fl+.95,z0+L*.08),new V(rw,fl+.95,z0+L*.08),.03);
  b.M(TL.cloth);for(const s of[-1,1]){b.add(G.box,M.stripe,s*W*1.05,fl+.32,z0+L*.5,.55,.34,L*.6);b.add(G.box,M.stripe,s*W*1.25,fl+.62,z0+L*.5,.12,.5,L*.6);}
  b.add(G.box,M.stripe,0,fl+.32,z0+L*.84,W*1.6,.34,.5);
  b.M(TL.metal);for(const sx of[-1,1])for(const zz of[.28,.72])b.add(G.cyl,'#c8ccd0',sx*W*1.3,fl+1.35,z0+L*zz,.04,2.7,.04);b.M(TL.cloth);b.add(G.box,'#f0ece2',0,fl+2.72,z0+L*.5,W*2.75,.08,L*.5);
  b.M(TL.paint);b.add(G.box,'#5a6a74',0,fl+.55,seatZ+.75,.8,1,.6);b.M(TL.metal);b.add(G.cyl12,'#2a2e34',0,fl+1.15,seatZ+.7,.22,.04,.22,1.1,0,0);b.add(G.box,'#2e3338',0,H+.2,z0-.2,.5,.7,.5);}
 if(T==='seiner'){/* a working fishing boat: net drum, buoys, a crane and spare crates on deck */
  b.M(TL.metal);b.add(G.cyl12,'#3a4a50',0,fl+.75,z0+L*.12,.65,1.6,.65,0,0,Math.PI/2);b.M(TL.cloth);b.add(G.cyl12,'#4a7a5a',0,fl+.75,z0+L*.12,.72,1.3,.72,0,0,Math.PI/2);
  b.M(TL.paint);for(const sx of[-1,1])for(let i=0;i<3;i++)b.add(G.sph,'#f07a2a',sx*W*.92,H+.15,z0+L*(.25+i*.22),.22,.22,.22);
  b.M(TL.metal);b.seg(G.cyl,'#c8a040',new V(-W*.5,fl+.2,z0+L*.3),new V(-W*.2,fl+3.6,z0+L*.22),.06);b.seg(G.cyl,'#c8a040',new V(-W*.2,fl+3.6,z0+L*.22),new V(W*.9,fl+2.6,z0+L*.12),.05);
  b.M(TL.wood);for(let i=0;i<4;i++)b.add(G.box,'#9a7448',W*(i%2?.5:-.5),fl+.32,z0+L*(.6+Math.floor(i/2)*.1),.6,.6,.6);}
 if(T==='duck'){/* a giant rubber duck */
  b.M(TL.plain);b.add(G.sph,M.hull,0,H+.4,z0+L*.45,W*1.05,.75,L*.42);b.add(G.sph,M.hull,0,H+1.65,z0+L*.86,.62,.6,.62);b.add(G.cone,M.stripe,0,H+1.55,z0+L*.86+.62,.28,.5,.18,Math.PI/2,0,0);
  for(const sx of[-1,1]){b.add(G.sph,'#ffffff',sx*.28,H+1.82,z0+L*.86+.42,.13,.13,.1);b.add(G.sph,'#14161a',sx*.3,H+1.83,z0+L*.86+.5,.07,.07,.05);}
  b.add(G.cone,M.hull,0,H+.9,z0+L*.02,.45,.8,.25,-.9,0,0);b.M(TL.cloth);b.add(G.box,'#ff8a2a',0,seatTop+.05,seatZ,W*1.1,.14,.7);}
 if(T==='seaplane'){/* floats on struts, a fuselage with a high wing, tail and a propeller */
  b.M(TL.paint);const fy=H+1.35,fz=z0+L*.55;b.add(G.cyl12,M.hull,0,fy,fz,.62,L*.62,.62,Math.PI/2,0,0);b.add(G.cone,M.hull,0,fy,z0+L*.9,.62,.7,.62,Math.PI/2,0,0);
  b.seg(G.cylT,M.hull,new V(0,fy+.1,z0+L*.24),new V(0,fy+.35,z0-.1),.42,.16);b.add(G.box,M.stripe,0,fy+1,z0+.05,.08,1.4,1,-.25,0,0);b.add(G.box,M.hull,0,fy+.3,z0+.2,2.6,.08,.7);
  b.add(G.box,M.hull,0,fy+.95,z0+L*.6,W*10,.12,1.5);for(const sx of[-1,1]){b.add(G.box,M.stripe,sx*W*4.6,fy+.95,z0+L*.6,W*.9,.13,1.52);b.seg(G.cyl,'#5a5a5e',new V(sx*W*1.8,H+.1,z0+L*.66),new V(sx*.5,fy-.2,z0+L*.62),.05);b.seg(G.cyl,'#5a5a5e',new V(sx*W*1.8,H+.1,z0+L*.66),new V(sx*W*2.6,fy+.9,z0+L*.6),.04);b.seg(G.cyl,'#5a5a5e',new V(sx*W*1.8,H+.1,z0+L*.42),new V(sx*.5,fy-.2,z0+L*.45),.05);}
  b.add(G.box,M.stripe,0,fy,fz,1.27,.12,L*.5);b.M(TL.metal);b.add(G.box,'#1e2a34',0,fy+.45,z0+L*.7,1.05,.4,1.3,-.35,0,0);}
 if(T==='jetski'){/* a saddle and handlebars, no cabin */
  b.M(TL.cloth);b.add(G.box,'#1e2228',0,fl+.36,seatZ-.25,W*.75,.22,1.5);b.M(TL.paint);b.add(G.box,M.stripe,0,fl+.25,seatZ+.75,W*.9,.35,.7,-.3);
  b.M(TL.metal);b.seg(G.cyl,'#2a2e34',new V(0,fl+.4,seatZ+.75),new V(0,fl+.95,seatZ+.6),.05);b.add(G.cyl,'#2a2e34',0,fl+.97,seatZ+.6,.03,.9,.03,0,0,Math.PI/2);
  b.add(G.box,'#9adcf0',0,fl+.62,seatZ+1.1,W*.7,.3,.08,-.7);}
 const lz=z0+L*.9,ly=st[N-1].top;b.M(TL.metal);b.add(G.cyl,'#3a3a40',0,ly+.6,lz,.05,1.3,.05);const m=b.mesh(worldMatDS);BGU.toCreasedNormals(m.geometry,.75);m.castShadow=true;m.receiveShadow=true;
 const g=new THREE.Group();g.add(m);const lt=new THREE.Mesh(new THREE.BoxGeometry(.24,.3,.24),new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,2.6,1.5)}));lt.position.set(0,ly+1.3,lz);g.add(lt);
 const hl=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.halo,color:0xffd9a0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.2}));hl.position.copy(lt.position);hl.scale.set(2.6,2.6,1);g.add(hl);
 /* seats: the driver first, then passengers; [x,z] across and along the deck */
 const seats=[[0,seatZ]];
 if(T==='pontoon'){for(let i=0;i<3;i++)for(const s of[-1,1])seats.push([s*W*1.05,z0+L*(.3+i*.18)]);seats.push([0,z0+L*.84]);}
 else if(T==='catamaran')seats.push([-W*1.2,z0+L*.32],[W*1.2,z0+L*.32],[-W*1.2,z0+L*.6],[W*1.2,z0+L*.6],[0,z0+L*.74]);
 else if(T==='trawler')seats.push([-W*.6,z0+L*.14],[W*.6,z0+L*.14],[-W*.6,z0+L*.76],[W*.6,z0+L*.76],[0,z0+L*.86]);
 else if(T==='sail'||T==='cabin'||T==='runner')seats.push([-W*.5,z0+L*.3],[W*.5,z0+L*.3],[0,z0+L*.8]);
 else if(T==='jetski'||T==='speedster'||T==='duck')seats.push([0,seatZ-.8]);
 else if(T==='seiner')seats.push([-W*.7,z0+L*.25],[W*.7,z0+L*.25],[-W*.7,z0+L*.7],[W*.7,z0+L*.7],[0,z0+L*.85]);
 else seats.push([0,z0+L*.62]);
 if(T==='seaplane'){const prop=new THREE.Group();const pm=new THREE.MeshStandardMaterial({color:'#2a2a2e',roughness:.4,metalness:.6});for(let i=0;i<3;i++){const bl=new THREE.Mesh(new THREE.BoxGeometry(.12,1.5,.05),pm);bl.position.y=.7;const arm=new THREE.Group();arm.rotation.z=i/3*TAU;arm.add(bl);prop.add(arm);}
  const sp=new THREE.Mesh(new THREE.ConeGeometry(.2,.4,10),new THREE.MeshStandardMaterial({color:M.stripe,roughness:.4}));sp.rotation.x=Math.PI/2;sp.position.z=.1;prop.add(sp);prop.position.set(0,H+1.35,z0+L*.9+.75);g.add(prop);g.userData.prop=prop;
  seats.length=0;seats.push([0,z0+L*.7],[0,z0+L*.5],[-.3,z0+L*.36],[.3,z0+L*.36]);}
 g.userData={halo:hl,lamp:lt,len:L*.5,seat:seats[0][1],seatY:seatTop-.53,seats,prop:g.userData.prop};scene.add(g);return g;}

/* chat bubble */
function bubbleSprite(text){const c=document.createElement('canvas');c.width=512;c.height=192;const x=c.getContext('2d');x.font='700 30px Manrope, sans-serif';
 const words=text.split(' '),lines=[];let cur='';for(const w of words){const tr=cur?cur+' '+w:w;if(x.measureText(tr).width>440&&cur){lines.push(cur);cur=w;}else cur=tr;if(lines.length>=3)break;}if(cur&&lines.length<3)lines.push(cur);
 const lw=Math.max(...lines.map(l=>Math.min(x.measureText(l).width,440)))+44,lh=lines.length*36+26,X=(512-lw)/2,Y=150-lh;
 x.fillStyle='rgba(255,255,255,.95)';rrect(x,X,Y,lw,lh,24);x.fill();x.beginPath();x.moveTo(236,Y+lh-1);x.lineTo(256,Y+lh+20);x.lineTo(276,Y+lh-1);x.fill();
 x.fillStyle='#33405a';x.textAlign='center';x.textBaseline='top';lines.forEach((l,i)=>x.fillText(l,256,Y+14+i*36,440));
 const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.4,1.65,1);s.center.set(.5,0);s.renderOrder=4;return s;}

/* remote players */
const SCODE={i:'idle',c:'charging',t:'casting',w:'waiting',b:'bite',r:'reeling',k:'caught',x:'retract'};
const num=(v,d=0,lim=1e5)=>{v=Number(v);return Number.isFinite(v)?clamp(v,-lim,lim):d;};
class RemotePlayer{constructor(peer){this.peer=peer;this.rig=null;this.anim=null;this.lookKey='';this.labelKey='';this.buf=[];this.off=null;this.pos=new THREE.Vector3();this.lastPos=new THREE.Vector3();this.yaw=0;this.spd=0;
  this.boat=null;this.onBoat=false;this.byaw=0;this.s='i';this.sT=0;this.fx=0;this.fz=0;this.kId=null;this.eId=null;this.held=null;this.heldT=0;this.emote=null;this.emT=0;this.first=true;
  this.name='Angler';this.color='#9db4d8';this.level=1;this.zone='cove';this.uid=null;this.label=null;this.bubble=null;this.bubbleT=0;this.bob=makeBobber();this.line=makeLine();this.from=new THREE.Vector3();this.rod=null;this.rodKey='';this.fade=0;this.p={};}
 ingest(p,sender){if(!p||typeof p!=='object')return;this.p=p;this.uid=(sender&&sender.by)||(typeof p.uid==='string'?p.uid.slice(0,80):null);
  const name=cleanText(p.n,16)||'Angler',color=isHex(p.c)?p.c:'#9db4d8',hc=isHex(p.hc)?p.hc:'#f6d36a',sk=isHex(p.sk)?p.sk:SKINS[1],hat=HATS.some(h=>h.id===p.h)?p.h:'bucket';
  this.name=name;this.color=color;this.level=clamp(Math.round(num(p.lv,1)),1,999);this.zone=ZONES[p.zn]?p.zn:'sea';
  const lk=[color,hc,sk,hat].join('|');if(lk!==this.lookKey){this.lookKey=lk;const old=this.rig;const pos=old?old.root.position.clone():null;disposeRig(old);
   this.rig=makeChar({skin:sk,shirt:color,pants:'#3f4a6a',hat:hc,hatType:hat});scene.add(this.rig.root);this.anim=new CharAnim(this.rig);if(pos)this.rig.root.position.copy(pos);this.label=null;this.labelKey='';this.rodKey='';if(this.held){this.rig.root.add(this.held);}}
  this.title=ALL_TITLES.includes(p.ti)?p.ti:'Novice Angler';const lbk=name+'|'+this.level+'|'+this.title;if(lbk!==this.labelKey){this.labelKey=lbk;if(this.label)this.rig.root.remove(this.label);this.label=tagSprite('Level '+this.level,name,this.title,TITLE_COL[this.title]);this.label.position.set(0,HEAD_TOP+.45,0);this.rig.root.add(this.label);}
  const rk=(RODM[p.rd]?p.rd:'drift')+'|'+(ENCH[p.en]?p.en:'');if(rk!==this.rodKey){this.rodKey=rk;if(this.rod)this.rod.g.parent&&this.rod.g.parent.remove(this.rod.g);this.rod=buildRod(RODM[p.rd]||RODM.drift,ENCH[p.en]?p.en:null);this.rig.aR.hand.add(this.rod.g);}
  const ts=num(p.ts,0,1e15);if(ts>0&&Number.isFinite(p.x)&&Number.isFinite(p.z)){const est=Date.now()-ts;this.off=this.off==null?est:Math.min(est,this.off+.5);
   const snap={t:ts,x:num(p.x,0,2000),y:num(p.y,0,100),z:num(p.z,0,2000),r:num(p.r,0,100),by:num(p.by,0,100),b:p.b?1:0};const last=this.buf[this.buf.length-1];
   if(last&&snap.t<=last.t){}else{if(last&&snap.t-last.t>300)this.buf.push(Object.assign({},last,{t:snap.t-110}));this.buf.push(snap);if(this.buf.length>40)this.buf.splice(0,this.buf.length-40);}
   if(this.first){this.pos.set(snap.x,snap.y,snap.z);this.yaw=snap.r;this.rig.root.position.copy(this.pos);}}
  const s=SCODE[p.s]?p.s:'i';if(s!==this.s){this.s=s;this.sT=0;if(s==='t'&&this.rod){this.rod.tip.getWorldPosition(this.from);}if(s==='b'&&!this.first){splash(this.bob.position,10,4);addRipple(this.bob.position.x,this.bob.position.z,1);}}
  this.fx=num(p.fx,0,2000);this.fz=num(p.fz,0,2000);
  const k=p.k&&typeof p.k==='object'?p.k:null;const kid=k&&typeof k.i==='string'?k.i.slice(0,40):null;
  if(kid!==this.kId){this.kId=kid;if(!this.first&&k&&(SPM[k.sp]||k.sp==='relic')){this.showHeld(k,3.4);if(typeof onRemoteCatch==='function')onRemoteCatch(this,k);}}
  const e=p.e&&typeof p.e==='object'?p.e:null;const eid=e&&typeof e.i==='string'?e.i.slice(0,40):null;
  if(eid!==this.eId){this.eId=eid;if(!this.first&&e&&EMOTES[e.t]){this.emote=e.t;this.emT=0;if(e.t==='show'&&e.f&&SPM[e.f.sp])this.showHeld(e.f,EMOTES.show.d);}}
  this.first=false;}
 showHeld(k,dur){disposeHeld(this.held);this.held=null;let m;if(k.sp==='relic')m=buildRelic();else{const sp=SPM[k.sp];const mut=MUTS[k.m]?k.m:null;m=buildFish(sp,mut);m.scale.setScalar(fishScale(sp,clamp(num(k.w,1),0,5000)));}
  m.position.set(0,HEAD_TOP+.75,0);this.rig.root.add(m);this.held=m;this.heldT=dur;}
 say(text){if(this.bubble)this.rig.root.remove(this.bubble);this.bubble=bubbleSprite(text);this.bubble.position.set(0,HEAD_TOP+1.5,0);this.rig.root.add(this.bubble);this.bubbleT=6;}
 update(dt){if(!this.rig)return;const now=Date.now();
  if(this.buf.length&&this.off!=null){const rt=now-this.off-200;let a=null,b=null;for(let i=this.buf.length-1;i>=0;i--){if(this.buf[i].t<=rt){a=this.buf[i];b=this.buf[i+1]||null;break;}}if(!a){a=this.buf[0];b=null;}
   if(a&&b){const k=clamp((rt-a.t)/Math.max(1,b.t-a.t),0,1);this.pos.set(lerp(a.x,b.x,k),lerp(a.y,b.y,k),lerp(a.z,b.z,k));this.yaw=a.r+angDiff(a.r,b.r)*k;this.byaw=a.by+angDiff(a.by,b.by)*k;this.onBoat=!!(k<.5?a.b:b.b);}
   else{this.pos.set(a.x,a.y,a.z);this.yaw=a.r;this.byaw=a.by;this.onBoat=!!a.b;}
   const idx=this.buf.indexOf(a);if(idx>1)this.buf.splice(0,idx-1);}
  const moved=Math.hypot(this.pos.x-this.lastPos.x,this.pos.z-this.lastPos.z);this.spd=damp(this.spd,dt>0?moved/dt:0,10,dt);this.lastPos.copy(this.pos);
  const R=this.rig.root;const T=WIND.uTime.value;
  if(this.onBoat){{const bt=BOATM[this.p.bt]?this.p.bt:'dinghy';if(!this.boat||this.boatT!==bt){if(this.boat)scene.remove(this.boat);this.boat=makeBoat(this.color,bt);this.boatT=bt;}}this.boat.visible=true;const al=clamp(num(this.p.al,0),0,120),wy=waveH(this.pos.x,this.pos.z,T)*Math.max(0,1-al/3)+al;this.boat.position.set(this.pos.x,wy-.15,this.pos.z);if(this.boat.userData.prop)this.boat.userData.prop.rotation.z+=dt*(al>.1?55:8);this.boat.rotation.set(0,this.byaw,0);
   {const ud=this.boat.userData;R.position.set(this.pos.x+Math.sin(this.byaw)*ud.seat,wy-.15+ud.seatY,this.pos.z+Math.cos(this.byaw)*ud.seat);}}
  else if(typeof remoteSeat==='function'&&remoteSeat(this,R.position)){if(this.boat)this.boat.visible=false;this.riding=true;}
  else{if(this.boat)this.boat.visible=false;R.position.copy(this.pos);this.riding=false;}
  const pry=R.rotation.y;R.rotation.y=R.rotation.y+angDiff(R.rotation.y,this.yaw)*(1-Math.exp(-12*dt));this.turn=damp(this.turn||0,angDiff(pry,R.rotation.y)/Math.max(dt,1e-3),8,dt);
  this.sT+=dt;const st=SCODE[this.s];if(this.emote){this.emT+=dt;if(this.emote==='dance')R.rotation.y+=0;if(this.emT>EMOTES[this.emote].d||st!=='idle'){this.emote=null;}}
  if(this.heldT>0){this.heldT-=dt;if(this.held){this.held.rotation.y=Math.sin(this.heldT*2)*.25;if(this.held.userData.tail)this.held.userData.tail.rotation.y=Math.sin(this.heldT*14)*.4;}if(this.heldT<=0){disposeHeld(this.held);this.held=null;}}
  const holding=!!this.held;this.anim.update(dt,{spd:this.onBoat?0:this.spd,ground:true,turn:this.turn,sit:this.onBoat||!!this.riding,fish:holding&&!this.emote?'caught':st,fishT:this.sT,power:.5,hold:true,emote:this.emote,emT:this.emT});
  if(this.rod)this.rod.g.visible=!holding;
  const vis=['t','w','b','r'].includes(this.s);this.bob.visible=vis;this.line.visible=vis&&!!this.rod;
  if(vis){const tgtY=surfY(this.fx,this.fz,T);if(this.s==='t'){const k=clamp(this.sT/.7,0,1);this.bob.position.set(lerp(this.from.x,this.fx,k),lerp(this.from.y,tgtY,k)+Math.sin(k*Math.PI)*4,lerp(this.from.z,this.fz,k));}
   else if(this.s==='w')this.bob.position.set(this.fx,tgtY+Math.sin(T*3)*.05,this.fz);else if(this.s==='b')this.bob.position.set(this.fx,tgtY-.4+Math.sin(this.sT*30)*.1,this.fz);
   else this.bob.position.set(this.fx+Math.sin(this.sT*9)*.3,tgtY-.35,this.fz+Math.cos(this.sT*7)*.3);
   if(this.rod){this.rod.tip.getWorldPosition(_v);drawLine(this.line,_v,this.bob.position,this.s==='r'?.05:this.s==='t'?.2:1.1,this.bob.userData.top);if(typeof lineLook==='function')lineLook(this.line,LINEM[this.p.ln]?this.p.ln:'basic',WIND.uTime.value);}}
  if(this.bubbleT>0){this.bubbleT-=dt;if(this.bubbleT<=0&&this.bubble){R.remove(this.bubble);this.bubble=null;}}
  const d=camera.position.distanceTo(R.position);const show=d<260;R.visible=show;if(this.label){this.label.visible=state.settings.tags&&d<150;const sc=clamp(d/18,1,2.6);this.label.scale.set(3.4*sc,3.4*sc*(this.label.material.map.image.height/512),1);}
  this.fade=Math.min(1,this.fade+dt*2);R.scale.setScalar(.6+.4*this.fade);}
 dispose(){disposeRig(this.rig);disposeHeld(this.held);if(this.boat)scene.remove(this.boat);scene.remove(this.bob);scene.remove(this.line);}}
