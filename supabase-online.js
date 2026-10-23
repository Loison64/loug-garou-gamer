/* =====================================================================
   supabase-online.js — Mode en ligne (plusieurs appareils, via Supabase)

   Principe anti-conflit :
   - Seul l'HÔTE écrit l'état de la partie (table game_rooms, colonne state)
     et la colonne alive des joueurs.
   - Chaque joueur n'écrit QUE sa propre ligne (game_players.role_data.input) :
     "prêt", action de nuit, vote, décision du Stratège, mission du Solo Player.
   - L'hôte lit ces entrées et fait avancer la partie.
   Les règles sont dans regles.js (window.LG).
   ===================================================================== */
document.addEventListener('DOMContentLoaded',()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=LG.escapeHtml;
const SUPABASE_URL='https://qhakagliayozwviqkklw.supabase.co';
const SUPABASE_KEY='sb_publishable_YPMhL1PcQrZO8e6a_Py8kQ_sB57lKyO';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const PREFIX='L64-';
const DAY_DELAY=8000,VOTE_RESULT_DELAY=6000;

const n={host:false,room:'',roomId:null,pseudo:'',playerId:crypto.randomUUID(),channel:null,
  players:[],settings:{max:8,roles:[],theme:'gamer'},game:null,busy:false,again:false,viewKey:'',timerKey:''};

const screen=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id)?.classList.add('active')};
const status=t=>[$('onlineStatus'),$('joinStatus')].forEach(e=>{if(e)e.textContent=t});
const theme=()=>n.settings.theme||'gamer';
const alive=()=>LG.alive(n.players);
const P=id=>LG.byId(n.players,id);
const me=()=>P(n.playerId);
const panel=html=>{$('onlineAction').innerHTML=html};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function applyTheme(t){document.body.dataset.theme=t;document.documentElement.dataset.theme=t;document.title=t==='naruto'?'Loup-Garou Naruto':'Loup-Garou Gamer'}
const shortCode=c=>String(c||'').replace(PREFIX,'');
function normalizeCode(c){c=String(c||'').replace(/\s+/g,'').toUpperCase();if(!c.startsWith(PREFIX))c=PREFIX+c.replace(/^L64-?/,'');return c}

/* ---------- Options du salon ---------- */
function renderRoleOptions(){
  const box=document.querySelector('#onlineOptions .special-box');if(!box)return;
  if(theme()==='naruto'){
    box.innerHTML='<h3>🍥 Rôles Naruto</h3><p class="hint">Distribution automatique selon le nombre de joueurs.</p>'+
      LG.NARUTO_GROUPS.map(g=>'<div class="role-group"><b>'+g[0]+'</b>'+g[1].map(r=>{const d=LG.def('naruto',r);return'<label class="role-option"><span>'+d.icon+' <b>'+esc(r)+'</b><small>'+esc(d.desc)+'</small></span></label>'}).join('')+'</div>').join('');
    return;
  }
  const on=new Set(n.settings.roles||[]);
  box.innerHTML='<h3>✨ Rôles spéciaux</h3><p class="hint">Le Loup Gamer et le Healer sont toujours présents. Les rôles sont distribués aléatoirement.</p>'+
    LG.GAMER_SPECIALS.map(r=>{const d=LG.def('gamer',r);return'<label class="role-option"><input class="online-special-role" type="checkbox" value="'+esc(r)+'"'+(on.has(r)?' checked':'')+'><span>'+d.icon+' <b>'+esc(r)+'</b><small>'+esc(d.desc)+'</small></span></label>'}).join('');
}

/* ---------- Salon ---------- */
function lobby(){
  const h=n.host;
  if($('lobbyOptionsBtn'))$('lobbyOptionsBtn').style.display=h?'block':'none';
  if($('startOnlineGameBtn')){$('startOnlineGameBtn').style.display=h?'block':'none';$('startOnlineGameBtn').disabled=n.players.length<LG.minPlayers(theme())}
  if($('leaveOnlineBtn'))$('leaveOnlineBtn').style.display=h?'none':'block';
  if($('roomCodeDisplay'))$('roomCodeDisplay').textContent=shortCode(n.room);
  if($('lobbyPlayers'))$('lobbyPlayers').innerHTML=n.players.map(p=>'<div class="player '+(p.isHost?'active':'')+'"><strong>'+esc(p.name)+'</strong><br><small>'+(p.isHost?'👑 Hôte':'🟢 Joueur')+'</small></div>').join('')+
    '<p class="hint">'+n.players.length+'/'+n.settings.max+' joueurs — minimum '+LG.minPlayers(theme())+'.</p>';
}
async function load(){
  if(!n.roomId)return;
  const r=await sb.from('game_players').select('*').eq('room_id',n.roomId).order('joined_at');
  if(r.error)return status('❌ '+r.error.message);
  n.players=r.data.map(p=>{const d=p.role_data||{},input=d.input||{};return{rowId:p.id,id:p.player_id,name:p.pseudo,alive:p.alive!==false,isHost:p.is_host,
    roleName:d.roleName||null,targets:d.targets||[],input,soloMission:input.soloMission||null,soloTargets:input.soloTargets||[]}});
  if(n.roomId&&!me()&&n.game){status('⚠️ Tu as été retiré du salon.')}
  if(!n.game||n.game.phase==='lobby')lobby();
  else{renderGame();if(n.host)hostTick()}
}
function subscribe(){
  if(n.channel)sb.removeChannel(n.channel);
  n.channel=sb.channel('room-'+n.roomId)
    .on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:'room_id=eq.'+n.roomId},()=>load())
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_rooms',filter:'id=eq.'+n.roomId},payload=>{
      const st=payload.new.state||{};
      if(st.settings)n.settings=st.settings;
      applyTheme(theme());
      if(payload.new.phase==='game'&&st.game){
        if(!n.host||!n.game||(st.game.seq||0)>=(n.game.seq||0))n.game=st.game;
        renderGame();if(n.host)hostTick();
      }else lobby();
    }).subscribe();
}
async function roomUpdate(game){
  game.seq=(game.seq||0)+1;n.game=game;
  const r=await sb.from('game_rooms').update({phase:'game',state:{settings:n.settings,game},updated_at:new Date().toISOString()}).eq('id',n.roomId);
  if(r.error)console.error('[roomUpdate]',r.error);
  renderGame();
}
async function setMine(patch){
  const p=me();if(!p)return;
  p.input={...p.input,...patch};
  if(patch.soloMission!==undefined)p.soloMission=patch.soloMission;
  if(patch.soloTargets!==undefined)p.soloTargets=patch.soloTargets;
  const r=await sb.from('game_players').update({role_data:{roleName:p.roleName,targets:p.targets,input:p.input}}).eq('id',p.rowId);
  if(r.error)alert('❌ '+r.error.message);
  renderGame();
  if(n.host)hostTick();
}

async function create(){
  const pseudo=$('createPseudo').value.trim();
  if(!pseudo)return alert('⚠️ Entre ton pseudo.');
  n.host=true;n.pseudo=pseudo;n.room=PREFIX+Math.random().toString(36).slice(2,8).toUpperCase();
  n.settings={max:+($('onlinePlayerCount')?.textContent||8),roles:[],theme:$('onlineTheme')?.value||'gamer'};
  applyTheme(theme());status('Création du salon…');
  const r=await sb.from('game_rooms').insert({code:n.room,host_id:n.playerId,phase:'lobby',state:{settings:n.settings}}).select().single();
  if(r.error)return status('❌ '+r.error.message);
  n.roomId=r.data.id;
  const e=await sb.from('game_players').insert({room_id:n.roomId,player_id:n.playerId,pseudo,is_host:true});
  if(e.error)return status('❌ '+e.error.message);
  subscribe();await load();screen('onlineLobby');status('🟢 Salon créé : '+shortCode(n.room));
}
async function join(){
  const pseudo=$('joinPseudo').value.trim(),raw=$('roomCode').value.trim();
  if(!pseudo||!raw)return alert('⚠️ Pseudo + code requis.');
  const c=normalizeCode(raw);
  status('🔎 Recherche du salon…');
  const r=await sb.from('game_rooms').select('*').eq('code',c).maybeSingle();
  if(r.error)return status('❌ '+r.error.message);
  if(!r.data)return status('❌ Salon introuvable. Vérifie le code.');
  if(r.data.phase!=='lobby')return status('❌ La partie a déjà commencé.');
  const list=await sb.from('game_players').select('pseudo').eq('room_id',r.data.id);
  if(list.error)return status('❌ '+list.error.message);
  const settings=r.data.state?.settings||{max:8,roles:[],theme:'gamer'};
  if(list.data.length>=(settings.max||8))return status('❌ Salon complet.');
  if(list.data.some(x=>x.pseudo.toLowerCase()===pseudo.toLowerCase()))return status('❌ Ce pseudo est déjà pris dans ce salon.');
  const e=await sb.from('game_players').insert({room_id:r.data.id,player_id:n.playerId,pseudo,is_host:false});
  if(e.error)return status('❌ '+e.error.message);
  n.host=false;n.pseudo=pseudo;n.roomId=r.data.id;n.room=r.data.code;n.settings=settings;
  applyTheme(theme());subscribe();await load();screen('onlineLobby');status('🟢 Connecté au salon.');
}
async function leave(){
  if(!n.roomId||!confirm('Quitter ce salon ?'))return;
  await sb.from('game_players').delete().eq('room_id',n.roomId).eq('player_id',n.playerId);
  if(n.channel)await sb.removeChannel(n.channel);
  Object.assign(n,{roomId:null,room:'',players:[],game:null,channel:null});
  screen('online');status('');
}
async function saveOptions(){
  if(!n.host)return;
  n.settings.max=Math.max(n.players.length,+$('onlinePlayerCount').textContent||8);
  n.settings.roles=[...document.querySelectorAll('.online-special-role:checked')].map(x=>x.value);
  const r=await sb.from('game_rooms').update({state:{settings:n.settings},updated_at:new Date().toISOString()}).eq('id',n.roomId);
  if(r.error)return alert('❌ '+r.error.message);
  lobby();screen('onlineLobby');
}

/* ---------- Lancement ---------- */
async function start(){
  if(!n.host)return;
  await load();
  const d=LG.distribute(theme(),n.players.length,n.settings.roles);
  if(d.error)return alert('⚠️ '+d.error);
  n.players.forEach((p,i)=>{p.roleName=d.roles[i];p.alive=true;p.input={};p.soloMission=null;p.soloTargets=[]});
  n.players.forEach(p=>p.targets=LG.initialTargets(theme(),n.players,p.roleName,p.id));
  for(const p of n.players){
    const r=await sb.from('game_players').update({alive:true,role_data:{roleName:p.roleName,targets:p.targets,input:{}}}).eq('id',p.rowId);
    if(r.error)return alert('❌ '+r.error.message);
  }
  await roomUpdate({round:1,phase:'reveal',mem:{},flags:{},night:null,privates:{},message:'Découvrez vos rôles.',vote:null,winner:null,dayKind:null,seq:0});
}

/* =====================================================================
   HÔTE : fait avancer la partie, un pas à la fois
   ===================================================================== */
async function hostTick(){
  if(!n.host||!n.game)return;
  if(n.busy){n.again=true;return}
  n.busy=true;
  try{let guard=0;do{n.again=false}while((await tickOnce())&&guard++<50||n.again)}
  catch(e){console.error('[hostTick]',e)}
  finally{n.busy=false}
}
async function tickOnce(){
  const g=n.game;if(!g)return false;
  if(g.phase==='reveal'){
    if(n.players.length&&n.players.every(p=>p.input?.ready)){await startNight(LG.clone(g));return true}
    return false;
  }
  if(g.phase==='night'){
    const step=g.night.steps[g.night.index];
    if(!step){await endNight(LG.clone(g));return true}
    const actor=P(step.actor);
    const ng=LG.clone(g);
    if(!actor||!actor.alive||LG.isBlocked(g.night.actions,step.actor)){ng.night.index++;await roomUpdate(ng);return true}
    const act=actor.input?.act;
    if(act&&act.round===g.round&&act.index===g.night.index){
      if(act.target||act.confirm)ng.night.actions.push({actor:step.actor,key:step.key,type:step.type,target:act.target||null});
      ng.night.index++;await roomUpdate(ng);return true;
    }
    return false;
  }
  if(g.phase==='day'){scheduleDay(g);return false}
  if(g.phase==='vote')return await tickVote(LG.clone(g));
  return false;
}
async function startNight(g){
  g.phase='night';g.flags={};
  g.night={steps:LG.nightSteps(theme(),n.players,g.round,g.mem),index:0,actions:[]};
  g.message=theme()==='naruto'?'🌙 La nuit tombe sur le Village…':'🌙 La nuit tombe…';
  await roomUpdate(g);
}
async function kill(ids){
  for(const id of ids){const p=P(id);if(!p)continue;p.alive=false;await sb.from('game_players').update({alive:false}).eq('id',p.rowId)}
}
async function endNight(g){
  const r=LG.resolveNight(theme(),n.players,g.round,g.mem,g.night.actions);
  await kill(r.deaths);
  g.mem=r.mem;g.flags=r.flags;g.privates=r.privateMsgs;g.message=r.messages.join('\n');
  const w=LG.winner(theme(),n.players,g.round);
  if(w){g.phase='end';g.winner=w;return roomUpdate(g)}
  g.phase='day';g.dayKind='night';
  await roomUpdate(g);
}
function scheduleDay(g){
  const key=g.round+'-'+g.dayKind;
  if(n.timerKey===key)return;
  n.timerKey=key;
  setTimeout(()=>advanceDay(key),g.dayKind==='night'?DAY_DELAY:VOTE_RESULT_DELAY);
}
async function advanceDay(key){
  const g=n.game;
  if(!n.host||!g||g.phase!=='day'||g.round+'-'+g.dayKind!==key)return;
  const ng=LG.clone(g);
  if(ng.dayKind==='night'){ng.phase='vote';ng.vote={pending:null};ng.message='🗳️ Votez pour éliminer un suspect.';await roomUpdate(ng)}
  else{ng.round++;ng.privates={};await startNight(ng)}
}
function collectVotes(g){
  const votes={};
  alive().forEach(p=>{const v=p.input?.vote;if(v&&v.round===g.round&&v.target&&P(v.target)?.alive){
    const canDouble=LG.def(theme(),p.roleName).passive==='double'&&!g.mem[p.id]?.double;
    votes[p.id]={target:v.target,weight:v.weight===2&&canDouble?2:1};
  }});
  return votes;
}
async function tickVote(g,force=false){
  const pd=g.vote?.pending;
  if(pd){
    const s=P(pd.strat);
    let decision=pd.forced||null;
    if(!decision&&s?.input?.strat?.round===g.round)decision=s.input.strat.decision;
    if(!decision&&!s?.alive)decision='allow';
    if(!decision)return false;
    if(decision==='cancel'){
      g.mem[pd.strat]={...(g.mem[pd.strat]||{}),strategy:true};
      return endVote(g,null,['🧠 L’élimination de '+LG.nameOf(n.players,pd.candidate)+' a été annulée.']);
    }
    return endVote(g,pd.candidate);
  }
  const votes=collectVotes(g);
  if(!force&&Object.keys(votes).length<alive().length)return false;
  Object.entries(votes).forEach(([id,v])=>{if(v.weight===2)g.mem[id]={...(g.mem[id]||{}),double:true}});
  const t=LG.tallyVotes(n.players,votes,g.flags);
  g.lastTally=t.counts;
  if(!t.candidate)return endVote(g,null,['⚖️ Égalité : personne n’est éliminé.']);
  const strat=LG.strategist(theme(),n.players,g.mem);
  if(strat){
    g.vote={pending:{candidate:t.candidate,strat:strat.id}};
    g.message='🧠 Le '+strat.roleName+' réfléchit…';
    await roomUpdate(g);return true;
  }
  return endVote(g,t.candidate);
}
async function endVote(g,candidate,msgs){
  let kabuto=false;
  if(candidate){
    const r=LG.eliminateByVote(theme(),n.players,g.round,g.mem,g.flags,candidate);
    await kill(r.deaths);g.mem=r.mem;msgs=r.messages;kabuto=r.kabuto;
  }
  g.vote={pending:null};g.message=(msgs||['Le vote est terminé.']).join('\n');
  const w=LG.winner(theme(),n.players,g.round,{kabuto});
  if(w){g.phase='end';g.winner=w;await roomUpdate(g);return true}
  g.phase='day';g.dayKind='vote';
  await roomUpdate(g);return true;
}
/* Boutons de secours de l'hôte (joueur absent / qui ne répond pas) */
async function hostSkipStep(){const g=LG.clone(n.game);if(g.phase!=='night')return;g.night.index++;await roomUpdate(g);hostTick()}
async function hostCloseVote(){const g=LG.clone(n.game);if(g.phase!=='vote')return;if(g.vote?.pending){g.vote.pending.forced='allow'}await tickVote(g,true);hostTick()}
async function hostNow(){if(n.game?.phase==='day')advanceDay(n.game.round+'-'+n.game.dayKind)}

/* =====================================================================
   AFFICHAGE (tous les joueurs)
   ===================================================================== */
function renderGame(){
  const g=n.game;if(!g||!n.roomId)return;
  applyTheme(theme());
  if(g.phase==='end')return renderEnd();
  if(!$('onlineGame').classList.contains('active'))screen('onlineGame');
  $('onlineRound').textContent='TOUR '+(g.round||1);
  $('onlinePhase').textContent={reveal:'🎭 Rôles',night:'🌙 Nuit',day:'☀️ Jour',vote:'🗳️ Vote'}[g.phase]||'';
  $('onlineAlive').textContent=alive().length;
  $('onlinePlayers').innerHTML=n.players.map(x=>'<div class="player '+(x.alive?'':'dead')+'"><strong>'+esc(x.name)+'</strong><br><small>'+(x.alive?'🟢 Vivant':'⚫ Éliminé')+'</small></div>').join('');
  const p=me();if(!p)return panel('<div class="night-card"><h3>⚠️ Tu ne fais pas partie de cette partie.</h3></div>');
  /* On ne reconstruit le panneau que si quelque chose a changé pour moi (évite de vider un menu en cours de choix) */
  const voteCount=g.phase==='vote'?alive().filter(x=>x.input?.vote?.round===g.round).length:0;
  const key=[g.seq,p.alive,p.roleName,JSON.stringify(p.input),voteCount,LG.def(theme(),p.roleName).passive==='peek'&&g.phase==='vote'?JSON.stringify(collectVotes(g)):''].join('|');
  if(key===n.viewKey)return;
  n.viewKey=key;
  const keep=[...document.querySelectorAll('#onlineAction select')].map(s=>[s.id,s.value]);
  if(g.phase==='reveal')renderReveal(p);
  else if(g.phase==='night')renderNight(p,g);
  else if(g.phase==='day')renderDay(p,g);
  else if(g.phase==='vote')renderVote(p,g,voteCount);
  keep.forEach(([id,v])=>{const s=$(id);if(s&&!s.disabled&&[...s.options].some(o=>o.value===v))s.value=v});
}

/* ---------- Révélation ---------- */
function renderReveal(p){
  if(!p.roleName)return panel('<div class="waiting-role"><div class="role-icon">🃏</div><h2>Distribution des rôles…</h2></div>');
  if(p.input?.ready)return panel('<div class="waiting-role"><div class="role-icon">⏳</div><h2>Carte révélée</h2><p>Tu es prêt !</p><p>En attente des autres joueurs… ('+n.players.filter(x=>x.input?.ready).length+'/'+n.players.length+')</p></div>');
  const info=LG.roleInfo(theme(),p,n.players,1),img=LG.cardImage(theme(),p.roleName);
  const front=img?'<img id="onlineCardImage" class="card-image hidden" src="'+img+'" alt="">':'<div id="onlineCardImage" class="naruto-card-art hidden"><div class="naruto-card-icon">'+info.icon+'</div><div class="naruto-card-title">'+esc(info.name)+'</div><div class="naruto-card-team">'+esc(info.team)+'</div><div class="naruto-card-desc">'+esc(info.desc)+'</div></div>';
  const back=theme()==='naruto'?'<div id="onlineCardBack" class="naruto-card-art"><div class="naruto-card-icon">🍥</div><div class="naruto-card-title">LOUP-GAROU NARUTO</div><div class="naruto-card-desc">Ta carte est face cachée</div></div>':'<img id="onlineCardBack" class="card-image" src="cartes/dos.png" alt="">';
  panel('<div class="role-reveal"><div class="role-card-visual">'+back+front+'<div class="card-flip-hint" id="onlineFlipHint">🂠 Ta carte est face cachée</div></div>'+
    '<button class="primary" id="onlineRevealCard">👁️ Révéler ma carte</button>'+
    '<div class="night-card role-info hidden" id="onlineRoleInfo"><h3>'+info.icon+' '+esc(info.name)+'</h3><div class="team">'+esc(info.team)+'</div><p>'+esc(info.desc)+'</p>'+info.extra.map(x=>'<p>'+esc(x)+'</p>').join('')+'</div>'+
    '<div id="onlineMissionBox"></div><button class="primary hidden" id="onlineReady">✅ J’ai vu mon rôle</button></div>');
  $('onlineRevealCard').onclick=()=>{
    $('onlineCardBack').classList.add('hidden');$('onlineCardImage').classList.remove('hidden');$('onlineFlipHint').classList.add('hidden');
    $('onlineRevealCard').classList.add('hidden');$('onlineRoleInfo').classList.remove('hidden');
    if(p.roleName==='Solo Player')soloMission(p);else $('onlineReady').classList.remove('hidden');
  };
  $('onlineReady').onclick=()=>{$('onlineReady').disabled=true;setMine({ready:true})};
}
function soloMission(p){
  $('onlineMissionBox').innerHTML='<div class="solo-mission-box"><h3>🎯 Choisis ta mission</h3><select id="onlineSoloMission"><option value="">Choisir une mission</option>'+LG.SOLO_MISSIONS.map(m=>'<option value="'+m[0]+'">'+m[1]+' — '+esc(m[2])+'</option>').join('')+'</select><button class="primary" id="onlineMissionConfirm">Valider ma mission</button></div>';
  $('onlineMissionConfirm').onclick=()=>{
    const v=$('onlineSoloMission').value;if(!v)return alert('⚠️ Choisis une mission.');
    const targets=v==='chaos'?LG.soloMissionTargets(n.players,p.id):[];
    if(targets.length)alert('🎯 Tes cibles : '+targets.map(id=>LG.nameOf(n.players,id)).join(' et '));
    $('onlineMissionConfirm').disabled=true;
    setMine({soloMission:v,soloTargets:targets,ready:true});
  };
}

/* ---------- Nuit ---------- */
function myNotes(p,g){return(p.input?.notes||[]).filter(x=>x.round===g.round).map(x=>'<p>'+x.text+'</p>').join('')}
function renderNight(p,g){
  const hostBtn=n.host?'<button class="secondary" id="hostSkip">⏭️ Passer ce tour (joueur absent)</button>':'';
  const bindHost=()=>{if(n.host&&$('hostSkip'))$('hostSkip').onclick=hostSkipStep};
  if(!p.alive){panel('<div class="night-card"><h3>👻 Tu es éliminé</h3><p>Observe la suite de la partie en silence.</p>'+hostBtn+'</div>');return bindHost()}
  const step=g.night.steps[g.night.index];
  const done=p.input?.act&&p.input.act.round===g.round&&p.input.act.index===g.night.index;
  if(!step||step.actor!==p.id||done){
    const notes=myNotes(p,g);
    panel('<div class="night-card"><h3>🌙 '+(theme()==='naruto'?'Nuit ninja':'Nuit')+'</h3>'+(notes?'<h3>🤫 Résultat secret</h3>'+notes:'')+'<p>Un autre joueur agit. Garde les yeux sur ton écran… et attends.</p>'+hostBtn+'</div>');
    return bindHost();
  }
  const pr=LG.stepPrompt(theme(),step,n.players,g.round);
  if(!pr.confirmOnly&&!pr.options.length){
    panel('<div class="night-card"><h3>'+esc(pr.title)+'</h3><p>Aucune cible possible cette nuit.</p><button class="primary" id="nightSkip">Continuer</button></div>');
    $('nightSkip').onclick=()=>submitAct(p,g,null,false,null);return;
  }
  const opts=pr.options.map(id=>'<option value="'+id+'">'+esc(LG.nameOf(n.players,id))+'</option>').join('');
  panel('<div class="night-card"><h3>'+esc(pr.title)+'</h3><p>'+esc(pr.text)+'</p>'+(pr.confirmOnly?'':'<select id="nightTarget"><option value="">Choisir un joueur</option>'+opts+'</select>')+
    '<button class="primary" id="nightConfirm">'+(step.type==='kill'?'☠️ Choisir la victime':'⚡ Utiliser le pouvoir')+'</button>'+(pr.canSkip?'<button class="secondary" id="nightSkip">Passer</button>':'')+hostBtn+'</div>');
  bindHost();
  if(pr.canSkip)$('nightSkip').onclick=()=>submitAct(p,g,null,false,null);
  $('nightConfirm').onclick=()=>{
    const target=pr.confirmOnly?null:$('nightTarget').value;
    if(!pr.confirmOnly&&!target)return alert('⚠️ Choisis un joueur.');
    const result=target?LG.instantResult(theme(),n.players,g.round,g.night.actions,step,target):null;
    submitAct(p,g,target,pr.confirmOnly,result);
  };
}
function submitAct(p,g,target,confirm,result){
  const notes=(p.input?.notes||[]).filter(x=>x.round===g.round);
  if(result)notes.push({round:g.round,text:result});
  setMine({act:{round:g.round,index:g.night.index,target,confirm:!!confirm},notes});
}

/* ---------- Jour ---------- */
function renderDay(p,g){
  const priv=(g.privates?.[p.id]||[]).map(m=>'<p>'+esc(m)+'</p>').join('');
  const notes=g.dayKind==='night'?myNotes(p,g):'';
  const board=g.dayKind==='vote'&&g.lastTally?.length?g.lastTally.map(([id,c])=>'<div class="vote-result">'+esc(LG.nameOf(n.players,id))+'<span>'+c+' voix</span></div>').join(''):'';
  panel('<div class="night-card"><h3>'+(g.dayKind==='vote'?'📊 Résultat du vote':'☀️ Le jour se lève')+'</h3>'+board+'<p>'+esc(g.message||'').replace(/\n/g,'<br>')+'</p>'+
    (priv||notes?'<h3>🤫 Pour toi seul</h3>'+priv+notes:'')+
    '<p class="hint">'+(g.dayKind==='vote'?'La nuit suivante arrive…':'Discutez ! Le vote commence dans quelques secondes…')+'</p>'+
    (n.host?'<button class="secondary" id="hostNow">⏭️ Continuer maintenant</button>':'')+'</div>');
  if(n.host)$('hostNow').onclick=hostNow;
}

/* ---------- Vote ---------- */
function renderVote(p,g,voteCount){
  const hostBtn=n.host?'<button class="secondary" id="hostClose">⏭️ Clore le vote maintenant (joueurs absents)</button>':'';
  const bindHost=()=>{if(n.host&&$('hostClose'))$('hostClose').onclick=hostCloseVote};
  const pd=g.vote?.pending;
  if(pd){
    if(p.id===pd.strat&&p.alive){
      panel('<div class="night-card"><h3>🧠 '+esc(p.roleName)+'</h3><p>Le vote va éliminer <b>'+esc(LG.nameOf(n.players,pd.candidate))+'</b>. Une fois par partie, tu peux annuler.</p><button class="primary" id="stratYes">🧠 Annuler l’élimination</button><button class="secondary" id="stratNo">Laisser faire</button></div>');
      $('stratYes').onclick=()=>setMine({strat:{round:g.round,decision:'cancel'}});
      $('stratNo').onclick=()=>setMine({strat:{round:g.round,decision:'allow'}});
    }else{panel('<div class="night-card"><h3>🧠 Une décision est en cours…</h3><p>Attends quelques secondes.</p>'+hostBtn+'</div>');bindHost()}
    return;
  }
  if(!p.alive){panel('<div class="night-card"><h3>👻 Tu es éliminé</h3><p>'+voteCount+'/'+alive().length+' ont voté.</p>'+hostBtn+'</div>');return bindHost()}
  const mine=p.input?.vote?.round===g.round?p.input.vote:null;
  if(mine){panel('<div class="night-card vote-card"><h3>✅ Vote enregistré</h3><p>Tu as voté contre <b>'+esc(LG.nameOf(n.players,mine.target))+'</b>.</p><p>'+voteCount+'/'+alive().length+' ont voté. En attente des autres…</p>'+hostBtn+'</div>');return bindHost()}
  const d=LG.def(theme(),p.roleName);
  const canDouble=d.passive==='double'&&!g.mem?.[p.id]?.double;
  const puppet=g.flags?.puppets?.[p.id]&&P(g.flags.puppets[p.id])?.alive;
  let peek='';
  if(d.passive==='peek'){
    const t=LG.tallyVotes(n.players,collectVotes(g),g.flags);
    peek='<p>🎯 Votes déjà exprimés (en direct) :</p>'+(t.counts.length?t.counts.map(([id,c])=>'<div class="vote-result">'+esc(LG.nameOf(n.players,id))+'<span>'+c+'</span></div>').join(''):'<p class="hint">Aucun vote pour l’instant.</p>');
  }
  const opts=alive().filter(x=>x.id!==p.id).map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('');
  panel('<div class="night-card vote-card"><h3>🗳️ Vote</h3><p>'+voteCount+'/'+alive().length+' ont voté.</p>'+peek+(puppet?'<p>🦂 Des fils invisibles guident ta main : ton vote suivra celui de Sasori.</p>':'')+
    '<select id="voteTarget"><option value="">Choisir un joueur</option>'+opts+'</select>'+
    (canDouble?'<label class="role-option"><input type="checkbox" id="useDouble"><span>⚡ <b>Utiliser mon vote double</b><small>Une seule fois par partie.</small></span></label>':'')+
    '<button class="primary" id="voteConfirm">🗳️ Valider mon vote</button>'+hostBtn+'</div>');
  bindHost();
  $('voteConfirm').onclick=()=>{
    const t=$('voteTarget').value;if(!t)return alert('⚠️ Choisis un joueur.');
    $('voteConfirm').disabled=true;
    setMine({vote:{round:g.round,target:t,weight:canDouble&&$('useDouble')?.checked?2:1}});
  };
}

/* ---------- Fin ---------- */
function renderEnd(){
  const g=n.game,w=g.winner||{icon:'🏆',title:'Victoire !',msg:''};
  screen('onlineEnd');
  $('onlineWinnerIcon').textContent=w.icon;$('onlineWinnerTitle').textContent=w.title;
  $('onlineFinalPlayers').innerHTML='<p class="subtitle">'+esc(w.msg)+'</p>'+n.players.map(p=>{const i=LG.roleInfo(theme(),p,n.players,g.round||1);return'<div class="final-player '+(p.alive?'':'dead')+'"><strong>'+(p.alive?'🟢':'⚫')+' '+esc(p.name)+'</strong><span><b>'+i.icon+' '+esc(p.roleName||'?')+'</b><br><small>'+esc(i.team)+'</small></span></div>'}).join('');
}

/* ---------- Boutons ---------- */
$('onlineBtn')?.addEventListener('click',()=>screen('online'));
$('createOnlineBtn')?.addEventListener('click',()=>screen('onlineCreate'));
$('joinOnlineBtn')?.addEventListener('click',()=>screen('onlineJoin'));
$('onlineTheme')?.addEventListener('change',()=>applyTheme($('onlineTheme').value));
$('createRoomBtn')?.addEventListener('click',create);
$('joinRoomBtn')?.addEventListener('click',join);
$('leaveOnlineBtn')?.addEventListener('click',leave);
$('lobbyOptionsBtn')?.addEventListener('click',()=>{$('onlinePlayerCount').textContent=n.settings.max;renderRoleOptions();screen('onlineOptions')});
$('saveOnlineOptionsBtn')?.addEventListener('click',saveOptions);
$('startOnlineGameBtn')?.addEventListener('click',start);
$('onlineMinusPlayers')?.addEventListener('click',()=>{const e=$('onlinePlayerCount');e.textContent=Math.max(LG.minPlayers(theme()),n.players.length,+e.textContent-1)});
$('onlinePlusPlayers')?.addEventListener('click',()=>{const e=$('onlinePlayerCount');e.textContent=Math.min(20,+e.textContent+1)});
});
