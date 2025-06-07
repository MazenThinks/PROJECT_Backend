const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");

const User = require("../models/userModel");
const admin = require("../config/firebase");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isFirebaseToken = (token) => {
  try {
    const decodedPayload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return decodedPayload.iss && decodedPayload.iss.includes("https://securetoken.google.com/");
  } catch {
    return false;
  }
};
const isGoogleIdToken = (token) => {
  try {
    const [headerB64, payloadB64] = token.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString());
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString());

    return (
      header.kid && // يجب أن يحتوي على kid لتوقيع Google
      payload.aud === process.env.GOOGLE_CLIENT_ID
    );
  } catch {
    return false;
  }
};


//@desc   signup
//@route  GET /api/v1/auth/signup
//@access Public
exports.signup = asyncHandler(async (req, res, next) => {
  try {
    if (typeof req.body.password !== "string") {
      return next(new ApiError("Password must be a string", 400));
    }

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    const userObj = user.toObject();
    delete userObj.password;

    const token = createToken(user._id);
    res.status(201).json({ data: userObj, token });
  } catch (err) {
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
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new ApiError("You are not logged in", 401));

  try {
    if (isFirebaseToken(token)) {
      const decodedFb = await admin.auth().verifyIdToken(token);
      let user = await User.findOne({ firebaseUid: decodedFb.uid });

      if (!user) {
        const existingUser = await User.findOne({ email: decodedFb.email });
        if (existingUser) {
          user = existingUser;
        } else {
          const randomPassword = crypto.randomBytes(16).toString("hex");
          user = await User.create({
            name: decodedFb.name || "Firebase User",
            email: decodedFb.email,
            firebaseUid: decodedFb.uid,
            password: randomPassword,
            role: 'user',
            gender: req.body?.gender || null,
            dob: req.body?.dob || null,
            age: req.body?.age || null,
            address: req.body?.address || null,
            phone: req.body?.phone || null,
            profileImg: req.body?.profileImg || null,
          });
        }
      } else {
        user.name = decodedFb.name || user.name;
        user.email = decodedFb.email || user.email;
        user.firebaseUid = decodedFb.uid || user.firebaseUid;
        user.gender = req.body?.gender || user.gender;
        user.dob = req.body?.dob || user.dob;
        user.age = req.body?.age || user.age;
        user.address = req.body?.address || user.address;
        user.phone = req.body?.phone || user.phone;
        user.profileImg = req.body?.profileImg || user.profileImg;
        user.role = user.role || 'user';
        await user.save();
      }

      req.user = user;
      return next();
    }
  } catch (firebaseErr) {
    console.log("Firebase token failed:", firebaseErr.message);
  }

  try {
    if (isGoogleIdToken(token)) {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      let user = await User.findOne({ email: payload.email });

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        user = await User.create({
          name: payload.name,
          email: payload.email,
          firebaseUid: payload.sub,
          password: randomPassword,
          role: 'user',
          gender: req.body?.gender || null,
          dob: req.body?.dob || null,
          age: req.body?.age || null,
          address: req.body?.address || null,
          phone: req.body?.phone || null,
          profileImg: req.body?.profileImg || null,
        });
      } else {
        user.name = payload.name || user.name;
        user.firebaseUid = payload.sub || user.firebaseUid;
        user.gender = req.body?.gender || user.gender;
        user.dob = req.body?.dob || user.dob;
        user.age = req.body?.age || user.age;
        user.address = req.body?.address || user.address;
        user.phone = req.body?.phone || user.phone;
        user.profileImg = req.body?.profileImg || user.profileImg;
        user.role = user.role || 'user';
        await user.save();
      }

      req.user = user;
      return next();
    }
  } catch (googleErr) {
    console.log("Google token failed:", googleErr.message);
  }

  try {
    // JWT التقليدي (backend)
    const decodedJwt = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decodedJwt.userId);

    if (!user) return next(new ApiError("User no longer exists", 401));

    if (user.passwordChangedAt) {
      const passChangedAt = parseInt(user.passwordChangedAt / 1000, 10);
      if (passChangedAt > decodedJwt.iat) {
        return next(new ApiError("Password changed, login again", 401));
      }
    }

    req.user = user;
    return next();
  } catch (jwtErr) {
    return next(new ApiError("Invalid or expired token", 401));
  }
});


// [admin , manager]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("You are not allowed to access this route", 403));
    }
    next();
  });

//@desc   forgot password
//@route  POST /api/v1/auth/forgotpassword
//@access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with that email ${req.body.email}`, 404));
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.name},\nYour password reset code is: ${resetCode}.\nThis code is valid for 10 minutes.\n`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    return next(new ApiError("There was an error sending the email", 500));
  }

  res.status(200).json({ status: "Success", message: "Reset code sent to email" });
});

//@desc   Verify password reset code
//@route  POST /api/v1/auth/verifyResetCode
//@access Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto.createHash("sha256").update(req.body.resetCode).digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError("Invalid or expired reset code", 400));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: "Success", message: "Reset code verified" });
});

//@desc   reset password
//@route  PUT /api/v1/auth/resetPassword
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with that email ${req.body.email}`, 404));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code is not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  const token = createToken(user._id);
  res.status(200).json({ token });
});

//@desc   sync firebase user if not in DB
//@route  POST /api/v1/auth/syncFirebaseUser
//@access Public
exports.syncFirebaseUser = asyncHandler(async (req, res, next) => {
  const { name, email, uid } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString("hex");

    user = await User.create({
      name,
      email,
      firebaseUid: uid,
      password: randomPassword,
      role: "user",
      gender: req.body.gender || null,
      dob: req.body.dob || null,
      age: req.body.age || null,
      address: req.body.address || null,
      phone: req.body.phone || null,
      profileImg: req.body.profileImg || null,
    });
  } else {
    // تحديث بيانات المستخدم لو موجود
    user.name = name || user.name;
    user.firebaseUid = uid || user.firebaseUid;
    user.gender = req.body.gender || user.gender;
    user.dob = req.body.dob || user.dob;
    user.age = req.body.age || user.age;
    user.address = req.body.address || user.address;
    user.phone = req.body.phone || user.phone;
    user.profileImg = req.body.profileImg || user.profileImg;

    await user.save();
  }

  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({ data: userObj });
});
