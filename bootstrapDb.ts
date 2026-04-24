// init_db.ts
import { pool } from "./utils/db.ts";

const schema = `
    CREATE TABLE tournaments (
        basho_id INTEGER PRIMARY KEY,
        start_date TEXT,
        end_date TEXT,
        location TEXT
    );
    CREATE TABLE wrestlers (
        rikishi_id INTEGER PRIMARY KEY,
        shikonaEn TEXT NOT NULL,
        shikonaJp TEXT NOT NULL
    );
    CREATE TABLE banzuke (
        basho_id INTEGER NOT NULL,
        rikishi_id INTEGER NOT NULL,
        rank TEXT NOT NULL,
        owner TEXT,
        PRIMARY KEY (basho_id, rikishi_id),
        FOREIGN KEY (basho_id) REFERENCES tournaments(basho_id),
        FOREIGN KEY (rikishi_id) REFERENCES wrestlers(rikishi_id)
    );
    CREATE TABLE results (
        id TEXT PRIMARY KEY,
        day INTEGER NOT NULL,
        basho_id INTEGER NOT NULL,
        west_id INTEGER NOT NULL,
        east_id INTEGER NOT NULL,
        winner_id INTEGER NOT NULL,
        kimarite TEXT,
        FOREIGN KEY (basho_id) REFERENCES tournaments(basho_id),
        FOREIGN KEY (west_id) REFERENCES wrestlers(rikishi_id),
        FOREIGN KEY (east_id) REFERENCES wrestlers(rikishi_id),
        FOREIGN KEY (winner_id) REFERENCES wrestlers(rikishi_id)
    );  
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        fullname TEXT NOT NULL,
        password_hash TEXT NOT NULL
    );
    CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `;

async function initialize() {
  console.log("🚀 Initializing Postgres tables...");
  try {
    await pool.query(schema);
    console.log("✅ Tables created successfully!");

    // Optional: Create an initial admin user so you can log in
    // Password hash here is for 'password123' (use your actual hash logic later)
    const adminId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO users (id, username, email, fullname, password_hash) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [
        adminId,
        "teddosan",
        "teddo3@gmail.com",
        "Ted Smith",
        "$2b$10$WrFkZz/sCbI3N8csFbUgyusEkN9NaLBLPMtKjpe8m4BaKQL8sB44u",
      ],
    );
    console.log("👤 Admin user 'teddosan' checked/created.");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err.message);
  } finally {
    await pool.end(); // Close the pool so the script exits
    Deno.exit();
  }
}

initialize();
