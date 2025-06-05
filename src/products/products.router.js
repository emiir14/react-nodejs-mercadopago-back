const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('./products.controller');
const {
  createProductValidation,
  updateProductValidation,
  idParamValidation,
} = require('./products.validation');
const authenticateAdmin = require('../middlewares/auth.middleware');
const handleValidationErrors = require('../middlewares/handleValidationErrors');

const router = Router();
const applyMiddlewares = (...middlewares) => middlewares;

router.get('/', getAll);
router.get('/:id', getById);

router.post(
  '/',
  applyMiddlewares(authenticateAdmin, createProductValidation, handleValidationErrors),
  create
);

router.patch(
  '/:id',
  applyMiddlewares(authenticateAdmin, updateProductValidation, handleValidationErrors),
  update
);

router.delete(
  '/:id',
  applyMiddlewares(authenticateAdmin, idParamValidation, handleValidationErrors),
  remove
);

module.exports = router;
