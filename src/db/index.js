import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connentDB = async() => {
   try {
    // mongoosed object return karta hai to hum usko variable me hold kar rahe
   const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   // connectionInstance.connection.host use kar rahe kyuki campany me sabke data base alag alag hote hai to pata hona chahiye hum kis data base me connect hai 
   console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
   } catch (error) {
    console.log(`MONGODB connection FAILED : ${error}`)
    process.exit(1)
   }
}

export default connentDB