import express from "express";
const router = express.Router();
import { createCouponCode, verifyCouponCode } from "../Controllers/CouponController.js"

router.post("/createcoupon", createCouponCode);
router.post("/verifycouponcode", verifyCouponCode);


export default router;