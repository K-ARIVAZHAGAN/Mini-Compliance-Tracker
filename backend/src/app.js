const express = require("express");
const path = require("path");
const clientsRouter = require("./routes/clients");
const tasksRouter = require("./routes/tasks");

const app = express();
const frontendPath = path.join(__dirname, "..", "..", "frontend");

app.use(express.json());
app.use(express.static(frontendPath));

app.use("/api/clients", clientsRouter);
app.use("/api/tasks", tasksRouter);

app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
