// As early as possible in your application, import and configure dotenv:
// require('dotenv').config({path:".env"})

import dotenv from "dotenv";
import connentDB from "./db/index.js";
import { app } from "./app.js";

//-r dotenv/config --experimental-json-modules add this in package.jason file to config env 
dotenv.config({
  path:"./.env"
})

connentDB()
.then(()=>{

  app.on("error",(error) => {
    console.log(`ERROR : ${error}`);
    throw error
  })

  app.listen(process.env.PORT || 8000, () => {
    console.log(`app listen on ${process.env.PORT}`);
  })
})
.catch((err) => {
  console.log(`MongoDB connection FAILED !!! : ${err}`);
})













// import express from "express"
// const app = express();

// (async() => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",(error)=>{
//       console.log("Errr : ",error)
//       throw error
//     })
//     app.listen(process.env.PORT, () => {
//       console.log(`app listen on : ${process.env.PORT}`)
//     });
//   } catch (error) {
//     console.log("ERROR: ",error)
//     throw error;
//   }
// })()