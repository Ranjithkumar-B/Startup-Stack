import Database from 'better-sqlite3';
import fs from 'fs';
const db = new Database('sqlite.db');
const users = db.prepare("SELECT id, name, email, role FROM users").all();
const courses = db.prepare("SELECT * FROM courses").all();
const enrollments = db.prepare("SELECT * FROM enrollments").all();
fs.writeFileSync('db_state.json', JSON.stringify({users, courses, enrollments}, null, 2));
