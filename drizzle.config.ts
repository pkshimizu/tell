import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/database/schemas/*',
  out: './src/main/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/app.db'
  }
})
