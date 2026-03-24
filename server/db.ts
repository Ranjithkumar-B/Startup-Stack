import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dataDir = process.env.DATA_DIR || process.cwd();
const dbPath = path.resolve(dataDir, "sqlite.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
