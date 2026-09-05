// Correctif de progression des tours secrets.
// Évite qu'un tour reste bloqué sur un joueur, notamment le joueur 1 au début de la nuit.
(function(){
  function advanceSecretTurn(){
    if(!window.state || !Array.isArray(state.turnQueue)) return;
    const current=player(state.turnQueue[state.turnIndex]);
    if(current && state.phase==='night'){
      if(current.role==='wolf'){
        const target=Number(document.getElementById('secretTarget')?.value||0);
        if(!target){alert('Choisis une victime.');return;}
        state.nightVotes[current.id]=target;
      }else if(current.role==='hacker'){
        const target=Number(document.getElementById('secretTarget')?.value||0);
        if(target && !current.used.hacker){state.blockedPlayers.push(target);current.used.hacker=true;}
      }else if(current.role==='support'){
        const target=Number(document.getElementById('secretTarget')?.value||0);
        if(target && !current.used.support){state.protectedPlayer=target;current.used.support=true;}
      }
    }else if(current && state.phase==='day'){
      const target=Number(document.getElementById('secretVote')?.value||0);
      if(!target){alert('Choisis un joueur.');return;}
      state.votes[current.id]=target;
      if(current.role==='speedrunner'&&!current.used.speedVote&&document.getElementById('doubleVote')?.checked){current.used.doubleVote=true;current.used.speedVote=true;}
    }
    state.turnIndex++;
    if(state.phase==='night') showNightTurn(); else showDayTurn();
  }

  document.addEventListener('click',function(e){
    if(e.target.id!=='secretDone') return;
    e.stopImmediatePropagation();
    advanceSecretTurn();
  },true);

  // Réinitialise proprement le premier tour quand la distribution des rôles se termine.
  const originalStartNight=window.startNight;
  if(typeof originalStartNight==='function'){
    window.startNight=function(){
      state.phase='night';
      state.nightVictim=null;
      state.nightVotes={};
      state.blockedPlayers=[];
      state.turnQueue=alive().map(p=>p.id);
      state.turnIndex=0;
      showNightTurn();
    };
  }
})();
