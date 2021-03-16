const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    const error = {
        ...err
    };
    
    error.message = err.message; // why this?

    if (err.code === 11000) {
        error = new ErrorResponse("Duplicate field value", 400)
    }

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }
 
    res.status(error.statusCode || 500).json({
        success:false,
        error: error.message || "Server error"
    })
};

module.exports = errorHandler;