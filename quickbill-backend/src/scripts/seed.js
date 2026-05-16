/**
 * QuickBill Seed Script
 * Run: npm run seed
 *
 * Creates:
 *   1. Owner account    (OWNER_USERNAME / OWNER_PASSWORD from .env)
 *   2. Shared Worker    (WORKER_USERNAME / WORKER_PASSWORD from .env)
 *   3. Default categories
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'quickbill',
};

const DEFAULT_CATEGORIES = [
  { name: 'Stationery',    description: 'Pens, pencils, notebooks, files, rulers and other stationery items' },
  { name: 'Electronics',   description: 'Calculators, batteries, USB drives, cables and electronic accessories' },
  { name: 'Office Supplies', description: 'Staplers, scissors, tapes, binders and general office supplies' },
  { name: 'Paper & Printing', description: 'A4 paper, graph sheets, chart paper, tracing paper' },
  { name: 'Art & Craft',   description: 'Colors, sketch pens, clay, craft supplies' },
];

async function seed() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅  Connected to MySQL');

  try {
    // ── Owner ────────────────────────────────────────────────
    const ownerUsername = process.env.OWNER_USERNAME || 'owner';
    const ownerPassword = process.env.OWNER_PASSWORD || 'owner@123';
    const ownerName     = process.env.OWNER_NAME     || 'Store Owner';

    const [[existingOwner]] = await conn.query(
      'SELECT id FROM users WHERE username = ?',
      [ownerUsername]
    );

    if (existingOwner) {
      console.log(`⚠️   Owner "${ownerUsername}" already exists — skipping`);
    } else {
      const hashed = await bcrypt.hash(ownerPassword, 12);
      await conn.query(
        "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, 'owner')",
        [ownerName, ownerUsername, hashed]
      );
      console.log(`👤  Owner created   → username: ${ownerUsername} | password: ${ownerPassword}`);
    }

    // ── Shared Worker ─────────────────────────────────────────
    const workerUsername = process.env.WORKER_USERNAME || 'worker';
    const workerPassword = process.env.WORKER_PASSWORD || 'worker@123';
    const workerName     = process.env.WORKER_NAME     || 'Cashier';

    const [[existingWorker]] = await conn.query(
      'SELECT id FROM users WHERE username = ?',
      [workerUsername]
    );

    if (existingWorker) {
      console.log(`⚠️   Worker "${workerUsername}" already exists — skipping`);
    } else {
      const hashed = await bcrypt.hash(workerPassword, 12);
      await conn.query(
        "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, 'worker')",
        [workerName, workerUsername, hashed]
      );
      console.log(`👤  Worker created  → username: ${workerUsername} | password: ${workerPassword}`);
    }

    // ── Categories ────────────────────────────────────────────
    for (const cat of DEFAULT_CATEGORIES) {
      const [[existing]] = await conn.query(
        'SELECT id FROM categories WHERE name = ?',
        [cat.name]
      );
      if (!existing) {
        await conn.query(
          'INSERT INTO categories (name, description) VALUES (?, ?)',
          [cat.name, cat.description]
        );
        console.log(`📂  Category created → ${cat.name}`);
      }
    }

    console.log('\n🎉  Seeding complete!\n');
    console.log('─────────────────────────────────────────────');
    console.log('  Login credentials:');
    console.log(`  Owner  → ${process.env.OWNER_USERNAME  || 'owner'}  /  ${process.env.OWNER_PASSWORD  || 'owner@123'}`);
    console.log(`  Worker → ${process.env.WORKER_USERNAME || 'worker'} /  ${process.env.WORKER_PASSWORD || 'worker@123'}`);
    console.log('─────────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
