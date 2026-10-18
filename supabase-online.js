document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),SUPABASE_URL='https://qhakagliayozwviqkklw.supabase.co',SUPABASE_KEY='sb_publishable_YPMhL1PcQrZO8e6a_Py8kQ_sB57lKyO',sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const ROLES={
'Joueur Gamer':['🎮','BONS','Aucun pouvoir.'],'Loup Gamer':['🐺','HACKERS','Choisit une victime chaque nuit.'],'Healer':['❤️‍🩹','BONS','Protège un joueur chaque nuit.'],'Stratège':['🧠','BONS','Peut annuler une élimination par vote.'],'Support':['🤝','BONS','Protège une fois.'],'Analyste':['🔎','BONS','Découvre secrètement un camp.'],'Speedrunner':['⚡','BONS','Peut utiliser un vote double une fois.'],'Hacker':['💻','HACKERS','Bloque un pouvoir une fois.'],'Saboteur':['🧨','HACKERS','Déclenche un faux événement une fois.'],'Solo Player':['🎭','SOLO','Choisit une mission secrète.'],'Manipulateur':['🎭','SOLO','Gagne lorsqu’il reste 3 joueurs.'],'Chaos':['🌀','SOLO','Gagne si ses 2 cibles secrètes meurent.'],'Opportuniste':['🎯','SOLO','Peut changer son vote 2 fois et gagne avec le camp victorieux.'],'Boss Final':['👑','SOLO','Gagne s’il est le dernier vivant.'],'Traître':['🗡️','BONS','Rejoint les HACKERS au tour 3.']};
const NARUTO_ROLES={'Naruto':['🍥','VILLAGE','Voyant : découvre le camp d’un joueur chaque nuit.'],'Sasuke':['⚡','VILLAGE','Enquêteur : découvre si un joueur possède un pouvoir actif.'],'Sakura':['🌸','VILLAGE','Médecin : protège un joueur pendant la nuit.'],'Jiraiya':['🐸','VILLAGE','Informateur : enquête une fois par partie.'],'Kakashi':['👁️','VILLAGE','Gardien : protège un joueur pendant la nuit.'],'Kiba':['🐺','VILLAGE','Pisteur : peut suivre la trace d’un joueur.'],'Shikamaru':['🧠','VILLAGE','Stratège : peut annuler une élimination par vote une fois.'],'Choji':['🍖','VILLAGE','Protecteur : protège un joueur pendant la nuit.'],'Shino':['🪲','VILLAGE','Observateur : observe l’activité d’un joueur.'],'Hinata':['👁️','VILLAGE','Sentinelle : surveille un joueur pendant la nuit.'],'Rock Lee':['🥋','VILLAGE','Duelliste : peut provoquer un duel une fois par partie.'],'Might Guy':['🔥','VILLAGE','Mentor : renforce le pouvoir d’un allié une fois.'],'Gamabunta':['🐸','VILLAGE','Protecteur : protège un joueur pendant la nuit.'],'Tsunade':['💚','VILLAGE','Grande soigneuse : peut sauver un joueur une fois.'],'Temari':['🌪️','VILLAGE','Éclaireuse : obtient une information sur un joueur.'],'Gaara':['🏜️','VILLAGE','Défenseur : peut survivre à une attaque une fois.'],'Pain':['☁️','AKATSUKI','Chef : choisit chaque nuit la victime de l’Akatsuki.'],'Obito':['🌀','AKATSUKI','Manipulateur : bloque le pouvoir d’un joueur une fois.'],'Itachi':['👁️','AKATSUKI','Illusionniste : peut falsifier une information une fois.'],'Kisame':['🦈','AKATSUKI','Chasseur : peut éliminer une cible une fois par partie.'],'Deidara':['💥','AKATSUKI','Saboteur : déclenche un faux événement une fois.'],'Sasori':['🦂','AKATSUKI','Marionnettiste : peut manipuler une action une fois.'],'Kakuzu':['💰','AKATSUKI','Survivant : résiste à une élimination une fois.'],'Hidan':['🔴','AKATSUKI','Vengeur : peut éliminer celui qui l’élimine.'],'Zetsu':['🌿','AKATSUKI','Espion : observe secrètement les actions.'],'Orochimaru':['🐍','SOLO','Expérimentateur : accomplit sa mission personnelle.'],'Madara':['🔴','SOLO','Conquérant : doit devenir le dernier camp dominant.'],'Kabuto':['🧪','SOLO','Médecin noir : accomplit sa condition secrète.'],'Kaguya':['🌙','SOLO','Déesse : doit survivre jusqu’à la fin.'],'Kurama':['🦊','SOLO','Instinct : accomplit sa condition personnelle.'],'Traître':['🗡️','VILLAGE','Commence dans le Village puis rejoint secrètement l’Akatsuki au tour 3.']};
function onlineNarutoRoles(count){
 const p={3:['Naruto','Pain','Orochimaru'],4:['Naruto','Kakashi','Itachi','Orochimaru'],5:['Naruto','Sakura','Kakashi','Itachi','Pain'],6:['Naruto','Sakura','Shikamaru','Itachi','Pain','Orochimaru'],7:['Naruto','Kakashi','Sakura','Shikamaru','Itachi','Pain','Orochimaru']};
 if(p[count])return p[count];
 const pool=['Naruto','Sasuke','Sakura','Jiraiya','Kakashi','Shikamaru','Choji','Shino','Hinata','Pain','Itachi','Kisame','Deidara','Sasori','Kakuzu','Hidan','Kurama','Madara','Kaguya','Orochimaru','Temari','Tsunade','Rock Lee','Minato','Gamabunta','Traître'];
 let roles=pool.slice(0,count);
 if(!roles.some(r=>NARUTO_ROLES[r]?.[1]==='AKATSUKI'))roles[Math.min(1,roles.length-1)]='Pain';
 return roles.sort(()=>Math.random()-.5);
}

function applyOnlineTheme(theme='gamer'){
 document.body.dataset.theme=theme;
 document.documentElement.dataset.theme=theme;
 document.title=theme==='naruto'?'Loup-Garou Naruto':'Loup-Garou Gamer';
}
function renderOnlineRoleOptions(theme='gamer'){
 const box=document.querySelector('#onlineOptions .special-box');
 if(!box)return;
 if(theme==='naruto'){
  const groups=[
   ['🍃 VILLAGE',['Naruto','Sasuke','Sakura','Jiraiya','Kakashi','Shikamaru','Choji','Shino','Hinata','Temari','Tsunade','Rock Lee','Minato','Gamabunta','Traître']],
   ['☁️ AKATSUKI',['Pain','Itachi','Kisame','Deidara','Sasori','Kakuzu','Hidan']],
   ['🟣 INDÉPENDANTS',['Kurama','Madara','Kaguya','Kabuto','Orochimaru']]
  ];
  box.innerHTML='<h3>🍥 Rôles Naruto</h3><p class="hint">Uniquement des personnages Naruto. Distribution automatique.</p>'+groups.map(g=>'<div class="role-group"><b>'+g[0]+'</b>'+g[1].filter(r=>NARUTO_ROLES[r]).map(r=>'<label class="role-option"><input type="checkbox" disabled><span>'+NARUTO_ROLES[r][0]+' <b>'+esc(r)+'</b><small>'+esc(NARUTO_ROLES[r][2])+'</small></span></label>').join('')+'</div>').join('');
  return;
 }
 const roles=['Stratège','Support','Analyste','Speedrunner','Hacker','Saboteur','Solo Player','Manipulateur','Chaos','Opportuniste','Boss Final','Traître'];
 box.innerHTML='<h3>✨ Rôles spéciaux</h3><p class="hint">Distribués aléatoirement.</p>'+roles.map(r=>'<label class="role-option"><input class="online-special-role" type="checkbox" value="'+esc(r)+'"><span>'+ROLES[r][0]+' <b>'+esc(r)+'</b><small>'+esc(ROLES[r][2])+'</small></span></label>').join('');
}

let n={host:false,room:'',roomId:null,pseudo:'',playerId:crypto.randomUUID(),channel:null,players:[],settings:{max:8,roles:[]},game:null};
const screen=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id)?.classList.add('active')};
const status=t=>[$('onlineStatus'),$('joinStatus')].forEach(e=>{if(e)e.textContent=t});
const alive=()=>n.players.filter(p=>p.alive);
const me=()=>n.players.find(p=>p.playerId===n.playerId);
const hacker=p=>p.roleName==='Loup Gamer'||p.roleName==='Hacker'||p.roleName==='Saboteur'||(p.roleName==='Traître'&&(n.game?.round||1)>=3);
const code=()=> 'L64-'+Math.random().toString(36).slice(2,8).toUpperCase();
function lobby(){if($('lobbyOptionsBtn'))$('lobbyOptionsBtn').style.display=n.host?'block':'none';if($('startOnlineGameBtn'))$('startOnlineGameBtn').style.display=n.host?'block':'none';if($('leaveOnlineBtn'))$('leaveOnlineBtn').style.display=n.host?'none':'block';if($('roomCodeDisplay'))$('roomCodeDisplay').textContent=n.room;if($('lobbyPlayers'))$('lobbyPlayers').innerHTML=n.players.map((p,i)=>'<div class="player '+(i===0?'active':'')+'"><strong>'+esc(p.pseudo)+'</strong><span>'+(i===0?'👑 Hôte':'🟢 Joueur')+'</span></div>').join('');if($('startOnlineGameBtn'))$('startOnlineGameBtn').disabled=!n.host||n.players.length<(n.settings.theme==='naruto'?3:5)}
async function load(){if(!n.roomId)return;const r=await sb.from('game_players').select('*').eq('room_id',n.roomId).order('joined_at');if(r.error)return status('❌ '+r.error.message);n.players=r.data.map(p=>({id:p.id,playerId:p.player_id,pseudo:p.pseudo,alive:p.alive,roleName:p.role_data?.roleName||null,role:p.role_data?.role||null,uses:p.role_data?.uses||{},targets:p.role_data?.targets||[]}));lobby();if(n.game)renderGame()}
function sub(){if(n.channel)sb.removeChannel(n.channel);n.channel=sb.channel('room-'+n.roomId).on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:'room_id=eq.'+n.roomId},load).on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_rooms',filter:'id=eq.'+n.roomId},p=>{n.game=p.new.state?.game||null;if(p.new.phase==='game'&&n.game){renderGame();if(n.host)hostTick(n.game)}}).subscribe()}
async function roomUpdate(game){n.game=game;await sb.from('game_rooms').update({phase:'game',state:{settings:n.settings,game},updated_at:new Date().toISOString()}).eq('id',n.roomId)}
async function create(){renderOnlineRoleOptions($('onlineTheme')?.value||'gamer');const pseudo=$('createPseudo').value.trim();if(!pseudo)return alert('⚠️ Entre ton pseudo.');n.host=true;n.pseudo=pseudo;n.room=code();n.settings={max:+($('onlinePlayerCount')?.textContent||8),roles:[...document.querySelectorAll('.online-special-role:checked')].map(x=>x.value),theme:$('onlineTheme')?.value||'gamer'};applyOnlineTheme(n.settings.theme);status('Création du salon…');const r=await sb.from('game_rooms').insert({code:n.room,host_id:n.playerId,phase:'lobby',state:{settings:n.settings}}).select().single();if(r.error)return status('❌ '+r.error.message);n.roomId=r.data.id;const e=await sb.from('game_players').insert({room_id:r.data.id,player_id:n.playerId,pseudo,is_host:true});if(e.error)return status('❌ '+e.error.message);sub();await load();screen('onlineLobby');status('🟢 Salon créé : '+n.room)}
async function join(){const pseudo=$('joinPseudo').value.trim(),c=$('roomCode').value.trim().replace(/\s+/g,'').toUpperCase();if(!pseudo||!c)return alert('⚠️ Pseudo + code requis.');status('🔎 Recherche du salon…');const r=await sb.from('game_rooms').select('*').eq('code',c).maybeSingle();if(!r.data)return status('❌ Salon introuvable.');if(r.data.phase!=='lobby')return status('❌ Partie déjà commencée.');const count=await sb.from('game_players').select('*',{count:'exact',head:true}).eq('room_id',r.data.id);if((count.count||0)>=(r.data.state?.settings?.max||8))return status('❌ Salon complet.');const e=await sb.from('game_players').insert({room_id:r.data.id,player_id:n.playerId,pseudo,is_host:false});if(e.error)return status('❌ '+e.error.message);n.host=false;n.pseudo=pseudo;n.roomId=r.data.id;n.room=r.data.code;n.settings=r.data.state?.settings||{max:8,roles:[]};applyOnlineTheme(n.settings.theme||'gamer');sub();await load();screen('onlineLobby');status('🟢 Connecté au salon.')}
async function save(){if(!n.host)return;n.settings.max=+$('onlinePlayerCount').textContent;n.settings.theme=$('onlineTheme')?.value||n.settings.theme||'gamer';applyOnlineTheme(n.settings.theme);n.settings.roles=[...document.querySelectorAll('.online-special-role:checked')].map(x=>x.value);await sb.from('game_rooms').update({state:{settings:n.settings},updated_at:new Date().toISOString()}).eq('id',n.roomId);lobby();screen('onlineLobby')}
function chooseRoles(){if(n.settings.theme==='naruto')return onlineNarutoRoles(n.players.length);let pool=['Loup Gamer','Healer',...n.settings.roles.filter(x=>ROLES[x]&&x!=='Joueur Gamer')];while(pool.length<n.players.length)pool.push('Joueur Gamer');return pool.slice(0,n.players.length).sort(()=>Math.random()-.5)}
async function start(){applyOnlineTheme(n.settings.theme||'gamer');const min=n.settings.theme==='naruto'?3:5;if(!n.host||n.players.length<min)return alert('⚠️ Il faut au moins '+min+' joueurs.');let roles=chooseRoles();for(let i=0;i<n.players.length;i++){let targets=[];if(roles[i]==='Chaos')targets=n.players.filter((_,j)=>j!==i).sort(()=>Math.random()-.5).slice(0,2).map(p=>p.playerId);await sb.from('game_players').update({alive:true,role_data:{roleName:roles[i],role:n.settings.theme==='naruto'?NARUTO_ROLES[roles[i]]:ROLES[roles[i]],uses:{},targets}}).eq('id',n.players[i].id)}await load();const game={round:1,phase:'reveal',ready:{},night:{queue:[],index:0,actions:{},blocked:[]},vote:{votes:{},changes:{}},message:'Découvrez vos rôles.'};await roomUpdate(game);renderGame()}
function roleCard(p){
 const roles=n.settings.theme==='naruto'?NARUTO_ROLES:ROLES;
 const r=roles[p.roleName]||['🎭','SOLO','Condition personnelle.'];
 const map={'Traître':'01','Solo Player':'02','Manipulateur':'02','Chaos':'02','Opportuniste':'02','Boss Final':'02','Saboteur':'03','Analyste':'04','Healer':'05','Loup Gamer':'06','Hacker':'07','Support':'08','Speedrunner':'09','Stratège':'10','Joueur Gamer':'11'};
 const card=n.settings.theme==='naruto'?null:'cartes/carte_'+(map[p.roleName]||'11')+'.png';
 const front=card?'<img id="onlineCardImage" class="card-image hidden" src="'+card+'">':'<div id="onlineCardImage" class="naruto-card-art hidden"><div class="naruto-card-icon">'+r[0]+'</div><div class="naruto-card-title">'+esc(p.roleName)+'</div><div class="naruto-card-team">'+esc(r[1])+'</div><div class="naruto-card-desc">'+esc(r[2])+'</div></div>';
 return '<div class="role-reveal"><div class="role-card-visual"><img id="onlineCardBack" class="card-image" src="cartes/dos.png">'+front+'<div class="card-flip-hint">🂠 Ta carte est face cachée</div></div><button class="primary" id="onlineRevealCard">👁️ Révéler ma carte</button><div class="night-card role-info hidden" id="onlineRoleInfo"><h3>'+r[0]+' '+esc(p.roleName)+'</h3><div class="team">'+esc(r[1])+'</div><p>'+esc(r[2])+'</p></div><button class="primary hidden" id="onlineReady">Continuer →</button></div>';
}
function renderGame(){screen('onlineGame');const p=me(),g=n.game||{};$('onlineRound').textContent='TOUR '+(g.round||1);$('onlinePhase').textContent=g.phase==='reveal'?'🎭 Rôles':g.phase==='night'?'🌙 Nuit':g.phase==='vote'?'🗳️ Vote':g.phase==='end'?'🏆 Fin':'☀️ Jour';$('onlineAlive').textContent=alive().length;$('onlinePlayers').innerHTML=n.players.map(x=>'<div class="player '+(x.alive?'active':'dead')+'"><strong>'+esc(x.pseudo)+'</strong><small>'+(x.alive?'🟢 Vivant':'⚫ Éliminé')+'</small></div>').join('');if(g.phase==='reveal'){if(!p)return;if(g.ready?.[p.playerId]){$('onlineAction').innerHTML='<div class="waiting-role"><div class="role-icon">⏳</div><h2>Carte révélée</h2><p>Tu es prêt !</p><p>En attente des autres joueurs…</p></div>';return}$('onlineAction').innerHTML=roleCard(p);$('onlineRevealCard').onclick=()=>{ $('onlineCardBack')?.classList.add('hidden');$('onlineCardImage')?.classList.remove('hidden');$('onlineRevealCard')?.classList.add('hidden');$('onlineRoleInfo')?.classList.remove('hidden');if(p.roleName==='Solo Player')showSoloMissionOnline(p);else{$('onlineAction').insertAdjacentHTML('beforeend','<button class="primary" id="onlineReady">Continuer</button>');$('onlineReady').onclick=()=>readyReveal();}}}else if(g.phase==='night')renderNight(p);else if(g.phase==='vote')renderVote(p);else if(g.phase==='day')renderDay(p);else renderEnd()}function showSoloMissionOnline(p){const ms=[['survivant','🛡️ Survivant','3 joueurs restants'],['chaos','🌀 Chaos','2 cibles éliminées'],['dernier','👑 Dernier vivant','être le dernier'],['opportuniste','🎯 Opportuniste','gagner avec le camp victorieux']];$('onlineMissionBox').innerHTML='<div class="solo-mission-box"><h3>🎯 Choisis ta mission</h3><select id="onlineSoloMission"><option value="">Choisir</option>'+ms.map(m=>'<option value="'+m[0]+'">'+m[1]+' — '+m[2]+'</option>').join('')+'</select><button class="primary" id="onlineMissionConfirm">Valider ma mission</button></div>';$('onlineMissionConfirm').onclick=async()=>{const v=$('onlineSoloMission').value;if(!v)return alert('⚠️ Choisis une mission.');let g=JSON.parse(JSON.stringify(n.game));g.soloMission=g.soloMission||{};g.soloMission[p.playerId]={mission:v,targets:v==='chaos'?n.players.filter(x=>x.playerId!==p.playerId).sort(()=>Math.random()-.5).slice(0,2).map(x=>x.playerId):[]};await roomUpdate(g);$('onlineMissionConfirm').classList.add('hidden');$('onlineMissionBox').insertAdjacentHTML('beforeend','<button class="primary" id="onlineReady">Continuer</button>');$('onlineReady').onclick=()=>readyReveal();};}
async function setGame(game){await roomUpdate(game);if(n.host)await hostTick(game)}
async function readyReveal(){let g=JSON.parse(JSON.stringify(n.game||{}));g.ready=g.ready||{};g.ready[n.playerId]=true;g.message='⏳ En attente des autres joueurs…';await roomUpdate(g);if(n.host)await hostTick(g);renderGame()}
function nightQueue(g){
 if(n.settings.theme==='naruto'){
  const order=['Obito','Naruto','Sasuke','Jiraiya','Kiba','Shino','Hinata','Sakura','Kakashi','Choji','Gamabunta','Tsunade','Temari','Gaara','Rock Lee','Might Guy','Pain','Kisame','Deidara','Sasori','Kakuzu','Hidan','Zetsu','Traître'];
  return order.map(role=>alive().find(p=>p.roleName===role&&(!p.uses?.power)&&(!g.night?.blocked||!g.night.blocked.includes(p.playerId))&&((role!=='Traître'&&role!=='Pain')||g.round>=3))).filter(Boolean).map(p=>({id:p.playerId,type:p.roleName}));
 }
 let q=[];const addRole=r=>{const p=alive().find(x=>x.roleName===r);if(p&&!p.uses?.used)return q.push({id:p.playerId,type:r})};addRole('Hacker');addRole('Saboteur');addRole('Analyste');addRole('Support');let wolves=alive().filter(x=>x.roleName==='Loup Gamer'||(x.roleName==='Traître'&&g.round>=3));wolves.forEach(p=>q.push({id:p.playerId,type:'wolf'}));addRole('Healer');return q
}
async function startNight(g){g.phase='night';g.night={queue:nightQueue(g),index:0,actions:{},blocked:[]};g.message=n.settings.theme==='naruto'?'🌙 La nuit tombe sur le Village…':'🌙 La nuit tombe…';await setGame(g)}
function actor(){const a=n.game?.night?.queue?.[n.game.night.index];return a?n.players.find(p=>p.playerId===a.id):null}
function renderNight(p){const a=actor();if(n.settings.theme==='naruto'){if(!a){$('onlineAction').innerHTML='<div class="night-card"><h3>🌙 Nuit du Village</h3><p>Le maître du jeu prépare la suite…</p></div>';return}if(p?.playerId!==a.playerId){$('onlineAction').innerHTML='<div class="night-card"><h3>🌙 Nuit ninja</h3><p>Un autre shinobi agit. Attends ton tour…</p></div>';return}const type=n.game.night.queue[n.game.night.index].type;const r=NARUTO_ROLES[p.roleName]||['⚡','VILLAGE','Pouvoir ninja.'];const targets=alive().filter(x=>x.playerId!==p.playerId);$('onlineAction').innerHTML='<div class="night-card"><h3>'+r[0]+' '+esc(p.roleName)+'</h3><p>'+esc(r[2])+'</p><select id="nightTarget"><option value="">Choisir une cible</option>'+targets.map(x=>'<option value="'+x.playerId+'">'+esc(x.pseudo)+'</option>').join('')+'</select><button class="primary" id="nightConfirm">⚡ Utiliser</button><button class="secondary" id="nightSkip">Passer</button></div>';$('nightConfirm').onclick=()=>{const t=$('nightTarget').value;if(!t)return alert('⚠️ Choisis une cible.');let g=JSON.parse(JSON.stringify(n.game));g.night.actions[p.playerId]={type,target:t};g.night.index++;roomUpdate(g)};$('nightSkip').onclick=()=>{let g=JSON.parse(JSON.stringify(n.game));g.night.index++;roomUpdate(g)};return}if(!a){$('onlineAction').innerHTML='<div class="night-card"><h3>🌙 Nuit</h3><p>Le maître du jeu prépare la suite…</p></div>';return}if(p?.playerId!==a.playerId){$('onlineAction').innerHTML='<div class="night-card"><h3>🌙 Nuit</h3><p>Un autre joueur agit. Attends ton tour…</p></div>';return}const type=n.game.night.queue[n.game.night.index].type;if(p.uses?.[type==='wolf'?'wolf':type]){if(n.host)hostTick(n.game);return}let targets=alive().filter(x=>type==='Support'||type==='wolf'?true:x.playerId!==p.playerId);let opts=targets.map(x=>'<option value="'+x.playerId+'">'+esc(x.pseudo)+'</option>').join('');let title={Hacker:'💻 Hacker',Saboteur:'🧨 Saboteur',Analyste:'🔎 Analyste',Support:'🤝 Support',wolf:'🐺 Choisis une victime',Healer:'❤️‍🩹 Healer'}[type]||type;if(type==='Saboteur'){$('onlineAction').innerHTML='<div class="night-card"><h3>🧨 Saboteur</h3><p>Déclencher le faux événement ?</p><button class="primary" id="sabotageConfirm">🧨 Saboter</button></div>';$('sabotageConfirm').onclick=()=>submitNightAction(p,'Saboteur','1');return} $('onlineAction').innerHTML='<div class="night-card"><h3>'+title+'</h3><p>Choisis une cible.</p><select id="nightTarget"><option value="">Choisir</option>'+opts+'</select><button class="primary" id="nightConfirm">Valider</button></div>';$('nightConfirm').onclick=()=>{let t=$('nightTarget').value;if(!t)return alert('⚠️ Choisis une cible.');submitNightAction(p,type,t)}}
async function submitNightAction(p,type,target){let g=JSON.parse(JSON.stringify(n.game));g.night.actions[p.playerId]={type,target};if(type==='Hacker')g.night.blocked.push(target);g.night.index++;await setGame(g)}
async function hostTick(g){if(!n.host)return;if(g.phase==='reveal'){if(Object.keys(g.ready||{}).length>=n.players.length)await startNight(g);return}if(g.phase==='night'){let q=g.night.queue;if(g.night.index>=q.length){let victim=null,prot=null;Object.values(g.night.actions).forEach(a=>{if(a.type==='wolf')victim=a.target;if(a.type==='Healer'||a.type==='Support')prot=a.target});if(victim&&victim!==prot){let v=n.players.find(p=>p.playerId===victim);if(v){await sb.from('game_players').update({alive:false}).eq('id',v.id);v.alive=false;g.message='☠️ '+v.pseudo+' a été éliminé pendant la nuit.'}}else g.message='🌙 Personne n’a été éliminé cette nuit.';await load();let w=winner();if(w){await finish(w,g);return}g.phase='day';await roomUpdate(g);setTimeout(()=>{if(n.host)startVote(g)},1000)}}else if(g.phase==='vote'&&Object.keys(g.vote.votes||{}).length>=alive().length)await resolveVote(g)}
$('leaveOnlineBtn')?.addEventListener('click',async()=>{if(!n.roomId)return;const ok=confirm('Quitter ce salon ?');if(!ok)return;await sb.from('game_players').delete().eq('room_id',n.roomId).eq('player_id',n.playerId);if(n.channel)await sb.removeChannel(n.channel);n.roomId=null;n.room='';n.players=[];n.game=null;screen('online');status('');});$('onlineBtn')?.addEventListener('click',()=>screen('online'));$('onlineTheme')?.addEventListener('change',()=>{applyOnlineTheme($('onlineTheme').value);renderOnlineRoleOptions($('onlineTheme').value);});$('createOnlineBtn')?.addEventListener('click',()=>screen('onlineCreate'));$('joinOnlineBtn')?.addEventListener('click',()=>screen('onlineJoin'));$('createRoomBtn')?.addEventListener('click',create);$('joinRoomBtn')?.addEventListener('click',join);$('saveOnlineOptionsBtn')?.addEventListener('click',save);$('startOnlineGameBtn')?.addEventListener('click',start);$('lobbyOptionsBtn')?.addEventListener('click',()=>{renderOnlineRoleOptions(n.settings.theme||'gamer');screen('onlineOptions')});$('onlineMinusPlayers')?.addEventListener('click',()=>{const e=$('onlinePlayerCount');e.textContent=Math.max(n.settings.theme==='naruto'?3:5,+e.textContent-1)});$('onlinePlusPlayers')?.addEventListener('click',()=>{const e=$('onlinePlayerCount');e.textContent=Math.min(20,+e.textContent+1)});document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>screen(b.dataset.screen||'home')));

function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
const isNaruto=()=>n.settings?.theme==='naruto';
const nameOf=id=>n.players.find(x=>x.playerId===id)?.pseudo||'?';
const panel=html=>{$('onlineAction').innerHTML=html};

/* ---------- Camps et conditions de victoire ---------- */

function bad(p){
  if(isNaruto())return NARUTO_ROLES[p.roleName]?.[1]==='AKATSUKI'||(p.roleName==='Traître'&&(n.game?.round||1)>=3);
  return hacker(p);
}
function isSolo(p){return ((isNaruto()?NARUTO_ROLES:ROLES)[p.roleName]||[])[1]==='SOLO'}
const isDead=id=>!n.players.find(x=>x.playerId===id)?.alive;

function winner(){
  const g=n.game||{},a=alive();
  if(!a.length)return 'PERSONNE';
  if(isNaruto()){
    const ak=a.filter(bad).length,good=a.filter(p=>!bad(p)&&!isSolo(p)).length,has=r=>a.some(p=>p.roleName===r);
    if(has('Kaguya')&&a.length===1)return 'KAGUYA';
    if(has('Orochimaru')&&a.length===1)return 'OROCHIMARU';
    if(has('Madara')&&ak===0&&a.length<=3)return 'MADARA';
    if(ak===0)return 'VILLAGE';
    if(ak>=good)return 'AKATSUKI';
    return null;
  }
  if(a.find(p=>p.roleName==='Manipulateur')&&a.length<=3)return 'MANIPULATEUR';
  const c=a.find(p=>p.roleName==='Chaos');
  if(c&&c.targets?.length===2&&c.targets.every(isDead))return 'CHAOS';
  if(a.find(p=>p.roleName==='Boss Final')&&a.length===1)return 'BOSS FINAL';
  const s=a.find(p=>p.roleName==='Solo Player'),sm=s&&g.soloMission?.[s.playerId];
  if(sm){
    if(sm.mission==='survivant'&&a.length<=3)return 'SOLO PLAYER';
    if(sm.mission==='dernier'&&a.length===1)return 'SOLO PLAYER';
    if(sm.mission==='chaos'&&sm.targets?.length===2&&sm.targets.every(isDead))return 'SOLO PLAYER';
  }
  const h=a.filter(hacker).length,good=a.filter(p=>!hacker(p)&&!isSolo(p)).length;
  if(h===0)return 'BONS';
  if(h>=good)return 'HACKERS';
  return null;
}

const WIN={
  BONS:['🛡️','Victoire des BONS !','Tous les Hackers ont été éliminés.'],
  HACKERS:['🐺','Victoire des HACKERS !','Les Hackers ont pris le dessus.'],
  MANIPULATEUR:['🎭','Victoire du MANIPULATEUR !','Il a survécu jusqu’à 3 joueurs.'],
  CHAOS:['🌀','Victoire du CHAOS !','Ses deux cibles sont éliminées.'],
  'BOSS FINAL':['👑','Victoire du BOSS FINAL !','Il est le dernier joueur vivant.'],
  'SOLO PLAYER':['🎭','Victoire du SOLO PLAYER !','Mission accomplie.'],
  VILLAGE:['🍃','Victoire du VILLAGE !','Tous les membres de l’Akatsuki sont éliminés.'],
  AKATSUKI:['☁️','Victoire de l’AKATSUKI !','L’Akatsuki est devenue majoritaire.'],
  KAGUYA:['🌙','Victoire de KAGUYA !','Elle est la dernière survivante.'],
  MADARA:['🔴','Victoire de MADARA !','Il a rempli sa condition.'],
  OROCHIMARU:['🐍','Victoire d’OROCHIMARU !','Il est le dernier survivant.'],
  PERSONNE:['💀','Personne ne gagne','Tout le monde est éliminé.']
};

async function finish(w,g,msg){
  if(g.phase==='end')return;
  g.phase='end';g.winner=w;
  if(msg)g.message=msg;
  await roomUpdate(g);
}

/* ---------- Écriture dans la ligne d'un joueur (sans conflit) ---------- */

async function setUses(p,patch){
  if(!p)return;
  p.uses={...(p.uses||{}),...patch};
  const r=await sb.from('game_players').update({role_data:{roleName:p.roleName,role:p.role,targets:p.targets||[],uses:p.uses}}).eq('id',p.id);
  if(r.error)alert('❌ '+r.error.message);
}
const setMine=patch=>setUses(me(),patch);

/* ---------- Remplacements ---------- */

async function load(){
  if(!n.roomId)return;
  const r=await sb.from('game_players').select('*').eq('room_id',n.roomId).order('joined_at');
  if(r.error)return status('❌ '+r.error.message);
  n.players=r.data.map(p=>({id:p.id,playerId:p.player_id,pseudo:p.pseudo,alive:p.alive,roleName:p.role_data?.roleName||null,role:p.role_data?.role||null,uses:p.role_data?.uses||{},targets:p.role_data?.targets||[]}));
  lobby();
  if(n.game){
    if(n.game.phase==='reveal'){n.game.ready=n.game.ready||{};n.players.forEach(x=>{if(x.uses?.ready)n.game.ready[x.playerId]=true})}
    renderGame();
    if(n.host)hostTick(n.game);
  }
}

async function readyReveal(){
  await setMine({ready:true});
  if(n.game){n.game.ready=n.game.ready||{};n.game.ready[n.playerId]=true}
  renderGame();
  if(n.host)hostTick(n.game);
}

/* hostTick : seul l'hôte fait avancer la partie, un pas à la fois */
async function hostTick(g){
  if(!n.host)return;
  if(n.busy){n.again=true;return}
  n.busy=true;
  try{
    do{n.again=false;await tickOnce(n.game||g)}while(n.again);
  }catch(e){console.error('[hostTick]',e)}
  finally{n.busy=false}
}

async function tickOnce(g){
  if(!g)return;
  if(g.phase==='reveal'){
    if(n.players.length&&n.players.every(p=>p.uses?.ready))await startNight(g);
    return;
  }
  if(g.phase==='night'){
    if(g.night.index<g.night.queue.length)return;
    await resolveNight(g);
    return;
  }
  if(g.phase==='vote')await resolveVote(g);
}

/* ---------- Nuit -> jour ---------- */

async function resolveNight(g){
  const acts=g.night.actions||{},blocked=g.night.blocked||[];
  let victim=null;const prot=[];
  Object.entries(acts).forEach(([pid,a])=>{
    if(blocked.includes(pid)&&a.type!=='Hacker')return; /* pouvoir bloqué */
    if(['wolf','Pain','Traître'].includes(a.type))victim=a.target;
    if(['Healer','Support','Sakura','Kakashi','Choji','Gamabunta','Tsunade'].includes(a.type))prot.push(a.target);
  });
  let msg;
  if(victim&&!prot.includes(victim)){
    const v=n.players.find(x=>x.playerId===victim);
    if(v){await sb.from('game_players').update({alive:false}).eq('id',v.id);v.alive=false;msg='☠️ '+v.pseudo+' a été éliminé pendant la nuit.'}
  }
  if(!msg)msg=victim?'🛡️ Une attaque a été repoussée cette nuit.':'🌙 Personne n’a été éliminé cette nuit.';
  g.message=msg;
  const w=winner();
  if(w)return finish(w,g,msg);
  g.phase='day';g.dayKind='night';
  await roomUpdate(g);
  await sleep(5000);
  await startVote(n.game);
}

function renderDay(p){
  const g=n.game;let extra='';
  if(g.dayKind!=='vote'){
    const a=p&&g.night?.actions?.[p.playerId];
    if(a&&(a.type==='Analyste'||a.type==='Naruto')){
      const t=n.players.find(x=>x.playerId===a.target);
      if(t)extra+='<p>🔎 Résultat secret : <b>'+esc(t.pseudo)+'</b> est dans le camp <b>'+(bad(t)?(isNaruto()?'AKATSUKI':'HACKER'):(isNaruto()?'VILLAGE':'BON'))+'</b>.</p>';
    }
    if(Object.values(g.night?.actions||{}).some(x=>x.type==='Saboteur'))extra+='<p>🚨 Fausse alerte détectée… personne ne sait qui ment.</p>';
  }
  panel('<div class="night-card"><h3>'+(g.dayKind==='vote'?'📊 Résultat du vote':'☀️ Le jour se lève')+'</h3><p>'+esc(g.message||'')+'</p>'+extra+'</div>');
}

/* ---------- Vote ---------- */

async function startVote(g){
  if(!g||g.phase!=='day')return;
  g.phase='vote';g.vote={pending:null};
  g.message='🗳️ Votez pour éliminer un suspect.';
  await roomUpdate(g);
}

function renderVote(p){
  const g=n.game,pd=g.vote?.pending;
  if(!p||!p.alive)return panel('<div class="night-card"><h3>👻 Tu es éliminé</h3><p>Observe la suite de la partie.</p></div>');

  if(pd){
    if(p.playerId===pd.strat){
      panel('<div class="night-card"><h3>🧠 Stratège</h3><p>Le vote va éliminer <b>'+esc(nameOf(pd.victim))+'</b>. Une fois par partie, tu peux annuler.</p><button class="primary" id="stratYes">🧠 Annuler l’élimination</button><button class="secondary" id="stratNo">Laisser faire</button></div>');
      $('stratYes').onclick=()=>stratDecide('cancel');
      $('stratNo').onclick=()=>stratDecide('allow');
    }else{
      panel('<div class="night-card"><h3>🧠 Le Stratège décide…</h3><p>Attends sa décision.</p>'+(n.host?'<button class="secondary" id="stratSkip">Passer (le Stratège ne répond pas)</button>':'')+'</div>');
      if(n.host)$('stratSkip').onclick=()=>stratDecide('allow');
    }
    return;
  }

  const mine=p.uses?.vote?.round===g.round?p.uses.vote:null;
  const voted=alive().filter(x=>x.uses?.vote?.round===g.round).length;
  const canChange=p.roleName==='Opportuniste'&&(mine?.changes||0)<2;
  const double=p.roleName==='Speedrunner'&&!p.uses?.doubleUsed&&!mine;
  const prev=$('voteTarget')?.value;
  const opts=alive().filter(x=>x.playerId!==p.playerId).map(x=>'<option value="'+x.playerId+'">'+esc(x.pseudo)+'</option>').join('');

  let html='<div class="night-card vote-card"><h3>🗳️ Vote</h3><p>'+voted+'/'+alive().length+' ont voté.</p>';
  if(mine&&!canChange){
    html+='<p>✅ Tu as voté pour <b>'+esc(nameOf(mine.target))+'</b>. En attente des autres…</p></div>';
    panel(html);return;
  }
  html+=mine?'<p>Vote actuel : <b>'+esc(nameOf(mine.target))+'</b>. Tu peux encore le changer '+(2-(mine.changes||0))+' fois.</p>':'<p>Choisis qui éliminer.</p>';
  if(double)html+='<p>⚡ Ton vote comptera double.</p>';
  html+='<select id="voteTarget"><option value="">Choisir un joueur</option>'+opts+'</select><button class="primary" id="voteConfirm">'+(mine?'🔄 Changer mon vote':'🗳️ Valider mon vote')+'</button></div>';
  panel(html);
  if(prev)$('voteTarget').value=prev;

  $('voteConfirm').onclick=async()=>{
    const t=$('voteTarget').value;
    if(!t)return alert('⚠️ Choisis un joueur.');
    const weight=double?2:(mine?.weight||1);
    await setMine({vote:{round:g.round,target:t,weight,changes:mine?(mine.changes||0)+1:0},doubleUsed:p.uses?.doubleUsed||weight===2});
    renderGame();
    if(n.host)hostTick(n.game);
  };
}

async function stratDecide(d){
  const g=JSON.parse(JSON.stringify(n.game));
  g.vote.pending.decision=d;
  await roomUpdate(g);
}

async function resolveVote(g){
  const al=alive();

  /* Le Stratège a déjà été consulté ? */
  if(g.vote?.pending){
    const pd=g.vote.pending;
    if(!pd.decision)return;
    if(pd.decision==='cancel'){
      await setUses(n.players.find(x=>x.playerId===pd.strat),{strategyUsed:true});
      return endVote(g,null,'🧠 Le Stratège a annulé l’élimination de '+nameOf(pd.victim)+'.');
    }
    return endVote(g,pd.victim);
  }

  /* Tout le monde a voté ? */
  const voted=al.filter(p=>p.uses?.vote?.round===g.round);
  if(voted.length<al.length)return;

  const c={};
  voted.forEach(p=>{const v=p.uses.vote;c[v.target]=(c[v.target]||0)+(v.weight||1)});
  const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  if(!e.length||(e[1]&&e[1][1]===e[0][1]))return endVote(g,null,'⚖️ Égalité : personne n’est éliminé.');

  const victim=e[0][0];
  const strat=al.find(p=>['Stratège','Shikamaru'].includes(p.roleName)&&!p.uses?.strategyUsed);
  if(strat){
    g.vote.pending={victim,strat:strat.playerId,decision:null};
    g.message='🧠 Le Stratège peut annuler l’élimination…';
    await roomUpdate(g);
    return;
  }
  return endVote(g,victim);
}

async function endVote(g,victimId,msg){
  if(victimId){
    const v=n.players.find(x=>x.playerId===victimId);
    if(v){await sb.from('game_players').update({alive:false}).eq('id',v.id);v.alive=false;msg='☠️ '+v.pseudo+' est éliminé par le vote.'}
  }
  g.vote={pending:null};
  const w=winner();
  if(w)return finish(w,g,msg);
  g.phase='day';g.dayKind='vote';g.message=msg||'Le vote est terminé.';
  await roomUpdate(g);
  await sleep(5000);
  const g2=n.game;
  g2.round++;
  await startNight(g2);
}

/* ---------- Fin de partie ---------- */

function renderEnd(){
  const g=n.game,w=g.winner,t=WIN[w]||['🏆','Victoire !',''];
  const op=n.players.find(p=>p.roleName==='Opportuniste'&&p.alive);
  const bonus=op&&['BONS','HACKERS','VILLAGE','AKATSUKI'].includes(w)?' L’Opportuniste gagne aussi avec le camp victorieux.':'';
  panel('<div class="night-card"><h2>'+t[0]+' '+esc(t[1])+'</h2><p>'+esc(t[2]+bonus)+'</p><div class="players-grid">'
    +n.players.map(p=>'<div class="player '+(p.alive?'active':'dead')+'"><strong>'+(p.alive?'🟢':'⚫')+' '+esc(p.pseudo)+'</strong><small>'+(p.role?.[0]||'🎭')+' '+esc(p.roleName||'?')+'</small></div>').join('')
    +'</div><button class="primary" id="onlineQuit">🏠 Retour à l’accueil</button></div>');
  $('onlineQuit').onclick=()=>location.reload();
}
});
