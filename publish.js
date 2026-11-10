/* Palmetto Diamond 5.0 — live GitHub publishing and reliable school creation.
   Never persist a GitHub token. Only the owner/repository/branch are saved. */
(() => {
  'use strict';
  const EDITOR_MODE = (location.protocol === 'file:' || location.protocol === 'about:' || new URLSearchParams(location.search).has('edit'));
  document.documentElement.classList.toggle('editor-mode', EDITOR_MODE);
  const CONFIG_KEY = 'palmetto-diamond-publishing-config-v4';
  let ghToken = '';
  let ghSha = null;
  let ghConnected = false;
  let ghMessage = '';
  let ghBusy = false;
  const guessedOwner = location.hostname.endsWith('.github.io') ? location.hostname.split('.')[0] : '';
  const guessedRepo = location.hostname.endsWith('.github.io') ? (location.pathname.split('/').filter(Boolean)[0] || (guessedOwner + '.github.io')) : 'palmetto-diamond';
  let ghConfig = {owner: guessedOwner, repo: guessedRepo, branch: 'main'};
  try {
    const remembered = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (remembered && typeof remembered === 'object') ghConfig = {...ghConfig, ...remembered};
  } catch (_) {}
  const editorUrl = () => `${location.origin}${location.pathname}?edit=1#admin`;
  const el = (tag, attrs, text) => {const e=document.createElement(tag);for(const [key,val] of Object.entries(attrs||{})) e.setAttribute(key,val);if(text!=null)e.textContent=text;return e;};
  const safeField = value => String(value||'').trim();
  const ghPath = () => {
    const {owner, repo, branch} = ghConfig;
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(owner) || !/^[a-zA-Z0-9._-]{1,100}$/.test(repo) || !/^[a-zA-Z0-9._\/-]{1,140}$/.test(branch) || branch.includes('..')) {
      throw new Error('Enter a valid GitHub username, repository and branch (usually main).');
    }
    return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/site-data.json`;
  };
  const authHeaders = () => ({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Authorization': `Bearer ${ghToken}`
  });
  const httpError = async response => {
    let details = '';
    try { const p = await response.json(); details = p.message || ''; } catch (_) {}
    const common = {
      401: 'GitHub rejected the token. Check that it is valid.',
      403: 'GitHub refused access. Grant this repository Contents: Read and write.',
      404: 'Repository or site-data.json not found. First upload the V5 website files to your GitHub repository.',
      409: 'The file was changed by someone else. Refresh the connection and resolve conflicting edits.',
      422: 'GitHub could not process this file update. Check branch permissions and repository settings.'
    };
    throw new Error(common[response.status] || `GitHub returned ${response.status}: ${details.slice(0,140)}`);
  };
  function setMessage(msg, bad=false){ghMessage=msg;const box=document.getElementById('github-status');if(box){box.textContent=msg;box.classList.toggle('error',bad);} }
  function configFromForm(){
    const f = document.getElementById('github-connection-form');
    if (f) {
      ghConfig = {
        owner: safeField(f.elements.owner.value),
        repo: safeField(f.elements.repo.value),
        branch: safeField(f.elements.branch.value) || 'main'
      };
      if (f.elements.token.value.trim()) {ghToken = f.elements.token.value.trim();f.elements.token.value='';}
    }
    ghPath();
    try{localStorage.setItem(CONFIG_KEY,JSON.stringify(ghConfig));}catch(_){}
    if(!ghToken)throw new Error('Enter a fine-grained GitHub token (Contents: Read and write for this one repository).');
  }
  async function getRemote(){
    const res = await fetch(`${ghPath()}?ref=${encodeURIComponent(ghConfig.branch)}`,{
      method:'GET',headers:authHeaders(),cache:'no-store'
    });
    if(!res.ok)await httpError(res);
    const json = await res.json();
    if(!json.sha)throw new Error('GitHub response is missing the file version.');
    return json;
  }
  async function connectGitHub() {
    if (ghBusy) return;
    try {
      configFromForm(); ghBusy=true;setMessage('Checking repository access…');
      const remote = await getRemote();
      ghSha=remote.sha;ghConnected=true;
      setMessage(`Connected to ${ghConfig.owner}/${ghConfig.repo} (${ghConfig.branch}). Your token stays only in this browser tab; nothing has been published yet.`);
    }catch(err){ghConnected=false;setMessage(err.message,true);}finally{ghBusy=false;}
  }
  function encodeUTF8Base64(input){
    const bytes=new TextEncoder().encode(input);let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary);
  }
  function decodeUTF8Base64(input){
    const binary=atob(String(input||'').replace(/\s/g,''));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  async function publishGitHub() {
    if(ghBusy)return;
    try{
      configFromForm();
      if(!ghConnected)throw new Error('First click “Connect & verify repository”, then publish.');
      ghBusy=true;setMessage('Checking the latest online version…');
      const remote=await getRemote();
      if(ghSha && remote.sha!==ghSha){
        throw new Error('The public data changed since your last connection. Save a private backup, reload online data, and reapply your changes before publishing. Nothing was overwritten.');
      }
      const published=publicExportData();
      const jsonString=JSON.stringify(published,null,2)+'\n';
      const bytes=new TextEncoder().encode(jsonString).length;
      if(bytes>2000000)throw new Error('The data file is larger than 2 MB. Reduce uploaded images before publishing.');
      if(!confirm(`Publish ${published.teams.length} school pages, ${published.games.length} games and ${published.articles.length} public stories to ${ghConfig.owner}/${ghConfig.repo}? Private drafts will NOT be uploaded.`)){
        setMessage('Publishing canceled.');return;
      }
      setMessage('Uploading public data to GitHub…');
      const result=await fetch(ghPath(),{
        method:'PUT',headers:{...authHeaders(),'Content-Type':'application/json'},
        body: JSON.stringify({
          message:`Update Palmetto Diamond site data (${new Date().toISOString().slice(0,10)})`,
          content:encodeUTF8Base64(jsonString),sha:remote.sha,branch:ghConfig.branch
        })
      });
      if(!result.ok)await httpError(result);
      const output=await result.json();
      ghSha=output.content?.sha||null;
      if(!ghSha)ghSha=(await getRemote()).sha;
      ghConnected=true;
      setMessage(`Published to GitHub! ${published.teams.length} schools and ${published.articles.length} published stories were committed. GitHub Pages may take a few minutes to show the update.`);
    }catch(err){setMessage(err.message,true);}finally{ghBusy=false;}
  }
  async function loadOnline(){
    if(ghBusy)return;
    try{
      configFromForm();if(!ghConnected)throw new Error('Connect to GitHub first.');
      if(!confirm('Replace this browser draft with the current online data? Your private draft will be downloaded first.'))return;
      ghBusy=true;
      downloadFile('palmetto-diamond-backup-before-sync.json',JSON.stringify(app.db,null,2));
      const remote=await getRemote();
      if(!remote.content || remote.encoding!=='base64') throw new Error('GitHub did not return file contents. Use the manual JSON import for large files.');
      const incoming=JSON.parse(decodeUTF8Base64(remote.content));
      if(!Array.isArray(incoming.teams)||!Array.isArray(incoming.games)||!Array.isArray(incoming.players))throw new Error('Online site data is missing teams, players, or games.');
      app.db=upgradeLegacyData(incoming);app.publicData=structuredClone(app.db);
      try{localStorage.removeItem(STORE_KEY);localStorage.removeItem('palmetto-diamond-local-v2');}catch(_){}
      app.showDraft=false;app.teamEditingId=null;app.adminArticleEditId=null;app.inlineEdit=null;
      ghSha=remote.sha;ghConnected=true;
      beginGame();setMessage('Loaded the latest online data. The previous browser draft was downloaded as a backup.');render();
    }catch(err){setMessage(err.message,true);}finally{ghBusy=false;}
  }
  // GitHub publishing is an optional convenience. Export remains available as a no-token fallback.
  adminPublish = function () {
    return `<div class="panel"><div class="panel-head"><h3>Publish the public website</h3><span class="subtext">GitHub Pages · no hosting charge</span></div>
    <div class="admin-form">
    <div class="workflow-steps"><div class="step"><strong>1</strong><span><b>Create a GitHub repository</b><small>Upload the files in the V5 ZIP and enable Pages (main branch, root). You only need to do this once.</small></span></div>
    <div class="step"><strong>2</strong><span><b>Make your edits</b><small>Add schools, logos, articles, rosters and game statistics. They save as a local editing draft until published.</small></span></div>
    <div class="step"><strong>3</strong><span><b>Publish from here</b><small>Connect a fine-grained token for your repository to commit the public dataset to site-data.json. Do not share tokens with anyone.</small></span></div></div>
    <form id="github-connection-form" class="form-grid two" autocomplete="off">
    <div class="field"><label>GitHub username or organization</label><input name="owner" class="input" required value="${esc(ghConfig.owner)}" placeholder="your-github-username"></div>
    <div class="field"><label>Repository</label><input name="repo" class="input" required value="${esc(ghConfig.repo)}" placeholder="palmetto-diamond"></div>
    <div class="field"><label>Branch</label><input name="branch" class="input" value="${esc(ghConfig.branch)}" placeholder="main" required></div>
    <div class="field"><label>Fine-grained GitHub token</label><input name="token" type="password" class="input" autocomplete="off" placeholder="Paste for this session only"><small>Restricted to this one repository · Contents: Read and write. Never send it in chat.</small></div>
    <div class="field full"><div class="admin-actions"><button type="submit" class="btn light">1. Connect & verify repository</button><button type="button" data-action="publish-github" class="btn dark">2. Publish saved changes online ↗</button><button type="button" data-action="pull-github" class="btn light">Reload latest online data</button><button type="button" data-action="disconnect-github" class="btn light">Clear token</button></div></div>
    </form>
    <p id="github-status" class="github-status" role="status" aria-live="polite">${esc(ghMessage||'Not connected yet. After the first GitHub Pages setup, enter your repository information to publish from this editor.')}</p>
    <div class="info-band warning"><span><strong>Security:</strong> Editor mode is not a password. Only a valid repository-scoped GitHub token can change the public site. The token is held in memory during this page session (not saved to disk). Use a separate dedicated GitHub account if you want Palmetto Diamond to remain independent from your personal identity. GitHub Pages repos are public on the free plan.</span></div>
    <hr class="form-divider"><h3>Manual publishing and backups</h3><p class="small-note">You can always export <code>site-data.json</code> and upload it via GitHub's website instead. Draft stories are excluded from the public file. Download private backups regularly, especially before switching devices.</p>
    <div class="admin-actions"><button type="button" class="btn light" data-action="export-data">↓ Export public site-data.json</button><button type="button" class="btn light" data-action="export-backup">↓ Save full private backup</button><button type="button" class="btn light" data-action="choose-import">↑ Import backup</button><input type="file" accept="application/json,.json" id="import-json" style="display:none"><button type="button" class="btn light" data-action="reset-data">Reset browser draft</button></div>
    <div class="help" style="margin-top:18px"><b>Publishing help:</b> <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site" target="_blank" rel="noopener noreferrer">GitHub Pages setup instructions ↗</a> · <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Create a fine-grained token ↗</a>.<br>After publishing, visitors may need to refresh once GitHub Pages finishes its deployment. If you edit on a different device, load the latest online data first.</div>
    </div></div>`;
  };
  // The school form worked locally but its feedback did not explain how to publish or go to the new page.
  saveTeam = async function(e) {
    e.preventDefault();
    const form=e.target;
    const f=new FormData(form);
    const name=safeField(f.get('name'));
    if(!name){toast('Enter a school name before saving.');form.elements.name?.focus();return;}
    try{
      const editingId=form.dataset.teamId||app.teamEditingId;
      const original=app.db.teams.find(t=>t.id===editingId);
      if(!original&&app.db.teams.some(t=>t.name.toLowerCase()===name.toLowerCase())) {
        throw new Error('This school already exists. Open its page and use Edit this team page.');
      }
      const url=safeField(f.get('websiteUrl'));
      if(url&&!safeExternalUrl(url))throw new Error('Enter a valid athletics website address beginning with https://');
      const record={
        name,mascot:safeField(f.get('mascot')),short:(safeField(f.get('short'))||name.slice(0,3)).toUpperCase().slice(0,4),
        classification:safeField(f.get('classification'))||'3A',region:safeField(f.get('region')),
        city:safeField(f.get('city')),coach:safeField(f.get('coach')),
        color:safeField(f.get('color'))||'#ed6049',
        description:safeField(f.get('description')),websiteUrl:url,logo:original?.logo||''
      };
      if(f.get('removeLogo')==='yes')record.logo='';
      const logo=form.elements.logo?.files?.[0];
      if(logo)record.logo=await scaledImageData(logo,360);
      let saved;
      if(original){Object.assign(original,record);saved=original;}
      else {
        let id=slug(name)||uid('school');
        if(app.db.teams.some(t=>t.id===id))id=uid(id);
        saved={id,...record};app.db.teams.push(saved);
      }
      const successful=saveDraft();
      if(!successful){console.warn('Browser storage blocked; this draft survives only during this session.');}
      app.teamEditingId=null;app.inlineEdit=null;app.adminTab='teams';
      toast(successful ? `${original?'Updated':'Added'} ${name}! Use Publish data to make it live for readers.` : `School added for this session. Browser storage is blocked: publish or download a backup now.`);
      setRoute(`#team:${encodeURIComponent(saved.id)}`);
    }catch(err){toast(err.message||'Could not save the school.');}
  };
  // Add a reliable entry point to create a new team directly from the Teams directory.
  const priorRenderTeams=renderTeams;
  renderTeams=function(){
    const original=priorRenderTeams();
    return `${EDITOR_MODE?'<div class="quick-edit-wrap"><button type="button" class="btn sm dark" data-action="add-school">+ Add a school</button></div>':''}${original}`;
  };
  const priorRenderAdmin=renderAdmin;
  renderAdmin=function(){
    return priorRenderAdmin().replace('<strong>LOCAL DEMO EDITOR:</strong>','<strong>EDITING WORKSPACE:</strong>')
      .replace('Edits are stored only in your browser until you export and publish <code>site-data.json</code>.','Changes are saved locally until you use <b>Publish data → Publish saved changes online</b> to send them to your public GitHub Pages site.');
  };
  const priorRender=render;
  render=function(){
    const route=(location.hash.slice(1)||'home').split(':')[0];
    if(!EDITOR_MODE&&route==='admin'){
      location.hash='#home';return;
    }
    priorRender();
    document.documentElement.classList.toggle('editor-mode',EDITOR_MODE);
    if(!EDITOR_MODE){
      const note=document.getElementById('demo-banner');if(note)note.innerHTML='<span class="demo-badge">PALMETTO DIAMOND</span> Independent South Carolina high school baseball coverage.';
    }
  };
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action;
    if(action==='add-school'){
      e.preventDefault();app.teamEditingId=null;app.adminTab='teams';app.inlineEdit=null;setRoute('#admin');
      requestAnimationFrame(()=>document.querySelector('#team-form [name=name]')?.focus());
    }
    if(action==='publish-github'){e.preventDefault();publishGitHub();}
    if(action==='pull-github'){e.preventDefault();loadOnline();}
    if(action==='disconnect-github'){
      e.preventDefault();ghToken='';ghConnected=false;ghSha=null;
      const f=document.getElementById('github-connection-form');if(f)f.elements.token.value='';
      setMessage('GitHub token cleared from this page session.');
    }
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='github-connection-form'){
      e.preventDefault();connectGitHub();
    }
  });
  // Diagnostic availability for automated tests; never includes a token.
  window.PalmettoPublishingStatus=()=>({connected:ghConnected,owner:ghConfig.owner,repo:ghConfig.repo,branch:ghConfig.branch,sha:ghSha,message:ghMessage,editorMode:EDITOR_MODE});
})();
