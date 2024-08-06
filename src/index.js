import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({ path: ".env" });
const PORT = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT || 8000, (err) => {
      if(!err){
      console.log(`Server is running on PORT : ${PORT}`);
      }
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!", err);
  });