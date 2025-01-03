const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema({
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
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentAmount: {
    type: Number,
    required: [true, "Payment amount is required"],
    min: [0, "Payment amount cannot be negative"],
  },
  TotalAmount: {
    type: Number,
    required: [true, "Payment amount is required"],
    min: [0, "Payment amount cannot be negative"],
  },
  discountAmount: {
    type: Number,
  },

  orderId: {
    type: String,
  },
  coupon: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  paymentType: {
    type: String,
    enum: ["full", "advance"],
    required: true,
    default: "advance",
  },
  refundStatus: {
    type: String,
    enum: ["not_requested", "requested", "processed", "failed"],
    default: "not_requested",
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, "Refund amount cannot be negative"],
  },
  refundDate: {
    type: Date,
  },
  cancellationRequestDate: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    default: "",
    maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ theater: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
