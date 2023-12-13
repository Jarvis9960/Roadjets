import passport from "passport";

export const authenticate = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const authenticateCallback = passport.authenticate("google", {
  failureRedirect: "http://127.0.0.1:5173/login",
  session: true,
});

export const redirectCallback = async (req, res) => {
  try {
    res.redirect("http://127.0.0.1:5173");
  } catch (error) {
    console.log(error);
  }
};

export const logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      // Handle error
      console.error(err);
      return res.status(500).send("Error occurred during logout");
    }
    req.session.destroy(function (err) {
      if (err) {
        // Handle error
        console.error(err);
        return res
          .status(500)
          .send("Error occurred during session destruction");
      }
      res.send("Logged out successfully");
    });
  });
};
