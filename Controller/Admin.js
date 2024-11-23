const mongoose = require("mongoose");
const User = require("../Model/User"); // Adjust the path to your User model
const AppErr = require("../Services/AppErr"); // Custom error handling utility

/**
 * Get all admins by branch ID.
 */
const getAllAdminByBranchId = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    const admins = await User.find({ branch: branchId, role: "admin" }).populate("branch")
      .select("-__v -bookings") // Exclude unnecessary fields
      .lean()
      
    res.status(200).json({
      status: "success",
      data: { admins },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch admins by branch ID", 500, err.message));
  }
};

/**
 * Toggle admin activation status.
 */
const toggleAdminStatus = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppErr("Invalid admin ID", 400));
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    // Toggle the `activate` field
    admin.activate = !admin.activate;
    await admin.save();

    res.status(200).json({
      status: "success",
      message: `Admin ${admin.activate ? "activated" : "deactivated"} successfully`,
      data: { admin },
    });
  } catch (err) {
    next(new AppErr("Failed to toggle admin status", 500, err.message));
  }
};

/**
 * Update admin details.
 */
const updateAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppErr("Invalid admin ID", 400));
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    // Update admin fields
    Object.keys(updates).forEach((key) => {
      admin[key] = updates[key];
    });

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: { admin },
    });
  } catch (err) {
    next(new AppErr("Failed to update admin details", 500, err.message));
  }
};

/**
 * Delete admin by ID.
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppErr("Invalid admin ID", 400));
    }

    const admin = await User.findByIdAndDelete(adminId);

    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Admin deleted successfully",
    });
  } catch (err) {
    next(new AppErr("Failed to delete admin", 500, err.message));
  }
};

/**
 * Get a single admin by admin ID.
 */
const getSingleAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppErr("Invalid admin ID", 400));
    }

    const admin = await User.findById(adminId)
      .select("-__v -bookings") // Exclude unnecessary fields
      .lean();

    if (!admin || admin.role !== "admin") {
      return next(new AppErr("Admin not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { admin },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch admin details", 500, err.message));
  }
};




module.exports = {
  getAllAdminByBranchId,
  toggleAdminStatus,
  updateAdmin,
  deleteAdmin,
  getSingleAdmin
};
