/**
 * DebtHelper - Shared DB utility (Azure SQL / mssql)
 */
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let pool = null;

async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}

function setCorsHeaders(context) {
  context.res = context.res || {};
  context.res.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
}

function ok(context, data) {
  setCorsHeaders(context);
  context.res.status = 200;
  context.res.body = JSON.stringify({ success: true, data });
}

function fail(context, message, status = 400) {
  setCorsHeaders(context);
  context.res.status = status;
  context.res.body = JSON.stringify({ success: false, error: message });
}

module.exports = { getPool, ok, fail, setCorsHeaders, sql };
