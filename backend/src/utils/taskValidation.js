function normalizeStatus(status) {
  return status === "Completed" || status === "Pending" ? status : null;
}

function normalizePriority(priority) {
  return ["Low", "Medium", "High"].includes(priority) ? priority : null;
}

function normalizeSortBy(sortBy) {
  return ["due_date", "priority", "status", "title"].includes(sortBy) ? sortBy : "due_date";
}

function normalizeSortDir(sortDir) {
  return sortDir === "desc" ? "DESC" : "ASC";
}

function buildTaskOrderBy(sortBy, sortDir) {
  if (sortBy === "priority") {
    return `CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END ${sortDir}, date(due_date) ASC`;
  }

  if (sortBy === "status") {
    return `status ${sortDir}, date(due_date) ASC`;
  }

  if (sortBy === "title") {
    return `title ${sortDir}, date(due_date) ASC`;
  }

  return `date(due_date) ${sortDir}, CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END DESC`;
}

module.exports = {
  normalizeStatus,
  normalizePriority,
  normalizeSortBy,
  normalizeSortDir,
  buildTaskOrderBy
};
