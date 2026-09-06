document.addEventListener('DOMContentLoaded', () => {
  const ROLES = [
    {name:'Joueur Gamer',icon:'🎮',team:'BONS',desc:'Aucun pouvoir. Gagne si tous les méchants sont éliminés.'},
    {name:'Loup Gamer',icon:'🐺',team:'HACKERS',desc:'Choisit secrètement une victime chaque nuit.'},
    {name:'Hacker',icon:'💻',team:'HACKERS',desc:'Un rôle Hacker sans pouvoir pour cette première base.'},
    {name:'Healer',icon:'❤️‍🩹',team:'BONS',desc:'Peut protéger un joueur pendant la nuit.'}
  ];

  let state={players:[],index:0,phase:'reveal',nightStep:0,nightVictim:null,protected:null,voteIndex:0,votes:{}};
  let voiceEnabled=true;
  const $=id=>document.getElementById(id);

  function screen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const t=$(id);if(t)t.classList.add('active');
  }

  function speak(text){
    if(!voiceEnabled||!('speechSynthesis'in window))return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.88;u.pitch=.85;
    window.speechSynthesis.speak(u);
  }

  function voiceButton(){return `<button class="secondary" id="voiceBtn">🔊 Voix : ${voiceEnabled?'ON':'OFF'}</button>`;}

  function bindVoice(){
    const b=$('voiceBtn');if(!b)return;
    b.addEventListener('click',()=>{
      voiceEnabled=!voiceEnabled;
      if(!voiceEnabled&&'speechSynthesis'in window)window.speechSynthesis.cancel();
      b.textContent=`🔊 Voix : ${voiceEnabled?'ON':'OFF'}`;
    });
  }

  function renderNames(){
    const count=Number($('playerCount').textContent)||8,box=$('namesBox');box.innerHTML='';
    for(let i=1;i<=count;i++){
      const row=document.createElement('div');row.className='name-row';
      row.innerHTML=`<label for="player-${i}">👤 Joueur ${i}</label><input id="player-${i}" class="name-input" maxlength="20" placeholder="Entre ton pseudo" value="Joueur ${i}">`;
      box.appendChild(row);
    }
  }

  function startSetup(){renderNames();screen('setup');}

  function changePlayers(delta){
    const el=$('playerCount'),current=Number(el.textContent)||8;
    el.textContent=Math.max(5,Math.min(20,current+delta));renderNames();
  }

  function launch(){
    const names=[...document.querySelectorAll('.name-input')].map(i=>i.value.trim());
    if(names.length<5)return alert('⚠️ Il faut au moins 5 joueurs.');
    if(names.some(n=>!n))return alert('⚠️ Tous les joueurs doivent avoir un pseudo.');
    const normalized=names.map(n=>n.toLowerCase());
    if(new Set(normalized).size!==normalized.length)return alert('⚠️ Les pseudos doivent être différents.');
    const roles=names.map((_,i)=>i===0?ROLES[1]:i===1?ROLES[3]:i===2?ROLES[2]:ROLES[0]);
    for(let i=roles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[roles[i],roles[j]]=[roles[j],roles[i]];}
    state={players:names.map((name,i)=>({name,role:roles[i],alive:true})),index:0,phase:'reveal',nightStep:0,nightVictim:null,protected:null,voteIndex:0,votes:{}};
    showReveal();
  }

  function showReveal(){
    const p=state.players[state.index];if(!p)return;
    $('revealPlayer').textContent=p.name;$('roleCard').classList.add('hidden');$('showRoleBtn').classList.remove('hidden');screen('reveal');
  }

  function revealRole(){
    const p=state.players[state.index];if(!p)return;
    $('roleIcon').textContent=p.role.icon;$('roleName').textContent=p.role.name;$('roleTeam').textContent=p.role.team;$('roleDescription').textContent=p.role.desc;
    $('roleCard').classList.remove('hidden');$('showRoleBtn').classList.add('hidden');speak(`${p.name}, découvre ton rôle.`);
  }

  function nextReveal(){state.index++;if(state.index>=state.players.length)startGame();else showReveal();}

  function startGame(){
    state.phase='night';state.nightStep=0;state.nightVictim=null;state.protected=null;state.voteIndex=0;state.votes={};
    screen('game');$('roundLabel').textContent='TOUR 1';$('phaseTitle').textContent='🌙 Nuit 1';$('aliveCount').textContent=state.players.length;$('gameMessage').textContent='La nuit tombe...';
    renderPlayers([]);showNightIntro();
  }

  function showNightIntro(){
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card"><h3>🌙 La nuit tombe...</h3><p>Tout le village s'endort. Les rôles qui ont une action vont maintenant jouer.</p><button class="primary" id="startNightBtn">🌙 Commencer la nuit</button></div>`;
    speak('La nuit tombe sur le village. Tout le monde ferme les yeux. Les rôles de la nuit vont jouer.');bindVoice();
    $('startNightBtn').addEventListener('click',nextNightStep);
  }

  function nextNightStep(){
    const wolf=state.players.find(p=>p.alive&&p.role.name==='Loup Gamer');
    const healer=state.players.find(p=>p.alive&&p.role.name==='Healer');
    if(state.nightStep===0&&wolf){state.nightStep=1;showWolfTurn(wolf);return;}
    if(state.nightStep<=1&&healer){state.nightStep=2;showHealerTurn(healer);return;}
    finishNight();
  }

  function aliveOptions(excludeName){
    return state.players.filter(p=>p.alive&&p.name!==excludeName).map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
  }

  function showWolfTurn(wolf){
    $('gameMessage').textContent='🐺 Les Loups se réveillent.';renderPlayers([wolf.name]);
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card"><h3>🐺 Loup Gamer</h3><p>Choisis secrètement la victime de cette nuit.</p><select id="nightTarget"><option value="">Choisir une victime</option>${aliveOptions(wolf.name)}</select><button class="primary" id="wolfConfirm">🐺 Choisir la victime</button></div>`;
    speak('Les Loups se réveillent. Loup Gamer, choisis secrètement une victime.');bindVoice();
    $('wolfConfirm').addEventListener('click',()=>{const target=$('nightTarget').value;if(!target)return alert('⚠️ Choisis une victime.');state.nightVictim=target;speak('Les Loups se rendorment.');nextNightStep();});
  }

  function showHealerTurn(healer){
    $('gameMessage').textContent='❤️‍🩹 Le Healer se réveille.';renderPlayers([healer.name]);
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card"><h3>❤️‍🩹 Healer</h3><p>Choisis un joueur à protéger cette nuit.</p><select id="healTarget"><option value="">Choisir un joueur</option>${aliveOptions('')}</select><button class="primary" id="healConfirm">❤️‍🩹 Protéger</button></div>`;
    speak('Le Healer se réveille. Choisis un joueur à protéger cette nuit.');bindVoice();
    $('healConfirm').addEventListener('click',()=>{const target=$('healTarget').value;if(!target)return alert('⚠️ Choisis un joueur à protéger.');state.protected=target;speak('Le Healer se rendort.');finishNight();});
  }

  function finishNight(){
    state.phase='day';const victim=state.nightVictim,saved=victim&&victim===state.protected;
    if(victim&&!saved){const p=state.players.find(x=>x.name===victim);if(p)p.alive=false;}
    $('roundLabel').textContent='TOUR 1';$('phaseTitle').textContent='☀️ Jour 1';$('aliveCount').textContent=state.players.filter(p=>p.alive).length;
    $('gameMessage').textContent=saved?'❤️‍🩹 Une attaque a été empêchée cette nuit.':victim?`☠️ ${victim} a été éliminé pendant la nuit.`:'🌅 La nuit est terminée.';
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card"><h3>☀️ Le jour se lève</h3><p>${saved?'Le Healer a sauvé la victime.':victim?`${escapeHtml(victim)} a été retrouvé éliminé.`:'Personne n’a été éliminé cette nuit.'}</p><button class="primary" id="dayBtn">☀️ Continuer</button></div>`;
    renderPlayers([]);speak(saved?'Le jour se lève. Le Healer a empêché une élimination cette nuit.':victim?`Le jour se lève. ${victim} a été éliminé cette nuit.`:'Le jour se lève. Personne n’a été éliminé cette nuit.');bindVoice();
    $('dayBtn').addEventListener('click',startVoting);
  }

  function startVoting(){
    state.phase='vote';state.voteIndex=0;state.votes={};
    $('roundLabel').textContent=`TOUR ${state.round||1}`;$('phaseTitle').textContent='🗳️ Vote';
    $('aliveCount').textContent=state.players.filter(p=>p.alive).length;
    $('gameMessage').textContent='Le village doit choisir un joueur à éliminer.';
    speak('Le village se réunit. Chaque joueur vivant va voter secrètement.');
    showVoteTurn();
  }

  function showVoteTurn(){
    const alive=state.players.filter(p=>p.alive);
    if(state.voteIndex>=alive.length){finishVoting();return;}
    const voter=alive[state.voteIndex];
    $('gameMessage').textContent=`🗳️ ${voter.name} doit voter.`;
    renderPlayers([voter.name]);
    const options=alive.filter(p=>p.name!==voter.name).map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card vote-card"><h3>🗳️ Tour de ${escapeHtml(voter.name)}</h3><p>Les autres joueurs sont cachés. Choisis secrètement qui tu veux éliminer.</p><select id="voteTarget"><option value="">Choisir un joueur</option>${options}</select><button class="primary" id="voteConfirm">🗳️ Valider mon vote</button></div>`;
    speak(`${voter.name}, c'est à toi de voter. Choisis secrètement un joueur.`);bindVoice();
    $('voteConfirm').addEventListener('click',()=>{
      const target=$('voteTarget').value;
      if(!target)return alert('⚠️ Choisis un joueur.');
      state.votes[voter.name]=target;
      state.voteIndex++;
      showVoteTurn();
    });
  }

  function finishVoting(){
    const counts={};
    Object.values(state.votes).forEach(target=>counts[target]=(counts[target]||0)+1);
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const top=entries[0];
    let message='⚖️ Égalité : personne n’est éliminé.';
    let eliminated=null;
    if(top){
      const tied=entries.filter(e=>e[1]===top[1]);
      if(tied.length===1){
        eliminated=state.players.find(p=>p.name===top[0]);
        if(eliminated)eliminated.alive=false;
        message=`☠️ ${top[0]} est éliminé avec ${top[1]} vote${top[1]>1?'s':''}.`;
      }
    }
    $('aliveCount').textContent=state.players.filter(p=>p.alive).length;
    $('gameMessage').textContent=message;
    const results=entries.length?entries.map(([name,n])=>`<div class="vote-result"><strong>${escapeHtml(name)}</strong><span>${n} vote${n>1?'s':''}</span></div>`).join(''):'<p>Aucun vote.</p>';
    $('actionArea').innerHTML=`${voiceButton()}<div class="night-card"><h3>📊 Résultat du vote</h3>${results}<p>${eliminated?`Le joueur ${escapeHtml(eliminated.name)} quitte la partie.`:'Aucun joueur n’est éliminé.'}</p><button class="primary" id="nextRoundBtn">🌙 Commencer la nuit suivante</button></div>`;
    renderPlayers([]);
    speak(eliminated?`${eliminated.name} est éliminé par le vote.`:'Égalité. Personne n’est éliminé.');bindVoice();
    $('nextRoundBtn').addEventListener('click',startNextNight);
  }

  function startNextNight(){
    state.round=(state.round||1)+1;state.phase='night';state.nightStep=0;state.nightVictim=null;state.protected=null;state.votes={};state.voteIndex=0;
    $('roundLabel').textContent=`TOUR ${state.round}`;$('phaseTitle').textContent=`🌙 Nuit ${state.round}`;$('aliveCount').textContent=state.players.filter(p=>p.alive).length;$('gameMessage').textContent=`La nuit ${state.round} commence.`;
    renderPlayers([]);showNightIntro();
  }

  function renderPlayers(activeNames=[]){
    const active=new Set(activeNames);
    $('playersList').innerHTML=state.players.map(p=>{
      const cls=!p.alive?'dead':active.size===0?'':(active.has(p.name)?'active':'inactive');
      return `<div class="player ${cls}"><strong>${escapeHtml(p.name)}</strong><br><small>${p.alive?'🟢 Vivant':'⚫ Éliminé'}</small></div>`;
    }).join('');
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  $('startBtn').addEventListener('click',startSetup);
  $('minusPlayers').addEventListener('click',()=>changePlayers(-1));
  $('plusPlayers').addEventListener('click',()=>changePlayers(1));
  $('launchBtn').addEventListener('click',launch);
  $('showRoleBtn').addEventListener('click',revealRole);
  $('nextRevealBtn').addEventListener('click',nextReveal);
  document.querySelectorAll('.back').forEach(button=>button.addEventListener('click',()=>screen(button.dataset.screen)));
  renderNames();
});
