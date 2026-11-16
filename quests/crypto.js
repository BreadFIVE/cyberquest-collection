/* CyberQuest: Cipher Vault – cryptography.  All ciphertext is computed at build time by tools/helpers.js */
module.exports=H=>{
  const cipher=t=>`<p class="cipher">${H.esc(t)}</p>`;
  const wl=(...w)=>`<pre class="code">${w.join('\n')}</pre>`;

  /* --- values computed once so the puzzle and its answer can never disagree --- */
  const F={caesar:'CTF{julius_was_here}',atbash:'CTF{mirror_mirror}',vig:'CTF{polyalphabetic_power}',rail:'CTF{zigzag_across_the_rails}',
    b64:'CTF{base64_is_not_encryption}',bin:'CTF{eight_bits_make_a_byte}',layers:'CTF{peel_the_layers_back}',xor:'CTF{xor_is_its_own_inverse}'};
  const substKey='zebrascdfghijklmnopqtuvwxy';
  const freqPlain='frequency analysis defeats simple substitution because english letters are never evenly spread so look at the most common letter first and keep going until you have decoded every single letter';
  const layers=H.b64(H.hex(H.rot13(F.layers),''));
  const rsa={p:89n,q:97n,e:5n,m:3141n};rsa.n=rsa.p*rsa.q;rsa.c=H.modpow(rsa.m,rsa.e,rsa.n);
  const dh={p:7919n,g:7n,a:2503n,b:1777n};dh.A=H.modpow(dh.g,dh.a,dh.p);dh.B=H.modpow(dh.g,dh.b,dh.p);dh.s=H.modpow(dh.B,dh.a,dh.p);
  const crackPw='lighthouse7';
  const saltPw='blueberry42',salt='x9Q2';
  const words1=['sunshine1','dragonfire','letmein99','iloveyou2','summer2026','Passw0rd!','qwertyuiop','lighthouse7','monkeybiz','flagfinder','sk8boarding','welcome123'];
  const words2=['cinnamon!','raspberry1','blackberry9','blueberry42','strawberry7','gooseberry3','cranberry88','elderberry5','mulberry21','huckleberry0'];

  return {
    id:'crypto',name:'Cipher Vault',subtitle:'Cryptography edition',icon:'🔐',accent:'#b58bff',minutes:90,
    viewSourceFlag:'CTF{crypto_starts_with_curiosity}',
    blurb:'Classical ciphers, encodings, hashing, passwords and the maths behind RSA.',
    lead:'A 90-minute deep dive into cryptography: break old-school ciphers, peel apart encodings, crack leaked password hashes and do some real public-key maths.',
    rulesExtra:['The <b>Toolkit</b> tab has everything you need: Caesar, Vigen&egrave;re, rail fence, XOR, Base32/64, hashes, a hash cracker and a number-theory helper. Web search is fair game for learning how a cipher works.'],
    pacing:[['0–10 min','Warm-up. View source, then the quick wins: Morse, Caesar, binary, Base64.'],['10–40 min','Work through the classical ciphers and encodings. Use the Toolkit buttons before reaching for hints.'],['40–75 min','Hashing and password cracking, then RSA and Diffie&ndash;Hellman. The maths is easier than it looks.'],['75–90 min','Cash in hints on anything left, and double-check spellings.']],
    tips:['Cipher text keeps the <code>{ }</code> and <code>_</code> of the flag, so you can use <code>CTF</code> as a crib to check you are on the right track.','Answers that are words or numbers (e.g. <code>CTF{sha256}</code>) are lowercase.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      classical:{name:'Classical Ciphers',icon:'🏛️',blurb:'Pen-and-paper crypto'},
      encoding:{name:'Encodings & Bits',icon:'🔣',blurb:'Not encryption, but often mistaken for it'},
      hashing:{name:'Hashing & Passwords',icon:'#️⃣',blurb:'One-way functions'},
      modern:{name:'Modern Crypto',icon:'🔑',blurb:'The maths that protects the internet'}
    },
    challenges:[
      {id:'cr_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{crypto_starts_with_curiosity}',
       body:`<p>Every good hacker starts the same way: looking at what's already in front of them.</p><p>Right-click this page and choose <b>"View Page Source"</b> / <b>"Inspect"</b>, or press <code>Ctrl+U</code>. Somewhere near the top of the HTML is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'cr_morse',cat:'intro',title:'Morse Beacon',pts:50,diff:1,flag:'CTF{dots_and_dashes}',
       body:`<p>An old radio beacon keeps repeating this signal. Decode it with the Toolkit's <b>Morse &rarr;</b> button.</p>${cipher(H.morse('dots and dashes'))}<p>Letters are separated by spaces and words by a slash. Put the decoded words inside <code>CTF{ }</code> joined with underscores.</p>`,
       hints:['Paste the whole line into Toolkit &rarr; Input and press <b>Morse &rarr;</b>.','You should get three words. The flag is <code>CTF{word_word_word}</code> in lowercase.']},

      {id:'cr_caesar',cat:'classical',title:"Caesar's Diary",pts:75,diff:1,flag:F.caesar,
       body:`<p>Julius left a note encrypted with his favourite cipher: every letter shifted along the alphabet by the same amount.</p>${cipher(H.caesar(F.caesar,11))}<p>Nobody told you the shift. There are only 25 possibilities, so use the Toolkit's <b>Try all 25</b> and look for the line that reads as English.</p>`,
       hints:['The flag always starts with <code>CTF</code>. Look for the shift where the first word becomes exactly that.','It was encrypted with a shift of 11, so decode with a shift of 15 (26 &minus; 11).']},
      {id:'cr_atbash',cat:'classical',title:'Mirror, Mirror',pts:100,diff:1,flag:F.atbash,
       body:`<p>Atbash is an ancient cipher with <b>no key at all</b>: the alphabet is simply reversed, so A becomes Z, B becomes Y, and so on.</p>${cipher(H.atbash(F.atbash))}<p>Because it has no key, anyone who knows the method can read it. That is a big lesson in itself: <i>security should not depend on keeping the method secret.</i></p>`,
       hints:['Try the Toolkit&rsquo;s <b>Atbash</b> button.','Atbash is its own inverse: running it twice gets you back where you started.']},
      {id:'cr_vig',cat:'classical',title:"Vigen&egrave;re's Vault",pts:125,diff:2,flag:F.vig,
       body:`<p>A polyalphabetic cipher: a repeating keyword decides how far each letter is shifted, so the same plaintext letter can encrypt to different letters. For centuries people called it <i>le chiffre ind&eacute;chiffrable</i> &ndash; "the unbreakable cipher".</p>${cipher(H.vig(F.vig,'turing'))}<p>The key is the surname of the mathematician who led the effort to break Enigma at Bletchley Park (lowercase, no spaces).</p>`,
       hints:['The key is a famous British mathematician and codebreaker, born 1912. Surname only.','Toolkit &rarr; Vigen&egrave;re key: <code>turing</code> &rarr; paste the ciphertext in Input &rarr; <b>Decrypt</b>.']},
      {id:'cr_rail',cat:'classical',title:'Zig-Zag',pts:150,diff:2,flag:F.rail,
       body:`<p>A <b>transposition</b> cipher: the letters are not changed, only <i>moved</i>. The text is written in a zig-zag across 3 "rails" and read off row by row (top rail first, then the middle, then the bottom):</p>${cipher(H.railEnc(F.rail,3))}<p>The whole flag, including the braces and underscores, was scrambled. The Toolkit has a <b>Rail fence</b> decrypt button.</p>`,
       hints:['Set <b>Rail fence rails</b> to 3, paste the ciphertext in Input and press <b>Decrypt</b>.','If the output looks wrong, you probably have the wrong number of rails. This one uses exactly 3.']},
      {id:'cr_freq',cat:'classical',title:'Frequency Analysis',pts:150,diff:2,flag:'CTF{every_single_letter}',loose:true,
       body:`<p>A <b>substitution</b> cipher replaces every letter with a different letter (always the same one). There are 26! possible keys, far too many to brute-force, but English gives itself away: <b>E</b>, <b>T</b>, <b>A</b>, <b>O</b> are the most common letters and single-letter words are almost always <b>A</b> or <b>I</b>.</p>${cipher(H.subst(freqPlain,substKey).toUpperCase())}<p>Use the Toolkit's <b>Letter frequency</b> button to count letters, then work out the mapping. The flag is the <b>last three words</b> of the plaintext, joined with underscores: <code>CTF{word_word_word}</code>.</p>`,
       hints:['Count the letters first. The most common ciphertext letter is probably E. Then look for short words: "THE" is very common.','The plaintext starts "frequency analysis defeats&hellip;". Once you have a few letters, the rest falls into place.']},

      {id:'cr_b64',cat:'encoding',title:'Base Jumping',pts:100,diff:1,flag:F.b64,
       body:`<p>You intercept this string from a chat log. It has been <b>encoded</b>, not encrypted. There is no key, so anyone can reverse it.</p>${cipher(H.b64(F.b64))}`,
       hints:['That alphabet (A&ndash;Z, a&ndash;z, 0&ndash;9, +, /, with = padding at the end) is the signature of one very common encoding.','Toolkit &rarr; paste into Input &rarr; <b>Base64 &rarr;</b>.']},
      {id:'cr_bin',cat:'encoding',title:'Binary Bytes',pts:75,diff:1,flag:F.bin,
       body:`<p>Computers store every letter as a number, and every number as binary. Each group of 8 bits (a byte) below is one ASCII character.</p>${cipher(H.bin(F.bin))}`,
       hints:['Eight bits per character. Try the Toolkit&rsquo;s <b>Binary &rarr;</b> button.','Or by hand: 01000011 = 64 + 2 + 1 = 67 = the letter C.']},
      {id:'cr_layers',cat:'encoding',title:'Onion Layers',pts:150,diff:2,flag:F.layers,
       body:`<p>Attackers often stack several encodings to dodge simple filters. Peel this one back, one layer at a time. Each layer is a method you already know.</p>${cipher(layers)}<p>Work out what each result looks like, and that tells you what to try next.</p>`,
       hints:['Layer 1 ends in <code>=</code> padding and uses letters, digits, + and /. That is Base64.','After Base64 you get a long string of hex digits. Decode that with <b>Hex &rarr;</b>, and the result is still scrambled with a very old trick, rotation by 13 places.']},
      {id:'cr_xor',cat:'encoding',title:'XOR Marks the Spot',pts:150,diff:2,flag:F.xor,
       body:`<p>A malware sample's config string was "encrypted" with a single-byte XOR key, a favourite trick in real malware to dodge simple scanners.</p>${cipher(H.xorHex(F.xor,0x5a))}<p>You do not know the key. Paste the hex into the Toolkit and click <b>Brute-force all 256</b>, then scan the output for readable English.</p>`,
       hints:['The key is one byte (00 to ff), so there are only 256 options. The brute-force button shows every fully-printable result.','The key is <code>5a</code>. Look for the line that starts with CTF.']},

      {id:'cr_type',cat:'hashing',title:'Name That Hash',pts:75,diff:1,flag:'CTF{sha256}',
       body:`<p>Hashes turn any input into a fixed-length fingerprint. Different algorithms produce different lengths, so a hash's length is a clue to which one made it. Here are three hashes of the same word:</p>${cipher('A: '+H.md5('password'))}${cipher('B: '+H.sha1('password'))}${cipher('C: '+H.sha256('password'))}<p>Which <b>algorithm</b> produced the longest one? The flag is <code>CTF{name}</code> in lowercase with no hyphen (e.g. <code>CTF{md5}</code>).</p>`,
       hints:['Count the hex characters. MD5 = 32, SHA-1 = 40, and one of the three is longer than both.','64 hex characters = 256 bits. That is the SHA-256 family.']},
      {id:'cr_crack',cat:'hashing',title:'The Leaked Hash',pts:175,diff:2,flag:`CTF{${crackPw}}`,
       body:`<p>A breached database (fictional, obviously) exposed this MD5 password hash for the user <b>j.reyes</b>:</p>${cipher(H.md5(crackPw))}<p>You also recovered a fragment of the site's old password list. Paste this list into the Toolkit's Input box, put the hash into <b>target hash</b> (algorithm MD5), and press <b>Crack</b>.</p>${wl(...words1)}<p>The flag is <code>CTF{the_word_you_found}</code>.</p>`,
       hints:['MD5 is fast and has no salt here. That is exactly why real systems use slow, salted hashing like bcrypt instead.','The matching word is in the second half of the list and ends in a number.']},
      {id:'cr_salt',cat:'hashing',title:'Salt It',pts:200,diff:3,flag:`CTF{${saltPw}}`,
       body:`<p>A better system adds a random <b>salt</b> before hashing, so two users with the same password get different hashes and precomputed tables stop working. But the attacker also stole the salts.</p><p>The hash is <b>SHA-256</b> of <code>salt + password</code>, with salt <code>${salt}</code>:</p>${cipher(H.sha256(salt+saltPw))}<p>Here is the attacker's wordlist (a fruit-themed password policy):</p>${wl(...words2)}<p>In the Toolkit's hash cracker choose <b>SHA-256</b>, type the salt, and set it to <b>salt + word</b>. Flag: <code>CTF{the_password}</code>.</p>`,
       hints:['Algorithm: SHA-256. Salt: <code>x9Q2</code>. Position: salt + word. Paste the wordlist into Input first.','Salting does not stop a targeted guess at one account. It stops mass cracking with rainbow tables. A slow hash (bcrypt, Argon2) is what slows down the guessing.']},

      {id:'cr_rsa',cat:'modern',title:'RSA by Hand',pts:200,diff:3,flag:`CTF{${rsa.m}}`,
       body:`<p>A tiny (deliberately insecure) RSA key was used to encrypt a single number:</p>${cipher(`n = ${rsa.n},  e = ${rsa.e},  ciphertext c = ${rsa.c}`)}<p>Real RSA keys are 2048+ bits because <b>factoring n is hard</b>. But this n is small enough for the Toolkit's <b>factorise</b> button. Then:</p><ol><li>Factorise n to get p and q.</li><li>Compute &phi; = (p&minus;1)(q&minus;1).</li><li>Find d, the inverse of e mod &phi; (Toolkit: <b>inverse of a mod m</b>).</li><li>Compute m = c<sup>d</sup> mod n (Toolkit: <b>a<sup>b</sup> mod m</b>).</li></ol><p>The flag is <code>CTF{m}</code>, where m is a number.</p>`,
       hints:['Number theory helper: put n in <b>a</b> and press <b>factorise</b>. It splits into two primes close to 90.','&phi; = 88 &times; 96 = 8448. Inverse of 5 mod 8448 gives d. Then compute c<sup>d</sup> mod 8633 with a = c, b = d, m = n.']},
      {id:'cr_dh',cat:'modern',title:'Shared Secret',pts:175,diff:3,flag:`CTF{${dh.s}}`,
       body:`<p>Diffie&ndash;Hellman lets two people agree on a secret over a public channel. Alice and Bob publicly agree on a prime <b>p</b> and base <b>g</b>. Each keeps a private number, and publishes <b>g<sup>private</sup> mod p</b>. Each then raises the <i>other's</i> public value to their own private number, and both get the same answer.</p>${cipher(`p = ${dh.p},  g = ${dh.g}\nAlice's public value A = ${dh.A}\nBob's public value   B = ${dh.B}\nAlice's private number a = ${dh.a}`)}<p>You have intercepted all of that (including, carelessly, Alice's private number). Work out the shared secret <b>B<sup>a</sup> mod p</b>. The flag is <code>CTF{secret}</code>.</p>`,
       hints:['Use the Toolkit&rsquo;s number helper: <b>a</b> = B, <b>b</b> = Alice&rsquo;s private number, <b>m</b> = p, then press <b>a<sup>b</sup> mod m</b>.',`Bob would compute the same value as A<sup>b</sup> mod p. Eavesdroppers who only see A and B cannot work it out, because that needs a private number.`]},
      {id:'cr_class',cat:'modern',title:'Encode, Encrypt or Hash?',pts:125,diff:1,flag:'CTF{know_your_crypto_terms}',widget:'classify',
       body:`<p>One of the most common mistakes in real systems is using the wrong tool for the job. Decide which each scenario really needs.</p><ul class="rules"><li><b>Encoding</b>: changes the format, reversible by anyone, no secret.</li><li><b>Encryption</b>: reversible only with a key.</li><li><b>Hashing</b>: one-way, you cannot get the input back.</li></ul>`,
       wd:{options:['Encoding','Encryption','Hashing'],win:'you know your crypto terms',retry:'Ask: does it need a key? Does it need to be reversible?',items:[
         {t:'Converting an image to Base64 so it can be sent in an email',a:0},
         {t:'Storing user passwords in a database',a:2},
         {t:'Sending your card details to a shop over HTTPS',a:1},
         {t:'Checking a downloaded file has not been tampered with',a:2},
         {t:'Protecting the files on a stolen laptop (e.g. BitLocker)',a:1},
         {t:'Turning text into hexadecimal so it can be printed',a:0}]},
       hints:['Passwords are checked by hashing what you type and comparing. The system never needs the original back.','Anything that mentions a key, or must be turned back into the original by the right person, is encryption.']}
    ]
  };
};
