const admin = require("../Services/firebaseAdmin"); // Firebase Admin SDK
const User = require("../Model/User");
const AppErr = require("../Services/AppErr");
const jwt = require("jsonwebtoken");

// Middleware to verify Firebase ID token and attach user to request
const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ uid: decodedToken.uid, authType: 'firebase' });
    if (!user) throw new AppErr("User not found", 404);
    return user;
  } catch (error) {
    throw new AppErr("Invalid or expired Firebase token", 403);
  }
};

// Middleware to authenticate based on email or phoneNumber (email OTP-based users)
const verifyJwtToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      throw new AppErr("User not found for JWT token", 404);
    }
    return user;
  } catch (error) {
    throw new AppErr("Invalid JWT token", 401);
  }
};

// General Middleware for Authentication
const authenticateUser = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return next(new AppErr("Token is required", 401));
  }

  try {
    let user;

    // Decode token without verifying to check its structure
    const decodedToken = jwt.decode(token, { complete: true });
    if (decodedToken?.payload?.iss?.includes("securetoken.google.com")) {
      // Firebase token if issuer contains 'securetoken.google.com'
      user = await verifyFirebaseToken(token);
    } else if (decodedToken?.payload?.email) {
      // JWT token if it contains `email`
      user = await verifyJwtToken(token);
    } else {
      throw new AppErr("Unknown token type", 400);
    }

    req.user = user; // Attach user to the request
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for admin access
const isAdmin = async (req, res, next) => {
  authenticateUser(req, res, () => {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return next(new AppErr("Access denied, admin only", 403));
    }
    next();
  });
};

// Middleware for superadmin access
const isSuperAdmin = async (req, res, next) => {
  authenticateUser(req, res, () => {
    if (req.user.role !== "superadmin") {
      return next(new AppErr("Access denied, superadmin only", 403));
    }
    next();
  });
};

module.exports = { authenticateUser, isAdmin, isSuperAdmin };
