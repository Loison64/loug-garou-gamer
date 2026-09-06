document.addEventListener('DOMContentLoaded', () => {
  const ROLES = [
    {name:'Joueur Gamer',icon:'🎮',team:'BONS',desc:'Aucun pouvoir. Gagne si tous les méchants sont éliminés.'},
    {name:'Loup Gamer',icon:'🐺',team:'HACKERS',desc:'Choisit secrètement une victime chaque nuit.'},
    {name:'Hacker',icon:'💻',team:'HACKERS',desc:'Un rôle Hacker sans pouvoir pour cette première base.'},
    {name:'Healer',icon:'❤️‍🩹',team:'BONS',desc:'Peut protéger un joueur dans les prochaines versions.'}
  ];

  let state = { players: [], index: 0 };
  const $ = id => document.getElementById(id);

  function screen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = $(id);
    if (target) target.classList.add('active');
  }

  function renderNames() {
    const count = Number($('playerCount').textContent) || 8;
    const box = $('namesBox');
    box.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const row = document.createElement('div');
      row.className = 'name-row';
      row.innerHTML = `<label for="player-${i}">👤 Joueur ${i}</label><input id="player-${i}" class="name-input" maxlength="20" placeholder="Entre ton pseudo" value="Joueur ${i}">`;
      box.appendChild(row);
    }
  }

  function startSetup() {
    renderNames();
    screen('setup');
  }

  function changePlayers(delta) {
    const el = $('playerCount');
    const current = Number(el.textContent) || 8;
    el.textContent = Math.max(5, Math.min(20, current + delta));
    renderNames();
  }

  function launch() {
    const inputs = [...document.querySelectorAll('.name-input')];
    const names = inputs.map(input => input.value.trim());

    if (names.length < 5) {
      alert('⚠️ Il faut au moins 5 joueurs.');
      return;
    }
    if (names.some(name => !name)) {
      alert('⚠️ Tous les joueurs doivent avoir un pseudo.');
      return;
    }
    const normalized = names.map(name => name.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      alert('⚠️ Les pseudos doivent être différents.');
      return;
    }

    const roles = names.map((_, i) => i === 0 ? ROLES[1] : i === 1 ? ROLES[2] : ROLES[0]);
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    state = {
      players: names.map((name, i) => ({name, role: roles[i], alive: true})),
      index: 0
    };
    showReveal();
  }

  function showReveal() {
    const player = state.players[state.index];
    if (!player) return;
    $('revealPlayer').textContent = player.name;
    $('roleCard').classList.add('hidden');
    $('showRoleBtn').classList.remove('hidden');
    screen('reveal');
  }

  function revealRole() {
    const player = state.players[state.index];
    if (!player) return;
    $('roleIcon').textContent = player.role.icon;
    $('roleName').textContent = player.role.name;
    $('roleTeam').textContent = player.role.team;
    $('roleDescription').textContent = player.role.desc;
    $('roleCard').classList.remove('hidden');
    $('showRoleBtn').classList.add('hidden');
  }

  function nextReveal() {
    state.index++;
    if (state.index >= state.players.length) {
      startGame();
    } else {
      showReveal();
    }
  }

  function startGame() {
    screen('game');
    $('roundLabel').textContent = 'TOUR 1';
    $('phaseTitle').textContent = '🌙 Nuit';
    $('aliveCount').textContent = state.players.length;
    $('gameMessage').textContent = 'La première nuit commence.';
    $('actionArea').innerHTML = '<strong>🌙 Nuit 1</strong><p>La partie est prête.</p><button class="secondary" id="nightBtn">Continuer</button>';
    renderPlayers();
  }

  function renderPlayers() {
    $('playersList').innerHTML = state.players.map(player =>
      `<div class="player ${player.alive ? '' : 'dead'}"><strong>${escapeHtml(player.name)}</strong><br><small>${player.alive ? '🟢 Vivant' : '⚫ Éliminé'}</small></div>`
    ).join('');
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  $('startBtn').addEventListener('click', startSetup);
  $('minusPlayers').addEventListener('click', () => changePlayers(-1));
  $('plusPlayers').addEventListener('click', () => changePlayers(1));
  $('launchBtn').addEventListener('click', launch);
  $('showRoleBtn').addEventListener('click', revealRole);
  $('nextRevealBtn').addEventListener('click', nextReveal);

  document.querySelectorAll('.back').forEach(button => {
    button.addEventListener('click', () => screen(button.dataset.screen));
  });

  renderNames();
});
