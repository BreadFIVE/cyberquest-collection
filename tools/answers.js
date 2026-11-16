#!/usr/bin/env node
/* Generates a facilitator answer key from the quest source files (quests/*.js), so it can never drift out of date.
   Output: answers/ANSWER-KEY.html (print it, or "Save as PDF") and answers/ANSWER-KEY.md
   The answers/ folder is deliberately NOT published (it is in .gitignore and not part of docs/). */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');const H=require('./helpers');
const ENT={amp:'&',lt:'<',gt:'>',quot:'"',nbsp:' ',ndash:'–',mdash:'—',rarr:'→',larr:'←',ldquo:'“',rdquo:'”',lsquo:'‘',rsquo:'’',phi:'φ',times:'×',minus:'−',deg:'°',prime:'′',Prime:'″',hellip:'…',egrave:'è',eacute:'é'};
const text=s=>String(s).replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n)).replace(/&([a-zA-Z]+);/g,(m,n)=>ENT[n]??m).replace(/\s+/g,' ').trim();
const he=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const sets=[];
/* the original day-event file only stores hashed answers, so its answers come from answers/original-answers.json */
const orig=JSON.parse(fs.readFileSync(path.join(root,'answers/original-answers.json'),'utf8'));
const origDATA=JSON.parse(fs.readFileSync(path.join(root,'docs/CyberQuest.html'),'utf8').split('\n').find(l=>l.startsWith('const DATA=')).replace(/^const DATA=/,'').replace(/;$/,''));
const origNotes={
  c1:'The ciphertext was made with a shift of 3, so decode with a shift of 23 (use Try all 25). NOTE: the in-game hint 2 says "19 or 7", which is wrong.',
  c7:'Decode with the mapping in hint 2. The plaintext starts "the cipher hides in plain sight…". The accepted flag is the FIVE words after "the". NOTE: the challenge text says "six words", which does not match.',
  c2:'Key is "bletchleypark". Accepted flag is CTF{POLYALPHABETIC_CRACKED} (not case-sensitive).',
  c4:'Single-byte XOR with key 0x6b. Brute-force and look for CTF.',
  c5:'Paste the wordlist, target hash 212276a8…, Crack: the match is "sk8boarding".',
  f2:'Accepted: compromise, takeover, breach, compromised, hijacking, ato (account takeover).',
  o1:'Accepted: eiffeltower or eiffel_tower.',o4:'Accepted: sockpuppets or sockpuppet.',
};
const catName={intro:'Warm-Up',crypto:'Cryptography',osint:'OSINT',pentest:'Pen Testing',forensics:'Forensics & Network',web:'Web Security',social:'Social Engineering'};
sets.push({name:'CyberQuest (original day event)',file:'CyberQuest.html',rows:origDATA.map((c,i)=>{
  const a=orig.find(x=>x.id===c.id);
  const extra={f2:['CTF{compromise}','CTF{takeover}','CTF{breach}','CTF{compromised}','CTF{hijacking}','CTF{ato}'],o1:['CTF{eiffeltower}','CTF{eiffel_tower}'],o4:['CTF{sockpuppets}','CTF{sockpuppet}'],intro2:['CTF{radio_days_are_not_over}','CTF{radio days are not over}']}[c.id];
  return {n:i+1,cat:catName[c.cat]||c.cat,title:c.title,pts:c.pts,flags:extra||[a.flag],note:origNotes[c.id]||text(c.hints[c.hints.length-1]),loose:false}})});

for(const f of fs.readdirSync(path.join(root,'quests')).filter(f=>f.endsWith('.js')&&!f.endsWith('.widgets.js')).sort()){
  const q=require('../quests/'+f)(H);
  sets.push({name:q.name+' ('+q.subtitle+')',file:'cyberquest-'+q.id+'.html',rows:q.challenges.map((c,i)=>({n:i+1,cat:q.cats[c.cat].name,title:text(c.title),pts:c.pts,flags:[].concat(c.flag),note:text(c.hints[c.hints.length-1]),loose:!!c.loose}))});
}
const total=sets.reduce((a,s)=>a+s.rows.length,0);
const date=new Date().toISOString().slice(0,10);

let md=`# CyberQuest answer key\n\nFacilitator copy. **Do not publish.** Generated ${date}. ${sets.length} quests, ${total} challenges.\n\nFlags are not case-sensitive. Where marked *loose*, spacing and punctuation inside the braces are ignored too. Where several answers are listed, any one is accepted.\n`;
let html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>CyberQuest answer key</title><style>
body{font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111;margin:24px auto;max-width:1000px;padding:0 16px}
h1{margin:0 0 4px}h2{margin:28px 0 6px;padding-top:8px;border-top:2px solid #111;break-after:avoid}.meta{color:#555;margin:0 0 10px}
table{border-collapse:collapse;width:100%;margin:6px 0 4px;break-inside:auto}tr{break-inside:avoid}
th,td{border:1px solid #bbb;padding:5px 7px;vertical-align:top;text-align:left}th{background:#eee}
td.n{width:26px;text-align:right;color:#666}td.p{width:42px;text-align:right}td.a{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;word-break:break-all;width:30%}
.note{color:#333}.warn{background:#fff3cd}.loose{color:#666;font:11px system-ui}.cat{color:#666;font-size:11px;display:block}
.top{border:1px solid #c00;background:#fff0f0;padding:8px 12px;margin:10px 0 0;border-radius:6px}
@media print{body{margin:0;max-width:none}h2{break-before:page}h2:first-of-type{break-before:auto}}
</style></head><body><h1>CyberQuest answer key</h1><p class="meta">Facilitator copy. Generated ${date}. ${sets.length} quests, ${total} challenges.</p>
<div class="top"><b>Do not publish or hand out.</b> Flags are not case-sensitive. <i>loose</i> = spacing and punctuation inside the braces are ignored too. Where several answers are listed, any one is accepted.</div>`;
for(const s of sets){
  const pts=s.rows.reduce((a,r)=>a+r.pts,0);
  md+=`\n## ${s.name}\n\n\`${s.file}\` · ${s.rows.length} challenges · ${pts} points\n\n| # | Challenge | Pts | Answer | How to solve |\n|---|---|---|---|---|\n`;
  html+=`<h2>${he(s.name)}</h2><p class="meta"><code>${s.file}</code> · ${s.rows.length} challenges · ${pts} points</p><table><tr><th>#</th><th>Challenge</th><th>Pts</th><th>Answer</th><th>How to solve</th></tr>`;
  for(const r of s.rows){
    const warn=/NOTE:/.test(r.note);
    md+=`| ${r.n} | ${r.title} (${r.cat}) | ${r.pts} | ${r.flags.map(f=>'`'+f+'`').join(' or ')}${r.loose?' *(loose)*':''} | ${r.note.replace(/\|/g,'\\|')} |\n`;
    html+=`<tr${warn?' class="warn"':''}><td class="n">${r.n}</td><td><b>${he(r.title)}</b><span class="cat">${he(r.cat)}</span></td><td class="p">${r.pts}</td><td class="a">${r.flags.map(he).join('<br>or ')}${r.loose?'<br><span class="loose">(loose)</span>':''}</td><td class="note">${he(r.note)}</td></tr>`;
  }
  html+='</table>';
}
html+='</body></html>';
fs.writeFileSync(path.join(root,'answers/ANSWER-KEY.md'),md);fs.writeFileSync(path.join(root,'answers/ANSWER-KEY.html'),html);
console.log('wrote answers/ANSWER-KEY.html and .md:',sets.length,'quests,',total,'challenges');
