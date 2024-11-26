const mongoose = require("mongoose");
const AppErr = require("../Services/AppErr");
const UnsavedBooking = require("../Model/Unsaved");
const { validationResult } = require("express-validator");
const Theater = require("../Model/Theater");

 



const saveUnsavedBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const {
      user,
      theaterId,
      slotId,
      date,
      fullName,
      phoneNumber,
      whatsappNumber,
      email,
      numberOfPeople,
      addDecorations,
      nickname,
      partnerNickname,
      Occasionobject,
      selectedCakes,
      cakeText,
      isEggless,
      addOns,
      paymentAmount,
      paymentStatus,
      TotalAmount,
      orderId
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(theaterId) ||
      !mongoose.Types.ObjectId.isValid(slotId)
    ) {
      return next(new AppErr("Invalid theater or slot ID", 400));
    }

    const booking = new UnsavedBooking({
      user,
      theater: theaterId,
      slot: slotId,
      date: date,
      fullName,
      phoneNumber,
      whatsappNumber,
      email,
      numberOfPeople,
      decorations: addDecorations,
      nickname,
      partnerNickname,
      Occasionobject,
      selectedCakes,
      cakeText,
      isEggless,
      addOns,
      paymentAmount,
      TotalAmount,
      orderId,
      paymentStatus: "pending",
      bookingId: `BK-${Date.now()}`, // Unique Booking ID
    });

    await booking.save();



    res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(new AppErr("Error creating booking", 500));
  }
};



// const populateBookingWithSlot = async (bookings) => {
//   return Promise.all(
//     bookings.map(async (booking) => {
//       const theater = await Theater.findById(booking.theater);
//       if (!theater) return { ...booking.toObject(), slot: null, addons: [] };

//       const slot = theater.slots.id(booking.slot);
//       if (!slot) return { ...booking.toObject(), slot: null, addons: [] };

//       // Find the specific date entry for the booking
//       const dateEntry = slot.dates.find(
//         (entry) => entry.date.toISOString() === booking.date.toISOString()
//       );

//       // Extract add-ons if they're embedded in the slot or booking
//       const addons = slot.addons || booking.addons || []; // Assuming addons are part of the slot or booking structure

//       return {
//         ...booking.toObject(),
//         slot: slot
//           ? { ...slot.toObject(), dateStatus: dateEntry || null }
//           : null,
//         addons, // Add-ons data from slot or booking
//       };
//     })
//   );
// };

const getAllUnsavedBookings = async (req, res, next) => {
  try {
    const bookings = await UnsavedBooking.find().populate("user theater");
    res.status(200).json({ success: true, data:bookings  });
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    next(new AppErr("Error fetching bookings", 500));
  }
};

const getUnsavedBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid booking ID", 400));
    }

    const booking = await UnsavedBooking.findById(id);

    if (!booking) {
      return next(new AppErr("Booking not found", 404));
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(new AppErr("Error fetching booking", 500));
  }
};

;

// const getAllunsavedBookingByTheaterId = async (req, res, next) => {
//   try {
//     const { theaterId } = req.params;

//     // Validate the theater ID
//     if (!mongoose.Types.ObjectId.isValid(theaterId)) {
//       return next(new AppErr("Invalid theater ID", 400));
//     }

//     // Fetch bookings for the specific theater ID
//     const bookings = await UnsavedBooking.find({ theater: theaterId }).populate("user theater");

//     if (!bookings.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No bookings found for this theater",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: bookings,
//     });
//   } catch (error) {
//     console.error("Error fetching bookings by theater ID:", error.message);
//     next(new AppErr("Error fetching bookings by theater ID", 500));
//   }
// };

const getAllunsavedBookingByTheaterId = async (req, res) => {
  const { theaterId } = req.params;

  try {
    if (!theaterId) {
      return res.status(400).json({ message: "Theater ID is required" });
    }

    const bookings = await UnsavedBooking.find({ theater: theaterId })
      .populate("user")
      .populate("theater") 
      .sort({ date: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: "Nobookings" });
    }

    const theater = await Theater.findById(theaterId).select("slots").lean();
    if (!theater) {
      return res.status(404).json({ message: "Theater not found" });
    }
    const enrichedBookings = bookings.map(booking => {
      const slotDetails = theater.slots.find(slot => slot._id.toString() === booking.slot.toString());
      if (!slotDetails) {
        console.warn(`Slot not found for booking ID: ${booking._id}`);
      }
      return {
        ...booking,
        slotDetails: slotDetails || null, // Add `null` if slot not found
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};




module.exports = {
    saveUnsavedBooking,
    getAllUnsavedBookings,
    getUnsavedBookingById,
    getAllunsavedBookingByTheaterId
};
