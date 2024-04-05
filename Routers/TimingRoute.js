import express from "express";
const router = express.Router();
import { checkAvailiability } from "../Controllers/BookingAvailability.js";

router.get("/checkavailiability", checkAvailiability);


export default router;