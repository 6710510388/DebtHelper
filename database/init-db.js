#!/usr/bin/env node
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'debthelper.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// ลบ DB เก่าแล้วสร้างใหม่
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Removed old database');
}

console.log('🗄️  Initializing DebtHelper database v2...');
const db = new Database(DB_PATH);
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log('✅ Database created:', DB_PATH);
console.log('📌 Open with DBeaver → SQLite → browse to this file');
db.close();
