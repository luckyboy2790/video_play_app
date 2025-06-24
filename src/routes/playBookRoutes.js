const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const PlayBookModel = require("../models/playBookModel");
const PlayModel = require("../models/playModel");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { play_id } = req.body;

    const play = await PlayModel.getById(req.user.id, play_id);

    if (!play) {
      return res.status(404).json({
        message: "Play not found",
      });
    }

    const playBookData = {
      user_id: req.user.id,
      play_id,
      saved_at: new Date(),
    };

    const result = await PlayBookModel.create(playBookData);

    res.status(201).json({
      message: "Play added to book successfully",
      playBook: result,
    });
  } catch (error) {
    console.error("Error adding play to book:", error);
    res.status(500).json({
      message: "Error adding play to book",
      error: error.message,
    });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formation, playType } = req.query;

    const result = await PlayBookModel.get(userId, {
      formation,
      playType,
    });

    if (formation || playType) {
      return res.status(200).json({
        message: "Filtered plays retrieved",
        plays: result,
      });
    }

    const grouped = result.reduce((acc, play) => {
      const key = play.formation || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(play);
      return acc;
    }, {});

    res.status(200).json({
      message: "Plays grouped by formation",
      grouped_plays: grouped,
    });
  } catch (error) {
    console.error("Error getting plays:", error);
    res
      .status(500)
      .json({ message: "Error getting plays", error: error.message });
  }
});

module.exports = router;
