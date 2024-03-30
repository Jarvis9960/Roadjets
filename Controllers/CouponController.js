import CouponModel from "../Models/CouponModel.js";

export const createCouponCode = async (req, res) => {
  try {
    const {
      couponCode,
      maxCanUse,
      validPassengerToApply,
      expiryDate,
      percentage,
      couponType,
    } = req.body;

    if (
      !couponCode ||
      !maxCanUse ||
      !expiryDate ||
      !percentage ||
      !couponType
    ) {
      return res.status(422).json({
        status: false,
        message: "Please provide all the require field",
      });
    }

    const expiryDateParts = expiryDate.split("-");
    const expiryDateObject = new Date(
      Date.UTC(expiryDateParts[2], expiryDateParts[1] - 1, expiryDateParts[0])
    );

    if (expiryDateObject === "Invalid Date") {
      return res
        .status(422)
        .json({ status: false, message: "Invalid Date Format" });
    }

    const couponCodeExist = await CouponModel.findOne({
      CouponCode: couponCode,
    });

    if (couponCodeExist) {
      return res.status(422).json({
        status: false,
        message: "Coupon code already exists",
        data: couponCodeExist,
      });
    }

    let newCouponCode;

    if (validPassengerToApply) {
      newCouponCode = new CouponModel({
        CouponCode: couponCode,
        MaxCanUse: maxCanUse,
        ValidPassengerToApply: validPassengerToApply,
        ExpiryDate: expiryDateObject,
        Percentage: percentage,
        CouponType: "FreeRide",
      });
    } else {
      newCouponCode = new CouponModel({
        CouponCode: couponCode,
        MaxCanUse: maxCanUse,
        ExpiryDate: expiryDateObject,
        Percentage: percentage,
        CouponType: "Discount",
      });
    }

    const response = await newCouponCode.save();

    if (response) {
      return res
        .status(202)
        .json({ status: false, message: "Coupon code created successfully" });
    } else {
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        response: response,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err: error });
  }
};

export const verifyCouponCode = async (req, res) => {
  try {
    const { amount, couponCode, validPassengerToVerify } = req.body;

    if (!amount || !couponCode) {
      return res.status(422).json({
        status: false,
        message: "Please provide all the required field",
      });
    }

    const couponCodeExist = await CouponModel.findOne({
      CouponCode: couponCode,
    });

    if (!couponCodeExist) {
      return res
        .status(422)
        .json({ status: false, message: "Invalid coupon code" });
    }

    if (couponCodeExist.CouponType === "FreeRide") {
      if (!validPassengerToVerify) {
        return res
          .status(422)
          .json({ status: false, message: "Please provide passenger details" });
      }

      console.log(validPassengerToVerify)

      for (const passenger of validPassengerToVerify) {
        if (
          !passengerExistsInValidPassengerToApply(
            couponCodeExist.ValidPassengerToApply,
            passenger
          )
        ) {
          return res.status(422).json({
            status: false,
            message: `Passenger with mobile number ${passenger.mobile} is not eligible`,
          });
        }
      }

      let currentDate = new Date();
      const expiryDate = new Date(couponCodeExist.ExpiryDate);

      if (currentDate >= expiryDate) {
        return res.status(422).json({
          status: false,
          message: "Coupon has been expired",
        });
      }

      if (couponCodeExist.CouponUsed >= couponCodeExist.MaxCanUse) {
        return res
          .status(422)
          .json({ status: false, message: "Coupon is Expired" });
      }

      return res.status(202).json({
        status: true,
        message: "Coupon Code applied successfully",
        amount: 0,
      });
    } else {
      let currentDate = new Date();
      const expiryDate = new Date(couponCodeExist.ExpiryDate);

      if (currentDate >= expiryDate) {
        return res.status(422).json({
          status: false,
          message: "Coupon has been expired",
        });
      }

      if (couponCodeExist.CouponUsed >= couponCodeExist.MaxCanUse) {
        return res
          .status(422)
          .json({ status: false, message: "Coupon is Expired" });
      }
    }

    // Discount amount = Original price × (Discount percentage / 100)
    let calculateDiscountAmount = amount * (couponCodeExist.Percentage / 100);

    // Final price = Original price - Discount amount = $100 - $20 = $80
    let finalPrice = amount - calculateDiscountAmount;

    return res.status(202).json({
      status: true,
      message: "Coupon code successfully applied",
      amount: finalPrice,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error", err: error });
  }
};

const passengerExistsInValidPassengerToApply = (
  validPassengerToApply,
  passengerToVerify
) => {
  return validPassengerToApply.some(
    (passenger) => passenger.mobile === +passengerToVerify.mobile
  );
};
