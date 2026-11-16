/* CyberQuest: OSINT Investigator – open-source intelligence. Everyone and everything here is fictional (apart from the public landmarks). */
module.exports=H=>{
  const FLAGDORK='CTF{google_remembers_everything}';
  const D=(url,title,type,text)=>({url,title,type,text});
  const docs=[
    D('halcyon-college.example/about','About Halcyon College | Halcyon College','html','Halcyon College is a friendly college in the north east offering GCSE resits, T-levels and apprenticeships. Students get a password for the student portal on day one.'),
    D('halcyon-college.example/it/password-policy.pdf','Password policy | Halcyon College IT','pdf','Halcyon College password policy. Passwords must be at least 12 characters. Never share your password with anyone, including IT staff.'),
    D('halcyon-college.example/students/reset-password','Reset your password | Halcyon College','html','Forgotten your Halcyon College password? Use the self-service reset page. You will need your student number.'),
    D('halcyon-college.example/it/help','IT help | Halcyon College','html','Halcyon College IT help desk: password resets, printing, wifi and software. Open 8:30 to 4:30.'),
    D('halcyon-college.example/news/cyber-week','Cyber Week at the College | Halcyon College news','html','Halcyon College cyber week: workshops on choosing a strong password, spotting phishing and two-factor authentication.'),
    D('halcyon-college.example/staff/handbook.pdf','Staff handbook 2025 | Halcyon College','pdf','Halcyon College staff handbook. Section 9: acceptable use, password management and working from home.'),
    D('halcyon-college.example/library/wifi','Library wifi | Halcyon College','html','Halcyon College library wifi: connect to HAL-Library and sign in with your student password.'),
    D('halcyon-college.example/prospectus.pdf','Prospectus 2026 | Halcyon College','pdf','Halcyon College prospectus. Courses include Digital Support and Cyber Security. Apply online and create a password for your applicant account.'),
    D('halcyon-college.example/files/timetable_2026.xlsx','Timetable 2026 | Halcyon College','xlsx','Halcyon College timetable 2026. Monday: Networks. Tuesday: Cyber Security. Room allocations by group.'),
    D('halcyon-motors.example/contact','Contact | Halcyon Motors','html','Halcyon Motors in Gateshead. Book a service online. Forgot your password? Reset it from your account page.'),
    D('example-news.example/2025/leaked-passwords','Millions of passwords leaked | Example News','html','Another week, another breach: why you should never reuse a password. Halcyon College was not affected.'),
    D('halcyon-college.example/files/it/shared_accounts_INTERNAL.xlsx','Shared accounts (INTERNAL) | Halcyon College IT','xlsx','Halcyon College IT. Shared service accounts and their password. DO NOT PUBLISH.\nprinter-admin      Mx7!rune\nwifi-staff         Quartz-81\nbackup-admin       {{FLAG}}')
  ];
  return {
    id:'osint',name:'OSINT Investigator',subtitle:'Open-source intelligence edition',icon:'🕵️',accent:'#38d6ff',minutes:90,
    viewSourceFlag:'CTF{osint_starts_with_looking}',
    blurb:'Find out what the internet already knows: metadata, usernames, domains, archives and search operators.',
    lead:'A 90-minute deep dive into open-source intelligence: everything you need is publicly available, and that is exactly what makes it dangerous. Learn to find it, check it, and protect yourself from it.',
    rulesExtra:['Everything you need is on the page: the tools are simulated, the people and companies are fictional. The two real-world landmark puzzles are fair game for a map search.','Like real OSINT, <b>stay passive</b>: you only ever look at information that is already public.'],
    pacing:[['0–10 min','Warm-up: view source, then the Passive or Active? sorter.'],['10–40 min','Images and metadata, then people and organisations. Check every detail, because small clues add up.'],['40–75 min','Geolocation, then domains and infrastructure: WHOIS, the archive, and search operators.'],['75–90 min','Defence: how would you shrink your own footprint? Use any remaining time for hints.']],
    tips:['Words and numbers in flags are lowercase. If the question gives a format, follow it exactly.','Spacing and punctuation inside a flag never matter for the word-based answers, so <code>CTF{big ben}</code> and <code>CTF{big_ben}</code> are the same.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      media:{name:'Images & Media',icon:'🖼️',blurb:'Can you trust a picture?'},
      people:{name:'People & Organisations',icon:'👤',blurb:'The human footprint'},
      geo:{name:'Geolocation',icon:'🗺️',blurb:'Where was this?'},
      infra:{name:'Domains & Infrastructure',icon:'🌐',blurb:'Behind the website'},
      defence:{name:'Defence',icon:'🛡️',blurb:'Protect yourself'}
    },
    widgetsFile:'quests/osint.widgets.js',
    challenges:[
      {id:'os_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{osint_starts_with_looking}',
       body:`<p>Before you search anywhere else, look at what is already in front of you. Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'os_scope',cat:'intro',title:'Passive or Active?',pts:75,diff:1,flag:'CTF{passive_before_active}',widget:'classify',
       body:`<p>Good OSINT investigators know where the line is. <b>Passive</b> collection only reads information that is already public. <b>Active</b> collection touches the target's systems or people, and some of it is <b>illegal without permission</b> (in the UK, the Computer Misuse Act 1990).</p>`,
       wd:{options:['Passive (public info)','Active (touches the target)','Illegal without permission'],win:'you know where the line is',retry:'Ask: am I only reading something public, or am I interacting with their systems or people?',items:[
         {t:"Reading a company's public &ldquo;About us&rdquo; page",a:0},
         {t:'Looking up who registered a domain name (WHOIS)',a:0},
         {t:"Scanning a company's servers to see which ports are open",a:1},
         {t:"Ringing reception pretending to be a courier to get staff names",a:1},
         {t:"Guessing the password of a staff member's email account",a:2},
         {t:"Viewing someone's public social media posts",a:0}]},
       hints:['Passive means you never interact with the target at all. You just read what is already out there.','Guessing a password is unauthorised access, whatever your reason. Port scanning and pretexting are active, and need permission in a real engagement.']},

      {id:'os_exif',cat:'media',title:"Metadata Doesn't Lie",pts:100,diff:1,flag:'CTF{stonehenge}',loose:true,
       body:`<p>Someone posted this holiday photo claiming it was taken "somewhere secret, no signal at all". The <b>EXIF metadata</b> stored inside the file (and often left in by mistake) tells a different story:</p>
       <table class="exif"><tr><td>Camera</td><td>Pixel 8</td></tr><tr><td>Date taken</td><td>2025-06-21 05:41:12</td></tr><tr><td>GPS Latitude</td><td>51.1789&deg; N</td></tr><tr><td>GPS Longitude</td><td>1.8262&deg; W</td></tr><tr><td>Software</td><td>Google Photos 7.1</td></tr></table>
       <p>Paste the coordinates into any map (for example <code>51.1789, -1.8262</code>). What famous landmark is it? The flag is <code>CTF{name}</code> in lowercase, one word.</p>`,
       hints:['Search the coordinates as <code>51.1789, -1.8262</code>. West longitude is written as a negative number.','Wiltshire, England. A prehistoric circle of standing stones. One word.']},
      {id:'os_date',cat:'media',title:'Camera Roll Detective',pts:125,diff:2,flag:'CTF{2024-08-17}',loose:true,
       body:`<p>A post claims <i>"BREAKING: crowds outside the town hall tonight!"</i> and was published on <b>3 February 2026</b>. The poster shared the original file. Its metadata:</p>
       <table class="exif"><tr><td>Camera</td><td>Canon EOS 250D</td></tr><tr><td>Software</td><td>Adobe Photoshop 25.1</td></tr><tr><td>DateTimeOriginal</td><td>2024:08:17 14:32:09</td></tr><tr><td>CreateDate</td><td>2024:08:17 14:32:09</td></tr><tr><td>ModifyDate</td><td>2026:02:03 21:10:44</td></tr><tr><td>Lens</td><td>EF-S 18-55mm</td></tr></table>
       <p><b>DateTimeOriginal</b> is when the shutter fired; <b>ModifyDate</b> is when software last changed the file. On what date was this photo <i>actually taken</i>? The flag is <code>CTF{YYYY-MM-DD}</code>.</p>`,
       hints:['Two of the dates are the same and one is very different. One date is about the photo itself, the other is about the editing.','The original capture date is 17 August 2024.']},
      {id:'os_fact',cat:'media',title:'First Appearance',pts:150,diff:2,flag:'CTF{2019}',
       body:`<p>A dramatic photo of a flooded high street is spreading with the caption <i>"Floods hit our city overnight!"</i> (posted 3 Feb 2026). You run a <b>reverse image search</b> and get these results, sorted by date seen:</p>
       <pre class="code">Reverse image search: flood_street.jpg
 2026-02-03  social post        "Floods hit our city overnight!"
 2025-11-30  local forum        "Anyone know where this is? Looks bad"
 2021-03-02  photo-sharing site "Old photo from my trip, Valencia 2019"
 2019-09-13  news-archive.example "Valencia: torrential rain floods old town"
 2019-09-13  stock-library.example "Flooded street, Spain (editorial)"</pre>
       <p>When a picture is reused, the <b>earliest</b> appearance is the best clue to its real origin. In what <b>year</b> did the image first appear? The flag is <code>CTF{year}</code>.</p>`,
       hints:['Look for the earliest date in the list, not the date of the claim.','The oldest results are both from September of the same year.']},

      {id:'os_users',cat:'people',title:'Username Trail',pts:175,diff:2,flag:'CTF{biscuit_alder}',loose:true,widget:'usersearch',
       body:`<p>Many people reuse the same username on every site, and each site gives away a little more. You are told the target uses the handle <b>bluefin_kate</b>. Run it through the search tool below and read every profile.</p>
       <p>Banks and email providers often use <b>security questions</b> such as <i>"What was your first pet's name?"</i> and <i>"What street did you grow up on?"</i> Find those two answers from the public posts. The flag is <code>CTF{petname_streetname}</code>, with the street name only, without "Road".</p>`,
       wd:{query:'bluefin_kate',profiles:[
         {site:'ChatNow',url:'chatnow.example/bluefin_kate',html:'<b>Kate</b> &middot; Cyber student, Halcyon College. Coffee, climbing, cats. <br><i>Pinned:</i> &ldquo;Got my first pen-test report marked, nervous!&rdquo;'},
         {site:'PicShare',url:'picshare.example/bluefin_kate',html:'<p>&#128247; &ldquo;Miss my first dog Biscuit. Golden retriever, 2009 to 2022. Best friend ever. &#128021;&rdquo;</p><p>&#128247; &ldquo;New kitten! Meet Pixel.&rdquo;</p>'},
         {site:'DevHub',url:'devhub.example/bluefin_kate',html:'<b>bluefin_kate</b> &middot; 14 repositories &middot; <i>bio:</i> learning Python and Linux &middot; location: Sunderland'},
         {site:'ForumX',url:'forumx.example/u/bluefin_kate',html:'<p>Re: <i>Best chip shop in Lowestoft?</i> &ldquo;Grew up on Alder Road, two doors from the chippy. Nothing beats it, I still go back every summer.&rdquo;</p>'}]},
       hints:['Read every post carefully, including the photo captions and the forum replies. The pet is on one site, the street is on another.','Pet: the dog on PicShare. Street: the forum reply about the chip shop.']},
      {id:'os_desk',cat:'people',title:'Giveaway Desk',pts:150,diff:2,flag:'CTF{bluebird-47}',
       body:`<p>A company posted this photo of their new IT office with the caption <i>"Our team is ready for the new term!"</i> Security teams call this kind of mistake a <b>visual leak</b>. Zoom in on the picture and see what they gave away.</p>
       <div class="photo">
         <div class="monitor">Ticket #4471<br>VPN reset for<br>J. Okafor<br>ext 2210</div>
         <div class="badge"><div class="nm">HALCYON LOGISTICS</div>D. WHITFIELD<br>IT DIRECTOR<br>ID 0001</div>
         <div class="note">guest wifi:<br>bluebird-47</div>
         <div class="desk"></div>
       </div>
       <p>There are three leaks here (a name and job title on a badge, a ticket on a screen, and a Wi-Fi password on a sticky note). The flag is the <b>Wi-Fi password</b> exactly as written: <code>CTF{password}</code>.</p>`,
       hints:['The password is on the yellow sticky note.','Copy it exactly, including the hyphen and the number.']},
      {id:'os_job',cat:'people',title:'Job Ad Intel',pts:150,diff:2,flag:'CTF{fortinet}',loose:true,
       body:`<p>Companies often reveal their technology without meaning to. A real attacker (or a defender doing recon on their own company) reads job adverts for the <b>tech stack</b>. Read these three public documents about Halcyon Logistics:</p>
       <div class="mock"><b>Job advert: IT Support Technician</b><br>You will support 300 users across Windows 11 devices, manage tickets in Zendesk, and help maintain our <b>FortiGate firewalls</b> and <b>FortiClient VPN</b>. Experience with Microsoft 365 an advantage.</div>
       <div class="mock"><b>Press release:</b> "Halcyon Logistics completes move to Microsoft 365 and welcomes 40 new staff to its Gateshead depot."</div>
       <div class="mock"><b>Staff post:</b> "Working from home today. VPN logged in, kettle on. &#9749;"</div>
       <p>Which <b>vendor</b> makes the firewall and VPN they use? An attacker would search for known weaknesses in this product. The flag is <code>CTF{vendor}</code>, one lowercase word.</p>`,
       hints:['Ignore the Microsoft and Zendesk parts. Look at the sentence about firewalls and VPN.','The product names share the same prefix, and that prefix is the vendor.']},

      {id:'os_dms',cat:'geo',title:'Degrees, Minutes, Seconds',pts:75,diff:1,flag:['CTF{bigben}','CTF{elizabethtower}'],loose:true,
       body:`<p>Not every location is in decimal like the EXIF earlier. Some sources use <b>degrees, minutes and seconds</b>:</p><p class="cipher">51&deg;30&prime;03&Prime; N, 0&deg;07&prime;29&Prime; W</p><p>Most map tools accept this format when you paste it in as-is. What famous London landmark is this? The flag is <code>CTF{name}</code> in lowercase (either of its two common names works).</p>`,
       hints:['Search for <code>51 30 03 N 0 07 29 W</code>, or convert: 51 + 30/60 + 3/3600 = 51.5008.','A clock tower beside the River Thames.']},
      {id:'os_grid',cat:'geo',title:'Where Was I Standing?',pts:175,diff:3,flag:'CTF{d5}',loose:true,widget:'gridmap',
       body:`<p>You have a photo and a map of the town. North is at the top of the map. The photo shows:</p>
       <ul class="rules"><li>The bridge is <b>directly north</b> of the photographer, one square away, straight ahead across the river.</li><li>The church spire is on the horizon <b>two columns to the east</b> and further north.</li><li>The railway station is <b>two columns to the west</b> and <b>one row south</b>.</li></ul>
       <p>Find the one square that fits all three clues. The flag is shown when you check the right square.</p>`,
       wd:{cols:8,rows:8,river:4,legend:'🌉 bridge &middot; ⛪ church &middot; 🚉 station &middot; 🏫 school &middot; 🌳 park &middot; 🏪 shops. The blue row is the river. North is up.',
         cells:{D4:'🌉',F2:'⛪',B6:'🚉',G6:'🏫',C2:'🌳',E7:'🏪'},answer:'D5'},
       hints:['Start with the bridge clue. The photographer is south of the river in the same column as the bridge, one square away.','Columns are letters, rows are numbers. The bridge is D4, so the photographer is in column D, one row south.']},

      {id:'os_whois',cat:'infra',title:'Who Is This Domain?',pts:100,diff:1,flag:'CTF{21}',
       body:`<p>A phishing email links to <code>halcyon-logins.example</code>. A <b>WHOIS</b> lookup shows when a domain was registered and by whom. Brand-new domains are a classic phishing warning sign.</p>
       <div class="whois">Domain Name: HALCYON-LOGINS.EXAMPLE
Registry Domain ID: D883120-EX
Registrar: NameBargain Ltd
Creation Date: 2026-02-12T09:14:00Z
Registry Expiry Date: 2027-02-12T09:14:00Z
Registrant Name: REDACTED FOR PRIVACY
Registrant Organisation: REDACTED FOR PRIVACY
Name Server: ns1.cheap-dns.example
Name Server: ns2.cheap-dns.example</div>
       <p>The email arrived on <b>5 March 2026</b>. How many <b>days old</b> was the domain on that date? The flag is <code>CTF{number}</code>.</p>`,
       hints:['February 2026 has 28 days. Count from 12 Feb to 28 Feb, then add the days in March.','12 Feb &rarr; 28 Feb is 16 days, plus 5 days in March.']},
      {id:'os_wayback',cat:'infra',title:'Wayback Machine',pts:150,diff:2,flag:'CTF{vpn-old.halcyon.example}',loose:true,
       body:`<p>The web archive keeps old copies of pages, even after the company has removed things. Halcyon Logistics' "Contact" page today looks clean. But there are three archived snapshots. Open each and compare.</p>
       <details class="mock"><summary><b>Snapshot: 14 Feb 2026</b></summary><p>Contact us: 0191 496 0000. Email: hello@halcyon.example</p></details>
       <details class="mock"><summary><b>Snapshot: 02 Nov 2025</b></summary><p>Contact us: 0191 496 0000. Email: hello@halcyon.example. Staff: remote access at the <b>old VPN portal</b> is being retired, use the new one instead.</p></details>
       <details class="mock"><summary><b>Snapshot: 19 Jun 2024</b></summary><p>Contact us: 0191 496 0000. IT helpdesk: ext 2210. Staff remote access: <b>vpn-old.halcyon.example</b> (use your normal login). Call Dave on 07700 900123 if it fails.</p></details>
       <p>Which internal hostname was published on the page in 2024 and later removed? The flag is <code>CTF{hostname}</code>.</p>`,
       hints:['Open every snapshot. The oldest one has the most information.','Look for the staff remote access address. It looks like a web address.']},
      {id:'os_dork',cat:'infra',title:'Dork Hunter',pts:200,diff:3,flag:FLAGDORK,widget:'dork',
       body:`<p>Search engines index far more than people realise, including files that were never meant to be public. <b>Search operators</b> ("dorks") narrow results to what you need, for example <code>filetype:pdf</code> or <code>site:example.com</code>.</p>
       <p>Halcyon College's IT department accidentally uploaded a spreadsheet of shared account passwords. Use the mini search engine below to find it. Plain searches like <i>halcyon college password</i> bury it under a lot of normal pages, so narrow it down with operators. Open the right page to read it. The flag is the <b>backup-admin password</b>.</p>`,
       wd:{limit:6,docs},
       hints:['Passwords are often kept in spreadsheets. Add <code>filetype:xlsx</code> to your search.','Try: <code>site:halcyon-college.example filetype:xlsx password</code>, then click the result.']},

      {id:'os_risky',cat:'defence',title:'Shrink Your Footprint',pts:100,diff:1,flag:'CTF{think_before_you_post}',widget:'classify',
       body:`<p>Everything above was possible because people shared too much. Now defend. For each post, decide whether it is <b>safe</b> to share publicly or <b>risky</b> because of what an investigator could learn from it.</p>`,
       wd:{options:['Safe to post','Risky'],win:'a smaller footprint',retry:'Think about what a stranger could work out: where you live, when you are away, or what answers your accounts use.',items:[
         {t:'A photo of your new front door with the house number and street sign in view',a:1},
         {t:'A funny meme you did not create',a:0},
         {t:'A photo of your boarding pass with the barcode, posted before you fly',a:1},
         {t:'A close-up of your cat on a plain background',a:0},
         {t:'&ldquo;Off to Spain for two weeks, house is empty!&rdquo;',a:1},
         {t:'A selfie in school uniform outside the school gate, with the school name visible',a:1}]},
       hints:['Ask what a stranger could work out: where you live, when you are away, or where you spend your days.','Barcodes on boarding passes contain real booking data. Plain photos with no location clues are fine.']}
    ]
  };
};
