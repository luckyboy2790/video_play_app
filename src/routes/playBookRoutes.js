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

    const playbook = await PlayBookModel.getByField(play_id);

    if (playbook.length > 0) {
      return res.status(409).json({
        message: "Play is already saved",
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

    const formatDiagramUrl = (formationName) => {
      const formatted = (formationName || "Unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");
      return `https://1st-and-10-uploads.s3.us-east-2.amazonaws.com/formation-diagrams/${formatted}.png`;
    };

    if (formation || playType) {
      const formatted = formation || result[0]?.formation || "Unknown";
      return res.status(200).json({
        message: "Filtered plays retrieved",
        diagramUrl: formatDiagramUrl(formatted),
        plays: result,
      });
    }

    const grouped = result.reduce((acc, play) => {
      const key = play.formation || "Unknown";
      const diagramKey = key.toLowerCase().replace(/\s+/g, "_");
      if (!acc[key]) {
        acc[key] = {
          diagramUrl: `https://1st-and-10-uploads.s3.us-east-2.amazonaws.com/formation-diagrams/${diagramKey}.png`,
          plays: [],
        };
      }
      acc[key].plays.push(play);
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
