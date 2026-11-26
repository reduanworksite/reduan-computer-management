/* ============================================================================
 * REDUAN COMPUTER — Course Management System
 * config.js — একটাই জায়গায় সব কনফিগারেশন
 * ----------------------------------------------------------------------------
 * APPS_SCRIPT_URL: Google Apps Script Web App-এর URL এখানে বসান (Phase 5-এ
 * Deploy করার পর)। খালি ('') থাকলে সাইট "Backend সংযুক্ত হয়নি" অবস্থা
 * দেখাবে — কোনো ভুয়া ডেটা দেখাবে না।
 * ========================================================================== */
window.RC_CONFIG = {
  /* Google Apps Script Web App URL — Deploy করার পর এখানে বসান। */
  APPS_SCRIPT_URL: '',

  /* ব্যবসার তথ্য (মালিকের দেওয়া আসল তথ্য — অনুমান করা কিছু নেই)। */
  BUSINESS_NAME: 'REDUAN COMPUTER',
  BUSINESS_NAME_BN: 'রেদুয়ান কম্পিউটার',
  SLOGAN: 'শিখুন দক্ষতা, গড়ুন সফল ক্যারিয়ার।',
  ADDRESS: 'হোসেনপুর থানা মসজিদ সংলগ্ন, হোসেনপুর, কিশোরগঞ্জ, বাংলাদেশ।',
  PHONE: '01410645030',
  CURRENCY: '৳',

  /* Seed কোর্সের নাম (শুধু নাম — ফি/মেয়াদ/ক্লাস অ্যাডমিন পরে বসাবেন)। */
  SEED_COURSES: [
    'Microsoft Office + Google Workspace',
    'Basic Computer',
    'Digital Marketing',
    'Basic Graphics Design',
    'Computer Fundamentals'
  ],

  /* পেমেন্ট মাধ্যম (DATABASE.md অনুযায়ী)। */
  PAYMENT_METHODS: ['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer', 'Other'],

  /* খরচের বিভাগ (DATABASE.md অনুযায়ী)। */
  EXPENSE_CATEGORIES: [
    'Teacher Salary', 'Internet Bill', 'Electricity Bill',
    'Marketing Cost', 'Equipment', 'Office Expenses', 'Other'
  ],

  /* শিক্ষার্থীর অবস্থা। */
  STUDENT_STATUSES: ['Active', 'Pending', 'Completed', 'Inactive', 'Cancelled'],

  /* সেশন: Code.gs-এ SESSION_HOURS = 8। */
  SESSION_KEY: 'rc_admin_token',
  SESSION_EXPIRY_KEY: 'rc_admin_expiry',
  SESSION_USER_KEY: 'rc_admin_user'
};
