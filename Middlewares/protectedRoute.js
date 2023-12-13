import UserModel from "../Models/AuthModel.js";

export const protectedRoute = async (req, res, next) => {
  if (req.isAuthenticated()) {
    const currentUserId = req.user._id;

    const savedUserModel = await UserModel.findById(currentUserId);

    if (!savedUserModel) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    return next();
  }

  res.status(401).json({ error: "Unauthorized user please login first" });
};
