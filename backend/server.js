const app = require("./src/app");
const { initializeDatabase } = require("./src/db/database");

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Compliance Tracker running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
