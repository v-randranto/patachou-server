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
const recipesData = require('../access-data/recipesData');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} param 
 */
const findRecipes = (req, res, param) => {
  logging('info', base, null, `Starting finding recipes `);
  recipesData
    .find(param)
    .then((recipes) => {
      if (recipes.length) {
        logging(
          'info',
          base,
          null,
          `${recipes.lentgh} Recipes found !`
        );
      } else {
        logging('info', base, null, `No recipe !`);
      }
      res.status(httpStatusCodes.OK).json(recipes);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `Getting recipes with query ${param} failed ! `,
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
const findOneRecipe = (req, res, param) => {
  logging('info', base, null, `Starting finding one recipe`);
  recipesData
    .findOne(param)
    .then((recipe) => {
      if (recipe) {
        logging('info', base, null, `Recipe found !`);
      } else {
        logging('info', base, null, `No recipe !`);
      }
      res.status(httpStatusCodes.OK).json(recipe);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `Getting recipes with query ${param} failed ! `,
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
exports.getRecipes = (req, res) => {
  logging('info', base, null, `Starting getting recipes `);

  const param = {
    fields: '_id title privacyLevel',
  };

  findRecipes(req, res, param);
};

exports.getAccountRecipes = (req, res) => {
  logging('info', base, null, `Starting getting recipes of account`, req.params.id);

  const param = {
    query: { accountId: req.params.id },
    fields: '_id title privacyLevel',
  };

  findRecipes(req, res, param);
};

/**
 * Consulter un compte
 * @param {*} req 
 * @param {*} res 
 */
exports.getOneRecipe = (req, res) => {
  console.log('req.params', req.params.id);
  logging('info', base, null, `Starting getting recipe `);

  const param = {
    query: { _id: req.params.id }
  };

  findOneRecipe(req, res, param);
};

/**
 * Recherche de comptes
 * @param {*} req 
 * @param {*} res 
 */
exports.searchRecipes = (req, res) => {
  logging(
    'info',
    base,
    null,
    `Starting search recipes with ${JSON.stringify(req.query)}`
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

  findRecipes(req, res, param);
};

/**
 * Modification d'un compte
 * @param {*} req 
 * @param {*} res 
 */
exports.updateRecipe = async (req, res) => {
  if (!req.params || !req.body || !req.params.id) {
    logging('error', base, null, 'Bad request on update recipe');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging(
    'info',
    base,
    null,
    'Starting updating recipe',
    JSON.stringify(req.params.id)
  );

  // statut de la mise à jour
  const updateStatus = {
    save: false,
    recipe: null,
  };

  // paramétrage de la requête mongo pour la mise àjour
  const paramUpdate = {
    query: { _id: req.params.id },
    fields: null,
  };

  // objet contant les champs à modifier
  const updateRecipe = {
    modificationDate: new Date(),
  };

  // Alimentation du compte de modification avec les champs à modifier
  await (() => {
    return new Promise((resolve, reject) => {
      try {
        for (let [key, value] of Object.entries(req.body)) {
          updateRecipe[key] = value;
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  })()
    .then(() => {
      paramUpdate.fields = updateRecipe;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `consitution of updateRecipe went awry :(`,
        JSON.stringify(error)
      );
    });


  // Enregistrement modification du compte
  await recipesData
    .update(paramUpdate)
    .then((recipe) => {
      if (recipe) {
        logging(
          'info',
          base,
          null,
          `Recipe with id ${req.body.id} updated !`
        );
        updateStatus.save = true;
        updateStatus.recipe = recipe;
      } else {
        updateStatus.save = false;
        logging(
          'info',
          base,
          null,
          `Recipe with id ${req.body.id} not found !`
        );
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `updating recipe with id ${req.body.id} failed ! ${error}`
      );
      updateStatus.save = false;
      throw error;
    });

 // Retour client
  logging(
    'info',
    base,
    null,
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
exports.addRecipe = async (req, res) => {
  let addStatus = false;

  logging('info', base, null, 'Starting adding new recipe...');

// Ajout et enregistrement nouveau compte
  await recipesData
    .addOne(req.body.recipe)
    .then(() => {
      logging('info', base, null, 'Adding recipe is successful !');
      addStatus = true;
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `Adding recipe has failed ! ${error}`
      );
    });

   // Retour du résultat au client  
  logging(
    'info',
    base,
    null,
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
exports.deleteRecipe = (req, res) => {
  logging(
    'info',
    base,
    null,
    `Starting deleting recipe with ${JSON.stringify(req.params.id)}`
  );
  recipesData
    .delete(req.params.id)
    .then((recipe) => {
      logging(
        'info',
        base,
        null,
        `${JSON.stringify(recipe)} deleted!`
      );
      res.status(httpStatusCodes.OK).json(recipe);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        null,
        `deleting ${req.params.id} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};
