import express from "express";
const router = express.Router();
import { getBookingService, getRouteTiming } from "../Controllers/TimingControllers.js";

router.get("/getRoutetiming", getRouteTiming);
router.get("/getBookingService", getBookingService);

export default router;
