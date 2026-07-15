;(function () {
  'use strict';

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

  window.Tala2e3Members = {
    toArabicNum: toArabicNum,
    calcAge: calcAge,
  };
})();
