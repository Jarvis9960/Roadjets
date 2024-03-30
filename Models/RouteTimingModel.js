import mongoose from "mongoose";

const RouteTimingSchema = new mongoose.Schema({
  time: String,
  car: String,
  model: String,
  review: String,
  rating: String,
  route: String,
});

const RouteTiming = mongoose.model("timings", RouteTimingSchema);

export default RouteTiming;
