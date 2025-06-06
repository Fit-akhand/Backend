// require('dotenv').config({path:'./env'})

import dotenv from "dotenv";

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Errrrr", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("mongoDB connection feild : ", err);
  });

/*

import express from "express"

const app = express();
( async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("Errrrr",error);
        throw error;
       })
       app.listen(process.env.PORT ,()=>{
        console.log(`App is listning on port ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("Error:",error)
        throw error
    }
})()

*/
