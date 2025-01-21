let paymentCounter = 0; // Counter to track payment attempts

const processProjectPayment = async (req, res) => {
  try {
    // Increment the counter
    paymentCounter++;

    // Fail every 5th payment
    if (paymentCounter % 5 === 0) {
      return res.status(400).json({
        message: 'Payment failed due to wrong credentials/network lag.',
        status: 'failed',
        transactionId: `TXN${Date.now()}`, // Mock transaction ID
      });
    }

    // Otherwise, the payment is successful
    return res.status(200).json({
      message: 'Payment successful!',
      status: 'success',
      transactionId: `TXN${Date.now()}`, // Mock transaction ID
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      message: 'Internal server error. Please try again later.',
    });
  }
};

module.exports = { processProjectPayment };
