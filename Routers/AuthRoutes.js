import express from "express";
const router = express.Router();
import { signUp } from "../Controllers/AuthController.js";
import { logout } from "../Controllers/GoogleAuthController.js";
import { protectedRoute } from "../Middlewares/protectedRoute.js";
import passport from "passport";
import jwt from "jsonwebtoken";

router.post("/signup", signUp);

// local stragery
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      // Authentication failed
      return res.status(401).json({ status: false, message: info.message });
    }

    // Authentication succeeded
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      // Generate a JWT token
      const token = jwt.sign({ userId: user.id }, "ROADJETSADMIN", {
        expiresIn: "1h",
      });

      // Set the token as a cookie
      res.cookie("jwtToken", token, { httpOnly: true, maxAge: 3600000 });

      return res.status(201).json({
        status: true,
        message: "Login Successfully",
        token: token,
      });
    });
  })(req, res, next);
});

router.post("/logout", protectedRoute, logout);

export default router;
