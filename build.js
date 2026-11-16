#!/usr/bin/env node
/* Build every quest in quests/*.js into one standalone HTML file in docs/.
   Usage: node build.js [questId ...] */
const fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,p),'utf8');

/* must match the hashing in engine/core.js exactly */
function cyrb53(str,seed=0){let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0);}
const norm=(f,loose)=>{f=f.trim().toLowerCase();return loose?f.replace(/[^a-z0-9{}]/g,''):f};
const hashFlag=(f,loose)=>cyrb53(norm(f,loose)).toString(36);

const H=require('./tools/helpers');
const ids=process.argv.slice(2);
const files=fs.readdirSync(path.join(__dirname,'quests')).filter(f=>f.endsWith('.js')&&!f.endsWith('.widgets.js')).sort();
const built=[];
for(const f of files){
  const q=require('./quests/'+f)(H);
  if(ids.length&&!ids.includes(q.id))continue;
  const seen=new Set();
  const DATA=q.challenges.map(c=>{
    if(seen.has(c.id))throw new Error('duplicate id '+c.id);seen.add(c.id);
    const flags=[].concat(c.flag);
    for(const fl of flags)if(!/^CTF\{.+\}$/.test(fl))throw new Error(c.id+': flag must look like CTF{...}: '+fl);
    if(!q.cats[c.cat])throw new Error(c.id+': unknown category '+c.cat);
    if(!c.hints||c.hints.length<2)throw new Error(c.id+': needs two hints');
    const o={id:c.id,cat:c.cat,title:c.title,pts:c.pts,diff:c.diff,body:c.body,h:flags.map(x=>hashFlag(x,c.loose)),hints:c.hints,widget:c.widget||null};
    if(c.wd)o.wd=c.wd;if(c.loose)o.loose=true;
    if(o.h.length===1)o.h=o.h[0];
    return o;
  });
  const ENC={};q.challenges.forEach(c=>{if(c.widget)ENC[c.id]=Buffer.from([].concat(c.flag)[0]).toString('base64')});
  const CONFIG={id:q.id,name:q.name,cats:q.cats,minutes:q.minutes||90,lab:null};
  const min=q.minutes||90;
  const tabs=[['board','🎯 Challenges']].concat(q.lab?[['lab','💻 '+(q.lab.tab||'Pentest Lab')]]:[],[['tools','🧰 Toolkit'],['brief','📋 Briefing']])
    .map(([k,l],i)=>`<button data-tab="${k}"${i?'':' class="on"'}>${l}</button>`).join('\n    ');
  const labSec=q.lab?`<section id="tab-lab" class="hidden">
    <h2>💻 ${q.lab.tab||'Pentest Lab'}</h2>
    <p class="lead">${q.lab.intro}</p>
    <div class="term">
      <div class="bar2"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:8px">${q.lab.bar||'student@kali'} – simulated</span></div>
      <div id="tout"></div>
      <div class="tin"><span id="tprompt">student@kali:~$</span><input id="tinp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    </div>
  </section>`:'';
  const body=R('engine/body.html')
    .replace(/{{SUBTITLE}}/g,q.subtitle).replace(/{{SHORTNAME}}/g,q.name).replace(/{{WELCOME_LEAD}}/g,q.lead)
    .replace(/{{MINUTES}}/g,String(min)).replace('{{RULES_EXTRA}}',(q.rulesExtra||[]).map(x=>`<li>${x}</li>`).join('\n      '))
    .replace('{{TABS}}',tabs).replace('{{LAB_SECTION}}',labSec)
    .replace('{{PACING}}',q.pacing.map(([a,b])=>`<b>${a}</b><span>${b}</span>`).join('\n        '))
    .replace('{{TIPS}}',(q.tips||[]).map(x=>`<li>${x}</li>`).join('\n        '));
  const qWidgets=q.widgetsFile?R(q.widgetsFile):'';
  const js=['"use strict";',
    'const CONFIG='+JSON.stringify(CONFIG)+';',
    'const DATA='+JSON.stringify(DATA)+';',
    'const ENC='+JSON.stringify(ENC)+';',
    R('engine/core.js'),R('engine/widgets.js'),qWidgets,R('engine/toolkit.js'),q.lab?R('engine/lab.js'):'',
    'boot();'].join('\n');
  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CyberQuest – ${q.name}</title>
<!--
  Nice work – you read the source! That's hacker habit #1.
  Your first flag: ${q.viewSourceFlag}
-->
<style>
:root{--accent:${q.accent||'#39ff88'}}
${R('engine/style.css').replace('--green:#39ff88;','--green:var(--accent);')}
</style>
</head>
<body>
${body}
<script>
${injectLab(js,q)}
</script>
</body>
</html>
`;
  fs.mkdirSync(path.join(__dirname,'docs'),{recursive:true});
  const out=`docs/cyberquest-${q.id}.html`;
  fs.writeFileSync(path.join(__dirname,out),html);
  built.push({id:q.id,name:q.name,subtitle:q.subtitle,icon:q.icon,out,count:DATA.length,pts:DATA.reduce((a,c)=>a+c.pts,0),blurb:q.blurb});
  console.log('built',out,DATA.length+' challenges',DATA.reduce((a,c)=>a+c.pts,0)+' pts',(html.length/1024).toFixed(0)+' KB');
}
fs.writeFileSync(path.join(__dirname,'docs/manifest.json'),JSON.stringify(built,null,1));
if(!ids.length)writeIndex(built);


/* lab data may contain functions (e.g. dynamic pages); serialise them as code */
function serialise(v){
  if(typeof v==='function')return v.toString();
  if(Array.isArray(v))return '['+v.map(serialise).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.entries(v).map(([k,x])=>JSON.stringify(k)+':'+serialise(x)).join(',')+'}';
  return JSON.stringify(v);
}
function injectLab(js,q){
  if(!q.lab)return js;
  return js.replace('const ENC=','CONFIG.lab='+serialise(q.lab.data)+';\nconst ENC=');
}

/* landing page for GitHub Pages (docs/index.html) */
function writeIndex(built){
  const card=(href,icon,name,sub,blurb,meta)=>`<a class="q" href="${href}"><div class="i">${icon}</div><div><h3>${name}</h3><div class="s">${sub}</div><p>${blurb}</p><div class="m">${meta}</div></div></a>`;
  const cards=[card('CyberQuest.html','🎯','CyberQuest','The day-event edition','The original 90-minute challenge: a taste of every category, with a simulated pen-testing lab.','25 challenges &middot; all topics')]
    .concat(built.map(b=>card(path.basename(b.out),b.icon,b.name,b.subtitle,b.blurb,b.count+' challenges &middot; '+b.pts+' points'))).join('\n');
  fs.writeFileSync(path.join(__dirname,'docs/index.html'),`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CyberQuest – cyber challenge collection</title>
<style>
:root{--bg:#0a0e14;--panel:#111823;--line:#243044;--text:#d6e2f0;--dim:#7e8ea6;--green:#39ff88;--cyan:#38d6ff;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.55;background-image:radial-gradient(circle at 15% -10%,#12304a55,transparent 45%),radial-gradient(circle at 100% 0,#2a164a44,transparent 40%)}
.w{max-width:960px;margin:0 auto;padding:0 16px}header{padding:48px 0 12px}
.logo{font-family:var(--mono);font-weight:700;color:var(--green);font-size:30px;letter-spacing:.5px}.logo span{color:var(--dim);font-weight:400}
.lead{color:var(--dim);max-width:62ch}h2{margin:34px 0 12px;font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
a.q{display:flex;gap:14px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;color:inherit;text-decoration:none;transition:.15s}
a.q:hover{border-color:var(--cyan);transform:translateY(-2px)}a.q .i{font-size:30px}a.q h3{margin:0}a.q .s{font-family:var(--mono);font-size:12px;color:var(--cyan);letter-spacing:1px;text-transform:uppercase;margin:2px 0 8px}
a.q p{margin:0 0 8px;font-size:14.5px;color:var(--dim)}a.q .m{font-family:var(--mono);font-size:12px;color:var(--green)}
ul{padding-left:20px;color:var(--dim)}li{margin:6px 0}a{color:var(--cyan)}
.note{border-left:3px solid #ffc247;background:#ffc2470f;padding:10px 14px;border-radius:0 8px 8px 0;font-size:14px;margin:24px 0}
footer{color:var(--dim);font-size:12px;padding:30px 0 50px}
</style></head><body><div class="w">
<header><div class="logo">CYBER<span>QUEST</span></div><p class="lead">Capture-the-flag challenges for GCSE and T-level students. Start with the day-event edition, then dive deeper into any topic at your own pace. Everything runs in your browser: no accounts, no installs.</p></header>
<h2>Choose a quest</h2><div class="grid">
${cards}
</div>
<h2>How it works</h2><ul>
<li>Each challenge hides a flag that looks like <code>CTF{something}</code>. Find it, submit it, bank the points.</li>
<li>Hints are available but cost points. Progress saves in your browser.</li>
<li>Work in a team, talk to each other, and use the Toolkit tab and web search for learning.</li>
</ul>
<div class="note"><b>Rules of engagement:</b> everything here is fictional or simulated. In the real world, only test systems you own or have written permission to test. In the UK, unauthorised access is a crime under the Computer Misuse Act 1990.</div>
<h2>Where next?</h2><ul>
<li><a href="https://tryhackme.com">TryHackMe</a>: guided, browser-based hacking labs with beginner learning paths (some content is free).</li>
<li><a href="https://picoctf.org">picoCTF</a>: free CTF platform and practice gym aimed at students.</li>
<li><a href="https://overthewire.org/wargames/">OverTheWire</a>: free wargames that teach Linux and security skills step by step.</li>
<li><a href="https://www.ncsc.gov.uk/cyberfirst">NCSC CyberFirst</a>: UK government programme with courses and opportunities for young people.</li>
</ul>
<footer>CyberQuest &middot; every system, person and company in the challenges is fictional.</footer></div></body></html>
`);
  console.log('wrote docs/index.html');
}
