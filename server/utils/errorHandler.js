class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendErrorDev = (err, req, res) => {
    console.error('Error:', err);
  
    if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
  
    res.status(err.statusCode || 500).send({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

const sendErrorProd = (err, req, res) => {
    console.error('Error:', err);
  
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
      return res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message
      });
    }
    
        return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
  
    if (err.isOperational) {
    return res.status(err.statusCode || 500).send({
      message: err.message
    });
  }
  
    res.status(500).send({
    message: 'Something went wrong!'
  });
};

module.exports = (err, req, res, next) => {
    if (!err) {
    err = new Error('Unknown error occurred');
  }
  
    if (!err.statusCode) {
    err.statusCode = 500;
  }
  
    if (!req || !res) {
    console.error('Error handler called without req or res');
    return;
  }
  
    if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
        let error = { ...err };
    error.message = err.message;
    
        if (err.name === 'CastError') {
      const message = `Invalid ${err.path}: ${err.value}`;
      error = new AppError(message, 400);
    }
    
    if (err.code === 11000) {
      const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      const message = `Duplicate field value: ${value}. Please use another value!`;
      error = new AppError(message, 400);
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      error = new AppError(message, 400);
    }
    
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token. Please log in again!', 401);
    }
    
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Your token has expired! Please log in again.', 401);
    }
    
    sendErrorProd(error, req, res);
  }
};
