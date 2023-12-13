import express from "express";
const router = express.Router();
import { contactUs } from "../Controllers/Contactus.js";

router.post("/contact-us", contactUs);

export default router;