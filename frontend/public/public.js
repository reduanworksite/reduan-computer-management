/* ============================================================================
 * REDUAN COMPUTER — public/public.js
 * Shared helpers for the public website (Phase 2, API-ready).
 *
 * Rules enforced here:
 *  - No invented fees, durations, class counts, instructor names, student
 *    counts or payment numbers. Where the API returns an empty fee/duration,
 *    RC_API.feeText() / RC_API.durationText() fallbacks are used.
 *  - When APPS_SCRIPT_URL is empty, data sections show the "Backend
 *    সংযুক্ত হয়নি" notice (RC_API.backendNoticeHTML()) instead of fake data.
 *    The only fallback content is the 5 seed course NAMES from RC_CONFIG
 *    (names only, clearly marked as coming from config, not the backend).
 *  - Only these public actions are ever called:
 *    publicGetCourses, publicGetBatches, getSettingsPublic, submitAdmission.
 *  - All user/API text inserted into HTML goes through RC_API.esc().
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RC_CONFIG || {};
  var API = window.RC_API || {};
  var esc = API.esc || function (s) { return String(s === undefined || s === null ? '' : s); };

  var NAV = [
    { href: 'index.html', label: 'হোম', key: 'home' },
    { href: 'courses.html', label: 'কোর্সসমূহ', key: 'courses' },
    { href: 'admission.html', label: 'ভর্তি', key: 'admission' }
  ];

  function businessName() { return CFG.BUSINESS_NAME || 'REDUAN COMPUTER'; }
  function slogan() { return CFG.SLOGAN || ''; }
  function address() { return CFG.ADDRESS || ''; }
  function phone() { return CFG.PHONE || ''; }

  /* ---------- Header / footer ---------- */
  function renderHeader(activePage) {
    var el = document.getElementById('site-header');
    if (!el) return;
    var navHtml = NAV.map(function (item) {
      var cls = (item.key === activePage) ? ' class="active" aria-current="page"' : '';
      return '<a href="' + item.href + '"' + cls + '>' + esc(item.label) + '</a>';
    }).join('');
    el.innerHTML =
      '<div class="container header-inner">' +
        '<a class="site-logo" href="index.html">' +
          '<span class="logo-mark" aria-hidden="true">RC</span>' +
          '<span class="logo-text"><strong>' + esc(businessName()) + '</strong>' +
          '<span>' + esc(slogan()) + '</span></span>' +
        '</a>' +
        '<nav class="site-nav" aria-label="প্রধান মেনু">' + navHtml + '</nav>' +
        (phone() ? '<a class="header-phone" href="tel:' + esc(phone()) + '">ফোন: ' + esc(phone()) + '</a>' : '') +
      '</div>';
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var year = new Date().getFullYear();
    el.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div><h3>' + esc(businessName()) + '</h3>' +
            '<p>' + esc(slogan()) + '</p>' +
            '<p>' + esc(address()) + '</p></div>' +
          '<div><h3>দ্রুত লিংক</h3>' +
            '<p><a href="index.html">হোম</a><br>' +
            '<a href="courses.html">কোর্সসমূহ</a><br>' +
            '<a href="admission.html">অনলাইন ভর্তি</a></p></div>' +
          '<div><h3>যোগাযোগ</h3>' +
            '<p>' + esc(address()) + '</p>' +
            (phone() ? '<p>ফোন: <a href="tel:' + esc(phone()) + '">' + esc(phone()) + '</a></p>' : '') +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">&copy; ' + year + ' ' + esc(businessName()) + ' — সর্বস্বত্ব সংরক্ষিত।</div>' +
      '</div>';
  }

  /* ---------- Settings ---------- */
  function configSettings() {
    return {
      business_name: CFG.BUSINESS_NAME || '',
      slogan: CFG.SLOGAN || '',
      address: CFG.ADDRESS || '',
      phone: CFG.PHONE || '',
      currency: CFG.CURRENCY || '',
      admission_open: true,
      payment_numbers: '',
      _fromConfig: true
    };
  }

  /* getSettingsPublic; falls back to RC_CONFIG when the backend is not
   * configured (or the call fails). Never invents a payment number. */
  function loadPublicSettings() {
    if (!API.isConfigured || !API.isConfigured()) {
      return Promise.resolve(configSettings());
    }
    return API.call('getSettingsPublic', {}, { auth: false }).then(function (res) {
      if (!res.ok || !res.data || typeof res.data !== 'object') return configSettings();
      var d = res.data;
      var merged = configSettings();
      merged._fromConfig = false;
      if (d.business_name) merged.business_name = d.business_name;
      if (d.slogan) merged.slogan = d.slogan;
      if (d.address) merged.address = d.address;
      if (d.phone) merged.phone = d.phone;
      if (d.currency) merged.currency = d.currency;
      if (d.admission_open !== undefined && d.admission_open !== null && d.admission_open !== '') {
        merged.admission_open = (d.admission_open === true || d.admission_open === 'TRUE' || d.admission_open === 'true');
      }
      if (d.payment_numbers !== undefined && d.payment_numbers !== null) {
        merged.payment_numbers = d.payment_numbers;
      }
      return merged;
    }).catch(function () { return configSettings(); });
  }

  function isAdmissionOpen(settings) {
    if (!settings) return true;
    return settings.admission_open !== false && settings.admission_open !== 'FALSE';
  }

  /* payment_numbers may arrive as a string or as an object/map — render it
   * as plain escaped text, and only when it is non-empty. */
  function paymentNumbersText(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
      return Object.keys(value).map(function (k) {
        return k + ': ' + value[k];
      }).join('\n').trim();
    }
    return String(value).trim();
  }

  /* ---------- Courses ---------- */
  function seedCourses() {
    var names = CFG.SEED_COURSES || [];
    return names.map(function (name) {
      return {
        courseId: '',
        name: name,
        nameBn: '',
        description: '',
        imageUrl: '',
        duration: '',
        totalClasses: '',
        regularFee: '',
        discount: '',
        finalFee: '',
        admissionDeadline: '',
        status: '',
        _isSeed: true
      };
    });
  }

  /* publicGetCourses. On "not configured" returns the 5 seed course NAMES
   * only (from config), flagged _isSeed, so callers can show the backend
   * notice + "শীঘ্রই আসছে" cards instead of fake data. */
  function loadCourses() {
    if (!API.isConfigured || !API.isConfigured()) {
      return Promise.resolve({
        courses: seedCourses(),
        fromBackend: false,
        notConfigured: true,
        error: ''
      });
    }
    return API.call('publicGetCourses', {}, { auth: false }).then(function (res) {
      if (!res.ok) {
        return { courses: [], fromBackend: false, notConfigured: !!res.notConfigured, error: res.error || '' };
      }
      var list = Array.isArray(res.data) ? res.data : [];
      return { courses: list, fromBackend: true, notConfigured: false, error: '' };
    }).catch(function () {
      return { courses: [], fromBackend: false, notConfigured: false, error: 'কোর্সের তালিকা লোড করা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।' };
    });
  }

  function loadBatches(courseId) {
    if (!courseId) return Promise.resolve({ batches: [], notConfigured: false, error: '' });
    if (!API.isConfigured || !API.isConfigured()) {
      return Promise.resolve({ batches: [], notConfigured: true, error: '' });
    }
    return API.call('publicGetBatches', { courseId: courseId }, { auth: false }).then(function (res) {
      if (!res.ok) {
        return { batches: [], notConfigured: !!res.notConfigured, error: res.error || '' };
      }
      return { batches: Array.isArray(res.data) ? res.data : [], notConfigured: false, error: '' };
    }).catch(function () {
      return { batches: [], notConfigured: false, error: 'ব্যাচের তালিকা লোড করা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।' };
    });
  }

  function courseInitials(course) {
    var name = (course && (course.nameBn || course.name)) || '';
    var words = String(name).split(/\s+/).filter(Boolean);
    if (!words.length) return 'RC';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  function courseDisplayName(course) {
    if (!course) return '';
    return course.nameBn ? (course.nameBn + (course.name ? ' (' + course.name + ')' : '')) : (course.name || '');
  }

  function admissionStatusBadge(course) {
    if (!course || course._isSeed) return '<span class="badge badge-info">শীঘ্রই আসছে</span>';
    var status = String(course.status || '').toLowerCase();
    if (status === 'closed' || status === 'archived' || status === 'draft') {
      return '<span class="badge badge-danger">ভর্তি বন্ধ</span>';
    }
    if (course.admissionDeadline) {
      var dl = new Date(course.admissionDeadline);
      if (!isNaN(dl.getTime()) && dl.getTime() < Date.now()) {
        return '<span class="badge badge-danger">ভর্তির সময় শেষ</span>';
      }
      return '<span class="badge badge-success">ভর্তি চলছে</span> <span class="badge">শেষ তারিখ: ' + esc(API.fmtDate ? API.fmtDate(course.admissionDeadline) : course.admissionDeadline) + '</span>';
    }
    if (status === 'published') return '<span class="badge badge-success">ভর্তি চলছে</span>';
    return '';
  }

  function courseCardHTML(course) {
    if (!course) return '';
    var name = courseDisplayName(course);
    var id = course.courseId || '';
    var thumb;
    if (course.imageUrl) {
      thumb = '<div class="course-thumb"><img src="' + esc(course.imageUrl) + '" alt="' + esc(name) + '" loading="lazy"></div>';
    } else {
      thumb = '<div class="course-thumb' + (course._isSeed ? ' course-thumb--seed' : '') + '" aria-hidden="true">' + esc(courseInitials(course)) + '</div>';
    }
    var desc = course.description
      ? '<p class="course-desc">' + esc(course.description) + '</p>'
      : (course._isSeed
        ? '<p class="course-desc">এই কোর্সের বিস্তারিত তথ্য শীঘ্রই আসছে।</p>'
        : '');
    var meta = '';
    if (!course._isSeed) {
      meta = '<div class="course-meta">' +
        '<span class="badge">মেয়াদ: ' + esc(API.durationText ? API.durationText(course) : 'শীঘ্রই আসছে') + '</span>' +
        '<span class="badge">মোট ক্লাস: ' + esc(API.classesText ? API.classesText(course) : 'শীঘ্রই আসছে') + '</span>' +
        admissionStatusBadge(course) +
        '</div>';
    } else {
      meta = '<div class="course-meta">' + admissionStatusBadge(course) + '</div>';
    }
    var fee = '<div class="course-fee">' + esc(API.feeText ? API.feeText(course) : 'ফি জানতে যোগাযোগ করুন') + '</div>';
    var actions;
    if (course._isSeed || !id) {
      actions = '<div class="course-actions"><span class="btn btn-outline" aria-disabled="true">শীঘ্রই আসছে</span></div>';
    } else {
      actions = '<div class="course-actions">' +
        '<a class="btn btn-outline" href="course.html?id=' + esc(id) + '">বিস্তারিত দেখুন</a>' +
        '<a class="btn" href="admission.html?course=' + esc(id) + '">ভর্তি হোন</a>' +
        '</div>';
    }
    return '<article class="course-card">' + thumb +
      '<div class="course-body"><h3>' + esc(name) + '</h3>' +
      desc + meta + fee + actions + '</div></article>';
  }

  function seedNoteHTML() {
    return '<p class="muted small">উপরের কোর্সের নামগুলো প্রতিষ্ঠানের কনফিগারেশন থেকে নেওয়া — Backend থেকে নয়। ফি, মেয়াদ ও ক্লাসের তথ্য Backend সংযুক্ত হলে দেখানো হবে।</p>';
  }

  function getQueryParam(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get(name) || '';
    } catch (e) {
      return '';
    }
  }

  function todayISO() {
    var d = new Date();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + m + '-' + day;
  }

  window.RC_PUBLIC = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    loadPublicSettings: loadPublicSettings,
    isAdmissionOpen: isAdmissionOpen,
    paymentNumbersText: paymentNumbersText,
    loadCourses: loadCourses,
    loadBatches: loadBatches,
    courseCardHTML: courseCardHTML,
    seedNoteHTML: seedNoteHTML,
    courseDisplayName: courseDisplayName,
    admissionStatusBadge: admissionStatusBadge,
    getQueryParam: getQueryParam,
    todayISO: todayISO,
    esc: esc
  };
})();
