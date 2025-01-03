// controllers/theaterController.js
const mongoose = require("mongoose"); // Ensure mongoose is imported
const Theater = require("../Model/Theater");
// const moment = require('moment');
const AppErr = require("../Services/AppErr");
const Booking = require("../Model/Booking"); // Adjust the path to your model
const { validationResult } = require("express-validator");
const cron = require("node-cron");
const moment = require("moment-timezone");
const uploadFilesToCloudinary = require('../Services/uploadFiles');

// Create a new theater
// const createTheater = async (req, res, next) => {
//   try {
//     // Check for validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new AppErr("Validation failed", 400, errors.array()));
//     }

//     const { name, location, capacity, amenities, slots,price,minimumDecorationAmount,images } = req.body;

//     // Additional check for slots structure
//     if (!Array.isArray(slots) || slots.some(slot => !slot.startTime || !slot.endTime)) {
//       return next(new AppErr("Each slot must have a startTime and endTime", 400));
//     }

//     // Create and save the theater
//     const theater = new Theater({ name, location, capacity, amenities, slots,images,price,minimumDecorationAmount });
//     await theater.save();

//     res.status(201).json({ status: true, message: "Theater created successfully", theater });
//   } catch (error) {
//     console.log(error)
//     next(new AppErr("Error creating theater", 500, error.message));
//   }
// };
const createTheater = async (req, res, next) => {
  console.log(req.body);
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const {
      status,
      branch,
      name,
      location,
      maxCapacity,
      amenities,
      slots,
      price,
      minimumDecorationAmount,
      images,
      groupSize,
      extraPerPerson,
      Locationlink
    } = req.body;

    // Validate slots structure
    if (
      !Array.isArray(slots) ||
      slots.some((slot) => !slot.startTime || !slot.endTime)
    ) {
      return next(
        new AppErr("Each slot must have a startTime and endTime", 400)
      );
    }

    // Initialize slots with empty dates
    const initializedSlots = slots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      dates: [], // Initialize dates as an empty array
    }));

    // const imageUrls = req.files.map((file) => file.path);
    // const imageUrls = await uploadFilesToCloudinary(req.files);
    const imageUrls = req.files.map(file => {
      // Replace this with cloud upload logic if needed
      return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    });

    // Create and save the theater
    const theater = new Theater({
      name,
      location,
      maxCapacity,
      extraPerPerson,
      groupSize,
      amenities,
      slots: initializedSlots,
      images: imageUrls,
      price,
      branch,
      status,
      Locationlink,
      minimumDecorationAmount,
    });

    await theater.save();

    res
      .status(201)
      .json({ status: true, message: "Theater created successfully", theater });
  } catch (error) {
    console.error(error);
    console.log(error);
    next(new AppErr("Error creating theater", 500, error.message));
  }
};

// Get a theater by ID
const getTheaterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid theater ID", 400));
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    res.status(200).json(theater);
  } catch (error) {
    console.log(error);
    next(new AppErr("Error fetching theater", 500));
  }
};

// Get available slots for a specific theater on a specific date
const getAvailableSlots = async (req, res, next) => {
  console.log("Request body:", req.body);
  try {
    const { theaterId } = req.params;
    const { date } = req.body;

    // Validate theater ID
    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      return next(new AppErr("Invalid theater ID", 400));
    }

    console.log("Theater ID:", theaterId, "Date:", date);

    // Validate date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return next(new AppErr("Invalid date format", 400));
    }

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    // Fetch booked slots
    const bookedSlots = await Booking.find({
      theater: theaterId,
      date: selectedDate,
      status: "booked",
    }).select("slot");

    console.log("Booked Slots:", bookedSlots);

    const bookedSlotIds = new Set(
      bookedSlots.map((booking) => booking.slot.toString())
    );

    // Get current date for comparison
    const now = new Date();
    const isToday = now.toDateString() === selectedDate.toDateString();

    // Filter available slots
    const availableSlots = theater.slots.filter((slot) => {
      const slotId = slot._id.toString();
      if (bookedSlotIds.has(slotId)) return false;

      if (isToday) {
        const [slotHours, slotMinutes, slotPeriod] = slot.startTime
          .match(/(\d+):(\d+)\s?(AM|PM)/i)
          .slice(1);
        const slotDate = new Date(now);
        slotDate.setHours(
          slotPeriod.toUpperCase() === "PM" && slotHours !== "12"
            ? +slotHours + 12
            : +slotHours % 12,
          +slotMinutes
        );
        return slotDate > now;
      }

      return true;
    });

    res.status(200).json({ availableSlots });
  } catch (error) {
    console.error("Error:", error.message);
    next(new AppErr("Error fetching available slots", 500, error.message));
  }
};

// Create a new booking for a slot

const updateTheater = async (req, res, next) => {
  console.log(req.body);
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const {
      status,
      branch,
      name,
      location,
      maxCapacity,
      amenities,
      slots,
      price,
      minimumDecorationAmount,
      images,
      groupSize,
      Locationlink,
      extraPerPerson,
    } = req.body;

    const { theaterId } = req.params; // Get the theater ID from the route parameters

    // Validate slots structure
    if (
      !Array.isArray(slots) ||
      slots.some((slot) => !slot.startTime || !slot.endTime)
    ) {
      return next(
        new AppErr("Each slot must have a startTime and endTime", 400)
      );
    }

    // Initialize slots with empty dates
    const initializedSlots = slots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      dates: [], // Initialize dates as an empty array
    }));

    // If new images are uploaded, process them
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => {
        // Replace this with cloud upload logic if needed
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      });
    }

    // Prepare update data
    const updateData = {
      name,
      location,
      maxCapacity,
      extraPerPerson,
      groupSize,
      amenities,
      slots: initializedSlots,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      price,
      branch,
      status,
      minimumDecorationAmount,
    };

    // Filter out undefined values from updateData to avoid overwriting with undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Update the theater document
    const theater = await Theater.findByIdAndUpdate(
      theaterId,
      { $set: updateData }, // $set to update only the specified fields
      { new: true } // Return the updated document
    );

    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    res.status(200).json({
      status: true,
      message: "Theater updated successfully",
      theater,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error updating theater", 500, error.message));
  }
};


const deleteTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;

    // Validate theater ID
    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      return next(new AppErr("Invalid theater ID", 400));
    }

    // Check if the theater exists
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    await Theater.findByIdAndDelete(theaterId);
    res
      .status(200)
      .json({ status: "success", message: "Theater deleted successfully" });
  } catch (error) {
    next(new AppErr("Error deleting theater", 500));
  }
};


const getAllTheaterLocations = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return next(new AppErr("Branch ID is required", 400));
    }

    // Fetch all theaters for the specified branch and include location and branch details
    const theaters = await Theater.find({ branch: branchId })
      .populate("branch", "Branchname location code Number") // Populate branch details
      .select("location"); // Include only the location field from Theater

    if (!theaters || theaters.length === 0) {
      return next(new AppErr("No theater locations found for this branch", 404));
    }

    // Extract distinct locations and include the branch details
    const locations = [...new Set(theaters.map((theater) => theater.location))];

    res.status(200).json({
      status: true,
      data: {
        branch: theaters[0].branch, // Branch details (same for all theaters in this branch)
        locations, // Distinct theater locations
      },
      message: `Theater locations for branch ${branchId} fetched successfully`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(new AppErr("Error fetching theaters by branch", 500, error.message));
  }
};




// const getAllTheaterLocations = async (req, res, next) => {
//   try {
//     // Fetch distinct locations from theaters
//     const locations = await Theater.distinct("location").populate("branch")

//     if (locations.length === 0) {
//       return next(new AppErr("No locations found", 404));
//     }

//     res.status(200).json({
//       status: true,
//       data: locations,
//       message: "Theater locations fetched successfully",
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching theater locations", 500, error.message));
//   }
// };

// const getAllTheatersByBranchId = async (req, res, next) => {
//   try {
//     const { branchId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(branchId)) {
//       return next(new AppErr("Invalid branch ID", 400));
//     }

//     const theaters = await Theater.find({ branch: branchId }).populate('branch');

//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found for the given branch", 404));
//     }

//     res.status(200).json({
//       status: true,
//       data: theaters,
//       message: "Theaters fetched successfully",
//     });
//   } catch (error) {
//     console.error("Error fetching theaters by branch:", error.message);
//     next(new AppErr("Error fetching theaters", 500, error.message));
//   }
// };

const getAllTheatersByBranchId = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    const theaters = await Theater.find({ branch: branchId }).populate(
      "branch"
    );

    if (!theaters) {
      return next(new AppErr("Query failed to execute", 500));
    }

    if (theaters.length === 0) {
      return next(new AppErr("No theaters found for the given branch", 404));
    }

    res.status(200).json({
      status: true,
      data: theaters,
      message: "Theaters fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching theaters by branch:", {
      message: error.message,
      stack: error.stack,
    });
    next(new AppErr("Error fetching theaters", 500, error));
  }
};

// const getAllTheaters = async (req, res, next) => {
//   try {
//     const { date } = req.query;

//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return next(new AppErr("Invalid date format", 400));
//     }

//     const theaters = await Theater.find();
//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found", 404));
//     }

//     const availableSlotsByTheater = [];

//     for (const theater of theaters) {
//       const now = new Date();
//       const isToday = now.toDateString() === selectedDate.toDateString();

//       const availableSlots = theater.slots.filter((slot) => {
//         // Parse start and end times of the slot
//         const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

//         // Calculate slot duration and minimum required remaining time
//         const slotDurationInMs = slotEndTime - slotStartTime;
//         const slotDurationInHours = slotDurationInMs / (1000 * 60 * 60);
//         const minBookingTimeMs = 1 * (1000 * 60 * 60); // 1 hour

//         // Check if slot is already booked
//         const dateEntry = slot.dates.find(
//           (entry) => entry.date.toDateString() === selectedDate.toDateString()
//         );
//         const isBooked = dateEntry && dateEntry.status === "booked";

//         if (isBooked) return false;

//         if (isToday) {
//           const timeLeftInMs = slotEndTime - now;
//           const elapsedTimeMs = now - slotStartTime;

//           // Slot is valid if:
//           // - It's currently running and at least 1 hour is left
//           // - It hasn't started yet
//           return (
//             (slotStartTime <= now && timeLeftInMs >= minBookingTimeMs) || slotStartTime > now
//           );
//         }

//         // For future dates, slot is always valid
//         return true;
//       });

//       availableSlotsByTheater.push({
//         theaterId: theater._id,
//         name: theater.name,
//         location: theater.location,
//         capacity: theater.capacity,
//         amenities: theater.amenities,
//         price: theater.price,
//         minimumDecorationAmount: theater.minimumDecorationAmount,
//         images: theater.images,
//         availableSlots,
//       });
//     }

//     res.status(200).json({
//       status: true,
//       data: availableSlotsByTheater,
//       message: "Available slots filtered by date",
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching theaters and available slots", 500, error.message));
//   }
// };

// const getAvailableSlotsByLocation = async (req, res, next) => {
//   try {
//     const { date, location } = req.body;

//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return next(new AppErr("Invalid date format", 400));
//     }

//     const theaters = await Theater.find({ location });
//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found in the specified location", 404));
//     }

//     const availableSlotsByTheater = [];

//     for (const theater of theaters) {
//       const now = new Date();
//       const isToday = now.toDateString() === selectedDate.toDateString();

//       const availableSlots = theater.slots.filter((slot) => {
//         // Check if the slot is booked for the selected date
//         const dateEntry = slot.dates.find(
//           (entry) => entry.date.toDateString() === selectedDate.toDateString()
//         );
//         const isBooked = dateEntry && dateEntry.status === "booked";

//         if (isBooked) return false;

//         // const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         // const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

//         // if (isToday) {
//         //   const timeLeftInMilliseconds = slotEndTime - now;
//         //   const timeLeftInHours = timeLeftInMilliseconds / (1000 * 60 * 60);

//         //   return (slotStartTime <= now && timeLeftInHours >= 2) || slotStartTime > now;
//         // }
//         const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);
//         const slotDurationInMs = slotEndTime - slotStartTime;
//         const slotDurationInHours = slotDurationInMs / (1000 * 60 * 60);

//         const minAvailableTimeInMs = (slotDurationInHours - 1) * (1000 * 60 * 60);

//         if (isToday) {
//           const timeLeftInMs = slotEndTime - now;

//           // Ensure at least 1 hour of the slot remains available for the user
//           return (slotStartTime <= now && timeLeftInMs >= minAvailableTimeInMs) || slotStartTime > now;
//         }

//         return true;
//       });

//       availableSlotsByTheater.push({
//         theaterId: theater._id,
//         name: theater.name,
//         location: theater.location,
//         capacity: theater.capacity,
//         amenities: theater.amenities,
//         price: theater.price,
//         minimumDecorationAmount: theater.minimumDecorationAmount,
//         images: theater.images,
//         availableSlots,
//       });
//     }

//     res.status(200).json({
//       status: true,
//       data: availableSlotsByTheater,
//       message: "Available slots filtered by location and date",
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching available slots", 500, error.message));
//   }
// };

// Update slot statuses every 3 hours

// const getAvailableSlotsByLocation = async (req, res, next) => {
//   try {
//     const { date, location } = req.body;

//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return next(new AppErr("Invalid date format", 400));
//     }

//     const theaters = await Theater.find({ location });
//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found in the specified location", 404));
//     }

//     const availableSlotsByTheater = [];

//     for (const theater of theaters) {
//       const now = new Date();
//       const isToday = now.toDateString() === selectedDate.toDateString();

//       const availableSlots = theater.slots.filter((slot) => {
//         // Parse start and end times of the slot
//         const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

//         // Calculate slot duration and minimum required remaining time
//         const slotDurationInMs = slotEndTime - slotStartTime;
//         const slotDurationInHours = slotDurationInMs / (1000 * 60 * 60);
//         const minBookingTimeMs = 1 * (1000 * 60 * 60); // 1 hour

//         // Check if slot is already booked
//         const dateEntry = slot.dates.find(
//           (entry) => entry.date.toDateString() === selectedDate.toDateString()
//         );
//         const isBooked = dateEntry && dateEntry.status === "booked";

//         if (isBooked) return false;

//         if (isToday) {
//           const timeLeftInMs = slotEndTime - now;
//           const elapsedTimeMs = now - slotStartTime;

//           // Slot is valid if:
//           // - It's currently running and at least 1 hour is left
//           // - It hasn't started yet
//           return (
//             (slotStartTime <= now && timeLeftInMs >= minBookingTimeMs) || slotStartTime > now
//           );
//         }

//         // For future dates, slot is always valid
//         return true;
//       });

//       availableSlotsByTheater.push({
//         theaterId: theater._id,
//         name: theater.name,
//         location: theater.location,
//         capacity: theater.capacity,
//         amenities: theater.amenities,
//         price: theater.price,
//         minimumDecorationAmount: theater.minimumDecorationAmount,
//         images: theater.images,
//         availableSlots,
//       });
//     }

//     res.status(200).json({
//       status: true,
//       data: availableSlotsByTheater,
//       message: "Available slots filtered by location and date",
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching available slots", 500, error.message));
//   }
// };

const getAllTheaters = async (req, res, next) => {
  try {
    const { date } = req.query;

    const selectedDateIST = moment.tz(date, "Asia/Kolkata").startOf("day");
    if (!selectedDateIST.isValid()) {
      return next(new AppErr("Invalid date format", 400));
    }

    const theaters = await Theater.find();
    if (theaters.length === 0) {
      return next(new AppErr("No theaters found", 404));
    }

    const availableSlotsByTheater = [];
    const nowIST = moment.tz("Asia/Kolkata");

    for (const theater of theaters) {
      const isToday = nowIST.isSame(selectedDateIST, "day");

      const availableSlots = theater.slots.filter((slot) => {
        // Combine the selected date with slot times
        const slotStartTime = moment.tz(
          `${selectedDateIST.format("YYYY-MM-DD")} ${slot.startTime}`,
          "YYYY-MM-DD hh:mm A",
          "Asia/Kolkata"
        );

        let slotEndTime = moment.tz(
          `${selectedDateIST.format("YYYY-MM-DD")} ${slot.endTime}`,
          "YYYY-MM-DD hh:mm A",
          "Asia/Kolkata"
        );

        // Handle cross-midnight slot: Add 1 day to the end time if it ends after midnight
        if (slotEndTime.isBefore(slotStartTime)) {
          slotEndTime.add(1, "day");
        }

        // Check if the slot is booked
        // const dateEntry = slot.dates.find((entry) =>
        //   moment(entry.date).tz("Asia/Kolkata").isSame(selectedDateIST, "day")
        // );
        const dateEntry = slot.dates.find((entry) =>
          moment(entry.date).utcOffset("+05:30").isSame(selectedDateIST, "day")
        );

        const isBooked = dateEntry && dateEntry.status === "booked";
        if (isBooked) return false;

        // Condition 1: If it's today, exclude past slots
        if (isToday) {
          const timeLeftInMs = slotEndTime.diff(nowIST);
          const elapsedTimeMs = nowIST.diff(slotStartTime);

          // Check if slot has at least 1 hour remaining
          const minBookingTimeMs = 1 * 60 * 60 * 1000; // 1 hour in ms
          if (
            (slotStartTime.isBefore(nowIST) &&
              timeLeftInMs < minBookingTimeMs) || // Running but less than 1 hour left
            slotEndTime.isBefore(nowIST) // Already ended
          ) {
            return false;
          }
        }

        // Condition 2: For future dates, slots are always valid
        return true;
      });

      availableSlotsByTheater.push({
        theaterId: theater._id,
        name: theater.name,
        location: theater.location,
        capacity: theater.capacity,
        amenities: theater.amenities,
        price: theater.price,
        minimumDecorationAmount: theater.minimumDecorationAmount,
        images: theater.images,
        availableSlots,
        slots:theater.slots
      });
    }

    res.status(200).json({
      status: true,
      data: availableSlotsByTheater,
      message: "Available slots filtered by date",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(
      new AppErr(
        "Error fetching theaters and available slots",
        500,
        error.message
      )
    );
  }
};

const getAvailableSlotsByLocation = async (req, res, next) => {
  try {
    const { date, location } = req.body;

    // Parse the selected date in IST
    const selectedDateIST = moment.tz(date, "Asia/Kolkata").startOf("day");
    if (!selectedDateIST.isValid()) {
      return next(new AppErr("Invalid date format", 400));
    }

    const theaters = await Theater.find({ location });
    if (theaters.length === 0) {
      return next(
        new AppErr("No theaters found in the specified location", 404)
      );
    }

    const availableSlotsByTheater = [];
    const nowIST = moment.tz("Asia/Kolkata");

    for (const theater of theaters) {
      const isToday = nowIST.isSame(selectedDateIST, "day");

      const availableSlots = theater.slots.filter((slot) => {
        // Combine the selected date with slot times
        const slotStartTime = moment.tz(
          `${selectedDateIST.format("YYYY-MM-DD")} ${slot.startTime}`,
          "YYYY-MM-DD hh:mm A",
          "Asia/Kolkata"
        );

        let slotEndTime = moment.tz(
          `${selectedDateIST.format("YYYY-MM-DD")} ${slot.endTime}`,
          "YYYY-MM-DD hh:mm A",
          "Asia/Kolkata"
        );

        // Handle cross-midnight slot: Add 1 day to the end time if it ends after midnight
        if (slotEndTime.isBefore(slotStartTime)) {
          slotEndTime.add(1, "day");
        }

        // Check if the slot is booked
        // const dateEntry = slot.dates.find((entry) =>
        //   moment(entry.date).tz("Asia/Kolkata").isSame(selectedDateIST, "day")
        // );
        const dateEntry = slot.dates.find((entry) =>
          moment(entry.date).utcOffset("+05:30").isSame(selectedDateIST, "day")
        );

        if (dateEntry) {
          console.log("Matched Entry:", dateEntry);
        } else {
          console.log(
            "No Match for Date:",
            selectedDateIST.format("YYYY-MM-DD")
          );
        }

        const isBooked = dateEntry && dateEntry.status === "booked";
        if (isBooked) return false;

        // Condition 1: If it's today, exclude past slots
        if (isToday) {
          const timeLeftInMs = slotEndTime.diff(nowIST);
          const elapsedTimeMs = nowIST.diff(slotStartTime);

          // Check if slot has at least 1 hour remaining
          const minBookingTimeMs = 1 * 60 * 60 * 1000; // 1 hour in ms
          if (
            (slotStartTime.isBefore(nowIST) &&
              timeLeftInMs < minBookingTimeMs) || // Running but less than 1 hour left
            slotEndTime.isBefore(nowIST) // Already ended
          ) {
            return false;
          }
        }

        // Condition 2: For future dates, slots are always valid
        return true;
      });

      availableSlotsByTheater.push({
        theaterId: theater._id,
        name: theater.name,
        location: theater.location,
        groupSize: theater.maxCapacity,
        capacity:theater.groupSize,
        amenities: theater.amenities,
        price: theater.price,
        minimumDecorationAmount: theater.minimumDecorationAmount,
        images: theater.images,
        availableSlots,
        slots:theater.slots
      });
    }

    res.status(200).json({
      status: true,
      data: availableSlotsByTheater,
      message: "Available slots filtered by location and date",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(new AppErr("Error fetching available slots", 500, error.message));
  }
};

const getTheaterAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const { theaterId } = req.params;

    // Validate inputs
    if (!theaterId || !year) {
      return res
        .status(400)
        .json({ message: "Theater ID and year are required." });
    }

    // Find the theater
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ message: "Theater not found." });
    }

    // Define the date range for the year
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch bookings within the date range for the given theater
    const bookings = await Booking.aggregate([
      {
        $match: {
          theater: theater._id,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$TotalAmount" },
        },
      },
      {
        $project: {
          month: "$_id",
          totalBookings: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Generate a full monthly report, filling in months without data
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formattedData = Array.from({ length: 12 }, (_, index) => {
      const monthData = bookings.find((b) => b.month === index + 1);
      return {
        month: months[index],
        totalBookings: monthData?.totalBookings || 0,
        totalRevenue: monthData?.totalRevenue || 0,
      };
    });

    res.json({
      theater: theater.name,
      year,
      analytics: formattedData,
    });
  } catch (error) {
    console.error("Error fetching theater analytics:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// const getAllTheaterAnalytics = async (req, res) => {
//   try {
//     const { year } = req.query;

//     // Validate input
//     if (!year) {
//       return res.status(400).json({ message: "Year is required." });
//     }

//     // Define the date range for the year
//     const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
//     const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

//     // Fetch all theaters
//     const theaters = await Theater.find({});
//     if (!theaters || theaters.length === 0) {
//       return res.status(404).json({ message: "No theaters found." });
//     }

//     // Aggregate bookings for all theaters
//     const bookings = await Booking.aggregate([
//       {
//         $match: {
//           date: { $gte: startOfYear, $lte: endOfYear },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: "$date" },
//           totalBookings: { $sum: 1 },
//           totalRevenue: { $sum: "$TotalAmount" },
//         },
//       },
//       {
//         $project: {
//           month: "$_id",
//           totalBookings: 1,
//           totalRevenue: 1,
//           _id: 0,
//         },
//       },
//       { $sort: { month: 1 } },
//     ]);

//     // Generate a full monthly report, filling in months without data
//     const months = [
//       "January",
//       "February",
//       "March",
//       "April",
//       "May",
//       "June",
//       "July",
//       "August",
//       "September",
//       "October",
//       "November",
//       "December",
//     ];

//     const formattedData = Array.from({ length: 12 }, (_, index) => {
//       const monthData = bookings.find((b) => b.month === index + 1);
//       return {
//         month: months[index],
//         totalBookings: monthData?.totalBookings || 0,
//         totalRevenue: monthData?.totalRevenue || 0,
//       };
//     });

//     res.json({
//       year,
//       analytics: formattedData,
//     });
//   } catch (error) {
//     console.error("Error fetching all theater analytics:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

const getAllTheaterAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
      const {branchId}=req.params
    // Validate inputs
    if (!year) {
      return res.status(400).json({ message: "Year is required." });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required." });
    }

    // Define the date range for the year
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch all theaters for the branch
    const theaters = await Theater.find({ branch: branchId });
    if (!theaters || theaters.length === 0) {
      return res.status(404).json({ message: "No theaters found for the specified branch." });
    }

    // Extract theater IDs to filter bookings
    const theaterIds = theaters.map((theater) => theater._id);

    // Aggregate bookings for the filtered theaters
    const bookings = await Booking.aggregate([
      {
        $match: {
          theater: { $in: theaterIds },
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$TotalAmount" },
        },
      },
      {
        $project: {
          month: "$_id",
          totalBookings: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Generate a full monthly report, filling in months without data
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formattedData = Array.from({ length: 12 }, (_, index) => {
      const monthData = bookings.find((b) => b.month === index + 1);
      return {
        month: months[index],
        totalBookings: monthData?.totalBookings || 0,
        totalRevenue: monthData?.totalRevenue || 0,
      };
    });

    res.json({
      year,
      branchId,
      analytics: formattedData,
    });
  } catch (error) {
    console.error("Error fetching theater analytics:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


const getHourlyTheaterAnalytics = async (req, res) => {
  try {
    const { date } = req.query; // Accept a specific date (e.g., "2024-12-01")
    const { theaterId } = req.params;

    // Validate inputs
    if (!theaterId || !date) {
      return res
        .status(400)
        .json({ message: "Theater ID and date are required." });
    }

    // Find the theater
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ message: "Theater not found." });
    }

    // Define the date range for the selected date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Fetch bookings within the date range for the given theater
    const bookings = await Booking.aggregate([
      {
        $match: {
          theater: theater._id,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$TotalAmount" },
        },
      },
      {
        $project: {
          hour: "$_id",
          totalBookings: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
      { $sort: { hour: 1 } },
    ]);

    // Generate a full hourly report, filling in hours without data
    const hours = Array.from({ length: 24 }, (_, index) => index); // [0, 1, ..., 23]
    const formattedData = hours.map((hour) => {
      const hourData = bookings.find((b) => b.hour === hour);
      return {
        hour: `${hour}:00 - ${hour + 1}:00`,
        totalBookings: hourData?.totalBookings || 0,
        totalRevenue: hourData?.totalRevenue || 0,
      };
    });

    res.json({
      theater: theater.name,
      date,
      analytics: formattedData,
    });
  } catch (error) {
    console.error("Error fetching hourly theater analytics:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getHourlyAllTheatersAnalytics = async (req, res) => {
  try {
    const { date } = req.query; // Accept a specific date (e.g., "2024-12-01")
    const {branchId}=req.params
    // Validate input
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required." });
    } 

    // Define the date range for the selected date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Fetch all theaters
    const theaters = await Theater.find({ branch: branchId });
    if (!theaters || theaters.length === 0) {
      return res.status(404).json({ message: "No theaters found." });
    }

    // Array to hold aggregated hourly data
    const hours = Array.from({ length: 24 }, (_, index) => index); // [0, 1, ..., 23]
    const aggregatedData = hours.map((hour) => ({
      hour: `${hour}:00 - ${hour + 1}:00`,
      totalBookings: 0,
      totalRevenue: 0,
    }));

    // Iterate through theaters to aggregate analytics
    for (const theater of theaters) {
      const bookings = await Booking.aggregate([
        {
          $match: {
            theater: theater._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$TotalAmount" },
          },
        },
        {
          $project: {
            hour: "$_id",
            totalBookings: 1,
            totalRevenue: 1,
            _id: 0,
          },
        },
      ]);

      // Merge data into aggregatedData
      bookings.forEach((booking) => {
        const hourIndex = booking.hour; // Match by hour index
        if (aggregatedData[hourIndex]) {
          aggregatedData[hourIndex].totalBookings += booking.totalBookings;
          aggregatedData[hourIndex].totalRevenue += booking.totalRevenue;
        }
      });
    }

    res.json({ date, analytics: aggregatedData });
  } catch (error) {
    console.error("Error fetching aggregated theater analytics:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};




module.exports = {
  createTheater,
  getTheaterById,
  getAvailableSlots,
  updateTheater,
  deleteTheater,
  getAllTheaters,
  getAvailableSlotsByLocation,
  getAllTheaterLocations,
  getAllTheatersByBranchId,
  getTheaterAnalytics,
  getAllTheaterAnalytics,
  getHourlyTheaterAnalytics,
  getHourlyAllTheatersAnalytics
};
