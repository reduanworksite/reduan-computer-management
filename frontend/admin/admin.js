/* ============================================================================
 * REDUAN COMPUTER — admin.js (Phase 3, shared admin logic)
 * ----------------------------------------------------------------------------
 * Sidebar + topbar shell, theme toggle, auth guard, toast/confirm helpers,
 * course/batch dropdown loaders, status badges।
 *
 * Backend চুক্তি (backend/Code.gs):
 * - কোর্সের তালিকা admin action getCourses দিয়ে আনা হয়
 *   (includeArchived: false — Archive করা কোর্স ড্রপডাউনে আসে না)।
 * - ব্যাচের তালিকা admin action getBatches দিয়ে আনা হয়; ভর্তির জন্য
 *   শুধু Upcoming/Ongoing ও খালি আসন থাকা ব্যাচ দেখানো হয়।
 * - খরচের ইতিহাস admin action getExpenses দিয়ে আনা হয়।
 * - পাসওয়ার্ড পরিবর্তন admin action changePassword দিয়ে হয়।
 * পাসওয়ার্ড কোথাও সংরক্ষণ বা দেখানো হয় না।
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RC_CONFIG || {};
  var API = window.RC_API;

  /* ---------- 14 menus ---------- */
  var MENUS = [
    { id: 'overview', label: 'Overview', icon: '▦', href: 'overview.html' },
    { id: 'students', label: 'Students', icon: '👥', href: 'students.html' },
    { id: 'admissions', label: 'Admissions', icon: '📝', href: 'admissions.html' },
    { id: 'courses', label: 'Courses', icon: '📚', href: 'courses.html' },
    { id: 'batches', label: 'Batches', icon: '🗓️', href: 'batches.html' },
    { id: 'payments', label: 'Payments', icon: '💳', href: 'payments.html' },
    { id: 'due', label: 'Due Management', icon: '⏰', href: 'due.html' },
    { id: 'expenses', label: 'Expense Management', icon: '🧾', href: 'expenses.html' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊', href: 'reports.html' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', href: 'notifications.html' },
    { id: 'settings', label: 'Website Settings', icon: '⚙️', href: 'settings.html' },
    { id: 'backup', label: 'Backup & Restore', icon: '💾', href: 'backup.html' },
    { id: 'admin-settings', label: 'Admin Settings', icon: '👤', href: 'admin-settings.html' }
  ];

  /* ---------- Theme (localStorage 'rc-theme') ---------- */
  function getTheme() {
    try { return localStorage.getItem('rc-theme') || 'light'; } catch (e) { return 'light'; }
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
  function toggleTheme() {
    var next = getTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('rc-theme', next); } catch (e) { /* ignore */ }
    applyTheme(next);
  }
  applyTheme(getTheme());

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  function confirmDialog(msg) { return window.confirm(msg); }

  /* ---------- Auth guard ----------
   * Backend কনফিগার না থাকলে লগইন পাতায় পাঠানো হয় না — পাতাটি শূন্য
   * (0) মান + "Backend সংযুক্ত হয়নি" নোটিশ দেখাবে, যাতে অ্যাডমিন
   * বুঝতে পারেন কোনো ভুয়া সংখ্যা দেখানো হচ্ছে না। Backend কনফিগার
   * থাকলে RC_API.requireAuth() টোকেন যাচাই করে; অবৈধ হলে login.html-এ
   * পাঠায়। */
  function guardPage() {
    if (!API.isConfigured()) {
      var notice = document.getElementById('backend-notice');
      if (notice) API.showBackendNotice(notice);
      return Promise.resolve(false);
    }
    return API.requireAuth('login.html');
  }

  /* ---------- Shell: sidebar + topbar ---------- */
  function renderShell(activeMenu, pageTitle) {
    var shell = document.getElementById('shell');
    if (!shell) return;
    var user = API.getSessionUser() || {};
    var displayName = user.fullName || user.username || '';

    var navHtml = MENUS.map(function (m) {
      return '<a href="' + m.href + '" class="' + (m.id === activeMenu ? 'active' : '') + '">' +
        '<span class="nav-icon">' + m.icon + '</span>' + API.esc(m.label) + '</a>';
    }).join('');

    shell.innerHTML =
      '<aside class="sidebar" id="sidebar" aria-label="Admin menu">' +
        '<div class="sidebar-brand">' +
          '<div class="brand-name">' + API.esc(CFG.BUSINESS_NAME || 'REDUAN COMPUTER') + '</div>' +
          '<div class="brand-slogan">' + API.esc(CFG.SLOGAN || '') + '</div>' +
        '</div>' +
        '<nav class="sidebar-nav">' + navHtml +
          '<a href="#" id="logout-link" class="logout-link"><span class="nav-icon">🚪</span>Logout</a>' +
        '</nav>' +
        '<div class="sidebar-foot">' + API.esc(CFG.ADDRESS || '') + '<br>' + API.esc(CFG.PHONE || '') + '</div>' +
      '</aside>' +
      '<div class="sidebar-overlay" id="sidebar-overlay"></div>' +
      '<header class="topbar">' +
        '<button class="icon-btn hamburger" id="hamburger" aria-label="Menu">☰</button>' +
        '<h1>' + API.esc(pageTitle || 'Admin Dashboard') + '</h1>' +
        '<button class="icon-btn" id="notif-btn" title="Notifications" onclick="window.location.href=\'notifications.html\'">🔔<span class="notif-count hidden" id="notif-count"></span></button>' +
        '<button class="icon-btn" id="theme-toggle" title="Theme">🌙 Dark</button>' +
        (displayName ? '<span class="topbar-user">' + API.esc(displayName) + '</span>' : '') +
      '</header>';

    applyTheme(getTheme());

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('logout-link').addEventListener('click', function (e) {
      e.preventDefault();
      if (confirmDialog('লগআউট করতে চান?')) API.logout();
    });
    var burger = document.getElementById('hamburger');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    burger.addEventListener('click', function () {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    });
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    });

    loadUnreadCount();
  }

  /* Unread notification count — শুধু backend কনফিগার থাকলে।
   * getNotifications কোনো count দেয় না, তাই unread তালিকা (সর্বোচ্চ 50)
   * এনে তার দৈর্ঘ্য দেখানো হয়; 50-এর বেশি হলে "50+" দেখায়। */
  function loadUnreadCount() {
    if (!API.isConfigured()) return;
    API.call('getNotifications', { unreadOnly: true, limit: 50 }).then(function (res) {
      if (!res.ok || !Array.isArray(res.data)) return;
      var n = res.data.length;
      var badge = document.getElementById('notif-count');
      if (!badge) return;
      if (n > 0) {
        badge.textContent = n >= 50 ? '50+' : String(n);
        badge.classList.remove('hidden');
      }
    }).catch(function () { /* নোটিফিকেশন সংখ্যা না দেখাতে পারলে চুপচাপ থাকবে */ });
  }

  /* ---------- Dropdown loaders ---------- */
  function loadCourseOptions(selectEl, placeholder) {
    if (!selectEl) return Promise.resolve([]);
    selectEl.innerHTML = '<option value="">' + API.esc(placeholder || 'কোর্স নির্বাচন করুন') + '</option>';
    if (!API.isConfigured()) { selectEl.disabled = true; return Promise.resolve([]); }
    /* Admin action getCourses — Archive করা কোর্স ড্রপডাউনে আসবে না। */
    return API.call('getCourses', { includeArchived: false }).then(function (res) {
      if (!res.ok || !Array.isArray(res.data)) {
        toast(res.error || 'কোর্সের তালিকা আনা যায়নি।', 'error');
        return [];
      }
      res.data.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.courseId;
        opt.textContent = c.name + (c.nameBn ? ' (' + c.nameBn + ')' : '');
        selectEl.appendChild(opt);
      });
      return res.data;
    });
  }

  function loadBatchOptions(selectEl, courseId, placeholder) {
    if (!selectEl) return Promise.resolve([]);
    selectEl.innerHTML = '<option value="">' + API.esc(placeholder || 'ব্যাচ নির্বাচন করুন') + '</option>';
    if (!courseId) { selectEl.disabled = true; return Promise.resolve([]); }
    if (!API.isConfigured()) { selectEl.disabled = true; return Promise.resolve([]); }
    selectEl.disabled = false;
    /* Admin action getBatches — ভর্তির জন্য শুধু Upcoming/Ongoing ও
     * খালি আসন থাকা ব্যাচ দেখানো হয় (আগের public তালিকার মতোই)। */
    return API.call('getBatches', { courseId: courseId }).then(function (res) {
      if (!res.ok || !Array.isArray(res.data)) {
        toast(res.error || 'ব্যাচের তালিকা আনা যায়নি।', 'error');
        return [];
      }
      res.data.forEach(function (b) {
        if (b.status !== 'Upcoming' && b.status !== 'Ongoing') return;
        if (b.seatsLeft !== undefined && b.seatsLeft !== null && b.seatsLeft <= 0) return;
        var opt = document.createElement('option');
        opt.value = b.batchId;
        opt.textContent = b.batchName +
          (b.seatsLeft !== undefined && b.seatsLeft !== null ? ' — খালি আসন: ' + b.seatsLeft : '');
        selectEl.appendChild(opt);
      });
      return res.data;
    });
  }

  /* ---------- Status badges ---------- */
  function studentStatusBadge(status) {
    var map = {
      'Active': 'badge-success',
      'Pending': 'badge-warning',
      'Completed': 'badge-info',
      'Inactive': '',
      'Cancelled': 'badge-danger'
    };
    return '<span class="badge ' + (map[status] || '') + '">' + API.esc(status || '—') + '</span>';
  }
  function paymentStatusBadge(status) {
    var map = {
      'Paid': 'badge-success',
      'Partial Paid': 'badge-warning',
      'Unpaid': 'badge-danger',
      'Overpaid': 'badge-info'
    };
    return '<span class="badge ' + (map[status] || '') + '">' + API.esc(status || '—') + '</span>';
  }

  /* ---------- Shared helpers ---------- */
  function setLoading(el, loading) {
    if (!el) return;
    el.innerHTML = loading
      ? '<tr><td colspan="12" class="text-center"><span class="spinner"></span> লোড হচ্ছে…</td></tr>'
      : '';
  }
  function emptyRow(el, cols, msg) {
    if (!el) return;
    el.innerHTML = '<tr><td colspan="' + cols + '" class="empty-state">' + API.esc(msg || 'কোনো তথ্য পাওয়া যায়নি।') + '</td></tr>';
  }
  function todayISO() {
    var d = new Date();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + m + '-' + day;
  }

  window.RC_ADMIN = {
    MENUS: MENUS,
    renderShell: renderShell,
    guardPage: guardPage,
    toast: toast,
    confirmDialog: confirmDialog,
    loadCourseOptions: loadCourseOptions,
    loadBatchOptions: loadBatchOptions,
    studentStatusBadge: studentStatusBadge,
    paymentStatusBadge: paymentStatusBadge,
    setLoading: setLoading,
    emptyRow: emptyRow,
    todayISO: todayISO,
    getTheme: getTheme,
    toggleTheme: toggleTheme
  };
})();
