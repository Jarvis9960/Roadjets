import BookingModel from "../Models/BookingModel.js";

export const checkAvailiability = async (req, res) => {
  try {
    const { bookDate, timing, route } = req.query;

    if (!bookDate) {
      return res.status(422).json({
        status: false,
        message: "Please provide date to check availiabilty",
      });
    }

    const date = new Date(bookDate);

    if (isNaN(date)) {
      throw new Error("Invalid date provided");
    }

    console.log(route);
    console.log(timing);

    const getAvailiability = await BookingModel.find({
      bookingDate: date,
      "bookingDetails.bookingDetails.3": route,
      "bookingDetails.bookingDetails.7": timing,
    });

    let bookingDetails = [];
    if (getAvailiability.length > 0) {
      bookingDetails = getAvailiability.map((curr) => {
        return curr.bookingDetails.bookingDetails;
      });
    }

    const totatSeats = bookingDetails.reduce((prev, curr) => {
      return prev + curr["4"];
    }, 0);

    return res.status(201).json({
      status: true,
      message: "total seat fetch successfully",
      totatSeats,
      timing,
      route
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err: error });
  }
};
