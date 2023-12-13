import express from "express";
const router = express.Router();
import { loginController, signUp,  } from "../Controllers/AuthController.js";

router.post("/signup", signUp);
router.post("/login", loginController);

export default router;