import { db } from "./server/db";
import { users } from "@shared/schema";
import { like } from "drizzle-orm";

async function checkUsers() {
  const allKavins = await db.select().from(users).where(like(users.name, "%kavin%"));
  console.log(JSON.stringify(allKavins, null, 2));
}

checkUsers().then(() => process.exit(0));
