'use strict'

exports.toTitleCase = function (value) {
  return value.toLowerCase().replace(/(?:^|\s|\/|\-)\w/g, (match) => {
    return match.toUpperCase();
  });
};
