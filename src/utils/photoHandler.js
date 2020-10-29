/* eslint-disable no-undef */
'use strict';

const { base } = require('path').parse(__filename);
const { logging } = require('../utils/loggingHandler');
const cloudinary = require('cloudinary').v2;
const folder = 'patachou';

exports.storePix = async function (sessionID, content) {  
  logging('info', base, sessionID, 'Starting storing picture in Cloudinary...');
  const result = await cloudinary.uploader.upload(content, { folder }, function (error, result) {
    if (error) {
      logging(
        'error',
        base,
        sessionID,
        `Cloudinary storing has failed: ${error}`
      );
      return null;
    }
    logging('info', base, sessionID, `Cloudinary storing successfull! ${result.secure_url}`);    
  });
  return result;
};
