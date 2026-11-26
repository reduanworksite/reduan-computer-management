# Backend Setup Guide — ব্যাকএন্ড সেটআপ গাইড

**Project:** REDUAN COMPUTER — Course Management System
**Backend:** Google Apps Script + Google Sheets + Google Drive
**ফাইল:** `backend/Code.gs` (একটাই ফাইল — পুরো Backend)

> ⚠️ **গুরুত্বপূর্ণ:** এই গাইডের ধাপগুলো **মালিক (Reduan) নিজে তার নিজের
> ব্রাউজারে, নিজের Google অ্যাকাউন্ট দিয়ে** করবেন। Muse কখনো মালিকের Google
> Password চায় না, OTP চায় না, এবং মালিকের অনুমতি ছাড়া Google Drive-এ
> কোনো ফাইল তৈরি, বদল বা Delete করে না।

---

## যা যা লাগবে (Prerequisites)

| জিনিস | অবস্থা |
|---|---|
| Google অ্যাকাউন্ট (যেটা দিয়ে Drive/Sheets ব্যবহার করবেন) | মালিকের নিজের |
| কম্পিউটার + ব্রাউজার (Chrome সুপারিশ করা হয়) | — |
| এই প্রজেক্টের `backend/Code.gs` ফাইল | ✅ প্রস্তুত আছে |
| ইন্টারনেট সংযোগ | — |

---

## অনুমতি (Permissions) — কী কী লাগবে এবং কেন

Google Authorization Screen-এ নিচের অনুমতিগুলো চাওয়া হবে — সবগুলোই এই
সিস্টেম চালানোর জন্য দরকার, অন্য কোনো কাজে ব্যবহার করা হয় না:

| Permission | কেন দরকার |
|---|---|
| Google Drive — ফাইল তৈরি ও পড়া | Backup ফোল্ডার ও ব্যাকআপ কপি তৈরি করতে |
| Google Sheets — পড়া ও লেখা | ১০টি শিটে শিক্ষার্থী, পেমেন্ট, খরচের ডেটা লিখতে/পড়তে |
| Apps Script — Web App হিসেবে Deploy করা | Frontend থেকে API কল গ্রহণ করতে |
| বাহ্যিক (External) অনুরোধ গ্রহণ | Public Website থেকে ভর্তি ফরমের ডেটা নিতে |

**যা কখনো চাওয়া হবে না:** আপনার Gmail পড়া, অন্য কারো Drive ফাইল দেখা,
আপনার Password। Authorization Screen-এ শুধু উপরের স্কোপগুলো দেখাবে —
অন্য কিছু দেখালে অনুমতি দেবেন না, আগে জানাবেন।

---

## ধাপ ১ — Google Drive ফোল্ডার তৈরি করুন (Step 1: Create the Drive Folder)

**মালিক নিজে করবেন — তাঁর ব্রাউজারে:**

1. [drive.google.com](https://drive.google.com) খুলে নিজের Google
   অ্যাকাউন্টে Sign In করুন।
2. **+ New** → **New folder** চাপুন।
3. ফোল্ডারের নাম দিন ঠিক এভাবে: `REDUAN_COMPUTER_DATABASE`
4. **Create** চাপুন।

✅ যাচাই: Drive-এ `REDUAN_COMPUTER_DATABASE` নামে একটি ফোল্ডার দেখা যাবে।

> English: In Google Drive, create a folder named exactly
> `REDUAN_COMPUTER_DATABASE`.

---

## ধাপ ২ — Master Spreadsheet তৈরি করুন (Step 2: Create the Spreadsheet)

**মালিক নিজে করবেন:**

1. `REDUAN_COMPUTER_DATABASE` ফোল্ডারটি খুলুন।
2. ভেতরে **+ New** → **Google Sheets** → **Blank spreadsheet** চাপুন।
3. উপরে শিরোনামে ক্লিক করে স্প্রেডশিটের নাম দিন ঠিক এভাবে:
   `REDUAN_COMPUTER_MASTER_DATABASE`
4. Enter চাপুন। শিটটি অটো-সেভ হয় — আলাদা করে Save করতে হয় না।

✅ যাচাই: স্প্রেডশিটের নাম `REDUAN_COMPUTER_MASTER_DATABASE` দেখা যাবে,
আর এটি `REDUAN_COMPUTER_DATABASE` ফোল্ডারের ভেতরে আছে।

> ⚠️ **স্প্রেডশিটটি কাউকে Share করবেন না (Public/Anyone with link নয়)।**
> এটি সবসময় Private থাকবে — শুধু Apps Script Web App-এর মাধ্যমে ডেটা
> আসবে। ভুল করে Share করে ফেললে Share বন্ধ করে দিন।

---

## ধাপ ৩ — Apps Script-এ Code.gs পেস্ট করুন (Step 3: Paste the Backend Code)

**মালিক নিজে করবেন:**

1. `REDUAN_COMPUTER_MASTER_DATABASE` স্প্রেডশিটটি খুলুন।
2. উপরের মেনু থেকে **Extensions** → **Apps Script** চাপুন।
   (নতুন ট্যাবে Apps Script Editor খুলবে।)
3. বামদিকে `Code.gs` ফাইলটি খুলুন — ভেতরে `myFunction` নামে কিছু ডিফল্ট
   কোড থাকবে — সবটুকু মুছে ফেলুন।
4. এই প্রজেক্টের `backend/Code.gs` ফাইলের **পুরো** বিষয়বস্তু কপি করে
   এখানে Paste করুন।
5. উপরে **💾 Save** (বা `Ctrl + S`) চাপুন।
6. প্রজেক্টের নাম (উপরে বামে "Untitled project") বদলে দিন:
   `Reduan Computer Management Backend`

✅ যাচাই: Editor-এ কোনো লাল Error চিহ্ন নেই; `setupSheets`,
`createInitialAdmin`, `doGet`, `doPost` ফাংশনগুলো দেখা যায়।

> English: Open the spreadsheet → Extensions → Apps Script → replace the
> default code with the full contents of `backend/Code.gs` → Save.

---

## ধাপ ৪ — Sheets তৈরি করুন: setupSheets() চালান (Step 4: Run setupSheets)

**মালিক নিজে করবেন — Apps Script Editor থেকে:**

1. Editor-এর উপরে ফাংশন নির্বাচনের ড্রপডাউনে `setupSheets` বেছে নিন।
2. **▶ Run** চাপুন।
3. প্রথমবার **Review permissions** → নিজের Google অ্যাকাউন্ট বেছে নিন →
   **Advanced** → **Go to Reduan Computer Management Backend (unsafe)** →
   **Allow** চাপুন।
   (এটি Google-এর নিজস্ব সতর্কবার্তা — আপনি নিজে লেখা স্ক্রিপ্ট চালাচ্ছেন,
   তাই Allow করা নিরাপদ। অন্য কারো স্ক্রিপ্ট হলে Allow করবেন না।)
4. Run শেষ হলে নিচে **Execution log**-এ দেখাবে:
   `Setup complete: 10 sheets, settings and 5 seed courses ready.`

✅ যাচাই: স্প্রেডশিটে ফিরে গিয়ে দেখুন — ১০টি শিট তৈরি হয়েছে:
Students, Courses, Batches, Admissions, Payments, Expenses, AdminUsers,
Notifications, Settings, ActivityLogs। Settings শিটে ব্যবসার তথ্য
(নাম, ঠিকানা, ফোন) আর Courses শিটে ৫টি Seed কোর্সের নাম আছে।

> ⚠️ Seed কোর্সে শুধু নাম আছে — ফি/মেয়াদ/ক্লাস খালি। ফি পরে Dashboard
> থেকে মালিক নিজে বসাবেন। কোনো ফি অনুমান করে বসানো হয়নি।

---

## ধাপ ৫ — প্রথম অ্যাডমিন তৈরি করুন (Step 5: Create the Initial Admin)

**মালিক নিজে করবেন — Apps Script Editor থেকে, শুধু একবার:**

1. ফাংশন ড্রপডাউনে `createInitialAdmin` বেছে নিন।
2. কোডে ফাংশনটি খুঁজে দেখুন — এটি `createInitialAdmin(username, tempPassword)`
   আকারে কল করতে হয়। Editor-এ সরাসরি চালাতে হলে অস্থায়ীভাবে নিচের লাইনটি
   ফাইলের শেষে যোগ করে Run করুন, তারপর মুছে ফেলুন:
   ```javascript
   function runOnceCreateAdmin() {
     createInitialAdmin('admin', 'YOUR-STRONG-TEMP-PASSWORD');
   }
   ```
   - `'admin'` — আপনার পছন্দের Username দিতে পারেন।
   - `'YOUR-STRONG-TEMP-PASSWORD'` — কমপক্ষে ৮ অক্ষরের একটি শক্তিশালী
     অস্থায়ী পাসওয়ার্ড দিন (অক্ষর + সংখ্যা মিশিয়ে)। এই পাসওয়ার্ডটি
     **কাউকে চ্যাটে/মেসেজে পাঠাবেন না** — শুধু নিজে মনে রাখুন।
3. `runOnceCreateAdmin` সিলেক্ট করে **▶ Run** চাপুন।
4. সফল হলে লগে দেখাবে: `Admin "admin" created. ...`
5. **এখনই `runOnceCreateAdmin` ফাংশনটি মুছে ফেলুন** এবং ফাইল Save করুন।
   (এটি না মুছলে কেউ আবার চালিয়ে অ্যাডমিন তৈরি করতে পারে।)
6. এরপর Admin Dashboard-এ লগইন করে **Admin Settings → পাসওয়ার্ড পরিবর্তন**
   থেকে নিজের স্থায়ী পাসওয়ার্ড বসান।

✅ যাচাই: স্প্রেডশিটের `AdminUsers` শিটে আপনার Username দেখা যায় —
PasswordHash কলামে শুধু লম্বা Hash (অক্ষর-সংখ্যার স্ট্রিং) আছে,
আসল পাসওয়ার্ড কোথাও লেখা নেই।

> English: Run `createInitialAdmin('admin', 'Your-Strong-Password')` ONCE
> from the editor, then DELETE the one-time runner function. The password
> is stored only as a SHA-256 hash. Never share the password in chat.

---

## ধাপ ৬ — Web App হিসেবে Deploy করুন (Step 6: Deploy as Web App)

**মালিক নিজে করবেন — Apps Script Editor থেকে:**

1. উপরে ডানদিকে **Deploy** → **New deployment** চাপুন।
2. গিয়ার ⚙️ আইকনে ক্লিক করে **Web app** বেছে নিন।
3. সেটিংস ঠিক এভাবে দিন:
   - **Description:** `Reduan Computer Management API v1`
   - **Execute as:** `Me` (আপনার অ্যাকাউন্ট)
   - **Who has access:** `Anyone`
     > কেন Anyone? কারণ Public Website থেকে যে কেউ ভর্তি ফরম জমা দেবে।
     > নিরাপত্তা Apps Script নিজে দেয় না — নিরাপত্তা দেয় Backend কোড:
     > প্রতিটি Admin Action টোকেন যাচাই করে (`verifyToken`)। স্প্রেডশিট
     > নিজে Private-ই থাকে, কেউ সরাসরি শিট খুলতে পারে না।
4. **Deploy** চাপুন → আবার অনুমতি চাইলে Allow করুন।
5. একটি **Web App URL** দেখাবে — যা `/exec` দিয়ে শেষ হয়, যেমন:
   `https://script.google.com/macros/s/AKfy.../exec`
6. এই URL-টি কপি করে নিরাপদে রাখুন (পাসওয়ার্ডের মতো গোপন কিছু নয় —
   এটি Frontend-এ বসবে, তবে অপ্রয়োজনে পাবলিক পোস্টে ছড়াবেন না)।

✅ যাচাই: URL-টি ব্রাউজারে খুললে একটি JSON দেখাবে — যেমন
`{"ok":false,"error":"Unknown action: undefined"}` — এটাই স্বাভাবিক
(কোনো action ছাড়া কল করলে এই Error আসে; মানে API জীবিত আছে)।

> English: Deploy → New deployment → Web app → Execute as: Me →
> Who has access: Anyone → Deploy → copy the `/exec` URL.

---

## ধাপ ৭ — Frontend-এ API URL বসান (Step 7: Connect the Frontend)

**এই ধাপটি মালিকের অনুমতি নিয়ে Muse করবে (GitHub-এ ফাইল আপডেটের সময়):**

1. এই প্রজেক্টের `frontend/config.js` খুলুন।
2. `APPS_SCRIPT_URL: ''` — খালি জায়গায় ধাপ ৬-এর Web App URL বসান:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfy.../exec',
   ```
3. Save করুন ও GitHub Pages-এ Publish করুন।

✅ যাচাই: Public Website খুললে আর "Backend সংযুক্ত হয়নি" দেখাবে না —
কোর্সের তালিকা দেখাবে। Admin Dashboard-এ লগইন করা যাবে।

---

## ধাপ ৮ — পরীক্ষা করুন (Step 8: Verify with a Test Call)

**মালিক নিজে করবেন — ব্রাউজার থেকে:**

1. Public Website খুলুন → কোর্সের তালিকা দেখা যায় কি না দেখুন
   (৫টি Seed কোর্সের নাম দেখা যাবে, ফি খালি থাকবে)।
2. একটি পরীক্ষামূলক ভর্তি আবেদন জমা দিন (নিজের নাম/নম্বর দিয়ে) →
   Application ID পাওয়া গেলে বুঝবেন Submit কাজ করছে।
3. Admin Dashboard-এ লগইন করুন (ধাপ ৫-এর Username/Password) →
   **Admissions**-এ পরীক্ষার আবেদনটি Pending অবস্থায় দেখা যাবে।
4. **Admissions** থেকে আবেদনটি **Reject** করে দিন (পরীক্ষার ডেটা
   বাস্তব ডাটাবেসে অপ্রয়োজনীয়ভাবে রেখে দেবেন না) — অথবা Approve করে
   Student তৈরি করে তারপর Student-টি Archive করুন।
5. **Overview**-এ সংখ্যাগুলো দেখুন — সব শূন্য/আসল হিসাব অনুযায়ী দেখাবে,
   কোনো ভুয়া সংখ্যা নয়।

✅ সব ঠিক থাকলে Backend সংযোগ সম্পন্ন।

---

## সমস্যা হলে (Troubleshooting)

| সমস্যা | সম্ভাব্য কারণ ও সমাধান |
|---|---|
| "Sheet not found — run setupSheets() first" | ধাপ ৪ হয়নি — Apps Script থেকে `setupSheets()` চালান। |
| লগইনে "Invalid username or password" | Username/Password ভুল, অথবা ধাপ ৫-এ অ্যাডমিন তৈরি হয়নি। `AdminUsers` শিটে Username আছে কি না দেখুন। |
| Website-এ "Backend সংযুক্ত হয়নি" | `config.js`-এ Web App URL বসানো হয়নি, অথবা URL ভুল। ধাপ ৬–৭ আবার দেখুন। |
| ভর্তি ফরম জমা হয় না | `admission_open` সেটিং FALSE থাকতে পারে (Website Settings দেখুন), অথবা ব্যাচ পূর্ণ। |
| "Unknown action" Error | Frontend পুরোনো সংস্করণ চালাচ্ছে, অথবা Deploy-এর পর নতুন Version Deploy করা হয়নি — **Deploy → Manage deployments → নতুন Version Deploy** করুন। |
| Deploy-এর পরও পুরোনো কোড চলে | Web App-এর নতুন Version Deploy করতে হয় — শুধু Save করলেই Live হয় না। Deploy → New deployment → আগের Deployment-টি Edit করে **Version: New version** বেছে Deploy করুন। |

---

## নিরাপত্তা চেকলিস্ট (Security Checklist)

- [ ] স্প্রেডশিট কাউকে Share করা হয়নি (Private)।
- [ ] `createInitialAdmin` চালানোর পর one-time runner ফাংশন মুছে ফেলা হয়েছে।
- [ ] প্রথম লগইনের পর Dashboard থেকে স্থায়ী পাসওয়ার্ড বসানো হয়েছে।
- [ ] পাসওয়ার্ড কাউকে চ্যাটে/মেসেজে পাঠানো হয়নি।
- [ ] `payment_numbers` সেটিংসে আসল bKash/Nagad নম্বর মালিক নিজে বসিয়েছেন।
- [ ] কোর্সের ফি Dashboard থেকে মালিক নিজে বসিয়েছেন (কোনো অনুমান করা ফি নেই)।
- [ ] পরীক্ষার ভর্তি আবেদন Reject/Archive করে ডাটাবেস পরিষ্কার করা হয়েছে।
- [ ] প্রথম Backup নেওয়া হয়েছে (Dashboard → Backup & Restore → Backup তৈরি)।

---

## Backup ও Restore — সংক্ষেপে

- **Backup:** Admin Dashboard → **Backup & Restore** → Backup তৈরি করুন —
  পুরো স্প্রেডশিটের একটি কপি Drive-এ `REDUAN_COMPUTER_DATABASE_BACKUPS`
  ফোল্ডারে সংরক্ষিত হয় (নামে তারিখ-সময় থাকে)।
- **Restore:** Restore কখনো স্বয়ংক্রিয় নয়। ভুল করে ডাটাবেস Overwrite
  করা যাবে না — মালিক নিজে Drive থেকে ব্যাকআপ কপিটি খুলে, যাচাই করে,
  তারপর সেটিকে নতুন Master হিসেবে ব্যবহার করবেন। বিস্তারিত দেখুন
  `ARCHITECTURE.md` § Backup।

---

## নতুন Version Deploy করা (ভবিষ্যতে কোড বদলালে)

Backend কোডে কিছু বদলালে শুধু Save করলেই Live হয় না:

1. Apps Script Editor-এ কোড বদলে Save করুন।
2. **Deploy** → **Manage deployments** → Deployment-টির ✏️ Edit →
   **Version** → **New version** → **Deploy**।
3. Web App URL একই থাকে — Frontend-এ কিছু বদলাতে হয় না।

---

*শেষ আপডেট: Phase 4/5 প্রস্তুতি — Backend কোড স্থানীয়ভাবে প্রস্তুত;
মালিকের অনুমতি ও উপরের ধাপগুলো সম্পন্ন হলে Live Deploy করা হবে।*
