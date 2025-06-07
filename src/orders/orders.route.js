const { Router } = require('express');
const { create, getAll, getById } = require('./orders.controller');
const { createOrderValidation, idParamValidation } = require('./orders.validations');
const { applyMiddlewares } = require('../shared/utils');
const authenticateAdmin = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', applyMiddlewares(createOrderValidation, handleValidationErrors), create);

router.get('/', applyMiddlewares(authenticateAdmin, handleValidationErrors), getAll);
router.get(
  '/:id',
  applyMiddlewares(authenticateAdmin, idParamValidation, handleValidationErrors),
  getById
);

module.exports = router;
