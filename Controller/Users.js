const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");
const User = require("../Model/User");
const admin = require("../Services/firebaseAdmin");
const jwt = require("jsonwebtoken"); 
// Create a new user
const createUser = async (req, res, next) => {
  console.log(req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation errors",
        errors: errors.array(), 
      });
    }

    const { uid, email, phoneNumber, fullName, role, authType } = req.body;

    // Validate fields based on authType
    if (authType === "firebase" && !uid) {
      return res.status(400).json({
        status: false,
        message: "UID is required for Firebase authentication",
      });
    }

    if (authType === "emailOtp" && !email) {
      return res.status(400).json({
        status: false,
        message: "Email is required for Email OTP authentication",
      });
    }

    let existingUser;
    if (authType === "firebase") {
      existingUser = await User.findOne({ uid });
    } else if (authType === "emailOtp") {
      existingUser = await User.findOne({ email });
    }

    if (existingUser) {
      return res.status(200).json({
        status: "success",
        message: "User already exists",
        data: {
          user: existingUser,
        },
      });
    }

    let assignedRole = role;
    if (phoneNumber === process.env.ADMIN_PHONE) {
      assignedRole = "superadmin";
    } else if (email === process.env.ADMIN_EMAIL) {
      assignedRole = "superadmin";
    }

    // Create a new user based on the provided data
    const newUser = await User.create({
      uid: authType === "firebase" ? uid : null,
      email,
      phoneNumber,
      fullName,
      role: assignedRole,
      authType,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to create user", 500, err.message));
  }
};

// Get a specific user by ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppErr("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch user", 500, err));
  }
};

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to fetch users", 500, err));
  }
};

// Update a user by ID
const updateUserById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation errors", 400, errors.array()));
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return next(new AppErr("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(new AppErr("Failed to update user", 500, err));
  }
};

// Delete a user by ID
const deleteUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppErr("User not found", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(new AppErr("Failed to delete user", 500, err));
  }
};

const verifyToken = async (req, res, next) => {
  const token = req.headers.token; // Extract token from 'token' header

  if (!token) {
    return next(new AppErr("Authentication token is missing", 401));
  }

  try {
    let decoded;
    let user;
    // Firebase tokens are generally longer and have specific claims
    try {
      decoded = await admin.auth().verifyIdToken(token);
      user = await User.findOne({ uid: decoded.uid });
    } catch (firebaseError) {
      if (firebaseError.code !== "auth/argument-error") {
        throw new AppErr("Invalid Firebase token", 403);
      }
    }

    // If not Firebase, try JWT token
    if (!user) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findOne({ email: decoded.email });
      } catch (jwtError) {
        if (jwtError.name === "TokenExpiredError") {
          return next(new AppErr("JWT token expired", 401));
        } else {
          throw new AppErr("Invalid JWT token", 403);
        }
      }
    }

    if (!user) {
      return next(new AppErr("Invalid authentication token", 403));
    }

    req.user = user; // Attach the user object to the request
    next();
  } catch (error) {
    next(
      error instanceof AppErr ? error : new AppErr("Authentication failed", 500)
    );
  }
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
  verifyToken,
};
