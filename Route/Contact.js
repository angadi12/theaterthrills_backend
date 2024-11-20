const express = require("express");
const { body, param } = require("express-validator");
const { authenticateUser } = require("../MiddleWare/IsUser");

const {
  createContact,
  getAllContacts,
  getContactById,
  deleteContactById,
} = require("../Controller/Contact");

const ContactRouter = express.Router();

// Route to create a new contact
ContactRouter.post(
  "/contact/create",
  [
    body("firstName")
      .notEmpty()
      .withMessage("First Name is required")
      .isString()
      .withMessage("First Name must be a valid string"),

    body("lastName")
      .notEmpty()
      .withMessage("Last Name is required")
      .isString()
      .withMessage("Last Name must be a valid string"),

    body("mobileNumber")
      .notEmpty()
      .withMessage("Mobile Number is required")
      .withMessage("Mobile Number must be valid"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be a valid email address"),

    body("occasion")
      .notEmpty()
      .withMessage("occasion is required"),
    body("details")
      .optional()
      .isString()
      .withMessage("Details must be a string"),
  ],
  createContact
);

ContactRouter.get("/contact/getall", getAllContacts);

// Route to fetch a contact by ID
ContactRouter.get(
  "/contact/getcontact/:id",
  [
    param("id").isMongoId().withMessage("Invalid contact ID"),
  ],
  authenticateUser,
  getContactById
);


ContactRouter.delete(
  "/contact/delete/:id",
  param("id").isMongoId().withMessage("Invalid contact ID"),
  authenticateUser,
  deleteContactById
);

module.exports = { ContactRouter };
