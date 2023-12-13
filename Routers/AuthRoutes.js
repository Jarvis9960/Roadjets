import express from "express";
const router = express.Router();
import { loginController, signUp } from "../Controllers/AuthController.js";
import { logout } from "../Controllers/GoogleAuthController.js";
import { protectedRoute } from "../Middlewares/protectedRoute.js";

router.post("/signup", signUp);
router.post("/login", loginController);
router.post("/logout", protectedRoute, logout);

export default router;
