import { db } from "./server/db";
import { users, instructorStudents } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkKavin() {
  const allUsers = await db.select().from(users).where(eq(users.name, "kavin"));
  console.log("Kavin users:", allUsers);
  if (allUsers.length > 0) {
    const kavinId = allUsers[0].id;
    const links = await db.select().from(instructorStudents).where(eq(instructorStudents.studentId, kavinId));
    console.log("Kavin instructor links:", links);
    if (links.length > 0) {
      const instructor = await db.select().from(users).where(eq(users.id, links[0].instructorId));
      console.log("Instructor:", instructor);
    }
  }
}

checkKavin().then(() => process.exit(0));
