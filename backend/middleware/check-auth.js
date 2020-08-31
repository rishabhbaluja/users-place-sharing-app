const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  //Ensures that our options request is not blocked which is sent initially before the Ex: POST request
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // headers are case insensitive.
    //Authorization : "Bearer TOKEN" to indicate this requests bears a jwt token , so we
    //need to split the Bearer from the rest of the string.
    if (!token) {
      throw new Error("Auth failed");
    }
    //This decodedToken will now have the userId and email.
    const decodedToken = jwt.verify(token, "secretKey");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!", 403));
  }
};
