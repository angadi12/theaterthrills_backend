const express = require("express");
const { body, param } = require("express-validator");
const { isAdmin, isSuperAdmin } = require("../MiddleWare/IsUser");
const upload =require("../Services/multer")

const {
  createTheater,
  getTheaterById,
  getAvailableSlots,
  updateTheater,
  getAllTheaters,
  deleteTheater,
  getAvailableSlotsByLocation,
  getAllTheaterLocations,
  getAllTheatersByBranchId,
  getTheaterAnalytics,
  getHourlyTheaterAnalytics,
  getHourlyAllTheatersAnalytics,
  getAllTheaterAnalytics
} = require("../Controller/Theater");


const TheaterRouter = express.Router();

// Route to create a new theater
TheaterRouter.post(
  "/theater/create",
  upload.array("images", 6),
//   isAdmin,
  [
    body("name").notEmpty().withMessage("Theater name is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("maxCapacity").isInt({ gt: 0 }).withMessage("Capacity must be a positive number"),
    body("amenities").optional().isArray().withMessage("Amenities must be an array of strings"),
    body("slots").optional().isArray().withMessage("Slots must be an array")
  ],
  createTheater
);

// Route to get all theaters
TheaterRouter.get("/theater/getall", getAllTheaters);

// Route to get a specific theater by ID
TheaterRouter.get(
  "/theater/get/:id",
  param("id").isMongoId().withMessage("Invalid theater ID"),
  getTheaterById
);

// Route to update a theater by ID
TheaterRouter.put(
  "/theater/update/:theaterId",
  upload.array("images", 6),
//   isAdmin,
  [
    body("name").optional().notEmpty().withMessage("Theater name is required"),
    body("location").optional().notEmpty().withMessage("Location is required"),
    body("maxCapacity").optional().isInt({ gt: 0 }).withMessage("Capacity must be a positive number"),
    body("amenities").optional().isArray().withMessage("Amenities must be an array of strings"),
    body("slots").optional().isArray().withMessage("Slots must be an array"),
  ],
  updateTheater
);

// Route to delete a theater by ID
TheaterRouter.delete(
  "/theater/delete/:theaterId",
//   isSuperAdmin,
  param("theaterId").isMongoId().withMessage("Invalid theater ID"),
  deleteTheater
);

// Route to get available slots for a theater by date
TheaterRouter.get(
  "/theater/:theaterId/available-slots",
  [
    param("theaterId").isMongoId().withMessage("Invalid theater ID"),
    body("date").notEmpty().isISO8601().withMessage("Date must be in ISO8601 format (yyyy-mm-dd)")
  ],
  getAvailableSlots
);


TheaterRouter.post('/availableSlotsByLocation', getAvailableSlotsByLocation);

TheaterRouter.get('/theater/locations/:branchId',getAllTheaterLocations);

TheaterRouter.get("/theater/branch/:branchId", getAllTheatersByBranchId);


TheaterRouter.get("/theater/getTheaterAnalytics/:theaterId", getTheaterAnalytics);

TheaterRouter.get("/theater/getAllTheaterAnalytics/:branchId", getAllTheaterAnalytics);

TheaterRouter.get("/theater/getHourlyTheaterAnalytics/:theaterId", getHourlyTheaterAnalytics);

TheaterRouter.get("/theater/getHourlyAllTheatersAnalytics", getHourlyAllTheatersAnalytics);



module.exports = { TheaterRouter };
