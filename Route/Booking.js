const express = require("express");
const { body, param } = require("express-validator");
const { isAdmin, isSuperAdmin } = require("../MiddleWare/IsUser");

const { createBooking, verifyPayment,getAllBookings,getBookingById,getBookingByUserId,createRazorpayOrder,getAllBookingByTheaterId ,sendBookingEmail,getAllBookingByBranchId,handleRefundRequest} = require("../Controller/Booking");

const BookingRouter = express.Router();

BookingRouter.post(
  "/createBooking",
  [
    body("theaterId").isMongoId().withMessage("Invalid theater ID"),
    body("date")
      .notEmpty()
      .withMessage("Date must be in format (yyyy-mm-dd)"),
    body("slotId")
      .notEmpty()
      .isMongoId()
      .withMessage("Slot ID must be a valid Mongo ID"),
    body("user")
      .notEmpty()
      .isMongoId()
      .withMessage("User ID must be a valid Mongo ID"),
  ],
  createBooking
);

BookingRouter.post(
  "/Createorder",
  [
    body("theaterId").isMongoId().withMessage("Invalid theater ID"),
    body("date")
      .notEmpty()
      .withMessage("Date must be in format (yyyy-mm-dd)"),
    body("slotId")
      .notEmpty()
      .isMongoId()
      .withMessage("Slot ID must be a valid Mongo ID"),
  ],
  createRazorpayOrder
);

BookingRouter.post(
  "/verifyPayment",

  verifyPayment
);

BookingRouter.get('/Getallbooking', getAllBookings);
BookingRouter.get('/Getbookingbyid/:id', getBookingById);
BookingRouter.get('/Getuserbooking/:userId', getBookingByUserId);
BookingRouter.get('/Getallbookingbytheater/:theaterId', getAllBookingByTheaterId);
BookingRouter.get('/getAllBookingByBranchId/:branchId', getAllBookingByBranchId);
BookingRouter.post('/send-booking-email/:bookingId', sendBookingEmail);

BookingRouter.post('/Rquest-for-cancellation/:bookingId', handleRefundRequest);



module.exports = { BookingRouter };
