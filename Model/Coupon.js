const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'], 
    required: true,
  },
  minOrderValue: {
    type: Number,
    default: 0, 
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    default: 1, 
  },
  usageCount: {
    type: Number,
    default: 0, 
  },
  applicableItems: {
    type: [String], 
    default: [], 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Coupon', CouponSchema);
