const db = require("../config/database");

const PlayModel = {
  async create(videoData) {
    const {
      videoUrl,
      formation,
      play_type,
      tags,
      source,
      source_type,
      submitted_by,
      date_added,
    } = videoData;

    const query = `
      INSERT INTO plays (video_url, formation, play_type, tags, source, source_type, submitted_by, date_added)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, video_url, formation, play_type, tags, source, source_type, submitted_by, date_added;
    `;
    const result = await db.query(query, [
      videoUrl,
      formation,
      play_type,
      tags,
      source,
      source_type,
      submitted_by,
      date_added,
    ]);

    return result.rows[0];
  },

  async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT v.*, 
             u.username as uploader_username,
             COUNT(vp.id) as play_count
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN video_plays vp ON v.id = vp.video_id
      GROUP BY v.id, u.username
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },

  async getById(id) {
    const query = `
      SELECT v.*,
             u.username as uploader_username,
             COUNT(vp.id) as play_count
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN video_plays vp ON v.id = vp.video_id
      WHERE v.id = $1
      GROUP BY v.id, u.username;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async getByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT v.*, 
             COUNT(vp.id) as play_count
      FROM videos v
      LEFT JOIN video_plays vp ON v.id = vp.video_id
      WHERE v.user_id = $1
      GROUP BY v.id
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  },

  async update(id, videoData) {
    const { title, description, thumbnail_path } = videoData;

    const query = `
      UPDATE videos
      SET title = $1,
          description = $2,
          thumbnail_path = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const result = await db.query(query, [
      title,
      description,
      thumbnail_path,
      id,
    ]);
    return result.rows[0];
  },

  async delete(id) {
    const query = "DELETE FROM videos WHERE id = $1 RETURNING id";
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
};

module.exports = PlayModel;
