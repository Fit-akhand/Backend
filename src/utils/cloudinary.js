import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  // Click 'View API Keys' above to copy your API secret
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uplodeonCloudinary = async (localfilepath) => {
    try {
        if(!localfilepath) return null
        // uplode the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type : "auto"
        })
        //file has been uploded successfully
        // console.log("file is uplodede on cloudinary",response.url); 
        //  response URL in your website or app to display the image/video without storing it locally.
        fs.unlinkSync(localfilepath)
        return response; 

    } catch (error) {
        fs.unlinkSync(localfilepath)  // remove the localy saved temporary file as the uplode operation got failed

        return null;
    }
}



export {uplodeonCloudinary}