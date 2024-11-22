const express = require("express");
const { body, param } = require("express-validator");
const {authenticateUser } = require("../MiddleWare/IsUser");

const {
  createUser,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
  verifyToken
} = require("../Controller/Users");

const UserRouter = express.Router();

UserRouter.post(
  "/user/create",
  [
    body("authType")
      .notEmpty()
      .withMessage("Auth type is required")
      .isIn(["firebase", "emailOtp"])
      .withMessage("Auth type must be either 'firebase' or 'emailOtp'"),

    // UID validation only for Firebase
    // body("uid")
    //   .if(body("authType").equals("firebase"))
    //   .notEmpty()
    //   .withMessage("UID is required for Firebase authentication"),

    // Email validation only for Email OTP
    body("email")
      .if(body("authType").equals("emailOtp"))
      .notEmpty()
      .withMessage("Email is required for Email OTP authentication")
      .isEmail()
      .withMessage("Email must be valid"),

    // Phone number is optional but validated if provided
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Phone number must be valid"),

    // Full name is required for both authentication types
    // body("fullName")
    //   .notEmpty()
    //   .withMessage("Full name is required"),

    // Role is optional and has specific allowed values
    body("role")
      .optional()
      .isIn(["user", "admin", "superadmin"])
      .withMessage("Role must be one of 'user', 'admin', or 'superadmin'"),
  ],
  createUser
);


UserRouter.get("/user/getall", getAllUsers);

UserRouter.get(
  "/user/getuser/:id",
  param("id").isMongoId().withMessage("Invalid user ID"),
  getUserById
);

UserRouter.put(
  "/user/update/:id",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("uid").optional().notEmpty().withMessage("UID is required"),
    body("email").optional().isEmail().withMessage("Email must be valid"),
    body("phoneNumber").optional().isMobilePhone().withMessage("Phone number must be valid"),
    body("fullName").optional().notEmpty().withMessage("Full name is required"),
    body("role")
      .optional()
      .isIn(['user', 'admin', 'superadmin'])
      .withMessage("Role must be one of 'user', 'admin', or 'superadmin'")
  ],
  updateUserById
);

UserRouter.delete(
  "/user/delete/:id",
  param("id").isMongoId().withMessage("Invalid user ID"),
  deleteUserById
);

UserRouter.get("/Checktokenexpired",authenticateUser, verifyToken, (req, res) => {
  res.status(200).json({status:"success", message: "Access granted", user: req.user });
});;

module.exports = { UserRouter };
