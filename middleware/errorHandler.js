// Error handling middleware
function errorHandler(err, req, res, next) {
  // Log the error message to the console
  console.error(`Error occurred: ${err.message}`);

  // Send the response with status code and error message
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
