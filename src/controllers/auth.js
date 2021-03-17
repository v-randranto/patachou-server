const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');

exports.register = async (req, res, next) => {    
    const {
        pseudo,
        email,
        password,
        photo,
        presentation
    } = req.body.registerData
    logging('info', base, null, `Start registering user ${pseudo} ${email}`);
    try {
        const user = await User.create({
            pseudo,
            email,
            password,
            photo,
            presentation
        })
        logging('info', base, null, `User ${user.pseudo} is registered`);
        const emailIsSent = await user.sendEmail()
        sendToken(user, httpStatusCodes.OK, res, emailIsSent)
    } catch (error) {
        logging('error', base, null, JSON.stringify(error));
        next(error)
    }
}

exports.login = async (req, res, next) => {
    
    const {
        pseudo,
        password
    } = req.body.loginData
    logging('info', base, null, `Starting login user ${pseudo}`)
    if (!pseudo || !password) {
        return next(new ErrorResponse("Mauvaise requête: email or password manquant", httpStatusCodes.BAD_REQUEST))    
    }

    try {
        const user = await User.findOne({
            pseudo
        }).select("+password")
        if (!user) {
            return next(new ErrorResponse("Identifiants incorrects", httpStatusCodes.UNAUTHORIZED))
        }

        const isMatched = await user.checkPassword(password)
        if (!isMatched) {
            return next(new ErrorResponse("Identifiants incorrects", httpStatusCodes.UNAUTHORIZED))
        }
        logging('info', base, null, `User ${user.pseudo} is logged in`);
        sendToken(user, httpStatusCodes.OK, res)

    } catch (error) {
        return next(new ErrorResponse(error.message, httpStatusCodes.INTERNAL_SERVER_ERROR))
    }
}

exports.forgotPassword = (req, res, next) => {
    logging('info', base, null, 'Starting forgotten password...');
    res.send("forgot password")
}

exports.resetPassword = (req, res, next) => {
    logging('info', base, null, 'Starting resetting password...');
    res.send("reset password")
}

const sendToken = (user, statusCode, res, emailIsSent) => {
    const token = user.getSignedToken()
    console.log('email', emailIsSent)
    res.status(statusCode).json({
        success: true,
        token,
        emailIsSent
    })
}