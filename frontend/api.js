/* ============================================================================
 * REDUAN COMPUTER — api.js
 * Apps Script Web App-এর সঙ্গে কথা বলার একটাই wrapper।
 * ----------------------------------------------------------------------------
 * চুক্তি (backend/Code.gs):
 *  - প্রতিটি অনুরোধ POST JSON: { "action": "...", ...payload, "token": "..." }
 *  - প্রতিটি উত্তর JSON: { "ok": true, "data": ... } বা { "ok": false, "error": "..." }
 *  - Content-Type: text/plain ব্যবহার করা হয়েছে — Apps Script Web App
 *    CORS preflight (OPTIONS) ঠিকমতো সামলায় না, তাই preflight এড়ানো হয়।
 *  - টোকেন sessionStorage-এ থাকে; পাসওয়ার্ড কোথাও সংরক্ষণ করা হয় না।
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RC_CONFIG || {};
  var URL = CFG.APPS_SCRIPT_URL || '';

  function isConfigured() { return typeof URL === 'string' && URL.trim() !== ''; }

  /* ---------- Session (token) helpers ---------- */
  function getToken() {
    try { return sessionStorage.getItem(CFG.SESSION_KEY) || ''; } catch (e) { return ''; }
  }
  function getTokenExpiry() {
    try { return sessionStorage.getItem(CFG.SESSION_EXPIRY_KEY) || ''; } catch (e) { return ''; }
  }
  function getSessionUser() {
    try { return JSON.parse(sessionStorage.getItem(CFG.SESSION_USER_KEY) || 'null'); } catch (e) { return null; }
  }
  function setSession(token, expiresAt, user) {
    try {
      sessionStorage.setItem(CFG.SESSION_KEY, token || '');
      if (expiresAt) sessionStorage.setItem(CFG.SESSION_EXPIRY_KEY, String(expiresAt));
      if (user) sessionStorage.setItem(CFG.SESSION_USER_KEY, JSON.stringify(user));
    } catch (e) { /* storage unavailable */ }
  }
  function clearSession() {
    try {
      sessionStorage.removeItem(CFG.SESSION_KEY);
      sessionStorage.removeItem(CFG.SESSION_EXPIRY_KEY);
      sessionStorage.removeItem(CFG.SESSION_USER_KEY);
    } catch (e) { /* ignore */ }
  }
  function tokenLooksValid() {
    var token = getToken();
    if (!token) return false;
    var exp = getTokenExpiry();
    if (exp) {
      var expMs = new Date(exp).getTime();
      if (!isNaN(expMs) && expMs <= Date.now()) return false;
    }
    return true;
  }

  /* ---------- Core API call ---------- */
  function call(action, payload, opts) {
    opts = opts || {};
    payload = payload || {};
    if (!isConfigured()) {
      return Promise.resolve({ ok: false, error: 'Backend সংযুক্ত হয়নি — Apps Script Web App URL এখনো কনফিগার করা হয়নি।', notConfigured: true });
    }
    var body = { action: action };
    Object.keys(payload).forEach(function (k) { body[k] = payload[k]; });
    if (opts.auth !== false) {
      var token = getToken();
      if (token) body.token = token;
    }
    return fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    })
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var parsed;
        try { parsed = JSON.parse(text); } catch (e) {
          return { ok: false, error: 'সার্ভার থেকে ভুল উত্তর এসেছে। আবার চেষ্টা করুন।' };
        }
        if (parsed && parsed.ok) return { ok: true, data: parsed.data };
        return { ok: false, error: (parsed && parsed.error) || 'অজানা ত্রুটি ঘটেছে।' };
      })
      .catch(function () {
        return { ok: false, error: 'ইন্টারনেট বা সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না। সংযোগ দেখে আবার চেষ্টা করুন।' };
      });
  }

  /* ---------- Formatting helpers ---------- */
  function fmtMoney(n) {
    var num = Number(n);
    if (isNaN(num)) return (CFG.CURRENCY || '৳') + '০';
    return (CFG.CURRENCY || '৳') + num.toLocaleString('en-US');
  }
  function fmtMoneyBn(n) {
    var num = Number(n);
    if (isNaN(num)) return '৳০';
    return '৳' + num.toLocaleString('bn-BD');
  }
  function fmtDate(d) {
    if (!d) return '—';
    var dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    var y = dt.getFullYear();
    var m = ('0' + (dt.getMonth() + 1)).slice(-2);
    var day = ('0' + dt.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }
  function fmtDateTime(d) {
    if (!d) return '—';
    var dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return fmtDate(dt) + ' ' + ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2);
  }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function feeText(course) {
    /* ফি/মেয়াদ না থাকলে কোনো সংখ্যা বানানো যাবে না। */
    if (!course) return 'ফি জানতে যোগাযোগ করুন';
    var fee = Number(course.finalFee);
    if (course.finalFee === '' || course.finalFee === null || course.finalFee === undefined || isNaN(fee) || fee <= 0) {
      return 'ফি জানতে যোগাযোগ করুন';
    }
    return fmtMoney(fee);
  }
  function durationText(course) {
    if (!course || !course.duration) return 'শীঘ্রই আসছে';
    return String(course.duration);
  }
  function classesText(course) {
    if (!course || course.totalClasses === '' || course.totalClasses === null || course.totalClasses === undefined) return 'শীঘ্রই আসছে';
    return String(course.totalClasses) + 'টি ক্লাস';
  }

  /* ---------- "Backend সংযুক্ত হয়নি" নোটিশ ---------- */
  function backendNoticeHTML() {
    return '<div class="backend-notice" role="alert">' +
      '<strong>Backend সংযুক্ত হয়নি।</strong> ' +
      'এই পাতার তথ্য দেখতে Google Apps Script Backend সংযুক্ত করতে হবে। ' +
      'কোনো ভুয়া তথ্য দেখানো হচ্ছে না।</div>';
  }
  function showBackendNotice(container) {
    if (!container) return;
    container.innerHTML = backendNoticeHTML();
  }

  /* ---------- Admin auth guard (প্রতিটি অ্যাডমিন পাতায় চালাতে হবে) ---------- */
  function requireAuth(loginPath) {
    loginPath = loginPath || 'login.html';
    if (!isConfigured()) {
      /* Backend না থাকলে লগইন করা যাবে না — লগইন পাতায় পাঠান, সেখানে নোটিশ দেখাবে। */
      window.location.href = loginPath;
      return Promise.resolve(false);
    }
    if (!tokenLooksValid()) {
      clearSession();
      window.location.href = loginPath;
      return Promise.resolve(false);
    }
    return call('verifyToken', {}, { auth: true }).then(function (res) {
      if (res.ok && res.data && res.data.valid) return true;
      clearSession();
      window.location.href = loginPath;
      return false;
    });
  }

  function logout() {
    var token = getToken();
    if (isConfigured() && token) {
      call('adminLogout', {}, { auth: true }).catch(function () { /* ignore */ });
    }
    clearSession();
    window.location.href = 'login.html';
  }

  /* ---------- Bangladeshi mobile validation ---------- */
  function isValidBdMobile(m) {
    return /^01[3-9]\d{8}$/.test(String(m || '').replace(/[\s-]/g, ''));
  }

  /* ---------- CSV download helper (Reports) ---------- */
  function downloadCSV(filename, headers, rows) {
    var csv = '\uFEFF'; /* BOM — Excel-এ বাংলা ঠিক দেখায় */
    function q(v) {
      var s = String(v === undefined || v === null ? '' : v);
      return '"' + s.replace(/"/g, '""') + '"';
    }
    csv += headers.map(q).join(',') + '\r\n';
    rows.forEach(function (r) { csv += r.map(q).join(',') + '\r\n'; });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  window.RC_API = {
    isConfigured: isConfigured,
    call: call,
    getToken: getToken,
    getTokenExpiry: getTokenExpiry,
    getSessionUser: getSessionUser,
    setSession: setSession,
    clearSession: clearSession,
    tokenLooksValid: tokenLooksValid,
    requireAuth: requireAuth,
    logout: logout,
    fmtMoney: fmtMoney,
    fmtMoneyBn: fmtMoneyBn,
    fmtDate: fmtDate,
    fmtDateTime: fmtDateTime,
    esc: esc,
    feeText: feeText,
    durationText: durationText,
    classesText: classesText,
    backendNoticeHTML: backendNoticeHTML,
    showBackendNotice: showBackendNotice,
    isValidBdMobile: isValidBdMobile,
    downloadCSV: downloadCSV
  };
})();
