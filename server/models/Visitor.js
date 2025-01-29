const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  role: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkInTime: { type: String, required: true },
  checkOutDate: { type: Date },
  checkOutTime: { type: String },
  reason: { type: String },
});

module.exports = mongoose.model('Visitor', visitorSchema);
