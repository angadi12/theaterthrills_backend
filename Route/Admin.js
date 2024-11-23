const express = require("express");
const { body } = require("express-validator");
const {
  getAllAdminByBranchId,
  toggleAdminStatus,
  updateAdmin,
  deleteAdmin,
  getSingleAdmin
} = require("../Controller/Admin");

const AdminRouter = express.Router();

//-------------Update Active Toggle ---------------//
AdminRouter.put("/update/active/admin/:id",  toggleAdminStatus);

//-------------Get All Admin ---------------//
AdminRouter.get("/get/admin/:branchId",  getAllAdminByBranchId);

//-------------Get All Admin ---------------//
AdminRouter.get("/getsingle/admin/:adminId",getSingleAdmin);

AdminRouter.delete("/Delete/admin/:adminId",deleteAdmin);


module.exports = {
  AdminRouter,
};
