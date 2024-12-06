const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");
const Contact = require("../Model/Contact");
const nodemailer = require("nodemailer");
const { getSocketIO } = require("../Services/Socket");

const createContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      mobileNumber,
      message,
      occasion,
      addOns,
      details,
    } = req.body;

    // const existingContact = await Contact.findOne({ mobileNumber });
    // if (existingContact) {
    //   return res.status(200).json({
    //     status: "success",
    //     message: "Contact already exists",
    //     data: { contact: existingContact },
    //   });
    // }

    const newContact = await Contact.create({
      firstName,
      email,
      mobileNumber,
      message,
      occasion,
      addOns,
      details,
      lastName,
      isRead:false,
    });

    const io = getSocketIO();
    io.emit("Messagecreated", {
      message: "A new message has been recived!",
      order: newContact
    });

    res.status(201).json({
      status: "success",
      data: { contact: newContact },
    });
  } catch (err) {
    console.log(err);
    next(new AppErr("Failed to create contact", 500, err.message));
  }
};

// Get a specific contact by ID
const getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new AppErr("Contact not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { contact },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch contact", 500, err));
  }
};

// Get all contacts
const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find();

    res.status(200).json({
      status: "success",
      data: { contacts },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch contacts", 500, err));
  }
};

// Delete a contact by ID
const deleteContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return next(new AppErr("Contact not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: "message deleted successfully",
    });
  } catch (err) {
    next(new AppErr("Failed to delete contact", 500, err));
  }
};

const getContactsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    console.log("Received Start Date:", startDate, "End Date:", endDate);

    const query = {};

    if (startDate && endDate) {
      // Parse dates and add time for accurate range
      const startDateIST = new Date(`${startDate}T00:00:00.000Z`); // Start of the day
      const endDateIST = new Date(`${endDate}T23:59:59.999Z`); // End of the day

      query.createdAt = {
        $gte: startDateIST, // Start of the day in IST
        $lte: endDateIST,   // End of the day in IST
      };
    }

    // Fetch contacts and sort by createdAt in descending order
    const contacts = await Contact.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error.message);
    return next(new AppErr(error.message, 500));
  }
};


const sendEmailtouser = async (req, res, next) => {
  const { ticketId, subject, message, recipientEmail } = req.body;

  try {
    const ticket = await Contact.findById(ticketId);

    if (!ticket) {
      return res.status(404).send("Ticket not found");
    }

    const customerMessage = ticket.details; // Assuming this is the message field from the ticket
    const customerName = ticket.firstName; // Assuming you have customer data populated
    const customerlastname = ticket.lastName; // Assuming you have customer data populated

    // Prepare email template
    const emailTemplate = `
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reply to Your Message</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container {
            max-width:400px;
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
            padding: 10px;
            text-align: center;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
        }
        .customer-message {
            background-color: #f0f0f0;
            border-left: 4px solid #004AAD;
            padding: 15px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #F30278;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
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
    <div class="container">
        <div class="logo">
            <img src="https://firebasestorage.googleapis.com/v0/b/awt-website-769f8.appspot.com/o/Logo.png?alt=media&token=d8826565-b850-4d05-8bfa-5be8061f70f6" alt="Company Logo">
        </div>
        <div class="header">
            <h1>Our Response to Your Message</h1>
        </div>
        <div class="content">
            <p>Dear  ${customerName} ${customerlastname},</p>
            <p>Thank you for reaching out to us. We appreciate your message and are happy to assist you.</p>
            
            <div class="customer-message">
                <strong>Your message:</strong>
                <p>${customerMessage}</p>
            </div>
            
            <p><strong>Our response:</strong></p>
            <p>${message}</p>
            
            <p>If you have any further questions or need additional assistance, please don't hesitate to contact us. We're here to help!</p>
            
            <a href="https://www.thetheatrethrills.com" class="button">Visit Our Website</a>
            
            <p>Thank you for choosing our services.</p>
            
            <p>Best regards,<br><br>THE THEATRE THRILLS</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 THE THEATRE THRILLS. All rights reserved.</p>
            <p>If you have any questions, please contact us at [contact@example.com]</p>
        </div>
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
      to: recipientEmail, // Receiver address
      subject: subject,
      html: emailTemplate, // HTML body content
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Booking reminder sent successfully!",
    });
  } catch (error) {
    console.log(error)
    console.error("Error sending email:", error.message);
    next(new AppErr("Error sending email", 500));
  }
};

module.exports = {
  createContact,
  getContactById,
  getAllContacts,
  deleteContactById,
  getContactsByDateRange,
  sendEmailtouser
};
