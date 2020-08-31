// const { v4: uuid } = require("uuid");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const user = require("../models/user");
const fs = require("fs");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("Something went wrong couldnot find a place, please try again!", 500)
    );
  }

  if (!place) {
    return next(new HttpError("Could not find place with the provided id", 404));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    console.log(error);
    return next(
      new HttpError(
        "Something went wrong couldnot find places for given user id, please try again!",
        500
      )
    );
  }
  if (!places || places.length === 0) {
    return next(new HttpError("Could not find places with the provided user id", 404));
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { title, description, address, creator } = req.body;

  //Because our function might throw an error
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (err) {
    return next(err);
  }

  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    location: coordinates,
    address,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Creating place failed, please try again!", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id.", 404));
  }

  try {
    //In session we have to manually create a collection in mongo shell
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Creating place failed, please try again!", 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);

    if (updatePlace.creator.toString() !== req.userData.userId) {
      return next(new HttpError("You are not allowed to edit this place!", 401));
    }

    updatedPlace.title = title;
    updatedPlace.description = description;
    await updatedPlace.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Updating place failed, please try again!", 500));
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    console.log(error);
    return next(new HttpError("Deleting place failed, please try again!", 500));
  }

  if (!place) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this place!", 401));
  }

  const imagePath = place.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(place);
    await place.creator.save({ session });
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Deleting place failed, please try again!", 500));
  }

  fs.unlink(imagePath, (err) => console.log(err));

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
