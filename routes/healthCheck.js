const express = require('express');
const router = express.Router();
const sequelize = require('../config/db'); // Import the sequelize instance

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get the health status of the application and database connection
 *     description: Returns the status of the application and whether the database is connected.
 *     responses:
 *       200:
 *         description: Application and database are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 database:
 *                   type: string
 *                   example: Connected
 *                 timestamp:
 *                   type: string
 *                   example: "2025-01-19T00:00:00Z"
 *       500:
 *         description: Health check failed due to an error (database connection issue, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: DOWN
 *                 error:
 *                   type: string
 *                   example: Database connection failed
 */

// Health check route
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection(); // Check database connection
    res.status(200).json({
      status: 'UP',
      database: dbStatus ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(), // Return timestamp in ISO format
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
