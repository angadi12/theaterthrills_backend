// models/CouponOffer.js
const mongoose = require("mongoose");

const CouponOfferSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["coupon", "offer"], required: true }, 
    description: { type: String, required: true },
    discount: { 
      amount: { type: Number, required: true },
      type: { type: String, enum: ["percentage", "fixed"], required: true },
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    theater: { type: mongoose.Schema.Types.ObjectId, ref: "Theater" },

    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    usageLimit: { type: Number, default: 20 }, 
    devicesUsed: [{ type: String }], 
    userLimit: { type: Number, default: 1 },  

  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponOffer", CouponOfferSchema);
