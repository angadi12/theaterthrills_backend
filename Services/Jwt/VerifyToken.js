const AppErr = require("../AppErr");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const VerifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRECT, (err, decoded) => {
    if (err) {
      return false;
    } else {
      return decoded;
    }
  });
};

module.exports = VerifyToken;
