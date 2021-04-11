'use strict';

const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  title: { type: String, required: true, lowercase: true, trim: true },
  category: { type: String},
  realisation: {
    difficulty: { type: Number },
    preparationTime: { type: Number },
    bakingTime: { type: Number},
  },
  nbOfPeople: { type: Number, default: 0 },
  ingredients: [String],
  instructions: [String],
  toBeCompleted: { type: Boolean, default: true },
  privacyLevel: { type: Number, default: 3},
  creationDate: { type: Date, default: Date.now },
  modificationDate: { type: Date, default: Date.now },
});

RecipeSchema.methods.checkIsComplete = async function () {
  const missingItems = []
  if (!this.category) {
    missingItems.push('category')
  }
  if (!this.realisation) {
    missingItems.push('realisation')
  }
  if (this.nbOfPeople === 0) {
    missingItems.push('nbOfPeople')
  }
  if (this.ingredients.length === 0) {
    missingItems.push('ingredients')
  }
  if (this.instructions.length === 0) {
    missingItems.push('instructions')
  }

  return missingItems;
};

const Recipe = mongoose.model('Recipe', RecipeSchema);
module.exports = Recipe;
