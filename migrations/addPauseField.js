const User = require("../model/userModel");
const { combinedLogger } = require("../utils/logger");

const up = async () => {
    try {
        combinedLogger.info("Starting migration: adding paused field to User collection");
        const res = await User.updateMany(
            {},
            {
                $set: {
                    paused: false
                }
            }
        );
        combinedLogger.info(`Migration successful, added paused field to ${res.modifiedCount} users`);
    } catch (error) {
        combinedLogger.error(`Error while updating users collection: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
        throw error;
    }
}

const down = async () => {
    try {
        combinedLogger.info("Starting rollback: removing paused field from User collection");
        const res = await User.updateMany(
            {},
            {
                $set: {
                    paused: undefined
                }
            }
        );
        combinedLogger.info(`Rollback successful, removed paused field from ${res.modifiedCount} users`);
    } catch (error) {
        combinedLogger.error(`Error while updating users collection: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
        throw error;
    }
}

// up();
