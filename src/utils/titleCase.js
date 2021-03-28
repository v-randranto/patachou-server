'use strict'

const toTitleCase = function (value) {
  return value.toLowerCase().replace(/(?:^|\s|\/|\-)\w/g, (match) => {
    return match.toUpperCase();
  });
};

module.exports = toTitleCase
