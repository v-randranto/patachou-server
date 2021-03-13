exports.register = (req, res, next) => {
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