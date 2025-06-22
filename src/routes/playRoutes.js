const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const PlayModel = require("../models/playModel");
const { extractVideoFromUrl } = require("../utils/videoUtils");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { url, formation, type, tags } = req.body;

    if (!url || !formation || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let tagsArray = [];
    if (tags) {
      try {
        tagsArray = JSON.parse(tags);
        if (!Array.isArray(tagsArray)) {
          return res.status(400).json({ message: "Tags must be an array" });
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid JSON format for tags" });
      }
    }

    const videoData = await extractVideoFromUrl(url);

    const playData = {
      videoUrl: videoData.url,
      formation,
      play_type: type,
      tags: tagsArray,
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

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { formation, play_type } = req.query;

    const filters = [];
    const params = [userId];

    if (formation) {
      filters.push("p.formation = $" + (params.length + 1));
      params.push(formation);
    }

    if (play_type) {
      filters.push("p.play_type = $" + (params.length + 1));
      params.push(play_type);
    }

    const whereClause =
      filters.length > 0
        ? "WHERE p.submitted_by = $1 AND " + filters.join(" AND ")
        : "WHERE p.submitted_by = $1";

    const result = await PlayModel.getAll(whereClause, params);

    res.status(200).json({
      message: "Plays retrieved successfully",
      plays: result,
    });
  } catch (error) {
    console.error("Error getting plays:", error);
    res
      .status(500)
      .json({ message: "Error getting plays", error: error.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const playId = parseInt(req.params.id, 10);

    if (isNaN(playId)) {
      throw new Error("Invalid ID");
    }

    const result = await PlayModel.getById(userId, playId);

    res.status(201).json({
      message: "Play got successfully",
      play: result,
    });
  } catch (error) {
    console.error("Error getting play:", error);
    res
      .status(500)
      .json({ message: "Error getting play", error: error.message });
  }
});

module.exports = router;
