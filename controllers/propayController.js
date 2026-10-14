const Product = require('../models/productModel');
const verifyPaymentPin = require('../utils/verifyPaymentPin');
const { transferFunds } = require('../utils/transfer');
const AppError = require('../utils/AppError');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pay the owner of a product from the logged-in user's account
async function payForProduct(req, res) {
  const { uuid } = req.params;
  const { paymentPin } = req.body ?? {};
  const senderId = req.user.userId;

  const product = UUID_PATTERN.test(uuid) ? await Product.findOne({ where: { uuid } }) : null;
  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  await verifyPaymentPin(senderId, paymentPin);
  const result = await transferFunds({
    senderId,
    receiverId: product.userId,
    amount: Number(product.price),
  });

  res.status(200).json({ message: 'Payment successful', ...result });
}

module.exports = { payForProduct };
