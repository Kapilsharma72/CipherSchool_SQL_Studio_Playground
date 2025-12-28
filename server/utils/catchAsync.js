
const catchAsync = (fn) => {
  return (req, res, next) => {
        if (typeof next !== 'function') {
      console.error('catchAsync: next is not a function', { req: !!req, res: !!res, next: typeof next });
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error: middleware chain broken'
      });
    }
    
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (typeof next === 'function') {
        next(err);
      } else {
        console.error('catchAsync: next is not a function when handling error', err);
        if (res && !res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: err.message || 'Internal server error'
          });
        }
      }
    });
  };
};

module.exports = catchAsync;
