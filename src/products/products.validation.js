const { body, param } = require('express-validator');

exports.createProductValidation = [
  body('name').isString().notEmpty(),
  body('slug').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('price').isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('categoryId').isInt({ gt: 0 }),
  body('imageUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
];

exports.updateProductValidation = [
  param('id').isInt().toInt(),
  body('name').optional().isString(),
  body('slug').optional().isString(),
  body('description').optional().isString(),
  body('price').optional().isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('categoryId').optional().isInt({ gt: 0 }),
  body('imageUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
];
