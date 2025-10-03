// Basic auth middleware for admin endpoints
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"')
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    })
  }

  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii")
  const [username, password] = credentials.split(":")

  // Get credentials from environment variables
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.user = username
    next()
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"')
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    })
  }
}

module.exports = basicAuth
