;(function () {
  'use strict';

  var PHOTO_MAP_KEY = 'tala2e3_member_photos_map';

  function getStoredPhoto(memberId) {
    var map = JSON.parse(localStorage.getItem(PHOTO_MAP_KEY) || '{}');
    var url = map[memberId] || '';
    if (url.startsWith('/uploads/')) return '';
    return url;
  }

  function setStoredPhoto(memberId, photoUrl) {
    var map = JSON.parse(localStorage.getItem(PHOTO_MAP_KEY) || '{}');
    if (photoUrl) map[memberId] = photoUrl;
    else delete map[memberId];
    localStorage.setItem(PHOTO_MAP_KEY, JSON.stringify(map));
  }

  function toArabicNum(n) {
    if (n === undefined || n === null || n === '') return '—';
    var d = '٠١٢٣٤٥٦٧٨٩';
    return String(n).replace(/\d/g, function (c) { return d[parseInt(c, 10)]; });
  }

  function calcAge(dob) {
    if (!dob) return null;
    var birth = new Date(dob);
    var today = new Date();
    var age = today.getFullYear() - birth.getFullYear();
    var m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function findPhotoByName(name) {
    return '';
  }

  (function cleanupOldUploads() {
    var map = JSON.parse(localStorage.getItem(PHOTO_MAP_KEY) || '{}');
    var changed = false;
    for (var key in map) {
      if (map[key] && map[key].startsWith('/uploads/')) {
        delete map[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(PHOTO_MAP_KEY, JSON.stringify(map));
  })();

  window.Tala2e3Members = {
    toArabicNum: toArabicNum,
    calcAge: calcAge,
    getStoredPhoto: getStoredPhoto,
    setStoredPhoto: setStoredPhoto,
    findPhotoByName: findPhotoByName
  };
})();
