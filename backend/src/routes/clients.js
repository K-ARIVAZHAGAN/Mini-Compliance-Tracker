const express = require("express");
const { all, get, run } = require("../db/database");
const {
  normalizeStatus,
  normalizePriority,
  normalizeSortBy,
  normalizeSortDir,
  buildTaskOrderBy
} = require("../utils/taskValidation");

const router = express.Router();

const TASK_SELECT = `
  SELECT
    id,
    client_id,
    title,
    description,
    category,
    due_date,
    status,
    priority,
    CASE WHEN status = 'Pending' AND due_date < CURRENT_DATE THEN 1 ELSE 0 END AS is_overdue
  FROM tasks
`;

router.get("/", async (req, res, next) => {
  try {
    const clients = await all("SELECT id, company_name, country, entity_type FROM clients ORDER BY company_name");
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { company_name: companyName, country, entity_type: entityType } = req.body;

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return res.status(400).json({ error: "company_name is required" });
    }

    if (!country || typeof country !== "string" || !country.trim()) {
      return res.status(400).json({ error: "country is required" });
    }

    if (!entityType || typeof entityType !== "string" || !entityType.trim()) {
      return res.status(400).json({ error: "entity_type is required" });
    }

    const result = await run(
      `
      INSERT INTO clients (company_name, country, entity_type)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [companyName.trim(), country.trim(), entityType.trim()]
    );

    const insertedClient = await get(
      "SELECT id, company_name, country, entity_type FROM clients WHERE id = $1",
      [result.id]
    );

    return res.status(201).json(insertedClient);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const status = req.query.status ? normalizeStatus(req.query.status) : null;
    if (req.query.status && !status) {
      return res.status(400).json({ error: "Invalid status filter" });
    }

    const params = [clientId];
    const whereConditions = ["client_id = $1"];

    if (status) {
      params.push(status);
      whereConditions.push(`status = $${params.length}`);
    }

    if (req.query.category) {
      params.push(req.query.category);
      whereConditions.push(`category = $${params.length}`);
    }

    if (req.query.q) {
      const startIndex = params.length + 1;
      whereConditions.push(
        `(title ILIKE $${startIndex} OR description ILIKE $${startIndex + 1} OR category ILIKE $${startIndex + 2})`
      );
      const searchTerm = `%${req.query.q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const sortBy = normalizeSortBy((req.query.sort_by || "").toLowerCase());
    const sortDir = normalizeSortDir((req.query.sort_dir || "").toLowerCase());
    const orderBySql = buildTaskOrderBy(sortBy, sortDir);

    const rows = await all(`${TASK_SELECT} WHERE ${whereConditions.join(" AND ")} ORDER BY ${orderBySql}`, params);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/tasks/stats", async (req, res, next) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const stats = await get(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'Pending' AND due_date < CURRENT_DATE THEN 1 ELSE 0 END) AS overdue
      FROM tasks
      WHERE client_id = $1
      `,
      [clientId]
    );

    const byCategory = await all(
      `
      SELECT category, COUNT(*) AS count
      FROM tasks
      WHERE client_id = $1
      GROUP BY category
      ORDER BY count DESC, category ASC
      `,
      [clientId]
    );

    return res.json({
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      completed: Number(stats.completed || 0),
      overdue: Number(stats.overdue || 0),
      by_category: byCategory
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/tasks", async (req, res, next) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const client = await get("SELECT id FROM clients WHERE id = $1", [clientId]);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const { title, description, category, due_date: dueDate, status, priority } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: "A valid due_date is required" });
    }

    const normalizedStatus = normalizeStatus(status || "Pending");
    if (!normalizedStatus) {
      return res.status(400).json({ error: "Status must be Pending or Completed" });
    }

    const normalizedPriority = normalizePriority(priority || "Medium");
    if (!normalizedPriority) {
      return res.status(400).json({ error: "Priority must be Low, Medium, or High" });
    }

    const result = await run(
      `
      INSERT INTO tasks (client_id, title, description, category, due_date, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        clientId,
        title.trim(),
        typeof description === "string" ? description.trim() : "",
        category.trim(),
        new Date(dueDate).toISOString().slice(0, 10),
        normalizedStatus,
        normalizedPriority
      ]
    );

    const insertedTask = await get(`${TASK_SELECT} WHERE id = $1`, [result.id]);
    return res.status(201).json(insertedTask);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
