import express from "express";
const router = express.Router();
import {
  authenticate,
  authenticateCallback,
  redirectCallback,
  logout,
} from "../Controllers/GoogleAuthController.js";
// import { protectedRoute } from "../Middlewares/protectedMiddleware.js";
import passport from "passport";

// Google Authentication route
router.get("/auth/google", authenticate);

// Google Authentication callback route
router.get("/auth/google/callback", authenticateCallback, redirectCallback);

// // testing api
// router.get("/login/success", protectedRoute, (req, res) => {
//   try {
//     res.json({ status: true, message: "testing" });
//   } catch (error) {
//     console.log(error);
//   }
// });


// router.get("/logout", protectedRoute, logout)


export default router;
