const Recipe = require("../models/Recipe")
const ErrorResponse = require("../utils/errorResponse")
const {
    logging
} = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const {
    base
} = require('path').parse(__filename);

const httpStatusCodes = require('../constants/httpStatusCodes.json');
const toTitleCase = require('../utils/titleCase');

const frontUrl = process.env.NODE_ENV === 'production' ? process.env.FRONT_URL : process.env.FRONT_URL_DEV

exports.addRecipe = async (req, res, next) => {
    const {
            title,
            category,
            realisation,
            nbOfPeople,
            ingredients,
            instructions,
            toBeCompleted,
            privacyLevel,
    } = req.body.recipe
    const {accountId} = req.body

    let photoUrl = null
    if (photo) {
        ({photoUrl} = photo.content)
    }
    
    logging('info', base, null, `Start adding recip`);
    try {
        const recipe = await Recipe.create({
            accountId,
            title,
            realisation,
            category,
            ingredients,
            instructions,
            nbOfPeople,
            privacyLevel,
            toBeCompleted
        })
        logging('info', base, null, `Recipe ${title} is registered`);

        res.status(httpStatusCodes.OK).json({
            data: "Recipe created"
        })
    } catch (error) {
        logging('error', base, null, JSON.stringify(error));
        next(error)
    }
}

exports.getAccountRecipes = async (req, res, next) => {

    const accountId = req.params.id
    logging('info', base, null, `Starting getting recipe for account id`, accountId)
    if (!accountId) {
        return next(new ErrorResponse("Mauvaise requête: accountId manquant", httpStatusCodes.BAD_REQUEST))
    }

    try {
        const recipes = await Recipe.find({ accountId })
        console.log(recipes)
    } catch (error) {
        return next(new ErrorResponse(error.message, httpStatusCodes.INTERNAL_SERVER_ERROR))
    }
    res.status(httpStatusCodes.OK).json({
        data: recipes
    })

}