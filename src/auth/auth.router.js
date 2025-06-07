const { Router } = require('express');
const { login, logout, verify } = require('./auth.controller');
const { loginValidation } = require('./auth.validation');
const authenticateAdmin = require('../middlewares/auth.middleware');
const handleValidationErrors = require('../middlewares/handleValidationErrors');
const { loginRateLimiter } = require('../middlewares/rateLimiter');
const { applyMiddlewares } = require('../shared/utils');

const router = Router();

router.post(
  '/login',
  applyMiddlewares(loginRateLimiter, loginValidation, handleValidationErrors),
  login
);
router.post('/logout', logout);
router.get('/verify', authenticateAdmin, verify);

module.exports = router;
