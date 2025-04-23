const ApiError = require('../utils/apiError');

const handleJsonInvalidSignature = () =>
    new ApiError('Invalid token, please login again..', 401);

const handleJwtExpired = () =>
    new ApiError('Expired token, please login again..', 401);

const golbaleError =(err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV == 'development') {
        sendErrorForDev(err, res);
    } else {
        if (err.name === 'JsonWebTokenError') err= handleJsonInvalidSignature();
        if (err.name === 'TokenExpiredError') err= handleJwtExpired();
        sendErrorForProd(err, res);
    }
};

const sendErrorForDev =(err, res) => res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack, 
    });

const sendErrorForProd =(err, res) => res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
module.exports = golbaleError;