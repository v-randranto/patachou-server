/* eslint-disable no-undef */
'use strict';

const cloudinary = require('cloudinary').v2;
const {getRandomInt} = require('./randomNumber')
const folder = 'patachou';

const storePhoto = async function (content) {  
  const result = await cloudinary.uploader.upload(content, { folder }, function (error, result) {
    if (error) {
      return process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`];
    }
  });
  return result.secure_url;
};

module.exports = storePhoto;
