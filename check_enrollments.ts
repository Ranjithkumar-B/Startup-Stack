import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
console.log(JSON.stringify(db.prepare("SELECT * FROM enrollments").all(), null, 2));
