import RouteTiming from "../Models/RouteTimingModel.js";
import BookingServiceModel from "../Models/BooingServicesModel.js";

export const getRouteTiming = async (req, res) => {
  try {
    const response = await RouteTiming.find({});

    if (response.length > 0) {
      return res
        .status(201)
        .json({ status: false, message: "timing data", data: response });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error", err: error });
  }
};

export const getBookingService = async (req, res) => {
  try {
    const response = await BookingServiceModel.find({});

    if (response.length > 0) {
      return res.status(201).json({
        status: false,
        message: "booking service data",
        data: response,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error", err: error });
  }
};
