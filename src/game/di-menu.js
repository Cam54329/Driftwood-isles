'use strict';
/* Driftwood Isles — main menu (live dock scene), pause menu, credits, HUD widgets (minimap, compass, map), hotbar, gear. */

/* ---------- main menu ---------- */
const MENU={on:false,t:0,sel:0,items:[],dock:null};
function menuItems(){const has=!!(state.profile&&state.tips.joined);return [has?['continue','Continue']:['new','New game'],...(has?[['new','New game']]:[]),['mp','Multiplayer'],['settings','Settings'],['credits','Credits']];}
function renderMenu(){MENU.items=menuItems();$('#menuNav').innerHTML=MENU.items.map(([k,l],i)=>`<button data-m="${k}" class="${i===MENU.sel?'sel':''}">${l}</button>`).join('');
 const online=netLabel();$('#menuStatus').textContent=online;}
function netLabel(){if(Net.backend==='none')return 'Solo play · online multiplayer is not set up on this server';const n=Net.remotes.size;return Net.connected?(n?`${n+1} anglers on the isles right now`:'Online · no one else is fishing yet'):'Connecting to the isles…';}
function openMenu(){MENU.on=true;MENU.t=0;MENU.sel=0;closePanel();document.body.classList.add('menu');const m=$('#menu');m.hidden=false;m.classList.remove('fade');$('#pause').hidden=true;
 if(F.st!=='idle'&&F.st!=='waiting')cancelFishing();stopEmote();if(player.mode==='boat'){player.mode='walk';}
 const d=world.docks.find(k=>k.zone==='cove')||world.docks[0];MENU.dock=d;const ex=d.x+d.cx*(d.len-1.4),ez=d.z+d.sz*(d.len-1.4);player.pos.set(ex,d.h,ez);player.face=Math.atan2(d.cx,d.sz);prig.root.position.copy(player.pos);prig.root.rotation.y=player.face;
 MENU.envT=env.t;env.t=.6;setWeather('clear',true);env.rain=0;env.cloud=.12;env.fog=0;env.wet=0;
 // the angler's line is already in the water: a waiting cast that never bites
 F.to.set(ex+d.cx*13,0,ez+d.sz*13);F.st='waiting';F.t=0;F.wait=1e9;F.shakeT=1e9;F.ripT=1;F.zone='cove';bobber.visible=true;fline.visible=true;
 renderMenu();$('#menuFoot').textContent='Version 2.0 · '+(isTouch?'tap to choose':'↑ ↓ and Enter, or click');}
function closeMenu(go){MENU.on=false;const m=$('#menu');m.classList.add('fade');setTimeout(()=>{m.hidden=true;},800);document.body.classList.remove('menu');
 clearShakes();if(F.st==='waiting'){F.st='retract';F.t=0;F.retFrom.copy(bobber.position);}env.t=.32;if(state.settings.weather==='auto'||!state.settings.weather){env.wTimer=rand(60,150);}else setWeather(state.settings.weather,true);
 const sp=world.spawn[state.last]||world.spawn.cove;player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;placeBoatAt(state.last||'cove');cam.yaw=player.face+Math.PI;cam.target.copy(player.pos).add(new V3(0,2,0));cam.dist=cam.tdist=12;cam.pitch=.34;
 if(go)go();}
function menuCamera(dt){MENU.t+=dt;const d=MENU.dock;if(!d)return;const D=new V3(d.cx,0,d.sz),P=new V3(-d.sz,0,d.cx);const E=new V3(d.x+d.cx*(d.len-1.4),d.h,d.z+d.sz*(d.len-1.4));const wide=innerWidth>760,s=Math.sin(MENU.t*.07);
 const pos=E.clone().addScaledVector(D,wide?-7.5:-9).addScaledVector(P,wide?-4.2+s*.6:-2.2).add(new V3(0,wide?1.2:2.2,0));const look=E.clone().addScaledVector(D,14).addScaledVector(P,wide?9:2).add(new V3(0,wide?6.5:3.6,0));
 camera.position.lerp(pos,1-Math.exp(-2*dt));if(MENU.t<.05)camera.position.copy(pos);camera.lookAt(look);cam.target.copy(E);
 if(F.st==='waiting'){F.wait=1e9;F.shakeT=1e9;}}
function menuAct(k){AU.init();AU.ui();
 if(k==='continue')closeMenu(()=>{if(!state.tips.intro)openIntro();else toast('Welcome back to '+ZONES[state.last||'cove'].n+'!');});
 else if(k==='new'){if(state.profile&&state.tips.joined){openPanel('Start a new game?','',()=>{body(`<div class="muted">This erases your coins, fish, rods, quests and Bestiary on this device. There is no undo.</div><div class="row"><button class="btn rose" data-act="yes">Erase and start over</button><button class="btn ghost" data-act="no">Keep my save</button></div>`);
   bindPanel({yes:()=>{const keep=state.settings;state=freshState();state.settings=keep;qState();save();onStateReplaced();closePanel();renderMenu();closeMenu(()=>openJoin(false));},no:()=>closePanel()});});}
  else closeMenu(()=>openJoin(false));}
 else if(k==='mp')openMultiplayer();else if(k==='settings')openSettings();else if(k==='credits')openCredits();}
$('#menuNav').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b)menuAct(b.dataset.m);});
$('#menuNav').addEventListener('pointermove',e=>{const b=e.target.closest('[data-m]');if(!b)return;const i=MENU.items.findIndex(x=>x[0]===b.dataset.m);if(i>=0&&i!==MENU.sel){MENU.sel=i;$('#menuNav').querySelectorAll('button').forEach((x,j)=>x.classList.toggle('sel',j===i));}});
function menuKey(k){if(!$('#panelWrap').hidden)return false;if(k==='ArrowDown'||k==='KeyS'){MENU.sel=(MENU.sel+1)%MENU.items.length;renderMenu();AU.ui();return true;}if(k==='ArrowUp'||k==='KeyW'){MENU.sel=(MENU.sel+MENU.items.length-1)%MENU.items.length;renderMenu();AU.ui();return true;}
 if(k==='Enter'||k==='Space'){menuAct(MENU.items[MENU.sel][0]);return true;}return true;}
function openMultiplayer(){openPanel('Multiplayer','Fish the isles together',()=>{panelCtx.kind='mp';const ok=Net.backend!=='none';
 body(`<div class="card"><h3>${ok?(Net.connected?'Connected':'Connecting…'):'Solo mode'}</h3><div class="muted">${ok?`Everyone who opens this game shares the same isles. You'll see other anglers with their name tags, their boats and their catches, and you can chat, emote and climb the leaderboards together.${Net.connected?` Right now there ${Net.remotes.size===0?'is no one else':Net.remotes.size===1?'is 1 other angler':'are '+Net.remotes.size+' other anglers'} online.`:''}`:'Online play has not been switched on for this copy of the game, so you will fish on your own. Your progress still saves on this device.'}</div></div>
  <div class="card"><h3>Your angler</h3><div class="row"><div class="grow muted">${state.profile?esc(state.profile.name)+' · '+esc(state.title||'Novice Angler'):'Pick a name and a look when you start.'}</div><button class="btn mint" data-act="go">${state.profile&&state.tips.joined?'Join the isles':'Create angler'}</button></div></div>`);
 bindPanel({go:()=>{closePanel();menuAct(state.profile&&state.tips.joined?'continue':'new');}});});}
function openCredits(){openPanel('Credits','Driftwood Isles',()=>{body(`<div class="card"><h3>Game</h3><div class="muted">Driftwood Isles, a cozy fishing game. Design, code and every model, texture and sound are generated in code for this project.</div></div>
 <div class="card"><h3>Technology</h3><div class="muted">three.js for 3D rendering · Vite for building · Preetham sky model · Firebase Realtime Database for online play.</div></div>
 <div class="card"><h3>Fonts</h3><div class="muted">Nunito by Vernon Adams · Josefin Sans by Santiago Orozco (SIL Open Font License, via Google Fonts).</div></div>
 <div class="card"><h3>Thanks</h3><div class="muted">To every angler who casts a line here. Tight lines!</div></div>`);bindPanel({});});}

/* ---------- pause menu ---------- */
const PAUSE={on:false};
function openPause(){if(MENU.on||JOIN.on)return;PAUSE.on=true;$('#pause').hidden=false;hideEmotes();for(const k in keys)keys[k]=false;}
function closePause(){PAUSE.on=false;$('#pause').hidden=true;canvas.focus({preventScroll:true});}
$('#pause').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b){if(e.target.id==='pause')closePause();return;}AU.ui();const p=b.dataset.p;
 if(p==='resume')closePause();else if(p==='settings')openSettings();else if(p==='controls')openControls();else if(p==='look'){closePause();openJoin(true);}else if(p==='menu'){closePause();save();openMenu();}});
function controlsHTML(){return isTouch?'<kbd>Joystick</kbd><span>Walk, or sail the boat</span><kbd>Drag</kbd><span>Turn the camera · pinch to zoom</span><kbd>Hold Cast</kbd><span>Charge, release to cast</span><kbd>Tap circles</kbd><span>Shake the line so fish bite sooner</span><kbd>Hold anywhere</kbd><span>Reel during the minigame</span><kbd>Hotbar</kbd><span>Rods, bait, backpack, Bestiary, quests, emotes, stats, map</span>'
 :'<kbd>W A S D</kbd><span>Walk (Shift to run), or sail the boat</span><kbd>Mouse drag · Scroll</kbd><span>Turn and zoom the camera</span><kbd>← → · , .</kbd><span>Turn or snap the camera</span><kbd>Hold mouse or F</kbd><span>Charge, release to cast</span><kbd>Space</kbd><span>Jump · shake the line · reel</span><kbd>E</kbd><span>Talk, board or leave the boat</span><kbd>1 – 8</kbd><span>Rods, bait, backpack, Bestiary, quests, emotes, stats, map</span><kbd>B G Q M K L O P</kbd><span>Backpack, Bestiary, Quests, Map, Stats, Leaderboards, Online, Photo mode</span><kbd>Enter</kbd><span>Chat</span><kbd>Esc</kbd><span>Pause menu</span>';}
function openControls(){openPanel('Controls',isTouch?'Touch':'Keyboard and mouse',()=>{body(`<div class="card"><div class="keys">${controlsHTML()}</div></div>`);bindPanel({});});}

/* ---------- compass ---------- */
const COMP={built:false,ppd:3};
function buildCompass(){const el=$('#compassStrip');const names={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};let h='';
 for(let d=-360;d<=720;d+=15){const a=((d%360)+360)%360;const x=(d+360)*COMP.ppd;h+=names[a]!=null?`<span style="left:${x}px" class="${a%90===0?'':'c'}">${names[a]}</span>`:`<span class="t" style="left:${x}px">|</span>`;}el.innerHTML=h;COMP.built=true;}
const _cf=new THREE.Vector3();
function updateCompass(){if(!COMP.built)buildCompass();camera.getWorldDirection(_cf);const deg=((Math.atan2(_cf.x,-_cf.z)*180/Math.PI)+360)%360;const w=$('#compass').clientWidth;$('#compassStrip').style.transform=`translateX(${w/2-(deg+360)*COMP.ppd}px)`;}

/* ---------- minimap + world map ---------- */
const ISL_COL={cove:'#6c9a52',moss:'#4f7040',frost:'#e2e8ec',ember:'#4a4240'};
function islPath(x,I,toX,toY,f){x.beginPath();for(let i=0;i<=64;i++){const th=i/64*TAU,R=islandR(I,th)*f,wx=I.x+Math.cos(th)*R,wz=I.z+Math.sin(th)*R;i?x.lineTo(toX(wx),toY(wz)):x.moveTo(toX(wx),toY(wz));}x.closePath();}
function drawWorldMap(cv,cx0,cz0,mPerPx,opt={}){const x=cv.getContext('2d'),W=cv.width,H=cv.height,S=1/mPerPx,toX=wx=>W/2+(wx-cx0)*S,toY=wz=>H/2+(wz-cz0)*S;
 const g=x.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.7);g.addColorStop(0,'#2f7090');g.addColorStop(1,'#1d4a62');x.fillStyle=g;x.fillRect(0,0,W,H);
 const view=Math.max(W,H)*mPerPx;
 for(const k of ISL){const I=ZONES[k];if(Math.hypot(I.x-cx0,I.z-cz0)>view+I.R*1.5)continue;const locked=!state.unlocked.includes(k);
  x.fillStyle='rgba(120,200,210,.35)';islPath(x,I,toX,toY,1.32);x.fill();x.fillStyle='#d9c79a';islPath(x,I,toX,toY,1);x.fill();x.fillStyle=ISL_COL[k];islPath(x,I,toX,toY,.84);x.fill();
  if(I.volcano){x.fillStyle='#2a2220';x.beginPath();x.arc(toX(I.x),toY(I.z),I.R*.3*S,0,TAU);x.fill();x.fillStyle='#ff7a2a';x.beginPath();x.arc(toX(I.x),toY(I.z),I.R*.08*S,0,TAU);x.fill();}
  for(const p of I.ponds||[]){x.fillStyle='#3d7f8c';x.beginPath();x.arc(toX(p.x),toY(p.z),p.r*S,0,TAU);x.fill();}
  if(I.paths){x.strokeStyle='rgba(140,112,80,.85)';x.lineWidth=Math.max(1.5,2.4*S);x.lineCap='round';for(const sg of I.paths){x.beginPath();x.moveTo(toX(sg[0].x),toY(sg[0].z));x.lineTo(toX(sg[1].x),toY(sg[1].z));x.stroke();}}
  if(opt.labels){x.font=`600 ${Math.max(12,Math.round(W/34))}px "Josefin Sans",sans-serif`;x.textAlign='center';x.fillStyle=locked?'rgba(255,255,255,.55)':'#fff';x.shadowColor='rgba(0,0,0,.7)';x.shadowBlur=4;x.fillText(ZONES[k].n.toUpperCase()+(locked?' · CHART NEEDED':''),toX(I.x),toY(I.z-I.R*1.15));x.shadowBlur=0;}}
 for(const r of world.seaRocks){if(Math.hypot(r.x-cx0,r.z-cz0)>view+20)continue;x.fillStyle='#cdb98e';x.beginPath();x.arc(toX(r.x),toY(r.z),Math.max(1.5,r.r*.75*S),0,TAU);x.fill();}
 x.strokeStyle='#8a6a48';x.lineWidth=Math.max(2,3.2*S);for(const d of world.docks){x.beginPath();x.moveTo(toX(d.x),toY(d.z));x.lineTo(toX(d.x+d.cx*d.len),toY(d.z+d.sz*d.len));x.stroke();}
 for(const n of world.npcs){x.fillStyle='#f2c14e';x.beginPath();x.arc(toX(n.x),toY(n.z),Math.max(2.5,opt.labels?3:2.2*S*1.6),0,TAU);x.fill();}
 if(world.lighthouse){x.fillStyle='#e8584a';x.beginPath();x.arc(toX(world.lighthouse.x),toY(world.lighthouse.z),4,0,TAU);x.fill();}
 if(BIG.whales.length&&BIG.active==='leviathan')for(const w of BIG.whales){if(!w.g.visible)continue;x.fillStyle='rgba(30,40,56,.8)';x.beginPath();x.ellipse(toX(w.g.position.x),toY(w.g.position.z),6,3,-w.a,0,TAU);x.fill();}
 if(boat&&player.mode!=='boat'){x.fillStyle='#7a5a3a';x.beginPath();x.arc(toX(boat.pos.x),toY(boat.pos.z),3.5,0,TAU);x.fill();}
 for(const r of Net.remotes.values()){if(!r.rig)continue;x.fillStyle=r.color;x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();x.arc(toX(r.pos.x),toY(r.pos.z),4.5,0,TAU);x.fill();x.stroke();}
 const yaw=player.mode==='boat'?boat.yaw:player.face,px=toX(player.pos.x),py=toY(player.pos.z),sz=opt.labels?11:13,fx=Math.sin(yaw),fy=Math.cos(yaw);
 x.fillStyle='#fff';x.strokeStyle='#111';x.lineWidth=2.5;x.beginPath();x.moveTo(px+fx*sz,py+fy*sz);x.lineTo(px-fx*sz*.6-fy*sz*.6,py-fy*sz*.6+fx*sz*.6);x.lineTo(px-fx*sz*.25,py-fy*sz*.25);x.lineTo(px-fx*sz*.6+fy*sz*.6,py-fy*sz*.6-fx*sz*.6);x.closePath();x.stroke();x.fill();
 if(opt.edge){for(const k of ISL){const I=ZONES[k],dx=I.x-cx0,dz=I.z-cz0,d=Math.hypot(dx,dz);if(d<(W/2)*mPerPx+I.R*.6)continue;const a=Math.atan2(dz,dx),rr=W/2-16;
  x.save();x.translate(W/2+Math.cos(a)*rr,H/2+Math.sin(a)*rr);x.rotate(a);x.fillStyle='#f2c14e';x.beginPath();x.moveTo(9,0);x.lineTo(-6,-7);x.lineTo(-6,7);x.closePath();x.fill();x.restore();}}}
const MINI={t:0};
function updateMiniHUD(dt){updateCompass();MINI.t-=dt;if(MINI.t>0)return;MINI.t=.12;const cv=$('#minimap');if(cv&&cv.offsetParent!==null)drawWorldMap(cv,player.pos.x,player.pos.z,1.5,{edge:true});
 const z=player.zone||'cove';const label=pondAt(player.pos.x,player.pos.z)?ZONES[pondAt(player.pos.x,player.pos.z).key].n:ZONES[z].n;const mz=$('#mmZone');if(mz.textContent!==label)mz.textContent=label;
 if(panelCtx&&panelCtx.kind==='map'){const mc=$('#mapCv');if(mc)drawWorldMap(mc,0,80,2700/mc.width,{labels:true});}}
function openMap(){if(JOIN.on)return;openPanel('Map of the isles','You · islanders · your boat · other anglers',()=>{panelCtx.kind='map';body(`<div class="map"><canvas id="mapCv" width="900" height="900"></canvas></div><div class="row muted"><span><b style="color:#fff">▲</b> You</span><span><b style="color:#f2c14e">●</b> Islanders</span><span><b style="color:#8a6a48">●</b> Your boat</span><span><b style="color:#e8584a">●</b> Lighthouse</span></div>`);bindPanel({});MINI.t=0;});}

/* ---------- hotbar ---------- */
function renderHotbar(){if(!$('#hbRodN'))return;const r=RODM[state.rod],e=state.ench[state.rod],b=state.baitOn?BAITM[state.baitOn]:null,dex=SPECIES.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length;
 const set=(id,v)=>{const el=$(id);if(el&&el.textContent!==v)el.textContent=v;};
 set('#hbRodN',r.n.replace(/ Rod$/,''));set('#hbRodS',e?ENCH[e].n:'Rod');set('#hbBaitN',b?b.n:'No bait');set('#hbBaitS',b?'Equipped':'Tap to pick');set('#hbBaitQ',b?'×'+(state.bait[state.baitOn]||0):'');
 set('#hbBagS',state.inv.length+'/'+maxInv());set('#hbDexS',dex+'/'+SPECIES.length);const aq=activeQuests(),ready=aq.filter(q=>qState().a[q.id]>=q.goal.n).length;set('#hbQuestS',aq.length?(ready?ready+' ready':aq.length+' active'):'None');set('#hbQuestQ',ready?'!':'');
 set('#hbMapS',ZONES[player&&player.zone||'cove'].n);}
function openGear(tab){if(JOIN.on)return;tab=tab||'rods';openPanel('Your gear','Swap rods and bait any time',()=>{
 let h=`<div class="tabs"><button class="tab ${tab==='rods'?'on':''}" data-act="tab" data-id="rods">Rods</button><button class="tab ${tab==='bait'?'on':''}" data-act="tab" data-id="bait">Bait</button></div>`;
 if(tab==='rods')h+=`<div class="list">${state.rods.map(id=>RODM[id]).filter(Boolean).map(r=>{const eq=state.rod===r.id,e=state.ench[r.id];return `<div class="card ${eq?'eq':''}"><div class="row"><div class="grow"><h3>${esc(r.n)}</h3>${e?`<span class="ench" style="--c:${ENCH[e].c}">${ENCH[e].n} · ${ENCH[e].d}</span>`:''}${r.perk?`<div class="muted">${esc(r.perk.d)}</div>`:''}</div>${eq?'<span class="pill" style="--c:#9be07a">Equipped</span>':`<button class="btn sky sm" data-act="equip" data-id="${r.id}">Equip</button>`}</div>${statBars(r)}</div>`;}).join('')}</div><div class="muted">Buy more rods from Tess on Pebble Cove or Oren on Emberkey.</div>`;
 else{const own=BAITS.filter(b=>state.bait[b.id]>0);h+=own.length?`<div class="list">${own.map(b=>{const on=state.baitOn===b.id;return `<div class="card ${on?'eq':''}"><div class="row"><div class="grow"><h3>${esc(b.n)} <span class="muted">×${state.bait[b.id]}</span></h3><div class="muted">${esc(b.d)}</div></div>${on?'<button class="btn ghost sm" data-act="boff">Unequip</button>':`<button class="btn sky sm" data-act="bon" data-id="${b.id}">Equip</button>`}</div></div>`;}).join('')}</div>`:'<div class="muted">No bait yet. Tess sells bait on Pebble Cove, and some quests reward it.</div>';}
 body(h);bindPanel({tab:id=>{tab=id;rerender();},equip:id=>{if(!state.rods.includes(id))return;state.rod=id;equipRodModel();save();updateHUD();rerender();},bon:id=>{state.baitOn=id;save();updateGear();rerender();},boff:()=>{state.baitOn=null;save();updateGear();rerender();}});});}
$('#hbRod').addEventListener('click',()=>{AU.init();openGear('rods');});$('#hbBait').addEventListener('click',()=>{AU.init();openGear('bait');});
$('#questBtn').addEventListener('click',()=>{AU.init();openQuests();});$('#mapBtn').addEventListener('click',()=>{AU.init();openMap();});$('#mmBtn').addEventListener('click',()=>{AU.init();openMap();});
function hotbarKey(n){({1:()=>openGear('rods'),2:()=>openGear('bait'),3:openBag,4:openDex,5:openQuests,6:()=>{const m=$('#emoteMenu');m.hidden=!m.hidden;},7:openStats,8:openMap})[n]?.();}

/* ---------- name tags: level, name and title, outlined like the HUD ---------- */
function tagTex(top,name,sub,subCol,dot){const c=document.createElement('canvas');c.width=512;c.height=sub?168:118;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
 const line=(t,y,font,fill,lw)=>{x.font=font;x.lineWidth=lw;x.strokeStyle='rgba(0,0,0,.85)';x.strokeText(t,256,y,480);x.fillStyle=fill;x.fillText(t,256,y,480);};
 let y=24;if(top){line(top,y,'800 30px Nunito, sans-serif','#f4f1ea',7);y+=40;}else y=26;line(name,y+6,'900 46px Nunito, sans-serif',dot||'#ffffff',9);if(sub)line(sub,y+56,'800 32px Nunito, sans-serif',subCol||'#f2c14e',7);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;}
function tagSprite(top,name,sub,subCol,dot){const t=tagTex(top,name,sub,subCol,dot);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));const a=t.image.height/512;s.scale.set(3.4,3.4*a,1);s.center.set(.5,0);s.renderOrder=3;return s;}
let myTag=null;
function rebuildPlayerTag(){if(typeof prig==='undefined'||!prig)return;if(myTag){prig.root.remove(myTag);myTag.material.map.dispose();myTag=null;}const p=profileOr();
 myTag=tagSprite('Level '+state.level,p.name,state.title||'Novice Angler',TITLE_COL[state.title]||'#c9d2da');myTag.position.set(0,HEAD_TOP+.45,0);myTag.visible=false;prig.root.add(myTag);}
