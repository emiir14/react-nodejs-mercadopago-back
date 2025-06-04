const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('./products.controller');
const {
  createProductValidation,
  updateProductValidation,
} = require('./products.validation');
const authenticateAdmin = require('../middlewares/auth.middleware');
const handleValidationErrors = require('../middlewares/handleValidationErrors');

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);

router.post(
  '/',
  authenticateAdmin,
  createProductValidation,
  handleValidationErrors,
  create
);

router.put(
  '/:id',
  authenticateAdmin,
  updateProductValidation,
  handleValidationErrors,
  update
);

router.delete(
  '/:id',
  authenticateAdmin,
  updateProductValidation,
  handleValidationErrors,
  remove
);

module.exports = router;
