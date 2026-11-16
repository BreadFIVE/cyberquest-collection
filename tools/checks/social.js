const S=require('./_shared');
module.exports=async(page,q,H)=>{
  let bad=0;const ok=(n,c)=>{if(!c){console.log('  ✗ route:',n);bad++}};
  for(const c of q.challenges.filter(c=>c.widget==='classify')){const e=await S.classify(page,c);ok(c.id+' classify'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='order')){const e=await S.order(page,c);ok(c.id+' order'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='phish')){const e=await S.phish(page,c);ok(c.id+' phish'+(e?' → '+e:''),!e)}
  for(const c of q.challenges.filter(c=>c.widget==='branch')){const e=await S.branch(page,c);ok(c.id+' branch'+(e?' → '+e:''),!e)}
  // content sanity: the phishing sets must contain both kinds, or the puzzle is trivial
  for(const id of ['se_phish','se_smish']){const m=q.challenges.find(c=>c.id===id).wd.mails.map(x=>x.a);ok(id+' has both phishing and legit items',m.includes('P')&&m.includes('L'))}
  await page.evaluate(()=>closeModal());
  return bad;
};
