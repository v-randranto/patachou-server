'use strict';

/**************************************************************************************
 *
 * Enregistrement d'un nouveau membre:
 * - vérification que son pseudo n'est pas déjà utilisé
 * - chiffrement de son mot de passe
 * - enregistrement des données en base
 * - envoi d'un email de confirmation à l'adresse fournie
 *
 ****************************************************************************************/
const passwordHandler = require('../utils/passwordHandler');
const { toTitleCase } = require('../utils/titleCase');
const mailSender = new (require('../utils/email'))();
const emailContent = require('../constants/email.json');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { storePix } = require('../utils/photoHandler');
const accountData = require('../access-data/accountsData');

// url de l'avatar par défaut
// eslint-disable-next-line no-undef
const default_avatar = process.env.DEFAULT_AVATAR;

// statut de la mise à jour s à retourner au client
const registerStatus = {
  pseudoUnavailable: false,
  save: false,
  email: false,
};

// function NewAccount(initObject) {
//   this.pseudo = initObject.pseudo;
//   this.password = initObject.password;
//   this.email = initObject.email;
//   this.presentation = initObject.presentation;
//   this.photo = {};
// }

// eslint-disable-next-line no-undef
const sender = process.env.EMAIL_FROM;
const textEmail = function (pseudo) {
  return `<html><body><p>Bonjour ${toTitleCase(pseudo)},<br><br>${
    emailContent.REGISTER.text
  }<br><br>${emailContent.REGISTER.signature}</p></body></html>`;
};

exports.addAccount = async (req, res) => {
  
  if (!req.body || !req.body.account) {
    logging(
      'error',
      base,
      req.sessionID,
      'Bad request on registering account.'
    );
    console.log('le body est ko')
    return res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging('info', base, req.sessionID, 'Starting registering new account...');

  const newAccount = {...req.body.account};
  const param = {
    query: { pseudo: newAccount.pseudo },
    fields: 'pseudo',
  };
  
  await accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        logging(
          'info',
          base,
          req.sessionID,
          `Pseudo ${newAccount.pseudo} is already in use !`
        );
        registerStatus.pseudoUnavailable = true;
      } else {
        logging(
          'info',
          base,
          req.sessionID,
          `Pseudo ${newAccount.pseudo} is available`
        );
        registerStatus.pseudoUnavailable = false;
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Checking pseudo has failed ! ${error}`
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      return;
    });

  if (registerStatus.pseudoUnavailable) {
    res.status(httpStatusCodes.OK).json(registerStatus);
    return;
  }

  /*-------------------------------------------------------------------------*
   * Chiffrage du mot de passe
   *-------------------------------------------------------------------------*/

  await (function () {
    logging(
      'info',
      base,
      req.sessionID,
      `Let's do some hashin' and saltin'...`
    );
    return new Promise((resolve, reject) => {
      // hachage avec sel du mot de passe
      try {
        const { hash, salt } = passwordHandler.getSaltHash(newAccount.password);
        resolve({ hash, salt });
      } catch (error) {
        reject(error);
      }
    });
  })()
    .then((res) => {
      logging('info', base, req.sessionID, `Successful hashin' and saltin'!`);
      newAccount.password = res.hash;
      newAccount.salt = res.salt;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `The hashin' and saltin' didn't go down well!`,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      return;
    });

  /*-----------------------------------------------------------------------------*
   * stockage de la photo
   *----------------------------------------------------------------------------*/

  await (function () {
    return new Promise((resolve, reject) => {
      if (newAccount.photo) {
        const accountPhoto = newAccount.photo;
        delete newAccount.photo
        logging(
          'info',
          base,
          req.sessionID,
          `${newAccount.pseudo} has a nice picture ${accountPhoto.name}.`
        );
        storePix(req.sessionID, accountPhoto.content)
          .then((result) => {
            newAccount.photoUrl = result.secure_url;
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        logging(
          'info',
          base,
          req.sessionID,
          `${newAccount.pseudo} has no picture.`
        );
        newAccount.photoUrl = default_avatar;
        resolve(true);
      }
    });
  })()
  .then(() => {
    logging(
      'info',
      base,
      req.sessionID,
      `${newAccount.pseudo}'s picture is loaded.`
    );
  })
  .catch((error) => {
    logging(
      'error',
      base,
      req.sessionID,
      ``,
      JSON.stringify(error)
    );
    newAccount.photoUrl = default_avatar;
  });

  /*-----------------------------------------------------------------------------*
   * Enregistrement en base du nouveau membre
   *----------------------------------------------------------------------------*/
  await accountData
    .addOne(req.sessionID, newAccount)
    .then(() => {
      logging('info', base, req.sessionID, 'Adding account is successful !');
      registerStatus.save = true;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Adding account has failed ! ${error}`
      );
      registerStatus.save = false;
    });

  if (!registerStatus.save) {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }
  /*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/

  await mailSender
    .send(
      sender,
      newAccount.email,
      emailContent.REGISTER.subject,
      textEmail(newAccount.pseudo)
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      registerStatus.email = true;
    })
    .catch((error) => {
      // une erreur sur le traitement email n'est pas bloquante
      logging(
        'error',
        base,
        req.sessionID,
        `Email processing has failed ! ${error}`
      );
      registerStatus.email = false;
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/

  logging(
    'info',
    base,
    req.sessionID,
    `Final registering status`,
    JSON.stringify(registerStatus)
  );

  if (registerStatus.save) {
    res.status(httpStatusCodes.CREATED).json(registerStatus);
    return;
  }
  res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
};
