# CyberQuest collection

Single-file capture-the-flag challenge sets for GCSE and T-level students. Each quest is **one `.html` file** that works by double-clicking it, from a USB stick, or from GitHub Pages. There is nothing to install and nothing to host.

| Quest | Topic | Challenges |
|---|---|---|
| [`CyberQuest.html`](docs/CyberQuest.html) | The original day-event edition: every category | 25 |
| [`cyberquest-crypto.html`](docs/cyberquest-crypto.html) | **Cipher Vault**: classical ciphers, encodings, hashing, RSA and Diffie&ndash;Hellman | 17 |
| [`cyberquest-osint.html`](docs/cyberquest-osint.html) | **OSINT Investigator**: metadata, usernames, geolocation, WHOIS, archives, search operators | 14 |
| [`cyberquest-pentest.html`](docs/cyberquest-pentest.html) | **Red Team Lab**: scope and law, recon, access and escalation in a simulated terminal, defence | 15 |
| [`cyberquest-forensics.html`](docs/cyberquest-forensics.html) | **Digital Detectives**: file signatures, steganography, packets, email headers, logs and timelines | 15 |
| [`cyberquest-web.html`](docs/cyberquest-web.html) | **Web Warriors**: hidden fields, forged cookies, SQL injection, XSS, IDOR, HTTP basics, fixes | 13 |
| [`cyberquest-social.html`](docs/cyberquest-social.html) | **Human Firewall**: phishing, smishing, influence psychology, tailgating, phone-call role-plays, defence | 13 |
| [`cyberquest-network.html`](docs/cyberquest-network.html) | **Network Navigator**: binary and subnets, ports, TCP/UDP, layers, plus a simulated lab (ping, nslookup, traceroute, arp, netstat) | 20 |
| [`cyberquest-blueteam.html`](docs/cyberquest-blueteam.html) | **SOC Analyst**: alert triage, authentication and web log analysis, incident response, hardening | 16 |
| [`cyberquest-linux.html`](docs/cyberquest-linux.html) | **Terminal Trainer**: navigation, files, find/grep/pipes and permissions in a simulated Linux shell | 18 |

Every category from the original day event now has its own deep dive. Adding another quest takes a single data file (see below).

## Publishing on GitHub Pages

1. Push this repository to GitHub.
2. **Settings, Pages, Build and deployment**: deploy from branch `main`, folder **`/docs`**.
3. Your landing page is then `https://<you>.github.io/<repo>/` and each quest is a link from it.

## Running a session

* Everything runs in the browser. Progress saves in `localStorage`, one device per team.
* Each quest keeps its **own** saved progress, so teams can switch between quests on the same computer.
* Default clock is 90 minutes. Change it with `?minutes=45` on the URL.
* Add `?host` to the URL to reveal host controls on the Briefing tab (+10 minutes, reset this browser).
* Teams show the final report screen to the host to log their score.

## How it works

```
engine/        the shared engine: style.css, body.html, core.js, toolkit.js, widgets.js, lab.js
quests/        one data file per quest (plus optional <quest>.widgets.js for quest-specific mini-apps)
tools/         build helpers and the test harness
docs/          the built, ready-to-publish files (what GitHub Pages serves)
build.js       assembles engine + quest data into one standalone HTML file per quest
```

Flags are **hashed at build time**, so the published HTML contains no answer list. Widgets that reveal a flag when solved (for example the SQL injection form) keep it Base64-encoded. Note that the *source* files in `quests/` do contain the plain-text answers, because that is where you write them. If you want students to explore the repository without seeing answers, keep `quests/` in a private repository and publish only `docs/`.

## Build and test

```bash
npm install          # first time only (installs Playwright for the tests)
npx playwright install chromium    # first time only
npm run build        # rebuilds everything into docs/
npm test             # opens every quest in headless Chromium and checks it
```

`npm test` submits every flag through the real UI, checks wrong flags are rejected, checks scores add up, and then runs `tools/checks/<quest>.js`, which follows the **intended solving route** for each puzzle (decoding with the Toolkit, typing real commands into the simulated terminal, driving each widget). If a puzzle and its answer ever disagree, the test fails.

## Adding a new quest

Create `quests/<id>.js`. It exports a function that receives the build helpers (`H.caesar`, `H.vig`, `H.b64`, `H.md5`, `H.sha256`, `H.xorHex`, `H.modpow`, ...) so ciphertext is always *computed*, never typed by hand:

```js
module.exports = H => ({
  id: 'web', name: 'Web Warriors', subtitle: 'Web security edition', icon: '🌐', accent: '#38d6ff',
  minutes: 90, viewSourceFlag: 'CTF{web_starts_with_view_source}',
  blurb: 'Shown on the landing page.', lead: 'Shown on the welcome card.',
  pacing: [['0-10 min', 'Warm-up...'], ['10-40 min', '...']],
  cats: { intro: {name: 'Warm-Up', icon: '🚀', blurb: 'Start here'} },
  challenges: [
    { id: 'w1', cat: 'intro', title: 'Read the Room', pts: 50, diff: 1,
      flag: 'CTF{web_starts_with_view_source}',        // string, or an array of accepted answers
      loose: false,                                     // true = ignore punctuation/spacing inside the braces
      body: '<p>HTML shown in the challenge window.</p>',
      hints: ['Gentle nudge.', 'Almost gives it away.'] }, // exactly two: they cost 10% and 30% of the points
  ],
});
```

Optional extras:

* **Built-in widgets** (`widget: 'classify' | 'order' | 'branch' | 'logs' | 'sqli' | 'cookie' | 'phish'`), configured with `wd: {...}`. See `engine/widgets.js` for each one's options. The flag is revealed by the widget when solved.
* `branch` is a choose-your-response scenario (see the phone-call challenges in `quests/social.js`). `tools/checks/_shared.js` has ready-made test solvers for `classify`, `order`, `phish` and `branch`.
* **Your own widgets**: put `WIDGETS.myname = (el, c) => {...}` in `quests/<id>.widgets.js` and set `widgetsFile: 'quests/<id>.widgets.js'`.
* **A simulated terminal tab**: set `lab: { intro: '...', data: {...} }`. `quests/pentest.js` is a complete example (hosts, ports, web pages, an FTP server, SSH users, a file system and `sudo` rules).

Then `npm run build` and write `tools/checks/<id>.js` so the test proves every puzzle is solvable.

### Content rules

* Everything is **fictional or simulated**: made-up companies and people, and IP addresses from the documentation ranges (`10.x`, `192.168.x`, `203.0.113.x`, `198.51.100.x`).
* The terminal lab is deliberately limited: scripted output only, no brute-forcing tools, nothing based on real vulnerabilities. For real hands-on practice point students at safe, legal platforms such as TryHackMe, picoCTF or OverTheWire (linked from the landing page).
* Every puzzle needs one clear answer. Compute ciphertext, hashes and logs with code, and prove the route in the test.

## The simulated terminal (`engine/lab.js`)

Three quests use it in different ways, all driven by data in the quest file (`lab: {tab, bar, intro, data:{local:{...}}}`):

* **Pen-test mode** (`pentest.js`): a Kali-style machine plus fictional hosts (`hosts`) you scan, browse and log in to.
* **Plain Linux mode** (`linux.js`): set `plain:true` and give a full `tree` (folders are arrays of names, files are strings or `{c, m, o, run}`). Supports `ls -la`, `cd`, `cat`, `head`, `tail`, `grep -inrc`, `find`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `chmod`, `echo >`/`>>`, pipes into `wc/sort/uniq/cut`, and `./script`. A file's `run` can be text, or `{when:[{exists},{missing},{mode},{has}], yes, no}` so a "check script" only prints its flag when the student has really done the task. `readonly` and `protect` stop edits to chosen paths.
* **Diagnostic mode** (`network.js`): plain mode plus `cmds`, canned output per command (`ping`, `nslookup`, `traceroute`...), chosen by argument.

Nothing in any mode touches a real network.
