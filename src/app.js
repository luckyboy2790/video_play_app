const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const userRoutes = require("./routes/userRoutes");
const playRoutes = require("./routes/playRoutes");
const playBookRoutes = require("./routes/playBookRoutes");

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "https://video-play-app-frontend.vercel.app/",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`\x1b[42m ${req.method} ${req.url} request received.\x1b[0m`);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/users", userRoutes);
app.use("/api/plays", playRoutes);
app.use("/api/user_playbook", playBookRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: `The requested URL ${req.originalUrl} was not found on this server.`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    status: statusCode,
  });
});

module.exports = app;
