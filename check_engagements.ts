import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
console.log(JSON.stringify(db.prepare("SELECT * FROM engagement_events").all(), null, 2));
