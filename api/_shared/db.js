/**
 * DebtHelper - Shared DB utility
 */
const Database = require('better-sqlite3');
const path = require('path');

let _db = null;

function getDb() {
  if (_db) return _db;
  const dbPath = path.join(__dirname, '..', '..', 'database', 'debthelper.db');
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
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

module.exports = { getDb, ok, fail, setCorsHeaders };
