import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

// Prisma 7 moved the datasource connection URL out of schema.prisma and into
// this config file. The URL is only consumed by Migrate/introspection commands;
// the runtime PrismaClient reads DATABASE_URL via its own configuration.
// Prisma 7's config loader does not auto-read .env, so we import dotenv first.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
