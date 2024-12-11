const express = require('express');
const { body, param } = require('express-validator');
const {
  CreateCouponOffer,
  GetCouponById,
  GetAllCoupons,
  UpdateCoupon,
  DeleteCoupon,
  ApplyCoupon,
  GetAllCouponsbyoffer
} = require('../Controller/Coupon'); // Using the same controller for both Coupon and CouponOffer

const CouponRouter = express.Router();

const couponValidationRules = [
  body('code')
    .isString().withMessage('Coupon code must be a string')
    .notEmpty().withMessage('Coupon code is required'),
  body('validFrom')
    .isISO8601().toDate().withMessage('Valid from must be a valid date in ISO8601 format'),
  body('validUntil')
    .isISO8601().toDate().withMessage('Valid until must be a valid date in ISO8601 format'),
  body('usageLimit')
    .isInt({ min: 1 }).withMessage('Usage limit must be an integer greater than 0'),
  body('user')
    .optional().isMongoId().withMessage('User ID must be a valid MongoDB Object ID'),
  body('deviceId')
    .optional().isString().withMessage('Device ID must be a string'),
  body('maxLimit')
    .optional().isInt({ min: 1 }).withMessage('Max limit must be a positive integer'),
];

CouponRouter.post(
  '/CreateCoupon',
  couponValidationRules,
  CreateCouponOffer
);

CouponRouter.get(
  '/GetCouponById/:id',
  param('id').isMongoId().withMessage('Invalid coupon ID'),
  GetCouponById
);

CouponRouter.get(
  '/GetAllCoupons',
  GetAllCoupons
);
CouponRouter.get(
  '/GetAllCouponsbyoffer',
  GetAllCouponsbyoffer
);

CouponRouter.put(
  '/UpdateCoupon/:id',
  [
    param('id').isMongoId().withMessage('Invalid coupon ID'),
    ...couponValidationRules
  ],
  UpdateCoupon
);

CouponRouter.delete(
  '/DeleteCoupon/:id',
  param('id').isMongoId().withMessage('Invalid coupon ID'),
  DeleteCoupon
);

// Apply Coupon or Coupon Offer
CouponRouter.post(
  '/ApplyCoupon',
  [
    body('couponCode').isString().withMessage('Coupon code must be a string').notEmpty().withMessage('Coupon code is required'),
  ],
  ApplyCoupon
);

// Validate Coupon or Coupon Offer by Code
// CouponRouter.get(
//   '/ValidateCoupon/:code',
//   param('code').isString().withMessage('Invalid coupon code format'),
//   ValidateCoupon
// );

module.exports = { CouponRouter };
