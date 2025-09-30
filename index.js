const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require('node-cron');

const db = require("./utils/db");
const planRoutes = require("./routes/planRoute");
const profileRoutes = require("./routes/profileRoute");
const paymentRoutes = require("./routes/paymentRoute");
const portfolioRoutes = require("./routes/portfolio");
const miscRoutes = require("./routes/misc");
const { executePayments } = require("./CronJobs/executePlan");

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
app.use("/api/misc", miscRoutes);
app.use("/api", portfolioRoutes);

app.listen(5005, () => {
  console.log("Server is running on port 5005");
});

// trigger crons
if(process.env.ENABLE_CRON === "true") {
  cron.schedule(
    process.env.CRON_EXP_DAILY, // TODO: update cron exp to daily
    () => {executePayments("daily")}
  );

  cron.schedule(
    process.env.CRON_EXP_WEEKLY,
    () => {executePayments("weekly")}
  );
}
