/* build-time helpers so quest authors never hand-compute ciphertext */
const crypto=require('crypto');
const H={};
H.caesar=(s,k)=>s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+k)%26+26)%26+b)});
H.atbash=s=>s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode(b+25-(c.charCodeAt(0)-b))});
H.vig=(s,key,dir=1)=>{key=key.toLowerCase();let i=0;return s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;const k=(key.charCodeAt(i++%key.length)-97)*dir;return String.fromCharCode(((c.charCodeAt(0)-b+k)%26+26)%26+b)})};
H.rot13=s=>H.caesar(s,13);
H.b64=s=>Buffer.from(s).toString('base64');
H.unb64=s=>Buffer.from(s,'base64').toString();
H.b32=s=>{const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='',o='';for(const b of Buffer.from(s))bits+=b.toString(2).padStart(8,'0');for(let i=0;i<bits.length;i+=5)o+=A[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];while(o.length%8)o+='=';return o};
H.hex=(s,sep=' ')=>[...Buffer.from(s)].map(b=>b.toString(16).padStart(2,'0')).join(sep);
H.bin=s=>[...Buffer.from(s)].map(b=>b.toString(2).padStart(8,'0')).join(' ');
H.xorHex=(s,k)=>[...Buffer.from(s)].map(b=>(b^k).toString(16).padStart(2,'0')).join(' ');
H.md5=s=>crypto.createHash('md5').update(s).digest('hex');
H.sha1=s=>crypto.createHash('sha1').update(s).digest('hex');
H.sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','{':'{','}':'}','_':'..--.-'};
H.morse=s=>s.toUpperCase().split(' ').map(w=>[...w].map(c=>MORSE[c]||c).join(' ')).join(' / ');
H.railEnc=(s,n)=>{const p=[];let r=0,d=1;for(let i=0;i<s.length;i++){p.push(r);if(r===0)d=1;else if(r===n-1)d=-1;r+=d}return [...Array(s.length).keys()].sort((a,b)=>p[a]-p[b]||a-b).map(i=>s[i]).join('')};
H.modpow=(a,b,m)=>{a=BigInt(a);b=BigInt(b);m=BigInt(m);let r=1n;a%=m;while(b>0n){if(b&1n)r=r*a%m;a=a*a%m;b>>=1n}return r};
H.egcd=(a,b)=>b===0n?[a,1n,0n]:(([g,x,y])=>[g,y,x-(a/b)*y])(H.egcd(b,a%b));
H.modinv=(a,m)=>{a=BigInt(a);m=BigInt(m);const[g,x]=H.egcd(((a%m)+m)%m,m);if(g!==1n)throw new Error('no inverse');return((x%m)+m)%m};
/* substitution cipher from a 26-letter key (plain a..z -> key) */
H.subst=(s,key)=>s.replace(/[a-z]/gi,c=>{const up=c<='Z';const o=key[c.toLowerCase().charCodeAt(0)-97];return up?o.toUpperCase():o});
H.esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
module.exports=H;
