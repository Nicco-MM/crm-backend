const express = require("express");
const app = express();
app.use(express.json());
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
app.post("/webhook/evolution", async (req, res) => {
  try {
    const payload = req.body;

    const phone = payload?.data?.from;
    const text = payload?.data?.body;

    if (!phone || !text) {
      return res.json({ status: "ignored" });
    }

    const contactResult = await pool.query(
      `INSERT INTO contacts (phone)
       VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id`,
      [phone]
    );

    const contactId = contactResult.rows[0].id;

    const convoResult = await pool.query(
      `INSERT INTO conversations (contact_id)
       VALUES ($1)
       RETURNING id`,
      [contactId]
    );

    const conversationId = convoResult.rows[0].id;

    await pool.query(
      `INSERT INTO messages (conversation_id, direction, body)
       VALUES ($1, 'inbound', $2)`,
      [conversationId, text]
    );

    console.log("Saved message from", phone);

    res.json({ status: "stored" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "webhook failed" });
  }
});

