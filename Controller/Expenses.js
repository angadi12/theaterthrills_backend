const { validationResult } = require("express-validator");
const ExpenseModel = require("../Model/Expenses");
const Theater = require("../Model/Theater");
const BranchModel = require("../Model/Branch");
const AppErr = require("../Services/AppErr");

// Create Expense
const createExpense = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new AppErr(result.errors[0].msg, 403));
    }

    const { branch, theater } = req.body;

    // Validate Branch
    const branchExists = await BranchModel.findById(branch);
    if (!branchExists) {
      return next(new AppErr("Invalid branch ID provided", 404));
    }

    // Validate Theater
    const theaterExists = await Theater.findById(theater);
    if (!theaterExists) {
      return next(new AppErr("Invalid theater ID provided", 404));
    }



    const expense = await ExpenseModel.create(req.body);

    res.status(201).json({
      status: true,
      statusCode: 201,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

// Update Expense
const updateExpense = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new AppErr(result.errors[0].msg, 403));
    }

    const { id } = req.params;
    const updatedExpense = await ExpenseModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedExpense) {
      return next(new AppErr("Expense not found", 404));
    }

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

// Get All Expenses
const getAllExpenses = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    const expenses = await ExpenseModel.find({ branch: branchId });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

// Get Single Expense
const getSingleExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const expense = await ExpenseModel.findById(expenseId);

    if (!expense) {
      return next(new AppErr("Expense not found", 404));
    }

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

// Delete Expense
const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const deletedExpense = await ExpenseModel.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
      return next(new AppErr("Expense not found", 404));
    }

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Expense deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};


const GetExpensesByBranchAndDate = async (req, res, next) => {
  try {
    const { branchId } = req.params; // Branch ID from the route parameter
    const { startDate, endDate } = req.query; // Date range from query parameters

    if (!branchId) {
      return next(new AppErr("Branch ID is required", 400));
    }

    // Build query object
    const query = { branch: branchId };

    // If date range is provided, add it to the query
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate), // Start date
        $lte: new Date(endDate), // End date
      };
    }

    // Fetch expenses based on the query
    const expenses = await ExpenseModel.find(query)
      .populate("branch", "Branchname") // Populate branch data
      .populate("theater", "name"); // Populate theater data

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};



module.exports = {
  createExpense,
  updateExpense,
  getAllExpenses,
  getSingleExpense,
  deleteExpense,
  GetExpensesByBranchAndDate
};
