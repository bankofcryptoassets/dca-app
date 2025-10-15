const mongoose = require("mongoose")
const dotenv = require("dotenv")
const { combinedLogger } = require("./logger")
// const { up } = require("../migrations/populatePaymentDetails")
dotenv.config()

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    combinedLogger.info("Database connected successfully")
    // await up()
  } catch (error) {
    combinedLogger.error(
      "Database connection failed: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
  }
}

module.exports = { dbConnection }
