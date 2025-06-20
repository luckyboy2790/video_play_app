const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const PlayModel = require("../models/playModel");
const { extractVideoFromUrl, uploadToS3 } = require("../utils/videoUtils");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { url, formation, type, tags } = req.body;

    if (!url || !formation || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const videoData = await extractVideoFromUrl(url);

    const playData = {
      videoUrl: videoData.url,
      formation,
      play_type: type,
      tags: [],
      source: url,
      source_type: "link",
      submitted_by: req.user.id,
      date_added: new Date(),
    };

    const result = await PlayModel.create(playData);

    res.status(201).json({
      message: "Play added successfully",
      play: result,
    });
  } catch (error) {
    console.error("Error adding play:", error);
    res
      .status(500)
      .json({ message: "Error adding play", error: error.message });
  }
});

module.exports = router;
