const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;

  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("user already exists !");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        age,
        name,
        password: hash,
      });
      console.log("Registered User:", user);

      let token = jwt.sign({ email, userid: user._id }, "abab");
      res.cookie("token", token);
      res.redirect("/profile");
    });
  });
});
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  res.render("profile", { user });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) {
    console.log("User not found:", email);
    return res.status(500).send("something went wrong");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "abab");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.send("/login");
  else {
    let data = jwt.verify(req.cookies.token, "abab");
    req.user = data;
  }
  next();
}

app.listen(3000);
