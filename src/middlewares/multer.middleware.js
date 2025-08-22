import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // folder to save uploaded files
  },
  filename: function (req, file, cb) {
    // cb(null, file.fieldname + "-" + uniqueSuffix);
    cb(null, file.originalname); // keep original filename
    /*
    {
    console.log(file)
  fieldname: 'avatar',                 // Name of the form field
  originalname: 'mypic.jpg',           // Original name of the file from the client
  encoding: '7bit',                    // File encoding type
  mimetype: 'image/jpeg',              // MIME type (image/png, image/jpeg, etc.)
  destination: './uploads/',           // Folder where file is saved
  filename: 'avatar-1723287312345-456789123.jpg', // New name assigned by Multer
  path: 'uploads/avatar-1723287312345-456789123.jpg', // Full path to saved file
  size: 48291                          // File size in bytes
}
    */
  },
});

export const upload = multer({
  //  storage: storage

  //ES6
  storage,
});
