const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // build-in

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    maxLength: [30, "Name cannot exceed 30 charaacters"],
    minLength: [4, "Name must have more than 4 character"],
   
  },
 
  
  email: {
    type: String,
    required: [true, "Email is required"],
    index: true,
    trim:true,
    unique: [true, "Email already exists"], // check
    validate: [validator.isEmail, "Please Enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password should must greater than 8 characters"],
    select: false, // use when , someone find any user than the password will not select and display
  },
  role: {
    type: String,
    default: "user",
    enum : ["user" ,"admin"]
  },
 

   loginType: {
      type: String,
      enum: ["google" , "email-password", "facebook"],
      default: "email-password",
    },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
} ,{timestamps : true});

//  Before saving the document , password will be bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
   return  next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

//  JWT Token => use to login automaitically
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//  compare password to login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// GEnerating password resety token
userSchema.methods.getResetPasswordToken = function () {
  // generating token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing add to user schema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); 

  // Setting expire of token to 15min = MILLISECONDS
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};





module.exports = mongoose.model("user", userSchema);
