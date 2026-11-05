'use strict';
/* Driftwood Isles — core: helpers, game data, saving, audio */
if(typeof THREE==='undefined'){window.__diFail&&window.__diFail('The 3D engine could not load. Check your connection and reopen the page.');throw new Error('THREE missing');}
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
const angDiff=(a,b)=>{const d=b-a;return Math.atan2(Math.sin(d),Math.cos(d));};
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const TAU=Math.PI*2;
const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const fmt=n=>{n=Math.round(n);return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e5?Math.round(n/1e3)+'k':n.toLocaleString('en-US');};
const fmtW=w=>w>=100?Math.round(w).toLocaleString('en-US'):w>=10?w.toFixed(1):w.toFixed(2);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanText=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g,'').replace(/\s+/g,' ').trim().slice(0,n):'';
const isHex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const isTouch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
const isMobile=isTouch&&Math.min(screen.width,screen.height)<900;
if(!isTouch)document.body.classList.add('desk');
const loadStep=(p,msg)=>{const f=$('#ldFill');if(f)f.style.width=p+'%';if(msg){const m=$('#ldMsg');if(m)m.textContent=msg;}};

/* ================= DATA ================= */
const RAR=[
 {n:'Common',c:'#cfd6df',p:'#e3e8ee',w:52,lk:0,spd:.2,err:0,int:1.6,xp:6},
 {n:'Uncommon',c:'#5fd47a',p:'#c4efcc',w:26,lk:.5,spd:.27,err:.12,int:1.4,xp:12},
 {n:'Rare',c:'#4fa8ff',p:'#c7e3ff',w:13,lk:1,spd:.35,err:.25,int:1.2,xp:26},
 {n:'Legendary',c:'#ffae2b',p:'#ffe2ad',w:5.5,lk:1.6,spd:.44,err:.4,int:1,xp:60},
 {n:'Mythic',c:'#ff5fdc',p:'#ffcdf1',w:2.4,lk:2.2,spd:.53,err:.55,int:.85,xp:130},
 {n:'Exotic',c:'#a46bff',p:'#dccbff',w:.9,lk:2.8,spd:.62,err:.7,int:.72,xp:260},
 {n:'Secret',c:'#2e3242',p:'#2e3242',w:.22,lk:3.4,spd:.72,err:.9,int:.6,xp:600},
];
const MUTS={
 shiny:{n:'Shiny',m:1.5,w:34,c:'#fff3b8'}, albino:{n:'Albino',m:2,w:22,c:'#ffe6ec'}, glowing:{n:'Glowing',m:2.5,w:16,c:'#c8ffb0'},
 frozen:{n:'Frozen',m:3,w:12,c:'#c6ecff'}, shadow:{n:'Shadow',m:4,w:8,c:'#d6c6ff'}, golden:{n:'Golden',m:5,w:5,c:'#ffd970'}, prismatic:{n:'Prismatic',m:8,w:2,c:'#ffc4ee'}
};
const ZONES={
 cove:{n:'Pebble Cove',tag:'Starter harbor',x:0,z:0,R:104,H:3.2,hill:1.4,p1:.7,p2:2.1,price:0,grass:'#6e8a4c',grass2:'#5e7a42',sand:'#cbb88c',rock:'#8a8c88'},
 moss:{n:'Mossreach',tag:'Misty bog isle',x:580,z:-310,R:94,H:2.6,hill:1.1,p1:2.3,p2:.4,price:1500,grass:'#566e3e',grass2:'#4a6136',sand:'#a99a74',rock:'#666b62'},
 frost:{n:'Frostmere',tag:'Frozen fjord',x:-540,z:-520,R:98,H:4,hill:1.9,p1:4.1,p2:1.2,price:6000,grass:'#e3e7ea',grass2:'#d2d9de',sand:'#b7bec4',rock:'#7c868f'},
 ember:{n:'Emberkey',tag:'Smoldering volcano',x:180,z:720,R:96,H:3.4,hill:1.1,p1:1.4,p2:3.3,price:18000,grass:'#4a413d',grass2:'#3f3734',sand:'#5f5650',rock:'#2f2c2b',volcano:true},
 sea:{n:'Open Waters',tag:'Deep sea'},
 pond_cove:{n:'Willow Pond',tag:'Pebble Cove pond',pond:'cove',col:'#3e5c52'},pond_moss:{n:'Murk Pool',tag:'Mossreach pond',pond:'moss',col:'#34422c'},
 pond_frost:{n:'Frozen Tarn',tag:'Frostmere pond',pond:'frost',col:'#56788a'},pond_ember:{n:'Ash Spring',tag:'Emberkey hot spring',pond:'ember',col:'#4e605c'}
};
const ISL=['cove','moss','frost','ember'];
const SPECIES=[
 ['pebble_perch','Pebble Perch','cove',0,.2,1.2,12,'fish','#8fbf5a','#f0e6a8'],
 ['skipper_minnow','Skipper Minnow','cove',0,.05,.3,9,'fish','#6aa8d8','#e8f2f8'],
 ['sandy_sole','Sandy Sole','cove',0,.3,1.5,14,'flat','#d9b97a','#f3e5c0'],
 ['reed_snapper','Reed Snapper','cove',1,.8,3,35,'fish','#e2694a','#ffd2b8'],
 ['copper_carp','Copper Carp','cove',1,1,5,45,'tall','#c87533','#f2c48a'],
 ['ribbon_eel','Ribbon Eel','cove',2,.5,2.5,110,'eel','#3fb6a8','#c9f2e8'],
 ['sunscale_trout','Sunscale Trout','cove',2,1,4,130,'fish','#f2b632','#fff0b0','day'],
 ['whisker_baron','Whisker Baron','cove',3,6,25,420,'fish','#6b5a4a','#c8b8a0',null,'whisk'],
 ['moonpetal_koi','Moonpetal Koi','cove',4,2,8,1100,'tall','#f4f4ff','#ff8a7a','night'],
 ['prism_guppy','Prism Guppy','cove',5,.1,.5,2600,'fish','#ff5fd2','#5ff2ff'],
 ['gramps_gar','Old Gramps Gar','cove',6,30,90,7500,'long','#4a6b3a','#b8c890','rain'],
 ['bog_gudgeon','Bog Gudgeon','moss',0,.1,.8,18,'fish','#6b7a3a','#c8c890'],
 ['mud_hopper','Mud Hopper','moss',0,.1,.5,16,'fish','#7a5a3a','#d8b890'],
 ['lilypad_pike','Lilypad Pike','moss',1,1,6,60,'long','#4a8a4a','#d0f0a0'],
 ['fernback_bass','Fernback Bass','moss',1,1,4,55,'tall','#2f6b3f','#b0d890'],
 ['glowgut_loach','Glowgut Loach','moss',2,.3,1.5,170,'eel','#8aff6a','#2f4a2f','night'],
 ['sporecap_ray','Sporecap Ray','moss',2,2,9,200,'ray','#9a6ac8','#e8d0ff'],
 ['mossjaw_sturgeon','Mossjaw Sturgeon','moss',3,15,60,650,'long','#5a6a4a','#a8b890'],
 ['witchlight_angler','Witchlight Angler','moss',4,3,12,1600,'tall','#2a2a4a','#7affb0','night','lure'],
 ['bogwyrm_larva','Bogwyrm Larva','moss',5,5,20,3800,'eel','#c8d04a','#4a3a2a'],
 ['mirefather','The Mirefather','moss',6,80,250,12000,'tall','#1f2f1f','#8aff6a','fog','whisk'],
 ['icicle_smelt','Icicle Smelt','frost',0,.05,.3,25,'fish','#bfe6ff','#ffffff'],
 ['frostbite_cod','Frostbite Cod','frost',0,1,5,30,'fish','#7a9ab8','#e0eef8'],
 ['polar_char','Polar Char','frost',1,1,4,80,'fish','#e06a6a','#f8e0e0'],
 ['glacier_grayling','Glacier Grayling','frost',1,.5,2.5,90,'fish','#8ab0c8','#d8e8f0'],
 ['aurora_salmon','Aurora Salmon','frost',2,2,10,280,'fish','#5affc8','#c85aff'],
 ['crystal_pike','Crystal Pike','frost',3,5,20,900,'long','#a8f0ff','#ffffff'],
 ['yeti_sculpin','Yeti Sculpin','frost',4,4,15,2200,'tall','#f0f0f0','#a8c8e0','night'],
 ['tusked_narwhalfish','Tusked Narwhalfish','frost',5,20,80,5200,'shark','#d8e8f8','#7a9ab8',null,'tusk'],
 ['wintermaw','Wintermaw','frost',6,150,400,18000,'shark','#2a4a7a','#bfe6ff','fog'],
 ['cinder_goby','Cinder Goby','ember',0,.1,.6,35,'fish','#4a3a3a','#ff7a3a'],
 ['ash_tetra','Ash Tetra','ember',0,.05,.3,30,'fish','#8a8a8a','#ff4a2a'],
 ['magma_grouper','Magma Grouper','ember',1,3,15,120,'tall','#c83a1a','#ffb04a'],
 ['basalt_eel','Basalt Eel','ember',1,1,5,110,'eel','#2a2a2a','#ff5a1a'],
 ['obsidian_ray','Obsidian Ray','ember',2,4,18,380,'ray','#1a1a24','#8a5aff'],
 ['pyre_marlin','Pyre Marlin','ember',3,20,90,1400,'long','#ff6a1a','#ffd84a',null,'sail'],
 ['phoenix_koi','Phoenix Koi','ember',4,2,9,3200,'tall','#ff3a2a','#ffd84a'],
 ['caldera_dragonfish','Caldera Dragonfish','ember',5,6,25,7500,'eel','#ff2a6a','#2a0a1a','night'],
 ['caldera_eye','Eye of the Caldera','ember',6,200,600,30000,'tall','#ff9a1a','#1a0a0a','night'],
 ['drift_herring','Driftwood Herring','sea',0,.2,1,20,'fish','#8ab0d0','#e8f0f8'],
 ['gullbane_mackerel','Gullbane Mackerel','sea',1,.5,3,60,'fish','#3a6ab8','#d8e8f8'],
 ['lantern_squid','Lantern Squid','sea',2,1,6,250,'squid','#ff9ac8','#ffe0f0','night'],
 ['tidecaller_shark','Tidecaller Shark','sea',3,40,200,1800,'shark','#6a8aa8','#e8eef4'],
 ['crowned_abyssfish','Crowned Abyssfish','sea',4,10,40,4500,'tall','#2a1a4a','#ffd84a',null,'lure'],
 ['starwhale_calf','Starwhale Calf','sea',6,500,1500,40000,'shark','#1a2a5a','#9ad8ff','night'],
 ['pond_shiner','Pond Shiner','pond_cove',0,.1,.5,22,'fish','#a8b8a0','#e8ecd8'],['lily_bream','Lily Bream','pond_cove',1,.5,2,70,'tall','#8a9a5a','#d8d8b0'],['golden_tench','Golden Tench','pond_cove',2,1,4,240,'fish','#b89a3a','#e8d890','day'],['mirror_koi','Mirror Koi','pond_cove',3,2,9,900,'tall','#d8d8d0','#c86a4a'],['wishing_carp','Wishing Carp','pond_cove',5,3,12,4200,'tall','#e8c870','#fff2c0','night'],
 ['murk_minnow','Murk Minnow','pond_moss',0,.05,.3,26,'fish','#5a6a4a','#a8b090'],['frogmouth','Frogmouth','pond_moss',1,.5,2.5,85,'flat','#6a7a3a','#c8c890'],['spore_eel','Spore Eel','pond_moss',2,.6,3,300,'eel','#7a5a8a','#d8c0e0'],['bog_lantern','Bog Lantern','pond_moss',3,1,5,1100,'tall','#3a4a3a','#b0ff90','night','lure'],['ancient_bowfin','Ancient Bowfin','pond_moss',4,6,22,2600,'long','#4a4a38','#a89a70','fog'],
 ['tarn_char','Tarn Char','pond_frost',0,.3,1.5,32,'fish','#9aa8b8','#e8eef4'],['ice_perch','Ice Perch','pond_frost',1,.4,2,95,'fish','#b8d0e0','#ffffff'],['glass_trout','Glass Trout','pond_frost',2,1,5,320,'fish','#d0e8f0','#ffffff'],['frost_wraith','Frost Wraith','pond_frost',4,3,12,3000,'eel','#e8f4ff','#8ab0d0','night'],['tarn_queen','Tarn Queen','pond_frost',6,40,120,22000,'long','#a8c8e8','#ffffff','fog'],
 ['spring_goby','Spring Goby','pond_ember',0,.1,.6,40,'fish','#7a5a4a','#e8a070'],['steam_loach','Steam Loach','pond_ember',1,.4,2,130,'eel','#8a6a5a','#ffc090'],['cinder_ray','Cinder Ray','pond_ember',2,2,8,420,'ray','#4a3a3a','#ff8a4a'],['ember_koi','Ember Koi','pond_ember',3,2,8,1600,'tall','#e8603a','#ffd890'],['magma_heart','Magma Heart','pond_ember',5,10,40,9000,'tall','#ff5a2a','#3a1a10','night'],
].map(a=>({id:a[0],name:a[1],zone:a[2],r:a[3],minW:a[4],maxW:a[5],price:a[6],shape:a[7],c1:a[8],c2:a[9],cond:a[10]||null,feat:a[11]||null}));
const SPM={};SPECIES.forEach(s=>SPM[s.id]=s);
const COND={day:'Daytime',night:'Night only',rain:'While raining',fog:'In fog'};
const RODS=[
 {id:'drift',n:'Driftwood Rod',price:0,luck:0,reel:1,ctrl:0,res:0,shaft:'#8a6a48',handle:'#4a3626',reelC:'#7a7a7a',len:2.4,perk:{xp:.05,d:'+5% XP'}},
 {id:'pine',n:'Sturdy Pine Rod',price:350,luck:10,reel:1.05,ctrl:.03,res:.08,shaft:'#b89a6a',handle:'#3f4a34',reelC:'#9a9a9a',len:2.5,perk:{shake:1.15,d:'Shakes cut 15% more wait'}},
 {id:'bamboo',n:'Bamboo Flick',price:800,luck:14,reel:1.1,ctrl:.05,res:.05,shaft:'#c2ac6e',handle:'#5a4630',reelC:'#8a8478',len:2.6,wrap:'#6a4a30',perk:{wait:.9,d:'Bites come 10% faster'}},
 {id:'coral',n:'Coral Whip',price:1600,luck:20,reel:1.15,ctrl:.06,res:.1,shaft:'#a8705e',handle:'#d8cebf',reelC:'#b8a08a',len:2.6,perk:{mut:.03,d:'+3% mutation chance'}},
 {id:'reed',n:'Swampreed Rod',price:3800,luck:30,reel:1.12,ctrl:.05,res:.25,shaft:'#5e7a48',handle:'#3a2a1a',reelC:'#9a9a5a',len:2.7,perk:{wait:.8,cond:'rain',d:'Bites come 20% faster in rain'}},
 {id:'moss',n:'Mossline Rod',price:5600,luck:38,reel:1.16,ctrl:.07,res:.2,shaft:'#4a5e40',handle:'#2e2a24',reelC:'#6a7a5a',len:2.75,wrap:'#8aa070',glow:'#9fd08a',req:{sp:'glowgut_loach'},perk:{luck:30,cond:'night',d:'+30% luck at night'}},
 {id:'glacier',n:'Glacier Rod',price:9500,luck:50,reel:1.25,ctrl:.1,res:.2,shaft:'#9ab8c8',handle:'#2e4256',reelC:'#d8dde0',len:2.8,metal:.5,glow:'#bfe6f5',perk:{wt:.15,d:'Fish weigh 15% more'}},
 {id:'storm',n:'Stormcaller',price:15000,luck:62,reel:1.3,ctrl:.1,res:.3,shaft:'#4a5560',handle:'#22262a',reelC:'#8a96a0',len:2.85,metal:.6,wrap:'#c0a050',glow:'#cfe0ff',req:{lvl:15},perk:{luck:40,drain:.75,cond:'rain',d:'+40% luck and a steadier reel in rain or storms'}},
 {id:'magma',n:'Magma Caster',price:24000,luck:75,reel:1.4,ctrl:.1,res:.35,shaft:'#2a1e1a',handle:'#7a3a22',reelC:'#a8742a',len:2.9,metal:.3,glow:'#ff6a1a',perk:{sell:1.1,d:'Fish sell for 10% more'}},
 {id:'twin',n:'Twin-Hook Rod',price:34000,luck:85,reel:1.42,ctrl:.12,res:.35,shaft:'#5a4a3a',handle:'#2a2420',reelC:'#b0a080',len:2.95,metal:.4,wrap:'#b0a080',req:{lvl:20},perk:{dbl:.12,d:'12% chance of a double catch'}},
 {id:'sage',n:"Sage's Rod",price:46000,luck:95,reel:1.45,ctrl:.14,res:.38,shaft:'#6a5a7a',handle:'#2a2234',reelC:'#c8b8d8',len:3,glow:'#c8b0ff',req:{sp:'witchlight_angler'},perk:{xp:.4,d:'+40% XP'}},
 {id:'star',n:'Starweaver Rod',price:65000,luck:115,reel:1.5,ctrl:.15,res:.4,shaft:'#2a2e4a',handle:'#8a7a4a',reelC:'#a8a0c8',len:3,metal:.5,glow:'#c8a8ff',perk:{luck:25,mut:.03,cond:'night',d:'+25% luck and +3% mutations at night'}},
 {id:'lantern',n:'Abyssal Lantern',price:98000,luck:140,reel:1.58,ctrl:.17,res:.45,shaft:'#1e2a30',handle:'#3a3020',reelC:'#6a8a8a',len:3.1,metal:.7,wrap:'#c8a050',glow:'#ffd27a',req:{sp:'crowned_abyssfish'},perk:{mut:.08,d:'+8% mutation chance'}},
 {id:'spine',n:'Leviathan Spine',price:160000,luck:180,reel:1.7,ctrl:.2,res:.5,shaft:'#d8d0be',handle:'#1a2e2e',reelC:'#4ab8a0',len:3.2,glow:'#4affd0',req:{lvl:30},perk:{wt:.2,dbl:.05,d:'+20% weight and 5% double catch'}},
];
const RODM={};RODS.forEach(r=>RODM[r.id]=r);
const BAITS=[
 {id:'worm',n:'Garden Worm',price:30,qty:10,luck:0,wait:.85,mut:0,wt:0,d:'Bites come 15% faster'},
 {id:'shrimp',n:'Salted Shrimp',price:180,qty:10,luck:15,wait:.75,mut:0,wt:0,d:'+15% luck, bites 25% faster'},
 {id:'glowfly',n:'Glowfly',price:350,qty:10,luck:35,wait:1,mut:0,wt:0,night:true,d:'+35% luck, doubled at night'},
 {id:'prism',n:'Prism Lure',price:1200,qty:10,luck:10,wait:1,mut:.06,wt:0,d:'+10% luck, +6% mutation chance'},
 {id:'ink',n:'Kraken Ink',price:3500,qty:5,luck:90,wait:.9,mut:.02,wt:.2,d:'+90% luck, +20% weight'},
];
const BAITM={};BAITS.forEach(b=>BAITM[b.id]=b);
const BOATS=[
 {id:'dinghy',n:'Driftwood Dinghy',price:0,speed:18,turn:1.4,storage:0,fx:{luck:5,d:'+5% luck while fishing from the boat'},m:{L:5.6,W:1.22,H:.78,D:-.42,hull:'#d6d0c4',bottom:'#5a4036',type:'row'}},
 {id:'skiff',n:'Reed Skiff',price:2500,speed:20,turn:1.65,storage:10,fx:{wait:.85,d:'Bites come 15% faster from the boat'},m:{L:6.6,W:1.05,H:.62,D:-.38,hull:'#7a6a54',bottom:'#4a3c30',stripe:'#5a4a3a',type:'skiff'}},
 {id:'sloop',n:'Gull Sloop',price:9000,speed:21,turn:1.3,storage:20,fx:{luck:20,d:'+20% luck from the boat'},m:{L:7.6,W:1.5,H:.9,D:-.6,hull:'#dcd7cc',bottom:'#2e3e4c',stripe:'#3e5468',type:'sail'}},
 {id:'cruiser',n:'Tidewatch Cruiser',price:25000,speed:24,turn:1.25,storage:30,fx:{drain:.65,bar:1.1,cond:'rain',d:'Reeling is 35% easier in rain and storms'},m:{L:8.6,W:1.8,H:1.05,D:-.7,hull:'#cfd1cd',bottom:'#4a2e2a',stripe:'#2e4052',type:'cabin'}},
 {id:'runner',n:'Abyss Runner',price:60000,speed:28,turn:1.15,storage:40,fx:{luck:35,cond:'deep',d:'+35% luck for rare fish in open water'},m:{L:9.6,W:1.9,H:1.1,D:-.75,hull:'#2e3a44',bottom:'#1c242a',stripe:'#8a2e2a',type:'runner'}},
 {id:'trawler',n:'Ironkeel Trawler',price:140000,speed:22,turn:.95,storage:70,fx:{mut:.08,wt:.15,d:'+8% mutation chance and +15% weight from the boat'},m:{L:11.5,W:2.3,H:1.4,D:-.95,hull:'#5e3a30',bottom:'#2a2422',stripe:'#d6d0c4',type:'trawler'}},
];
const BOATM={};BOATS.forEach(b=>BOATM[b.id]=b);
const BUFFS=[
 {id:'tonic',n:'Luck Tonic',price:300,dur:240,ico:'L',c:'#6f8f5e',fx:{luck:35,d:'+35% luck'}},
 {id:'steady',n:'Steady Hands',price:350,dur:240,ico:'S',c:'#5f7f9a',fx:{bar:1.2,drain:.75,d:'Reel bar 20% wider, meter drains 25% slower'}},
 {id:'charm',n:'Mutation Charm',price:700,dur:180,ico:'M',c:'#86708f',fx:{mut:.06,d:'+6% mutation chance'}},
 {id:'brew',n:'XP Brew',price:450,dur:300,ico:'X',c:'#9a8350',fx:{xp:.5,d:'+50% XP'}},
 {id:'scent',n:'Lure Scent',price:250,dur:240,ico:'B',c:'#946650',fx:{wait:.7,d:'Bites come 30% faster'}},
];
const BUFFM={};BUFFS.forEach(b=>BUFFM[b.id]=b);
const ENCH={
 swift:{n:'Swift',d:'Reel speed +20%',c:'#bfeeff'}, lucky:{n:'Lucky',d:'Luck +40%',c:'#c8f7c0'}, steady:{n:'Steady',d:'Reel bar 25% wider',c:'#fff0b0'},
 sturdy:{n:'Sturdy',d:'Catch meter drains 30% slower',c:'#f6d8bc'}, hefty:{n:'Hefty',d:'Fish weigh 25% more',c:'#ffd2bd'},
 mutant:{n:'Mutagenic',d:'+5% mutation chance',c:'#ffcdf1'}, hasty:{n:'Hasty',d:'Bites come 30% faster',c:'#dcdcff'}, midas:{n:'Midas',d:'Fish sell for 20% more',c:'#ffe29a'}
};
const ENCH3D={swift:'#5ad8ff',lucky:'#7aff6a',steady:'#ffd84a',sturdy:'#e0a060',hefty:'#ff8a4a',mutant:'#ff6ae0',hasty:'#b0b0ff',midas:'#ffc933'};
const EVENTS=[
 {id:'surge',n:'Mutation Surge',d:'Mutation chance ×3',c:'#e77bc8'},
 {id:'golden',n:'Golden Tide',d:'Golden fish ×8 · sale prices +25%',c:'#eeb43c'},
 {id:'frenzy',n:'Feeding Frenzy',d:'Fish bite twice as fast',c:'#56a3dd'},
 {id:'current',n:'Lucky Current',d:'+60% luck for everyone',c:'#4fb98c'},
];
/* big world events: everyone shares the same schedule (it runs off the real clock), each one changes the world and the fishing */
const BIG_EVENTS=[
 {id:'leviathan',n:'Leviathan Passage',d:'Whales are passing the isles · +100% luck · +50% fish weight',c:'#6fa8d6',big:true},
 {id:'starfall',n:'Starfall',d:'Stars are falling into the sea · mutation chance ×2, glowing and prismatic fish ×5',c:'#c9a6ff',big:true},
 {id:'aurora',n:'Aurora Tide',d:'The sea glows · night fish bite any time · +40% luck',c:'#5fe0b8',big:true},
 {id:'swell',n:'The Great Swell',d:'Huge rolling waves · +40% weight · +30% luck',c:'#e8a35a',big:true},
];
const BIG_CYCLE=900,BIG_START=600,BIG_LEN=240,BIG_WARN=60;
const MAXINV=200;
const NPCS=[
 {id:'marlo',name:'Marlo',title:'Fish Merchant',role:'merchant',zone:'cove',dth:1.05,look:{skin:'#e8b48a',shirt:'#5b8fd8',pants:'#3f4a6a',hat:'#f2c230',hatType:'bucket'},house:{wall:'#d6ccb8',roof:'#7e4a3c',trim:'#e6dfd2'},
  lines:['Fresh catch? I pay fair, and I pay in shiny coins.','Heavier fish fetch more. A mutated one? Even better.','Lock your favourites so you don\'t sell them by accident!']},
 {id:'tess',name:'Tess',title:'Tackle & Bait',role:'rods',zone:'cove',dth:-1.05,look:{skin:'#c88a5a',shirt:'#72c46a',pants:'#5a4632',hat:'#ff8a6a',hatType:'cap'},house:{wall:'#c9cfd1',roof:'#4b5f70',trim:'#e4e4e0'},
  lines:['A better rod means luckier bites and a wider reel bar.','Bait gets used up one cast at a time. Stock up!','Glowflies really shine after sundown.']},
 {id:'gilda',name:'Gilda',title:'Appraiser',role:'appraiser',zone:'cove',dth:2.6,look:{skin:'#f0c8a0',shirt:'#9a78e8',pants:'#3a3a5a',hat:'#3a3a5a',hatType:'top'},house:{wall:'#d3ccd2',roof:'#574b62',trim:'#e4e0e2'},
  lines:['Let me take a closer look. Weights can be… re-evaluated.','Sometimes a fish reveals a mutation under my lens.','My fee depends on the species. Rare fish, rare fees.']},
 {id:'rook',name:'Rook',title:'Harbormaster',role:'harbor',zone:'cove',look:{skin:'#d8a070',shirt:'#34466a',pants:'#2a3a5a',hat:'#ffffff',hatType:'cap'},
  lines:['Charts to far islands aren\'t cheap, but the fishing\'s worth it.','Take the boat, or I can ferry you to any island you\'ve charted.','Locked waters push your boat back. Buy the chart first.']},
 {id:'harlan',name:'Harlan',title:'Shipwright',role:'shipwright',zone:'cove',look:{skin:'#c99a78',shirt:'#5a6670',pants:'#3a3f44',hat:'#4a4036',hatType:'cap'},
  lines:['Every hull I build floats. Most of them, anyway.','A bigger boat holds more fish, and a better engine gets you home before dark.','Sonar pays for itself the first time you find a deep-water school.']},
 {id:'odessa',name:'Odessa',title:'Apothecary',role:'buffs',zone:'cove',dth:-2.6,look:{skin:'#e2b896',shirt:'#6b5a4a',pants:'#3a3a40',hat:'#5b6b5a',hatType:'sunhat'},house:{wall:'#cfc6b6',roof:'#5b6b5a',trim:'#e8e2d6'},
  lines:['A few drops of tonic and the fish practically jump at you.','Mix as many as you like. They all stack.','Steady Hands is a favourite on stormy days.']},
 {id:'bramble',name:'Bramble',title:'Bog Merchant',role:'merchant',zone:'moss',dth:1.1,look:{skin:'#a8c890',shirt:'#7a5a3a',pants:'#4a5a3a',hat:'#5a8a44',hatType:'beanie'},house:{wall:'#9a8a68',roof:'#577a35',trim:'#d8caa0'},stilt:true,
  lines:['Bog fish smell funny but sell fine.','Night is when the bog really wakes up.']},
 {id:'mags',name:'Mags',title:'Harbormaster',role:'harbor',zone:'moss',look:{skin:'#e0b090',shirt:'#4a7a5a',pants:'#3a3a3a',hat:'#c8d04a',hatType:'bucket'},
  lines:['Mind the lily pads, they bruise the hull.','Ferry\'s ready whenever you are.']},
 {id:'fen',name:'Sister Fen',title:'Altar Keeper',role:'altar',zone:'moss',look:{skin:'#d8c0e8',shirt:'#6a4ab8',pants:'#3a2a6a',hat:'#2a1a4a',hatType:'top'},
  lines:['Bring a Tide Relic. The altar will bless your rod with something… unpredictable.','Relics wash up rarely, hooked on any line, in any water.']},
 {id:'hollis',name:'Hollis',title:'Ice Merchant',role:'merchant',zone:'frost',dth:1.1,look:{skin:'#f0d0c0',shirt:'#d0605a',pants:'#3a4a6a',hat:'#ffffff',hatType:'beanie'},house:{wall:'#d6dbe0',roof:'#4b5f75',trim:'#ebeceb',snow:true},
  lines:['Frozen fish keep forever. Frozen mutations sell for triple!','Brr. Sell fast, my fingers are numb.']},
 {id:'pip',name:'Pip',title:'Harbormaster',role:'harbor',zone:'frost',look:{skin:'#f0c8b0',shirt:'#5a86c0',pants:'#2a2a3a',hat:'#ff7a5a',hatType:'beanie'},
  lines:['Fog rolls off the glacier fast. Strange things swim in it.']},
 {id:'brannoc',name:'Brannoc',title:'Ice Appraiser',role:'appraiser',zone:'frost',dth:-1.1,look:{skin:'#c8a088',shirt:'#4a6a8a',pants:'#2a2a3a',hat:'#8a6a4a',hatType:'bucket'},house:{wall:'#cfd5da',roof:'#3f5268',trim:'#e6e7e6',snow:true},
  lines:['Hold still, fish. Let\'s see what you really weigh.']},
 {id:'cinda',name:'Cinda',title:'Ash Merchant',role:'merchant',zone:'ember',dth:1.1,look:{skin:'#b07850',shirt:'#ff8a4a',pants:'#3a2a2a',hat:'#2b2b2b',hatType:'cap'},house:{wall:'#625250',roof:'#c84a2a',trim:'#8a7068'},
  lines:['Fire fish sell hot. Get it? …I\'ll stop.','Watch your step near the lava pools.']},
 {id:'kettle',name:'Kettle',title:'Harbormaster',role:'harbor',zone:'ember',look:{skin:'#e0a080',shirt:'#6a5a58',pants:'#2a2a2a',hat:'#ffb02a',hatType:'bucket'},
  lines:['Hull holding up? The water\'s warm out here.']},
 {id:'oren',name:'Oren',title:'Forge Rods',role:'rods',zone:'ember',dth:-1.1,look:{skin:'#8a5a3a',shirt:'#4a4a4a',pants:'#5a2a1a',hat:'#ff6a2a',hatType:'beanie'},house:{wall:'#554846',roof:'#ff7a3a',trim:'#7a6460'},
  lines:['Every rod in the world, forged or found. Take your pick.']},
];
const SHIRTS=['#a8604e','#b88452','#b89c58','#6c8558','#4f7f7a','#4f6a8c','#6a6188','#8e5e78','#d6d0c2','#3e4a5c'];
const SKINS=['#f6d3b3','#eab894','#d39b72','#a8714d','#7a4e33'];
const HATS=[{id:'bucket',n:'Bucket hat'},{id:'cap',n:'Cap'},{id:'beanie',n:'Beanie'},{id:'sunhat',n:'Sun hat'},{id:'top',n:'Top hat'},{id:'none',n:'No hat'}];
const EMOTES={wave:{n:'Wave',d:2.6},dance:{n:'Dance',d:6},cheer:{n:'Cheer',d:3},show:{n:'Show off',d:4.5}};

/* ================= STATE / SAVE ================= */
const KEY='driftwood-isles-save-v1';
function defSettings(){return{gfx:isMobile?'medium':'high',gfxAuto:true,music:.55,sfx:.8,amb:.7,chill:false,tags:true,weather:'auto',v2:true,v3:true};}
function freshState(){return{v:2,coins:0,earned:0,xp:0,level:1,inv:[],rods:['drift'],rod:'drift',bait:{},baitOn:null,ench:{},relics:0,unlocked:['cove'],dex:{},last:'cove',settings:defSettings(),uid:1,savedAt:0,tips:{},profile:null,boats:['dinghy'],boat:'dinghy',bup:{},buffs:{}};}
function sanitize(s){const f=freshState();if(!s||typeof s!=='object')return f;const o=Object.assign(f,s);
 const old=s.settings||{};o.settings=Object.assign(defSettings(),old);
 if(!old.v2){o.settings.v2=true;o.settings.gfxAuto=true;o.settings.gfx=isMobile?'medium':'high';if(old.sound===false){o.settings.music=0;o.settings.sfx=0;o.settings.amb=0;}}
 if(!old.v3){o.settings.v3=true;o.settings.gfxAuto=true;o.settings.gfx=isMobile?'medium':'high';}
 delete o.settings.sound;if(!['ultra','high','medium','low'].includes(o.settings.gfx))o.settings.gfx='medium';if(!['auto','clear','rain','storm','fog'].includes(o.settings.weather))o.settings.weather='auto';
 for(const k of['music','sfx','amb'])o.settings[k]=clamp(Number(o.settings[k])||0,0,1);
 if(!Array.isArray(o.inv))o.inv=[];o.inv=o.inv.filter(x=>x&&SPM[x.sp]);if(!Array.isArray(o.rods)||!o.rods.length)o.rods=['drift'];if(!RODM[o.rod])o.rod='drift';
 if(!Array.isArray(o.unlocked))o.unlocked=['cove'];if(!o.unlocked.includes('cove'))o.unlocked.push('cove');if(!ZONES[o.last]||o.last==='sea')o.last='cove';
 if(o.baitOn&&!BAITM[o.baitOn])o.baitOn=null;if(!Array.isArray(o.boats)||!o.boats.length)o.boats=['dinghy'];if(!BOATM[o.boat])o.boat='dinghy';if(!o.bup||typeof o.bup!=='object')o.bup={};if(!o.buffs||typeof o.buffs!=='object')o.buffs={};for(const k in o.buffs)if(!BUFFM[k]||!(o.buffs[k]>0))delete o.buffs[k];if(typeof o.earned!=='number')o.earned=o.coins||0;
 if(o.profile){const p=o.profile;o.profile={name:cleanText(p.name,16)||'Angler',color:isHex(p.color)?p.color:SHIRTS[5],hatC:isHex(p.hatC)?p.hatC:SHIRTS[2],skin:isHex(p.skin)?p.skin:SKINS[1],hat:HATS.some(h=>h.id===p.hat)?p.hat:'bucket'};}
 return o;}
let state=freshState();
function loadLocal(){try{const r=localStorage.getItem(KEY);if(r)return sanitize(JSON.parse(r));}catch(e){}return null;}
let cloudRef=null,lastCloud=0,cloudPending=false;
function save(){state.savedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}cloudPending=true;cloudTick(false);}
function cloudTick(force){if(!cloudRef||!cloudPending)return;const now=Date.now();if(!force&&now-lastCloud<20000)return;lastCloud=now;cloudPending=false;
 cloudRef.set({json:JSON.stringify(state),savedAt:state.savedAt}).catch(e=>{if(e&&(e.code==='invalid_argument'||e.code==='not_granted'||e.code==='revoked'))cloudRef=null;});}

/* ================= AUDIO ================= */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const AU={ctx:null,
 init(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=this.ctx=new AC();
   const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;comp.attack.value=.01;comp.release.value=.3;comp.connect(c.destination);
   this.master=c.createGain();this.master.gain.value=.9;this.master.connect(comp);
   this.verb=c.createConvolver();this.verb.buffer=this.ir(3.4,2.4);const vg=c.createGain();vg.gain.value=.55;this.verb.connect(vg);vg.connect(this.master);
   this.bus={};for(const k of['music','sfx','amb']){const g=c.createGain();g.connect(this.master);const s=c.createGain();s.gain.value=k==='music'?.6:k==='sfx'?.2:.12;g.connect(s);s.connect(this.verb);this.bus[k]=g;}
   this.dly=c.createDelay(2);this.dly.delayTime.value=.6;const fb=c.createGain();fb.gain.value=.3;const dl=c.createBiquadFilter();dl.type='lowpass';dl.frequency.value=2400;
   this.dly.connect(dl);dl.connect(fb);fb.connect(this.dly);dl.connect(this.bus.music);this.dlySend=c.createGain();this.dlySend.gain.value=.3;this.dlySend.connect(this.dly);
   const len=c.sampleRate*3,nb=c.createBuffer(1,len,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.nb=nb;
   const bb=c.createBuffer(1,len,c.sampleRate),bd=bb.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;bd[i]=last*3.5;}this.bb=bb;
   this.applyVol();this.startAmb();Music.start();
  }catch(e){this.ctx=null;}},
 ir(dur,decay){const c=this.ctx,len=Math.floor(c.sampleRate*dur),b=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}return b;},
 applyVol(){if(!this.ctx)return;const s=state.settings,t=this.ctx.currentTime;this.bus.music.gain.setTargetAtTime(s.music*s.music*.85,t,.15);this.bus.sfx.gain.setTargetAtTime(s.sfx*s.sfx,t,.1);this.bus.amb.gain.setTargetAtTime(s.amb*s.amb*.9,t,.2);},
 loop(buf,filterType,freq,q){const c=this.ctx,s=c.createBufferSource();s.buffer=buf;s.loop=true;s.loopStart=0;const f=c.createBiquadFilter();f.type=filterType;f.frequency.value=freq;f.Q.value=q||.7;const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(this.bus.amb);s.start(0,Math.random()*2);return{f,g};},
 o(f,dur,{type='sine',vol=.2,slide=0,delay=0,att=.006,bus='sfx',pan=0,send=null}={}){const c=this.ctx;if(!c)return;const t=c.currentTime+delay;const os=c.createOscillator(),g=c.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(slide)os.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);os.connect(g);let out=g;
  if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);out=p;}out.connect(this.bus[bus]);if(send)out.connect(send);os.start(t);os.stop(t+dur+.05);},
 n(dur,vol,f0,f1,{type='bandpass',q=1,delay=0,att=.01,bus='sfx',pan=0,buf=null}={}){const c=this.ctx;if(!c)return;const t=c.currentTime+delay;const s=c.createBufferSource();s.buffer=buf||this.nb;const fl=c.createBiquadFilter();fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);let out=g;
  if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);out=p;}out.connect(this.bus[bus]);s.start(t,Math.random()*2);s.stop(t+dur+.05);},
 bell(f,dur,vol,delay=0,bus='sfx'){this.o(f,dur,{vol,delay,bus,att:.004});this.o(f*2.01,dur*.6,{vol:vol*.25,delay,bus});this.o(f*3.98,dur*.3,{vol:vol*.08,delay,bus});},
 /* sound effects */
 cast(){this.n(.42,.22,420,2600,{q:.8});this.n(.55,.05,3000,7000,{type:'highpass',delay:.05});this.o(950,.5,{type:'triangle',vol:.03,slide:-500,delay:.08});},
 splash(sz=1,pan=0){this.n(.55,.3*sz,2400,260,{type:'lowpass',pan});this.o(320,.14,{vol:.2*sz,slide:-230,pan});for(let i=0;i<4;i++)this.o(rand(1200,2600),.06,{vol:.035*sz,delay:rand(.05,.35),pan});},
 plop(pan=0){this.o(460,.1,{vol:.07,slide:-280,pan});},
 shake(){this.o(620,.09,{vol:.11,slide:380});this.o(1240,.07,{vol:.05,delay:.05});this.n(.08,.05,3000,5000,{q:3});},
 bite(){this.splash(.8);this.bell(784,.5,.14,.1);this.bell(1175,.7,.12,.24);},
 tick(){this.n(.025,.07,2600,2400,{q:6});},
 catch(r=0){const sc=[523.25,659.25,783.99,1046.5,1318.5,1568];sc.forEach((f,i)=>this.bell(f,.9,.12,i*.075));this.splash(.6);
  if(r>=3){[392,493.88,587.33].forEach(f=>this.o(f,2.2,{type:'triangle',vol:.05,att:.2,delay:.3}));for(let i=0;i<6;i++)this.bell(rand(1800,3200),.6,.04,.5+i*.08);this.n(1.4,.06,6000,2000,{type:'highpass',delay:.4});}},
 escape(){this.o(523,.35,{type:'triangle',vol:.08});this.o(392,.55,{type:'triangle',vol:.08,delay:.18});this.splash(.4);},
 coin(){this.bell(1568,.35,.09);this.bell(2093,.5,.08,.07);},
 level(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.bell(f,1.1,.1,i*.11));this.n(1.2,.05,5000,1500,{type:'highpass',delay:.3});},
 ui(){this.o(760,.06,{vol:.05});},
 open(){this.o(520,.08,{vol:.05});this.o(700,.1,{vol:.04,delay:.05});},
 close(){this.o(640,.08,{vol:.04});this.o(480,.1,{vol:.035,delay:.05});},
 enchant(){for(let i=0;i<9;i++)this.bell(600+i*130,.8,.06,i*.06);this.n(1.4,.12,3000,400);},
 jump(){this.o(240,.14,{type:'triangle',vol:.05,slide:220});},
 step(kind){if(kind==='wood'){this.n(.06,.05,900,600,{q:2});this.o(160,.05,{vol:.03});}else if(kind==='snow')this.n(.1,.04,1600,700,{type:'lowpass'});else if(kind==='sand')this.n(.07,.025,3500,2500,{type:'highpass'});else this.n(.06,.025,1100,700,{type:'lowpass'});},
 chat(){this.o(880,.07,{vol:.04});this.o(1320,.08,{vol:.03,delay:.06});},
 feed(){[1046.5,1318.5,1568].forEach((f,i)=>this.bell(f,.6,.06,i*.08));},
 cheer(){for(let i=0;i<5;i++)this.bell(rand(900,1800),.4,.05,i*.07);},
 thunder(dist){const v=clamp(1.2-dist/400,.25,1);const d=clamp(dist/340,.2,1.6);this.n(.35,.22*v,4000,600,{bus:'amb',delay:d,q:.6});this.n(4.2,.6*v,220,38,{type:'lowpass',bus:'amb',buf:this.bb,delay:d+.05,att:.12});this.n(3,.35*v,120,30,{type:'lowpass',bus:'amb',buf:this.bb,delay:d+.6,att:.3});},
 /* ambience */
 startAmb(){const c=this.ctx;this.amb={waves:this.loop(this.bb,'lowpass',520,.5),wash:this.loop(this.nb,'bandpass',900,.6),wind:this.loop(this.nb,'bandpass',600,.9),rain:this.loop(this.nb,'highpass',900,.5),lava:this.loop(this.bb,'lowpass',130,.7),engine:null};
  const o=c.createOscillator();o.type='sawtooth';o.frequency.value=46;const ef=c.createBiquadFilter();ef.type='lowpass';ef.frequency.value=260;const eg=c.createGain();eg.gain.value=0;const lfo=c.createOscillator();lfo.frequency.value=9;const lg=c.createGain();lg.gain.value=.4;
  lfo.connect(lg);lg.connect(eg.gain);o.connect(ef);ef.connect(eg);eg.connect(this.bus.amb);o.start();lfo.start();this.amb.engine={o,g:eg,f:ef};
  const co=c.createOscillator();co.type='square';co.frequency.value=4300;const cf=c.createBiquadFilter();cf.type='bandpass';cf.frequency.value=4300;cf.Q.value=8;const ca=c.createGain();ca.gain.value=0;const cl=c.createOscillator();cl.type='square';cl.frequency.value=26;const cd=c.createGain();cd.gain.value=.5;
  cl.connect(cd);cd.connect(ca.gain);co.connect(cf);cf.connect(ca);const cg=c.createGain();cg.gain.value=0;ca.connect(cg);cg.connect(this.bus.amb);co.start();cl.start();this.amb.crickets=cg;this.amb.cricketAmp=ca;
  this.swellT=0;this.birdT=4;this.owlT=20;this.gullT=8;this.dripT=0;this.windT=0;this.chirpOn=0;},
 updAmb(dt,p){if(!this.ctx||!this.amb)return;const c=this.ctx,t=c.currentTime,A=this.amb;
  this.swellT-=dt;if(this.swellT<=0){const s=rand(3.5,7.5);this.swellT=s;const peak=(p.boat?.42:.3)*(p.shore+.35);A.waves.g.gain.cancelScheduledValues(t);A.waves.g.gain.setTargetAtTime(peak,t,s*.22);A.waves.g.gain.setTargetAtTime(peak*.35,t+s*.45,s*.3);
   A.wash.g.gain.cancelScheduledValues(t);A.wash.g.gain.setTargetAtTime(.05*p.shore,t+s*.3,.6);A.wash.g.gain.setTargetAtTime(.008,t+s*.55,.8);}
  this.windT-=dt;if(this.windT<=0){this.windT=rand(2,4.5);A.wind.f.frequency.setTargetAtTime(rand(380,900),t,1.5);}
  const windLvl=.03+(p.boat?.05:0)+p.cloud*.04+p.fog*.03+(p.zone==='frost'?.05:0);A.wind.g.gain.setTargetAtTime(windLvl,t,1.2);
  A.rain.g.gain.setTargetAtTime(p.rain*.22,t,.8);A.lava.g.gain.setTargetAtTime(p.zone==='ember'?.25:0,t,1.5);
  A.engine.g.gain.setTargetAtTime(p.boat?.02+Math.min(Math.abs(p.speed)/19,1)*.06:0,t,.3);A.engine.o.frequency.setTargetAtTime(42+Math.abs(p.speed)*2.2,t,.3);
  const crick=(1-p.day)*(1-p.rain)*(p.zone!=='sea'&&p.zone!=='frost'?.035:.008);A.crickets.gain.setTargetAtTime(crick*(Math.sin(t*.7)>-.3?1:.15),t,.4);
  if(p.rain>.3){this.dripT-=dt;if(this.dripT<=0){this.dripT=rand(.05,.25)/p.rain;this.o(rand(1800,3800),.04,{vol:.012*p.rain,bus:'amb',pan:rand(-.8,.8),slide:-600});}}
  if(p.day>.4&&p.rain<.3){this.gullT-=dt;if(this.gullT<=0){this.gullT=rand(8,18);this.gull(rand(-.7,.7),p.zone==='sea'?.05:.035);}
   if(p.zone==='cove'||p.zone==='moss'){this.birdT-=dt;if(this.birdT<=0){this.birdT=rand(2.5,7);this.chirp(rand(-.8,.8));}}}
  if(p.day<.3){this.owlT-=dt;if(this.owlT<=0){this.owlT=rand(22,40);if(p.zone!=='sea'&&p.zone!=='ember'){this.o(392,.35,{vol:.03,bus:'amb',att:.06,pan:-.4,slide:-20});this.o(370,.6,{vol:.03,bus:'amb',att:.08,delay:.45,pan:-.4,slide:-25});}}}},
 gull(pan,vol){for(let i=0;i<rand(2,4)|0;i++){const d=i*rand(.25,.4);this.o(rand(1300,1600),.32,{type:'sawtooth',vol:vol*.25,slide:-700,delay:d,bus:'amb',pan,att:.03});this.o(rand(1300,1600),.3,{type:'sine',vol:vol*.7,slide:-650,delay:d,bus:'amb',pan,att:.03});}},
 chirp(pan){const n=3+(Math.random()*4|0),base=rand(2600,4200);for(let i=0;i<n;i++)this.o(base+rand(-300,300),.06,{vol:.02,slide:rand(600,1400),delay:i*rand(.07,.11),bus:'amb',pan});}
};
/* generative music: soft pads, plucked melody by day, music-box bells at night */
const Music={on:false,step:0,next:0,mode:'day',ci:0,deg:4,timer:null,
 DAY:{bpm:74,ch:[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,64],[45,52,57,61,64]],sc:[62,64,66,69,71,74,76,78,81,83],bass:[38,35,31,33],cut:1100},
 NIGHT:{bpm:56,ch:[[45,52,55,59,64],[41,48,52,57,60],[48,55,59,64,67],[40,47,52,55,59]],sc:[57,60,62,64,67,69,72,74,76,79],bass:[33,29,36,28],cut:760},
 start(){if(this.on||!AU.ctx)return;this.on=true;this.next=AU.ctx.currentTime+.3;this.timer=setInterval(()=>this.tick(),60);},
 cur(){return this.mode==='day'?this.DAY:this.NIGHT;},
 tick(){const c=AU.ctx;if(!c||c.state!=='running')return;const P=this.cur();const spb=60/(P.bpm*(state.settings.chill?.92:1))/2;
  while(this.next<c.currentTime+.3){this.play(this.next,spb);this.next+=spb;this.step++;}},
 play(t,spb){const s=this.step%32,beat=s%8;let P=this.cur();
  if(s===0){this.ci=(this.ci+1)%4;if(this.ci===0||this.ci===2){const want=(typeof env!=='undefined'&&env.day<.42)?'night':'day';if(want!==this.mode){this.mode=want;P=this.cur();}}
   this.pad(P.ch[this.ci],t,spb*32,P.cut);}
  if(beat===0)this.bass(P.bass[this.ci],t,spb*6);
  if(beat===4&&this.mode==='day')this.bass(P.bass[this.ci]+7,t,spb*3,.05);
  const dens=this.mode==='day'?(beat%2===0?.42:.2):(beat%2===0?.26:.06);
  if(Math.random()<dens){this.deg=clamp(this.deg+pick([-2,-1,-1,0,1,1,2]),0,P.sc.length-1);const m=P.sc[this.deg];if(this.mode==='day')this.pluck(m,t);else this.mbox(m,t);}
  if(this.mode==='day'&&beat%2===1&&Math.random()<.7)AU.n(.05,.008,7000,6000,{type:'highpass',bus:'music',delay:t-AU.ctx.currentTime});},
 pad(notes,t,dur,cut){const c=AU.ctx;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;f.Q.value=.4;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+2.2);g.gain.setValueAtTime(.05,t+dur-.4);g.gain.exponentialRampToValueAtTime(0.0001,t+dur+2.4);f.connect(g);g.connect(AU.bus.music);
  for(const m of notes)for(const dt of[-7,7]){const o=c.createOscillator();o.type='triangle';o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+dur+2.6);}},
 bass(m,t,dur,v=.09){const c=AU.ctx;const o=c.createOscillator();o.type='sine';o.frequency.value=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.05);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(AU.bus.music);o.start(t);o.stop(t+dur+.1);},
 pluck(m,t){const c=AU.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.006);g.gain.exponentialRampToValueAtTime(0.0001,t+1.1);g.connect(AU.bus.music);g.connect(AU.dlySend);
  const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.connect(g);const o2=c.createOscillator();o2.type='sine';o2.frequency.value=f*3.98;const g2=c.createGain();g2.gain.setValueAtTime(.25,t);g2.gain.exponentialRampToValueAtTime(0.001,t+.15);o2.connect(g2);g2.connect(g);
  o.start(t);o2.start(t);o.stop(t+1.2);o2.stop(t+.2);},
 mbox(m,t){const c=AU.ctx,f=mtof(m+12);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+2.6);g.connect(AU.bus.music);g.connect(AU.dlySend);
  for(const[k,v]of[[1,1],[2.76,.28],[5.4,.1]]){const o=c.createOscillator();o.type='sine';o.frequency.value=f*k;const gg=c.createGain();gg.gain.value=v;o.connect(gg);gg.connect(g);o.start(t);o.stop(t+2.7);}}
};
