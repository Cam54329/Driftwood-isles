'use strict';
/* Driftwood Isles — world: renderer, post-processing, sky, ocean, terrain, props, ambient life */
const canvas=$('#c');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',stencil:false});}catch(e){window.__diFail&&window.__diFail('Your browser could not start WebGL, which this game needs.');throw e;}
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.enabled=false;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xcfe8f5,80,380);
const camera=new THREE.PerspectiveCamera(55,1,.3,1600);
const hemi=new THREE.HemisphereLight(0xeaf6ff,0x6a8a5a,.4);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dc,3);sun.shadow.bias=-.0003;sun.shadow.normalBias=.045;sun.shadow.radius=2.5;scene.add(sun);scene.add(sun.target);
const TIERS={
 ultra:{pr:2,shadow:4096,ext:58,post:true,msaa:4,ao:true,bloom:true,refl:true,rs:.7,fxaa:false,wr:112,ws:160,grass:42000,flowers:3200,rain:2800,ff:520,birds:24,far:900,lamps:6,cloud:6,env:1,tex:512,leaf:1},
 high:{pr:1.75,shadow:2048,ext:48,post:true,msaa:4,ao:true,bloom:true,refl:true,rs:.5,fxaa:false,wr:96,ws:128,grass:26000,flowers:2000,rain:2000,ff:360,birds:18,far:780,lamps:4,cloud:5,env:1.5,tex:256,leaf:1},
 medium:{pr:1.5,shadow:1024,ext:40,post:true,msaa:0,ao:false,bloom:true,refl:false,fxaa:true,wr:72,ws:96,grass:9000,flowers:900,rain:1200,ff:220,birds:12,far:600,lamps:2,cloud:4,env:3,tex:256,leaf:.8},
 low:{pr:1,shadow:0,ext:0,post:false,msaa:0,ao:false,bloom:false,refl:false,fxaa:false,wr:52,ws:64,grass:2600,flowers:300,rain:600,ff:120,birds:6,far:420,lamps:0,cloud:3,env:6,tex:256,leaf:.6}};
const GFX={tier:'high',composer:null,bloom:null,grade:null,fxaa:null,ao:null,refl:null,reflCam:new THREE.PerspectiveCamera(),texMat:new THREE.Matrix4(),hdr:false,lamps:[]};
const TT=()=>TIERS[GFX.tier]||TIERS.high;
// GTAO should ignore sky, water, sprites and alpha-tested foliage (it renders its own normal pass)
if(THREE.GTAOPass)THREE.GTAOPass.prototype._overrideVisibility=function(){const cache=this._visibilityCache;this.scene.traverse(o=>{if((o.isPoints||o.isLine||o.isSprite||o.userData.noAO)&&o.visible){o.visible=false;cache.push(o);}});};

/* ---------- post-processing: HDR → AO → bloom → grade → ACES tone map → (FXAA) ---------- */
function halfFloatOK(){try{const gl=renderer.getContext();return !!(gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float'));}catch(e){return false;}}
const GradeShader={uniforms:{tDiffuse:{value:null},uSat:{value:1},uVig:{value:.42},uCon:{value:1.05},uTint:{value:new THREE.Color(1,1,1)}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uSat;uniform float uVig;uniform float uCon;uniform vec3 uTint;varying vec2 vUv;
 void main(){vec4 t=texture2D(tDiffuse,vUv);vec3 c=clamp(t.rgb,0.,6e4);if(any(isnan(c)))c=vec3(0.);float l=dot(c,vec3(.2126,.7152,.0722));c=max(mix(vec3(l),c,uSat),0.)*uTint;c=pow(c/.18+1e-6,vec3(uCon))*.18;
  vec2 d=vUv-.5;c*=1.-dot(d,d)*uVig;gl_FragColor=vec4(c,t.a);}`};
const SanitizeShader={uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 t=texture2D(tDiffuse,vUv);vec3 c=t.rgb;if(any(isnan(c))||any(isinf(c))||!(c.r+c.g+c.b<1e5))c=vec3(0.);gl_FragColor=vec4(min(max(c,vec3(0.)),vec3(2e4)),1.);}'};
function disposePost(){if(!GFX.composer)return;try{GFX.composer.renderTarget1.dispose();GFX.composer.renderTarget2.dispose();if(GFX.ao)GFX.ao.dispose();if(GFX.bloom)GFX.bloom.dispose();}catch(e){}GFX.composer=null;GFX.bloom=GFX.grade=GFX.fxaa=GFX.ao=null;}
function buildPost(){disposePost();const t=TT();if(!t.post)return;
 const pr=renderer.getPixelRatio(),w=innerWidth,h=innerHeight;GFX.hdr=halfFloatOK();
 const rt=new THREE.WebGLRenderTarget(Math.round(w*pr),Math.round(h*pr),{type:GFX.hdr?THREE.HalfFloatType:THREE.UnsignedByteType,samples:GFX.hdr?(t.msaa||0):0});
 const comp=new THREE.EffectComposer(renderer,rt);comp.addPass(new THREE.RenderPass(scene,camera));
 if(t.ao){try{const ao=new THREE.GTAOPass(scene,camera,w,h);ao.blendIntensity=.9;ao.updateGtaoMaterial({radius:1.1,distanceExponent:1.6,thickness:1.6,scale:1.1,samples:GFX.tier==='ultra'?16:10});ao.updatePdMaterial({radius:6,rings:2,samples:16});comp.addPass(ao);GFX.ao=ao;}catch(e){GFX.ao=null;}}
 comp.addPass(new THREE.ShaderPass(SanitizeShader));
 if(t.bloom){const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(w,h),.2,.55,GFX.hdr?2.4:.92);comp.addPass(bloom);GFX.bloom=bloom;}
 const grade=new THREE.ShaderPass(GradeShader);comp.addPass(grade);GFX.grade=grade;comp.addPass(new THREE.OutputPass());
 if(t.fxaa){const fx=new THREE.ShaderPass(THREE.FXAAShader);comp.addPass(fx);GFX.fxaa=fx;}
 GFX.composer=comp;sizePost();}
function sizePost(){if(!GFX.composer)return;const pr=renderer.getPixelRatio(),w=innerWidth,h=innerHeight;GFX.composer.setPixelRatio(pr);GFX.composer.setSize(w,h);if(GFX.fxaa)GFX.fxaa.material.uniforms.resolution.value.set(1/(w*pr),1/(h*pr));}
function buildRefl(){if(GFX.refl){GFX.refl.dispose();GFX.refl=null;}if(!TT().refl)return;const pr=renderer.getPixelRatio();const rs=TT().rs||.5;
 GFX.refl=new THREE.WebGLRenderTarget(Math.round(innerWidth*pr*rs),Math.round(innerHeight*pr*rs),{type:halfFloatOK()?THREE.HalfFloatType:THREE.UnsignedByteType});}
const _rp=new THREE.Plane(),_rn=new THREE.Vector3(0,1,0),_rlook=new THREE.Vector3(),_rrot=new THREE.Matrix4(),_rq=new THREE.Vector4(),_rclip=new THREE.Vector4(),_rpt=new THREE.Vector3(0,.05,0);
const reflHide=[];
function renderRefl(){const rc=GFX.reflCam,cp=camera.position;
 _rrot.extractRotation(camera.matrixWorld);_rlook.set(0,0,-1).applyMatrix4(_rrot).add(cp);
 rc.position.set(cp.x,-cp.y,cp.z);rc.up.set(0,1,0).applyMatrix4(_rrot);rc.up.y*=-1;rc.lookAt(_rlook.x,-_rlook.y,_rlook.z);
 rc.far=camera.far;rc.near=camera.near;rc.updateMatrixWorld();rc.projectionMatrix.copy(camera.projectionMatrix);
 GFX.texMat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);GFX.texMat.multiply(rc.projectionMatrix);GFX.texMat.multiply(rc.matrixWorldInverse);
 _rp.setFromNormalAndCoplanarPoint(_rn,_rpt);_rp.applyMatrix4(rc.matrixWorldInverse);_rclip.set(_rp.normal.x,_rp.normal.y,_rp.normal.z,_rp.constant);
 const e=rc.projectionMatrix.elements;_rq.x=(Math.sign(_rclip.x)+e[8])/e[0];_rq.y=(Math.sign(_rclip.y)+e[9])/e[5];_rq.z=-1;_rq.w=(1+e[10])/e[14];
 _rclip.multiplyScalar(2/_rclip.dot(_rq));e[2]=_rclip.x;e[6]=_rclip.y;e[10]=_rclip.z+1;e[14]=_rclip.w;
 water.visible=false;const vis=reflHide.map(o=>o.visible);reflHide.forEach(o=>o.visible=false);const sm=renderer.shadowMap.autoUpdate;
 renderer.setRenderTarget(GFX.refl);renderer.clear();renderer.render(scene,rc);renderer.setRenderTarget(null);
 water.visible=true;reflHide.forEach((o,i)=>o.visible=vis[i]);}

/* ---------- sky dome, stars, moon ---------- */
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,48,24),skyMat);sky.renderOrder=-10;sky.frustumCulled=false;sky.userData.noAO=true;scene.add(sky);
const OUT_CHUNKS='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
function radialTex(stops,size=128){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const TEX={halo:radialTex([[0,'rgba(255,240,200,1)'],[.25,'rgba(255,220,150,.55)'],[1,'rgba(255,200,120,0)']]),soft:radialTex([[0,'rgba(255,255,255,1)'],[.5,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]),
 smoke:radialTex([[0,'rgba(235,235,240,.9)'],[.6,'rgba(220,220,228,.35)'],[1,'rgba(220,220,228,0)']])};
const moonTex=(()=>{const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const img=x.createImageData(S,S);
 for(let y=0;y<S;y++)for(let X=0;X<S;X++){const dx=(X-S/2)/(S/2-4),dy=(y-S/2)/(S/2-4),r2=dx*dx+dy*dy;const o=(y*S+X)*4;if(r2>1){img.data[o+3]=0;continue;}
  const u=X/S,v=y/S,mare=sstep(.5,.62,fbmT(u,v,3,5,7)),cr=worley2(u*9,v*9,9,8),crat=sstep(.18,.0,cr[0])*.5*(cr[2]>.5?1:0);const limb=Math.pow(1-r2,.25);
  const l=(.86-.3*mare-crat*.4+.08*fbmT(u,v,24,3,9))*(.7+.3*limb);img.data[o]=l*250;img.data[o+1]=l*246;img.data[o+2]=l*236;img.data[o+3]=255*Math.min(1,(1-r2)*40);}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const moon=new THREE.Mesh(new THREE.CircleGeometry(14,40),new THREE.MeshBasicMaterial({map:moonTex,transparent:true,fog:false,depthWrite:false,toneMapped:true}));moon.renderOrder=-9;moon.userData.noAO=true;scene.add(moon);
const moonHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft,color:0xbcd0ff,transparent:true,opacity:.5,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));moonHalo.scale.set(120,120,1);moonHalo.renderOrder=-9;scene.add(moonHalo);
const starU={uT:{value:0},uA:{value:0},uPR:{value:1}};
const stars=(()=>{const N=1800,p=[],ph=[],sz=[];const r=rng(7);for(let i=0;i<N;i++){const th=r()*TAU,y=Math.pow(r(),.7);const cr=Math.sqrt(1-y*y);p.push(Math.cos(th)*cr*800,y*800+10,Math.sin(th)*cr*800);ph.push(r()*TAU);sz.push(.5+Math.pow(r(),5)*2.8);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('ph',new THREE.Float32BufferAttribute(ph,1));g.setAttribute('sz',new THREE.Float32BufferAttribute(sz,1));
 const m=new THREE.ShaderMaterial({uniforms:starU,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float ph;attribute float sz;uniform float uT;uniform float uA;uniform float uPR;varying float vA;varying float vS;void main(){vA=uA*(.65+.35*sin(uT*1.7+ph*7.));vS=sz;gl_PointSize=sz*uPR*2.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying float vA;varying float vS;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);vec3 c=mix(vec3(.75,.85,1.),vec3(1.,.92,.8),fract(vS*7.31));gl_FragColor=vec4(c*a*vA*1.6,a*vA);'+OUT_CHUNKS+'}'});
 const s=new THREE.Points(g,m);s.frustumCulled=false;s.renderOrder=-9;scene.add(s);return s;})();

/* ---------- geometry helpers (normals are kept: boxes stay crisp, round things stay smooth) ---------- */
const ni=g=>g.index?g.toNonIndexed():g;
function rockGeo(k,det=2){const g=new THREE.IcosahedronGeometry(1,det);const p=g.attributes.position;const v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=fbm2(v.x*1.3+k*7.1+8,v.y*1.3+v.z*.9+k*3.3+8,64,64,4,40+k);const f=.7+n*.7+(Math.abs(v.y)>.55?-.12*(Math.abs(v.y)-.55):0);v.multiplyScalar(f);if(v.y<-.2)v.y=-.2-(-.2-v.y)*.45;p.setXYZ(i,v.x,v.y,v.z);}
 const m=BGU.mergeVertices(g,1e-4);m.computeVertexNormals();const f=ni(m);f.computeVertexNormals();return f;}
const G={box:ni(new THREE.BoxGeometry(1,1,1)),cyl:ni(new THREE.CylinderGeometry(1,1,1,8)),cylT:ni(new THREE.CylinderGeometry(.68,1,1,7)),cyl6:ni(new THREE.CylinderGeometry(1,1,1,6)),cyl12:ni(new THREE.CylinderGeometry(1,1,1,12)),
 cone:ni(new THREE.ConeGeometry(1,1,7)),cone4:ni(new THREE.ConeGeometry(1,1,4)),ico:ni(new THREE.IcosahedronGeometry(1,0)),ico1:ni(new THREE.IcosahedronGeometry(1,1)),ico2:ni(new THREE.IcosahedronGeometry(1,2)),
 sph:ni(new THREE.SphereGeometry(1,9,6)),oct:ni(new THREE.OctahedronGeometry(1,0)),hemi:ni(new THREE.SphereGeometry(1,10,5,0,TAU,0,Math.PI/2)),
 rocks:[0,1,2,3,4,5].map(k=>rockGeo(k,1)),pebbles:[0,1,2].map(k=>rockGeo(k+7,0))};
const _m=new THREE.Matrix4(),_tm=new THREE.Matrix4(),_nm=new THREE.Matrix3(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3(),_v4=new THREE.Vector3(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_c=new THREE.Color(),_cw2=new THREE.Color(),_up=new THREE.Vector3(0,1,0);
/* merges many small primitives into one mesh; each vertex carries a tint, a PBR layer id ("mat") and
   object-space texture coordinates ("tp") so textures follow each object, not the world grid */
class Builder{constructor(){this.p=[];this.n=[];this.c=[];this.s=[];this.m=[];this.t=[];this.sw=null;this.gr=null;this.top=null;this.mt=0;}
 M(id){this.mt=id;return this;}
 addM(geo,color,m,jit=.03,tm){const a=geo.attributes.position.array,na=geo.attributes.normal.array;_c.set(color);_nm.getNormalMatrix(m);const sw=this.sw,gr=this.gr,top=this.top,mt=this.mt;
  for(let i=0;i<a.length;i+=9){const k=1+(Math.random()-.5)*jit*2;for(let j=0;j<9;j+=3){_v2.set(a[i+j],a[i+j+1],a[i+j+2]);_v3.copy(_v2).applyMatrix4(tm||m);this.t.push(_v3.x,_v3.y,_v3.z);_v2.applyMatrix4(m);this.p.push(_v2.x,_v2.y,_v2.z);
   _v4.set(na[i+j],na[i+j+1],na[i+j+2]).applyMatrix3(_nm).normalize();this.n.push(_v4.x,_v4.y,_v4.z);let kk=k,r=_c.r,g=_c.g,b=_c.b;
   if(gr)kk*=1-gr.k*.5+gr.k*clamp((_v2.y-gr.b)/gr.h,0,1);if(top){const f=smooth(top.lo,top.hi,_v4.y)*(top.yk?clamp((_v2.y-top.y0)/top.yk,0,1):1);r+=(top.c.r-r)*f;g+=(top.c.g-g)*f;b+=(top.c.b-b)*f;}
   this.c.push(r*kk,g*kk,b*kk);this.s.push(sw?sw.a*Math.pow(clamp((_v2.y-sw.b)/sw.h,0,1),1.4):0);this.m.push(mt);}}}
 add(geo,color,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,parent=null,jit=.03){_m.compose(_v.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(sx,sy,sz));if(parent)_m.premultiply(parent);
  const h=Math.sin(x*12.9898+z*78.233+y*3.1)*43758.5;_tm.makeScale(sx,sy,sz).setPosition((h-Math.floor(h))*9,((h*7)-Math.floor(h*7))*9,0);this.addM(geo,color,_m,jit,_tm);}
 seg(geo,color,p0,p1,r0,r1){_v.subVectors(p1,p0);const len=_v.length();_q.setFromUnitVectors(_up,_v.normalize());const sx=r1==null?r0:r1;_m.compose(_v2.addVectors(p0,p1).multiplyScalar(.5),_q,_s.set(sx,len,r0));
  const h=Math.sin(p0.x*12.9898+p0.z*78.233)*43758.5;_tm.makeScale(sx,len,r0).setPosition((h-Math.floor(h))*9,0,0);this.addM(geo,color,_m,.02,_tm);}
 tri(a,b,c,col,sa=0,sb=0,sc=0){this.p.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);this.t.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);_v3.subVectors(b,a).cross(_v4.subVectors(c,a)).normalize();
  for(let i=0;i<3;i++){this.c.push(col.r,col.g,col.b);this.n.push(_v3.x,_v3.y,_v3.z);this.m.push(this.mt);}this.s.push(sa,sb,sc);}
 mesh(mat,sway){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  g.setAttribute('mat',new THREE.Float32BufferAttribute(this.m,1));g.setAttribute('tp',new THREE.Float32BufferAttribute(this.t,3));if(sway)g.setAttribute('sway',new THREE.Float32BufferAttribute(this.s,1));g.computeBoundingSphere();return new THREE.Mesh(g,mat);}}
const worldMat=makeWorldMat(),worldMatS=makeWorldMat({sway:true}),worldMatDS=makeWorldMat({side:THREE.DoubleSide});
const vcMat=worldMat,folMat=worldMatS;
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true});
const lavaMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(3,2.2,1.6)});
const matCache={};const lam=(c,r=.78,m=0)=>{const k=c+'|'+r+'|'+m;return matCache[k]||(matCache[k]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));};
let LEAFK=1;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function inSphere(r,rad,squash=1){let x,y,z;do{x=r()*2-1;y=r()*2-1;z=r()*2-1;}while(x*x+y*y+z*z>1);return V(x*rad,y*rad*squash,z*rad);}

/* ---------- terrain ---------- */
function islandR(I,th){return I.R*(1+.09*Math.sin(3*th+I.p1)+.05*Math.sin(5*th+I.p2));}
function profile(I,f,x,z){let h;
 if(f<.62){const hill=Math.sin(x*.13+I.p1*3)*Math.sin(z*.11+I.p2*2)*I.hill+Math.sin(x*.05+I.p2)*Math.cos(z*.045+I.p1)*I.hill*.9;h=I.H+hill*smooth(.62,.3,f);}
 else if(f<.8)h=lerp(I.H,.6,smooth(.62,.8,f));
 else if(f<1)h=lerp(.6,-.4,(f-.8)/.2);
 else h=lerp(-.4,-7,clamp((f-1)/.4,0,1));
 if(I.volcano&&f<.34){h+=13*smooth(.34,.08,f);if(f<.07)h-=4*smooth(.07,0,f);}
 if(I.ponds)for(const p of I.ponds){const d=Math.hypot(x-p.x,z-p.z);if(d<p.r*1.6){const fl=Math.max(p.y-1.1,.85);h=Math.min(h,lerp(fl,h,smooth(p.r*.75,p.r*1.6,d)));}}
 return h;}
function terrainH(I,x,z){const dx=x-I.x,dz=z-I.z,d2=dx*dx+dz*dz,Rm=I.R*1.42;if(d2>Rm*Rm)return -60;const d=Math.sqrt(d2),th=Math.atan2(dz,dx);return profile(I,d/islandR(I,th),x,z);}
const world={ponds:[],docks:[],colliders:[],inter:[],npcs:[],floaters:[],seaRocks:[],reserved:{},spawn:{},boatDock:{},halos:[],chimneys:[],puddles:[],smoke:[],altarCrystal:null,lamps:[]};
function dockH(x,z){for(const d of world.docks){const dx=x-d.x,dz=z-d.z;const u=dx*d.cx+dz*d.sz,v=-dx*d.sz+dz*d.cx;if(u>=-1&&u<=d.len&&Math.abs(v)<=d.w/2)return d.h;}return -60;}
function onDock(x,z){return dockH(x,z)>-1;}
function pondAt(x,z){for(const p of world.ponds)if(Math.hypot(x-p.x,z-p.z)<p.r*1.02)return p;return null;}
function surfY(x,z,t){const p=pondAt(x,z);return p?p.y+Math.sin(t*1.3+x*.7)*.025:waveH(x,z,t);}
function groundH(x,z){if(world.ponds.length&&pondAt(x,z))return -60;let h=-60;for(const k of ISL){const t=terrainH(ZONES[k],x,z);if(t>h)h=t;}return Math.max(h,dockH(x,z));}
function zoneAt(x,z){for(const k of ISL){const I=ZONES[k];if(Math.hypot(x-I.x,z-I.z)<I.R*2.1)return k;}return 'sea';}
/* waves calm down over the shallows around each island (matches the water vertex shader) */
function shoreDamp(x,z){let d=1;for(const k of ISL){const I=ZONES[k],dx=x-I.x,dz=z-I.z,dd=Math.hypot(dx,dz);if(dd>I.R*1.9)continue;const f=dd/islandR(I,Math.atan2(dz,dx));d=Math.min(d,lerp(.28,1,smooth(.92,1.75,f)));}return d;}
function waveH(x,z,t){return waveRaw(x,z,t)*WAVE.amp*shoreDamp(x,z);}
const TERR_GROUND={cove:TL.grass,moss:TL.grass,frost:TL.snow,ember:TL.dirt};
function segDist(px,pz,a,b){const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1;const t=clamp(((px-a.x)*dx+(pz-a.z)*dz)/l2,0,1);return Math.hypot(px-a.x-dx*t,pz-a.z-dz*t);}
function buildTerrain(I,key){const fs=[];for(let f=0;f<1.42;){fs.push(f);f+=f<.06&&I.volcano?.014:f<.4?(I.volcano&&f<.36?.024:.036):f<.7?.03:f<1.1?.02:.05;}fs.push(1.42);const paths=I.paths||[];
 const NS=GFX.tier==='low'?150:180,nv=1+(fs.length-1)*NS;const pos=new Float32Array(nv*3),col=new Float32Array(nv*3),spl=new Float32Array(nv*4),F=new Float32Array(nv);
 const cs=new THREE.Color(I.sand),cu=new THREE.Color(I.sand).multiplyScalar(.7),cg=new THREE.Color(I.grass),cg2=new THREE.Color(I.grass2),cr=new THREE.Color(I.rock),cd=new THREE.Color(key==='ember'?'#3a3330':key==='moss'?'#4a4034':key==='frost'?'#9aa3aa':'#6a5a44');
 const set=(i,x,z,f)=>{pos[i*3]=x;pos[i*3+1]=profile(I,f,x,z);pos[i*3+2]=z;F[i]=f;};
 set(0,I.x,I.z,0);let i=1;for(let r=1;r<fs.length;r++)for(let j=0;j<NS;j++){const jt=(hashI(r,j,5)-.5)*.55,th=(j+jt*(fs[r]<1.3?1:0))/NS*TAU,R=islandR(I,th),d=(fs[r]+(fs[r]>.05&&fs[r]<1.3?(hashI(r,j,9)-.5)*.012:0))*R;set(i++,I.x+Math.cos(th)*d,I.z+Math.sin(th)*d,fs[r]);if(fs[r]<.78)pos[(i-1)*3+1]+=(hashI(r,j,13)-.5)*.12;}
 const idx=[];for(let j=0;j<NS;j++)idx.push(0,1+(j+1)%NS,1+j);
 for(let r=1;r<fs.length-1;r++){const a0=1+(r-1)*NS,b0=1+r*NS;for(let j=0;j<NS;j++){const j1=(j+1)%NS,a=a0+j,b=a0+j1,c=b0+j,d=b0+j1;idx.push(a,b,c,b,d,c);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const nrm=g.attributes.normal.array;
 const c=new THREE.Color();
 for(let v=0;v<nv;v++){const x=pos[v*3],h=pos[v*3+1],z=pos[v*3+2],f=F[v],ny=nrm[v*3+1];const n1=fbm2(x*.03+50,z*.03+50,512,512,3,7),n2=fbm2(x*.11+9,z*.11+9,512,512,2,8);
  let ws=1-smooth(.62,1.15,h);if(h<.25)ws=1;let wr=smooth(.86,.66,ny);if(I.volcano&&f<.36)wr=Math.max(wr,smooth(.36,.24,f));if(key==='frost')wr=Math.max(wr,smooth(.62,.8,n2)*(1-ws)*.6);
  let wd=smooth(.58,.72,n1)*.8;if(key==='moss')wd=smooth(.5,.66,n1);if(key==='ember')wd=.35+.4*n2;let pd=99;for(const sg of paths)pd=Math.min(pd,segDist(x,z,sg[0],sg[1]));const wp=smooth(1.9,.8,pd+(n2-.5)*.8)*(h>.5?1:0);
  wd=Math.max(wd,wp);let wg=1;wr*=1-ws*.7;wd*=(1-ws)*(1-wr);wg=Math.max(0,(1-ws)*(1-wr)-wd);const sum=ws+wg+wr+wd||1;
  spl[v*4]=ws/sum;spl[v*4+1]=wg/sum;spl[v*4+2]=wr/sum;spl[v*4+3]=wd/sum;
  if(wp>.3){spl[v*4+3]=Math.max(spl[v*4+3],wp*.9);}c.copy(cg).lerp(cg2,smooth(.35,.65,n2));c.multiplyScalar(spl[v*4+1]);_c.copy(h<-.2?cu:cs).multiplyScalar(spl[v*4]);c.add(_c);_c.copy(cr).multiplyScalar(spl[v*4+2]);c.add(_c);_c.copy(wp>.3?_cw2.set(key==='frost'?'#c8ccd0':key==='ember'?'#4a403a':'#8a7558'):cd).multiplyScalar(spl[v*4+3]);c.add(_c);
  if(I.volcano&&f<.08)c.lerp(_cw2.set('#2a1e1a'),.8);c.multiplyScalar(.93+n1*.14);col[v*3]=c.r;col[v*3+1]=c.g;col[v*3+2]=c.b;}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('splat',new THREE.BufferAttribute(spl,4));g.computeBoundingSphere();
 const m=new THREE.Mesh(g,makeTerrainMat(TERR_GROUND[key]||TL.grass,key==='frost'));m.receiveShadow=true;m.castShadow=true;return m;}

/* ---------- ocean ---------- */
function oceanDetailTex(){const N=256,r=rng(42),W=[];for(let i=0;i<46;i++){let kx=Math.round((r()*2-1)*14),ky=Math.round((r()*2-1)*14);if(!kx&&!ky)kx=1;W.push([kx,ky,1/Math.pow(Math.hypot(kx,ky),1.35),r()*TAU]);}
 const H=new Float32Array(N*N),DX=new Float32Array(N*N),DY=new Float32Array(N*N);let hmin=1e9,hmax=-1e9,gm=0;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let h=0,dx=0,dy=0;const u=x/N*TAU,v=y/N*TAU;for(const w of W){const p=w[0]*u+w[1]*v+w[3];h+=Math.sin(p)*w[2];const c=Math.cos(p)*w[2];dx+=c*w[0];dy+=c*w[1];}const i=y*N+x;H[i]=h;DX[i]=dx;DY[i]=dy;hmin=Math.min(hmin,h);hmax=Math.max(hmax,h);gm=Math.max(gm,Math.abs(dx),Math.abs(dy));}
 const d1=new Uint8Array(N*N*4),d2=new Uint8Array(N*N*4);
 for(let i=0;i<N*N;i++){const sx=DX[i]/gm,sy=DY[i]/gm;d1[i*4]=Math.round((sx*.5+.5)*255);d1[i*4+1]=Math.round((sy*.5+.5)*255);d1[i*4+2]=Math.round((H[i]-hmin)/(hmax-hmin)*255);d1[i*4+3]=255;
  const nx=-sx*.6,ny=-sy*.6,l=Math.hypot(nx,ny,1);d2[i*4]=(nx/l*.5+.5)*255;d2[i*4+1]=(ny/l*.5+.5)*255;d2[i*4+2]=(1/l*.5+.5)*255;d2[i*4+3]=255;}
 const mk=d=>{const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
 return[mk(d1),mk(d2)];}
const[waterTex,waterNrm]=oceanDetailTex();
const RIP={arr:Array.from({length:8},()=>new THREE.Vector4(0,0,-100,0)),i:0};
function addRipple(x,z,s=1){const v=RIP.arr[RIP.i];v.set(x,z,WIND.uTime.value,s);RIP.i=(RIP.i+1)%8;}
const waterU={uT:WIND.uTime,uAmp:{value:1},uNorm:{value:waterTex},uRefl:{value:null},uTexMat:{value:GFX.texMat},uSky:{value:null},
 uSunDir:{value:new THREE.Vector3(.3,1,.2)},uSunCol:{value:new THREE.Color(1,1,1)},uAmb:{value:new THREE.Color(.5,.6,.7)},uDeep:{value:new THREE.Color('#06283a')},uShal:{value:new THREE.Color('#1c7c80')},uScatter:{value:new THREE.Color('#2fb6a0')},
 uFogC:{value:new THREE.Color()},uFogN:{value:80},uFogF:{value:380},uFoamK:{value:0},uSpark:{value:1},
 uIsl:{value:ISL.map(k=>new THREE.Vector4(ZONES[k].x,ZONES[k].z,ZONES[k].R,ZONES[k].p1))},uIsl2:{value:ISL.map(k=>new THREE.Vector2(ZONES[k].p2,0))},uSand:{value:ISL.map(k=>new THREE.Color(ZONES[k].sand))},uRip:{value:RIP.arr},uRain:{value:0},uBio:{value:0}};
const GLSL_SHORE=`float shoreDamp(vec2 p){float d=1.;for(int i=0;i<4;i++){vec2 o=p-uIsl[i].xy;float th=atan(o.y,o.x);float R=uIsl[i].z*(1.+.09*sin(3.*th+uIsl[i].w)+.05*sin(5.*th+uIsl2[i].x));d=min(d,mix(.28,1.,smoothstep(.92,1.75,length(o)/R)));}return d;}`;
const waterMat=new THREE.ShaderMaterial({uniforms:waterU,fog:false,
 vertexShader:`uniform float uT;uniform float uAmp;uniform vec4 uIsl[4];uniform vec2 uIsl2[4];varying vec3 vW;varying float vDamp;varying float vH;
  ${GLSL_WAVES}
  ${GLSL_SHORE}
  void main(){vec4 w=modelMatrix*vec4(position,1.);float dm=shoreDamp(w.xz);vDamp=dm;float h=wvH(w.xz,uT)*uAmp*dm;vH=h;w.y+=h;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uT;uniform float uAmp;uniform sampler2D uNorm;uniform sampler2D uRefl;uniform mat4 uTexMat;uniform samplerCube uSky;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uAmb;
  uniform vec3 uDeep;uniform vec3 uShal;uniform vec3 uScatter;uniform vec3 uFogC;uniform float uFogN;uniform float uFogF;uniform float uFoamK;uniform float uSpark;
  uniform vec4 uIsl[4];uniform vec2 uIsl2[4];uniform vec3 uSand[4];uniform vec4 uRip[8];uniform float uRain;uniform float uBio;varying vec3 vW;varying float vDamp;varying float vH;
  ${GLSL_WAVES}
  float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec2 p=vW.xz;float t=uT;float dist=length(cameraPosition-vW);float near=1.-smoothstep(25.,200.,dist);float A=uAmp*vDamp;
   vec3 hd=wvHD(p,t)*A;vec3 hf=wvHDfine(p,t)*A*(.25+.75*near);vec2 grad=hd.yz+hf.yz;vec3 n=normalize(vec3(-grad.x,1.,-grad.y));
   vec2 d1=texture2D(uNorm,p*.043+vec2(t*.013,t*.008)).xy*2.-1.,d2=texture2D(uNorm,p*.107-vec2(t*.011,-t*.017)).xy*2.-1.,d3=texture2D(uNorm,p*.29+vec2(-t*.031,t*.024)).xy*2.-1.;
   vec2 dd=(d1*.5+d2*.38+d3*.3*near)*(.16+.08*uRain+.05*uAmp)*mix(.75,1.,near);float foamR=0.;
   for(int i=0;i<8;i++){vec4 r=uRip[i];float age=t-r.z;if(age<0.||age>3.2)continue;vec2 o=p-r.xy;float rr=length(o);float R=age*2.3+.15;float ring=exp(-pow((rr-R)*2.6,2.))*(1.-age/3.2)*r.w;dd+=normalize(o+1e-4)*ring*.45*cos((rr-R)*7.);foamR+=ring*.3;}
   if(uRain>.01&&near>0.){vec2 cp=p*.55;vec2 cl=floor(cp);vec2 fr=fract(cp)-.5;float h=hsh(cl);vec2 off=(vec2(hsh(cl+3.1),hsh(cl+7.7))-.5)*.5;float ph=fract(t*.85+h);float rr=length(fr-off)*2.;float ring=exp(-pow((rr-ph*.95)*12.,2.))*(1.-ph)*uRain*near;dd+=normalize(fr-off+1e-4)*ring*.3;foamR+=ring*.22;}
   vec3 nD=normalize(n+vec3(dd.x,0.,dd.y));
   float dep=100.;vec3 sandC=vec3(.8,.7,.55);
   for(int i=0;i<4;i++){vec2 o=p-uIsl[i].xy;float th=atan(o.y,o.x);float R=uIsl[i].z*(1.+.09*sin(3.*th+uIsl[i].w)+.05*sin(5.*th+uIsl2[i].x));float f=length(o)/R;if(f<1.45){float h=f<.8?.6:(f<1.?mix(.6,-.4,(f-.8)/.2):mix(-.4,-7.,clamp((f-1.)/.4,0.,1.)));float d=vW.y-h;if(d<dep){dep=d;sandC=uSand[i];}}}
   vec3 v=normalize(cameraPosition-vW);float NdV=max(dot(nD,v),0.);float F=.02+.98*pow(1.-NdV,5.);F=min(F,mix(.3,.58,near));
   vec3 rd=reflect(-v,nD);rd.y=max(abs(rd.y),.12+.1*(1.-near));rd=normalize(rd);vec3 refl=textureCube(uSky,rd).rgb;
   #ifdef PLANAR
    vec4 pc=uTexMat*vec4(vW.x,0.,vW.z,1.);pc.xy+=nD.xz*pc.w*.07;vec3 rc=texture2DProj(uRefl,pc).rgb;refl=mix(refl,rc,.92);
   #endif
   float sunUp=clamp(uSunDir.y*4.,0.,1.);
   float shallow=exp(-max(dep,0.)*.55);vec3 body=mix(uDeep,uShal,shallow);
   vec3 lit=body*(uAmb*1.15+uSunCol*(.14+.36*max(dot(n,uSunDir),0.)));
   lit=mix(lit,sandC*(uAmb*.5+uSunCol*.3*max(uSunDir.y,0.)),smoothstep(1.2,0.,dep)*.5);
   float cs=texture2D(uNorm,p*.13+vec2(t*.02,t*.015)).b*texture2D(uNorm,p*.1-vec2(t*.017,-t*.011)).b;lit+=uSunCol*pow(cs*2.,4.)*smoothstep(2.4,.15,dep)*.12*sunUp;
   float crest=clamp(vH/(.7*A+.02),0.,1.);float sss=pow(clamp(dot(v,-uSunDir)*.5+.5,0.,1.),4.)*crest;lit+=uScatter*uSunCol*sss*.22*sunUp;lit+=uScatter*uAmb*crest*.08;
   vec3 col=mix(lit,refl,F);
   vec3 hv=normalize(uSunDir+v);float NH=max(dot(nD,hv),0.);float ro=mix(.045,.11,1.-near)+.03*uRain;float a2=ro*ro;float dn=NH*NH*(a2-1.)+1.;float D=a2/(3.14159*dn*dn);
   float Fh=.02+.98*pow(1.-max(dot(hv,v),0.),5.);col+=uSunCol*D*Fh*.22*uSpark*smoothstep(-.02,.06,uSunDir.y);
   float nz=texture2D(uNorm,p*.09+vec2(t*.02,0.)).b,f2=texture2D(uNorm,p*.37+vec2(0.,t*.03)).b;
   float fl=smoothstep(.35,.02,dep+(nz-.5)*.4);float bands=smoothstep(.82,1.,sin(dep*3.4-t*1.3+nz*3.))*smoothstep(1.5,.2,dep);
   float caps=smoothstep(.55,.95,crest)*uFoamK*smoothstep(.4,.7,nz);
   float foam=clamp((fl+bands*.6+foamR+caps)*smoothstep(.15,.55,f2+.25),0.,1.);
   col=mix(col,(uAmb+uSunCol*max(uSunDir.y,0.)*.55)*.9,foam*.9);
   if(uBio>.001){float sp=smoothstep(.9,1.,texture2D(uNorm,p*.83+vec2(t*.06,-t*.05)).b)*smoothstep(.7,1.,texture2D(uNorm,p*.41-vec2(t*.03,t*.02)).b);col+=vec3(.12,1.,.78)*uBio*(foam*1.5+sp*3.5*near+foamR*2.5+crest*.08);}
   col=mix(col,uFogC,smoothstep(uFogN,uFogF*1.15,dist)*.92);
   gl_FragColor=vec4(col,1.);`+OUT_CHUNKS+`}`});
let water=null;
function buildWater(){if(water){scene.remove(water);water.geometry.dispose();}const t=TT(),R=t.wr,S=t.ws,maxR=1100;const P=[],I=[];
 for(let i=0;i<=R;i++){const r=maxR*Math.pow(i/R,2.35);for(let j=0;j<S;j++){const a=j/S*TAU;P.push(Math.cos(a)*r,0,Math.sin(a)*r);}}
 for(let i=0;i<R;i++)for(let j=0;j<S;j++){const a=i*S+j,b=i*S+(j+1)%S,c=(i+1)*S+j,d=(i+1)*S+(j+1)%S;I.push(a,b,c,b,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);
 water=new THREE.Mesh(g,waterMat);water.userData.cell=1;water.userData.noAO=true;water.frustumCulled=false;scene.add(water);
 const planar=!!GFX.refl;const has='PLANAR' in waterMat.defines;if(planar!==has){if(planar)waterMat.defines.PLANAR='';else delete waterMat.defines.PLANAR;waterMat.needsUpdate=true;}waterU.uRefl.value=GFX.refl?GFX.refl.texture:null;}

/* ---------- props ---------- */
const BARK='#6b5644';
/* faceted canopies: clusters of low-poly blobs, darker underneath, swaying in the wind */
function canopy(fb,x,y,z,s,cols,r,n=6,spread=1){fb.M(TL.plain);fb.gr={b:y-1.2*s,h:2.6*s,k:.55};for(let i=0;i<n;i++){const a=i/n*TAU+r()*.6,d=(i?.7+r()*.6:0)*s*spread,yy=y+(i?(r()-.3)*.9:.35)*s,sc=(i?.85+r()*.5:1.35)*s;
  fb.sw={a:.35,b:y-1.5*s,h:3*s};fb.add(r()<.3?G.ico:G.ico1,pick(cols),x+Math.cos(a)*d,yy,z+Math.sin(a)*d,sc*1.1,sc*.82,sc,r()*.4,r()*3,r()*.4,null,.08);}fb.gr=null;fb.sw=null;}
function roundTree(sb,fb,x,y,z,s,leaf,leaf2,r){sb.M(TL.bark);const h=2.5*s,lean=r()*TAU;const p0=V(x,y-.3,z),top=V(x+Math.cos(lean)*.3*s,y+h,z+Math.sin(lean)*.3*s);
 sb.seg(G.cylT,BARK,p0,top,.32*s);for(let i=0;i<3;i++){const a=i/3*TAU+r(),b0=p0.clone().lerp(top,.6+r()*.3),b1=b0.clone().add(V(Math.cos(a)*1.1*s,(.7+r()*.5)*s,Math.sin(a)*1.1*s));sb.seg(G.cylT,BARK,b0,b1,.11*s);}
 for(let i=0;i<3;i++){const a=i/3*TAU+r();sb.seg(G.cone,BARK,V(x,y+.2*s,z),V(x+Math.cos(a)*.6*s,y-.12,z+Math.sin(a)*.6*s),.14*s);}
 const c2=new THREE.Color(leaf).lerp(new THREE.Color('#c8c070'),.18).getStyle();canopy(fb,top.x,top.y+.7*s,top.z,s,[leaf,leaf2,c2],r,6+(r()*3|0));sb.M(0);}
function frond(fb,top,ang,len,droop,w,c0,c1){const N=6,P=[],dir=new THREE.Vector3(Math.cos(ang),0,Math.sin(ang)),perp=new THREE.Vector3(-dir.z,0,dir.x),ca=new THREE.Color(c0),cb=new THREE.Color(c1),col=new THREE.Color();
 for(let i=0;i<=N;i++){const t=i/N;const c=top.clone().addScaledVector(dir,len*t);c.y+=len*(.38*t-(droop+.38)*t*t);const ww=w*Math.sin(Math.PI*Math.min(t*1.1+.05,1))*(1-t*.35);
  P.push({c:c.clone().setY(c.y+ww*.18),l:c.clone().addScaledVector(perp,-ww).setY(c.y-ww*.3),r:c.clone().addScaledVector(perp,ww).setY(c.y-ww*.3),s:.35+t});}
 fb.M(TL.plain);for(let i=0;i<N;i++){const A=P[i],B=P[i+1];col.copy(ca).lerp(cb,i/N);fb.tri(A.c,A.l,B.c,col,A.s,A.s,B.s);fb.tri(A.l,B.l,B.c,col,A.s,B.s,B.s);col.multiplyScalar(.86);fb.tri(A.c,B.c,A.r,col,A.s,B.s,A.s);fb.tri(A.r,B.c,B.r,col,A.s,B.s,B.s);
  fb.tri(A.c,B.c,A.l,col,A.s,B.s,A.s);fb.tri(A.l,B.c,B.l,col,A.s,B.s,B.s);fb.tri(A.c,A.r,B.c,col,A.s,A.s,B.s);fb.tri(A.r,B.r,B.c,col,A.s,B.s,B.s);}}
function palm(sb,fb,x,y,z,s,r){sb.M(TL.bark);const lean=r()*TAU,lx=Math.cos(lean),lz=Math.sin(lean),bend=.12+r()*.12;let p0=V(x,y-.3,z);
 for(let i=0;i<7;i++){const p1=p0.clone().add(V(lx*bend*i*s*.45,.9*s,lz*bend*i*s*.45));const rr=.26*s*(1-i*.06);sb.seg(G.cylT,i%2?'#a6845a':'#937048',p0,p1,rr);p0=p1;}
 const n=9;for(let k=0;k<n;k++){const a=k/n*TAU+r()*.3;frond(fb,p0,a,3*s*(.85+r()*.3),.7+r()*.35,.5*s,'#4a6e34','#7a9650');}
 sb.M(TL.plain);for(let k=0;k<3;k++){const a=k/3*TAU;sb.add(G.ico,'#5a4026',p0.x+Math.cos(a)*.28*s,p0.y-.3*s,p0.z+Math.sin(a)*.28*s,.2*s,.22*s,.2*s);}sb.M(0);}
function pine(sb,fb,x,y,z,s,snow,r){sb.M(TL.bark);sb.add(G.cylT,'#5e4634',x,y+1*s,z,.26*s,2.2*s,.26*s);fb.M(TL.plain);fb.sw={a:.22,b:y+1*s,h:5*s};
 [[2.1,2.1,1],[1.75,1.9,2.1],[1.4,1.7,3.1],[1,1.5,4],[.6,1.2,4.8]].forEach((c,i)=>{const ry=r()*3;fb.add(G.cone,i%2?'#33523c':'#3b5c44',x,y+(c[2]+c[1]/2)*s,z,c[0]*s,c[1]*s,c[0]*s,0,ry,0,null,.07);
  if(snow){fb.M(TL.snow);fb.add(G.cone,'#eef4fa',x,y+(c[2]+c[1]*.78)*s,z,c[0]*.62*s,c[1]*.46*s,c[0]*.62*s,0,ry,0,null,.03);fb.M(TL.plain);}});fb.sw=null;sb.M(0);}
function willow(sb,fb,x,y,z,s,r){sb.M(TL.bark);const top=V(x,y+2.5*s,z);sb.seg(G.cylT,'#4f3e2c',V(x,y-.3,z),top,.44*s);for(let i=0;i<4;i++){const a=i/4*TAU+r();sb.seg(G.cylT,'#4f3e2c',top,top.clone().add(V(Math.cos(a)*1.3*s,.8*s,Math.sin(a)*1.3*s)),.14*s);}
 canopy(fb,x,y+3.4*s,z,s*1.1,['#4f8538','#5a9040','#6a9a48'],r,7,1.3);fb.M(TL.plain);fb.sw={a:.9,b:y+3.4*s,h:-2.2*s};
 for(let i=0;i<16;i++){const a=i/16*TAU+r()*.2,rr=(1.9+r()*.4)*s;fb.add(G.box,i%2?'#6a9a48':'#5a8c3e',x+Math.cos(a)*rr,y+2.3*s,z+Math.sin(a)*rr,.16*s,2.1*s,.16*s,0,a,0,null,.06);}fb.sw=null;sb.M(0);}
function bush(fb,x,y,z,s,cols,r,flowers){fb.M(TL.plain);fb.gr={b:y,h:1.4*s,k:.5};fb.sw={a:.18,b:y,h:1.5*s};const n=2+(r()*3|0);for(let i=0;i<n;i++){const a=r()*TAU,d=r()*.5*s;fb.add(G.ico1,pick(cols),x+Math.cos(a)*d,y+(.35+r()*.25)*s,z+Math.sin(a)*d,(.55+r()*.3)*s,(.42+r()*.2)*s,(.55+r()*.3)*s,0,r()*3,0,null,.08);}
 if(flowers)for(let i=0;i<5;i++){const a=r()*TAU;fb.add(G.ico,flowers,x+Math.cos(a)*.5*s,y+(.6+r()*.3)*s,z+Math.sin(a)*.5*s,.08,.08,.08);}fb.gr=null;fb.sw=null;}
function fern(fb,x,y,z,s,col,r){fb.M(TL.plain);const c=new THREE.Color(col);for(let i=0;i<6;i++){const a=i/6*TAU+r()*.4,l=(.7+r()*.4)*s;const b=V(x,y+.05,z),m=V(x+Math.cos(a)*l*.55,y+.45*s,z+Math.sin(a)*l*.55),t=V(x+Math.cos(a)*l,y+.15*s,z+Math.sin(a)*l),p=V(-Math.sin(a)*.14*s,0,Math.cos(a)*.14*s);
 fb.tri(b,m.clone().add(p),t,c,0,.6,1);fb.tri(b,t,m.clone().sub(p),c,0,1,.6);fb.tri(b,t,m.clone().add(p),c,0,1,.6);fb.tri(b,m.clone().sub(p),t,c,0,.6,1);}}
function driftLog(sb,x,y,z,s,r){sb.M(TL.wood);const a=r()*TAU,l=(1.6+r()*1.4)*s,dx=Math.cos(a)*l/2,dz=Math.sin(a)*l/2;sb.seg(G.cyl,'#a89c8a',V(x-dx,y+.15*s,z-dz),V(x+dx,y+.18*s,z+dz),.16*s);sb.seg(G.cyl,'#a09482',V(x+dx*.3,y+.2*s,z+dz*.3),V(x+dx*.3-dz*.4,y+.5*s,z+dz*.3+dx*.4),.06*s);sb.M(0);}
function shell(sb,x,y,z,r){sb.M(TL.plain);if(r()<.5)sb.add(G.cone4,pick(['#f0dccc','#e8c8b0','#f4e8de']),x,y+.04,z,.12,.08,.12,Math.PI/2,r()*3,0);
 else{const c=pick(['#e8805a','#d86a6a','#f0a060']);for(let i=0;i<5;i++){const a=i/5*TAU;sb.add(G.box,c,x+Math.cos(a)*.09,y+.03,z+Math.sin(a)*.09,.16,.03,.05,0,-a,0);}}sb.M(0);}
function fence(sb,a,b,col='#8a7458'){sb.M(TL.wood);const d=a.distanceTo(b),n=Math.max(1,Math.round(d/2.2));for(let i=0;i<=n;i++){const p=a.clone().lerp(b,i/n);sb.add(G.box,col,p.x,p.y+.5,p.z,.14,1.1,.14);}
 const ya=a.clone().setY(a.y+.75),yb=b.clone().setY(b.y+.75);sb.seg(G.box,col,ya,yb,.06,.1);ya.y-=.35;yb.y-=.35;sb.seg(G.box,col,ya,yb,.06,.1);sb.M(0);}
function bench(sb,x,y,z,ry){sb.M(TL.wood);const P=new THREE.Matrix4().compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),V(1,1,1));sb.add(G.box,'#9a7a52',0,.48,0,1.8,.08,.5,0,0,0,P);sb.add(G.box,'#9a7a52',0,.8,-.24,1.8,.36,.06,-.15,0,0,P);
 sb.M(TL.metal);for(const s of[-1,1])sb.add(G.box,'#2c3036',s*.75,.24,0,.08,.48,.46,0,0,0,P);sb.M(0);}
function dryRack(sb,x,y,z,ry,r){sb.M(TL.wood);const P=new THREE.Matrix4().compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),V(1,1,1));for(const s of[-1,1])sb.add(G.box,'#7a6248',s*1.1,.9,0,.1,1.8,.1,0,0,s*.08,P);sb.add(G.box,'#7a6248',0,1.75,0,2.4,.08,.08,0,0,0,P);
 sb.M(TL.plain);for(let i=0;i<5;i++){const c=pick(['#7a8a96','#a8907a','#8a9a7a']);sb.add(G.oct,c,-.8+i*.4,1.35,0,.08,.32,.03,0,0,0,P);}sb.M(0);}
function crabPot(sb,x,y,z,r){sb.M(TL.cloth);const ry=r()*3;sb.add(G.box,'#a89a72',x,y+.25,z,.8,.5,.6,0,ry);sb.M(TL.wood);sb.add(G.box,'#6a5640',x,y+.02,z,.84,.05,.64,0,ry);sb.M(0);}
function campfire(sb,gl,x,y,z){sb.M(TL.rock);for(let i=0;i<8;i++){const a=i/8*TAU;sb.add(pick(G.pebbles),'#7a7670',x+Math.cos(a)*.75,y+.1,z+Math.sin(a)*.75,.22,.16,.22);}sb.M(TL.wood);for(let i=0;i<4;i++){const a=i/4*TAU+.4;sb.seg(G.cyl,'#4a3626',V(x+Math.cos(a)*.5,y+.05,z+Math.sin(a)*.5),V(x,y+.45,z),.06);}
 gl.add(G.cone,'#ff9a3a',x,y+.35,z,.28,.6,.28);gl.add(G.cone,'#ffd27a',x,y+.3,z,.15,.4,.15);halo(x,y+.5,z,4,0xff9a50).userData.always=true;world.lamps.push(V(x,y+.8,z));sb.M(0);}
function pillar(sb,x,y,z,h,broken,r){sb.M(TL.cobble);sb.add(G.cyl6,'#8e8a84',x,y+.15,z,.75,.3,.75);sb.add(G.cyl6,'#9a968e',x,y+h/2+.3,z,.5,h,.5,0,r()*.3,0);if(!broken)sb.add(G.box,'#8e8a84',x,y+h+.4,z,1.1,.22,1.1);else sb.add(G.cyl6,'#9a968e',x+.8,y+.25,z+.3,.45,1.2,.45,Math.PI/2,r(),0);sb.M(0);}
function iceSpike(sb,x,y,z,s,r){sb.M(TL.ice);for(let i=0;i<3;i++){const a=r()*TAU;sb.add(G.cone,i?'#cfeaf6':'#b6dff2',x+Math.cos(a)*.5*s*i,y+1.2*s*(1-i*.25),z+Math.sin(a)*.5*s*i,.45*s*(1-i*.25),2.6*s*(1-i*.3),.45*s*(1-i*.25),(r()-.5)*.3,r()*3,(r()-.5)*.3);}sb.M(0);}
function igloo(sb,x,y,z,ry){sb.M(TL.snow);sb.add(G.hemi,'#eef4fa',x,y-.1,z,2.2,1.9,2.2);const P=new THREE.Matrix4().compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),V(1,1,1));sb.add(G.box,'#e6eef6',0,.55,2.1,1.1,1.1,1.4,0,0,0,P);sb.M(TL.plain);sb.add(G.box,'#2a3440',0,.5,2.81,.7,.8,.04,0,0,0,P);sb.M(0);}
function obsidian(sb,x,y,z,s,r){sb.M(TL.metal);for(let i=0;i<3;i++)sb.add(G.oct,'#1a1620',x+(r()-.5)*s,y+.5*s,z+(r()-.5)*s,.3*s,(.9+r()*.8)*s,.3*s,(r()-.5)*.6,r()*3,(r()-.5)*.6);sb.M(0);}
function lighthouse(sb,gl,x,y,z){sb.M(TL.cobble);sb.add(G.cyl6,'#8e8a84',x,y+.4,z,3.2,1,3.2);sb.M(TL.paint);const H=15;for(let i=0;i<5;i++){const y0=y+.9+i*H/5,r0=2.1-i*.24;sb.add(G.cylT,i%2?'#c8483c':'#f0ece4',x,y0+H/10,z,r0,H/5,r0);}
 sb.M(TL.metal);sb.add(G.cyl,'#2c3036',x,y+H+1.05,z,1.7,.18,1.7);for(let i=0;i<10;i++){const a=i/10*TAU;sb.add(G.box,'#2c3036',x+Math.cos(a)*1.55,y+H+1.55,z+Math.sin(a)*1.55,.06,.9,.06);}
 gl.add(G.cyl,'#ffe8b0',x,y+H+2,z,.9,1.6,.9);sb.add(G.cone,'#8a3a32',x,y+H+3.4,z,1.3,1.3,1.3);sb.add(G.ico,'#2c3036',x,y+H+4.1,z,.18,.18,.18);
 world.lighthouse={x,y:y+H+2,z};world.colliders.push({x,z,r:3.4});halo(x,y+H+2,z,7,0xffe2a8).userData.always=true;sb.M(0);}
function shipwreck(sb,x,z,ry){const P=new THREE.Matrix4().compose(V(x,-1.6,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(.18,ry,.35)),V(1,1,1));sb.M(TL.wood);
 for(let i=0;i<9;i++){const zz=-6+i*1.5,w=2.6*Math.sin(Math.PI*(i+.6)/9.6);for(const s of[-1,1]){sb.add(G.box,i%3?'#5e4e3e':'#4e4034',s*w,.6,zz,.22,2.6,1.4,0,0,s*.2,P);}sb.add(G.box,'#4a3c30',0,-.6,zz,w*1.6,.22,1.4,0,0,0,P);}
 sb.add(G.cyl,'#4e4034',0,3.6,-1,.22,7,.22,.3,0,.2,P);sb.add(G.box,'#5e4e3e',0,1.6,5.5,1.6,.2,2.6,.2,0,0,P);sb.M(0);world.seaRocks.push({x,z,r:6.5});}
function mushroom(sb,gl,x,y,z,s,cap){sb.M(TL.plain);sb.add(G.cylT,'#e8e0cc',x,y+.8*s,z,.33*s,1.6*s,.33*s);sb.add(G.hemi,cap,x,y+1.52*s,z,1.3*s,.8*s,1.3*s);sb.add(G.cyl12,'#d8cbb0',x,y+1.52*s,z,1.22*s,.06*s,1.22*s);
 for(let i=0;i<5;i++){const a=i/5*TAU+.4;gl.add(G.sph,'#fff6d8',x+Math.cos(a)*.75*s,y+1.95*s,z+Math.sin(a)*.75*s,.16*s,.1*s,.16*s);}sb.M(0);}
function deadTree(sb,x,y,z,s,r){sb.M(TL.bark);const c='#2e2624',top=V(x,y+3.2*s,z);sb.seg(G.cylT,c,V(x,y-.3,z),top,.26*s);
 for(let i=0;i<4;i++){const a=i/4*TAU+r(),b0=V(x,y+(1.6+r()*1.4)*s,z),b1=b0.clone().add(V(Math.cos(a)*1.3*s,(.6+r()*.7)*s,Math.sin(a)*1.3*s));sb.seg(G.cylT,c,b0,b1,.09*s);sb.seg(G.cylT,c,b1,b1.clone().add(V(Math.cos(a+.7)*.6*s,.5*s,Math.sin(a+.7)*.6*s)),.045*s);}sb.M(0);}
function basalt(sb,x,y,z,s){sb.M(TL.rock);const n=3+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const h=(1.5+Math.random()*3)*s;sb.add(G.cyl6,i%2?'#3a3434':'#463e3c',x+(Math.random()-.5)*1.6*s,y+h/2-.2,z+(Math.random()-.5)*1.6*s,.6*s,h,.6*s,0,Math.random());}sb.M(0);}
function rock(sb,x,y,z,s,col,moss){const g=pick(s<.6?G.pebbles:G.rocks),ry=Math.random()*3;sb.M(TL.rock);if(moss)sb.top={c:new THREE.Color(moss),lo:.35,hi:.8};sb.add(g,col,x,y+.12*s,z,1.25*s,.85*s,s,0,ry,0,null,.02);sb.top=null;sb.M(0);}
function crystal(sb,gl,x,y,z,s){sb.M(TL.ice);for(let i=0;i<3;i++)sb.add(G.oct,i?'#b4e4f6':'#94cff0',x+(i-1)*.5*s,y+.9*s,z+(i%2)*.4*s,.35*s,1.3*s*(1-i*.15),.35*s,(i-1)*.3,0,(i-1)*.35);gl.add(G.oct,'#bfefff',x,y+.9*s,z+.15*s,.15*s,.6*s,.15*s);sb.M(0);}
function snowman(sb,x,y,z){sb.M(TL.snow);sb.add(G.sph,'#f4f9ff',x,y+.8,z,.9,.85,.9);sb.add(G.sph,'#f4f9ff',x,y+2,z,.65,.6,.65);sb.add(G.sph,'#f4f9ff',x,y+2.9,z,.45,.45,.45);
 sb.M(TL.plain);sb.add(G.cone,'#e8782a',x,y+2.9,z+.55,.08,.45,.08,Math.PI/2);sb.M(TL.cloth);sb.add(G.cyl,'#2a2e38',x,y+3.45,z,.35,.5,.35);sb.add(G.cyl12,'#b8463a',x,y+2.45,z,.55,.18,.55);sb.M(0);}
function halo(x,y,z,size=3.2,col=0xffd9a0){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.halo,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.2}));s.position.set(x,y,z);s.scale.set(size,size,1);scene.add(s);world.halos.push(s);reflHide.push(s);return s;}
function lamp(sb,gl,x,y,z){sb.M(TL.metal);const c='#2c3036';sb.add(G.cyl,c,x,y+1.6,z,.08,3.2,.08);sb.add(G.cyl,c,x,y+.12,z,.2,.24,.2);sb.add(G.box,c,x,y+3.25,z,.54,.08,.54);
 for(const sx of[-1,1])for(const sz of[-1,1])sb.add(G.box,c,x+sx*.2,y+3.55,z+sz*.2,.04,.5,.04);gl.add(G.box,'#ffd890',x,y+3.55,z,.34,.46,.34);sb.add(G.cone4,c,x,y+3.98,z,.42,.32,.42,0,Math.PI/4);sb.add(G.sph,c,x,y+4.18,z,.06,.06,.06);
 halo(x,y+3.55,z,2.2);world.lamps.push(V(x,y+3.4,z));sb.M(0);}
function crate(sb,x,y,z,s=1){const ry=Math.random();sb.M(TL.wood);sb.add(G.box,'#a87a4c',x,y+.5*s,z,s,s,s,0,ry);sb.add(G.box,'#8a6038',x,y+.5*s,z,s*1.02,s*.14,s*1.02,0,ry);sb.add(G.box,'#8a6038',x,y+.5*s,z,s*1.02,s*1.02,s*.14,0,ry);sb.M(0);}
function barrel(sb,x,y,z){sb.M(TL.wood);sb.add(G.cyl12,'#8a5a36',x,y+.55,z,.45,1.1,.45);sb.add(G.cyl12,'#8a5a36',x,y+.55,z,.49,.6,.49);sb.M(TL.metal);sb.add(G.cyl12,'#3a3a40',x,y+.22,z,.475,.07,.475);sb.add(G.cyl12,'#3a3a40',x,y+.88,z,.475,.07,.475);sb.M(0);}
function house(sb,gl,x,y,z,ry,H,style){const P=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1));
 const L=style.stilt?1.2:0,W=7,D=6,WH=3.8,trim=H.trim||'#efe6d6',hut=!!style.stilt;
 if(hut){sb.M(TL.wood);[[-3,-2.6],[3,-2.6],[-3,2.6],[3,2.6],[0,-2.6],[0,2.6]].forEach(p=>sb.add(G.cyl,'#5a4a32',p[0],.3,p[1],.22,2.6,.22,0,0,0,P));sb.add(G.box,'#7a5a3a',0,L+.05,4,2.2,.2,2.4,0,0,0,P);sb.add(G.box,'#6e5236',0,L-.02,0,W+.4,.22,D+.4,0,0,0,P);}
 else{sb.M(TL.cobble);sb.add(G.box,'#8e8c88',0,.05,0,W+.5,.7,D+.5,0,0,0,P);}
 sb.M(hut?TL.wood:TL.siding);sb.add(G.box,H.wall,0,L+.3+WH/2,0,W,WH,D,0,0,0,P,.01);
 sb.M(TL.paint);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(c=>sb.add(G.box,trim,c[0]*W/2,L+.3+WH/2,c[1]*D/2,.3,WH+.1,.3,0,0,0,P,.01));sb.add(G.box,trim,0,L+.36,0,W+.1,.14,D+.1,0,0,0,P,.01);
 const ang=.62,hy=L+.3+WH,rl=(D/2+.7)/Math.cos(ang);sb.M(hut?TL.thatch:TL.roof);const rc=hut?'#b09a6a':H.roof;
 sb.add(G.box,rc,0,hy+Math.sin(ang)*rl/2-.05,D/4+.35,W+1.2,hut?.42:.24,rl,ang,0,0,P,.01);sb.add(G.box,rc,0,hy+Math.sin(ang)*rl/2-.05,-D/4-.35,W+1.2,hut?.42:.24,rl,-ang,0,0,P,.01);
 sb.M(TL.paint);sb.add(G.box,hut?'#8a7448':trim,0,hy+Math.tan(ang)*(D/2+.35)-.02,0,W+1.3,.2,.3,0,0,0,P,.01);
 const gh=Math.tan(ang)*D/2,_a=new THREE.Vector3(),_b=new THREE.Vector3(),_cc=new THREE.Vector3(),wc=new THREE.Color(H.wall).multiplyScalar(.95);sb.M(hut?TL.wood:TL.siding);
 for(const sx of[-1,1]){_a.set(sx*W/2,hy,-D/2).applyMatrix4(P);_b.set(sx*W/2,hy,D/2).applyMatrix4(P);_cc.set(sx*W/2,hy+gh,0).applyMatrix4(P);if(sx>0)sb.tri(_a,_cc,_b,wc);else sb.tri(_a,_b,_cc,wc);}
 if(style.snow){sb.M(TL.snow);sb.add(G.box,'#f2f6fb',0,hy+Math.sin(ang)*rl/2+.15,D/4+.35,W+1.25,.14,rl*.9,ang,0,0,P);sb.add(G.box,'#f2f6fb',0,hy+Math.sin(ang)*rl/2+.15,-D/4-.35,W+1.25,.14,rl*.9,-ang,0,0,P);}
 sb.M(TL.paint);sb.add(G.box,'#5e3e2a',0,L+1.5,D/2+.02,1.5,2.4,.16,0,0,0,P);sb.add(G.box,trim,0,L+2.78,D/2+.05,1.85,.2,.22,0,0,0,P);sb.add(G.box,trim,-.8,L+1.5,D/2+.05,.16,2.5,.2,0,0,0,P);sb.add(G.box,trim,.8,L+1.5,D/2+.05,.16,2.5,.2,0,0,0,P);
 sb.M(TL.metal);sb.add(G.sph,'#c8a24a',.5,L+1.45,D/2+.15,.07,.07,.07,0,0,0,P);
 for(const sx of[-1,1]){gl.add(G.box,'#ffe2a0',sx*2.2,L+2.3,D/2+.02,1.1,1,.1,0,0,0,P);sb.M(TL.paint);sb.add(G.box,trim,sx*2.2,L+2.3,D/2+.07,1.3,.1,.14,0,0,0,P);sb.add(G.box,trim,sx*2.2,L+2.3,D/2+.07,.08,1.15,.14,0,0,0,P);
  sb.add(G.box,trim,sx*2.2,L+2.88,D/2+.07,1.36,.12,.18,0,0,0,P);sb.add(G.box,H.roof,sx*2.2-sx*.78,L+2.3,D/2+.08,.42,1.15,.08,0,0,0,P);sb.M(TL.wood);sb.add(G.box,'#8a6238',sx*2.2,L+1.62,D/2+.3,1.3,.3,.4,0,0,0,P);sb.M(TL.plain);
  for(let k=0;k<3;k++)sb.add(G.sph,pick(['#e86a84','#f2c04a','#f4f0ea','#a888e8']),sx*2.2+(k-1)*.38,L+1.88,D/2+.3,.15,.13,.15,0,0,0,P);
  gl.add(G.box,'#ffe2a0',sx*W/2+sx*.02,L+2.3,0,.1,1,1.1,0,0,0,P);}
 sb.M(TL.cloth);for(let i=0;i<6;i++)sb.add(G.box,i%2?'#f0ece4':H.roof,-W/2-.1+(i+.5)*(W+.2)/6,L+3.55,D/2+.75,(W+.2)/6,.06,1.4,.34,0,0,P,.01);
 sb.M(TL.cobble);sb.add(G.box,'#7a6e66',2.1,hy+gh*.55+.6,-1,.7,1.9,.7,0,0,0,P);sb.add(G.box,'#5e524c',2.1,hy+gh*.55+1.55,-1,.85,.2,.85,0,0,0,P);
 const ch=new THREE.Vector3(2.1,hy+gh*.55+1.7,-1).applyMatrix4(P);world.chimneys.push(ch);
 const lp=new THREE.Vector3(1.3,L+2.7,D/2+.45).applyMatrix4(P);gl.add(G.box,'#ffd890',lp.x,lp.y,lp.z,.26,.34,.26);halo(lp.x,lp.y,lp.z,2.6);world.lamps.push(lp.clone());
 sb.M(TL.wood);sb.add(G.box,'#b08a58',0,L+.95,D/2+1.6,3.4,.12,.9,0,0,0,P);sb.add(G.box,'#9a764a',0,L+.45,D/2+1.6,3.2,.9,.8,0,0,0,P);sb.M(0);}

/* ---------- labels ---------- */
function rrect(x,X,y,w,h,r){x.beginPath();x.moveTo(X+r,y);x.arcTo(X+w,y,X+w,y+h,r);x.arcTo(X+w,y+h,X,y+h,r);x.arcTo(X,y+h,X,y,r);x.arcTo(X,y,X+w,y,r);x.closePath();}
function nameTex(name,sub,dot){const c=document.createElement('canvas');c.width=512;c.height=sub?150:112;const x=c.getContext('2d');x.font='600 54px Manrope, sans-serif';let tw=Math.min(x.measureText(name).width,400);
 if(sub){x.font='800 30px Manrope, sans-serif';tw=Math.max(tw,Math.min(x.measureText(sub).width,400));x.font='600 54px Manrope, sans-serif';}
 const w=Math.min(500,tw+(dot?92:60)),X=(512-w)/2,h=sub?134:92;
 x.fillStyle='rgba(18,22,26,.72)';rrect(x,X,8,w,h,sub?40:46);x.fill();if(dot){x.fillStyle=dot;x.beginPath();x.arc(X+40,54,14,0,TAU);x.fill();}
 x.fillStyle='#f2efe8';x.textAlign='center';x.textBaseline='middle';x.fillText(name,X+w/2+(dot?16:0),sub?52:56,400);
 if(sub){x.font='800 30px Manrope, sans-serif';x.fillStyle='#d6b77c';x.fillText(sub,256,106,440);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;}
function labelSprite(name,sub,dot){const t=nameTex(name,sub,dot);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));const a=t.image.height/512;s.scale.set(3.6,3.6*a,1);s.center.set(.5,0);s.renderOrder=3;return s;}

/* ---------- world build ---------- */
const solidMeshes=[];
function buildWorld(){LEAFK=TT().leaf;
 for(const key of ISL){const I=ZONES[key];const dT=key==='cove'?-.25:Math.atan2(-I.z,-I.x);const th=dT+Math.PI+(key==='moss'?.5:0),f=I.volcano?.52:key==='moss'?.32:.24,R=islandR(I,th);const px=I.x+Math.cos(th)*R*f,pz=I.z+Math.sin(th)*R*f;
  const pr=I.volcano?5.5:7.5;let rim=1e9;for(let a=0;a<16;a++){const rx=px+Math.cos(a/16*TAU)*pr*1.4,rz=pz+Math.sin(a/16*TAU)*pr*1.4;const dd=Math.hypot(rx-I.x,rz-I.z),ta=Math.atan2(rz-I.z,rx-I.x);rim=Math.min(rim,profile(I,dd/islandR(I,ta),rx,rz));}
  const p={x:px,z:pz,r:pr,y:Math.max(rim-.35,1.3),key:'pond_'+key,isl:key};I.ponds=[p];world.ponds.push(p);}
 for(const key of ISL){const I=ZONES[key];const dockTh=key==='cove'?-.25:Math.atan2(-I.z,-I.x),cx=Math.cos(dockTh),sz=Math.sin(dockTh),Rd=islandR(I,dockTh)*.78;
  const base=V(I.x+cx*Rd,0,I.z+sz*Rd),sp=V(I.x+cx*islandR(I,dockTh)*.58,0,I.z+sz*islandR(I,dockTh)*.58);I.paths=[[base,sp]];let hi=0;
  for(const n of NPCS.filter(n=>n.zone===key&&!['harbor','shipwright','altar'].includes(n.role))){const th=dockTh+n.dth,Rh=islandR(I,th)*(I.volcano?.56:.4),hx=I.x+Math.cos(th)*Rh,hz=I.z+Math.sin(th)*Rh,toC=Math.atan2(I.x-hx,I.z-hz);
   const door=V(hx+Math.sin(toC)*4.4,0,hz+Math.cos(toC)*4.4),mid=sp.clone().lerp(door,.5).add(V((hashI(hi,1,3)-.5)*8,0,(hashI(hi,2,3)-.5)*8));hi++;I.paths.push([sp,mid],[mid,door]);}
  if(key==='moss')I.paths.push([sp,V(I.x,0,I.z)]);
  if(key==='cove'){const lt=dockTh+2.5,lr=islandR(I,lt)*.6;I.lh=V(I.x+Math.cos(lt)*lr,0,I.z+Math.sin(lt)*lr);I.paths.push([sp,sp.clone().lerp(I.lh,.5).add(V(6,0,-5))],[sp.clone().lerp(I.lh,.5).add(V(6,0,-5)),I.lh]);}}
 for(const key of ISL){const I=ZONES[key];const tm=buildTerrain(I,key);scene.add(tm);
  for(const p of I.ponds){const PZ=ZONES[p.key];const pm=new THREE.Mesh(new THREE.CircleGeometry(p.r*1.42,64),new THREE.MeshStandardMaterial({color:PZ.col,roughness:.04,metalness:0,normalMap:waterNrm,normalScale:new THREE.Vector2(.25,.25),transparent:true,opacity:.92}));
   pm.rotation.x=-Math.PI/2;pm.position.set(p.x,p.y,p.z);pm.receiveShadow=true;pm.userData.noAO=true;scene.add(pm);p.mesh=pm;
   const lb=tagSprite(null,PZ.n,'Pond · '+SPECIES.filter(s=>s.zone===p.key).length+' species','#9fe6ff');lb.position.set(p.x,p.y+3.2,p.z);scene.add(lb);p.label=lb;}
  const sb=new Builder(),fb=new Builder(),gl=new Builder(),lv=new Builder();const r=rng(key.length*31+7);
  const dockTh=key==='cove'?-.25:Math.atan2(-I.z,-I.x);I.dockTh=dockTh;const reserved=world.reserved[key]=[];
  const Rd=islandR(I,dockTh)*.78,cx=Math.cos(dockTh),sz=Math.sin(dockTh);const dx0=I.x+cx*Rd,dz0=I.z+sz*Rd,len=Math.round(I.R*.3),w=3.2,dh=1.25;
  world.docks.push({x:dx0,z:dz0,cx,sz,len,w,h:dh,zone:key});const yaw=Math.atan2(cx,sz);
  sb.M(TL.wood);for(let u=0;u<len;u+=.5)sb.add(G.box,['#8a7458','#7e6a52','#937e62','#86705a'][Math.floor(u*2.7)%4],dx0+cx*u,dh-.1,dz0+sz*u,.44,.12,w,0,yaw+Math.PI/2,0,null,.03);
  for(const s of[-1,1]){sb.add(G.box,'#6a4e34',dx0+cx*len/2-sz*s*(w/2-.15),dh-.3,dz0+sz*len/2+cx*s*(w/2-.15),.22,.28,len,0,yaw,0);}
  sb.add(G.box,'#6a4e34',dx0+cx*len/2,dh-.3,dz0+sz*len/2,.22,.28,len,0,yaw,0);
  sb.gr={b:-1.5,h:2.6,k:.55};for(let u=0;u<=len;u+=4.2)for(const s of[-1,1]){const px=dx0+cx*u-sz*s*w/2,pz=dz0+sz*u+cx*s*w/2;sb.add(G.cyl,'#5e4630',px,dh-2,pz,.17,4.6,.17);if(u>2)sb.add(G.cyl,'#5e4630',px,dh+.45,pz,.12,.9,.12);}sb.gr=null;
  sb.M(TL.cloth);for(const s of[-1,1]){const a=new THREE.Vector3(),b=new THREE.Vector3();for(let u=4.2;u<len-1;u+=4.2){a.set(dx0+cx*u-sz*s*w/2,dh+.85,dz0+sz*u+cx*s*w/2);b.set(dx0+cx*(u+4.2)-sz*s*w/2,dh+.85,dz0+sz*(u+4.2)+cx*s*w/2);if(u+4.2>len)break;
   const m=a.clone().lerp(b,.5);m.y-=.12;sb.seg(G.cyl,'#cdb88e',a,m,.035);sb.seg(G.cyl,'#cdb88e',m,b,.035);}}
  const ex=dx0+cx*(len-.8),ez=dz0+sz*(len-.8);lamp(sb,gl,ex-sz*1.3,dh,ez+cx*1.3);lamp(sb,gl,ex+sz*1.3,dh,ez-cx*1.3);
  sb.M(TL.metal);sb.add(G.cyl12,'#2c3036',dx0+cx*(len-2.5)-sz*1.1,dh+.3,dz0+sz*(len-2.5)+cx*1.1,.2,.6,.2);sb.M(0);
  crate(sb,dx0+cx*3+sz*1,dh,dz0+sz*3-cx*1,.9);crate(sb,dx0+cx*3.2+sz*1.1,dh+.9,dz0+sz*3.2-cx*1.1,.6);barrel(sb,dx0+cx*4.5-sz*1.1,dh,dz0+sz*4.5+cx*1.1);
  world.boatDock[key]={x:dx0+cx*(len-3)+sz*4.2,z:dz0+sz*(len-3)-cx*4.2,yaw:Math.atan2(cx,sz)};
  const spx=I.x+cx*islandR(I,dockTh)*.58,spz=I.z+sz*islandR(I,dockTh)*.58;world.spawn[key]={x:spx,z:spz,yaw};
  reserved.push({x:spx,z:spz,r:6});for(let u=-4;u<len;u+=4)reserved.push({x:dx0+cx*u,z:dz0+sz*u,r:4});
  for(let i=0;i<4;i++){const a=dockTh+(i-1.5)*.5,rr=I.R*1.45;addFloater('buoy',I.x+Math.cos(a)*rr,I.z+Math.sin(a)*rr);}
  for(const n of NPCS.filter(n=>n.zone===key)){let nx,nz,face;
   if(n.role==='harbor'){const Rr=islandR(I,dockTh)*.74;nx=I.x+cx*Rr-sz*3.2;nz=I.z+sz*Rr+cx*3.2;face=yaw+Math.PI*.5;const hy=groundH(nx,nz);
    const kx=nx-sz*1.5,kz=nz+cx*1.5;sb.M(TL.wood);sb.add(G.box,'#a87e50',kx,hy+.5,kz,1.7,1,.9,0,yaw);sb.add(G.box,'#8a6842',kx,hy+1.05,kz,1.9,.1,1.05,0,yaw);sb.add(G.cyl,'#6a4a32',kx,hy+1.6,kz,.07,3.2,.07);
    sb.M(TL.paint);sb.add(G.box,'#efeae0',kx,hy+2.9,kz,1.3,.8,.06,0,yaw);sb.add(G.box,'#3e7aa8',kx,hy+2.9,kz,1.1,.2,.08,0,yaw);sb.M(0);world.colliders.push({x:kx,z:kz,r:1});
   }else if(n.role==='shipwright'){const Rr=islandR(I,dockTh)*.74;nx=I.x+cx*Rr+sz*3.4;nz=I.z+sz*Rr-cx*3.4;face=yaw-Math.PI*.5;const hy=groundH(nx,nz);const kx=nx+sz*1.6,kz=nz-cx*1.6;
    sb.M(TL.wood);sb.add(G.box,'#7d6a55',kx,hy+.5,kz,1.8,1,.9,0,yaw);sb.add(G.box,'#6a5846',kx,hy+1.05,kz,2,.1,1.05,0,yaw);for(let i=0;i<3;i++)sb.add(G.box,'#8a7458',kx+cx*(i-1)*.5,hy+1.6,kz+sz*(i-1)*.5,.14,1.5,.14,0,yaw,.25);sb.M(0);world.colliders.push({x:kx,z:kz,r:1});
   }else if(n.role==='altar'){nx=I.x+4.6;nz=I.z+1.5;face=-Math.PI/2;}
   else{const th=dockTh+n.dth,Rh=islandR(I,th)*(I.volcano?.56:.4);const hx=I.x+Math.cos(th)*Rh,hz=I.z+Math.sin(th)*Rh;const toC=Math.atan2(I.x-hx,I.z-hz);
    house(sb,gl,hx,groundH(hx,hz)-.15,hz,toC,n.house,{stilt:n.stilt,snow:n.house.snow});world.colliders.push({x:hx,z:hz,r:4.4});reserved.push({x:hx,z:hz,r:8});
    nx=hx+Math.sin(toC)*5.6;nz=hz+Math.cos(toC)*5.6;face=toC;}
   const rig=makeChar(n.look);rig.root.position.set(nx,groundH(nx,nz),nz);rig.root.rotation.y=face;scene.add(rig.root);
   const lbl=tagSprite(null,n.name,n.title,'#f2c14e');lbl.position.set(0,HEAD_TOP+.45,0);rig.root.add(lbl);
   const npc={def:n,rig,anim:new CharAnim(rig),x:nx,z:nz,face,label:lbl};world.npcs.push(npc);world.colliders.push({x:nx,z:nz,r:.7});reserved.push({x:nx,z:nz,r:4});
   world.inter.push({x:nx,z:nz,r:4.2,label:'Talk to '+n.name,kind:'Talk',act:()=>openNPC(n)});}
  if(key==='moss'){const ay=groundH(I.x,I.z);sb.M(TL.cobble);sb.add(G.cyl6,'#8a8a90',I.x,ay+.3,I.z,2.8,.7,2.8);sb.add(G.cyl6,'#9a9aa2',I.x,ay+.9,I.z,1.9,.6,1.9);
   for(let i=0;i<4;i++){const a=i/4*TAU+.4;sb.add(G.box,'#76767e',I.x+Math.cos(a)*2.5,ay+1.5,I.z+Math.sin(a)*2.5,.6,3,.6,0,a);lv.add(G.oct,'#c8a8ff',I.x+Math.cos(a)*2.5,ay+3.3,I.z+Math.sin(a)*2.5,.3,.45,.3);}sb.M(0);
   const cr=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),new THREE.MeshStandardMaterial({color:'#c4a0ff',emissive:'#8a4aff',emissiveIntensity:2.2,flatShading:true,roughness:.2}));cr.scale.y=1.5;cr.position.set(I.x,ay+3.2,I.z);scene.add(cr);world.altarCrystal=cr;world.altarY=ay+3.2;
   halo(I.x,ay+3.2,I.z,7,0xc8a8ff).userData.always=true;world.colliders.push({x:I.x,z:I.z,r:2.6});reserved.push({x:I.x,z:I.z,r:7});
   world.inter.push({x:I.x,z:I.z,r:4.8,label:'Use the Tide Altar',kind:'Use',act:()=>openAltar()});}
  if(I.volcano){world.colliders.push({x:I.x,z:I.z,r:I.R*.3});const cy=groundH(I.x,I.z);lv.add(G.cyl12,'#ff6a1a',I.x,cy+.6,I.z,I.R*.07,.2,I.R*.07);world.volcano={x:I.x,y:cy+3,z:I.z};}
  for(const p of I.ponds){reserved.push({x:p.x,z:p.z,r:p.r*1.7});const N=key==='frost'?0:22;fb.M(TL.plain);fb.sw={a:.6,b:0,h:2};for(let i=0;i<N;i++){const a=i/N*TAU+r()*.2,d=p.r*(1.05+r()*.25),x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d,y=groundH(x,z);if(y<0)continue;for(let k=0;k<3;k++)fb.add(G.cyl,key==='ember'?'#6a5a40':'#6f7f48',x+(k-1)*.2,y+.6+k*.12,z,.03,1.2+k*.3,.03);}fb.sw=null;
   if(key==='cove'||key==='moss')for(let i=0;i<7;i++){const a=r()*TAU,d=r()*p.r*.8;const l=new THREE.Mesh(new THREE.CylinderGeometry(.7+r()*.5,.7,.04,16,1,false,0,TAU*.88),lam(key==='moss'?'#4a6136':'#56703f',.5));l.position.set(p.x+Math.cos(a)*d,p.y+.03,p.z+Math.sin(a)*d);l.rotation.y=r()*TAU;scene.add(l);}
   if(key==='frost'){const ring=new THREE.Mesh(new THREE.RingGeometry(p.r*.95,p.r*1.3,48),lam('#e6edf2',.12));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,p.y+.02,p.z);scene.add(ring);}
   if(key==='ember')for(let i=0;i<5;i++)world.smoke.push(makeSmoke({x:p.x,y:p.y+.3,z:p.z},2.2,i,6));
   for(let i=0;i<10;i++){const a=i/10*TAU,d=p.r*1.45;const x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;sb.M(TL.rock);sb.add(pick(G.rocks),I.rock,x,groundH(x,z)-.15,z,.55+r()*.4,.38,.55+r()*.3,0,r()*3);sb.M(0);}}
  const ok=(x,z,rr)=>reserved.every(p=>Math.hypot(p.x-x,p.z-z)>p.r+rr)&&I.paths.every(sg=>segDist(x,z,sg[0],sg[1])>1.6+rr*.6);
  if(I.lh){lighthouse(sb,gl,I.lh.x,groundH(I.lh.x,I.lh.z),I.lh.z);reserved.push({x:I.lh.x,z:I.lh.z,r:6});}
  const place=(n,fmin,fmax,fn,rr=1.5)=>{n=Math.round(n*Math.pow(I.R/42,2)*.85);let tries=0,c=0;while(c<n&&tries<n*14){tries++;const th=r()*TAU,f=fmin+r()*(fmax-fmin),R=islandR(I,th),x=I.x+Math.cos(th)*R*f,z=I.z+Math.sin(th)*R*f;if(I.volcano&&f<.34)continue;if(!ok(x,z,rr))continue;const y=groundH(x,z);if(y<.4)continue;fn(x,y,z);reserved.push({x,z,r:rr});c++;}};
  if(key==='cove'){place(16,.1,.6,(x,y,z)=>{const s=.85+r()*.5;roundTree(sb,fb,x,y,z,s,r()<.5?'#4f7438':'#5a7f40','#45673a',r);world.colliders.push({x,z,r:.5*s});});
   place(12,.64,.8,(x,y,z)=>{palm(sb,fb,x,y,z,.95+r()*.3,r);world.colliders.push({x,z,r:.5});});
   place(6,.2,.5,(x,y,z)=>{lamp(sb,gl,x,y,z);world.colliders.push({x,z,r:.3});},3);}
  if(key==='moss'){place(12,.12,.6,(x,y,z)=>{const s=.9+r()*.4;willow(sb,fb,x,y,z,s,r);world.colliders.push({x,z,r:.6*s});});
   place(14,.1,.62,(x,y,z)=>{const s=.7+r()*1;mushroom(sb,gl,x,y,z,s,pick(['#c8504a','#a868c8','#d89a3c']));world.colliders.push({x,z,r:.4*s});});
   fb.sw={a:.6,b:0,h:2};place(34,.78,.95,(x,y,z)=>{for(let i=0;i<4;i++)fb.add(G.cyl,'#86a85a',x+(i-1.5)*.22,y+.7+i*.1,z+(i%2)*.2,.035,1.4+i*.3,.035);},.4);fb.sw=null;
   for(let i=0;i<18;i++){const a=r()*TAU,rr=I.R*(1.05+r()*.35);addFloater('lily',I.x+Math.cos(a)*rr,I.z+Math.sin(a)*rr);}}
  if(key==='frost'){place(20,.1,.62,(x,y,z)=>{const s=.85+r()*.5;pine(sb,fb,x,y,z,s,true,r);world.colliders.push({x,z,r:.6*s});});
   place(8,.15,.6,(x,y,z)=>{crystal(sb,gl,x,y,z,1+r()*.8);world.colliders.push({x,z,r:.6});});
   place(2,.2,.5,(x,y,z)=>{snowman(sb,x,y,z);world.colliders.push({x,z,r:.9});},2);
   for(let i=0;i<14;i++){const a=r()*TAU,rr=I.R*(1.1+r()*.45);addFloater('ice',I.x+Math.cos(a)*rr,I.z+Math.sin(a)*rr);}}
  if(key==='ember'){place(10,.36,.62,(x,y,z)=>{deadTree(sb,x,y,z,.9+r()*.4,r);world.colliders.push({x,z,r:.4});});
   place(8,.36,.75,(x,y,z)=>{basalt(sb,x,y,z,.8+r()*.5);world.colliders.push({x,z,r:1.1});},2);
   place(4,.38,.58,(x,y,z)=>{const s=1.6+r()*1.4;lv.add(G.cyl12,'#ff7a2a',x,y+.06,z,s,.12,s);for(let i=0;i<8;i++){const a=i/8*TAU;sb.M(TL.rock);sb.add(pick(G.rocks),'#2a2424',x+Math.cos(a)*(s+.3),y+.1,z+Math.sin(a)*(s+.3),.55,.38,.55,0,r()*3);sb.M(0);}world.colliders.push({x,z,r:s});},3.5);}
  place(12,.2,.85,(x,y,z)=>{const s=.6+r()*1.1;rock(sb,x,y,z,s,I.rock,key==='moss'?'#5a7a3c':key==='frost'?'#eef3f8':key==='cove'?'#6a7a48':null);world.colliders.push({x,z,r:s*.9});},1.4);
  place(18,.82,.95,(x,y,z)=>{rock(sb,x,y-.1,z,.2+r()*.25,key==='ember'?'#3a3434':'#b8b2a6');},.3);
  // shoreline: driftwood, shells, seaweed
  if(key!=='ember'){place(10,.84,.93,(x,y,z)=>driftLog(sb,x,y,z,.8+r()*.5,r),1.2);place(26,.86,.95,(x,y,z)=>shell(sb,x,y,z,r),.2);}
  const bushC={cove:['#4f7a3a','#5a8442','#46703a'],moss:['#3e5e30','#486a36','#557a3e'],frost:['#6e8a7a','#7e968a','#e8eef2'],ember:['#4a4434','#55503e','#3e382e']}[key];
  place(key==='frost'?12:key==='ember'?8:38,.12,.78,(x,y,z)=>{bush(fb,x,y,z,.8+r()*.7,bushC,r,key==='cove'&&r()<.4?pick(['#f2e6a0','#f0b8c8','#e8e8f0']):null);world.colliders.push({x,z,r:.5});},1);
  if(key==='cove'||key==='moss')place(key==='moss'?44:22,.15,.75,(x,y,z)=>fern(fb,x,y,z,.8+r()*.6,key==='moss'?'#4e7a38':'#5e8a42',r),.6);
  if(key==='moss')place(8,.2,.7,(x,y,z)=>{driftLog(sb,x,y,z,1.2,r);},1.5);
  if(key==='cove'){place(4,.3,.55,(x,y,z)=>bench(sb,x,y,z,r()*TAU),1.5);place(1,.32,.5,(x,y,z)=>{campfire(sb,gl,x,y,z);world.colliders.push({x,z,r:1});for(let i=0;i<3;i++){const a=i/3*TAU+.5;driftLog(sb,x+Math.cos(a)*2,y,z+Math.sin(a)*2,.9,()=>.5);}},4);
   for(const sg of I.paths.slice(1).filter((_,i)=>i%2))if(r()<.7){const a=sg[1],d=V(sg[1].x-sg[0].x,0,sg[1].z-sg[0].z).normalize(),pp=V(-d.z,0,d.x);const p0=a.clone().addScaledVector(pp,3.2).addScaledVector(d,-6),p1=p0.clone().addScaledVector(d,5);p0.y=groundH(p0.x,p0.z);p1.y=groundH(p1.x,p1.z);if(p0.y>.6&&p1.y>.6)fence(sb,p0,p1);}}
  if(key==='moss'){const ay=groundH(I.x,I.z);for(let i=0;i<7;i++){const a=i/7*TAU+.2,px=I.x+Math.cos(a)*10,pz=I.z+Math.sin(a)*10;pillar(sb,px,groundH(px,pz),pz,2.4+r()*1.6,i%3===1,r);world.colliders.push({x:px,z:pz,r:.8});}place(1,.3,.55,(x,y,z)=>{campfire(sb,gl,x,y,z);world.colliders.push({x,z,r:1});},4);}
  if(key==='frost'){place(10,.15,.7,(x,y,z)=>{iceSpike(sb,x,y,z,.8+r()*.7,r);world.colliders.push({x,z,r:.8});},1.6);place(1,.3,.5,(x,y,z)=>{igloo(sb,x,y,z,r()*TAU);world.colliders.push({x,z,r:2.4});},4);}
  if(key==='ember'){place(10,.36,.8,(x,y,z)=>{obsidian(sb,x,y,z,1+r()*.6,r);world.colliders.push({x,z,r:.7});},1.2);place(6,.38,.75,(x,y,z)=>{for(let i=0;i<4;i++)world.smoke.push(makeSmoke({x,y:y+.2,z},1.4,i,5));sb.M(TL.rock);sb.add(pick(G.rocks),'#3a3434',x,y,z,.9,.3,.9);sb.M(0);},2.5);place(6,.36,.7,(x,y,z)=>driftLog(sb,x,y,z,1,r),1.4);}
  // dock-side life
  {const dk=world.docks[world.docks.length-1];crabPot(sb,dk.x+dk.cx*6-dk.sz*1.2,dk.h,dk.z+dk.sz*6+dk.cx*1.2,r);crabPot(sb,dk.x+dk.cx*6.9-dk.sz*1.15,dk.h,dk.z+dk.sz*6.9+dk.cx*1.15,r);
   const rx=dk.x-dk.cx*4+dk.sz*5,rz=dk.z-dk.sz*4-dk.cx*5,ry=groundH(rx,rz);if(ry>.4){dryRack(sb,rx,ry,rz,Math.atan2(dk.cx,dk.sz),r);world.colliders.push({x:rx,z:rz,r:1.3});}}
  if(key!=='ember')for(let i=0;i<9;i++){const th=r()*TAU,f=.2+r()*.38,R=islandR(I,th),x=I.x+Math.cos(th)*R*f,z=I.z+Math.sin(th)*R*f;if(!ok(x,z,1.2))continue;addPuddle(x,groundH(x,z),z,1.1+r()*1.4);}
  const pm=sb.mesh(worldMat);pm.castShadow=true;pm.receiveShadow=true;scene.add(pm);solidMeshes.push(pm);
  if(fb.p.length){const fm=fb.mesh(worldMatS,true);fm.castShadow=true;fm.receiveShadow=true;scene.add(fm);}
  if(gl.p.length){const gm=gl.mesh(glowMat);gm.userData.noAO=true;scene.add(gm);}if(lv.p.length){const lm=lv.mesh(lavaMat);lm.userData.noAO=true;scene.add(lm);}}
 {const b=new Builder();const r=rng(99);let c=0,t=0;b.M(TL.rock);while(c<30&&t<600){t++;const a=r()*TAU,d=170+r()*1000,x=Math.cos(a)*d,z=Math.sin(a)*d;if(ISL.some(k=>Math.hypot(ZONES[k].x-x,ZONES[k].z-z)<ZONES[k].R*2.3))continue;
  const s=2+r()*4;b.top={c:new THREE.Color('#e8e6e0'),lo:.55,hi:.9,y0:-1+s*.6,yk:s*.5};b.add(pick(G.rocks),'#7f8993',x,-1+s*.4,z,s*1.2,s*1.4,s,0,r()*3);b.add(pick(G.rocks),'#8a949e',x+s*.8,-1+s*.1,z+s*.4,s*.6,s*.7,s*.6,0,r()*3);b.top=null;world.seaRocks.push({x,z,r:s*1.5});c++;}
  const fb2=new Builder(),far=ISL.map(k=>ZONES[k]);let ni2=0,tt=0;const islets=[];
  while(ni2<8&&tt<800){tt++;const a=r()*TAU,d=260+r()*900,x=Math.cos(a)*d,z=Math.sin(a)*d;if(far.some(I=>Math.hypot(I.x-x,I.z-z)<I.R*2.4)||islets.some(o=>Math.hypot(o.x-x,o.z-z)<120)||world.seaRocks.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+20))continue;
   const R0=7+r()*7;islets.push({x,z});b.M(TL.sand);b.add(G.hemi,'#cdb98e',x,-1.4,z,R0,2.3,R0*(.8+r()*.4),0,r()*3,0,null,.05);b.M(TL.grass);b.add(G.hemi,'#6e8a4c',x,-.5,z,R0*.62,1.85,R0*.55,0,r()*3,0,null,.06);
   b.M(TL.rock);b.add(pick(G.rocks),'#8a8c88',x+R0*.5,.2,z-R0*.3,2.2,1.6,1.8,0,r()*3);const np=1+(r()*3|0);for(let k=0;k<np;k++){const pa=r()*TAU,pd=r()*R0*.35;palm(b,fb2,x+Math.cos(pa)*pd,1.15,z+Math.sin(pa)*pd,.9+r()*.3,r);}
   world.seaRocks.push({x,z,r:R0*1.05});if(ni2===2)shipwreck(b,x+R0+9,z+4,r()*TAU);ni2++;}
  const sr=b.mesh(worldMat);sr.castShadow=true;sr.receiveShadow=true;scene.add(sr);const fm2=fb2.mesh(worldMatS,true);fm2.castShadow=true;scene.add(fm2);
  for(let i=0;i<24;i++){const a=r()*TAU,d=140+r()*900;addFloater('drift',Math.cos(a)*d,Math.sin(a)*d);}}
 buildGrass();buildFireflies();buildBirds();buildLife();}
function addFloater(type,x,z){let m;
 if(type==='buoy'){m=new THREE.Group();const a=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,1.2,20),new THREE.MeshPhysicalMaterial({color:'#d8503a',roughness:.45,clearcoat:.6}));a.position.y=.4;m.add(a);const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,.6,20),new THREE.MeshPhysicalMaterial({color:'#f2f0ea',roughness:.45,clearcoat:.6}));b.position.y=1.3;m.add(b);
  const c=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.3,.8)}));c.position.y=1.75;m.add(c);m.userData.light=c;a.castShadow=b.castShadow=true;}
 else if(type==='lily'){m=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.05,20,1,false,0,TAU*.88),lam(Math.random()<.5?'#4a8a36':'#589a40',.45));m.scale.setScalar(.7+Math.random()*.9);m.rotation.y=Math.random()*TAU;
  if(Math.random()<.4){const fl=new THREE.Mesh(new THREE.ConeGeometry(.3,.4,8),lam('#f4a8cc',.6));fl.position.y=.2;m.add(fl);}}
 else if(type==='drift'){m=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,2.2+Math.random()*1.6,6),lam('#9a8e7c',.9));m.material.flatShading=true;m.rotation.set(0,Math.random()*TAU,Math.PI/2);m.userData.yaw=m.rotation.y;}
 else{m=new THREE.Mesh(BGU.mergeVertices(new THREE.CylinderGeometry(1,1.2,.5,9)),new THREE.MeshPhysicalMaterial({color:'#e6f2fa',roughness:.12,clearcoat:.8,transmission:0}));m.geometry.computeVertexNormals();m.scale.set(1.5+Math.random()*2,1,1.2+Math.random()*1.6);m.rotation.y=Math.random()*TAU;}
 m.position.set(x,0,z);scene.add(m);world.floaters.push({m,x,z,o:type==='ice'?.05:type==='lily'?.04:type==='drift'?.05:0,ph:Math.random()*6,drift:type==='drift'});}
const puddleMat=new THREE.MeshStandardMaterial({color:0x2a3440,roughness:.03,metalness:0,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function addPuddle(x,y,z,s){const m=new THREE.Mesh(new THREE.CircleGeometry(1,20),puddleMat);m.rotation.x=-Math.PI/2;m.position.set(x,y+.04,z);m.scale.set(s,s*(.6+Math.random()*.4),1);m.visible=false;m.userData.noAO=true;scene.add(m);world.puddles.push(m);}

/* grass + flowers (instanced, swaying; normals point up so blades light like the ground they grow from) */
let grassMesh=null,flowerMesh=null;
function swayInst(mat){mat.onBeforeCompile=sh=>{sh.uniforms.uTime=WIND.uTime;sh.uniforms.uWind=WIND.uStr;
  sh.vertexShader='uniform float uTime;uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 ip=instanceMatrix[3].xyz;float swv=max(position.y,0.)*1.1;float ph=uTime*2.2+ip.x*.35+ip.z*.3;transformed.x+=sin(ph)*swv*.2*uWind;transformed.z+=cos(ph*.7)*swv*.14*uWind;');};
 mat.customProgramCacheKey=()=>'swayI';return mat;}
function buildGrass(){const bg=new THREE.BufferGeometry(),P=[],C=[],Nn=[];const base=new THREE.Color('#4a6230'),tip=new THREE.Color('#b0b878');
 for(let k=0;k<5;k++){const a=k/5*Math.PI+.3,cx=Math.cos(a),cz=Math.sin(a),w=.035,h=.36+k*.07,bx=(k-2)*.05,lean=.08+k*.03;
  const v=[[bx-cx*w,0,-cz*w],[bx+cx*w,0,cz*w],[bx+cx*w*.6+cz*lean*.4,h*.5,cz*w*.6-cx*lean*.4],[bx-cx*w*.6+cz*lean*.4,h*.5,-cz*w*.6-cx*lean*.4],[bx+cz*lean,h,-cx*lean]];
  for(const t of[[0,1,2],[0,2,3],[3,2,4]])for(const i of t){P.push(...v[i]);const c=base.clone().lerp(tip,Math.pow(v[i][1]/h,.8));C.push(c.r,c.g,c.b);Nn.push(cz*.25,1,-cx*.25);}}
 bg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(C,3));bg.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));
 const N=TIERS.ultra.grass;const gm=new THREE.InstancedMesh(bg,swayInst(new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.86})),N);gm.frustumCulled=false;gm.userData.noAO=true;
 const fgP=[],fgC=[];const pet=new THREE.Color('#ffffff'),cen=new THREE.Color('#f2c84a'),stem=new THREE.Color('#3e7a34');
 const pushT=(a,b,c,col)=>{fgP.push(...a,...b,...c);for(let i=0;i<3;i++)fgC.push(col.r,col.g,col.b);};
 pushT([-.015,0,0],[.015,0,0],[0,.32,0],stem);for(let i=0;i<6;i++){const a=i/6*TAU,a2=a+TAU/12;pushT([0,.33,0],[Math.cos(a-.25)*.12,.34,Math.sin(a-.25)*.12],[Math.cos(a2)*.15,.35,Math.sin(a2)*.15],pet);pushT([0,.33,0],[Math.cos(a2)*.15,.35,Math.sin(a2)*.15],[Math.cos(a+.25)*.12,.34,Math.sin(a+.25)*.12],pet);}
 pushT([-.035,.36,-.03],[.035,.36,-.03],[0,.37,.045],cen);
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fgP,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(fgC,3));fg.computeVertexNormals();
 const FN=TIERS.ultra.flowers;const fm=new THREE.InstancedMesh(fg,swayInst(new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.7})),FN);fm.frustumCulled=false;fm.userData.noAO=true;
 const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),Vv=new THREE.Vector3(),col=new THREE.Color();const r=rng(1234);
 const tint={cove:['#d8d6c4','#c8ccae','#bec6a4'],moss:['#b8d090','#a0c078','#c8d8a0'],frost:['#e8f4ff','#d4e8fa','#f4fbff'],ember:['#c8a870','#b89058','#d0b880']};
 const isl=['cove','cove','cove','moss','moss','frost','ember'];let gi=0,fi=0,tries=0;
 const valid=(k,x,z)=>{const g=groundH(x,z);if(g<.85||onDock(x,z))return null;if(world.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.35))return null;if(world.reserved[k].some(p=>p.r>=6&&Math.hypot(p.x-x,p.z-z)<p.r*.75))return null;return g;};
 while((gi<N||fi<FN)&&tries<N*4){tries++;const k=isl[Math.floor(r()*isl.length)],I=ZONES[k];const th=r()*TAU,f=Math.sqrt(r())*.76,R=islandR(I,th);const x=I.x+Math.cos(th)*R*f,z=I.z+Math.sin(th)*R*f;
  if(I.volcano&&f<.36)continue;const g=valid(k,x,z);if(g==null)continue;
  if(gi<N&&(k!=='frost'||r()<.3)){const s=k==='frost'?.45:k==='ember'?.55:.6+r()*.55;M.compose(Vv.set(x,g-.02,z),Q.setFromAxisAngle(_up,r()*TAU),S.set(s,s*(.8+r()*.7),s));gm.setMatrixAt(gi,M);gm.setColorAt(gi,col.set(pick(tint[k])).multiplyScalar(.82+r()*.32));gi++;}
  else if(fi<FN&&(k==='cove'||k==='moss')&&r()<.5){const s=.8+r()*.6;M.compose(Vv.set(x,g-.02,z),Q.setFromAxisAngle(_up,r()*TAU),S.set(s,s,s));fm.setMatrixAt(fi,M);fm.setColorAt(fi,col.set(pick(['#ece8de','#d8a8a8','#e0d090','#b8b0d8','#e0b090'])));fi++;}}
 gm.userData.max=gi;fm.userData.max=fi;gm.instanceMatrix.needsUpdate=true;fm.instanceMatrix.needsUpdate=true;if(gm.instanceColor)gm.instanceColor.needsUpdate=true;if(fm.instanceColor)fm.instanceColor.needsUpdate=true;
 gm.receiveShadow=true;fm.receiveShadow=true;scene.add(gm);scene.add(fm);grassMesh=gm;flowerMesh=fm;}

/* clouds now live in the sky shader; the array stays for older callers */
const clouds=[];

/* fireflies */
const ffU={uT:WIND.uTime,uA:{value:0},uPR:{value:1}};let fireflies=null;
function buildFireflies(){const P=[],PH=[];const r=rng(77);const N=TIERS.ultra.ff;const want={cove:.3,moss:.45,frost:.05,ember:.2};
 for(let i=0;i<N;i++){let k='cove',x=0,z=0;for(let t=0;t<20;t++){const rr=r();k=rr<want.cove?'cove':rr<want.cove+want.moss?'moss':rr<.95?'ember':'frost';const I=ZONES[k],th=r()*TAU,f=.15+r()*.75;x=I.x+Math.cos(th)*islandR(I,th)*f;z=I.z+Math.sin(th)*islandR(I,th)*f;if(groundH(x,z)>.3)break;}
  P.push(x,groundH(x,z)+.6+r()*2.4,z);PH.push(r()*TAU);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('ph',new THREE.Float32BufferAttribute(PH,1));
 const m=new THREE.ShaderMaterial({uniforms:ffU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float ph;uniform float uT;uniform float uA;uniform float uPR;varying float vA;void main(){vec3 p=position;p.x+=sin(uT*.55+ph)*1.5;p.y+=sin(uT*1.1+ph*2.)*.55;p.z+=cos(uT*.47+ph*1.3)*1.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uPR*8.*(28./max(-mv.z,1.));vA=uA*(.5+.5*sin(uT*2.6+ph*5.));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(3.4,3.1,1.2)*a*vA,a*vA);'+OUT_CHUNKS+'}'});
 fireflies=new THREE.Points(g,m);fireflies.frustumCulled=false;scene.add(fireflies);reflHide.push(fireflies);}

/* birds */
const birds=[];
function buildBirds(){const body=new THREE.SphereGeometry(.32,12,8),wing=new THREE.BoxGeometry(1.3,.03,.42),tip=new THREE.BoxGeometry(.5,.025,.3),beak=new THREE.ConeGeometry(.06,.22,6);
 const wm=lam('#f2f2f0',.8),gm=lam('#8a949e',.8),bm=lam('#e09a3a',.6);const centers=[[0,0],[0,0],[ZONES.moss.x,ZONES.moss.z],[ZONES.frost.x,ZONES.frost.z],[ZONES.ember.x,ZONES.ember.z],[160,-80],[-120,160]];
 for(let i=0;i<TIERS.ultra.birds;i++){const g=new THREE.Group();const b=new THREE.Mesh(body,wm);b.scale.set(1,.8,2.1);g.add(b);const bk=new THREE.Mesh(beak,bm);bk.rotation.x=Math.PI/2;bk.position.z=.78;g.add(bk);
  const wings=[];for(const s of[-1,1]){const pv=new THREE.Group();pv.position.x=s*.2;const w=new THREE.Mesh(wing,wm);w.position.x=s*.65;pv.add(w);const t=new THREE.Mesh(tip,gm);t.position.x=s*1.45;pv.add(t);g.add(pv);wings.push(pv);}
  const c=centers[i%centers.length];g.scale.setScalar(.9);scene.add(g);birds.push({g,wings,cx:c[0]+rand(-20,20),cz:c[1]+rand(-20,20),R:rand(22,55),h:rand(20,36),a:rand(0,TAU),sp:rand(.12,.22)*(Math.random()<.5?-1:1),ph:rand(0,6)});}}

/* life: splashes, jumping fish, rain, smoke */
const splashPool=[];let rain=null;const rings=[],jumpers=[];
function buildLife(){const ic=new THREE.IcosahedronGeometry(.1,1);const sm=new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1.5,1.6),transparent:true,opacity:.85});for(let i=0;i<60;i++){const m=new THREE.Mesh(ic,sm);m.visible=false;scene.add(m);splashPool.push({m,v:new THREE.Vector3(),life:0});}
 const N=TIERS.ultra.rain,a=new Float32Array(N*6);for(let i=0;i<N;i++){const x=rand(-45,45),y=rand(-20,30),z=rand(-45,45);a.set([x,y,z,x+.1,y-.95,z],i*6);}
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(a,3));rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x9aa8b8,transparent:true,opacity:0,depthWrite:false}));rain.frustumCulled=false;rain.visible=false;rain.userData.N=N;scene.add(rain);reflHide.push(rain);
 const rgeo=new THREE.RingGeometry(.7,1,24);rgeo.rotateX(-Math.PI/2);for(let i=0;i<34;i++){const m=new THREE.Mesh(rgeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.visible=false;m.userData.noAO=true;scene.add(m);rings.push({m,t:9,d:1});}
 for(let i=0;i<2;i++){const g=new THREE.Group();const mat=new THREE.MeshPhysicalMaterial({color:i?'#d89a5a':'#a8bccc',roughness:.3,metalness:.25,clearcoat:.7});const b=new THREE.Mesh(new THREE.SphereGeometry(.35,16,12),mat);b.scale.set(1.6,.75,.45);g.add(b);
  const t=new THREE.Mesh(new THREE.ConeGeometry(.3,.45,6),mat);t.rotation.z=Math.PI/2;t.position.x=-.68;t.scale.z=.3;g.add(t);g.visible=false;scene.add(g);jumpers.push({g,t:9,x:0,z:0,dir:0});}
 for(const c of world.chimneys.slice(0,12))for(let i=0;i<3;i++)world.smoke.push(makeSmoke(c,.9,i/3*4,4));
 if(world.volcano)for(let i=0;i<9;i++)world.smoke.push(makeSmoke(world.volcano,4,i/9*9,9));
 makeDrift('snow',{n:1800,color:'#ffffff',size:3.4,vy:-2.3,sway:1.3,add:false,box:[70,40,70]});makeDrift('ember',{n:520,color:new THREE.Color(4,1.6,.5),size:2.4,vy:1.7,sway:1.1,add:true,box:[60,30,60]});
 makeDrift('petal',{n:280,color:'#ffc6dc',size:2.8,vy:-.75,sway:2.3,add:false,box:[60,26,60]});buildRainbow();buildBolt();}
const drifts={};
function makeDrift(key,o){const g=new THREE.BufferGeometry();const r=rng(key.length*13+5);const sd=[],p=[];for(let i=0;i<o.n;i++){sd.push(r(),r(),r());p.push(0,0,0);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('seed',new THREE.Float32BufferAttribute(sd,3));
 const u={uT:WIND.uTime,uAmt:{value:0},uPR:{value:1},uCam:{value:new THREE.Vector3()},uBox:{value:new THREE.Vector3(o.box[0],o.box[1],o.box[2])},uVy:{value:o.vy},uSway:{value:o.sway},uSize:{value:o.size},uCol:{value:new THREE.Color(o.color)},uLit:{value:1}};
 const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,
  vertexShader:'attribute vec3 seed;uniform float uT;uniform float uAmt;uniform float uPR;uniform vec3 uCam;uniform vec3 uBox;uniform float uVy;uniform float uSway;uniform float uSize;varying float vA;void main(){vec3 p=seed*uBox;p.y+=uVy*uT;p.x+=sin(uT*.7+seed.z*30.)*uSway+uT*uSway*.4;p.z+=cos(uT*.5+seed.x*30.)*uSway;p=mod(p-uCam+uBox*.5,uBox)-uBox*.5+uCam;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uPR*uSize*(24./max(-mv.z,.5));vA=uAmt*(.65+.35*sin(uT*3.+seed.y*40.))*clamp((1.-length((p-uCam)/uBox*2.))*4.,0.,1.);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uCol;uniform float uLit;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d)*vA;if(a<.01)discard;gl_FragColor=vec4(uCol*uLit,a);'+OUT_CHUNKS+'}'});
 const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.visible=false;scene.add(pts);reflHide.push(pts);drifts[key]={pts,u,n:o.n};}
let rainbow=null,bolt=null;
function buildRainbow(){const g=new THREE.RingGeometry(300,345,96,1,0,Math.PI);const m=new THREE.ShaderMaterial({uniforms:{uA:{value:0}},transparent:true,depthWrite:false,fog:false,
 vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uA;varying vec2 vP;vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}void main(){float t=(length(vP)-300.)/45.;float a=sin(t*3.14159)*uA*smoothstep(0.,70.,vP.y);gl_FragColor=vec4(hue(.82-t*.82)*1.6,a*.32);'+OUT_CHUNKS+'}'});
 rainbow=new THREE.Mesh(g,m);rainbow.renderOrder=-8;rainbow.visible=false;rainbow.frustumCulled=false;scene.add(rainbow);}
function buildBolt(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(18*3),3));bolt=new THREE.Line(g,new THREE.LineBasicMaterial({color:new THREE.Color(8,8,9),transparent:true,fog:false}));bolt.frustumCulled=false;bolt.visible=false;bolt.userData.t=0;scene.add(bolt);}
function strikeBolt(){const cp=camera.position,f=new THREE.Vector3();camera.getWorldDirection(f);const ang=Math.atan2(f.z,f.x)+rand(-.9,.9),d=rand(170,320);let x=cp.x+Math.cos(ang)*d,z=cp.z+Math.sin(ang)*d;const a=bolt.geometry.attributes.position.array;
 for(let i=0;i<18;i++){const t=i/17;a[i*3]=x;a[i*3+1]=150*(1-t);a[i*3+2]=z;x+=rand(-8,8);z+=rand(-8,8);}bolt.geometry.attributes.position.needsUpdate=true;bolt.visible=true;bolt.userData.t=.24;return d;}
function makeSmoke(o,size,age,life){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.smoke,transparent:true,depthWrite:false,opacity:0}));scene.add(s);return{s,o,size,age,life,dx:rand(-.4,.4),dz:rand(-.4,.4)};}
function splash(p,n=14,spd=4){let c=0;for(const s of splashPool){if(s.life>0)continue;s.m.visible=true;s.m.position.copy(p);s.v.set(rand(-1,1)*spd*.4,rand(.6,1.2)*spd,rand(-1,1)*spd*.4);s.life=rand(.5,.9);if(++c>=n)break;}}
function ringAt(x,y,z,d=1,size=1){for(const r of rings){if(r.t<r.d)continue;r.t=0;r.d=d;r.s=size;r.m.position.set(x,y,z);r.m.visible=true;return;}}

/* ---------- lamp lights: the nearest lamps get real point lights at night ---------- */
function syncLampLights(){const want=TT().lamps;while(GFX.lamps.length<want){const l=new THREE.PointLight(0xffc98a,0,16,2);l.userData.noAO=true;scene.add(l);GFX.lamps.push(l);}
 while(GFX.lamps.length>want){const l=GFX.lamps.pop();scene.remove(l);l.dispose&&l.dispose();}}
function updateLampLights(nightK){if(!GFX.lamps.length)return;const c=cam.target,L=world.lamps;const near=L.map(p=>[p,(p.x-c.x)**2+(p.z-c.z)**2]).sort((a,b)=>a[1]-b[1]);
 GFX.lamps.forEach((l,i)=>{const e=near[i];if(!e||e[1]>70*70||nightK<.05){l.intensity=0;return;}l.position.copy(e[0]);l.intensity=nightK*14*(1-smooth(40,70,Math.sqrt(e[1])));});}

/* ---------- tiers ---------- */
function applyTier(){const t=TT();renderer.setPixelRatio(Math.min(devicePixelRatio||1,t.pr));renderer.setSize(innerWidth,innerHeight,false);
 renderer.shadowMap.enabled=!!t.shadow;sun.castShadow=!!t.shadow;if(t.shadow){sun.shadow.mapSize.set(t.shadow,t.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  Object.assign(sun.shadow.camera,{left:-t.ext,right:t.ext,top:t.ext,bottom:-t.ext,near:1,far:300});sun.shadow.camera.updateProjectionMatrix();}
 if(skyMat.defines.CLOUD_OCT!==t.cloud){skyMat.defines.CLOUD_OCT=t.cloud;skyMat.needsUpdate=true;}ENV.every=t.env;syncLampLights();
 scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});
 buildRefl();buildPost();buildWater();if(ENV.cubeRT)waterU.uSky.value=ENV.cubeRT.texture;
 if(grassMesh){grassMesh.count=Math.min(t.grass,grassMesh.userData.max);grassMesh.visible=grassMesh.count>0;}if(flowerMesh)flowerMesh.count=Math.min(t.flowers,flowerMesh.userData.max);
 if(fireflies)fireflies.geometry.setDrawRange(0,t.ff);for(const k in drifts)drifts[k].pts.geometry.setDrawRange(0,Math.round(drifts[k].n*(GFX.tier==='low'?.4:GFX.tier==='medium'?.7:1)));birds.forEach((b,i)=>b.g.visible=i<t.birds);
 document.body.classList.toggle('lowfx',GFX.tier==='low');starU.uPR.value=ffU.uPR.value=renderer.getPixelRatio();for(const k in drifts)drifts[k].u.uPR.value=renderer.getPixelRatio();}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();sizePost();if(GFX.refl)buildRefl(),waterU.uRefl.value=GFX.refl.texture;}
addEventListener('resize',resize);
