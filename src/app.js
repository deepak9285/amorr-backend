import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRouter from "./routers/auth.routers.js";
import profileRouter from "./routers/profile.routers.js";
import chatRouter from "./routers/chat.routers.js";
import messRouter from "./routers/message.routers.js";
import { createServer } from "http";
import setupSocketIO from "./socket/socket.js";

const app = express();
dotenv.config();
const httpServer = createServer(app);
const io = setupSocketIO(httpServer);
app.set("io", io);

app.get("/health", (req, res) => {
    res.send("Health OK");
});

app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
        allowedHeaders: "Authorization, Content-Type, Accept",
        optionsSuccessStatus: 200,
        exposedHeaders: ["set-cookie"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messRouter);

export { httpServer };
