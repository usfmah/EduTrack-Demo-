/* EduTrack Demo — js/app.js (vanilla, no dependencies)
 * Owns: toast, badgeFor, toggleSidebar, initBells + page wiring for
 * instructor.html / student.html. Guarded when window.EduData is missing.
 * Also preserves foundation behaviors: #navToggle/#navLinks, legacy bell ids.
 */
(function () {
  'use strict';

  function getData() {
    return (typeof window !== 'undefined' && window.EduData) ? window.EduData : null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pick(obj) {
    for (var i = 1; i < arguments.length; i++) {
      var k = arguments[i];
      if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return '';
  }

  /* ---------------- demo persistence (localStorage, no backend) ---------------- */
  var LS_KEYS = {
    instructorTasks: 'edu_instructor_tasks_extra',
    studentTasks: 'edu_student_tasks_extra',
    materials: 'edu_materials_extra'
  };
  function loadExtra(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveExtra(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }
  function mergeExtras() {
    var d = getData();
    if (!d || d.__merged) return d;
    d.__merged = true;
    ['instructorTasks', 'studentTasks', 'materials'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
      var extra = loadExtra(LS_KEYS[k]);
      if (extra.length) d[k] = extra.concat(d[k]);
    });
    return d;
  }
  function addInstructorTask(task) {
    var d = mergeExtras() || getData();
    if (d && Array.isArray(d.instructorTasks)) d.instructorTasks.unshift(task);
    var extra = loadExtra(LS_KEYS.instructorTasks);
    extra.unshift(task);
    saveExtra(LS_KEYS.instructorTasks, extra);
    addHistory(task.title, 'Manager', '—', task.status || 'Not Started');
    pushNotification('New task assigned: ' + (task.title || 'Untitled'), (task.instructor || '') + ' · due ' + (task.deadline || '—'));
    try { if (typeof window.__managerRefresh === 'function') window.__managerRefresh(); } catch (e) {}
    return task;
  }
  function addStudentTask(task) {
    var d = mergeExtras() || getData();
    if (d && Array.isArray(d.studentTasks)) d.studentTasks.unshift(task);
    var extra = loadExtra(LS_KEYS.studentTasks);
    extra.unshift(task);
    saveExtra(LS_KEYS.studentTasks, extra);
    return task;
  }
  function addMaterial(mat) {
    var d = mergeExtras() || getData();
    if (d) {
      if (!Array.isArray(d.materials)) d.materials = [];
      d.materials.unshift(mat);
    }
    var extra = loadExtra(LS_KEYS.materials);
    extra.unshift(mat);
    saveExtra(LS_KEYS.materials, extra);
    addHistory(mat.title, mat.owner || 'Instructor', '—', mat.status || 'Draft');
    pushNotification('Course material: ' + (mat.title || 'Untitled'), (mat.course || '') + ' · ' + (mat.status || 'Draft'));
    try { if (typeof window.__managerRefresh === 'function') window.__managerRefresh(); } catch (e) {}
    return mat;
  }
  function addHistory(taskTitle, actor, from, to) {
    var d = getData();
    if (!d || !Array.isArray(d.history)) return;
    var now = new Date();
    var stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') +
      ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    d.history.unshift({ id: 'H-' + Date.now(), task: taskTitle, actor: actor, from: from, to: to, time: stamp });
  }
  function todayISO() {
    var n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
  }

  /* ---------------- toast(msg) ----------------
   * Creates a .toast bottom-right, auto-dismiss 2.5s. Uses the shared
   * #toast-wrap container; compatible with css/style.css (.toast.show). */
  function toast(msg) {
    try {
      var wrap = document.getElementById('toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toast-wrap';
        wrap.setAttribute('aria-live', 'polite');
        wrap.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;';
        document.body.appendChild(wrap);
      }
      var el = document.createElement('div');
      el.className = 'toast show';
      el.setAttribute('role', 'status');
      el.textContent = String(msg || 'Done');
      el.style.display = 'block';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity .25s ease,transform .25s ease';
      el.style.borderLeft = '4px solid var(--amber,#F59E0B)';
      wrap.appendChild(el);
      requestAnimationFrame(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      setTimeout(function () {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
      }, 2500);
    } catch (e) { /* noop */ }
  }

  /* ---------------- badgeFor(status) ----------------
   * Maps a status string to a css/style.css badge class.
   * Variants in style.css: badge-success/-warning/-danger/-info/-neutral */
  function badgeFor(status) {
    var s = String(status || '').toLowerCase().trim();
    if (!s) return 'badge badge-neutral';
    if (/(overdue|late|missing|failed|rejected|at-risk|risk)/.test(s)) return 'badge badge-danger';
    if (/(revision|resubmit)/.test(s)) return 'badge badge-danger';
    if (/(completed|approved|graded|done|success)/.test(s)) return 'badge badge-success';
    if (s === 'submitted' || s.indexOf('submitted') >= 0) return 'badge badge-info';
    if (/(in progress|in-progress|active|ongoing)/.test(s)) return 'badge badge-info';
    if (/(pending|waiting|todo|to do)/.test(s)) return 'badge badge-warning';
    if (/(under review|in review|to review|awaiting|review)/.test(s)) return 'badge badge-warning';
    if (/(not started|draft|new|assigned)/.test(s)) return 'badge badge-neutral';
    return 'badge badge-neutral';
  }

  /* ---------------- toggleSidebar() ---------------- */
  function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  }

  /* ---------------- bells ---------------- */
  function parseDeadline(d) {
    if (!d) return null;
    var t = Date.parse(d);
    return isNaN(t) ? null : new Date(t);
  }

  function countdownLabel(deadlineStr, status) {
    var st = String(status || '').toLowerCase();
    if (/completed|approved|graded|submitted/.test(st)) return 'Done';
    var d = parseDeadline(deadlineStr);
    if (!d) return String(deadlineStr || '—');
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var dd = new Date(d); dd.setHours(0, 0, 0, 0);
    var diff = Math.round((dd - now) / 86400000);
    if (diff < 0) return 'Overdue by ' + Math.abs(diff) + 'd';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return 'Due in ' + diff + 'd';
  }

  function isOverdue(deadlineStr, status) {
    var st = String(status || '').toLowerCase();
    if (/completed|approved|graded|submitted/.test(st)) return false;
    if (/overdue/.test(st)) return true;
    var d = parseDeadline(deadlineStr);
    if (!d) return false;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var dd = new Date(d); dd.setHours(0, 0, 0, 0);
    return dd < now;
  }

  function notificationHTML(n) {
    var title = esc(pick(n, 'title', 'task', 'name', 'label') || 'Notification');
    var body = esc(pick(n, 'desc', 'text', 'message', 'body', 'detail') || '');
    var time = esc(pick(n, 'time', 'date', 'when') || '');
    return '<div class="notification-item" style="box-shadow:none;"><div><strong>' + title + '</strong>' +
      (body ? '<p style="margin:4px 0 0;color:var(--muted);font-size:13px;">' + body + '</p>' : '') +
      (time ? '<small style="color:var(--muted);">' + time + '</small>' : '') + '</div></div>';
  }

  function renderBellDropdowns() {
    var data = getData();
    if (!data || !Array.isArray(data.notifications)) return; // keep static fallback
    var list = data.notifications.slice(0, 6);
    var html = list.length
      ? list.map(notificationHTML).join('') + '<div style="padding:8px 12px;font-size:12px;color:var(--muted);">Demo notifications · front-end only</div>'
      : '<div class="notification-item">No notifications</div>';
    document.querySelectorAll('[data-bell-dropdown],#bellDropdown,#bellList').forEach(function (dd) {
      if (dd.id === 'bellList') { dd.innerHTML = list.map(notificationHTML).join('') || '<p style="padding:1rem;color:var(--muted)">No notifications.</p>'; return; }
      dd.innerHTML = '<div style="padding:8px 12px;font-weight:800;border-bottom:1px solid var(--border);">Notifications</div>' + html;
    });
  }

  function updateBellCounts() {
    var data = getData();
    if (!data || !Array.isArray(data.notifications)) return;
    var n = data.notifications.length;
    document.querySelectorAll('#bellCount,[data-bell-count]').forEach(function (el) {
      el.textContent = n > 9 ? '9+' : String(n);
    });
  }

  function pushNotification(title, text) {
    var data = getData();
    var item = { id: 'n' + Date.now(), title: title, desc: text, time: 'Just now', type: 'info' };
    if (data && Array.isArray(data.notifications)) data.notifications.unshift(item);
    renderBellDropdowns();
    renderNotificationsPanel();
    updateBellCounts();
  }

  function closeAllBells(except) {
    document.querySelectorAll('[data-bell-dropdown],#bellDropdown,.bell-menu,[data-bell-menu]').forEach(function (dd) {
      if (dd !== except) { dd.classList.remove('show', 'open'); if (dd.hasAttribute('hidden') === false && dd.id === 'bellDropdown') dd.style.display = 'none'; }
    });
  }

  /* initBells(): wire all [data-bell] (+ compat [data-bell-btn], #bellBtn)
   * to dropdown using EduData.notifications. */
  function initBells() {
    renderBellDropdowns();
    updateBellCounts();
    var btns = document.querySelectorAll('[data-bell],[data-bell-btn],#bellBtn');
    btns.forEach(function (btn) {
      if (btn.__eduWired) return;
      btn.__eduWired = true;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('.bell-wrap') || btn.parentElement;
        var dd = (wrap && wrap.querySelector('[data-bell-dropdown],#bellDropdown,.bell-menu,[data-bell-menu]')) ||
          document.getElementById('bellDropdown') || document.querySelector('[data-bell-menu]');
        if (!dd) return;
        renderBellDropdowns();
        var isOpen = dd.classList.contains('show') || dd.classList.contains('open') || dd.style.display === 'block';
        closeAllBells(dd);
        if (!isOpen) {
          dd.classList.add('show', 'open');
          dd.removeAttribute('hidden');
          dd.style.display = 'block';
          btn.setAttribute('aria-expanded', 'true');
        } else {
          dd.classList.remove('show', 'open');
          dd.style.display = 'none';
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
    // legacy #bellBtn/#bellMenu pair
    var legacyBtn = document.getElementById('bellBtn');
    var legacyMenu = document.getElementById('bellMenu');
    if (legacyBtn && legacyMenu && !legacyBtn.__eduWired) {
      legacyBtn.__eduWired = true;
      legacyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        legacyMenu.classList.toggle('open');
      });
    }
    if (!document.__eduBellOutside) {
      document.__eduBellOutside = true;
      document.addEventListener('click', function () { closeAllBells(null); });
    }
  }

  /* ---------------- progress + counters ---------------- */
  function animateProgress(scope) {
    (scope || document).querySelectorAll('.progress-fill[data-progress],.bar-fill[data-progress]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-progress')) || 0;
      target = Math.max(0, Math.min(100, target));
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.width = target + '%'; });
      });
      el.setAttribute('aria-valuenow', String(target));
    });
    // plain .progress-fill with inline width: re-trigger transition
    (scope || document).querySelectorAll('.progress-fill:not([data-progress])').forEach(function (el) {
      var w = el.style.width || '0%';
      el.style.transition = 'width 1s ease';
      el.style.width = '0%';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.width = w; });
      });
    });
    document.querySelectorAll('[data-ring]').forEach(function (el) {
      if (el.__ringDone) return; el.__ringDone = true;
      var pct = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-ring')) || 0));
      var cur = 0;
      var step = function () {
        cur = Math.min(pct, cur + 2);
        el.style.background = 'conic-gradient(var(--primary) ' + cur + '%, var(--border) ' + cur + '%)';
        var label = el.querySelector('[data-ring-label]');
        if (label) label.textContent = Math.round(cur) + '%';
        if (cur < pct) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function animateCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    counters.forEach(function (el) {
      if (el.__counted) return; el.__counted = true;
      var raw = el.getAttribute('data-count') || el.textContent || '0';
      var target = parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (!('IntersectionObserver' in window)) {
        el.textContent = (String(raw).indexOf('.') >= 0 ? target.toFixed(1) : String(Math.round(target))) + suffix;
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(el);
          var start = null, dur = 900;
          var isFloat = String(raw).indexOf('.') >= 0;
          var frame = function (ts) {
            if (!start) start = ts;
            var p = Math.min(1, (ts - start) / dur);
            var v = target * (1 - Math.pow(1 - p, 2));
            el.textContent = (isFloat ? v.toFixed(1) : String(Math.round(v))) + suffix;
            if (p < 1) requestAnimationFrame(frame);
            else el.textContent = (isFloat ? target.toFixed(1) : String(Math.round(target))) + suffix;
          };
          requestAnimationFrame(frame);
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.visible)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initSearch() {
    var input = document.querySelector('[data-search],#searchInput,#instructorSearch');
    if (!input || input.__eduWired) return;
    input.__eduWired = true;
    var selector = input.getAttribute('data-search-target') || '[data-searchable]';
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      document.querySelectorAll(selector).forEach(function (row) {
        var txt = (row.textContent || '').toLowerCase();
        row.style.display = (!q || txt.indexOf(q) >= 0) ? '' : 'none';
      });
    });
  }

  function initNavToggle() {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (toggle && links && !toggle.__eduWired) {
      toggle.__eduWired = true;
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) links.classList.remove('open');
      });
    }
    document.querySelectorAll('[data-sidebar-toggle]').forEach(function (b) {
      if (b.__eduWired) return; b.__eduWired = true;
      b.addEventListener('click', toggleSidebar);
    });
  }

  /* ============ INSTRUCTOR PAGE ============ */
  var STATUS_CYCLE = ['Not Started', 'In Progress', 'Under Review', 'Completed'];

  function renderInstructorTasks() {
    var tbody = document.getElementById('instructorTasksBody');
    if (!tbody) return;
    var data = mergeExtras() || getData();
    if (!data || !Array.isArray(data.instructorTasks) || !data.instructorTasks.length) return;
    var rows = data.instructorTasks.slice(0, 8);
    tbody.innerHTML = rows.map(function (t, i) {
      var title = esc(pick(t, 'title', 'task', 'name') || 'Untitled task');
      var course = esc(pick(t, 'course', 'subject', 'module') || '—');
      var deadline = esc(pick(t, 'deadline', 'due', 'dueDate', 'date') || '—');
      var status = pick(t, 'status', 'state') || 'Not Started';
      var prog = Math.max(0, Math.min(100, parseFloat(pick(t, 'progress', 'completion', 'percent')) || 0));
      return '<tr data-searchable><td><strong>' + title + '</strong></td><td>' + course + '</td><td>' + deadline + '</td>' +
        '<td><span class="' + badgeFor(status) + '">' + esc(status) + '</span></td>' +
        '<td style="min-width:140px;"><div class="progress-track"><div class="progress-fill" data-progress="' + prog + '" style="width:0%"></div></div><small style="color:var(--muted)">' + Math.round(prog) + '%</small></td>' +
        '<td><button class="btn btn-ghost" data-update-status="' + i + '">Update status</button></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-update-status]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = getData(); if (!d) return;
        var idx = parseInt(btn.getAttribute('data-update-status'), 10);
        var task = d.instructorTasks[idx];
        var cur = pick(task, 'status', 'state') || 'Not Started';
        var at = STATUS_CYCLE.indexOf(cur);
        var next = STATUS_CYCLE[(at + 1 + STATUS_CYCLE.length) % STATUS_CYCLE.length] || 'In Progress';
        task.status = next;
        if (next === 'Completed') task.progress = 100;
        else if (next === 'Not Started') task.progress = 0;
        else if (!task.progress) task.progress = 40;
        renderInstructorTasks();
        toast('Status updated to "' + next + '"');
      });
    });
    animateProgress(tbody);
  }

  function renderInstructorStudentTable() {
    var tbody = document.getElementById('studentTasksBody');
    if (!tbody) return;
    var data = mergeExtras() || getData();
    if (!data || !Array.isArray(data.studentTasks) || !data.studentTasks.length) return;
    var all = data.studentTasks;
    tbody.innerHTML = all.map(function (t) {
      var id = esc(pick(t, 'id', '_id') || '');
      var title = esc(pick(t, 'title', 'task', 'name') || 'Untitled');
      var assignee = esc(pick(t, 'assignee', 'student', 'owner') || '—');
      var lesson = esc(pick(t, 'lesson', 'course', 'module') || '—');
      var dlRaw = pick(t, 'deadline', 'due', 'dueDate');
      var deadline = esc(dlRaw || '—');
      var status = pick(t, 'status', 'state') || 'Pending';
      var cd = countdownLabel(dlRaw, status);
      var over = isOverdue(dlRaw, status);
      return '<tr data-searchable data-task-id="' + id + '">' +
        '<td><strong>' + title + '</strong><br><small style="color:var(--muted)">' + esc(cd) + '</small></td>' +
        '<td>' + assignee + '</td><td><span class="badge badge-info">' + lesson + '</span></td>' +
        '<td>' + deadline + (over ? ' <span class="' + badgeFor('Overdue') + '">Overdue</span>' : '') + '</td>' +
        '<td><span class="' + badgeFor(status) + '">' + esc(status) + '</span></td>' +
        '<td><button class="btn btn-ghost" data-review-task>Review</button></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-review-task]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('tr');
        var title = row && row.querySelector('strong') ? row.querySelector('strong').textContent : 'Task';
        toast('Opened review for "' + title + '" — see Review Queue');
        var q = document.getElementById('reviews');
        if (q && q.scrollIntoView) q.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initTaskModal() {
    var modal = document.getElementById('taskModal');
    if (!modal) return;
    var openBtn = document.getElementById('openTaskModalBtn');
    var closeBtn = document.getElementById('closeTaskModalBtn');
    var cancelBtn = document.getElementById('cancelTaskModalBtn');
    var form = document.getElementById('taskModalForm');
    var lessonSel = document.getElementById('taskLesson');
    var assigneeSel = document.getElementById('taskAssignee');
    function open() { modal.removeAttribute('hidden'); modal.classList.add('show'); modal.style.display = 'flex'; }
    function close() { modal.setAttribute('hidden', ''); modal.classList.remove('show'); modal.style.display = 'none'; }
    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close(); });
    var data = getData();
    if (data && lessonSel && Array.isArray(data.courses) && data.courses.length && lessonSel.options.length <= 1) {
      lessonSel.innerHTML = '';
      data.courses.forEach(function (c) {
        var n = pick(c, 'title', 'name'); if (!n) return;
        var o = document.createElement('option'); o.value = n; o.textContent = n; lessonSel.appendChild(o);
      });
    }
    if (data && assigneeSel && Array.isArray(data.students) && data.students.length && assigneeSel.options.length <= 1) {
      assigneeSel.innerHTML = '';
      data.students.forEach(function (s) {
        var n = pick(s, 'name'); if (!n) return;
        var o = document.createElement('option'); o.value = n; o.textContent = n; assigneeSel.appendChild(o);
      });
    }
    if (form && !form.__eduWired) {
      form.__eduWired = true;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var titleEl = document.getElementById('taskTitle');
        var dlEl = document.getElementById('taskDeadline');
        var title = titleEl ? titleEl.value : '';
        var lesson = lessonSel ? lessonSel.value : '';
        var assignee = assigneeSel ? assigneeSel.value : '';
        var deadline = dlEl ? dlEl.value : '';
        if (!String(title).trim()) { toast('Please enter a task title'); return; }
        var task = { id: 'local-' + Date.now(), title: String(title).trim(), lesson: lesson, course: lesson, assignee: assignee || 'Unassigned', student: assignee, deadline: deadline, due: deadline, status: 'Not Started' };
        addStudentTask(task);
        addHistory(task.title, 'Instructor', '—', 'Not Started');
        pushNotification('New student task: ' + task.title, (task.assignee || '') + ' · due ' + (task.deadline || '—'));
        renderInstructorStudentTable();
        renderUpcomingDeadlines();
        updateInstructorKPIs();
        close();
        form.reset();
        toast('Student task "' + task.title + '" created');
      });
    }
    var submitMat = document.getElementById('submitMaterialBtn');
    if (submitMat && !submitMat.__eduWired) {
      submitMat.__eduWired = true;
      submitMat.addEventListener('click', function () {
        var mm = document.getElementById('materialModal');
        if (mm) { openMaterialModal(); }
        else { toast('Material submitted for review'); }
      });
    }
  }

  /* ============ ASSIGN TASK (Manager → Instructor, FR-013) ============ */
  function fillAssignSelects() {
    var d = mergeExtras() || getData();
    var insSel = document.getElementById('assignInstructor');
    if (insSel && d) {
      var names = [];
      (d.instructorTasks || []).forEach(function (t) {
        var n = pick(t, 'instructor');
        if (n && names.indexOf(n) < 0) names.push(n);
      });
      ['Sarah Chen', 'David Okafor', 'Priya Nair', 'Emily Roberts', 'Michael Torres'].forEach(function (n) {
        if (names.indexOf(n) < 0) names.push(n);
      });
      var cur = insSel.value;
      insSel.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
      if (cur) insSel.value = cur;
    }
    var courseSel = document.getElementById('assignCourse');
    if (courseSel && d && Array.isArray(d.courses) && d.courses.length) {
      var cur2 = courseSel.value;
      courseSel.innerHTML = d.courses.map(function (c) {
        var n = pick(c, 'title', 'name'); return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
      }).join('');
      if (cur2) courseSel.value = cur2;
    }
    var dl = document.getElementById('assignDeadline');
    if (dl && !dl.value) dl.value = todayISO();
  }
  function openAssignModal() {
    var modal = document.getElementById('assignModal');
    if (!modal) { toast('Assign-task dialog not available on this page'); return; }
    fillAssignSelects();
    modal.removeAttribute('hidden');
    modal.classList.add('show');
    modal.style.display = 'flex';
    var title = document.getElementById('assignTitle');
    if (title) setTimeout(function () { title.focus(); }, 50);
  }
  function closeAssignModal() {
    var modal = document.getElementById('assignModal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  function initAssignModal() {
    var modal = document.getElementById('assignModal');
    var openBtns = document.querySelectorAll('#assignBtn, #openAssignModalBtn, [data-open-assign]');
    openBtns.forEach(function (b) {
      if (b.__eduAssignWired) return; b.__eduAssignWired = true;
      b.addEventListener('click', function (e) { e.preventDefault(); openAssignModal(); });
    });
    if (!modal || modal.__eduWired) return;
    modal.__eduWired = true;
    modal.addEventListener('click', function (e) { if (e.target === modal) closeAssignModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeAssignModal(); });
    var closeBtn = document.getElementById('closeAssignModalBtn');
    var cancelBtn = document.getElementById('cancelAssignModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeAssignModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAssignModal);
    fillAssignSelects();
    var form = document.getElementById('assignForm');
    if (form && !form.__eduWired) {
      form.__eduWired = true;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var titleEl = document.getElementById('assignTitle');
        var insEl = document.getElementById('assignInstructor');
        var courseEl = document.getElementById('assignCourse');
        var dlEl = document.getElementById('assignDeadline');
        var priEl = document.getElementById('assignPriority');
        var descEl = document.getElementById('assignDesc');
        var title = titleEl ? String(titleEl.value || '').trim() : '';
        if (!title) { toast('Please enter a task title'); return; }
        var instructor = insEl ? insEl.value : '';
        var course = courseEl ? courseEl.value : '';
        var deadline = dlEl ? dlEl.value : '';
        if (!deadline) { toast('Please pick a deadline'); return; }
        var task = {
          id: 'INS-' + Date.now().toString().slice(-6),
          title: title,
          instructor: instructor || 'Unassigned',
          course: course || 'General',
          deadline: deadline,
          status: 'Not Started',
          progress: 5,
          priority: priEl ? priEl.value : 'Normal',
          desc: descEl ? String(descEl.value || '').trim() : ''
        };
        addInstructorTask(task);
        renderInstructorTasks();
        updateInstructorKPIs();
        renderHistory();
        closeAssignModal();
        form.reset();
        fillAssignSelects();
        toast('Task "' + task.title + '" assigned to ' + task.instructor);
      });
    }
  }

  /* ============ COURSE MATERIALS (FR-017/FR-018, create + review) ============ */
  function matBadge(status) { return badgeFor(status); }
  function openMaterialModal() {
    var modal = document.getElementById('materialModal');
    if (!modal) return;
    var d = mergeExtras() || getData();
    var courseSel = document.getElementById('matCourse');
    if (courseSel && d && Array.isArray(d.courses) && d.courses.length) {
      var cur = courseSel.value;
      courseSel.innerHTML = d.courses.map(function (c) {
        var n = pick(c, 'title', 'name'); return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
      }).join('');
      if (cur) courseSel.value = cur;
    }
    modal.removeAttribute('hidden');
    modal.classList.add('show');
    modal.style.display = 'flex';
    var t = document.getElementById('matTitle');
    if (t) setTimeout(function () { t.focus(); }, 50);
  }
  function closeMaterialModal() {
    var modal = document.getElementById('materialModal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  function setMaterialStatus(id, next, actor) {
    var d = mergeExtras() || getData();
    if (!d || !Array.isArray(d.materials)) return;
    var found = null;
    d.materials.forEach(function (m) { if (String(pick(m, 'id')) === String(id)) found = m; });
    if (!found) return;
    var prev = found.status;
    found.status = next;
    found.updated = todayISO();
    addHistory(found.title, actor || 'Reviewer', prev, next);
    pushNotification('Material ' + next.toLowerCase() + ': ' + found.title, (found.course || '') + ' · by ' + (found.owner || ''));
    renderMaterialsList();
    renderMaterialsReview();
    renderStudentMaterials();
    renderHistory();
    try { if (typeof window.__managerRefresh === 'function') window.__managerRefresh(); } catch (e) {}
  }
  function materialCardHTML(m) {
    var id = esc(pick(m, 'id') || '');
    var title = esc(pick(m, 'title') || 'Untitled material');
    var course = esc(pick(m, 'course') || 'General');
    var type = esc(pick(m, 'type') || 'Doc');
    var owner = esc(pick(m, 'owner') || 'Instructor');
    var updated = esc(pick(m, 'updated') || '');
    var status = pick(m, 'status') || 'Draft';
    var desc = esc(pick(m, 'desc') || '');
    var link = pick(m, 'link') || '';
    return '<div class="card reveal visible" data-searchable data-material-id="' + id + '">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
      '<span class="badge badge-info">' + type + '</span>' +
      '<span class="' + matBadge(status) + '" data-mat-status>' + esc(status) + '</span>' +
      '<span style="margin-left:auto;font-size:12px;color:var(--muted);">' + updated + '</span></div>' +
      '<strong style="display:block;margin:8px 0 2px;">' + title + '</strong>' +
      '<small style="color:var(--muted);">' + course + ' · by ' + owner + '</small>' +
      (desc ? '<p style="color:var(--muted);font-size:13px;margin:8px 0 0;">' + desc + '</p>' : '') +
      (link ? '<p style="font-size:13px;margin:6px 0 0;"><a href="' + esc(link) + '" target="_blank" rel="noopener">Open link ↗</a></p>' : '') +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">' +
      '<button class="btn btn-ghost" data-mat-submit>Submit for review</button>' +
      '<button class="btn btn-primary" data-mat-approve>Approve</button>' +
      '<button class="btn btn-ghost" data-mat-revise>Request revision</button>' +
      '</div></div>';
  }
  function wireMaterialCards(scope) {
    (scope || document).querySelectorAll('[data-material-id]').forEach(function (card) {
      if (card.__eduWired) return; card.__eduWired = true;
      var id = card.getAttribute('data-material-id');
      var sub = card.querySelector('[data-mat-submit]');
      var app = card.querySelector('[data-mat-approve]');
      var rev = card.querySelector('[data-mat-revise]');
      if (sub) sub.addEventListener('click', function () {
        setMaterialStatus(id, 'Submitted', 'Instructor');
        toast('Material submitted for review');
      });
      if (app) app.addEventListener('click', function () {
        setMaterialStatus(id, 'Approved', 'Manager');
        toast('Material approved & published');
      });
      if (rev) rev.addEventListener('click', function () {
        setMaterialStatus(id, 'Revision Required', 'Reviewer');
        toast('Revision requested');
      });
    });
  }
  function renderMaterialsList() {
    var wrap = document.getElementById('materialsList');
    if (!wrap) return;
    var d = mergeExtras() || getData();
    if (!d || !Array.isArray(d.materials)) return;
    if (!d.materials.length) { wrap.innerHTML = '<p style="color:var(--muted)">No materials yet — click “New material”.</p>'; return; }
    wrap.innerHTML = d.materials.map(materialCardHTML).join('');
    wireMaterialCards(wrap);
  }
  function renderMaterialsReview() {
    var wrap = document.getElementById('materialsReviewList');
    if (!wrap) return;
    var d = mergeExtras() || getData();
    if (!d || !Array.isArray(d.materials)) return;
    var queue = d.materials.filter(function (m) { return /submitted|under review|draft|revision/i.test(String(pick(m, 'status') || '')); });
    var show = queue.length ? queue : d.materials.slice(0, 4);
    wrap.innerHTML = show.map(materialCardHTML).join('');
    wireMaterialCards(wrap);
    var count = document.getElementById('materialsReviewCount');
    if (count) count.textContent = queue.length;
  }
  function renderStudentMaterials() {
    var wrap = document.getElementById('studentMaterialsList');
    if (!wrap) return;
    var d = mergeExtras() || getData();
    if (!d || !Array.isArray(d.materials)) return;
    var pub = d.materials.filter(function (m) { return /approved|submitted|under review/i.test(String(pick(m, 'status') || '')); });
    if (!pub.length) { wrap.innerHTML = '<p style="color:var(--muted)">No published materials yet.</p>'; return; }
    wrap.innerHTML = pub.slice(0, 6).map(function (m) {
      var title = esc(pick(m, 'title') || 'Untitled');
      var course = esc(pick(m, 'course') || '');
      var type = esc(pick(m, 'type') || 'Doc');
      var status = pick(m, 'status') || '';
      var link = pick(m, 'link') || '';
      return '<div class="card" data-searchable><span class="badge badge-info">' + type + '</span> ' +
        '<span class="' + matBadge(status) + '">' + esc(status) + '</span>' +
        '<strong style="display:block;margin:6px 0;">' + title + '</strong>' +
        '<small style="color:var(--muted)">' + course + '</small>' +
        (link ? '<div style="margin-top:6px;"><a href="' + esc(link) + '" target="_blank" rel="noopener">Open ↗</a></div>' : '') + '</div>';
    }).join('');
  }
  function initMaterialModal() {
    var modal = document.getElementById('materialModal');
    var openBtns = document.querySelectorAll('#openMaterialModalBtn, [data-open-material]');
    openBtns.forEach(function (b) {
      if (b.__eduMatWired) return; b.__eduMatWired = true;
      b.addEventListener('click', function (e) { e.preventDefault(); openMaterialModal(); });
    });
    if (!modal || modal.__eduWired) return;
    modal.__eduWired = true;
    modal.addEventListener('click', function (e) { if (e.target === modal) closeMaterialModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeMaterialModal(); });
    var closeBtn = document.getElementById('closeMaterialModalBtn');
    var cancelBtn = document.getElementById('cancelMaterialModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeMaterialModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeMaterialModal);
    var form = document.getElementById('materialForm');
    if (form && !form.__eduWired) {
      form.__eduWired = true;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var titleEl = document.getElementById('matTitle');
        var courseEl = document.getElementById('matCourse');
        var typeEl = document.getElementById('matType');
        var linkEl = document.getElementById('matLink');
        var descEl = document.getElementById('matDesc');
        var ownerEl = document.getElementById('matOwner');
        var title = titleEl ? String(titleEl.value || '').trim() : '';
        if (!title) { toast('Please enter a material title'); return; }
        var mat = {
          id: 'MAT-' + Date.now().toString().slice(-6),
          title: title,
          course: courseEl ? courseEl.value : 'General',
          type: typeEl ? typeEl.value : 'Doc',
          owner: ownerEl && ownerEl.value ? ownerEl.value : 'Instructor',
          link: linkEl ? String(linkEl.value || '').trim() : '',
          desc: descEl ? String(descEl.value || '').trim() : '',
          status: 'Submitted',
          updated: todayISO()
        };
        addMaterial(mat);
        renderMaterialsList();
        renderMaterialsReview();
        renderStudentMaterials();
        renderHistory();
        closeMaterialModal();
        form.reset();
        toast('Material "' + mat.title + '" created & submitted');
      });
    }
  }

  function initReviewQueue() {
    var queue = document.getElementById('reviewQueue');
    if (!queue || queue.__eduWired) return;
    queue.__eduWired = true;
    queue.querySelectorAll('[data-review-card]').forEach(function (card) {
      var badge = card.querySelector('[data-review-status]');
      var approve = card.querySelector('[data-approve]');
      var revise = card.querySelector('[data-revise]');
      function setStatus(next) {
        if (badge) { badge.className = badgeFor(next); badge.textContent = next; }
        card.setAttribute('data-status', next);
      }
      if (approve) approve.addEventListener('click', function () {
        setStatus('Approved');
        var who = card.getAttribute('data-student') || 'Student';
        toast('Approved submission from ' + who);
        pushNotification('Review approved', 'Approved a submission from ' + who + '.');
      });
      if (revise) revise.addEventListener('click', function () {
        setStatus('Revision Required');
        var who2 = card.getAttribute('data-student') || 'Student';
        toast('Revision requested for ' + who2);
        pushNotification('Revision requested', 'Requested revision from ' + who2 + '.');
      });
    });
  }

  function renderMyStudents() {
    var grid = document.getElementById('studentsGrid');
    if (!grid) return;
    var data = getData();
    if (!data || !Array.isArray(data.students) || !data.students.length) return;
    grid.innerHTML = data.students.map(function (s) {
      var name = esc(pick(s, 'name', 'title') || 'Student');
      var initials = esc(pick(s, 'initials', 'avatar') || String(name).split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase());
      var prog = Math.max(0, Math.min(100, parseFloat(pick(s, 'completion', 'progress', 'percent')) || 0));
      var overdue = parseInt(pick(s, 'overdue', 'late', 'overdueCount'), 10);
      if (isNaN(overdue)) overdue = 0;
      var course = esc(pick(s, 'course', 'track', 'group') || '');
      return '<div class="card reveal visible" data-searchable>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div class="avatar" aria-hidden="true">' + initials + '</div>' +
        '<div><strong>' + name + '</strong><br><small style="color:var(--muted)">' + course + '</small></div>' +
        (overdue > 0 ? '<span class="badge badge-danger" style="margin-left:auto;">' + overdue + ' overdue</span>' : '<span class="badge badge-success" style="margin-left:auto;">On track</span>') +
        '</div><div style="margin-top:12px;"><div class="progress-track"><div class="progress-fill" data-progress="' + prog + '" style="width:0%"></div></div>' +
        '<small style="color:var(--muted)">' + Math.round(prog) + '% completion</small></div></div>';
    }).join('');
    animateProgress(grid);
  }

  function historyItemHTML(h) {
    // Real shape: {task, actor, from, to, time}; fallback: {title/text/event, desc, time/date}
    var task = pick(h, 'task', 'title', 'text', 'event', 'message');
    var from = pick(h, 'from');
    var to = pick(h, 'to');
    var actor = esc(pick(h, 'actor') || '');
    var time = esc(pick(h, 'time', 'date', 'when') || '');
    var desc = esc(pick(h, 'desc', 'detail', 'body') || '');
    var mid = (from || to) ? ' <span class="' + badgeFor(to || from) + '">' + esc(from || '') + (from && to ? ' → ' : '') + esc(to || '') + '</span>' : '';
    return '<div class="timeline-item"><strong>' + esc(task || 'Event') + '</strong>' + mid +
      (desc ? '<p style="margin:4px 0;color:var(--muted);font-size:13px;">' + desc + '</p>' : '') +
      ((actor || time) ? '<br><small style="color:var(--muted)">' + actor + (actor && time ? ' · ' : '') + time + '</small>' : '') + '</div>';
  }

  function renderHistory() {
    var tl = document.getElementById('historyTimeline');
    if (!tl) return;
    var data = getData();
    if (!data || !Array.isArray(data.history) || !data.history.length) return;
    tl.innerHTML = data.history.slice(0, 7).map(historyItemHTML).join('');
  }

  function renderNotificationsPanel() {
    var panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    var data = getData();
    if (!data || !Array.isArray(data.notifications) || !data.notifications.length) return;
    panel.innerHTML = data.notifications.slice(0, 6).map(notificationHTML).join('');
  }

  function updateInstructorKPIs() {
    var data = getData();
    if (!data) return;
    var myTasks = Array.isArray(data.instructorTasks) ? data.instructorTasks : [];
    var sTasks = Array.isArray(data.studentTasks) ? data.studentTasks : [];
    var students = Array.isArray(data.students) ? data.students : [];
    function set(id, val) {
      var el = document.getElementById(id);
      if (el) { el.setAttribute('data-count', String(val)); el.textContent = String(val); }
    }
    if (document.getElementById('kpiMyTasks')) set('kpiMyTasks', myTasks.length);
    if (document.getElementById('kpiOverdue')) {
      var over = myTasks.filter(function (t) { return isOverdue(pick(t, 'deadline', 'due', 'date'), pick(t, 'status')); }).length;
      set('kpiOverdue', over);
    }
    if (document.getElementById('kpiToReview')) {
      var rev = sTasks.filter(function (t) { return /submitted|under review|pending|to review/i.test(String(pick(t, 'status') || '')); }).length;
      set('kpiToReview', rev);
    }
    if (document.getElementById('kpiAvgCompletion')) {
      var avg = 0;
      if (students.length) {
        var sum = students.reduce(function (a, s) { return a + (parseFloat(pick(s, 'completion', 'progress')) || 0); }, 0);
        avg = Math.round(sum / students.length);
      }
      var el = document.getElementById('kpiAvgCompletion');
      if (el) { el.setAttribute('data-count', String(avg)); el.setAttribute('data-suffix', '%'); el.textContent = avg + '%'; }
    }
  }

  /* ============ STUDENT PAGE ============ */
  function saraTasks() {
    var data = getData();
    if (!data || !Array.isArray(data.studentTasks)) return null;
    var all = data.studentTasks;
    var mine = all.filter(function (t) {
      return String(pick(t, 'assignee', 'student', 'owner') || '').toLowerCase().indexOf('sara') >= 0;
    });
    return (mine.length ? mine : all.slice(0, 5));
  }

  function renderMyTasksList() {
    var list = document.getElementById('myTasksList');
    if (!list) return;
    var tasks = saraTasks();
    if (!tasks) return;
    list.innerHTML = tasks.map(function (t, i) {
      var title = esc(pick(t, 'title', 'task', 'name') || 'Untitled');
      var lesson = esc(pick(t, 'lesson', 'course', 'module') || 'General');
      var dlRaw = pick(t, 'deadline', 'due', 'dueDate');
      var status = pick(t, 'status', 'state') || 'Not Started';
      var cd = countdownLabel(dlRaw, status);
      var over = isOverdue(dlRaw, status);
      var id = esc(pick(t, 'id') || ('task-' + i));
      return '<div class="card reveal visible" data-searchable data-student-task="' + id + '">' +
        '<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:200px;"><strong>' + title + '</strong>' +
        '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
        '<span class="badge badge-info">' + lesson + '</span>' +
        '<span class="badge ' + (over ? 'badge-danger' : 'badge-neutral') + '">' + esc(cd) + '</span>' +
        '<span class="' + badgeFor(status) + '" data-task-status>' + esc(status) + '</span></div>' +
        '<small style="color:var(--muted)">Deadline: ' + esc(dlRaw || '—') + '</small></div>' +
        '<button class="btn btn-primary" data-submit-toggle>Submit</button></div>' +
        '<div data-submit-box hidden style="margin-top:12px;"><textarea data-submit-text rows="3" placeholder="Paste your submission notes or link…" style="width:100%;border:1px solid var(--border);border-radius:10px;padding:10px;font:inherit;"></textarea>' +
        '<div style="margin-top:8px;display:flex;gap:8px;"><button class="btn btn-primary" data-submit-send>Send submission</button>' +
        '<button class="btn btn-ghost" data-submit-cancel>Cancel</button></div></div></div>';
    }).join('');
    list.querySelectorAll('[data-student-task]').forEach(function (card) {
      var toggle = card.querySelector('[data-submit-toggle]');
      var box = card.querySelector('[data-submit-box]');
      var send = card.querySelector('[data-submit-send]');
      var cancel = card.querySelector('[data-submit-cancel]');
      if (toggle && box) toggle.addEventListener('click', function () {
        var hidden = box.hasAttribute('hidden');
        if (hidden) { box.removeAttribute('hidden'); toggle.textContent = 'Close'; }
        else { box.setAttribute('hidden', ''); toggle.textContent = 'Submit'; }
      });
      if (cancel && box && toggle) cancel.addEventListener('click', function () { box.setAttribute('hidden', ''); toggle.textContent = 'Submit'; });
      if (send) send.addEventListener('click', function () {
        var badge = card.querySelector('[data-task-status]');
        if (badge) { badge.className = badgeFor('Submitted'); badge.textContent = 'Submitted'; }
        var d2 = getData();
        if (d2 && Array.isArray(d2.studentTasks)) {
          var id = card.getAttribute('data-student-task');
          d2.studentTasks.forEach(function (x) { if (String(pick(x, 'id')) === String(id)) x.status = 'Submitted'; });
        }
        if (box) box.setAttribute('hidden', '');
        if (toggle) toggle.textContent = 'Submitted ✓';
        toast('Submission sent — marked as Submitted');
        updateStudentKPIs();
        renderStudentProgress();
      });
    });
  }

  function renderStudentProgress() {
    var ring = document.getElementById('progressRing');
    var bars = document.getElementById('courseBars');
    var data = getData();
    var pct = 68;
    var tasks = saraTasks();
    if (tasks && tasks.length) {
      var done = tasks.filter(function (t) { return /completed|approved|graded|submitted/i.test(String(pick(t, 'status') || '')); }).length;
      pct = Math.round((done / tasks.length) * 100);
    }
    if (ring) {
      ring.setAttribute('data-ring', String(pct));
      ring.style.background = 'conic-gradient(var(--primary) ' + pct + '%, var(--border) ' + pct + '%)';
      var label = ring.querySelector('[data-ring-label]');
      if (label) label.textContent = pct + '%';
    }
    var ringText = document.getElementById('progressRingText');
    if (ringText) ringText.textContent = pct + '% complete';
    if (bars) {
      if (!data || !Array.isArray(data.courses) || !data.courses.length) return;
      bars.innerHTML = data.courses.map(function (c) {
        var n = esc(pick(c, 'title', 'name') || 'Course');
        var p = Math.max(0, Math.min(100, parseFloat(pick(c, 'progress', 'completion', 'percent')) || 0));
        return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><strong>' + n + '</strong><span style="color:var(--muted)">' + Math.round(p) + '%</span></div>' +
          '<div class="progress-track"><div class="progress-fill" data-progress="' + p + '" style="width:0%"></div></div></div>';
      }).join('');
      animateProgress(bars);
    }
  }

  function renderFeedback() {
    var wrap = document.getElementById('feedbackList');
    if (!wrap) return;
    var tasks = saraTasks();
    if (!tasks) return;
    var withFb = tasks.filter(function (t) { return pick(t, 'feedback', 'comment', 'grade', 'excerpt'); });
    var show = (withFb.length ? withFb : tasks.slice(0, 3));
    wrap.innerHTML = show.map(function (t) {
      var title = esc(pick(t, 'title', 'task') || 'Submission');
      var fb = esc(pick(t, 'feedback', 'comment', 'excerpt') || '"Good effort — keep refining structure and add one more example." — Instructor');
      var grade = esc(pick(t, 'grade', 'score') || '');
      var status = pick(t, 'status') || 'Pending';
      var needResubmit = /revision|resubmit|reject/i.test(String(status));
      return '<div class="card" data-searchable><strong>' + title + '</strong>' +
        '<p style="color:var(--muted);font-style:italic;margin:8px 0;">' + fb + '</p>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
        (grade ? '<span class="badge badge-info">Grade: ' + grade + '</span>' : '') +
        '<span class="' + badgeFor(status) + '">' + esc(status) + '</span>' +
        (needResubmit ? '<button class="btn btn-primary" data-resubmit>Resubmit</button>' : '') +
        '</div></div>';
    }).join('');
    wrap.querySelectorAll('[data-resubmit]').forEach(function (b) {
      b.addEventListener('click', function () { toast('Resubmission draft opened'); });
    });
  }

  function renderPersonalTimeline() {
    var tl = document.getElementById('personalTimeline');
    if (!tl) return;
    var data = getData();
    if (!data || !Array.isArray(data.history) || !data.history.length) return;
    tl.innerHTML = data.history.slice(0, 5).map(historyItemHTML).join('');
  }

  function renderUpcomingDeadlines() {
    var ul = document.getElementById('deadlinesList');
    if (!ul) return;
    var data = getData();
    var tasks = saraTasks();
    if (!tasks) {
      if (!data || !Array.isArray(data.studentTasks)) return;
      tasks = data.studentTasks.slice(0, 5);
    }
    var sorted = tasks.slice().sort(function (a, b) {
      var da = parseDeadline(pick(a, 'deadline', 'due')) || new Date(8640000000000000);
      var db = parseDeadline(pick(b, 'deadline', 'due')) || new Date(8640000000000000);
      return da - db;
    }).slice(0, 5);
    ul.innerHTML = sorted.map(function (t) {
      var title = esc(pick(t, 'title', 'task') || 'Task');
      var dl = pick(t, 'deadline', 'due') || '';
      var cd = countdownLabel(dl, pick(t, 'status'));
      var over = isOverdue(dl, pick(t, 'status'));
      return '<div class="notification-item" style="box-shadow:none;"><div><strong>' + title + '</strong><br><small style="color:' + (over ? 'var(--danger)' : 'var(--muted)') + '">' + esc(dl || '') + ' · ' + esc(cd) + '</small></div></div>';
    }).join('');
  }

  function updateStudentKPIs() {
    var tasks = saraTasks();
    if (!tasks) return;
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) { el.setAttribute('data-count', String(v)); el.textContent = String(v); }
    }
    var done = tasks.filter(function (t) { return /completed|approved|graded|submitted/i.test(String(pick(t, 'status') || '')); }).length;
    var over = tasks.filter(function (t) { return isOverdue(pick(t, 'deadline', 'due'), pick(t, 'status')); }).length;
    var pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    if (document.getElementById('sAssigned')) set('sAssigned', tasks.length);
    if (document.getElementById('sCompleted')) set('sCompleted', done);
    if (document.getElementById('sOverdue')) set('sOverdue', over);
    var elp = document.getElementById('sPct');
    if (elp) { elp.setAttribute('data-count', String(pct)); elp.setAttribute('data-suffix', '%'); elp.textContent = pct + '%'; }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    mergeExtras();
    initNavToggle();
    initBells();
    renderInstructorTasks();
    renderInstructorStudentTable();
    initTaskModal();
    initAssignModal();
    initMaterialModal();
    renderMaterialsList();
    renderMaterialsReview();
    renderStudentMaterials();
    initReviewQueue();
    renderMyStudents();
    renderHistory();
    renderNotificationsPanel();
    updateInstructorKPIs();
    renderMyTasksList();
    renderStudentProgress();
    renderFeedback();
    renderPersonalTimeline();
    renderUpcomingDeadlines();
    updateStudentKPIs();
    animateProgress(document);
    animateCounters();
    initReveal();
    initSearch();
  }

  window.EduApp = {
    toast: toast,
    badgeFor: badgeFor,
    toggleSidebar: toggleSidebar,
    initBells: initBells,
    pushNotification: pushNotification,
    addInstructorTask: addInstructorTask,
    addStudentTask: addStudentTask,
    addMaterial: addMaterial,
    openAssignModal: openAssignModal,
    openMaterialModal: openMaterialModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
