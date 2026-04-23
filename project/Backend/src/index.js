const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
require('dotenv/config');
const io = new Server(server, {
    cors: {
        origin: process.env.ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    path: '/socket.io',  // Ensure this path is set!
});

const mongoose = require('mongoose');
const main = require('./config/databaseconnect');
const cookieParser = require('cookie-parser');

const userauth = require("./routes/UserAuth");
const ProblemRouter = require("./routes/ProblemRouter");
const RedisClient = require("./config/redisConnect");
const SubmitRouter = require("./routes/SubmissionRouter");
const cors = require('cors');
const aiRouter = require('./routes/ai');
const videoRouter = require('./routes/videoCreator');

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room based on problem ID (pid)
    socket.on('joinProblemRoom', (pid) => {
        socket.join(pid);
        console.log(`User ${socket.id} joined room ${pid}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('io', io);

const connect = async function () {
    try {
        await RedisClient.connect();
        await main();
        console.log("The database is connected");
        server.listen(process.env.PORT, () => {
            console.log(`Server is listening on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log("Error connecting to database or Redis:", error);
    }
};
connect();

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "CodeVibin Backend is running 🚀"
    });
});

app.use("/user", userauth);
app.use("/problem", ProblemRouter);
app.use("/submission", SubmitRouter);
app.use('/ai', aiRouter);
app.use("/video", videoRouter);