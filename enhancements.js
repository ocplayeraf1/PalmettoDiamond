/* Palmetto Diamond 5.0 — team identity, neutral venues, tournaments and scouting opponents.
   Loaded after app.js and publish.js. Deliberately preserves V4 site-data.json and local drafts. */
(() => {
  'use strict';
  const STATES = [['SC','South Carolina'],['NC','North Carolina'],['GA','Georgia'],['FL','Florida'],['TN','Tennessee'],['VA','Virginia'],['AL','Alabama'],['MS','Mississippi'],['KY','Kentucky'],['Other','Other state']];
  const CATEGORIES = [['preseason','Preseason tournament'],['spring-break','Spring break tournament'],['holiday','Holiday tournament'],['in-season','In-season invitational'],['postseason','Postseason tournament'],['showcase','Showcase / event'],['other','Other event']];
  const NOTES_KEY = 'palmetto-diamond-scouting-notes-v5';
  let notes = {};
  try { notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') || {}; } catch (_) { notes = {}; }
  const validColor = (v,fallback='#17375c') => /^#[\da-f]{6}$/i.test(String(v||'')) ? String(v) : fallback;
  const isSC = t => String(t?.state||'SC').toUpperCase()==='SC';
  const eventById = id => (app.db.tournaments||[]).find(x=>x.id===id);
  const seasonEvents = season => (app.db.tournaments||[]).filter(x=>!season||String(x.season)===String(season));
  const eventCaption = g => eventById(g.tournamentId)?.name || '';
  const gameVenue = g => g.venue || eventById(g.tournamentId)?.venue || '';
  const isNeutral = g => g.neutralSite===true || g.neutralSite==='true';
  const htxt = esc;
  const highContrast = hex => {
    const h = validColor(hex).slice(1); const v=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return v[0]*.2126+v[1]*.7152+v[2]*.0722>.44?'#102033':'#ffffff';
  };

  const upgradeV4 = upgradeLegacyData;
  upgradeLegacyData = function(data){
    const db=upgradeV4(data); if(!Array.isArray(db.tournaments))db.tournaments=[];
    for(const t of db.teams||[]){t.state=(t.state||'SC').toUpperCase();t.secondaryColor=validColor(t.secondaryColor||'#f0b44d','#f0b44d');t.color=validColor(t.color||'#17375c');}
    for(const g of db.games||[]){if(g.neutralSite==null)g.neutralSite=false;g.venue||='';g.tournamentId||='';}
    return db;
  };

  // Also normalize the in-memory seed when this script loads after initialization.
  if(!Array.isArray(app.db.tournaments))app.db.tournaments=[];
  for(const t of app.db.teams||[]){t.state=(t.state||'SC').toUpperCase();t.color=validColor(t.color);t.secondaryColor=validColor(t.secondaryColor||'#f0b44d','#f0b44d');}
  for(const g of app.db.games||[]){if(g.neutralSite==null)g.neutralSite=false;g.venue||='';g.tournamentId||='';}

  // Event years remain selectable even when no games are attached yet.
  const allSeasonsV4=allSeasons;
  allSeasons=function(){return [...new Set([...allSeasonsV4(),...(app.db.tournaments||[]).map(x=>String(x.season)).filter(Boolean)])].sort((a,b)=>Number(b)-Number(a));};
  // Homepage pitching/hitting leaders are South Carolina leaderboards by default.
  leaders=function(type='batting',limit=6,tid='all',season=app.season){
    let rows=statPlayers(type,tid,season);
    if(tid==='all')rows=rows.filter(x=>isSC(team(x.player.teamId)));
    return rows.sort((a,b)=>type==='pitching'?safeNum(b.stats.so)-safeNum(a.stats.so):safeNum(b.stats.h)-safeNum(a.stats.h)).slice(0,limit);
  };

  const formV4=teamForm;
  teamForm=function(t=null,inline=false){
    let markup=formV4(t,inline);
    const state=String(t?.state||'SC').toUpperCase();
    const stateField=`<div class="field"><label>State</label><select class="input" name="state">${STATES.map(([code,name])=>`<option value="${code}" ${state===code?'selected':''}>${name} (${code})</option>`).join('')}</select><small class="small-note">Choose another state for opponents you want to scout. SC standings will not include them.</small></div>`;
    const currentAssociation=state==='SC'?(String(t?.association||'SCHSL').toUpperCase()==='SCISA'?'SCISA':'SCHSL'):'OUT';
    const associationField=`<div class="field"><label>South Carolina athletics association</label><select class="input" name="association"><option value="SCHSL" ${currentAssociation==='SCHSL'?'selected':''}>SCHSL — High School League</option><option value="SCISA" ${currentAssociation==='SCISA'?'selected':''}>SCISA — Independent Schools</option><option value="OUT" ${currentAssociation==='OUT'?'selected':''}>Out-of-state opponent (determined by State)</option></select><small class="small-note">Choose SCHSL or SCISA for South Carolina schools. State controls out-of-state opponents. They share the directory, but standings are separate.</small></div>`;
    markup=markup.replace(/(<div class="field"><label>City<\/label>[\s\S]*?<\/div>)/,`$1${stateField}${associationField}`);
    const colors=`<div class="field"><label>Primary team color</label><input class="input" type="color" name="color" value="${validColor(t?.color||'#17375c')}"></div><div class="field"><label>Secondary team color</label><input class="input" type="color" name="secondaryColor" value="${validColor(t?.secondaryColor||'#f0b44d','#f0b44d')}"></div>`;
    markup=markup.replace(/<div class="field"><label>School accent color<\/label>[\s\S]*?<\/div>/,colors);
    markup=markup.replace('School page content and logo','Team identity, two-color branding and logo');
    return markup;
  };

  saveTeam=async function(event){
    event.preventDefault();const form=event.target, f=new FormData(form),name=String(f.get('name')||'').trim();
    if(!name){toast('Please enter a school or opponent name.');return;}
    try{
      const id=form.dataset.teamId||app.teamEditingId,old=app.db.teams.find(x=>x.id===id);
      const state=String(f.get('state')||'SC').toUpperCase();
      const site=String(f.get('websiteUrl')||'').trim();
      if(site&&!safeExternalUrl(site))throw Error('Use a valid athletics website URL.');
      if(app.db.teams.some(x=>x.id!==old?.id&&x.name.toLowerCase()===name.toLowerCase()&&String(x.state||'SC').toUpperCase()===state))throw Error('That team already exists for this state. Edit its existing page.');
      const vals={
        name,mascot:String(f.get('mascot')||'').trim(),short:String(f.get('short')||name.slice(0,3)).toUpperCase().slice(0,4),
        state,association:state==='SC'?(String(f.get('association')||'SCHSL').toUpperCase()==='SCISA'?'SCISA':'SCHSL'):'OUT',classification:String(f.get('classification')||'Other').trim()||'Other',region:state==='SC'?String(f.get('region')||'').trim():'',
        city:String(f.get('city')||'').trim(),coach:String(f.get('coach')||'').trim(),
        color:validColor(f.get('color')||old?.color,'#17375c'),secondaryColor:validColor(f.get('secondaryColor')||old?.secondaryColor,'#f0b44d'),
        description:String(f.get('description')||'').trim(),websiteUrl:site,logo:old?.logo||''
      };
      if(f.get('removeLogo')==='yes')vals.logo='';
      const file=form.elements.logo?.files?.[0];if(file) vals.logo=await scaledImageData(file,360);
      let dest=old;
      if(dest)Object.assign(dest,vals);
      else {let id2=slug(`${name}${state!=='SC'?' '+state:''}`);if(app.db.teams.some(x=>x.id===id2))id2=uid(id2);dest={id:id2,...vals};app.db.teams.push(dest);}
      app.teamEditingId=null;app.inlineEdit=null;saveDraft();toast(`Saved ${dest.name} and both team colors.`);
      if(!old)setRoute(`#team:${encodeURIComponent(dest.id)}`);else render();
    }catch(error){toast(error?.message||'Could not save school.');}
  };

  const teamPageV4=renderTeamDetail;
  renderTeamDetail=function(id){
    const t=team(id),pri=validColor(t.color),sec=validColor(t.secondaryColor||'#f0b44d','#f0b44d');
    const style=`--team-primary:${pri};--team-secondary:${sec};--team-on-primary:${highContrast(pri)};--team-on-secondary:${highContrast(sec)};`;
    const outside=!isSC(t)?`<div class="scouting-opponent-banner"><strong>${htxt(t.state||'Out of state')} opponent profile</strong><span>Rosters, box scores and statistics are supported. Excluded from South Carolina region standings and RPI seed entries.</span></div>`:'';
    const extra=`<div class="team-secondary-rule" aria-hidden="true"><span></span><span></span></div>`;
    let html=teamPageV4(id);
    if(outside)html=html.replace(/CLASS [^<]* · REGION UNASSIGNED/,`OUT-OF-STATE OPPONENT · ${htxt(t.state)}`);
    return `<div class="team-themed" style="${style}">${outside}${html}${extra}</div>`;
  };
  const teamDirectoryV4=renderTeams;
  renderTeams=function(){
    const f=app.filters, scope=f.schoolScope||'sc';
    const filtered=[...app.db.teams].filter(t=>(scope==='all'||(scope==='sc'?isSC(t):!isSC(t)))
      &&(f.class==='all'||t.classification===f.class)
      &&(f.region==='all'||t.region===f.region)
      &&(!f.query||`${t.name} ${t.city} ${t.mascot} ${t.state}`.toLowerCase().includes(f.query.toLowerCase()))).sort((a,b)=>a.name.localeCompare(b.name));
    const select=`<div class="filter-item"><label>Directory</label><select data-school-scope aria-label="School directory scope"><option value="sc" ${scope==='sc'?'selected':''}>South Carolina</option><option value="out" ${scope==='out'?'selected':''}>Out-of-state opponents</option><option value="all" ${scope==='all'?'selected':''}>All tracked teams</option></select></div>`;
    return `${pageHeading('Team directory','South Carolina schools and tracked out-of-state scouting opponents.',`<button type="button" data-action="new-school" class="btn dark">+ Add school / opponent</button>`)}<div class="filter-bar">${select}<div class="filter-item"><label>Classification</label>${classSelector()}</div><div class="filter-item"><label>Region</label>${regionSelector()}</div><div class="filter-item grow"><label>Search</label><input class="input" type="search" placeholder="School, state or city" data-filter="query" value="${htxt(f.query)}"></div></div><div class="team-grid">${filtered.map(t=>`<a href="#team:${htxt(t.id)}" class="team-tile two-tone-tile" style="--team-primary:${validColor(t.color)};--team-secondary:${validColor(t.secondaryColor||'#f0b44d','#f0b44d')}"><div class="team-tile-top">${teamMark(t)}<span class="pill">${isSC(t)?`Class ${htxt(t.classification)}${t.region?' · R'+htxt(t.region):''}`:`${htxt(t.state)} · Opponent`}</span></div><div><h3>${htxt(t.name)}</h3><p>${htxt(t.mascot||'')} · ${htxt(t.city||'')} ${htxt(t.state||'SC')}</p></div><div class="team-tile-foot"><span>${recordLabel(record(t.id))} tracked</span><span>Team profile ↗</span></div></a>`).join('')||'<div class="empty panel">No teams match this view. Switch directory or add an opponent.</div>'}</div>`;
  };

  const newGameV4=newGame;
  newGame=function(){return {...newGameV4(),neutralSite:false,venue:'',tournamentId:''};};
  const onEditPropV4=onEditProp;
  onEditProp=function(el){if(el.dataset.editProp==='neutralSite'){ensureEditGame().neutralSite=el.value==='true';return;}return onEditPropV4(el);};
  const gameEditorV4=gameEditor;
  const tournamentOptions=(selected,season)=>`<option value="" ${!selected?'selected':''}>No tournament / event</option>${[...app.db.tournaments||[]].sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||''))).map(x=>`<option value="${htxt(x.id)}" ${selected===x.id?'selected':''}>${htxt(x.name)} (${htxt(x.season)})</option>`).join('')}`;
  gameEditor=function(){
    const g=ensureEditGame();let html=gameEditorV4();
    const neutral=`<div class="field"><label>Game location / designation</label><select data-edit-prop="neutralSite"><option value="false" ${!isNeutral(g)?'selected':''}>Home / away</option><option value="true" ${isNeutral(g)?'selected':''}>Neutral site (no home advantage)</option></select></div>`;
    const venue=`<div class="field"><label>Ballpark / venue</label><input class="input" data-edit-prop="venue" value="${htxt(g.venue||'')}" placeholder="Shipyard Park, Myrtle Beach, etc."></div>`;
    const tournament=`<div class="field"><label>Tournament / event</label><select data-edit-prop="tournamentId">${tournamentOptions(g.tournamentId,g.season)}</select><small class="small-note">Tournament is separate from the region/nonregion game classification.</small></div>`;
    const link=`<div class="field tournament-field-action"><label>Manage events</label><button type="button" class="btn light sm" data-action="admin-tournaments">+ Create / edit tournament</button></div>`;
    html=html.replace(/(<div class="field"><label>Game type<\/label>[\s\S]*?<\/select><\/div>)/,`$1${neutral}${venue}${tournament}${link}`);
    html=html.replace('Edit both teams separately. Click Save Game when finished.',isNeutral(g)?'Enter both teams even at a neutral venue. Away/Home here identify scorecard columns, not host advantage.':'Edit both teams separately. Click Save Game when finished.');
    return html;
  };
  const saveGameV4=saveGame;
  saveGame=function(e){const g=ensureEditGame();
    if(g.type==='region' && (!isSC(team(g.homeId))||!isSC(team(g.awayId)))){e.preventDefault();toast('Out-of-state opponents cannot be classified as SCHSL region games. Choose Nonregion or Tournament.');return;}
    if(g.tournamentId && !eventById(g.tournamentId)){e.preventDefault();toast('This tournament no longer exists. Select another event.');return;}
    return saveGameV4(e);
  };
  const gameKindV4=fmtGameType;
  fmtGameType=function(g){const name=eventCaption(g);return `${gameKindV4(g)}${name?` · ${name}`:''}${isNeutral(g)?' · Neutral site':''}`;};
  const scheduledRowV4=scheduledRow;
  scheduledRow=function(g,id){
    const opponent=team(g.homeId===id?g.awayId:g.homeId),home=g.homeId===id,neutral=isNeutral(g),v=gameVenue(g),ev=eventCaption(g);
    const result=isCompleted(g)?(wins(g,id)?'W ':losses(g,id)?'L ':'T ')+htxt(g[home?'homeScore':'awayScore'])+'–'+htxt(g[home?'awayScore':'homeScore']):'Scheduled';
    return `<tr><td>${fmtDate(g.date,'short')}</td><td><a href="#team:${htxt(opponent.id)}">${htxt(opponent.name)} <span class="coverage-muted">${htxt(opponent.state||'SC')}</span></a></td><td>${neutral?'Neutral':home?'Home':'Away'}${v?`<div class="venue-small">${htxt(v)}</div>`:''}</td><td>${htxt(gameKindV4(g))}${ev?`<div class="venue-small event-label">${htxt(ev)}</div>`:''}</td><td>${result}</td><td>${isCompleted(g)?`<a href="#game:${htxt(g.id)}" class="see-all">Box score ↗</a>`:'—'}</td></tr>`;
  };
  const gameListRowV4=gameListRow;
  gameListRow=function(g){
    const orig=gameListRowV4(g),caption=[isNeutral(g)?'Neutral':'',eventCaption(g),gameVenue(g)].filter(Boolean).join(' · ');
    return caption?orig.replace('</div><div class="score-points">',`<div class="score-event-mini">${htxt(caption)}</div></div><div class="score-points">`):orig;
  };
  const gameDetailV4=renderGameDetail;
  renderGameDetail=function(id){const g=app.db.games.find(x=>x.id===id);if(!g)return gameDetailV4(id);
    let html=gameDetailV4(id);
    const bits=[isNeutral(g)?'Neutral-site game':'',eventCaption(g),gameVenue(g)].filter(Boolean);
    if(bits.length){
      const badge=`<div class="game-venue-banner">${bits.map(s=>`<span>${htxt(s)}</span>`).join('')}</div>`;
      html=isCompleted(g)?html.replace('<div class="line-score table-wrap">',badge+'<div class="line-score table-wrap">'):
        html.replace('<div class="panel panel-pad">No result',badge+'<div class="panel panel-pad">No result');
    }
    if(isNeutral(g)){
      html=html.replace('<span class="eyebrow">AWAY</span>','<span class="eyebrow">TEAM 1</span>').replace('<span class="eyebrow">HOME</span>','<span class="eyebrow">TEAM 2</span>');
      html=html.replace(`${htxt(team(g.awayId).name)} at ${htxt(team(g.homeId).name)}`,`${htxt(team(g.awayId).name)} vs ${htxt(team(g.homeId).name)}`);
    }
    return html;
  };
  const scoresV4=renderScores;
  renderScores=function(){
    const f=app.filters,selected=f.tournament||'all';
    const results=orderedGames().filter(g=>(f.class==='all'||team(g.homeId).classification===f.class||team(g.awayId).classification===f.class)
      &&(f.team==='all'||g.homeId===f.team||g.awayId===f.team)
      &&(selected==='all'||g.tournamentId===selected));
    return `${pageHeading('Scores & schedules','Completed games, upcoming matchups, tournament schedules and neutral-site results.',`<button type="button" class="btn dark" data-action="new-game">+ Enter game</button>`)}<div class="filter-bar"><div class="filter-item"><label>Season</label>${seasonFilter()}</div><div class="filter-item"><label>Classification</label>${classSelector()}</div><div class="filter-item"><label>School</label><select data-filter="team"><option value="all">All teams</option>${teamOptions(f.team)}</select></div><div class="filter-item grow"><label>Event</label><select data-tournament-filter><option value="all">All events</option>${(app.db.tournaments||[]).map(x=>`<option value="${htxt(x.id)}" ${selected===x.id?'selected':''}>${htxt(x.name)} · ${htxt(x.season)}</option>`).join('')}</select></div></div><div class="score-cards">${results.map(g=>{const away=team(g.awayId),home=team(g.homeId),done=isCompleted(g),neutral=isNeutral(g),ev=eventCaption(g),v=gameVenue(g);return `<div class="score-card"><div class="score-card-header"><span>${fmtDate(g.date)} · ${htxt(gameKindV4(g))}</span>${done?tag('final'):'<span class="status-pill">Scheduled</span>'}</div><div class="score-card-main"><div><div class="team-name">${htxt(away.name)}</div><small>${neutral?'Team 1':'Away'} · ${htxt(away.state||'SC')}</small><span class="score-num ${done&&wins(g,away.id)?'winner':''}">${done?htxt(g.awayScore):'—'}</span></div><div class="vs">VS</div><div><div class="team-name">${htxt(home.name)}</div><small>${neutral?'Team 2':'Home'} · ${htxt(home.state||'SC')}</small><span class="score-num ${done&&wins(g,home.id)?'winner':''}">${done?htxt(g.homeScore):'—'}</span></div></div>${neutral||ev||v?`<div class="score-site-info">${neutral?'<strong>Neutral site</strong>':''}${ev?`<span>${htxt(ev)}</span>`:''}${v?`<span>📍 ${htxt(v)}</span>`:''}</div>`:''}<div class="score-card-footer"><span class="small-note">${done?'Verified result entered':'Scheduled matchup'}</span>${done?`<a class="card-btn" href="#game:${htxt(g.id)}">Full box score ↗</a>`:`<a class="card-btn" href="#game:${htxt(g.id)}">Game details ↗</a>`}</div></div>`;}).join('')||'<div class="panel empty"><strong>No games match these filters</strong><p>Add a matchup, or choose another school or tournament.</p></div>'}</div>`;
  };

  function tournamentCard(t){
    const games=orderedGames(app.db.games.filter(g=>g.tournamentId===t.id)).sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999')));
    const place=[t.venue,t.city,t.state].filter(Boolean).join(' · ');
    return `<article class="panel tournament-card"><div class="event-type">${htxt((CATEGORIES.find(x=>x[0]===t.category)||['','Tournament'])[1])} · ${htxt(t.season||'')}</div><h3>${htxt(t.name)}</h3><p>${t.startDate?fmtDate(t.startDate,'short'):''}${t.endDate&&t.endDate!==t.startDate?' – '+fmtDate(t.endDate,'short'):''}${place?`<br>${htxt(place)}`:''}</p><div class="event-count">${games.length} scheduled / recorded games</div><div class="event-games">${games.slice(0,8).map(g=>`<div><span>${fmtDate(g.date,'short')}</span><a href="#game:${htxt(g.id)}">${htxt(team(g.awayId).name)} ${isCompleted(g)?htxt(g.awayScore):'vs'} ${htxt(team(g.homeId).name)} ${isCompleted(g)?htxt(g.homeScore):''}</a><small>${isNeutral(g)?'Neutral':''}</small></div>`).join('')||'<div class="empty">No games attached yet.</div>'}</div>${games.length>8?`<p class="small-note">Showing 8 of ${games.length} games.</p>`:''}</article>`;
  }
  function tournamentPublic(){const f=app.filters,season=app.season;
    const items=seasonEvents(season).sort((a,b)=>String(a.startDate||'').localeCompare(String(b.startDate||'')));
    return `${pageHeading('Tournaments & events','Preseason classics, spring-break events and invitational schedules.',`<button class="btn dark" type="button" data-action="admin-tournaments">+ Manage tournaments</button>`)}<div class="filter-bar"><div class="filter-item"><label>Season</label>${seasonFilter()}</div></div><div class="tournament-grid">${items.map(tournamentCard).join('')||'<div class="panel empty"><strong>No tournaments added for this season.</strong><p>Use Site editor → Tournaments to create an event, then attach games in the scorekeeper.</p></div>'}</div>`;
  }

  function tournamentManager(){
    const t=eventById(app.tournamentEditingId)||null;
    return `<div class="panel"><div class="panel-head"><h3>${t?'Edit tournament':'Create tournament or event'}</h3><span class="subtext">Organize multiple matchups under one event</span></div><div class="admin-form"><form id="tournament-form" class="form-grid two"><div class="field wide"><label>Event name</label><input class="input" name="name" required value="${htxt(t?.name||'')}" placeholder="HIT Tournament, Spring Break Classic, etc."></div><div class="field"><label>Season</label><input class="input" name="season" required pattern="20[0-9]{2}" value="${htxt(t?.season||app.season||'2027')}"></div><div class="field"><label>Type</label><select class="input" name="category">${CATEGORIES.map(([v,label])=>`<option value="${v}" ${t?.category===v?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>First date</label><input class="input" type="date" name="startDate" value="${htxt(t?.startDate||'')}"></div><div class="field"><label>Last date</label><input class="input" type="date" name="endDate" value="${htxt(t?.endDate||'')}"></div><div class="field"><label>Primary ballpark (optional)</label><input class="input" name="venue" value="${htxt(t?.venue||'')}" placeholder="Shipyard Park"></div><div class="field"><label>City</label><input class="input" name="city" value="${htxt(t?.city||'')}"></div><div class="field"><label>State</label><select class="input" name="state">${STATES.map(([code,name])=>`<option value="${code}" ${String(t?.state||'SC')===code?'selected':''}>${name}</option>`).join('')}</select></div><div class="field wide"><label>Event notes (public)</label><textarea class="input" name="notes" rows="3">${htxt(t?.notes||'')}</textarea></div><div class="field full editor-button-row"><button class="btn dark" type="submit">${t?'Save tournament changes':'Add tournament'} ↗</button>${t?'<button class="btn light" type="button" data-action="new-tournament">Cancel editing</button>':''}<button class="btn light" type="button" data-action="back-to-game-editor">← Game entry</button></div></form><hr class="form-divider"><h3>Existing tournaments</h3><div class="editor-row-list">${[...app.db.tournaments||[]].sort((a,b)=>String(b.season).localeCompare(String(a.season))).map(x=>`<div class="editor-list-row"><span><strong>${htxt(x.name)}</strong><br><small>${htxt(x.season)} · ${htxt((CATEGORIES.find(k=>k[0]===x.category)||['','Event'])[1])} · ${app.db.games.filter(g=>g.tournamentId===x.id).length} games</small></span><button class="btn sm light" data-action="edit-tournament" data-id="${htxt(x.id)}" type="button">Edit</button><button class="btn sm light danger" data-action="delete-tournament" data-id="${htxt(x.id)}" type="button">Delete</button></div>`).join('')||'<div class="empty">No events yet.</div>'}</div></div></div>`;
  }
  function saveTournament(e){e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').trim(),season=String(f.get('season')||'').trim();if(!name||!/^20\d{2}$/.test(season)){toast('Enter an event name and valid four-digit season.');return;}
    const first=String(f.get('startDate')||''),last=String(f.get('endDate')||'');if(first&&last&&last<first){toast('The ending date cannot be before the starting date.');return;}
    const vals={name,season,category:String(f.get('category')||'other'),startDate:first,endDate:last,venue:String(f.get('venue')||'').trim(),city:String(f.get('city')||'').trim(),state:String(f.get('state')||'SC'),notes:String(f.get('notes')||'').trim()};
    const old=eventById(app.tournamentEditingId);if(old)Object.assign(old,vals);else app.db.tournaments.push({id:uid('event'),...vals});
    app.tournamentEditingId=null;saveDraft();toast('Tournament saved. Attach games using Game entry → Tournament.');render();
  }

  function scoutingManager(){
    const out=[...app.db.teams].filter(t=>!isSC(t)).sort((a,b)=>a.name.localeCompare(b.name));
    const id=app.scoutTeamId&&app.db.teams.some(t=>t.id===app.scoutTeamId)?app.scoutTeamId:out[0]?.id||app.db.teams[0]?.id;
    app.scoutTeamId=id;const t=team(id);
    return `<div class="panel"><div class="panel-head"><h3>Local scouting notebook</h3><span class="subtext">For your own baseball research</span></div><div class="admin-form"><div class="info-band warning"><strong>Not included in public website data:</strong> these notes stay in this browser only. They are not secured by a password and should not contain confidential information. Export the notes separately if moving devices.</div><div class="field"><label>Team</label><select class="input" data-scout-team>${[...app.db.teams].sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${htxt(x.id)}" ${x.id===id?'selected':''}>${htxt(x.name)} (${htxt(x.state||'SC')})</option>`).join('')}</select></div><form id="scout-form"><div class="field"><label>Personal scouting notes for ${htxt(t.name)} (local only)</label><textarea name="notes" class="input" rows="12" placeholder="Public-game observations, tendencies, reminders…">${htxt(notes[id]||'')}</textarea></div><button class="btn dark" type="submit">Save local notes</button><button class="btn light" type="button" data-action="export-scouting">Download notebook backup</button></form><p class="small-note">Only player stats, game results and team details entered into the normal site database can be published. Your notebook is separate.</p></div></div>`;
  }

  const renderAdminV4=renderAdmin;
  renderAdmin=function(){
    let html=renderAdminV4();
    const tabs=`<button type="button" data-action="admin-tab" data-tab="tournaments" class="${app.adminTab==='tournaments'?'active':''}">Tournaments</button><button type="button" data-action="admin-tab" data-tab="scouting" class="${app.adminTab==='scouting'?'active':''}">Scouting notebook</button>`;
    html=html.replace('</div><div class="admin-layout">',`${tabs}</div><div class="admin-layout">`);
    if(app.adminTab==='tournaments'||app.adminTab==='scouting'){
      const content=app.adminTab==='tournaments'?tournamentManager():scoutingManager();
      html=html.replace(/<div class="admin-content">[\s\S]*?<\/div><aside class="admin-sidebar">/,`<div class="admin-content">${content}</div><aside class="admin-sidebar">`);
    }
    return html;
  };

  const renderV4=render;
  render=function(){const section=(location.hash.replace(/^#/,'')||'home').split(':')[0];
    if(section!=='tournaments')return renderV4();
    const root=$('#app');try{root.innerHTML=tournamentPublic();updateNav();updateSiteChrome();$('#edition-label').textContent=`${htxt(app.season||'2027')} SEASON / SITE EDITOR`;}catch(e){console.error(e);root.innerHTML=`<div class="panel empty">Could not draw tournaments: ${htxt(e.message)}</div>`;}
  };

  // New actions. Existing event delegates keep handling the old workflows.
  document.addEventListener('click', e=>{const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
    if(action==='new-school'){e.preventDefault();app.teamEditingId=null;app.adminTab='teams';setRoute('#admin');}
    else if(action==='admin-tournaments'){e.preventDefault();app.adminTab='tournaments';app.tournamentEditingId=null;setRoute('#admin');}
    else if(action==='new-tournament'){e.preventDefault();app.tournamentEditingId=null;render();}
    else if(action==='edit-tournament'){e.preventDefault();app.tournamentEditingId=el.dataset.id;app.adminTab='tournaments';render();}
    else if(action==='delete-tournament'){e.preventDefault();const t=eventById(el.dataset.id);if(!t)return;const n=app.db.games.filter(g=>g.tournamentId===t.id).length;
      if(!confirm(`Delete ${t.name}? ${n} linked game(s) will remain, but will no longer be associated with a tournament.`))return;
      app.db.tournaments=app.db.tournaments.filter(x=>x.id!==t.id);for(const g of app.db.games)if(g.tournamentId===t.id)g.tournamentId='';
      app.tournamentEditingId=null;saveDraft();toast('Event deleted; existing games preserved.');render();
    }
    else if(action==='back-to-game-editor'){e.preventDefault();app.adminTab='games';render();}
    else if(action==='export-scouting'){e.preventDefault();downloadFile('palmetto-diamond-private-scouting-notes.json',JSON.stringify(notes,null,2));toast('Private notes exported separately from the public site.');}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='tournament-form')saveTournament(e);
    else if(e.target.id==='scout-form'){e.preventDefault();notes[app.scoutTeamId]=String(new FormData(e.target).get('notes')||'');try{localStorage.setItem(NOTES_KEY,JSON.stringify(notes));toast('Notes saved locally. They will not appear in public exports.');}catch(_){toast('Browser storage unavailable; download a notebook backup.');}}
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-school-scope]')){app.filters.schoolScope=e.target.value;app.filters.class='all';app.filters.region='all';app.filters.query='';app.filters.team='all';render();}
    else if(e.target.matches('[data-tournament-filter]')){app.filters.tournament=e.target.value;render();}
    else if(e.target.matches('[data-scout-team]')){app.scoutTeamId=e.target.value;render();}
  });

  const nav=document.querySelector('.site-nav');if(nav){const link=document.createElement('a');link.setAttribute('data-nav','');link.href='#tournaments';link.textContent='Tournaments';const scores=nav.querySelector('a[href="#scores"]');if(scores) scores.after(link);else nav.appendChild(link);}
  const footer=document.querySelector('.footer-links');if(footer){const link=document.createElement('a');link.href='#tournaments';link.textContent='Tournaments';footer.appendChild(link);}
})();
