'use strict'

exports.expire = function (nbHours) {

  let dateTime = Date.now();
  let addTime = nbHours * 3600 * 1000;
  return new Date(dateTime + addTime);
};
