const mongoose = require("mongoose");
const Theater = require("../Model/Theater");
const AppErr = require("../Services/AppErr");
const Booking = require("../Model/Booking");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const razorpayInstance = require("../Services/Razorpayinstance");

// const createBooking = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     console.log(errors)
//     if (!errors.isEmpty()) {
//       return next(new AppErr('Validation failed', 400, errors.array()));
//     }

//     const {
//       user,
//       theaterId,
//       slotId,
//       date,
//       fullName,
//       phoneNumber,
//       whatsappNumber,
//       email,
//       numberOfPeople,
//       addDecorations,
//       nickname,
//       partnerNickname,
//       Occasionobject,
//       selectedCakes,
//       cakeText,
//       isEggless,
//       addOns,
//       paymentAmount,
//       TotalAmount
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(theaterId) || !mongoose.Types.ObjectId.isValid(slotId)) {
//       return next(new AppErr('Invalid theater or slot ID', 400));
//     }

//     // Find theater and validate slot
//     const theater = await Theater.findById(theaterId);
//     if (!theater) {
//       return next(new AppErr('Theater not found', 404));
//     }

//     const slot = theater.slots.id(slotId);
//     if (!slot || slot.status === 'booked') {
//       return next(new AppErr('Slot is unavailable', 400));
//     }

//     // Check if the slot is already booked
//     if (slot.status === 'booked') {
//       return next(new AppErr('Slot is already booked for the selected date', 400));
//     }

//     // Create booking with pending payment status
//     const booking = new Booking({
//       user,
//       theater: theaterId,
//       slot: slotId,
//       date: new Date(date),
//       fullName,
//       phoneNumber,
//       whatsappNumber,
//       email,
//       numberOfPeople,
//       decorations: addDecorations,
//       nickname,
//       partnerNickname,
//       Occasionobject,
//       selectedCakes,
//       cakeText,
//       isEggless,
//       addOns,
//       paymentAmount,
//       TotalAmount,
//       paymentStatus: 'pending',
//       bookingId: `BK-${Date.now()}`, // Unique Booking ID
//     });

//     await booking.save();

//     slot.status = 'booked';
//     await theater.save();

//     // Create Razorpay order
//     const razorpayOrder = await razorpayInstance.orders.create({
//       amount: paymentAmount * 100, // Convert to paise
//       currency: 'INR',
//       receipt: booking.bookingId,
//     });

//     res.status(201).json({
//       success:true,
//       message: 'Booking created successfully, proceed to payment',
//       booking,
//       order: razorpayOrder,
//     });
//   } catch (error) {
//     console.log(error)
//     next(new AppErr('Error creating booking', 500));
//   }
// };

const createRazorpayOrder = async (req, res, next) => {
  const { theaterId, slotId, date, paymentAmount } = req.body;

  try {
    // Fetch the theater by ID
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    // Find the specific slot within the theater
    const slot = theater.slots.id(slotId);
    if (!slot) {
      return next(new AppErr("Slot not found", 404));
    }

    const selectedDate = new Date(date);

    // Check if the slot is already booked for the selected date
    const existingDateEntry = slot.dates.find(
      (d) => d.date.toISOString() === selectedDate.toISOString()
    );
    if (existingDateEntry && existingDateEntry.status === "booked") {
      return next(
        new AppErr("Slot is already booked for the selected date", 400)
      );
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: paymentAmount * 100, // Convert to paise
      currency: "INR",
    });

    res.status(200).json({ success: true, order: razorpayOrder });
  } catch (error) {
    next(new AppErr("Error creating Razorpay order", 500));
  }
};

const createBooking = async (req, res, next) => {
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
      TotalAmount,
      orderId
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(theaterId) ||
      !mongoose.Types.ObjectId.isValid(slotId)
    ) {
      return next(new AppErr("Invalid theater or slot ID", 400));
    }

    // Find the theater and validate slot
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    const slot = theater.slots.id(slotId);
    if (!slot) {
      return next(new AppErr("Slot not found", 404));
    }

    const selectedDate = new Date(date);

    // Check if the slot is already booked for the selected date
    const existingDateEntry = slot.dates.find(
      (d) => d.date.toISOString() === selectedDate.toISOString()
    );
    if (existingDateEntry && existingDateEntry.status === "booked") {
      return next(
        new AppErr("Slot is already booked for the selected date", 400)
      );
    }

    // Create booking with pending payment status
    const booking = new Booking({
      user,
      theater: theaterId,
      slot: slotId,
      date: selectedDate,
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
      paymentStatus: "completed",
      bookingId: `BK-${Date.now()}`, // Unique Booking ID
    });

    await booking.save();

    // Update slot date status after booking is successfully created
    if (!existingDateEntry) {
      slot.dates.push({ date: selectedDate, status: "booked" });
    } else {
      existingDateEntry.status = "booked";
    }

    await theater.save();

    // // Create Razorpay order
    // const razorpayOrder = await razorpayInstance.orders.create({
    //   amount: paymentAmount * 100, // Convert to paise
    //   currency: 'INR',
    //   receipt: booking.bookingId,
    // });

    res.status(201).json({
      success: true,
      message: "Booking created successfully, proceed to payment",
      // booking,
      // order: razorpayOrder,
    });
  } catch (error) {
    console.log(error);
    next(new AppErr("Error creating booking", 500));
  }
};

const verifyPayment = async (req, res, next) => {
  console.log(req.body);
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return next(new AppErr("Payment verification failed", 400));
    }

    // Update booking to completed payment status
    // const updatedBooking = await Booking.findOneAndUpdate(
    //   { bookingId },
    //   { paymentStatus: 'completed', orderId: razorpayOrderId },
    //   { new: true }
    // );

    // if (!updatedBooking) {
    //   return next(new AppErr('Booking not found', 404));
    // }

    res.status(200).json({
      success: true,
      message: "Payment verified and booking updated",
      orderId: razorpayOrderId,
    });
  } catch (error) {
    next(new AppErr("Error verifying payment", 500));
  }
};

const populateBookingWithSlot = async (bookings) => {
  return Promise.all(
    bookings.map(async (booking) => {
      const theater = await Theater.findById(booking.theater);
      if (!theater) return { ...booking.toObject(), slot: null, addons: [] };

      const slot = theater.slots.id(booking.slot);
      if (!slot) return { ...booking.toObject(), slot: null, addons: [] };

      // Find the specific date entry for the booking
      const dateEntry = slot.dates.find(
        (entry) => entry.date.toISOString() === booking.date.toISOString()
      );

      // Extract add-ons if they're embedded in the slot or booking
      const addons = slot.addons || booking.addons || []; // Assuming addons are part of the slot or booking structure

      return {
        ...booking.toObject(),
        slot: slot
          ? { ...slot.toObject(), dateStatus: dateEntry || null }
          : null,
        addons, // Add-ons data from slot or booking
      };
    })
  );
};

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("user theater");
    const populatedBookings = await populateBookingWithSlot(bookings);

    res.status(200).json({ success: true, data: populatedBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    next(new AppErr("Error fetching bookings", 500));
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid booking ID", 400));
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return next(new AppErr("Booking not found", 404));
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(new AppErr("Error fetching booking", 500));
  }
};

// Get bookings by user ID
// const getBookingByUserId = async (req, res, next) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return next(new AppErr('Invalid user ID', 400));
//     }

//     const bookings = await Booking.find({ user: userId }).populate('user theater');
//     console.log(bookings)
//     if (bookings.length === 0) {
//       return next(new AppErr('No bookings found for this user', 404));
//     }

//     const populatedBookings = await populateBookingWithSlot(bookings);
//     console.log(populatedBookings)
//     res.status(200).json({ success: true, data: populatedBookings });
//   } catch (error) {
//     next(new AppErr('Error fetching bookings for user', 500));
//   }
// };

const getBookingByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Fetch bookings for the given user
    const bookings = await Booking.find({ user: userId }).populate(
      "user",
      "name email"
    );

    if (!bookings.length) {
      return res
        .status(404)
        .json({ success: false, message: "No bookings found for this user" });
    }

    // Enhance each booking with theater and slot details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const theater = await Theater.findById(booking.theater);
        if (!theater) {
          return { ...booking.toObject(), theater: null, slot: null };
        }

        const slot = theater.slots.id(booking.slot);
        if (!slot) {
          return { ...booking.toObject(), slot: null };
        }

        // Adding slot, theater, and addon details to the response
        return {
          ...booking.toObject(),
          theater: {
            name: theater.name,
            location: theater.location,
            capacity: theater.capacity,
            amenities: theater.amenities,
            price: theater.price,
            images: theater.images,
          },
          slot: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            dates: slot.dates.map((d) => ({
              date: d.date,
              status: d.status,
            })),
          },
          Addons: booking.addOns,
          Cakes: booking.selectedCakes || {},
        };
      })
    );

    res.status(200).json({ success: true, data: enrichedBookings });
  } catch (error) {
    console.error("Error fetching bookings by user ID:", error.message);
    next(new AppErr("Error fetching bookings", 500));
  }
};


const getAllBookingByTheaterId = async (req, res) => {
  const { theaterId } = req.params;

  try {
    if (!theaterId) {
      return res.status(400).json({ message: "Theater ID is required" });
    }

    const bookings = await Booking.find({ theater: theaterId })
      .populate("user")
      .populate("theater") 
      .sort({ date: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this theater" });
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
  createBooking,
  verifyPayment,
  getAllBookings,
  getBookingById,
  getBookingByUserId,
  createRazorpayOrder,
  getAllBookingByTheaterId
};
