import express from "express";
import cors from "cors";
import ServiceRoute from "./Routers/ServicesRouters.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import dbConnect from "./Database/DbConnect.js";
import AuthRoute from "./Routers/AuthRoutes.js";
import ContactRoute from "./Routers/ContactusRoutes.js";
import CouponRoute from "./Routers/CouponRoute.js";
import session from "express-session";
import passport, { strategies } from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import UserModel from "./Models/AuthModel.js";
import GoogleAuthRoute from "./Routers/GoogleAuthRoutes.js";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import RouteTiming from "./Routers/RouteTimingRoutes.js";
import TimingRoute from "./Routers/TimingRoute.js";

const fileName = fileURLToPath(import.meta.url);
const __dirName = dirname(fileName);

dotenv.config({ path: path.resolve(__dirName, "./config.env") });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://roadjets-jarvis9960.vercel.app",
      "https://www.roadjets.in",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

app.set("trust proxy", 1);

// configuring session middleware
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "none", // Set to 'none' for cross-origin requests
      secure: true, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js session serialization
passport.serializeUser((user, done) => {
  console.log("user " + user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("id " + id);
  const user = await UserModel.findOne({ _id: id });

  if (user) {
    done(null, user);
  } else {
    done(new Error("User not found"));
  }
});

function constructFullName(firstName, lastName) {
  const finalLastName = lastName || ""; // Set a default value for lastName if it is undefined
  return `${firstName} ${finalLastName}`;
}

// Configure Passport.js to use Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLECLIENTID,
      clientSecret: process.env.GOOGLESECRET,
      callbackURL: "/api/auth/google/callback", // Update with your callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await UserModel.findOne({
          Email: profile._json.email,
        });

        if (existingUser) {
          // If the user already exists, return the user profile
          return done(null, existingUser);
        } else {
          const responseProfile = profile._json;

          if (responseProfile) {
            const fullName = constructFullName(
              responseProfile.given_name,
              responseProfile.family_name
            );

            let newUser = new UserModel({
              FullName: fullName,
              Email: responseProfile.email,
            });

            // Save the new user to the database
            const savedUser = await newUser.save();

            if (savedUser) {
              // Return the new user profile
              return done(null, savedUser);
            }
          }
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Validation: Check if email and password are provided
      if (!username || !password) {
        return done(null, false, {
          message: "Please provide all the required fields",
        });
      }

      const emailExists = await UserModel.findOne({ Email: username });

      if (!emailExists) {
        return done(null, false, {
          message: "Email does not exist. Please register first",
        });
      }
      console.log(password, emailExists.Email);

      const hashPassword = bcrypt.compareSync(password, emailExists.Password);

      console.log(hashPassword, emailExists.Email === username);

      if (emailExists.Email === username && hashPassword) {
        console.log("dekho");
        return done(null, emailExists);
      } else {
        return done(null, false, { message: "Invalid Credentials" });
      }
    } catch (error) {
      return done(error, false, { message: "Something went wrong" });
    }
  })
);

app.use("/api", ServiceRoute);
app.use("/api", AuthRoute);
app.use("/api", ContactRoute);
app.use("/api", GoogleAuthRoute);
app.use("/api", CouponRoute);
app.use("/api", RouteTiming);
app.use("/api", TimingRoute);

// check auth
app.get("/api/auth/check", async (req, res) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        throw new Error("Token is not given");
      }

      const decoded = jwt.verify(token, "ROADJETSADMIN");

      const checkAdmin = await UserModel.findOne({
        _id: decoded.userId,
      }).select("-password");

      req.user = checkAdmin;

      return res
        .status(202)
        .json({ status: true, user: req.user, message: "user is logged In" });
    } else {
      // Check if the user is authenticated when there is no Bearer token
      if (req.isAuthenticated()) {
        console.log("this is running");
        return res
          .status(202)
          .json({ status: true, user: req.user, message: "user is logged In" });
      }

      throw new Error("Invalid Auth");
    }
  } catch (error) {
    console.log(error);

    // Check if the user is authenticated in case of JWT verification failure
    if (req.isAuthenticated()) {
      return res
        .status(202)
        .json({ status: true, user: req.user, message: "user is logged In" });
    }

    return res.status(442).json({ message: "Invalid Auth" });
  }
});

const port = 8080;
app.listen(port, (req, res) => {
  console.log(`Server is listening to port ${port}`);
});

dbConnect()
  .then((res) => {
    console.log("connection is successfull to database");
  })
  .catch((err) => {
    console.log(err);
  });
