const express = require('express');
const { body } = require('express-validator');
const { sendOtp,verifyOtp } = require('../Controller/OTP');

const OTProuter = express.Router();

OTProuter.post(
  '/send-otp',
  [body('email').isEmail().withMessage('Invalid email')],
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await sendOtp(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

OTProuter.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
  ],
  verifyOtp
);

module.exports = {OTProuter};
