const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "database.sqlite");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");

function run(sql, params = []) {
  const statement = db.prepare(sql);
  return Promise.resolve(statement.run(...params));
}

function get(sql, params = []) {
  const statement = db.prepare(sql);
  return Promise.resolve(statement.get(...params));
}

function all(sql, params = []) {
  const statement = db.prepare(sql);
  return Promise.resolve(statement.all(...params));
}

async function seedSampleData() {
  const referrals = [
    ["2026-01-01", "submitted"],
    ["2026-01-04", "submitted"],
    ["2026-01-08", "reviewed"],
    ["2026-01-10", "submitted"],
    ["2026-01-15", "reviewed"],
    ["2026-01-20", "submitted"]
  ];

  const appointments = [
    [1, "2026-01-05"],
    [2, "2026-01-09"],
    [3, "2026-01-12"],
    [4, "2026-01-14"],
    [5, "2026-01-20"],
    [6, "2026-01-25"]
  ];

  const outcomes = [
    [1, "accepted"],
    [2, "accepted"],
    [3, "rejected"],
    [4, "pending"],
    [5, "accepted"],
    [6, "pending"]
  ];

  await run("BEGIN TRANSACTION");
  try {
    for (const [submittedAt, status] of referrals) {
      await run(
        "INSERT INTO referrals (submitted_at, status) VALUES (?, ?)",
        [submittedAt, status]
      );
    }

    for (const [referralId, appointmentDate] of appointments) {
      await run(
        "INSERT INTO appointments (referral_id, appointment_date) VALUES (?, ?)",
        [referralId, appointmentDate]
      );
    }

    for (const [referralId, outcomeStatus] of outcomes) {
      await run(
        "INSERT INTO outcomes (referral_id, outcome_status) VALUES (?, ?)",
        [referralId, outcomeStatus]
      );
    }

    await run("COMMIT");
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitted_at TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      FOREIGN KEY (referral_id) REFERENCES referrals(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL,
      outcome_status TEXT NOT NULL,
      FOREIGN KEY (referral_id) REFERENCES referrals(id)
    )
  `);

  const existingRows = await get("SELECT COUNT(*) AS count FROM referrals");
  if (existingRows.count === 0) {
    await seedSampleData();
  }
}

function closeDatabase() {
  db.close();
  return Promise.resolve();
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase,
  closeDatabase
};
