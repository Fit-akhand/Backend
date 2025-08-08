import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// form fill ka raha ho to 
app.use(express.json({limit:"16Kb"}))
// we cah handle nested object
app.use(express.urlencoded({extended:true,limit:"16Kb"}))
//koi pdf file ya fab icon jo hum store karna chahate hai
app.use(express.static("public"))
//config cookieParser
app.use(cookieParser())

export {app}