;(function () {
  'use strict';

  var PHOTO_MAP_KEY = 'tala2e3_member_photos_map';

  var memberPhotos = [
    { file: 'images/peter.jpeg', name: 'بيتر حردان' },
    { file: 'images/nathalia.jpeg', name: 'ناتاليا حردان' },
    { file: 'images/andrea.jpeg', name: 'أندريا حردان' },
    { file: 'images/charbel.jpeg', name: 'شربل حردان' },
    { file: 'images/jose.jpeg', name: 'جوزيف حردان' },
    { file: 'images/elise.jpeg', name: 'إليسا حردان' },
    { file: 'images/marina.jpeg', name: 'مارينا حردان' },
    { file: 'images/boutros.jpeg', name: 'بطرس حردان' },
    { file: 'images/boutros2.jpeg', name: 'بطرس حردان' },
    { file: 'images/therezia.jpeg', name: 'ثيريزيا حردان' }
  ];

  function getAvailablePhotos() {
    return memberPhotos;
  }

  function getStoredPhoto(memberId) {
    var map = JSON.parse(localStorage.getItem(PHOTO_MAP_KEY) || '{}');
    return map[memberId] || '';
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
    if (!name) return '';
    var firstWord = name.split(' ')[0];
    for (var i = 0; i < memberPhotos.length; i++) {
      if (memberPhotos[i].name === name) return memberPhotos[i].file;
      if (memberPhotos[i].name.indexOf(firstWord) === 0) return memberPhotos[i].file;
    }
    return '';
  }

  window.Tala2e3Members = {
    getAvailablePhotos: getAvailablePhotos,
    toArabicNum: toArabicNum,
    calcAge: calcAge,
    getStoredPhoto: getStoredPhoto,
    setStoredPhoto: setStoredPhoto,
    findPhotoByName: findPhotoByName,
    memberPhotos: memberPhotos
  };
})();
