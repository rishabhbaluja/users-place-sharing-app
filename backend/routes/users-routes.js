const express = require("express");
const usersController = require("../controllers/users-controller");
const router = express.Router();
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

router.get("/", usersController.getUsers);

//normalizeEmail() converts to lowercase Test@gmail.com => test@gmail.com
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
