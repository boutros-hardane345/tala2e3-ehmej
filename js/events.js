;(function () {
  'use strict';

  var monthNames = { '01': 'كانون الثاني', '02': 'شباط', '03': 'آذار', '04': 'نيسان', '05': 'أيار', '06': 'حزيران', '07': 'تموز', '08': 'آب', '09': 'أيلول', '10': 'تشرين الأول', '11': 'تشرين الثاني', '12': 'كانون الأول' };

  function authHeaders() {
    var token = localStorage.getItem('tala2e3_token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  function getAll() {
    return fetch(API_BASE_URL + '/api/events').then(function (r) {
      if (!r.ok) return [];
      return r.json();
    });
  }

  function getUpcoming() {
    return fetch(API_BASE_URL + '/api/events/upcoming').then(function (r) {
      if (!r.ok) return [];
      return r.json();
    });
  }

  function getPast() {
    return getAll().then(function (all) {
      var now = new Date();
      return all.filter(function (e) {
        return e.date && new Date(e.date + 'T23:59:59') < now;
      }).sort(function (a, b) {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
    });
  }

  function add(event) {
    return fetch(API_BASE_URL + '/api/events', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(event)
    }).then(function (r) {
      if (!r.ok) throw new Error('فشل إضافة النشاط');
      return r.json();
    });
  }

  function update(id, updates) {
    return fetch(API_BASE_URL + '/api/events/' + id, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(updates)
    }).then(function (r) {
      if (!r.ok) throw new Error('فشل تعديل النشاط');
      return r.json();
    });
  }

  function remove(id) {
    return fetch(API_BASE_URL + '/api/events/' + id, {
      method: 'DELETE',
      headers: authHeaders()
    }).then(function (r) {
      if (!r.ok) throw new Error('فشل حذف النشاط');
      return r.json();
    });
  }

  function getById(id) {
    return fetch(API_BASE_URL + '/api/events/' + id).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var day = parseInt(parts[2], 10);
    var monthName = monthNames[parts[1]] || parts[1];
    var d = '٠١٢٣٤٥٦٧٨٩';
    return String(day).replace(/\d/g, function (c) { return d[parseInt(c, 10)]; }) + ' ' + monthName;
  }

  window.Tala2e3Events = {
    getAll: getAll,
    getUpcoming: getUpcoming,
    getPast: getPast,
    add: add,
    update: update,
    remove: remove,
    getById: getById,
    formatDate: formatDate
  };
})();
