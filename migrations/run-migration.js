#!/usr/bin/env node

const mongoose = require("mongoose")

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/dcaapp"
    )
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

const runMigration = async () => {
  const command = process.argv[2]

  if (!command || (command !== "up" && command !== "down")) {
    console.log("Usage: node run-migration.js [up|down]")
    console.log("  up   - Run the migration")
    console.log("  down - Rollback the migration")
    process.exit(1)
  }

  try {
    await connectDB()

    if (command === "up") {
      console.log("Running migration...")
      // await up()
    } else if (command === "down") {
      console.log("Rolling back migration...")
      // await down()
    }

    console.log("Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
