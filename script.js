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
  solo: { name: 'Solo Player', icon: '🃏', team: 'SOLO', description: 'Choisit lui-même une mission secrète parmi celles autorisées par le maître du jeu.' },
  traitor: { name: 'Traître', icon: '🕵️', team: 'BONS → HACKERS', description: 'Commence bon. À partir du tour 3, rejoint secrètement les Hackers et participe aux décisions des loups.' }
};

const MISSION_NAMES = {
  manipulateur: 'Manipulateur',
  chaos: 'Chaos',
  opportuniste: 'Opportuniste',
  boss: 'Boss Final'
};

const MISSION_DESCRIPTIONS = {
  manipulateur: 'Survivre jusqu’à ce qu’il ne reste que 3 joueurs. Peu importe qui gagne ensuite.',
  chaos: 'Choisir secrètement 2 joueurs au début. Si ces 2 joueurs sont éliminés par n’importe quel moyen, tu gagnes immédiatement.',
  opportuniste: 'Changer ton vote au dernier moment 2 fois pendant la partie ET être dans l’équipe gagnante.',
  boss: 'Être le dernier survivant.'
};

let state = {
  players: [],
  revealIndex: 0,
  round: 1,
  phase: 'night',
  soloMission: null,
  enabledSoloMissions: ['manipulateur', 'chaos', 'opportuniste', 'boss']
};

const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function buildRoles(count) {
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

function getSelectedSoloMissions() {
  return [...document.querySelectorAll('input[name="soloMission"]:checked')].map(input => input.value);
}

function createGame() {
  const count = Number($('playerCount').textContent);
  const missions = getSelectedSoloMissions();

  if (missions.length === 0) {
    alert('Sélectionne au moins une mission Solo Player.');
    return;
  }

  state.enabledSoloMissions = missions;
  state.soloMission = null;
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
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');
  showScreen('reveal');
}

function showRole() {
  const player = state.players[state.revealIndex];
  const role = ROLES[player.role];
  $('roleIcon').textContent = role.icon;
  $('roleName').textContent = role.name;
  $('roleTeam').textContent = role.team;
  $('roleDescription').textContent = role.description;
  $('secretMission').classList.add('hidden');
  $('soloChoice').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');

  if (player.role === 'solo') {
    const choice = $('soloMissionChoice');
    choice.innerHTML = state.enabledSoloMissions.map(mission => `
      <option value="${mission}">${MISSION_NAMES[mission]} — ${MISSION_DESCRIPTIONS[mission]}</option>
    `).join('');
    $('soloChoice').classList.remove('hidden');
    $('nextRevealBtn').classList.add('hidden');
  }

  $('roleCard').classList.remove('hidden');
  $('showRoleBtn').classList.add('hidden');
}

function confirmSoloMission() {
  const player = state.players[state.revealIndex];
  if (player.role !== 'solo') return;

  state.soloMission = $('soloMissionChoice').value;
  player.soloMission = state.soloMission;

  $('soloChoice').classList.add('hidden');
  $('secretMission').textContent = `🔒 Mission secrète choisie : ${MISSION_NAMES[state.soloMission]} — ${MISSION_DESCRIPTIONS[state.soloMission]}`;
  $('secretMission').classList.remove('hidden');
  $('nextRevealBtn').classList.remove('hidden');
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
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');
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
    ? '<strong>🌙 Actions de nuit</strong><p class="hint">La gestion complète des pouvoirs sera ajoutée ensuite.</p>'
    : '<strong>🗳️ Vote du village</strong><p class="hint">Le système de vote sera ajouté ensuite.</p>';
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
$('confirmSoloMissionBtn').addEventListener('click', confirmSoloMission);
$('nextRevealBtn').addEventListener('click', nextReveal);
$('phaseBtn').addEventListener('click', nextPhase);
document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.go)));
