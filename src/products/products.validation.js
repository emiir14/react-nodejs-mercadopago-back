const { body, param } = require('express-validator');

exports.idParamValidation = [param('id').toInt().isInt({ gt: 0 })];

exports.createProductValidation = [
  body('name').isString().trim().notEmpty(),
  body('slug').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('price').toFloat().isFloat({ gt: 0 }),
  body('stock').optional().toInt().isInt({ min: 0 }),
  body('categoryId').toInt().isInt({ gt: 0 }),
  body('imageUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
];

exports.updateProductValidation = [
  param('id').isInt().toInt(),
  body('name').optional().isString().trim().notEmpty(),
  body('slug').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim().notEmpty(),
  body('price').optional().toFloat().isFloat({ gt: 0 }),
  body('stock').optional().toInt().isInt({ min: 0 }),
  body('categoryId').optional().toInt().isInt({ gt: 0 }),
  body('imageUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
];
