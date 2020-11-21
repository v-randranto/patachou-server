'use strict';

/**************************************************************************************
 *
 * Gestion du compte d'un membre:
 * - récupération des données du compte à partir de son id
 * - récupération de plusieurs comptes
 *
 ****************************************************************************************/
const mongoose = require('mongoose');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const accountsData = require('../access-data/accountsData');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} param 
 */
const findAccounts = (req, res, param) => {
  logging('info', base, req.sessionID, `Starting finding accounts `);
  accountsData
    .find(req.sessionID, param)
    .then((accounts) => {
      if (accounts.length) {
        logging(
          'info',
          base,
          req.sessionID,
          `${accounts.lentgh} Accounts found !`
        );
      } else {
        logging('info', base, req.sessionID, `No account !`);
      }
      res.status(httpStatusCodes.OK).json(accounts);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting accounts with query ${param} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} param 
 */
const findOneAccount = (req, res, param) => {
  logging('info', base, req.sessionID, `Starting finding one account`);
  accountsData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        logging('info', base, req.sessionID, `Account found !`);
      } else {
        logging('info', base, req.sessionID, `No account !`);
      }
      res.status(httpStatusCodes.OK).json(account);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting accounts with query ${param} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/**
 * Consulter des comptes
 * @param {*} req 
 * @param {*} res 
 */
exports.getAccounts = (req, res) => {
  logging('info', base, req.sessionID, `Starting getting accounts `);

  const param = {
    fields: '_id pseudo email presentation creationDate modificationDate isAdmin',
  };

  findAccounts(req, res, param);
};

/**
 * Consulter un compte
 * @param {*} req 
 * @param {*} res 
 */
exports.getOneAccount = (req, res) => {
  console.log('req.params', req.params.id);
  logging('info', base, req.sessionID, `Starting getting account `);

  const param = {
    query: { _id: req.params.id },
    fields: '_id pseudo email presentation creationDate modificationDate isAdmin',
  };

  findOneAccount(req, res, param);
};

/**
 * Recherche de comptes
 * @param {*} req 
 * @param {*} res 
 */
exports.searchAccounts = (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    `Starting search accounts with ${JSON.stringify(req.query)}`
  );

  // terme à rechercher
  const termRegex = {
    $regex: req.query.term,
    $options: 'i',
  };

  // paramètres de la requête de recherche de comptes
  const param = {
    query: { pseudo: termRegex },
    fields: '_id pseudo email presentation creationDate modificationDate isAdmin',
  };

  findAccounts(req, res, param);
};

/**
 * Modification d'un compte
 * @param {*} req 
 * @param {*} res 
 */
exports.updateAccount = async (req, res) => {
  if (!req.params || !req.body || !req.params.id) {
    logging('error', base, req.sessionID, 'Bad request on update account');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging(
    'info',
    base,
    req.sessionID,
    'Starting updating account',
    JSON.stringify(req.params.id)
  );

  // statut de la mise à jour
  const updateStatus = {
    save: false,
    account: null,
  };

  // paramétrage de la requête mongo pour la mise àjour
  const paramUpdate = {
    query: { _id: req.params.id },
    fields: null,
  };

  // objet contant les champs à modifier
  const updateAccount = {
    modificationDate: new Date(),
  };

  // Alimentation du compte de modification avec les champs à modifier
  await (() => {
    return new Promise((resolve, reject) => {
      try {
        for (let [key, value] of Object.entries(req.body)) {
          updateAccount[key] = value;
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  })()
    .then(() => {
      paramUpdate.fields = updateAccount;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `consitution of updateAccount went awry :(`,
        JSON.stringify(error)
      );
    });

// Chargement photo
  await (() => {
    return new Promise((resolve, reject) => {
      if (!req.body.photo) {
        resolve(false);
      }
      const accountPhoto = req.body.photo;
      logging(
        'info',
        base,
        req.sessionID,
        `he.she has a nice picture ${accountPhoto.name}.`
      );
      storePix(req.sessionID, accountPhoto.content)
        .then((result) => {
          resolve(result.secure_url);
        })
        .catch((error) => {
          reject(error);
        });
    });
  })()
    .then((res) => {
      if (res) {
        updateAccount.photo = res;
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `The hashin' and saltin' didn't go down well!`,
        JSON.stringify(error)
      );
    });

  // Enregistrement modification du compte
  await accountsData
    .update(req.sessionID, paramUpdate)
    .then((account) => {
      if (account) {
        logging(
          'info',
          base,
          req.sessionID,
          `Account with id ${req.body.id} updated !`
        );
        updateStatus.save = true;
        updateStatus.account = account;
        updateStatus.photo = account.photo; // retourner l'url de la photo, WHY???
      } else {
        updateStatus.save = false;
        logging(
          'info',
          base,
          req.sessionID,
          `Account with id ${req.body.id} not found !`
        );
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `updating account with id ${req.body.id} failed ! ${error}`
      );
      updateStatus.save = false;
      throw error;
    });

 // Retour client
  logging(
    'info',
    base,
    req.sessionID,
    `Final update status`,
    JSON.stringify(updateStatus)
  );
  if (updateStatus.save) {
    res.status(httpStatusCodes.CREATED).json(updateStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};

/**
 * Ajout d'un nouveau compte
 * @param {*} req 
 * @param {*} res 
 */
exports.addAccount = async (req, res) => {
  let addStatus = false;

  logging('info', base, req.sessionID, 'Starting adding new account...');

// Ajout et enregistrement nouveau compte
  await accountsData
    .addOne(req.sessionID, req.body.account)
    .then(() => {
      logging('info', base, req.sessionID, 'Adding account is successful !');
      addStatus = true;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Adding account has failed ! ${error}`
      );
    });

   // Retour du résultat au client  
  logging(
    'info',
    base,
    req.sessionID,
    `Final update status`,
    JSON.stringify(addStatus)
  );
  if (addStatus) {
    res.status(httpStatusCodes.CREATED).json(addStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};

/**
 * Suppression d'un compte
 * @param {*} req 
 * @param {*} res 
 */
exports.deleteAccount = (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    `Starting deleting account with ${JSON.stringify(req.params.id)}`
  );
  accountsData
    .delete(req.sessionID, req.params.id)
    .then((account) => {
      logging(
        'info',
        base,
        req.sessionID,
        `${JSON.stringify(account)} deleted!`
      );
      res.status(httpStatusCodes.OK).json(account);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `deleting ${req.params.id} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};
