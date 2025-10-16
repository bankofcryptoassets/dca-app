const mongoose = require("mongoose")
const dotenv = require("dotenv")
const { combinedLogger } = require("./logger")
dotenv.config()

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    combinedLogger.info("Database connected successfully")
  } catch (error) {
    combinedLogger.error(
      "Database connection failed: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
  }
}

module.exports = { dbConnection }
