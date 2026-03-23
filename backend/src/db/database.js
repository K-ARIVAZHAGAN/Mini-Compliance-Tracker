const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required. Configure a Neon Postgres connection string.");
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  return pool;
}

async function run(sql, params = []) {
  const result = await getPool().query(sql, params);
  const insertedId = result.rows[0] && result.rows[0].id ? result.rows[0].id : null;
  return { id: insertedId, changes: result.rowCount || 0 };
}

async function all(sql, params = []) {
  const result = await getPool().query(sql, params);
  return result.rows;
}

async function get(sql, params = []) {
  const result = await getPool().query(sql, params);
  return result.rows[0] || null;
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      country TEXT NOT NULL,
      entity_type TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed')),
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  const clientCount = await get("SELECT COUNT(*) AS count FROM clients");
  if (Number(clientCount.count) === 0) {
    await run(
      "INSERT INTO clients (company_name, country, entity_type) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)",
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
  if (Number(taskCount.count) === 0) {
    await run(
      `
      INSERT INTO tasks (client_id, title, description, category, due_date, status, priority)
      VALUES
        (1, 'GST Filing - Q1', 'File quarterly GST return', 'Tax', CURRENT_DATE - INTERVAL '2 day', 'Pending', 'High'),
        (1, 'Annual ROC Return', 'Submit annual return documentation', 'Filing', CURRENT_DATE + INTERVAL '10 day', 'Pending', 'Medium'),
        (2, 'Payroll Tax Submission', 'Submit monthly payroll tax', 'Tax', CURRENT_DATE + INTERVAL '3 day', 'Completed', 'Medium'),
        (3, 'VAT Reconciliation', 'Complete VAT reconciliation for current month', 'Reconciliation', CURRENT_DATE - INTERVAL '1 day', 'Pending', 'High')
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
