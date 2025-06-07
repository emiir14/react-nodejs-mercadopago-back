const { body } = require('express-validator');

exports.idParamValidation = [param('id').toInt().isInt({ gt: 0 })];

exports.createOrderValidation = [
  body('customer_email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),

  body('customer_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Customer name must be between 2 and 255 characters'),

  body('customer_phone')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('Phone number must be valid'),

  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),

  body('items.*.id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ gt: 0 })
    .withMessage('Product ID must be a positive integer'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ gt: 0 })
    .withMessage('Quantity must be a positive integer'),

  body('items.*.price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),

  body('total_amount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Total amount must be a positive number'),
];
