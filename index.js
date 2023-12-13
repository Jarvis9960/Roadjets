import express from "express";
import cors from "cors";
import ServiceRoute from "./Routers/ServicesRouters.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import dbConnect from "./Database/DbConnect.js";
import AuthRoute from "./Routers/AuthRoutes.js";
import ContactRoute from "./Routers/ContactusRoutes.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import UserModel from "./Models/AuthModel.js";
import GoogleAuthRoute from "./Routers/GoogleAuthRoutes.js";

const fileName = fileURLToPath(import.meta.url);
const __dirName = dirname(fileName);

dotenv.config({ path: path.resolve(__dirName, "./config.env") });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.set("trust proxy", 1);

// configuring session middleware
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "none", // Set to 'none' for cross-origin requests
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js session serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
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
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        // Validation: Check if email and password are provided
        if (!email || !password) {
          return done(null, false, {
            message: "Please provide all the required fields",
          });
        }

        const emailExists = await UserModel.findOne({ Email: email });

        if (emailExists) {
          return done(null, false, {
            message: "Email already exists",
          });
        }

        if (!emailExists) {
          return done(null, false, {
            message: "Email does not exist. Please register first",
          });
        }

        const hashPassword = bcrypt.compareSync(password, emailExists.Password);

        if (emailExists.Email === email && hashPassword) {
          return done(null, emailExists);
        } else {
          return done(null, false, { message: "Invalid Credentials" });
        }
      } catch (error) {
        return done(error, false, { message: "Something went wrong" });
      }
    }
  )
);

app.use("/api", ServiceRoute);
app.use("/api", AuthRoute);
app.use("/api", ContactRoute);
app.use("/api", GoogleAuthRoute);

// check Auth
app.get("/api/auth/check", (req, res) => {
  try {
    if (req.isAuthenticated()) {
      return res
        .status(202)
        .json({ status: true, user: req.user, message: "user is logged In" });
    }

    return res
      .status(401)
      .json({ status: true, message: "user is not logged In" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "something went wrong",
      err: error,
    });
  }
});

const port = 3000;
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
