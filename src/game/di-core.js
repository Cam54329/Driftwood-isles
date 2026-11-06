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
/* catch odds by rarity (percent). Luck moves the odds from BASE toward CAP with diminishing returns, so
   commons stay the everyday catch and legendaries stay special even with the best gear (see rarityOdds) */
const RAR_BASE=[62,24,9.5,3.3,.95,.22,.04],RAR_CAP=[30,30,22.5,11,4.6,1.5,.4];
/* Rare and above are three times harder to find than the base table; the odds they lose go to commons and uncommons */
const RARE_SCARCITY=3;
function rarityOdds(L){const k=1-Math.exp(-Math.max(0,L)/1.6);const w=RAR_BASE.map((b,i)=>lerp(b,RAR_CAP[i],k));const t=w.reduce((a,b)=>a+b,0);const o=w.map(v=>v/t);
 let cut=0;for(let i=2;i<o.length;i++){const n=o[i]/RARE_SCARCITY;cut+=o[i]-n;o[i]=n;}const lo=o[0]+o[1];o[0]+=cut*o[0]/lo;o[1]+=cut*o[1]/lo;return o;}
const MUTS={
 shiny:{n:'Shiny',m:1.5,w:34,c:'#fff3b8'}, albino:{n:'Albino',m:2,w:22,c:'#ffe6ec'}, glowing:{n:'Glowing',m:2.5,w:16,c:'#c8ffb0'},
 frozen:{n:'Frozen',m:3,w:12,c:'#c6ecff'}, shadow:{n:'Shadow',m:4,w:8,c:'#d6c6ff'}, golden:{n:'Golden',m:5,w:5,c:'#ffd970'}, prismatic:{n:'Prismatic',m:8,w:2,c:'#ffc4ee'}
};
const ZONES={
 cove:{n:'Pebble Cove',tag:'Starter harbor',x:0,z:0,R:104,H:3.2,hill:1.4,p1:.7,p2:2.1,price:0,grass:'#6e8a4c',grass2:'#5e7a42',sand:'#cbb88c',rock:'#8a8c88'},
 moss:{n:'Mossreach',tag:'Misty bog isle',x:580,z:-310,R:94,H:2.6,hill:1.1,p1:2.3,p2:.4,price:6000,grass:'#566e3e',grass2:'#4a6136',sand:'#a99a74',rock:'#666b62'},
 frost:{n:'Frostmere',tag:'Frozen fjord',x:-540,z:-520,R:98,H:4,hill:1.9,p1:4.1,p2:1.2,price:24000,grass:'#e3e7ea',grass2:'#d2d9de',sand:'#b7bec4',rock:'#7c868f'},
 ember:{n:'Emberkey',tag:'Smoldering volcano',x:180,z:720,R:96,H:3.4,hill:1.1,p1:1.4,p2:3.3,price:110000,grass:'#4a413d',grass2:'#3f3734',sand:'#5f5650',rock:'#2f2c2b',volcano:true},
 atoll:{n:'Sunken Atoll',tag:'Coral lagoon',x:-720,z:280,R:92,H:2.2,hill:.7,p1:3.1,p2:1.7,price:13000,grass:'#5f9440',grass2:'#4f8438',sand:'#d8c094',rock:'#c88a84'},
 amber:{n:'Amberglen',tag:'Autumn highlands',x:800,z:420,R:100,H:4.6,hill:2.1,p1:5.2,p2:2.6,price:72000,grass:'#8a8a48',grass2:'#7a6e3c',sand:'#c4ae84',rock:'#7a7068'},
 petal:{n:'Petalshore',tag:'Blossom hills',x:-170,z:-880,R:96,H:3.6,hill:1.6,p1:2.8,p2:.9,price:40000,grass:'#7c9a50',grass2:'#6c8a46',sand:'#dccaa6',rock:'#9a9088'},
 dune:{n:'Duneveil',tag:'Desert oasis',x:1090,z:-170,R:100,H:3.2,hill:1.5,p1:.6,p2:3.7,price:200000,mesa:true,grass:'#d0a464',grass2:'#c09254',sand:'#e4c890',rock:'#b4643c'},
 glim:{n:'Glimmerholt',tag:'Crystal highlands',x:-560,z:860,R:98,H:4.4,hill:2,p1:1.9,p2:4.4,price:400000,tor:true,grass:'#4e6a60',grass2:'#445e58',sand:'#aaa6b8',rock:'#5c5672'},
 sea:{n:'Open Waters',tag:'Deep sea'},
 well:{n:'Tide Well',tag:'A whirling well that opens at sea'},
 abyss:{n:'The Sunless Deep',tag:'The final chamber beneath the Hollow',x:-1650,z:-1600,R:66,H:2,hill:1.5,p1:2.4,p2:.8,price:0,grass:'#3e2a3a',grass2:'#352433',sand:'#4e3a46',rock:'#33262f',cave:true},
 hollow:{n:'The Drowned Hollow',tag:'A secret cave beneath the sea',x:-1350,z:-1050,R:72,H:2.2,hill:1.3,p1:1.1,p2:2.7,price:0,grass:'#3e5c5c',grass2:'#36524f',sand:'#5e7070',rock:'#425058',cave:true},
 pond_cove:{n:'Willow Pond',tag:'Pebble Cove pond',pond:'cove',col:'#3e5c52'},pond_moss:{n:'Murk Pool',tag:'Mossreach pond',pond:'moss',col:'#34422c'},
 pond_frost:{n:'Frozen Tarn',tag:'Frostmere pond',pond:'frost',col:'#56788a'},pond_ember:{n:'Ash Spring',tag:'Emberkey hot spring',pond:'ember',col:'#4e605c'},
 pond_atoll:{n:'Blue Lagoon',tag:'Sunken Atoll lagoon',pond:'atoll',col:'#2f8e9a'},pond_amber:{n:'Maple Mere',tag:'Amberglen pond',pond:'amber',col:'#4a5a3a'},
 pond_petal:{n:'Mirror Pool',tag:'Petalshore koi pond',pond:'petal',col:'#3a6a66'},pond_dune:{n:'Oasis Spring',tag:'Duneveil oasis',pond:'dune',col:'#1f8a8e'},pond_glim:{n:'Starwell',tag:'Glimmerholt spring',pond:'glim',col:'#2a3668'},pond_hollow:{n:'Lantern Pool',tag:'Drowned Hollow pool',pond:'hollow',col:'#164a58'},pond_abyss:{n:'Ember Pool',tag:'Sunless Deep pool',pond:'abyss',col:'#4a1a20'}
};
const ISL=['cove','moss','frost','ember','atoll','amber','petal','dune','glim'];
/* every piece of land, including the secret cave (which has no chart and no harbor) */
const LANDS=[...ISL,'hollow','abyss'];
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
 ['reef_dart','Reef Dart','atoll',0,.1,.6,30,'fish','#3a9ad8','#e8f4ff'],['clownfin','Clownfin','atoll',0,.05,.4,34,'fish','#f07a2a','#ffffff'],['blue_tang','Blue Tang','atoll',1,.3,1.6,110,'tall','#2a5ad8','#f2d03a'],['parrot_wrasse','Parrot Wrasse','atoll',1,1,5,150,'fish','#3ac8a0','#f0a0c0'],
 ['coral_grouper','Coral Grouper','atoll',2,4,20,520,'fish','#c8503a','#f0c0a0'],['moray_ribbon','Moray Ribbon','atoll',2,2,9,480,'eel','#6a7a3a','#d8d890','night'],['spotted_manta','Spotted Manta','atoll',3,40,300,2600,'ray','#2a3a4a','#f0f4f8'],['reef_shark','Reef Shark','atoll',4,30,140,6400,'shark','#7a8a96','#f0f2f4'],['atoll_sovereign','Atoll Sovereign','atoll',6,60,220,48000,'tall','#f0c040','#3a6ad8','fog'],
 ['lagoon_sprat','Lagoon Sprat','pond_atoll',0,.05,.3,36,'fish','#9ad8e8','#ffffff'],['glass_goby','Glass Goby','pond_atoll',1,.2,1,120,'fish','#c8f0f0','#ffffff'],['sunset_angel','Sunset Angel','pond_atoll',2,1,4,460,'tall','#f08a3a','#ffd060','day'],['lagoon_queen','Lagoon Queen','pond_atoll',5,8,30,12000,'tall','#e870c8','#a8f0ff','night'],
 ['leaf_trout','Leaf Trout','amber',0,.3,1.8,48,'fish','#a8883a','#f0e0b0'],['acorn_bass','Acorn Bass','amber',0,.5,2.6,56,'fish','#7a5a2a','#e8d0a0'],['russet_carp','Russet Carp','amber',1,2,9,190,'tall','#b8582a','#f0c890'],['maple_perch','Maple Perch','amber',1,.6,3,170,'fish','#d8602a','#f8e0b0'],
 ['harvest_salmon','Harvest Salmon','amber',2,4,16,700,'fish','#a84a3a','#f0d0c0'],['thornback_pike','Thornback Pike','amber',2,3,14,640,'long','#5a5a2a','#d8c890','rain'],['old_amber','Old Amber','amber',3,15,60,3400,'tall','#e0a030','#fff0c0'],['hollow_king','Hollow King','amber',4,20,90,8200,'shark','#4a3a2a','#c8a060','night'],['glenwyrm','Glenwyrm','amber',6,80,260,64000,'eel','#3a2a1a','#ffb040','fog'],
 ['mere_dace','Mere Dace','pond_amber',0,.1,.6,44,'fish','#8a9a6a','#f0f0d8'],['copperfin','Copperfin','pond_amber',1,.5,2.4,160,'fish','#c8783a','#f8d8a8'],['mistwhisker','Mistwhisker','pond_amber',2,2,8,560,'fish','#6a6a5a','#d8d8c0','fog','whisk'],['autumn_wyrm','Autumn Wyrm','pond_amber',5,10,40,14000,'eel','#c85a1a','#ffd080','rain'],
 ['petal_dace','Petal Dace','petal',0,.1,.7,42,'fish','#f0a8b8','#fff0f4'],['blossom_minnow','Blossom Minnow','petal',0,.05,.3,38,'fish','#f8c8d8','#ffffff'],['lantern_carp','Lantern Carp','petal',1,1,6,160,'tall','#e8603a','#ffe0a8'],['blushfin_trout','Blushfin Trout','petal',1,.8,4,150,'fish','#d87890','#f8e0e8','day'],
 ['inkbrush_eel','Inkbrush Eel','petal',2,.6,3,520,'eel','#2a2a32','#e8e0d0','night'],['moonbridge_koi','Moonbridge Koi','petal',2,2,8,560,'tall','#ffffff','#e84a3a'],['paperwing_ray','Paperwing Ray','petal',3,4,20,2600,'ray','#f0e8d8','#d86a7a'],['jade_sturgeon','Jade Sturgeon','petal',4,20,80,7000,'long','#3a8a6a','#c8f0d8','rain'],
 ['cranebill_marlin','Cranebill Marlin','petal',5,30,120,16000,'long','#e8e8f0','#d83a3a',null,'sail'],['spirit_koi','The Spirit Koi','petal',6,40,160,52000,'tall','#f8f4ff','#ff7ab8','fog','whisk'],
 ['glass_shiner','Glass Shiner','pond_petal',0,.05,.4,46,'fish','#d8e8e8','#ffffff'],['ribbon_goby','Ribbon Goby','pond_petal',1,.2,1.2,170,'fish','#e88aa8','#ffe8f0'],['tea_carp','Tea Carp','pond_petal',2,1,5,600,'tall','#8a6a3a','#e8d8a8'],['dragon_koi','Dragon Koi','pond_petal',4,4,16,9000,'tall','#e83a2a','#ffd84a','night'],['lotus_wyrm','Lotus Wyrm','pond_petal',5,3,14,20000,'eel','#f0a0c8','#7ad8a8'],
 ['sand_skipper','Sand Skipper','dune',0,.1,.6,58,'fish','#d8b070','#f8ecd0'],['mirage_perch','Mirage Perch','dune',0,.3,1.6,64,'fish','#e8c890','#ffffff','day'],['dune_catfish','Dune Catfish','dune',1,2,10,230,'fish','#a8784a','#e8d0a8',null,'whisk'],['scarab_tang','Scarab Tang','dune',1,.4,2,210,'tall','#2a8a7a','#f0c040'],
 ['sunstone_snapper','Sunstone Snapper','dune',2,2,9,780,'fish','#e8702a','#ffd890','day'],['sidewinder_eel','Sidewinder Eel','dune',2,1,5,720,'eel','#c8a060','#5a3a1a'],['canyon_grouper','Canyon Grouper','dune',3,15,70,3600,'tall','#a84a2a','#e8b088'],['gilded_ray','Gilded Ray','dune',4,10,50,9500,'ray','#e8c040','#3a2a1a'],
 ['dunestalker','Dunestalker Shark','dune',5,60,260,22000,'shark','#c8a070','#f0e0c0','night'],['the_mirage','The Mirage','dune',6,100,400,64000,'tall','#fff0c8','#7ad8ff',null,'lure'],
 ['oasis_tetra','Oasis Tetra','pond_dune',0,.05,.3,60,'fish','#3ac8c8','#ffffff'],['palm_loach','Palm Loach','pond_dune',1,.3,1.5,220,'eel','#7a8a3a','#e8e0a0'],['date_bream','Date Bream','pond_dune',2,1,4,820,'tall','#8a4a2a','#f0c890'],['jewel_cichlid','Jewel Cichlid','pond_dune',3,.5,2,3800,'fish','#2a6ae8','#f8d040'],['spring_serpent','Spring Serpent','pond_dune',5,4,18,26000,'eel','#2ab8a8','#f0e8c0','night'],
 ['shard_minnow','Shard Minnow','glim',0,.05,.4,78,'fish','#a8b8f8','#ffffff'],['dusk_char','Dusk Char','glim',0,.5,2.5,84,'fish','#5a5a9a','#e0d0f8'],['geode_bass','Geode Bass','glim',1,1,6,300,'tall','#6a4a8a','#f0c8ff'],['echo_gar','Echo Gar','glim',1,2,9,320,'long','#4a6a8a','#c8e8ff'],
 ['amethyst_salmon','Amethyst Salmon','glim',2,3,12,1000,'fish','#9a5ad8','#f0d8ff'],['glowscale_eel','Glowscale Eel','glim',2,1,6,950,'eel','#5affd8','#1a2a3a','night'],['quartz_pike','Quartz Pike','glim',3,8,30,4600,'long','#e8f0ff','#b8a8ff'],['prism_manta','Prism Manta','glim',4,40,200,12000,'ray','#3a2a6a','#a8f0ff'],
 ['crystal_leviathan','Crystal Leviathan','glim',5,120,450,30000,'shark','#b8c8ff','#5a4ad8','fog'],['heart_of_holt','Heart of the Holt','glim',6,150,500,80000,'tall','#ff8af0','#ffffff','night','lure'],
 ['star_guppy','Star Guppy','pond_glim',0,.05,.3,82,'fish','#f8f0a8','#5a6ad8'],['void_loach','Void Loach','pond_glim',1,.3,1.5,300,'eel','#1a1a3a','#8a7aff'],['moonstone_koi','Moonstone Koi','pond_glim',2,2,8,1100,'tall','#e8e8ff','#8ab8ff','night'],['nebula_angel','Nebula Angel','pond_glim',3,1,4,5200,'tall','#6a3ab8','#ff8ad8'],['astral_wyrm','Astral Wyrm','pond_glim',5,5,22,34000,'eel','#2a1a5a','#ffd8ff','night'],
 ['sun_mola','Sunfish Mola','sea',1,20,120,260,'tall','#a8a8b0','#e8e8e8','day'],['silverback_tuna','Silverback Tuna','sea',2,10,60,700,'fish','#4a6a9a','#e0e8f0'],['ghost_jelly','Ghost Jelly','sea',3,.5,3,2200,'squid','#e8f0ff','#a8d8ff','night'],['swordfin','Swordfin','sea',4,30,150,6000,'long','#3a5a8a','#d8e8f8',null,'sail'],['storm_eel','Storm Eel','sea',5,8,40,15000,'eel','#2a3a5a','#f0f080','rain'],
 ['wellspring_eel','Wellspring Eel','well',2,2,9,500,'eel','#3ad8e8','#e8fbff'],['tidewell_koi','Tidewell Koi','well',3,4,16,1000,'tall','#e8f4ff','#3a8ae8'],['whirlfin_carp','Whirlfin Carp','well',3,6,22,1100,'fish','#5ab8e8','#f0e8a8'],
 ['whirlwing_ray','Whirlwing Ray','well',4,30,140,1000,'ray','#2a5a9a','#a8f0ff'],['vortex_marlin','Vortex Marlin','well',5,60,240,1000,'long','#1a3a7a','#7ad8ff',null,'sail'],['well_keeper','The Well Keeper','well',6,200,700,1000,'tall','#0a1a3a','#7affff',null,'lure'],
 ['gloom_perch','Gloom Perch','hollow',0,.3,1.6,40,'fish','#3a4a5a','#a8c8d8'],['blind_cavefish','Blind Cavefish','hollow',0,.1,.8,36,'fish','#e8d8d8','#ffffff'],['lantern_jaw','Lanternjaw','hollow',1,1,5,100,'tall','#1a2a3a','#7affd0',null,'lure'],['drip_eel','Drip Eel','hollow',1,.6,3,100,'eel','#4a5a6a','#b8e8f8'],
 ['echo_loach','Echo Loach','hollow',2,1,4,100,'eel','#6a5a8a','#d8c8ff'],['stalactite_gar','Stalactite Gar','hollow',3,8,30,100,'long','#8a9aa8','#e8f0f8'],['abyss_angler','Abyss Angler','hollow',3,4,18,100,'tall','#14182a','#ffd86a','night','lure'],['pale_sturgeon','Pale Sturgeon','hollow',4,40,160,100,'long','#d8dce0','#ffffff'],
 ['hollow_leviathan','Hollow Leviathan','hollow',5,200,700,100,'shark','#1a2a3a','#5affd8'],['drowned_king','The Drowned King','hollow',6,400,1200,100,'tall','#0a1418','#7affb8',null,'whisk'],
 ['embereye','Embereye','abyss',0,.5,2,40,'fish','#3a0a14','#ff5a3a'],['soot_skate','Soot Skate','abyss',0,1,4,44,'ray','#1a1418','#8a6a7a'],['gloomfang','Gloomfang','abyss',1,2,8,100,'tall','#2a1030','#ff3a6a'],['hollowworm','Hollowworm','abyss',1,1,6,100,'eel','#4a1a2a','#ff8a5a'],
 ['void_lantern','Void Lantern','abyss',2,3,12,100,'tall','#0a0a1a','#b06aff',null,'lure'],['bone_gar','Bone Gar','abyss',2,6,24,100,'long','#d8d0c0','#8a3a3a'],['sunless_shark','Sunless Shark','abyss',3,80,320,100,'shark','#1a0a2a','#ff4ad8'],['starless_ray','Starless Ray','abyss',4,60,260,100,'ray','#05050a','#7a5aff'],
 ['old_leviathan','The Old Leviathan','abyss',5,600,1800,100,'shark','#14080e','#ff6a3a'],['sunless_one','The Sunless One','abyss',6,900,2400,100,'tall','#020204','#ff2ad8',null,'lure'],
 ['cinder_fry','Cinder Fry','pond_abyss',0,.05,.4,40,'fish','#ff6a2a','#ffd8a8'],['molten_koi','Molten Koi','pond_abyss',2,3,12,100,'tall','#ff3a1a','#ffd84a'],['abyss_pearl','Abyss Pearlfish','pond_abyss',4,10,40,100,'tall','#f0e8ff','#b06aff'],
 ['glowmote','Glowmote','pond_hollow',0,.05,.3,40,'fish','#7affd8','#ffffff'],['pearl_tetra','Pearl Tetra','pond_hollow',1,.1,.6,100,'fish','#f0f0f8','#d8e8ff'],['sapphire_eel','Sapphire Eel','pond_hollow',3,2,9,100,'eel','#2a4ad8','#a8c8ff'],['lantern_queen','Lantern Queen','pond_hollow',5,8,30,100,'tall','#1a1a3a','#ffe08a',null,'lure'],
].map(a=>({id:a[0],name:a[1],zone:a[2],r:a[3],minW:a[4],maxW:a[5],price:a[6],shape:a[7],c1:a[8],c2:a[9],cond:a[10]||null,feat:a[11]||null}));
/* fish value: every island has a base price for its commons, and each rarity is a fixed multiple of it, so each
   island pays more than the one before it and rarer always means richer. The authored prices above only set
   how species of the same rarity on the same island compare with each other. Ponds pay 15% more than their island. */
const ZONE_BASE={cove:9,moss:14,atoll:20,frost:28,petal:38,amber:66,ember:80,dune:110,glim:150,sea:14,well:80,hollow:45,abyss:240},RAR_LADDER=[1,3,18,60,160,400,1200];/* rare and above pay double */
{const nice=v=>{if(v<20)return Math.max(1,Math.round(v));const q=Math.pow(10,Math.floor(Math.log10(v))-1);return Math.round(v/q)*q;},grp={};
 SPECIES.forEach(s=>{const k=s.zone+'|'+s.r;(grp[k]=grp[k]||[]).push(s.price);});
 SPECIES.forEach(s=>{const pond=s.zone.startsWith('pond_'),base=(ZONE_BASE[pond?s.zone.slice(5):s.zone]||20)*(pond?1.15:1),g=grp[s.zone+'|'+s.r],mean=g.reduce((a,b)=>a+b,0)/g.length;
  s.price=nice(base*RAR_LADDER[s.r]*Math.pow(s.price/mean,.6));});}
const SPM={};SPECIES.forEach(s=>SPM[s.id]=s);SPM.drowned_king.lvl=30;
const COND={day:'Daytime',night:'Night only',rain:'While raining',fog:'In fog'};
const RODS=[
 {id:'drift',n:'Driftwood Rod',price:0,luck:0,reel:1,ctrl:0,res:0,shaft:'#8a6a48',handle:'#4a3626',reelC:'#7a7a7a',len:2.4,perk:{xp:.05,d:'+5% XP'}},
 {id:'pine',n:'Sturdy Pine Rod',price:1500,luck:10,reel:1.05,ctrl:.03,res:.08,shaft:'#b89a6a',handle:'#3f4a34',reelC:'#9a9a9a',len:2.5,perk:{shake:1.15,d:'Lure twitches tempt fish 15% more'}},
 {id:'bamboo',n:'Bamboo Flick',price:3500,luck:14,reel:1.1,ctrl:.05,res:.05,shaft:'#c2ac6e',handle:'#5a4630',reelC:'#8a8478',len:2.6,wrap:'#6a4a30',perk:{wait:.9,d:'Bites come 10% faster'}},
 {id:'coral',n:'Coral Whip',price:7500,luck:20,reel:1.15,ctrl:.06,res:.1,shaft:'#a8705e',handle:'#d8cebf',reelC:'#b8a08a',len:2.6,perk:{mut:.03,d:'+3% mutation chance'}},
 {id:'reed',n:'Swampreed Rod',price:14000,luck:30,reel:1.12,ctrl:.05,res:.25,shaft:'#5e7a48',handle:'#3a2a1a',reelC:'#9a9a5a',len:2.7,perk:{wait:.8,cond:'rain',d:'Bites come 20% faster in rain'}},
 {id:'moss',n:'Mossline Rod',price:20000,luck:38,reel:1.16,ctrl:.07,res:.2,shaft:'#4a5e40',handle:'#2e2a24',reelC:'#6a7a5a',len:2.75,wrap:'#8aa070',glow:'#9fd08a',req:{sp:'glowgut_loach'},perk:{luck:30,cond:'night',d:'+30% luck at night'}},
 {id:'glacier',n:'Glacier Rod',price:32000,luck:50,reel:1.25,ctrl:.1,res:.2,shaft:'#9ab8c8',handle:'#2e4256',reelC:'#d8dde0',len:2.8,metal:.5,glow:'#bfe6f5',perk:{wt:.15,d:'Fish weigh 15% more'}},
 {id:'storm',n:'Stormcaller',price:60000,luck:62,reel:1.3,ctrl:.1,res:.3,shaft:'#4a5560',handle:'#22262a',reelC:'#8a96a0',len:2.85,metal:.6,wrap:'#c0a050',glow:'#cfe0ff',req:{lvl:15},perk:{luck:40,drain:.75,cond:'rain',d:'+40% luck and a steadier reel in rain or storms'}},
 {id:'magma',n:'Magma Caster',price:95000,luck:75,reel:1.4,ctrl:.1,res:.35,shaft:'#2a1e1a',handle:'#7a3a22',reelC:'#a8742a',len:2.9,metal:.3,glow:'#ff6a1a',perk:{sell:1.1,d:'Fish sell for 10% more'}},
 {id:'twin',n:'Twin-Hook Rod',price:160000,luck:85,reel:1.42,ctrl:.12,res:.35,shaft:'#5a4a3a',handle:'#2a2420',reelC:'#b0a080',len:2.95,metal:.4,wrap:'#b0a080',req:{lvl:20},perk:{dbl:.12,d:'12% chance of a double catch'}},
 {id:'sage',n:"Sage's Rod",price:200000,luck:95,reel:1.45,ctrl:.14,res:.38,shaft:'#6a5a7a',handle:'#2a2234',reelC:'#c8b8d8',len:3,glow:'#c8b0ff',req:{sp:'witchlight_angler'},perk:{xp:.4,d:'+40% XP'}},
 {id:'star',n:'Starweaver Rod',price:280000,luck:115,reel:1.5,ctrl:.15,res:.4,shaft:'#2a2e4a',handle:'#8a7a4a',reelC:'#a8a0c8',len:3,metal:.5,glow:'#c8a8ff',perk:{luck:25,mut:.03,cond:'night',d:'+25% luck and +3% mutations at night'}},
 {id:'lantern',n:'Abyssal Lantern',price:450000,luck:140,reel:1.58,ctrl:.17,res:.45,shaft:'#1e2a30',handle:'#3a3020',reelC:'#6a8a8a',len:3.1,metal:.7,wrap:'#c8a050',glow:'#ffd27a',req:{sp:'crowned_abyssfish'},perk:{mut:.08,d:'+8% mutation chance'}},
 {id:'spine',n:'Leviathan Spine',price:700000,luck:180,reel:1.7,ctrl:.2,res:.5,shaft:'#d8d0be',handle:'#1a2e2e',reelC:'#4ab8a0',len:3.2,glow:'#4affd0',req:{lvl:28},perk:{wt:.2,dbl:.05,d:'+20% weight and 5% double catch'}},
 {id:'blossom',deco:'petals',n:'Blossom Bough',price:45000,luck:56,reel:1.28,ctrl:.11,res:.25,shaft:'#c8909c',handle:'#4a2a2a',reelC:'#e8d8d0',len:2.85,wrap:'#e8a8b8',glow:'#ffb8d8',perk:{hook:.35,d:'Strike window 0.35 s longer'}},
 {id:'dune',deco:'sun',n:'Sunscorch Rod',price:130000,luck:80,reel:1.4,ctrl:.1,res:.4,shaft:'#c8964a',handle:'#5a3a1a',reelC:'#d8b060',len:2.9,metal:.3,wrap:'#2a8a8a',perk:{tire:1.3,cond:'day',d:'Fish tire 30% faster in daylight'}},
 {id:'amethyst',deco:'crystal',n:'Amethyst Wand',price:340000,luck:120,reel:1.52,ctrl:.16,res:.42,shaft:'#5a3a7a',handle:'#22182e',reelC:'#c8a8e8',len:3.05,metal:.5,wrap:'#a878e8',glow:'#c88aff',req:{lvl:25},perk:{mut:.05,luck:20,cond:'fog',d:'+5% mutation chance, +20% luck in fog'}},
 {id:'wayfinder',deco:'compass',n:'Wayfinder Rod',price:0,luck:105,reel:1.5,ctrl:.18,res:.45,shaft:'#3a5a6a',handle:'#6a4a2a',reelC:'#d8c088',len:3,metal:.6,wrap:'#d8b060',glow:'#8af0ff',req:{quest:'cart6'},perk:{luck:25,cond:'deep',reel:1.1,d:'+25% luck in open water, reels 10% faster'}},
 {id:'moonpetal',deco:'moon',n:'Moonpetal Rod',price:0,luck:135,reel:1.58,ctrl:.19,res:.48,shaft:'#e8e4f4',handle:'#2a2a4a',reelC:'#c8c8e8',len:3.1,metal:.4,wrap:'#ff9ac8',glow:'#e8e8ff',req:{quest:'mirren5'},perk:{luck:35,hook:.3,cond:'night',d:'+35% luck and a longer strike window at night'}},
 {id:'celestial',deco:'stars',n:'Celestial Rod',price:1200000,luck:230,reel:1.85,ctrl:.24,res:.55,shaft:'#1e2240',handle:'#c8a050',reelC:'#f0e0a0',len:3.3,metal:.7,wrap:'#f0d070',glow:'#fff0a8',req:{lvl:35},perk:{luck:30,mut:.05,tire:1.25,d:'+30% luck, +5% mutations, fish tire 25% faster'}},
 /* rod remaster: one signature rod for every stage of the climb, sold once you hold that island's chart */
 {id:'tidepool',deco:'petals',n:'Tidepool Rod',price:2500,luck:12,reel:1.08,ctrl:.04,res:.06,shaft:'#6aa8a0',handle:'#3a4a44',reelC:'#c8d8d0',len:2.55,wrap:'#e8d8b0',req:{isl:'cove'},perk:{shake:1.25,wait:.92,d:'Lure twitches tempt fish 25% more, bites 8% faster'}},
 {id:'bogwood',deco:'crystal',n:'Bogwood Staff',price:10000,luck:26,reel:1.1,ctrl:.05,res:.18,shaft:'#4a5a34',handle:'#2a2418',reelC:'#8a9a5a',len:2.7,wrap:'#6a8a4a',glow:'#9fffb0',req:{isl:'moss'},perk:{luck:30,cond:'fog',d:'+30% luck in fog'}},
 {id:'reefcomber',deco:'sun',n:'Reefcomber',price:18000,luck:34,reel:1.15,ctrl:.07,res:.15,shaft:'#e8806a',handle:'#2a4a5a',reelC:'#f0d8c0',len:2.75,wrap:'#3ab8b0',req:{isl:'atoll'},perk:{mut:.03,hook:.2,d:'+3% mutation chance, strike window 0.2 s longer'}},
 {id:'frostbite',deco:'crystal',n:'Frostbite Spear',price:38000,luck:52,reel:1.24,ctrl:.1,res:.32,shaft:'#cfe8f4',handle:'#2a3a4a',reelC:'#e8f4ff',len:2.85,metal:.5,glow:'#bff0ff',req:{isl:'frost'},perk:{drain:.7,d:'Line 30% tougher'}},
 {id:'petalwind',deco:'petals',n:'Petalwind Rod',price:55000,luck:60,reel:1.3,ctrl:.12,res:.28,shaft:'#f0c8d4',handle:'#5a2a3a',reelC:'#fff0f4',len:2.9,wrap:'#e87a9a',glow:'#ffc8e0',req:{isl:'petal'},perk:{tire:1.25,d:'Fish tire 25% faster'}},
 {id:'harvestmoon',deco:'moon',n:'Harvest Moon Rod',price:85000,luck:72,reel:1.34,ctrl:.12,res:.32,shaft:'#c8782a',handle:'#3a2418',reelC:'#f0c060',len:2.95,wrap:'#8a3a1a',glow:'#ffd27a',req:{isl:'amber'},perk:{sell:1.08,xp:.15,d:'Fish sell 8% higher, +15% XP'}},
 {id:'cinderheart',deco:'sun',n:'Cinderheart',price:120000,luck:82,reel:1.42,ctrl:.12,res:.38,shaft:'#3a1a14',handle:'#7a2a1a',reelC:'#ff8a3a',len:3,metal:.4,glow:'#ff5a1a',req:{isl:'ember'},perk:{wt:.2,reel:1.08,d:'+20% fish weight, reels 8% faster'}},
 {id:'mirage',deco:'compass',n:'Mirage Caster',price:240000,luck:105,reel:1.5,ctrl:.15,res:.42,shaft:'#e8c890',handle:'#5a3a1a',reelC:'#2ab8b8',len:3.05,metal:.4,wrap:'#2a8a8a',glow:'#9affff',req:{isl:'dune'},perk:{luck:30,wait:.85,cond:'day',d:'+30% luck and bites 15% faster by day'}},
 {id:'prismheart',deco:'stars',n:'Prismheart',price:500000,luck:160,reel:1.62,ctrl:.18,res:.48,shaft:'#8a6ad8',handle:'#1e1630',reelC:'#e8d8ff',len:3.15,metal:.6,wrap:'#c8a8ff',glow:'#e8c8ff',req:{isl:'glim'},perk:{mut:.06,luck:20,d:'+6% mutation chance, +20% luck'}},
 {id:'drowncrown',deco:'crystal',n:'Drowned Crown',price:900000,luck:200,reel:1.75,ctrl:.22,res:.52,shaft:'#14303a',handle:'#c8a040',reelC:'#5affd8',len:3.25,metal:.7,wrap:'#c8a040',glow:'#5affd8',req:{sp:'abyss_angler'},perk:{luck:40,tire:1.2,d:'+40% luck, fish tire 20% faster'}},
];
const RODM={};RODS.forEach(r=>RODM[r.id]=r);
const BAITS=[
 {id:'worm',n:'Garden Worm',price:60,qty:10,luck:0,wait:.85,mut:0,wt:0,d:'Bites come 15% faster'},
 {id:'shrimp',n:'Salted Shrimp',price:200,qty:10,luck:15,wait:.75,mut:0,wt:0,d:'+15% luck, bites 25% faster'},
 {id:'glowfly',n:'Glowfly',price:450,qty:10,luck:35,wait:1,mut:0,wt:0,night:true,d:'+35% luck, doubled at night'},
 {id:'cricket',n:'Night Cricket',price:120,qty:10,luck:8,wait:.8,mut:0,wt:0,night:true,d:'+8% luck (doubled at night), bites 20% faster'},
 {id:'squid',n:'Squid Strips',price:600,qty:10,luck:15,wait:1,mut:0,wt:.12,d:'+15% luck, +12% fish weight'},
 {id:'spinner',n:'Silver Spinner',price:800,qty:10,luck:20,wait:.85,mut:0,wt:0,d:'+20% luck, bites 15% faster'},
 {id:'prism',n:'Prism Lure',price:1400,qty:10,luck:10,wait:1,mut:.06,wt:0,d:'+10% luck, +6% mutation chance'},
 {id:'popper',n:'Topwater Popper',price:2000,qty:8,luck:30,wait:.95,mut:0,wt:.15,d:'+30% luck, +15% fish weight'},
 {id:'feather',n:'Feather Fly',price:3200,qty:6,luck:60,wait:.8,mut:.03,wt:0,d:'+60% luck, +3% mutation chance, bites 20% faster'},
 {id:'goldflake',n:'Gold Flake Paste',price:2600,qty:6,luck:20,wait:1,mut:.05,wt:0,d:'+20% luck, +5% mutation chance (golden ones most of all)'},
 {id:'ink',n:'Kraken Ink',price:3500,qty:5,luck:90,wait:.9,mut:.02,wt:.2,d:'+90% luck, +20% weight'},
 {id:'abyssworm',n:'Abyss Worm',price:6000,qty:5,luck:120,wait:.85,mut:.03,wt:.1,d:'+120% luck, +3% mutations, +10% weight, bites 15% faster'},
];
/* fishing lines: coloured, swappable, each with a buff. Won from Mystery Crates (Basic Line is free) */
const LINES=[
 {id:'basic',n:'Basic Line',r:'basic',c:'#e8ecf0',fx:{d:'No bonus'}},
 {id:'hemp',n:'Hemp Line',r:'common',c:'#d8c8a0',fx:{drain:.92,d:'Line 8% tougher'}},
 {id:'mint',n:'Mint Line',r:'common',c:'#7ae8a8',fx:{wait:.94,d:'Bites 6% faster'}},
 {id:'sky',n:'Sky Line',r:'common',c:'#8ac8ff',fx:{luck:6,d:'+6% luck'}},
 {id:'coral',n:'Coral Line',r:'rare',c:'#ff8aa8',fx:{luck:12,hook:.1,d:'+12% luck, strike window 0.1 s longer'}},
 {id:'amber',n:'Amber Line',r:'rare',c:'#ffb040',fx:{wt:.08,reel:1.05,d:'+8% fish weight, reels 5% faster'}},
 {id:'frost',n:'Frost Line',r:'rare',c:'#a8f0ff',fx:{drain:.8,bar:1.1,d:'Line 20% tougher, tension builds 10% slower'}},
 {id:'golden',n:'Golden Line',r:'legendary',c:'#ffd84a',glow:1,fx:{sell:1.08,luck:15,d:'Fish sell 8% higher, +15% luck'}},
 {id:'ember',n:'Ember Line',r:'legendary',c:'#ff5a2a',glow:1,fx:{tire:1.25,reel:1.08,d:'Fish tire 25% faster, reels 8% faster'}},
 {id:'aurora',n:'Aurora Line',r:'legendary',c:'#5affd0',glow:1,shift:1,fx:{mut:.04,luck:20,d:'+4% mutation chance, +20% luck'}},
 {id:'void',n:'Void Line',r:'secret',c:'#b06aff',glow:1,fx:{luck:35,mut:.05,tire:1.2,d:'+35% luck, +5% mutations, fish tire 20% faster'}}];
const LINEM={};LINES.forEach(l=>LINEM[l.id]=l);
const LINE_RAR={basic:{n:'Starter',c:'#c9d2da'},common:{n:'Common',c:'#cfd6df',w:60},rare:{n:'Rare',c:'#4fa8ff',w:28},legendary:{n:'Legendary',c:'#ffae2b',w:10.5},secret:{n:'Secret',c:'#c890ff',w:1.5}};
/* lures: permanent tackle (never used up). The equipped lure sets what's on the end of your line */
const LURES=[
 {id:'brass',n:'Brass Spinner',style:'spinner',r:'common',fx:{wait:.92,d:'Bites 8% faster'}},
 {id:'pearlspoon',n:'Pearl Spoon',style:'spoon',r:'rare',fx:{luck:10,mut:.02,d:'+10% luck, +2% mutation chance'}},
 {id:'frogpop',n:'Frog Popper',style:'popper',r:'rare',fx:{wt:.1,luck:8,d:'+10% fish weight, +8% luck'}},
 {id:'fireflyfly',n:'Firefly Fly',style:'fly',r:'legendary',fx:{luck:20,night:1,d:'+20% luck (doubled at night)'}},
 {id:'krakenjig',n:'Kraken Jig',style:'jig',r:'legendary',fx:{luck:18,tire:1.15,d:'+18% luck, fish tire 15% faster'}},
 {id:'starquill',n:'Star Quill Float',style:'glow',r:'secret',fx:{luck:30,hook:.25,d:'+30% luck, strike window 0.25 s longer'}}];
const LUREM={};LURES.forEach(l=>LUREM[l.id]=l);
const CRATE_PRICE=25000;
/* what's new: shown once after each update, and any time from the menus */
const UPDATES=[
 {v:'3.4',d:'Rods on display',items:['Every island lays its rods out on stands by the arrival path: walk up to look, buy or equip','The Drowned Hollow and Sunless Deep remastered: brighter caves, glowworm ceilings, shafts of light, glowing moss and crystals that light the room','A separate dev profile for the game\'s owner that never reaches the leaderboards']},
 {v:'3.3',d:'Rods remastered',items:['A new signature rod for every island, sold once you hold its chart','10 coloured fishing lines with buffs, won from Mystery Crates (Common, Rare, Legendary, Secret)','6 permanent lures you can win and equip','4 new baits','Mystery Crates for finishing quests, levelling up and landing new Legendary fish','A real Tidewater Casino hall on Pebble Cove, plus a new casino game on every island','Music that changes with events, weather, Tide Wells, fights and the casino']},
 {v:'3.2',d:'Into the deep',items:['Tide Wells open off every island; dive in to find the Drowned Hollow','Floating chests, messages in bottles and fish schools','Boats have seats: ride along in a friend\'s boat','Sunset Pontoon (8 seats) and Wavecutter Jet Ski','Rare fish are three times harder to find and pay double','Dev bar for the game\'s owner, and clearing chat']},
 {v:'3.1',d:'Safe saves and a fair economy',items:['Backups before every update, save files and save codes','Prices rebalanced for a longer climb','Fish values rise with every island']},
 {v:'3.0',d:'The big remaster',items:['Classic reel-in fishing with a tension gauge','Petalshore, Duneveil and Glimmerholt','New floats and lures, 50 new fish, 6 new rods, 2 story quest lines']}];
const BAITM={};BAITS.forEach(b=>BAITM[b.id]=b);
const BOATS=[
 {id:'dinghy',seats:2,n:'Driftwood Dinghy',price:0,speed:18,turn:1.4,storage:0,fx:{luck:5,d:'+5% luck while fishing from the boat'},m:{L:5.6,W:1.22,H:.78,D:-.42,hull:'#d6d0c4',bottom:'#5a4036',type:'row'}},
 {id:'skiff',seats:2,n:'Reed Skiff',price:7500,speed:20,turn:1.65,storage:10,fx:{wait:.85,d:'Bites come 15% faster from the boat'},m:{L:6.6,W:1.05,H:.62,D:-.38,hull:'#7a6a54',bottom:'#4a3c30',stripe:'#5a4a3a',type:'skiff'}},
 {id:'sloop',seats:4,n:'Gull Sloop',price:32000,speed:21,turn:1.3,storage:20,fx:{luck:20,d:'+20% luck from the boat'},m:{L:7.6,W:1.5,H:.9,D:-.6,hull:'#dcd7cc',bottom:'#2e3e4c',stripe:'#3e5468',type:'sail'}},
 {id:'cruiser',seats:4,n:'Tidewatch Cruiser',price:70000,speed:24,turn:1.25,storage:30,fx:{drain:.65,bar:1.1,cond:'rain',d:'Reeling is 35% easier in rain and storms'},m:{L:8.6,W:1.8,H:1.05,D:-.7,hull:'#cfd1cd',bottom:'#4a2e2a',stripe:'#2e4052',type:'cabin'}},
 {id:'runner',seats:3,n:'Abyss Runner',price:180000,speed:28,turn:1.15,storage:40,fx:{luck:35,cond:'deep',d:'+35% luck for rare fish in open water'},m:{L:9.6,W:1.9,H:1.1,D:-.75,hull:'#2e3a44',bottom:'#1c242a',stripe:'#8a2e2a',type:'runner'}},
 {id:'outrigger',seats:2,n:'Reef Outrigger',price:18000,speed:23,turn:1.8,storage:12,fx:{luck:12,wait:.9,d:'+12% luck and bites 10% faster from the boat'},m:{L:6.8,W:.9,H:.6,D:-.36,hull:'#a8704a',bottom:'#5a3a26',stripe:'#e0b060',type:'outrigger'}},
 {id:'catamaran',seats:6,n:'Seabreeze Catamaran',price:120000,speed:25,turn:1.35,storage:35,fx:{bar:1.15,luck:15,d:'Line tension builds 15% slower and +15% luck from the boat'},m:{L:8.8,W:1.1,H:.85,D:-.55,hull:'#eae6dc',bottom:'#2e5a6a',stripe:'#3a8ab0',type:'catamaran'}},
 {id:'speedster',seats:2,n:'Gullwing Speedster',price:260000,speed:34,turn:1.5,storage:25,fx:{luck:25,wait:.85,d:'+25% luck and bites 15% faster from the boat'},m:{L:8.2,W:1.6,H:.9,D:-.55,hull:'#c8402e',bottom:'#1e2228',stripe:'#f2efe8',type:'speedster'}},
 {id:'pontoon',seats:8,n:'Sunset Pontoon',price:150000,speed:19,turn:1.1,storage:40,fx:{xp:.2,luck:10,d:'Party boat for 8: +20% XP and +10% luck from the deck'},m:{L:9,W:1.9,H:.95,D:-.5,hull:'#d8dcdc',bottom:'#5a6a74',stripe:'#e8a03a',type:'pontoon'}},
 {id:'jetski',seats:2,n:'Wavecutter Jet Ski',price:90000,speed:40,turn:2.3,storage:0,fx:{wait:.9,d:'The fastest thing on the water, with room for one friend. Bites 10% faster'},m:{L:3.6,W:.7,H:.55,D:-.3,hull:'#f2f2f0',bottom:'#1e2a34',stripe:'#e84a3a',type:'jetski'}},
 {id:'trawler',seats:6,n:'Ironkeel Trawler',price:400000,speed:22,turn:.95,storage:70,fx:{mut:.08,wt:.15,d:'+8% mutation chance and +15% weight from the boat'},m:{L:11.5,W:2.3,H:1.4,D:-.95,hull:'#5e3a30',bottom:'#2a2422',stripe:'#d6d0c4',type:'trawler'}},
];
const BOATM={};BOATS.forEach(b=>BOATM[b.id]=b);
const BUFFS=[
 {id:'tonic',n:'Luck Tonic',price:800,dur:240,ico:'L',c:'#6f8f5e',fx:{luck:35,d:'+35% luck'}},
 {id:'steady',n:'Steady Hands',price:900,dur:240,ico:'S',c:'#5f7f9a',fx:{bar:1.2,drain:.75,d:'Line tension builds 20% slower and the line is 25% tougher'}},
 {id:'charm',n:'Mutation Charm',price:1500,dur:180,ico:'M',c:'#86708f',fx:{mut:.06,d:'+6% mutation chance'}},
 {id:'brew',n:'XP Brew',price:1000,dur:300,ico:'X',c:'#9a8350',fx:{xp:.5,d:'+50% XP'}},
 {id:'scent',n:'Lure Scent',price:700,dur:240,ico:'B',c:'#946650',fx:{wait:.7,d:'Bites come 30% faster'}},
];
const BUFFM={};BUFFS.forEach(b=>BUFFM[b.id]=b);
const ENCH={
 swift:{n:'Swift',d:'Reel speed +20%',c:'#bfeeff'}, lucky:{n:'Lucky',d:'Luck +40%',c:'#c8f7c0'}, steady:{n:'Steady',d:'Line tension builds 25% slower',c:'#fff0b0'},
 sturdy:{n:'Sturdy',d:'Line is 30% tougher before it snaps',c:'#f6d8bc'}, hefty:{n:'Hefty',d:'Fish weigh 25% more',c:'#ffd2bd'},
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
  lines:['A better rod means luckier bites, a faster reel and a tougher line.','Bait gets used up one cast at a time. Stock up!','Glowflies really shine after sundown.']},
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
 {id:'nalu',name:'Nalu',title:'Reef Merchant',role:'merchant',zone:'atoll',dth:1.1,look:{skin:'#a8704a',shirt:'#3aa8a0',pants:'#e8dcc0',hat:'#e8d8a0',hatType:'sunhat'},house:{wall:'#c8a878',roof:'#b09a6a',trim:'#e8dcc0'},stilt:true,lines:['The reef feeds us all. Sell me what it gives you.','Coral fish fetch a pretty price on the mainland.']},
 {id:'kai',name:'Kai',title:'Harbormaster',role:'harbor',zone:'atoll',look:{skin:'#8a5a3a',shirt:'#e8e0d0',pants:'#3a4a5a',hat:'#3a6a8a',hatType:'cap'},lines:['Charts? Every isle on the sea, right here.','Watch the reef when you dock. It bites hulls.']},
 {id:'moana',name:'Moana',title:'Boatwright',role:'shipwright',zone:'atoll',look:{skin:'#b8805a',shirt:'#e8703a',pants:'#3a3a3a',hat:'#2a2a2a',hatType:'none'},lines:['Outriggers, catamarans, speedsters. I build what the sea asks for.','A light hull flies over the swell.']},
 {id:'coralie',name:'Coralie',title:'Pearl Appraiser',role:'appraiser',zone:'atoll',dth:-1.2,look:{skin:'#e8c0a0',shirt:'#e8a0c0',pants:'#5a4a6a',hat:'#f0e0c0',hatType:'sunhat'},house:{wall:'#e8d0c0',roof:'#c87a6a',trim:'#f4ece0'},stilt:true,lines:['Every fish is a pearl if you look closely.','Let me weigh that one again. The light here plays tricks.']},
 {id:'rowan',name:'Rowan',title:'Glen Merchant',role:'merchant',zone:'amber',dth:1.0,look:{skin:'#e0b090',shirt:'#8a4a2a',pants:'#3a3428',hat:'#5a4a2a',hatType:'top'},house:{wall:'#cdb898',roof:'#8a3a2a',trim:'#e8dcc8'},lines:['Fair coin for fair fish, as the glen folk say.','The leaves turn and the fish run fat.']},
 {id:'tamsin',name:'Tamsin',title:'Harbormaster',role:'harbor',zone:'amber',look:{skin:'#d8a080',shirt:'#5a6a3a',pants:'#3a3a2a',hat:'#a8603a',hatType:'beanie'},lines:['Mind the cliffs when you sail in.','Charts for all the isles, freshly inked.']},
 {id:'bramwell',name:'Bramwell',title:'Rodmaker',role:'rods',zone:'amber',dth:-1.1,look:{skin:'#c89070',shirt:'#6a5a3a',pants:'#2a2a28',hat:'#3a2a1a',hatType:'bucket'},house:{wall:'#b8a888',roof:'#5a4a3a',trim:'#e0d4bc'},lines:['Every rod I carve has a little of the glen in it.','Bait\'s in the barrel by the door.']},
 {id:'hazel',name:'Hazel',title:'Herbalist',role:'buffs',zone:'amber',dth:2.4,look:{skin:'#e8c8a8',shirt:'#5a7a4a',pants:'#4a3a2a',hat:'#7a8a4a',hatType:'sunhat'},house:{wall:'#d0c4a8',roof:'#6a7a4a',trim:'#ece4d0'},lines:['Mushrooms, moss and a pinch of luck.','A warm brew for a cold dawn.']},
 {id:'wren',name:'Wren',title:'Blossom Merchant',role:'merchant',zone:'petal',dth:1.1,look:{skin:'#f0c8a8',shirt:'#e88aa8',pants:'#4a3a4a',hat:'#f8e8d0',hatType:'sunhat'},house:{wall:'#e8dcd0',roof:'#b8505a',trim:'#f4ece4'},lines:['Fish from Petalshore smell faintly of blossom. I swear it.','The koi in the Mirror Pool are older than the trees.']},
 {id:'juniper',name:'Juniper',title:'Harbormaster',role:'harbor',zone:'petal',look:{skin:'#e0b090',shirt:'#5a8a6a',pants:'#3a3a3a',hat:'#d8c8a0',hatType:'bucket'},lines:['Petals on the water mean the tide is turning.','Charts for every isle. Even the strange ones.']},
 {id:'ilo',name:'Master Ilo',title:'Rodcrafter',role:'rods',zone:'petal',dth:-1.1,look:{skin:'#c89070',shirt:'#3a4a5a',pants:'#2a2a2a',hat:'#6a4a3a',hatType:'none'},house:{wall:'#d8ccb8',roof:'#3a4a5a',trim:'#ece4d8'},lines:['A rod should bend like a branch in spring. Never break.','Every rod in the isles passes through my hands sooner or later.']},
 {id:'mirren',name:'Old Mirren',title:'Tide Storyteller',role:'sage',zone:'petal',dth:2.5,look:{skin:'#e8d0c0',shirt:'#8a7aa8',pants:'#3a3048',hat:'#e8e0f0',hatType:'sunhat'},house:{wall:'#e4dcd4',roof:'#6a5a8a',trim:'#f0ece8'},lines:['When I was young, the moon swam in the sea. Some say it still does.','Sit a while. The tide tells its stories slowly.']},
 {id:'sefa',name:'Sefa',title:'Oasis Trader',role:'merchant',zone:'dune',dth:1.1,look:{skin:'#a8704a',shirt:'#e8c060',pants:'#5a3a2a',hat:'#f0e8d8',hatType:'sunhat'},house:{wall:'#e0c49a',roof:'#c8703a',trim:'#f0e0c0'},lines:['Water is worth more than gold out here. Fish come close.','The heat makes the fish lazy. Mostly.']},
 {id:'doran',name:'Doran',title:'Harbormaster',role:'harbor',zone:'dune',look:{skin:'#8a5a3a',shirt:'#3a6a8a',pants:'#3a3028',hat:'#e8d8b8',hatType:'cap'},lines:['Mind the sandbars when you sail in.','The wind out here carries sand to every isle.']},
 {id:'amaru',name:'Amaru',title:'Gem Appraiser',role:'appraiser',zone:'dune',dth:-1.1,look:{skin:'#b8805a',shirt:'#2a8a7a',pants:'#3a2a2a',hat:'#c8a040',hatType:'top'},house:{wall:'#d8b888',roof:'#2a7a7a',trim:'#eedcbc'},lines:['A fish is a gem that swims. Let me weigh it.']},
 {id:'tobi',name:'Tobi',title:'Sand Shipwright',role:'shipwright',zone:'dune',look:{skin:'#c88a5a',shirt:'#8a5a3a',pants:'#3a3a3a',hat:'#d8603a',hatType:'beanie'},lines:['Hulls take a beating from the sand. I patch them all.']},
 {id:'lumen',name:'Lumen',title:'Crystal Merchant',role:'merchant',zone:'glim',dth:1.1,look:{skin:'#e8d0e0',shirt:'#5a6ad8',pants:'#2a2a4a',hat:'#c8b8f8',hatType:'beanie'},house:{wall:'#cfcadc',roof:'#4a4a8a',trim:'#e8e4f0'},lines:['Crystal fish catch the light. Collectors pay a fortune.','At night the whole hill hums.']},
 {id:'corvin',name:'Corvin',title:'Harbormaster',role:'harbor',zone:'glim',look:{skin:'#d8b090',shirt:'#3a3a5a',pants:'#2a2a2a',hat:'#2a2a3a',hatType:'top'},lines:['Few sail this far. Fewer sail back without a story.']},
 {id:'aster',name:'Aster',title:'Starsmith',role:'rods',zone:'glim',dth:-1.1,look:{skin:'#f0d8c8',shirt:'#8a6ab8',pants:'#2a2238',hat:'#f0e0a0',hatType:'cap'},house:{wall:'#d4cee0',roof:'#6a5a9a',trim:'#ece8f4'},lines:['I set crystals into rods. They hum when a big one is near.']},
 {id:'vesper',name:'Vesper',title:'Moon Apothecary',role:'buffs',zone:'glim',dth:2.4,look:{skin:'#e0c0d0',shirt:'#3a5a6a',pants:'#2a2a3a',hat:'#5a7a8a',hatType:'sunhat'},house:{wall:'#c8d0d8',roof:'#3a5a6a',trim:'#e4e8ec'},lines:['Starlight steeps slowly. My brews are worth the wait.']},
 {id:'lou',name:'Lucky Lou',title:'Lucky Lures Slots',role:'casino',game:'slots',hall:true,hallSlot:0,zone:'cove',dth:2.1,look:{skin:'#e0b090',shirt:'#c8303a',pants:'#1e1e24',hat:'#1e1e24',hatType:'top'},lines:['Welcome to the Tidewater Casino! The house keeps a little edge, so bet what you can lose.','Three crowns on the reels? I\'ve seen it twice in forty years.']},
 {id:'vera',name:'Vera',title:'Wheel of Tides',role:'casino',game:'wheel',hall:true,hallSlot:1,zone:'cove',dth:2.1,look:{skin:'#f0c8a8',shirt:'#3a2a5a',pants:'#1e1e24',hat:'#c8a040',hatType:'none'},lines:['Round and round she goes. Where she stops, nobody knows!','The five-times slice is my favourite. It never lands for me.']},
 {id:'dex',name:'Dex',title:'High or Low',role:'casino',game:'hilo',hall:true,hallSlot:2,zone:'cove',dth:2.1,look:{skin:'#8a5a3a',shirt:'#1e3a2a',pants:'#1e1e24',hat:'#1e1e24',hatType:'cap'},lines:['Higher or lower, it\'s that simple. Knowing when to stop is the hard part.']},
 {id:'bogsby',name:'Bogsby',title:'Bog Coin',role:'casino',game:'coin',zone:'moss',dth:-1.7,look:{skin:'#a8c890',shirt:'#5a3a6a',pants:'#3a3a2a',hat:'#4a6a3a',hatType:'bucket'},lines:['Heads or tails? The bog decides.']},
 {id:'shelly',name:'Shelly',title:'Pearl and Shells',role:'casino',game:'shells',zone:'atoll',dth:2.4,look:{skin:'#c88a5a',shirt:'#f0c060',pants:'#3a5a6a',hat:'#e8d8a0',hatType:'sunhat'},lines:['Keep your eye on the pearl! Quick hands, quicker eyes.']},
 {id:'ivar',name:'Ivar',title:'Ice Dice',role:'casino',game:'dice',zone:'frost',dth:2.4,look:{skin:'#f0d0c0',shirt:'#3a6a9a',pants:'#2a2a3a',hat:'#e8e8f0',hatType:'beanie'},lines:['Two dice, cold as the glacier. Under, over, or a lucky seven?']},
 {id:'posy',name:'Posy',title:'Lucky Lanterns',role:'casino',game:'lanterns',zone:'petal',dth:-2.4,look:{skin:'#f0c8a8',shirt:'#e86a5a',pants:'#3a2a3a',hat:'#f0d070',hatType:'sunhat'},lines:['Five lanterns, five fortunes. Which one is yours?']},
 {id:'thatch',name:'Thatch',title:'Harvest 21',role:'casino',game:'blackjack',zone:'amber',dth:-2.4,look:{skin:'#d8a080',shirt:'#6a3a2a',pants:'#2a2a28',hat:'#3a2a1a',hatType:'top'},lines:['Twenty-one, or as close as you dare. I stand on seventeen.']},
 {id:'ash',name:'Ash',title:'Lava Rise',role:'casino',game:'crash',zone:'ember',dth:2.3,look:{skin:'#b07850',shirt:'#2a2a2a',pants:'#5a2a1a',hat:'#ff6a2a',hatType:'cap'},lines:['Watch it climb... and cash out before the volcano blows!']},
 {id:'zuri',name:'Zuri',title:'Sun Roulette',role:'casino',game:'roulette',zone:'dune',dth:2.4,look:{skin:'#8a5a3a',shirt:'#e8c040',pants:'#3a2a2a',hat:'#c8402e',hatType:'none'},lines:['Red, black, or a single number for the brave. Place your bets!']},
 {id:'opal',name:'Opal',title:'Crystal Mines',role:'casino',game:'mines',zone:'glim',dth:-2.4,look:{skin:'#e8d0e0',shirt:'#6a4ab8',pants:'#2a2238',hat:'#c8b8f8',hatType:'beanie'},lines:['Every crystal you uncover grows your winnings. Hit a crack and it\'s gone.']},
 {id:'isolde',name:'Isolde',title:'Cartographer',role:'sage',zone:'cove',dth:-2.1,look:{skin:'#e8c0a0',shirt:'#3a6a8a',pants:'#5a4a3a',hat:'#8a5a3a',hatType:'top'},house:{wall:'#d8d0c0',roof:'#3a5a7a',trim:'#ece6dc'},lines:['Three new isles on my charts and not a soul has mapped them properly.','A map is just a promise that the world goes on.']},
];
const SHIRTS=['#a8604e','#b88452','#b89c58','#6c8558','#4f7f7a','#4f6a8c','#6a6188','#8e5e78','#d6d0c2','#3e4a5c'];
const SKINS=['#f6d3b3','#eab894','#d39b72','#a8714d','#7a4e33'];
const HATS=[{id:'bucket',n:'Bucket hat'},{id:'cap',n:'Cap'},{id:'beanie',n:'Beanie'},{id:'sunhat',n:'Sun hat'},{id:'top',n:'Top hat'},{id:'none',n:'No hat'}];
const EMOTES={wave:{n:'Wave',d:2.6},dance:{n:'Dance',d:6},cheer:{n:'Cheer',d:3},show:{n:'Show off',d:4.5}};

/* developer tools state (the dev bar unlocks only for the server owner, or on localhost) */
const DEV={on:false,open:false,fast:false,rar:null,ev:null};

/* ================= STATE / SAVE ================= */
/* The save key never changes between updates: new versions read the same save and fill in anything new.
   Before an update touches a save (and once a day) a backup copy is kept, see backupSave. */
const KEY='driftwood-isles-save-v1',BKEY='driftwood-isles-backups',GAME_VER='3.4';
/* profiles: your normal profile (cloud save, leaderboards, no tools) and the owner's dev profile (its own save on this
   device, the dev tools, never on leaderboards and never synced to the cloud). The dev profile needs the dev key. */
const KEY_DEV='driftwood-isles-save-dev',DEV_HASH='94d329459b6a2bde18d3336b2dbc6098cda74ec216abcc65d537c420d502e29b';
const devUnlocked=()=>{try{return localStorage.getItem('driftwood-dev')===DEV_HASH||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);}catch(e){return false;}};
const PROFILE=(()=>{try{return localStorage.getItem('driftwood-profile')==='dev'&&devUnlocked()?'dev':'normal';}catch(e){return 'normal';}})();
const activeKey=()=>PROFILE==='dev'?KEY_DEV:KEY;
/* how far along a save is: lifetime earnings never go down, so they decide which of two saves to keep */
function progressOf(s){return s&&typeof s==='object'?(Number(s.earned)||0)+(Number(s.level)||1)*500+Object.keys(s.dex||{}).length*200:0;}
function backups(){try{const b=JSON.parse(localStorage.getItem(BKEY));return Array.isArray(b)?b.filter(x=>x&&typeof x.json==='string'):[];}catch(e){return [];}}
function backupSave(why,raw){try{raw=raw||localStorage.getItem(KEY);if(!raw)return false;const s=JSON.parse(raw);if(!s||typeof s!=='object'||progressOf(s)<=progressOf(freshState()))return false;
 const list=backups();if(list.some(b=>b.at===(s.savedAt||0)&&b.e===(s.earned||0)))return false;
 list.unshift({t:Date.now(),why,ver:s.gv||'2',lv:s.level||1,c:s.coins||0,e:s.earned||0,at:s.savedAt||0,json:raw});while(list.length>8)list.pop();
 for(;;){try{localStorage.setItem(BKEY,JSON.stringify(list));return true;}catch(e){if(list.length<=1)return false;list.pop();}}}catch(e){return false;}}
function dailyBackup(){const b=backups()[0];if(!b||Date.now()-b.t>20*3600e3)backupSave('Daily backup');}
function defSettings(){return{gfx:isMobile?'medium':'high',gfxAuto:true,music:.55,sfx:.8,amb:.7,chill:false,tags:true,weather:'auto',v2:true,v3:true};}
function freshState(){return{v:2,coins:0,earned:0,xp:0,level:1,inv:[],rods:['drift'],rod:'drift',bait:{},baitOn:null,ench:{},relics:0,unlocked:['cove'],dex:{},last:'cove',settings:defSettings(),uid:1,savedAt:0,tips:{},profile:null,boats:['dinghy'],boat:'dinghy',bup:{},buffs:{},lines:['basic'],line:'basic',lures:[],lure:null,crates:1};}
function sanitize(s){const f=freshState();if(!s||typeof s!=='object')return f;const o=Object.assign(f,s);
 const old=s.settings||{};o.settings=Object.assign(defSettings(),old);
 if(!old.v2){o.settings.v2=true;o.settings.gfxAuto=true;o.settings.gfx=isMobile?'medium':'high';if(old.sound===false){o.settings.music=0;o.settings.sfx=0;o.settings.amb=0;}}
 if(!old.v3){o.settings.v3=true;o.settings.gfxAuto=true;o.settings.gfx=isMobile?'medium':'high';}
 delete o.settings.sound;if(!['ultra','high','medium','low'].includes(o.settings.gfx))o.settings.gfx='medium';if(!['auto','clear','rain','storm','fog'].includes(o.settings.weather))o.settings.weather='auto';
 for(const k of['music','sfx','amb'])o.settings[k]=clamp(Number(o.settings[k])||0,0,1);
 /* fish of a species this version doesn't know are parked, not deleted, and come back if the species does */
 if(!Array.isArray(o.inv))o.inv=[];if(!Array.isArray(o.invHold))o.invHold=[];{const all=o.inv.concat(o.invHold).filter(x=>x&&typeof x==='object');o.inv=all.filter(x=>SPM[x.sp]);o.invHold=all.filter(x=>!SPM[x.sp]).slice(0,500);}o.gv=GAME_VER;if(!Array.isArray(o.rods)||!o.rods.length)o.rods=['drift'];if(!RODM[o.rod])o.rod='drift';
 if(!Array.isArray(o.unlocked))o.unlocked=['cove'];if(!o.unlocked.includes('cove'))o.unlocked.push('cove');if(!ZONES[o.last]||o.last==='sea')o.last='cove';
 if(o.baitOn&&!BAITM[o.baitOn])o.baitOn=null;if(!Array.isArray(o.lines))o.lines=['basic'];if(!o.lines.includes('basic'))o.lines.unshift('basic');if(!LINEM[o.line]||!o.lines.includes(o.line))o.line='basic';if(!Array.isArray(o.lures))o.lures=[];if(o.lure&&(!LUREM[o.lure]||!o.lures.includes(o.lure)))o.lure=null;o.crates=Math.max(0,Math.floor(Number(o.crates)||0));if(!Array.isArray(o.boats)||!o.boats.length)o.boats=['dinghy'];if(!BOATM[o.boat])o.boat='dinghy';if(!o.bup||typeof o.bup!=='object')o.bup={};if(!o.buffs||typeof o.buffs!=='object')o.buffs={};for(const k in o.buffs)if(!BUFFM[k]||!(o.buffs[k]>0))delete o.buffs[k];if(typeof o.earned!=='number')o.earned=o.coins||0;
 if(o.profile){const p=o.profile;o.profile={name:cleanText(p.name,16)||'Angler',color:isHex(p.color)?p.color:SHIRTS[5],hatC:isHex(p.hatC)?p.hatC:SHIRTS[2],skin:isHex(p.skin)?p.skin:SKINS[1],hat:HATS.some(h=>h.id===p.hat)?p.hat:'bucket'};}
 return o;}
let state=freshState();
function loadLocal(){let r=null;try{r=localStorage.getItem(activeKey());if(!r&&PROFILE==='dev'){r=localStorage.getItem(KEY);if(r)localStorage.setItem(KEY_DEV,r);}}catch(e){}if(!r)return null;
 try{const s=JSON.parse(r);if(PROFILE!=='dev'){if((s.gv||'2')!==GAME_VER)backupSave('Before the '+GAME_VER+' update',r);else dailyBackup();}return sanitize(s);}
 catch(e){/* a damaged save: keep it aside and fall back to the newest backup */try{localStorage.setItem(KEY+'-damaged',r);}catch(_){}const b=backups()[0];if(b){try{return sanitize(JSON.parse(b.json));}catch(_){}}}return null;}
let cloudRef=null,lastCloud=0,cloudPending=false;
let lastBk=Date.now();
function save(){state.savedAt=Date.now();try{localStorage.setItem(activeKey(),JSON.stringify(state));}catch(e){}if(PROFILE!=='dev'&&Date.now()-lastBk>3600e3){lastBk=Date.now();dailyBackup();}cloudPending=true;cloudTick(false);}
function cloudTick(force){if(PROFILE==='dev')return;if(!cloudRef||!cloudPending)return;const now=Date.now();if(!force&&now-lastCloud<20000)return;lastCloud=now;cloudPending=false;
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
 /* fishing sounds */
 charge(){this.o(220,.5,{type:'triangle',vol:.025,slide:180,att:.2});},
 cast(pw=.5){this.n(.32+pw*.2,.2+pw*.12,500,3200,{q:.8});this.n(.5,.05,3000,7000,{type:'highpass',delay:.05});
  /* line peeling off the spool: fast clicks that slow down as the lure flies */
  for(let i=0;i<16;i++)this.n(.012,.045*(1-i/18),4600,4300,{q:6,delay:.06+i*i*.0042*(1+pw*.6)});},
 reelIn(){for(let i=0;i<10;i++)this.n(.012,.05,3600,3400,{q:6,delay:i*.03});},
 twitch(){this.o(560,.06,{vol:.05,slide:260});this.n(.14,.09,1800,500,{type:'lowpass'});this.o(300,.08,{vol:.04,slide:-140,delay:.04});},
 nibble(){this.o(380,.06,{vol:.055,slide:-170});this.n(.08,.05,1500,600,{type:'lowpass'});},
 splash(sz=1,pan=0){this.n(.55,.3*sz,2400,260,{type:'lowpass',pan});this.n(.25,.12*sz,5000,2200,{q:.7,pan});this.o(320,.14,{vol:.2*sz,slide:-230,pan});for(let i=0;i<5;i++)this.o(rand(1100,2800),.06,{vol:.035*sz,delay:rand(.05,.4),pan,slide:rand(-400,200)});},
 plop(pan=0){this.o(460,.1,{vol:.08,slide:-280,pan});this.o(900,.05,{vol:.03,slide:-500,pan,delay:.02});},
 shake(){this.twitch();},
 bite(){this.n(.4,.28,1800,240,{type:'lowpass'});this.o(240,.2,{vol:.22,slide:-150});this.o(1568,.18,{type:'triangle',vol:.09,delay:.04});this.o(2093,.25,{type:'triangle',vol:.08,delay:.11});},
 hookSet(perfect){this.n(.16,.28,700,4200,{q:.9});this.o(130,.22,{type:'triangle',vol:.3,slide:-55});this.n(.3,.2,1400,200,{type:'lowpass',delay:.03});
  if(perfect){this.bell(1318.5,.5,.1,.06);this.bell(1975.5,.8,.09,.13);}},
 reelTick(t=0){this.n(.016,.05+t*.05,3900-t*900,3700-t*900,{q:5});this.o(1500+t*500+rand(-80,80),.012,{type:'square',vol:.01});},
 dragTick(v=.6){this.n(.014,.06*v,2700,2500,{q:9});this.o(rand(800,1100),.009,{type:'square',vol:.016*v});},
 creak(t){this.o(rand(130,170)*(1+t*.3),.18,{type:'sawtooth',vol:.018,slide:rand(-30,30),att:.04});this.n(.15,.03,900,700,{q:6});},
 run(){this.n(.35,.12,900,300,{type:'lowpass'});},
 leap(){this.n(.4,.22,3200,600,{type:'lowpass'});this.n(.5,.08,6000,3000,{type:'highpass',delay:.05});},
 snap(){this.o(2600,.3,{type:'triangle',vol:.14,slide:-2100});this.n(.1,.32,6000,2500,{q:1.2});this.o(98,.6,{type:'sawtooth',vol:.05,slide:-40,delay:.03});this.o(392,.4,{type:'triangle',vol:.07,delay:.25});this.o(311,.6,{type:'triangle',vol:.07,delay:.45});},
 flop(){for(let i=0;i<3;i++)this.n(.07,.12,1000,300,{type:'lowpass',delay:i*.16+rand(0,.05)});},
 tick(){this.reelTick(0);},
 /* catch jingle grows with rarity: more notes, a shimmer for rare fish, a warm chord and low swell for the rarest */
 catch(r=0){const sc=[523.25,659.25,783.99,1046.5,1318.5,1568,2093,2637];const n=3+Math.min(r,5);for(let i=0;i<n;i++)this.bell(sc[i],1+i*.08,.12,i*.07);this.splash(.7);
  if(r>=2){for(let i=0;i<4+r;i++)this.bell(rand(1800,3400),.6,.035,.35+i*.07);}
  if(r>=3){[392,493.88,587.33,783.99].forEach(f=>this.o(f,2.4,{type:'triangle',vol:.045,att:.25,delay:.35}));this.n(1.6,.07,6000,2000,{type:'highpass',delay:.4});}
  if(r>=5){this.o(65.4,2.2,{vol:.22,att:.3,delay:.3});this.o(98,2,{vol:.1,att:.3,delay:.32});}},
 escape(){this.o(523,.35,{type:'triangle',vol:.08});this.o(392,.55,{type:'triangle',vol:.08,delay:.18});this.splash(.4);},
 coin(){this.bell(1568,.35,.09);this.bell(2093,.5,.08,.07);this.n(.04,.06,7000,6000,{q:4});this.o(3136,.12,{type:'triangle',vol:.025,delay:.1});},
 sell(n){const k=Math.min(n,10);for(let i=0;i<k;i++){const d=i*.06;this.n(.035,.05,6500+rand(-600,600),6000,{q:4,delay:d});this.bell(1568*(1+i*.04),.3,.05,d);}this.bell(2093,.7,.09,k*.06+.05);this.bell(2637,.9,.07,k*.06+.13);},
 level(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.bell(f,1.1,.1,i*.11));this.n(1.2,.05,5000,1500,{type:'highpass',delay:.3});},
 ui(){this.o(820,.045,{vol:.045,type:'triangle'});this.n(.02,.03,4000,3500,{q:3});},
 open(){this.n(.12,.05,600,2400,{q:.8});this.o(520,.08,{vol:.045,type:'triangle'});this.o(780,.12,{vol:.035,type:'triangle',delay:.05});},
 close(){this.n(.1,.04,2400,600,{q:.8});this.o(700,.08,{vol:.035,type:'triangle'});this.o(470,.1,{vol:.03,type:'triangle',delay:.05});},
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
  if(p.zone==='hollow'||p.zone==='abyss'){this.dripT=(this.dripT||0)-dt;if(this.dripT<=0){this.dripT=rand(.3,1.4);const f=rand(900,2400);this.o(f,.12,{vol:.025,bus:'amb',pan:rand(-.9,.9),slide:-f*.4});this.o(f*.5,.5,{vol:.008,bus:'amb',delay:.18,slide:-f*.2});}}
  if(p.zone==='glim'){this.chimeT=(this.chimeT||3)-dt;if(this.chimeT<=0){this.chimeT=rand(3,8)*(p.day>.5?1.8:1);this.chime();}}
  this.swellT-=dt;if(this.swellT<=0){const s=rand(3.5,7.5);this.swellT=s;const peak=(p.boat?.42:.3)*(p.shore+.35);A.waves.g.gain.cancelScheduledValues(t);A.waves.g.gain.setTargetAtTime(peak,t,s*.22);A.waves.g.gain.setTargetAtTime(peak*.35,t+s*.45,s*.3);
   A.wash.g.gain.cancelScheduledValues(t);A.wash.g.gain.setTargetAtTime(.05*p.shore,t+s*.3,.6);A.wash.g.gain.setTargetAtTime(.008,t+s*.55,.8);}
  this.windT-=dt;if(this.windT<=0){this.windT=rand(2,4.5);A.wind.f.frequency.setTargetAtTime(rand(380,900),t,1.5);}
  const windLvl=.03+(p.boat?.05:0)+p.cloud*.04+p.fog*.03+(p.zone==='frost'?.05:p.zone==='dune'?.045:0)-(p.zone==='hollow'?.03:0);A.wind.g.gain.setTargetAtTime(windLvl,t,1.2);
  A.rain.g.gain.setTargetAtTime(p.rain*.22,t,.8);A.lava.g.gain.setTargetAtTime(p.zone==='ember'?.25:0,t,1.5);
  A.engine.g.gain.setTargetAtTime(p.boat?.02+Math.min(Math.abs(p.speed)/19,1)*.06:0,t,.3);A.engine.o.frequency.setTargetAtTime(42+Math.abs(p.speed)*2.2,t,.3);
  const crick=(1-p.day)*(1-p.rain)*(p.zone!=='sea'&&p.zone!=='frost'?.035:.008);A.crickets.gain.setTargetAtTime(crick*(Math.sin(t*.7)>-.3?1:.15),t,.4);
  if(p.rain>.3){this.dripT-=dt;if(this.dripT<=0){this.dripT=rand(.05,.25)/p.rain;this.o(rand(1800,3800),.04,{vol:.012*p.rain,bus:'amb',pan:rand(-.8,.8),slide:-600});}}
  if(p.day>.4&&p.rain<.3){this.gullT-=dt;if(this.gullT<=0){this.gullT=rand(8,18);this.gull(rand(-.7,.7),p.zone==='sea'?.05:.035);}
   if(p.zone==='cove'||p.zone==='moss'||p.zone==='petal'||p.zone==='amber'){this.birdT-=dt;if(this.birdT<=0){this.birdT=rand(2.5,7);this.chirp(rand(-.8,.8));}}}
  if(p.day<.3){this.owlT-=dt;if(this.owlT<=0){this.owlT=rand(22,40);if(p.zone!=='sea'&&p.zone!=='ember'){this.o(392,.35,{vol:.03,bus:'amb',att:.06,pan:-.4,slide:-20});this.o(370,.6,{vol:.03,bus:'amb',att:.08,delay:.45,pan:-.4,slide:-25});}}}},
 chime(){const base=pick([1568,1760,2093,2349,2637]);for(let i=0;i<3;i++)this.bell(base*[1,1.25,1.5][i]*(1+rand(-.003,.003)),2.2,.018,i*rand(.08,.18),'amb');},
 gull(pan,vol){for(let i=0;i<rand(2,4)|0;i++){const d=i*rand(.25,.4);this.o(rand(1300,1600),.32,{type:'sawtooth',vol:vol*.25,slide:-700,delay:d,bus:'amb',pan,att:.03});this.o(rand(1300,1600),.3,{type:'sine',vol:vol*.7,slide:-650,delay:d,bus:'amb',pan,att:.03});}},
 chirp(pan){const n=3+(Math.random()*4|0),base=rand(2600,4200);for(let i=0;i<n;i++)this.o(base+rand(-300,300),.06,{vol:.02,slide:rand(600,1400),delay:i*rand(.07,.11),bus:'amb',pan});}
};
/* generative music: a set of tracks, each with its own tempo, harmony, instruments and drums. The game picks the
   track that fits the moment (a fight with a rare fish, a big event, a Tide Well nearby, the casino, the weather,
   the island, day or night) and crossfades to it on the next half bar. */
const Music={on:false,step:0,next:0,ci:0,deg:4,timer:null,key:'day',want:'day',pads:[],
 T:{
  day:{bpm:74,ch:[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,64],[45,52,57,61,64]],sc:[62,64,66,69,71,74,76,78,81,83],bass:[38,35,31,33],cut:1100,inst:'pluck',dens:[.42,.2],shaker:1,fifth:1},
  night:{bpm:56,ch:[[45,52,55,59,64],[41,48,52,57,60],[48,55,59,64,67],[40,47,52,55,59]],sc:[57,60,62,64,67,69,72,74,76,79],bass:[33,29,36,28],cut:760,inst:'mbox',dens:[.26,.06]},
  petal:{bpm:70,ch:[[50,57,62,64,69],[45,52,57,62,64],[47,54,59,62,66],[43,50,55,62,64]],sc:[62,64,66,69,71,74,76,78,81,83],bass:[38,33,35,31],cut:1200,inst:'koto',dens:[.4,.16]},
  dune:{bpm:80,ch:[[52,59,64,65,71],[50,57,62,65,69],[48,55,60,64,67],[47,54,59,63,66]],sc:[64,65,68,69,71,72,74,76,77,80],bass:[40,38,36,35],cut:1000,inst:'koto',drum:'hand',dens:[.4,.18]},
  glim:{bpm:58,ch:[[48,55,59,62,66],[50,57,62,66,69],[52,59,64,67,71],[47,54,59,62,66]],sc:[60,62,64,66,67,69,71,72,74,76,78],bass:[36,38,40,35],cut:900,inst:'mbox',dens:[.3,.1],layers:['shimmer']},
  abyss:{bpm:44,ch:[[40,47,50,55,58],[38,45,48,53,57],[36,43,46,51,55],[35,42,45,50,53]],sc:[52,55,57,58,62,64,67,69,70],bass:[28,26,24,23],cut:560,inst:'bell',dens:[.16,.04],pad:'dark',padVol:1.2,layers:['drone','trem','drip']},
  hollow:{bpm:50,ch:[[45,52,57,60,64],[43,50,55,58,62],[41,48,53,57,60],[40,47,52,55,59]],sc:[57,60,62,64,67,69,72,74,76],bass:[33,31,29,28],cut:650,inst:'mbox',dens:[.2,.05],pad:'dark',layers:['drone','drip']},
  /* weather */
  rain:{bpm:62,ch:[[45,52,55,59,64],[41,48,52,55,60],[48,52,55,59,64],[43,50,55,59,62]],sc:[60,62,64,67,69,72,74,76],bass:[33,29,36,31],cut:800,inst:'pluck',dens:[.3,.1],drum:'brush',layers:['drops']},
  storm:{bpm:84,ch:[[38,45,50,53,57],[34,41,46,50,53],[36,43,48,52,55],[33,40,45,49,52]],sc:[62,64,65,67,69,70,72,74,76,77],bass:[38,34,36,33],cut:900,inst:'lead',dens:[.3,.12],drum:'tom',bassMode:'pulse',pad:'dark',layers:['trem','drone']},
  fog:{bpm:48,ch:[[45,50,52,57,59],[43,48,50,55,57],[41,46,48,53,55],[40,45,47,52,54]],sc:[57,59,62,64,66,69,71],bass:[33,31,29,28],cut:650,inst:'mbox',dens:[.14,.03],pad:'air',layers:['drone']},
  /* big events */
  leviathan:{bpm:54,ch:[[38,45,50,54,57],[43,50,55,59,62],[40,47,52,55,59],[45,52,57,61,64]],sc:[62,64,66,69,71,74,76,78],bass:[26,31,28,33],cut:1000,inst:'bell',dens:[.24,.04],drum:'tom',pad:'warm',padVol:1.4,layers:['whale','drone'],sting:'swell'},
  starfall:{bpm:76,ch:[[41,48,53,57,64],[43,50,55,59,66],[45,52,57,60,64],[40,47,52,55,59]],sc:[65,67,69,71,72,74,76,77,79,81,83,84],bass:[29,31,33,28],cut:1600,inst:'mbox',dens:[.36,.18],arp:1,pad:'glass',layers:['shimmer'],sting:'sparkle'},
  aurora:{bpm:60,ch:[[48,55,59,62,67],[45,52,55,59,64],[41,48,52,57,62],[43,50,55,59,66]],sc:[60,62,64,67,69,71,72,74,76,79],bass:[36,33,29,31],cut:1300,inst:'mbox',dens:[.3,.08],pad:'air',padVol:1.3,layers:['shimmer'],sting:'sparkle'},
  swell:{bpm:96,ch:[[40,47,52,56,59],[45,52,57,61,64],[42,49,54,57,61],[47,54,59,63,66]],sc:[64,66,68,69,71,73,76,78,80],bass:[40,45,42,47],cut:1500,inst:'koto',dens:[.5,.28],drum:'drive',bassMode:'pulse',arp:1,sting:'swell'},
  /* small events */
  surge:{bpm:70,ch:[[48,52,56,60,64],[46,50,54,58,62],[44,48,52,56,60],[50,54,58,62,66]],sc:[60,62,64,66,68,70,72,74,76],bass:[36,34,32,38],cut:1100,inst:'mbox',dens:[.32,.12],pad:'glass',layers:['shimmer'],sting:'sparkle'},
  golden:{bpm:88,ch:[[48,55,60,64,67],[53,57,60,65,69],[55,59,62,67,71],[45,52,57,60,64]],sc:[60,62,64,67,69,72,74,76,79,81],bass:[36,41,43,33],cut:1600,inst:'pluck',dens:[.5,.25],drum:'soft',arp:1,shaker:1,fifth:1,sting:'sparkle'},
  frenzy:{bpm:112,ch:[[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62],[40,47,52,56,59]],sc:[57,60,62,64,67,69,72,74,76],bass:[33,29,31,28],cut:1500,inst:'koto',dens:[.55,.3],drum:'drive',bassMode:'pulse',sting:'swell'},
  current:{bpm:80,ch:[[50,57,62,66,69],[52,59,64,67,71],[47,54,59,62,66],[45,52,57,61,64]],sc:[62,64,66,69,71,74,76,78,81],bass:[38,40,35,33],cut:1300,inst:'pluck',dens:[.45,.2],drum:'hand',fifth:1},
  /* places and moments */
  well:{bpm:66,ch:[[44,51,56,60,63],[46,53,58,61,65],[41,48,53,56,60],[39,46,51,55,58]],sc:[63,65,67,68,70,72,75,77,79,80],bass:[32,34,29,27],cut:1300,inst:'bell',dens:[.34,.12],pad:'glass',layers:['shimmer']},
  casino:{bpm:96,ch:[[50,53,57,60,64],[43,47,50,53,57],[48,52,55,59,62],[45,49,52,55,59]],sc:[62,64,65,67,69,71,72,74,76],bass:[38,31,36,33],cut:1400,inst:'pluck',dens:[.4,.3],drum:'brush',bassMode:'walk',pad:'warm',padVol:.8},
  fight:{bpm:116,ch:[[40,47,52,55,59],[36,43,48,52,55],[38,45,50,54,57],[35,42,47,51,54]],sc:[64,66,67,69,71,72,74,76,79],bass:[40,36,38,35],cut:1700,inst:'lead',dens:[.4,.22],drum:'drive',bassMode:'pulse',arp:1,pad:'dark',sting:'hit'},
  fightBig:{bpm:128,ch:[[40,47,52,55,59],[36,43,48,52,55],[41,48,53,57,60],[35,42,47,51,54]],sc:[64,66,67,69,71,72,74,76,79,83],bass:[28,24,29,23],cut:2000,inst:'lead',dens:[.48,.3],drum:'drive',bassMode:'pulse',arp:1,pad:'dark',padVol:1.2,layers:['trem'],sting:'hit'}},
 start(){if(this.on||!AU.ctx)return;this.on=true;this.next=AU.ctx.currentTime+.3;this.timer=setInterval(()=>this.tick(),60);},
 /* which track fits right now, most important first */
 pick(){const has=v=>typeof v!=='undefined';if(!has(player)||!player||!has(env))return 'day';
  if(has(F)&&F.st==='reeling'&&F.catch&&(F.catch.r>=2||F.catch.relic))return F.catch.r>=4||F.catch.relic?'fightBig':'fight';
  if((has(panelCtx)&&panelCtx&&panelCtx.kind==='casino')||(has(CASINO)&&CASINO.inside))return 'casino';
  if(player.zone==='hollow'||player.zone==='abyss')return player.zone;
  const ev=env.event;if(ev&&ev.big&&this.T[ev.id])return ev.id;
  if(has(TWV)&&TWV.near&&Math.hypot(TWV.near.x-player.pos.x,TWV.near.z-player.pos.z)<170)return 'well';
  if(ev&&this.T[ev.id])return ev.id;
  if(env.weather==='storm'&&env.rain>.6)return 'storm';
  const day=env.day>=.42,z=player.zone;if((z==='petal'||z==='dune')&&day)return z;if(z==='glim')return 'glim';
  if(env.weather==='fog'&&env.fog>.5)return 'fog';if(env.weather==='rain'&&env.rain>.5)return 'rain';
  return day?'day':'night';},
 cur(){return this.T[this.key]||this.T.day;},
 tick(){const c=AU.ctx;if(!c||c.state!=='running')return;const P=this.cur();const spb=60/(P.bpm*(state.settings.chill?.92:1))/2;
  while(this.next<c.currentTime+.3){this.play(this.next,spb);this.next+=spb;this.step++;}},
 /* switch tracks on a half bar: fade the old pads out, start the new chord at once, mark big changes with a sting */
 switchTo(k,t,spb){const now=AU.ctx.currentTime;for(const p of this.pads){try{p.g.gain.cancelScheduledValues(now);p.g.gain.setTargetAtTime(0.0001,now,.6);}catch(e){}}this.pads=[];
  this.key=k;const P=this.cur();this.ci=0;this.step=0;this.deg=Math.floor(P.sc.length/2);if(P.sting)this.sting(P.sting,t);this.pad(P.ch[0],t,spb*32,P);},
 play(t,spb){const s=this.step%32,beat=s%8;
  if(beat%4===0){this.want=this.pick();if(this.want!==this.key){this.switchTo(this.want,t,spb);return;}}
  const P=this.cur();
  if(s===0){this.ci=(this.ci+1)%4;this.pad(P.ch[this.ci],t,spb*32,P);this.layers(P,t,spb);}
  const root=P.bass[this.ci];
  if(P.bassMode==='pulse')this.bass(root+(beat===6?12:0),t,spb*.9,.07);
  else if(P.bassMode==='walk'){if(beat%2===0)this.bass(root+[0,4,7,9][beat/2],t,spb*1.8,.08);}
  else{if(beat===0)this.bass(root,t,spb*6);if(beat===4&&P.fifth)this.bass(root+7,t,spb*3,.05);}
  if(P.arp&&beat%1===0){const ch=P.ch[this.ci],n=ch[[1,2,3,4,3,2,1,2][beat]]+12;this.harp(n,t,P.inst==='lead'?.022:.03);}
  const dens=P.dens[beat%2];if(Math.random()<dens){this.deg=clamp(this.deg+pick([-2,-1,-1,0,1,1,2]),0,P.sc.length-1);this.voice(P.inst,P.sc[this.deg],t,spb);}
  this.drums(P,beat,t);
  if(P.shaker&&beat%2===1&&Math.random()<.7)AU.n(.05,.008,7000,6000,{type:'highpass',bus:'music',delay:t-AU.ctx.currentTime});
  if(P.layers&&P.layers.includes('shimmer')&&Math.random()<.12)this.bellNote(P.sc[P.sc.length-1-Math.floor(Math.random()*4)]+12,t,.018);
  if(P.layers&&P.layers.includes('drops')&&Math.random()<.08)this.bellNote(pick(P.sc)+12,t,.014);},
 voice(inst,m,t,spb){if(inst==='koto')this.koto(m,t);else if(inst==='mbox')this.mbox(m,t);else if(inst==='bell')this.bellNote(m,t,.04);else if(inst==='lead')this.lead(m,t,spb*1.6);else this.pluck(m,t);},
 drums(P,beat,t){const d=P.drum;if(!d)return;const dl=t-AU.ctx.currentTime;
  if(d==='hand'){if(beat===0||beat===3||beat===6||(beat===7&&Math.random()<.4))this.drum(t,beat===0);}
  else if(d==='soft'){if(beat===0||beat===4)this.kick(t,.06);if(beat%2===1)AU.n(.04,.012,8000,6500,{type:'highpass',bus:'music',delay:dl});}
  else if(d==='brush'){if(beat===0||beat===5)this.kick(t,.045);AU.n(.09,beat%2?.006:.011,4000,2500,{q:.6,bus:'music',delay:dl});}
  else if(d==='drive'){if(beat===0||beat===4||(beat===7&&Math.random()<.3))this.kick(t,.11);if(beat===2||beat===6)this.snare(t);AU.n(.03,beat%2?.012:.02,9000,7000,{type:'highpass',bus:'music',delay:dl});}
  else if(d==='tom'){if(beat===0)this.tom(t,70,.12);if(beat===6&&Math.random()<.6)this.tom(t,92,.07);}},
 layers(P,t,spb){const L=P.layers||[],dur=spb*32,c=AU.ctx;
  if(L.includes('drone')){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(P.bass[this.ci]-12);const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=180;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.035,t+2);g.gain.exponentialRampToValueAtTime(0.0001,t+dur+1.5);o.connect(f);f.connect(g);g.connect(AU.bus.music);o.start(t);o.stop(t+dur+1.6);this.pads.push({g});}
  if(L.includes('trem')){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1400;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.02,t+1);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
   const lfo=c.createOscillator();lfo.frequency.value=7.5;const lg=c.createGain();lg.gain.value=.012;lfo.connect(lg);lg.connect(g.gain);f.connect(g);g.connect(AU.bus.music);lfo.start(t);lfo.stop(t+dur+.2);
   for(const m of P.ch[this.ci].slice(2)){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m+12);o.connect(f);o.start(t);o.stop(t+dur+.2);}this.pads.push({g});}
  if(L.includes('whale')&&Math.random()<.6){const o=c.createOscillator();o.type='sine';const t0=t+spb*rand(2,10),f0=rand(260,340);o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(f0*.55,t0+2.6);o.frequency.exponentialRampToValueAtTime(f0*.8,t0+4.2);
   const g=c.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(.05,t0+.8);g.gain.exponentialRampToValueAtTime(0.0001,t0+4.4);o.connect(g);g.connect(AU.bus.music);g.connect(AU.dlySend);o.start(t0);o.stop(t0+4.5);}
  if(L.includes('drip')){for(let i=0;i<3;i++)this.bellNote(pick(P.sc)+12,t+spb*rand(0,30),.012);}},
 sting(kind,t){const d=Math.max(0,t-AU.ctx.currentTime);
  if(kind==='swell'){AU.n(2.4,.05,600,5000,{q:.5,bus:'music',delay:Math.max(0,d-.4),att:1.6});this.tom(t,60,.14);}
  else if(kind==='sparkle'){for(let i=0;i<8;i++)this.bellNote(84+[0,4,7,11,12,16,19,24][i],t+i*.06,.025);}
  else if(kind==='hit'){this.kick(t,.16);AU.n(.6,.06,3000,9000,{type:'highpass',bus:'music',delay:d});this.tom(t+.12,80,.1);}},
 /* pads: warm (detuned triangles), air (soft sines with a breathy filter), glass (high sines), dark (low-passed saws) */
 pad(notes,t,dur,P){const c=AU.ctx,kind=P.pad||'warm',vol=.05*(P.padVol||1);const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=kind==='dark'?Math.min(P.cut,700):kind==='glass'?P.cut*1.6:P.cut;f.Q.value=.4;
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(kind==='air'?3:2.2));g.gain.setValueAtTime(vol,t+dur-.4);g.gain.exponentialRampToValueAtTime(0.0001,t+dur+2.4);f.connect(g);g.connect(AU.bus.music);
  const type=kind==='dark'?'sawtooth':kind==='air'||kind==='glass'?'sine':'triangle',shift=kind==='glass'?12:0;
  for(const m of notes)for(const dt of[-7,7]){const o=c.createOscillator();o.type=type;o.frequency.value=mtof(m+shift);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+dur+2.6);}
  if(kind==='air'){const n=c.createBufferSource();n.buffer=AU.nb;n.loop=true;const bf=c.createBiquadFilter();bf.type='bandpass';bf.frequency.value=mtof(notes[3]+12);bf.Q.value=6;const ng=c.createGain();ng.gain.value=.25;n.connect(bf);bf.connect(ng);ng.connect(g);n.start(t,Math.random()*2);n.stop(t+dur+2.6);}
  this.pads.push({g});if(this.pads.length>6)this.pads.splice(0,this.pads.length-6);},
 bass(m,t,dur,v=.09){const c=AU.ctx;const o=c.createOscillator();o.type='sine';o.frequency.value=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.03);g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(.1,dur));o.connect(g);g.connect(AU.bus.music);o.start(t);o.stop(t+dur+.1);},
 kick(t,v){const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.22);o.connect(g);g.connect(AU.bus.music);o.start(t);o.stop(t+.25);},
 snare(t){const d=t-AU.ctx.currentTime;AU.n(.14,.05,2600,1800,{q:.7,bus:'music',delay:d});AU.o(190,.08,{vol:.03,slide:-60,bus:'music',delay:d});},
 tom(t,f,v){const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f*1.4,t);o.frequency.exponentialRampToValueAtTime(f,t+.25);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.6);o.connect(g);g.connect(AU.bus.music);g.connect(AU.dlySend);o.start(t);o.stop(t+.65);},
 harp(m,t,v){const c=AU.ctx,f=mtof(m),o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(0.0001,t+.5);o.connect(g);g.connect(AU.bus.music);g.connect(AU.dlySend);o.start(t);o.stop(t+.55);},
 lead(m,t,dur){const c=AU.ctx,f=mtof(m),o=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();o.type='square';o.frequency.value=f;const vib=c.createOscillator(),vg=c.createGain();vib.frequency.value=5.5;vg.gain.value=f*.006;vib.connect(vg);vg.connect(o.frequency);
  lp.type='lowpass';lp.frequency.setValueAtTime(f*3,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+dur);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.028,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(AU.bus.music);g.connect(AU.dlySend);o.start(t);vib.start(t);o.stop(t+dur+.05);vib.stop(t+dur+.05);},
 bellNote(m,t,v){const c=AU.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+2.2);g.connect(AU.bus.music);g.connect(AU.dlySend);
  for(const[k,a]of[[1,1],[2.01,.35],[3.98,.12]]){const o=c.createOscillator();o.type='sine';o.frequency.value=f*k;const gg=c.createGain();gg.gain.value=a;o.connect(gg);gg.connect(g);o.start(t);o.stop(t+2.3);}},
 pluck(m,t){const c=AU.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.006);g.gain.exponentialRampToValueAtTime(0.0001,t+1.1);g.connect(AU.bus.music);g.connect(AU.dlySend);
  const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.connect(g);const o2=c.createOscillator();o2.type='sine';o2.frequency.value=f*3.98;const g2=c.createGain();g2.gain.setValueAtTime(.25,t);g2.gain.exponentialRampToValueAtTime(0.001,t+.15);o2.connect(g2);g2.connect(g);
  o.start(t);o2.start(t);o.stop(t+1.2);o2.stop(t+.2);},
 koto(m,t){const c=AU.ctx,f=mtof(m);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.065,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+1.6);g.connect(AU.bus.music);g.connect(AU.dlySend);
  const o=c.createOscillator();o.type='triangle';o.frequency.setValueAtTime(f*1.03,t);o.frequency.exponentialRampToValueAtTime(f,t+.06);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+.8);o.connect(lp);lp.connect(g);
  const o2=c.createOscillator();o2.type='sine';o2.frequency.value=f*2;const g2=c.createGain();g2.gain.setValueAtTime(.3,t);g2.gain.exponentialRampToValueAtTime(.001,t+.4);o2.connect(g2);g2.connect(g);o.start(t);o2.start(t);o.stop(t+1.7);o2.stop(t+.5);},
 drum(t,acc){const d=t-AU.ctx.currentTime;AU.o(acc?96:132,.22,{vol:acc?.11:.06,slide:-46,bus:'music',delay:d});AU.n(.06,acc?.05:.03,900,300,{type:'lowpass',bus:'music',delay:d});},
 mbox(m,t){const c=AU.ctx,f=mtof(m+12);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+2.6);g.connect(AU.bus.music);g.connect(AU.dlySend);
  for(const[k,v]of[[1,1],[2.76,.28],[5.4,.1]]){const o=c.createOscillator();o.type='sine';o.frequency.value=f*k;const gg=c.createGain();gg.gain.value=v;o.connect(gg);gg.connect(g);o.start(t);o.stop(t+2.7);}}
};

