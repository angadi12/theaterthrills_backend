// controllers/theaterController.js
const mongoose = require('mongoose'); // Ensure mongoose is imported
const Theater= require('../Model/Theater');
// const moment = require('moment');
const AppErr = require("../Services/AppErr");
const Booking = require('../Model/Booking'); // Adjust the path to your model
const { validationResult } = require("express-validator");
const cron = require('node-cron');

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
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const { name, location, capacity, amenities, slots, price, minimumDecorationAmount, images } = req.body;

    // Validate slots structure
    if (!Array.isArray(slots) || slots.some(slot => !slot.startTime || !slot.endTime)) {
      return next(new AppErr("Each slot must have a startTime and endTime", 400));
    }

    // Initialize slots with empty dates
    const initializedSlots = slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      dates: [], // Initialize dates as an empty array
    }));

    // Create and save the theater
    const theater = new Theater({
      name,
      location,
      capacity,
      amenities,
      slots: initializedSlots,
      images,
      price,
      minimumDecorationAmount,
    });

    await theater.save();

    res.status(201).json({ status: true, message: "Theater created successfully", theater });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error creating theater", 500, error.message));
  }
};




// Get a theater by ID
const getTheaterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr('Invalid theater ID', 400));
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      return next(new AppErr('Theater not found', 404));
    }

    res.status(200).json(theater);
  } catch (error) {
    console.log(error)
    next(new AppErr('Error fetching theater', 500));
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
      status: "booked"
    }).select("slot");

    console.log("Booked Slots:", bookedSlots);

    const bookedSlotIds = new Set(bookedSlots.map(booking => booking.slot.toString()));

    // Get current date for comparison
    const now = new Date();
    const isToday = now.toDateString() === selectedDate.toDateString();

    // Filter available slots
    const availableSlots = theater.slots.filter(slot => {
      const slotId = slot._id.toString();
      if (bookedSlotIds.has(slotId)) return false;

      if (isToday) {
        const [slotHours, slotMinutes, slotPeriod] = slot.startTime.match(/(\d+):(\d+)\s?(AM|PM)/i).slice(1);
        const slotDate = new Date(now);
        slotDate.setHours(
          slotPeriod.toUpperCase() === "PM" && slotHours !== "12" ? +slotHours + 12 : +slotHours % 12,
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
  try {
    const { theaterId } = req.params;
    const { name, location, capacity, amenities, slots } = req.body;

    // Validate theater ID
    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      return next(new AppErr('Invalid theater ID', 400));
    }

    // Check if the theater exists
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr('Theater not found', 404));
    }

    // Validate and update theater fields if they are provided
    if (name) theater.name = name;
    if (location) theater.location = location;
    if (capacity && capacity > 0) theater.capacity = capacity;
    if (amenities) theater.amenities = amenities;

    // Validate and update slots if provided
    if (slots && Array.isArray(slots)) {
      for (const slot of slots) {
        if (!slot.startTime || !slot.endTime) {
          return next(new AppErr('Each slot must have a startTime and endTime', 400));
        }
      }
      theater.slots = slots; // Updating the slots with the new array
    }

    await theater.save();
    res.status(200).json({ message: 'Theater updated successfully', theater });
  } catch (error) {
    next(new AppErr('Error updating theater', 500));
  }
};


const deleteTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;

    // Validate theater ID
    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
      return next(new AppErr('Invalid theater ID', 400));
    }

    // Check if the theater exists
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr('Theater not found', 404));
    }

    await Theater.findByIdAndDelete(theaterId);
    res.status(200).json({ message: 'Theater deleted successfully' });
  } catch (error) {
    next(new AppErr('Error deleting theater', 500));
  }
};



const getAllTheaterLocations = async (req, res, next) => {
  try {
    // Fetch distinct locations from theaters
    const locations = await Theater.distinct("location");

    if (locations.length === 0) {
      return next(new AppErr("No locations found", 404));
    }

    res.status(200).json({
      status: true,
      data: locations,
      message: "Theater locations fetched successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(new AppErr("Error fetching theater locations", 500, error.message));
  }
};






// const getAllTheaters = async (req, res, next) => {
//   try {
//     const { date } = req.query;
//     console.log(date);

//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return next(new AppErr("Invalid date format", 400));
//     }

//     const theaters = await Theater.find().populate("slots");
//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found", 404));
//     }

//     const availableSlotsByTheater = [];

//     for (const theater of theaters) {
//       const bookedSlotIds = theater.slots
//       .filter(slot => slot.status === "booked") 
//       .map(slot => slot._id.toString());
    


//       const now = new Date();
//       const isToday = now.toDateString() === selectedDate.toDateString();

//       const availableSlots = theater.slots.filter((slot) => {
//         if (bookedSlotIds.includes(slot._id.toString())) return false;

//         const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

//         if (isToday) {
//           const timeLeftInMilliseconds = slotEndTime - now;
//           const timeLeftInHours = timeLeftInMilliseconds / (1000 * 60 * 60);

//           return (slotStartTime <= now && timeLeftInHours >= 2) || slotStartTime > now;
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
//       message: "Available slots filtered by date",
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching theaters and available slots", 500, error.message));
//   }
// };


const getAllTheaters = async (req, res, next) => {
  try {
    const { date } = req.query;

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return next(new AppErr("Invalid date format", 400));
    }

    const theaters = await Theater.find();
    if (theaters.length === 0) {
      return next(new AppErr("No theaters found", 404));
    }

    const availableSlotsByTheater = [];

    for (const theater of theaters) {
      const now = new Date();
      const isToday = now.toDateString() === selectedDate.toDateString();

      const availableSlots = theater.slots.filter((slot) => {
        // Check if the slot is booked for the selected date
        const dateEntry = slot.dates.find((entry) => entry.date.toDateString() === selectedDate.toDateString());
        const isBooked = dateEntry && dateEntry.status === 'booked';

        if (isBooked) return false;

        const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
        const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

        if (isToday) {
          const timeLeftInMilliseconds = slotEndTime - now;
          const timeLeftInHours = timeLeftInMilliseconds / (1000 * 60 * 60);

          return (slotStartTime <= now && timeLeftInHours >= 2) || slotStartTime > now;
        }

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
      });
    }

    res.status(200).json({
      status: true,
      data: availableSlotsByTheater,
      message: "Available slots filtered by date",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(new AppErr("Error fetching theaters and available slots", 500, error.message));
  }
};



// const getAvailableSlotsByLocation = async (req, res, next) => {
//   try {
//     const { date, location } = req.body;
//     console.log(date);

//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return next(new AppErr("Invalid date format", 400));
//     }

//     const theaters = await Theater.find({ location }).populate("slots");
//     if (theaters.length === 0) {
//       return next(new AppErr("No theaters found in the specified location", 404));
//     }

//     const availableSlotsByTheater = [];

//     for (const theater of theaters) {
//       // Fetch booked slots directly from the Slot model
//       const bookedSlotIds = theater.slots
//       .filter(slot => slot.status === "booked") // Check for booked status only
//       .map(slot => slot._id.toString());
    


//       const now = new Date();
//       const isToday = now.toDateString() === selectedDate.toDateString();

//       const availableSlots = theater.slots.filter((slot) => {
//         if (bookedSlotIds.includes(slot._id.toString())) return false;

//         const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
//         const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

//         if (isToday) {
//           const timeLeftInMilliseconds = slotEndTime - now;
//           const timeLeftInHours = timeLeftInMilliseconds / (1000 * 60 * 60);

//           return (slotStartTime <= now && timeLeftInHours >= 2) || slotStartTime > now;
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
//     console.log(error)
//     console.error("Error:", error.message);
//     next(new AppErr("Error fetching available slots", 500, error.message));
//   }
// };

const getAvailableSlotsByLocation = async (req, res, next) => {
  try {
    const { date, location } = req.body;

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return next(new AppErr("Invalid date format", 400));
    }

    const theaters = await Theater.find({ location });
    if (theaters.length === 0) {
      return next(new AppErr("No theaters found in the specified location", 404));
    }

    const availableSlotsByTheater = [];

    for (const theater of theaters) {
      const now = new Date();
      const isToday = now.toDateString() === selectedDate.toDateString();

      const availableSlots = theater.slots.filter((slot) => {
        // Check if the slot is booked for the selected date
        const dateEntry = slot.dates.find(
          (entry) => entry.date.toDateString() === selectedDate.toDateString()
        );
        const isBooked = dateEntry && dateEntry.status === "booked";

        if (isBooked) return false;

        const slotStartTime = new Date(`${selectedDate.toDateString()} ${slot.startTime}`);
        const slotEndTime = new Date(`${selectedDate.toDateString()} ${slot.endTime}`);

        if (isToday) {
          const timeLeftInMilliseconds = slotEndTime - now;
          const timeLeftInHours = timeLeftInMilliseconds / (1000 * 60 * 60);

          return (slotStartTime <= now && timeLeftInHours >= 2) || slotStartTime > now;
        }

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




// cron.schedule('0 */3 * * *', async () => { // Run every 3 hours
//   try {
//     const now = new Date();
//     const currentTime = now.toTimeString().split(' ')[0]; // Get current time

//     const theaters = await Theater.find(); // Get all theaters with embedded slots

//     for (const theater of theaters) {
//       let updated = false;

//       theater.slots.forEach(slot => {
//         const slotEndTime = new Date(`${now.toDateString()} ${slot.endTime}`);

//         // If slot's end time has passed, update status
//         if (slotEndTime <= now && slot.status === 'booked') {
//           slot.status = 'available';
//           updated = true;
//         }
//       });

//       if (updated) {
//         await theater.save(); // Save only if changes were made
//       }
//     }

//     console.log('Slot statuses updated.');
//   } catch (error) {
//     console.error('Error updating slot statuses:', error);
//   }
// });



// cron.schedule('0 0 * * *', async () => {
//   try {
//     const theaters = await Theater.find(); // Fetch all theaters

//     for (const theater of theaters) {
//       let updated = false;

//       theater.slots.forEach(slot => {
//         // Reset all slots to "available" for the new day
//         if (slot.status !== 'available') {
//           slot.status = 'available';
//           updated = true;
//         }
//       });

//       if (updated) {
//         await theater.save(); // Save the changes only if slots were
//       }
//     }

//     console.log('All slots reset to available for the next day.');
//   } catch (error) {
//     console.error('Error resetting slots:', error);
//   }
// });



// Update slot statuses every 3 hours
cron.schedule('0 */3 * * *', async () => {
  try {
    const now = new Date();
    const currentDateString = now.toDateString();

    const theaters = await Theater.find();

    for (const theater of theaters) {
      let updated = false;

      theater.slots.forEach(slot => {
        slot.dates.forEach(dateEntry => {
          const entryDate = new Date(dateEntry.date).toDateString();
          const slotEndTime = new Date(`${entryDate} ${slot.endTime}`);

          // If the date is today and end time has passed, update status
          if (entryDate === currentDateString && slotEndTime <= now && dateEntry.status === 'booked') {
            dateEntry.status = 'available';
            updated = true;
          }
        });
      });

      if (updated) {
        await theater.save();
      }
    }

    console.log('Slot statuses updated based on current time.');
  } catch (error) {
    console.error('Error updating slot statuses:', error);
  }
});

// Reset slot statuses and clean up past dates at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const theaters = await Theater.find();

    for (const theater of theaters) {
      let updated = false;

      theater.slots.forEach(slot => {
        // Reset future dates to 'available' and remove past dates
        slot.dates = slot.dates.filter(dateEntry => {
          const entryDate = new Date(dateEntry.date);

          if (entryDate < now.setHours(0, 0, 0, 0)) {
            return false; // Remove past dates
          }

          if (entryDate >= now && dateEntry.status !== 'available') {
            dateEntry.status = 'available'; // Reset future dates to 'available'
            updated = true;
          }

          return true;
        });
      });

      if (updated) {
        await theater.save();
      }
    }

    console.log('Slots reset to available for the new day, past dates removed.');
  } catch (error) {
    console.error('Error resetting and cleaning up slots:', error);
  }
});




module.exports = {
  createTheater,
  getTheaterById,
  getAvailableSlots,
  updateTheater,
  deleteTheater,
  getAllTheaters,
  getAvailableSlotsByLocation,
  getAllTheaterLocations
  };
  