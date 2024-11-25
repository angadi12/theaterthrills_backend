const mongoose = require("mongoose");
const { Schema } = mongoose;

const slotSchema = new Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  dates: [
    {
      date: { type: Date, required: true },
      status: {
        type: String,
        enum: ["available", "booked", "unavailable"],
        default: "available",
      },
    },
  ],
});

const theaterSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  maxCapacity: { type: Number, required: true },
  groupSize: { type: Number, required: true }, 
  amenities: [String],
  slots: [slotSchema],
  price: { type: Number, required: true },
  minimumDecorationAmount: { type: Number, required: true },
  extraPerPerson: { type: Number, required: true }, 
  images: [{ type: String }],
  branch: {
    type: Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch ID is required"],
  },
  status: {
    type: String,
    enum: ["available", "coming soon", "under maintenance"],
    default: "available", 
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Theater", theaterSchema);
