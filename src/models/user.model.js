import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email:{
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname:{
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String, //cloudinary url
            require: true 
        },
        coverImage:{
            type: String, //cloudinary url 
        },
        watchHistory:[
            {
                type : Schema.Types.ObjectId,
                ref : "video"
            }
        ],
        password:{
            type:String,
            require:[true,'password is required'],
            unique:true,
        },
        refrshToken:{
            type:String,
        }
},{timestamps: true}
)


// a pre hook is middleware that runs before a certain action (e.g., save, update).
// bcrypt Often used for password hashing, data validation, logging.
userSchema.pre("save",async function (next) {
    if(!this.isModified("password"))  return next();

    this.password = bcrypt.hash(this.password,10)
    next()
})

// userSchema me hum khud ka functon define kar shakte hai 
// ye method hum passsword ok check kar rahe ki ye correct hai ya nahi
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({ // ① Create a signed JWT token
        _id : this._id,       // ② Include user ID
        email : this.email,   // ③ Include email
        username : this.username, // ④ Include username
        fullname : this.fullname  // ⑤ Include fullname
    },
    process.env.ACCESS_TOKEN_SECRET, // ⑥ Use secret key for signing
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY // ⑦ Token validity period
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id // ① Only user ID (less sensitive)
    },
    process.env.REFRESH_TOKEN_SECRET, // ② Different secret for extra security
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY // ③ Longer expiry (days/weeks)
    }
)
}


export const User = mongoose.model("User",userSchema)


/*
Analogy
Imagine you have:
Access Token = A visitor badge for entering different rooms in a company.

Expires quickly.

Contains your name, ID, and permissions.

Refresh Token = A VIP re-entry card kept safely in your bag.

Used to get a new visitor badge without visiting the front desk again.

Lasts much longer.
*/