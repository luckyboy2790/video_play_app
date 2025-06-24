const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const PlayBookModel = require("../models/playBookModel");

router.post("/", verifyToken, async (req, res) => {
  try {
    const { play_id } = req.body;

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

module.exports = router;
