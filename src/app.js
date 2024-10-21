import cors from "cors";
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     credentials: true,
//     allowedHeaders: "Authorization, Content-Type, Accept",
//     optionsSuccessStatus: 200,
//     exposedHeaders: ["set-cookie"],
//   })
// );


import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import authRouter from "./routers/auth.routers.js";
import profileRouter from "./routers/profile.routers.js";

const app = express();
dotenv.config();

app.get("/health", (req, res) => {
  res.send("Health OK");
});

app.use(
  cors({
    origin: "*",
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

export { app };
