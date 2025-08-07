// As early as possible in your application, import and configure dotenv:
// require('dotenv').config({path:".env"})

import dotenv from "dotenv";
import connentDB from "./db/index.js";

//-r dotenv/config --experimental-json-modules add this in package.jason file to config env 
dotenv.config({
  path:".env"
})

connentDB()













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