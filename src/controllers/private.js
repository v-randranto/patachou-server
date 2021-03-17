const httpStatusCodes = require('../constants/httpStatusCodes.json');

exports.getPrivateData = (req, res, next) => {
    res.status(httpStatusCodes.OK).json({
        success: true,
        data: "Here's your private data"
    })
}