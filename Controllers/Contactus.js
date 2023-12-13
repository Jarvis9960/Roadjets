import nodemailer from "nodemailer";

export const contactUs = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    if (!firstName || !lastName || !email || !phone || !subject || !message) {
      return res.status(422).json({
        status: false,
        message: "Please provide all the required field",
      });
    }

    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "roadjets.in@gmail.com",
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: email, // sender address
      to: "roadjets.in@gmail.com", // list of receivers
      subject: "Contact Form", // Subject line
      // text: "", // plain text body
      html: `<div><span>Name:-</span><span>${firstName}${lastName}</span></div><br/><div><span>Phone:-</span><span>${phone}</span></div><br/><div><span>Subject:-</span><span>${subject}</span></div><div><span>Message:-</span><span>${message}</span></div>`, // html body
    });

    if (info.accepted[0] === email) {
      return res.status(201).json({
        status: true,
        Message: "Your Form is submitted. We will reach out to you soon",
      });
    } else {
      return res
        .status(201)
        .json({ status: true, Message: "Your Form is Not submitted" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "something went wrong" });
  }
};
