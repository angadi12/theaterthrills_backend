const express = require('express');
const { body, param } = require('express-validator');
const {
  Createcoupon,
  GetCouponById,
  GetAllCoupons,
  UpdateCoupon,
  DeleteCoupon,
  ApplyCoupon,
  ValidateCoupon
} = require('../Controller/Coupon');

const Couponrouter = express.Router();

// Validators
const couponValidationRules = [
  body('code').isString().withMessage('Coupon code must be a string').notEmpty().withMessage('Coupon code is required'),
  body('discountValue')
    .isNumeric()
    .withMessage('Discount value must be a number')
    .notEmpty()
    .withMessage('Discount value is required'),
  body('discountType')
    .isIn(['flat', 'percentage'])
    .withMessage('Discount type must be either "flat" or "percentage"'),
  body('minOrderValue')
    .optional()
    .isNumeric()
    .withMessage('Minimum order value must be a number'),
  body('expiryDate')
    .isISO8601()
    .toDate()
    .withMessage('Expiry date must be a valid date in ISO8601 format'),
  body('maxUses')
    .isInt({ min: 1 })
    .withMessage('Maximum uses must be an integer greater than 0'),
  body('applicableItems')
    .optional()
    .isArray()
    .withMessage('Applicable items must be an array of item IDs')
];

// Create Coupon
Couponrouter.post(
  '/Createcoupon',
  couponValidationRules,
  Createcoupon
);

// Get Coupon by ID
Couponrouter.get(
  '/Getcouponbyid/:id',
  param('id').isMongoId().withMessage('Invalid coupon ID'),
  GetCouponById
);

// Get All Coupons
Couponrouter.get(
  '/Getallcoupon',
  GetAllCoupons
);

// Update Coupon by ID
Couponrouter.put(
  'Updatecoupon/:id',
  [
    param('id').isMongoId().withMessage('Invalid coupon ID'),
    ...couponValidationRules
  ],
  UpdateCoupon
);

// Delete Coupon by ID
Couponrouter.delete(
  'Deletecoupon/:id',
  param('id').isMongoId().withMessage('Invalid coupon ID'),
  DeleteCoupon
);

// Apply Coupon
Couponrouter.post(
  '/apply',
  [
    body('code').isString().withMessage('Coupon code must be a string').notEmpty().withMessage('Coupon code is required'),
    body('orderValue')
      .isNumeric()
      .withMessage('Order value must be a number')
      .notEmpty()
      .withMessage('Order value is required')
  ],
  ApplyCoupon
);

// Validate Coupon by Code
Couponrouter.get(
  '/validate/:code',
  param('code').isString().withMessage('Invalid coupon code format'),
  ValidateCoupon
);

module.exports = { Couponrouter };
