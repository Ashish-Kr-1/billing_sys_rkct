// auth.db.js
import pool from "./db.js";

/*
  This file only handles AUTH database logic.
  No express. No routes.
*/

// 1️⃣ Create users table (safe to run multiple times)
export async function initAuthTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(sql);
}

// 2️⃣ Insert new user
export async function createUser(username, email, passwordHash) {
  const sql = `
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `;
  await pool.query(sql, [username, email, passwordHash]);
}

// 3️⃣ Find user by username OR email
export async function findUserByIdentifier(identifier) {
  const sql = `
    SELECT * FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [identifier, identifier]);
  return rows[0];
}

// 4️⃣ Update password by email
export async function updatePassword(email, passwordHash) {
  const sql = `
    UPDATE users
    SET password_hash = ?
    WHERE email = ?
  `;
  const [result] = await pool.query(sql, [passwordHash, email]);
  return result.affectedRows;
}
