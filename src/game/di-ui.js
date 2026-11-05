'use strict';
/* Driftwood Isles — UI panels, join screen, chat, feed, leaderboards, multiplayer, main loop */
let panelCtx=null;
function openPanel(title,sub,render){if(['waiting','casting','bite','reeling'].includes(F.st))cancelFishing();if(F.st==='charging'){F.st='idle';$('#power').hidden=true;}
 hideEmotes();$('#pTitle').textContent=title;$('#pSub').textContent=sub||'';panelCtx={render};const w=$('#panelWrap');const was=!w.hidden;w.hidden=false;if(!was)AU.open();
 const p=$('#panel');p.style.animation='none';void p.offsetWidth;p.style.animation='';render();for(const k in keys)keys[k]=false;joy.x=joy.y=0;}
function rerender(){if(panelCtx)panelCtx.render();}
function closePanel(){if($('#panelWrap').hidden)return;$('#panelWrap').hidden=true;panelCtx=null;AU.close();canvas.focus({preventScroll:true});}
function body(html){const b=$('#pBody');const sc=b.scrollTop;b.innerHTML=html;b.scrollTop=sc;}
$('#pClose').addEventListener('click',()=>closePanel());$('#panelWrap').addEventListener('pointerdown',e=>{if(e.target.id==='panelWrap')closePanel();});
$('#bagBtn').addEventListener('click',()=>{AU.init();openBag();});$('#dexBtn').addEventListener('click',()=>{AU.init();openDex();});$('#setBtn').addEventListener('click',()=>{AU.init();openSettings();});
$('#lbBtn').addEventListener('click',()=>{AU.init();openLeaderboard();});$('#statBtn').addEventListener('click',()=>{AU.init();openStats();});$('#onBtn').addEventListener('click',()=>{AU.init();openOnline();});
const lockSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const unlockSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/></svg>';
function fishSVG(sp,mut,hidden){let c1,c2;if(hidden){c1='#c3cad6';c2='#b2bac8';}else{const[a,b]=mutColors(sp,mut);c1='#'+a.getHexString();c2='#'+b.getHexString();}
 const cls=hidden?'':mut==='glowing'?'glow':mut==='prismatic'?'prism':mut==='shiny'?'shiny':'';const st=mut==='glowing'?`style="--g:${c1}"`:'';const eye=(x,y)=>`<circle cx="${x}" cy="${y}" r="2.4" fill="${hidden?'#9aa4b4':'#33405a'}"/>`;let s='';const sh=sp.shape;
 if(sh==='fish'||sh==='tall'){const ry=sh==='tall'?14:11;s=`<polygon points="4,${20-ry*.7} 16,20 4,${20+ry*.7}" fill="${c1}"/><polygon points="28,${20-ry+1} 38,${20-ry-5} 44,${20-ry+2}" fill="${c1}"/><ellipse cx="36" cy="20" rx="22" ry="${ry}" fill="${c1}"/><ellipse cx="38" cy="${20+ry*.45}" rx="16" ry="${ry*.4}" fill="${c2}"/>${eye(50,18)}`;}
 else if(sh==='long')s=`<polygon points="2,11 13,20 2,29" fill="${c1}"/><ellipse cx="33" cy="20" rx="25" ry="7.5" fill="${c1}"/><ellipse cx="34" cy="23" rx="20" ry="3" fill="${c2}"/><polygon points="57,18 64,20 57,22" fill="${c1}"/>${eye(51,18)}`;
 else if(sh==='eel')s=`<path d="M4 24 Q14 10 24 20 T44 20 T58 17" fill="none" stroke="${c1}" stroke-width="8" stroke-linecap="round"/><path d="M8 24 Q16 14 24 22 T44 22" fill="none" stroke="${c2}" stroke-width="2"/>${eye(56,16)}`;
 else if(sh==='flat')s=`<polygon points="4,14 14,20 4,26" fill="${c1}"/><ellipse cx="34" cy="20" rx="23" ry="14" fill="${c1}"/><circle cx="28" cy="16" r="3" fill="${c2}"/><circle cx="36" cy="24" r="3.5" fill="${c2}"/>${eye(48,15)}${eye(50,22)}`;
 else if(sh==='ray')s=`<line x1="2" y1="20" x2="22" y2="20" stroke="${c1}" stroke-width="2.5"/><polygon points="40,3 62,20 40,37 18,20" fill="${c1}"/><circle cx="38" cy="15" r="2.5" fill="${c2}"/><circle cx="44" cy="25" r="3" fill="${c2}"/>${eye(50,17)}`;
 else if(sh==='squid')s=`<path d="M30 14 Q16 10 4 14 M30 18 Q16 18 3 22 M30 22 Q18 26 6 30 M30 26 Q20 32 10 36" stroke="${c2}" stroke-width="2.6" fill="none" stroke-linecap="round"/><polygon points="62,20 30,8 30,32" fill="${c1}"/>${eye(36,18)}`;
 else if(sh==='shark')s=`<polygon points="3,4 14,20 3,35 9,20" fill="${c1}"/><polygon points="26,11 34,1 40,12" fill="${c1}"/><path d="M12 20 Q30 6 62 19 Q34 32 12 20Z" fill="${c1}"/><path d="M22 23 Q40 30 58 21" fill="none" stroke="${c2}" stroke-width="3"/>${eye(52,17)}`;
 return `<svg class="fsvg ${cls}" ${st} viewBox="0 0 64 40" aria-hidden="true">${s}</svg>`;}
function apprCost(f){return Math.max(25,Math.round(SPM[f.sp].price*.4));}
function fishRows(mode,list){if(!list.length)return '<div class="muted">No fish yet. Walk to the water and cast your line!</div>';
 return list.map(f=>{const sp=SPM[f.sp];let act='';
  if(mode==='sell')act=`<button class="btn sm mint" data-act="sell" data-id="${f.id}" ${f.lock?'disabled':''}>Sell</button>`;
  if(mode==='appr'){const c=apprCost(f);act=`<button class="btn sm lav" data-act="appr" data-id="${f.id}" ${state.coins<c?'disabled':''}>${fmt(c)}c</button>`;}
  return `<div class="frow ${f.lock?'locked':''}">${fishSVG(sp,f.mut)}<div class="fmeta"><b>${f.mut?MUTS[f.mut].n+' ':''}${esc(sp.name)}</b><div class="tags">${rarPill(sp.r)}${f.mut?mutPill(f.mut):''}</div><small>${fmtW(f.w)} kg · ${ZONES[sp.zone].n}</small></div><div class="fval">${fmt(fishValue(f))}c</div><button class="lk ${f.lock?'on':''}" data-act="lock" data-id="${f.id}" aria-label="${f.lock?'Unlock':'Lock'} ${esc(sp.name)}" title="${f.lock?'Locked: never sold by Sell all':'Lock to protect'}">${f.lock?lockSVG:unlockSVG}</button>${act}</div>`;}).join('');}
function sortedInv(){return state.inv.slice().sort((a,b)=>fishValue(b)-fishValue(a));}
function bindPanel(h){const all=Object.assign({},QH,h);$('#pBody').onclick=e=>{const t=e.target.closest('[data-act]');if(!t||t.disabled)return;const f=all[t.dataset.act];if(f){AU.ui();f(t.dataset.id,t);}};}
const lockH=id=>{const f=state.inv.find(x=>x.id==id);if(f){f.lock=!f.lock;save();rerender();}};
function openBag(){if(JOIN.on)return;openPanel('Your bag',`${state.inv.length} of ${maxInv()} fish · ${state.relics} Tide Relic${state.relics===1?'':'s'}`,()=>{const tot=state.inv.reduce((s,f)=>s+fishValue(f),0);
 body(`<div class="row"><div class="grow muted">Bag value <span class="big">${fmt(tot)}c</span><br>Locked fish are never sold by Sell all.</div></div><div class="list">${fishRows('bag',sortedInv())}</div>`);bindPanel({lock:lockH});});}
function openNPC(n){if(n.role==='merchant')openMerchant(n);else if(n.role==='rods')openRods(n);else if(n.role==='appraiser')openAppraiser(n);else if(n.role==='harbor')openHarbor(n);else if(n.role==='altar')openAltar(n);else if(n.role==='shipwright')openShipwright(n);else if(n.role==='buffs')openBuffs(n);}
function openMerchant(n){const line=npcSay(n);openPanel(n.name,n.title,()=>{const un=state.inv.filter(f=>!f.lock);const tot=un.reduce((s,f)=>s+fishValue(f),0);
 body(`${line}<div class="row"><div class="grow muted">${un.length} unlocked fish worth <span class="big">${fmt(tot)}c</span></div><button class="btn mint" data-act="all" ${un.length?'':'disabled'}>Sell all · ${fmt(tot)}c</button></div><div class="list">${fishRows('sell',sortedInv())}</div>`);
 bindPanel({lock:lockH,sell:id=>{const i=state.inv.findIndex(x=>x.id==id);if(i<0)return;const v=fishValue(state.inv[i]);state.inv.splice(i,1);state.coins+=v;state.earned+=v;AU.coin();questEvent('sell',{v});save();updateHUD();rerender();},
  all:()=>{let t=0;state.inv=state.inv.filter(f=>{if(f.lock)return true;t+=fishValue(f);return false;});state.coins+=t;state.earned+=t;AU.coin();questEvent('sell',{v:t});toast(`Sold for ${fmt(t)} coins`,'gold');save();updateHUD();rerender();}});});}
function statBars(o){const rows=[['Luck',o.luck/180,'+'+o.luck+'%','#9fe0c0'],['Reel speed',(o.reel-.9)/.8,o.reel.toFixed(2)+'×','#a6d4f7'],['Control',o.ctrl/.2,'+'+Math.round(o.ctrl*100),'#ffe08a'],['Resilience',o.res/.5,'+'+Math.round(o.res*100)+'%','#ffc0a6']];
 return `<div class="statg">${rows.map(r=>`<span>${r[0]}</span><div class="sbar" style="--c:${r[3]}"><i style="width:${clamp(r[1],.03,1)*100}%"></i></div><span>${r[2]}</span>`).join('')}</div>`;}
function openRods(n){let tab='rods';const line=npcSay(n);openPanel(n.name,n.title,()=>{
 let h=`${line}<div class="tabs"><button class="tab ${tab==='rods'?'on':''}" data-act="tab" data-id="rods">Rods</button><button class="tab ${tab==='bait'?'on':''}" data-act="tab" data-id="bait">Bait</button></div>`;
 if(tab==='rods')h+=`<div class="list">${RODS.map(r=>{const own=state.rods.includes(r.id),eq=state.rod===r.id,e=state.ench[r.id];
  return `<div class="card ${eq?'eq':''}"><div class="row"><img class="thumb" src="${rodThumb(r)}" alt=""><div class="grow"><h3>${esc(r.n)}</h3>${e?`<span class="ench" style="--c:${ENCH[e].c}">${ENCH[e].n} · ${ENCH[e].d}</span>`:''}</div>
  ${eq?'<span class="pill" style="--c:#c4efcc">Equipped</span>':own?`<button class="btn sky sm" data-act="equip" data-id="${r.id}">Equip</button>`:rodLocked(r)?`<span class="muted">${esc(rodLocked(r))}</span>`:`<button class="btn sm" data-act="buy" data-id="${r.id}" ${state.coins<r.price?'disabled':''}>${fmt(r.price)}c</button>`}</div>${statBars(r)}${r.perk?`<div class="muted">Perk: ${esc(r.perk.d)}</div>`:''}</div>`;}).join('')}</div>`;
 else h+=`<div class="muted">Each cast uses one bait. Equipped: <b>${state.baitOn?BAITM[state.baitOn].n:'none'}</b></div><div class="list">${BAITS.map(b=>{const q=state.bait[b.id]||0,on=state.baitOn===b.id;
  return `<div class="card ${on?'eq':''}"><div class="row"><img class="thumb sm" src="${baitIcon(b)}" alt=""><div class="grow"><h3>${esc(b.n)} <span class="muted">×${q}</span></h3><div class="muted">${esc(b.d)}</div></div>
  <button class="btn sm" data-act="bbuy" data-id="${b.id}" ${state.coins<b.price?'disabled':''}>${b.qty} for ${fmt(b.price)}c</button>${q?(on?`<button class="btn sm ghost" data-act="boff">Unequip</button>`:`<button class="btn sm sky" data-act="bon" data-id="${b.id}">Equip</button>`):''}</div></div>`;}).join('')}</div>`;
 body(h);bindPanel({tab:id=>{tab=id;rerender();},buy:id=>{const r=RODM[id];if(state.coins<r.price||rodLocked(r))return;state.coins-=r.price;state.rods.push(id);state.rod=id;equipRodModel();AU.coin();questEvent('rod');toast(`You bought the ${r.n}!`,'gold');save();updateHUD();rerender();},
  equip:id=>{state.rod=id;equipRodModel();save();updateHUD();rerender();},bbuy:id=>{const b=BAITM[id];if(state.coins<b.price)return;state.coins-=b.price;state.bait[id]=(state.bait[id]||0)+b.qty;if(!state.baitOn)state.baitOn=id;AU.coin();save();updateHUD();rerender();},
  bon:id=>{state.baitOn=id;save();updateGear();rerender();},boff:()=>{state.baitOn=null;save();updateGear();rerender();}});});}
function openAppraiser(n){let result='';const line=npcSay(n);openPanel(n.name,n.title,()=>{
 body(`${line}${result}<div class="muted">Pay to reroll a fish's weight. There's an 18% chance it gains or changes a mutation.</div><div class="list">${fishRows('appr',sortedInv())}</div>`);
 bindPanel({lock:lockH,appr:id=>{const f=state.inv.find(x=>x.id==id);if(!f)return;const c=apprCost(f);if(state.coins<c)return;state.coins-=c;const sp=SPM[f.sp];const ow=f.w,om=f.mut;f.w=rollWeight(sp,1);let mm='';
  if(Math.random()<.18){const nm=rollMutation();f.mut=nm;mm=` It's now <b>${MUTS[nm].n}</b>!`;AU.enchant();}else AU.coin();
  result=`<div class="card eq"><b>${esc(sp.name)}</b><span class="muted">Weight ${fmtW(ow)} kg → <b>${fmtW(f.w)} kg</b>.${mm}${om&&f.mut!==om&&mm?' (was '+MUTS[om].n+')':''}</span></div>`;
  const dx=state.dex[f.sp];if(dx){dx.best=Math.max(dx.best,f.w);if(f.mut&&!dx.muts.includes(f.mut))dx.muts.push(f.mut);}save();updateHUD();rerender();}});});}
function openHarbor(n){const line=npcSay(n);openPanel(n.name,n.title,()=>{const here=zoneAt(player.pos.x,player.pos.z);
 body(`${line}<div class="list">${ISL.map(k=>{const z=ZONES[k],own=state.unlocked.includes(k);
  return `<div class="card ${k===here?'eq':''}"><div class="row"><img class="thumb sm" src="${chartIcon(k)}" alt=""><div class="grow"><h3>${esc(z.n)}</h3><div class="muted">${esc(z.tag)} · ${SPECIES.filter(s=>s.zone===k).length} species</div></div>
  ${k===here?'<span class="pill" style="--c:#c4efcc">You are here</span>':own?`<button class="btn sky" data-act="go" data-id="${k}">Ferry there</button>`:`<button class="btn" data-act="unlock" data-id="${k}" ${state.coins<z.price?'disabled':''}>Buy chart · ${fmt(z.price)}c</button>`}</div></div>`;}).join('')}</div>
  <div class="muted">Open Waters between the islands are free to sail. The boat is moored at the end of the dock.</div>`);
 bindPanel({unlock:id=>{const z=ZONES[id];if(state.coins<z.price)return;state.coins-=z.price;state.unlocked.push(id);AU.level();toast(`${z.n} chart bought! Sail there or take the ferry.`,'gold');save();updateHUD();rerender();},
  go:id=>{const sp=world.spawn[id];player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);player.face=sp.yaw;cam.yaw=sp.yaw+Math.PI;cam.target.copy(player.pos);placeBoatAt(id);cam.tdist=12;state.last=id;save();closePanel();}});});}
function openAltar(n){let result='';openPanel('Tide Altar','Mossreach',()=>{const r=RODM[state.rod],e=state.ench[state.rod];
 body(`${n?npcSay(n):''}${result}<div class="card"><h3>${esc(r.n)}</h3><div class="muted">Current enchant: ${e?`<span class="ench" style="--c:${ENCH[e].c}">${ENCH[e].n}</span> ${ENCH[e].d}`:'none'}</div>
  <div class="row"><div class="grow muted">You have <span class="big">${state.relics}</span> Tide Relic${state.relics===1?'':'s'}. Each offering gives your equipped rod a new random enchant.</div><button class="btn lav" data-act="ench" ${state.relics?'':'disabled'}>Offer a relic</button></div></div>
  <div class="dex">${Object.entries(ENCH).map(([k,v])=>`<div class="dcard"><span class="ench" style="--c:${v.c}">${v.n}</span><small>${v.d}</small></div>`).join('')}</div>`);
 bindPanel({ench:()=>{if(!state.relics)return;state.relics--;const k=pick(Object.keys(ENCH).filter(k=>k!==state.ench[state.rod]));state.ench[state.rod]=k;equipRodModel();AU.enchant();
  if(world.altarCrystal)splash(world.altarCrystal.position,30,7);result=`<div class="card eq"><b>The altar flares!</b><span class="muted">Your ${esc(r.n)} is now <span class="ench" style="--c:${ENCH[k].c}">${ENCH[k].n}</span> · ${ENCH[k].d}</span></div>`;save();updateHUD();rerender();}});});}
function openDex(){if(JOIN.on)return;let tab=player.zone&&ZONES[player.zone]?player.zone:'cove';openPanel('Bestiary','',()=>{const got=SPECIES.filter(s=>state.dex[s.id]&&state.dex[s.id].n).length;$('#pSub').textContent=`${got} of ${SPECIES.length} species caught`;
 const zs=[...ISL,'sea',...ISL.map(k=>'pond_'+k)];const list=SPECIES.filter(s=>s.zone===tab);const cnt=z=>SPECIES.filter(s=>s.zone===z&&state.dex[s.id]&&state.dex[s.id].n).length;
 body(`<div class="tabs">${zs.map(z=>`<button class="tab ${tab===z?'on':''}" data-act="tab" data-id="${z}">${ZONES[z].n} ${cnt(z)}/${SPECIES.filter(s=>s.zone===z).length}</button>`).join('')}</div>
 <div class="dex">${list.map(s=>{const d=state.dex[s.id];const c=d&&d.n;return `<div class="dcard ${c?'':'no'}">${fishSVG(s,null,!c)}<b>${esc(s.name)}</b>${rarPill(s.r)}<small>${ZONES[s.zone].n}${s.cond?' · '+COND[s.cond]:''}<br>${fmtW(s.minW)}–${fmtW(s.maxW)} kg · base ${fmt(s.price)}c<br>${c?`Caught ×${d.n} · best ${fmtW(d.best)} kg${d.muts&&d.muts.length?'<br>Mutations: '+d.muts.map(m=>MUTS[m].n).join(', '):''}`:'Not caught yet'}</small></div>`;}).join('')}</div>`);
 bindPanel({tab:id=>{tab=id;rerender();}});});}
function vol(id,label,v){return `<label class="slider" for="${id}"><span>${label}</span><input type="range" id="${id}" min="0" max="1" step="0.01" value="${v}" style="--p:${v*100}%"><span>${Math.round(v*100)}</span></label>`;}
function openSettings(){if(JOIN.on&&!MENU.on)return;let confirmReset=false;openPanel('Settings','Progress saves automatically',()=>{const s=state.settings,g=s.gfx;
 body(`<div class="card"><h3>Graphics</h3><div class="tabs">${['ultra','high','medium','low'].map(t=>`<button class="tab ${g===t?'on':''}" data-act="gfx" data-id="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>
  <div class="muted">${g==='ultra'?'Everything on: sharp mirror reflections, 4K soft shadows, full ambient occlusion, high-resolution textures and the densest foliage. For strong desktop GPUs.':g==='high'?'Mirror reflections on the water, soft shadows, ambient occlusion, bloom and dense grass. Best on most desktops and laptops.':g==='medium'?'Soft shadows, bloom and sky reflections with lighter foliage. A good fit for most phones and tablets.':'No shadows or post effects, simpler water and lighter foliage. Smoothest on older phones.'}${s.gfxAuto?' The game steps down by itself if it runs slowly.':''}</div></div>
 <div class="card"><h3>Weather</h3><div class="tabs">${[['auto','Changing'],['clear','Clear'],['rain','Rain'],['storm','Storm'],['fog','Fog']].map(w=>`<button class="tab ${(s.weather||'auto')===w[0]?'on':''}" data-act="wx" data-id="${w[0]}">${w[1]}</button>`).join('')}</div><div class="muted">Changing weather drifts between sun, rain, thunderstorms and fog. Frostmere gets snow instead of rain. Some fish only bite in rain or fog.</div></div>
 <div class="card"><button class="toggle ${s.chill?'on':''}" data-act="chill"><span class="sw"></span><span class="grow"><h3>Chill mode</h3><span class="muted">A wider reel bar, calmer fish, a slower catch meter, bigger Shake circles and longer days.</span></span></button></div>
 <div class="card"><h3>Sound</h3>${vol('vMusic','Music',s.music)}${vol('vSfx','Effects',s.sfx)}${vol('vAmb','Ambience',s.amb)}</div>
 <div class="card"><button class="toggle ${s.tags?'on':''}" data-act="tags"><span class="sw"></span><span class="grow"><h3>Name tags</h3><span class="muted">Show names above players and shopkeepers.</span></span></button></div>
 <div class="card"><div class="row"><div class="grow"><h3>Your angler</h3><span class="muted">${esc(profileOr().name)} · ${HATS.find(h=>h.id===profileOr().hat).n}</span></div><button class="btn sky sm" data-act="look">Change look</button></div></div>
 <div class="card"><h3>Controls</h3>${vol('vSens','Camera speed',(s.sens??1)/2)}<button class="toggle ${s.invY?'on':''}" data-act="invy"><span class="sw"></span><span class="grow"><b>Invert camera up and down</b></span></button><button class="btn ghost sm" data-act="keys" style="align-self:flex-start">View all controls</button></div>
 <div class="card"><div class="row"><div class="grow"><h3>Reset progress</h3><span class="muted">${confirmReset?'This erases coins, fish, rods and the Bestiary. There is no undo.':'Start over from scratch.'}</span></div><button class="btn rose sm" data-act="reset">${confirmReset?'Yes, erase everything':'Reset'}</button></div></div>`);
 const sl=(id,key)=>{const el=$('#'+id);el.oninput=()=>{s[key]=Number(el.value);el.style.setProperty('--p',(s[key]*100)+'%');el.nextElementSibling.textContent=Math.round(s[key]*100);AU.applyVol();};el.onchange=()=>save();};sl('vMusic','music');sl('vSfx','sfx');sl('vAmb','amb');{const el=$('#vSens');el.oninput=()=>{s.sens=Number(el.value)*2;el.style.setProperty('--p',(el.value*100)+'%');el.nextElementSibling.textContent=Math.round(s.sens*100);};el.onchange=()=>save();el.nextElementSibling.textContent=Math.round((s.sens??1)*100);}
 bindPanel({gfx:id=>{s.gfx=id;s.gfxAuto=false;GFX.tier=id;applyTier();save();rerender();},wx:id=>{s.weather=id;if(id!=='auto')setWeather(id);save();rerender();},chill:()=>{s.chill=!s.chill;save();updateGear();rerender();toast(s.chill?'Chill mode on. Take it easy.':'Chill mode off.');},
  tags:()=>{s.tags=!s.tags;save();rerender();},invy:()=>{s.invY=!s.invY;save();rerender();},keys:()=>openControls(),look:()=>{closePanel();openJoin(true);},
  reset:()=>{if(!confirmReset){confirmReset=true;rerender();return;}const keep=state.settings,prof=state.profile;state=freshState();state.settings=keep;state.profile=prof;state.tips.intro=1;onStateReplaced();const sp=world.spawn.cove;player.mode='walk';player.pos.set(sp.x,groundH(sp.x,sp.z),sp.z);placeBoatAt('cove');save();closePanel();toast('Progress reset. Welcome back to Pebble Cove!');}});});}
function openIntro(){openPanel('Welcome, '+profileOr().name,'A cozy island fishing adventure',()=>{
 body(`<div class="say">Welcome to Pebble Cove! Cast your line, catch rare fish, sell them to Marlo and buy better rods from Tess. Rook at the dock sells sea charts to the far islands.</div>
 <div class="card"><h3>How to fish</h3><div class="keys"><kbd>1</kbd><span>Walk to the water's edge. The dock is perfect.</span><kbd>2</kbd><span>${isTouch?'Hold the Cast button':'Hold the left mouse button or F'}, then release. More power casts farther.</span><kbd>3</kbd><span>Tap the Shake circles to make fish bite sooner.</span><kbd>4</kbd><span>When a fish bites, hold to push the bar right and release to let it drift left. Keep the fish inside the bar to fill the meter.</span></div></div>
 <div class="card"><h3>Take it easy</h3><span class="muted">Turn on Chill mode in Settings for a more forgiving reel. Press ${isTouch?'the camera button':'P'} for photo mode, and ${isTouch?'the chat button':'Enter'} to chat with other anglers.</span></div>
 <button class="btn mint lg" data-act="go" style="align-self:center">Start fishing</button>`);bindPanel({go:()=>{state.tips.intro=1;save();closePanel();}});});}

/* ---------- join / character ---------- */
const JOIN={on:false,edit:false,t:0};const NAMES=['Skipper','Marina','Juniper','Finn','Coral','Brook','Wren','Pebble','Reed','Sunny','Tide','Moss'];
function openJoin(edit){JOIN.on=true;JOIN.edit=edit;JOIN.t=0;closePanel();document.body.classList.add('joining');stopEmote();if(F.st!=='idle')cancelFishing();
 if(!state.profile){state.profile={name:'',color:pick(SHIRTS),hatC:pick(SHIRTS),skin:pick(SKINS),hat:pick(['bucket','cap','beanie','sunhat'])};rebuildPlayerRig();}
 const P=state.profile;const sw=(k,list)=>`<div class="sws" role="radiogroup">${list.map(c=>`<button class="sw2 ${P[k]===c?'on':''}" style="--c:${c}" data-k="${k}" data-v="${c}" role="radio" aria-checked="${P[k]===c}" aria-label="${k} ${c}"></button>`).join('')}</div>`;
 $('#join').innerHTML=`<h1>${edit?'Your angler':'Welcome to Driftwood Isles'}</h1><p class="sub">${edit?'Change your name and look. Everyone on the isles sees the update.':'Pick a name and a look. Other anglers on the isles will see you fishing.'}</p>
  <label class="fl" for="nameIn">Your name</label><input id="nameIn" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${pick(NAMES)}" value="${esc(P.name||'')}">
  <span class="fl">Shirt colour</span>${sw('color',SHIRTS)}<span class="fl">Hat</span><div class="hats">${HATS.map(h=>`<button class="hat ${P.hat===h.id?'on':''}" data-hat="${h.id}">${h.n}</button>`).join('')}</div>
  <span class="fl">Hat colour</span>${sw('hatC',SHIRTS)}<span class="fl">Skin tone</span>${sw('skin',SKINS)}
  <button class="btn mint lg" id="joinGo">${edit?'Done':'Set sail'}</button>`;
 $('#joinWrap').hidden=false;const ni=$('#nameIn');if(!isTouch)setTimeout(()=>ni.focus(),300);
 const upd=()=>{rebuildPlayerRig();$('#join').querySelectorAll('.sw2').forEach(b=>{const on=P[b.dataset.k]===b.dataset.v;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);});$('#join').querySelectorAll('.hat').forEach(b=>b.classList.toggle('on',P.hat===b.dataset.hat));};
 $('#join').onclick=e=>{const s=e.target.closest('.sw2');if(s){P[s.dataset.k]=s.dataset.v;AU.ui();upd();return;}const h=e.target.closest('.hat');if(h){P.hat=h.dataset.hat;AU.ui();upd();}};
 const go=()=>{AU.init();const name=cleanText(ni.value,16)||ni.placeholder;if(name.length<2){toast('Choose a name with at least 2 letters.');return;}P.name=name;state.tips.joined=1;save();closeJoin();if(!JOIN.edit&&!state.tips.intro)setTimeout(openIntro,400);else toast('Looking good, '+name+'!');};
 $('#joinGo').onclick=go;ni.onkeydown=e=>{if(e.key==='Enter')go();};}
function closeJoin(){JOIN.on=false;$('#joinWrap').hidden=true;document.body.classList.remove('joining');Net.pKey='';cam.yaw=player.face+Math.PI;}
function joinCamera(dt){JOIN.t+=dt;const R=prig.root;const tgt=R.position.clone().add(new V3(0,1.55,0));const yaw=player.face+.42+Math.sin(JOIN.t*.25)*.18;const wide=innerWidth>700;
 const right=new V3(Math.cos(yaw),0,-Math.sin(yaw));if(wide)tgt.addScaledVector(right,-1.25);else tgt.y-=.95;
 cam.target.lerp(tgt,1-Math.exp(-4*dt));cam.yaw+=angDiff(cam.yaw,yaw)*(1-Math.exp(-3*dt));cam.dist=damp(cam.dist,wide?5.6:7,3,dt);cam.pitch=damp(cam.pitch,.1,3,dt);
 const cp=Math.cos(cam.pitch);camera.position.set(cam.target.x+Math.sin(cam.yaw)*cp*cam.dist,cam.target.y+Math.sin(cam.pitch)*cam.dist,cam.target.z+Math.cos(cam.yaw)*cp*cam.dist);camera.lookAt(cam.target);}

/* ---------- chat + feed ---------- */
const CHAT={idleT:0,unread:0};
function inkName(c){return '#'+new THREE.Color(isHex(c)?c:'#9db4d8').lerp(new THREE.Color('#33405a'),.5).getHexString();}
function addChat(m){if(m.id){if(Net.seen.has(m.id))return false;Net.seen.add(m.id);}Net.log.push(m);Net.log.sort((a,b)=>a.t-b.t);if(Net.log.length>80)Net.log.splice(0,Net.log.length-80);renderChatLog();
 if(!m.hist){CHAT.idleT=0;$('#chat').classList.remove('idle');if(!isTouch||!$('#chat').classList.contains('open')){if(!m.me&&isTouch){$('#chatBadge').hidden=false;}}}return true;}
function sysLine(text){addChat({id:rid(),t:Date.now(),sys:true,text});}
function renderChatLog(){const el=$('#chatLog');el.innerHTML=Net.log.slice(-50).map(m=>m.sys?`<div class="cl sys">${esc(m.text)}</div>`:`<div class="cl ${m.feed?'feed':''}"><b style="color:${inkName(m.color)}">${esc(m.name)}</b>${esc(m.text)}</div>`).join('');el.scrollTop=el.scrollHeight;}
function openChat(){if(JOIN.on)return;const c=$('#chat');if(isTouch)c.classList.add('open');$('#chatBadge').hidden=true;c.classList.remove('idle');CHAT.idleT=0;$('#chatIn').focus();}
$('#chatBtn').addEventListener('click',()=>{AU.init();const c=$('#chat');if(c.classList.contains('open')){c.classList.remove('open');$('#chatIn').blur();}else openChat();});
$('#chatClose').addEventListener('click',()=>{$('#chat').classList.remove('open');$('#chatIn').blur();});
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatIn');const v=i.value;i.value='';if(v.trim())sendChat(v);if(!isTouch)i.blur();});
$('#chatIn').addEventListener('focus',()=>{$('#chat').classList.remove('idle');});
let myBubble=null,myBubbleT=0;
function showMyBubble(text){if(myBubble)prig.root.remove(myBubble);myBubble=bubbleSprite(text);myBubble.position.set(0,HEAD_TOP+1.25,0);prig.root.add(myBubble);myBubbleT=6;}
function feedText(sp,mut,w){return `caught a ${RAR[sp.r].n}${mut?' '+MUTS[mut].n:''} ${sp.name} · ${fmtW(w)} kg`;}
function addFeed(name,sp,mut,w,color,mine,id){const txt=sp?feedText(sp,mut,w):'found a Tide Relic';const el=document.createElement('div');el.className='fd glass';el.style.setProperty('--c',sp?RAR[sp.r].c:'#9eeaff');
 el.innerHTML=`<span class="dot"></span><span><b>${esc(mine?'You':name)}</b> ${esc(txt)}!</span>`;const box=$('#feed');box.appendChild(el);while(box.children.length>4)box.firstChild.remove();setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),500);},7000);
 addChat({id:id||rid(),t:Date.now(),name,color,text:txt+'!',feed:true,me:mine});if(!mine)AU.feed();}
function onRemoteCatch(r,k){if(k.sp==='relic'){addFeed(r.name,null,null,0,r.color,false,k.i);return;}const sp=SPM[k.sp];if(!sp)return;const mut=MUTS[k.m]?k.m:null;if(isNotable(sp.r,mut))addFeed(r.name,sp,mut,clamp(num(k.w,0),0,5000),r.color,false,k.i);}

/* ---------- multiplayer ---------- */
const Net={backend:'pending',err:'',project:'',rate:.1,pLast:0,room:null,db:null,user:null,uid:null,remotes:new Map(),peers:[],log:[],seen:new Set(),myChat:[],myChatLoaded:false,chatW:false,chatDirty:false,chatReady:false,canChat:true,canDb:true,lb:new Map(),lbW:false,lbLast:0,lbKey:'',pAcc:0,pKey:'',connected:false,lastSend:0,startT:Date.now()};
async function netInit(){let C=null;
 if(window.claude&&window.claude.use){C=window.claude;Net.backend='claude';}
 else if(MP_LOCAL){C=makeLocalBackend();Net.backend='local';Net.rate=C.rate;}
 else{if(!fbConfigured()){try{const r=await fetch('./online-config.json',{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.firebase&&j.firebase.apiKey)Object.assign(FB_CFG,j.firebase);}}catch(e){}}
  if(fbConfigured()){Net.backend='firebase';try{C=await makeFirebaseBackend(FB_CFG);Net.rate=C.rate;Net.project=C.project;}catch(e){C=null;Net.backend='failed';if(!Net.err)netProblem(e);sysLine('Could not reach the online isles. Fishing solo for now.');}}}
 if(!C&&Net.backend==='pending')Net.backend='none';
 if(!C){netStatus();if(MENU.on)renderMenu();return;}
 let user=null,db=null,room=null;try{[user,db,room]=await Promise.all([C.use('user'),C.use('db'),C.use('room')]);}catch(e){}
 Net.user=user;Net.db=db;Net.room=room;
 if(user){try{Net.uid=await user.id();}catch(e){}try{const cw=await user.can('data.write');if(cw===false)Net.canDb=false;}catch(e){}}
 if(db&&Net.uid){try{const ref=db.doc('data/users/'+Net.uid+'/save');const snap=await ref.get();if(snap.exists){const d=snap.data();if(d&&typeof d.json==='string'){const s=sanitize(JSON.parse(d.json));if((s.savedAt||0)>(state.savedAt||0)+2000){const prof=state.profile;state=s;if(!state.profile)state.profile=prof;onStateReplaced();toast('Cloud save loaded');}}}cloudRef=ref;cloudPending=true;cloudTick(true);}catch(e){}}
 if(!room&&Net.backend==='claude')Net.err='Online play here needs you to be signed in to Claude and invited to this page (or a member of its organization).';
 if(room){room.onPeers(onPeers,()=>{Net.room=null;netStatus();});room.on('chat',onChatEvt,()=>{});room.onConnection(c=>{Net.connected=c;netStatus();},()=>{});}
 if(db){db.collection('chat').orderBy('u','desc').limit(40).onSnapshot(onChatSnap,()=>{});db.collection('lb').orderBy('u','desc').limit(300).onSnapshot(onLbSnap,()=>{});}
 netStatus();}
function netStatus(){const n=1+[...Net.remotes.values()].filter(r=>r.rig).length;const b=$('#onCount');b.textContent=n;b.classList.toggle('off',!(Net.room&&Net.connected));if(panelCtx&&panelCtx.kind==='online')rerender();}
function onPeers(ch){Net.peers=ch.peers;for(const p of ch.peers){if(p.isMe||p.kind!=='viewer')continue;const pr=p.presence;if(!pr||pr.v!==2)continue;let r=Net.remotes.get(p.peer);
  if(!r){r=new RemotePlayer(p.peer);Net.remotes.set(p.peer,r);r.lastP=null;r.announce=Date.now()-Net.startT>5000;}
  if(pr!==r.lastP){r.lastP=pr;r.ingest(pr,p);if(r.announce){r.announce=false;sysLine(`${r.name} joined the isles.`);}}}
 for(const p of ch.left){const r=Net.remotes.get(p.peer);if(r){sysLine(`${r.name} left the isles.`);r.dispose();Net.remotes.delete(p.peer);}}netStatus();}
function buildPresence(){const p=profileOr(),pos=player.mode==='boat'?boat.pos:player.pos;const r2=v=>Math.round(v*100)/100;
 return{v:2,uid:Net.uid||'',n:p.name,c:p.color,hc:p.hatC,h:p.hat,sk:p.skin,lv:state.level,ti:state.title||'',zn:player.zone||'cove',rd:state.rod,en:state.ench[state.rod]||'',
  x:r2(pos.x),y:r2(player.mode==='boat'?0:pos.y),z:r2(pos.z),r:Math.round(prig.root.rotation.y*1000)/1000,b:player.mode==='boat'?1:0,by:Math.round(boat.yaw*1000)/1000,
  s:SC[F.st]||'i',bt:state.boat,fx:r2(F.to.x),fz:r2(F.to.z),k:F.lastCatch,e:player.emId?{i:player.emId,t:player.emType||'wave',f:player.emFish||null}:null};}
function netTick(dt){if(!Net.room||JOIN.on||!state.tips.joined)return;Net.pAcc+=dt;if(Net.pAcc<Net.rate)return;Net.pAcc=0;const p=buildPresence();const key=JSON.stringify(p),now=Date.now();if(key===Net.pKey&&now-Net.pLast<15000)return;Net.pKey=key;Net.pLast=now;p.ts=now;Net.room.presence(p).catch(()=>{});}
function sendChat(raw){const text=cleanText(raw,140);if(!text)return;const now=Date.now();if(now-Net.lastSend<900){toast('Slow down a little.');return;}Net.lastSend=now;const me=profileOr(),msg={i:rid(),t:now,x:text};
 addChat({id:msg.i,t:now,name:me.name,color:me.color,text,me:true});showMyBubble(text);AU.chat();
 if(Net.room&&Net.canChat)Net.room.emit('chat',{i:msg.i,x:text,n:me.name,c:me.color}).catch(e=>{if(e&&e.code==='not_permitted'){Net.canChat=false;sysLine('Chat could not be sent right now. Try again in a moment.');}});
 else if(!Net.room&&Net.remotes.size===0&&!CHAT.soloNote){CHAT.soloNote=true;sysLine('No one else is here right now. Your messages stay on your screen until someone joins.');}
 Net.myChat.push(msg);if(Net.myChat.length>15)Net.myChat.splice(0,Net.myChat.length-15);persistChat();}
function netOnMyCatch(c,id){Net.myChat.push({i:id,t:Date.now(),x:feedText(c.sp,c.mut,c.w)+'!',f:1});if(Net.myChat.length>15)Net.myChat.splice(0,Net.myChat.length-15);persistChat();}
function persistChat(){if(!Net.db||!Net.uid||!Net.canDb)return;if(Net.chatW){Net.chatDirty=true;return;}Net.chatW=true;const me=profileOr();
 Net.db.doc('chat/'+Net.uid).set({n:me.name,c:me.color,u:Date.now(),m:Net.myChat.slice(-15)}).catch(e=>{if(e&&['invalid_argument','not_granted','revoked'].includes(e.code))Net.canDb=false;}).finally(()=>{Net.chatW=false;if(Net.chatDirty){Net.chatDirty=false;persistChat();}});}
function remoteBy(peer,uid){if(peer&&Net.remotes.has(peer))return Net.remotes.get(peer);if(uid)for(const r of Net.remotes.values())if(r.uid===uid)return r;return null;}
function onChatEvt(msg){if(msg.isMe)return;const d=msg.data;if(!d||typeof d!=='object')return;const id=typeof d.i==='string'?d.i.slice(0,40):null;const text=cleanText(d.x,140);if(!id||!text)return;
 const r=remoteBy(msg.peer,msg.by);const name=r?r.name:(cleanText(d.n,16)||'Angler'),color=r?r.color:(isHex(d.c)?d.c:'#9db4d8');if(addChat({id,t:Date.now(),name,color,text})){if(r)r.say(text);AU.chat();}}
function onChatSnap(snap){const hist=!Net.chatReady;for(const doc of snap.docs){const d=doc.data();if(!d)continue;const uid=doc.id,mine=uid===Net.uid;const arr=Array.isArray(d.m)?d.m.slice(-15):[];
  if(mine&&!Net.myChatLoaded){const keep=Net.myChat.slice();Net.myChat=arr.filter(m=>m&&typeof m.i==='string').concat(keep.filter(k=>!arr.some(m=>m&&m.i===k.i))).slice(-15);}
  const name=cleanText(d.n,16)||'Angler',color=isHex(d.c)?d.c:'#9db4d8';
  for(const m of arr){if(!m||typeof m.i!=='string'||typeof m.x!=='string'||!Number.isFinite(m.t))continue;const text=cleanText(m.x,140);if(!text)continue;
   if(addChat({id:m.i.slice(0,40),t:m.t,name,color,text,feed:!!m.f,me:mine,hist})&&!hist&&!mine&&!m.f){const r=remoteBy(null,uid);if(r)r.say(text);}}}
 Net.myChatLoaded=true;Net.chatReady=true;}
function onLbSnap(snap){const m=new Map();for(const doc of snap.docs){const d=doc.data();if(!d)continue;m.set(doc.id,{n:cleanText(d.n,16)||'Angler',c:isHex(d.c)?d.c:'#9db4d8',e:Math.max(0,num(d.e,0,1e12)),hw:Math.max(0,num(d.hw,0,1e6)),hs:SPM[d.hs]?d.hs:'',rr:Math.max(0,num(d.rr,0,1e4)),rs:SPM[d.rs]?d.rs:'',rm:MUTS[d.rm]?d.rm:'',dx:clamp(Math.round(num(d.dx,0)),0,SPECIES.length),lv:clamp(Math.round(num(d.lv,1)),1,999)});}
 Net.lb=m;if(panelCtx&&panelCtx.kind==='lb')rerender();}
function myLb(){const p=profileOr();let dx=0,hw=0,hs='',rr=0,rs='',rm='';for(const id in state.dex){const d=state.dex[id];if(!d||!d.n||!SPM[id])continue;dx++;if(d.best>hw){hw=d.best;hs=id;}
  const sp=SPM[id],bm=(d.muts||[]).filter(m=>MUTS[m]).sort((a,b)=>MUTS[b].m-MUTS[a].m)[0]||'';const sc=sp.r*100+(bm?MUTS[bm].m*10:0);if(sc>rr){rr=sc;rs=id;rm=bm;}}
 return{n:p.name,c:p.color,h:p.hat,e:Math.round(state.earned),co:Math.round(state.coins),hw:Math.round(hw*100)/100,hs,rr,rs,rm,dx,lv:state.level};}
function lbTick(){if(!Net.db||!Net.uid||!Net.canDb||Net.lbW||!state.tips.joined)return;const d=myLb();const key=JSON.stringify(d);if(key===Net.lbKey)return;const now=Date.now();if(now-Net.lbLast<15000)return;
 Net.lbW=true;Net.lbLast=now;d.u=now;Net.db.doc('lb/'+Net.uid).set(d).then(()=>{Net.lbKey=key;}).catch(e=>{if(e&&['invalid_argument','not_granted','revoked'].includes(e.code))Net.canDb=false;}).finally(()=>{Net.lbW=false;});}
function openLeaderboard(){if(JOIN.on)return;let tab='coins';openPanel('Leaderboards','Every angler who has fished here',()=>{panelCtx.kind='lb';
 const me=myLb();const all=new Map(Net.lb);all.set(Net.uid||'me',{n:me.n,c:me.c,e:me.e,hw:me.hw,hs:me.hs,rr:me.rr,rs:me.rs,rm:me.rm,dx:me.dx,lv:me.lv});
 const online=new Set([...Net.remotes.values()].map(r=>r.uid).filter(Boolean));const meId=Net.uid||'me';
 const key={coins:e=>e.e,heavy:e=>e.hw,rare:e=>e.rr,dex:e=>e.dx}[tab];const rows=[...all.entries()].filter(([,e])=>key(e)>0||tab==='coins').sort((a,b)=>key(b[1])-key(a[1]));
 const val=e=>tab==='coins'?`${fmt(e.e)}c<small>earned</small>`:tab==='heavy'?`${fmtW(e.hw)} kg<small>${e.hs?esc(SPM[e.hs].name):''}</small>`:tab==='rare'?(e.rs?`${RAR[Math.min(6,Math.floor(e.rr/100))].n}<small>${e.rm?MUTS[e.rm].n+' ':''}${esc(SPM[e.rs].name)}</small>`:'—'):`${e.dx}/${SPECIES.length}<small>${Math.round(e.dx/SPECIES.length*100)}% complete</small>`;
 const row=(id,e,i)=>`<div class="lbrow r${i+1} ${id===meId?'me':''}"><span class="rk">${i+1}</span><span class="nm"><i class="cdot" style="--c:${e.c}"></i><span>${esc(e.n)}</span>${id===meId?'<span class="pill" style="--c:#c7e3ff">You</span>':online.has(id)?'<span class="live">online</span>':''}</span><span class="val">${val(e)}</span></div>`;
 const top=rows.slice(0,25);const myIdx=rows.findIndex(([id])=>id===meId);
 body(`<div class="tabs">${[['coins','Most coins'],['heavy','Heaviest catch'],['rare','Rarest catch'],['dex','Bestiary']].map(t=>`<button class="tab ${tab===t[0]?'on':''}" data-act="tab" data-id="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="list">${top.map(([id,e],i)=>row(id,e,i)).join('')||'<div class="muted">No catches recorded yet.</div>'}${myIdx>=25?'<div class="muted" style="text-align:center">…</div>'+row(meId,rows[myIdx][1],myIdx):''}</div>
  ${!Net.db?'<div class="muted">Shared leaderboards appear when online play is on. You are seeing your own scores.</div>':!Net.canDb?'<div class="muted">Your scores could not be saved to the shared board right now.</div>':''}`);
 bindPanel({tab:id=>{tab=id;rerender();}});});}
function activity(r){const s=SCODE[r.s];if(r.emote==='dance')return 'Dancing';if(r.held||s==='caught')return 'Just landed a fish!';if(s==='reeling'||s==='bite')return 'Reeling one in';if(s==='waiting'||s==='casting'||s==='charging')return 'Fishing';if(r.onBoat)return 'Sailing';return 'Exploring';}
function openOnline(){if(JOIN.on)return;openPanel('Online now','',()=>{panelCtx.kind='online';const list=[...Net.remotes.values()].filter(r=>r.rig);$('#pSub').textContent=`${list.length+1} angler${list.length?'s':''} on the isles`;
 const me=profileOr();const meAct=F.st!=='idle'?'Fishing':player.mode==='boat'?'Sailing':'Exploring';
 const row=(name,color,lv,place,act,you)=>`<div class="lbrow ${you?'me':''}" style="grid-template-columns:1fr auto"><span class="nm"><i class="cdot" style="--c:${color}"></i><span><b>${esc(name)}</b> <span class="muted">Lv ${lv}</span></span>${you?'<span class="pill" style="--c:#c7e3ff">You</span>':''}</span><span class="val">${esc(place)}<small>${esc(act)}</small></span></div>`;
 body(`<div class="list">${row(me.name,me.color,state.level,player.mode==='boat'?'Sailing near '+ZONES[player.zone||'sea'].n:ZONES[player.zone||'cove'].n,meAct,true)}${list.map(r=>row(r.name,r.color,r.level,(r.onBoat?'Sailing near ':'')+ZONES[r.zone].n,activity(r),false)).join('')}</div>
  ${!Net.room?'<div class="muted">You\'re fishing solo right now. When online play is on, other anglers appear here and on the islands.</div><button class="btn ghost sm" data-act="mp" style="align-self:flex-start">Connection details</button>':!Net.connected?'<div class="muted">Connecting to the isles…</div>':list.length?'':'<div class="muted">No one else is here yet. Share the page and fish together.</div>'}`);bindPanel({mp:()=>openMultiplayer()});});}

/* ---------- state ---------- */
function onStateReplaced(){GFX.tier=state.settings.gfx;qState();rebuildPlayerRig();updateHUD();AU.applyVol();rerender();}

/* ---------- main loop ---------- */
const clock={t:0,last:performance.now(),hud:0,save:0,fpsT:0,fpsN:0,fpsW:0,steps:0};
function frame(now){requestAnimationFrame(frame);let dt=(now-clock.last)/1000;clock.last=now;if(dt>.05)dt=.05;if(dt<=0)return;clock.t+=dt;WIND.uTime.value+=dt;
 if(!MENU.on&&!PAUSE.on)readInput(dt);else{input.x=input.y=input.rot=0;}checkPendingPtrs();updateEnv(dt);updatePlayer(dt);updateBoat(dt);updateFishing(dt);updateNPCs(dt);updateInteract(dt);
 for(const r of Net.remotes.values())r.update(dt);
 if(MENU.on){menuCamera(dt);MENU.st=(MENU.st||0)-dt;if(MENU.st<=0){MENU.st=1;const ms=$('#menuStatus'),t=netLabel();if(ms.textContent!==t)ms.textContent=t;}}
 else if(JOIN.on)joinCamera(dt);else updateCamera(dt);updateLife(dt);if(!MENU.on)updateMiniHUD(dt);if(myTag)myTag.visible=state.settings.tags&&!MENU.on&&!JOIN.on&&!PHOTO.on;
 if(myBubbleT>0){myBubbleT-=dt;if(myBubbleT<=0&&myBubble){prig.root.remove(myBubble);myBubble=null;}}
 renderFrame();
 AU.updAmb(dt,{day:env.day,rain:env.rain,fog:env.fog,cloud:env.cloud,zone:player.zone||'cove',boat:player.mode==='boat',speed:boat.speed,shore:player.zone==='sea'?.35:1});
 netTick(dt);lbTick();
 CHAT.idleT+=dt;if(CHAT.idleT>14&&document.activeElement!==$('#chatIn'))$('#chat').classList.add('idle');
 if(PHOTO.on){PHOTO.idle+=dt;if(PHOTO.idle>2.6)$('#photoBar').classList.add('dim');}
 tickBuffs(dt);clock.hud-=dt;if(clock.hud<=0){clock.hud=.25;updateClockHUD();renderBuffs();renderHotbar();clock.pr=(clock.pr||0)+1;if(panelCtx&&(panelCtx.kind==='buffs'||panelCtx.kind==='stats')&&clock.pr%4===0)rerender();}
 clock.save+=dt;if(clock.save>20){clock.save=0;save();}
 if(state.settings.gfxAuto&&clock.t>6&&clock.steps<3&&!document.hidden){clock.fpsT+=dt;clock.fpsN++;if(clock.fpsT>=5){const fps=clock.fpsN/clock.fpsT;clock.fpsT=0;clock.fpsN=0;
  const need=GFX.tier==='ultra'?45:GFX.tier==='high'?40:28;if(fps<need&&GFX.tier!=='low'){GFX.tier={ultra:'high',high:'medium',medium:'low'}[GFX.tier];state.settings.gfx=GFX.tier;clock.steps++;applyTier();save();toast(`Graphics set to ${GFX.tier[0].toUpperCase()+GFX.tier.slice(1)} so the game runs smoothly. You can change this in Settings.`);}}}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();cloudTick(true);}});

/* ---------- boot ---------- */
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
async function boot(data){loadStep(15,'Loading the islands…');const loaded=(data&&data.state)?sanitize(data.state):loadLocal();if(loaded)state=loaded;GFX.tier=state.settings.gfx;
 try{await Promise.race([Promise.all([document.fonts.load('900 40px Nunito'),document.fonts.load('800 30px Nunito'),document.fonts.load('600 40px "Josefin Sans"')]),new Promise(r=>setTimeout(r,1800))]);}catch(e){}qState();initNpcIndex();
 initWeather();loadStep(22,'Weathering the rocks…');await nextFrame();await genWorldTextures(TT().tex,async f=>{loadStep(22+f*24,'Weathering the rocks…');await nextFrame();});loadStep(48,'Growing palm trees…');await nextFrame();buildWorld();loadStep(75,'Filling the sea…');await nextFrame();initEnv();setupPlayer();applyTier();resize();WAVE.amp=WAVE_W[env.weather]||1;updateEnv(0);updateEnvMap();loadStep(90,'Lighting the sky…');await nextFrame();
 cam.yaw=player.face+Math.PI;cam.target.copy(player.pos).add(new V3(0,2.5,0));updateHUD();updateClockHUD();renderChatLog();loadStep(100,'Ready');
 requestAnimationFrame(t=>{clock.last=t;frame(t);});setTimeout(()=>{const l=$('#loading');l.classList.add('out');setTimeout(()=>l.remove(),900);},200);
 rebuildPlayerTag();if(/[?&]nomenu/.test(location.search)){if(!state.profile||!state.tips.joined)openJoin(false);else if(!state.tips.intro)openIntro();}else openMenu();
 const unlock=()=>{AU.init();removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);};addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
 netInit();try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({state}));}catch(e){}}
const HOTH=window.claude&&window.claude.hot;
if(HOTH&&HOTH.ready)HOTH.ready(boot);else boot((HOTH&&HOTH.data)||{});

/* ---------- boats, rods, buffs, stats ---------- */
const mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function rodLocked(r){if(!r.req)return null;if(r.req.lvl&&state.level<r.req.lvl)return 'Unlocks at level '+r.req.lvl;if(r.req.sp&&!(state.dex[r.req.sp]&&state.dex[r.req.sp].n))return 'Catch a '+SPM[r.req.sp].name+' to unlock';return null;}
const UPG=[['e','Engine','+8% top speed per level'],['h','Hull','+5 storage slots and +5% handling per level'],['s','Sonar','+6% luck while fishing from the boat per level']];
const upgCost=(B,lv)=>Math.round(Math.max(300,(B.price||2400)*.12)*(lv+1));
function boatBars(B,u){u=u||{};const sp=B.speed*(1+.08*(u.e||0)),tn=B.turn*(1+.05*(u.h||0)),sg=B.storage+5*(u.h||0);const rows=[['Speed',sp/31,Math.round(sp)+' kn'],['Handling',tn/1.9,tn.toFixed(2)],['Storage',sg/85,'+'+sg+' slots']];
 return `<div class="statg">${rows.map(r=>`<span>${r[0]}</span><div class="sbar" style="--c:#7f9db3"><i style="width:${clamp(r[1],.04,1)*100}%"></i></div><span>${r[2]}</span>`).join('')}</div>`;}
function openShipwright(n){const line=npcSay(n);openPanel(n.name,n.title,()=>{
 body(`${line}<div class="muted">Your boat is moored at the end of the dock. Storage adds bag slots while you're on board.</div><div class="list">${BOATS.map(B=>{const own=state.boats.includes(B.id),eq=state.boat===B.id,u=state.bup[B.id]||{};
  return `<div class="card ${eq?'eq':''}"><div class="row"><img class="thumb" src="${boatThumb(B)}" alt=""><div class="grow"><h3>${esc(B.n)}</h3><div class="muted">${esc(B.fx.d)}</div></div>${eq?'<span class="pill" style="--c:#d9e4dc">In use</span>':own?`<button class="btn sky sm" data-act="use" data-id="${B.id}">Use</button>`:`<button class="btn sm" data-act="buy" data-id="${B.id}" ${state.coins<B.price?'disabled':''}>${fmt(B.price)}c</button>`}</div>${boatBars(B,u)}
  ${own?UPG.map(([k,nm,d])=>{const lv=u[k]||0,c=upgCost(B,lv);return `<div class="row"><div class="grow"><b>${nm}</b> <span class="pips">${[0,1,2].map(i=>`<i class="${i<lv?'on':''}"></i>`).join('')}</span><div class="muted">${d}</div></div>${lv>=3?'<span class="muted">Max</span>':`<button class="btn sm" data-act="up" data-id="${B.id}:${k}" ${state.coins<c?'disabled':''}>${fmt(c)}c</button>`}</div>`;}).join(''):''}</div>`;}).join('')}</div>`);
 bindPanel({buy:id=>{const B=BOATM[id];if(state.coins<B.price)return;state.coins-=B.price;state.boats.push(id);state.boat=id;rebuildBoat();AU.coin();toast(`The ${B.n} is yours. It's moored at the dock.`,'gold');save();updateHUD();rerender();},
  use:id=>{state.boat=id;rebuildBoat();save();updateHUD();rerender();},
  up:v=>{const[id,k]=v.split(':');const B=BOATM[id];const u=state.bup[id]||(state.bup[id]={});const lv=u[k]||0;if(lv>=3)return;const c=upgCost(B,lv);if(state.coins<c)return;state.coins-=c;u[k]=lv+1;AU.coin();save();updateHUD();rerender();}});});}
function openBuffs(n){const line=npcSay(n);openPanel(n.name,n.title,()=>{panelCtx.kind='buffs';
 body(`${line}<div class="muted">Each brew lasts a few minutes of play and stacks with your rod, boat and enchant. Buying again adds more time, up to 15 minutes.</div><div class="list">${BUFFS.map(B=>{const left=state.buffs[B.id]||0;
  return `<div class="card ${left>0?'eq':''}"><div class="row"><img class="thumb sm" src="${potionIcon(B)}" alt=""><div class="grow"><h3>${esc(B.n)}</h3><div class="muted">${esc(B.fx.d)} · ${Math.round(B.dur/60)} min${left>0?' · '+mmss(left)+' left':''}</div></div><button class="btn sm" data-act="buy" data-id="${B.id}" ${state.coins<B.price?'disabled':''}>${fmt(B.price)}c</button></div></div>`;}).join('')}</div>`);
 bindPanel({buy:id=>{const B=BUFFM[id];if(state.coins<B.price)return;state.coins-=B.price;state.buffs[id]=Math.min(900,(state.buffs[id]||0)+B.dur);AU.enchant();toast(`${B.n}: ${B.fx.d}.`);save();updateHUD();renderBuffs();rerender();}});});}
function openStats(){if(JOIN.on)return;openPanel('Stats & buffs','Everything affecting your fishing right now',()=>{panelCtx.kind='stats';const S=stats(true),pc=v=>Math.round(v*100)+'%';
 const rows=[['Luck','+'+Math.round(S.luck*100)+'%'],['Reel speed',S.reel.toFixed(2)+'×'],['Reel bar width',pc(clamp((.22+S.ctrl)*S.barMul,.12,.68))],['Catch meter drain',pc(1-S.res)+' of normal'],['Bite speed',pc(1/S.wait)],['Shake strength',pc(S.shake)],['Mutation chance',(S.mut*100).toFixed(1)+'%'],['Fish weight',pc(S.wt)],['Sale price',pc(S.sell)],['XP gain',pc(S.xp)],['Double catch',Math.round(S.dbl*100)+'%'],['Bag space',maxInv()+' slots']];
 body(`<div class="card">${rows.map(r=>`<div class="statrow"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div><div class="card"><h3>Sources</h3>${S.src.map(s=>`<div class="statrow"><span>${esc(s[0])}</span><span class="muted">${esc(s[1])}</span></div>`).join('')}${player.mode!=='boat'?`<div class="muted">Board your ${esc(BOATM[state.boat].n)} to add its buff: ${esc(BOATM[state.boat].fx.d)}.</div>`:''}</div>`);bindPanel({});});}
function tickBuffs(dt){for(const k in state.buffs){state.buffs[k]-=dt;if(state.buffs[k]<=0){delete state.buffs[k];if(BUFFM[k])toast(BUFFM[k].n+' wore off.');}}}
function renderBuffs(){const el=$('#buffBar');if(!el)return;const parts=[];for(const B of BUFFS){const left=state.buffs[B.id];if(left>0)parts.push(`<div class="bf glass" title="${esc(B.n)}: ${esc(B.fx.d)}"><i style="--c:${B.c}">${B.ico}</i>${mmss(left)}</div>`);}
 if(player&&player.mode==='boat'){const BT=BOATM[state.boat];parts.push(`<div class="bf glass" title="${esc(BT.n)}: ${esc(BT.fx.d)}"><i style="--c:#4b6b84">Bt</i>Boat</div>`);}
 const h=parts.join('');if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h;}}



/* ---------- debug hook (only with ?debug in the URL) ---------- */
if(/[?&]debug/.test(location.search))window.__DI={get state(){return state;},env,cam,camera,GFX,applyTier,get player(){return player;},setWeather,renderer,scene,world,ZONES,TT,clock,SKYJS,skyU,WAVE,sun,hemi,waterU,ENV,THREE,BIG,buildFish,makeWhale,makeChar,SPECIES,SPM,F,startBite,startReel,landCatch,finishCatch,get shakes(){return shakes;}};
