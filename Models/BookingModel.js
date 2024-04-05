import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  bookingDate: {
    type: Date,
    required: true,
  },
  bookingDetails: {
    type: Object,
    required: true,
  },
});

const BookingModel = mongoose.model("BookingDetails", bookingSchema);

export default BookingModel;
