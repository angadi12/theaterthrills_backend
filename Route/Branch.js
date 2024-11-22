const express = require("express");
const { body } = require("express-validator");
const {
  CreateBranch,
  UpdateBranch,
  GetAllBranch,
  GetSingleBranch,
  DeleteBranch
} = require("../Controller/Branch");

const BranchRouter = express.Router();

BranchRouter.post(
  "/create/branch",
  body("Branchname").notEmpty().withMessage("Branch Name  is required"),
  body("code").notEmpty().withMessage("Branch Code  is required"),
  CreateBranch
);
BranchRouter.put(
  "/update/branch/:id",
  body("Branchname").notEmpty().withMessage("Branch Name  is required"),
  body("code").notEmpty().withMessage("Branch Code  is required"),
  UpdateBranch
);
BranchRouter.get("/get/branch", GetAllBranch);
BranchRouter.get("/get/branch/:id", GetSingleBranch);
BranchRouter.delete("/delete/:id", DeleteBranch);

module.exports = BranchRouter;
