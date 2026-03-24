import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

console.log('Running migration...');
try {
  // 1. Create the new table
  db.exec(`
    CREATE TABLE IF NOT EXISTS instructor_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL
    );
  `);
  console.log('Table instructor_students created or already exists.');

  // 2. Populate existing relationships from enrollments to preserve current database state
  const enrollments = db.prepare(`
    SELECT DISTINCT c.instructor_id, e.student_id 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.course_id
  `).all() as {instructor_id: number, student_id: number}[];

  const insertStmt = db.prepare(`
    INSERT INTO instructor_students (instructor_id, student_id) 
    SELECT ?, ? 
    WHERE NOT EXISTS (
      SELECT 1 FROM instructor_students WHERE instructor_id = ? AND student_id = ?
    )
  `);

  let count = 0;
  for (const en of enrollments) {
    const res = insertStmt.run(en.instructor_id, en.student_id, en.instructor_id, en.student_id);
    if (res.changes > 0) count++;
  }

  console.log(`Migration complete! Populated ${count} existing student-instructor links.`);

} catch (err) {
  console.error('Migration failed:', err);
}
