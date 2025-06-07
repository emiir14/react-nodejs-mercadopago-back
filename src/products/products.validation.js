const { body, param } = require('express-validator');

exports.idParamValidation = [
  param('id')
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('Product ID must be a positive integer'),
];

exports.createProductValidation = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('slug')
    .isString()
    .withMessage('Slug must be a string')
    .trim()
    .notEmpty()
    .withMessage('Slug is required'),

  body('description')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  body('price')
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Stock must be 0 or more'),

  body('categoryId')
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('Category ID must be a positive integer'),

  body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),

  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

exports.updateProductValidation = [
  param('id')
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('Product ID must be a positive integer'),

  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),

  body('slug')
    .optional()
    .isString()
    .withMessage('Slug must be a string')
    .trim()
    .notEmpty()
    .withMessage('Slug cannot be empty'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),

  body('price')
    .optional()
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Stock must be 0 or more'),

  body('categoryId')
    .optional()
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('Category ID must be a positive integer'),

  body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),

  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];
