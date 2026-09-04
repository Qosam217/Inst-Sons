const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../core/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (helper untuk testing auth middleware)
router.get('/me', authMiddleware, authController.getProfile);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
