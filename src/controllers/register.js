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
const accountConstants = require('../constants/account.json');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { storePix } = require('../utils/photoHandler');
const accountData = require('../access-data/accountsData');

// url de l'avatar par défaut
// eslint-disable-next-line no-undef
const default_avatar_1 = process.env.DEFAULT_AVATAR_1;
const default_avatar_2 = process.env.DEFAULT_AVATAR_2;
const default_avatar_3 = process.env.DEFAULT_AVATAR_3;
const default_avatar_4 = process.env.DEFAULT_AVATAR_3;

// statut de la mise à jour s à retourner au client
const registerStatus = {
  pseudoUnavailable: false,
  save: false,
  email: false,
};

// eslint-disable-next-line no-undef
const sender = process.env.EMAIL_FROM;

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}

exports.addAccount = async (req, res) => {
  
  if (!req.body || !req.body.account) {
    logging(
      'error',
      base,
      null,
      'Bad request on registering account.'
    );
    console.log('le body est ko')
    return res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging('info', base, null, 'Starting registering new account...');

  const newAccount = {...req.body.account};
  newAccount.pseudo = newAccount.pseudo.toLowerCase()
  const param = {
    query: { pseudo: newAccount.pseudo},
    fields: 'pseudo',
  };
  
  await accountData
    .findOne(param)
    .then((account) => {
      if (account) {
        logging(
          'info',
          base,
          null,
          `Pseudo ${newAccount.pseudo} is already in use !`
        );
        registerStatus.pseudoUnavailable = true;
      } else {
        logging(
          'info',
          base,
          null,
          `Pseudo ${newAccount.pseudo} is available`
        );
        newAccount.roles = ["user"]
        registerStatus.pseudoUnavailable = false;
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
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
      null,
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
      logging('info', base, null, `Successful hashin' and saltin'!`);
      newAccount.password = res.hash;
      newAccount.salt = res.salt;
      if (!newAccount.presentation) {
        newAccount.presentation = accountConstants.defaultPresentation
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
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
          null,
          `${newAccount.pseudo} has a nice picture ${accountPhoto.name}.`
        );
        storePix(accountPhoto.content)
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
          null,
          `${newAccount.pseudo} has no picture.`
        );
        newAccount.photoUrl = process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`]
        resolve(true);
      }
    });
  })()
  .then(() => {
    logging(
      'info',
      base,
      null,
      `${newAccount.pseudo}'s picture is loaded.`
    );
  })
  .catch((error) => {
    logging(
      'error',
      base,
      null,
      ``,
      JSON.stringify(error)
    );
    newAccount.photoUrl = process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`]
  });

  /*-----------------------------------------------------------------------------*
   * Enregistrement en base du nouveau membre
   *----------------------------------------------------------------------------*/
  await accountData
    .addOne(newAccount)
    .then(() => {
      logging('info', base, null, 'Adding account is successful !');
      registerStatus.save = true;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
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
      toTitleCase(newAccount.pseudo)
    )
    .then(() => {
      logging('info', base, null, ' Email processing successfull !');
      registerStatus.email = true;
    })
    .catch((error) => {
      // une erreur sur le traitement email n'est pas bloquante
      logging(
        'error',
        base,
        null,
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
    null,
    `Final registering status`,
    JSON.stringify(registerStatus)
  );

  if (registerStatus.save) {
    res.status(httpStatusCodes.CREATED).json(registerStatus);
    return;
  }
  res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
};
