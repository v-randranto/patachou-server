const Account = require("../models/Account")
const ErrorResponse = require("../utils/errorResponse")
const {
    logging
} = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const {
    base
} = require('path').parse(__filename);
const crypto = require('crypto')
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
    } = req.body.account

    let photoUrl = null
    if (photo) {
        ({photoUrl} = photo.content)
    }
    
    logging('info', base, null, `Start registering account ${pseudo} ${email}`);
    try {
        const account = await Account.create({
            pseudo,
            email,
            password,
            photoUrl,
            presentation
        })
        logging('info', base, null, `Account ${account.pseudo} is registered`);
        const options = {
            from: process.env.EMAIL_PATACHOU,
            to: account.email,
            subject: emailContent.REGISTER.subject
        };
        const variables = {
            pseudo: toTitleCase(account.pseudo)
        }
        let emailIsSent = true
        try {
            emailIsSent = await account.sendRegisterEmail(options, variables)
        } catch (error) {
            emailIsSent = false
        }

        sendToken(account, httpStatusCodes.OK, res, emailIsSent)
    } catch (error) {
        logging('error', base, null, JSON.stringify(error));
        next(error)
    }
}

exports.login = async (req, res, next) => {

    const {
        pseudo,
        password
    } = req.body.identification
    logging('info', base, null, `Starting login account ${pseudo}`)
    if (!pseudo || !password) {
        return next(new ErrorResponse("Mauvaise requête: email or password manquant", httpStatusCodes.BAD_REQUEST))
    }

    try {
        const account = await Account.findOne({
            pseudo
        }).select("+password")
        if (!account) {
            return next(new ErrorResponse("Identifiants incorrects", httpStatusCodes.UNAUTHORIZED))
        }

        const isMatched = await account.checkPassword(password)
        if (!isMatched) {
            return next(new ErrorResponse("Identifiants incorrects", httpStatusCodes.UNAUTHORIZED))
        }
        logging('info', base, null, `Account ${account.pseudo} is logged in`);
        sendToken(account, httpStatusCodes.OK, res)

    } catch (error) {
        return next(new ErrorResponse(error.message, httpStatusCodes.INTERNAL_SERVER_ERROR))
    }
}

exports.lostPassword = async (req, res, next) => {
    logging('info', base, null, 'Starting lost password...', JSON.stringify(req.body));
    const { email } = req.body
    if (!email) {
        return next(new ErrorResponse("Mauvaise requête: email manquant",
            httpStatusCodes.BAD_REQUEST))
    }
    try {
        const account = await Account.findOne({email}).select("+password")
        if (!account) {
            return next(new ErrorResponse("Email non trouvé", httpStatusCodes.NOT_FOUND))
        }

        const resetToken = account.getResetPasswordToken()        
        await account.save()
        const resetUrl = `${frontUrl}reset-password/${resetToken}`

        const options = {
            from: process.env.EMAIL_PATACHOU,
            to: account.email,
            subject: emailContent.PASSWORD.subject
        };
        const variables = {
            pseudo: toTitleCase(account.pseudo),
            resetUrl
        }

        try {
            await account.sendResetPasswordEmail(options, variables)
            res.status(httpStatusCodes.OK).json({
                data: "Email sent"
            })
        } catch (error) {
            account.resetPasswordExpire = undefined
            account.resetPasswordToken = undefined
            await account.save()
            return next(new ErrorResponse("L'email n'a pu être envoyé", httpStatusCodes.INTERNAL_SERVER_ERROR))
        }

    } catch (error) {
        next(error)
    }
}

exports.resetPassword = async (req, res, next) => {
    logging('info', base, null, 'Starting resetting password...');

    const { password } = req.body
    const {resetToken} = req.params
    if (!password || !resetToken) {
        return next(new ErrorResponse("Mauvaise requête: mot de passe ou token réinit manquant",
            httpStatusCodes.BAD_REQUEST))
    }

    const cryptedResetToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex")

    try {
        const account = await Account.findOne({
            resetPasswordToken: cryptedResetToken,
            resetPasswordExpire: {$gt: Date.now()}
        })

        if (!account) {
            console.log("compte non trouvé!")
            return next( new ErrorResponse("Mauvaise requête: token réinit invalide", httpStatusCodes.BAD_REQUEST))
        }

        account.password = password
        account.resetPasswordToken = undefined
        account.resetPasswordExpire = undefined
        await account.save()
        res.status(httpStatusCodes.OK).json({
            data: "Password reset" 
        })
    } catch (error) {
        next(error)
    }

}

const sendToken = (account, statusCode, res, emailIsSent) => {
    const token = account.getSignedToken()
    res.status(statusCode).json({
        token,
        account,
        emailIsSent,
    })
}