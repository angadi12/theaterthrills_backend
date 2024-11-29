const express = require("express");
const {
  createExpense,
  updateExpense,
  getAllExpenses,
  getSingleExpense,
  deleteExpense,
  GetExpensesByBranchAndDate
} = require("../Controller/Expenses");
const { body } = require("express-validator");

const expenseRouter = express.Router();

// Create Expense
expenseRouter.post(
  "/create/expense",
  body("name").notEmpty().withMessage("Expense name is required"),
  body("amount").isNumeric().withMessage("Expense amount must be numeric"),
  body("category").notEmpty().withMessage("Expense category is required"),
  body("theater").notEmpty().withMessage("theater category is required"),
  body("branch").notEmpty().withMessage("Branch ID is required"),
  createExpense
);

// Update Expense
expenseRouter.put(
  "/update/expense/:id",
  body("name").notEmpty().withMessage("Expense name is required"),
  body("amount").isNumeric().withMessage("Expense amount must be numeric"),
  body("category").notEmpty().withMessage("Expense category is required"),
  body("branch").notEmpty().withMessage("Branch ID is required"),
  updateExpense
);

// Get All Expenses by Branch
expenseRouter.get("/get/expenses/branch/:branchId", getAllExpenses);

// Get Single Expense
expenseRouter.get("/get/expense/:expenseId", getSingleExpense);

// Delete Expense
expenseRouter.delete("/delete/expense/:expenseId", deleteExpense);

expenseRouter.get("/get/expense/branch/:branchId", GetExpensesByBranchAndDate);


module.exports = { expenseRouter };
