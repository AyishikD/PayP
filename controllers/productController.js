const Product = require('../models/productModel');
const AppError = require('../utils/AppError');
const { parseAmount, parseId } = require('../utils/validation');

function toResponse(product) {
  return {
    id: product.id,
    userId: product.userId,
    price: product.price,
    uuid: product.uuid,
  };
}

// Add a product, or update the price of one of the logged-in user's products when `id` is given
async function addProduct(req, res) {
  const { id, price } = req.body ?? {};
  const userId = req.user.userId;
  const parsedPrice = parseAmount(price, 'price');

  if (id === undefined) {
    const product = await Product.create({ userId, price: parsedPrice });
    return res.status(201).json({ message: 'Product added successfully.', product: toResponse(product) });
  }

  const productId = parseId(id, 'id');
  const existingProduct = await Product.findByPk(productId);

  if (existingProduct && existingProduct.userId !== userId) {
    throw new AppError(409, 'Product ID is already in use.');
  }

  if (existingProduct) {
    existingProduct.price = parsedPrice;
    await existingProduct.save();
    return res.status(200).json({ message: 'Product price updated successfully.', product: toResponse(existingProduct) });
  }

  try {
    const product = await Product.create({ id: productId, userId, price: parsedPrice });
    return res.status(201).json({ message: 'Product added successfully.', product: toResponse(product) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(409, 'Product ID is already in use.');
    }
    throw error;
  }
}

module.exports = { addProduct };
