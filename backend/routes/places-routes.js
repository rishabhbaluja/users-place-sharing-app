const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const placesControllers = require("../controllers/places-controller");
// const { route } = require("./users-routes");
const checkAuth = require("../middleware/check-auth");

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.get("/:pid", placesControllers.getPlaceById);

//All the routes below will be affected by this middleware
router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
