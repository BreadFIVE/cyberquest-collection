module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  const C=Object.fromEntries(q.challenges.map(c=>[c.id,c]));const flag=id=>[].concat(C[id].flag)[0];
  const open=async id=>{await page.evaluate(i=>{closeModal();openChallenge(i)},id)};
  // classify widgets
  for(const id of ['os_scope','os_risky']){
    await open(id);let sel=await page.$$('#widget select');for(const s of sel)await s.selectOption('0');await page.click('#clGo');
    const wrongOnly=C[id].wd.items.every(i=>i.a===0);
    ok(id+' rejects all-first-option',wrongOnly||(await page.textContent('#clR')).includes('correct'));
    sel=await page.$$('#widget select');for(let i=0;i<sel.length;i++)await sel[i].selectOption(String(C[id].wd.items[i].a));await page.click('#clGo');
    ok(id+' reveals flag',(await page.textContent('#clR')).includes(flag(id)));
  }
  // username search
  await open('os_users');await page.fill('#usQ','someone_else');await page.click('#usGo');
  ok('usersearch: wrong name finds nothing',(await page.textContent('#usR')).includes('No profiles'));
  await page.fill('#usQ','@Bluefin_Kate');await page.click('#usGo');
  const prof=await page.textContent('#usR');ok('usersearch: shows 4 profiles incl. pet + street',prof.includes('Found 4')&&prof.includes('Biscuit')&&prof.includes('Alder Road'));
  // grid map
  await open('os_grid');await page.click('.gmap button[data-id="E5"]');await page.click('#gmGo');
  ok('grid: wrong square rejected',(await page.textContent('#gmR')).includes('does not fit'));
  await page.click('.gmap button[data-id="D5"]');await page.click('#gmGo');
  ok('grid: D5 reveals flag',(await page.textContent('#gmR')).includes(flag('os_grid')));
  // dork: plain search must NOT surface the target on page 1; operator search must
  await open('os_dork');await page.fill('#dkQ','halcyon college password');await page.click('#dkGo');
  let r=await page.textContent('#dkR');ok('dork: plain query buries target',!r.includes('Shared accounts')&&r.includes('top 6'));
  await page.fill('#dkQ','site:halcyon-college.example filetype:xlsx password');await page.click('#dkGo');
  r=await page.textContent('#dkR');ok('dork: operator query finds target only',r.includes('Shared accounts')&&!r.includes('Timetable'));
  await page.click('#dkR .serp a');
  ok('dork: opening result reveals flag',(await page.textContent('#dkV')).includes(flag('os_dork')));
  await page.fill('#dkQ','halcyon "cyber week" -handbook');await page.click('#dkGo');
  ok('dork: quoted phrase + exclusion work',(await page.textContent('#dkR')).includes('Cyber Week')&&!(await page.textContent('#dkR')).includes('handbook'));
  await page.evaluate(()=>closeModal());
  return bad;
};
