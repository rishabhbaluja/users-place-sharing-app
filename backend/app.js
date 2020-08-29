const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

//CORS
//We add certain header to the response so later when a response is send back from a more specfic
// route it does have these headers attached
app.use((req, res, next) => {
  //Need to set 3 headers
  //This allows us to control which domains should have access. * means all
  res.setHeader("Access-Control-Allow-Origin", "*");
  //This controls which headers the incomming request may have, so that they are handled
  //We can use * to allow all headres , but we only allow following :-
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  //This basically controls which Http methods may be used on the frontend
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);

app.use("*", (req, res, next) => {
  return next(new HttpError("Could not find this route.", 404));
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    "mongodb://admin:admin@user-going-places-shard-00-00.uaidv.mongodb.net:27017,user-going-places-shard-00-01.uaidv.mongodb.net:27017,user-going-places-shard-00-02.uaidv.mongodb.net:27017/user-going-places?ssl=true&replicaSet=atlas-664l7g-shard-0&authSource=admin&retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    app.listen(5000, () => console.log("Server started!"));
  })
  .catch((err) => {
    console.log(err);
  });
