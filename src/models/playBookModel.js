// models/PlayBookModel.js

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

  async get(userId, filters = {}) {
    const { formation, playType } = filters;
    const values = [userId];
    let conditions = [`up.user_id = $1`];
    let index = 2;

    if (formation) {
      conditions.push(`p.formation = $${index++}`);
      values.push(formation);
    }

    if (playType) {
      conditions.push(`p.play_type = $${index++}`);
      values.push(playType);
    }

    const query = `
      SELECT 
        up.*,
        p.id AS play_id,
        p.video_url,
        p.formation,
        p.play_type,
        p.tags,
        p.source,
        p.source_type,
        p.date_added,
        u.id AS user_id,
        u.username,
        u.email,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM user_playbook up
      JOIN plays p ON up.play_id = p.id
      JOIN users u ON up.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY up.saved_at DESC;
    `;

    const result = await db.query(query, values);
    return result.rows;
  },
};

module.exports = PlayBookModel;
