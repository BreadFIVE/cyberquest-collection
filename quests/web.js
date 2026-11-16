/* CyberQuest: Web Warriors – web application security. Every site, shop and person here is fictional and runs inside the page. */
module.exports=H=>{
  const F={comment:'CTF{comments_are_not_secrets}',shop:'CTF{never_trust_the_client}',cookie:'CTF{the_cookie_was_forgeable}',sqli:'CTF{or_1_equals_1}',union:'CTF{union_reads_other_tables}',
    xss:'CTF{input_is_not_output_safe}',idor:'CTF{ids_need_access_checks}'};
  return {
    id:'web',name:'Web Warriors',subtitle:'Web security edition',icon:'🌐',accent:'#4da3ff',minutes:90,
    viewSourceFlag:'CTF{web_starts_with_view_source}',
    blurb:'Hidden fields, forged cookies, SQL injection, XSS and broken access control in safe, simulated websites.',
    lead:'A 90-minute deep dive into web security: see why you can never trust the browser, then try the classic injection and access-control flaws against pretend websites, and learn exactly how each one is fixed.',
    rulesExtra:['Every website here is <b>simulated inside the page</b>. Your browser\'s developer tools (<code>F12</code>) are your best friend, and perfectly legal on pages you are allowed to look at.','The <b>Toolkit</b> tab can decode and encode Base64, which several challenges need.'],
    pacing:[['0–10 min','Warm-up: view source, then hunt for a forgotten developer comment.'],['10–40 min','The browser is not your friend: tamper with a hidden field and a cookie. Open DevTools.'],['40–75 min','Injection and access control: SQL injection, XSS and changing an ID in the address.'],['75–90 min','Web basics and defence: headers, cookie flags, status codes, URLs, and matching every flaw to its fix.']],
    tips:['DevTools: right-click a page element and choose <b>Inspect</b> to edit what the browser holds.','Words in flags are lowercase. Numbers are written as digits.'],
    cats:{
      intro:{name:'Warm-Up',icon:'🚀',blurb:'Start here'},
      client:{name:'The Browser Is Not Your Friend',icon:'🧪',blurb:'Everything on the client can be changed'},
      inject:{name:'Injection',icon:'💉',blurb:'Input that becomes code'},
      access:{name:'Access Control',icon:'🚪',blurb:'Who is allowed to see what?'},
      basics:{name:'Web Basics',icon:'📘',blurb:'Know your HTTP'},
      defence:{name:'Defence',icon:'🛡️',blurb:'Fix it'}
    },
    widgetsFile:'quests/web.widgets.js',
    challenges:[
      {id:'wb_src',cat:'intro',title:'Read the Room',pts:50,diff:1,flag:'CTF{web_starts_with_view_source}',
       body:`<p>Every web hacker starts by looking at what the server has already sent to the browser. Right-click this page and choose <b>"View Page Source"</b> (or press <code>Ctrl+U</code>). Near the top of the HTML there is a comment with your first flag.</p>`,
       hints:['Look for an HTML comment: <code>&lt;!-- ... --&gt;</code>, near the &lt;head&gt;.','It is in the first 10 lines of the document, right after the &lt;title&gt; tag.']},
      {id:'wb_comment',cat:'intro',title:"Comments Don't Get Deployed",pts:100,diff:1,flag:F.comment,
       body:`<p>Developers leave notes to themselves in HTML comments and forget to remove them before the site goes live. A comment is not displayed on the page, but <b>everyone can read it</b>.</p>
       <!-- TODO: remove before launch. QA debug flag: ${F.comment} -->
       <p>Somewhere right here in this challenge is a developer comment meant only for the dev team. Open the page source (<code>Ctrl+U</code>) or DevTools (<code>F12</code>) and search for the word <b>TODO</b>.</p>`,
       hints:['Press <code>Ctrl+U</code>, then <code>Ctrl+F</code> and search for <code>TODO</code>.','The comment is in this very challenge, right after the first paragraph.']},

      {id:'wb_shop',cat:'client',title:'The Hidden Price',pts:150,diff:2,flag:F.shop,widget:'shop',
       body:`<p>Some shops put the price in a <b>hidden form field</b> and send it back to the server when you press Buy. Hidden does not mean secret: it is only hidden from the <i>display</i>. Your browser holds it and you can edit it.</p><p>Use DevTools (<b>F12</b> or right-click, <b>Inspect</b>) on the Buy button below, find the hidden <code>&lt;input&gt;</code>, change its <code>value</code>, then press <b>Buy now</b>. Can you get the hoodie for less than the real price?</p>`,
       wd:{item:'Halcyon Hoodie',price:49.99},
       hints:['In the Elements panel, look just above the Buy button for <code>&lt;input type="hidden" ... value="49.99"&gt;</code>. Double-click the value to edit it.','Change <code>49.99</code> to something smaller, like <code>1.00</code>, then click Buy now.']},
      {id:'wb_cookie',cat:'client',title:'Cookie Tampering',pts:200,diff:2,flag:F.cookie,widget:'cookie',
       body:`<p>This simulated intranet stores your login state in a cookie that the <b>browser</b> controls. Never trust the client to tell the truth about who it is. The cookie is just Base64-encoded JSON: not signed, not encrypted.</p><p>Decode the cookie value in the Toolkit (<b>Base64 &rarr;</b>) to see what is inside, change it so your role is <code>admin</code>, re-encode it (<b>&rarr; Base64</b>) and paste it back into the cookie box below.</p>`,
       hints:['Toolkit: paste the part after <code>session=</code> into Input and click <b>Base64 &rarr;</b>. You should see JSON with a role.','Change <code>"role":"user"</code> to <code>"role":"admin"</code>, click <b>&rarr; Base64</b>, then put <code>session=</code> in front and press GET /admin.']},

      {id:'wb_sqli',cat:'inject',title:'SQL Injection 101',pts:200,diff:2,flag:F.sqli,widget:'sqli',
       body:`<p>Below is a simulated login form. It builds its database query by <b>pasting your input straight into a string</b>, which is exactly how SQL injection flaws happen. Watch the query it builds as you type.</p><p>An apostrophe ends the text value and lets you add your own SQL. A condition that is always true, such as <code>' OR '1'='1</code>, or the comment symbol <code>--</code>, changes what the query means.</p>`,
       wd:{title:'🛍️ Halcyon Merch: Staff Login'},
       hints:['In SQL, <code>--</code> starts a comment, so <code>admin&#39;--</code> cuts off the rest of the query, including the password check.','Try username <code>admin&#39; --</code> (with a trailing space) and anything as the password, or <code>&#39; OR &#39;1&#39;=&#39;1</code> in the password box.']},
      {id:'wb_union',cat:'inject',title:'Reading Other Tables',pts:225,diff:3,flag:F.union,widget:'sqlsearch',
       body:`<p>A search box is injectable too. Here the query is <code>SELECT name, price FROM products WHERE hidden=0 AND name LIKE '%<i>your text</i>%'</code>, and the page prints two columns.</p>
       <p>First, make the <code>hidden=0</code> check stop applying. Then use a <b>UNION</b> to bolt a second query onto the first, so the page prints data from a <i>different table</i>. A UNION needs the same number of columns as the original, and the extra query goes after your apostrophe.</p><p>The target table is <code>users</code>, with columns <code>username</code> and <code>password</code>. The flag is the admin's password.</p>`,
       hints:['Start with <code>&#39; OR 1=1 --</code> to see how the query changes. Then you want to add a second SELECT.','Try <code>&#39; UNION SELECT username, password FROM users --</code>. Two columns in, two columns out.']},
      {id:'wb_xss',cat:'inject',title:'Cross-Site Scripting',pts:200,diff:3,flag:F.xss,widget:'xss',
       body:`<p><b>XSS</b> happens when a site puts your input into its page <i>without encoding it</i>, so the browser treats your text as HTML or script. Attackers use it to steal sessions or change what a page says.</p><p>This sandbox shows the HTML a news site would send back for your search. Try typing an HTML tag that can run code, such as a <code>&lt;script&gt;</code> tag or an <code>&lt;img&gt;</code> with an <code>onerror</code> attribute. (The sandbox is safe: it only detects the injection and never runs anything.)</p><p>Then tick <b>Apply the fix</b> and try again.</p>`,
       wd:{},
       hints:['You want your input to include a tag that a browser would act on. Try something like <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>.','Another route: <code>&lt;img src=x onerror=alert(1)&gt;</code>. With the fix ticked, the angle brackets are encoded and nothing runs.']},

      {id:'wb_idor',cat:'access',title:'Change the Number',pts:175,diff:2,flag:F.idor,widget:'idor',
       body:`<p>Many sites show you your own data using an ID in the address, such as <code>invoice?id=1042</code>. This is safe <i>only if the server checks the invoice belongs to you</i>. Often it does not. This flaw is called <b>IDOR</b> (insecure direct object reference) and sits under <i>broken access control</i>, the number one web risk.</p><p>You are customer <b>1042</b>. Look at the nearby invoice numbers. One of them has a customer note containing the flag.</p>`,
       wd:{own:1042,flagId:1037,ids:[1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045]},
       hints:['Invoice IDs are sequential. Try the numbers close to yours, one at a time.','Look at the ones just below 1042. The note is on invoice 1037.']},

      {id:'wb_headers',cat:'basics',title:'Read the Headers',pts:100,diff:1,flag:['CTF{php}','CTF{php/5.3.2}'],loose:true,
       body:`<p>Every web response starts with <b>headers</b>. Some give away exact software versions, helping attackers find known weaknesses. Here is the start of a real-looking response:</p>
       <pre class="code">HTTP/1.1 200 OK
Date: Mon, 02 Mar 2026 11:40:02 GMT
Server: Apache/2.2.14 (Ubuntu)
X-Powered-By: PHP/5.3.2
Content-Type: text/html; charset=UTF-8
Set-Cookie: PHPSESSID=8f2b1c; path=/</pre>
       <p>Two headers reveal software versions. One names the <b>web server</b> software. Which <b>scripting language</b> is the site running? The flag is <code>CTF{language}</code>. Adding the version number (as <code>CTF{language/version}</code>) is accepted too.</p>`,
       hints:['The Server header is about the web server. Look at the other header that has a product and version number.','The <code>X-Powered-By</code> header names the language. Put that name in the flag.']},
      {id:'wb_cookieflags',cat:'basics',title:'Cookie Flags',pts:125,diff:2,flag:'CTF{cookie_flags_matter}',widget:'classify',
       body:`<p>A cookie can carry <b>attributes</b> that make it safer. The line below shows a session cookie with all the protections switched on:</p><pre class="code">Set-Cookie: session=8f2b1c; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600</pre><p>Match each attribute to what it does.</p>`,
       wd:{options:['Only sent over HTTPS','Cannot be read by JavaScript','Not sent on cross-site requests','How long the cookie lasts','Which part of the site receives it'],win:'you know your cookie attributes',retry:'Each meaning is used exactly once.',items:[
         {t:'<code>Secure</code>',a:0},{t:'<code>HttpOnly</code> (this one limits the damage of XSS)',a:1},{t:'<code>SameSite=Strict</code>',a:2},{t:'<code>Max-Age=3600</code>',a:3},{t:'<code>Path=/</code>',a:4}]},
       hints:['Secure is about the connection. HttpOnly is about scripts. SameSite is about where a request came from.','Max-Age is measured in seconds, so 3600 is one hour.']},
      {id:'wb_status',cat:'basics',title:'Status Codes',pts:75,diff:1,flag:'CTF{status_codes_speak}',widget:'classify',
       body:`<p>Every response carries a three-digit <b>status code</b>. Pen testers and developers read them constantly. Match each one to its meaning.</p>`,
       wd:{options:['Success','Moved to a new address','Not allowed (you lack permission)','Page not found','Server error','You need to log in first'],win:'you can read HTTP',retry:'The first digit is a clue: 2 = ok, 3 = redirect, 4 = client problem, 5 = server problem.',items:[
         {t:'<b>200</b>',a:0},{t:'<b>301</b>',a:1},{t:'<b>403</b>',a:2},{t:'<b>404</b>',a:3},{t:'<b>500</b>',a:4},{t:'<b>401</b>',a:5}]},
       hints:['4xx codes mean the request was wrong or refused. 403 and 401 are both about access, but they differ.','401 means "please authenticate". 403 means "I know who you are, and the answer is no".']},
      {id:'wb_https',cat:'basics',title:'Read the Whole URL',pts:125,diff:2,flag:'CTF{read_the_whole_url}',widget:'classify',
       body:`<p>Phishing sites use <b>URL tricks</b>. The part that matters is the <b>domain</b>, which is the text between <code>https://</code> and the first <code>/</code>, reading from the <i>right</i> before the first slash. Anything before an <code>@</code> sign is just a username, not the site. The real bank is <code>halcyon-bank.example</code>.</p><p>Decide whether each address looks genuine or suspicious.</p>`,
       wd:{options:['Looks genuine','Suspicious'],win:'you read the whole URL',retry:'Find the real domain in each one, and check for https.',items:[
         {t:'<code>http://halcyon-bank.example/login</code>',a:1},
         {t:'<code>https://halcyon-bank.example/login</code>',a:0},
         {t:'<code>https://halcyon-bank.example.secure-login.example/</code>',a:1},
         {t:'<code>https://halcyon-bank.example@203.0.113.9/login</code>',a:1},
         {t:'<code>https://www.halcyon-bank.example/help/contact</code>',a:0},
         {t:'<code>https://halcyon-bank-support.example/verify</code>',a:1}]},
       hints:['The real domain ends with <code>halcyon-bank.example</code> right before the first single slash. Extra words after it change the owner.','With <code>@</code>, everything before it is ignored by the browser. The site is whatever comes after.']},

      {id:'wb_fix',cat:'defence',title:'Fix It',pts:150,diff:2,flag:'CTF{fix_the_root_cause}',widget:'classify',
       body:`<p>Finding a flaw is only half the job. Match each vulnerability to the fix that removes the <i>root cause</i>.</p>`,
       wd:{options:['Parameterised queries (prepared statements)','Encode all output before putting it in the page','Check on the server that the record belongs to the logged-in user','Check price and role on the server, never from the browser','Use signed, server-side sessions','Remove version numbers from headers'],win:'you fix causes, not symptoms',retry:'Each fix is used exactly once.',items:[
         {t:'SQL injection in the search box and login form',a:0},
         {t:'XSS from an unencoded search term',a:1},
         {t:'Changing <code>?id=1037</code> shows another customer\'s invoice',a:2},
         {t:'A hidden form field sets the price',a:3},
         {t:'A Base64 cookie says <code>role=admin</code> and nobody checks it',a:4},
         {t:'<code>X-Powered-By: PHP/5.3.2</code> tells attackers which exploits to try',a:5}]},
       hints:['Two of these are about the server trusting the client. Think about which one is about identity and which is about data.','Never build SQL from text. The database must receive the query and the data separately.']}
    ]
  };
};
