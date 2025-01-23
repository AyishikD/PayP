const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { viewUserDetails, forgetPin } = require('../controllers/userController');
const { forgetPassword } = require('../controllers/passwordController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique ID for the user.
 *         name:
 *           type: string
 *           description: User's full name.
 *         email:
 *           type: string
 *           description: User's unique email address.
 *         password:
 *           type: string
 *           description: Hashed password of the user.
 *         balance:
 *           type: float
 *           description: User's account balance, with a minimum value of 0.
 *         failedLoginAttempts:
 *           type: integer
 *           description: Number of consecutive failed login attempts.
 *         isLocked:
 *           type: boolean
 *           description: Indicates if the user's account is locked.
 *         paymentPin:
 *           type: string
 *           description: A 5-character PIN for secure payment transactions.
 *         failedPinAttempts:
 *           type: integer
 *           description: Number of consecutive failed PIN attempts.
 *         lockoutExpiresAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp for when the lockout expires.
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user.
 *               email:
 *                 type: string
 *                 description: Unique email of the user.
 *               password:
 *                 type: string
 *                 description: Password for the user account.
 *               paymentPin:
 *                 type: string
 *                 description: 5-character PIN for secure payments.
 *             required:
 *               - name
 *               - email
 *               - password
 *               - paymentPin
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request, validation errors
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered email address of the user.
 *               password:
 *                 type: string
 *                 description: Password for the user account.
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized, invalid credentials
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/forget-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered email address of the user.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       401:
 *         description: Unauthorized, user not authenticated
 */
router.post('/forget-password', authMiddleware, forgetPassword);

/**
 * @swagger
 * /auth/forget-pin:
 *   post:
 *     summary: Request PIN reset
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered email address of the user.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: PIN reset request successful
 *       401:
 *         description: Unauthorized, user not authenticated
 */
router.post('/forget-pin', authMiddleware, forgetPin);

/**
 * @swagger
 * /auth/details:
 *   get:
 *     summary: View user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized, user not authenticated
 */
router.get('/details', authMiddleware, viewUserDetails);

module.exports = router;