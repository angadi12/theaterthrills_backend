const express = require("express");
const { body } = require("express-validator");
const {
  CreateBranch,
  UpdateBranch,
  GetAllBranch,
  GetSingleBranch,
  DeleteBranch,
  getBranchAnalytics,
  Getbranchsummary,
  getBranchdetails
} = require("../Controller/Branch");
const upload =require("../Services/multer")

const BranchRouter = express.Router();

BranchRouter.post(
  "/create/branch",
  upload.array("images", 3),
  body("Branchname").notEmpty().withMessage("Branch Name  is required"),
  CreateBranch
);
BranchRouter.put(
  "/update/branch/:id",
  body("Branchname").notEmpty().withMessage("Branch Name  is required"),
  UpdateBranch
);
BranchRouter.get("/get/branch", GetAllBranch);
BranchRouter.get("/get/branch/:id", GetSingleBranch);

BranchRouter.get("/get/getBranchAnalytics", getBranchAnalytics);
BranchRouter.get("/bookings/summary-by-branch/:branchId", Getbranchsummary);
BranchRouter.get("/details-by-branch/:branchId", getBranchdetails);
BranchRouter.delete("/delete/:id", DeleteBranch);

module.exports = BranchRouter;
