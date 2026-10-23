/* =====================================================================
   regles.js — Moteur de règles partagé (mode local ET mode en ligne)
   Toutes les règles du jeu vivent ici, une seule fois.
   ===================================================================== */
(function(){
'use strict';

const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o||{}));

/* ---------- Camps ---------- */
const LABELS={
  gamer:{good:'BONS',evil:'HACKERS',solo:'SOLO'},
  naruto:{good:'VILLAGE',evil:'AKATSUKI',solo:'SOLO'}
};

/* ---------- Rôles ----------
   camp   : good | evil | solo
   power  : pouvoir de nuit { key, type, freq:'night'|'once', self, order, text }
   leader : prioritaire pour choisir la victime de la nuit
   passive: pouvoir automatique (gaara, kakuzu, strategy, double…)            */
const ROLES={
gamer:{
 'Joueur Gamer':{icon:'🎮',camp:'good',desc:'Aucun pouvoir. Gagne avec les BONS.'},
 'Loup Gamer':{icon:'🐺',camp:'evil',leader:true,desc:'Chaque nuit, choisit la victime des Hackers.'},
 'Healer':{icon:'❤️‍🩹',camp:'good',desc:'Chaque nuit, protège un joueur (il peut se protéger lui-même).',
   power:{key:'heal',type:'protect',freq:'night',self:true,order:60,text:'Choisis un joueur à protéger cette nuit.'}},
 'Stratège':{icon:'🧠',camp:'good',passive:'strategy',desc:'Une fois par partie, peut annuler une élimination par vote.'},
 'Support':{icon:'🤝',camp:'good',desc:'Une fois par partie, protège un joueur pendant la nuit ET lors du vote qui suit.',
   power:{key:'support',type:'guard',freq:'once',self:true,order:40,text:'Une seule fois : protège un joueur cette nuit et au vote de demain.'}},
 'Analyste':{icon:'🔎',camp:'good',desc:'Une fois par partie, découvre si un joueur est BON ou HACKER.',
   power:{key:'analyse',type:'investigate',freq:'once',order:30,text:'Une seule fois : découvre le camp d’un joueur.'}},
 'Speedrunner':{icon:'⚡',camp:'good',passive:'double',desc:'Une fois par partie, peut faire compter son vote double.'},
 'Hacker':{icon:'💻',camp:'evil',desc:'Une fois par partie, bloque le pouvoir d’un joueur pendant la nuit.',
   power:{key:'block',type:'block',freq:'once',order:10,text:'Une seule fois : bloque le pouvoir d’un joueur cette nuit.'}},
 'Saboteur':{icon:'🧨',camp:'evil',desc:'Une fois par partie, déclenche une fausse alerte pour semer le doute.',
   power:{key:'fake',type:'fake',freq:'once',order:20,text:'Une seule fois : déclenche une fausse alerte annoncée au réveil.'}},
 'Solo Player':{icon:'🎭',camp:'solo',desc:'Choisit une mission secrète au début de la partie et doit la réussir.'},
 'Manipulateur':{icon:'🎭',camp:'solo',desc:'Gagne s’il est encore vivant lorsqu’il ne reste que 3 joueurs.'},
 'Chaos':{icon:'🌀',camp:'solo',desc:'Reçoit 2 cibles secrètes. Gagne si les deux sont éliminées.'},
 'Opportuniste':{icon:'🎯',camp:'solo',passive:'peek',desc:'Voit les votes des autres avant de voter. Gagne avec le camp victorieux s’il est vivant.'},
 'Boss Final':{icon:'👑',camp:'solo',desc:'Gagne s’il devient le dernier joueur vivant.'},
 'Traître':{icon:'🗡️',camp:'good',traitor:true,desc:'Commence chez les BONS, puis rejoint secrètement les HACKERS à partir du tour 3.'}
},
naruto:{
 'Naruto':{icon:'🍥',camp:'good',desc:'Voyant : chaque nuit, découvre le camp d’un joueur.',
   power:{key:'seer',type:'investigate',freq:'night',order:10,text:'Découvre le camp d’un joueur.'}},
 'Sasuke':{icon:'⚡',camp:'good',desc:'Enquêteur : chaque nuit, découvre si un joueur possède un pouvoir de nuit.',
   power:{key:'sharingan',type:'haspower',freq:'night',order:11,text:'Découvre si ce joueur possède un pouvoir de nuit.'}},
 'Jiraiya':{icon:'🐸',camp:'good',desc:'Informateur : une fois par partie, découvre le rôle exact d’un joueur.',
   power:{key:'spyroll',type:'role',freq:'once',order:12,text:'Une seule fois : découvre le rôle exact d’un joueur.'}},
 'Temari':{icon:'🌪️',camp:'good',desc:'Éclaireuse : une fois par partie, découvre si un joueur est un SOLO.',
   power:{key:'scout',type:'solo',freq:'once',order:13,text:'Une seule fois : découvre si ce joueur joue en SOLO.'}},
 'Rock Lee':{icon:'🥋',camp:'good',desc:'Duelliste : une fois par partie, défie un joueur. S’il est de l’Akatsuki, il tombe ; sinon c’est Rock Lee qui tombe.',
   power:{key:'duel',type:'duel',freq:'once',order:20,text:'Une seule fois : provoque un duel. Si ta cible est de l’Akatsuki elle est éliminée, sinon c’est toi.'}},
 'Might Guy':{icon:'🔥',camp:'good',desc:'Mentor : une fois par partie, protège un allié cette nuit ET au vote suivant.',
   power:{key:'gates',type:'guard',freq:'once',self:false,order:21,text:'Une seule fois : protège un allié cette nuit et au vote de demain.'}},
 'Sakura':{icon:'🌸',camp:'good',desc:'Médecin : chaque nuit, protège un joueur.',
   power:{key:'heal',type:'protect',freq:'night',self:true,order:22,text:'Choisis un joueur à protéger cette nuit.'}},
 'Kakashi':{icon:'👁️',camp:'good',desc:'Gardien : chaque nuit, protège un joueur (pas lui-même).',
   power:{key:'guard',type:'protect',freq:'night',order:23,text:'Choisis un joueur à protéger cette nuit.'}},
 'Choji':{icon:'🍖',camp:'good',desc:'Protecteur : chaque nuit, protège un joueur (pas lui-même).',
   power:{key:'guard',type:'protect',freq:'night',order:24,text:'Choisis un joueur à protéger cette nuit.'}},
 'Gamabunta':{icon:'🐸',camp:'good',desc:'Protecteur : chaque nuit, protège un joueur (pas lui-même).',
   power:{key:'guard',type:'protect',freq:'night',order:25,text:'Choisis un joueur à protéger cette nuit.'}},
 'Tsunade':{icon:'💚',camp:'good',desc:'Grande soigneuse : une fois par partie, sauve un joueur (elle peut se sauver).',
   power:{key:'save',type:'protect',freq:'once',self:true,order:26,text:'Une seule fois : sauve un joueur cette nuit.'}},
 'Kiba':{icon:'🐺',camp:'good',desc:'Pisteur : chaque nuit, découvre qui un joueur est allé voir.',
   power:{key:'track',type:'track',freq:'night',order:40,text:'Suis la trace d’un joueur : tu sauras qui il a ciblé cette nuit.'}},
 'Shino':{icon:'🪲',camp:'good',desc:'Observateur : chaque nuit, découvre si un joueur a utilisé un pouvoir.',
   power:{key:'bugs',type:'activity',freq:'night',order:41,text:'Observe un joueur : as-t-il utilisé un pouvoir cette nuit ?'}},
 'Hinata':{icon:'👁️',camp:'good',desc:'Sentinelle : chaque nuit, découvre qui a visité un joueur.',
   power:{key:'watch',type:'watch',freq:'night',order:42,text:'Surveille un joueur : tu sauras qui l’a ciblé cette nuit.'}},
 'Shikamaru':{icon:'🧠',camp:'good',passive:'strategy',desc:'Stratège : une fois par partie, peut annuler une élimination par vote.'},
 'Gaara':{icon:'🏜️',camp:'good',passive:'gaara',desc:'Défenseur : survit automatiquement à la première attaque de nuit.'},
 'Pain':{icon:'☁️',camp:'evil',leader:true,desc:'Chef : chaque nuit, choisit la victime de l’Akatsuki.'},
 'Obito':{icon:'🌀',camp:'evil',desc:'Manipulateur : une fois par partie, bloque le pouvoir d’un joueur.',
   power:{key:'block',type:'block',freq:'once',order:1,text:'Une seule fois : bloque le pouvoir d’un joueur cette nuit.'}},
 'Itachi':{icon:'👁️',camp:'evil',desc:'Illusionniste : une fois par partie, fausse le résultat des enquêtes sur un joueur cette nuit.',
   power:{key:'genjutsu',type:'disguise',freq:'once',self:true,order:2,text:'Une seule fois : toute enquête sur ce joueur cette nuit donnera un faux résultat.'}},
 'Sasori':{icon:'🦂',camp:'evil',desc:'Marionnettiste : une fois par partie, contrôle le vote d’un joueur au vote suivant.',
   power:{key:'puppet',type:'puppet',freq:'once',order:3,text:'Une seule fois : au prochain vote, ce joueur votera comme toi.'}},
 'Kisame':{icon:'🦈',camp:'evil',desc:'Chasseur : une fois par partie, élimine une cible supplémentaire.',
   power:{key:'hunt',type:'extrakill',freq:'once',order:31,text:'Une seule fois : attaque une seconde cible cette nuit.'}},
 'Hidan':{icon:'🔴',camp:'evil',desc:'Vengeur : une fois, maudit un joueur. Si Hidan meurt, le joueur maudit meurt avec lui.',
   power:{key:'curse',type:'mark',freq:'once',order:32,text:'Une seule fois : maudis un joueur. Si tu meurs, il meurt avec toi.'}},
 'Deidara':{icon:'💥',camp:'evil',desc:'Saboteur : une fois par partie, déclenche une fausse explosion annoncée au réveil.',
   power:{key:'fake',type:'fake',freq:'once',order:33,text:'Une seule fois : déclenche une fausse explosion pour semer le doute.'}},
 'Kakuzu':{icon:'💰',camp:'evil',passive:'kakuzu',desc:'Survivant : résiste automatiquement à la première élimination (nuit ou vote).'},
 'Zetsu':{icon:'🌿',camp:'evil',desc:'Espion : une fois par partie, découvre qui un joueur a ciblé et qui l’a ciblé.',
   power:{key:'spy',type:'spy',freq:'once',order:43,text:'Une seule fois : espionne un joueur cette nuit.'}},
 'Orochimaru':{icon:'🐍',camp:'solo',desc:'Expérimentateur : gagne s’il fait partie des 2 derniers survivants.'},
 'Madara':{icon:'🔴',camp:'solo',desc:'Conquérant : gagne s’il est vivant quand l’Akatsuki est éliminée et qu’il reste 3 joueurs ou moins.'},
 'Kabuto':{icon:'🧪',camp:'solo',desc:'Médecin noir : reçoit une cible secrète. Gagne immédiatement si elle est éliminée par un vote.'},
 'Kaguya':{icon:'🌙',camp:'solo',desc:'Déesse : gagne avec le camp victorieux si elle est encore vivante à la fin.'},
 'Kurama':{icon:'🦊',camp:'solo',desc:'Instinct : gagne s’il est le dernier joueur vivant.'},
 'Traître':{icon:'🗡️',camp:'good',traitor:true,desc:'Commence dans le Village puis rejoint secrètement l’Akatsuki à partir du tour 3.'}
}};

const KILL_ORDER={gamer:50,naruto:30};
const GAMER_SPECIALS=['Stratège','Support','Analyste','Speedrunner','Hacker','Saboteur','Solo Player','Manipulateur','Chaos','Opportuniste','Boss Final','Traître'];
const GAMER_GROUPS=[['🛡️ BONS',['Stratège','Support','Analyste','Speedrunner']],['💻 HACKERS',['Hacker','Saboteur']],['🎭 SOLO',['Solo Player','Manipulateur','Chaos','Opportuniste','Boss Final']],['🗡️ SPÉCIAL',['Traître']]];
const NARUTO_GROUPS=[
 ['🍥 VILLAGE',['Naruto','Sasuke','Sakura','Jiraiya','Kakashi','Kiba','Shikamaru','Choji','Shino','Hinata','Rock Lee','Might Guy','Gamabunta','Tsunade','Temari','Gaara']],
 ['☁️ AKATSUKI',['Pain','Obito','Itachi','Kisame','Deidara','Sasori','Kakuzu','Hidan','Zetsu']],
 ['🎭 SOLOS',['Orochimaru','Madara','Kabuto','Kaguya','Kurama']],
 ['🗡️ SPÉCIAL',['Traître']]
];
const SOLO_MISSIONS=[
 ['survivant','🛡️ Survivant','Être vivant lorsqu’il ne reste que 3 joueurs.'],
 ['chaos','🌀 Chaos','2 joueurs tirés au sort doivent être éliminés.'],
 ['dernier','👑 Dernier vivant','Être le dernier joueur vivant.'],
 ['opportuniste','🎯 Opportuniste','Gagner avec le camp victorieux en restant vivant.']
];
const CARD_MAP={'Traître':'01','Solo Player':'02','Manipulateur':'02','Chaos':'02','Opportuniste':'02','Boss Final':'02','Saboteur':'03','Analyste':'04','Healer':'05','Loup Gamer':'06','Hacker':'07','Support':'08','Speedrunner':'09','Stratège':'10','Joueur Gamer':'11'};

/* ---------- Accès de base ---------- */
const def=(theme,roleName)=>ROLES[theme]?.[roleName]||{icon:'🎭',camp:'good',desc:''};
const byId=(players,id)=>players.find(p=>p.id===id);
const nameOf=(players,id)=>byId(players,id)?.name||'?';
const alive=players=>players.filter(p=>p.alive);
function camp(theme,p,round){const d=def(theme,p.roleName);if(d.traitor&&round>=3)return'evil';return d.camp}
const isEvil=(theme,p,round)=>camp(theme,p,round)==='evil';
const label=(theme,c)=>LABELS[theme][c];
const cardImage=(theme,roleName)=>theme==='naruto'?null:'cartes/carte_'+(CARD_MAP[roleName]||'11')+'.png';
const minPlayers=theme=>theme==='naruto'?3:5;

/* ---------- Distribution des rôles ---------- */
function distribute(theme,count,selected=[]){
  if(count<minPlayers(theme))return{error:theme==='naruto'?'Naruto se joue de 3 à 20 joueurs.':'Il faut au moins 5 joueurs.'};
  if(theme==='naruto')return{roles:narutoRoles(count)};
  const specials=[...new Set(selected)].filter(r=>GAMER_SPECIALS.includes(r));
  if(specials.length>count-2)return{error:'Trop de rôles spéciaux : avec '+count+' joueurs, choisis-en au maximum '+(count-2)+'.'};
  const roles=['Loup Gamer','Healer',...specials];
  while(roles.length<count)roles.push('Joueur Gamer');
  return{roles:shuffle(roles)};
}
function narutoRoles(n){
  const presets={3:['Naruto','Pain','Kurama'],4:['Naruto','Kakashi','Pain','Kurama'],5:['Naruto','Sakura','Kakashi','Itachi','Pain'],6:['Naruto','Sakura','Shikamaru','Itachi','Pain','Kurama'],7:['Naruto','Kakashi','Sakura','Shikamaru','Itachi','Pain','Orochimaru']};
  if(presets[n])return shuffle(presets[n]);
  const village=['Sasuke','Sakura','Jiraiya','Kakashi','Kiba','Shikamaru','Choji','Shino','Hinata','Rock Lee','Might Guy','Gamabunta','Tsunade','Temari','Gaara'];
  const akatsuki=['Obito','Itachi','Kisame','Deidara','Sasori','Kakuzu','Hidan','Zetsu'];
  const solos=['Orochimaru','Madara','Kabuto','Kaguya','Kurama'];
  const evil=Math.min(akatsuki.length+1,Math.max(2,Math.floor(n/4)));
  const solo=n>=8?(n>=14?2:1):0;
  const roles=['Naruto','Pain',...shuffle(akatsuki).slice(0,evil-1),...shuffle(solos).slice(0,solo)];
  if(n>=10&&Math.random()<.5)roles.push('Traître');
  const pool=shuffle(village);
  while(roles.length<n)roles.push(pool.length?pool.shift():'Choji');
  return shuffle(roles.slice(0,n));
}
/* Cibles secrètes de départ (Chaos, Kabuto) */
function initialTargets(theme,players,roleName,selfId){
  const others=shuffle(players.filter(p=>p.id!==selfId)).map(p=>p.id);
  if(roleName==='Chaos')return others.slice(0,2);
  if(roleName==='Kabuto')return others.slice(0,1);
  return[];
}
function soloMissionTargets(players,selfId){return shuffle(players.filter(p=>p.id!==selfId)).slice(0,2).map(p=>p.id)}

/* ---------- Fiche de rôle (révélation) ---------- */
function roleInfo(theme,p,players,round=1){
  const d=def(theme,p.roleName),c=camp(theme,p,round),extra=[];
  if(c==='evil'){
    const mates=players.filter(x=>x.id!==p.id&&isEvil(theme,x,round)).map(x=>x.name);
    extra.push(mates.length?'🤝 Tes alliés : '+mates.join(', '):'🤝 Tu es seul dans ton camp.');
  }
  if(d.traitor)extra.push('🗡️ À partir du tour 3, tu rejoindras le camp '+label(theme,'evil')+'.');
  if(p.roleName==='Chaos'&&p.targets?.length)extra.push('🎯 Tes cibles : '+p.targets.map(id=>nameOf(players,id)).join(' et '));
  if(p.roleName==='Kabuto'&&p.targets?.length)extra.push('🎯 Ta cible secrète : '+nameOf(players,p.targets[0]));
  return{icon:d.icon,name:p.roleName,team:label(theme,c),desc:d.desc,extra};
}

/* ---------- Nuit : liste des étapes ---------- */
function leader(theme,players,round){
  const evil=alive(players).filter(p=>isEvil(theme,p,round));
  return evil.find(p=>def(theme,p.roleName).leader)||evil[0]||null;
}
function nightSteps(theme,players,round,mem={}){
  const steps=[];
  alive(players).forEach(p=>{
    const pw=def(theme,p.roleName).power;
    if(!pw)return;
    if(pw.freq==='once'&&mem[p.id]?.[pw.key])return;
    steps.push({actor:p.id,key:pw.key,type:pw.type,order:pw.order});
  });
  const k=leader(theme,players,round);
  if(k)steps.push({actor:k.id,key:'kill',type:'kill',order:KILL_ORDER[theme]});
  return steps.sort((a,b)=>a.order-b.order);
}
const isBlocked=(actions,id)=>(actions||[]).some(a=>a.type==='block'&&a.target===id);

function stepPrompt(theme,step,players,round){
  const p=byId(players,step.actor),d=def(theme,p.roleName);
  if(step.type==='kill'){
    const mates=alive(players).filter(x=>x.id!==p.id&&isEvil(theme,x,round));
    const title=theme==='naruto'?'☁️ L’Akatsuki se réveille':'🐺 Les Hackers se réveillent';
    const text='Choisis secrètement la victime de cette nuit.'+(mates.length?' Alliés : '+mates.map(x=>x.name).join(', ')+'.':'');
    return{title,text,announce:title,options:alive(players).filter(x=>x.id!==p.id&&!isEvil(theme,x,round)).map(x=>x.id),canSkip:false};
  }
  const pw=d.power,title=d.icon+' '+p.roleName;
  let options;
  if(pw.type==='fake')options=[];
  else if(pw.type==='extrakill')options=alive(players).filter(x=>x.id!==p.id&&!isEvil(theme,x,round)).map(x=>x.id);
  else options=alive(players).filter(x=>pw.self||x.id!==p.id).map(x=>x.id);
  return{title,text:pw.text,announce:(theme==='naruto'?p.roleName:'Le '+p.roleName)+' se réveille.',options,canSkip:true,confirmOnly:pw.type==='fake'};
}

/* ---------- Résultats instantanés (enquêtes) ---------- */
function instantResult(theme,players,round,actions,step,targetId){
  const t=byId(players,targetId);if(!t)return null;
  const disguised=(actions||[]).some(a=>a.type==='disguise'&&a.target===targetId);
  const tn='<b>'+escapeHtml(t.name)+'</b>';
  switch(step.type){
    case'investigate':{
      let c=camp(theme,t,round);
      if(theme==='gamer'&&c==='solo')c='good';
      if(disguised)c=c==='evil'?'good':'evil';
      const lab=theme==='gamer'?(c==='evil'?'HACKER':'BON'):label(theme,c);
      return'🔎 '+tn+' est dans le camp <b>'+lab+'</b>.';
    }
    case'haspower':{
      let has=!!def(theme,t.roleName).power;if(disguised)has=!has;
      return'⚡ '+tn+(has?' possède un pouvoir de nuit.':' n’a aucun pouvoir de nuit.');
    }
    case'role':{
      let r=t.roleName;if(disguised)r=shuffle(['Choji','Kiba','Shino','Gamabunta'].filter(x=>x!==r))[0];
      return'🐸 '+tn+' est <b>'+escapeHtml(r)+'</b>.';
    }
    case'solo':return'🌪️ '+tn+(camp(theme,t,round)==='solo'?' joue en <b>SOLO</b>.':' ne joue pas en solo.');
    case'track':{
      const acts=(actions||[]).filter(a=>a.actor===targetId&&a.target);
      return'🐾 '+tn+(acts.length?' est allé voir : <b>'+acts.map(a=>escapeHtml(nameOf(players,a.target))).join(', ')+'</b>.':' n’est allé voir personne.');
    }
    case'activity':return'🪲 '+tn+((actions||[]).some(a=>a.actor===targetId)?' a utilisé un pouvoir cette nuit.':' n’a rien fait cette nuit.');
    case'watch':{
      const v=[...new Set((actions||[]).filter(a=>a.target===targetId&&a.actor!==step.actor).map(a=>a.actor))];
      return'👁️ '+tn+(v.length?' a été visité par : <b>'+v.map(id=>escapeHtml(nameOf(players,id))).join(', ')+'</b>.':' n’a reçu aucune visite.');
    }
    case'spy':{
      const out=(actions||[]).filter(a=>a.actor===targetId&&a.target).map(a=>escapeHtml(nameOf(players,a.target)));
      const inn=[...new Set((actions||[]).filter(a=>a.target===targetId&&a.actor!==step.actor).map(a=>escapeHtml(nameOf(players,a.actor))))];
      return'🌿 '+tn+' a ciblé : <b>'+(out.join(', ')||'personne')+'</b>. Visité par : <b>'+(inn.join(', ')||'personne')+'</b>.';
    }
  }
  return null;
}

/* ---------- Éliminations (passifs + malédiction de Hidan) ---------- */
function makeKiller(theme,players,mem,dead,log){
  const kill=(id,cause)=>{
    const p=byId(players,id);
    if(!p||!p.alive||dead.has(id))return false;
    const d=def(theme,p.roleName);mem[id]=mem[id]||{};
    if(cause!=='curse'){
      if(d.passive==='kakuzu'&&!mem[id].kakuzu){mem[id].kakuzu=true;log.saved++;return false}
      if(d.passive==='gaara'&&!mem[id].gaara&&(cause==='night'||cause==='duel')){mem[id].gaara=true;log.saved++;return false}
    }
    dead.add(id);log.deaths.push({id,cause});
    if(p.roleName==='Hidan'&&mem[id].mark){log.curse=mem[id].mark;kill(mem[id].mark,'curse')}
    return true;
  };
  return kill;
}

/* ---------- Résolution de la nuit ---------- */
function resolveNight(theme,players,round,memIn,actions){
  const mem=clone(memIn),dead=new Set(),log={deaths:[],saved:0,curse:null};
  const flags={voteImmune:[],puppets:{}},privateMsgs={};
  const blocked=new Set((actions||[]).filter(a=>a.type==='block').map(a=>a.target));
  const valid=(actions||[]).filter(a=>a.type==='block'||!blocked.has(a.actor));
  const pv=(id,msg)=>{(privateMsgs[id]=privateMsgs[id]||[]).push(msg)};

  valid.forEach(a=>{
    if(a.key==='kill')return;
    const pw=def(theme,byId(players,a.actor)?.roleName).power;
    mem[a.actor]=mem[a.actor]||{};
    if(pw?.freq==='once')mem[a.actor][pw.key]=true;
    if(a.type==='mark'&&a.target)mem[a.actor].mark=a.target;
    if(a.type==='puppet'&&a.target)flags.puppets[a.target]=a.actor;
  });
  const protectedSet=new Set(valid.filter(a=>(a.type==='protect'||a.type==='guard')&&a.target).map(a=>a.target));
  valid.filter(a=>a.type==='guard'&&a.target).forEach(a=>flags.voteImmune.push(a.target));

  const kill=makeKiller(theme,players,mem,dead,log);
  const attacks=[...new Set(valid.filter(a=>(a.type==='kill'||a.type==='extrakill')&&a.target).map(a=>a.target))];
  attacks.forEach(id=>{if(protectedSet.has(id)){log.saved++;return}kill(id,'night')});
  valid.filter(a=>a.type==='duel'&&a.target).forEach(a=>{
    const t=byId(players,a.target);
    if(t&&isEvil(theme,t,round))kill(t.id,'duel');else kill(a.actor,'duel');
  });

  const pub=[];
  if(valid.some(a=>a.type==='fake'))pub.push(theme==='naruto'?'💥 Une explosion a retenti dans le Village… mais personne n’a été touché.':'🚨 Une alerte suspecte a été détectée cette nuit… impossible de savoir qui ment.');
  log.deaths.forEach(d=>pub.push(d.cause==='curse'?'🔴 La malédiction de Hidan emporte '+nameOf(players,d.id)+'.':d.cause==='duel'?'🥋 '+nameOf(players,d.id)+' est tombé au cours d’un duel.':'☠️ '+nameOf(players,d.id)+' a été éliminé pendant la nuit.'));
  if(!log.deaths.length)pub.push(log.saved?'🛡️ Une attaque a été repoussée cette nuit.':'🌅 Personne n’a été éliminé cette nuit.');
  blocked.forEach(id=>{if((actions||[]).some(a=>a.actor===id)||def(theme,byId(players,id)?.roleName).power)pv(id,'🔒 Ton pouvoir a été bloqué cette nuit.')});
  Object.entries(flags.puppets).forEach(([id])=>pv(id,'🦂 Des fils invisibles te contrôlent : ton vote de demain suivra celui de Sasori.'));
  return{deaths:log.deaths.map(d=>d.id),messages:pub,privateMsgs,mem,flags};
}

/* ---------- Vote ---------- */
function tallyVotes(players,votes,flags={}){
  const eff={};
  Object.entries(votes||{}).forEach(([voter,v])=>{
    const pup=flags.puppets?.[voter];
    const master=pup&&byId(players,pup)?.alive&&votes[pup];
    eff[voter]={target:master?votes[pup].target:v.target,weight:v.weight||1};
  });
  const c={};
  Object.values(eff).forEach(v=>{if(v.target)c[v.target]=(c[v.target]||0)+v.weight});
  const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  const tie=e.length>1&&e[1][1]===e[0][1];
  return{counts:e,candidate:e.length&&!tie?e[0][0]:null,tie};
}
function strategist(theme,players,mem={}){return alive(players).find(p=>def(theme,p.roleName).passive==='strategy'&&!mem[p.id]?.strategy)||null}
function eliminateByVote(theme,players,round,memIn,flags,candidateId){
  const mem=clone(memIn),dead=new Set(),log={deaths:[],saved:0,curse:null};
  const name=nameOf(players,candidateId);
  if(flags?.voteImmune?.includes(candidateId))return{deaths:[],mem,messages:['🛡️ '+name+' est protégé : le vote ne l’élimine pas.'],kabuto:false};
  const kill=makeKiller(theme,players,mem,dead,log);
  kill(candidateId,'vote');
  const msgs=[];
  if(!log.deaths.length)msgs.push('💰 '+name+' résiste à l’élimination !');
  log.deaths.forEach(d=>msgs.push(d.cause==='curse'?'🔴 La malédiction de Hidan emporte '+nameOf(players,d.id)+'.':'☠️ '+nameOf(players,d.id)+' est éliminé par le vote.'));
  const kab=alive(players).find(p=>p.roleName==='Kabuto'&&!dead.has(p.id));
  const kabuto=!!(kab&&kab.targets?.[0]===candidateId&&dead.has(candidateId));
  return{deaths:log.deaths.map(d=>d.id),mem,messages:msgs,kabuto};
}

/* ---------- Conditions de victoire ---------- */
const WIN={
  BONS:['🛡️','Victoire des BONS !','Tous les Hackers ont été éliminés.'],
  HACKERS:['🐺','Victoire des HACKERS !','Les Hackers ont pris le dessus.'],
  MANIPULATEUR:['🎭','Victoire du MANIPULATEUR !','Il a survécu jusqu’à 3 joueurs.'],
  CHAOS:['🌀','Victoire du CHAOS !','Ses deux cibles ont été éliminées.'],
  'BOSS FINAL':['👑','Victoire du BOSS FINAL !','Il est le dernier joueur vivant.'],
  'SOLO PLAYER':['🎭','Victoire du SOLO PLAYER !','Mission accomplie.'],
  VILLAGE:['🍃','Victoire du VILLAGE !','Tous les membres de l’Akatsuki ont été éliminés.'],
  AKATSUKI:['☁️','Victoire de l’AKATSUKI !','L’Akatsuki est devenue majoritaire.'],
  MADARA:['🔴','Victoire de MADARA !','L’Akatsuki est tombée et Madara domine.'],
  OROCHIMARU:['🐍','Victoire d’OROCHIMARU !','Il fait partie des deux derniers survivants.'],
  KABUTO:['🧪','Victoire de KABUTO !','Sa cible secrète a été éliminée par le vote.'],
  KURAMA:['🦊','Victoire de KURAMA !','Il est le dernier survivant.'],
  PERSONNE:['💀','Personne ne gagne','Il ne reste aucun camp en jeu.']
};
function winner(theme,players,round,opts={}){
  const a=alive(players),has=r=>a.find(p=>p.roleName===r);
  const deadIds=new Set(players.filter(p=>!p.alive).map(p=>p.id));
  let code=null;
  const evil=a.filter(p=>isEvil(theme,p,round)).length;
  const good=a.filter(p=>camp(theme,p,round)==='good').length;
  if(!a.length)code='PERSONNE';
  else if(theme==='naruto'){
    if(opts.kabuto)code='KABUTO';
    else if(has('Kurama')&&a.length===1)code='KURAMA';
    else if(has('Orochimaru')&&a.length<=2)code='OROCHIMARU';
    else if(has('Madara')&&evil===0&&a.length<=3)code='MADARA';
  }else{
    const s=has('Solo Player');
    if(s?.soloMission==='survivant'&&a.length<=3)code='SOLO PLAYER';
    else if(s?.soloMission==='dernier'&&a.length===1)code='SOLO PLAYER';
    else if(s?.soloMission==='chaos'&&s.soloTargets?.length===2&&s.soloTargets.every(id=>deadIds.has(id)))code='SOLO PLAYER';
    else if(has('Manipulateur')&&a.length<=3)code='MANIPULATEUR';
    else{const c=has('Chaos');if(c&&c.targets?.length===2&&c.targets.every(id=>deadIds.has(id)))code='CHAOS'}
    if(!code&&has('Boss Final')&&a.length===1)code='BOSS FINAL';
  }
  if(!code){
    if(evil===0)code=good>0?(theme==='naruto'?'VILLAGE':'BONS'):(a.every(p=>camp(theme,p,round)==='solo')?'PERSONNE':null);
    else if(evil>=good)code=theme==='naruto'?'AKATSUKI':'HACKERS';
  }
  if(!code)return null;
  const w=WIN[code],co=[];
  const campWin=['BONS','HACKERS','VILLAGE','AKATSUKI'].includes(code);
  a.forEach(p=>{
    if(campWin&&p.roleName==='Opportuniste')co.push(p.name+' (Opportuniste)');
    if(campWin&&p.roleName==='Solo Player'&&p.soloMission==='opportuniste')co.push(p.name+' (Solo Player)');
    if(p.roleName==='Kaguya'&&code!=='PERSONNE')co.push(p.name+' (Kaguya)');
  });
  return{code,icon:w[0],title:w[1],msg:w[2]+(co.length?' Gagne aussi : '+co.join(', ')+'.':'')};
}

function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

window.LG={ROLES,LABELS,GAMER_SPECIALS,GAMER_GROUPS,NARUTO_GROUPS,SOLO_MISSIONS,
  shuffle,clone,def,camp,isEvil,label,cardImage,minPlayers,byId,nameOf,alive,
  distribute,initialTargets,soloMissionTargets,roleInfo,nightSteps,isBlocked,stepPrompt,instantResult,
  resolveNight,tallyVotes,strategist,eliminateByVote,winner,escapeHtml};
})();
