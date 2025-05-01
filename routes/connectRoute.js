const express = require("express");
const cors = require("cors");
const router = require("./router");

const app = express();

app.use(cors()); // allow frontend to connect
app.use(express.json());

app.use("/api", router);

module.exports = router;
