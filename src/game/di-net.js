'use strict';
/* Driftwood Isles — online backends. The game's multiplayer code (di-ui netInit) talks to a small interface:
   use('user') → {id(), can()}, use('db') → {doc(path).get/set, collection(name).orderBy().limit().onSnapshot()},
   use('room') → {presence(p), onPeers(cb), emit(topic,data), on(topic,cb), onConnection(cb)}.
   This file implements it on Firebase Realtime Database (production) and on BroadcastChannel (?mp=local, for testing). */
const MP_LOCAL=/[?&]mp=local/.test(location.search);
const FB_CFG=Object.assign({apiKey:FB_ENV.apiKey,authDomain:FB_ENV.authDomain,databaseURL:FB_ENV.databaseURL,projectId:FB_ENV.projectId,appId:FB_ENV.appId},window.DRIFTWOOD_FIREBASE||{});
const fbConfigured=()=>!!(FB_CFG.apiKey&&FB_CFG.databaseURL);
const STALE_MS=45000;

/* ---------- Firebase Realtime Database ---------- */
async function makeFirebaseBackend(cfg){
 const [{initializeApp},{getAuth,signInAnonymously},R]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/database')]);
 const app=initializeApp(cfg,'driftwood');const auth=getAuth(app);const cred=await signInAnonymously(auth);const uid=cred.user.uid;const D=R.getDatabase(app);
 const {ref,set,get,onValue,onChildAdded,onChildChanged,onChildRemoved,query,orderByChild,limitToLast,serverTimestamp,onDisconnect}=R;
 const user={id:async()=>uid,can:async()=>true};
 const pathOf=p=>p.startsWith('data/users/')?'saves/'+uid:p.startsWith('chat/')?'chatlog/'+p.slice(5):p.startsWith('lb/')?'lb/'+p.slice(3):null;
 const db={doc(p){const path=pathOf(p);return{
   async get(){const s=await get(ref(D,path));return{exists:s.exists(),data:()=>s.val()};},
   set(d){if(path.startsWith('saves/')){let st={};try{st=JSON.parse(d.json);}catch(e){}d={json:d.json,savedAt:d.savedAt||Date.now(),coins:Math.max(0,Math.round(st.coins||0)),earned:Math.max(0,Math.round(st.earned||0)),level:Math.max(1,st.level|0),at:serverTimestamp()};}
    else d=Object.assign({},d,{at:serverTimestamp()});return set(ref(D,path),d).catch(e=>{const err=new Error(e.message);err.code=/permission/i.test(e.message)?'not_granted':'error';throw err;});}};},
  collection(name){const base=name==='chat'?'chatlog':'lb';let lim=50;const api={orderBy(){return api;},limit(n){lim=n;return api;},
   onSnapshot(cb,err){return onValue(query(ref(D,base),orderByChild('u'),limitToLast(lim)),s=>{const docs=[];s.forEach(c=>{docs.push({id:c.key,data:()=>c.val()});});cb({docs});},err);}};return api;}};
 const me=ref(D,'players/'+uid),players=ref(D,'players');
 const fresh=v=>v&&typeof v==='object'&&(!v.ts||Date.now()-v.ts<STALE_MS);
 const room={presence:p=>set(me,p),
  onPeers(cb){const one=(s,left)=>{if(s.key===uid)return;if(left||!fresh(s.val())){cb({peers:[],left:[{peer:s.key}]});return;}cb({peers:[{peer:s.key,isMe:false,kind:'viewer',presence:s.val(),by:s.key}],left:[]});};
   onChildAdded(players,s=>one(s,false));onChildChanged(players,s=>one(s,false));onChildRemoved(players,s=>one(s,true));},
  emit:(topic,data)=>set(ref(D,'live/'+topic+'/'+uid),Object.assign({},data,{u:uid,t:serverTimestamp()})).catch(e=>{const err=new Error(e.message);err.code='not_permitted';throw err;}),
  on(topic,cb){const since=Date.now()-3000,seen=new Set();const h=s=>{const v=s.val();if(!v||v.u===uid||!v.i||seen.has(v.i))return;if(typeof v.t==='number'&&v.t<since)return;seen.add(v.i);cb({data:v,isMe:false,peer:v.u,by:v.u});};
   onChildAdded(ref(D,'live/'+topic),h);onChildChanged(ref(D,'live/'+topic),h);},
  onConnection(cb){onValue(ref(D,'.info/connected'),s=>{const c=!!s.val();if(c)onDisconnect(me).remove();cb(c);});}};
 return{kind:'firebase',rate:.2,use:async k=>({user,db,room})[k]};}

/* ---------- local test transport: several tabs of the same browser share the isles ---------- */
function makeLocalBackend(){const bc=new BroadcastChannel('driftwood-isles-mp');let uid;try{uid=sessionStorage.getItem('mp-uid');if(!uid){uid='local-'+Math.random().toString(36).slice(2,9);sessionStorage.setItem('mp-uid',uid);}}catch(e){uid='local-'+Math.random().toString(36).slice(2,9);}
 const L={peers:new Map(),cbPeers:null,topics:{},snaps:{}};const store={get(k){try{return JSON.parse(localStorage.getItem('mp:'+k));}catch(e){return null;}},set(k,v){try{localStorage.setItem('mp:'+k,JSON.stringify(v));}catch(e){}}};
 const pathOf=p=>p.startsWith('data/users/')?'saves/'+uid:p;
 const fire=base=>{const cb=L.snaps[base];if(!cb)return;const docs=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('mp:'+base+'/')){const id=k.slice(base.length+4);const v=store.get(base+'/'+id);docs.push({id,data:()=>v});}}cb({docs});};
 bc.onmessage=e=>{const m=e.data||{};if(m.type==='pres'&&m.uid!==uid){L.peers.set(m.uid,Date.now());L.cbPeers&&L.cbPeers({peers:[{peer:m.uid,isMe:false,kind:'viewer',presence:m.p,by:m.uid}],left:[]});}
  else if(m.type==='leave'){L.peers.delete(m.uid);L.cbPeers&&L.cbPeers({peers:[],left:[{peer:m.uid}]});}
  else if(m.type==='emit'&&m.uid!==uid){const cb=L.topics[m.topic];cb&&cb({data:m.data,isMe:false,peer:m.uid,by:m.uid});}
  else if(m.type==='doc'){fire(m.base);}};
 setInterval(()=>{const now=Date.now();for(const[k,t]of L.peers)if(now-t>22000){L.peers.delete(k);L.cbPeers&&L.cbPeers({peers:[],left:[{peer:k}]});}},2000);
 addEventListener('pagehide',()=>bc.postMessage({type:'leave',uid}));
 const user={id:async()=>uid,can:async()=>true};
 const db={doc(p){const path=pathOf(p);return{async get(){const v=store.get(path);return{exists:v!=null,data:()=>v};},async set(d){store.set(path,d);const base=path.split('/')[0];bc.postMessage({type:'doc',base});fire(base);}};},
  collection(name){const api={orderBy(){return api;},limit(){return api;},onSnapshot(cb){L.snaps[name]=cb;setTimeout(()=>fire(name),50);}};return api;}};
 const room={presence:async p=>{bc.postMessage({type:'pres',uid,p});},onPeers(cb){L.cbPeers=cb;},emit:async(topic,data)=>{bc.postMessage({type:'emit',topic,data,uid});},on(topic,cb){L.topics[topic]=cb;},onConnection(cb){setTimeout(()=>cb(true),50);}};
 return{kind:'local',rate:.1,use:async k=>({user,db,room})[k]};}
