/**
 * ============================================================================
 * REDUAN COMPUTER — Course Management System Backend
 * Google Apps Script (single file: Code.gs)
 * ============================================================================
 *
 * HOW TO SET THIS UP (owner must do this — the script cannot do it alone):
 *
 * 1. In Google Drive, create a folder named:  REDUAN_COMPUTER_DATABASE
 * 2. Inside that folder, create a Google Spreadsheet named:
 *        REDUAN_COMPUTER_MASTER_DATABASE
 * 3. Open the spreadsheet, go to Extensions > Apps Script, and paste this
 *    whole file into Code.gs (replace the default myFunction code).
 * 4. Run setupSheets() ONCE from the editor. It creates all 10 sheets with
 *    their headers (and the default Settings rows) if they are missing.
 *    Apps Script CANNOT create the Drive folder / spreadsheet by itself in a
 *    safe, owner-approved way, which is why steps 1-2 are manual.
 * 5. Run createInitialAdmin('admin', 'YOUR-TEMP-PASSWORD') ONCE from the
 *    editor, then DELETE that function call / the function itself, and
 *    change the password from the Admin Dashboard afterwards.
 * 6. Deploy > New deployment > Web app. Execute as: Me. Who has access:
 *    "Anyone" (the script itself checks the admin token on every admin
 *    action — the spreadsheet itself stays PRIVATE and is never shared).
 * 7. Copy the Web App URL into the frontend config (public/js/api.js and
 *    admin/js/admin.js) as API_URL.
 *
 * SECURITY:
 * - No password is hardcoded anywhere in this file.
 * - Admin passwords are stored only as SHA-256 hashes in the AdminUsers
 *   sheet. Passwords are never logged.
 * - Every admin-only action verifies a time-limited session token
 *   server-side (verifyToken). Tokens live 8 hours.
 * - All writes run inside LockService.getScriptLock() so two admins
 *   working at the same time cannot create duplicate IDs or conflicting
 *   totals.
 * - The spreadsheet is NEVER shared publicly. The public API only returns
 *   course/batch listings — never student personal data.
 * - Deletes are soft deletes (IsArchived / Status), never hard deletes.
 *
 * API CONTRACT: every response is JSON: { ok: true, data: ... }
 * or { ok: false, error: "..." }. Actions arrive as ?action=... (GET)
 * or { "action": "...", ... } in the POST body.
 * ============================================================================
 */

/* ------------------------------------------------------------------ */
/* Sheet definitions — must match DATABASE.md exactly.                 */
/* ------------------------------------------------------------------ */
var SHEET_DEFS = {
  Students: ['StudentID', 'FullName', 'FatherName', 'MotherName', 'Mobile',
    'AltMobile', 'Email', 'PresentAddress', 'CourseID', 'CourseName',
    'BatchID', 'BatchName', 'AdmissionDate', 'TotalFee', 'PaidAmount',
    'DueAmount', 'PaymentStatus', 'Status', 'PhotoURL', 'Notes',
    'CreatedAt', 'UpdatedAt', 'IsArchived'],
  Courses: ['CourseID', 'CourseName', 'CourseNameBn', 'Description',
    'ImageURL', 'Duration', 'TotalClasses', 'RegularFee', 'Discount',
    'FinalFee', 'Status', 'AdmissionDeadline', 'CreatedAt', 'UpdatedAt',
    'IsArchived'],
  Batches: ['BatchID', 'BatchName', 'CourseID', 'CourseName', 'StartDate',
    'EndDate', 'ClassDays', 'ClassSchedule', 'MaxStudents',
    'EnrolledStudents', 'InstructorName', 'Status', 'CreatedAt',
    'UpdatedAt'],
  Admissions: ['ApplicationID', 'StudentName', 'FatherName', 'MotherName',
    'Mobile', 'AltMobile', 'Email', 'PresentAddress', 'CourseID',
    'CourseName', 'BatchID', 'BatchName', 'AdmissionDate', 'PaymentMethod',
    'TransactionID', 'SenderNumber', 'PaidAmount', 'AdditionalInfo',
    'Status', 'CreatedAt', 'UpdatedAt'],
  Payments: ['PaymentID', 'StudentID', 'StudentName', 'CourseName',
    'Amount', 'PaymentDate', 'PaymentMethod', 'TransactionID',
    'SenderNumber', 'Notes', 'ReceivedBy', 'CreatedAt'],
  Expenses: ['ExpenseID', 'Title', 'Category', 'Amount', 'Date',
    'PaymentMethod', 'Description', 'CreatedBy', 'CreatedAt'],
  AdminUsers: ['Username', 'PasswordHash', 'FullName', 'Role', 'IsActive',
    'SessionToken', 'TokenExpiry', 'CreatedAt', 'LastLoginAt'],
  Notifications: ['NotificationID', 'Type', 'Title', 'Message', 'RelatedID',
    'IsRead', 'CreatedAt'],
  Settings: ['Key', 'Value', 'Description', 'UpdatedAt'],
  ActivityLogs: ['LogID', 'Timestamp', 'Actor', 'Action', 'Details',
    'RelatedID']
};

/* Default Settings rows (business facts given by the owner). */
var DEFAULT_SETTINGS = [
  ['business_name', 'REDUAN COMPUTER', 'Business name'],
  ['slogan', 'শিখুন দক্ষতা, গড়ুন সফল ক্যারিয়ার।', 'Slogan'],
  ['address', 'হোসেনপুর থানা মসজিদ সংলগ্ন, হোসেনপুর, কিশোরগঞ্জ, বাংলাদেশ।', 'Address'],
  ['phone', '01410645030', 'Contact number'],
  ['currency', '৳', 'Currency (BDT)'],
  ['receipt_footer', 'ধন্যবাদ — REDUAN COMPUTER', 'Receipt footer text'],
  ['admission_open', 'TRUE', 'Admission open (TRUE) / closed (FALSE)'],
  ['payment_numbers', '', 'bKash/Nagad numbers — owner to fill in (not guessed)']
];

/* Seed courses — names only. Fee / duration / class count are left blank
 * on purpose: the owner has not set them yet. The admin edits them later
 * from the Dashboard. Do NOT invent fees here. */
var SEED_COURSES = [
  ['CRS-001', 'Microsoft Office + Google Workspace', 'মাইক্রোসফট অফিস + গুগল ওয়ার্কস্পেস',
   'অফিস অ্যাপ্লিকেশন ও গুগল ওয়ার্কস্পেস শিখুন — ডকুমেন্ট, স্প্রেডশিট, প্রেজেন্টেশন ও ইমেইল।',
   '', '', '', '', 0, '', 'Published', '', '', '', false],
  ['CRS-002', 'Basic Computer', 'বেসিক কম্পিউটার',
   'কম্পিউটারের একদম শুরু থেকে — হার্ডওয়্যার, সফটওয়্যার, ইন্টারনেট ও ইমেইল।',
   '', '', '', '', 0, '', 'Published', '', '', '', false],
  ['CRS-003', 'Digital Marketing', 'ডিজিটাল মার্কেটিং',
   'অনলাইন মার্কেটিং, সোশ্যাল মিডিয়া, SEO ও বিজ্ঞাপন — বাস্তব কাজ শিখুন।',
   '', '', '', '', 0, '', 'Published', '', '', '', false],
  ['CRS-004', 'Basic Graphics Design', 'বেসিক গ্রাফিক্স ডিজাইন',
   'ডিজাইনের মূলনীতি ও জনপ্রিয় ডিজাইন টুল দিয়ে সুন্দর ডিজাইন তৈরি করা শিখুন।',
   '', '', '', '', 0, '', 'Published', '', '', '', false],
  ['CRS-005', 'Computer Fundamentals', 'কম্পিউটার ফান্ডামেন্টালস',
   'কম্পিউটারের মৌলিক ধারণা, অপারেটিং সিস্টেম ও দৈনন্দিন ব্যবহার।',
   '', '', '', '', 0, '', 'Published', '', '', '', false]
];

var SESSION_HOURS = 8;          /* admin session lifetime */
var LOCK_WAIT_MS = 30000;       /* max wait for the script lock */
var BACKUP_FOLDER = 'REDUAN_COMPUTER_DATABASE_BACKUPS';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function getSheet(name) {
  var sh = ss().getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name + ' — run setupSheets() first.');
  return sh;
}

/* Read a sheet as an array of objects keyed by header name. */
function readAll(name) {
  var sh = getSheet(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) row[headers[j]] = values[i][j];
    row.__row = i + 1; /* 1-based sheet row, for updates */
    out.push(row);
  }
  return out;
}

/* Append one row (array, in header order) and return the new row number. */
function appendRow(name, rowArr) {
  var sh = getSheet(name);
  sh.appendRow(rowArr);
  return sh.getLastRow();
}

/* Update specific columns of a row by its 1-based row number. */
function updateRowCells(name, rowNum, colValueMap) {
  var sh = getSheet(name);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(colValueMap).forEach(function (col) {
    var idx = headers.indexOf(col);
    if (idx >= 0) sh.getRange(rowNum, idx + 1).setValue(colValueMap[col]);
  });
}

function now() { return new Date(); }
function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
    '-' + ('0' + d.getDate()).slice(-2);
}
function yearStr() { return String(new Date().getFullYear()); }

function toNum(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
function isTrue(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

/* SHA-256 hex digest (password hashing). Never log the input. */
function sha256Hex(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/* Next sequential ID: prefix + year + '-' + zero-padded number, based on
 * the highest existing number in that sheet/column. Call inside a lock. */
function nextId(sheetName, idColumn, prefix, padLen) {
  var rows = readAll(sheetName);
  var max = 0;
  var re = new RegExp('^' + prefix + '-(\\d+)$');
  rows.forEach(function (r) {
    var m = re.exec(String(r[idColumn] || ''));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  var n = String(max + 1);
  while (n.length < padLen) n = '0' + n;
  return prefix + '-' + n;
}
function nextYearId(sheetName, idColumn, prefix) {
  return prefix + '-' + yearStr() + '-' + nextId(sheetName, idColumn, prefix + '-' + yearStr(), 4).split('-').pop();
}

/* Run fn while holding the script lock (all writes go through this). */
function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try { return fn(); }
  finally { lock.releaseLock(); }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function ok(data) { return jsonOut({ ok: true, data: data }); }
function fail(msg) { return jsonOut({ ok: false, error: msg }); }

/* Activity log — never store passwords or full addresses here. */
function logActivity(actor, action, details, relatedId) {
  try {
    appendRow('ActivityLogs', [
      'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      now(), actor, action, String(details || '').slice(0, 500), relatedId || ''
    ]);
  } catch (e) { /* logging must never break the main action */ }
}

function addNotification(type, title, message, relatedId) {
  var rows = readAll('Notifications');
  var today = todayStr().replace(/-/g, '');
  var countToday = rows.filter(function (r) {
    return String(r.NotificationID || '').indexOf('NTF-' + today) === 0;
  }).length;
  var n = String(countToday + 1);
  while (n.length < 3) n = '0' + n;
  appendRow('Notifications', [
    'NTF-' + today + '-' + n, type, title, message, relatedId || '', false, now()
  ]);
}

/* Settings helpers */
function getSetting(key) {
  var rows = readAll('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Key === key) return rows[i].Value;
  }
  return '';
}
function setSetting(key, value) {
  var rows = readAll('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Key === key) {
      updateRowCells('Settings', rows[i].__row, { Value: value, UpdatedAt: now() });
      return;
    }
  }
  appendRow('Settings', [key, value, '', now()]);
}

/* ------------------------------------------------------------------ */
/* Auth: login token stored in AdminUsers (token + expiry).             */
/* ------------------------------------------------------------------ */
function findAdmin(username) {
  var rows = readAll('AdminUsers');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Username) === String(username)) return rows[i];
  }
  return null;
}

/* Returns the admin row if the token is valid, otherwise null. */
function verifyToken(token) {
  if (!token) return null;
  var rows = readAll('AdminUsers');
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.SessionToken && String(r.SessionToken) === String(token) && isTrue(r.IsActive)) {
      var exp = r.TokenExpiry ? new Date(r.TokenExpiry) : null;
      if (exp && exp.getTime() > Date.now()) return r;
    }
  }
  return null;
}

/* Throws unless p.token belongs to a logged-in admin. Returns admin row. */
function requireAdmin(p) {
  var admin = verifyToken(p.token);
  if (!admin) throw new Error('Unauthorized — please log in again.');
  return admin;
}

function paymentStatusFor(totalFee, paid) {
  totalFee = toNum(totalFee); paid = toNum(paid);
  if (paid <= 0) return 'Unpaid';
  if (paid < totalFee) return 'Partial Paid';
  if (paid === totalFee) return 'Paid';
  return 'Overpaid';
}

/* ------------------------------------------------------------------ */
/* Setup — run ONCE from the Apps Script editor.                       */
/* ------------------------------------------------------------------ */
function setupSheets() {
  var book = ss();
  Object.keys(SHEET_DEFS).forEach(function (name) {
    var sh = book.getSheetByName(name);
    if (!sh) {
      sh = book.insertSheet(name);
      sh.getRange(1, 1, 1, SHEET_DEFS[name].length).setValues([SHEET_DEFS[name]]);
      sh.setFrozenRows(1);
    } else if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SHEET_DEFS[name].length).setValues([SHEET_DEFS[name]]);
      sh.setFrozenRows(1);
    }
  });
  /* Default Settings rows (only missing keys). */
  var existing = readAll('Settings').map(function (r) { return r.Key; });
  DEFAULT_SETTINGS.forEach(function (row) {
    if (existing.indexOf(row[0]) === -1) {
      appendRow('Settings', [row[0], row[1], row[2], now()]);
    }
  });
  /* Seed courses (only if Courses sheet is empty apart from header). */
  if (readAll('Courses').length === 0) {
    SEED_COURSES.forEach(function (row) {
      var r = row.slice();
      r[12] = now(); /* CreatedAt */
      r[13] = now(); /* UpdatedAt */
      appendRow('Courses', r);
    });
  }
  return 'Setup complete: 10 sheets, settings and 5 seed courses ready.';
}

/**
 * ONE-TIME initial admin creation.
 * The owner runs this ONCE from the editor, e.g.
 *   createInitialAdmin('admin', 'Choose-A-Strong-Password')
 * then DELETES this function (or at least never runs it again with a
 * known password) and changes the password from the Dashboard.
 * The password is hashed immediately and never stored or logged.
 */
function createInitialAdmin(username, tempPassword) {
  if (!username || !tempPassword || tempPassword.length < 8) {
    throw new Error('Username and a password of at least 8 characters are required.');
  }
  return withLock(function () {
    if (findAdmin(username)) throw new Error('Admin already exists: ' + username);
    appendRow('AdminUsers', [
      username, sha256Hex(tempPassword), username, 'Admin', true, '', '', now(), ''
    ]);
    logActivity(username, 'Admin Created', 'Initial admin account created.', '');
    return 'Admin "' + username + '" created. Now delete this function and change the password.';
  });
}

/* ------------------------------------------------------------------ */
/* HTTP entry points — JSON API router                                  */
/* ------------------------------------------------------------------ */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    return route(p.action, p);
  } catch (err) {
    return fail(err.message || String(err));
  }
}

function doPost(e) {
  try {
    var p = {};
    if (e && e.postData && e.postData.contents) {
      p = JSON.parse(e.postData.contents);
    }
    return route(p.action, p);
  } catch (err) {
    return fail(err.message || String(err));
  }
}

function route(action, p) {
  switch (action) {
    /* Public (no login) */
    case 'publicGetCourses': return ok(publicGetCourses());
    case 'publicGetBatches': return ok(publicGetBatches(p.courseId));
    case 'submitAdmission': return ok(submitAdmission(p));
    case 'getSettingsPublic': return ok(getSettingsPublic());
    /* Auth */
    case 'adminLogin': return ok(adminLogin(p));
    case 'verifyToken': return ok({ valid: !!verifyToken(p.token) });
    case 'adminLogout': return ok(adminLogout(p));
    case 'changePassword': return ok(changePassword(p));
    /* Admin-only */
    case 'getDashboardStats': return ok(getDashboardStats(p));
    case 'getStudents': return ok(getStudents(p));
    case 'searchStudents': return ok(searchStudents(p));
    case 'createStudent': return ok(createStudent(p));
    case 'updateStudent': return ok(updateStudent(p));
    case 'getAdmissions': return ok(getAdmissions(p));
    case 'approveAdmission': return ok(approveAdmission(p));
    case 'rejectAdmission': return ok(rejectAdmission(p));
    case 'createCourse': return ok(createCourse(p));
    case 'updateCourse': return ok(updateCourse(p));
    case 'deleteCourse': return ok(deleteCourse(p));
    case 'getCourses': return ok(getCourses(p));
    case 'createBatch': return ok(createBatch(p));
    case 'updateBatch': return ok(updateBatch(p));
    case 'getBatches': return ok(getBatches(p));
    case 'recordPayment': return ok(recordPayment(p));
    case 'getPaymentHistory': return ok(getPaymentHistory(p));
    case 'createExpense': return ok(createExpense(p));
    case 'getExpenses': return ok(getExpenses(p));
    case 'getReports': return ok(getReports(p));
    case 'createBackup': return ok(createBackup(p));
    case 'getNotifications': return ok(getNotifications(p));
    case 'markNotificationRead': return ok(markNotificationRead(p));
    case 'getSettings': return ok(getSettings(p));
    case 'updateSettings': return ok(updateSettings(p));
    default: return fail('Unknown action: ' + action);
  }
}

/* ------------------------------------------------------------------ */
/* Public actions (no admin token needed)                               */
/* ------------------------------------------------------------------ */

/* Only published, non-archived courses — no internal data. */
function publicGetCourses() {
  return readAll('Courses')
    .filter(function (c) { return c.Status === 'Published' && !isTrue(c.IsArchived); })
    .map(function (c) {
      return {
        courseId: c.CourseID, name: c.CourseName, nameBn: c.CourseNameBn,
        description: c.Description, imageUrl: c.ImageURL,
        duration: c.Duration, totalClasses: c.TotalClasses,
        regularFee: toNum(c.RegularFee), discount: toNum(c.Discount),
        finalFee: toNum(c.FinalFee), admissionDeadline: c.AdmissionDeadline
      };
    });
}

/* Batches of one course that still have seats (public-safe fields only). */
function publicGetBatches(courseId) {
  if (!courseId) throw new Error('courseId is required.');
  return readAll('Batches')
    .filter(function (b) {
      return b.CourseID === courseId &&
        (b.Status === 'Upcoming' || b.Status === 'Ongoing') &&
        toNum(b.EnrolledStudents) < toNum(b.MaxStudents);
    })
    .map(function (b) {
      return {
        batchId: b.BatchID, batchName: b.BatchName, startDate: b.StartDate,
        classDays: b.ClassDays, classSchedule: b.ClassSchedule,
        seatsLeft: toNum(b.MaxStudents) - toNum(b.EnrolledStudents)
      };
    });
}

/* Public settings needed by the website (name, slogan, contact...). */
function getSettingsPublic() {
  return {
    business_name: getSetting('business_name'),
    slogan: getSetting('slogan'),
    address: getSetting('address'),
    phone: getSetting('phone'),
    currency: getSetting('currency'),
    admission_open: isTrue(getSetting('admission_open')),
    payment_numbers: getSetting('payment_numbers')
  };
}

/**
 * Public admission submit.
 * - Rejects when admissions are closed, required fields are missing,
 *   the course/batch does not exist, the batch is full, or the
 *   Transaction ID was already used (in Admissions or Payments).
 * - Creates the Application ID + Admissions row + notification + log,
 *   all inside one lock.
 */
function submitAdmission(p) {
  if (!isTrue(getSetting('admission_open'))) {
    throw new Error('Admission is currently closed. Please contact us.');
  }
  var required = ['studentName', 'fatherName', 'motherName', 'mobile',
    'presentAddress', 'courseId', 'batchId', 'admissionDate'];
  required.forEach(function (f) {
    if (!p[f] || String(p[f]).trim() === '') throw new Error('Missing required field: ' + f);
  });
  if (!/^01[3-9]\d{8}$/.test(String(p.mobile).replace(/[\s-]/g, ''))) {
    throw new Error('Please enter a valid 11-digit Bangladeshi mobile number.');
  }
  return withLock(function () {
    var courses = readAll('Courses');
    var course = null;
    courses.forEach(function (c) { if (c.CourseID === p.courseId) course = c; });
    if (!course || isTrue(course.IsArchived)) throw new Error('Selected course is not available.');
    var batches = readAll('Batches');
    var batch = null;
    batches.forEach(function (b) { if (b.BatchID === p.batchId) batch = b; });
    if (!batch) throw new Error('Selected batch is not available.');
    if (toNum(batch.EnrolledStudents) >= toNum(batch.MaxStudents)) {
      throw new Error('This batch is full. Please choose another batch.');
    }
    /* Duplicate Transaction ID check (Admissions + Payments). */
    if (p.transactionId) {
      var dup = false;
      readAll('Admissions').forEach(function (a) {
        if (a.TransactionID && String(a.TransactionID) === String(p.transactionId)) dup = true;
      });
      readAll('Payments').forEach(function (py) {
        if (py.TransactionID && String(py.TransactionID) === String(p.transactionId)) dup = true;
      });
      if (dup) throw new Error('This Transaction ID has already been used. Please check your payment.');
    }
    var appId = nextYearId('Admissions', 'ApplicationID', 'APP');
    var row = [
      appId, p.studentName, p.fatherName, p.motherName, p.mobile,
      p.altMobile || '', p.email || '', p.presentAddress, p.courseId,
      course.CourseName, p.batchId, batch.BatchName, p.admissionDate,
      p.paymentMethod || '', p.transactionId || '', p.senderNumber || '',
      toNum(p.paidAmount), p.additionalInfo || '', 'Pending', now(), now()
    ];
    appendRow('Admissions', row);
    addNotification('Admission', 'New admission: ' + p.studentName,
      p.studentName + ' applied for ' + course.CourseName + ' (' + batch.BatchName + ').', appId);
    logActivity('Public', 'Admission Submitted',
      'Application ' + appId + ' for ' + course.CourseName + '.', appId);
    return { applicationId: appId, status: 'Pending' };
  });
}

/* ------------------------------------------------------------------ */
/* Auth actions                                                         */
/* ------------------------------------------------------------------ */
function adminLogin(p) {
  if (!p.username || !p.password) throw new Error('Username and password are required.');
  var admin = findAdmin(p.username);
  /* Same generic error for unknown user / wrong password (no leaking). */
  if (!admin || !isTrue(admin.IsActive)) throw new Error('Invalid username or password.');
  if (sha256Hex(p.password) !== String(admin.PasswordHash)) {
    throw new Error('Invalid username or password.');
  }
  var token = Utilities.getUuid();
  var expiry = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  withLock(function () {
    updateRowCells('AdminUsers', admin.__row, {
      SessionToken: token, TokenExpiry: expiry, LastLoginAt: now()
    });
  });
  logActivity(p.username, 'Admin Login', 'Login successful.', '');
  return { token: token, expiresAt: expiry, username: admin.Username,
    fullName: admin.FullName, role: admin.Role };
}

function adminLogout(p) {
  var admin = verifyToken(p.token);
  if (admin) {
    withLock(function () {
      updateRowCells('AdminUsers', admin.__row, { SessionToken: '', TokenExpiry: '' });
    });
    logActivity(admin.Username, 'Admin Logout', 'Logout.', '');
  }
  return { loggedOut: true };
}

/**
 * Change the logged-in admin's own password.
 * - Verifies the session token AND the current password (SHA-256).
 * - New password must be at least 8 characters and different from the old.
 * - The old session token is invalidated, so the admin must log in again.
 * - Passwords are never logged; only the hash is stored.
 */
function changePassword(p) {
  var admin = requireAdmin(p);
  if (!p.oldPassword || !p.newPassword) {
    throw new Error('Old password and new password are required.');
  }
  if (String(p.newPassword).length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }
  if (sha256Hex(p.oldPassword) !== String(admin.PasswordHash)) {
    throw new Error('Current password is incorrect.');
  }
  if (p.oldPassword === p.newPassword) {
    throw new Error('New password must be different from the old password.');
  }
  return withLock(function () {
    updateRowCells('AdminUsers', admin.__row, {
      PasswordHash: sha256Hex(p.newPassword),
      SessionToken: '', TokenExpiry: ''
    });
    logActivity(admin.Username, 'Password Changed',
      'Admin password changed; session invalidated, re-login required.', '');
    return { changed: true, username: admin.Username };
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard — all numbers computed live from the Sheets. No fake data.*/
/* ------------------------------------------------------------------ */
function getDashboardStats(p) {
  requireAdmin(p);
  var students = readAll('Students').filter(function (s) { return !isTrue(s.IsArchived); });
  var courses = readAll('Courses').filter(function (c) { return !isTrue(c.IsArchived); });
  var batches = readAll('Batches');
  var admissions = readAll('Admissions');
  var payments = readAll('Payments');
  var expenses = readAll('Expenses');
  var today = todayStr();
  var monthPrefix = today.slice(0, 7); /* YYYY-MM */

  var totalPaid = 0, totalDue = 0, totalFee = 0;
  var activeStudents = 0;
  students.forEach(function (s) {
    totalPaid += toNum(s.PaidAmount);
    totalDue += toNum(s.DueAmount);
    totalFee += toNum(s.TotalFee);
    if (s.Status === 'Active') activeStudents++;
  });
  var totalExpenses = 0;
  expenses.forEach(function (e) { totalExpenses += toNum(e.Amount); });
  var todaysCollection = 0, monthlyCollection = 0, monthlyExpenses = 0;
  payments.forEach(function (py) {
    var d = py.PaymentDate ? Utilities.formatDate(new Date(py.PaymentDate),
      Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    if (d === today) todaysCollection += toNum(py.Amount);
    if (d.slice(0, 7) === monthPrefix) monthlyCollection += toNum(py.Amount);
  });
  expenses.forEach(function (e) {
    var d = e.Date ? Utilities.formatDate(new Date(e.Date),
      Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    if (d.slice(0, 7) === monthPrefix) monthlyExpenses += toNum(e.Amount);
  });
  var newAdmissions = admissions.filter(function (a) {
    var d = a.CreatedAt ? Utilities.formatDate(new Date(a.CreatedAt),
      Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    return d.slice(0, 7) === monthPrefix;
  }).length;

  return {
    totalStudents: students.length,
    activeStudents: activeStudents,
    totalCourses: courses.length,
    totalBatches: batches.length,
    newAdmissions: newAdmissions,
    pendingAdmissions: admissions.filter(function (a) { return a.Status === 'Pending'; }).length,
    totalRevenue: totalFee,          /* total course fees of all students */
    totalPaid: totalPaid,            /* actually collected */
    totalDue: totalDue,              /* still owed — NOT counted as cash */
    todaysCollection: todaysCollection,
    monthlyCollection: monthlyCollection,
    totalExpenses: totalExpenses,
    monthlyExpenses: monthlyExpenses,
    netCash: totalPaid - totalExpenses,
    studentsWithDue: students.filter(function (s) { return toNum(s.DueAmount) > 0; }).length
  };
}

/* ------------------------------------------------------------------ */
/* Students                                                             */
/* ------------------------------------------------------------------ */
function publicStudentView(s) {
  return {
    studentId: s.StudentID, fullName: s.FullName, fatherName: s.FatherName,
    motherName: s.MotherName, mobile: s.Mobile, altMobile: s.AltMobile,
    email: s.Email, presentAddress: s.PresentAddress,
    courseId: s.CourseID, courseName: s.CourseName,
    batchId: s.BatchID, batchName: s.BatchName,
    admissionDate: s.AdmissionDate, totalFee: toNum(s.TotalFee),
    paidAmount: toNum(s.PaidAmount), dueAmount: toNum(s.DueAmount),
    paymentStatus: s.PaymentStatus, status: s.Status,
    photoUrl: s.PhotoURL, notes: s.Notes
  };
}

function getStudents(p) {
  var admin = requireAdmin(p);
  var rows = readAll('Students').filter(function (s) { return !isTrue(s.IsArchived); });
  if (p.courseId) rows = rows.filter(function (s) { return s.CourseID === p.courseId; });
  if (p.batchId) rows = rows.filter(function (s) { return s.BatchID === p.batchId; });
  if (p.status) rows = rows.filter(function (s) { return s.Status === p.status; });
  if (p.withDue) rows = rows.filter(function (s) { return toNum(s.DueAmount) > 0; });
  return rows.map(publicStudentView);
}

function searchStudents(p) {
  requireAdmin(p);
  var q = String(p.q || '').toLowerCase().trim();
  if (!q) return [];
  return readAll('Students')
    .filter(function (s) {
      if (isTrue(s.IsArchived)) return false;
      return [s.StudentID, s.FullName, s.Mobile, s.CourseName, s.BatchName]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    })
    .map(publicStudentView);
}

function createStudent(p) {
  var admin = requireAdmin(p);
  var required = ['fullName', 'fatherName', 'motherName', 'mobile',
    'presentAddress', 'courseId', 'batchId', 'admissionDate'];
  required.forEach(function (f) {
    if (!p[f] || String(p[f]).trim() === '') throw new Error('Missing required field: ' + f);
  });
  return withLock(function () {
    var course = null;
    readAll('Courses').forEach(function (c) { if (c.CourseID === p.courseId) course = c; });
    if (!course) throw new Error('Course not found.');
    var batch = null;
    readAll('Batches').forEach(function (b) { if (b.BatchID === p.batchId) batch = b; });
    if (!batch) throw new Error('Batch not found.');
    var totalFee = p.totalFee !== undefined ? toNum(p.totalFee) : toNum(course.FinalFee);
    var studentId = nextYearId('Students', 'StudentID', 'RC');
    var row = [
      studentId, p.fullName, p.fatherName, p.motherName, p.mobile,
      p.altMobile || '', p.email || '', p.presentAddress, p.courseId,
      course.CourseName, p.batchId, batch.BatchName, p.admissionDate,
      totalFee, 0, totalFee, 'Unpaid', p.status || 'Active',
      p.photoUrl || '', p.notes || '', now(), now(), false
    ];
    appendRow('Students', row);
    updateRowCells('Batches', batch.__row, {
      EnrolledStudents: toNum(batch.EnrolledStudents) + 1, UpdatedAt: now()
    });
    logActivity(admin.Username, 'Student Created',
      'Student ' + studentId + ' (' + p.fullName + ') created.', studentId);
    return { studentId: studentId };
  });
}

function updateStudent(p) {
  var admin = requireAdmin(p);
  if (!p.studentId) throw new Error('studentId is required.');
  return withLock(function () {
    var rows = readAll('Students');
    var target = null;
    rows.forEach(function (s) { if (s.StudentID === p.studentId) target = s; });
    if (!target) throw new Error('Student not found.');
    var allowed = ['FullName', 'FatherName', 'MotherName', 'Mobile', 'AltMobile',
      'Email', 'PresentAddress', 'Status', 'PhotoURL', 'Notes'];
    var changes = { UpdatedAt: now() };
    allowed.forEach(function (col) {
      var key = col.charAt(0).toLowerCase() + col.slice(1);
      if (p[key] !== undefined) changes[col] = p[key];
    });
    /* Soft delete / archive instead of hard delete. */
    if (p.archive === true) changes.IsArchived = true;
    updateRowCells('Students', target.__row, changes);
    logActivity(admin.Username, 'Student Updated',
      'Student ' + p.studentId + ' updated.', p.studentId);
    return { studentId: p.studentId, updated: true };
  });
}

/* ------------------------------------------------------------------ */
/* Admissions (admin side)                                             */
/* ------------------------------------------------------------------ */
function getAdmissions(p) {
  requireAdmin(p);
  var rows = readAll('Admissions');
  if (p.status) rows = rows.filter(function (a) { return a.Status === p.status; });
  if (p.courseId) rows = rows.filter(function (a) { return a.CourseID === p.courseId; });
  rows.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
  return rows.map(function (a) {
    return {
      applicationId: a.ApplicationID, studentName: a.StudentName,
      fatherName: a.FatherName, motherName: a.MotherName, mobile: a.Mobile,
      altMobile: a.AltMobile, email: a.Email, presentAddress: a.PresentAddress,
      courseId: a.CourseID, courseName: a.CourseName,
      batchId: a.BatchID, batchName: a.BatchName,
      admissionDate: a.AdmissionDate, paymentMethod: a.PaymentMethod,
      transactionId: a.TransactionID, senderNumber: a.SenderNumber,
      paidAmount: toNum(a.PaidAmount), additionalInfo: a.AdditionalInfo,
      status: a.Status, createdAt: a.CreatedAt
    };
  });
}

/* Approve an admission: creates the Student (unique RC-... ID), marks the
 * admission Approved, counts the seat in the batch, and — if the applicant
 * already paid an amount — records it as their first payment. */
function approveAdmission(p) {
  var admin = requireAdmin(p);
  if (!p.applicationId) throw new Error('applicationId is required.');
  return withLock(function () {
    var target = null;
    readAll('Admissions').forEach(function (a) {
      if (a.ApplicationID === p.applicationId) target = a;
    });
    if (!target) throw new Error('Admission not found.');
    if (target.Status !== 'Pending') throw new Error('Admission is already ' + target.Status + '.');
    var course = null;
    readAll('Courses').forEach(function (c) { if (c.CourseID === target.CourseID) course = c; });
    var batch = null;
    readAll('Batches').forEach(function (b) { if (b.BatchID === target.BatchID) batch = b; });
    if (!course || !batch) throw new Error('Course or batch no longer exists.');
    if (toNum(batch.EnrolledStudents) >= toNum(batch.MaxStudents)) {
      throw new Error('This batch is full.');
    }
    var totalFee = toNum(course.FinalFee);
    var studentId = nextYearId('Students', 'StudentID', 'RC');
    var paid = toNum(target.PaidAmount);
    appendRow('Students', [
      studentId, target.StudentName, target.FatherName, target.MotherName,
      target.Mobile, target.AltMobile, target.Email, target.PresentAddress,
      target.CourseID, target.CourseName, target.BatchID, target.BatchName,
      target.AdmissionDate, totalFee, paid, totalFee - paid,
      paymentStatusFor(totalFee, paid), 'Active', '', '', now(), now(), false
    ]);
    updateRowCells('Admissions', target.__row, { Status: 'Approved', UpdatedAt: now() });
    updateRowCells('Batches', batch.__row, {
      EnrolledStudents: toNum(batch.EnrolledStudents) + 1, UpdatedAt: now()
    });
    if (paid > 0) {
      var payId = nextYearId('Payments', 'PaymentID', 'PAY');
      appendRow('Payments', [
        payId, studentId, target.StudentName, target.CourseName, paid,
        target.AdmissionDate, target.PaymentMethod || '', target.TransactionID || '',
        target.SenderNumber || '', 'Admission payment', admin.Username, now()
      ]);
    }
    addNotification('Admission', 'Admission approved: ' + target.StudentName,
      'Student ID ' + studentId + ' created for ' + target.CourseName + '.', studentId);
    logActivity(admin.Username, 'Admission Approved',
      'Application ' + p.applicationId + ' → Student ' + studentId + '.', studentId);
    return { studentId: studentId, applicationId: p.applicationId };
  });
}

function rejectAdmission(p) {
  var admin = requireAdmin(p);
  if (!p.applicationId) throw new Error('applicationId is required.');
  return withLock(function () {
    var target = null;
    readAll('Admissions').forEach(function (a) {
      if (a.ApplicationID === p.applicationId) target = a;
    });
    if (!target) throw new Error('Admission not found.');
    if (target.Status !== 'Pending') throw new Error('Admission is already ' + target.Status + '.');
    updateRowCells('Admissions', target.__row, { Status: 'Rejected', UpdatedAt: now() });
    logActivity(admin.Username, 'Admission Rejected',
      'Application ' + p.applicationId + ' rejected.', p.applicationId);
    return { applicationId: p.applicationId, status: 'Rejected' };
  });
}

/* ------------------------------------------------------------------ */
/* Courses                                                              */
/* ------------------------------------------------------------------ */
function createCourse(p) {
  var admin = requireAdmin(p);
  if (!p.courseName || !p.description) throw new Error('Course name and description are required.');
  return withLock(function () {
    var courseId = nextId('Courses', 'CourseID', 'CRS', 3);
    var regularFee = toNum(p.regularFee);
    var discount = toNum(p.discount);
    appendRow('Courses', [
      courseId, p.courseName, p.courseNameBn || '', p.description,
      p.imageUrl || '', p.duration || '', p.totalClasses || '',
      regularFee, discount, Math.max(0, regularFee - discount),
      p.status || 'Draft', p.admissionDeadline || '', now(), now(), false
    ]);
    logActivity(admin.Username, 'Course Created',
      'Course ' + courseId + ' (' + p.courseName + ') created.', courseId);
    return { courseId: courseId };
  });
}

function updateCourse(p) {
  var admin = requireAdmin(p);
  if (!p.courseId) throw new Error('courseId is required.');
  return withLock(function () {
    var target = null;
    readAll('Courses').forEach(function (c) { if (c.CourseID === p.courseId) target = c; });
    if (!target) throw new Error('Course not found.');
    var changes = { UpdatedAt: now() };
    var map = { courseName: 'CourseName', courseNameBn: 'CourseNameBn',
      description: 'Description', imageUrl: 'ImageURL', duration: 'Duration',
      totalClasses: 'TotalClasses', regularFee: 'RegularFee',
      discount: 'Discount', status: 'Status',
      admissionDeadline: 'AdmissionDeadline' };
    Object.keys(map).forEach(function (k) {
      if (p[k] !== undefined) changes[map[k]] = p[k];
    });
    /* Final fee is always derived, never typed directly. */
    var regularFee = changes.RegularFee !== undefined ? toNum(changes.RegularFee) : toNum(target.RegularFee);
    var discount = changes.Discount !== undefined ? toNum(changes.Discount) : toNum(target.Discount);
    changes.FinalFee = Math.max(0, regularFee - discount);
    updateRowCells('Courses', target.__row, changes);
    logActivity(admin.Username, 'Course Updated',
      'Course ' + p.courseId + ' updated.', p.courseId);
    return { courseId: p.courseId, updated: true };
  });
}

/* Soft-delete only. Blocked while active students are enrolled, so their
 * history is never lost. */
function deleteCourse(p) {
  var admin = requireAdmin(p);
  if (!p.courseId) throw new Error('courseId is required.');
  return withLock(function () {
    var target = null;
    readAll('Courses').forEach(function (c) { if (c.CourseID === p.courseId) target = c; });
    if (!target) throw new Error('Course not found.');
    var enrolled = readAll('Students').filter(function (s) {
      return s.CourseID === p.courseId && !isTrue(s.IsArchived) &&
        (s.Status === 'Active' || s.Status === 'Pending');
    }).length;
    if (enrolled > 0) {
      throw new Error('Cannot delete: ' + enrolled + ' student(s) are enrolled in this course. Archive it instead after they finish.');
    }
    updateRowCells('Courses', target.__row, {
      Status: 'Archived', IsArchived: true, UpdatedAt: now()
    });
    logActivity(admin.Username, 'Course Archived',
      'Course ' + p.courseId + ' archived (soft delete).', p.courseId);
    return { courseId: p.courseId, archived: true };
  });
}

/**
 * Admin course list — ALL courses, including Draft / Closed / Archived,
 * with their status. (The public publicGetCourses only returns Published
 * courses, so the admin pages cannot use it for management.)
 * Optional filters: p.status ('Published' / 'Draft' / 'Closed' / 'Archived'),
 * p.includeArchived (default true; pass false to hide archived courses).
 * Field names match publicGetCourses, plus status / isArchived / timestamps,
 * so the admin courses page can reuse its existing render code.
 */
function getCourses(p) {
  requireAdmin(p);
  var rows = readAll('Courses');
  if (p.status) rows = rows.filter(function (c) { return c.Status === p.status; });
  if (p.includeArchived === false || String(p.includeArchived).toLowerCase() === 'false') {
    rows = rows.filter(function (c) { return !isTrue(c.IsArchived); });
  }
  return rows.map(function (c) {
    return {
      courseId: c.CourseID, name: c.CourseName, nameBn: c.CourseNameBn,
      description: c.Description, imageUrl: c.ImageURL,
      duration: c.Duration, totalClasses: c.TotalClasses,
      regularFee: toNum(c.RegularFee), discount: toNum(c.Discount),
      finalFee: toNum(c.FinalFee), status: c.Status,
      admissionDeadline: c.AdmissionDeadline,
      isArchived: isTrue(c.IsArchived),
      createdAt: c.CreatedAt, updatedAt: c.UpdatedAt
    };
  });
}

/* ------------------------------------------------------------------ */
/* Batches                                                              */
/* ------------------------------------------------------------------ */
function createBatch(p) {
  var admin = requireAdmin(p);
  if (!p.batchName || !p.courseId || !p.startDate || !p.maxStudents) {
    throw new Error('Batch name, course, start date and max students are required.');
  }
  return withLock(function () {
    var course = null;
    readAll('Courses').forEach(function (c) { if (c.CourseID === p.courseId) course = c; });
    if (!course) throw new Error('Course not found.');
    var batchId = nextId('Batches', 'BatchID', 'BAT', 3);
    appendRow('Batches', [
      batchId, p.batchName, p.courseId, course.CourseName, p.startDate,
      p.endDate || '', p.classDays || '', p.classSchedule || '',
      toNum(p.maxStudents), 0, p.instructorName || '',
      p.status || 'Upcoming', now(), now()
    ]);
    logActivity(admin.Username, 'Batch Created',
      'Batch ' + batchId + ' (' + p.batchName + ') created.', batchId);
    return { batchId: batchId };
  });
}

function updateBatch(p) {
  var admin = requireAdmin(p);
  if (!p.batchId) throw new Error('batchId is required.');
  return withLock(function () {
    var target = null;
    readAll('Batches').forEach(function (b) { if (b.BatchID === p.batchId) target = b; });
    if (!target) throw new Error('Batch not found.');
    var changes = { UpdatedAt: now() };
    var map = { batchName: 'BatchName', startDate: 'StartDate',
      endDate: 'EndDate', classDays: 'ClassDays',
      classSchedule: 'ClassSchedule', maxStudents: 'MaxStudents',
      instructorName: 'InstructorName', status: 'Status' };
    Object.keys(map).forEach(function (k) {
      if (p[k] !== undefined) changes[map[k]] = p[k];
    });
    if (changes.MaxStudents !== undefined &&
        toNum(changes.MaxStudents) < toNum(target.EnrolledStudents)) {
      throw new Error('Max students cannot be less than already enrolled (' +
        toNum(target.EnrolledStudents) + ').');
    }
    updateRowCells('Batches', target.__row, changes);
    logActivity(admin.Username, 'Batch Updated',
      'Batch ' + p.batchId + ' updated.', p.batchId);
    return { batchId: p.batchId, updated: true };
  });
}

/**
 * Admin batch list — ALL batches of all courses (any status), with the
 * full fields the admin edit form needs (endDate, maxStudents,
 * instructorName, status) which publicGetBatches does not return.
 * Enrolled count is counted LIVE from the Students sheet (non-archived
 * students per BatchID) instead of trusting the stored EnrolledStudents
 * counter, so the number is always consistent with the student list.
 * Optional filters: p.courseId, p.status. Newest start date first.
 */
function getBatches(p) {
  requireAdmin(p);
  var enrolledByBatch = {};
  readAll('Students').forEach(function (s) {
    if (isTrue(s.IsArchived) || !s.BatchID) return;
    enrolledByBatch[s.BatchID] = (enrolledByBatch[s.BatchID] || 0) + 1;
  });
  var rows = readAll('Batches');
  if (p.courseId) rows = rows.filter(function (b) { return b.CourseID === p.courseId; });
  if (p.status) rows = rows.filter(function (b) { return b.Status === p.status; });
  rows.sort(function (a, b) {
    var da = a.StartDate ? new Date(a.StartDate).getTime() : 0;
    var db = b.StartDate ? new Date(b.StartDate).getTime() : 0;
    return db - da;
  });
  return rows.map(function (b) {
    var enrolled = enrolledByBatch[b.BatchID] || 0;
    var max = toNum(b.MaxStudents);
    return {
      batchId: b.BatchID, batchName: b.BatchName,
      courseId: b.CourseID, courseName: b.CourseName,
      startDate: b.StartDate, endDate: b.EndDate,
      classDays: b.ClassDays, classSchedule: b.ClassSchedule,
      maxStudents: max, enrolledStudents: enrolled,
      seatsLeft: Math.max(0, max - enrolled),
      instructorName: b.InstructorName, status: b.Status,
      createdAt: b.CreatedAt, updatedAt: b.UpdatedAt
    };
  });
}

/* ------------------------------------------------------------------ */
/* Payments — append-only history + due recalculation in one lock.      */
/* ------------------------------------------------------------------ */
function recordPayment(p) {
  var admin = requireAdmin(p);
  if (!p.studentId || !p.amount || toNum(p.amount) <= 0) {
    throw new Error('Student ID and an amount greater than 0 are required.');
  }
  if (!p.paymentDate) throw new Error('Payment date is required.');
  return withLock(function () {
    var student = null;
    readAll('Students').forEach(function (s) {
      if (s.StudentID === p.studentId && !isTrue(s.IsArchived)) student = s;
    });
    if (!student) throw new Error('Student not found.');
    /* Duplicate Transaction ID is rejected (mobile payments only). */
    if (p.transactionId) {
      var dup = false;
      readAll('Payments').forEach(function (py) {
        if (py.TransactionID && String(py.TransactionID) === String(p.transactionId)) dup = true;
      });
      readAll('Admissions').forEach(function (a) {
        if (a.TransactionID && String(a.TransactionID) === String(p.transactionId)) dup = true;
      });
      if (dup) throw new Error('This Transaction ID has already been used.');
    }
    var payId = nextYearId('Payments', 'PaymentID', 'PAY');
    appendRow('Payments', [
      payId, student.StudentID, student.FullName, student.CourseName,
      toNum(p.amount), p.paymentDate, p.paymentMethod || 'Cash',
      p.transactionId || '', p.senderNumber || '', p.notes || '',
      admin.Username, now()
    ]);
    /* Same transaction: recalculate totals on the student row. */
    var newPaid = toNum(student.PaidAmount) + toNum(p.amount);
    var newDue = toNum(student.TotalFee) - newPaid;
    updateRowCells('Students', student.__row, {
      PaidAmount: newPaid, DueAmount: newDue,
      PaymentStatus: paymentStatusFor(student.TotalFee, newPaid),
      UpdatedAt: now()
    });
    addNotification('Payment', 'Payment received: ' + student.FullName,
      '৳' + toNum(p.amount) + ' received from ' + student.FullName +
      ' (' + student.StudentID + '). Due now ৳' + newDue + '.', payId);
    logActivity(admin.Username, 'Payment Recorded',
      'Payment ' + payId + ': ৳' + toNum(p.amount) + ' for ' + student.StudentID + '.', payId);
    return {
      paymentId: payId, studentId: student.StudentID,
      paidAmount: newPaid, dueAmount: newDue,
      paymentStatus: paymentStatusFor(student.TotalFee, newPaid)
    };
  });
}

function getPaymentHistory(p) {
  requireAdmin(p);
  var rows = readAll('Payments');
  if (p.studentId) rows = rows.filter(function (py) { return py.StudentID === p.studentId; });
  if (p.from) rows = rows.filter(function (py) { return String(py.PaymentDate) >= p.from; });
  if (p.to) rows = rows.filter(function (py) { return String(py.PaymentDate) <= p.to; });
  rows.sort(function (a, b) { return new Date(b.PaymentDate) - new Date(a.PaymentDate); });
  return rows.map(function (py) {
    return {
      paymentId: py.PaymentID, studentId: py.StudentID,
      studentName: py.StudentName, courseName: py.CourseName,
      amount: toNum(py.Amount), paymentDate: py.PaymentDate,
      paymentMethod: py.PaymentMethod, transactionId: py.TransactionID,
      senderNumber: py.SenderNumber, notes: py.Notes,
      receivedBy: py.ReceivedBy
    };
  });
}

/* ------------------------------------------------------------------ */
/* Expenses                                                             */
/* ------------------------------------------------------------------ */
function createExpense(p) {
  var admin = requireAdmin(p);
  if (!p.title || !p.category || !p.amount || toNum(p.amount) <= 0 || !p.date) {
    throw new Error('Title, category, date and an amount greater than 0 are required.');
  }
  return withLock(function () {
    var expId = nextYearId('Expenses', 'ExpenseID', 'EXP');
    appendRow('Expenses', [
      expId, p.title, p.category, toNum(p.amount), p.date,
      p.paymentMethod || 'Cash', p.description || '', admin.Username, now()
    ]);
    logActivity(admin.Username, 'Expense Recorded',
      'Expense ' + expId + ': ৳' + toNum(p.amount) + ' (' + p.category + ').', expId);
    return { expenseId: expId };
  });
}

/**
 * Admin expense list — newest first, with totals by category.
 * Optional filters: p.category, p.from / p.to (YYYY-MM-DD).
 * Returns { expenses: [...], totalsByCategory: {...}, totalAmount, count }.
 * Expenses are append-only history; this action only reads, never edits.
 */
function getExpenses(p) {
  requireAdmin(p);
  var rows = readAll('Expenses');
  if (p.category) rows = rows.filter(function (e) { return e.Category === p.category; });
  var fmt = function (d) {
    return d ? Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
  };
  if (p.from) rows = rows.filter(function (e) { return fmt(e.Date) >= p.from; });
  if (p.to) rows = rows.filter(function (e) { return fmt(e.Date) <= p.to; });
  rows.sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  var totalsByCategory = {};
  var totalAmount = 0;
  var expenses = rows.map(function (e) {
    var amt = toNum(e.Amount);
    totalsByCategory[e.Category || 'Other'] =
      (totalsByCategory[e.Category || 'Other'] || 0) + amt;
    totalAmount += amt;
    return {
      expenseId: e.ExpenseID, title: e.Title, category: e.Category,
      amount: amt, date: e.Date, paymentMethod: e.PaymentMethod,
      description: e.Description, createdBy: e.CreatedBy,
      createdAt: e.CreatedAt
    };
  });
  return {
    expenses: expenses, totalsByCategory: totalsByCategory,
    totalAmount: totalAmount, count: expenses.length
  };
}

/* ------------------------------------------------------------------ */
/* Reports & Analytics                                                  */
/* ------------------------------------------------------------------ */
function getReports(p) {
  requireAdmin(p);
  var type = p.type || 'summary';
  var students = readAll('Students').filter(function (s) { return !isTrue(s.IsArchived); });
  var admissions = readAll('Admissions');
  var payments = readAll('Payments');
  var expenses = readAll('Expenses');
  var from = p.from || '0000-00-00';
  var to = p.to || '9999-12-31';
  var inRange = function (d) {
    var s = d ? Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    return s >= from && s <= to;
  };

  if (type === 'dailyAdmissions' || type === 'monthlyAdmissions') {
    var byDay = {};
    admissions.forEach(function (a) {
      var d = a.CreatedAt ? Utilities.formatDate(new Date(a.CreatedAt),
        Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
      if (!inRange(d)) return;
      var key = type === 'dailyAdmissions' ? d : d.slice(0, 7);
      byDay[key] = (byDay[key] || 0) + 1;
    });
    return Object.keys(byDay).sort().map(function (k) { return { period: k, count: byDay[k] }; });
  }

  if (type === 'courseWise') {
    var map = {};
    students.forEach(function (s) {
      var k = s.CourseName || 'Unknown';
      map[k] = map[k] || { course: k, students: 0, totalFee: 0, paid: 0, due: 0 };
      map[k].students++;
      map[k].totalFee += toNum(s.TotalFee);
      map[k].paid += toNum(s.PaidAmount);
      map[k].due += toNum(s.DueAmount);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  if (type === 'dueReport') {
    return students
      .filter(function (s) { return toNum(s.DueAmount) > 0; })
      .sort(function (a, b) { return toNum(b.DueAmount) - toNum(a.DueAmount); })
      .map(function (s) {
        return {
          studentId: s.StudentID, fullName: s.FullName, mobile: s.Mobile,
          courseName: s.CourseName, batchName: s.BatchName,
          totalFee: toNum(s.TotalFee), paidAmount: toNum(s.PaidAmount),
          dueAmount: toNum(s.DueAmount), paymentStatus: s.PaymentStatus,
          admissionDate: s.AdmissionDate
        };
      });
  }

  if (type === 'incomeExpense') {
    var income = 0, expTotal = 0;
    payments.forEach(function (py) { if (inRange(py.PaymentDate)) income += toNum(py.Amount); });
    expenses.forEach(function (e) { if (inRange(e.Date)) expTotal += toNum(e.Amount); });
    return { from: from, to: to, income: income, expenses: expTotal,
      netCash: income - expTotal };
  }

  /* Default: overall financial summary. */
  var totalPaid = 0, totalDue = 0, totalFee = 0;
  students.forEach(function (s) {
    totalPaid += toNum(s.PaidAmount);
    totalDue += toNum(s.DueAmount);
    totalFee += toNum(s.TotalFee);
  });
  var totalExp = 0;
  expenses.forEach(function (e) { totalExp += toNum(e.Amount); });
  return {
    totalStudents: students.length,
    totalFee: totalFee, totalPaid: totalPaid, totalDue: totalDue,
    totalExpenses: totalExp, netCash: totalPaid - totalExp,
    studentsWithDue: students.filter(function (s) { return toNum(s.DueAmount) > 0; }).length,
    pendingAdmissions: admissions.filter(function (a) { return a.Status === 'Pending'; }).length
  };
}

/* ------------------------------------------------------------------ */
/* Backup — copies the whole spreadsheet into a Drive backup folder.    */
/* Restore is a MANUAL, confirmed step by the owner (never automatic):  */
/* open the backup copy in Drive and use it as the new master, or copy  */
/* its sheets back. The script never overwrites the live database.      */
/* ------------------------------------------------------------------ */
function createBackup(p) {
  var admin = requireAdmin(p || {});
  return withLock(function () {
    var file = DriveApp.getFileById(ss().getId());
    var folders = DriveApp.getFoldersByName(BACKUP_FOLDER);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER);
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
    var copy = file.makeCopy('REDUAN_COMPUTER_MASTER_DATABASE_backup_' + stamp, folder);
    logActivity(admin.Username, 'Backup Created',
      'Backup saved: ' + copy.getName() + ' (' + copy.getUrl() + ').', copy.getId());
    return { backupFileId: copy.getId(), backupName: copy.getName(),
      backupUrl: copy.getUrl(), createdAt: now() };
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */
function getNotifications(p) {
  requireAdmin(p);
  var rows = readAll('Notifications');
  rows.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
  if (p.unreadOnly) rows = rows.filter(function (n) { return !isTrue(n.IsRead); });
  return rows.slice(0, p.limit ? Number(p.limit) : 50).map(function (n) {
    return {
      notificationId: n.NotificationID, type: n.Type, title: n.Title,
      message: n.Message, relatedId: n.RelatedID, isRead: isTrue(n.IsRead),
      createdAt: n.CreatedAt
    };
  });
}

function markNotificationRead(p) {
  var admin = requireAdmin(p);
  if (!p.notificationId) throw new Error('notificationId is required.');
  var target = null;
  readAll('Notifications').forEach(function (n) {
    if (n.NotificationID === p.notificationId) target = n;
  });
  if (!target) throw new Error('Notification not found.');
  withLock(function () {
    updateRowCells('Notifications', target.__row, { IsRead: true });
  });
  return { notificationId: p.notificationId, isRead: true };
}

/* ------------------------------------------------------------------ */
/* Settings (admin side)                                                */
/* ------------------------------------------------------------------ */
function getSettings(p) {
  requireAdmin(p);
  var out = {};
  readAll('Settings').forEach(function (r) { out[r.Key] = r.Value; });
  return out;
}

function updateSettings(p) {
  var admin = requireAdmin(p);
  if (!p.settings || typeof p.settings !== 'object') {
    throw new Error('settings object is required.');
  }
  return withLock(function () {
    Object.keys(p.settings).forEach(function (k) {
      setSetting(k, p.settings[k]);
    });
    logActivity(admin.Username, 'Settings Updated',
      'Settings updated: ' + Object.keys(p.settings).join(', ') + '.', '');
    return { updated: Object.keys(p.settings) };
  });
}
