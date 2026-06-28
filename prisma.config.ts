import "dotenv/config";
import { defineConfig } from "@prisma/config";

// Prisma 7 moved the datasource connection URL out of schema.prisma and into
// this config file. The URL here is only consumed by Migrate/introspection
// commands (db push / migrate); the runtime PrismaClient connects via the pg
// driver adapter in lib/db.ts using the pooled DATABASE_URL.
//
// Schema operations prefer the DIRECT (unpooled) connection because pooled
// pgbouncer URLs are unreliable for DDL; fall back to DATABASE_URL if unset.
// Prisma 7's config loader does not auto-read .env, so we import dotenv first.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
