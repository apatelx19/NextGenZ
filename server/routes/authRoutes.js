const express = require('express');
const router = express.Router();
const { generateToken, doubleCsrfProtection } = require('../middleware/csrf');
const authController = require('../controllers/authController');
const { validateAdminLogin } = require('../middleware/validators');
const auth = require('../middleware/auth');

router.post('/login', validateAdminLogin, authController.login);
router.post('/verify-2fa-login', authController.verify2FALogin);
router.post('/logout', doubleCsrfProtection, authController.logout);

// Protected 2FA endpoints
router.get('/2fa/status', auth, authController.get2FAStatus);
router.post('/2fa/setup', auth, doubleCsrfProtection, authController.setup2FA);
router.post('/2fa/verify-and-enable', auth, doubleCsrfProtection, authController.verifyAndEnable2FA);
router.post('/2fa/disable', auth, doubleCsrfProtection, authController.disable2FA);

router.get('/csrf-token', (req, res) => {
  res.json({ token: generateToken(req, res) });
});

module.exports = router;
