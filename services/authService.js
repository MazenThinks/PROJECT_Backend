const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");

const User = require("../models/userModel");

//@desc   signin
//@route  GET /api/v1/auth/signin
//@access Public

exports.signup = asyncHandler(async (req, res, next) => {
  try {
    console.log("Signup req.body:", req.body);
    //1- create user
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    // Remove password from user object before sending response
    const userObj = user.toObject();
    delete userObj.password;
    //2- generate JWT token
    const token = createToken(user._id);
    res.status(201).json({ data: userObj, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ message: err.message || "Signup failed" });
  }
});

//@desc   login
//@route  GET /api/v1/auth/login
//@access Public

exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }
  const token = createToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({ data: userObj, token });
});

//@desc make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1- check if token exist, if exists get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login, Please login to get access on this route",
        401
      )
    );
  }

  // 2- verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3- check if user exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new ApiError("User no longer exists", 401));
  }

  // 4- check if user changed password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password, please login again",
          401
        )
      );
    }
  }

  req.user = currentUser;
  next();
});

// [admin , manager]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    //1- acess roles
    //2- access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });

//@desc   forgetpassword
//@route  POST /api/v1/auth/forgotpassword
//@access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1- get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  // 2- if user exist, generate hash reset random 6 digitsand save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // add expirration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();
  // 3- send the reset code via email
  const message = `Hi ${user.name}, \n We received your request to reset your password on your E-shop Account. \n ${resetCode} Enter this code to complete your reset. \n Thanks for helping us to make your accoount secure. \n`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code valid for 10 min",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

//@desc   Verify password reset code
//@route  POST /api/v1/auth/verifyResetCode
//@access Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1- get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Invalid or expired reset code", 400));
  }

  // 2- reset code valid
  user.passwordResetVerified = true;
  await user.save();
  res.status(200).json({ status: "Success", message: "Reset code verified" });
});

//@desc   reset password
//@route  PUT /api/v1/auth/resetPassword
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //1- get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  // 2- check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code is not verified", 400));
  }
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 3- if everything is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({ token });
});


exports.syncFirebaseUser = asyncHandler(async (req, res, next) => {
  const { name, email, uid } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      firebaseUid: uid,
      password: crypto.randomBytes(16).toString("hex"),
    });
  }

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({ data: userObj });
});
