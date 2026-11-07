'use strict';
/* Driftwood Isles — NPC quests, dialogue and titles.
   Each NPC offers a short chain. Progress is tracked from game events (questEvent) and saved in state.quests. */

/* goal filters for 'catch': zone (island or pond key), sp, r (min rarity), mut (true = any), w (min kg), night, sea (from the boat at sea), ev (during a big event) */
const QUESTS=[
 {id:'marlo1',npc:'marlo',n:'First Catch',goal:{t:'catch',n:3},rw:{c:120,xp:40},
  offer:"New face on the docks! Tell you what: bring me three fish, any kind at all, and I'll show you how fair old Marlo pays.",prog:"Any fish will do. The end of the dock is where the nibbles are.",done:"Three fish! You've got the knack. Here, first wage of many."},
 {id:'marlo2',npc:'marlo',n:'Market Day',goal:{t:'sell',n:600},rw:{c:250,xp:80,bait:['shrimp',5]},req:['marlo1'],
  offer:"Now let's see you trade. Sell me 600 coins' worth of fish. Lock the ones you love so you don't sell them by accident.",prog:"Keep 'em coming. Heavy fish and variants pay best.",done:"Ha! You drive a bargain. Take some salted shrimp, they work wonders."},
 {id:'marlo3',npc:'marlo',n:'The Big One',goal:{t:'catch',n:1,w:8},rw:{c:600,xp:160,title:'Big Catch'},req:['marlo2'],
  offer:"Every angler has a story about the big one. Go make yours: land a single fish over 8 kilograms.",prog:"Over eight kilos. Try deeper water, or the far islands.",done:"Would you look at that monster! I'll be telling this one for years."},
 {id:'tess1',npc:'tess',n:'Tackle Up',goal:{t:'rod',n:1},rw:{c:150,xp:60,bait:['worm',10]},
  offer:"That driftwood stick won't last you. Buy any new rod from my rack and I'll throw in a tin of worms.",prog:"Pine, bamboo, coral... pick whatever feels right in your hands.",done:"Now that's a proper rod. Here's your worms, as promised."},
 {id:'tess2',npc:'tess',n:'Fine Tuning',goal:{t:'catch',n:5,r:1},rw:{c:400,xp:120,bait:['glowfly',5]},req:['tess1'],
  offer:"A good rod finds good fish. Catch five Uncommon fish or better and come tell me how it handles.",prog:"Uncommon or rarer. Bait helps the odds.",done:"Told you it'd sing. Glowflies for the night shift."},
 {id:'gilda1',npc:'gilda',n:'Shiny Things',goal:{t:'catch',n:1,mut:true},rw:{c:500,xp:140,title:'Collector'},
  offer:"I collect oddities, dear. Shiny, golden, glowing... Bring me word of any mutated fish and I'll make it worth your while.",prog:"Variants are rare. The Prism Lure tilts the odds, and so does a Variant Surge.",done:"Oh, marvellous! A true collector's eye. Wear the title proudly."},
 {id:'gilda2',npc:'gilda',n:'Wonders of the Deep',goal:{t:'catch',n:3,ev:true},rw:{c:1500,xp:300,title:'Starwatcher'},req:['gilda1'],
  offer:"Sometimes the isles put on a show: whales, falling stars, the glowing tide. Catch three fish while a big event is running.",prog:"Watch the banner at the top. A big event comes every quarter hour or so.",done:"You were there for it! Not many can say that."},
 {id:'rook1',npc:'rook',n:'Chart a Course',goal:{t:'visit',n:1,zone:'moss'},rw:{c:400,xp:100},
  offer:"Pebble Cove's only the start. Buy a chart for Mossreach and set foot on it. The bog's got fish you won't believe.",prog:"Charts are on my board. Sail there, or I'll ferry you once you own the chart.",done:"Smell that bog on you! Welcome back, explorer."},
 {id:'rook2',npc:'rook',n:'Sea Legs',goal:{t:'catch',n:3,sea:true},rw:{c:600,xp:160,title:'Sea Legs'},req:['rook1'],
  offer:"Real anglers fish the open water. Take your boat out past the buoys and land three fish from the deck.",prog:"From the boat, out at sea. Stop the engine before you cast.",done:"Steady hands, salt in the hair. You've earned your sea legs."},
 {id:'harlan1',npc:'harlan',n:'Shakedown Cruise',goal:{t:'catch',n:2,sea:true},rw:{c:300,xp:90,bait:['shrimp',8]},
  offer:"Every boat needs a shakedown. Take yours out and haul in two fish from the deck. Tell me how she rides.",prog:"Two fish, from the boat. She's moored at the end of the dock.",done:"Not a leak in sight! Fine work. Have some shrimp for the next trip."},
 {id:'odessa1',npc:'odessa',n:'Moonlight Brew',goal:{t:'catch',n:3,night:true},rw:{c:450,xp:140,title:'Night Owl'},
  offer:"My best brews need fish caught under the moon. Bring me three night-caught fish, would you?",prog:"After dusk. The lamps on the dock light the way.",done:"Perfect, still cold from the dark water. You're a proper night owl."},
 {id:'bramble1',npc:'bramble',n:'Bog Bounty',goal:{t:'catch',n:5,zone:'moss'},rw:{c:1000,xp:200},
  offer:"Mossreach waters are thick with life if you're patient. Five fish from around the isle, that's all I ask.",prog:"Around the shore or in the Murk Pool. Mind the mushrooms.",done:"Good haul! The bog likes you."},
 {id:'mags1',npc:'mags',n:'Pond Life',goal:{t:'catch',n:3,zone:'pond_moss'},rw:{c:900,xp:180,bait:['prism',3]},
  offer:"The Murk Pool keeps its own secrets. Three fish from it, and I'll part with some Prism Lures.",prog:"The pool's up the path from the dock. Its fish live nowhere else.",done:"Murk Pool regulars! Here, these lures shimmer like nothing else."},
 {id:'fen1',npc:'fen',n:'Glass Hunter',goal:{t:'relic',n:1},rw:{c:1600,xp:250,title:'Tide-Touched'},
  offer:"The tide hides sea glass in the deep. One in a hundred casts, perhaps. Find one and bring it to the runestone.",prog:"Sea glass comes up anywhere. Luck helps.",done:"The tide has chosen you. Offer it here whenever you're ready."},
 {id:'hollis1',npc:'hollis',n:'Cold Comfort',goal:{t:'catch',n:5,zone:'frost'},rw:{c:3000,xp:300},
  offer:"Fish keep fresh in this cold. Bring me five from around Frostmere and warm your hands by my stove.",prog:"Off the shore or the Frozen Tarn.",done:"Fresh as the snow! Good on you."},
 {id:'brannoc1',npc:'brannoc',n:'Frozen Solid',goal:{t:'catch',n:1,mut:'frozen'},rw:{c:5000,xp:400,title:'Frost Fisher'},req:['hollis1'],
  offer:"Once in a while the cold gets into a fish and stays. Catch a Frozen one. They show up more often round here.",prog:"Icebound variants, most common on Frostmere.",done:"Solid ice, scales and all! A true Frost Fisher."},
 {id:'pip1',npc:'pip',n:'Under the Ice',goal:{t:'catch',n:3,zone:'pond_frost'},rw:{c:2200,xp:220},
  offer:"Cut a hole in the Frozen Tarn, they say, and the char come to you. Three fish from the tarn!",prog:"The tarn is inland. Look for the ring of ice.",done:"Brr! Well done. Hot cocoa's on me."},
 {id:'cinda1',npc:'cinda',n:'Trial by Fire',goal:{t:'catch',n:5,zone:'ember'},rw:{c:9000,xp:450},
  offer:"Emberkey burns the careless. Fish five from around the island and you've passed the trial.",prog:"Around the black sand, or the Ash Spring.",done:"Not even singed! Respect."},
 {id:'oren1',npc:'oren',n:'Forged in Ash',goal:{t:'catch',n:1,r:3},rw:{c:12000,xp:600,title:'Ember Legend'},req:['cinda1'],
  offer:"I forge rods for legends. Show me you are one: land a Legendary fish or anything rarer.",prog:"Legendary or better. Good bait and a strong rod help.",done:"A legend in the flesh! The forge salutes you."},
 {id:'kettle1',npc:'kettle',n:'Hot Spring',goal:{t:'catch',n:3,zone:'pond_ember'},rw:{c:6000,xp:350,bait:['ink',2]},
  offer:"The Ash Spring bubbles with strange fish. Three of them, and I'll trade you some Deep Ink.",prog:"The spring's in the middle of the island. Mind the steam.",done:"Steamed to perfection. Here's your ink. Use it wisely."},
  {id:'nalu1',npc:'nalu',n:'Reef Haul',goal:{t:'catch',n:5,zone:'atoll'},rw:{c:3200,xp:320},
  offer:"The reef is generous to patient hands. Bring me five fish from around the atoll and I'll pay island prices.",prog:"Fish the shallows around the atoll, or the Blue Lagoon.",done:"Beautiful colours! The reef has taken a liking to you."},
 {id:'coralie1',npc:'coralie',n:'Pearl of the Lagoon',goal:{t:'catch',n:1,zone:'pond_atoll',r:2},rw:{c:4300,xp:380,bait:['prism',4]},
  offer:"The Blue Lagoon hides real treasures. Catch me a Rare fish or better from its waters.",prog:"Rare or rarer, from the Blue Lagoon in the middle of the atoll.",done:"A true pearl! Take these lures, they catch the light like nothing else."},
 {id:'kai1',npc:'kai',n:'Island Hopper',goal:{t:'visit',n:1,zone:'amber'},rw:{c:5400,xp:400},
  offer:"Far to the east the leaves never stop falling. Buy the Amberglen chart and set foot in the glen.",prog:"Amberglen lies east of Pebble Cove. Charts are on my board.",done:"You smell of woodsmoke and maple. Welcome back, island hopper!"},
 {id:'moana1',npc:'moana',n:'Speed Trial',goal:{t:'catch',n:4,sea:true},rw:{c:3600,xp:300,bait:['shrimp',12]},
  offer:"A boat's only as good as its captain. Take her out and land four fish from the deck in open water.",prog:"Four fish from your boat, out at sea.",done:"You handle the swell like a local! Shrimp for the road."},
 {id:'rowan1',npc:'rowan',n:'Glen Harvest',goal:{t:'catch',n:5,zone:'amber'},rw:{c:10400,xp:500},
  offer:"Harvest season in the glen means fat fish. Five from around Amberglen, if you please.",prog:"Around the cliffs or in Maple Mere.",done:"A fine harvest! The glen thanks you."},
 {id:'bramwell1',npc:'bramwell',n:'Thornback Hunt',goal:{t:'catch',n:1,sp:'thornback_pike'},rw:{c:8300,xp:450,bait:['glowfly',8]},
  offer:"There's a pike in these waters with a back like a bramble. It only shows in the rain. Catch me a Thornback Pike.",prog:"Thornback Pike bite around Amberglen while it rains.",done:"Look at those spines! You've earned these glowflies."},
 {id:'hazel1',npc:'hazel',n:'Mere Magic',goal:{t:'catch',n:3,zone:'pond_amber'},rw:{c:6800,xp:380},
  offer:"Maple Mere's water makes the best brews. Catch three of its fish and I'll know the water's right.",prog:"Maple Mere is up the hill, past the pumpkin patches.",done:"The mere is happy, and so am I. Thank you, dear."},
 {id:'tamsin1',npc:'tamsin',n:'Legend of the Glen',goal:{t:'catch',n:1,zone:'amber',r:3},rw:{c:15600,xp:700,title:'Glen Legend'},req:['rowan1'],
  offer:"They say Old Amber still swims off these cliffs. Land any Legendary fish around Amberglen and the glen will sing of you.",prog:"Legendary or rarer, around Amberglen. Fog and night bring out the strange ones.",done:"The glen will sing of this! Wear your title proudly."},
 /* quest line 1: the Cartographer's Voyage. Isolde (Pebble Cove) sends you to map the three new isles; each step pays out on the spot and the next begins */
 {id:'cart1',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'Blossom Bearings',goal:{t:'visit',n:1,zone:'petal'},rw:{c:4500,xp:300},
  offer:"My charts end where the blossoms begin. Sail north to Petalshore and tell me what you see. I'll follow your progress from here, no need to come back each time.",prog:"Petalshore lies far to the north. Harbormasters sell the chart.",done:"Pink petals on the water! Marvellous. Now, the pool at its heart..."},
 {id:'cart2',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'Depth of the Mirror',goal:{t:'catch',n:3,zone:'pond_petal'},rw:{c:6000,xp:400,bait:['shrimp',10]},req:['cart1'],
  offer:"Every isle has a heart. On Petalshore it's the Mirror Pool. Catch three of its fish so I can note what lives there.",prog:"The Mirror Pool, under the red bridge on Petalshore.",done:"Three species noted! Next stop: the desert."},
 {id:'cart3',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'Shifting Sands',goal:{t:'visit',n:1,zone:'dune'},rw:{c:9000,xp:500},req:['cart2'],
  offer:"East, past Mossreach, there's an isle of sand and red stone. Set foot on Duneveil.",prog:"Duneveil is far to the east. Its chart is not cheap.",done:"Sand in your boots! The mesa is just as the old sailors described."},
 {id:'cart4',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'Oasis Secrets',goal:{t:'catch',n:1,zone:'pond_dune',r:2},rw:{c:12000,xp:600,bait:['prism',5]},req:['cart3'],
  offer:"Desert springs hide strange life. Catch a Rare fish or better from the Oasis Spring.",prog:"Rare or rarer, from the Oasis Spring behind the mesa.",done:"A jewel of a fish! One more isle to go."},
 {id:'cart5',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'The Glimmering Hills',goal:{t:'visit',n:1,zone:'glim'},rw:{c:15000,xp:700},req:['cart4'],
  offer:"The last blank space on my map: crystal hills to the far south-west. Reach Glimmerholt.",prog:"Glimmerholt, far south-west, past the Sunken Atoll.",done:"You made it! The hills really do glow?"},
 {id:'cart6',npc:'isolde',line:'Cartographer\'s Voyage',auto:true,n:'Mapmaker\'s Legend',goal:{t:'catch',n:1,zone:'glim',r:3},rw:{c:36000,xp:1500,title:'Cartographer',rod:'wayfinder'},req:['cart5'],
  offer:"A map isn't finished until it has a legend. Land a Legendary fish or rarer at Glimmerholt and I'll name the hills after you.",prog:"Legendary or rarer, around Glimmerholt or in the Starwell.",done:"The map is complete! Take my old Wayfinder Rod. It has seen every sea, and now so have you."},
 /* quest line 2: the Spirit of the Tides. Old Mirren (Petalshore) tells the tale of the moon that swims in the sea */
 {id:'mirren1',npc:'mirren',line:'Spirit of the Tides',auto:true,n:'The Moon Bridge',goal:{t:'catch',n:1,sp:'moonbridge_koi'},rw:{c:7500,xp:400},
  offer:"Long ago the moon fell into the sea and became a fish. The first sign of it is the Moonbridge Koi. Catch one and I'll tell you more.",prog:"Moonbridge Koi swim around Petalshore.",done:"Ah, white as moonlight. The tale is true, then. Listen..."},
 {id:'mirren2',npc:'mirren',line:'Spirit of the Tides',auto:true,n:'Night Watch',goal:{t:'catch',n:3,night:true,zone:'petal'},rw:{c:9000,xp:500,bait:['glowfly',8]},req:['mirren1'],
  offer:"The moon-fish only stirs at night. Fish three times under the stars on Petalshore.",prog:"After dusk, anywhere around Petalshore.",done:"You've felt it too, haven't you? The water hums at night."},
 {id:'mirren3',npc:'mirren',line:'Spirit of the Tides',auto:true,n:'Glow of the Deep',goal:{t:'catch',n:1,mut:'glowing'},rw:{c:15000,xp:700,bait:['prism',6]},req:['mirren2'],
  offer:"Fish touched by the moon glow from inside. Catch any Glowing fish, anywhere in the isles.",prog:"Luminous variants. A Starfall makes them far more common.",done:"It glows like a lantern! The moon is close now."},
 {id:'mirren4',npc:'mirren',line:'Spirit of the Tides',auto:true,n:'Ink and Starlight',goal:{t:'catch',n:1,sp:'inkbrush_eel'},rw:{c:18000,xp:800},req:['mirren3'],
  offer:"The Inkbrush Eel writes the moon's path on the water. It only comes out at night.",prog:"Inkbrush Eels bite around Petalshore after dark.",done:"Look at those markings... it's a map of the tides!"},
 {id:'mirren5',npc:'mirren',line:'Spirit of the Tides',auto:true,n:'The Spirit of the Tides',goal:{t:'catch',n:1,r:4},rw:{c:45000,xp:2000,title:'Tidesinger',rod:'moonpetal'},req:['mirren4'],
  offer:"Now you are ready. The moon-fish shows itself only to anglers who have caught something truly mythic. Land a Fabled fish or rarer.",prog:"Fabled or rarer, anywhere. Big events and strong bait help.",done:"You've done it. The moon smiles on you, Tidesinger. Take this rod. Its wood grew under a thousand full moons."},
 /* island chores on the three new isles */
 {id:'wren1',npc:'wren',n:'Petal Harvest',goal:{t:'catch',n:5,zone:'petal'},rw:{c:10500,xp:450},
  offer:"Five fish from around Petalshore, if you would. The blossom season makes them plump.",prog:"Around the shore or in the Mirror Pool.",done:"Lovely! They even smell of blossom."},
 {id:'juniper1',npc:'juniper',n:'Lantern Lighter',goal:{t:'catch',n:2,night:true,zone:'pond_petal'},rw:{c:9000,xp:400,bait:['glowfly',6]},
  offer:"The koi rise to the lantern light. Catch two from the Mirror Pool after dark.",prog:"The Mirror Pool, at night.",done:"Beautiful in the lantern glow. Glowflies for you."},
 {id:'ilo1',npc:'ilo',n:'A Worthy Rod',goal:{t:'rod',n:1},rw:{c:12000,xp:500},
  offer:"Buy any rod you don't own yet, and show me you know when to upgrade.",prog:"Any new rod from any rodmaker.",done:"Good balance, good bend. You chose well."},
 {id:'sefa1',npc:'sefa',n:'Desert Bounty',goal:{t:'catch',n:5,zone:'dune'},rw:{c:24000,xp:650},
  offer:"Fish are scarce in the sand, so they sell high. Five from around Duneveil.",prog:"Around Duneveil or in the Oasis Spring.",done:"A fortune in fish! The traders will be pleased."},
 {id:'doran1',npc:'doran',n:'Noon Heat',goal:{t:'catch',n:1,sp:'sunstone_snapper'},rw:{c:22000,xp:600,bait:['shrimp',12]},
  offer:"The Sunshard Snapper only bites in daylight, when the sand is hottest. Catch me one.",prog:"Sunshard Snappers, around Duneveil, in the day.",done:"Glowing like a coal! Here, some shrimp for the road."},
 {id:'amaru1',npc:'amaru',n:'Heavy Gems',goal:{t:'catch',n:1,zone:'dune',w:40},rw:{c:32000,xp:800,title:'Desert Hunter'},req:['sefa1'],
  offer:"Bring me word of a true giant: a fish over 40 kilos from the waters of Duneveil.",prog:"Over 40 kg, around Duneveil. Canyon Groupers and sharks run big.",done:"A giant! The sands will remember you, Desert Hunter."},
 {id:'tobi1',npc:'tobi',n:'Sand Sailor',goal:{t:'catch',n:4,sea:true},rw:{c:16000,xp:500},
  offer:"Test the hull: four fish from the deck, out in open water.",prog:"From your boat, at sea.",done:"Not a scratch! Fine sailing."},
 {id:'lumen1',npc:'lumen',n:'Crystal Catch',goal:{t:'catch',n:5,zone:'glim'},rw:{c:40500,xp:900},
  offer:"Fish from these hills fetch the best prices in the isles. Five from around Glimmerholt.",prog:"Around Glimmerholt, or the Starwell.",done:"Look how they sparkle! Here is your share."},
 {id:'corvin1',npc:'corvin',n:'Wishing Well',goal:{t:'catch',n:3,zone:'pond_glim'},rw:{c:36000,xp:850,bait:['ink',3]},
  offer:"They say the Starwell grants wishes to those who fish it. Three fish, and we'll see.",prog:"The Starwell is inland, ringed by crystals.",done:"No wish yet, but some Deep Ink is the next best thing."},
 {id:'aster1',npc:'aster',n:'Starsmith\'s Trial',goal:{t:'catch',n:1,zone:'glim',mut:true},rw:{c:54000,xp:1100,title:'Starsmith'},req:['lumen1'],
  offer:"A crystal rod needs a mutated fish to tune it. Catch any variant fish around Glimmerholt.",prog:"Any variant, around Glimmerholt.",done:"It rings true! You've earned the title Starsmith."},
 {id:'vesper1',npc:'vesper',n:'Fog and Moonlight',goal:{t:'catch',n:2,night:true,zone:'glim'},rw:{c:31500,xp:800},
  offer:"My brews need fish caught under the moon on these hills. Two will do.",prog:"At night, around Glimmerholt.",done:"Still glowing faintly. Perfect for brewing."},
];
const QM={};QUESTS.forEach(q=>QM[q.id]=q);
const LEVEL_TITLES=[[1,'Novice Angler'],[10,'Seasoned Angler'],[25,'Master Angler'],[50,'Legend of the Isles']];
const TITLE_COL={'Derby Champion':'#ffd76e','Pagekeeper':'#f0d890','Ruin Diver':'#9ab8ff','Kelp Wanderer':'#c8f05a','Novice Angler':'#c9d2da','Seasoned Angler':'#8fd49a','Master Angler':'#7fb8ff','Legend of the Isles':'#ffcf5a','Big Catch':'#ffb46a','Collector':'#e8a6ff','Starwatcher':'#c9a6ff','Sea Legs':'#6fd0e8','Night Owl':'#a8b4ff','Developer':'#ffcf5a','Abyss Diver':'#c890ff','Cartographer':'#8af0ff','Tidesinger':'#e8e8ff','Desert Hunter':'#f0c060','Starsmith':'#c8a8ff','Tide-Touched':'#7ff0e0','Frost Fisher':'#bfe6ff','Ember Legend':'#ff8a5a','Glen Legend':'#f0b050'};
const ALL_TITLES=Object.keys(TITLE_COL);

/* ---------- dialogue lines (extra flavour beyond the quests) ---------- */
const NPC_LINES={
 marlo:['Fresh catch? I pay fair, and I pay in shiny coins.','Heavier fish fetch more. A variant one? Even better.','Lock your favourites so you don\'t sell them by accident!','The tide\'s been kind this week. Good time to be an angler.','My grandfather sold fish from this very spot. Same smell, too.'],
 tess:['Every rod has a personality. Find the one that fits your hands.','Bait gets used one per cast. Stock up before a long trip.','Glowflies at night, shrimp by day. Trust me.','Saw a fellow lose a Legendary to a cheap line last week. Heartbreaking.'],
 gilda:['Let me look at that fish... hm, there\'s more weight in it than you think.','A reroll can turn a common catch into a treasure.','Variants are the sea\'s little jokes. I adore them.'],
 rook:['Charts to the far isles, right here. The sea\'s wide open between them.','Watch the sky. Storms bring big waves and bigger fish.','The ferry runs to any isle you\'ve charted.','The lighthouse up the hill? Built by the first families. Still burns every night.'],
 harlan:['Your boat\'s moored at the end of the dock. Treat her kindly.','Upgrades make all the difference in a swell.','Nothing like the open water at sunrise.'],
 odessa:['Brews last a few minutes of fishing. Mix and match!','The moon pulls more than tides, dear. Fish feel it too.','Careful with the Abyss Tonic. Strong stuff.'],
 bramble:['Bog fish are slimy, but they sell.','Don\'t mind the mushrooms. Mostly harmless.','Fog rolls in thick here. Some fish only bite in it.'],
 mags:['The Murk Pool\'s deeper than it looks.','Charts? I\'ve got them for every isle.','Mind the reeds when you dock.'],
 fen:['The runestone hums when sea glass is near.','Offer sea glass and the tide blesses your rod.','The old stones remember everything.'],
 hollis:['Cold hands, warm coins.','Frozen fish fetch a pretty price, you know.','Snow\'s the quietest sound there is.'],
 pip:['Brr! Charts are inside where it\'s warm.','Ice floes drift out past the bay. Steer clear.','I\'ve lived here forty winters and still lose my mittens.'],
 brannoc:['Ice has a way of sharpening a fish\'s worth.','Let me weigh that properly. The scale doesn\'t lie.'],
 cinda:['Ash and embers. Fish here are tough as nails.','Pay\'s better near the volcano. So is the danger.'],
 kettle:['The spring\'s always simmering.','Steam vents are warm in the morning. Good for the bones.'],
 isolde:['Every island you visit, I add to the chart. Keep sailing!','The sea between the isles is wider than any map shows.','I once mapped a twister by sailing into it. Not recommended.'],
 mirren:['The moon pulls the tides, and the tides pull the fish. Everything is connected, little one.','I caught my first fish under that bridge, seventy summers ago.'],
 oren:['My rods are forged in volcanic glass.','A legend needs a legendary rod.','Hold it by the grip, not the shaft. Show some respect.'],
};

/* ---------- state ---------- */
function qState(){const s=state;if(!s.quests||typeof s.quests!=='object')s.quests={a:{},d:[]};if(!s.quests.a||typeof s.quests.a!=='object')s.quests.a={};if(!Array.isArray(s.quests.d))s.quests.d=[];
 if(!Array.isArray(s.titles))s.titles=[];for(const[l,t]of LEVEL_TITLES)if(s.level>=l&&!s.titles.includes(t))s.titles.push(t);if(!s.titles.includes(s.title))s.title=s.titles[0]||'Novice Angler';return s.quests;}
function qStatus(q){const Q=qState();if(Q.d.includes(q.id))return'done';if(q.id in Q.a)return Q.a[q.id]>=q.goal.n?'ready':'active';if((q.req||[]).every(r=>Q.d.includes(r)))return'offer';return'locked';}
function npcQuests(id){return QUESTS.filter(q=>q.npc===id);}
function currentQuest(id){const list=npcQuests(id);return list.find(q=>{const s=qStatus(q);return s==='ready'||s==='active';})||list.find(q=>qStatus(q)==='offer')||null;}
function activeQuests(){const Q=qState();return Object.keys(Q.a).map(id=>QM[id]).filter(Boolean);}
function goalText(q){const g=q.goal,n=g.n;const where=g.zone?' in '+ZONES[g.zone].n:'';
 if(g.t==='catch'&&g.sp)return `Catch ${n===1?'a':n} ${SPM[g.sp].name}`;
 if(g.t==='catch'){let s=`Catch ${n} ${g.r!=null?RAR[g.r].n+'+ ':''}${g.mut===true?'mutated ':g.mut?MUTS[g.mut].n+' ':''}fish`;if(n===1)s=s.replace('fish','fish');if(g.w)s+=` over ${g.w} kg`;if(g.night)s+=' at night';if(g.sea)s+=' from your boat at sea';if(g.ev)s+=' during a big event';return s+where;}
 if(g.t==='sell')return `Sell ${fmt(n)} coins' worth of fish`;if(g.t==='visit')return `Visit ${ZONES[g.zone].n}`;if(g.t==='relic')return 'Find some Sea Glass';if(g.t==='rod')return 'Buy a new rod';return '';}
function rewardText(rw){const p=['Mystery Crate'];if(rw.rod)p.push(RODM[rw.rod].n);if(rw.c)p.push(fmt(rw.c)+' coins');if(rw.xp)p.push(rw.xp+' XP');if(rw.bait)p.push(rw.bait[1]+'× '+BAITM[rw.bait[0]].n);if(rw.title)p.push('Title: '+rw.title);return p.join(' · ');}

/* ---------- progress ---------- */
function questEvent(type,d={}){const Q=qState();let changed=false;
 for(const id in Q.a){const q=QM[id];if(!q)continue;const g=q.goal;if(Q.a[id]>=g.n)continue;let inc=0;
  if(g.t==='catch'&&type==='catch'){if(g.zone&&d.zone!==g.zone&&d.isl!==g.zone)continue;if(g.sp&&d.sp!==g.sp)continue;if(g.r!=null&&d.r<g.r)continue;if(g.mut===true&&!d.mut)continue;if(typeof g.mut==='string'&&d.mut!==g.mut)continue;if(g.w&&d.w<g.w)continue;if(g.night&&!d.night)continue;if(g.sea&&!d.sea)continue;if(g.ev&&!d.ev)continue;inc=1;}
  else if(g.t==='sell'&&type==='sell')inc=d.v||0;else if(g.t==='visit'&&type==='visit'&&d.zone===g.zone)inc=1;else if(g.t==='relic'&&type==='relic')inc=1;else if(g.t==='rod'&&type==='rod')inc=1;
  if(inc){const was=Q.a[id];Q.a[id]=Math.min(g.n,was+inc);changed=true;if(Q.a[id]>=g.n&&was<g.n){if(q.auto)setTimeout(()=>autoTurnIn(id),900);else{toast(`Quest complete: ${q.n}. Return to ${NPCM[q.npc].name}.`,'gold');AU.level();}}}}
 if(changed){save();renderHotbar();}return changed;}
/* story-line steps pay out on the spot, then the next step starts */
function autoTurnIn(id){const q=QM[id];if(!q||qStatus(q)!=='ready')return;QH.qturn(id,true);const nx=QUESTS.find(o=>o.line&&o.line===q.line&&(o.req||[]).includes(id));
 if(nx&&qStatus(nx)==='offer'){const Q=qState();Q.a[nx.id]=0;if(nx.goal.t==='visit'&&player.zone===nx.goal.zone)Q.a[nx.id]=1;setTimeout(()=>{toast(`${q.line}: ${nx.n}. ${goalText(nx)}.`,'gold');showStory(nx);},1600);save();renderHotbar();}}
const STORYQ=[];let storyOn=false;
function showStory(q){const s=qState().a[q.id]!=null?q.offer:q.done;STORYQ.push({who:NPCM[q.npc].name,s});if(!storyOn)nextStory();}
function nextStory(){const o=STORYQ.shift();if(!o){storyOn=false;return;}storyOn=true;const el=document.createElement('div');el.className='story';el.innerHTML=`<b>${esc(o.who)}</b><span>${esc(o.s)}</span>`;document.body.appendChild(el);
 let done=false;const end=()=>{if(done)return;done=true;el.classList.add('out');setTimeout(()=>{el.remove();nextStory();},450);};setTimeout(end,Math.max(5000,o.s.length*55));el.onclick=end;}
function catchQuestInfo(){const a=activeQuests().filter(q=>q.goal.t==='catch');if(!a.length)return '';const q=a[0],v=qState().a[q.id];return `<div class="cc-q">${esc(q.n)} · ${Math.min(v,q.goal.n)}/${q.goal.n}</div>`;}
function grantTitle(t){if(!state.titles.includes(t)){state.titles.push(t);toast(`New title unlocked: ${t}`,'gold');}}
function checkLevelTitles(){for(const[l,t]of LEVEL_TITLES)if(state.level>=l)grantTitle(t);}

/* ---------- NPC dialogue + quest card (rendered into every NPC panel) ---------- */
const NPCM={};
function initNpcIndex(){for(const n of NPCS){NPCM[n.id]=n;const extra=NPC_LINES[n.id];if(extra)n.lines=Array.from(new Set([...(n.lines||[]),...extra]));}}
function questCard(n){const q=currentQuest(n.id);if(!q)return '';const s=qStatus(q),v=qState().a[q.id]||0,g=q.goal;
 const bar=s==='offer'?'':`<div class="qbar"><i style="width:${Math.min(1,v/g.n)*100}%"></i></div><div class="muted">${g.t==='sell'?fmt(Math.min(v,g.n))+' / '+fmt(g.n)+' coins':Math.min(v,g.n)+' / '+g.n}</div>`;
 const btn=s==='offer'?`<button class="btn mint" data-act="qaccept" data-id="${q.id}">Accept quest</button>`:s==='ready'?`<button class="btn" data-act="qturn" data-id="${q.id}">Turn in · ${esc(rewardText(q.rw))}</button>`:'';
 return `<div class="qrow ${s==='ready'?'done':''}"><div class="row"><div class="grow"><h3>${s==='offer'?'New quest: ':''}${esc(q.n)}</h3><div class="muted">${esc(goalText(q))}</div></div>${btn}</div>${bar}${s!=='ready'?`<div class="qrew">Reward: ${esc(rewardText(q.rw))}</div>`:''}</div>`;}
function npcDialogue(n){const q=currentQuest(n.id),s=q&&qStatus(q);const text=q?(s==='offer'?q.offer:s==='ready'?q.done:q.prog):pick(n.lines||['Hello there!']);
 return `<div class="say"><span class="who">${esc(n.name)}</span>${esc(text)}</div>`;}
/* the NPC shop panels put ${line} at the top; this object re-renders the dialogue and quest card every time */
function npcSay(n){const fixed=pick(n.lines||['Hello there!']);return{toString(){const q=currentQuest(n.id);return (q?npcDialogue(n):`<div class="say"><span class="who">${esc(n.name)}</span>${esc(fixed)}</div>`)+questCard(n);}};}
const QH={qaccept:id=>{const q=QM[id];if(!q||qStatus(q)!=='offer')return;const Q=qState();Q.a[id]=0;
  if(q.goal.t==='visit'&&player.zone===q.goal.zone)Q.a[id]=1;if(q.goal.t==='rod'&&state.rods.length>1)Q.a[id]=0;
  AU.ui();toast(`Quest accepted: ${q.n}`);save();renderHotbar();rerender();},
 qturn:(id,auto)=>{const q=QM[id];if(!q||qStatus(q)!=='ready')return;const Q=qState();delete Q.a[id];Q.d.push(id);const rw=q.rw;if(rw.rod&&!state.rods.includes(rw.rod)){state.rods.push(rw.rod);setTimeout(()=>toast(`New rod: ${RODM[rw.rod].n}! Equip it from any rodmaker or your hotbar.`,'gold'),1200);}if(auto===true&&q.done)showStory(Object.assign({},q,{offer:q.done}));
  if(rw.c){state.coins+=rw.c;state.earned+=rw.c;}if(rw.bait){state.bait[rw.bait[0]]=(state.bait[rw.bait[0]]||0)+rw.bait[1];if(!state.baitOn)state.baitOn=rw.bait[0];}if(rw.title)grantTitle(rw.title);
  if(rw.xp)gainXP(rw.xp);AU.coin();AU.level();toast(`${q.n} complete! ${rewardText(rw)}`,'gold');setTimeout(()=>grantCrate('finishing '+q.n),1800);save();updateHUD();if(typeof panelCtx!=='undefined'&&panelCtx)rerender();}};

/* ---------- quest log ---------- */
function openQuests(){if(JOIN.on)return;openPanel('Quests','Help the islanders and earn rewards',()=>{panelCtx.kind='quests';const act=activeQuests(),Q=qState();
 const avail=NPCS.map(n=>({n,q:currentQuest(n.id)})).filter(o=>o.q&&qStatus(o.q)==='offer');
 const row=q=>{const v=Q.a[q.id]||0,g=q.goal,done=v>=g.n;return `<div class="qrow ${done?'done':''}"><div class="row"><div class="grow"><h3>${esc(q.n)}</h3><div class="muted">${esc(goalText(q))} · ${esc(NPCM[q.npc].name)}, ${esc(ZONES[NPCM[q.npc].zone].n)}</div></div><span class="muted">${g.t==='sell'?fmt(Math.min(v,g.n))+'/'+fmt(g.n):Math.min(v,g.n)+'/'+g.n}</span></div><div class="qbar"><i style="width:${Math.min(1,v/g.n)*100}%"></i></div><div class="qrew">${done?'Ready to turn in to '+esc(NPCM[q.npc].name):'Reward: '+esc(rewardText(q.rw))}</div></div>`;};
 body(`<div class="card"><h3>Active</h3>${act.length?`<div class="list">${act.map(row).join('')}</div>`:'<div class="muted">No active quests. Talk to the islanders: anyone with work for you will say so.</div>'}</div>
  ${avail.length?`<div class="card"><h3>Islanders with work for you</h3><div class="list">${avail.map(o=>`<div class="statrow"><span>${esc(o.n.name)} · ${esc(ZONES[o.n.zone].n)}</span><span class="muted">${esc(o.q.n)}</span></div>`).join('')}</div></div>`:''}
  <div class="card"><h3>Your title</h3><div class="muted">Shown under your name. ${Q.d.length} of ${QUESTS.length} quests complete.</div><div class="hats">${state.titles.map(t=>`<button class="hat ${state.title===t?'on':''}" data-act="title" data-id="${esc(t)}" style="color:${TITLE_COL[t]||'#fff'}">${esc(t)}</button>`).join('')}</div></div>`);
 bindPanel({title:id=>{if(state.titles.includes(id)){state.title=id;save();rebuildPlayerTag();rerender();}}});});}
