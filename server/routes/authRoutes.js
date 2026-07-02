const express = require('express');
const router = express.Router();
const { generateToken, doubleCsrfProtection } = require('../middleware/csrf');
const authController = require('../controllers/authController');
const { validateAdminLogin } = require('../middleware/validators');

router.post('/login', validateAdminLogin, authController.login);
router.post('/logout', doubleCsrfProtection, authController.logout);
router.get('/csrf-token', (req, res) => {
  res.json({ token: generateToken(req, res) });
});

module.exports = router;
