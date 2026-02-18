#!/usr/bin/env node
const { Client } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = isProduction 
  ? process.env.PROD_DATABASE_URL 
  : process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  console.error(`
╔═══════════════════════════════════════════════════════════════════════╗
║  ERROR: ${isProduction ? 'PROD_DATABASE_URL' : 'DEV_DATABASE_URL'} is not set                              ║
║                                                                       ║
║  This script queries the Neon database that the app actually uses.   ║
║  Make sure the environment variable is set.                          ║
╚═══════════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const query = process.argv.slice(2).join(' ');

if (!query) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║  Neon Database Query Tool                                             ║
║  Environment: ${(isProduction ? 'PRODUCTION' : 'DEVELOPMENT').padEnd(55)}║
╚═══════════════════════════════════════════════════════════════════════╝

Usage: npm run db:query -- "SELECT * FROM house"

Examples:
  npm run db:query -- "SELECT * FROM house"
  npm run db:query -- "SELECT * FROM users"
  npm run db:query -- "SELECT * FROM item WHERE house_id = 1"

⚠️  WARNING: This is the REAL database the app uses.
    Do NOT use Replit's built-in database tool - it connects to a different DB!
`);
  process.exit(0);
}

async function runQuery() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n📊 Querying Neon (${isProduction ? 'production' : 'development'})...\n`);
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('(No rows returned)');
    } else {
      console.table(result.rows);
      console.log(`\n${result.rows.length} row(s) returned`);
    }
  } catch (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runQuery();
