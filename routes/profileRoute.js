// Get User
// Get activity logs

const {
  getUser,
  getActivity,
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controller/profileController")

const router = require("express").Router()

router.get("/:id", getUser)
router.get("/activity/:id", getActivity)

router.get("/notification-settings/:id", getNotificationSettings)
router.put("/notification-settings/:id", updateNotificationSettings)

module.exports = router
