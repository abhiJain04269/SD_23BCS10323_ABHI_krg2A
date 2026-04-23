const express=require('express');
const router = express.Router();
const {RegisterRequestOTP,RequestForgotOtp,VerifyForgotOtp,RegisterVerifyOTP,AdminRegister,Login,Logout,isAuthenticated,updateProfile,Userfind,checkPass,deleteProfile}=require("../controllers/userauth");
const token_validate = require('../middleware/user_Middleware');
const AdminMiddleware = require('../middleware/adminMiddleware');
const {generateUploadSignature,deletePhoto,savePhotoMetadata}=require("../controllers/photosection")

router.post('/register/request-otp', RegisterRequestOTP);
router.post('/register/verify-otp', RegisterVerifyOTP);
router.post("/forgot/request-otp",RequestForgotOtp)
router.post("/forgot/verify-otp",VerifyForgotOtp);
router.post("/resetPassword",checkPass);
router.post("/admin/register",AdminMiddleware,AdminRegister);
router.get("/find",token_validate,Userfind);
router.post("/login",Login);
router.post("/logout",token_validate,Logout);
router.get("/check",token_validate,isAuthenticated);
router.get("/photoupload/create",token_validate,generateUploadSignature);
router.delete("/photoupload/delete",token_validate,deletePhoto);
router.post("/photoupload/save",token_validate,savePhotoMetadata);
router.post("/EditProfile",token_validate,updateProfile);
router.post("/delete",token_validate,deleteProfile);

module.exports=router
