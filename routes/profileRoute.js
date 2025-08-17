// Get User
// Get activity logs

const { getUser, getActivity } = require("../controller/profileController");

const router = require("express").Router();

router.get("/:id", getUser);
router.get("/activity/:id", getActivity);

module.exports = router;
