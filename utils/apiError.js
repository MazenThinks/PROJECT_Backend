//@desc   this class is responsible about operation errors (erros that i can predict)
class ApiError extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
        this.isOerational = true;
    }
}

module.exports = ApiError;