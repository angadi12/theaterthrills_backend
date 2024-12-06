const mongoose = require("mongoose");
const AppErr = require("../Services/AppErr");
const UnsavedBooking = require("../Model/Unsaved");
const { validationResult } = require("express-validator");
const Theater = require("../Model/Theater");
const nodemailer = require("nodemailer");

 



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


const sendunsavedBookingEmail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;  // Get booking ID from params

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return next(new AppErr("Invalid booking ID", 400));
    }

    // Fetch the booking by ID
    const booking = await UnsavedBooking.findById(bookingId).populate("user", "name email");

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
     <title>Complete Your Booking</title>
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
         <h1>Complete Your Booking</h1>
     </div>
     <div class="content">
         <p>Dear ${booking.fullName},</p>
         <p>We noticed that you started a booking with us but didn't complete the process. We'd love to help you finish your reservation!</p>
         <p>Here's what we have so far:</p>
         <ul>
              <li><strong>Date:</strong> ${booking.date}</li>
                <li><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</li>
                <li><strong>Service:</strong> ${booking.Occasionobject}</li>
                <li><strong>Location:</strong> ${theater.location}</li>
         </ul>
         <p>Don't miss out on securing your spot. It only takes a few more minutes to complete your booking.</p>
         <p>If you have any questions or need assistance, our customer support team is here to help.</p>
         <a href="https://www.thetheatrethrills.com" class="button">Complete Your Booking</a>
     </div>
     <div class="footer">
         <p>&copy;2024 THE THEATRE THRILLS. All rights reserved.</p>
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


const deletebookingById = async (req, res, next) => {
  try {
    const booking = await UnsavedBooking.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      data: "booking deleted successfully",
    });
  } catch (err) {
    next(new AppErr("Failed to delete booking", 500, err));
  }
};




module.exports = {
    saveUnsavedBooking,
    getAllUnsavedBookings,
    getUnsavedBookingById,
    getAllunsavedBookingByTheaterId,
    sendunsavedBookingEmail,
    deletebookingById
};
