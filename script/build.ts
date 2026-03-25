import { build as esbuild } from "esbuild";
import { rm, readFile, copyFile, mkdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist/public", { recursive: true });

  console.log("building client js...");
  await esbuild({
    entryPoints: ["client/src/main.tsx"],
    bundle: true,
    outfile: "dist/public/main.js",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"production"', // for React
    },
    loader: { ".tsx": "tsx", ".ts": "ts", ".svg": "dataurl" },
    jsx: "automatic",
    minify: true,
    sourcemap: true,
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    }
  });

  console.log("building client css...");
  await execAsync("npx tailwindcss -i client/src/index.css -o dist/public/index.css");

  console.log("copying index.html...");
  await copyFile("client/index.html", "dist/public/index.html");

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "dist/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
