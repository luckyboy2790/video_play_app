const express = require("express");
const router = express.Router();
const VideoModel = require("../models/videoModel");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/videos");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/thumbnails");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 100 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

router.post(
  "/upload",
  authenticate,
  videoUpload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const { title, description, duration } = req.body;
      const userId = req.userData.userId;

      const filePath = `/uploads/videos/${req.file.filename}`;

      const thumbnailPath = "/uploads/thumbnails/default-thumbnail.jpg";

      const video = await VideoModel.create({
        title,
        description,
        file_path: filePath,
        thumbnail_path: thumbnailPath,
        duration: duration || 0,
        user_id: userId,
      });

      res.status(201).json({
        message: "Video uploaded successfully",
        video,
      });
    } catch (error) {
      console.error("Video upload error:", error);
      res
        .status(500)
        .json({ message: "Error uploading video", error: error.message });
    }
  }
);

router.post(
  "/:videoId/thumbnail",
  authenticate,
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const userId = req.userData.userId;

      const video = await VideoModel.getById(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.user_id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this video" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No thumbnail file uploaded" });
      }

      const thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;

      const updatedVideo = await VideoModel.update(videoId, {
        title: video.title,
        description: video.description,
        thumbnail_path: thumbnailPath,
      });

      res.status(200).json({
        message: "Thumbnail uploaded successfully",
        video: updatedVideo,
      });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res
        .status(500)
        .json({ message: "Error uploading thumbnail", error: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const videos = await VideoModel.getAll(limit, offset);

    res.status(200).json({
      videos,
      pagination: {
        page,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching videos", error: error.message });
  }
});

router.get("/:videoId", async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const video = await VideoModel.getById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    res
      .status(500)
      .json({ message: "Error fetching video", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const videos = await VideoModel.getByUserId(userId, limit, offset);

    res.status(200).json({
      videos,
      pagination: {
        page,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching user videos", error: error.message });
  }
});

router.put("/:videoId", authenticate, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const { title, description } = req.body;
    const userId = req.userData.userId;

    const video = await VideoModel.getById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this video" });
    }

    const updatedVideo = await VideoModel.update(videoId, {
      title,
      description,
      thumbnail_path: video.thumbnail_path,
    });

    res.status(200).json({
      message: "Video updated successfully",
      video: updatedVideo,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res
      .status(500)
      .json({ message: "Error updating video", error: error.message });
  }
});

router.delete("/:videoId", authenticate, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const userId = req.userData.userId;

    const video = await VideoModel.getById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this video" });
    }

    await VideoModel.delete(videoId);

    if (video.file_path) {
      const filePath = path.join(__dirname, "../../", video.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (
      video.thumbnail_path &&
      !video.thumbnail_path.includes("default-thumbnail")
    ) {
      const thumbnailPath = path.join(
        __dirname,
        "../../",
        video.thumbnail_path
      );
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    res.status(200).json({
      message: "Video deleted successfully",
      videoId,
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    res
      .status(500)
      .json({ message: "Error deleting video", error: error.message });
  }
});

module.exports = router;
