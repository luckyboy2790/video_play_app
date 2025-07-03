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

  async getAll(whereClause, params) {
    const query = `
      SELECT 
        p.id,
        p.video_url,
        p.formation,
        p.play_type,
        p.tags,
        p.source,
        p.source_type,
        p.submitted_by,
        p.date_added,
        u.id AS user_id,
        u.username,
        u.email,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM plays p
      LEFT JOIN users u ON p.submitted_by = u.id
      ${whereClause}
      ORDER BY p.date_added DESC
    `;

    const result = await db.query(query, params);

    return result.rows;
  },

  async getRandom(whereClause, params) {
    const query = `
      SELECT 
        p.id,
        p.video_url,
        p.formation,
        p.play_type,
        p.tags,
        p.source,
        p.source_type,
        p.submitted_by,
        p.date_added,
        u.id AS user_id,
        u.username,
        u.email,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM plays p
      LEFT JOIN users u ON p.submitted_by = u.id
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const result = await db.query(query, params);
    return result.rows;
  },

  async getById(userId, id) {
    const query = `
      SELECT p.*, u.*
      FROM plays p
      LEFT JOIN users u ON p.submitted_by = u.id
      WHERE p.submitted_by = $1 AND p.id = $2
      ORDER BY p.date_added DESC
    `;

    const result = await db.query(query, [userId, id]);

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
