'use strict';

const logger = require('./logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const crypto = require('crypto');

// calcule le hash de la chaîne de caractères passée
const getHash = function (data, salt) {
  logger.info(`[${base}] getting a hashing`);
  return crypto
    .pbkdf2Sync(data, salt, 100000, 256, 'sha256')
    .toString('hex');
};

// retourne le hash et le sel de la chaîne de caractères passée
exports.getSaltHash = function (data) {
  logger.info(`[${base}] getting a hash and a salt`);
  const salt = crypto.randomBytes(32).toString('hex');
  return { hash: getHash(data, salt), salt: salt };
};

// calcule le hash d'une chaîne de caractère avec le sel passé :) et compare avec une autre chaîne hashée
exports.check = function (data, salt, expectedHash) {
  logger.info(`[${base}] checking data against a hash`);
  return expectedHash === getHash(data, salt);
};

exports.generatePwd = function (length) {
  let result ='';
  const alphaNum='abcdefghijknopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ12345679',
  specialChars = '!@#$+-*&_'; 

  /* position du caractère spécial dans le mdp */
  const specialCharPosition = Math.floor(Math.random() * (specialChars.length - 1));

  for(var i=0; i<length; ++i){
      if ( specialCharPosition === i ){
          /* ajout du caractère spécial */
          result += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      } else {
          /* ajout d'un caractère alphanumérique */
          result += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
      }
  }
  return result;
}
