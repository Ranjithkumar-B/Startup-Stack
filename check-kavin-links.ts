import { db } from "./server/db";
import { instructorStudents, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkKavinLinks() {
  const links = await db.select().from(instructorStudents).where(eq(instructorStudents.studentId, 32));
  console.log(JSON.stringify(links, null, 2));
}

checkKavinLinks().then(() => process.exit(0));
