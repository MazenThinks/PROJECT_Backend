const mongoose = require("mongoose");

const dbConnection = () => {
  if (!process.env.DB_URI) {
    console.error("Error: DB_URI environment variable is not defined.");
    process.exit(1);
  }
  mongoose.connect(process.env.DB_URI).then((conn) => {
    console.log(`Database Connected: ${conn.connection.host}`);
  });
  //.catch((err) => {
  //console.error(`Database Error: ${err}`);
  //process.exit(1);
  // })
};

module.exports = dbConnection;
