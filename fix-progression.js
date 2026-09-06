// Correctif de progression de la distribution des rôles.
// On laisse script.js gérer tous les autres boutons/tours.
(function(){
  function install(){
    const btn=document.getElementById('nextRevealBtn');
    if(!btn || btn.dataset.progressionFixInstalled)return;
    btn.dataset.progressionFixInstalled='1';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof state==='undefined' || !Array.isArray(state.players) || !state.players.length)return;
      if(typeof nextReveal==='function'){
        nextReveal();
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
