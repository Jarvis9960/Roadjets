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
    console.log(error)
    return res
      .status(500)
      .json({ status: false, message: "something went wrong", err: error });
  }
};
