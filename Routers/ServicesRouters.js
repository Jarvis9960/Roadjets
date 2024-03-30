import express from "express";
const router = express.Router();
import {
  bookRideFromWhatApp,
  checkout,
  paymentVerification,
} from "../Controllers/ServicesControllers.js";

router.post("/get-whatapplink", bookRideFromWhatApp);
router.post("/create/order", checkout);
router.post("/payment/verify", paymentVerification);

export default router;
