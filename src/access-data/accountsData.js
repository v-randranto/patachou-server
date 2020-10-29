'use strict';
const mongoose = require('mongoose');
const Account = require('../models/account');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

exports.addOne = (sessionID, account) => {
  
  logging('info', base, sessionID, 'Starting saving account...', JSON.stringify(account));
  
  return new Promise((resolve, reject) => {
    const newAccount = new Account(account);
    newAccount
    .save()
    .then(() => {
      logging('info', base, sessionID, 'saving account successful !');
      resolve(true) ;   
    })
    .catch((error) => {
      logging('error', base, sessionID, 'saving account failed !');
      reject(error);
    });  
  });
   
};

exports.find = (sessionID, param) => {

  logging('info', base, sessionID, 'Starting finding accounts...', JSON.stringify(param.query));

  return new Promise((resolve, reject) => {
    Account.find(param.query, param.fields).sort({lastName: 1})
    .then((accounts) => {
      if (accounts.length) {        
        logging('info', base, sessionID, `Finding accounts successful !`);
        // TODO formatter les accounts avant de les retourner
        resolve(accounts);
      } else {
        logging('info', base, sessionID, 'No account found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Finding accounts failed !');
      reject(error);
    });
  });
  
};

exports.update = (sessionID, param) => {

  logging('info', base, sessionID, 'Starting updating account...', JSON.stringify(param)
  );

  return new Promise((resolve, reject) => {
    Account.findOneAndUpdate(param.query, param.fields, {new: true})
    .then((account) => {
      logging('info', base, sessionID, 'Updating account successful !');
      resolve(account);
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Updating account failed !');
      reject(error);
    });
  });  
};

exports.delete = (sessionID, id) => {
  logging('info', base, sessionID, 'Starting deleting account...', JSON.stringify(id));
    return new Promise((resolve, reject) => {
      Account.findOneAndDelete({ _id: mongoose.mongo.ObjectId(id) })
    .then((account) => {
      logging('info', base, sessionID, 'Deleting account successfull !');
      resolve(account);
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Deleting account failed !');
      reject(error);
    });
    })
  
};