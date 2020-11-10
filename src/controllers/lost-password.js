'use strict';

const passwordHandler = require('../utils/passwordHandler');
const { toTitleCase } = require('../utils/titleCase');
const mailSender = new (require('../utils/email'))();
const emailContent = require('../constants/email.json');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const accountData = require('../access-data/accountData');
const { expire } = require('../utils/dateFunctions');

/****************************************************************************************
 *
 * Renvoyer un mot de passe  :
 * - recherche en base de l'utilisateur avec son email
 * - générer un mot de passe aléatoire et le chiffrer
 * - enregistrement en base du mot de passe avec une date d'expiration
 * - envoyer par mail le nouveau mot de passe 
 *
 ****************************************************************************************/
 
// eslint-disable-next-line no-undef
const sender = process.env.EMAIL_FROM;
const textEmail = function (pseudo, password) {
  return `<html><body><p>Bonjour ${toTitleCase(pseudo)},<br><br>${emailContent.PASSWORD.text1}<br><br>${password}<br><br>${emailContent.PASSWORD.text2}<br><br>${emailContent.PASSWORD.signature}</p></body></html>`;
};

const PASSORD_LENGTH = 8;

exports.renewPassword = async (req, res) => {

  if (!req.body || !req.body.email) {
    logging('error', base, req.sessionID, 'Bad request on renew password');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }
  
  logging('info', base, req.sessionID, 'Starting renewing password...');

  // statuts de la réinitialisation du mot de passe
  const renewStatus = {
    emailNotFound: false,
    save: false,
    email: false,
  };

  // Recherche du membre par son email
  const param = {
    query: { email: req.body.email },
    fields: '_id pseudo email'
  };

  let foundAccount, newPassword;
  
  // paramétrage de la requête mongo pour la mise à jour
  // le mot de passe aura une validité de 2h
  const paramUpdate = {
    query: { _id: null },
    fields: {
      password: null,
      salt: null,
      pwdExpiringDate: expire(2), 
      modificationDate: new Date(),
      modificationAuthor: req.body.modificationAuthor // renseigné si administrateur
    }
  } 
  

  /*-----------------------------------------------------------------------------*
   * recherche du compte à partir de l'email et générer un mot de passe provisoire
   *-----------------------------------------------------------------------------*/
  await accountData
    .findOne(req.sessionID, param)
    .then(account => {
      if (account) {
        logging('info', base, req.sessionID, `email ${account.email} found !`
        );
        foundAccount = account;
        paramUpdate.query._id = account._id; 
        renewStatus.emailNotFound = false;
      } else {
        logging('info', base, req.sessionID, `email ${req.body.email} not found !`
        );
        renewStatus.emailNotFound = true;
        return;

      }
    })
    .catch(error => {
      logging('error', base, req.sessionID, `finding account has failed ! ${error}`
      );
      throw error;
    });

  if (renewStatus.emailNotFound) {
    res.status(httpStatusCodes.OK).json(renewStatus);
    return;
  }
  
  /*-------------------------------------------------------------------------*
   * générer et chiffrer le mot de passe provisoire
   *-------------------------------------------------------------------------*/
  await (function () {           
    logging('info', base, req.sessionID, `Let's do some hashin' and saltin'...`);    
    newPassword = passwordHandler.generatePwd(PASSORD_LENGTH);
    return new Promise((resolve, reject) => {
      // hachage avec sel du mot de passe
      try {        
        const { hash, salt } = passwordHandler.getSaltHash(newPassword);  
        resolve({ hash, salt });
      } catch (error) {        
        reject(error);
      }
    });
  })()
  .then(res => {          
    logging('info', base, req.sessionID, `Successful hashin' and saltin'!`);
    paramUpdate.fields.password = res.hash;
    paramUpdate.fields.salt = res.salt;
  })
  .catch(error => {
    logging('error', base, req.sessionID, `The hashin' and saltin' didn't go down well!`);
    throw error;
  });
  
  /*-------------------------------------------------------------------------*
   * Enregistrement en base
   *-------------------------------------------------------------------------*/
  
  await accountData
    .update(req.sessionID, paramUpdate)
    .then(account => {
      if (account) {
        logging('info', base, req.sessionID, `Account with id ${foundAccount._id} updated !`);
        renewStatus.save = true;
      } else {
        renewStatus.save = false;
        logging('info', base, req.sessionID, `Account with id  ${foundAccount._id}  not found !`);
      }
    })
    .catch(error => {
      logging('error', base, req.sessionID, 
      `updating account with id  ${foundAccount._id}  failed ! ${error}`);
      renewStatus.save = false;
      throw error;
    });

  if (!renewStatus.save) {
    res.status(httpStatusCodes.OK).json(renewStatus);
    return;
  }

  /*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
  await mailSender
    // eslint-disable-next-line no-undef
    .send(
      sender,
      foundAccount.email,
      emailContent.PASSWORD.subject,
      textEmail(foundAccount.pseudo, newPassword)
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      renewStatus.email = true;
      return;
    })
    .catch(error => {
      // une erreur sur le traitement email n'est pas bloquante
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`);
      renewStatus.email = false;
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final registering status`, JSON.stringify(renewStatus)
  );
  if (renewStatus.save) {
    res.status(httpStatusCodes.OK).json(renewStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
