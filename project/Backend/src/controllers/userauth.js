const mongoose = require("mongoose");
const Validate = require("../utils/validate");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const token_validate = require("../middleware/user_Middleware");
const RedisClient = require("../config/redisConnect");
const validator = require('validator');
const nodemailer = require('nodemailer');

const {sendOTP} =require("../utils/sendotp");
const pendingUserMap = new Map();

const RegisterRequestOTP = async (req, res) => {
  
  try {
    const { First_Name,Last_Name ,Email_Id, Password } = req.body;
    await Validate(req.body);
    const existingUser = await User.findOne({ Email_Id });
    if (existingUser) return res.status(409).json({ message: "Email already registered" });
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    pendingUserMap.set(Email_Id, {
      userData: { First_Name,Last_Name,Email_Id, Password },
      otp,
      expiresAt
    });
    await sendOTP(Email_Id, otp);
    console.log("try");
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

const RegisterVerifyOTP = async (req, res) => {
  const { Email_Id, otp } = req.body;

  const entry = pendingUserMap.get(Email_Id);
  if (!entry) return res.status(400).json({ message: "OTP expired or not requested" });

  if (Date.now() > entry.expiresAt) {
    pendingUserMap.delete(Email_Id);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (String(entry.otp) !== String(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const { userData } = entry;
  const hashedPassword = await bcrypt.hash(userData.Password, 10);

  console.log(userData);
  const {First_Name}=userData;
  const sanitizedFirstName = First_Name.trim().replace(/\s+/g, '');


  let isUnique = false;
  let User_Name = "";

  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    User_Name = sanitizedFirstName + randomDigits;

    const existingUser = await User.findOne({ User_Name });
    if (!existingUser) {
      isUnique = true;
    }
  }
  const newUser = await User.create({
    ...userData,
    Password: hashedPassword,
    UserName: User_Name
  });


  const token = jwt.sign(
    {
      _id: newUser._id,
      Email_Id: newUser.Email_Id,
      Role: newUser.Role,
    },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  const reply = {
    UserName: newUser.UserName,
    First_Name: newUser.First_Name,
    Email_Id: newUser.Email_Id,
    _id: newUser._id,
    Profile_Photo: newUser.Profile_Photo || '',
    Profile_Photo_PublicId: newUser.Profile_Photo_PublicId || '',
  };

  pendingUserMap.delete(Email_Id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
  res.status(201).json({
    user: reply,
    message: "Registered and verified successfully",
  });
};

const RequestForgotOtp = async (req, res) => {
  const { Email_Id } = req.body;
  
  // await Validate(req.body);
  
  const existingUser = await User.findOne({ Email_Id });
  if (!existingUser) return res.status(409).json({ message: "Email Not registered" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Date.now() + 5 * 60 * 1000;

  pendingUserMap.set(Email_Id, {
    userData: {First_Name:existingUser.First_Name,Email_Id,Password:existingUser.Password},
    otp,
    expiresAt
  });
      console.log("try");
  try {
    await sendOTP(Email_Id, otp);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const VerifyForgotOtp = async (req, res) => {
  const { Email_Id, OTP } = req.body;

  const entry = pendingUserMap.get(Email_Id);
  if (!entry) return res.status(400).json({ message: "OTP expired or not requested" });

  if (Date.now() > entry.expiresAt) {
    pendingUserMap.delete(Email_Id);
    return res.status(400).json({ message: "OTP expired" });
  }
  if (String(entry.otp) !== OTP) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const existingUser = await User.findOne({ Email_Id });
  
  pendingUserMap.delete(Email_Id);

  res.status(201).json({
    message: "OTP verified",
  });
};

const checkPass = async (req, res) => {
  try {
    const { Email_Id, Password } = req.body;

    if (!validator.isStrongPassword(Password)) {
        throw new Error("Password is not strong enough");
    }
    const hashedPassword = await bcrypt.hash(Password, 10);

    const user = await User.findOneAndUpdate(
      { Email_Id: Email_Id },
      { Password: hashedPassword },
      { new: true, runValidators: false } 
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: 'Error resetting password', error: error.message });
  }
};
const AdminRegister = async (req, res) => {
  //The person who is trying to register person as admin is itself admin or not
  //first check req.body contains all needed files or not
  //second email id is valid or not
  //password is strong or not
  //stored the password in hash format

  await Validate(req.body);
  req.body.Role = "admin";
  await User.create(req.body);

  
};


const Login = async (req, res) => {

  console.log("hi");
  try {
    const { Email_Id, Password } = req.body;

    // Validate input
    if (!Email_Id) {
      return res.status(400).json({ error: 'Email is missing' });
    }
    if (!Password) {
      return res.status(400).json({ error: 'Password is missing' });
    }

    // Find user
    const user = await User.findOne({ Email_Id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // Generate JWT
    if (!process.env.SECRET_KEY) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    const token = jwt.sign(
      { _id: user._id, Email_Id: user.Email_Id, Role: user.Role },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Prepare response
    const reply = {
      UserName: user.UserName,
      First_Name: user.First_Name,
      Email_Id: user.Email_Id,
      _id: user._id,
      Role: user.Role,
      Profile_Photo: user.Profile_Photo || '',
      Profile_Photo_PublicId: user.Profile_Photo_PublicId || '',
    };

    console.log(reply);
    // Set cookie and send response
    res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
    return res.json({
      user: reply,
      message: 'Logged in successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to login' });
  }
};

const Logout = async (req, res) => {
  try {
    //first validate (check the request token is valid or not)

    //if valid add to blocklist of redis
    const isblocked = await RedisClient.get(`token:${req.cookies.token}`);
    if (isblocked) {
      throw new Error("invalid token");
    }
    await RedisClient.set(`token:${req.cookies.token}`, "blocked");
    const decoded = jwt.decode(req.cookies.token);
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const ttlInSeconds = decoded.exp - now;
    await RedisClient.expire(`token:${req.cookies.token}`, ttlInSeconds);

    //remove the token from cookie
    res.clearCookie("token");
    res.send("Logged out successfully");
  } catch (error) {
    res.send("Logout failed");
  }
};

const isAuthenticated=async(req,res)=>{
  try{
    const reply={
    UserName:req.user.UserName,
    First_Name:req.user.First_Name,
    Email_Id:req.user.Email_Id,
    _id:req.user._id,
    Role:req.user.Role,
    Profile_Photo: req.user.Profile_Photo || "",
    Profile_Photo_PublicId: req.user.Profile_Photo_PublicId || "",
    }
    res.json({
      user:reply,
      message:"Valid User"
    })
  }
  catch(err){
    res.send("Error is: "+err);
  }
}
// Update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes user ID from authentication middleware
    const { First_Name, Last_Name, Age, Email_Id, Old_Password, Password } = req.body;

    // Fetch the user once
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData = { First_Name, Last_Name, Age, Email_Id };

    if (Password || Old_Password) {
      if (!Old_Password) {
        return res.status(400).json({ error: 'Old password is required to update password' });
      }
      if (!Password) {
        return res.status(400).json({ error: 'New password is required when providing old password' });
      }

      // Verify old password
      const isMatch = await bcrypt.compare(Old_Password, user.Password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect old password' });
      }

      if (!validator.isStrongPassword(Password)) {
         return res.status(400).json({ error: 'Password is weak' });
      }
      updateData.Password = await bcrypt.hash(Password, 10);
    }

    // Check if Email_Id is changing and unique
    if (Email_Id && Email_Id !== user.Email_Id) {
      const existingUser = await User.findOne({ Email_Id });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: 'First_Name Last_Name Age Email_Id Role Profile_Photo Profile_Photo_PublicId _id' }
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const Userfind=async(req,res)=>{
  try{
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user:user,
      message:"Valid User"
    })
  }
  catch (error) {
    res.status(500).json({ error: "Failed to Fetch profile" });
  }
};

const deleteProfile = async (req, res) => {
  console.log(req.body);
  const { Password } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatched = await bcrypt.compare(Password, user.Password);

    if (!isMatched) {
      return res.status(401).json({ message: "Wrong Password" });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ isdeleted:1 ,message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ isdeleted:0,error: "Internal Server Error" });
  }
};

module.exports = { RegisterRequestOTP,RequestForgotOtp,VerifyForgotOtp,RegisterVerifyOTP ,checkPass,AdminRegister, Login, Logout ,isAuthenticated,updateProfile,Userfind,deleteProfile};
