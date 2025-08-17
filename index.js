const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./utils/db");
const planRoutes = require("./routes/planRoute");
const profileRoutes = require("./routes/profileRoute");
const paymentRoutes = require("./routes/paymentRoute");

const app = express();
app.use(bodyParser.json());
app.use(cors());

db.dbConnection();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/plan", planRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(5005, () => {
  console.log("Server is running on port 5005");
});
