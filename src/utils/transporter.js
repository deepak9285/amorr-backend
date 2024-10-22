import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const transporter = nodemailer.createTransport({
    // service: "gmail",
    host: "smtp.secureserver.net",
    port: 587,
    secure: true,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

  export {transporter}