const db = require("../config/database");

const PlayBookModel = {
  async create(playBookData) {
    const { user_id, play_id, saved_at } = playBookData;

    const query = `
      INSERT INTO user_playbook (user_id, play_id, saved_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [user_id, play_id, saved_at]);

    return result.rows[0];
  },
};

module.exports = PlayBookModel;
