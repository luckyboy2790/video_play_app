const db = require("../config/database");

const UserModel = {
  async create(userData) {
    const { username, email, password_hash } = userData;

    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at;
    `;

    const result = await db.query(query, [username, email, password_hash]);
    return result.rows[0];
  },

  async getById(id) {
    const query =
      "SELECT id, username, email, created_at FROM users WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async getByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  async getByUsername(username) {
    const query =
      "SELECT id, username, email, created_at FROM users WHERE username = $1";
    const result = await db.query(query, [username]);
    return result.rows[0];
  },

  async update(id, userData) {
    const { username, email } = userData;

    const query = `
      UPDATE users
      SET username = $1, 
          email = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, email, updated_at;
    `;

    const result = await db.query(query, [username, email, id]);
    return result.rows[0];
  },
};

module.exports = UserModel;
