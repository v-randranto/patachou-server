'use strict';
const mongoose = require('mongoose');
const Recipe = require('../models/recipe');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

exports.find = (param) => {
  logging('info', base, null, 'Starting finding recipes...', JSON.stringify(param.query));
  return new Promise((resolve, reject) => {
    Recipe.find(param.query, param.fields).sort({title: 1})
    .then((recipes) => {
      if (recipes.length) {        
        logging('info', base, null, `Finding recipes successful !`);
        // TODO formatter les recipes avant de les retourner
        resolve(recipes);
      } else {
        logging('info', base, null, 'No recipe found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, null, 'Finding recipes failed !');
      reject(error);
    });
  });
  
};

exports.findOne = (param) => {
  logging('info', base, null, 'Starting finding recipe...', JSON.stringify(param.query));
  return new Promise((resolve, reject) => {
    Recipe.findOne(param.query, param.fields)
    .then((recipe) => {
      if (recipe) {        
        logging('info', base, null, `Finding one recipe successful ! ${recipe.title} ${recipe._id}`);
        // TODO formatter les recipes avant de les retourner
        resolve(recipe);
      } else {
        logging('info', base, null, 'No recipe found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, null, 'Finding recipes failed !');
      reject(error);
    });
  });
  
};

exports.addOne = (recipe) => {
  
  logging('info', base, null, 'Starting adding recipe...');
  
  return new Promise((resolve, reject) => {
    const newRecipe = new Recipe(recipe);
    newRecipe
    .save()
    .then(() => {
      logging('info', base, null, 'saving recipe successful !');
      resolve(true) ;   
    })
    .catch((error) => {
      logging('error', base, null, 'saving recipe failed !');
      reject(error);
    });  
  });
   
};

exports.update = (param) => {

  logging('info', base, null, 'Starting updating recipe...', JSON.stringify(param)
  );

  return new Promise((resolve, reject) => {
    Recipe.findOneAndUpdate(param.query, param.fields, {new: true})
    .then((recipe) => {
      logging('info', base, null, 'Updating recipe successful !');
      resolve(recipe);
    })
    .catch((error) => {
      logging('error', base, null, 'Updating recipe failed !');
      reject(error);
    });
  });  
};

exports.delete = (id) => {
  logging('info', base, null, 'Starting deleting recipe...', JSON.stringify(id));
    return new Promise((resolve, reject) => {
      Recipe.findOneAndDelete({ _id: mongoose.mongo.ObjectId(id) })
    .then((recipe) => {
      logging('info', base, null, 'Deleting recipe successfull !');
      resolve(recipe);
    })
    .catch((error) => {
      logging('error', base, null, 'Deleting recipe failed !');
      reject(error);
    });
    })
  
};