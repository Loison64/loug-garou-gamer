// Correctif de progression des tours secrets.
(function(){
  function install(){
    const reveal=document.getElementById('nextRevealBtn');
    if(reveal && !reveal.dataset.progressionFixInstalled){
      reveal.dataset.progressionFixInstalled='1';
      reveal.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(typeof state==='undefined' || !Array.isArray(state.players) || !state.players.length)return;
        const total=state.players.length;
        const index=Number(state.revealIndex)||0;
        if(index>=total-1){
          state.revealIndex=total;
          startNight();
          return;
        }
        state.revealIndex=index+1;
        const next=state.players[state.revealIndex];
        if(next)document.getElementById('revealPlayer').textContent=next.name;
        resetReveal();
      },true);
    }

    // Les boutons des tours secrets sont créés dynamiquement.
    // On intercepte leur clic avant l'ancien gestionnaire pour garantir l'avancement.
    if(!document.documentElement.dataset.secretTurnFix){
      document.documentElement.dataset.secretTurnFix='1';
      document.addEventListener('click',function(e){
        if(e.target.id!=='secretDone')return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if(typeof state==='undefined' || !Array.isArray(state.turnQueue))return;
        const p=player(state.turnQueue[state.turnIndex]);
        if(!p)return;

        if(state.phase==='night'){
          if(p.role==='wolf'){
            const target=Number(document.getElementById('secretTarget')?.value||0);
            if(!target){alert('Choisis une victime.');return;}
            state.nightVotes[p.id]=target;
          }else if(p.role==='hacker'){
            const target=Number(document.getElementById('secretTarget')?.value||0);
            if(target&&!p.used.hacker){state.blockedPlayers.push(target);p.used.hacker=true;}
          }else if(p.role==='support'){
            const target=Number(document.getElementById('secretTarget')?.value||0);
            if(target&&!p.used.support){state.protectedPlayer=target;p.used.support=true;}
          }
          state.turnIndex++;
          showNightTurn();
        }else if(state.phase==='day'){
          const target=Number(document.getElementById('secretVote')?.value||0);
          if(!target){alert('Choisis un joueur.');return;}
          state.votes[p.id]=target;
          if(p.role==='speedrunner'&&!p.used.speedVote&&document.getElementById('doubleVote')?.checked){p.used.doubleVote=true;p.used.speedVote=true;}
          state.turnIndex++;
          showDayTurn();
        }
      },true);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
