import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const transporter = nodemailer.createTransport({    
  host: "smtpout.secureserver.net",  
  secure: true,
  secureConnection: false, // TLS requires secureConnection to be false
  tls: {
      ciphers:'SSLv3'
  },
  requireTLS:true,
  port: 465,
  debug: true,
  auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS 
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP connection successful!");
  }
});

export { transporter };
