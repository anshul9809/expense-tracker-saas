const express = require("express");
const router = express.Router();

router.use("/users", require("./userRoutes"));

module.exports = router;