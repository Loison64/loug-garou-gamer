const ROLES=[
 {name:'Joueur Gamer',icon:'🎮',team:'BONS',desc:'Aucun pouvoir. Gagne si tous les méchants sont éliminés.'},
 {name:'Loup Gamer',icon:'🐺',team:'HACKERS',desc:'Choisit secrètement une victime chaque nuit.'},
 {name:'Hacker',icon:'💻',team:'HACKERS',desc:'Un rôle Hacker sans pouvoir pour cette première base.'},
 {name:'Healer',icon:'❤️‍🩹',team:'BONS',desc:'Peut protéger un joueur dans les prochaines versions.'}
];

let state={players:[],index:0};
const $=id=>document.getElementById(id);

function screen(id){
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
 $(id).classList.add('active');
}

function renderNames(){
 const n=Number($('playerCount').textContent);
 const box=$('namesBox');
 box.innerHTML='';
 for(let i=1;i<=n;i++){
  const row=document.createElement('div');
  row.className='name-row';
  row.innerHTML=`<label>👤 Joueur ${i}</label><input class="name-input" maxlength="20" placeholder="Entre ton pseudo" value="Joueur ${i}">`;
  box.appendChild(row);
 }
}

function startSetup(){screen('setup');renderNames()}

function changePlayers(delta){
 const el=$('playerCount');
 const value=Math.max(5,Math.min(20,Number(el.textContent)+delta));
 el.textContent=value;
 renderNames();
}

function launch(){
 const names=[...document.querySelectorAll('.name-input')].map(x=>x.value.trim());
 if(names.some(x=>!x)){alert('⚠️ Tous les joueurs doivent avoir un pseudo.');return}
 if(new Set(names.map(x=>x.toLowerCase())).size!==names.length){alert('⚠️ Les pseudos doivent être différents.');return}
 const roles=[];
 for(let i=0;i<names.length;i++){
  if(i===0)roles.push(ROLES[1]);
  else if(i===1)roles.push(ROLES[2]);
  else roles.push(ROLES[0]);
 }
 for(let i=roles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[roles[i],roles[j]]=[roles[j],roles[i]]}
 state={players:names.map((name,i)=>({name,role:roles[i],alive:true})),index:0};
 showReveal();
}

function showReveal(){
 const p=state.players[state.index];
 $('revealPlayer').textContent=p.name;
 $('roleCard').classList.add('hidden');
 $('showRoleBtn').classList.remove('hidden');
 screen('reveal');
}

function revealRole(){
 const p=state.players[state.index];
 $('roleIcon').textContent=p.role.icon;
 $('roleName').textContent=p.role.name;
 $('roleTeam').textContent=p.role.team;
 $('roleDescription').textContent=p.role.desc;
 $('roleCard').classList.remove('hidden');
 $('showRoleBtn').classList.add('hidden');
}

function nextReveal(){
 state.index++;
 if(state.index>=state.players.length){startGame();return}
 showReveal();
}

function startGame(){
 screen('game');
 $('roundLabel').textContent='TOUR 1';
 $('phaseTitle').textContent='🌙 Nuit';
 $('aliveCount').textContent=state.players.length;
 $('gameMessage').textContent='La première nuit commence.';
 $('actionArea').innerHTML='<strong>🌙 Nuit 1</strong><p>La partie est prête. Les actions de jeu seront ajoutées étape par étape.</p><button class="secondary" id="nightBtn">Continuer</button>';
 renderPlayers();
}

function renderPlayers(){
 $('playersList').innerHTML=state.players.map(p=>`<div class="player ${p.alive?'':'dead'}"><strong>${p.name}</strong><br><small>${p.alive?'🟢 Vivant':'⚫ Éliminé'}</small></div>`).join('');
}

$('startBtn').addEventListener('click',startSetup);
$('minusPlayers').addEventListener('click',()=>changePlayers(-1));
$('plusPlayers').addEventListener('click',()=>changePlayers(1));
$('launchBtn').addEventListener('click',launch);
$('showRoleBtn').addEventListener('click',revealRole);
$('nextRevealBtn').addEventListener('click',nextReveal);
document.querySelectorAll('.back').forEach(btn=>btn.addEventListener('click',()=>screen(btn.dataset.screen)));

renderNames();
