/* Generic solvers for the built-in widgets, used by the per-quest checks. */
const S={};
S.open=async(page,id)=>{await page.evaluate(i=>{closeModal();openChallenge(i)},id)};
S.classify=async(page,c,{wrongFirst=true}={})=>{
  await S.open(page,c.id);
  if(wrongFirst){const sel=await page.$$('#widget select');for(const s of sel)await s.selectOption('0');await page.click('#clGo');
    const allZero=c.wd.items.every(i=>i.a===0);const t=await page.textContent('#clR');if(!allZero&&!t.includes('correct')){return c.id+': wrong answers not rejected'}}
  const sel=await page.$$('#widget select');for(let i=0;i<sel.length;i++)await sel[i].selectOption(String(c.wd.items[i].a));await page.click('#clGo');
  const t=await page.textContent('#clR');return t.includes([].concat(c.flag)[0])?null:c.id+': flag not shown after correct answers';
};
S.order=async(page,c)=>{
  await S.open(page,c.id);const want=c.wd.items;
  await page.click('#ordGo');if(!(await page.textContent('#ordR')).includes('right place'))return c.id+': initial order was already correct';
  for(let pass=0;pass<40;pass++){
    const cur=await page.$$eval('#ordL li span',els=>els.map(e=>e.innerHTML));
    const rank=cur.map(t=>want.findIndex(w=>w===t));if(rank.includes(-1))return c.id+': could not match list text';
    const i=rank.findIndex((r,k)=>k<rank.length-1&&r>rank[k+1]);if(i<0)break;
    const b=await page.$$('#ordL li:nth-child('+(i+1)+') button');await b[1].click();
  }
  await page.click('#ordGo');return (await page.textContent('#ordR')).includes([].concat(c.flag)[0])?null:c.id+': flag not shown when sorted';
};
S.phish=async(page,c)=>{
  await S.open(page,c.id);const mails=c.wd.mails;
  await page.click('#phGo');if(!(await page.textContent('#phR')).includes('Answer all'))return c.id+': allowed submit with nothing chosen';
  for(let i=0;i<mails.length;i++)await page.click(`.btns button[data-i="${i}"][data-v="${mails[i].a==='P'?'L':'P'}"]`);
  await page.click('#phGo');if((await page.textContent('#phR')).includes('Flag:'))return c.id+': flag shown for wrong verdicts';
  for(let i=0;i<mails.length;i++)await page.click(`.btns button[data-i="${i}"][data-v="${mails[i].a}"]`);
  await page.click('#phGo');return (await page.textContent('#phR')).includes([].concat(c.flag)[0])?null:c.id+': flag not shown for right verdicts';
};
/* walks the scenario graph: finds a winning path, proves it works, and proves every losing ending says so */
S.branch=async(page,c)=>{
  const w=c.wd,nodes=w.nodes;
  const path=[];const find=(id,seen=[])=>{const n=nodes[id];if(n.end)return n.end==='win'?[]:null;if(seen.includes(id))return null;
    for(let i=0;i<n.choices.length;i++){const r=find(n.choices[i].to,[...seen,id]);if(r)return [i,...r]}return null};
  const win=find(w.start);if(!win)return c.id+': scenario has no winning path';
  await S.open(page,c.id);
  for(const i of win)await page.click(`#widget button[data-i="${i}"]`);
  const t=await page.textContent('#widget');if(!t.includes([].concat(c.flag)[0]))return c.id+': flag not shown on winning ending';
  // each losing ending
  const losses=Object.entries(nodes).filter(([k,n])=>n.end==='lose').map(([k])=>k);
  for(const L of losses){
    // find a path to L
    const pathTo=(id,seen=[])=>{if(id===L)return [];const n=nodes[id];if(n.end||seen.includes(id))return null;for(let i=0;i<n.choices.length;i++){const r=pathTo(n.choices[i].to,[...seen,id]);if(r)return [i,...r]}return null};
    const p=pathTo(w.start);if(!p)return c.id+': losing ending '+L+' unreachable';
    await page.click('#brR');for(const i of p)await page.click(`#widget button[data-i="${i}"]`);
    const lt=await page.textContent('#widget');if(lt.includes('Flag:')||!lt.includes('attack succeeded'))return c.id+': losing ending '+L+' wrong';
  }
  return null;
};
module.exports=S;
