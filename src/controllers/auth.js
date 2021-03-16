const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")

exports.register = async (req, res, next) => {
    const {
        pseudo,
        email,
        password
    } = req.body.registerData
    try {
        const user = await User.create({
            pseudo,
            email,
            password
        })
        sendToken(user, 200, res)
    } catch (error) {
        next(error)
    }
}

exports.login = async (req, res, next) => {
    const {
        email,
        password
    } = req.body.loginData
    if (!email || !password) {
        return next(new ErrorResponse("Bad request: email or password missing", 400))    
    }

    try {
        const user = await User.findOne({
            email
        }).select("+password")
        if (!user) {
            return next(new ErrorResponse("Invalid credentials", 404))
        }

        const isMatched = await user.checkPassword(password)
        if (!isMatched) {
            return next(new ErrorResponse("Invalid credentials", 404))
        }
        console.log('gonna send token...')
        sendToken(user, 200, res)

    } catch (error) {
        return next(new ErrorResponse(error.message, 500))
    }
}

exports.forgotPassword = (req, res, next) => {
    res.send("forgot password")
}

exports.resetPassword = (req, res, next) => {
    res.send("reset password")
}

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken()
    res.status(statusCode).json({
        success: true,
        token
    })
}