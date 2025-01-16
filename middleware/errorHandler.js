function errorHandler(err, req, res, next) {
    console.error(`Error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  
module.exports = errorHandler;
  