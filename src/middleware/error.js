const ErrorResponse = require('../utils/errorResponse');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');

const errorHandler = (err, req, res, next) => {
    let error = {
        ...err
    };
    
    error.message = err.message; // why this?

    if (err.code === 11000) {
        error = new ErrorResponse("Déjà utilisé", httpStatusCodes.BAD_REQUEST)
    }

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, httpStatusCodes.BAD_REQUEST)
    }
    logging('error', base, null, JSON.stringify(error));
    res.status(error.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || "Erreur serveur"
    })
};

module.exports = errorHandler;