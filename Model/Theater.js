const mongoose = require('mongoose');
const { Schema } = mongoose;

const slotSchema = new Schema({
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },  
  dates: [
    {
      date: { type: Date, required: true }, 
      status: { 
        type: String, 
        enum: ['available', 'booked', 'unavailable'], 
        default: 'available' 
      } 
    }
  ]
});

const theaterSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  amenities: [String], 
  slots: [slotSchema], 
  price: { type: Number, required: true }, 
  minimumDecorationAmount: { type: Number, required: true }, 
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Theater', theaterSchema)
