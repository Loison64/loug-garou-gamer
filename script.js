/* =====================================================================
   script.js — Mode local (un seul appareil qu'on se passe)
   Les règles sont dans regles.js (window.LG).
   ===================================================================== */
document.addEventListener('DOMContentLoaded',()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=LG.escapeHtml;
const screen=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id)?.classList.add('active')};

/* ---------- Voix du narrateur ---------- */
let voiceEnabled=true;
function speak(t){if(!voiceEnabled||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g,''));u.lang='fr-FR';u.rate=.88;u.pitch=.85;speechSynthesis.speak(u)}
const voiceBtn=()=>'<button class="secondary" id="voiceBtn">🔊 Voix : '+(voiceEnabled?'ON':'OFF')+'</button>';
function bindVoice(){const b=$('voiceBtn');if(b)b.onclick=()=>{voiceEnabled=!voiceEnabled;if(!voiceEnabled&&window.speechSynthesis)speechSynthesis.cancel();b.textContent='🔊 Voix : '+(voiceEnabled?'ON':'OFF')}}

/* ---------- Configuration ---------- */
const theme=()=>$('localTheme')?.value||'gamer';
function applyTheme(t){document.body.dataset.theme=t;document.documentElement.dataset.theme=t;document.title=t==='naruto'?'Loup-Garou Naruto':'Loup-Garou Gamer'}

function renderRoleOptions(){
  const box=document.querySelector('#setup .special-box');if(!box)return;
  if(theme()==='naruto'){
    box.innerHTML='<h3>🍥 Rôles Naruto</h3><p class="hint">Les rôles sont distribués automatiquement selon le nombre de joueurs.</p>'+
      LG.NARUTO_GROUPS.map(g=>'<div class="role-group"><b>'+g[0]+'</b>'+g[1].map(r=>{const d=LG.def('naruto',r);return'<label class="role-option"><span>'+d.icon+' <b>'+esc(r)+'</b><small>'+esc(d.desc)+'</small></span></label>'}).join('')+'</div>').join('');
    return;
  }
  box.innerHTML='<h3>✨ Rôles spéciaux</h3><p class="hint">Le Loup Gamer et le Healer sont toujours présents.</p><button id="randomRolesBtn" class="secondary">🎲 Choisir les rôles aléatoirement</button>'+
    LG.GAMER_GROUPS.map(g=>'<div class="role-group"><b>'+g[0]+'</b>'+g[1].map(r=>{const d=LG.def('gamer',r);return'<label class="role-option"><input class="special-role" type="checkbox" value="'+esc(r)+'"><span>'+d.icon+' <b>'+esc(r)+'</b><small>'+esc(d.desc)+'</small></span></label>'}).join('')+'</div>').join('')+
    '<p id="roleCount" class="role-count"></p>';
  document.querySelectorAll('.special-role').forEach(x=>x.onchange=updateRoleCount);
  $('randomRolesBtn').onclick=randomRoles;
  updateRoleCount();
}
function updateRoleCount(){const n=document.querySelectorAll('.special-role:checked').length,e=$('roleCount');if(e)e.textContent=n>1?n+' rôles spéciaux activés':n+' rôle spécial activé'}
function randomRoles(){
  const boxes=LG.shuffle([...document.querySelectorAll('.special-role')]);boxes.forEach(b=>b.checked=false);
  const max=Math.min(boxes.length,Math.max(0,(+$('playerCount').textContent||8)-2));
  boxes.slice(0,Math.floor(Math.random()*(max+1))).forEach(b=>b.checked=true);updateRoleCount();
}
function renderNames(){
  const n=+$('playerCount').textContent||8,box=$('namesBox'),old=[...box.querySelectorAll('.name-input')].map(i=>i.value);
  box.innerHTML='';
  for(let i=1;i<=n;i++)box.insertAdjacentHTML('beforeend','<div class="name-row"><label>👤 Joueur '+i+'</label><input class="name-input" maxlength="20" placeholder="Entre ton pseudo" value="'+esc(old[i-1]||'Joueur '+i)+'"></div>');
}
function syncCountHint(){const h=document.querySelector('#setup .counter + .hint');if(h)h.textContent='Entre '+LG.minPlayers(theme())+' et 20 joueurs.'}
function changePlayers(d){const e=$('playerCount');e.textContent=Math.max(LG.minPlayers(theme()),Math.min(20,(+e.textContent||8)+d));renderNames()}
function setup(){applyTheme(theme());const e=$('playerCount');e.textContent=Math.max(LG.minPlayers(theme()),+e.textContent||8);syncCountHint();renderNames();renderRoleOptions();screen('setup')}

/* ---------- État de la partie ---------- */
let S=null;
const P=id=>LG.byId(S.players,id);
const alive=()=>LG.alive(S.players);

function launch(){
  const t=theme();applyTheme(t);
  const names=[...document.querySelectorAll('#namesBox .name-input')].map(i=>i.value.trim());
  if(names.some(n=>!n))return alert('⚠️ Tous les joueurs doivent avoir un pseudo.');
  if(new Set(names.map(n=>n.toLowerCase())).size!==names.length)return alert('⚠️ Les pseudos doivent être différents.');
  const selected=[...document.querySelectorAll('.special-role:checked')].map(x=>x.value);
  const r=LG.distribute(t,names.length,selected);
  if(r.error)return alert('⚠️ '+r.error);
  const players=names.map((name,i)=>({id:'p'+i,name,roleName:r.roles[i],alive:true,targets:[]}));
  players.forEach(p=>p.targets=LG.initialTargets(t,players,p.roleName,p.id));
  S={theme:t,players,round:1,mem:{},flags:{},index:0,night:null,votes:{},voteOrder:[],voteIdx:0};
  showReveal();
}

/* ---------- Révélation des rôles ---------- */
function showReveal(){
  const p=S.players[S.index];
  $('revealPlayer').textContent=p.name;
  $('roleCard').classList.add('hidden');$('roleCard').innerHTML='';
  $('showRoleBtn').classList.remove('hidden');
  screen('reveal');
}
function reveal(){
  const p=S.players[S.index],info=LG.roleInfo(S.theme,p,S.players,1),img=LG.cardImage(S.theme,p.roleName);
  const front=img?'<img class="card-image card-image-front hidden" id="cardFront" src="'+img+'" alt="">':
    '<div id="cardFront" class="naruto-card-art hidden"><div class="naruto-card-icon">'+info.icon+'</div><div class="naruto-card-title">'+esc(info.name)+'</div><div class="naruto-card-team">'+esc(info.team)+'</div><div class="naruto-card-desc">'+esc(info.desc)+'</div></div>';
  const back=S.theme==='naruto'?'<div id="cardBack" class="naruto-card-art"><div class="naruto-card-icon">🍥</div><div class="naruto-card-title">LOUP-GAROU NARUTO</div><div class="naruto-card-desc">Ta carte est face cachée</div></div>':'<img class="card-image card-image-back" id="cardBack" src="cartes/dos.png" alt="">';
  $('showRoleBtn').classList.add('hidden');
  $('roleCard').classList.remove('hidden');
  $('roleCard').innerHTML='<div class="local-role-visual">'+back+front+'<div class="card-flip-hint" id="flipHint">🂠 Ta carte est face cachée</div></div>'+
    '<button class="primary" id="flipBtn">👁️ Révéler ma carte</button>'+
    '<div class="local-role-info hidden" id="roleInfoBox"><div class="role-icon">'+info.icon+'</div><h3>'+esc(info.name)+'</h3><div class="team">'+esc(info.team)+'</div><p>'+esc(info.desc)+'</p>'+info.extra.map(x=>'<p>'+esc(x)+'</p>').join('')+'<div id="missionBox"></div><button id="nextRevealBtn" class="secondary hidden">Cacher et continuer →</button></div>';
  $('flipBtn').onclick=()=>{
    $('cardBack').classList.add('hidden');$('cardFront').classList.remove('hidden');$('flipHint').classList.add('hidden');
    $('flipBtn').classList.add('hidden');$('roleInfoBox').classList.remove('hidden');
    speak(p.name+', découvre ta carte.');
    $('nextRevealBtn').onclick=nextReveal;
    if(p.roleName==='Solo Player')soloMission(p);else $('nextRevealBtn').classList.remove('hidden');
  };
}
function soloMission(p){
  $('missionBox').innerHTML='<div class="solo-mission-box"><h3>🎯 Choisis ta mission</h3><select id="missionSelect"><option value="">Choisir une mission</option>'+LG.SOLO_MISSIONS.map(m=>'<option value="'+m[0]+'">'+m[1]+' — '+esc(m[2])+'</option>').join('')+'</select><button class="primary" id="missionOk">Valider ma mission</button><p id="missionInfo" class="hint"></p></div>';
  $('missionOk').onclick=()=>{
    const v=$('missionSelect').value;if(!v)return alert('⚠️ Choisis une mission.');
    p.soloMission=v;
    if(v==='chaos'){p.soloTargets=LG.soloMissionTargets(S.players,p.id);$('missionInfo').textContent='🎯 Tes cibles : '+p.soloTargets.map(id=>P(id).name).join(' et ')}
    else $('missionInfo').textContent='✅ Mission enregistrée.';
    $('missionSelect').disabled=true;$('missionOk').classList.add('hidden');$('nextRevealBtn').classList.remove('hidden');
  };
}
function nextReveal(){if(++S.index>=S.players.length)startGame();else showReveal()}

/* ---------- Affichage commun ---------- */
function header(title){$('roundLabel').textContent='TOUR '+S.round;$('phaseTitle').textContent=title;$('aliveCount').textContent=alive().length}
function renderPlayers(){$('playersList').innerHTML=S.players.map(p=>'<div class="player '+(p.alive?'':'dead')+'"><strong>'+esc(p.name)+'</strong><br><small>'+(p.alive?'🟢 Vivant':'⚫ Éliminé')+'</small></div>').join('')}
function panel(html,msg){if(msg!==undefined)$('gameMessage').innerHTML=msg;$('actionArea').innerHTML=voiceBtn()+html;bindVoice()}
function checkEnd(opts){const w=LG.winner(S.theme,S.players,S.round,opts);if(!w)return false;finish(w);return true}

/* ---------- Nuit ---------- */
function startGame(){screen('game');startNight()}
function startNight(){
  if(checkEnd())return;
  S.flags={};S.night={steps:LG.nightSteps(S.theme,S.players,S.round,S.mem),index:0,actions:[]};
  header('🌙 Nuit '+S.round);renderPlayers();
  panel('<div class="night-card"><h3>🌙 La nuit tombe…</h3><p>Tout le monde ferme les yeux. Les rôles vont être appelés un par un : seul le joueur appelé prend l’appareil.</p><button class="primary" id="goNight">🌙 Commencer la nuit</button></div>',
    S.theme==='naruto'?'🌙 La nuit '+S.round+' tombe sur le monde ninja.':'🌙 La nuit '+S.round+' commence.');
  speak(S.theme==='naruto'?'La nuit tombe sur le Village caché.':'La nuit tombe sur le village.');
  $('goNight').onclick=nightStep;
}
function nightStep(){
  const st=S.night.steps[S.night.index];
  if(!st)return endNight();
  const actor=P(st.actor);
  if(!actor.alive){S.night.index++;return nightStep()}
  const pr=LG.stepPrompt(S.theme,st,S.players,S.round);
  panel('<div class="night-card"><h3>'+esc(pr.title)+'</h3><p>Le joueur concerné prend l’appareil. Les autres gardent les yeux fermés.</p><button class="primary" id="awake">👁️ C’est moi, j’ouvre les yeux</button></div>',esc(pr.title));
  speak(pr.announce);
  $('awake').onclick=()=>{
    if(LG.isBlocked(S.night.actions,actor.id)){
      panel('<div class="night-card"><h3>🔒 Pouvoir bloqué</h3><p>Ton pouvoir a été bloqué cette nuit. Tu ne peux rien faire.</p><button class="primary" id="nextStep">😴 Refermer les yeux et rendre l’appareil</button></div>');
      $('nextStep').onclick=()=>{S.night.index++;nightStep()};return;
    }
    if(!pr.confirmOnly&&!pr.options.length){
      panel('<div class="night-card"><h3>'+esc(pr.title)+'</h3><p>Aucune cible possible cette nuit.</p><button class="primary" id="nextStep">Continuer</button></div>');
      $('nextStep').onclick=()=>{S.night.index++;nightStep()};return;
    }
    const opts=pr.options.map(id=>'<option value="'+id+'">'+esc(P(id).name)+'</option>').join('');
    panel('<div class="night-card"><h3>'+esc(pr.title)+'</h3><p>'+esc(pr.text)+'</p>'+(pr.confirmOnly?'':'<select id="target"><option value="">Choisir un joueur</option>'+opts+'</select>')+
      '<button class="primary" id="useIt">'+(st.type==='kill'?'☠️ Choisir la victime':'⚡ Utiliser le pouvoir')+'</button>'+(pr.canSkip?'<button class="secondary" id="skipIt">Passer</button>':'')+'</div>');
    if(pr.canSkip)$('skipIt').onclick=()=>afterAction(null);
    $('useIt').onclick=()=>{
      const target=pr.confirmOnly?null:$('target').value;
      if(!pr.confirmOnly&&!target)return alert('⚠️ Choisis un joueur.');
      const result=target?LG.instantResult(S.theme,S.players,S.round,S.night.actions,st,target):null;
      S.night.actions.push({actor:st.actor,key:st.key,type:st.type,target});
      afterAction(result);
    };
  };
}
function afterAction(result){
  S.night.index++;
  if(!result)panel('<div class="night-card"><h3>😴 C’est noté</h3><p>Referme les yeux et repose l’appareil.</p><button class="primary" id="nextStep">Continuer</button></div>');
  else panel('<div class="night-card"><h3>🤫 Résultat secret</h3><p>'+result+'</p><button class="primary" id="nextStep">J’ai retenu, continuer</button></div>');
  $('nextStep').onclick=nightStep;
}
function endNight(){
  const r=LG.resolveNight(S.theme,S.players,S.round,S.mem,S.night.actions);
  S.mem=r.mem;S.flags=r.flags;
  r.deaths.forEach(id=>P(id).alive=false);
  header('☀️ Jour '+S.round);renderPlayers();
  if(checkEnd())return;
  const text=r.messages.map(esc).join('<br>');
  panel('<div class="night-card"><h3>☀️ Le jour se lève</h3><p>'+text+'</p><p class="hint">Discutez, accusez, défendez-vous… puis passez au vote.</p><button class="primary" id="toVote">🗳️ Passer au vote</button></div>',text);
  speak(r.messages.join(' '));
  $('toVote').onclick=startVote;
}

/* ---------- Vote ---------- */
function startVote(){
  header('🗳️ Vote');
  const order=LG.shuffle(alive().map(p=>p.id));
  /* L'Opportuniste vote en dernier (l'ordre est mélangé à chaque tour, ça ne le trahit pas) */
  const op=order.filter(id=>LG.def(S.theme,P(id).roleName).passive==='peek');
  S.voteOrder=[...order.filter(id=>!op.includes(id)),...op];S.voteIdx=0;S.votes={};
  voteTurn();
}
function voteTurn(){
  const id=S.voteOrder[S.voteIdx];
  if(!id)return endVote();
  const v=P(id);
  panel('<div class="night-card vote-card"><h3>🗳️ Au tour de '+esc(v.name)+'</h3><p>Passe l’appareil à <b>'+esc(v.name)+'</b>. Le vote est secret.</p><button class="primary" id="iAm">C’est moi, je vote</button></div>','🗳️ '+esc(v.name)+' doit voter.');
  speak(v.name+", c'est à toi de voter.");
  $('iAm').onclick=()=>voteForm(v);
}
function voteForm(v){
  const d=LG.def(S.theme,v.roleName);
  const canDouble=d.passive==='double'&&!S.mem[v.id]?.double;
  const puppet=S.flags.puppets?.[v.id]&&P(S.flags.puppets[v.id])?.alive;
  let peek='';
  if(d.passive==='peek'){
    const t=LG.tallyVotes(S.players,S.votes,S.flags);
    peek='<p>🎯 Votes déjà exprimés :</p>'+(t.counts.length?t.counts.map(([id,c])=>'<div class="vote-result">'+esc(P(id).name)+'<span>'+c+'</span></div>').join(''):'<p class="hint">Aucun vote pour l’instant.</p>');
  }
  const opts=alive().filter(x=>x.id!==v.id).map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('');
  panel('<div class="night-card vote-card"><h3>🗳️ Vote de '+esc(v.name)+'</h3>'+peek+(puppet?'<p>🦂 Des fils invisibles guident ta main : ton vote suivra celui de Sasori.</p>':'')+
    '<select id="voteTarget"><option value="">Choisir un joueur</option>'+opts+'</select>'+
    (canDouble?'<label class="role-option"><input type="checkbox" id="useDouble"><span>⚡ <b>Utiliser mon vote double</b><small>Une seule fois par partie.</small></span></label>':'')+
    '<button class="primary" id="voteOk">🗳️ Valider mon vote</button></div>');
  $('voteOk').onclick=()=>{
    const t=$('voteTarget').value;if(!t)return alert('⚠️ Choisis un joueur.');
    const dbl=canDouble&&$('useDouble').checked;
    if(dbl){S.mem[v.id]=S.mem[v.id]||{};S.mem[v.id].double=true}
    S.votes[v.id]={target:t,weight:dbl?2:1};
    panel('<div class="night-card"><h3>✅ Vote enregistré</h3><p>Cache l’écran et passe l’appareil.</p><button class="primary" id="nextVoter">Continuer</button></div>');
    $('nextVoter').onclick=()=>{S.voteIdx++;voteTurn()};
  };
}
function endVote(){
  const t=LG.tallyVotes(S.players,S.votes,S.flags);
  const board=t.counts.map(([id,c])=>'<div class="vote-result">'+esc(P(id).name)+'<span>'+c+' voix</span></div>').join('');
  if(!t.candidate)return voteResult(['⚖️ Égalité : personne n’est éliminé.'],board);
  const strat=LG.strategist(S.theme,S.players,S.mem);
  if(strat){
    const who=P(t.candidate).name;
    panel('<div class="night-card"><h3>🧠 '+esc(strat.roleName)+'</h3>'+board+'<p><b>'+esc(who)+'</b> va être éliminé. Le '+esc(strat.roleName)+' peut annuler cette élimination une fois par partie.</p><button class="primary" id="iAmStrat">🧠 Passer l’appareil au '+esc(strat.roleName)+'</button></div>','🧠 Le '+esc(strat.roleName)+' peut intervenir.');
    speak('Le '+strat.roleName+' peut intervenir.');
    $('iAmStrat').onclick=()=>{
      panel('<div class="night-card"><h3>🧠 Ta décision</h3><p>Annuler l’élimination de <b>'+esc(who)+'</b> ?</p><button class="primary" id="sYes">🧠 Annuler l’élimination</button><button class="secondary" id="sNo">Laisser faire</button></div>');
      $('sYes').onclick=()=>{S.mem[strat.id]=S.mem[strat.id]||{};S.mem[strat.id].strategy=true;voteResult(['🧠 L’élimination de '+who+' a été annulée.'],board)};
      $('sNo').onclick=()=>applyVote(t.candidate,board);
    };
    return;
  }
  applyVote(t.candidate,board);
}
function applyVote(id,board){
  const r=LG.eliminateByVote(S.theme,S.players,S.round,S.mem,S.flags,id);
  S.mem=r.mem;r.deaths.forEach(x=>P(x).alive=false);
  renderPlayers();
  if(checkEnd({kabuto:r.kabuto}))return;
  voteResult(r.messages,board);
}
function voteResult(msgs,board){
  header('📊 Résultat du vote');renderPlayers();
  const text=msgs.map(esc).join('<br>');
  panel('<div class="night-card"><h3>📊 Résultat du vote</h3>'+(board||'')+'<p>'+text+'</p><button class="primary" id="nextNight">🌙 Commencer la nuit suivante</button></div>',text);
  speak(msgs.join(' '));
  $('nextNight').onclick=()=>{S.round++;startNight()};
}

/* ---------- Fin ---------- */
function finish(w){
  $('winnerIcon').textContent=w.icon;$('winnerTitle').textContent=w.title;$('winnerMessage').textContent=w.msg;
  $('finalPlayers').innerHTML=S.players.map(p=>{const i=LG.roleInfo(S.theme,p,S.players,S.round);return'<div class="final-player '+(p.alive?'':'dead')+'"><strong>'+(p.alive?'🟢':'⚫')+' '+esc(p.name)+'</strong><span><b>'+i.icon+' '+esc(p.roleName)+'</b><br><small>'+esc(i.team)+'</small></span></div>'}).join('');
  screen('end');speak(w.title+' '+w.msg);
}

/* ---------- Boutons ---------- */
$('localTheme')?.addEventListener('change',setup);
$('startBtn').onclick=setup;
$('minusPlayers').onclick=()=>changePlayers(-1);
$('plusPlayers').onclick=()=>changePlayers(1);
$('launchBtn').onclick=launch;
$('showRoleBtn').onclick=reveal;
$('restartBtn').onclick=setup;
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>screen(b.dataset.screen||'home')));
});
