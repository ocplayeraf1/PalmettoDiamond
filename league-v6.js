/* Palmetto Diamond 6.0 — SCHSL/SCISA directory, independent standings,
   compact school-colored chronological scores, and safe legacy data migration.
   Loaded after app.js, publish.js and enhancements.js. */
(() => {
  'use strict';
  const COLORS = { SCHSL:'#193B65', SCISA:'#94642D', OUT:'#516477' };
  const assoc = t => String(t?.state||'SC').toUpperCase()!=='SC' ? 'OUT' : (String(t?.association||'SCHSL').toUpperCase()==='SCISA'?'SCISA':'SCHSL');
  const isSouthCarolina = t => assoc(t)!=='OUT';
  const color = (value,fallback='#1b3656')=> /^#[a-f0-9]{6}$/i.test(String(value||''))?String(value):fallback;
  const contrast = hex => {
    const s=color(hex).slice(1);
    const c=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return c[0]*.2126+c[1]*.7152+c[2]*.0722>0.179?'#112035':'#ffffff';
  };
  const dateSort=(a,b)=>String(a.date||'9999-12-31').localeCompare(String(b.date||'9999-12-31'))||String(a.time||'').localeCompare(String(b.time||''))||String(a.id||'').localeCompare(String(b.id||''));
  const smallBadge=(t)=>`<span class="association-badge ${assoc(t).toLowerCase()}">${assoc(t)==='OUT'?esc(t.state||'OUT'):assoc(t)}</span>`;
  const visibleScope=(t,scope)=>scope==='out'?assoc(t)==='OUT':scope==='scisa'?assoc(t)==='SCISA':scope==='schsl'?assoc(t)==='SCHSL':scope==='sc'?isSouthCarolina(t):true;
  const leagueName={SCHSL:'SCHSL Schools',SCISA:'SCISA Schools',OUT:'Out-of-State Opponents'};
  const leagueNote={SCHSL:'South Carolina High School League',SCISA:'South Carolina Independent School Association',OUT:'Out-of-state schedules and scouting statistics'};
  const showSideLogo=t=>{const src=safeImageUrl(t.logo);return src?`<img class="v6-side-logo" src="${esc(src)}" alt="" loading="lazy">`:`<span class="v6-side-monogram" aria-hidden="true">${esc(t.short||t.name?.slice(0,2)||'PD')}</span>`;};
  const normalize = db => {
    for (const t of db?.teams||[]) {
      t.state=String(t.state||'SC').toUpperCase();
      t.association=t.state!=='SC'?'OUT':(String(t.association||'SCHSL').toUpperCase()==='SCISA'?'SCISA':'SCHSL');
    }
    return db;
  };
  const upgradeV5=upgradeLegacyData;
  upgradeLegacyData=function(data){return normalize(upgradeV5(data));};
  normalize(app.db);

  // Region games and records are association-specific. Cross-association games
  // still affect the overall records of both teams.
  const saveGameV5=saveGame;
  saveGame=function(event){
    const g=ensureEditGame();
    if(g.type==='region'){
      const a=team(g.awayId),h=team(g.homeId);
      if(!isSouthCarolina(a)||!isSouthCarolina(h)||assoc(a)!==assoc(h)||String(a.classification)!==String(h.classification)||!a.region||String(a.region)!==String(h.region)){
        event.preventDefault();
        toast('A region game requires two South Carolina schools in the SAME association, classification and region. Select Nonregion for other matchups.');
        return;
      }
    }
    return saveGameV5(event);
  };

  // Team directory: combined SC coverage with independent SCISA and SCHSL
  // groupings and an optional out-of-state scouting directory.
  renderTeams=function(){
    const f=app.filters,scope=f.schoolScope||'sc';
    const groups=scope==='sc'?['SCHSL','SCISA']:scope==='out'?['OUT']:scope==='schsl'?['SCHSL']:scope==='scisa'?['SCISA']:['SCHSL','SCISA','OUT'];
    const schools=app.db.teams.filter(t=>visibleScope(t,scope)
      &&(f.class==='all'||t.classification===f.class)
      &&(f.region==='all'||String(t.region||'')===f.region)
      &&(!f.query||`${t.name} ${t.city} ${t.mascot} ${t.state} ${assoc(t)}`.toLowerCase().includes(String(f.query).toLowerCase())));
    const cls=[...new Set(app.db.teams.filter(t=>visibleScope(t,scope)).map(t=>t.classification).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const rg=[...new Set(app.db.teams.filter(t=>visibleScope(t,scope)&&(f.class==='all'||t.classification===f.class)).map(t=>String(t.region||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const tabs=[['sc','All SC schools'],['schsl','SCHSL'],['scisa','SCISA'],['out','Out-of-state'],['all','Everything']];
    const card=t=>{
      const pri=color(t.color),sec=color(t.secondaryColor,'#eaa34d');
      return `<a class="v6-school-card" href="#team:${esc(t.id)}" style="--school-primary:${pri};--school-secondary:${sec}"><div class="v6-school-card-band"></div><div class="v6-school-card-body"><div class="v6-school-meta">${smallBadge(t)} <span>${esc(t.classification||'Unclassified')}${t.region?' · Region '+esc(t.region):''}</span></div><div class="v6-school-line">${teamMark(t)}<div><strong>${esc(t.name)}</strong><small>${esc(t.mascot||'')}${t.city?' · '+esc(t.city):''}</small></div></div><div class="v6-school-record">${recordLabel(record(t.id))} recorded <span>Team page ↗</span></div></div></a>`;
    };
    return `${pageHeading('Schools & teams','SCHSL and SCISA schools together. Different associations, independent region races, plus an out-of-state scouting directory.',`<button class="btn dark" data-action="new-school" type="button">+ Add a school</button>`)}
    <div class="v6-league-tabs">${tabs.map(([v,l])=>`<button class="${scope===v?'active':''}" data-school-scope="${v}" type="button">${l}</button>`).join('')}</div>
    <div class="filter-bar"><div class="filter-item"><label>Class</label><select data-filter="class"><option value="all">All classes</option>${cls.map(x=>`<option value="${esc(x)}" ${f.class===x?'selected':''}>Class ${esc(x)}</option>`).join('')}</select></div><div class="filter-item"><label>Region</label><select data-filter="region"><option value="all">All regions</option>${rg.map(x=>`<option value="${esc(x)}" ${f.region===x?'selected':''}>Region ${esc(x)}</option>`).join('')}</select></div><div class="filter-item grow"><label>Find a school</label><input class="input" data-filter="query" type="search" placeholder="School, city, or association" value="${esc(f.query||'')}"></div></div>
    <div class="v6-school-groups">${groups.map(key=>{const items=schools.filter(t=>assoc(t)===key).sort((a,b)=>a.name.localeCompare(b.name));return `<section class="v6-directory-group"><div class="v6-section-head"><div>${smallBadge({state:key==='OUT'?'OUT':'SC',association:key})}<h2>${leagueName[key]}</h2><p>${leagueNote[key]}</p></div><span>${items.length} ${items.length===1?'school':'schools'}</span></div><div class="v6-school-grid">${items.map(card).join('')||`<div class="v6-empty-league">${key==='SCISA'?'No SCISA schools added yet. Choose “Add a school” and set the association to SCISA.':key==='OUT'?'No out-of-state teams added yet.':'No schools match the current filters.'}</div>`}</div></section>`;}).join('')}</div>`;
  };

  // The team header labels its athletic association rather than assuming every
  // South Carolina school follows SCHSL classification/playoff rules.
  const renderTeamV5=renderTeamDetail;
  renderTeamDetail=function(id){
    const t=team(id),a=assoc(t);
    const leagueStrip=`<div class="v6-team-league">${smallBadge(t)}<span>${a==='SCISA'?'Independent-school baseball':a==='SCHSL'?'SCHSL high school baseball':`Out-of-state scouting team · ${esc(t.state||'')}`}</span></div>`;
    return renderTeamV5(id).replace('<div class="team-heading">',`${leagueStrip}<div class="team-heading">`);
  };

  // Region standings grouped by association (SCHSL 3A Region 5 and SCISA 3A
  // Region 5 are never the same table). No automatic official tiebreakers.
  renderStandings=function(){
    const f=app.filters,scope=f.standingsAssociation||'all';
    const eligible=app.db.teams.filter(t=>isSouthCarolina(t)&&t.region&&
      (scope==='all'||assoc(t)===scope)&&
      (f.class==='all'||t.classification===f.class)&&
      (f.region==='all'||String(t.region)===String(f.region)));
    const groups=new Map();
    for(const t of eligible){const key=`${assoc(t)}|${t.classification}|${t.region}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
    const keys=[...groups.keys()].sort((a,b)=>{const [aa,ac,ar]=a.split('|'),[ba,bc,br]=b.split('|');return (aa===ba?0:aa==='SCHSL'?-1:1)||ac.localeCompare(bc,undefined,{numeric:true})||ar.localeCompare(br,undefined,{numeric:true});});
    const scopes=[['all','All South Carolina'],['SCHSL','SCHSL'],['SCISA','SCISA']];
    return `${pageHeading('Region standings','SCHSL and SCISA standings are calculated separately from recorded region game results.')}
      <div class="v6-league-tabs">${scopes.map(([v,label])=>`<button type="button" class="${scope===v?'active':''}" data-standings-association="${v}">${label}</button>`).join('')}</div>
      <div class="filter-bar"><div class="filter-item"><label>Season</label>${seasonFilter()}</div><div class="filter-item"><label>Classification</label>${classSelector()}</div><div class="filter-item"><label>Region</label>${regionSelector()}</div></div>
      <div class="info-band warning"><span><strong>Provisional standings:</strong> Only games you've entered count. Region tiebreakers are not applied automatically; SCHSL and SCISA use separate rules and playoff structures.</span></div>
      <div class="v6-standings-groups">${keys.map(key=>{const [association,cl,rg]=key.split('|');const items=groups.get(key).map(t=>({t,reg:record(t.id,true),all:record(t.id)})).sort((a,b)=>b.reg.pct-a.reg.pct||b.reg.w-a.reg.w||b.all.pct-a.all.pct||a.t.name.localeCompare(b.t.name));return `<section class="v6-standing-section"><div class="v6-section-head"><div>${smallBadge({state:'SC',association})}<h2>Class ${esc(cl)} · Region ${esc(rg)}</h2><p>${esc(association)} · ${esc(app.season)} season</p></div></div><div class="panel table-wrap"><table><thead><tr><th>Pos.*</th><th>Team</th><th class="num">REG W</th><th class="num">REG L</th><th class="num">REG %</th><th class="num">Overall</th></tr></thead><tbody>${items.map((x,i)=>`<tr><td class="rank">${i+1}</td><td><a href="#team:${esc(x.t.id)}" class="team-link">${dotTeam(x.t)}${esc(x.t.name)}</a></td><td class="num">${x.reg.w}</td><td class="num">${x.reg.l}</td><td class="num">${x.reg.w+x.reg.l?x.reg.pct.toFixed(3):'—'}</td><td class="num">${recordLabel(x.all)}</td></tr>`).join('')}</tbody></table></div></section>`;}).join('')||'<div class="panel empty">No regions match your selection. Add teams and set their association, classification and region.</div>'}</div>
      <p class="small-note">*Provisional order by region winning percentage, then region wins, overall winning percentage and school name. This is not an official association tiebreaker calculation.</p>`;
  };

  // Batting/pitching rate-stat qualification and saved scores still work across
  // the two SC associations; visitors can filter to either association.
  const statsV5=renderStats;
  renderStats=function(){
    const previous=app.db.players,scope=app.filters.schoolScope||'sc';
    if(scope==='schsl'||scope==='scisa')app.db.players=previous.filter(p=>assoc(team(p.teamId))===scope.toUpperCase());
    try{
      let html=statsV5();
      const extra=`<option value="schsl" ${scope==='schsl'?'selected':''}>SCHSL only</option><option value="scisa" ${scope==='scisa'?'selected':''}>SCISA only</option>`;
      html=html.replace(/(<div class="filter-item"><label>Coverage<\/label><select data-school-scope>[\s\S]*?)(<\/select>)/,`$1${extra}$2`);
      return html;
    }finally{app.db.players=previous;}
  };

  // Scoreboard: oldest -> newest, grouped by day, compact two-sided colored
  // cards with readable text regardless of school color brightness.
  const tournamentName=g=>(app.db.tournaments||[]).find(x=>x.id===g.tournamentId)?.name||'';
  const venueName=g=>g.venue||(app.db.tournaments||[]).find(x=>x.id===g.tournamentId)?.venue||'';
  const neutral=g=>g.neutralSite===true||g.neutralSite==='true';
  const scoreFace=(t,g,side)=>{
    const isFinal=isCompleted(g),isWinner=isFinal&&wins(g,t.id),primary=color(t.color),secondary=color(t.secondaryColor,'#f9af58');
    return `<div class="v6-score-side ${isWinner?'is-winner':''}" style="--side-primary:${primary};--side-contrast:${contrast(primary)};--side-secondary:${secondary}"><div class="v6-side-identity">${showSideLogo(t)}<div class="v6-side-copy"><strong>${esc(t.name)}</strong><small>${neutral(g)?side==='away'?'Team 1':'Team 2':side==='away'?'Away':'Home'} · ${assoc(t)==='OUT'?esc(t.state||'OUT'):assoc(t)}</small></div></div><div class="v6-score-number ${isWinner?'is-winner':''}">${isFinal?esc(g[side+'Score']):'–'}</div></div>`;
  };
  const scoreCard=g=>{
    const a=team(g.awayId),h=team(g.homeId),done=isCompleted(g);
    const meta=[neutral(g)?'Neutral site':'',tournamentName(g),venueName(g)].filter(Boolean);
    const multiAssoc=assoc(a)!==assoc(h);
    const matchType=g.type==='region'?(multiAssoc?'Inter-association matchup':`${assoc(a)} region`):g.type==='playoff'?'Playoff':g.type==='tournament'?'Tournament':'Nonregion';
    return `<a class="v6-score-card" href="#game:${esc(g.id)}" aria-label="${esc(a.name)} ${done?g.awayScore:'versus'} ${esc(h.name)} ${done?g.homeScore:''}, ${esc(fmtDate(g.date))}"><div class="v6-score-card-head"><span>${esc(matchType)}${multiAssoc&&g.type!=='region'?' · Inter-association':''}</span><span class="v6-status ${done?'final':'upcoming'}">${done?'FINAL':'SCHEDULED'}</span></div><div class="v6-score-match">${scoreFace(a,g,'away')}<span class="v6-score-versus">VS</span>${scoreFace(h,g,'home')}</div><div class="v6-score-card-foot"><span title="${esc(meta.join(' · '))}">${meta.length?esc(meta.join(' · ')):'View matchup and game details'}</span><strong>${done?'Box score':'Details'} ↗</strong></div></a>`;
  };
  renderScores=function(){
    const f=app.filters,selected=f.tournament||'all',coverage=f.scoresAssociation||'all';
    const games=gamesBySeason().filter(g=>(f.class==='all'||team(g.homeId).classification===f.class||team(g.awayId).classification===f.class)&&
      (f.team==='all'||g.homeId===f.team||g.awayId===f.team)&&
      (selected==='all'||g.tournamentId===selected)&&
      (coverage==='all'||(coverage==='out'?assoc(team(g.awayId))==='OUT'||assoc(team(g.homeId))==='OUT':assoc(team(g.awayId))===coverage||assoc(team(g.homeId))===coverage)))
      .sort(dateSort);
    const dateGroups=new Map();
    for(const g of games){const key=g.date||'tbd';if(!dateGroups.has(key))dateGroups.set(key,[]);dateGroups.get(key).push(g);}
    const leagueChoices=[['all','All games'],['SCHSL','SCHSL'],['SCISA','SCISA'],['out','Out-of-state']];
    return `${pageHeading('Scores & schedule','Every matchup in date order, with bold school-color scoreboards and tournament/neutral-site details.',`<button class="btn dark" data-action="new-game" type="button">+ Enter game</button>`)}
    <div class="filter-bar v6-score-filters"><div class="filter-item"><label>Season</label>${seasonFilter()}</div><div class="filter-item"><label>Association</label><select data-scores-association>${leagueChoices.map(([v,l])=>`<option value="${v}" ${coverage===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="filter-item"><label>Class</label>${classSelector()}</div><div class="filter-item"><label>School</label><select data-filter="team"><option value="all">All teams</option>${teamOptions(f.team)}</select></div><div class="filter-item grow"><label>Tournament</label><select data-tournament-filter><option value="all">All events</option>${(app.db.tournaments||[]).filter(x=>!x.season||String(x.season)===String(app.season)).sort((a,b)=>String(a.startDate||'').localeCompare(String(b.startDate||''))).map(x=>`<option value="${esc(x.id)}" ${selected===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div>
    <div class="v6-scores-list">${[...dateGroups].map(([date,dayGames])=>`<section class="v6-game-day"><div class="v6-date-heading"><h2>${date==='tbd'?'Date to be announced':esc(fmtDate(date))}</h2><span>${dayGames.length} ${dayGames.length===1?'game':'games'}</span></div><div class="v6-score-grid">${dayGames.map(scoreCard).join('')}</div></section>`).join('')||'<div class="panel empty"><strong>No games match these filters.</strong><p>Add a schedule entry or adjust the season, school, association or tournament.</p></div>'}</div>`;
  };

  // Segregate SCISA editorial class rankings from existing SCHSL class rankings.
  const rankingScopes=()=>{
    const a=[['statewide','All-SC Top 25'],['schsl:all','SCHSL — All Classes'],['scisa:all','SCISA — All Classes']];
    const cl=(association)=>[...new Set(app.db.teams.filter(t=>assoc(t)===association).map(t=>t.classification).filter(Boolean))].sort((x,y)=>x.localeCompare(y,undefined,{numeric:true}));
    for(const c of cl('SCHSL'))a.push([c,`SCHSL · ${c}`]); // Legacy SCHSL ranks stored with class-only scope.
    for(const c of cl('SCISA'))a.push([`scisa:${c}`,`SCISA · ${c}`]);
    return a;
  };
  const rankingMatch=(t,scope)=>{
    if(!isSouthCarolina(t))return false;
    if(scope==='statewide')return true;
    if(scope==='schsl:all')return assoc(t)==='SCHSL';
    if(scope==='scisa:all')return assoc(t)==='SCISA';
    if(scope.startsWith('scisa:'))return assoc(t)==='SCISA'&&t.classification===scope.slice(6);
    return assoc(t)==='SCHSL'&&t.classification===scope;
  };
  const rankingSelect=scope=>`<select data-ranking-scope>${rankingScopes().map(([v,label])=>`<option value="${esc(v)}" ${v===scope?'selected':''}>${esc(label)}</option>`).join('')}</select>`;
  renderRankings=function(){
    const scope=app.adminRankingScope||'statewide';
    const rows=(app.db.rankings||[]).filter(r=>String(r.season)===String(app.season)&&r.scope===scope&&safeNum(r.rank)>0&&rankingMatch(team(r.teamId),scope)).sort((a,b)=>safeNum(a.rank)-safeNum(b.rank));
    return `${pageHeading('Team rankings','Original editorial rankings, with separate SCHSL and SCISA classification lists.')}
    <div class="filter-bar"><div class="filter-item"><label>Season</label>${seasonFilter()}</div><div class="filter-item"><label>Ranking list</label>${rankingSelect(scope)}</div></div>
    <div class="info-band"><span>Independent Palmetto Diamond rankings are not SCHSL RPI or official SCISA rankings.</span><button class="btn sm dark" data-action="admin-rankings" type="button">Edit rankings</button></div>
    <div class="panel table-wrap"><table><thead><tr><th>#</th><th>School</th><th>Association</th><th>Class</th><th>Recorded W-L</th></tr></thead><tbody>${rows.map(x=>{const t=team(x.teamId);return `<tr><td class="rank">${esc(x.rank)}</td><td><a class="team-link" href="#team:${esc(t.id)}">${dotTeam(t)}${esc(t.name)}</a></td><td>${smallBadge(t)}</td><td>${esc(t.classification||'—')}</td><td>${recordLabel(record(t.id))}</td></tr>`;}).join('')||'<tr><td colspan="5">No editorial rankings entered for this list.</td></tr>'}</tbody></table></div>`;
  };
  adminRankings=function(){
    const scope=app.adminRankingScope||'statewide';
    const teams=app.db.teams.filter(t=>rankingMatch(t,scope)).sort((a,b)=>a.name.localeCompare(b.name));
    return `<div class="panel"><div class="panel-head"><h3>Editorial rankings</h3><span class="subtext">Create separate SCHSL, SCISA or combined rankings</span></div><div class="admin-form"><form id="ranking-form"><div class="form-grid two"><div class="field"><label>Ranking list</label>${rankingSelect(scope)}</div><div class="field"><label>Season</label>${seasonFilter()}</div></div><div class="rpi-entry"><strong>School</strong><strong>Rank</strong><strong>Association</strong></div>${teams.map(t=>{const r=(app.db.rankings||[]).find(x=>x.teamId===t.id&&x.season===app.season&&x.scope===scope);return `<div class="rpi-entry"><span>${esc(t.name)}</span><input class="input" type="number" min="1" max="100" data-editor-rank="${esc(t.id)}" value="${esc(r?.rank??'')}" placeholder="—">${smallBadge(t)}</div>`;}).join('')}<p class="small-note">Leave a ranking blank to omit a school. These are your own editorial lists, not association playoff seedings.</p><button class="btn dark" type="submit">Save rankings ↗</button></form></div></div>`;
  };

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-scores-association]')){app.filters.scoresAssociation=event.target.value;render();}
    else if(event.target.matches('[data-standings-association]')){app.filters.standingsAssociation=event.target.value;app.filters.class='all';app.filters.region='all';render();}
  });
})();
