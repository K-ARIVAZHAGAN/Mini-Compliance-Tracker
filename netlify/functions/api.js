const serverless = require("serverless-http");
const app = require("../../backend/src/app");
const { initializeDatabase } = require("../../backend/src/db/database");

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

const handler = serverless(app);

exports.handler = async (event, context) => {
  await ensureInitialized();
  return handler(event, context);
};
