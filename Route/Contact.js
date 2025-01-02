const express = require("express");
const { body, param } = require("express-validator");
const { authenticateUser } = require("../MiddleWare/IsUser");

const {
  createContact,
  getAllContacts,
  getContactById,
  deleteContactById,
  getContactsByDateRange,
  sendEmailtouser
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
  deleteContactById
);

ContactRouter.get("/getllcontactsbydate", getContactsByDateRange);

ContactRouter.post("/send-ticket-email", sendEmailtouser);


module.exports = { ContactRouter };
