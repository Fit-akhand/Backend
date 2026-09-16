import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { logger } from "../utils/logger.js";

const connentDB = async() => {
   try {
   const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
    serverSelectionTimeoutMS: 10000,
   })
   logger.info("mongodb_connected", { host: connectionInstance.connection.host })
   } catch (error) {
    logger.error("mongodb_connection_failed", { message: error.message })
    process.exit(1)
   }
}

export default connentDB