import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRouter from "./routers/auth.routers.js";
import profileRouter from "./routers/profile.routers.js";
import chatRouter from "./routers/chat.routers.js";
import messRouter from "./routers/message.routers.js";
import notiRouter from "./routers/notification.routers.js";
import pointsRouter from "./routers/points.routers.js";
import swipeRouter from './routers/swipe.routers.js'
import { createServer } from "http";
import {setupSocketIO} from "./socket/socket.js";


const app = express();
dotenv.config();
const httpServer = createServer(app);
const io = setupSocketIO(httpServer);
app.set("io", io);

app.get("/health", (req, res) => {
    res.send("Health OK");
});

// middlewares
app.use(
    cors({
        origin: ["*"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
        allowedHeaders: "Authorization, Content-Type, Accept",
        optionsSuccessStatus: 200,
        exposedHeaders: ["set-cookie"], 
    })
);

// const abc = async () => {
//     // const abc = await uploadFile("img1", "test_folder", 'img/jpeg', './testImg.png' );
//     // console.log(abc);
//     const s3 = new AWS.S3();

//     (async () => {
//         await s3.putObject({
//             Bucket: 'amorr-bucket',
//             Key: 'myfile2.txt',
//             Body: 'Hello, World!'
//         }).promise()
//     })()
// }

// abc();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messRouter);
app.use("/api/notification", notiRouter);
app.use("/api/points", pointsRouter);
app.use("/api/swipe", swipeRouter);
export { httpServer };