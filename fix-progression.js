// Correctif de progression de la distribution des rôles.
// Le bouton du dernier joueur doit toujours lancer la Nuit 1.
(function(){
  function install(){
    const btn=document.getElementById('nextRevealBtn');
    if(!btn || btn.dataset.progressionFixInstalled)return;
    btn.dataset.progressionFixInstalled='1';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof nextReveal==='function') nextReveal();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
