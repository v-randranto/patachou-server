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

exports.login = async (req, res, next) => {
    const {email, password} = req.body.loginData
    if (!email || !password) {
        res.status('400').json({
            success:false,
            error: "Bad request: email or password missing"
        })
    }

    try {
        const user = await User.findOne({email}).select("+password")
        if (!user) {
            res.status('404').json({
                success:false,
                error: "Invalid credentials"
            })
        }
        
        const isMatched = await user.checkPassword(password)
        if (!isMatched) {
            res.status('404').json({
                success:false,
                error: "Invalid credentials"
            })
        }

        res.status('200').json({
            success: true,
            token: "myToken"
        })
    } catch (error) {
        res.status('500').json({
            success:false,
            error: error.message
        })
    }

    res.send("login")
}

exports.forgotPassword = (req, res, next) => {
    res.send("forgot password")
}

exports.resetPassword = (req, res, next) => {
    res.send("reset password")
}