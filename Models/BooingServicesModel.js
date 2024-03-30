import mongoose from "mongoose";

// Define schema
const bookingServiceSchema = new mongoose.Schema({
  id: Number,
  title: String,
  pickUpLocation: [String],
  dropLocation: [String],
  routeOne: String,
  routeTwo: String,
  text: String,
  location: String,
  shortFormStartLocation: String,
  shortFormEndLocation: String,
  shortDescription: String,
  img1: String, // Assuming image paths are stored as strings
  img2: String, // Assuming image paths are stored as strings
  price: Number,
  pickUpTiming: [
    {
      time: String,
      car: String,
      model: String,
      review: String,
      rating: String,
    },
  ],
  dropUpTiming: [
    {
      time: String,
      car: String,
      model: String,
      review: String,
      rating: String,
    },
  ],
});

// Create model
const BookingServiceModel = mongoose.model(
  "bookingservices",
  bookingServiceSchema
);

export default BookingServiceModel
