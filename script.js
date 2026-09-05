const ROLES = {
  gamer: { name: 'Joueur Gamer', icon: '🎮', team: 'BONS', description: 'Aucun pouvoir. Gagne si tous les méchants sont éliminés.' },
  strategist: { name: 'Stratège', icon: '🧠', team: 'BONS', description: 'Une fois dans la partie, peut annuler un vote.' },
  support: { name: 'Support', icon: '🛡️', team: 'BONS', description: 'Une fois dans la partie, choisit un joueur la nuit. Si ce joueur est éliminé, l’élimination est annulée.' },
  analyst: { name: 'Analyste', icon: '🔎', team: 'BONS', description: 'Une fois dans la partie, le maître du jeu lui dit si un joueur est bon ou méchant.' },
  speedrunner: { name: 'Speedrunner', icon: '⚡', team: 'BONS', description: 'Une fois dans la partie, son vote compte double.' },
  healer: { name: 'Healer', icon: '❤️‍🩹', team: 'BONS', description: 'Peut sauver une victime de la nuit. Ne peut pas se sauver lui-même.' },
  wolf: { name: 'Loup Gamer', icon: '🐺', team: 'HACKERS', description: 'Élimine une victime chaque nuit.' },
  hacker: { name: 'Hacker', icon: '💻', team: 'HACKERS', description: 'Une fois dans la partie, bloque le pouvoir d’un joueur pour un tour.' },
  saboteur: { name: 'Saboteur', icon: '💣', team: 'HACKERS', description: 'Une fois dans la partie, provoque un faux événement.' },
  solo: { name: 'Solo Player', icon: '🃏', team: 'SOLO', description: 'Choisit une mission secrète parmi celles autorisées.' },
  traitor: { name: 'Traître', icon: '🕵️', team: 'BONS → HACKERS', description: 'Commence bon. À partir du tour 3, rejoint secrètement les Hackers.' }
};

const MISSIONS = {
  manipulateur: { name: 'Manipulateur', icon: '🅰️', description: 'Survivre jusqu’à ce qu’il ne reste que 3 joueurs. Peu importe qui gagne ensuite.' },
  chaos: { name: 'Chaos', icon: '🅱️', description: 'Choisir secrètement 2 joueurs au début. Si ces 2 joueurs sont éliminés, victoire immédiate.' },
  opportuniste: { name: 'Opportuniste', icon: '🅲', description: 'Changer ton vote au dernier moment 2 fois ET être dans l’équipe gagnante.' },
  boss: { name: 'Boss Final', icon: '🅳', description: 'Être le dernier survivant.' }
};

const UNIQUE_ROLES = ['strategist','support','analyst','speedrunner','healer','saboteur','solo','traitor'];

let state = {
  players: [], revealIndex: 0, round: 1, phase: 'night', gameOver: false,
  enabledSoloMissions: ['manipulateur','chaos','opportuniste','boss'],
  soloMission: null, soloTargets: [], soloVoteChanges: 0, votes: {}, nightVictim: null,
  protectedPlayer: null
};

const $ = id => document.getElementById(id);
const alive = () => state.players.filter(p => p.alive);
const player = id => state.players.find(p => p.id === Number(id));
const solo = () => state.players.find(p => p.role === 'solo');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateRoleTotal() {
  const total = [...document.querySelectorAll('.role-check:checked')].reduce((sum, check) => {
    const input = document.querySelector(`.role-count[data-role="${check.dataset.role}"]`);
    return sum + Math.max(1, Number(input?.value || 1));
  }, 0);
  const wanted = Number($('playerCount').textContent);
  const el = $('roleTotal');
  el.textContent = `👥 Rôles sélectionnés : ${total} / ${wanted}`;
  el.className = `setup-total ${total === wanted ? 'ok' : 'warning'}`;
  return total;
}

function getSelectedRoles() {
  const roles = [];
  document.querySelectorAll('.role-check:checked').forEach(check => {
    const key = check.dataset.role;
    const input = document.querySelector(`.role-count[data-role="${key}"]`);
    const count = Math.max(1, Math.min(20, Number(input?.value || 1)));
    for (let i = 0; i < count; i++) roles.push(key);
  });
  return roles;
}

function validateRoleSelection() {
  const roles = getSelectedRoles();
  const wanted = Number($('playerCount').textContent);
  if (roles.length !== wanted) {
    alert(`⚠️ Il faut exactement ${wanted} rôles. Tu en as sélectionné ${roles.length}.`);
    updateRoleTotal();
    return false;
  }
  if (!roles.includes('wolf') && !roles.includes('hacker') && !roles.includes('saboteur') && !roles.includes('traitor')) {
    alert('⚠️ Ajoute au moins un rôle de l’équipe des Hackers.');
    return false;
  }
  if (roles.includes('solo') && !selectedMissions().length) {
    alert('⚠️ Le rôle Solo Player est sélectionné : choisis au moins une mission.');
    return false;
  }
  return true;
}

function selectedMissions() {
  return [...document.querySelectorAll('input[name="soloMission"]:checked')].map(x => x.value);
}

function createGame() {
  if (!validateRoleSelection()) return;
  const roles = shuffle(getSelectedRoles());
  const missions = selectedMissions();
  const count = Number($('playerCount').textContent);

  state = {
    players: roles.map((role, i) => ({ id: i + 1, name: `Joueur ${i + 1}`, role, alive: true, used: {}, soloMission: null })),
    revealIndex: 0, round: 1, phase: 'night', gameOver: false,
    enabledSoloMissions: missions, soloMission: null, soloTargets: [], soloVoteChanges: 0,
    votes: {}, nightVictim: null, protectedPlayer: null
  };

  $('revealPlayer').textContent = state.players[0].name;
  $('roleCard').classList.add('hidden');
  $('showRoleBtn').classList.remove('hidden');
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');
  showScreen('reveal');
}

function showRole() {
  const p = state.players[state.revealIndex];
  const r = ROLES[p.role];
  $('roleIcon').textContent = r.icon;
  $('roleName').textContent = r.name;
  $('roleTeam').textContent = r.team;
  $('roleDescription').textContent = r.description;
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');

  if (p.role === 'solo') {
    $('soloMissionChoice').innerHTML = state.enabledSoloMissions.map(m => `<option value="${m}">${MISSIONS[m].icon} ${MISSIONS[m].name} — ${MISSIONS[m].description}</option>`).join('');
    $('soloChoice').classList.remove('hidden');
    $('nextRevealBtn').classList.add('hidden');
  }

  $('roleCard').classList.remove('hidden');
  $('showRoleBtn').classList.add('hidden');
}

function confirmSoloMission() {
  const p = state.players[state.revealIndex];
  state.soloMission = $('soloMissionChoice').value;
  p.soloMission = state.soloMission;
  $('soloChoice').classList.add('hidden');
  $('secretMission').textContent = `🔒 ${MISSIONS[state.soloMission].icon} ${MISSIONS[state.soloMission].name} — ${MISSIONS[state.soloMission].description}`;
  $('secretMission').classList.remove('hidden');
  if (state.soloMission === 'chaos') chooseChaosTargets();
  $('nextRevealBtn').classList.remove('hidden');
}

function chooseChaosTargets() {
  const s = solo();
  const targets = alive().filter(p => p.id !== s.id);
  const first = Number(prompt('CHAOS — Numéro du premier joueur ciblé :\n' + targets.map(p => `${p.id} = ${p.name}`).join('\n')));
  const p1 = player(first);
  if (!p1 || p1.id === s.id) return alert('Cible invalide.');
  const second = Number(prompt('CHAOS — Numéro du deuxième joueur ciblé :\n' + targets.filter(p => p.id !== p1.id).map(p => `${p.id} = ${p.name}`).join('\n')));
  const p2 = player(second);
  if (!p2 || p2.id === s.id || p2.id === p1.id) return alert('Deuxième cible invalide.');
  state.soloTargets = [p1.id, p2.id];
  $('secretMission').textContent += `\n🎯 Cibles secrètes : ${p1.name} et ${p2.name}`;
}

function nextReveal() {
  state.revealIndex++;
  if (state.revealIndex >= state.players.length) return renderGame();
  $('revealPlayer').textContent = state.players[state.revealIndex].name;
  $('roleCard').classList.add('hidden');
  $('showRoleBtn').classList.remove('hidden');
  $('soloChoice').classList.add('hidden');
  $('secretMission').classList.add('hidden');
  $('nextRevealBtn').classList.remove('hidden');
}

function renderPlayers() {
  $('playersList').innerHTML = state.players.map(p => `<div class="player-chip ${p.alive ? '' : 'dead'}"><strong>${ROLES[p.role].icon} ${p.name}</strong><small>${p.alive ? '🟢 Vivant' : '⚫ Éliminé'}</small></div>`).join('');
  $('aliveCount').textContent = alive().length;
}

function options(exclude) {
  return alive().filter(p => p.id !== exclude).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function renderGame() {
  if (state.gameOver) return;
  showScreen('game');
  renderPlayers();
  $('roundLabel').textContent = `TOUR ${state.round}`;
  $('phaseTitle').textContent = state.phase === 'night' ? '🌙 Nuit' : '☀️ Jour';
  $('phaseBtn').textContent = state.phase === 'night' ? '☀️ Résoudre la nuit →' : '🌙 Résoudre le vote →';
  $('gameMessage').textContent = state.phase === 'night' ? 'Le village dort. Le maître du jeu gère les actions.' : 'Le village débat et vote.';
  $('actionArea').innerHTML = state.phase === 'night' ? nightUI() : dayUI();
  checkSoloMission();
}

function nightUI() {
  const hackers = alive().filter(p => p.role === 'wolf' || p.role === 'hacker' || p.role === 'saboteur' || (p.role === 'traitor' && state.round >= 3));
  const supports = alive().filter(p => p.role === 'support' && !p.used.support);
  const healers = alive().filter(p => p.role === 'healer' && !p.used.healer);
  let html = `<strong>🌙 Actions de nuit</strong>`;

  if (hackers.length) html += `<label>🐺 Victime des Hackers</label><select id="nightVictim"><option value="">Choisir...</option>${options()}</select>`;
  if (supports.length) html += `<label>🛡️ Support — protection</label><select id="supportTarget"><option value="">Aucune protection</option>${options()}</select>`;
  if (healers.length) html += `<label>❤️‍🩹 Healer — sauver la victime</label><select id="healerSave"><option value="">Ne pas utiliser</option><option value="save">Sauver la victime</option></select>`;

  const s = solo();
  if (s?.alive && state.soloMission === 'chaos') html += `<p class="hint">🃏 Chaos : les 2 cibles sont secrètes. Elles doivent toutes les deux être éliminées.</p>`;
  if (!hackers.length) html += `<p class="hint">Aucun Hacker/Loup vivant ne peut attaquer cette nuit.</p>`;
  return html;
}

function dayUI() {
  const a = alive();
  let html = `<strong>🗳️ Vote du village</strong><p class="hint">Tous les joueurs vivants votent.</p><div class="vote-list">`;
  a.forEach(v => html += `<label>${v.name} → <select data-voter="${v.id}"><option value="">Choisir...</option>${options(v.id)}</select></label>`);
  html += `</div><button class="secondary-btn" id="resolveVoteBtn">🗳️ Valider les votes</button>`;
  const s = solo();
  if (s?.alive && state.soloMission === 'opportuniste') html += `<p class="hint">🃏 Opportuniste : ${state.soloVoteChanges}/2 changements utilisés.</p>`;
  return html;
}

function resolveNight() {
  const victimId = Number($('nightVictim')?.value) || null;
  const supportTarget = Number($('supportTarget')?.value) || null;
  const healerSave = $('healerSave')?.value === 'save';

  if (supportTarget) {
    const supporter = alive().find(p => p.role === 'support' && !p.used.support);
    if (supporter) { supporter.used.support = true; state.protectedPlayer = supportTarget; }
  }

  if (victimId) {
    const victim = player(victimId);
    const healer = alive().find(p => p.role === 'healer' && !p.used.healer);
    if (state.protectedPlayer === victimId) {
      alert(`🛡️ ${victim.name} est protégé cette nuit !`);
    } else if (healerSave && healer && healer.id !== victimId) {
      healer.used.healer = true;
      alert(`❤️‍🩹 Le Healer sauve ${victim.name} !`);
    } else {
      eliminate(victimId, 'les Hackers');
    }
  }

  state.protectedPlayer = null;
  if (!state.gameOver) { state.phase = 'day'; renderGame(); }
}

function resolveVote() {
  const selects = [...document.querySelectorAll('[data-voter]')];
  if (selects.some(s => !s.value)) return alert('Tous les joueurs vivants doivent voter.');
  const votes = {};
  selects.forEach(s => votes[s.dataset.voter] = Number(s.value));

  const s = solo();
  if (s?.alive && state.soloMission === 'opportuniste' && state.soloVoteChanges < 2) {
    if (confirm(`OPPORTUNISTE — Changer ton vote ?\nChangements utilisés : ${state.soloVoteChanges}/2`)) {
      const target = Number(prompt('Nouveau numéro de joueur :\n' + optionsText(s.id)));
      if (player(target)?.alive && target !== s.id) { votes[s.id] = target; state.soloVoteChanges++; }
    }
  }

  const tally = {};
  Object.entries(votes).forEach(([voterId, targetId]) => {
    const v = player(voterId);
    let weight = 1;
    if (v.role === 'speedrunner' && !v.used.speedVote) { weight = 2; v.used.speedVote = true; }
    tally[targetId] = (tally[targetId] || 0) + weight;
  });

  const max = Math.max(...Object.values(tally));
  const leaders = Object.keys(tally).filter(id => tally[id] === max);
  if (leaders.length === 1) eliminate(Number(leaders[0]), 'le vote du village');
  else alert('⚖️ Égalité : personne n’est éliminé.');

  if (!state.gameOver) { state.phase = 'night'; state.round++; renderGame(); }
}

function optionsText(exclude) {
  return alive().filter(p => p.id !== exclude).map(p => `${p.id} = ${p.name}`).join('\n');
}

function eliminate(id, reason) {
  const p = player(id);
  if (!p || !p.alive) return;
  p.alive = false;
  state.lastElimination = id;
  alert(`💀 ${p.name} est éliminé par ${reason}.\nRôle : ${ROLES[p.role].name}`);
  checkSoloMission();
  if (!state.gameOver) checkTeamVictory();
}

function checkSoloMission() {
  const s = solo();
  if (!s || !s.alive || !state.soloMission || state.gameOver) return;
  if (state.soloMission === 'manipulateur' && alive().length <= 3) return win(`🃏 MANIPULATEUR\n${s.name} a survécu jusqu’à 3 joueurs !`);
  if (state.soloMission === 'chaos' && state.soloTargets.length === 2 && state.soloTargets.every(id => !player(id)?.alive)) return win(`🃏 CHAOS\nLes deux cibles de ${s.name} ont été éliminées !`);
  if (state.soloMission === 'boss' && alive().length === 1 && s.alive) return win(`🃏 BOSS FINAL\n${s.name} est le dernier survivant !`);
}

function checkTeamVictory() {
  const a = alive();
  const hackers = a.filter(p => p.role === 'wolf' || p.role === 'hacker' || p.role === 'saboteur' || (p.role === 'traitor' && state.round >= 3));
  const s = solo();
  const others = a.filter(p => !hackers.includes(p) && p.role !== 'solo');

  if (!hackers.length) {
    if (s?.alive && state.soloMission === 'opportuniste' && state.soloVoteChanges >= 2) return win(`🃏 OPPORTUNISTE\n${s.name} a changé 2 votes et gagne avec les Bons !`);
    return win('🟢 LES BONS GAGNENT\nTous les Hackers sont éliminés !');
  }

  if (hackers.length >= others.length + (s?.alive ? 1 : 0)) {
    if (s?.alive && state.soloMission === 'opportuniste' && state.soloVoteChanges >= 2) return win(`🃏 OPPORTUNISTE\n${s.name} a changé 2 votes et gagne avec les Hackers !`);
    return win('🔴 LES HACKERS GAGNENT\nIls sont majoritaires !');
  }
}

function win(message) {
  state.gameOver = true;
  $('gameMessage').textContent = message;
  $('actionArea').innerHTML = `<div class="role-card"><h3>🏆 FIN DE PARTIE</h3><p>${message.replace(/\n/g,'<br>')}</p><button class="primary-btn" onclick="location.reload()">🔄 Nouvelle partie</button></div>`;
  $('phaseBtn').classList.add('hidden');
}

$('startBtn').addEventListener('click', () => showScreen('setup'));
$('minusPlayers').addEventListener('click', () => {
  $('playerCount').textContent = Math.max(5, Number($('playerCount').textContent) - 1);
  updateRoleTotal();
});
$('plusPlayers').addEventListener('click', () => {
  $('playerCount').textContent = Math.min(20, Number($('playerCount').textContent) + 1);
  updateRoleTotal();
});

document.querySelectorAll('.role-check').forEach(check => {
  check.addEventListener('change', () => {
    const input = document.querySelector(`.role-count[data-role="${check.dataset.role}"]`);
    const row = check.closest('.role-option');
    if (check.checked) {
      input.disabled = false;
      input.value = input.value || 1;
      row.classList.remove('disabled');
    } else {
      input.disabled = true;
      row.classList.add('disabled');
    }
    updateRoleTotal();
  });
});

document.querySelectorAll('.role-count').forEach(input => {
  input.addEventListener('input', () => {
    const role = input.dataset.role;
    if (UNIQUE_ROLES.includes(role)) input.value = 1;
    if (Number(input.value) < 1) input.value = 1;
    if (Number(input.value) > 20) input.value = 20;
    updateRoleTotal();
  });
});

$('createBtn').addEventListener('click', createGame);
$('showRoleBtn').addEventListener('click', showRole);
$('confirmSoloMissionBtn').addEventListener('click', confirmSoloMission);
$('nextRevealBtn').addEventListener('click', nextReveal);
$('phaseBtn').addEventListener('click', () => state.phase === 'night' ? resolveNight() : resolveVote());
document.addEventListener('click', e => { if (e.target.id === 'resolveVoteBtn') resolveVote(); });
document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.go)));

updateRoleTotal();
document.querySelectorAll('.role-count').forEach(input => {
  if (!input.closest('.role-option').querySelector('.role-check').checked) {
    input.disabled = true;
    input.closest('.role-option').classList.add('disabled');
  }
});
