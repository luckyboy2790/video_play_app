const express = require("express");
const router = express.Router();
const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await UserModel.getByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({ username, email, password_hash });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.getByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Authentication successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Error during authentication", error: error.message });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
});

router.post("/update", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    const updatedUser = await UserModel.update(userId, { username, email });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
});

router.post("/update-password", verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const updatedUser = await UserModel.updatePassword(userId, password_hash);

    res.status(200).json({
      message: "Password updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Password update error:", error);
    res
      .status(500)
      .json({ message: "Error updating password", error: error.message });
  }
})

module.exports = router;
