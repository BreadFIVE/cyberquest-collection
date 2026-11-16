#!/usr/bin/env node
/* Loads each built quest in headless Chromium, then:
   1. submits every flag via the real UI and checks it is accepted (and a wrong flag is rejected)
   2. checks hint costs, persistence, no console errors
   Extra per-quest checks live in tools/checks/<id>.js */
let ok_report;
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const H=require('./helpers');
const only=process.argv.slice(2);
(async()=>{
  const browser=await chromium.launch();let fail=0;
  const files=fs.readdirSync(path.join(__dirname,'../quests')).filter(f=>f.endsWith('.js')&&!f.endsWith('.widgets.js')).sort();
  for(const f of files){
    const q=require('../quests/'+f)(H);if(only.length&&!only.includes(q.id))continue;
    const page=await browser.newPage();const errs=[];
    page.on('pageerror',e=>errs.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
    await page.goto('file://'+path.resolve(__dirname,'../docs/cyberquest-'+q.id+'.html'));
    await page.fill('#teamname','TestTeam');await page.click('#startbtn');
    const total=q.challenges.reduce((a,c)=>a+c.pts,0);let bad=0;
    for(const c of q.challenges){
      await page.evaluate(id=>openChallenge(id),c.id);
      await page.fill('#flagIn','CTF{definitely_wrong}');await page.click('#flagGo');
      if(!(await page.textContent('#flagMsg')).includes('Not quite')){console.log('  ✗ wrong flag not rejected',c.id);bad++}
      const flags=[].concat(c.flag);
      await page.fill('#flagIn',flags[flags.length-1].toUpperCase());await page.click('#flagGo');
      const msg=await page.textContent('#flagMsg');
      if(!msg.includes('Correct')){console.log('  ✗',c.id,'rejected its own flag:',msg);bad++}
      await page.evaluate(()=>closeModal());
    }
    await page.waitForTimeout(1500);                       // the 'all solved' report popup fires after 1.2s
    ok_report=await page.evaluate(()=>document.querySelector('#mbox').dataset.report==='1'&&!document.querySelector('#modal').classList.contains('hidden'));
    if(!ok_report){console.log('  ✗ expected the mission report to appear after the final flag');bad++}
    await page.evaluate(()=>closeModal());
    const score=await page.textContent('#hScore');
    if(+score!==total){console.log('  ✗ score',score,'expected',total);bad++}
    const chk=path.join(__dirname,'checks',q.id+'.js');
    if(fs.existsSync(chk)){const r=await require(chk)(page,q,H);bad+=r||0}
    if(errs.length){console.log('  ✗ browser errors:\n   '+errs.join('\n   '));bad++}
    console.log((bad?'FAIL':'PASS')+'  '+q.id+'  ('+q.challenges.length+' challenges, '+total+' pts)');fail+=bad;await page.close();
  }
  await browser.close();process.exit(fail?1:0);
})();
