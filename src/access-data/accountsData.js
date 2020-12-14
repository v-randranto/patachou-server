'use strict';
const mongoose = require('mongoose');
const Account = require('../models/account');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

exports.find = (param) => {
  logging('info', base, null, 'Starting finding accounts...', JSON.stringify(param.query));
  return new Promise((resolve, reject) => {
    Account.find(param.query, param.fields).sort({pseudo: 1})
    .then((accounts) => {
      if (accounts.length) {        
        logging('info', base, null, `Finding accounts successful !`);
        // TODO formatter les accounts avant de les retourner
        resolve(accounts);
      } else {
        logging('info', base, null, 'No account found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, null, 'Finding accounts failed !');
      reject(error);
    });
  });
  
};

exports.findOne = (param) => {
  logging('info', base, null, 'Starting finding account...', JSON.stringify(param.query));
  return new Promise((resolve, reject) => {
    Account.findOne(param.query, param.fields)
    .then((account) => {
      if (account) {        
        logging('info', base, null, `Finding one account successful ! ${account.pseudo} ${account._id}`);
        // TODO formatter les accounts avant de les retourner
        resolve(account);
      } else {
        logging('info', base, null, 'No account found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, null, 'Finding accounts failed !');
      reject(error);
    });
  });
  
};

exports.addOne = (account) => {
  
  logging('info', base, null, 'Starting saving account...');
  
  return new Promise((resolve, reject) => {
    const newAccount = new Account(account);
    newAccount
    .save()
    .then(() => {
      logging('info', base, null, 'saving account successful !');
      resolve(true) ;   
    })
    .catch((error) => {
      logging('error', base, null, 'saving account failed !');
      reject(error);
    });  
  });
   
};

exports.update = (param) => {

  logging('info', base, null, 'Starting updating account...', JSON.stringify(param)
  );

  return new Promise((resolve, reject) => {
    Account.findOneAndUpdate(param.query, param.fields, {new: true})
    .then((account) => {
      logging('info', base, null, 'Updating account successful !');
      resolve(account);
    })
    .catch((error) => {
      logging('error', base, null, 'Updating account failed !');
      reject(error);
    });
  });  
};

exports.delete = (id) => {
  logging('info', base, null, 'Starting deleting account...', JSON.stringify(id));
    return new Promise((resolve, reject) => {
      Account.findOneAndDelete({ _id: mongoose.mongo.ObjectId(id) })
    .then((account) => {
      logging('info', base, null, 'Deleting account successfull !');
      resolve(account);
    })
    .catch((error) => {
      logging('error', base, null, 'Deleting account failed !');
      reject(error);
    });
    })
  
};