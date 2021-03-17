const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const {
    logging
} = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const {
    base
} = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const emailContent = require('../constants/email.json')
const toTitleCase = require('../utils/titleCase');

const frontUrl = process.env.NODE_ENV === 'production' ? process.env.FRONT_URL_PROD : process.env.FRONT_URL_DEV

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
        const options = {
            from: process.env.EMAIL_PATACHOU,
            to: user.email,
            subject: emailContent.REGISTER.subject
        };
        const variables = {
            pseudo: toTitleCase(user.pseudo)
        }
        let emailIsSent = true
        try {
            emailIsSent = await user.sendRegisterEmail(options, variables)
        } catch (error) {
            emailIsSent = false
        }

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

exports.forgotPassword = async (req, res, next) => {
    logging('info', base, null, 'Starting forgotten password...', JSON.stringify(req.body));
    const { email } = req.body
    if (!email) {
        return next(new ErrorResponse("Mauvaise requête: email manquant",
            httpStatusCodes.BAD_REQUEST))
    }
    try {
        console.log("try pour findOne")
        const user = await User.findOne({email}).select("+password")
        console.log("user", user)
        if (!user) {
            return next(new ErrorResponse("Email non envoyé", httpStatusCodes.NOT_FOUND))
        }

        const resetToken = user.getResetPasswordToken()        
        
        await user.save()
        const resetUrl = `${frontUrl}/reset-password/${resetToken}`

        const options = {
            from: process.env.EMAIL_PATACHOU,
            to: user.email,
            subject: emailContent.PASSWORD.subject
        };
        const variables = {
            pseudo: toTitleCase(user.pseudo),
            resetUrl
        }

        try {
            await user.sendResetPasswordEmail(options, variables)
            res.status(httpStatusCodes.OK).json({
                success: true,
                data: "Email sent"
            })
        } catch (error) {
            user.resetPasswordExpire = undefined
            user.resetPasswordToken = undefined
            user.save()
            return next(new ErrorResponse("L'email n'a pu être envoyé", httpStatusCodes.INTERNAL_SERVER_ERROR))
        }

    } catch (error) {
        next(error)
    }
}

exports.resetPassword = (req, res, next) => {
    logging('info', base, null, 'Starting resetting password...');

}

const sendToken = (user, statusCode, res, emailIsSent) => {
    const token = user.getSignedToken()
    res.status(statusCode).json({
        success: true,
        token,
        user,
        emailIsSent,
    })
}