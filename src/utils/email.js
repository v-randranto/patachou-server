/* eslint-disable no-undef */

const nodemailer = require('nodemailer');
const { base } = require('path').parse(__filename);
const { logging } = require('./loggingHandler');
const ejs = require('ejs');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

let mailSender = function () {};

mailSender.prototype.send = async function (sender, recipient, subject, name) {
  logging(
    'info',
    base,
    null,
    `Starting sending email to ${recipient} - ${subject}`
  );

  ejs.renderFile(
    __dirname + '/email-templates/register.ejs',
    { name: name },
    function (err, data) {
      if (err) {
        console.log(err);
      } else {
        let mailOptions = {
          from: sender,
          to: recipient,
          subject: subject,
          html: data,
        };
        //console.log("html data ======================>", mainOptions.html);

        return new Promise(function (resolve, reject) {
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log('mailOptions', mailOptions);
              console.log('error', error);
              reject(error);
            } else {
              resolve(info);
            }
          });
        });
      }
    }
  );
};

module.exports = mailSender;