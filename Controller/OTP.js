const nodemailer = require("nodemailer");
const crypto = require("crypto");
const OTP = require("../Model/OTP"); // Import OTP model
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { text } = require("body-parser");
const { Console } = require("console");

const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the OTP entry in the database
    const otpEntry = await OTP.findOne({ email });
    if (!otpEntry) {
      return res.status(400).json({ status: false, message: "OTP not found" });
    }

    // Check if the OTP has expired
    if (otpEntry.expiresAt < new Date()) {
      return res.status(400).json({ status: false, message: "OTP expired" });
    }

    // Verify the OTP
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    }

    // Generate a JWT token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Delete OTP after successful verification
    await OTP.deleteOne({ email });

    res.status(200).json({
      status: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(new Error("Error verifying OTP"));
  }
};

const sendOtp = async (email) => {
  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiry time for OTP (e.g., 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to the database
    await OTP.findOneAndUpdate(
      { email },
      { email, otp, expiresAt },
      { upsert: true, new: true }
    );

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODE_Email,
        pass: process.env.NODE_Pass,
      },
      debug: true, // Enable debug output
    });

    const mailOptions = {
      from: process.env.NODE_Email,
      to: email,
      subject: "Your OTP for Login",
      text:"Your OTP for Login",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            width: 100%;

        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 5px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #004AAD;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #F30278;
            text-align: center;
            margin: 20px 0;
            letter-spacing: 5px;
        }
        .button {
            display: inline-block;
            background-color: #F30278;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            background-color: #004AAD;
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #F30278;
        }
        .social-links {
            margin-top: 20px;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
        }
        .social-icon {
            width: 32px;
            height: 32px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://firebasestorage.googleapis.com/v0/b/awt-website-769f8.appspot.com/o/Logo.png?alt=media&token=d8826565-b850-4d05-8bfa-5be8061f70f6" alt="Company Logo" class="logo">
        </div>
        <div class="content">
            <h3>Your One-Time Password</h3>
            <p>Hello,</p>
            <p>Your OTP code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 5 minutes. Please do not share this code with anyone.</p>
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
        </div>
        <div class="footer">
            <p>© 2024 THEATER-THRILLS. All rights reserved.</p>
            <p>Contact us: info@thetheatrethrills.com | +91 9398617123 | +91 8885888949</p>
             <p>
            &copy;Copyrights 2024 .The Theatre Thrills .
            All rights reserved.
          </p>
        </div>
    </div>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);
    return { status: true, message: "OTP sent successfully" };
  } catch (error) {
    console.log(error)
    throw new Error("Failed to send OTP");
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};




// send reminder
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Booking Reminder</title>
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             color: #333333;
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//         }
//         .logo {
//             text-align: center;
//             margin-bottom: 20px;
//         }
//         .logo img {
//             max-width: 200px;
//             height: auto;
//         }
//         .header {
//             background-color: #004AAD;
//             color: #ffffff;
//             padding: 20px;
//             text-align: center;
//         }
//         .content {
//             background-color: #f9f9f9;
//             padding: 20px;
//             border-radius: 5px;
//         }
//         .button {
//             display: inline-block;
//             background-color: #F30278;
//             color: #ffffff;
//             padding: 10px 20px;
//             text-decoration: none;
//             border-radius: 5px;
//             margin-top: 20px;
//         }
//         .footer {
//             text-align: center;
//             margin-top: 20px;
//             font-size: 12px;
//             color: #666666;
//         }
//     </style>
// </head>
// <body>
//     <div class="logo">
//         <img src="https://firebasestorage.googleapis.com/v0/b/awt-website-769f8.appspot.com/o/Logo.png?alt=media&token=d8826565-b850-4d05-8bfa-5be8061f70f6" alt="Company Logo" class="logo">
//     </div>
//     <div class="header">
//         <h1>Booking Reminder</h1>
//     </div>
//     <div class="content">
//         <p>Dear [Customer Name],</p>
//         <p>This is a friendly reminder about your upcoming booking with us. Here are the details:</p>
//         <ul>
//             <li><strong>Date:</strong> [Booking Date]</li>
//             <li><strong>Time:</strong> [Booking Time]</li>
//             <li><strong>Service:</strong> [Service Name]</li>
//             <li><strong>Location:</strong> [Location Details]</li>
//         </ul>
//         <p>We're looking forward to seeing you soon!</p>
//         <p>If you need to make any changes to your booking, please don't hesitate to contact us.</p>
//         <a href="[Booking Management URL]" class="button">Manage Your Booking</a>
//     </div>
//     <div class="footer">
//         <p>&copy; 2023 [Your Company Name]. All rights reserved.</p>
//         <p>If you have any questions, please contact us at [contact@example.com]</p>
//     </div>
// </body>
// </html>




// confirmation
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Booking Confirmation</title>
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             color: #333333;
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//         }
//         .logo {
//             text-align: center;
//             margin-bottom: 20px;
//         }
//         .logo img {
//             max-width: 200px;
//             height: auto;
//         }
//         .header {
//             background-color: #004AAD;
//             color: #ffffff;
//             padding: 20px;
//             text-align: center;
//         }
//         .content {
//             background-color: #f9f9f9;
//             padding: 20px;
//             border-radius: 5px;
//         }
//         .button {
//             display: inline-block;
//             background-color: #F30278;
//             color: #ffffff;
//             padding: 10px 20px;
//             text-decoration: none;
//             border-radius: 5px;
//             margin-top: 20px;
//         }
//         .footer {
//             text-align: center;
//             margin-top: 20px;
//             font-size: 12px;
//             color: #666666;
//         }
//         .booking-details {
//             background-color: #ffffff;
//             border: 1px solid #dddddd;
//             border-radius: 5px;
//             padding: 15px;
//             margin-top: 20px;
//         }
//         .booking-details h2 {
//             color: #004AAD;
//             margin-top: 0;
//         }
//     </style>
// </head>
// <body>
//     <div class="logo">
//         <img src="https://firebasestorage.googleapis.com/v0/b/awt-website-769f8.appspot.com/o/Logo.png?alt=media&token=d8826565-b850-4d05-8bfa-5be8061f70f6" alt="Company Logo" class="logo">
//     </div>
//     <div class="header">
//         <h1>Booking Confirmation</h1>
//     </div>
//     <div class="content">
//         <p>Dear [Customer Name],</p>
//         <p>Great news! Your booking has been successfully confirmed. We're excited to serve you and look forward to your visit.</p>
        
//         <div class="booking-details">
//             <h2>Your Booking Details</h2>
//             <p><strong>Booking Reference:</strong> [Booking Reference Number]</p>
//             <p><strong>Service:</strong> [Service Name]</p>
//             <p><strong>Date:</strong> [Booking Date]</p>
//             <p><strong>Time:</strong> [Booking Time]</p>
//             <p><strong>Location:</strong> [Location Details]</p>
//             <p><strong>Number of People:</strong> [Number of People]</p>
//             <p><strong>Total Amount:</strong> [Total Amount]</p>
//         </div>
        
//         <p>If you need to make any changes to your booking or have any questions, please don't hesitate to contact us. You can manage your booking by clicking the button below.</p>
        
//         <a href="[Booking Management URL]" class="button">Manage Your Booking</a>
        
//         <p>We recommend arriving [Recommended Arrival Time] before your scheduled time to ensure a smooth experience.</p>
        
//         <p>Thank you for choosing our services. We can't wait to see you!</p>
//     </div>
//     <div class="footer">
//         <p>&copy; 2023 [Your Company Name]. All rights reserved.</p>
//         <p>If you have any questions, please contact us at [contact@example.com]</p>
//     </div>
// </body>
// </html>