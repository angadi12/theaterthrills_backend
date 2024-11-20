const mongoose = require('mongoose');
const { Schema } = mongoose;

const otpSchema = new Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('OTP', otpSchema);
