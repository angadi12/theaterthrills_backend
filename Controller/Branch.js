const mongoose = require("mongoose");
const Branch = require("../Model/Branch");
const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");

// Create a new branch
const CreateBranch = async (req, res, next) => {
  try {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const { Branchname, code, location, Number } = req.body;

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      return next(new AppErr("Branch code already exists", 400));
    }

    // Create a new branch document
    const branch = new Branch({
      Branchname,
      code,
      location,
      Number,
    });

    // Save branch to the database
    await branch.save();

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error creating branch", 500));
  }
};

// Update an existing branch
const UpdateBranch = async (req, res, next) => {
  try {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const { id } = req.params;
    const { Branchname, code, location, Number } = req.body;

    // Find the branch by ID and update it
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { Branchname, code, location, Number },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error updating branch", 500));
  }
};

// Get all branches
const GetAllBranch = async (req, res, next) => {
  try {
    const branches = await Branch.find();

    if (!branches || branches.length === 0) {
      return next(new AppErr("No branches found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branches retrieved successfully",
      data: branches,
    });
  } catch (error) {
    console.log(error);
    next(new AppErr("Error fetching branches", 500));
  }
};

// Get a single branch by ID
const GetSingleBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch retrieved successfully",
      data: branch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error fetching branch", 500));
  }
};

// Delete a branch by ID
const DeleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the branch ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    // Find and delete the branch
    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
      data: deletedBranch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error deleting branch", 500));
  }
};

module.exports = {
  DeleteBranch,
};



module.exports = {
  CreateBranch,
  UpdateBranch,
  GetAllBranch,
  GetSingleBranch,
  DeleteBranch
};
