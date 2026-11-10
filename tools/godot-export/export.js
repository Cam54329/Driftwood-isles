// Re-exports the islands and angler for the Godot project. Run "npm run build && npx vite preview --port 4173" first, then: node tools/godot-export/export.js
const {chromium}=require('playwright');const fs=require('fs');const {writeGLB,weld}=require('./glb.js');const OUT=require('path').resolve(__dirname,'../../godot/assets');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const st={v:2,coins:100,earned:100,xp:0,level:1,inv:[],rods:['drift'],rod:'drift',bait:{},ench:{},relics:0,unlocked:['cove'],dex:{},last:'cove',settings:{gfx:'high',gfxAuto:false,music:0,sfx:0,amb:0,weather:'clear'},uid:4,savedAt:Date.now(),seenVer:'6.0',tips:{joined:true,intro:true},profile:{name:'Cam',color:'#8e9398',hatC:'#56723c',skin:'#e0ac80',hat:'bucket',beard:'full',hair:'#6a4426'},boats:['dinghy'],boat:'dinghy',bup:{},buffs:{},lines:['basic'],line:'basic',lures:[],crates:0};localStorage.setItem('driftwood-isles-save-v1',JSON.stringify(st));});
await p.goto('http://localhost:4173/?debug');await p.waitForFunction(()=>window.__DI&&!document.getElementById('loading'),null,{timeout:400000,polling:1000});
await p.evaluate(()=>{const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};window.__b64=b64;
 window.__collect=key=>{const D=window.__DI,T=D.THREE,g=D.world.islGroups.find(x=>x.key===key).grp;g.visible=true;g.updateMatrixWorld(true);const P=[],C=[],v=new T.Vector3(),m4=new T.Matrix4(),im=new T.Matrix4(),col=new T.Color(),ic=new T.Color();
  g.traverse(o=>{if(!o.isMesh)return;const mat=Array.isArray(o.material)?o.material[0]:o.material;if(!mat||mat.transparent||mat.isShaderMaterial||mat.isMeshBasicMaterial)return;if(o.isInstancedMesh&&o.count>4000)return;
   let q=o;while(q&&q!==g){if(!q.visible&&!q.userData.lod&&!q.userData.far)return;q=q.parent;}const geo=o.geometry,pos=geo.attributes.position;if(!pos)return;const idx=geo.index,ca=geo.attributes.color,useC=ca&&mat.vertexColors,base=mat.color||new T.Color(1,1,1);
   const n=idx?idx.count:pos.count,insts=o.isInstancedMesh?o.count:1;
   for(let k=0;k<insts;k++){m4.copy(o.matrixWorld);let hasIC=false;if(o.isInstancedMesh){o.getMatrixAt(k,im);m4.multiply(im);if(o.instanceColor){o.getColorAt(k,ic);hasIC=true;}}
    for(let i=0;i<n;i++){const j=idx?idx.getX(i):i;v.fromBufferAttribute(pos,j).applyMatrix4(m4);P.push(v.x,v.y,v.z);if(useC)col.fromBufferAttribute(ca,j);else col.setRGB(1,1,1);col.multiply(base);if(hasIC)col.multiply(ic);
     C.push(Math.round(Math.min(1,Math.max(0,col.r))*255),Math.round(Math.min(1,Math.max(0,col.g))*255),Math.round(Math.min(1,Math.max(0,col.b))*255),255);}}});
  return{P:b64(new Uint8Array(new Float32Array(P).buffer)),C:b64(new Uint8Array(C))};};});
const keys=await p.evaluate(()=>window.__DI.world.islGroups.map(g=>g.key));let total=0;
for(const key of keys){const r=await p.evaluate(k=>window.__collect(k),key);const pb=Buffer.from(r.P,'base64'),cb=Buffer.from(r.C,'base64');const P=new Float32Array(pb.buffer,pb.byteOffset,pb.length/4),C=new Uint8Array(cb);
 // split into 80 m tiles so Godot can cull and build collision per tile
 const tris=P.length/9,cells=new Map();for(let t=0;t<tris;t++){const cx=Math.floor((P[t*9]+P[t*9+3]+P[t*9+6])/3/80),cz=Math.floor((P[t*9+2]+P[t*9+5]+P[t*9+8])/3/80);const ck=cx+'_'+cz;let a=cells.get(ck);if(!a)cells.set(ck,a=[]);a.push(t);}
 const nodes=[];for(const [ck,list] of cells){const sp=new Float32Array(list.length*9),sc=new Uint8Array(list.length*12);list.forEach((t,i)=>{sp.set(P.subarray(t*9,t*9+9),i*9);sc.set(C.subarray(t*12,t*12+12),i*12);});nodes.push({name:key+'_'+ck,mesh:weld(sp,sc)});}
 const sz=writeGLB(OUT+'/islands/'+key+'.glb',[{name:key,children:nodes}]);total+=sz;console.log(key,tris,'tris',nodes.length,'tiles',(sz/1e6).toFixed(1)+'MB');}
// the player angler, with named joints for animation
const ang=await p.evaluate(()=>{const D=window.__DI,T=D.THREE,r=D.makeAngler({skin:'#e0ac80',shirt:'#8e9398',pants:'#3f4d35',hat:'#56723c',hatType:'bucket',beard:'full',hair:'#6a4426'});
 r.root.name='Angler';r.body.name='body';r.body.children[0].name='vis';r.hips.name='hips';r.spine.name='spine';r.neck.name='neck';r.head.name='head';r.eyes.forEach((e,i)=>e.name=i?'eyeR':'eyeL');
 for(const[s,a]of[['L',r.aL],['R',r.aR]]){a.sh.name='arm'+s;a.el.name='elbow'+s;a.hand.name='hand'+s;}for(const[s,l]of[['L',r.lL],['R',r.lR]]){l.hp.name='leg'+s;l.kn.name='knee'+s;}
 const col=new T.Color(),v=new T.Vector3();let n=0;
 const rec=o=>{const nd={name:o.name||('part'+(n++)),t:[o.position.x,o.position.y,o.position.z],r:[o.quaternion.x,o.quaternion.y,o.quaternion.z,o.quaternion.w],s:[o.scale.x,o.scale.y,o.scale.z],children:[]};
  if(o.isMesh){const mat=o.material;if(mat.transparent)return null;const geo=o.geometry,pos=geo.attributes.position,idx=geo.index,ca=geo.attributes.color,cnt=idx?idx.count:pos.count,P=[],C=[];
   for(let i=0;i<cnt;i++){const j=idx?idx.getX(i):i;v.fromBufferAttribute(pos,j);P.push(v.x,v.y,v.z);if(ca&&mat.vertexColors)col.fromBufferAttribute(ca,j);else col.setRGB(1,1,1);col.multiply(mat.color);C.push(Math.round(Math.min(1,col.r)*255),Math.round(Math.min(1,col.g)*255),Math.round(Math.min(1,col.b)*255),255);}
   nd.P=window.__b64(new Uint8Array(new Float32Array(P).buffer));nd.C=window.__b64(new Uint8Array(C));}
  for(const c of o.children){if(c.isSprite||c.isPoints||c.isLine)continue;const k=rec(c);if(k)nd.children.push(k);}return nd;};return rec(r.root);});
const fix=nd=>{if(nd.P){const pb=Buffer.from(nd.P,'base64'),cb=Buffer.from(nd.C,'base64');nd.mesh=weld(new Float32Array(pb.buffer,pb.byteOffset,pb.length/4),new Uint8Array(cb));delete nd.P;delete nd.C;}nd.children.forEach(fix);};fix(ang);
console.log('angler',(writeGLB(OUT+'/angler.glb',[ang])/1e3).toFixed(0)+'KB');
const info=await p.evaluate(()=>{const D=window.__DI,gh=D.props.groundH;const isl={};for(const g of D.world.islGroups){const I=D.ZONES[g.key],sp=D.world.spawn[g.key];isl[g.key]={name:I.n||g.key,x:I.x,z:I.z,r:I.R,cave:!!I.cave,spawn:sp?{x:sp.x,y:gh(sp.x,sp.z),z:sp.z,yaw:sp.yaw||0}:null};}return{version:'6.0',start:'cove',islands:isl};});
fs.writeFileSync(OUT+'/world.json',JSON.stringify(info,null,1));console.log('total islands',(total/1e6).toFixed(1)+'MB',errs.slice(0,3).join(' | '));await b.close();})();
