'use strict';
/* Driftwood Isles — big world events: Leviathan Passage, Starfall, Aurora Tide and The Great Swell.
   The schedule lives in di-game (bigSchedule / tickEvents); this file builds and animates what you see. */
const BIG={active:null,whales:[],meteors:[],shards:[],aurora:null,auroraK:0,bio:0,meteorT:0,shardT:3,sprayT:1,center:new THREE.Vector3(),spouts:[]};

/* ---------- whales ---------- */
function makeWhale(L,c1,c2){const fb=new FacetBuf(),tb=new FacetBuf(),H=L*.16,W=L*.15;
 const prof=[[0,.06,.05],[.08,.1,.09],[.2,.3,.27],[.35,.56,.5],[.5,.82,.76],[.62,.96,.9],[.74,1,.96],[.84,.92,.88],[.93,.68,.66],[1,.3,.3]];
 const st=prof.map(([t,h,w])=>[-L/2+t*L,h*H,w*W,-Math.sin(t*Math.PI)*H*.05]);
 loftBody(fb,st,c1,c2,10,{nose:[L/2+L*.02,-H*.14,0],flatTop:.12});
 const E=st[6],dk=c1.clone().multiplyScalar(.82);for(const s of[-1,1])fb.poly([[E[0],E[3]-E[1]*.4,s*E[2]*.9],[E[0]-L*.17,E[3]-E[1]*1.15,s*(E[2]+L*.2)],[E[0]-L*.06,E[3]-E[1]*.6,s*E[2]*.8]],dk);
 const D=st[3];fb.poly([[D[0]+L*.05,D[3]+D[1]*.95,0],[D[0]-L*.01,D[3]+D[1]+H*.2,0],[D[0]-L*.06,D[3]+D[1]*.9,0]],dk);
 for(let i=0;i<6;i++){const x=st[7][0]-i*L*.035;for(const s of[-1,1])fb.tri([x,st[7][3]-st[7][1]*.98,s*.02],[x-L*.02,st[7][3]-st[7][1]*.98,s*.02],[x-L*.01,st[7][3]-st[7][1]*.7,s*st[7][2]*.55],c2.clone().multiplyScalar(.85),0);}
 tb.fan([0,0,0],[[.1,0,W*.12],[-L*.08,0,L*.18],[-L*.14,.0,L*.16],[-L*.075,0,0],[-L*.14,0,-L*.16],[-L*.08,0,-L*.18],[.1,0,-W*.12]],dk,.03);
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.05,flatShading:true,side:THREE.DoubleSide});
 const g=new THREE.Group(),body=new THREE.Mesh(fb.geo(),mat),tail=new THREE.Group(),tm=new THREE.Mesh(tb.geo(),mat);tail.position.x=st[0][0];tail.add(tm);g.add(body,tail);
 const ey=new THREE.Mesh(new THREE.IcosahedronGeometry(L*.012,0),new THREE.MeshStandardMaterial({color:'#0c0e12',flatShading:true}));for(const s of[-1,1]){const e=ey.clone();e.position.set(st[8][0]+L*.03,st[8][3]-st[8][1]*.2,s*st[8][2]*.92);g.add(e);}
 body.castShadow=tm.castShadow=true;g.userData={tail,len:L,h:H};g.visible=false;scene.add(g);return g;}
function ensureWhales(){if(BIG.whales.length)return;const spec=[[30,'#3c4858','#c6ccd4',0,0],[15,'#465466','#d0d6dc',-.075,1.3],[13,'#465466','#d0d6dc',-.11,2.4]];
 for(const [L,a,b,da,ph] of spec)BIG.whales.push({g:makeWhale(L,new THREE.Color(a),new THREE.Color(b)),da,ph,a:0,R:1,up:false,alpha:0});}
/* spout: a short-lived column of mist */
function spout(p){for(let i=0;i<5;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.smoke,transparent:true,depthWrite:false,opacity:0,color:0xf4f8ff}));s.position.copy(p);scene.add(s);BIG.spouts.push({s,t:-i*.08,p:p.clone()});}splash(p,10,5);addRipple(p.x,p.z,1.6);AU.splash(.35,0);}

/* ---------- starfall ---------- */
const streakTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.85,'rgba(255,250,240,.7)');g.addColorStop(1,'rgba(255,255,255,1)');
 x.fillStyle=g;x.beginPath();x.moveTo(0,16);x.lineTo(240,6);x.quadraticCurveTo(256,16,240,26);x.closePath();x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
function makeStreak(col){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:streakTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,side:THREE.DoubleSide}));m.visible=false;m.frustumCulled=false;m.userData.noAO=true;scene.add(m);return m;}
const _sf=new THREE.Vector3(),_ss=new THREE.Vector3(),_sn=new THREE.Vector3(),_sm=new THREE.Matrix4();
function orientStreak(m,pos,vel,len,wid){_sf.copy(vel).normalize();_sn.subVectors(camera.position,pos).normalize();_ss.crossVectors(_sn,_sf).normalize();_sn.crossVectors(_sf,_ss);
 _sm.makeBasis(_sf,_ss,_sn);m.quaternion.setFromRotationMatrix(_sm);m.scale.set(len,wid,1);m.position.copy(pos).addScaledVector(_sf,-len*.5);}
function ensureMeteors(){if(BIG.meteors.length)return;for(let i=0;i<14;i++)BIG.meteors.push({m:makeStreak(new THREE.Color(7,6.4,8)),life:0,p:new THREE.Vector3(),v:new THREE.Vector3()});
 for(let i=0;i<5;i++){const o=new THREE.Mesh(new THREE.OctahedronGeometry(.35,0),new THREE.MeshBasicMaterial({color:new THREE.Color(5,4,7)}));o.visible=false;scene.add(o);BIG.shards.push({o,tr:makeStreak(new THREE.Color(3,2.6,5)),live:false,p:new THREE.Vector3(),v:new THREE.Vector3()});}}

/* ---------- aurora curtains ---------- */
function ensureAurora(){if(BIG.aurora)return;const grp=new THREE.Group();const u={uT:WIND.uTime,uA:{value:0}};
 const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,side:THREE.DoubleSide,
  vertexShader:'uniform float uT;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float w=sin(uT*.25+uv.x*11.)*14.+sin(uT*.41+uv.x*27.)*6.;p.xz+=normalize(p.xz)*w;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float uT;uniform float uA;varying vec2 vUv;void main(){float r=.55+.45*sin(vUv.x*95.+uT*1.2+sin(vUv.x*17.+uT*.6)*3.);float b=pow(1.-vUv.y,1.6)*smoothstep(0.,.1,vUv.y)*smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x);vec3 c=mix(vec3(.15,1.,.55),vec3(.2,.7,1.),smoothstep(.2,.6,vUv.y));c=mix(c,vec3(.8,.3,1.),smoothstep(.55,1.,vUv.y));gl_FragColor=vec4(c*r*b*uA*2.6,1.);'+OUT_CHUNKS+'}'});
 for(let k=0;k<3;k++){const g=new THREE.PlaneGeometry(1,1,120,1),p=g.attributes.position,R=520+k*70,th0=-1.9+k*.5;for(let i=0;i<p.count;i++){const uvx=g.attributes.uv.getX(i),uvy=g.attributes.uv.getY(i);const th=th0+(uvx-.5)*1.9;p.setXYZ(i,Math.cos(th)*R,170+k*25+uvy*(110-k*15),Math.sin(th)*R);}
  const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=-7;m.userData.noAO=true;grp.add(m);}
 grp.visible=false;scene.add(grp);BIG.aurora={grp,u};}

/* ---------- lifecycle ---------- */
function nearestIsland(){let best=ZONES.cove,bd=1e9;for(const k of ISL){const I=ZONES[k];const d=Math.hypot(I.x-player.pos.x,I.z-player.pos.z)-I.R;if(d<bd){bd=d;best=I;}}return best;}
function bigEventStart(id){BIG.active=id;if(id==='leviathan'){ensureWhales();const I=nearestIsland();BIG.center.set(I.x,0,I.z);BIG.whaleR=I.R*1.8;const a0=Math.atan2(player.pos.z-I.z,player.pos.x-I.x)-1.2;BIG.whales.forEach(w=>{w.a=a0+w.da;w.g.visible=true;w.alpha=0;});}
 if(id==='starfall')ensureMeteors();if(id==='aurora')ensureAurora();}
function bigEventEnd(id){if(BIG.active===id)BIG.active=null;}
function updateBigFx(dt){const T=WIND.uTime.value,act=BIG.active,night=1-env.day;
 // whales: swim a wide circle around the island, surfacing to breathe every ~25 s
 if(BIG.whales.length){const on=act==='leviathan';for(const w of BIG.whales){w.alpha=clamp(w.alpha+(on?dt*.3:-dt*.2),0,1);if(w.alpha<=0&&!on){w.g.visible=false;continue;}w.g.visible=true;
   const L=w.g.userData.len,H=w.g.userData.h,sp=(L>20?5.5:5.8)/BIG.whaleR;w.a+=sp*dt;const R=BIG.whaleR+(L>20?0:L*.6);const x=BIG.center.x+Math.cos(w.a)*R,z=BIG.center.z+Math.sin(w.a)*R;
   const cyc=(T*TAU/26+w.ph)%TAU,surf=smooth(.35,.7,(Math.sin(cyc)+1)/2)*w.alpha;const y=lerp(-16-H,-H*.62,surf)+Math.sin(T*.7+w.ph)*.25;
   const tx=-Math.sin(w.a),tz=Math.cos(w.a);w.g.position.set(x,y,z);w.g.rotation.set(0,Math.atan2(-tz,tx),Math.cos(cyc)*.12*w.alpha);w.g.userData.tail.rotation.z=Math.sin(T*1.6+w.ph)*.3;
   const up=surf>.9;if(up&&!w.up){spout(new THREE.Vector3(x+tx*L*.3,1,z+tz*L*.3));}w.up=up;}}
 for(let i=BIG.spouts.length-1;i>=0;i--){const s=BIG.spouts[i];s.t+=dt;if(s.t<0)continue;const k=s.t/2.2;s.s.position.set(s.p.x,s.p.y+k*9,s.p.z);const sc=1.2+k*6;s.s.scale.set(sc,sc*1.4,1);s.s.material.opacity=Math.sin(Math.min(k,1)*Math.PI)*.75;if(k>=1){scene.remove(s.s);s.s.material.dispose();BIG.spouts.splice(i,1);}}
 // starfall: streaks across the sky, and now and then a shard drops into the sea nearby
 if(BIG.meteors.length){const on=act==='starfall';if(on){BIG.meteorT-=dt;if(BIG.meteorT<=0){BIG.meteorT=rand(.15,.6)*(env.day>.5?1.6:1);const m=BIG.meteors.find(q=>q.life<=0);
    if(m){camera.getWorldDirection(_sf);const a=Math.atan2(_sf.z,_sf.x)+rand(-1.1,1.1);m.p.set(camera.position.x+Math.cos(a)*rand(420,620),rand(180,320),camera.position.z+Math.sin(a)*rand(420,620));const ha=a+Math.PI/2*(Math.random()<.5?1:-1);
     m.v.set(Math.cos(ha)*rand(140,260),-rand(90,170),Math.sin(ha)*rand(140,260));m.life=m.max=rand(.7,1.3);m.m.visible=true;}}
   BIG.shardT-=dt;if(BIG.shardT<=0){BIG.shardT=rand(3,7);const s=BIG.shards.find(q=>!q.live);if(s)for(let tr=0;tr<10;tr++){const ang=Math.random()*TAU,d=rand(14,46),x=player.pos.x+Math.cos(ang)*d,z=player.pos.z+Math.sin(ang)*d;if(groundH(x,z)<-1.4&&!pondAt(x,z)){s.live=true;s.p.set(x+rand(-30,30),90,z+rand(-30,30));s.v.set((x-s.p.x)/2.2,-40,(z-s.p.z)/2.2);s.o.visible=s.tr.visible=true;break;}}}}
  for(const m of BIG.meteors){if(m.life<=0)continue;m.life-=dt;m.p.addScaledVector(m.v,dt);const k=m.life/m.max;orientStreak(m.m,m.p,m.v,40*Math.sin(k*Math.PI)+6,2.2);m.m.material.opacity=Math.sin(k*Math.PI)*.6;if(m.life<=0)m.m.visible=false;}
  for(const s of BIG.shards){if(!s.live)continue;s.p.addScaledVector(s.v,dt);s.o.position.copy(s.p);s.o.rotation.y+=dt*6;orientStreak(s.tr,s.p,s.v,14,1.1);const wy=waveH(s.p.x,s.p.z,T);
   if(s.p.y<=wy){s.live=false;s.o.visible=s.tr.visible=false;splash(new THREE.Vector3(s.p.x,wy,s.p.z),22,7);ringAt(s.p.x,wy+.05,s.p.z,1.4,1.8);addRipple(s.p.x,s.p.z,1.4);AU.splash(.5,clamp((s.p.x-camera.position.x)/30,-1,1));}}}
 // aurora: curtains over the sea, strongest at night; the water glows along with it
 BIG.auroraK=clamp(BIG.auroraK+(act==='aurora'?dt*.15:-dt*.2),0,1);if(BIG.aurora){const a=BIG.auroraK*(.25+.75*night)*(1-env.cloud*.7);BIG.aurora.grp.visible=a>.01;BIG.aurora.u.uA.value=a;BIG.aurora.grp.position.set(camera.position.x,0,camera.position.z);}
 BIG.bio=BIG.auroraK*(.35+.65*night);waterU.uBio.value=BIG.bio;
 // the great swell: spray bursts along the shore
 if(act==='swell'){BIG.sprayT-=dt;if(BIG.sprayT<=0){BIG.sprayT=rand(.4,1.1);for(let tr=0;tr<8;tr++){const ang=Math.random()*TAU,d=rand(8,40),x=player.pos.x+Math.cos(ang)*d,z=player.pos.z+Math.sin(ang)*d,g=groundH(x,z);if(g>-1.3&&g<-.15){splash(new THREE.Vector3(x,waveH(x,z,T),z),16,6.5);break;}}}}}
