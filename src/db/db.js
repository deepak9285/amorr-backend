// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const connectionInstance = await mongoose.connect(process.env.DB, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(
//       `MongoDB connected! DB HOST : ${connectionInstance.connection.host}`
//     );
//   } catch (error) {
//     console.log("MONGODB connection failed : ", error);
//     throw error;
//   }
// };

// export default connectDB;


import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DB}/${process.env.DB_NAME}`
    );
    console.log(
      `MongoDB connected! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection failed : ", error);
    throw error;
  }
};

export default connectDB;