(function () {
  'use strict';

  if (!localStorage.getItem('tala2e3_token')) {
    window.location.href = 'login.html';
    return;
  }

  var BASE = API_BASE_URL + '/api';
  var committeeRoles = ['رئيس', 'نائب الرئيس', 'أمين السر', 'أمين الصندوق', 'وكيل التنشئة', 'وكيل الرسالة', 'وكيل الإعلام', 'وكيل النشاطات', 'مستشار'];

  function api(path, opts) {
    var headers = {};
    var token = localStorage.getItem('tala2e3_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    var options = {};
    if (opts) {
      if (opts.method) options.method = opts.method;
      if (opts.body) {
        if (opts.formData) {
          options.body = opts.body;
        } else {
          headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(opts.body);
        }
      }
    }
    options.headers = headers;
    return fetch(BASE + path, options).then(function (r) { return r.json(); });
  }

  function showMsg(text) {
    var el = document.getElementById('successMsg');
    el.textContent = text;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  function toArabicNum(n) {
    if (n === undefined || n === null || n === '') return '—';
    var d = '٠١٢٣٤٥٦٧٨٩';
    return String(n).replace(/\d/g, function (c) { return d[parseInt(c, 10)]; });
  }

  var allMembers = [];

  // =========================================================
  //  EVENTS (localStorage)
  // =========================================================
  var editEventId = null;

  function loadEvents() {
    var grid = document.getElementById('eventsGrid');
    grid.innerHTML = '<p class="loading-text">جاري التحميل...</p>';
    Tala2e3Events.getAll().then(function (all) {
      grid.innerHTML = '';
      if (all.length === 0) {
        grid.innerHTML = '<p class="empty-text">لا توجد لقاءات. أضف لقاءً جديداً.</p>';
        return;
      }
      all.forEach(function (e) {
        var card = document.createElement('div');
        card.className = 'event-dash-card';
        var isPast = e.date ? new Date(e.date + 'T23:59:59') < new Date() : false;
        var typeLabel = isPast ? 'سابق' : 'قادم';
        var typeClass = isPast ? 'past_activity' : 'upcoming';
        card.innerHTML =
          '<div class="event-dash-header">' +
            '<strong>' + e.title + '</strong>' +
            '<span class="event-type-tag ' + typeClass + '">' + typeLabel + '</span>' +
          '</div>' +
          '<div class="event-dash-meta">' +
            (e.date ? '<span>📅 ' + e.date + '</span>' : '') +
            (e.time ? '<span>⏰ ' + e.time + '</span>' : '') +
          '</div>' +
          (e.description ? '<p class="event-dash-desc">' + e.description + '</p>' : '') +
          '<div class="event-dash-actions">' +
            '<button class="dash-btn secondary ev-edit" data-id="' + e._id + '">✏️ تعديل</button>' +
            '<button class="dash-btn danger ev-del" data-id="' + e._id + '">🗑️ حذف</button>' +
          '</div>';
        grid.appendChild(card);
      });
      document.querySelectorAll('.ev-edit').forEach(function (b) {
        b.addEventListener('click', function () { editEvent(this.dataset.id); });
      });
      document.querySelectorAll('.ev-del').forEach(function (b) {
        b.addEventListener('click', function () { deleteEvent(this.dataset.id); });
      });
    }).catch(function () {
      grid.innerHTML = '<p class="empty-text">⚠️ تعذر الاتصال بالخادم</p>';
    });
  }

  function fillEventForm(e) {
    editEventId = e.id;
    document.getElementById('eventTitle').value = e.title || '';
    document.getElementById('eventDate').value = e.date || '';
    document.getElementById('eventTime').value = e.time || '';
    document.getElementById('eventDesc').value = e.description || '';
    document.getElementById('eventImageUrl').value = e.imageUrl || '';
    document.getElementById('eventFormTitle').textContent = '✏️ تعديل اللقاء';
    document.getElementById('saveEventBtn').textContent = '💾 حفظ التعديلات';
    document.getElementById('cancelEventBtn').style.display = 'inline-block';
  }

  function resetEventForm() {
    editEventId = null;
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDesc').value = '';
    document.getElementById('eventImageUrl').value = '';
    document.getElementById('eventFormTitle').textContent = '➕ إضافة لقاء جديد';
    document.getElementById('saveEventBtn').textContent = '➕ إضافة لقاء';
    document.getElementById('cancelEventBtn').style.display = 'none';
  }

  function editEvent(id) {
    Tala2e3Events.getById(id).then(function (e) {
      if (e) fillEventForm(e);
    });
  }

  function saveEvent() {
    var title = document.getElementById('eventTitle').value.trim();
    if (!title) { alert('الرجاء إدخال العنوان.'); return; }
    var data = {
      title: title,
      date: document.getElementById('eventDate').value,
      time: document.getElementById('eventTime').value,
      description: document.getElementById('eventDesc').value.trim(),
      imageUrl: document.getElementById('eventImageUrl').value.trim()
    };
    var promise = editEventId ? Tala2e3Events.update(editEventId, data) : Tala2e3Events.add(data);
    promise.then(function () {
      resetEventForm();
      loadEvents();
      showMsg('✅ تم حفظ اللقاء بنجاح');
    }).catch(function () {
      alert('فشل الحفظ.');
    });
  }

  function deleteEvent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا اللقاء؟')) return;
    Tala2e3Events.remove(id).then(function () {
      if (editEventId === id) resetEventForm();
      loadEvents();
      showMsg('✅ تم حذف اللقاء');
    });
  }

  // =========================================================
  //  COMMITTEE (API)
  // =========================================================

  function loadCommittee() {
    api('/members').then(function (all) {
      allMembers = all || [];
      var committee = allMembers.filter(function (m) {
        return committeeRoles.indexOf(m.role) !== -1;
      });
      var grid = document.getElementById('committeeGrid');
      grid.innerHTML = '';

      if (committee.length === 0) {
        grid.innerHTML = '<p class="empty-text">لا يوجد أعضاء في العمدة حالياً. استخدم النموذج أدناه لإضافة أعضاء.</p>';
      } else {
        committee.forEach(function (m) {
          var card = document.createElement('div');
          card.className = 'committee-card';
          card.innerHTML =
            '<div class="c-name">' + m.fullName + '</div>' +
            '<div class="c-role">👑 ' + m.role + '</div>' +
            '<div class="c-info">' +
              (m.age ? 'العمر: ' + toArabicNum(m.age) + ' سنة' : '') +
              (m.bloodType ? ' | فصيلة: ' + m.bloodType : '') +
              (m.promise ? ' | مكرّس: ' + m.promise : '') +
            '</div>' +
            '<div class="c-actions">' +
              '<button class="dash-btn secondary com-edit" data-id="' + m._id + '">✏️ تغيير الدور</button>' +
              '<button class="dash-btn danger com-remove" data-id="' + m._id + '">⬇️ إزالة من العمدة</button>' +
            '</div>';
          grid.appendChild(card);
        });
      }

      // Populate committee member select
      var select = document.getElementById('committeeMemberSelect');
      var committeeIds = committee.map(function (m) { return m._id; });
      var available = allMembers.filter(function (m) { return committeeIds.indexOf(m._id) === -1; });
      select.innerHTML = '';
      if (available.length === 0) {
        select.innerHTML = '<option value="">جميع الأعضاء في العمدة بالفعل</option>';
      } else {
        available.forEach(function (m) {
          var opt = document.createElement('option');
          opt.value = m._id;
          opt.textContent = m.fullName + ' (' + (m.role || 'عضو') + ')';
          select.appendChild(opt);
        });
      }
    }).catch(function () {
      document.getElementById('committeeGrid').innerHTML = '<p class="empty-text">⚠️ تعذر الاتصال بالخادم. تأكد من تشغيل الخادم.</p>';
    });
  }

  function findMemberById(id) {
    for (var i = 0; i < allMembers.length; i++) {
      if (allMembers[i]._id === id) return allMembers[i];
    }
    return null;
  }

  function changeCommitteeRole(id) {
    var member = findMemberById(id);
    if (!member) {
      api('/members/' + id).then(function (m) {
        if (m && m._id) doChangeRole(id, m);
      });
      return;
    }
    doChangeRole(id, member);
  }

  function doChangeRole(id, member) {
    var newRole = prompt('أدخل الدور الجديد للعضو "' + member.fullName + '":\n' +
      committeeRoles.join(', '), member.role);
    if (newRole && newRole.trim()) {
      api('/members/' + id, { method: 'PUT', body: { role: newRole.trim() } }).then(function () {
        loadCommittee();
        showMsg('✅ تم تحديث دور ' + member.fullName);
      });
    }
  }

  function removeFromCommittee(id) {
    var member = findMemberById(id);
    if (!member) {
      api('/members/' + id).then(function (m) {
        if (m && m._id) doRemoveFromCommittee(id, m);
      });
      return;
    }
    doRemoveFromCommittee(id, member);
  }

  function doRemoveFromCommittee(id, member) {
    if (!confirm('هل أنت متأكد من إزالة "' + member.fullName + '" من العمدة؟')) return;
    api('/members/' + id, { method: 'PUT', body: { role: 'عضو' } }).then(function () {
      loadCommittee();
      showMsg('✅ تم إزالة ' + member.fullName + ' من العمدة');
    });
  }

  function assignToCommittee() {
    var select = document.getElementById('committeeMemberSelect');
    var roleSelect = document.getElementById('committeeRoleSelect');
    var memberId = select.value;
    var newRole = roleSelect.value;
    if (!memberId) { alert('الرجاء اختيار عضو.'); return; }
    api('/members/' + memberId, { method: 'PUT', body: { role: newRole } }).then(function () {
      loadCommittee();
      showMsg('✅ تم تعيين العضو في العمدة بنجاح');
    });
  }

  // =========================================================
  //  ALL MEMBERS CRUD (API)
  // =========================================================
  var editMemberId = null;

  function loadMembersTable() {
    var search = (document.getElementById('memberSearch').value || '').trim().toLowerCase();
    api('/members').then(function (all) {
      allMembers = all || [];
      var tbody = document.getElementById('membersBody');
      tbody.innerHTML = '';
      if (allMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">لا يوجد أعضاء.</td></tr>';
        return;
      }
      var filtered = allMembers;
      if (search) {
        filtered = allMembers.filter(function (m) { return (m.fullName || '').toLowerCase().includes(search); });
      }
      filtered.forEach(function (m, i) {
        var tr = document.createElement('tr');
        var photoUrl = Tala2e3Members.getStoredPhoto(m._id) || Tala2e3Members.findPhotoByName(m.fullName) || '';
        tr.innerHTML =
          '<td>' + toArabicNum(i + 1) + '</td>' +
          '<td><strong>' + m.fullName + '</strong></td>' +
          '<td>' + (m.role || 'عضو') + '</td>' +
          '<td>' + toArabicNum(m.age) + '</td>' +
          '<td>' + (m.bloodType || '—') + '</td>' +
          '<td><span class="' + (m.promise === 'نعم' ? 'badge-yes' : 'badge-no') + '">' + (m.promise || '—') + '</span></td>' +
          '<td>' + (m.commitment || '—') + '</td>' +
            '<td>' + (photoUrl ? '<img src="' + photoUrl + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--gold-pale);">' : '—') + '</td>' +
          '<td style="text-align:center;">' +
            '<button class="dash-btn secondary mem-edit" data-id="' + m._id + '" style="font-size:0.75rem;padding:0.2rem 0.6rem;">✏️</button> ' +
            '<button class="dash-btn danger mem-del" data-id="' + m._id + '" style="font-size:0.75rem;padding:0.2rem 0.6rem;">🗑️</button>' +
          '</td>';
        tbody.appendChild(tr);
      });
    }).catch(function () {
      document.getElementById('membersBody').innerHTML = '<tr><td colspan="9">⚠️ تعذر الاتصال بالخادم</td></tr>';
    });
  }

  function uploadPhoto(file, cb) {
    var formData = new FormData();
    formData.append('photo', file);
    api('/members/upload-photo', { method: 'POST', body: formData, formData: true }).then(function (res) {
      if (res.url) cb(res.url);
      else alert('فشل رفع الصورة.');
    }).catch(function () {
      alert('تعذر رفع الصورة.');
    });
  }

  function updatePhotoPreview() {
    var fileInput = document.getElementById('mPhotoFile');
    var preview = document.getElementById('photoPreview');
    var img = document.getElementById('photoPreviewImg');
    var file = fileInput.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        img.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  }

  function fillMemberForm(m) {
    editMemberId = m._id;
    document.getElementById('mFullName').value = m.fullName || '';
    document.getElementById('mDob').value = m.dob || '';
    document.getElementById('mBloodType').value = m.bloodType || 'A+';
    document.getElementById('mRole').value = m.role || 'عضو';
    document.getElementById('mPhotoFile').value = '';
    var photo = Tala2e3Members.getStoredPhoto(m._id) || Tala2e3Members.findPhotoByName(m.fullName) || '';
    document.getElementById('mPhotoUrl').value = photo;
    var preview = document.getElementById('photoPreview');
    var img = document.getElementById('photoPreviewImg');
    if (photo) {
      img.src = photo;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
    document.getElementById('mPromise').value = m.promise || 'نعم';
    document.getElementById('mCostume').value = m.costume || 'نعم';
    document.getElementById('mCommitment').value = m.commitment || 'عالٍ';
    document.getElementById('memberFormTitle').textContent = '✏️ تعديل العضو';
    document.getElementById('saveMemberBtn').textContent = '💾 حفظ التعديلات';
    document.getElementById('cancelMemberBtn').style.display = 'inline-block';
  }

  function resetMemberForm() {
    editMemberId = null;
    document.getElementById('mFullName').value = '';
    document.getElementById('mDob').value = '';
    document.getElementById('mBloodType').value = 'A+';
    document.getElementById('mRole').value = 'عضو';
    document.getElementById('mPhotoFile').value = '';
    document.getElementById('mPhotoUrl').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('mPromise').value = 'نعم';
    document.getElementById('mCostume').value = 'نعم';
    document.getElementById('mCommitment').value = 'عالٍ';
    document.getElementById('memberFormTitle').textContent = '➕ إضافة عضو جديد';
    document.getElementById('saveMemberBtn').textContent = '➕ إضافة عضو';
    document.getElementById('cancelMemberBtn').style.display = 'none';
  }

  function editMember(id) {
    var m = findMemberById(id);
    if (m) { fillMemberForm(m); scrollToMemberForm(); return; }
    api('/members/' + id).then(function (m) {
      if (m && m._id) { fillMemberForm(m); scrollToMemberForm(); }
      else alert('لم يتم العثور على العضو.');
    });
  }

  function scrollToMemberForm() {
    var el = document.getElementById('memberFormTitle');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveMember() {
    var name = document.getElementById('mFullName').value.trim();
    if (!name) { alert('الرجاء إدخال الاسم الكامل.'); return; }
    var dob = document.getElementById('mDob').value;
    var data = {
      fullName: name,
      dob: dob,
      bloodType: document.getElementById('mBloodType').value,
      role: document.getElementById('mRole').value,
      promise: document.getElementById('mPromise').value,
      costume: document.getElementById('mCostume').value,
      commitment: document.getElementById('mCommitment').value,
    };

    function doSave(photoUrl) {
      function afterSave(saved) {
        if (photoUrl) Tala2e3Members.setStoredPhoto(saved._id, photoUrl);
        resetMemberForm();
        loadMembersTable();
        showMsg('✅ تم حفظ العضو بنجاح');
      }
      if (editMemberId) {
        api('/members/' + editMemberId, { method: 'PUT', body: data }).then(function (saved) { afterSave(saved); });
      } else {
        api('/members', { method: 'POST', body: data }).then(function (saved) { afterSave(saved); });
      }
    }

    var fileInput = document.getElementById('mPhotoFile');
    var file = fileInput.files[0];
    if (file) {
      uploadPhoto(file, function (url) {
        document.getElementById('mPhotoUrl').value = url;
        doSave(url);
      });
    } else {
      doSave(document.getElementById('mPhotoUrl').value.trim());
    }
  }

  function deleteMember(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    api('/members/' + id, { method: 'DELETE' }).then(function () {
      Tala2e3Members.setStoredPhoto(id, '');
      if (editMemberId === id) resetMemberForm();
      loadMembersTable();
      showMsg('✅ تم حذف العضو');
    });
  }

  // =========================================================
  //  MONTHLY ACTIVITIES CRUD (API)
  // =========================================================
  var editMonthlyId = null;
  var monthNamesMap = { '01': 'كانون الثاني', '02': 'شباط', '03': 'آذار', '04': 'نيسان', '05': 'أيار', '06': 'حزيران', '07': 'تموز', '08': 'آب', '09': 'أيلول', '10': 'تشرين الأول', '11': 'تشرين الثاني', '12': 'كانون الأول' };

  function addMeetingRow(title, photoUrl) {
    var container = document.getElementById('meetingsContainer');
    var div = document.createElement('div');
    div.className = 'inline-flex';
    div.style.cssText = 'gap:0.5rem;margin-bottom:0.5rem;';
    div.innerHTML =
      '<input type="text" class="meeting-title" value="' + (title || '') + '" placeholder="عنوان اللقاء" style="flex:1;padding:0.5rem;border-radius:8px;border:1px solid var(--gray-300);font-family:\'Cairo\',sans-serif;" />' +
      '<input type="file" class="meeting-photo" accept="image/*" style="font-size:0.8rem;" />' +
      (photoUrl ? '<input type="hidden" class="meeting-photo-url" value="' + photoUrl + '" />' : '') +
      (photoUrl ? '<span style="font-size:0.75rem;color:var(--text-light);">✅ صورة موجودة</span>' : '') +
      '<button class="dash-btn danger remove-meeting" style="padding:0.3rem 0.7rem;">✕</button>';
    div.querySelector('.remove-meeting').addEventListener('click', function () { div.remove(); });
    container.appendChild(div);
  }

  function collectMeetings() {
    var rows = document.querySelectorAll('#meetingsContainer > div');
    var meetings = [];
    rows.forEach(function (row) {
      var titleInput = row.querySelector('.meeting-title');
      var fileInput = row.querySelector('.meeting-photo');
      var photoUrlInput = row.querySelector('.meeting-photo-url');
      if (titleInput && titleInput.value.trim()) {
        var meeting = { title: titleInput.value.trim(), photo: '', file: fileInput ? fileInput.files[0] : null };
        if (photoUrlInput && photoUrlInput.value) {
          meeting.photo = photoUrlInput.value;
        }
        meetings.push(meeting);
      }
    });
    return meetings;
  }

  function loadMonthlyList() {
    api('/monthly-activities').then(function (list) {
      var container = document.getElementById('monthlyList');
      container.innerHTML = '';
      if (!list || list.length === 0) {
        container.innerHTML = '<p class="empty-text">لا توجد نشاطات شهرية بعد.</p>';
        return;
      }
      list.forEach(function (a) {
        var card = document.createElement('div');
        card.className = 'event-dash-card';
        var meetingsHtml = '';
        if (a.meetings && a.meetings.length > 0) {
          meetingsHtml = '<div style="margin-top:0.4rem;font-size:0.85rem;color:var(--text-mid);">';
          a.meetings.forEach(function (m) {
            meetingsHtml += '<div>' + (m.photo ? '🖼️ ' : '• ') + m.title + '</div>';
          });
          meetingsHtml += '</div>';
        }
        card.innerHTML =
          '<div class="event-dash-header">' +
            '<strong>' + (monthNamesMap[a.month] || a.month) + ' ' + toArabicNum(a.year) + '</strong>' +
            (a.scheduleImage ? '<span style="font-size:0.75rem;color:var(--text-light);">✅ صورة جدول</span>' : '') +
          '</div>' +
          meetingsHtml +
          '<div class="event-dash-actions" style="margin-top:0.5rem;">' +
            '<button class="dash-btn secondary ma-edit" data-id="' + a._id + '">✏️ تعديل</button>' +
            '<button class="dash-btn danger ma-del" data-id="' + a._id + '">🗑️ حذف</button>' +
          '</div>';
        container.appendChild(card);
      });
      document.querySelectorAll('.ma-edit').forEach(function (b) {
        b.addEventListener('click', function () { editMonthly(this.dataset.id); });
      });
      document.querySelectorAll('.ma-del').forEach(function (b) {
        b.addEventListener('click', function () { deleteMonthly(this.dataset.id); });
      });
    }).catch(function () {
      document.getElementById('monthlyList').innerHTML = '<p class="empty-text">⚠️ تعذر الاتصال بالخادم</p>';
    });
  }

  function resetMonthlyForm() {
    editMonthlyId = null;
    document.getElementById('maYear').value = '2026';
    document.getElementById('maMonth').value = '08';
    document.getElementById('maScheduleImage').value = '';
    document.getElementById('meetingsContainer').innerHTML =
      '<div class="inline-flex" style="gap:0.5rem;margin-bottom:0.5rem;">' +
        '<input type="text" class="meeting-title" placeholder="عنوان اللقاء" style="flex:1;padding:0.5rem;border-radius:8px;border:1px solid var(--gray-300);font-family:\'Cairo\',sans-serif;" />' +
        '<input type="file" class="meeting-photo" accept="image/*" style="font-size:0.8rem;" />' +
        '<button class="dash-btn danger remove-meeting" style="padding:0.3rem 0.7rem;">✕</button>' +
      '</div>';
    document.querySelectorAll('#meetingsContainer .remove-meeting').forEach(function (b) {
      b.addEventListener('click', function () { b.parentElement.remove(); });
    });
    document.getElementById('monthlyFormTitle').textContent = '➕ إضافة نشاط شهري';
    document.getElementById('saveMonthlyBtn').textContent = '💾 حفظ النشاط الشهري';
    document.getElementById('cancelMonthlyBtn').style.display = 'none';
  }

  function fillMonthlyForm(a) {
    editMonthlyId = a._id;
    document.getElementById('maYear').value = a.year || '2026';
    document.getElementById('maMonth').value = a.month || '08';
    document.getElementById('maScheduleImage').value = '';
    var container = document.getElementById('meetingsContainer');
    container.innerHTML = '';
    if (a.meetings && a.meetings.length > 0) {
      a.meetings.forEach(function (m) { addMeetingRow(m.title, m.photo); });
    } else {
      addMeetingRow('', '');
    }
    document.getElementById('monthlyFormTitle').textContent = '✏️ تعديل النشاط الشهري';
    document.getElementById('saveMonthlyBtn').textContent = '💾 حفظ التعديلات';
    document.getElementById('cancelMonthlyBtn').style.display = 'inline-block';
  }

  function editMonthly(id) {
    api('/monthly-activities/' + id).then(function (a) {
      if (a) fillMonthlyForm(a);
    });
  }

  function deleteMonthly(id) {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط الشهري؟')) return;
    api('/monthly-activities/' + id, { method: 'DELETE' }).then(function () {
      if (editMonthlyId === id) resetMonthlyForm();
      loadMonthlyList();
      showMsg('✅ تم حذف النشاط الشهري');
    });
  }

  function saveMonthly() {
    var year = document.getElementById('maYear').value.trim();
    var month = document.getElementById('maMonth').value;
    if (!year || !month) { alert('الرجاء إدخال السنة والشهر.'); return; }

    var formData = new FormData();
    formData.append('year', year);
    formData.append('month', month);
    formData.append('monthName', monthNamesMap[month] || '');

    var scheduleFile = document.getElementById('maScheduleImage').files[0];
    if (scheduleFile) formData.append('scheduleImage', scheduleFile);

    var meetings = [];
    var rows = document.querySelectorAll('#meetingsContainer > div');
    rows.forEach(function (row) {
      var titleInput = row.querySelector('.meeting-title');
      var fileInput = row.querySelector('.meeting-photo');
      var photoUrlInput = row.querySelector('.meeting-photo-url');
      if (titleInput && titleInput.value.trim()) {
        var m = { title: titleInput.value.trim() };
        if (photoUrlInput && photoUrlInput.value) {
          m.photo = photoUrlInput.value;
        }
        meetings.push(m);
        if (fileInput && fileInput.files[0]) {
          formData.append('meetingPhotos', fileInput.files[0]);
        }
      }
    });
    formData.append('meetings', JSON.stringify(meetings));

    var opts = { method: 'POST', body: formData, formData: true };
    var url = '/monthly-activities';

    if (editMonthlyId) {
      opts.method = 'PUT';
      url = '/monthly-activities/' + editMonthlyId;
    }

    api(url, opts).then(function () {
      resetMonthlyForm();
      loadMonthlyList();
      showMsg('✅ تم حفظ النشاط الشهري بنجاح');
    }).catch(function () {
      alert('فشل الحفظ.');
    });
  }

  // =========================================================
  //  INIT
  // =========================================================
  function init() {
    loadEvents();
    loadCommittee();
    loadMembersTable();
    loadMonthlyList();
    resetMonthlyForm();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        var tab = document.getElementById('tab-' + this.dataset.tab);
        if (tab) tab.classList.add('active');
        if (this.dataset.tab === 'events') loadEvents();
        if (this.dataset.tab === 'committee') loadCommittee();
        if (this.dataset.tab === 'members') loadMembersTable();
        if (this.dataset.tab === 'monthly') { loadMonthlyList(); resetMonthlyForm(); }
      });
    });

    // Events
    document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
    document.getElementById('cancelEventBtn').addEventListener('click', resetEventForm);
    document.getElementById('refreshEvents').addEventListener('click', loadEvents);

    // Committee
    document.getElementById('assignCommitteeBtn').addEventListener('click', assignToCommittee);
    document.getElementById('refreshCommittee').addEventListener('click', loadCommittee);

    // Event delegation for dynamic buttons
    document.getElementById('membersBody').addEventListener('click', function (e) {
      var btn = e.target.closest('.mem-edit');
      if (btn) { editMember(btn.dataset.id); return; }
      btn = e.target.closest('.mem-del');
      if (btn) { deleteMember(btn.dataset.id); }
    });
    document.getElementById('committeeGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.com-edit');
      if (btn) { changeCommitteeRole(btn.dataset.id); return; }
      btn = e.target.closest('.com-remove');
      if (btn) { removeFromCommittee(btn.dataset.id); }
    });

    // Members
    document.getElementById('saveMemberBtn').addEventListener('click', saveMember);
    document.getElementById('cancelMemberBtn').addEventListener('click', resetMemberForm);
    document.getElementById('refreshMembers').addEventListener('click', loadMembersTable);
    document.getElementById('memberSearch').addEventListener('keyup', function (e) {
      if (e.key === 'Enter') loadMembersTable();
    });
    document.getElementById('mPhotoFile').addEventListener('change', updatePhotoPreview);

    // Monthly Activities
    document.getElementById('saveMonthlyBtn').addEventListener('click', saveMonthly);
    document.getElementById('cancelMonthlyBtn').addEventListener('click', resetMonthlyForm);
    document.getElementById('refreshMonthly').addEventListener('click', function () { loadMonthlyList(); resetMonthlyForm(); });
    document.getElementById('addMeetingBtn').addEventListener('click', function () { addMeetingRow('', ''); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
