/* eslint-disable no-undef */

const nodemailer = require('nodemailer');
const ejs = require('ejs');

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const sendEmail = (options, template, variables) => {
  let success = true;
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_PATACHOU,
      pass: process.env.EMAIL_PASS,
    },
  });

  ejs.renderFile(
    __dirname + `/email-templates/${template}.ejs`,
    variables,
    function (err, message) {
      if (err) {
        success = false;
      } else {
        let mailOptions = {
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: message,
        };
        
        return new Promise(function (resolve, reject) {
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('mailOptions', mailOptions);
              console.log('error', error);
              success = false
            } else {
              resolve(info);
            }
          });
        });
      }
    }
  );
  return success;
}

module.exports = sendEmail;