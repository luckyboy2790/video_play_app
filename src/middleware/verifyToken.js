const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await UserModel.getById(decoded.userId);

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    req.user = {
      ...user,
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = verifyToken;
