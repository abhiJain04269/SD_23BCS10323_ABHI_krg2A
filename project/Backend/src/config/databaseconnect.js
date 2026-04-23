const mongoose = require('mongoose');
require('dotenv/config');

const main = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECT_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit process if connection fails
    }
};

module.exports = main;