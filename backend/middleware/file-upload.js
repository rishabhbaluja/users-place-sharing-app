const multer = require("multer");
const { v1: uuid } = require("uuid");

//Multer gives us information about the mime-type it found on the uploaded file.
// Using this we can derive the correct extention for the given mime-type
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  //Upload limit of 500KB
  limits: 500000,
  //Control how data should get stored, requires a multer storage driver.
  //Use multer.diskStorage to generate such a driver
  //Now we can pass in an object ot configure that disk storage
  storage: multer.diskStorage({
    //Set destination key
    destination: (req, file, cb) => {
      //error -> null , location
      cb(null, "uploads/images");
    },
    //Control filename thats being used. here cb is callback funtion
    filename: (req, file, cb) => {
      //Extract extention of the incomming file.
      const extention = MIME_TYPE_MAP[file.mimetype];
      // null-> error, generate unique file name/key. This generated random filename with correct extention
      cb(null, uuid() + "." + extention);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type");
    //In second argument pass boolean which tells whether to accept the file or not
    cb(error, isValid);
  },
});

module.exports = fileUpload;
