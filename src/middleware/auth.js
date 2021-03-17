const jwt = require('jsonwebtoken');
const { userInfo } = require('os');
const User = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const { logging } = require('../utils/loggingHandler')
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startwith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
        return next(new ErrorResponse("Unauthorized access", 401))
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY)
        const user = await User.findById(decoded.id)
        if (!user) {
            return next(new ErrorResponse("User not found with token", 404))
        }
        req.user = user
    } catch (error) {
        return next(new ErrorResponse("Unauthorized access", 401))
    }
}