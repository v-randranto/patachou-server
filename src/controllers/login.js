'use strict';

const checkPassword = require('../utils/passwordHandler').check;
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const jwt = require('jsonwebtoken');
const accountsData = require('../access-data/accountsData');
const { toTitleCase } = require('../utils/titleCase');

/****************************************************************************************
 *
 * Connexion d'un utilisateur :
 * - recherche en base de l'utilisateur
 * - vérification de son mot de passe
 * - génération d'un jeton d'authentification à renvoyer au client
 *
 ****************************************************************************************/

exports.authenticate = (req, res) => {
  logging('info', base, null, 'Starting login authentication...');

  if (!req.body || !req.body.login) {
    logging('error', base, null, 'Bad request on check account');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  const { pseudo, password } = req.body.login;

  // statuts de la connexion
  const loginStatus = {
    error: false,
    notFound: false,
    pwdExpired: false,
    authKO: false,
    jwtKO: false,
  };

  const param = {
    query: { pseudo },
  };  
  let foundAccount = {};

  // mise à jour du statut de connexion du membre
  const paramUpdate = {
    query: { _id: null },
    fields: { isLoggedIn: true },
  };

  const returnData = {
    account: null,
    accessToken: null,
    expiresIn: 24 * 3600 * 1000, // jeton valide pendant 1j
  };

  const setFoundAccount = (account) => {
    foundAccount._id = account._id,
    foundAccount.pseudo = toTitleCase(account.pseudo),
    foundAccount.isAdmin = account.isAdmin,
    foundAccount.creationDate = account.creationDate,
    foundAccount.modificationDate = account.modificationDate,
    foundAccount.password = account.password,
    foundAccount.salt = account.salt,
    foundAccount.pwdExpiringDate = account.pwdExpiringDate,
    foundAccount.presentation = account.presentation,
    foundAccount.photoUrl = account.photoUrl
  }

  // Recherche du membre par son pseudo
  

  accountsData
    .findOne(param)
    .then((account) => {
      if (account) {
        logging('info', base, null, `Account ${pseudo} found`);
        setFoundAccount(account)
        if (foundAccount.pwdExpiringDate < new Date()) {
          logging(
            'info',
            base,
            null,
            `Account ${pseudo} paswword has expired`
          );
          loginStatus.pwdExpired = true;
          return false;
        } else {
          return true;
        }
      } else {
        logging('info', base, null, `Account ${pseudo} not found !`);
        loginStatus.notFound = true;
        return false;
      }
    })
    .then((accountOK) => {
      // si compte trouvé, vérifier le mot de passe
      if (accountOK) {
        const passwordChecked = checkPassword(
          password,
          foundAccount.salt,
          foundAccount.password
        );
        if (passwordChecked) {
          logging(
            'info',
            base,
            null,
            `Account ${pseudo} password checked !`
          );
          delete foundAccount.password;
          delete foundAccount.salt;
          try {
            const token = jwt.sign(
              {
                id: foundAccount._id,
                pseudo: foundAccount.pseudo,
              },
              // eslint-disable-next-line no-undef
              process.env.TOKEN_KEY,
              { expiresIn: '1d' },
              { algorithm: 'HS256' }
            );
            logging(
              'info',
              base,
              null,
              `Account ${pseudo} token created`
            );
            returnData.accessToken = token;
            returnData.account = {...foundAccount};
            loginStatus.jwtKO = false;
          } catch (error) {
            logging(
              'error',
              base,
              null,
              `Jwt signing failed on account ${pseudo} !`
            );
            loginStatus.jwtKO = true;
            return false;
          }
          loginStatus.authKO = false;
          return true;
        } else {
          logging(
            'error',
            base,
            null,
            `Account ${pseudo} password mismatch !`
          );
          loginStatus.authKO = true;
          return false;
        }
      } else {
        return false;
      }
    })
    .then((accountAuthenticated) => {
      if (accountAuthenticated) {
        logging('info', base, null, `starting updating login status`);
        paramUpdate.query._id = foundAccount._id;
        accountsData
          .update(paramUpdate)
          .then((account) => {
            if (account) {
              logging('info', base, null, `loggedIn status updated !`);
            } else {
              logging(
                'error',
                base,
                null,
                `Account with id ${foundAccount._id} not found  !`
              );
              throw new Error('account not found');
            }
          })
          .catch((error) => {
            logging(
              'error',
              base,
              null,
              `updating login status failed ! ${error}`
            );
            throw error;
          });
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `Getting account ${pseudo} failed ! ${error}`
      );
      loginStatus.error = true;
    })
    .finally(() => {
      if (loginStatus.error) {
        logging('debug', base, null, 'technical error');
        res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      } else if (loginStatus.notFound) {
        logging('debug', base, null, 'not found');
        res.status(httpStatusCodes.NOT_FOUND).end();
      } else if (
        loginStatus.pwdExpired ||
        loginStatus.authKO ||
        loginStatus.jwtKO
      ) {
        logging('debug', base, null, 'login unauthorized');
        res.status(httpStatusCodes.UNAUTHORIZED).end();
      } else {
        logging(
          'debug',
          base,
          null,
          'login authorized',
          JSON.stringify(returnData)
        );
        res.status(httpStatusCodes.OK).json(returnData);
      }
    });
};
