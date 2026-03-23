const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const defaultDbPath = path.join(__dirname, "..", "..", "data", "compliance.db");
const netlifyDbPath = path.join("/tmp", "compliance.db");
const DB_PATH = process.env.DB_PATH || (process.env.NETLIFY ? netlifyDbPath : defaultDbPath);
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      country TEXT NOT NULL,
      entity_type TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed')),
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  const clientCount = await get("SELECT COUNT(*) AS count FROM clients");
  if (clientCount.count === 0) {
    await run(
      "INSERT INTO clients (company_name, country, entity_type) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
      [
        "Apex Manufacturing Ltd",
        "India",
        "Private Limited",
        "BrightLedger Inc",
        "United States",
        "Corporation",
        "NordicTrade AB",
        "Sweden",
        "Aktiebolag"
      ]
    );
  }

  const taskCount = await get("SELECT COUNT(*) AS count FROM tasks");
  if (taskCount.count === 0) {
    await run(
      `
      INSERT INTO tasks (client_id, title, description, category, due_date, status, priority)
      VALUES
        (1, 'GST Filing - Q1', 'File quarterly GST return', 'Tax', date('now', '-2 day'), 'Pending', 'High'),
        (1, 'Annual ROC Return', 'Submit annual return documentation', 'Filing', date('now', '+10 day'), 'Pending', 'Medium'),
        (2, 'Payroll Tax Submission', 'Submit monthly payroll tax', 'Tax', date('now', '+3 day'), 'Completed', 'Medium'),
        (3, 'VAT Reconciliation', 'Complete VAT reconciliation for current month', 'Reconciliation', date('now', '-1 day'), 'Pending', 'High')
      `
    );
  }
}

module.exports = {
  run,
  all,
  get,
  initializeDatabase
};
