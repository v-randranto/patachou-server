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

/*====================================================================================*
 * requête d'un compte
 *=====================================================================================*/

const findAccounts = (req, res, param) => {

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

}

exports.getAccounts = (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    `Starting getting accounts `
  );

  const param = {
    query: {},
    fields: '',
  };

  findAccounts(req, res, param);
  
};


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
    query: {
      $or: [
        { firstName: termRegex },
        { lastName: termRegex },
      ],
    }
  };

  findAccounts(req, res, param);
};
/*====================================================================================*
 * Mise à jour d'une accountne
 *=====================================================================================*/

exports.updateAccount = async (req, res) => {
  if (!req.body || !req.body.id) {
    logging('error', base, req.sessionID, 'Bad request on update account');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging(
    'info',
    base,
    req.sessionID,
    'Starting updating account',
    JSON.stringify(req.body.id)
  );

  // statut de la mise à jour
  const updateStatus = {
    save: false,
    account: null,
  };

  // paramétrage de la requête mongo pour la mise àjour
  const paramUpdate = {
    query: { _id: req.body.id },
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

  /*-----------------------------------------------------------------------------*
   * stockage de la photo si chargée
   *----------------------------------------------------------------------------*/

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

  /*-------------------------------------------------------------------------*
   * Enregistrement en base
   *-------------------------------------------------------------------------*/

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

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
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

exports.addAccount = async (req, res) => {
  let addStatus = false;

  logging('info', base, req.sessionID, 'Starting adding new account...');

  /*-----------------------------------------------------------------------------*
   * Enregistrement en base du nouveau membre
   *----------------------------------------------------------------------------*/
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

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
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

exports.deleteAccount = (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    `Starting deleting account with ${JSON.stringify(req.body.id)}`
  );
;

  accountsData
    .delete(req.sessionID, req.body.id)
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
        `deleting ${req.body.id} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};