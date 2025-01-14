const User = require('../models/userModel'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const verifyPaymentPin = require('../utils/verifyPaymentPin'); // Import utility

// User registration
async function registerUser(req, res) {
  try {
    const { name, email, password, paymentPin } = req.body;

    if (!name || !email || !password || !paymentPin) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      paymentPin, // Store payment pin directly (consider hashing for security)
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the account is locked and if the lockout has expired
    const currentTime = new Date();
    if (user.isLocked) {
      if (user.lockoutExpiresAt && currentTime < user.lockoutExpiresAt) {
        // Account is still locked
        const lockoutRemainingTime = user.lockoutExpiresAt - currentTime;
        return res.status(400).json({ message: `Account is locked. Try again after ${Math.ceil(lockoutRemainingTime / 60000)} minutes.` });
      } else {
        // Lockout has expired, reset the lockout
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockoutExpiresAt = null;
        await user.save();
      }
    }

    // Compare the provided password with the stored password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      // Increment the failed login attempts
      user.failedLoginAttempts += 1;
      // Lock the account after 5 failed attempts
      if (user.failedLoginAttempts > 5) {
        // Set the lockout expiration time (e.g., 30 minutes from now)
        const lockoutDuration = 30 * 60 * 1000; // 30 minutes
        user.isLocked = true;
        user.lockoutExpiresAt = new Date(currentTime.getTime() + lockoutDuration);
        await user.save();
        return res.status(400).json({ message: 'Account is locked due to too many failed login attempts. Try again later.' });
      }

      // Save the user with updated failedLoginAttempts
      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset the failed attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    // Proceed with the login process, generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(200).json({ token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerUser,
  loginUser,
};
