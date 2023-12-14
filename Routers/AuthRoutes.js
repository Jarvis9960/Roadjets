import express from "express";
const router = express.Router();
import { signUp } from "../Controllers/AuthController.js";
import { logout } from "../Controllers/GoogleAuthController.js";
import { protectedRoute } from "../Middlewares/protectedRoute.js";
import passport from "passport";

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

      console.log(req.isAuthenticated());
      return res.status(201).json({
        status: true,
        message: "Login Successfully",
        user: req.user,
      });
    });
  })(req, res, next);
});

router.post("/logout", protectedRoute, logout);

export default router;
