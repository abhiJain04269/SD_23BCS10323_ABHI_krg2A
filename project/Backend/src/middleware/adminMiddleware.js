require("dotenv/config");
const RedisClient = require("../config/redisConnect");
const User = require("../model/user");
const jwt = require("jsonwebtoken");

const AdminMiddleware = async (req, res, next) => {
  try {
    const payload = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
    if (!payload) {
      throw new Error("1Invalid token");
    }
    const Id = payload._id;
    if (!Id) {
      throw new Error("2Invalid token");
    }
    const user = await User.findById(Id);
    req.user = user;
    if (!user) {
      throw new Error("3Invalid token");
    }
    const isBlocked = await RedisClient.get(`token:${req.cookies.token}`);
    if (isBlocked) {
      throw new Error("Invalid token");
    }
    if (payload.Role !== "admin") {
        res.send("You can't register person as admin");
      }
    console.log("token is valid");
    next();
  } catch (error) {
    res.send("Error is" + error);
  }
};

module.exports = AdminMiddleware;