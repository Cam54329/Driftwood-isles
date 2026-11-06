// Minimal GLB writer: nodes with TRS, meshes with POSITION, COLOR_0 (RGBA8 normalized) and optional uint32 indices.
const fs=require('fs');
function writeGLB(file,roots){const json={asset:{version:'2.0',generator:'Driftwood Isles exporter'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],accessors:[],bufferViews:[],buffers:[],
 materials:[{name:'lowpoly',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.85},doubleSided:true}]};const bins=[];let off=0;
 const view=(buf,target)=>{const pad=(4-(off%4))%4;if(pad){bins.push(Buffer.alloc(pad));off+=pad;}const b=Buffer.from(buf.buffer,buf.byteOffset,buf.byteLength);bins.push(b);json.bufferViews.push({buffer:0,byteOffset:off,byteLength:b.length,target});off+=b.length;return json.bufferViews.length-1;};
 const addMesh=(m,name)=>{const P=m.pos,n=P.length/3;let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<n;i++)for(let k=0;k<3;k++){const v=P[i*3+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
  const pa=json.accessors.push({bufferView:view(P,34962),componentType:5126,count:n,type:'VEC3',min:mn,max:mx})-1;const ca=json.accessors.push({bufferView:view(m.col,34962),componentType:5121,normalized:true,count:n,type:'VEC4'})-1;
  const prim={attributes:{POSITION:pa,COLOR_0:ca},material:0,mode:4};if(m.idx)prim.indices=json.accessors.push({bufferView:view(m.idx,34963),componentType:5125,count:m.idx.length,type:'SCALAR'})-1;
  json.meshes.push({name,primitives:[prim]});return json.meshes.length-1;};
 const addNode=nd=>{const o={name:nd.name||'node'};if(nd.t)o.translation=nd.t;if(nd.r)o.rotation=nd.r;if(nd.s)o.scale=nd.s;const i=json.nodes.push(o)-1;if(nd.mesh)o.mesh=addMesh(nd.mesh,nd.name);
  if(nd.children&&nd.children.length)o.children=nd.children.map(addNode);return i;};
 json.scenes[0].nodes=roots.map(addNode);json.buffers.push({byteLength:off});
 let js=Buffer.from(JSON.stringify(json));const jp=(4-js.length%4)%4;js=Buffer.concat([js,Buffer.alloc(jp,0x20)]);const bin=Buffer.concat(bins);const bp=(4-bin.length%4)%4;const binP=Buffer.concat([bin,Buffer.alloc(bp)]);
 const head=Buffer.alloc(12);head.writeUInt32LE(0x46546C67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+js.length+8+binP.length,8);
 const c1=Buffer.alloc(8);c1.writeUInt32LE(js.length,0);c1.writeUInt32LE(0x4E4F534A,4);const c2=Buffer.alloc(8);c2.writeUInt32LE(binP.length,0);c2.writeUInt32LE(0x004E4942,4);
 fs.writeFileSync(file,Buffer.concat([head,c1,js,c2,binP]));return fs.statSync(file).size;}
// weld identical (position, colour) vertices of a triangle soup
function weld(P,C){const n=P.length/3,map=new Map(),pos=[],col=[],idx=new Uint32Array(n);let k=0;
 for(let i=0;i<n;i++){const x=Math.round(P[i*3]*2000),y=Math.round(P[i*3+1]*2000),z=Math.round(P[i*3+2]*2000);const key=x+','+y+','+z+','+C[i*4]+','+C[i*4+1]+','+C[i*4+2];let j=map.get(key);
  if(j===undefined){j=k++;map.set(key,j);pos.push(P[i*3],P[i*3+1],P[i*3+2]);col.push(C[i*4],C[i*4+1],C[i*4+2],255);}idx[i]=j;}
 return{pos:new Float32Array(pos),col:new Uint8Array(col),idx};}
module.exports={writeGLB,weld};
