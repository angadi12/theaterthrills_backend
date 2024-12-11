const mongoose = require("mongoose");
const Theater = require("../Model/Theater");
const AppErr = require("../Services/AppErr");
const Booking = require("../Model/Booking");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const razorpayInstance = require("../Services/Razorpayinstance");
const nodemailer = require("nodemailer");
const CouponOffer = require("../Model/Coupon"); // Assuming a Mongoose model
const moment = require("moment-timezone");

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
      orderId,
      couponCode,
      deviceId,
      discountAmount
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



    if (couponCode) {
      const coupon = await CouponOffer.findOne({ code: couponCode });

     
      if (coupon.type === "coupon" || coupon.type==="offer") {     
        coupon.devicesUsed.push(deviceId);
        coupon.users.push(user);
        coupon.usageLimit -= 1;

        if (coupon.usageLimit <= 0) {
          coupon.isActive = false; 
        }

        await coupon.save();
      }
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
      bookingId: `BK-${Date.now()}`, 
      coupon: couponCode ,
      discountAmount: discountAmount || 0, 
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

// const getBookingById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return next(new AppErr("Invalid booking ID", 400));
//     }

//     const booking = await Booking.findById(id);

//     if (!booking) {
//       return next(new AppErr("Booking not found", 404));
//     }

//     res.status(200).json({ success: true, data: booking });
//   } catch (error) {
//     next(new AppErr("Error fetching booking", 500));
//   }
// };

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

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid booking ID", 400));
    }

    // Fetch the booking by ID
    const booking = await Booking.findById(id).populate("user", "phoneNumber email");

    if (!booking) {
      return next(new AppErr("Booking not found", 404));
    }

    // Fetch the related theater
    const theater = await Theater.findById(booking.theater);
    let enrichedBooking = booking.toObject(); // Convert Mongoose document to plain object

    if (theater) {
      // Fetch the related slot
      const slot = theater.slots.id(booking.slot);

      enrichedBooking = {
        ...enrichedBooking,
        theater: {
          name: theater.name,
          location: theater.location,
          capacity: theater.capacity,
          amenities: theater.amenities,
          price: theater.price,
          images: theater.images,
        },
        slot: slot
          ? {
              startTime: slot.startTime,
              endTime: slot.endTime,
              dates: slot.dates.map((d) => ({
                date: d.date,
                status: d.status,
              })),
            }
          : null,
        Addons: booking.addOns,
        Cakes: booking.selectedCakes || {},
      };
    } else {
      // If theater not found, set theater and slot to null
      enrichedBooking = {
        ...enrichedBooking,
        theater: null,
        slot: null,
      };
    }

    res.status(200).json({ success: true, data: enrichedBooking });
  } catch (error) {
    console.error("Error fetching booking by ID:", error.message);
    next(new AppErr("Error fetching booking", 500));
  }
};



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


// const getAllBookingByTheaterId = async (req, res) => {
//   const { theaterId } = req.params;

//   try {
//     if (!theaterId) {
//       return res.status(400).json({ message: "Theater ID is required" });
//     }

//     const bookings = await Booking.find({ theater: theaterId })
//       .populate("user")
//       .populate("theater") 
//       .sort({ date: -1 })
//       .lean();

//     if (!bookings || bookings.length === 0) {
//       return res.status(404).json({ success: false, message: "Nobookings" });
//     }

//     const theater = await Theater.findById(theaterId).select("slots").lean();
//     if (!theater) {
//       return res.status(404).json({ message: "Theater not found" });
//     }
//     const enrichedBookings = bookings.map(booking => {
//       const slotDetails = theater.slots.find(slot => slot._id.toString() === booking.slot.toString());
//       if (!slotDetails) {
//         console.warn(`Slot not found for booking ID: ${booking._id}`);
//       }
//       return {
//         ...booking,
//         slotDetails: slotDetails || null, // Add `null` if slot not found
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: enrichedBookings,
//     });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later.",
//     });
//   }
// };





const getAllBookingByTheaterId = async (req, res) => {
  const { theaterId } = req.params;
  const { status } = req.query; // Expecting a query parameter for status
  try {
    if (!theaterId) {
      return res.status(400).json({ message: "Theater ID is required" });
    }

    // Fetch all bookings for the theater
    const bookings = await Booking.find({ theater: theaterId })
      .populate("user")
      .populate("theater")
      .sort({ date: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: "No bookings found" });
    }

    // Fetch theater slots for slot details
    const theater = await Theater.findById(theaterId).select("slots").lean();
    if (!theater) {
      return res.status(404).json({ message: "Theater not found" });
    }

    // Add slot details to each booking
    const enrichedBookings = bookings.map((booking) => {
      const slotDetails = theater.slots.find(
        (slot) => slot._id.toString() === booking.slot.toString()
      );
      return {
        ...booking,
        slotDetails: slotDetails || null, // Add `null` if slot not found
      };
    });

    // Convert UTC date to IST in 'yyyy-mm-dd' format
    const convertToISTDateString = (utcDate) => {
      return moment(utcDate).tz("Asia/Kolkata").format("YYYY-MM-DD");
    };

    const todayIST = convertToISTDateString(new Date());

    // Count bookings by status
    const counts = {
      active: 0,
      upcoming: 0,
      completed: 0,
      all: enrichedBookings.length,
    };

    enrichedBookings.forEach((booking) => {
      const bookingDateIST = convertToISTDateString(booking.date);
      if (booking.paymentStatus === "completed") {
        if (bookingDateIST === todayIST) {
          counts.active += 1;
        } else if (bookingDateIST > todayIST) {
          counts.upcoming += 1;
        } else if (bookingDateIST < todayIST) {
          counts.completed += 1;
        }
      }
    });

    // Filter bookings based on the status query
    const filteredBookings = enrichedBookings.filter((booking) => {
      const bookingDateIST = convertToISTDateString(booking.date);
      if (status === "Active") {
        return bookingDateIST === todayIST ;
      } else if (status === "upcoming") {
        return bookingDateIST > todayIST ;
      } else if (status === "completed") {
        return bookingDateIST < todayIST ;
      } else if (status === "AllBooking") {
        return true; // Return all bookings
      } else {
        return false; // Invalid or unsupported status
      }
    });

    res.status(200).json({
      success: true,
      data: filteredBookings,
      counts, // Include counts for each status
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};





const sendBookingEmail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;  // Get booking ID from params

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return next(new AppErr("Invalid booking ID", 400));
    }

    // Fetch the booking by ID
    const booking = await Booking.findById(bookingId).populate("user", "name email");

    if (!booking) {
      return next(new AppErr("Booking not found", 404));
    }

    // Fetch the related theater and slot details
    const theater = await Theater.findById(booking.theater);
    if (!theater) {
      return next(new AppErr("Theater not found", 404));
    }

    const slot = theater.slots.id(booking.slot);
    if (!slot) {
      return next(new AppErr("Slot not found", 404));
    }


    // Prepare email template
    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Reminder</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .logo {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo img {
                max-width: 200px;
                height: auto;
            }
            .header {
                background-color: #004AAD;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
            }
            .button {
                display: inline-block;
                background-color: #F30278;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666666;
            }
        </style>
    </head>
    <body>
        <div class="logo">
            <img src="https://firebasestorage.googleapis.com/v0/b/awt-website-769f8.appspot.com/o/Logo.png?alt=media&token=d8826565-b850-4d05-8bfa-5be8061f70f6" alt="Company Logo" class="logo">
        </div>
        <div class="header">
            <h1>Booking Reminder</h1>
        </div>
        <div class="content">
            <p>Dear ${booking.fullName},</p>
            <p>This is a friendly reminder about your upcoming booking with us. Here are the details:</p>
            <ul>
                <li><strong>Date:</strong> ${booking.date}</li>
                <li><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</li>
                <li><strong>Service:</strong> ${booking.Occasionobject}</li>
                <li><strong>Location:</strong> ${theater.location}</li>
            </ul>
            <p>We're looking forward to seeing you soon!</p>
            <p>If you need to make any changes to your booking, please don't hesitate to contact us.</p>
            <a href="https://www.thetheatrethrills.com/bookings" class="button">Manage Your Booking</a>
        </div>
        <div class="footer">
            <p>&copy; 2024 THE THEATRE THRILLS. All rights reserved.</p>
            <p>If you have any questions, please contact us at [contact@example.com]</p>
        </div>
    </body>
    </html>
    `;

    // Setup Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail", // Replace with your email service (e.g., "Gmail")
      auth: {
        user: process.env.NODE_Email,
        pass: process.env.NODE_Pass,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.NODE_Email,
      to: booking.user.email || booking.email, // Receiver address
      subject: "Booking Reminder",
      html: emailTemplate, // HTML body content
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Booking reminder sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    next(new AppErr("Error sending email", 500));
  }
};





module.exports = {
  createBooking,
  verifyPayment,
  getAllBookings,
  getBookingById,
  getBookingByUserId,
  createRazorpayOrder,
  getAllBookingByTheaterId,
  sendBookingEmail
};
