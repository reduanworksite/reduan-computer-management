# REDUAN COMPUTER — Course Management System

**REDUAN COMPUTER** — Computer Education & Skill Development Center
**স্লোগান:** শিখুন দক্ষতা, গড়ুন সফল ক্যারিয়ার।
**ঠিকানা:** হোসেনপুর থানা মসজিদ সংলগ্ন, হোসেনপুর, কিশোরগঞ্জ, বাংলাদেশ।
**যোগাযোগ:** 01410645030
**মুদ্রা:** Bangladeshi Taka (৳) · **প্রধান ভাষা:** বাংলা · **দ্বিতীয় ভাষা:** English

একটি সম্পূর্ণ, বাস্তব Online Course Management System — শুধু ডেমো বা স্ট্যাটিক
ড্যাশবোর্ড নয়। শিক্ষার্থী ভর্তি, কোর্স, ব্যাচ, পেমেন্ট, বকেয়া, খরচ, রিপোর্ট ও
ব্যাকআপ — সবকিছু একটি প্ল্যাটফর্ম থেকে পরিচালনা করা যায়। প্রতিটি সংখ্যা Google
Sheets-এর বাস্তব ডেটা থেকে আসে; কোনো Fake Number ব্যবহার করা হয় না।

---

## Live Links (Deployment-এর পর পূরণ করতে হবে)

> ⚠️ এই লিংকগুলো এখনো খালি — কারণ সিস্টেমটি এখনো Live Deploy করা হয়নি।
> Deploy সম্পন্ন হলে এখানে আসল লিংক বসানো হবে।

| Link | URL |
|---|---|
| Public Website (শিক্ষার্থীদের সাইট) | `TODO — GitHub Pages URL` |
| Admin Dashboard (অ্যাডমিন লগইন) | `TODO — GitHub Pages URL + /frontend/admin/login.html` |
| Admission Form (ভর্তি ফরম) | `TODO — GitHub Pages URL + /frontend/public/admission.html` |
| Google Drive Folder | `TODO — REDUAN_COMPUTER_DATABASE ফোল্ডারের লিংক` |
| Google Spreadsheet (Master Database) | `TODO — REDUAN_COMPUTER_MASTER_DATABASE শিটের লিংক` |
| Apps Script Web App (API URL) | `TODO — /exec দিয়ে শেষ হওয়া Web App URL` |

---

## How the System Works / সিস্টেম কীভাবে কাজ করে

```
শিক্ষার্থী (Public Website)
        ↓  কোর্স দেখে → ভর্তি ফরম পূরণ করে → Submit
        ↓  POST JSON { action: "submitAdmission", ... }
Google Apps Script Web App (backend/Code.gs)
        ↓  যাচাই: ভর্তি খোলা আছে? ব্যাচে আসন আছে?
        ↓  Duplicate Transaction ID? LockService (একসাথে একটিই লেখা)
        ↓  Application ID তৈরি (APP-2026-0001)
Google Sheets (REDUAN_COMPUTER_MASTER_DATABASE)
        ↓  Admissions শিটে সারি + Notifications + ActivityLogs
অ্যাডমিন (Admin Dashboard)
        ↓  লগইন → Admission Approve → Student তৈরি (RC-2026-0001)
        ↓  Payment Entry → Paid/Due স্বয়ংক্রিয় হিসাব
        ↓  Reports, Due List, Expenses, Backup
```

**তিনটি স্তর:**

| Layer | Technology | Role |
|---|---|---|
| Frontend | HTML5, CSS3, JavaScript (GitHub Pages) | Public Website + Admin Dashboard |
| Backend API | Google Apps Script (Web App) | ব্যবসায়িক লজিক, হিসাব, নিরাপত্তা যাচাই, ID তৈরি |
| Database + Storage | Google Sheets + Google Drive | ১০টি শিটে সব ডেটা; Drive-এ ব্যাকআপ |

---

## Repository / File Structure

```
reduan-computer-management/
├── README.md                    ← এই ফাইল
├── BACKEND_SETUP_GUIDE.md       ← মালিকের জন্য ধাপে ধাপে Backend সেটআপ গাইড
├── ARCHITECTURE.md              ← Phase 1: আর্কিটেকচার ও পরিকল্পনা
├── DATABASE.md                  ← ১০টি শিটের কলাম কাঠামো ও নিয়ম
├── backend/
│   └── Code.gs                  ← সম্পূর্ণ Apps Script Backend (একটাই ফাইল)
└── frontend/
    ├── config.js                ← APPS_SCRIPT_URL এখানে বসাতে হয় (Deploy-এর পর)
    ├── api.js                   ← API কল, সেশন/টোকেন, টাকার ফরম্যাট
    ├── shared/
    │   └── style.css            ← Shared স্টাইল
    ├── public/
    │   ├── index.html           ← Homepage (Hero, কোর্স, Why Choose Us...)
    │   ├── courses.html         ← কোর্সের তালিকা
    │   ├── course.html          ← কোর্সের বিস্তারিত
    │   ├── admission.html       ← অনলাইন ভর্তি ফরম
    │   └── public.js / public.css
    └── admin/
        ├── login.html           ← অ্যাডমিন লগইন
        ├── index.html           ← ড্যাশবোর্ড শেল
        ├── overview.html        ← Overview (পরিসংখ্যান)
        ├── students.html        ← শিক্ষার্থী ব্যবস্থাপনা
        ├── admissions.html      ← ভর্তি আবেদন (Approve/Reject)
        ├── courses.html         ← কোর্স ব্যবস্থাপনা
        ├── batches.html         ← ব্যাচ ব্যবস্থাপনা
        ├── payments.html        ← পেমেন্ট ও রসিদ
        ├── due.html             ← বকেয়া ব্যবস্থাপনা
        ├── expenses.html        ← খরচ ব্যবস্থাপনা
        ├── reports.html         ← রিপোর্ট ও অ্যানালিটিক্স
        ├── notifications.html   ← নোটিফিকেশন
        ├── settings.html        ← ওয়েবসাইট সেটিংস
        ├── backup.html          ← ব্যাকআপ ও রিস্টোর
        ├── admin-settings.html  ← অ্যাডমিন অ্যাকাউন্ট ও পাসওয়ার্ড পরিবর্তন
        └── admin.js / admin.css ← Shared অ্যাডমিন লজিক ও স্টাইল
```

---

## Main Features / প্রধান ফিচার

### Public Website (শিক্ষার্থীদের জন্য)
- Premium Landing Page — Hero, কোর্স, Why Choose Us, ভর্তির ধাপ, যোগাযোগ
- কোর্সের তালিকা ও বিস্তারিত পাতা (ফি, মেয়াদ, ক্লাস সংখ্যা, ভর্তির অবস্থা)
- অনলাইন ভর্তি ফরম — জমা দিলে Unique Application ID পাওয়া যায়
- Duplicate Transaction ID ধরা পড়লে আবেদন বাতিল হয়

### Admin Dashboard
- Overview: মোট শিক্ষার্থী, সক্রিয় শিক্ষার্থী, কোর্স, ব্যাচ, নতুন ভর্তি,
  মোট ফি, আদায়, বকেয়া, আজকের আদায়, মাসিক আদায়, খরচ, Net Cash
- Students: তালিকা, খোঁজা/ফিল্টার, প্রোফাইল, Edit, Status
  (Active / Pending / Completed / Inactive / Cancelled)
- Admissions: Pending আবেদন Approve/Reject — Approve করলে Student তৈরি হয়
- Courses: নতুন কোর্স, Edit, Soft Delete (ভর্তি থাকা শিক্ষার্থী থাকলে বাধা)
- Batches: ব্যাচ তৈরি/Edit, আসন হিসাব, শিক্ষক, সময়সূচি
- Payments: নতুন পেমেন্ট, কিস্তি, ইতিহাস, স্বয়ংক্রিয় Due হিসাব,
  Payment Status (Unpaid / Partial Paid / Paid / Overpaid), রসিদ (PDF/Print)
- Due Management: মোট বকেয়া, শিক্ষার্থীভিত্তিক ও কোর্সভিত্তিক বকেয়া
- Expense Management: বিভাগভিত্তিক খরচ, মোট খরচ, Net Cash
- Reports: দৈনিক/মাসিক ভর্তি, কোর্সভিত্তিক, বকেয়া, আয়-ব্যয় — CSV Export
- Notifications: নতুন ভর্তি/পেমেন্টের নোটিফিকেশন, Read/Unread
- Backup: এক ক্লিকে Google Drive-এ পুরো ডাটাবেসের কপি
- Light & Dark Mode, সম্পূর্ণ Mobile Responsive, বাংলা টাইপোগ্রাফি

---

## Admin Login Flow / অ্যাডমিন লগইন

1. Admin Dashboard-এর `login.html` খুলুন।
2. Username ও Password দিন (প্রথম অ্যাডমিন মালিক নিজে Apps Script থেকে
   তৈরি করেন — দেখুন `BACKEND_SETUP_GUIDE.md`)।
3. সফল হলে ৮ ঘণ্টার একটি Session Token তৈরি হয় — টোকেনটি ব্রাউজারের
   Session Storage-এ থাকে, পাসওয়ার্ড কোথাও সংরক্ষিত হয় না।
4. প্রতিটি Admin Action সার্ভারে টোকেন যাচাই করে; টোকেন না থাকলে বা মেয়াদ
   শেষ হলে লগইন পাতায় ফেরত পাঠানো হয়।
5. Logout করলে বা পাসওয়ার্ড পরিবর্তন করলে টোকেন বাতিল হয়ে যায় —
   আবার লগইন করতে হয়।

---

## Security Notes / নিরাপত্তা

- **পাসওয়ার্ড কোথাও Plain Text-এ থাকে না** — শুধু SHA-256 Hash
  `AdminUsers` শিটে সংরক্ষিত হয়। Frontend Source Code-এ কোনো পাসওয়ার্ড নেই।
- প্রতিটি Admin Action সার্ভার-সাইডে টোকেন যাচাই করে (`verifyToken`)।
- সব লেখা (Write) `LockService`-এর ভেতরে হয় — দুইজন অ্যাডমিন একসাথে কাজ
  করলেও Duplicate ID বা ভুল হিসাব তৈরি হয় না।
- Google Spreadsheet কখনো Public করা হয় না — শুধুমাত্র Web App-এর মাধ্যমে
  API দিয়ে ডেটা আসে। Public API শুধু কোর্স/ব্যাচের তালিকা দেয় —
  শিক্ষার্থীর ব্যক্তিগত তথ্য কখনো Public API-তে আসে না।
- Delete মানে Soft Delete (Archive/Status) — ইতিহাস মুছে ফেলা হয় না।
- পেমেন্টের ইতিহাস Append-Only — পুরোনো পেমেন্ট কখনো Overwrite করা হয় না।
- **মালিকের Google Password কখনো চ্যাটে চাওয়া হয় না** — মালিক নিজে
  Google-এর Authorization Screen-এ অনুমতি দেন।
- **মালিকের অনুমতি ছাড়া কোনো Google Drive ফাইল Delete করা হয় না।**

---

## Course Fee & Payment Number Setup / ফি ও পেমেন্ট নম্বর বসানো

> ⚠️ **কোনো কোর্সের ফি, মেয়াদ বা ক্লাস সংখ্যা অনুমান করে বসানো হয়নি।**
> Seed কোর্সগুলোতে শুধু নাম ও বিবরণ আছে — ফি/মেয়াদ/ক্লাস খালি রাখা হয়েছে।

মালিক (অ্যাডমিন) Dashboard থেকে নিজে বসাবেন:

1. **কোর্সের ফি:** Admin Dashboard → **Courses** → কোর্স Edit →
   Regular Fee, Discount বসান → Final Fee স্বয়ংক্রিয়ভাবে হিসাব হবে।
2. **পেমেন্ট নম্বর (bKash/Nagad):** Admin Dashboard → **Website Settings** →
   `payment_numbers` ফিল্ডে আসল নম্বর বসান। ভর্তি ফরমে শিক্ষার্থীরা সেই
   নম্বর দেখতে পাবে। যতক্ষণ না বসানো হয়, ফিল্ডটি খালি থাকে — ভুয়া নম্বর
   দেখানো হয় না।
3. **ভর্তি খোলা/বন্ধ:** Website Settings → `admission_open` (TRUE/FALSE)।

---

## Backend API — Actions (Code.gs Router)

| Action | Access | কাজ |
|---|---|---|
| `publicGetCourses` | Public | Published কোর্সের তালিকা |
| `publicGetBatches` | Public | কোর্সের খালি আসনসহ ব্যাচ |
| `submitAdmission` | Public | ভর্তি আবেদন জমা |
| `getSettingsPublic` | Public | ওয়েবসাইটের পাবলিক সেটিংস |
| `adminLogin` / `adminLogout` / `verifyToken` | Public | লগইন, লগআউট, টোকেন যাচাই |
| `changePassword` | Admin | নিজের পাসওয়ার্ড পরিবর্তন (পুরোনো টোকেন বাতিল হয়) |
| `getDashboardStats` | Admin | Overview-এর সব পরিসংখ্যান |
| `getStudents` / `searchStudents` | Admin | শিক্ষার্থীর তালিকা / খোঁজা |
| `createStudent` / `updateStudent` | Admin | শিক্ষার্থী তৈরি / আপডেট |
| `getAdmissions` | Admin | ভর্তি আবেদনের তালিকা |
| `approveAdmission` / `rejectAdmission` | Admin | আবেদন Approve (Student তৈরি হয়) / Reject |
| `getCourses` | Admin | **সব** কোর্স (Draft/Closed/Archived সহ) |
| `createCourse` / `updateCourse` / `deleteCourse` | Admin | কোর্স তৈরি / আপডেট / Soft Delete |
| `getBatches` | Admin | **সব** ব্যাচ, Live Enrolled Count সহ |
| `createBatch` / `updateBatch` | Admin | ব্যাচ তৈরি / আপডেট |
| `recordPayment` | Admin | পেমেন্ট Entry (Due স্বয়ংক্রিয় হিসাব) |
| `getPaymentHistory` | Admin | পেমেন্টের ইতিহাস |
| `getExpenses` | Admin | খরচের তালিকা + বিভাগভিত্তিক মোট |
| `createExpense` | Admin | খরচ Entry |
| `getReports` | Admin | রিপোর্ট (ভর্তি, কোর্সভিত্তিক, বকেয়া, আয়-ব্যয়) |
| `createBackup` | Admin | Drive-এ ডাটাবেসের ব্যাকআপ কপি |
| `getNotifications` / `markNotificationRead` | Admin | নোটিফিকেশন |
| `getSettings` / `updateSettings` | Admin | সেটিংস দেখা / বদলানো |

সব Response JSON: `{ ok: true, data: ... }` অথবা `{ ok: false, error: "..." }`।

---

## Database (Google Sheets — 10টি শিট)

Students, Courses, Batches, Admissions, Payments, Expenses, AdminUsers,
Notifications, Settings, ActivityLogs — প্রতিটি শিটের কলাম কাঠামো দেখুন
`DATABASE.md`-তে। প্রতিটি Record-এর Unique ID আছে
(Student: `RC-2026-0001`, Application: `APP-2026-0001`,
Payment: `PAY-2026-0001`, Expense: `EXP-2026-0001` ইত্যাদি)।

---

## Setup — সংক্ষেপে

সম্পূর্ণ ধাপে ধাপে গাইড: **`BACKEND_SETUP_GUIDE.md`** দেখুন।
সংক্ষেপে: Drive-এ `REDUAN_COMPUTER_DATABASE` ফোল্ডার → ভেতরে
`REDUAN_COMPUTER_MASTER_DATABASE` স্প্রেডশিট → Apps Script-এ `Code.gs`
পেস্ট → `setupSheets()` চালান → একবার `createInitialAdmin()` চালিয়ে
প্রথম অ্যাডমিন তৈরি → Web App হিসেবে Deploy → URL `frontend/config.js`-এ
বসান → GitHub Pages-এ Publish।

---

## Status

- Phase 1 (Architecture): সম্পন্ন — `ARCHITECTURE.md`
- Phase 2 (Public Website): সম্পন্ন — `frontend/public/`
- Phase 3 (Admin Dashboard): সম্পন্ন — `frontend/admin/`
- Phase 4/5 (Google Drive/Sheets + Apps Script Backend): কোড প্রস্তুত
  (`backend/Code.gs`) — **মালিকের অনুমতি ও নিজের ব্রাউজারে করা ধাপগুলো
  বাকি** (দেখুন `BACKEND_SETUP_GUIDE.md`)।
- Phase 6–12 (Auth, Modules, Reports, Integration, Testing, Publishing):
  Backend Deploy-এর পর।
