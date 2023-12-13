import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const fileName = fileURLToPath(import.meta.url);
const __dirName = dirname(fileName);

dotenv.config({ path: path.resolve(__dirName, "../config.env") });

const dbConnect = async () => {
  try {
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Connection string is giving undefined");
    }

    return mongoose.connect(connectionString);
  } catch (error) {
    console.log(error);
  }
};

export default dbConnect;
