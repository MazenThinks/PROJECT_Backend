const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((conn) => {
      console.log(`Database Connected: ${conn.connection.host}`);
    })
    .catch((err) => {
      console.error(`Database connection error: ${err}`);
      process.exit(1); // Exit the process if DB connection fails
    });
};

module.exports = dbConnection;
