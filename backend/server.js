require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;
const db = require("./config/db");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const allowedOrigins = [
    "http://localhost:5173",
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use("/api/v1", require("./routes/index"));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log("Server started on port ", PORT);
});

module.exports = app;