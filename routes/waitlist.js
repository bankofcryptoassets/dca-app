const {
  googleAuthCallback,
  googleAuthRedirect,
  addEmailToWaitlist,
} = require("../controller/waitlist")

const router = require("express").Router()


// Redirect to Google OAuth
router.get("/google", googleAuthRedirect)
// Handle Google OAuth callback
router.get("/google/callback", googleAuthCallback)

router.post("/waitlist", addEmailToWaitlist)

module.exports = router
