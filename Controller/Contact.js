const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");
const Contact = require("../Model/Contact");

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

    const existingContact = await Contact.findOne({ mobileNumber });
    if (existingContact) {
      return res.status(200).json({
        status: "success",
        message: "Contact already exists",
        data: { contact: existingContact },
      });
    }

    const newContact = await Contact.create({
      firstName,
      email,
      mobileNumber,
      message,
      occasion,
      addOns,
      details,
      lastName,
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

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(new AppErr("Failed to delete contact", 500, err));
  }
};


const getContactsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate), // Start date
        $lte: new Date(endDate),   // End date
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
    return next(new AppErr(error.message, 500));
  }
};


module.exports = {
  createContact,
  getContactById,
  getAllContacts,
  deleteContactById,
  getContactsByDateRange
};
