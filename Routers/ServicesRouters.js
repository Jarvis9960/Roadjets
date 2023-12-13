import express from "express";
const router = express.Router();
import { bookRideFromWhatApp } from "../Controllers/ServicesControllers.js";


router.post("/get-whatapplink", bookRideFromWhatApp);



export default router;