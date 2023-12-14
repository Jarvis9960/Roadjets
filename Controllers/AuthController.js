import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserModel from "../Models/AuthModel.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import dotenv from "dotenv";
import passport from "passport";

const fileName = fileURLToPath(import.meta.url);
const __dirName = dirname(fileName);

dotenv.config({ path: path.resolve(__dirName, "../config.env") });

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(422).json({
        status: false,
        message: "Please provide all the required field properly",
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    const newUser = new UserModel({
      FullName: fullName,
      Email: email,
      Password: hashPassword,
    });

    const saveUser = await newUser.save();

    if (saveUser) {
      return res
        .status(201)
        .json({ status: true, message: "User Registered successfully" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "something went wrong", err: error });
  }
};



// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(422).json({
//         status: false,
//         message: "Please provide all the required field",
//       });
//     }

//     const emailExists = await UserModel.findOne({ Email: email });

//     if (emailExists) {
//       return res
//         .status(422)
//         .json({ status: false, message: "Email already exists" });
//     }

//     const hashPassword = bcrypt.compareSync(password, emailExists.Password);

//     if (emailExists.Email === email && hashPassword) {
//       const token = jwt.sign(
//         { userId: emailExists._id },
//         process.env.JWT_SECRET,
//         { expiresIn: "30d" }
//       );

//       res.cookie("Token", token, {
//         httpOnly: true,
//         secure: false,
//       });

//       return res.status(201).json({
//         status: true,
//         message: "User successfully Logged In",
//         token: token,
//       });
//     } else {
//       return res
//         .status(401)
//         .json({ status: false, message: "Invalid Crendential" });
//     }
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ status: false, message: "something went wrong", err: error });
//   }
// };
