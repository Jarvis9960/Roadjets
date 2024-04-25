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

console.log(process.env.RAZOR_KEY_ID);
console.log(process.env.RAZOR_KEY_SECRET);

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
      queryRecipient = "admin_confirm";
    } else {
      queryRecipient = "driver_template";
    }
    // const response = await axios({
    //   method: "post",
    //   url: "https://graph.facebook.com/v18.0/208790375646910/messages",
    //   headers: {
    //     Authorization: `Bearer ${process.env.WHATSAPPTOKEN}`,
    //     "Content-Type": "application/json",
    //   },
    //   data: {
    //     messaging_product: "whatsapp",
    //     to: recipient,
    //     type: "template",
    //     template: {
    //       name: queryRecipient,
    //       language: {
    //         code: "en",
    //       },
    //       components: [
    //         {
    //           type: "BODY",
    //           parameters: Object.entries(parameterObject).map(
    //             ([key, value]) => ({
    //               type: "TEXT",
    //               text: value.toString(),
    //             })
    //           ),
    //         },
    //       ],
    //     },
    //   },
    // });

    const response = await axios({
      method: "POST",
      url: `https://live-mt-server.wati.io/309819/api/v1/sendTemplateMessage?whatsappNumber=${recipient}`,
      data: {
        template_name: "admin_msg",
        broadcast_name: "Untitled_120420242244",
        parameters: [
          {
            name: "1",
            value: parameterObject[1],
          },
          {
            name: "2",
            value: parameterObject[2],
          },
          {
            name: "3",
            value: parameterObject[3],
          },
          {
            name: "4",
            value: parameterObject[4],
          },
          {
            name: "5",
            value: parameterObject[5],
          },
          {
            name: "6",
            value: parameterObject[6],
          },
          {
            name: "7",
            value: parameterObject[7],
          },
          {
            name: "8",
            value: parameterObject[8],
          },
          {
            name: "9",
            value: parameterObject[9],
          },
          {
            name: "10",
            value: parameterObject[10],
          },
          {
            name: "11",
            value: parameterObject[11],
          },
        ],
      },
      headers: {
        Authorization: `Bearer ${process.env.WATITOKEN}`,
        "Content-Type": "application/json",
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

const sendBookingConfirmationUser = async (parameterObject, recipient) => {
  try {
    // const response = await axios({
    //   method: "post",
    //   url: "https://graph.facebook.com/v18.0/208790375646910/messages",
    //   headers: {
    //     Authorization: `Bearer ${process.env.WHATSAPPTOKEN}`,
    //     "Content-Type": "application/json",
    //   },
    //   data: {
    //     messaging_product: "whatsapp",
    //     to: recipient,
    //     type: "template",
    //     template: {
    //       name: "user_template",
    //       language: {
    //         code: "en",
    //       },
    //     },
    //   },
    // });

    const response = await axios({
      method: "POST",
      url: `https://live-mt-server.wati.io/309819/api/v1/sendTemplateMessage?whatsappNumber=${recipient}`,
      data: {
        template_name: "ride_confirm",
        broadcast_name: "Untitled_120420242246",
        parameters: [
          {
            name: "1",
            value: parameterObject[1],
          },
          {
            name: "2",
            value: parameterObject[2],
          },
          {
            name: "3",
            value: parameterObject[3],
          },
        ],
      },
      headers: {
        Authorization: `Bearer ${process.env.WATITOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`Message sent to ${recipient}:`, response.data);
    return response.data; // Return the response data for Promise.all
  } catch (error) {
    console.log(error)
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

        const userParameterObject = {
          1: orderObject[razorpay_order_id].orderData.notes?.pickUpLocations,
          2: orderObject[razorpay_order_id].orderData.notes?.dropLocation,
          3: AdminPhone,
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
            // sendBookingConfirmation(
            //   driverNumber,
            //   driverParameterObject,
            //   "DRIVER"
            // ),
            sendBookingConfirmationUser(
              userParameterObject,
              orderObject[razorpay_order_id].orderData.notes?.phone
            ),
          ])
            .then((responses) => {
              delete orderObject[razorpay_order_id];

              return res.redirect(
                "https://www.roadjets.in?orderStatus=success"
              );
            })
            .catch((error) => {
              // Handle errors if any of the promises fail
              console.log(error)
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
