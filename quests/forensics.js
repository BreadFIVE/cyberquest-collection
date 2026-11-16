/* CyberQuest: Digital Detectives – forensics, network analysis and log investigation. All evidence is fictional and generated at build time. */
module.exports=H=>{
  const P2=n=>String(n).padStart(2,'0');
  const cipher=t=>`<p class="cipher">${H.esc(t)}</p>`;
  /* deterministic pseudo-random so the evidence is identical on every build */
  const rng=seed=>()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;

  /* ---- Strings Attached: a hex dump of "binary junk" with a readable flag buried inside ---- */
  const F_STR='CTF{strings_finds_hidden_text}';
  const rs=rng(42),junk=[];for(let i=0;i<208;i++){const b=Math.floor(rs()*256);junk.push(b>=32&&b<127?b+128-((b>>2)&1)*0:b)}
  const strBytes=[...Buffer.from(F_STR)];junk.splice(83,0,...[0,0,0,0],...strBytes,...[0,0,0]);
  const hexRows=[];for(let i=0;i<junk.length;i+=16)hexRows.push(junk.slice(i,i+16).map(b=>P2(b.toString(16))).join(' '));

  /* ---- DNS exfiltration ---- */
  const F_DNS='CTF{dns_can_carry_secrets}';const hx=H.hex(F_DNS,'');const chunks=hx.match(/.{1,12}/g);
  const dnsRows=[['0.002','192.168.1.40','8.8.8.8','Standard query A www.halcyon-college.example'],['0.140','192.168.1.40','8.8.8.8','Standard query A cdn.example-news.example'],
    ...chunks.map((c,i)=>[(1.2+i*0.31).toFixed(3),'192.168.1.77','8.8.8.8',`Standard query A ${P2(i+1)}-${c}.t.cdn-metrics.example`]),
    ['2.980','192.168.1.40','8.8.8.8','Standard query AAAA mail.halcyon-college.example']];

  /* ---- Port scan table ---- */
  const scanPorts=[21,22,23,25,53,80,110,135,139,443,445,3306,3389,8080];
  const scanRows=[['192.168.1.77','192.168.1.10','TCP','51822 &rarr; 443 [SYN]'],['192.168.1.10','192.168.1.77','TCP','443 &rarr; 51822 [SYN, ACK]'],['192.168.1.77','192.168.1.10','TCP','51822 &rarr; 443 [ACK]'],
    ...scanPorts.flatMap(p=>[['203.0.113.50','192.168.1.10','TCP',`40001 &rarr; ${p} [SYN]`],['192.168.1.10','203.0.113.50','TCP',[22,80,443].includes(p)?`${p} &rarr; 40001 [SYN, ACK]`:`${p} &rarr; 40001 [RST, ACK]`]]),
    ['192.168.1.40','192.168.1.10','TCP','50210 &rarr; 80 [SYN]'],['192.168.1.10','192.168.1.40','TCP','80 &rarr; 50210 [SYN, ACK]']];
  const pkt=(rows,cols)=>`<table class="pkt"><tr><th>#</th><th>Time</th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>${rows.map((r,i)=>`<tr class="${(r.cls||'')}"><td>${i+1}</td><td>${(0.001+i*0.0437).toFixed(3)}</td>${r.cells.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

  /* ---- auth.log (SSH brute force) ---- */
  const ra=rng(7),mo='Mar  2',lines=[];const add=(t,msg)=>lines.push({t,l:`${mo} ${t} srv01 ${msg}`});
  const secs=(h,m,s)=>h*3600+m*60+s,tstr=s=>`${P2(Math.floor(s/3600))}:${P2(Math.floor(s%3600/60))}:${P2(s%60)}`;
  [[0,5,11,'deploy','192.168.1.20'],[1,10,40,'deploy','192.168.1.20'],[1,58,3,'jreyes','192.168.1.40'],[3,30,12,'deploy','192.168.1.20'],[4,12,50,'jreyes','192.168.1.40'],[5,1,5,'deploy','192.168.1.20']]
    .forEach(([h,m,s,u,ip])=>add(tstr(secs(h,m,s)),`sshd[${1000+Math.floor(ra()*800)}]: Accepted publickey for ${u} from ${ip} port ${40000+Math.floor(ra()*9000)} ssh2`));
  for(let h=0;h<6;h++)add(tstr(secs(h,0,1)),`CRON[${2000+h}]: pam_unix(cron:session): session opened for user root`);
  for(let i=0;i<6;i++)add(tstr(secs(0,40,0)+i*7),`sshd[${1300+i}]: Failed password for root from 198.51.100.9 port ${50000+i*11} ssh2`);
  for(let i=0;i<14;i++)add(tstr(secs(2,14,8)+i*3),`sshd[${1400+i}]: Failed password for ${i%5===0?'invalid user ':''}admin from 203.0.113.77 port ${52000+i*7} ssh2`);
  add('02:14:55','sshd[1420]: Accepted password for admin from 203.0.113.77 port 52101 ssh2');
  add('02:15:30','sudo:    admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /etc/shadow');
  lines.sort((a,b)=>a.t.localeCompare(b.t));
  const authLog=lines.map(x=>x.l);

  /* ---- web access.log ---- */
  const rw=rng(99),web=[];const wl=(t,ip,m,path,st,sz,ua)=>web.push({t,l:`${ip} - - [02/Mar/2026:${t} +0000] "${m} ${path} HTTP/1.1" ${st} ${sz} "-" "${ua}"`});
  const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0';
  const normal=['/','/courses','/about','/news','/css/site.css','/js/app.js','/images/logo.png','/prospectus.pdf','/contact'];
  for(let i=0;i<44;i++){const s=secs(8+Math.floor(rw()*6),Math.floor(rw()*60),Math.floor(rw()*60));const p=normal[Math.floor(rw()*normal.length)];wl(tstr(s),'192.168.1.'+(20+Math.floor(rw()*60)),'GET',p,200,p.endsWith('.pdf')?2411000:Math.floor(900+rw()*9000),UA)}
  const probe=[['/admin',404],['/wp-login.php',404],['/phpmyadmin',404],['/.env',404],['/config.php',403],['/backup.zip',404],['/backup.sql',404],['/db_export.sql',200],['/server-status',403],['/uploads',404]];
  probe.forEach(([p,st],i)=>wl(tstr(secs(11,2,0)+i*2),'198.51.100.9','GET',p,st,st===200?(p.endsWith('.sql')?48213:1280):(st===403?199:196),'ScanBot/2.1 (+http://scan.example)'));
  web.sort((a,b)=>a.t.localeCompare(b.t));
  const webLog=web.map(x=>x.l);

  return {
    id:'forensics',name:'Digital Detectives',subtitle:'Forensics & network edition',icon:'🔎',accent:'#ffc247',minutes:90,
    viewSourceFlag:'CTF{forensics_starts_with_evidence}',
    blurb:'File signatures, hidden data, packet captures, email headers and log investigation.',
    lead:'A 90-minute deep dive into digital forensics and network analysis: work out what a file really is, uncover hidden data, read packet captures and logs, and rebuild an attack from the evidence.',
    rulesExtra:['All the evidence is on the page. The <b>Toolkit</b> tab can decode hex, Base64 and Base32, and calculate MD5, SHA-1 and SHA-256 hashes. Some logs have a built-in search box.','Like a real investigator: <b>never change the evidence</b>, work on copies, and write down what you find.'],
    pacing:[['0–10 min','Warm-up: view source, then put the incident-response steps in order.'],['10–40 min','File forensics: magic numbers, strings, hashes and hidden data in an image.'],['40–75 min','Network evidence: packets, DNS, port scans and email headers.'],['75–90 min','Logs and timelines. Use hints on anything left, and double-check spellings.']],
    tips:['Times are written <code>hh:mm:ss</code>. Where a flag is a time, punctuation does not matter.','Words and numbers in flags are lowercase unless the question says otherwise.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      files:{name:'File Forensics',icon:'🗂️',blurb:'What is this file really?'},
      network:{name:'Network & Email',icon:'📡',blurb:'Follow the traffic'},
      logs:{name:'Logs & Timelines',icon:'📜',blurb:'Rebuild what happened'}
    },
    widgetsFile:'quests/forensics.widgets.js',
    challenges:[
      {id:'fo_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{forensics_starts_with_evidence}',
       body:`<p>Every investigation starts with whatever is already in front of you. Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'fo_ir',cat:'intro',title:'First Responder',pts:100,diff:1,flag:'CTF{keep_calm_follow_the_plan}',widget:'order',
       body:`<p>A member of staff reports that their laptop is behaving strangely and files are being renamed. Organisations follow an <b>incident response plan</b> so that nobody panics. Put these five stages in the correct order, using the arrows.</p>`,
       wd:{items:['<b>Identify</b>: confirm what has happened and how serious it is','<b>Contain</b>: isolate the affected machine from the network','<b>Eradicate</b>: remove the malware and close the way in','<b>Recover</b>: restore clean systems and data and return to normal','<b>Review</b>: record lessons learned and improve the plan'],retry:'Think about what you would do first with a laptop that may be infected.'},
       hints:['You cannot fix something until you know what it is, and you should stop it spreading before you clean it.','The review always comes last, once everything is back to normal.']},

      {id:'fo_magic',cat:'files',title:'Magic Numbers',pts:125,diff:2,flag:'CTF{pdf_zip_png}',
       body:`<p>A file's <b>extension</b> is just part of its name, and anyone can change it. The real type is revealed by its first few bytes, the <b>magic number</b>. Here are the first bytes of three files from a suspect's USB drive:</p>
       <pre class="code">holiday.jpg    25 50 44 46 2D 31 2E 37 0A 25 E2 E3
invoice.docx   50 4B 03 04 14 00 06 00 08 00 00 00
notes.txt      89 50 4E 47 0D 0A 1A 0A 00 00 00 0D</pre>
       <p>Reference: <code>FF D8 FF</code> = JPEG &middot; <code>89 50 4E 47</code> = PNG &middot; <code>25 50 44 46</code> = PDF (it spells <code>%PDF</code>) &middot; <code>50 4B 03 04</code> = ZIP (Office files are secretly zips too).</p>
       <p>What are the three files <b>really</b>, in the order listed? The flag is <code>CTF{type_type_type}</code> in lowercase.</p>`,
       hints:['Compare each file&rsquo;s first four bytes with the reference list, ignoring the file name.','First is a PDF. Work out the other two the same way.']},
      {id:'fo_strings',cat:'files',title:'Strings Attached',pts:150,diff:2,flag:F_STR,
       body:`<p>Investigators run a tool called <code>strings</code> on unknown files, which prints any sequence of readable characters hiding in the binary. Here are 220 bytes from a suspicious program as hex:</p>${cipher(hexRows.join('\n'))}<p>Paste the hex into the Toolkit and press <b>Hex &rarr;</b>. Most of it will be unreadable symbols, but somewhere in the middle there is a readable message.</p>`,
       hints:['Ignore the gibberish. You are looking for a run of ordinary letters.','The readable part starts with <code>CTF{</code>.']},
      {id:'fo_lsb',cat:'files',title:'Hidden in the Pixels',pts:200,diff:3,flag:'CTF{lsb_hides_in_plain_sight}',widget:'lsb',
       body:`<p><b>Steganography</b> hides a message inside an ordinary file. One classic method hides it in the <b>least-significant bit</b> of each pixel's colour. Changing that bit alters the colour by 1 part in 256, which the eye cannot see.</p><p>Below is an image that contains a hidden message. Use the buttons to look at the least-significant bit of each colour channel on its own. Only one channel contains the message.</p>`,
       wd:{legend:'Each pixel has red, green and blue values from 0 to 255. Every value ends in a 0 or a 1 in binary. That last bit is the "least-significant bit".'},
       hints:['Try each of the three channel buttons in turn. Two of them show only noise.','The message is in the <b>red</b> channel. Read it carefully and copy it exactly.']},
      {id:'fo_hash',cat:'files',title:'Hash & Hunt',pts:175,diff:2,flag:'CTF{update_helper}',loose:true,
       body:`<p>Security teams share <b>indicators of compromise</b>, including the hash of known malware. A threat feed says a file with this MD5 hash was used in an attack:</p>${cipher(H.md5('BEACON 203.0.113.9 every 60s; keylog=on'))}<p>Three files were found on a PC. The text of each is shown below. Use the Toolkit's <b>MD5</b> button on each one (one at a time, pasting only the text) and see which matches:</p>
       <pre class="code">readme.txt:        Notes for the team lunch on Friday: bring a dish to share.
invoice_march.txt: Dear customer, please find invoice 4471 attached. Regards, Accounts.
update_helper.txt: BEACON 203.0.113.9 every 60s; keylog=on</pre>
       <p>Which file is the known-bad one? The flag is <code>CTF{filename}</code> without the extension.</p>`,
       hints:['Copy the text after the filename (not the filename itself) into the Toolkit Input box, then press MD5. Compare it with the hash above.','Even changing one character gives a completely different hash. That is why hashes make good fingerprints.']},

      {id:'fo_http',cat:'network',title:'Packet Inspector',pts:150,diff:2,flag:'CTF{Blue-Heron-99}',
       body:`<p>A capture from a coffee-shop Wi-Fi shows someone logging into an old intranet over plain HTTP (not HTTPS):</p>${pkt([{cls:'dns',cells:['192.168.1.40','8.8.8.8','DNS','Standard query A intranet.halcyon-college.example']},{cells:['192.168.1.40','203.0.113.30','TCP','49201 &rarr; 80 [SYN]']},{cells:['203.0.113.30','192.168.1.40','TCP','80 &rarr; 49201 [SYN, ACK]']},{cls:'ftp',cells:['192.168.1.40','203.0.113.30','HTTP','GET /staff HTTP/1.1 &nbsp;Authorization: Basic ' + H.b64('john.r:Blue-Heron-99')]},{cls:'ftp',cells:['203.0.113.30','192.168.1.40','HTTP','HTTP/1.1 200 OK (text/html)']},{cls:'tls',cells:['192.168.1.40','17.253.1.2','TLS','Client Hello (encrypted)']}],['Src','Dst','Protocol','Info'])}<p><b>HTTP Basic authentication</b> sends <code>username:password</code> encoded in Base64. Remember: <i>encoding is not encryption.</i> What is the password? The flag is <code>CTF{password}</code>, keeping the capital letters (flags are not case-sensitive, but the spelling is).</p>`,
       hints:['Find the packet with an <code>Authorization: Basic</code> header and copy the string after the word Basic.','Toolkit &rarr; paste it into Input &rarr; <b>Base64 &rarr;</b>. You get <code>username:password</code>.']},
      {id:'fo_dns',cat:'network',title:'DNS Exfiltration',pts:200,diff:3,flag:F_DNS,
       body:`<p>Firewalls usually allow DNS lookups, so attackers sometimes smuggle stolen data out <i>inside DNS queries</i>, a few characters at a time, hidden in made-up subdomain names. This capture contains normal lookups and one suspicious sequence from a single machine:</p>${pkt(dnsRows.map(r=>({cls:'dns',cells:[r[1],r[2],'DNS',r[3]]})),['Src','Dst','Protocol','Info'])}<p>Find the odd queries, join the numbered chunks in order, and decode them. The flag is the message.</p>`,
       hints:['Look for queries to a strange domain where the part before the first dot is numbered (01, 02, 03&hellip;) followed by letters and digits.','Join the chunks in numerical order with no gaps. They are hexadecimal, so use <b>Hex &rarr;</b> in the Toolkit.']},
      {id:'fo_scan',cat:'network',title:"Who's Knocking?",pts:150,diff:2,flag:'CTF{203.0.113.50}',
       body:`<p>The web server <code>192.168.1.10</code> has been noticing odd traffic. A short capture is below. A port scanner sends a <b>SYN</b> packet to many different ports to see which are open: open ports answer <code>[SYN, ACK]</code> and closed ports answer <code>[RST, ACK]</code>.</p>${pkt(scanRows.map(r=>({cls:'',cells:[r[0],r[1],r[2],r[3]]})),['Src','Dst','Protocol','Info'])}<p>Which IP address is the scanner? The flag is <code>CTF{ip_address}</code>.</p>`,
       hints:['Normal visitors connect to one or two ports. Look for a single address trying lots of different ports one after another.','Look at the destination port numbers in the SYN packets from the address that keeps changing them.']},
      {id:'fo_hs',cat:'network',title:'Three-Way Handshake',pts:75,diff:1,flag:'CTF{syn_synack_ack}',widget:'order',
       body:`<p>Before two computers exchange any data over <b>TCP</b>, they set up the connection with a three-step handshake. Put the steps in order. You will see these flags in every packet capture.</p>`,
       wd:{items:['Client sends <b>SYN</b> &ldquo;I would like to connect&rdquo;','Server replies <b>SYN-ACK</b> &ldquo;OK, I am ready too&rdquo;','Client sends <b>ACK</b> &ldquo;Great, confirmed&rdquo;','Connection is established and data starts to flow'],retry:'The client always speaks first.'},
       hints:['The client starts the conversation. SYN stands for "synchronise".','The server answers with both flags at once (SYN and ACK), and then the client confirms.']},
      {id:'fo_hdr',cat:'network',title:'Read the Headers',pts:150,diff:2,flag:'CTF{198.51.100.23}',
       body:`<p>An email arrives that looks like it is from the college IT team. The <b>full headers</b> show where it really came from. Every mail server that handles a message adds a <code>Received:</code> line <b>on top</b>, so the lines closest to the bottom are the earliest.</p>
       <pre class="code">Return-Path: &lt;billing@halcyon-logins.example&gt;
Received: from mail.college.example (mail.college.example [192.0.2.25])
    by mx.college.example; Tue, 3 Mar 2026 08:02:11 +0000
Received: from smtp.cheap-relay.example (smtp.cheap-relay.example [203.0.113.200])
    by mail.college.example; Tue, 3 Mar 2026 08:02:09 +0000
Received: from [198.51.100.23] (unknown [198.51.100.23])
    by smtp.cheap-relay.example; Tue, 3 Mar 2026 08:02:05 +0000
Authentication-Results: mx.college.example; spf=fail; dkim=none
From: "College IT Support" &lt;it-support@college.example&gt;
Reply-To: billing@halcyon-logins.example
Subject: Your password expires today</pre>
       <p>What is the IP address of the machine that <b>first</b> sent this message? The flag is <code>CTF{ip_address}</code>.</p>`,
       hints:['Read the Received lines from the bottom upwards. The bottom one is the earliest hop.','The bottom Received line shows an address in square brackets.']},

      {id:'fo_auth',cat:'logs',title:'The Phantom Log-in',pts:175,diff:2,flag:'CTF{02:14:55}',loose:true,widget:'logs',
       body:`<p>Server <code>srv01</code> was compromised overnight. Below is its SSH log (<code>auth.log</code>). Use the search box to filter it. Each line shows the time, the event and the IP address involved.</p><p>One IP address failed to log in many times, then <b>succeeded</b>. At what time did that successful login happen? The flag is <code>CTF{hh:mm:ss}</code>.</p>`,
       wd:{lines:authLog,placeholder:'Try: Failed   or   Accepted   or an IP address'},
       hints:['Filter for <b>Failed</b> and look at which IP appears again and again. Then filter for <b>Accepted</b>.','Find the &ldquo;Accepted password&rdquo; line that comes from the same address that failed 14 times.']},
      {id:'fo_web',cat:'logs',title:'Web Log Hunt',pts:200,diff:3,flag:'CTF{db_export.sql}',loose:true,widget:'logs',
       body:`<p>The college web server's <code>access.log</code> is below. Each line shows the visitor's IP, the request, and the <b>status code</b> (200 = success, 403 = forbidden, 404 = not found) followed by the size of the reply in bytes.</p><p>One visitor is a scanner probing for sensitive files. Most of its guesses fail, but one succeeds. Which file did it manage to <b>download</b>? The flag is <code>CTF{filename}</code>.</p>`,
       wd:{lines:webLog,placeholder:'Try an IP address, or 404, or ScanBot'},
       hints:['Real visitors use a normal browser. Look for the odd name in the last quoted part of the line (the user-agent), then filter for it.','Of that scanner&rsquo;s requests, look for a <b>200</b> status with a big file size.']},
      {id:'fo_evt',cat:'logs',title:'Event ID Decoder',pts:150,diff:2,flag:'CTF{event_ids_tell_stories}',widget:'classify',
       body:`<p>Windows records security events with numeric <b>Event IDs</b>. Investigators learn the common ones by heart. Match each ID to what it means.</p>`,
       wd:{options:['Successful logon','Failed logon','A new process was created','Audit log was cleared','User account created','Account locked out'],win:'you can read Windows logs',retry:'Each meaning is used exactly once.',items:[
         {t:'<b>4688</b>',a:2},{t:'<b>1102</b> (attackers love this one)',a:3},{t:'<b>4625</b>',a:1},{t:'<b>4740</b>',a:5},{t:'<b>4624</b>',a:0},{t:'<b>4720</b>',a:4}]},
       hints:['4624 and 4625 are a pair: one good logon, one bad. They are the most-searched IDs in incident response.','1102 is about the log itself being wiped, which is something attackers do to hide their tracks.']},
      {id:'fo_time',cat:'logs',title:'Build the Timeline',pts:200,diff:3,flag:'CTF{normalise_your_timestamps}',widget:'order',
       body:`<p>Evidence from different systems rarely uses the same clock. To build a timeline you must <b>convert everything to one time zone</b> (investigators use UTC). Here are five events from the same afternoon (<b>2 March 2026</b>), each recorded in its system's own format. Put them in the order they <b>really</b> happened.</p>
       <ul class="rules"><li>The mail server is set to <b>CET (UTC+1)</b>.</li><li>The proxy and the firewall use <b>UTC</b>.</li><li>The domain controller stores <b>Unix epoch time</b> (seconds since 1 Jan 1970 UTC). <code>1772461500</code> is 14:25:00 UTC on 2 March 2026, and each extra second adds one second.</li><li>The file server is set to <b>CET (UTC+1)</b>.</li></ul>`,
       wd:{items:[
         'Mail server (CET): <b>14:55:00</b> &ndash; phishing email delivered to jreyes',
         'Proxy (UTC): <b>14:02:10</b> &ndash; jreyes&rsquo; PC visits halcyon-logins.example',
         'Domain controller (epoch): <b>1772461500</b> &ndash; jreyes logs in from a new device',
         'File server (CET): <b>16:10:00</b> &ndash; archive staff_export.zip created',
         'Firewall (UTC): <b>15:42:30</b> &ndash; large upload to an external address begins'],retry:'Convert the mail server and file server times to UTC first (subtract one hour).'},
       hints:['Convert everything to UTC. For the CET systems, subtract 1 hour. The epoch value is given for you: 1772461500 = 14:25:00 UTC.','In UTC the email arrived at 13:55, which is <i>before</i> the proxy entry. The file server&rsquo;s 16:10 CET is 15:10 UTC.']}
    ]
  };
};
