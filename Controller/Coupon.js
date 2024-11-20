const { validationResult } = require('express-validator');
const Coupon = require('../Model/Coupon'); // Assuming a Mongoose model
const AppErr = require('../utils/AppErr'); // Custom error handling utility

// Create a new coupon
const Createcoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      code,
      discountValue,
      discountType,
      minOrderValue,
      expiryDate,
      maxUses,
      applicableItems,
    } = req.body;

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({
        status: false,
        message: "Coupon code already exists",
      });
    }

    const newCoupon = await Coupon.create({
      code,
      discountValue,
      discountType,
      minOrderValue,
      expiryDate,
      maxUses,
      applicableItems,
    });

    res.status(201).json({
      status: "success",
      data: {
        coupon: newCoupon,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to create coupon", 500, err.message));
  }
};

// Get a coupon by ID
const GetCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        coupon,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch coupon", 500, err.message));
  }
};

// Get all coupons
const GetAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({
      status: "success",
      data: {
        coupons,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch coupons", 500, err.message));
  }
};

// Update a coupon
const UpdateCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCoupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        coupon: updatedCoupon,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to update coupon", 500, err.message));
  }
};

// Delete a coupon
const DeleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Coupon deleted successfully",
    });
  } catch (err) {
    next(new AppErr("Failed to delete coupon", 500, err.message));
  }
};

// Apply a coupon
const ApplyCoupon = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { code, orderValue } = req.body;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Invalid coupon code",
      });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({
        status: false,
        message: "Coupon has expired",
      });
    }

    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({
        status: false,
        message: `Order value must be at least ${coupon.minOrderValue} to apply this coupon`,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        coupon,
        discount: coupon.discountValue,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to apply coupon", 500, err.message));
  }
};

// Validate a coupon by code
const ValidateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Invalid coupon code",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        valid: true,
        coupon,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to validate coupon", 500, err.message));
  }
};

module.exports = {
  Createcoupon,
  GetCouponById,
  GetAllCoupons,
  UpdateCoupon,
  DeleteCoupon,
  ApplyCoupon,
  ValidateCoupon,
};
