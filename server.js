const path = require("path");
const fs = require("fs");

const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const configPath = path.join(__dirname, "config.env");
console.log("Config path:", configPath);
console.log("Config exists:", fs.existsSync(configPath));
dotenv.config({ path: configPath });
console.log("Loaded DB_URI:", process.env.DB_URI);

//  IMPORTS
const ApiError = require("./utils/apiError");
const golbaleError = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");

//  Routes (بما فيها Voice Search)
const mountRoutes = require("./routes");
// const { webhookCheckout } = require("./services/orderService");

//  Connect to DB
dbConnection();

//  Initialize app
const app = express();

//  CORS
app.use(cors());
app.options("*", cors());

//  Compression
app.use(compression());

//  Webhook 
// app.post('/webhook-checkout', express.raw({ type: 'application/json' }), webhookCheckout);

//  Middleware
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

//  Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: "Too many accounts created from this IP, please try again after an hour",
});
app.use("/api", limiter);

//  Mount routes (Voice Search مشمولة في routes/index.js)
mountRoutes(app);

//  404 Handler
app.all("*", (req, res, next) => {
  next(new ApiError(`Cant find this route: ${req.originalUrl}`, 400));
});

//  Global Error Handler
app.use(golbaleError);

//  Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`App Running On Port ${PORT}`);
});

//  Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down....");
    process.exit(1);
  });
});