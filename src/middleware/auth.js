const jwt = require('jsonwebtoken');
const { accountInfo } = require('os');
const Account = require("../models/Account")
const ErrorResponse = require("../utils/errorResponse")
const { logging } = require('../utils/loggingHandler')
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
        return next(new ErrorResponse("Accès non autorisé", httpStatusCodes.UNAUTHORIZED))
    }

    try {  
        const decoded = jwt.verify(token, process.env.TOKEN_KEY)
        const account = await Account.findById(decoded.id)
        if (!account) {
            return next(new ErrorResponse("Utilisateur non trouvé", httpStatusCodes.NOT_FOUND))
        }
        req.account = account
        next()
    } catch (error) {
        return next(new ErrorResponse("Accès non autorisé", httpStatusCodes.UNAUTHORIZED))
    }
}