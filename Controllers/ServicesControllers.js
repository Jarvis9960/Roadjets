import Razorpay from "razorpay";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";
import crypto from "crypto";
import axios from "axios";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import BookingModel from "../Models/BookingModel.js";
import fs from "node:fs";

const fileName = fileURLToPath(import.meta.url);
const __dirName = dirname(fileName);
let breakIndex = __dirName.lastIndexOf("\\") + 1;
let result = __dirName.substring(0, breakIndex);

dotenv.config({ path: `${result}config.env` });

const jsonData = JSON.parse(
  fs.readFileSync(path.resolve("Google_Crendential.json"), "utf-8")
);

console.log(jsonData);

const client_email = jsonData.client_email;
const private_key = jsonData.private_key;

const serviceAccountAuth = new JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(
  "1PpSh4RxuJtzP9w7Id3uwZgDHxIjwEV2pvDtgRF-J6G4",
  serviceAccountAuth
);

var orderObject = {};

let instance = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID,
  key_secret: process.env.RAZOR_KEY_SECRET,
});

export const bookRideFromWhatApp = async (req, res) => {
  try {
    const { toPhone, message } = req.body;

    if (!toPhone || !message) {
      return res
        .status(422)
        .json({ status: false, message: "Invalid Input's" });
    }

    const whatsappUrl = `https://wa.me/${toPhone}?text=${encodeURIComponent(
      message
    )}`;

    console.log(whatsappUrl);

    return res.status(201).json({ link: whatsappUrl });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "something went wrong", err: error });
  }
};

export const checkout = async (req, res) => {
  try {
    const {
      amount,
      bookRide,
      name,
      phone,
      email,
      seats,
      pickUpLocations,
      dropLocation,
      timings,
      route,
      passengerDetails,
      bookingDate,
    } = req.body;

    if (
      !amount ||
      !bookRide ||
      !name ||
      !phone ||
      !email ||
      !seats ||
      !pickUpLocations ||
      !dropLocation ||
      !timings ||
      !route ||
      !passengerDetails ||
      !bookingDate
    ) {
      return res.status(422).json({
        status: false,
        message: "Please provide all the required field properly",
      });
    }

    const passengerDetailsJson = JSON.stringify(passengerDetails);

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      notes: {
        bookRide: bookRide,
        name: name,
        phone: phone,
        email: email,
        seats: seats,
        pickUpLocations: pickUpLocations,
        dropLocation: dropLocation,
        timings: timings,
        route: route,
        passengerDetails: passengerDetailsJson,
        bookingDate: bookingDate,
      },
    };

    const order = await instance.orders.create(options);

    orderObject[order.id] = { orderData: order };

    if (order) {
      return res
        .status(201)
        .json({ status: true, message: "order created", order });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "something went wrong", err: error });
  }
};

const sendBookingConfirmation = async (recipient, parameterObject, user) => {
  try {
    let queryRecipient;
    if (user === "ADMIN") {
      queryRecipient = "ride_confirm";
    } else {
      queryRecipient = "driver_template";
    }
    const response = await axios({
      method: "post",
      url: "https://graph.facebook.com/v18.0/208790375646910/messages",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPPTOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: queryRecipient,
          language: {
            code: "en",
          },
          components: [
            {
              type: "BODY",
              parameters: Object.entries(parameterObject).map(
                ([key, value]) => ({
                  type: "TEXT",
                  text: value.toString(),
                })
              ),
            },
          ],
        },
      },
    });

    console.log(`Message sent to ${recipient}:`, response.data);
    return response.data; // Return the response data for Promise.all
  } catch (error) {
    console.error(
      `Error sending message to ${recipient}:`,
      error.response ? error.response.data : error.message
    );
    throw error; // Propagate the error for Promise.all
  }
};

const sendBookingConfirmationUser = async (recipient) => {
  try {
    const response = await axios({
      method: "post",
      url: "https://graph.facebook.com/v18.0/208790375646910/messages",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPPTOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: "user_template",
          language: {
            code: "en",
          },
        },
      },
    });

    console.log(`Message sent to ${recipient}:`, response.data);
    return response.data; // Return the response data for Promise.all
  } catch (error) {
    console.error(
      `Error sending message to ${recipient}:`,
      error.response ? error.response.data : error.message
    );
    throw error; // Propagate the error for Promise.all
  }
};

export const paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    var expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const verifyPayment = expectedSignature === razorpay_signature;

    if (verifyPayment) {
      console.log(orderObject[razorpay_order_id]);
      if (orderObject[razorpay_order_id]) {
        const AdminPhone = "919381290983";
        const driverNumber = "919908918183";

        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];

        const headers = [
          "NAME",
          "EMAIL",
          "BOOKRIDE",
          "SEATS",
          "PICKUP",
          "DROP",
          "TIMINGS",
          "PHONE",
          "ROUTE",
          "BOOKINGTIMINGS",
          "PASSENGERLIST",
        ];

        await sheet.setHeaderRow(headers);

        const parameterObject = {
          1: orderObject[razorpay_order_id].orderData.notes?.name,
          2: orderObject[razorpay_order_id].orderData.notes?.email,
          3: orderObject[razorpay_order_id].orderData.notes?.bookRide,
          4: orderObject[razorpay_order_id].orderData.notes?.seats,
          5: orderObject[razorpay_order_id].orderData.notes?.pickUpLocations,
          6: orderObject[razorpay_order_id].orderData.notes?.dropLocation,
          7: orderObject[razorpay_order_id].orderData.notes?.timings,
          8: orderObject[razorpay_order_id].orderData.notes?.phone,
          9: orderObject[razorpay_order_id].orderData.notes?.route,
          10: orderObject[razorpay_order_id].orderData.notes?.bookingDate,
          11: orderObject[razorpay_order_id].orderData.notes?.passengerDetails,
        };

        const driverParameterObject = {
          1: orderObject[razorpay_order_id].orderData.notes?.name,
          2: orderObject[razorpay_order_id].orderData.notes?.phone,
          3: orderObject[razorpay_order_id].orderData.notes?.bookRide,
          4: orderObject[razorpay_order_id].orderData.notes?.seats,
          5: orderObject[razorpay_order_id].orderData.notes?.pickUpLocations,
          6: orderObject[razorpay_order_id].orderData.notes?.dropLocation,
          7: orderObject[razorpay_order_id].orderData.notes?.timings,
          8: orderObject[razorpay_order_id].orderData.notes?.bookingDate,
          9: orderObject[razorpay_order_id].orderData.notes?.passengerDetails,
        };

        // Convert parameterObject values to an array based on the headers
        const dataArray = headers.map(
          (header) => parameterObject[headers.indexOf(header) + 1]
        );

        // Add data to the sheet
        await sheet.addRow(dataArray);

        const passengerDetailsObj = JSON.parse(
          orderObject[razorpay_order_id].orderData.notes?.passengerDetails
        );

        const bookDate = new Date(
          orderObject[razorpay_order_id].orderData.notes?.bookingDate
        );

        const bookingDetailsObj = {
          bookingDetails: parameterObject,
          passengerList: passengerDetailsObj,
        };

        const savedBookingDetails = new BookingModel({
          bookingDate: bookDate,
          bookingDetails: bookingDetailsObj,
        });

        const response = await savedBookingDetails.save();

        if (response) {
          Promise.all([
            sendBookingConfirmation(AdminPhone, parameterObject, "ADMIN"),
            sendBookingConfirmation(
              driverNumber,
              driverParameterObject,
              "DRIVER"
            ),
            sendBookingConfirmationUser(
              orderObject[razorpay_order_id].orderData.notes?.phone
            ),
          ])
            .then((responses) => {
              delete orderObject[razorpay_order_id];

              return res.redirect("http://localhost:8080?orderStatus=success");
            })
            .catch((error) => {
              // Handle errors if any of the promises fail
              console.error("Error sending messages:", error.response.data);
              // Send your error response here
            });
        } else {
          throw new Error("Error in database. Please contact administration");
        }
      }
    } else {
      throw new Error("Booking Failed. Please try again");
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "something went wrong", err: error });
  }
};
