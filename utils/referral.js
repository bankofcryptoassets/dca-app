const crypto = require("crypto")

// Generate referralId from userAddress seed (same function as in controller)
const generateReferralId = (userAddress, length = 6) => {
  // Use userAddress as seed for deterministic generation
  const hash = crypto
    .createHash("sha256")
    .update(userAddress.toLowerCase())
    .digest("hex")
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let referralId = ""

  // Use hash to generate deterministic but unique referralId
  for (let i = 0; i < length; i++) {
    const index =
      parseInt(hash.substring(i * 2, i * 2 + 2), 16) % characters.length
    referralId += characters[index]
  }

  return referralId
}

module.exports = { generateReferralId }
