const ROLES = {
  gamer:{name:'Joueur Gamer',icon:'🎮',team:'BONS',description:'Aucun pouvoir. Gagne si tous les méchants sont éliminés.'},
  strategist:{name:'Stratège',icon:'🧠',team:'BONS',description:'Une fois dans la partie, peut annuler le vote.'},
  support:{name:'Support',icon:'🛡️',team:'BONS',description:'Une fois dans la partie, protège secrètement un joueur pendant la nuit.'},
  analyst:{name:'Analyste',icon:'🔎',team:'BONS',description:'Une fois dans la partie, découvre secrètement si un joueur est bon ou méchant.'},
  speedrunner:{name:'Speedrunner',icon:'⚡',team:'BONS',description:'Une fois dans la partie, peut faire compter son vote double.'},
  healer:{name:'Healer',icon:'❤️‍🩹',team:'BONS',description:'Peut sauver la victime de la nuit, sauf lui-même.'},
  wolf:{name:'Loup Gamer',icon:'🐺',team:'HACKERS',description:'Les Loups Gamer choisissent secrètement une victime chaque nuit.'},
  hacker:{name:'Hacker',icon:'💻',team:'HACKERS',description:'Une fois dans la partie, bloque le pouvoir d’un joueur pour une nuit.'},
  saboteur:{name:'Saboteur',icon:'💣',team:'HACKERS',description:'Une fois dans la partie, déclenche un faux événement.'},
  solo:{name:'Solo Player',icon:'🃏',team:'SOLO',description:'Joue avec une mission secrète personnelle.'},
  traitor:{name:'Traître',icon:'🕵️',team:'BONS → HACKERS',description:'Commence avec les Bons et rejoint les Hackers au tour 3.'}
};

const MISSIONS = {
  manipulateur:{name:'Manipulateur',icon:'🅰️',description:'Survivre jusqu’à ce qu’il ne reste que 3 joueurs.'},
  chaos:{name:'Chaos',icon:'🅱️',description:'Faire éliminer deux cibles secrètes.'},
  opportuniste:{name:'Opportuniste',icon:'🅲',description:'Changer 2 fois son vote et finir dans l’équipe gagnante.'},
  boss:{name:'Boss Final',icon:'🅳',description:'Être le dernier survivant.'}
};

let state = null;
const $ = id => document.getElementById(id);
const alive = () => state.players.filter(p => p.alive);
const player = id => state.players.find(p => p.id === Number(id));
const solo = () => state.players.find(p => p.role === 'solo');

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = $(id);
  if(screen) screen.classList.add('active');
}

function shuffle(list){
  const a = [...list];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function isHacker(p){
  return p && (p.role==='wolf' || p.role==='hacker' || p.role==='saboteur' || (p.role==='traitor' && state.round>=3));
}

function targetOptions(excludeId, filter=()=>true){
  return alive()
    .filter(p => p.id !== excludeId && filter(p))
    .map(p => `<option value="${p.id}">${p.name}</option>`)
    .join('');
}

function renderNameInputs(){
  const box=$('namesBox');
  if(!box) return;
  const count=Number($('playerCount').textContent);
  const old=[...box.querySelectorAll('input')].map(x=>x.value);
  box.innerHTML='';
  for(let i=0;i<count;i++){
    const wrap=document.createElement('div');
    wrap.className='name-player';
    const label=document.createElement('label');
    label.className='name-player-label';
    label.textContent=`👤 Joueur ${i+1}`;
    const input=document.createElement('input');
    input.className='name-input';
    input.type='text';
    input.maxLength=20;
    input.placeholder='Entre ton pseudo';
    input.value=old[i] || '';
    wrap.append(label,input);
    box.appendChild(wrap);
  }
}

function getSelectedRoles(){
  const roles=[];
  document.querySelectorAll('.role-check:checked').forEach(check=>{
    const key=check.dataset.role;
    const count=Math.max(1,Math.min(20,Number(document.querySelector(`.role-count[data-role="${key}"]`)?.value || 1)));
    for(let i=0;i<count;i++) roles.push(key);
  });
  return roles;
}

function selectedMissions(){
  return [...document.querySelectorAll('input[name="soloMission"]:checked')].map(x=>x.value);
}

function updateRoleTotal(){
  const total=getSelectedRoles().length;
  const wanted=Number($('playerCount').textContent);
  $('roleTotal').textContent=`👥 Rôles sélectionnés : ${total} / ${wanted}`;
  $('roleTotal').className=`setup-total ${total===wanted?'ok':'warning'}`;
}

function validateSetup(){
  const wanted=Number($('playerCount').textContent);
  const roles=getSelectedRoles();
  const names=[...document.querySelectorAll('.name-input')].map(x=>x.value.trim());
  if(names.some(n=>!n)){alert('⚠️ Tous les joueurs doivent avoir un pseudo.');return false;}
  if(new Set(names.map(n=>n.toLowerCase())).size!==names.length){alert('⚠️ Les pseudos doivent être différents.');return false;}
  if(roles.length!==wanted){alert(`⚠️ Il faut exactement ${wanted} rôles. Tu en as ${roles.length}.`);return false;}
  if(!roles.some(r=>['wolf','hacker','saboteur','traitor'].includes(r))){alert('⚠️ Ajoute au moins un rôle Hacker.');return false;}
  if(roles.includes('solo') && selectedMissions().length===0){alert('⚠️ Choisis au moins une mission Solo.');return false;}
  return true;
}

function resetReveal(){
  $('roleCard').classList.add('hidden');
  $('showRoleBtn').classList.remove('hidden');
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');
}

function createGame(){
  if(!validateSetup()) return;
  const roles=shuffle(getSelectedRoles());
  const names=[...document.querySelectorAll('.name-input')].map(x=>x.value.trim());
  state={
    players:roles.map((role,i)=>({id:i+1,name:names[i],role,alive:true,used:{},soloMission:null})),
    revealIndex:0,round:1,phase:'night',gameOver:false,
    enabledSoloMissions:selectedMissions(),soloMission:null,soloTargets:[],soloVoteChanges:0,
    votes:{},nightVotes:{},nightVictim:null,protectedPlayer:null,blockedPlayers:[],fakeEvent:false,
    turnQueue:[],turnIndex:0
  };
  $('revealPlayer').textContent=state.players[0].name;
  resetReveal();
  showScreen('reveal');
}

function showRole(){
  const p=state.players[state.revealIndex];
  if(!p) return;
  const r=ROLES[p.role];
  $('roleIcon').textContent=r.icon;
  $('roleName').textContent=r.name;
  $('roleTeam').textContent=r.team;
  $('roleDescription').textContent=r.description;
  $('roleCard').classList.remove('hidden');
  $('showRoleBtn').classList.add('hidden');
  if(p.role==='solo'){
    $('soloMissionChoice').innerHTML=state.enabledSoloMissions.map(m=>`<option value="${m}">${MISSIONS[m].icon} ${MISSIONS[m].name}</option>`).join('');
    $('soloChoice').classList.remove('hidden');
    $('nextRevealBtn').classList.add('hidden');
  }
}

function confirmSoloMission(){
  const p=state.players[state.revealIndex];
  if(!p || p.role!=='solo') return;
  p.soloMission=$('soloMissionChoice').value;
  state.soloMission=p.soloMission;
  $('soloChoice').classList.add('hidden');
  $('secretMission').textContent=`🔒 ${MISSIONS[p.soloMission].icon} ${MISSIONS[p.soloMission].name} — ${MISSIONS[p.soloMission].description}`;
  $('secretMission').classList.remove('hidden');
  $('nextRevealBtn').classList.remove('hidden');
}

function nextReveal(){
  if(!state) return;
  state.revealIndex++;
  if(state.revealIndex>=state.players.length){
    startNight();
    return;
  }
  $('revealPlayer').textContent=state.players[state.revealIndex].name;
  resetReveal();
}

function renderPlayers(){
  $('playersList').innerHTML=state.players.map(p=>`<div class="player-chip ${p.alive?'':'dead'}"><strong>${ROLES[p.role].icon} ${p.name}</strong><small>${p.alive?'🟢 Vivant':'⚫ Éliminé'}</small></div>`).join('');
  $('aliveCount').textContent=alive().length;
  $('roundLabel').textContent=`TOUR ${state.round}`;
  $('phaseTitle').textContent=state.phase==='night'?'🌙 Nuit':'☀️ Jour';
}

function secretHeader(p,text){
  return `<div class="secret-turn"><div>🔒 TOUR SECRET</div><h3>${text}</h3><p class="hint">Passe le téléphone à <strong>${p.name}</strong>. Personne d'autre ne regarde.</p></div>`;
}

function startNight(){
  if(!state || state.gameOver) return;
  state.phase='night';
  state.nightVictim=null;
  state.nightVotes={};
  state.protectedPlayer=null;
  state.blockedPlayers=[];
  state.fakeEvent=false;
  state.turnQueue=alive().map(p=>p.id);
  state.turnIndex=0;
  showScreen('game');
  showNightTurn();
}

function nightAction(p){
  if(p.role==='wolf'){
    return `<p>🐺 Choisis secrètement une victime.</p><select id="secretTarget"><option value="">Choisir...</option>${targetOptions(p.id,x=>!isHacker(x))}</select><button class="secondary-btn" id="secretDone">Valider mon choix</button>`;
  }
  if(p.role==='hacker' && !p.used.hacker){
    return `<p>💻 Bloque le pouvoir d'un joueur cette nuit.</p><select id="secretTarget"><option value="">Choisir...</option>${targetOptions(p.id)}</select><button class="secondary-btn" id="secretDone">Bloquer</button>`;
  }
  if(p.role==='support' && !p.used.support){
    return `<p>🛡️ Protège secrètement un joueur cette nuit.</p><select id="secretTarget"><option value="">Choisir...</option>${targetOptions()}</select><button class="secondary-btn" id="secretDone">Protéger</button>`;
  }
  if(p.role==='analyst' && !p.used.analyst){
    return `<p>🔎 Découvre l'équipe d'un joueur.</p><select id="secretTarget"><option value="">Choisir...</option>${targetOptions(p.id)}</select><button class="secondary-btn" id="analystBtn">Analyser</button>`;
  }
  if(p.role==='healer' && !p.used.healer){
    return `<p>❤️‍🩹 Utilise ton pouvoir pour sauver la prochaine victime de la nuit.</p><button class="secondary-btn" id="healerBtn">Utiliser mon pouvoir</button><button class="secondary-btn" id="secretDone">Ne pas utiliser</button>`;
  }
  if(p.role==='saboteur' && !p.used.saboteur){
    return `<p>💣 Déclencher un faux événement cette nuit ?</p><button class="secondary-btn" id="saboteurBtn">Déclencher</button><button class="secondary-btn" id="secretDone">Ne pas utiliser</button>`;
  }
  return `<p>🎮 Tu n'as aucune action à faire cette nuit.</p><button class="secondary-btn" id="secretDone">Terminer mon tour</button>`;
}

function showNightTurn(){
  if(state.turnIndex>=state.turnQueue.length){finishNight();return;}
  const p=player(state.turnQueue[state.turnIndex]);
  if(!p || !p.alive){state.turnIndex++;showNightTurn();return;}
  $('gameMessage').textContent=`🌙 Nuit ${state.round}`;
  $('actionArea').innerHTML=secretHeader(p,'À toi de jouer')+nightAction(p);
  renderPlayers();
}

function finishNight(){
  const count={};
  Object.values(state.nightVotes).forEach(target=>{count[target]=(count[target]||0)+1;});
  const wolves=alive().filter(p=>p.role==='wolf');
  if(wolves.length){
    const max=Math.max(...Object.values(count),0);
    const leaders=Object.keys(count).filter(k=>count[k]===max);
    if(leaders.length===1) state.nightVictim=Number(leaders[0]);
  }
  const victim=state.nightVictim;
  if(victim){
    const healer=alive().find(p=>p.used.healTonight);
    if(healer){
      healer.used.healTonight=false;
      alert(`❤️‍🩹 ${healer.name} a sauvé la victime de la nuit.`);
    }else if(state.protectedPlayer===victim){
      alert(`🛡️ ${player(victim).name} était protégé.`);
    }else{
      eliminate(victim,'les Hackers');
    }
  }
  if(state.fakeEvent && !state.gameOver) alert('⚠️ Un événement étrange s’est produit cette nuit…');
  if(!state.gameOver) startDay();
}

function startDay(){
  if(state.gameOver)return;
  state.phase='day';
  state.votes={};
  state.turnQueue=alive().map(p=>p.id);
  state.turnIndex=0;
  showDayTurn();
}

function showDayTurn(){
  if(state.turnIndex>=state.turnQueue.length){finishDay();return;}
  const p=player(state.turnQueue[state.turnIndex]);
  if(!p || !p.alive){state.turnIndex++;showDayTurn();return;}
  $('gameMessage').textContent=`☀️ Jour ${state.round}`;
  $('actionArea').innerHTML=secretHeader(p,'Vote secret')+`<p>🗳️ Choisis qui tu veux éliminer.</p><select id="secretVote"><option value="">Choisir...</option>${targetOptions(p.id)}</select>${p.role==='speedrunner'&&!p.used.speedVote?`<label><input type="checkbox" id="doubleVote"> ⚡ Utiliser mon vote double</label>`:''}<button class="secondary-btn" id="secretDone">Valider mon vote</button>`;
  renderPlayers();
}

function finishDay(){
  const strat=alive().find(p=>p.role==='strategist'&&!p.used.strategist);
  if(strat){
    $('actionArea').innerHTML=secretHeader(strat,'Pouvoir du Stratège')+`<p>🧠 Annuler tous les votes et refaire voter le village ?</p><div class="action-buttons"><button class="secondary-btn" id="cancelVote">Annuler le vote</button><button class="secondary-btn" id="keepVote">Garder le vote</button></div>`;
    return;
  }
  resolveVotes();
}

function resolveVotes(){
  const tally={};
  Object.entries(state.votes).forEach(([id,target])=>{
    const p=player(id);
    const weight=p?.used.doubleVote?2:1;
    tally[target]=(tally[target]||0)+weight;
  });
  const max=Math.max(...Object.values(tally),0);
  const leaders=Object.keys(tally).filter(k=>tally[k]===max);
  if(leaders.length===1) eliminate(Number(leaders[0]),'le vote du village');
  else alert('⚖️ Égalité : personne n’est éliminé.');
  if(!state.gameOver){state.round++;startNight();}
}

function eliminate(id,reason){
  const p=player(id);
  if(!p || !p.alive)return;
  if(state.protectedPlayer===id){state.protectedPlayer=null;alert(`🛡️ ${p.name} est protégé : élimination annulée.`);return;}
  p.alive=false;
  alert(`💀 ${p.name} est éliminé par ${reason}.\nRôle : ${ROLES[p.role].name}`);
  checkVictory();
}

function checkVictory(){
  if(state.gameOver)return;
  const s=solo();
  if(s && s.alive && s.soloMission==='manipulateur' && alive().length<=3){win(`🃏 ${s.name} gagne avec la mission Manipulateur !`);return;}
  if(s && s.alive && s.soloMission==='boss' && alive().length===1){win(`🃏 ${s.name} gagne avec la mission Boss Final !`);return;}
  if(s && s.soloMission==='chaos' && s.soloTargets.length===2 && s.soloTargets.every(id=>!player(id)?.alive)){win(`🃏 ${s.name} gagne avec la mission Chaos !`);return;}
  const hackers=alive().filter(isHacker).length;
  const bons=alive().filter(p=>!isHacker(p)&&p.role!=='solo').length;
  if(hackers===0){win('🎉 Les Bons gagnent ! Tous les Hackers sont éliminés.');return;}
  if(hackers>=bons){win('🐺 Les Hackers gagnent ! Ils sont désormais majoritaires.');}
}

function win(message){
  state.gameOver=true;
  $('gameMessage').textContent=message;
  $('actionArea').innerHTML=`<div class="secret-turn"><h3>🏆 Partie terminée</h3><p>${message}</p><button class="primary-btn" id="restartBtn">🔄 Nouvelle partie</button></div>`;
  renderPlayers();
}

function handleSecretDone(){
  const p=player(state.turnQueue[state.turnIndex]);
  if(!p || !p.alive)return;
  if(state.phase==='night'){
    if(p.role==='wolf'){
      const target=Number($('secretTarget')?.value);
      if(!target){alert('⚠️ Choisis une victime.');return;}
      state.nightVotes[p.id]=target;
    }else if(p.role==='hacker'&&!p.used.hacker){
      const target=Number($('secretTarget')?.value);
      if(!target){alert('⚠️ Choisis un joueur.');return;}
      state.blockedPlayers.push(target);p.used.hacker=true;
    }else if(p.role==='support'&&!p.used.support){
      const target=Number($('secretTarget')?.value);
      if(!target){alert('⚠️ Choisis un joueur.');return;}
      state.protectedPlayer=target;p.used.support=true;
    }else if(p.role==='healer'){
      p.used.healTonight=false;
    }
  }else if(state.phase==='day'){
    const target=Number($('secretVote')?.value);
    if(!target){alert('⚠️ Choisis un joueur.');return;}
    p.used.doubleVote=Boolean($('doubleVote')?.checked);
    if(p.used.doubleVote)p.used.speedVote=true;
    state.votes[p.id]=target;
  }
  state.turnIndex++;
  if(state.phase==='night')showNightTurn();else showDayTurn();
}

function useHealer(){
  const p=player(state.turnQueue[state.turnIndex]);
  if(!p || p.role!=='healer' || p.used.healer)return;
  p.used.healer=true;
  p.used.healTonight=true;
  alert('❤️‍🩹 Ton pouvoir est activé. La victime de cette nuit sera sauvée.');
  state.turnIndex++;
  showNightTurn();
}

function useAnalyst(){
  const p=player(state.turnQueue[state.turnIndex]);
  const target=Number($('secretTarget')?.value);
  if(!target){alert('⚠️ Choisis un joueur.');return;}
  if(!p || p.role!=='analyst' || p.used.analyst)return;
  p.used.analyst=true;
  alert(`${ROLES[player(target).role].icon} ${player(target).name} est dans l’équipe ${isHacker(player(target))?'HACKERS':'BONS'}.`);
  state.turnIndex++;
  showNightTurn();
}

function useSaboteur(){
  const p=player(state.turnQueue[state.turnIndex]);
  if(!p || p.role!=='saboteur' || p.used.saboteur)return;
  p.used.saboteur=true;
  state.fakeEvent=true;
  alert('💣 Faux événement déclenché.');
  state.turnIndex++;
  showNightTurn();
}

function cancelVote(){
  const strat=alive().find(p=>p.role==='strategist'&&!p.used.strategist);
  if(!strat)return resolveVotes();
  strat.used.strategist=true;
  state.votes={};
  state.turnQueue=alive().map(p=>p.id);
  state.turnIndex=0;
  alert('🧠 Le Stratège annule le vote. Tout le monde revote.');
  showDayTurn();
}

function bind(){
  $('startBtn')?.addEventListener('click',()=>showScreen('setup'));
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>showScreen(btn.dataset.go)));
  $('minusPlayers')?.addEventListener('click',()=>{const n=Math.max(5,Number($('playerCount').textContent)-1);$('playerCount').textContent=n;renderNameInputs();updateRoleTotal();});
  $('plusPlayers')?.addEventListener('click',()=>{const n=Math.min(20,Number($('playerCount').textContent)+1);$('playerCount').textContent=n;renderNameInputs();updateRoleTotal();});
  document.querySelectorAll('.role-check,.role-count').forEach(el=>el.addEventListener('input',updateRoleTotal));
  document.querySelectorAll('.role-check').forEach(el=>el.addEventListener('change',updateRoleTotal));
  $('createBtn')?.addEventListener('click',createGame);
  $('showRoleBtn')?.addEventListener('click',showRole);
  $('confirmSoloMissionBtn')?.addEventListener('click',confirmSoloMission);
  $('nextRevealBtn')?.addEventListener('click',nextReveal);
  document.addEventListener('click',e=>{
    if(e.target.id==='secretDone')handleSecretDone();
    if(e.target.id==='analystBtn')useAnalyst();
    if(e.target.id==='healerBtn')useHealer();
    if(e.target.id==='saboteurBtn')useSaboteur();
    if(e.target.id==='cancelVote')cancelVote();
    if(e.target.id==='keepVote')resolveVotes();
    if(e.target.id==='restartBtn')showScreen('setup');
  });
  renderNameInputs();
  updateRoleTotal();
}

document.addEventListener('DOMContentLoaded',bind);
