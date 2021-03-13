const User = require("../models/User")

exports.register = async (req, res, next) => {
    const {pseudo, email, password} = req.body.registerData
    try {
        const user = await User.create({
            pseudo, email, password
        })
        res.status('201').json({
            success: true,
            user
        })
    } catch (error) {
        res.status('500').json({
            success:false,
            error: error.message
        })
    }

    res.send("register")
}

exports.login = (req, res, next) => {
    res.send("login")
}

exports.forgotPassword = (req, res, next) => {
    res.send("forgot password")
}

exports.resetPassword = (req, res, next) => {
    res.send("reset password")
}