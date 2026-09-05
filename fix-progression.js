// Correctif de progression : le dernier joueur doit pouvoir terminer la distribution des rôles.
(function(){
  function install(){
    const btn=document.getElementById('nextRevealBtn');
    if(!btn || btn.dataset.progressionFixInstalled)return;
    btn.dataset.progressionFixInstalled='1';
    btn.addEventListener('click',function(e){
      // On prend le contrôle avant l'ancien listener pour éviter qu'un ancien
      // gestionnaire ne laisse la partie bloquée sur le dernier joueur.
      e.preventDefault();
      e.stopImmediatePropagation();
      if(!window.state || !Array.isArray(state.players) || !state.players.length)return;
      const total=state.players.length;
      const index=Number(state.revealIndex)||0;
      if(index >= total-1){
        state.revealIndex=total;
        if(typeof startNight==='function')startNight();
        return;
      }
      state.revealIndex=index+1;
      const next=state.players[state.revealIndex];
      if(next && document.getElementById('revealPlayer')){
        document.getElementById('revealPlayer').textContent=next.name;
      }
      if(typeof resetReveal==='function')resetReveal();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
