const express = require("express");
const { body, param } = require("express-validator");
const {
  saveUnsavedBooking,
  getAllUnsavedBookings,
  getUnsavedBookingById,
  getAllunsavedBookingByTheaterId,
  // deleteUnsavedBooking,
  sendunsavedBookingEmail,
  deletebookingById
} = require("../Controller/Unsaved");

const UnsavedBookingRouter = express.Router();

UnsavedBookingRouter.post(
  "/saveUnsavedBooking",
  [
    body("user").isMongoId().withMessage("Invalid User ID"),
    body("theaterId").isMongoId().withMessage("Invalid Theater ID"),
    body("slotId").isMongoId().withMessage("Invalid Slot ID"),
    body("date").notEmpty().withMessage("Date is required"),
  ],
  saveUnsavedBooking
);

UnsavedBookingRouter.get("/getAllUnsavedBookings", getAllUnsavedBookings);
UnsavedBookingRouter.get("/getAllUnsavedBookings/:theaterId", getAllunsavedBookingByTheaterId);
UnsavedBookingRouter.post('/send-unsavedbooking-email/:bookingId', sendunsavedBookingEmail);

UnsavedBookingRouter.get(
  "/getUnsavedBookingById/:id",
  [param("id").isMongoId().withMessage("Invalid Booking ID")],
  getUnsavedBookingById
);

UnsavedBookingRouter.delete(
  "/deletebookingById/:id",
  [param("id").isMongoId().withMessage("Invalid Booking ID")],
  deletebookingById
);

// UnsavedBookingRouter.delete(
//   "/deleteUnsavedBooking/:id",
//   [param("id").isMongoId().withMessage("Invalid Booking ID")],
//   deleteUnsavedBooking
// );

module.exports = { UnsavedBookingRouter };
