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
// Often used for password hashing, data validation, logging.
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
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
      return jwt.sign({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema)