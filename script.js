document.addEventListener('DOMContentLoaded', () => {
  const ROLES = [
    {name:'Joueur Gamer',icon:'🎮',team:'BONS',desc:'Aucun pouvoir. Gagne si tous les méchants sont éliminés.'},
    {name:'Loup Gamer',icon:'🐺',team:'HACKERS',desc:'Choisit secrètement une victime chaque nuit.'},
    {name:'Hacker',icon:'💻',team:'HACKERS',desc:'Un rôle Hacker sans pouvoir pour cette première base.'},
    {name:'Healer',icon:'❤️‍🩹',team:'BONS',desc:'Peut protéger un joueur pendant la nuit.'}
  ];

  let state = {players:[], index:0, phase:'reveal', nightStep:0, nightVictim:null, protected:null};
  let voiceEnabled = true;
  const $ = id => document.getElementById(id);

  function screen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = $(id);
    if (target) target.classList.add('active');
  }

  function speak(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.88;
    utterance.pitch = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  function voiceButton() {
    return `<button class="secondary" id="voiceBtn">🔊 Voix : ${voiceEnabled ? 'ON' : 'OFF'}</button>`;
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
    if (names.length < 5) return alert('⚠️ Il faut au moins 5 joueurs.');
    if (names.some(name => !name)) return alert('⚠️ Tous les joueurs doivent avoir un pseudo.');
    const normalized = names.map(name => name.toLowerCase());
    if (new Set(normalized).size !== normalized.length) return alert('⚠️ Les pseudos doivent être différents.');

    const roles = names.map((_, i) => i === 0 ? ROLES[1] : i === 1 ? ROLES[2] : ROLES[0]);
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    state = {
      players: names.map((name, i) => ({name, role:roles[i], alive:true})),
      index:0, phase:'reveal', nightStep:0, nightVictim:null, protected:null
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
    speak(`${player.name}, découvre ton rôle.`);
  }

  function nextReveal() {
    state.index++;
    if (state.index >= state.players.length) startGame();
    else showReveal();
  }

  function startGame() {
    state.phase = 'night';
    state.nightStep = 0;
    state.nightVictim = null;
    state.protected = null;
    screen('game');
    $('roundLabel').textContent = 'TOUR 1';
    $('phaseTitle').textContent = '🌙 Nuit 1';
    $('aliveCount').textContent = state.players.length;
    $('gameMessage').textContent = 'La nuit tombe...';
    renderPlayers();
    showNightIntro();
  }

  function showNightIntro() {
    $('actionArea').innerHTML = `
      ${voiceButton()}
      <div class="night-card">
        <h3>🌙 La nuit tombe...</h3>
        <p>Tout le village s'endort. Les rôles qui ont une action vont maintenant jouer.</p>
        <button class="primary" id="startNightBtn">🌙 Commencer la nuit</button>
      </div>`;
    speak('La nuit tombe sur le village. Tout le monde ferme les yeux. Les rôles de la nuit vont jouer.');
    bindVoice();
    $('startNightBtn').addEventListener('click', nextNightStep);
  }

  function nextNightStep() {
    const wolf = state.players.find(p => p.alive && p.role.name === 'Loup Gamer');
    const healer = state.players.find(p => p.alive && p.role.name === 'Healer');

    if (state.nightStep === 0 && wolf) {
      state.nightStep = 1;
      showWolfTurn(wolf);
      return;
    }
    if (state.nightStep <= 1 && healer) {
      state.nightStep = 2;
      showHealerTurn(healer);
      return;
    }
    finishNight();
  }

  function aliveOptions(excludeName) {
    return state.players.filter(p => p.alive && p.name !== excludeName)
      .map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
  }

  function showWolfTurn(wolf) {
    $('gameMessage').textContent = '🐺 Les Loups se réveillent.';
    $('actionArea').innerHTML = `
      ${voiceButton()}
      <div class="night-card">
        <h3>🐺 Loup Gamer</h3>
        <p>Choisis secrètement la victime de cette nuit.</p>
        <select id="nightTarget"><option value="">Choisir une victime</option>${aliveOptions(wolf.name)}</select>
        <button class="primary" id="wolfConfirm">🐺 Choisir la victime</button>
      </div>`;
    speak('Les Loups se réveillent. Loup Gamer, choisis secrètement une victime.');
    bindVoice();
    $('wolfConfirm').addEventListener('click', () => {
      const target = $('nightTarget').value;
      if (!target) return alert('⚠️ Choisis une victime.');
      state.nightVictim = target;
      speak('Les Loups se rendorment.');
      nextNightStep();
    });
  }

  function showHealerTurn(healer) {
    $('gameMessage').textContent = '❤️‍🩹 Le Healer se réveille.';
    $('actionArea').innerHTML = `
      ${voiceButton()}
      <div class="night-card">
        <h3>❤️‍🩹 Healer</h3>
        <p>Choisis un joueur à protéger cette nuit.</p>
        <select id="healTarget"><option value="">Choisir un joueur</option>${aliveOptions('')}</select>
        <button class="primary" id="healConfirm">❤️‍🩹 Protéger</button>
      </div>`;
    speak('Le Healer se réveille. Choisis un joueur à protéger cette nuit.');
    bindVoice();
    $('healConfirm').addEventListener('click', () => {
      const target = $('healTarget').value;
      if (!target) return alert('⚠️ Choisis un joueur à protéger.');
      state.protected = target;
      speak('Le Healer se rendort.');
      finishNight();
    });
  }

  function finishNight() {
    state.phase = 'day';
    const victim = state.nightVictim;
    const saved = victim && victim === state.protected;
    if (victim && !saved) {
      const player = state.players.find(p => p.name === victim);
      if (player) player.alive = false;
    }
    $('roundLabel').textContent = 'TOUR 1';
    $('phaseTitle').textContent = '☀️ Jour 1';
    $('aliveCount').textContent = state.players.filter(p => p.alive).length;
    $('gameMessage').textContent = saved ? '❤️‍🩹 Une attaque a été empêchée cette nuit.' : victim ? `☠️ ${victim} a été éliminé pendant la nuit.` : '🌅 La nuit est terminée.';
    $('actionArea').innerHTML = `${voiceButton()}<div class="night-card"><h3>☀️ Le jour se lève</h3><p>${saved ? 'Le Healer a sauvé la victime.' : victim ? `${escapeHtml(victim)} a été retrouvé éliminé.` : 'Personne n’a été éliminé cette nuit.'}</p><button class="primary" id="dayBtn">☀️ Continuer</button></div>`;
    renderPlayers();
    speak(saved ? 'Le jour se lève. Le Healer a empêché une élimination cette nuit.' : victim ? `Le jour se lève. ${victim} a été éliminé cette nuit.` : 'Le jour se lève. Personne n’a été éliminé cette nuit.');
    bindVoice();
    $('dayBtn').addEventListener('click', () => {
      $('actionArea').innerHTML = `${voiceButton()}<div class="night-card"><h3>🗳️ Phase de vote</h3><p>Le système de vote sera ajouté à la prochaine étape.</p></div>`;
      speak('Le village se réunit. La phase de vote commence.');
      bindVoice();
    });
  }

  function bindVoice() {
    const button = $('voiceBtn');
    if (!button) return;
    button.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      button.textContent = `🔊 Voix : ${voiceEnabled ? 'ON' : 'OFF'}`;
    });
  }

  function renderPlayers() {
    $('playersList').innerHTML = state.players.map(player =>
      `<div class="player ${player.alive ? '' : 'dead'}"><strong>${escapeHtml(player.name)}</strong><br><small>${player.alive ? '🟢 Vivant' : '⚫ Éliminé'}</small></div>`
    ).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
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
