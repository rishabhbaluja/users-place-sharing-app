// const { v4: uuid } = require("uuid");

const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, { password: 0 });
  } catch (error) {
    return next(new HttpError("Could not retreive users, please try again!", 500));
  }
  res.json({
    users: users.map((user) => {
      return user.toObject({ getters: true });
    }),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again later.", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User exists already, please login instead.", 422);
    return next(error);
  }

  let hashedPassword;
  //Takes in 2 arguments password you want to hash and number of salting rounds
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  //Generate token
  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Logging-in failed, please try again later.", 500);
    return next(error);
  }
  if (!existingUser) {
    return next(new HttpError("Could not identify user, credentials seem to be wrong.", 403));
  }

  let isValidPassword = false;
  //Pass in the new incomming password and hashed pass. present in db
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Could not log you in, please check the credentials and try again.", 500)
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("Could not identify user, credentials seem to be wrong.", 403));
  }

  //Generate token
  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again.", 500);
    return next(error);
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
