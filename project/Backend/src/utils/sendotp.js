const nodemailer = require('nodemailer');
const { Resend } = require("resend");
require('dotenv').config(); // to read from .env

// const otpMap = new Map(); // email => { otp, expiresAt }

// Reusable transporter using real Gmail
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,   // from .env
//     pass: process.env.EMAIL_PASS,   // 16-digit Gmail App Password
//   },
// });



// Send OTP email
// async function sendOTP(email, otp) {
//   const info = await transporter.sendMail({
//     from: `"LeetCode Clone 👨‍💻" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: 'Your OTP Code',
//     html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
//   });

//   console.log('✅ OTP email sent to:', email);
//   console.log(otp);
//   console.log('📨 Message ID:', info.messageId);
// }

const resend = new Resend(process.env.RESEND_API_KEY);


// console.log("RESEND KEY:", process.env.RESEND_API_KEY);
async function sendOTP(email, otp) {
  try {
    const response = await resend.emails.send({
      from: "LeetCode Clone 👨‍💻 <onboarding@resend.dev>", 
      // ⚠️ Later replace with your verified domain email
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your OTP Code</h2>
          <p>Your OTP is <b>${otp}</b>.</p>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent to:", email);
    console.log("📨 Resend Response:", response);

  } catch (error) {
    console.error("❌ Resend Error:", error);
    throw error; // Important so your controller catch block handles it
  }
}


// Request OTP
async function requestOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpMap.set(email, { otp, expiresAt });
  await sendOTP(email, otp);
}

// Verify OTP
function verifyOTP({ email, otp }) {
  const entry = otpMap.get(email);
  if (!entry) return { success: false, msg: 'OTP not found or expired' };

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(email);
    return { success: false, msg: 'OTP expired' };
  }

  if (String(entry.otp) !== String(otp)) {
    return { success: false, msg: 'Invalid OTP' };
  }

  otpMap.delete(email);
  return { success: true, msg: 'Email verified successfully' };
}

module.exports = {
  sendOTP,
  verifyOTP,
};