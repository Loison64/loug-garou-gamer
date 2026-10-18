/* =====================================================================
   AJOUT POUR supabase-online.js
   À coller dans supabase-online.js, juste AVANT la toute dernière ligne "});"
   (donc après la ligne qui contient tous les addEventListener).

   Ce bloc :
   - ajoute les fonctions qui manquaient : winner, finish, startVote,
     resolveVote, renderVote, renderDay, renderEnd
   - remplace load, hostTick et readyReveal (la dernière définition gagne,
     tu n'as pas besoin de supprimer les anciennes)
   - range les votes et le « prêt » dans la ligne de chaque joueur, pour que
     8 joueurs qui cliquent en même temps ne s'écrasent plus entre eux
   ===================================================================== */

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
