import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_date INTEGER
    );
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS task_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      pdf_url TEXT NOT NULL,
      submitted_at INTEGER DEFAULT (cast(strftime('%s', 'now') as INT))
    );
  `);
  console.log("Tables created!");
}
run();
