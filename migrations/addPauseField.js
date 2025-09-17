const User = require("../model/userModel");

const up = async () => {
    try {
        const res = await User.updateMany(
            {},
            {
                $set: {
                    paused: false
                }
            }
        );
        console.log("migration successful, added paused field to User collection");
        console.log(res);
    } catch (error) {
        console.log("error while updating users collection:: ", JSON.stringify(error));
        throw error;
    }
}

const down = async () => {
    try {
        const res = await User.updateMany(
            {},
            {
                $set: {
                    paused: undefined
                }
            }
        );
        console.log("migration successful, removed paused field from User collection");
        console.log(res);
    } catch (error) {
        console.log("error while updating users collection:: ", JSON.stringify(error));
        throw error;
    }
}

// up();
