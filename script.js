const ROLES = {
  gamer: { name: 'Joueur Gamer', icon: '🎮', team: 'BONS', description: 'Aucun pouvoir. Gagne si tous les méchants sont éliminés.' },
  strategist: { name: 'Stratège', icon: '🧠', team: 'BONS', description: 'Une fois dans la partie, peut annuler un vote : le vote est refait.' },
  support: { name: 'Support', icon: '🛡️', team: 'BONS', description: 'Une fois dans la partie, choisit un joueur la nuit. Si ce joueur est éliminé par n’importe quel moyen, l’élimination est annulée.' },
  analyst: { name: 'Analyste', icon: '🔎', team: 'BONS', description: 'Une fois dans la partie, le maître du jeu lui dit si un joueur est bon ou méchant.' },
  speedrunner: { name: 'Speedrunner', icon: '⚡', team: 'BONS', description: 'Une fois dans la partie, son vote compte double.' },
  healer: { name: 'Healer', icon: '❤️‍🩹', team: 'BONS', description: 'Peut sauver une victime de la nuit. Ne peut pas se sauver lui-même.' },
  wolf: { name: 'Loup Gamer', icon: '🐺', team: 'HACKERS', description: 'Élimine une victime chaque nuit. Les loups choisissent ensemble en secret.' },
  hacker: { name: 'Hacker', icon: '💻', team: 'HACKERS', description: 'Une fois dans la partie, bloque le pouvoir d’un joueur pour un tour.' },
  saboteur: { name: 'Saboteur', icon: '💣', team: 'HACKERS', description: 'Une fois dans la partie, provoque un faux événement annoncé par le maître du jeu.' },
  solo: { name: 'Solo Player', icon: '🃏', team: 'SOLO', description: 'Choisit une mission secrète au début de la partie et tente de la réussir.' },
  traitor: { name: 'Traître', icon: '🕵️', team: 'BONS → HACKERS', description: 'Commence bon. À partir du tour 3, rejoint secrètement les Hackers et participe aux décisions des loups.' }
};

const MISSION_NAMES = {
  manipulateur: 'Manipulateur',
  chaos: 'Chaos',
  opportuniste: 'Opportuniste',
  boss: 'Boss Final'
};

let state = { players: [], revealIndex: 0, round: 1, phase: 'night', soloMission: 'manipulateur' };
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function buildRoles(count) {
  // Base V1: more players = more evil roles. One Solo and one Traître are added at 10+ players.
  const roles = [];
  const good = Math.max(3, Math.round(count * 0.55));
  const hackers = Math.max(2, Math.round(count * 0.25));
  roles.push(...Array(Math.max(0, good - 5)).fill('gamer'));
  roles.push('strategist', 'support', 'analyst', 'speedrunner', 'healer');
  roles.push('wolf');
  if (hackers >= 2) roles.push('hacker');
  if (hackers >= 3) roles.push('saboteur');
  if (count >= 10) roles.push('solo');
  if (count >= 12) roles.push('traitor');
  while (roles.length < count) roles.push('gamer');
  return roles.slice(0, count);
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createGame() {
  const count = Number($('playerCount').textContent);
  state.soloMission = $('soloMission').value;
  const roles = shuffle(buildRoles(count));
  state.players = roles.map((role, i) => ({
    id: i + 1,
    name: `Joueur ${i + 1}`,
    role,
    alive: true,
    used: {}
  }));
  state.revealIndex = 0;
  state.round = 1;
  state.phase = 'night';
  $('revealPlayer').textContent = state.players[0].name;
  $('roleCard').classList.add('hidden');
  $('showRoleBtn').classList.remove('hidden');
  showScreen('reveal');
}

function showRole() {
  const player = state.players[state.revealIndex];
  const role = ROLES[player.role];
  $('roleIcon').textContent = role.icon;
  $('roleName').textContent = role.name;
  $('roleTeam').textContent = role.team;
  $('roleDescription').textContent = role.description;
  const secret = $('secretMission');
  if (player.role === 'solo') {
    secret.textContent = `Mission secrète : ${MISSION_NAMES[state.soloMission]}`;
    secret.classList.remove('hidden');
  } else {
    secret.classList.add('hidden');
  }
  $('roleCard').classList.remove('hidden');
  $('showRoleBtn').classList.add('hidden');
}

function nextReveal() {
  state.revealIndex++;
  if (state.revealIndex >= state.players.length) {
    renderGame();
    return;
  }
  $('revealPlayer').textContent = state.players[state.revealIndex].name;
  $('roleCard').classList.add('hidden');
  $('showRoleBtn').classList.remove('hidden');
}

function renderPlayers() {
  $('playersList').innerHTML = state.players.map(p => `
    <div class="player-chip ${p.alive ? '' : 'dead'}">
      <strong>${p.name}</strong>
      <small>${p.alive ? '🟢 Vivant' : '⚫ Éliminé'}</small>
    </div>
  `).join('');
  $('aliveCount').textContent = state.players.filter(p => p.alive).length;
}

function renderGame() {
  showScreen('game');
  $('roundLabel').textContent = `TOUR ${state.round}`;
  $('phaseTitle').textContent = state.phase === 'night' ? '🌙 Nuit' : '☀️ Jour';
  renderPlayers();
  $('phaseBtn').textContent = state.phase === 'night' ? '☀️ Passer au jour →' : '🌙 Passer à la nuit →';
  $('gameMessage').textContent = state.phase === 'night'
    ? 'Le village dort… Le maître du jeu peut maintenant gérer les pouvoirs de nuit.'
    : 'Le village se réveille. Discutez, accusez et préparez le vote.';
  $('actionArea').innerHTML = state.phase === 'night'
    ? '<strong>🌙 Actions de nuit</strong><p class="hint">La vraie gestion des pouvoirs sera ajoutée dans la prochaine étape. Cette base prépare déjà les rôles et les phases.</p>'
    : '<strong>🗳️ Vote du village</strong><p class="hint">Le système de vote et les pouvoirs seront ajoutés ensuite.</p>';
}

function nextPhase() {
  if (state.phase === 'night') {
    state.phase = 'day';
  } else {
    state.phase = 'night';
    state.round++;
  }
  renderGame();
}

$('startBtn').addEventListener('click', () => showScreen('setup'));
$('minusPlayers').addEventListener('click', () => {
  const value = Math.max(5, Number($('playerCount').textContent) - 1);
  $('playerCount').textContent = value;
});
$('plusPlayers').addEventListener('click', () => {
  const value = Math.min(20, Number($('playerCount').textContent) + 1);
  $('playerCount').textContent = value;
});
$('createBtn').addEventListener('click', createGame);
$('showRoleBtn').addEventListener('click', showRole);
$('nextRevealBtn').addEventListener('click', nextReveal);
$('phaseBtn').addEventListener('click', nextPhase);
document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.go)));
