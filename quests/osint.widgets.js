/* OSINT-specific widgets */

/* usersearch: a pretend "find this username everywhere" tool.  wd:{query, profiles:[{site,url,html}]} */
WIDGETS.usersearch=(el,c)=>{
  const w=c.wd;
  el.innerHTML=`<div class="loginbox"><b>🔎 NameHunter</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated username search)</span>
    <div class="sbar"><input type="text" id="usQ" placeholder="username" autocomplete="off" spellcheck="false" autocapitalize="off"><button class="btn sm" id="usGo">Search 4 sites</button></div>
    <div id="usR"></div></div>`;
  const run=()=>{
    const q=$('#usQ',el).value.trim().toLowerCase().replace(/^@/,'');
    const R=$('#usR',el);if(!q){R.innerHTML='';return}
    if(q!==w.query){R.innerHTML=`<p class="res bad">No profiles found for <b>${esc(q)}</b> on any of the 4 sites.</p>`;return}
    R.innerHTML=`<p class="res ok">Found ${w.profiles.length} profiles for <b>${esc(q)}</b>:</p>`+w.profiles.map(p=>`<div class="profile"><div class="site">${p.site} &middot; ${p.url}</div>${p.html}</div>`).join('');
  };
  $('#usGo',el).onclick=run;$('#usQ',el).addEventListener('keydown',e=>{if(e.key==='Enter')run()});
};

/* gridmap: click the square the photographer stood on.  wd:{cols,rows,cells:{D4:'🌉'},river:4,answer:'D5'} */
WIDGETS.gridmap=(el,c)=>{
  const w=c.wd;let pick=null;const L='ABCDEFGHIJ';
  let h=`<div class="gmap" style="grid-template-columns:repeat(${w.cols},1fr)">`;
  for(let r=1;r<=w.rows;r++)for(let k=0;k<w.cols;k++){
    const id=L[k]+r,cls=(w.river===r&&!w.cells[id]?'river':(w.road===k?'road':''));
    h+=`<button class="${cls}" data-id="${id}" aria-label="${id}"><small>${id}</small>${w.cells[id]||''}</button>`;
  }
  h+='</div>';
  el.innerHTML=`<p class="lead" style="margin-top:14px">${w.legend}</p>${h}<p><button class="btn sm" id="gmGo">Check this position</button> <span class="mono" id="gmSel" style="color:var(--dim);margin-left:8px">no square chosen</span></p><div class="res" id="gmR"></div>`;
  $('.gmap',el).onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    $$('.gmap button',el).forEach(x=>x.classList.remove('pick'));b.classList.add('pick');pick=b.dataset.id;$('#gmSel',el).textContent='chosen: '+pick;
  };
  $('#gmGo',el).onclick=()=>{
    const R=$('#gmR',el);if(!pick){R.className='res bad';R.textContent='Click a square first.';return}
    if(pick===w.answer){R.className='res ok';R.innerHTML='That matches every clue. Flag: <b>'+esc(dec(c.id))+'</b>'}
    else{R.className='res bad';R.textContent=pick+' does not fit all the clues. Re-read each direction carefully (north is up).'}
  };
};

/* dork: a tiny search engine that understands site: filetype: intitle: inurl: "phrases" and -exclusions.
   wd:{docs:[{url,title,type,text}], limit}   (a doc whose text contains {{FLAG}} reveals the flag when opened) */
WIDGETS.dork=(el,c)=>{
  const w=c.wd;
  el.innerHTML=`<div class="loginbox"><b>🔍 FindIt</b> <span class="mono" style="color:var(--dim);font-size:12px">(simulated search engine, ${w.docs.length} pages indexed)</span>
    <div class="sbar"><input type="text" id="dkQ" placeholder='try: halcyon college password' autocomplete="off" spellcheck="false" autocapitalize="off"><button class="btn sm" id="dkGo">Search</button></div>
    <p class="lead" style="font-size:13px;margin:4px 0">Operators: <code>site:</code> <code>filetype:</code> <code>intitle:</code> <code>inurl:</code> <code>"exact phrase"</code> <code>-exclude</code></p>
    <div id="dkR"></div><div id="dkV"></div></div>`;
  const parse=q=>{const out=[];const rx=/(-?)(?:(site|filetype|intitle|inurl):)?("[^"]*"|\S+)/gi;let m;while((m=rx.exec(q))){out.push({neg:!!m[1],op:(m[2]||'').toLowerCase(),t:m[3].replace(/"/g,'').toLowerCase()})}return out};
  const test=(d,tm)=>{
    const url=d.url.toLowerCase(),title=d.title.toLowerCase(),all=(url+' '+title+' '+d.text.toLowerCase()+' '+d.type);
    switch(tm.op){case 'site':return url.split('/')[0].endsWith(tm.t);case 'filetype':return d.type===tm.t;case 'intitle':return title.includes(tm.t);case 'inurl':return url.includes(tm.t);default:return all.includes(tm.t)}
  };
  const run=()=>{
    const q=$('#dkQ',el).value.trim(),R=$('#dkR',el);$('#dkV',el).innerHTML='';if(!q){R.innerHTML='';return}
    const terms=parse(q);
    const hits=w.docs.filter(d=>terms.every(t=>test(d,t)!==t.neg));
    const shown=hits.slice(0,w.limit);
    R.innerHTML=`<p class="lead" style="font-size:13px;margin:6px 0">About ${hits.length} results (showing the top ${shown.length})</p><div class="serp">`+
      (shown.map((d,i)=>`<div class="r"><a href="#" data-i="${w.docs.indexOf(d)}">${esc(d.title)}</a><div class="u">${esc(d.url)}</div><p>${esc(d.text.replace('{{FLAG}}','…').slice(0,110))}…</p></div>`).join('')||'<p>No results. Try fewer or different terms.</p>')+'</div>';
  };
  el.onclick=e=>{
    const a=e.target.closest('.serp a');if(!a)return;e.preventDefault();
    const d=w.docs[+a.dataset.i];
    $('#dkV',el).innerHTML=`<div class="whois"><b>${esc(d.url)}</b>\n\n${esc(d.text.replace('{{FLAG}}',dec(c.id)))}</div>`;
  };
  $('#dkGo',el).onclick=run;$('#dkQ',el).addEventListener('keydown',e=>{if(e.key==='Enter')run()});
};
