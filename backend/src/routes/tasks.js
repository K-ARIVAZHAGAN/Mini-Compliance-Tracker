const express = require("express");
const { get, run } = require("../db/database");
const { normalizeStatus } = require("../utils/taskValidation");

const router = express.Router();

router.patch("/:id/status", async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const status = normalizeStatus(req.body.status);
    if (!status) {
      return res.status(400).json({ error: "Status must be Pending or Completed" });
    }

    const updateResult = await run("UPDATE tasks SET status = $1 WHERE id = $2", [status, taskId]);
    if (updateResult.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = await get(
      `
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
      WHERE id = $1
      `,
      [taskId]
    );

    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
