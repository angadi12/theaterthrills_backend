const { validationResult } = require("express-validator");
const CouponOffer = require("../Model/Coupon"); // Assuming a Mongoose model
const AppErr = require("../Services/AppErr"); // Custom error handling utility

// Create a new coupon
const CreateCouponOffer = async (req, res, next) => {
  try {
    // Validate incoming request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // Destructure the request body to get the necessary fields
    const {
      code,
      type,
      description,
      discountAmount,
      discountType,
      validFrom,
      validUntil,
      isActive,
      theater,
      users,
      usageLimit,
      devicesUsed,
      userLimit,
    } = req.body;

    // Check if the coupon/offer already exists
    const existingCoupon = await CouponOffer.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({
        status: false,
        message: "Coupon code already exists",
      });
    }

    // Create a new coupon offer
    const newCouponOffer = await CouponOffer.create({
      code,
      type,
      description,
      discount: {
        amount: discountAmount,
        type: discountType,
      },
      validFrom,
      validUntil,
      isActive,
      theater,
      users,
      usageLimit,
      devicesUsed,
      userLimit,
    });

    // Return success response
    res.status(201).json({
      status: "success",
      data: {
        couponOffer: newCouponOffer,
      },
    });
  } catch (err) {
    // Handle errors
    next(new AppErr("Failed to create coupon offer", 500, err.message));
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
    const coupons = await CouponOffer.find();
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
const GetAllCouponsbyoffer = async (req, res, next) => {
  try {
    const coupons = await CouponOffer.find({ type: "offer" });

    const descriptions = coupons.map(offer => offer.description);

    res.status(200).json({
      status: "success",
      descriptions: descriptions, 

    });
  } catch (err) {
    console.log(err)
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

    const updatedCoupon = await CouponOffer.findByIdAndUpdate(id, updates, {
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
    const deletedCoupon = await CouponOffer.findByIdAndDelete(id);

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
// const ApplyCoupon = async (req, res, next) => {
//   try {
//     // Validate incoming request data
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         message: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const { couponCode, orderValue, userId, deviceId, theaterId } = req.body;

//     // First, check if it's a coupon offer
//     let couponOffer = await CouponOffer.findOne({ code: couponCode });

//     if (couponOffer && couponOffer.type === "offer") {
//       // Validate if the offer is active
//       if (!couponOffer.isActive) {
//         return res.status(400).json({
//           status: false,
//           message: "This offer is not active",
//         });
//       }

//       // Check if the user is eligible for this offer
//       if (!couponOffer.users.includes(userId)) {
//         return res.status(400).json({
//           status: false,
//           message: "User is not eligible for this offer",
//         });
//       }

//       // Check if the device has already used the offer
//       if (couponOffer.devicesUsed.includes(deviceId)) {
//         return res.status(400).json({
//           status: false,
//           message: "This device has already used the offer",
//         });
//       }

//       // Check usage limit for the offer
//       if (couponOffer.usageLimit <= 0) {
//         return res.status(400).json({
//           status: false,
//           message: "Usage limit exceeded for this offer",
//         });
//       }

//       // If all checks are passed, reduce usage limit and mark device as used
//       couponOffer.usageLimit -= 1;
//       couponOffer.devicesUsed.push(deviceId);
//       await couponOffer.save();

//       // Calculate the discount
//       const discountAmount = couponOffer.discount.type === "percentage" 
//         ? (orderValue * couponOffer.discount.amount) / 100 
//         : couponOffer.discount.amount;

//       return res.status(200).json({
//         status: "success",
//         data: {
//           coupon: couponOffer,
//           discountPercentage: couponOffer.discount.type === "percentage" ? couponOffer.discount.amount : 0,
//           discountAmount,
//         },
//       });
//     }

//     // If it's not an offer, check if it's a theater-specific coupon
//     let coupon = await CouponOffer.findOne({ code: couponCode });

//     if (!coupon) {
//       return res.status(404).json({
//         status: false,
//         message: "Invalid coupon code",
//       });
//     }

//     // Check if the coupon is associated with the specific theater
//     if (coupon.theater.toString() !== theaterId) {
//       return res.status(400).json({
//         status: false,
//         message: `Coupon is not valid for this theater`,
//       });
//     }

//     // Check if the coupon has expired
//     if (new Date() > coupon.expiryDate) {
//       return res.status(400).json({
//         status: false,
//         message: "Coupon has expired",
//       });
//     }

//     // Check if the order value meets the minimum order requirement
//     if (orderValue < coupon.minOrderValue) {
//       return res.status(400).json({
//         status: false,
//         message: `Order value must be at least ${coupon.minOrderValue} to apply this coupon`,
//       });
//     }

//     // Calculate the discount for the coupon
//     let discountAmount = 0;
//     if (coupon.discountType === "percentage") {
//       discountAmount = (orderValue * coupon.discountValue) / 100;
//     } else if (coupon.discountType === "fixed") {
//       discountAmount = coupon.discountValue;
//     }

//     return res.status(200).json({
//       status: "success",
//       data: {
//         coupon,
//         discountPercentage: coupon.discountType === "percentage" ? coupon.discountValue : 0,
//         discountAmount,
//       },
//     });
//   } catch (err) {
//     console.log(err)
//     next(new AppErr("Failed to apply coupon", 500, err.message));
//   }
// };



// const ApplyCoupon = async (req, res, next) => {
//   try {
//     // Validate incoming request data
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         message: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const { couponCode, orderValue, userId, deviceId, theaterId } = req.body;

//     // Fetch the coupon or offer from the database
//     const coupon = await CouponOffer.findOne({ code: couponCode });

//     if (!coupon) {
//       return res.status(404).json({
//         status: false,
//         message: "Invalid coupon code",
//       });
//     }

//     // Handle offer type
//     if (coupon.type === "offer") {
//       // Check if the offer is expired
//       if (new Date() > new Date(coupon.validUntil)) {
//         return res.status(400).json({
//           status: false,
//           message: "Offer has expired",
//         });
//       }

//       // Validate order value against minimum order value
//       if (orderValue < coupon.minOrderValue) {
//         return res.status(400).json({
//           status: false,
//           message: `Order value must be at least ${coupon.minOrderValue} to apply this offer`,
//         });
//       }

//       // Calculate the discount based on offer type
//       let discountAmount = 0;
//       if (coupon.discount.type === "percentage") {
//         discountAmount = (orderValue * coupon.discount.amount) / 100;
//       } else if (coupon.discount.type === "fixed") {
//         discountAmount = coupon.discount.amount;
//       }

//       return res.status(200).json({
//         status: "success",
//         data: {
//           coupon,
//           discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
//           discountAmount,
//         },
//       });
//     }

//     // Handle coupon type
//     if (coupon.type === "coupon") {
//       // Check if the coupon is valid for the given theater
//       if (coupon.theater.toString() !== theaterId) {
//         return res.status(400).json({
//           status: false,
//           message: "Coupon is not valid for this theater",
//         });
//       }

//       // Check if the coupon is active
//       if (!coupon.isActive) {
//         return res.status(400).json({
//           status: false,
//           message: "This coupon is no longer active",
//         });
//       }

//       // // Check if the coupon is expired
//       // const currentDate = new Date();
//       // const validUntilDate = new Date(coupon.validUntil);

//       // // Ignore time part and compare only the dates
//       // if (currentDate.setHours(0, 0, 0, 0) > validUntilDate.setHours(0, 0, 0, 0)) {
//       //   return res.status(400).json({
//       //     status: false,
//       //     message: "Coupon has expired",
//       //   });
//       // }

//       // Check if the coupon is valid for this user
//       // if (!coupon.users.includes(userId)) {
//       //   return res.status(400).json({
//       //     status: false,
//       //     message: "This coupon is not valid for your user",
//       //   });
//       // }

//       // Check if the user has exceeded their usage limit
//       const userUsageCount = await CouponOffer.countDocuments({
//         code: couponCode,
//         userId,
//       });

//       if (userUsageCount >= coupon.userLimit) {
//         return res.status(400).json({
//           status: false,
//           message: `You have exceeded the usage limit for this coupon (${coupon.userLimit} times)`,
//         });
//       }

//       // Check if the device has already used this coupon
//       if (coupon.devicesUsed.includes(deviceId)) {
//         return res.status(400).json({
//           status: false,
//           message: "This device has already used the coupon",
//         });
//       }

//       // Validate the order value against the minimum required order value
//       if (orderValue < coupon.minOrderValue) {
//         return res.status(400).json({
//           status: false,
//           message: `Order value must be at least ${coupon.minOrderValue} to apply this coupon`,
//         });
//       }

//       // Update coupon usage for the device and user
//       coupon.devicesUsed.push(deviceId);
//       await coupon.save();

//       // Calculate the discount
//       let discountAmount = 0;
//       if (coupon.discount.type === "percentage") {
//         discountAmount = (orderValue * coupon.discount.amount) / 100;
//       } else if (coupon.discount.type === "fixed") {
//         discountAmount = coupon.discount.amount;
//       }

//       return res.status(200).json({
//         status: "success",
//         data: {
//           coupon,
//           discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
//           discountAmount,
//         },
//       });
//     }

//   } catch (err) {
//     next(new AppErr("Failed to apply coupon", 500, err.message));
//   }
// };


// const ApplyCoupon = async (req, res, next) => {
//   try {
//     // Validate incoming request data
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         message: "Validation errors",
//         errors: errors.array(),
//       });
//     }

//     const { couponCode, orderValue, userId, deviceId, theaterId } = req.body;

//     // Fetch the coupon or offer from the database
//     const coupon = await CouponOffer.findOne({ code: couponCode });

//     if (!coupon) {
//       return res.status(404).json({
//         status: false,
//         message: "Invalid coupon code",
//       });
//     }

//     // Handle offer type
//     if (coupon.type === "offer") {
//       // Check if the offer is expired
//       if (new Date() > new Date(coupon.validUntil)) {
//         return res.status(400).json({
//           status: false,
//           message: "Offer has expired",
//         });
//       }

//       // Validate order value against minimum order value
//       if (orderValue < coupon.minOrderValue) {
//         return res.status(400).json({
//           status: false,
//           message: `Order value must be at least ${coupon.minOrderValue} to apply this offer`,
//         });
//       }

//       // Calculate the discount based on offer type
//       let discountAmount = 0;
//       if (coupon.discount.type === "percentage") {
//         discountAmount = (orderValue * coupon.discount.amount) / 100;
//       } else if (coupon.discount.type === "fixed") {
//         discountAmount = coupon.discount.amount;
//       }

//       return res.status(200).json({
//         status: "success",
//         data: {
//           coupon,
//           discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
//           discountAmount,
//         },
//       });
//     }

//     // Handle coupon type
//     if (coupon.type === "coupon") {
//       // Check if the coupon is valid for the given theater
//       if (coupon.theater.toString() !== theaterId) {
//         return res.status(400).json({
//           status: false,
//           message: "Coupon is not valid for this theater",
//         });
//       }

//       // Check if the coupon is active
//       if (!coupon.isActive) {
//         return res.status(400).json({
//           status: false,
//           message: "This coupon is no longer active",
//         });
//       }

//       // Check if the coupon is expired
//       const currentDate = new Date();
//       const validUntilDate = new Date(coupon.validUntil);

//       // Compare only the dates, ignoring time
//       if (currentDate.setHours(0, 0, 0, 0) > validUntilDate.setHours(0, 0, 0, 0)) {
//         return res.status(400).json({
//           status: false,
//           message: "Coupon has expired",
//         });
//       }

//       // Check if the coupon is valid for this user
//       // if (!coupon.users.includes(userId)) {
//       //   return res.status(400).json({
//       //     status: false,
//       //     message: "This coupon is not valid for your user",
//       //   });
//       // }

//       // Check if the user has exceeded their usage limit
//       const userUsageCount = await CouponOffer.countDocuments({
//         code: couponCode,
//         userId,
//       });

//       if (userUsageCount >= coupon.userLimit) {
//         return res.status(400).json({
//           status: false,
//           message: `You have exceeded the usage limit for this coupon (${coupon.userLimit} times)`,
//         });
//       }

//       // Check if the device has already used this coupon
//       if (coupon.devicesUsed.includes(deviceId)) {
//         return res.status(400).json({
//           status: false,
//           message: "This device has already used the coupon",
//         });
//       }

//       // Validate the order value against the minimum required order value
//       if (orderValue < coupon.minOrderValue) {
//         return res.status(400).json({
//           status: false,
//           message: `Order value must be at least ${coupon.minOrderValue} to apply this coupon`,
//         });
//       }

//       // Update coupon usage for the device and user
//       coupon.devicesUsed.push(deviceId);
//       await coupon.save();

//       // Calculate the discount
//       let discountAmount = 0;
//       if (coupon.discount.type === "percentage") {
//         discountAmount = (orderValue * coupon.discount.amount) / 100;
//       } else if (coupon.discount.type === "fixed") {
//         discountAmount = coupon.discount.amount;
//       }

//       return res.status(200).json({
//         status: "success",
//         data: {
//           coupon,
//           discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
//           discountAmount,
//         },
//       });
//     }

//   } catch (err) {
//     next(new AppErr("Failed to apply coupon", 500, err.message));
//   }
// };

const ApplyCoupon = async (req, res, next) => {
  try {
    // Validate incoming request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { couponCode, orderValue, theaterId ,userId,deviceId} = req.body;

    // Fetch the coupon or offer from the database
    const coupon = await CouponOffer.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Invalid coupon code",
      });
    }

    // Handle offer type
    if (coupon.type === "offer") {
      // Check if the offer is expired
      if (new Date() > new Date(coupon.validUntil)) {
        return res.status(400).json({
          status: false,
          message: "Offer has expired",
        });
      }

      // Validate order value against minimum order value
      if (orderValue < coupon.minOrderValue) {
        return res.status(400).json({
          status: false,
          message: `Order value must be at least ${coupon.minOrderValue} to apply this offer`,
        });
      }

      // Calculate the discount based on offer type
      let discountAmount = 0;
      if (coupon.discount.type === "percentage") {
        discountAmount = (orderValue * coupon.discount.amount) / 100;
      } else if (coupon.discount.type === "fixed") {
        discountAmount = coupon.discount.amount;
      }

      return res.status(200).json({
        status: "success",
        data: {
          coupon,
          discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
          discountAmount,
        },
      });
    }

    // Handle coupon type
    if (coupon.type === "coupon") {
      // Check if the coupon is valid for the given theater
      if (coupon.theater.toString() !== theaterId) {
        return res.status(400).json({
          status: false,
          message: "Coupon is not valid for this theater",
        });
      }

      // Check if the coupon is active
      if (!coupon.isActive) {
        return res.status(400).json({
          status: false,
          message: "This coupon is no longer active",
        });
      }

      // Check if the coupon is expired
      const currentDate = new Date();
      const validUntilDate = new Date(coupon.validUntil);

      // Ignore time part and compare only the dates
      if (currentDate.setHours(0, 0, 0, 0) > validUntilDate.setHours(0, 0, 0, 0)) {
        return res.status(400).json({
          status: false,
          message: "Coupon has expired",
        });
      }

      // const eligibleUser = coupon.users.find((user) => user === userId);
      // console.log(eligibleUser)
      // if (!eligibleUser) {
      //   return res.status(400).json({
      //     status: false,
      //     message: `Coupon is not valid for user with ID: ${userId}`,
      //   });
      // }

      // Check if the user has exceeded their usage limit
      const userUsageCount = await CouponOffer.countDocuments({
        code: couponCode,
        userId,
      });

      if (userUsageCount >= coupon.userLimit) {
        return res.status(400).json({
          status: false,
          message: `You have exceeded the usage limit for this coupon (${coupon.userLimit} times)`,
        });
      }

      // Check if the device has already used this coupon
      if (coupon.devicesUsed.includes(deviceId)) {
        return res.status(400).json({
          status: false,
          message: "This device has already used the coupon",
        });
      }
      if (coupon.users.includes(userId)) {
        return res.status(400).json({
          status: false,
          message: "This user has already used the coupon",
        });
      }

      // Validate the order value against the minimum required order value
      if (orderValue < coupon.minOrderValue) {
        return res.status(400).json({
          status: false,
          message: `Order value must be at least ${coupon.minOrderValue} to apply this coupon`,
        });
      }

      // Update coupon usage for the device and user
      // coupon.devicesUsed.push(deviceId);
      // coupon.users.push(userId);
      // await coupon.save();

      // Decrease the usage limit
      // coupon.usageLimit -= 1;

      // if (coupon.usageLimit <= 0) {
      //   coupon.isActive = false; // Optionally deactivate the coupon once the usage limit is reached
      // }

      await coupon.save();

      // Calculate the discount
      let discountAmount = 0;
      if (coupon.discount.type === "percentage") {
        discountAmount = (orderValue * coupon.discount.amount) / 100;
      } else if (coupon.discount.type === "fixed") {
        discountAmount = coupon.discount.amount;
      }

      return res.status(200).json({
        status: "success",
        data: {
          coupon,
          discountPercentage: coupon.discount.type === "percentage" ? coupon.discount.amount : 0,
          discountAmount,
        },
      });
    }

  } catch (err) {
    console.log(err)
    next(new AppErr("Failed to apply coupon", 500, err.message));
  }
};



module.exports = {
  CreateCouponOffer,
  GetCouponById,
  GetAllCoupons,
  UpdateCoupon,
  DeleteCoupon,
  ApplyCoupon,
  GetAllCouponsbyoffer
};
