const express = require("express");
const { body, param } = require("express-validator");
const {
  saveUnsavedBooking,
  getAllUnsavedBookings,
  getUnsavedBookingById,
  // deleteUnsavedBooking,
} = require("../Controller/Unsaved");

const UnsavedBookingRouter = express.Router();

UnsavedBookingRouter.post(
  "/saveUnsavedBooking",
  [
    body("user").isMongoId().withMessage("Invalid User ID"),
    body("theater").isMongoId().withMessage("Invalid Theater ID"),
    body("slot").isMongoId().withMessage("Invalid Slot ID"),
    body("date").notEmpty().withMessage("Date is required"),
    body("bookingId").notEmpty().withMessage("Booking ID is required"),
    body("paymentStatus")
      .isIn(["pending", "cancelled", "failed"])
      .withMessage("Invalid payment status"),
  ],
  saveUnsavedBooking
);

UnsavedBookingRouter.get("/getAllUnsavedBookings", getAllUnsavedBookings);

UnsavedBookingRouter.get(
  "/getUnsavedBookingById/:id",
  [param("id").isMongoId().withMessage("Invalid Booking ID")],
  getUnsavedBookingById
);

// UnsavedBookingRouter.delete(
//   "/deleteUnsavedBooking/:id",
//   [param("id").isMongoId().withMessage("Invalid Booking ID")],
//   deleteUnsavedBooking
// );

module.exports = { UnsavedBookingRouter };
