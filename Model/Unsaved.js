const mongoose = require("mongoose");
const { Schema } = mongoose;

const unsavedBookingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  theater: {
    type: Schema.Types.ObjectId,
    ref: "Theater",
    required: [true, "Theater ID is required"],
  },
  slot: {
    type: Schema.Types.ObjectId,
    ref: "Slot",
    required: [true, "Slot ID is required"],
  },
  date: {
    type: Date,
  },
  fullName: {
    type: String,
  },
  numberOfPeople: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  whatsappNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  addDecorations: {
    type: String,
  },
  nickname: {
    type: String,
  },
  partnerNickname: {
    type: String,
  },
  Occasionobject: {
    type: Object,
    default: {},
  },
  isEggless: {
    type: Boolean,
    default: false,
  },
  cakeText: {
    type: String,
    default: "",
  },
  selectedCakes: {
    type: Map,
    of: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
    default: {},
  },
  addOns: {
    decorations: {
      type: Map,
      of: Number,
    },
    roses: {
      type: Map,
      of: Number,
    },
    photography: [String],
  },
  bookingId: {
    type: String,
    required: [true, "Booking ID is required"],
    unique: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "cancelled", "failed"],
    default: "pending",
  },
  paymentAmount: {
    type: Number,
    required: [true, "Payment amount is required"],
    min: [0, "Payment amount cannot be negative"],
  },
  TotalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"],
  },
  orderId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false, 
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UnsavedBooking", unsavedBookingSchema);
