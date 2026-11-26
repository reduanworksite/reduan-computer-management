# REDUAN COMPUTER — Course Management System
## আর্কিটেকচার ডকুমেন্ট (Phase 1) / Architecture Document

**Project:** Reduan Computer Course Management System
**Business:** REDUAN COMPUTER — Computer Education & Skill Development Center
**Slogan:** শিখুন দক্ষতা, গড়ুন সফল ক্যারিয়ার।
**Location:** হোসেনপুর থানা মসজিদ সংলগ্ন, হোসেনপুর, কিশোরগঞ্জ, বাংলাদেশ।
**Contact:** 01410645030
**Currency:** Bangladeshi Taka (৳)
**Primary Language:** Bengali (বাংলা) · Secondary Language: English
**Repository (planned):** `reduan-computer-management`
**Status:** Phase 1 — Planning & backend code prepared as local files ONLY. No publishing, no Google account changes, no live deployment yet. Google backend setup needs the owner's approval (see §10).

---

## 1. System Overview / সিস্টেমের সংক্ষিপ্ত বিবরণ

এটি একটি সম্পূর্ণ, বাস্তব Course Management Platform — শুধু ডেমো বা স্ট্যাটিক ড্যাশবোর্ড নয়। প্রতিটি সংখ্যা Google Sheets-এর বাস্তব ডেটা থেকে আসবে; কোনো Fake Number ব্যবহার করা হবে না।

তিনটি স্তর (three layers):

| Layer | Technology | Role |
|---|---|---|
| Public Website + Admin Dashboard (Frontend) | HTML5, CSS3, JavaScript (GitHub Pages) | শিক্ষার্থীরা কোর্স দেখবে ও ভর্তি আবেদন করবে; অ্যাডমিন পুরো প্রতিষ্ঠান পরিচালনা করবে |
| API Backend | Google Apps Script (Web App) | সব ব্যবসায়িক লজিক, হিসাব, নিরাপত্তা যাচাই, ID তৈরি |
| Database + Storage | Google Sheets + Google Drive | ১০টি শিটে সব ডেটা; Drive-এ নির্ধারিত ব্যাকআপ |

### Data Flow / ডেটা প্রবাহ

```
Student fills Admission Form (public site)
        ↓  POST JSON
Apps Script Web App (doPost → submitAdmission)
        ↓  LockService (একসাথে একটিই লেখা)
  ├─ Duplicate Transaction ID যাচাই → থাকলে আবেদন বাতিল
  ├─ Application ID তৈরি (APP-2026-0001)
  ├─ Admissions শিটে সারি লেখা (Status = Pending)
  ├─ Notifications শিটে অ্যাডমিন নোটিফিকেশন
  └─ ActivityLogs শিটে লগ
Admin approves admission (Dashboard)
        ↓
Student ID তৈরি (RC-2026-0001) → Students শিটে সারি
Admin records payment
        ↓
Payments শিটে নতুন সারি (ইতিহাস সংরক্ষিত, overwrite নয়)
  + Students শিটের Paid / Due / PaymentStatus একই লেনদেনে আপডেট
Dashboard reads Sheets → Overview, Due, Reports সব স্বয়ংক্রিয়ভাবে আপডেট
```

---

## 2. Tech Stack / প্রযুক্তি

- **Frontend:** HTML5, CSS3, JavaScript (no framework — হালকা, দ্রুত, GitHub Pages-এ চলে)
- **Backend:** Google Apps Script (Web App, JSON API)
- **Database:** Google Sheets (`REDUAN_COMPUTER_MASTER_DATABASE`)
- **Storage / Backup:** Google Drive folder `REDUAN_COMPUTER_DATABASE`
- **Hosting:** GitHub Pages (frontend) + Apps Script Web App (API)
- **Authentication:** Admin username + SHA-256 hashed password, time-limited session token
- **Fonts:** Hind Siliguri + Noto Sans Bengali (বাংলা), Inter (English)

---

## 3. Repository / File Structure

```
reduan-computer-management/
├── ARCHITECTURE.md          # এই ডকুমেন্ট (Phase 1)
├── DATABASE.md              # ১০টি শিটের সম্পূর্ণ কলাম কাঠামো
├── README.md                # Installation + Setup Guide (Phase 11-এ সম্পূর্ণ হবে)
├── backend/
│   └── Code.gs              # Google Apps Script backend (একটাই ফাইল)
├── public/                  # Public Website (Phase 2)
│   ├── index.html           # Homepage
│   ├── courses.html         # Course Listing
│   ├── course.html          # Course Details (?id=...)
│   ├── admission.html       # Online Admission Form
│   ├── css/style.css
│   ├── js/api.js            # API client (Apps Script URL)
│   └── js/public.js
├── admin/                   # Admin Dashboard (Phase 3)
│   ├── login.html
│   ├── index.html           # Dashboard shell + sidebar
│   ├── css/admin.css
│   └── js/admin.js          # সব মডিউল (Students, Payments, ...)
└── docs/
    ├── BACKEND_SETUP.md     # Apps Script deploy গাইড (Phase 5)
    ├── BACKUP_RESTORE.md    # Backup & Restore গাইড (Phase 8)
    └── TESTING.md           # Testing checklist (Phase 10)
```

ভবিষ্যতে নতুন ফিচার যোগ করা সহজ রাখার নিয়ম: প্রতিটি মডিউল (Students, Payments, …) আলাদা JS ফাংশন/ফাইলে থাকবে; API-তে নতুন action যোগ করলেই Dashboard-এ নতুন মেনু যোগ করা যাবে; Sheets-এ নতুন কলাম যোগ করলে পুরোনো ডেটা ভাঙবে না।

---

## 4. Public Website — Page Inventory / পাবলিক ওয়েবসাইট

| Page | File | কাজ |
|---|---|---|
| Homepage | `public/index.html` | Header, Logo, Nav, Hero, Available Courses, Why Choose Us, Learning Benefits, Admission Process, Student Support, Contact, Footer |
| Course Listing | `public/courses.html` | সব কোর্স Card আকারে: নাম, ছবি, মেয়াদ, মোট ক্লাস, ফি, বিবরণ, শেখার ফলাফল, Admission Status, Admission Button |
| Course Details | `public/course.html?id=...` | একটি কোর্সের বিস্তারিত + ব্যাচ তালিকা + ভর্তি বোতাম |
| Online Admission | `public/admission.html` | ভর্তি ফরম (নিচে দেখুন) + Application ID সহ Confirmation |

**Admission Form Fields:** Student Full Name, Father's Name, Mother's Name, Mobile Number, Alternative Mobile Number, Email Address, Present Address, Course Selection, Batch Selection, Admission Date, Payment Information (Method, Transaction ID, Sender Number), Additional Information.

**Form Rules:**
- Submit-এর পর Unique Application ID (APP-…) দেখাবে + Confirmation Message।
- একই Transaction ID দিয়ে দ্বিতীয় আবেদন/পেমেন্ট গ্রহণ করা হবে না (duplicate চেক)।
- কোর্স ও ব্যাচের তালিকা Sheets থেকে আসবে — অ্যাডমিন Dashboard থেকে যুক্ত/Edit করা যাবে।
- **Seed Courses (অ্যাডমিন পরে Edit করবেন):** 1) Microsoft Office + Google Workspace, 2) Basic Computer, 3) Digital Marketing, 4) Basic Graphics Design, 5) Computer Fundamentals।
- ⚠️ কোর্সের ফি, মেয়াদ, মোট ক্লাস, শিক্ষকের নাম — এগুলো এখনো নির্ধারিত হয়নি। Seed ডেটায় এগুলো খালি / "নির্ধারণ করুন" হিসেবে থাকবে; কোনো ফি বা মেয়াদ অনুমান করে বসানো হয়নি।

---

## 5. Admin Dashboard — Page Inventory / অ্যাডমিন ড্যাশবোর্ড

Sidebar-এর ১৪টি মেনু, প্রতিটির আলাদা পেজ ও কাজ:

| # | Menu | কাজ |
|---|---|---|
| 1 | Overview | Total Students, Active Students, Total Courses, Total Batches, New Admissions, Total Revenue, Total Paid, Total Due, Today's Collection, Monthly Collection — সব Sheets-এর বাস্তব ডেটা থেকে |
| 2 | Students | Student List (ID, Name, Mobile, Course, Batch, Admission Date, Total Fee, Paid, Due, Status, Action) + Search & Filter + Student Profile পেজ (Personal Info, Photo, Course Info, Payment History, Due, Attendance future-ready, Notes) |
| 3 | Admissions | নতুন আবেদন তালিকা (Pending/Approved/Rejected), Approve করলে Student ID তৈরি, Reject, বিস্তারিত দেখা |
| 4 | Courses | Add / Edit / Soft-Delete / Publish কোর্স; Delete-এর আগে Confirmation; ভর্তি থাকা শিক্ষার্থীর ইতিহাস হারাবে না |
| 5 | Batches | Batch তৈরি/Edit; Batch Name, Course, Start/End Date, Class Days, Schedule, Max Students, Enrolled, Instructor, Status |
| 6 | Payments | New Payment Entry, Partial/Full/Installment, Payment History, Method (bKash, Nagad, Rocket, Cash, Bank Transfer, Other), Transaction ID, Sender Number, Receipt (PDF/Print) |
| 7 | Due Management | Total Due, Students with Due, Student-wise Due, Course-wise Due, Partial Payment Students, Overdue Students; এক ক্লিকে বকেয়া তালিকা |
| 8 | Expense Management | Expense Entry (Teacher Salary, Internet Bill, Electricity Bill, Marketing Cost, Equipment, Office Expenses, Other); Total Collection vs Total Expenses vs Net Cash |
| 9 | Reports & Analytics | Daily/Monthly Admission Report, Course-wise Student Report, Payment Report, Due Report, Monthly Income Report, Expense Report, Financial Summary; PDF/Excel/CSV Export |
| 10 | Notifications | নতুন Admission/Payment/Due আপডেটের নোটিফিকেশন; Read/Unread; ভবিষ্যতে Email/WhatsApp যোগ করার কাঠামো |
| 11 | Website Settings | Business Name, Slogan, Address, Phone, Currency, Receipt Footer, Admission Open/Closed |
| 12 | Backup & Restore | Manual Backup, Scheduled Backup, Drive-এ Backup File, Restore (Confirmation সহ) |
| 13 | Admin Settings | Admin অ্যাকাউন্ট পরিচালনা (ভবিষ্যতে একাধিক Admin/Staff), পাসওয়ার্ড পরিবর্তন |
| 14 | Logout | Session শেষ করা |

**Dashboard Design:** Premium Modern SaaS UI, Clean Layout, Responsive Sidebar, Dashboard Cards, Modern Tables, Search & Filter, Interactive Charts, Mobile Responsive, Light & Dark Mode, Bengali Typography, Smooth Navigation। অতিরিক্ত Gradient/Animation নয় — Premium কিন্তু Simple ও Practical।

---

## 6. ID Formats / আইডি কাঠামো

| Entity | Format | Example | নিয়ম |
|---|---|---|---|
| Student ID | `RC-YYYY-NNNN` | RC-2026-0001 | প্রতি বছরে ০০০১ থেকে; কখনো duplicate হবে না |
| Application ID | `APP-YYYY-NNNN` | APP-2026-0001 | ভর্তি আবেদন জমা হলে তৈরি |
| Payment ID | `PAY-YYYY-NNNN` | PAY-2026-0001 | প্রতিটি পেমেন্টে unique |
| Expense ID | `EXP-YYYY-NNNN` | EXP-2026-0001 | প্রতিটি খরচে unique |
| Course ID | `CRS-NNN` | CRS-001 | কোর্স তৈরি হলে |
| Batch ID | `BAT-NNN` | BAT-001 | ব্যাচ তৈরি হলে |
| Notification ID | `NTF-YYYYMMDD-NNN` | NTF-20261126-001 | দৈনিক ক্রমিক |

ID নম্বর Sheets-এর বিদ্যমান সর্বোচ্চ নম্বর + 1 হিসেবে, LockService-এর ভেতরে তৈরি হয় — একই সময়ে দুইজন কাজ করলেও duplicate হবে না।

---

## 7. Payment & Due Calculation Rules / পেমেন্ট ও বকেয়া হিসাবের নিয়ম

```
Total Paid     = শিক্ষার্থীর সব Payment-এর যোগফল (Payments শিট থেকে)
Remaining Due  = Final Course Fee − Total Paid
Payment Status (স্বয়ংক্রিয়):
  Total Paid = 0                    → Unpaid
  0 < Total Paid < Final Fee        → Partial Paid
  Total Paid = Final Fee            → Paid
  Total Paid > Final Fee            → Overpaid / Refund Pending
```

- প্রতিটি পেমেন্ট আলাদা সারি হিসেবে সংরক্ষিত থাকবে — পুরোনো পেমেন্ট কখনো Overwrite করা হবে না।
- Payment Entry ও Fee Update (Paid/Due/Status) **একই LockService লেনদেনে** সম্পন্ন হবে — হিসাবের অসামঞ্জস্য হবে না।
- **বকেয়া টাকা ≠ আদায় করা টাকা।** Due হলো এখনো পাওনা; Collection হলো বাস্তবে হাতে আসা টাকা।
- **Net Cash Position = Actual Collected Amount − Recorded Expenses।**
- Payment Receipt-এ থাকবে: Logo, Student Name, Student ID, Course Name, Payment ID, Payment Date, Paid Amount, Remaining Due, Payment Method, Authorized Signature Space। Receipt PDF Download ও Print করা যাবে।

**Student Status:** Active, Pending, Completed, Inactive, Cancelled।

---

## 8. Security Model / নিরাপত্তা

- অ্যাডমিন পাসওয়ার্ড **কখনো Frontend Source Code-এ থাকবে না**; `Code.gs`-এও কোনো hardcoded পাসওয়ার্ড নেই।
- পাসওয়ার্ড **SHA-256 hash** করে `AdminUsers` শিটে সংরক্ষিত হবে; মূল পাসওয়ার্ড কোথাও সংরক্ষিত হবে না, লগেও লেখা হবে না।
- প্রথম অ্যাডমিন অ্যাকাউন্ট তৈরি হয় `createInitialAdmin(username, tempPassword)` ফাংশন দিয়ে — মালিক Apps Script Editor থেকে **একবার** চালাবেন, তারপর ফাংশনটি মুছে ফেলবেন (বিস্তারিত `backend/Code.gs`-এ)।
- Login সফল হলে **time-limited session token** (৮ ঘণ্টা) তৈরি হয়, `AdminUsers` শিটে সংরক্ষিত হয়; প্রতিটি admin-only API কল server-side-এ token যাচাই করে।
- Session Expiration আছে; Unauthorized Request Block করা হয়।
- Google Sheets **Public করা হবে না** — শুধু মালিকের অ্যাকাউন্টে থাকবে।
- Public API (কোর্স তালিকা, ব্যাচ তালিকা, ভর্তি ফরম) থেকে শিক্ষার্থীর ব্যক্তিগত তথ্য (মোবাইল, ঠিকানা, পেমেন্ট) কখনো প্রকাশ করা হবে না।
- **LockService:** সব লেখা (write) অপারেশন `LockService.getScriptLock()`-এর ভেতরে — একাধিক অ্যাডমিন একই সময়ে কাজ করলেও Duplicate/Conflicting ডেটা হবে না।
- **Soft Delete / Archive:** Delete-এর পরিবর্তে `IsArchived = TRUE` বা Status = Archived; ইতিহাস হারায় না। ভর্তি থাকা কোর্স Delete করা যাবে না।
- **Duplicate Transaction ID:** একই Transaction ID দিয়ে দ্বিতীয় পেমেন্ট/আবেদন গ্রহণ করা হবে না।

---

## 9. Backup Model / ব্যাকআপ

- **Manual Backup:** Dashboard → Backup & Restore → "Backup Now" — পুরো Spreadsheet-এর কপি Drive-এ `REDUAN_COMPUTER_DATABASE_BACKUPS` ফোল্ডারে তারিখসহ নামে সংরক্ষিত হয়।
- **Scheduled Backup:** Apps Script Time Trigger (যেমন প্রতিদিন রাত ১১টা) দিয়ে স্বয়ংক্রিয় ব্যাকআপ — মালিকের অনুমতি নিয়ে চালু করা হবে।
- **Restore:** Backup ফাইল থেকে Restore করার আগে Confirmation চাওয়া হবে; ভুল করে Database Overwrite/Delete করা যাবে না। Restore শুধু মালিকের অ্যাকাউন্ট থেকে করা যাবে।
- প্রতিটি Backup-এ থাকবে: Backup Date, File Name, Drive Link।

---

## 10. Google Permissions Needed (Owner Approval Required) / প্রয়োজনীয় অনুমতি

⚠️ **এই ধাপে এখনো কোনো Google Account পরিবর্তন করা হয়নি।** নিচের অনুমতিগুলো লাগবে — মালিক নিজে Google-এর Authorization Screen থেকে Sign In করে Approve করবেন। পাসওয়ার্ড কখনো চ্যাটে চাওয়া হবে না।

| Permission | কেন লাগবে |
|---|---|
| Google Drive — Folder Creation | `REDUAN_COMPUTER_DATABASE` ও ব্যাকআপ ফোল্ডার তৈরি |
| Google Sheets — Creation | `REDUAN_COMPUTER_MASTER_DATABASE` Spreadsheet তৈরি |
| Google Sheets — Read/Write | সব ডেটা পড়া ও লেখা |
| Google Apps Script — Deployment | Web App হিসেবে Backend Deploy করা |
| Google Drive — File Copy (Backup) | Spreadsheet-এর ব্যাকআপ কপি তৈরি |

মালিকের অনুমতি ছাড়া কোনো Google Drive File Delete করা হবে না।

---

## 11. Execution Plan — 12 Phases / বাস্তবায়ন পরিকল্পনা

| Phase | কাজ | Status | মালিকের অনুমতি লাগবে? |
|---|---|---|---|
| 1 | Project Architecture ও UI/UX Planning | ✅ চলছে (এই ডকুমেন্ট + DATABASE.md + Code.gs) | না |
| 2 | Public Website Development | ⏳ | না (ডিজাইন অনুমোদন ভালো) |
| 3 | Admin Dashboard Development | ⏳ | না |
| 4 | Google Drive ও Google Sheets Database Setup | ⏳ | ✅ হ্যাঁ — Google Authorization |
| 5 | Google Apps Script Backend Development | ⏳ | ✅ হ্যাঁ — Web App Deploy |
| 6 | Authentication ও Security Implementation | ⏳ | ✅ হ্যাঁ — Initial Admin তৈরি |
| 7 | Admission, Student, Course, Batch ও Payment Modules | ⏳ | না |
| 8 | Reports, Expenses ও Backup System | ⏳ | ✅ হ্যাঁ — Scheduled Backup Trigger |
| 9 | Frontend ও Backend Integration | ⏳ | না |
| 10 | Full Testing ও Bug Fixing | ⏳ | না (টেস্ট ডেটা Demo হিসেবে চিহ্নিত থাকবে) |
| 11 | GitHub Repository Publishing | ⏳ | না |
| 12 | Public Website ও Admin Dashboard Live Deployment | ⏳ | না |

**নিয়ম:** কোনো গুরুত্বপূর্ণ কাজ অসম্পূর্ণ রেখে পরের Phase-এ যাওয়া হবে না। প্রতিটি Phase শেষে Progress Report দেওয়া হবে।

---

## 12. Decisions Needed from the Owner / মালিকের সিদ্ধান্ত প্রয়োজন

1. **Initial Admin Username** — ডিফল্ট হিসেবে `admin` ব্যবহার করা হবে কি না (সিদ্ধান্ত না জানালে `admin` ধরা হবে; পাসওয়ার্ড মালিক নিজে তৈরি করবেন)।
2. **কোর্সের ফি, মেয়াদ, মোট ক্লাস, শিক্ষকের নাম** — এগুলো এখনো নির্ধারিত হয়নি; Seed ডেটায় খালি থাকবে। অ্যাডমিন Dashboard থেকে পরে বসাতে হবে।
3. **Google Authorization** — Phase 4 শুরু করার আগে মালিকের অনুমতি লাগবে (উপরে §10 দেখুন)।
4. **Payment Sender / bKash/Nagad নম্বর** — ভর্তি ফরমে কোন নম্বরে টাকা পাঠাতে হবে তা Settings-এ বসাতে হবে (এখনো জানানো হয়নি — অনুমান করে বসানো হয়নি)।
5. **Admission Open/Closed** — শুরুতে Admission খোলা থাকবে কি না (ডিফল্ট: খোলা)।
