let paymentCounter = 0; // Counter to track payment attempts

const processProjectPayment = async (req, res, next) => {
  try {
    // Increment the payment counter
    paymentCounter++;

    // Mock a failure for every 5th payment
    if (paymentCounter % 5 === 0) {
      return res.status(400).json({
        message: 'Payment failed due to wrong credentials or network lag.',
        status: 'failed',
        transactionId: `TXN${Date.now()}`, // Generate a mock transaction ID
      });
    }

    // Process payment (mock successful payment logic)
    const transactionId = `TXN${Date.now()}`; // Generate a unique transaction ID
    return res.status(200).json({
      message: 'Payment successful!',
      status: 'success',
      transactionId,
    });
  } catch (error) {
    console.error('Error processing payment:', error);

    // Use the next middleware to handle errors in Express v5
    next(error);
  }
};

module.exports = { processProjectPayment };
