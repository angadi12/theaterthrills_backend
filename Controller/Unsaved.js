const mongoose = require("mongoose");
const AppErr = require("../Services/AppErr");
const UnsavedBooking = require("../Model/Unsaved");
const { validationResult } = require("express-validator");

 



const saveUnsavedBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
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
      // numberOfPeople,
      addDecorations,
      nickname,
      partnerNickname,
      Occasionobject,
      selectedCakes,
      cakeText,
      isEggless,
      addOns,
      paymentAmount,
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
      date: selectedDate,
      fullName,
      phoneNumber,
      whatsappNumber,
      email,
      // numberOfPeople,
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



module.exports = {
    saveUnsavedBooking,
    getAllUnsavedBookings,
    getUnsavedBookingById,
};
