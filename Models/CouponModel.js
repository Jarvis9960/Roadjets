import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  CouponCode: {
    type: String,
    required: true,
  },
  MaxCanUse: {
    type: Number,
    required: true,
  },
  ValidPassengerToApply: [
    {
      name: String,
      mobile: Number,
    },
  ],
  ExpiryDate: {
    type: Date,
    required: true,
  },
  Percentage: {
    type: Number,
    required: true,
  },
  CouponType: {
    type: String,
    required: true,
  },
  CouponUsed: {
    type: Number,
    default: 0,
  },
});

const CouponModel = mongoose.model("coupon", couponSchema);

export default CouponModel;
