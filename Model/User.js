const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  uid: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true }, 
  phoneNumber: { type: String, unique: true, sparse: true }, 
  fullName: { type: String },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  authType: { type: String, enum: ['firebase', 'emailOtp'], required: true }, 
  createdAt: { type: Date, default: Date.now },
  branch: { type: Schema.Types.ObjectId, ref: "Branch" }, 
  activate: { type: Boolean, default: true },
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }] 
});

module.exports = mongoose.model('User', userSchema);
