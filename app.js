const express = require("express");
const cors = require("cors");
const app = express();

// Enable CORS for all routes and methods
app.use(
  cors({
    origin: "http://localhost:5173", // Change to your frontend URL if different
    credentials: true,
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
