# REDUAN COMPUTER — Database Structure
## ডেটাবেস কাঠামো (Phase 1)

**Spreadsheet:** `REDUAN_COMPUTER_MASTER_DATABASE`
**Drive Folder:** `REDUAN_COMPUTER_DATABASE`
**Sheets:** 10টি — Students, Courses, Batches, Admissions, Payments, Expenses, AdminUsers, Notifications, Settings, ActivityLogs

নিয়ম (সব শিটে প্রযোজ্য):
- Row 1 = Header (English header, ঠিক যেমন নিচে লেখা আছে)।
- প্রতিটি Record-এর Unique ID থাকবে; Student ID, Payment ID, Transaction ID কখনো Duplicate হবে না।
- Delete-এর পরিবর্তে Soft Delete / Archive (`IsArchived = TRUE` বা Status = Archived)।
- প্রতিটি লেখা/আপডেটে `UpdatedAt` timestamp বসবে।
- টাকার অঙ্ক সবসময় সংখ্যা (Number), টাকা চিহ্ন (৳) শুধু দেখানোর সময় বসবে।

মোট কলাম: **120টি** (10টি শিটে)।

---

## 1. Students — শিক্ষার্থী (23 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | StudentID | শিক্ষার্থী আইডি | Text | Unique, Required, Format RC-YYYY-NNNN |
| 2 | FullName | শিক্ষার্থীর নাম | Text | Required |
| 3 | FatherName | পিতার নাম | Text | Required |
| 4 | MotherName | মাতার নাম | Text | Required |
| 5 | Mobile | মোবাইল নম্বর | Text | Required (11 digit, 01XXXXXXXXX) |
| 6 | AltMobile | বিকল্প মোবাইল | Text | Optional |
| 7 | Email | ইমেইল | Text | Optional |
| 8 | PresentAddress | বর্তমান ঠিকানা | Text | Required |
| 9 | CourseID | কোর্স আইডি | Text | Required (Courses শিটের রেফারেন্স) |
| 10 | CourseName | কোর্সের নাম | Text | Required (denormalized, রিপোর্টের জন্য) |
| 11 | BatchID | ব্যাচ আইডি | Text | Required (Batches শিটের রেফারেন্স) |
| 12 | BatchName | ব্যাচের নাম | Text | Required |
| 13 | AdmissionDate | ভর্তির তারিখ | Date | Required (YYYY-MM-DD) |
| 14 | TotalFee | মোট কোর্স ফি | Number | Required (Final Course Fee) |
| 15 | PaidAmount | পরিশোধিত টাকা | Number | Auto-sum of Payments, কখনো হাতে লেখা নয় |
| 16 | DueAmount | বকেয়া টাকা | Number | Auto: TotalFee − PaidAmount |
| 17 | PaymentStatus | পেমেন্ট অবস্থা | Text | Auto: Unpaid / Partial Paid / Paid / Overpaid |
| 18 | Status | শিক্ষার্থীর অবস্থা | Text | Active / Pending / Completed / Inactive / Cancelled |
| 19 | PhotoURL | ছবি (ঐচ্ছিক) | Text | Optional (Drive link) |
| 20 | Notes | মন্তব্য | Text | Optional |
| 21 | CreatedAt | তৈরির সময় | DateTime | Auto |
| 22 | UpdatedAt | আপডেটের সময় | DateTime | Auto |
| 23 | IsArchived | আর্কাইভ করা | Boolean | Default FALSE; TRUE হলে তালিকায় দেখাবে না |

---

## 2. Courses — কোর্স (15 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | CourseID | কোর্স আইডি | Text | Unique, Required, Format CRS-NNN |
| 2 | CourseName | কোর্সের নাম (English) | Text | Required |
| 3 | CourseNameBn | কোর্সের নাম (বাংলা) | Text | Optional |
| 4 | Description | বিবরণ | Text | Required |
| 5 | ImageURL | কোর্সের ছবি | Text | Optional (Drive link) |
| 6 | Duration | মেয়াদ | Text | Admin-editable (যেমন "৩ মাস") — Seed-এ খালি |
| 7 | TotalClasses | মোট ক্লাস | Number | Admin-editable — Seed-এ খালি |
| 8 | RegularFee | নিয়মিত ফি (৳) | Number | Admin-editable — Seed-এ খালি |
| 9 | Discount | ছাড় (৳) | Number | Default 0 |
| 10 | FinalFee | চূড়ান্ত ফি (৳) | Number | Auto: RegularFee − Discount |
| 11 | Status | কোর্সের অবস্থা | Text | Draft / Published / Closed / Archived |
| 12 | AdmissionDeadline | ভর্তির শেষ তারিখ | Date | Optional |
| 13 | CreatedAt | তৈরির সময় | DateTime | Auto |
| 14 | UpdatedAt | আপডেটের সময় | DateTime | Auto |
| 15 | IsArchived | আর্কাইভ করা | Boolean | Default FALSE |

**Seed Courses (শুধু নাম — ফি/মেয়াদ/ক্লাস খালি থাকবে, অ্যাডমিন পরে বসাবেন):**
1. Microsoft Office + Google Workspace
2. Basic Computer
3. Digital Marketing
4. Basic Graphics Design
5. Computer Fundamentals

---

## 3. Batches — ব্যাচ (14 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | BatchID | ব্যাচ আইডি | Text | Unique, Required, Format BAT-NNN |
| 2 | BatchName | ব্যাচের নাম | Text | Required (যেমন "Microsoft Office – Batch 01") |
| 3 | CourseID | কোর্স আইডি | Text | Required |
| 4 | CourseName | কোর্সের নাম | Text | Required |
| 5 | StartDate | শুরুর তারিখ | Date | Required |
| 6 | EndDate | শেষের তারিখ | Date | Optional |
| 7 | ClassDays | ক্লাসের দিন | Text | যেমন "শনি, সোম, বুধ" |
| 8 | ClassSchedule | ক্লাসের সময় | Text | যেমন "বিকাল ৪টা – ৫টা" |
| 9 | MaxStudents | সর্বোচ্চ শিক্ষার্থী | Number | Required |
| 10 | EnrolledStudents | ভর্তি শিক্ষার্থী | Number | Auto-count (ভর্তি হলে বাড়ে) |
| 11 | InstructorName | শিক্ষকের নাম | Text | Admin-editable — Seed-এ খালি |
| 12 | Status | ব্যাচের অবস্থা | Text | Upcoming / Ongoing / Completed / Closed |
| 13 | CreatedAt | তৈরির সময় | DateTime | Auto |
| 14 | UpdatedAt | আপডেটের সময় | DateTime | Auto |

---

## 4. Admissions — ভর্তি আবেদন (21 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | ApplicationID | আবেদন আইডি | Text | Unique, Required, Format APP-YYYY-NNNN |
| 2 | StudentName | শিক্ষার্থীর নাম | Text | Required |
| 3 | FatherName | পিতার নাম | Text | Required |
| 4 | MotherName | মাতার নাম | Text | Required |
| 5 | Mobile | মোবাইল নম্বর | Text | Required |
| 6 | AltMobile | বিকল্প মোবাইল | Text | Optional |
| 7 | Email | ইমেইল | Text | Optional |
| 8 | PresentAddress | বর্তমান ঠিকানা | Text | Required |
| 9 | CourseID | কোর্স আইডি | Text | Required |
| 10 | CourseName | কোর্সের নাম | Text | Required |
| 11 | BatchID | ব্যাচ আইডি | Text | Required |
| 12 | BatchName | ব্যাচের নাম | Text | Required |
| 13 | AdmissionDate | ভর্তির তারিখ | Date | Required |
| 14 | PaymentMethod | পেমেন্ট মাধ্যম | Text | bKash / Nagad / Rocket / Cash / Bank Transfer / Other |
| 15 | TransactionID | ট্রানজ্যাকশন আইডি | Text | Unique — একই ID দিয়ে দ্বিতীয় আবেদন/পেমেন্ট নয় |
| 16 | SenderNumber | প্রেরকের নম্বর | Text | Required (যদি মোবাইল পেমেন্ট হয়) |
| 17 | PaidAmount | জমা দেওয়া টাকা | Number | Default 0 |
| 18 | AdditionalInfo | অতিরিক্ত তথ্য | Text | Optional |
| 19 | Status | আবেদনের অবস্থা | Text | Pending / Approved / Rejected |
| 20 | CreatedAt | তৈরির সময় | DateTime | Auto |
| 21 | UpdatedAt | আপডেটের সময় | DateTime | Auto |

---

## 5. Payments — পেমেন্ট (12 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | PaymentID | পেমেন্ট আইডি | Text | Unique, Required, Format PAY-YYYY-NNNN |
| 2 | StudentID | শিক্ষার্থী আইডি | Text | Required |
| 3 | StudentName | শিক্ষার্থীর নাম | Text | Required (denormalized) |
| 4 | CourseName | কোর্সের নাম | Text | Required |
| 5 | Amount | পরিমাণ (৳) | Number | Required, > 0 |
| 6 | PaymentDate | পেমেন্টের তারিখ | Date | Required |
| 7 | PaymentMethod | পেমেন্ট মাধ্যম | Text | bKash / Nagad / Rocket / Cash / Bank Transfer / Other |
| 8 | TransactionID | ট্রানজ্যাকশন আইডি | Text | Unique — Duplicate গ্রহণ করা হবে না |
| 9 | SenderNumber | প্রেরকের নম্বর | Text | Optional (Cash হলে খালি) |
| 10 | Notes | মন্তব্য | Text | Optional |
| 11 | ReceivedBy | গ্রহণকারী (অ্যাডমিন) | Text | Required (username) |
| 12 | CreatedAt | তৈরির সময় | DateTime | Auto |

**নিয়ম:** প্রতিটি পেমেন্ট নতুন সারি — পুরোনো পেমেন্ট কখনো Overwrite নয়। পেমেন্ট লেখা ও Students শিটের Paid/Due/Status আপডেট একই LockService লেনদেনে হয়।

---

## 6. Expenses — খরচ (9 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | ExpenseID | খরচ আইডি | Text | Unique, Required, Format EXP-YYYY-NNNN |
| 2 | Title | খরচের শিরোনাম | Text | Required |
| 3 | Category | বিভাগ | Text | Teacher Salary / Internet Bill / Electricity Bill / Marketing Cost / Equipment / Office Expenses / Other |
| 4 | Amount | পরিমাণ (৳) | Number | Required, > 0 |
| 5 | Date | তারিখ | Date | Required |
| 6 | PaymentMethod | পেমেন্ট মাধ্যম | Text | Cash / bKash / Nagad / Bank Transfer / Other |
| 7 | Description | বিবরণ | Text | Optional |
| 8 | CreatedBy | যিনি লিখেছেন | Text | Required (username) |
| 9 | CreatedAt | তৈরির সময় | DateTime | Auto |

---

## 7. AdminUsers — অ্যাডমিন ব্যবহারকারী (9 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | Username | ব্যবহারকারীর নাম | Text | Unique, Required |
| 2 | PasswordHash | পাসওয়ার্ড হ্যাশ | Text | SHA-256 hex; মূল পাসওয়ার্ড কখনো সংরক্ষিত হয় না |
| 3 | FullName | পূর্ণ নাম | Text | Required |
| 4 | Role | ভূমিকা | Text | Admin / Staff |
| 5 | IsActive | সক্রিয় | Boolean | Default TRUE |
| 6 | SessionToken | সেশন টোকেন | Text | Login-এ তৈরি, Logout-এ মুছে যায় |
| 7 | TokenExpiry | টোকেনের মেয়াদ | DateTime | Login + ৮ ঘণ্টা |
| 8 | CreatedAt | তৈরির সময় | DateTime | Auto |
| 9 | LastLoginAt | শেষ লগইন | DateTime | Auto (প্রতি সফল লগইনে) |

---

## 8. Notifications — নোটিফিকেশন (7 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | NotificationID | নোটিফিকেশন আইডি | Text | Unique, Format NTF-YYYYMMDD-NNN |
| 2 | Type | ধরন | Text | Admission / Payment / Due / System |
| 3 | Title | শিরোনাম | Text | Required |
| 4 | Message | বার্তা | Text | Required |
| 5 | RelatedID | সংশ্লিষ্ট আইডি | Text | যেমন ApplicationID বা PaymentID |
| 6 | IsRead | পড়া হয়েছে | Boolean | Default FALSE |
| 7 | CreatedAt | তৈরির সময় | DateTime | Auto |

---

## 9. Settings — সেটিংস (4 columns, Key–Value)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | Key | কী | Text | Unique, Required |
| 2 | Value | মান | Text | Required |
| 3 | Description | বিবরণ | Text | Optional |
| 4 | UpdatedAt | আপডেটের সময় | DateTime | Auto |

**Settings Keys (প্রাথমিক মান):**

| Key | Value (প্রাথমিক) | Description |
|---|---|---|
| business_name | REDUAN COMPUTER | প্রতিষ্ঠানের নাম |
| slogan | শিখুন দক্ষতা, গড়ুন সফল ক্যারিয়ার। | স্লোগান |
| address | হোসেনপুর থানা মসজিদ সংলগ্ন, হোসেনপুর, কিশোরগঞ্জ, বাংলাদেশ। | ঠিকানা |
| phone | 01410645030 | যোগাযোগ নম্বর |
| currency | ৳ | মুদ্রা (BDT) |
| receipt_footer | ধন্যবাদ — REDUAN COMPUTER | রসিদের নিচের লেখা |
| admission_open | TRUE | ভর্তি খোলা (TRUE) / বন্ধ (FALSE) |
| payment_numbers | (খালি — মালিক বসাবেন) | bKash/Nagad নম্বর — এখনো জানানো হয়নি, অনুমান করে বসানো হয়নি |

---

## 10. ActivityLogs — কার্যক্রম লগ (6 columns)

| # | Header (English) | Bengali Label | Type | Rule |
|---|---|---|---|---|
| 1 | LogID | লগ আইডি | Text | Unique (timestamp + random) |
| 2 | Timestamp | সময় | DateTime | Auto |
| 3 | Actor | কে করেছেন | Text | Username বা "Public" (ভর্তি ফরমের ক্ষেত্রে) |
| 4 | Action | কাজ | Text | যেমন "Admission Submitted", "Payment Recorded" |
| 5 | Details | বিস্তারিত | Text | সংক্ষিপ্ত বিবরণ — সংবেদনশীল তথ্য (পাসওয়ার্ড, পূর্ণ ঠিকানা) নয় |
| 6 | RelatedID | সংশ্লিষ্ট আইডি | Text | যেমন StudentID / PaymentID |

---

## সম্পর্ক (Relationships)

```
Courses (1) ──< Batches (many) ──< Students (many)
Courses (1) ──< Admissions (many)
Students (1) ──< Payments (many)
Students (1) ──< Admissions (1, যে আবেদন থেকে ভর্তি)
```

- Students.CourseID → Courses.CourseID; Students.BatchID → Batches.BatchID
- Payments.StudentID → Students.StudentID
- Admissions.CourseID / BatchID → Courses / Batches
- কোনো কোর্সে Active শিক্ষার্থী থাকলে সেই কোর্স Delete (Archive) করা যাবে না — ইতিহাস সংরক্ষিত থাকবে।
