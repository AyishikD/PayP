const express = require('express');
const router = express.Router();
const sequelize = require('../config/db'); // Import the sequelize instance

router.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection(); // Check database connection
    res.status(200).json({
      status: 'UP',
      database: dbStatus ? 'Connected' : 'Disconnected',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({
      status: 'DOWN',
      error: error.message,
    });
  }
});

// Function to check database connection
async function checkDatabaseConnection() {
  try {
    await sequelize.authenticate(); // Test database connection
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = router;
