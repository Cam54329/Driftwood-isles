'use strict';
/* Driftwood Isles — graphics kit: procedural PBR texture sets, world / terrain / foliage materials,
   physically based sky with clouds, image-based lighting, and the shared ocean wave model. */
const WIND={uTime:{value:0},uStr:{value:1}};

/* ---------- tileable noise (CPU, for texture generation) ---------- */
function hashI(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function vnoise2(x,y,px,py,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const x0=((xi%px)+px)%px,y0=((yi%py)+py)%py,x1=(x0+1)%px,y1=(y0+1)%py;const a=hashI(x0,y0,s),b=hashI(x1,y0,s),c=hashI(x0,y1,s),d=hashI(x1,y1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm2(x,y,px,py,oct,s,gain=.5){let a=0,amp=.5,f=1,n=0;for(let i=0;i<oct;i++){a+=amp*vnoise2(x*f,y*f,px*f,py*f,s+i*31);n+=amp;amp*=gain;f*=2;}return a/n;}
const fbmT=(u,v,p,oct,s,g)=>fbm2(u*p,v*p,p,p,oct,s,g);
function worley2(x,y,p,s){const xi=Math.floor(x),yi=Math.floor(y);let d1=9,d2=9,id=0;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=xi+i,cy=yi+j,wx=((cx%p)+p)%p,wy=((cy%p)+p)%p;const dx=cx+hashI(wx,wy,s)-x,dy=cy+hashI(wx,wy,s+7)-y,d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;id=hashI(wx,wy,s+3);}else if(d<d2)d2=d;}
 return [Math.sqrt(d1),Math.sqrt(d2),id];}
const sstep=(a,b,x)=>{const t=Math.min(Math.max((x-a)/(b-a),0),1);return t*t*(3-2*t);};

/* ---------- PBR texture layers (albedo detail + height, normal + roughness + cavity) ----------
   World surfaces keep their colour as a vertex tint; these layers add the material: grain, planks,
   cracks, weave, roughness and micro-normals. Albedo is a multiplier centred on 0.5. */
const TL={plain:0,sand:1,grass:2,rock:3,wood:4,bark:5,roof:6,siding:7,metal:8,snow:9,cloth:10,cobble:11,dirt:12,ice:13,paint:14,thatch:15};
const TL_N=16;
//            metres per tile, metalness, normal strength
const TLP=[[2,0,1],[2.6,0,1.1],[2.2,0,1.2],[3.2,0,2.2],[1.7,0,1.6],[1.3,0,2.4],[2,0,2],[2.2,0,1.6],[1.4,.6,.5],[4,0,.8],[.55,0,1.1],[2.4,0,2.2],[2.8,0,1.6],[4,0,.5],[2,0,1],[1.4,0,2]];
const LAYER_GEN=[
 (u,v)=>{const n=fbmT(u,v,6,4,11);return [n*.3,.5*(.94+.12*n),.5*(.94+.12*n),.5*(.94+.12*n),.78-.1*n];},                           // plain
 (u,v,g)=>{const w=fbmT(u,v,3,3,12),rip=Math.sin((v*6+w*1.3+fbmT(u,v,4,2,14)*.4)*Math.PI*2)*.5+.5,n=fbmT(u,v,16,3,13);           // sand
  let l=.5*(.9+.14*n+.1*(g-.5));if(g>.985)l*=.72;else if(g<.012)l*=1.22;return [.42*rip+.33*n+.12*g,l*1.02,l,l*.95,.93-.1*n];},
 (u,v,g)=>{const n1=fbmT(u,v,6,4,21),n2=fbmT(u,v,24,3,22),st=fbm2(u*96,v*20,96,20,2,23);const dry=sstep(.56,.74,n1),dk=sstep(.42,.25,n2);  // grass turf
  const l=.5*(.78+.42*n2+.18*st)*(1-.25*dk);return [.45*n2+.35*st+.2*n1,l*(1+.22*dry),l*(1.06+.08*dry),l*(.86-.12*dry),.86-.1*st];},
 (u,v)=>{const q=fbmT(u,v,4,3,31),n=fbm2(u*5+q*.8,v*5+q*.6,5,5,6,32,.55),w=worley2(u*6,v*6,6,33),cr=1-sstep(0,.07,w[1]-w[0]);       // rock
  const str=Math.sin((v*9+n*2.2)*Math.PI*2)*.5+.5,li=sstep(.64,.72,fbmT(u,v,10,4,34));const l=.5*(.66+.62*n-cr*.32+.06*str);
  return [n*.78+str*.08-cr*.32,l*(1+li*.1),l*(1+li*.14),l*(1-li*.12),.92-.22*n+cr*.06];},
 (u,v)=>{const P=4,pv=v*P,pi=Math.floor(pv),fv=pv-pi,o=hashI(pi,0,41),tone=.8+.36*hashI(pi,1,41);                                 // wood planks
  const j=hashI(pi,2,41),du=Math.min(Math.abs(u-j),1-Math.abs(u-j));const warp=fbm2(u*3,fv*1.5+pi*3.7,3,64,3,42);
  const ring=Math.sin((fv*3.2+warp*2.6+o*9)*Math.PI*2)*.5+.5,fine=fbm2(u*40,v*160,40,160,2,43);const gap=sstep(.07,0,fv)+sstep(.93,1,fv)+sstep(.006,0,du);
  const kn=worley2(u*3+o,fv*2+pi,3,44+pi)[0],knot=sstep(.16,.02,kn)*(hashI(pi,3,41)>.55?1:0);
  const l=.5*tone*(.8+.13*ring+.1*fine-.2*knot)*(1-.55*Math.min(gap,1));return [.6+.08*ring+.05*fine-.5*Math.min(gap,1)-.1*knot,l*1.04,l,l*.92,.7+.18*fine];},
 (u,v)=>{const rd=1-Math.abs(fbm2(u*7,v*1.6,7,2,4,51)*2-1),f=Math.pow(rd,2.6),n=fbmT(u,v,20,3,52);                                   // bark
  const l=.5*(.5+.62*f+.1*n);return [f*.82+.18*n,l*1.03,l,l*.94,.94-.08*f];},
 (u,v)=>{const R=7,rv=v*R,ri=Math.floor(rv),fv=rv-ri,cu=u*6+(ri%2)*.5,ci=Math.floor(cu),fu=cu-ci,tone=.78+.38*hashI(((ci%6)+6)%6,ri,61);  // roof shingles
  const n=fbmT(u,v,16,3,62),gap=(fu<.035||fu>.965)?1:0,lip=sstep(.12,0,fv);const l=.5*tone*(.84+.18*n)*(1-.45*gap)*(1-.35*lip);
  return [(1-fv)*.45+.3+.1*n-.35*gap,l,l*.98,l*.96,.8+.12*n];},
 (u,v)=>{const B=6,bv=v*B,f=bv-Math.floor(bv),n=fbmT(u,v,12,3,71),wx=fbm2(u*24,v*2,24,2,3,72),lip=sstep(.07,0,f);                  // siding / clapboard
  const l=.5*(.93+.07*n-.06*wx)*(1-.32*lip);return [f*.5+.35+.05*n,l,l,l,.78+.1*wx];},
 (u,v)=>{const st=fbm2(u*2,v*190,2,190,3,81),sc=sstep(.985,1,hashI((u*512)|0,(v*64)|0,82)),n=fbmT(u,v,6,3,83);                     // brushed metal
  const l=.5*(.9+.12*st+.08*n);return [.5+.05*st,l,l,l*1.01,.3+.14*st+.1*n+.2*sc];},
 (u,v,g)=>{const n=fbmT(u,v,6,5,91),l=.5*(.97+.05*n);return [n*.6,l,l,l*1.02,g>.993?.12:.58-.12*n];},                            // snow
 (u,v)=>{const k=20,tu=u*k,tv=v*k,iu=Math.floor(tu),iv=Math.floor(tv),c=(iu+iv)&1,fu=tu-iu,fv=tv-iv;                                 // woven cloth
  const h=c?Math.sin(fv*Math.PI):Math.sin(fu*Math.PI),n=fbmT(u,v,8,3,101);const l=.5*(.86+.14*h+.06*n);return [.25+.6*h+.1*n,l,l,l,.94];},
 (u,v)=>{const w=worley2(u*5,v*5,5,111),e=w[1]-w[0],st=sstep(.02,.13,e),n=fbmT(u,v,10,4,112);                                      // cobble / stone blocks
  const l=st>.15?.5*(.66+.46*w[2])*(.86+.22*n):.5*.86;return [st*(.55+.3*n),l*1.02,l,l*.97,.82+.1*(1-st)];},
 (u,v,g)=>{const n=fbmT(u,v,6,5,121),w=worley2(u*14,v*14,14,122),p=sstep(.32,.08,w[0])*(w[2]>.6?1:0);                               // dirt / ash
  const l=.5*(.74+.46*n+.12*p);return [n*.6+p*.3+.06*g,l*1.03,l,l*.95,.94-.06*p];},
 (u,v)=>{const n=fbmT(u,v,3,4,131),w=worley2(u*4,v*4,4,132),cr=1-sstep(0,.03,w[1]-w[0]);const l=.5*(.95+.08*n+.1*cr);               // ice
  return [n*.25-cr*.1,l*.98,l,l*1.03,.06+.14*cr+.06*n];},
 (u,v)=>{const P=3,pv=v*P,pi=Math.floor(pv),fv=pv-pi,n=fbmT(u,v,8,4,141),ch=sstep(.66,.72,fbmT(u,v,12,4,142+pi));                     // painted boards
  const gap=sstep(.05,0,fv)+sstep(.95,1,fv),gr=fbm2(u*30,v*90,30,90,2,143);const l=.5*(ch>.5?.62+.1*gr:.96+.05*n)*(1-.5*Math.min(gap,1));
  return [.55-.45*Math.min(gap,1)-.06*ch,l,l,l,ch>.5?.82:.48+.1*n];},
 (u,v)=>{const st=fbm2(u*110,v*5,110,5,2,151),rows=v*5,f=rows-Math.floor(rows),n=fbmT(u,v,10,3,152);                                 // thatch / straw
  const l=.5*(.7+.46*st+.08*n)*(1-.3*sstep(.18,0,f));return [st*.7+(1-f)*.25,l*1.06,l,l*.82,.95];}];

const WTEX={size:256,A:null,B:null,ready:false};
function makeArrayTex(data,S,N){const t=new THREE.DataArrayTexture(data,S,S,N);t.format=THREE.RGBAFormat;t.type=THREE.UnsignedByteType;t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.colorSpace=THREE.NoColorSpace;t.needsUpdate=true;return t;}
/* generates all layers; yields between layers so the loading bar keeps moving */
async function genWorldTextures(S,onStep){WTEX.size=S;const N=TL_N,A=new Uint8Array(S*S*4*N),B=new Uint8Array(S*S*4*N);
 const H=new Float32Array(S*S),Hb=new Float32Array(S*S),T=new Float32Array(S*S);
 for(let L=0;L<N;L++){const gen=LAYER_GEN[L],ns=TLP[L][2],base=L*S*S*4;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const r=gen(x/S,y/S,hashI(x,y,L*7+3)),i=y*S+x,o=base+i*4;H[i]=r[0];
   A[o]=Math.min(255,Math.max(0,r[1]*255))|0;A[o+1]=Math.min(255,Math.max(0,r[2]*255))|0;A[o+2]=Math.min(255,Math.max(0,r[3]*255))|0;B[o+2]=Math.min(255,Math.max(0,r[4]*255))|0;}
  // cavity AO: height minus a blurred height
  const R=Math.max(2,S>>6);for(let y=0;y<S;y++){let acc=0;for(let k=-R;k<=R;k++)acc+=H[y*S+((k%S)+S)%S];for(let x=0;x<S;x++){T[y*S+x]=acc/(2*R+1);acc+=H[y*S+(x+R+1)%S]-H[y*S+((x-R)%S+S)%S];}}
  for(let x=0;x<S;x++){let acc=0;for(let k=-R;k<=R;k++)acc+=T[((k%S)+S)%S*S+x];for(let y=0;y<S;y++){Hb[y*S+x]=acc/(2*R+1);acc+=T[((y+R+1)%S)*S+x]-T[(((y-R)%S+S)%S)*S+x];}}
  const k=ns*S/64;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x,o=base+i*4;const dx=H[y*S+(x+1)%S]-H[y*S+(x-1+S)%S],dy=H[((y+1)%S)*S+x]-H[((y-1+S)%S)*S+x];
   let nx=-dx*k,ny=-dy*k;const l=Math.hypot(nx,ny,1);nx/=l;ny/=l;B[o]=((nx*.5+.5)*255)|0;B[o+1]=((ny*.5+.5)*255)|0;
   const ao=Math.min(1,Math.max(.35,1-(Hb[i]-H[i])*2.6));B[o+3]=(ao*255)|0;A[o+3]=(Math.min(1,Math.max(0,H[i]))*255)|0;}
  if(onStep&&L%4===3)await onStep(L/N);}
 WTEX.A=makeArrayTex(A,S,N);WTEX.B=makeArrayTex(B,S,N);WTEX.ready=true;WU.uAlb.value=WTEX.A;WU.uNrm.value=WTEX.B;}

/* ---------- shared world uniforms ---------- */
const WU={uAlb:{value:null},uNrm:{value:null},uTexScale:{value:TLP.map(p=>1/p[0])},uMetal:{value:TLP.map(p=>p[1])},uWet:{value:0},uTime:WIND.uTime,uWind:WIND.uStr,
 uSunDirW:{value:new THREE.Vector3(0,1,0)},uSunColW:{value:new THREE.Color(1,1,1)},uSnowK:{value:0},uDetail:{value:.32}};
const GLSL_TRI_PARS=`
precision highp sampler2DArray;
uniform sampler2DArray uAlb;uniform sampler2DArray uNrm;uniform float uTexScale[${TL_N}];uniform float uMetal[${TL_N}];uniform float uWet;uniform float uDetail;
mat3 dwTBN(vec3 eye,vec3 N,vec2 uv){vec3 q0=dFdx(eye),q1=dFdy(eye);vec2 s0=dFdx(uv),s1=dFdy(uv);vec3 q1p=cross(q1,N),q0p=cross(N,q0);vec3 T=q1p*s0.x+q0p*s1.x,B=q1p*s0.y+q0p*s1.y;float det=max(dot(T,T),dot(B,B));float sc=det==0.?0.:inversesqrt(det);return mat3(T*sc,B*sc,N);}
`;
/* world material: vertex colour tint × triplanar PBR layer chosen per vertex ("mat" attribute) */
function makeWorldMat(o={}){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:1,side:o.side||THREE.FrontSide,flatShading:true});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,WU);
  sh.vertexShader=`attribute float mat;attribute vec3 tp;${o.sway?'attribute float sway;uniform float uTime;uniform float uWind;':''}
flat varying float vMat;varying vec3 vTp;varying float vUpW;
`+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vMat=mat;vTp=tp;vUpW=normalize(mat3(modelMatrix)*objectNormal).y;
${o.sway?'{vec3 wp=(modelMatrix*vec4(position,1.)).xyz;float ph=uTime*1.5+wp.x*.12+wp.z*.1;float gs=sin(ph)+.35*sin(ph*2.3+1.);transformed.x+=gs*sway*.2*uWind;transformed.z+=cos(ph*.8)*sway*.15*uWind;transformed.y-=abs(gs)*sway*.03;}':''}`);
  sh.fragmentShader=GLSL_TRI_PARS+`flat varying float vMat;varying vec3 vTp;varying float vUpW;
`+sh.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
int dwL=int(vMat+.5);float dwS=uTexScale[dwL];vec3 dwP=vTp*dwS;
vec3 dwTc=cross(dFdx(vTp),dFdy(vTp));float dwTl=length(dwTc);vec3 dwTn=dwTl>1e-10?dwTc/dwTl:vec3(0.,1.,0.);vec3 dwW=pow(abs(dwTn),vec3(4.));dwW/=(dwW.x+dwW.y+dwW.z+1e-5);
vec4 dwAx=texture(uAlb,vec3(dwP.zy,float(dwL))),dwAy=texture(uAlb,vec3(dwP.xz,float(dwL))),dwAz=texture(uAlb,vec3(dwP.xy,float(dwL)));
vec4 dwA=dwAx*dwW.x+dwAy*dwW.y+dwAz*dwW.z;
vec2 dwUV=dwW.x>dwW.y?(dwW.x>dwW.z?dwP.zy:dwP.xy):(dwW.y>dwW.z?dwP.xz:dwP.xy);
vec4 dwB=texture(uNrm,vec3(dwUV,float(dwL)));
float dwMac=texture(uAlb,vec3(dwUV*.173+.31,float(dwL))).r;
float dwWet=uWet*smoothstep(.2,.8,vUpW);`)
  .replace('#include <color_fragment>',`#include <color_fragment>
diffuseColor.rgb*=mix(vec3(1.),dwA.rgb*2.*(.82+.36*dwMac),uDetail);diffuseColor.rgb*=1.-dwWet*.32;`)
  .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(mix(.86,dwB.b,uDetail+.2),.2,dwWet*.85);')
  .replace('#include <metalnessmap_fragment>','float metalnessFactor=uMetal[dwL];')
  .replace('#include <aomap_fragment>',`#include <aomap_fragment>
reflectedLight.indirectDiffuse*=dwB.a;reflectedLight.indirectSpecular*=mix(1.,dwB.a,.6);`);};
 m.customProgramCacheKey=()=>'dwWorld'+(o.sway?'S':'')+(o.side||0);return m;}

/* terrain: smooth mesh, splat weights per vertex (sand, ground, rock, dirt) blended by height */
function makeTerrainMat(groundL,snowy){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:true});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,WU);sh.uniforms.uGround={value:groundL};
  sh.vertexShader=`attribute vec4 splat;varying vec4 vSplat;varying vec3 vWP;varying vec3 vWN;
`+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vSplat=splat;vWP=(modelMatrix*vec4(position,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);`);
  sh.fragmentShader=GLSL_TRI_PARS+`uniform float uGround;varying vec4 vSplat;varying vec3 vWP;varying vec3 vWN;
`+sh.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
vec2 dtP=vWP.xz;float dtGl=uGround;
vec4 dtS=texture(uAlb,vec3(dtP*uTexScale[1],1.)),dtG=texture(uAlb,vec3(dtP*uTexScale[int(dtGl)],dtGl)),dtD=texture(uAlb,vec3(dtP*uTexScale[12],12.));
vec3 dtW=pow(abs(vWN),vec3(4.));dtW/=dtW.x+dtW.y+dtW.z;float dtRS=uTexScale[3];
vec4 dtR=texture(uAlb,vec3(vWP.zy*dtRS,3.))*dtW.x+texture(uAlb,vec3(vWP.xz*dtRS,3.))*dtW.y+texture(uAlb,vec3(vWP.xy*dtRS,3.))*dtW.z;
vec2 dtRUV=dtW.x>dtW.z?vWP.zy*dtRS:vWP.xy*dtRS;if(dtW.y>max(dtW.x,dtW.z))dtRUV=vWP.xz*dtRS;
vec4 dtSw=vSplat;dtSw*=vec4(dtS.a,dtG.a,dtR.a,dtD.a)+.25;dtSw=pow(dtSw,vec4(3.));dtSw/=dot(dtSw,vec4(1.))+1e-5;
vec4 dtA=dtS*dtSw.x+dtG*dtSw.y+dtR*dtSw.z+dtD*dtSw.w;
vec4 dtB=texture(uNrm,vec3(dtP*uTexScale[1],1.))*dtSw.x+texture(uNrm,vec3(dtP*uTexScale[int(dtGl)],dtGl))*dtSw.y+texture(uNrm,vec3(dtRUV,3.))*dtSw.z+texture(uNrm,vec3(dtP*uTexScale[12],12.))*dtSw.w;
float dtMac=texture(uAlb,vec3(dtP*.021,2.)).r*.6+texture(uAlb,vec3(dtP*.0047,3.)).r*.4;
float dtShore=1.-smoothstep(.05,.85,vWP.y);float dtWet=max(dtShore*.9,uWet*smoothstep(.3,.8,vWN.y));`)
  .replace('#include <color_fragment>',`#include <color_fragment>
diffuseColor.rgb*=mix(vec3(1.),dtA.rgb*2.*(.8+.4*dtMac),uDetail);diffuseColor.rgb*=1.-dtWet*.38;`)
  .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(dtB.b,.22,dtWet*.8);')
  .replace('#include <aomap_fragment>',`#include <aomap_fragment>
reflectedLight.indirectDiffuse*=dtB.a;`);};
 m.customProgramCacheKey=()=>'dwTerrain';return m;}

/* ---------- small detail maps for characters and fish ---------- */
function heightToNormalTex(S,hf,str,rep){const d=new Uint8Array(S*S*4),H=new Float32Array(S*S);for(let y=0;y<S;y++)for(let x=0;x<S;x++)H[y*S+x]=hf(x/S,y/S);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=H[y*S+(x+1)%S]-H[y*S+(x-1+S)%S],dy=H[((y+1)%S)*S+x]-H[((y-1+S)%S)*S+x];let nx=-dx*str,ny=-dy*str;const l=Math.hypot(nx,ny,1);const o=(y*S+x)*4;d[o]=((nx/l*.5+.5)*255)|0;d[o+1]=((ny/l*.5+.5)*255)|0;d[o+2]=((1/l*.5+.5)*255)|0;d[o+3]=255;}
 const t=new THREE.DataTexture(d,S,S,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
const DETAIL={};
function detailTex(k){if(DETAIL[k])return DETAIL[k];let t;
 if(k==='fabric')t=heightToNormalTex(64,(u,v)=>{const a=Math.sin(u*Math.PI*2*16),b=Math.sin(v*Math.PI*2*16);return (((Math.floor(u*16)+Math.floor(v*16))&1)?a:b)*.5+fbmT(u,v,8,2,5)*.3;},6,[4,4]);
 else if(k==='scales')t=heightToNormalTex(128,(u,v)=>{const R=10,ru=u*R,rv=v*R*1.6,ri=Math.floor(rv),cu=ru+(ri&1)*.5,fu=cu-Math.floor(cu),fv=rv-ri;const d=Math.hypot(fu-.5,fv*.9);return Math.min(1,d*1.1)+(1-fv)*.2;},9,[6,3]);
 else if(k==='knit')t=heightToNormalTex(64,(u,v)=>{const fu=(u*12)%1,fv=(v*16)%1;return Math.abs(Math.sin((fu+Math.abs(fv-.5))*Math.PI))*.8;},5,[6,6]);
 else t=heightToNormalTex(64,(u,v)=>fbmT(u,v,8,4,9),3,[3,3]);
 return DETAIL[k]=t;}
function finTex(){if(DETAIL.fin)return DETAIL.fin;const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='rgba(255,255,255,.62)';x.fillRect(0,0,256,256);
 for(let i=0;i<34;i++){const a=(i/33-.5)*2.4;x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2.2;x.beginPath();x.moveTo(256,128);x.lineTo(256-Math.cos(a)*300,128+Math.sin(a)*300);x.stroke();}
 const g=x.createLinearGradient(0,0,256,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,1)');x.globalCompositeOperation='destination-in';x.fillStyle=g;x.fillRect(0,0,256,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return DETAIL.fin=t;}

/* ---------- ocean waves (one table drives the shader and the gameplay height function) ---------- */
// direction (rad), wavelength (m), amplitude (m), crest sharpness. The first WAVE_GEO waves move the mesh;
// all of them shape the surface normal.
const WAVES=[[.35,58,.30,1.5],[-.6,37,.21,1.7],[1.2,23.5,.13,1.9],[2.45,14.6,.075,2.1],[-1.65,9.3,.042,2.3],[.9,6.1,.026,2.5],[-2.4,3.9,.014,2.6]];
const WAVE_GEO=4;
function besselI0(x){let s=1,t=1;for(let k=1;k<30;k++){t*=(x/(2*k))*(x/(2*k));s+=t;}return s;}
const WV=WAVES.map(([a,L,A,S],i)=>{const k=Math.PI*2/L;return{dx:Math.cos(a),dz:Math.sin(a),k,w:Math.sqrt(9.81*k)*.85,A,S,c:2/(1-Math.exp(-2*S)),m:besselI0(S)*Math.exp(-S),ph:i*1.7};});
const WAVE={amp:1,ampT:1};
const glf=v=>{const s=String(+v.toFixed(6));return s.includes('.')||s.includes('e')?s:s+'.';};
function glslWaves(a,b,withD){let s='';for(let i=a;i<b;i++){const w=WV[i];const th=`(${glf(w.k*w.dx)}*p.x+${glf(w.k*w.dz)}*p.y-${glf(w.w)}*t+${glf(w.ph)})`;
  s+=`{float th=${th};float e=exp(${glf(w.S)}*(sin(th)-1.));h+=${glf(w.A*w.c)}*(e-${glf(w.m)});`;
  if(withD)s+=`float dd=${glf(w.A*w.c*w.S)}*e*cos(th);d+=vec2(${glf(w.k*w.dx)},${glf(w.k*w.dz)})*dd;`;s+='}';}return s;}
const GLSL_WAVES=`float wvH(vec2 p,float t){float h=0.;${glslWaves(0,WAVE_GEO,false)}return h;}
vec3 wvHD(vec2 p,float t){float h=0.;vec2 d=vec2(0.);${glslWaves(0,WAVE_GEO,true)}return vec3(h,d);}
vec3 wvHDfine(vec2 p,float t){float h=0.;vec2 d=vec2(0.);${glslWaves(WAVE_GEO,WAVES.length,true)}return vec3(h,d);}`;
function waveRaw(x,z,t){let h=0;for(let i=0;i<WAVE_GEO;i++){const w=WV[i];h+=w.A*w.c*(Math.exp(w.S*(Math.sin(w.k*(w.dx*x+w.dz*z)-w.w*t+w.ph)-1))-w.m);}return h;}

/* ---------- physically based sky (Preetham) with procedural clouds, night sky and horizon fog ---------- */
const SKY={ray:1.7,turb:3,mie:.004,g:.8,k:.14};
const skyU={uSun:{value:new THREE.Vector3(0,1,0)},uRay:{value:SKY.ray},uTurb:{value:SKY.turb},uMie:{value:SKY.mie},uG:{value:SKY.g},uDisc:{value:1},uK:{value:SKY.k},
 uT:WIND.uTime,uCov:{value:.3},uDark:{value:0},uNight:{value:0},uNightTop:{value:new THREE.Color('#0a1430')},uNightHor:{value:new THREE.Color('#1c2b52')},
 uFogC:{value:new THREE.Color(.5,.6,.7)},uFogK:{value:0},uCloudSun:{value:new THREE.Color(1,1,1)},uCloudAmb:{value:new THREE.Color(.4,.45,.5)},uFlash:{value:0}};
const skyMat=new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,defines:{CLOUD_OCT:5},
 vertexShader:`uniform vec3 uSun;uniform float uRay;uniform float uTurb;uniform float uMie;varying vec3 vDir;varying vec3 vBetaR;varying vec3 vBetaM;varying float vSunE;
 const vec3 totalRayleigh=vec3(5.804542996261093E-6,1.3562911419845635E-5,3.0265902468824876E-5);const vec3 MieConst=vec3(1.8399918514433978E14,2.7798023919660528E14,4.0790479543861094E14);
 void main(){vDir=position;vec3 s=normalize(uSun);float zc=clamp(s.y,-1.,1.);vSunE=1000.*max(0.,1.-exp(-((1.6110731556870734-acos(zc))/1.5)));
  vBetaR=totalRayleigh*uRay;vBetaM=.434*(.2*uTurb)*10E-18*MieConst*uMie;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
 fragmentShader:`uniform vec3 uSun;uniform float uG;uniform float uDisc;uniform float uK;uniform float uT;uniform float uCov;uniform float uDark;uniform float uNight;uniform vec3 uNightTop;uniform vec3 uNightHor;
 uniform vec3 uFogC;uniform float uFogK;uniform vec3 uCloudSun;uniform vec3 uCloudAmb;uniform float uFlash;varying vec3 vDir;varying vec3 vBetaR;varying vec3 vBetaM;varying float vSunE;
 const float pi=3.141592653589793;
 float h21(vec2 p){vec3 q=fract(p.xyx*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
 float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
 float cfbm(vec2 p){float a=0.,w=.5;for(int i=0;i<CLOUD_OCT;i++){a+=w*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(3.1,1.7);w*=.5;}return a;}
 void main(){vec3 d=normalize(vDir);vec3 s=normalize(uSun);
  float za=acos(max(0.,d.y));float inv=1./(cos(za)+.15*pow(93.885-za*180./pi,-1.253));vec3 Fex=exp(-(vBetaR*8.4E3*inv+vBetaM*1.25E3*inv));
  float ct=dot(d,s);float rP=.05968310365946075*(1.+pow(ct*.5+.5,2.));float g2=uG*uG;float mP=.07957747154594767*((1.-g2)/pow(1.-2.*uG*ct+g2,1.5));
  vec3 bt=(vBetaR*rP+vBetaM*mP)/(vBetaR+vBetaM);vec3 Lin=pow(vSunE*bt*(1.-Fex),vec3(1.5));Lin*=mix(vec3(1.),pow(vSunE*bt*Fex,vec3(.5)),clamp(pow(1.-s.y,5.),0.,1.));
  vec3 L=(Lin+.1*Fex)*.04*uK;
  float up=max(d.y,0.);L+=mix(uNightHor,uNightTop,pow(up,.4))*uNight;
  float grey=dot(L,vec3(.3,.55,.15));L=mix(L,vec3(grey)*vec3(.92,.96,1.04),uDark*.7)*(1.-uDark*.35);
  float disc=smoothstep(.99990,.99997,ct)*uDisc;L+=disc*min(vSunE*Fex,vec3(60.))*18.*uK;
  if(d.y>.0&&uCov>.01){vec2 cp=d.xz/(d.y+.1)*.85+vec2(uT*.006,uT*.0025);
   float n=cfbm(cp*1.15)*.85+cfbm(cp*3.1+7.)*.15;float lo=1.-uCov;float den=smoothstep(lo,lo+.3,n);
   vec2 sd=normalize(s.xz+1e-4);float n2=cfbm((cp+sd*.05)*1.15);float occ=clamp((n2-n)*3.2+.55,0.,1.);
   float sil=pow(max(ct,0.),10.)*(1.-den)*2.2;
   vec3 cl=uCloudSun*(.35+.75*(1.-occ)+sil)+uCloudAmb;cl*=1.-uDark*.55*den;
   float hz=smoothstep(.0,.16,d.y);L=mix(L,cl,den*hz*(.85+.15*uCov));}
  L=mix(L,uFogC,clamp(uFogK*pow(1.-up,8.)+step(d.y,0.)*.0,0.,1.));
  if(d.y<0.)L=mix(L,uFogC,smoothstep(0.,-.12,d.y));
  L+=uFlash*vec3(.9,.95,1.)*.6;
  gl_FragColor=vec4(L,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
/* CPU port of the same radiance model: drives fog, cloud and sun light colours so they match the sky */
const SKYJS=(()=>{const tR=[5.804542996261093E-6,1.3562911419845635E-5,3.0265902468824876E-5],MC=[1.8399918514433978E14,2.7798023919660528E14,4.0790479543861094E14];
 function radiance(d,s,out){const zc=Math.min(Math.max(s.y,-1),1);const sunE=1000*Math.max(0,1-Math.exp(-((1.6110731556870734-Math.acos(zc))/1.5)));
  const za=Math.acos(Math.max(0,d.y)),inv=1/(Math.cos(za)+.15*Math.pow(93.885-za*180/Math.PI,-1.253));const ct=d.x*s.x+d.y*s.y+d.z*s.z;
  const rP=.05968310365946075*(1+Math.pow(ct*.5+.5,2)),g=skyU.uG.value,g2=g*g,mP=.07957747154594767*((1-g2)/Math.pow(1-2*g*ct+g2,1.5));const k5=Math.min(Math.max(Math.pow(1-s.y,5),0),1);
  for(let c=0;c<3;c++){const bR=tR[c]*skyU.uRay.value,bM=.434*(.2*skyU.uTurb.value)*10E-18*MC[c]*skyU.uMie.value;const Fex=Math.exp(-(bR*8.4E3*inv+bM*1.25E3*inv));const bt=(bR*rP+bM*mP)/(bR+bM);
   let Lin=Math.pow(sunE*bt*(1-Fex),1.5);Lin*=1+(Math.pow(sunE*bt*Fex,.5)-1)*k5;out[c]=(Lin+.1*Fex)*.04*skyU.uK.value;}return out;}
 function sunTrans(s,out){const za=Math.acos(Math.max(0,s.y)),inv=1/(Math.cos(za)+.15*Math.pow(93.885-za*180/Math.PI,-1.253));
  for(let c=0;c<3;c++){const bR=tR[c]*skyU.uRay.value,bM=.434*(.2*skyU.uTurb.value)*10E-18*MC[c]*skyU.uMie.value;out[c]=Math.exp(-(bR*8.4E3*inv+bM*1.25E3*inv));}return out;}
 return{radiance,sunTrans};})();

/* ---------- image-based lighting: the sky is captured into a cube map (water reflections) and a PMREM (scene lighting) ---------- */
const ENV={scene:new THREE.Scene(),cubeRT:null,cubeCam:null,pmrem:null,pmremRT:null,t:0,every:1.5,ready:false};
function initEnv(){ENV.scene.add(new THREE.Mesh(new THREE.SphereGeometry(500,48,24),skyMat));
 ENV.cubeRT=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});ENV.cubeCam=new THREE.CubeCamera(1,1000,ENV.cubeRT);
 ENV.pmrem=new THREE.PMREMGenerator(renderer);ENV.pmrem.compileCubemapShader();}
function updateEnvMap(force){if(!ENV.cubeCam)return;const disc=skyU.uDisc.value;skyU.uDisc.value=0;
 ENV.cubeCam.update(renderer,ENV.scene);skyU.uDisc.value=disc;
 ENV.pmremRT=ENV.pmrem.fromCubemap(ENV.cubeRT.texture,ENV.pmremRT||null);scene.environment=ENV.pmremRT.texture;ENV.ready=true;}
