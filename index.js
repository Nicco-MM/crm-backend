const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("CRM backend running on port " + PORT);
});
// STEP 1 - Database test
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// STEP 2 - Init tables
app.get("/init-db", async (req, res) => {
  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id),
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id),
        direction TEXT,
        body TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    res.json({ status: "tables_created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "init failed" });
  }
});

