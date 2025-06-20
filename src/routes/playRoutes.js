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
    const videoUrl = await uploadToS3(
      videoData.videoBuffer,
      videoData.fileName
    );

    console.log(videoData);

    console.log(videoUrl);

    // const playData = {
    //   videoUrl,
    //   formation,
    //   type,
    //   tags,
    //   source,
    //   source_type,
    //   submitted_by,
    //   date_added,
    // };

    // const result = await PlayModel.create(playData);

    res.status(201).json({
      message: "Play added successfully",
      play: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding play:", error);
    res
      .status(500)
      .json({ message: "Error adding play", error: error.message });
  }
});

module.exports = router;
