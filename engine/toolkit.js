/* =========== TOOLKIT =========== */
const MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
const MORSE_R=Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
const caesar=(s,k)=>s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+k)%26+26)%26+b)});
const vig=(s,key,dir)=>{key=key.toLowerCase().replace(/[^a-z]/g,'');if(!key)return 'Enter a key (letters only)';let i=0;return s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;const k=(key.charCodeAt(i++%key.length)-97)*dir;return String.fromCharCode(((c.charCodeAt(0)-b+k)%26+26)%26+b)})};
const utf8bytes=s=>[...new TextEncoder().encode(s)];
const fromBytes=b=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(b))}catch(e){return String.fromCharCode(...b)}};
const parseHex=s=>{const h=s.replace(/0x|[\s,:]/gi,'');if(!/^([0-9a-f]{2})+$/i.test(h))throw new Error('Not valid hex');return h.match(/../g).map(x=>parseInt(x,16))};
function md5(str){
  const bytes=new TextEncoder().encode(str);
  const K=new Uint32Array(64),S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296);
  const n=bytes.length,total=((n+8>>6)+1)<<6;
  const buf=new Uint8Array(total);buf.set(bytes);buf[n]=0x80;
  const dv=new DataView(buf.buffer);
  dv.setUint32(total-8,(n*8)>>>0,true);dv.setUint32(total-4,Math.floor(n*8/4294967296),true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(let off=0;off<total;off+=64){
    const M=new Uint32Array(16);for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);
    let A_=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|(~B&D);g=i}
      else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}
      else if(i<48){F=B^C^D;g=(3*i+5)%16}
      else{F=C^(B|~D);g=(7*i)%16}
      F=(F+A_+K[i]+M[g])>>>0;
      A_=D;D=C;C=B;
      B=(B+((F<<S[i])|(F>>>(32-S[i]))))>>>0;
    }
    a0=(a0+A_)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  const out=new DataView(new ArrayBuffer(16));
  out.setUint32(0,a0,true);out.setUint32(4,b0,true);out.setUint32(8,c0,true);out.setUint32(12,d0,true);
  return [...new Uint8Array(out.buffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function sha1(str){
  const b=new TextEncoder().encode(str),l=b.length,t=((l+8>>6)+1)<<6,buf=new Uint8Array(t);buf.set(b);buf[l]=0x80;
  const dv=new DataView(buf.buffer);dv.setUint32(t-4,(l*8)>>>0);dv.setUint32(t-8,Math.floor(l*8/4294967296));
  let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;const w=new Uint32Array(80);
  for(let o=0;o<t;o+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<80;i++){const x=w[i-3]^w[i-8]^w[i-14]^w[i-16];w[i]=(x<<1)|(x>>>31)}
    let a=h0,bb=h1,c=h2,d=h3,e=h4;
    for(let i=0;i<80;i++){
      let f,k;
      if(i<20){f=(bb&c)|(~bb&d);k=0x5A827999}else if(i<40){f=bb^c^d;k=0x6ED9EBA1}else if(i<60){f=(bb&c)|(bb&d)|(c&d);k=0x8F1BBCDC}else{f=bb^c^d;k=0xCA62C1D6}
      const tmp=(((a<<5)|(a>>>27))+f+e+k+w[i])>>>0;e=d;d=c;c=((bb<<30)|(bb>>>2))>>>0;bb=a;a=tmp;
    }
    h0=(h0+a)>>>0;h1=(h1+bb)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;
  }
  return [h0,h1,h2,h3,h4].map(x=>x.toString(16).padStart(8,'0')).join('');
}
const SHA256K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256(str){
  const b=new TextEncoder().encode(str),l=b.length,t=((l+8>>6)+1)<<6,buf=new Uint8Array(t);buf.set(b);buf[l]=0x80;
  const dv=new DataView(buf.buffer);dv.setUint32(t-4,(l*8)>>>0);dv.setUint32(t-8,Math.floor(l*8/4294967296));
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64);
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<t;o+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0}
    let [a,bb,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){
      const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+SHA256K[i]+w[i])>>>0;
      const S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)>>>0;
      h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0;
    }
    [a,bb,c,d,e,f,g,h].forEach((v,i)=>H[i]=(H[i]+v)>>>0);
  }
  return H.map(x=>x.toString(16).padStart(8,'0')).join('');
}
const HASHES={md5,sha1,sha256};
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32enc=s=>{let bits='',o='';for(const b of utf8bytes(s))bits+=b.toString(2).padStart(8,'0');for(let i=0;i<bits.length;i+=5)o+=B32[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];while(o.length%8)o+='=';return o};
const b32dec=s=>{const t=s.toUpperCase().replace(/[^A-Z2-7]/g,'');let bits='';for(const ch of t)bits+=B32.indexOf(ch).toString(2).padStart(5,'0');const out=[];for(let i=0;i+8<=bits.length;i+=8)out.push(parseInt(bits.slice(i,i+8),2));return fromBytes(out)};
const atbash=s=>s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode(b+25-(c.charCodeAt(0)-b))});
function railPattern(n,len){const p=[];let r=0,d=1;for(let i=0;i<len;i++){p.push(r);if(n>1){if(r===0)d=1;else if(r===n-1)d=-1;r+=d}}return p}
function railEnc(s,n){const p=railPattern(n,s.length);return [...Array(s.length).keys()].sort((a,b)=>p[a]-p[b]||a-b).map(i=>s[i]).join('')}
function railDec(s,n){const p=railPattern(n,s.length),order=[...Array(s.length).keys()].sort((a,b)=>p[a]-p[b]||a-b),out=[];order.forEach((pos,i)=>out[pos]=s[i]);return out.join('')}
function freqTable(s){
  const t=s.toUpperCase().replace(/[^A-Z]/g,''),m={};for(const c of t)m[c]=(m[c]||0)+1;
  const rows=Object.entries(m).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  if(!rows.length)return 'No letters found.';
  return 'Letters: '+t.length+'\n'+rows.map(([c,n])=>c+'  '+String(n).padStart(3)+'  '+(n/t.length*100).toFixed(1).padStart(5)+'%  '+'█'.repeat(Math.round(n/rows[0][1]*30))).join('\n')+'\n\nEnglish: E T A O I N S H R are usually the most common.';
}
const bi=s=>{if(!/^\s*-?\d+\s*$/.test(s))throw new Error('Enter whole numbers in a, b and m');return BigInt(s.trim())};
function modpow(a,b,m){let r=1n;a%=m;while(b>0n){if(b&1n)r=r*a%m;a=a*a%m;b>>=1n}return r}
function egcd(a,b){if(b===0n)return[a,1n,0n];const[g,x,y]=egcd(b,a%b);return[g,y,x-(a/b)*y]}
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
function modinv(a,m){const[g,x]=egcd(((a%m)+m)%m,m);if(g!==1n)throw new Error('No inverse: gcd(a,m) = '+g);return((x%m)+m)%m}
function factorise(n){if(n<2n)throw new Error('Enter a number ≥ 2');const f=[];let d=2n;while(d*d<=n&&d<10000000n){while(n%d===0n){f.push(d);n/=d}d+=d===2n?1n:2n}if(n>1n)f.push(n);return f}

const TOOLS=[
  ['Base64 →',s=>fromBytes([...atob(s.trim())].map(c=>c.charCodeAt(0)))],
  ['→ Base64',s=>btoa(String.fromCharCode(...utf8bytes(s)))],
  ['Base32 →',s=>b32dec(s)],
  ['→ Base32',s=>b32enc(s)],
  ['Hex →',s=>fromBytes(parseHex(s))],
  ['→ Hex',s=>utf8bytes(s).map(b=>b.toString(16).padStart(2,'0')).join(' ')],
  ['Binary →',s=>fromBytes(s.replace(/[^01]/g,'').match(/.{8}/g).map(b=>parseInt(b,2)))],
  ['→ Binary',s=>utf8bytes(s).map(b=>b.toString(2).padStart(8,'0')).join(' ')],
  ['Decimal →',s=>fromBytes(s.trim().split(/[\s,]+/).map(Number))],
  ['→ Decimal',s=>utf8bytes(s).join(' ')],
  ['Morse →',s=>s.trim().split(/\s*\/\s*|\s{3,}/).map(w=>w.split(/\s+/).map(x=>MORSE_R[x]||'?').join('')).join(' ')],
  ['→ Morse',s=>s.toUpperCase().split(' ').map(w=>[...w].map(c=>MORSE[c]||'').filter(Boolean).join(' ')).join(' / ')],
  ['ROT13',s=>caesar(s,13)],
  ['Atbash',s=>atbash(s)],
  ['URL decode',s=>decodeURIComponent(s)],
  ['→ URL encode',s=>encodeURIComponent(s)],
  ['Reverse',s=>[...s].reverse().join('')],
  ['Letter frequency',s=>freqTable(s)],
  ['MD5',s=>md5(s.replace(/[\r\n]+$/,''))],
  ['SHA-1',s=>sha1(s.replace(/[\r\n]+$/,''))],
  ['SHA-256',s=>sha256(s.replace(/[\r\n]+$/,''))]
];
function initTools(){
  if(initTools.done)return;initTools.done=true;
  const out=v=>{$('#tkOut').value=v};
  const safe=f=>{try{out(f())}catch(e){out('⚠ '+(e.message||'Could not process that input'))}};
  const row=$('#tkBtns');
  TOOLS.forEach(([n,f])=>{const b=document.createElement('button');b.className='btn sec sm';b.textContent=n;b.onclick=()=>safe(()=>f($('#tkIn').value));row.appendChild(b)});
  $('#tkSwap').onclick=()=>{$('#tkIn').value=$('#tkOut').value;out('')};
  $('#cGo').onclick=()=>safe(()=>caesar($('#tkIn').value,+$('#cShift').value||0));
  $('#cBrute').onclick=()=>safe(()=>{const s=$('#tkIn').value;let r='';for(let k=1;k<=25;k++)r+='shift '+String(k).padStart(2)+': '+caesar(s,k)+'\n';return r});
  $('#vEnc').onclick=()=>safe(()=>vig($('#tkIn').value,$('#vKey').value,1));
  $('#vDec').onclick=()=>safe(()=>vig($('#tkIn').value,$('#vKey').value,-1));
  const rails=()=>{const n=+$('#rRails').value;if(!(n>=2&&n<=10))throw new Error('Rails must be 2–10');return n};
  $('#rEnc').onclick=()=>safe(()=>railEnc($('#tkIn').value.replace(/\s+$/,''),rails()));
  $('#rDec').onclick=()=>safe(()=>railDec($('#tkIn').value.replace(/\s+$/,''),rails()));
  $('#xGo').onclick=()=>safe(()=>{const k=parseInt($('#xKey').value,16);if(isNaN(k))throw new Error('Enter a key like 2a');return fromBytes(parseHex($('#tkIn').value).map(b=>b^k))});
  $('#xBrute').onclick=()=>safe(()=>{const b=parseHex($('#tkIn').value);let r='';for(let k=0;k<256;k++){const t=b.map(x=>x^k);const s=String.fromCharCode(...t);if(/^[\x20-\x7e\n]+$/.test(s))r+='key '+k.toString(16).padStart(2,'0')+': '+s+'\n'}return r||'No fully printable results.'});
  $('#hOne').onclick=()=>safe(()=>HASHES[$('#hAlg').value]($('#tkIn').value.replace(/[\r\n]+$/,'')));
  $('#hGo').onclick=()=>safe(()=>{
    const alg=$('#hAlg').value,len={md5:32,sha1:40,sha256:64}[alg];
    const t=$('#hTarget').value.trim().toLowerCase();if(!new RegExp('^[0-9a-f]{'+len+'}$').test(t))throw new Error('For '+alg.toUpperCase()+' the target must be '+len+' hex characters');
    const salt=$('#hSalt').value,pre=$('#hSaltPos').value==='pre',H=HASHES[alg];
    const words=$('#tkIn').value.split(/\r?\n/).map(w=>w.trim()).filter(Boolean);
    const hit=words.find(w=>H(pre?salt+w:w+salt)===t);
    return hit?'🎯 MATCH: '+hit:'No match in '+words.length+' words.';
  });
  $('#nPow').onclick=()=>safe(()=>{const m=bi($('#nM').value);if(m<=0n)throw new Error('m must be positive');return String(modpow(bi($('#nA').value),bi($('#nB').value),m))});
  $('#nInv').onclick=()=>safe(()=>String(modinv(bi($('#nA').value),bi($('#nM').value))));
  $('#nGcd').onclick=()=>safe(()=>String(gcd(bi($('#nA').value),bi($('#nB').value))));
  $('#nFac').onclick=()=>safe(()=>{const a=bi($('#nA').value);return a+' = '+factorise(a).join(' × ')});
}
