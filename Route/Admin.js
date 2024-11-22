const express = require("express");
const { body } = require("express-validator");
const {
  CreateAdmin,
  UpdateAdmin,
  UpdateAdminBranch,
  ToggleActiveAdmin,
  GetAllAdmin,
  GetSingleAdmin,
} = require("../Controller/Admin");

const AdminRouter = express.Router();

//-------------Create Admin Route ---------------//
AdminRouter.post(
  "/create/admin",
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must Be a Valied"),
  body("number")
    .notEmpty()
    .withMessage("Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Numbe must be 10 digit"),
  body("branch").notEmpty().withMessage("Branch is required"),
  CreateAdmin
);

//-------------Update Admin Route ---------------//
AdminRouter.put(
  "/update/admin/:id",
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must Be a Valied"),
  body("number")
    .notEmpty()
    .withMessage("Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Numbe must be 10 digit"),
  body("branch").notEmpty().withMessage("Branch is required"),
  UpdateAdmin
);

//-------------Update Admin Route ---------------//
AdminRouter.put(
  "/update/branch/admin/:branchid/:adminid",
  UpdateAdminBranch
);

//-------------Update Active Toggle ---------------//
AdminRouter.put("/update/active/admin/:id",  ToggleActiveAdmin);

//-------------Get All Admin ---------------//
AdminRouter.get("/get/admin/:branchid",  GetAllAdmin);

//-------------Get All Admin ---------------//
AdminRouter.get("/getsingle/admin/:id",GetSingleAdmin);


module.exports = {
  AdminRouter,
};
