const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication views & actions
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.post('/logout', authController.logout);

// 1-Click Demo Evaluation Switcher
router.get('/demo-login/:role', authController.demoLogin);

module.exports = router;
