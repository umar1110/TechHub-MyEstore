const ErrorHandler = require("../utils/errorhandler");
const catchAsyncFuncError = require("../middleware/catchAsyncFuncError");
const User = require("../Models/userModel");
const sendToken = require("../utils/crJWTTokenAstoreinCokie");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary");
const crypto = require("crypto");

// Register a user
exports.registerUser = catchAsyncFuncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
  });

  sendToken(user, 201, res);
});

// Login user
exports.loginUser = catchAsyncFuncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & password both")), 400;
  } // bad request = 400

  const user = await User.findOne({ email: email }).select("+password");
  // => select() , because bydefault we setted password select to false , means whenever we will apply find() we will not get in password by default

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password"), 401); // 401 = unauthorized
  }

  // Addition for google login
  if (user.loginType !== "email-password") {
    throw new ErrorHandler(
      "You have previously registered using " +
        user.loginType?.toLowerCase() +
        ". Please use the " +
        user.loginType?.toLowerCase() +
        " login option to access your account.",
      400
    );
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password"), 401); // 401 = unauthorized
  }

  sendToken(user, 200, res);
});

// Get user details
exports.getUserDetails = catchAsyncFuncError(async (req, res) => {
  const user = await User.findById(req.user.id);

  

  return res.status(200).json({
    success: true,
    user,
  });
});
// Logout User
exports.logout = catchAsyncFuncError(async (req, res) => {
  
 try {
  req.logout((error)=>{
    console.log("Logout error req.logout() : ", error)
  })
 } catch (error) {
  console.log("Logout error req.logout() trycatch : ", error)
  
 }
 


 
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });
});

// Forgot Password
exports.forgetPassword = catchAsyncFuncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not Found", 404));
  }

  //Get ResetPassword Token
  const resetToken = await user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`  // wich pass through mail
  const resetPasswordUrl = `${req.protocol}:://${req.get(
    "host"
  )}/password/reset/${resetToken}`; // wich pass through mail

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl}\n\n If you have not requested then, ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Tech-Hub Password Recovery",
      message: message,
    });

    res.status(200).json({
      success: true,
      message: `Password recovery Email has been sent to ${user.email} . `,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncFuncError(async (req, res, next) => {
  //Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password does not match with confirm password")
    );
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Update User Password
exports.updatePassword = catchAsyncFuncError(async (req, res, next) => {
  if (
    !(req.body.oldPassword && req.body.newPassword && req.body.confirmPassword)
  ) {
    return next(new ErrorHandler("Please fill all requirements", 401));
  }

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("You entered wrong old password"), 400); // 401 = unauthorized
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("New passwors doesn't match"));
  }

  if (req.body.oldPassword === req.body.newPassword) {
    return next(new ErrorHandler("Old and new Password can't be same"));
  }
  (user.password = req.body.newPassword), await user.save(); // automaticallly run pre method in schema because password modified , and it will convert password to the bcrypt.hash()

  sendToken(user, 200, res);

  // res.status(200).json({
  //     success: true,
  //     user
  // })
});

// Update User Profile
exports.updateProfile = catchAsyncFuncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

// get all users  for (admin)
exports.getAllUsers = catchAsyncFuncError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// get single users  for (admin)
exports.getSingleUser = catchAsyncFuncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User not exists with id ${req.params.id}`, 400)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Role (admin)
exports.updateUserRole = catchAsyncFuncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  if (!user) {
    return next(new ErrorHandler("User id not exist", 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// delete User (admin)
exports.deleteUser = catchAsyncFuncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (user.id === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot delete Yourself", 400));
  }
  if (!user) {
    return next(
      new ErrorHandler(`User Not exist with id : ${req.params.id}`, 400)
    );
  }

  if (user.avatar.public_id != "avatars/oi02sis7gqvbbvjoebx7") {
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
  }

  await User.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// To handle google authentication ( especially with Errors )
exports.socialLoginAuthentication = catchAsyncFuncError(async (req, res, next) => {   
  // console.log("yes aa rhi",req.user)

  const { authError, authGoogle } = req.cookies;

  if (authError) {
    // if any error like , You have preveiously login with email , we saved it in cookie
    res.cookie("authError", null, {
      expires: new Date(Date.now()),
      httpOnly: process.env.NODE_ENV === "production",
    }).cookie("authGoogle", false, {
      expires: new Date(Date.now()),
      httpOnly: process.env.NODE_ENV === "production", // Means this cookie will accessable by only http requests
      // secure : process.env.NODE_ENV === "production",
    });
    return next(new ErrorHandler(authError,401));
  }

  if (authGoogle && req.isAuthenticated()) {
    // check if logging in eith gooogle , only then store token otherwise no need to do it because it's already doing in login with email-password middleware

    res.cookie("authGoogle", false, {
      expires: new Date(Date.now()),
      httpOnly: process.env.NODE_ENV === "production", // Means this cookie will accessable by only http requests
      // secure : process.env.NODE_ENV === "production",
    });
    const user = await User.findOne({ email: req.user?.email });
    return sendToken(user, 200, res);
  }

  return res.json({ success: true });
})


exports.googleAuthenticationCallback = catchAsyncFuncError(async (req, res) => {
  console.log(req.user, "google callback");

  if (req.user.loginType !== "google") {
    const errorMessage =
      "You have previously registered using " +
      req.user.loginType?.toLowerCase()?.split("-").join(" ") +
      ". Please use the " +
      req.user.loginType?.toLowerCase()?.split("-").join(" ") +
      " login option to access your account.";

    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: process.env.NODE_ENV === "production", // Means this cookie will accessable by only http requests
      // secure : process.env.NODE_ENV === "production",
    };

    res.cookie("authError", errorMessage, options);
  }

  // console.log(req.user, "google callback");
  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: process.env.NODE_ENV === "production", // Means this cookie will accessable by only http requests
    // secure : process.env.NODE_ENV === "production",
  };

  return res
    .cookie("authGoogle", true, options)
    .redirect(`${process.env.FRONTEND_URL}login`);
})