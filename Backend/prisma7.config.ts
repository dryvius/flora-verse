import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const LOCAL_DATABASE_URL = 'mysql://app:app_password@localhost:3306/floraverse';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
  },
});
