# NuxtHub v0.9 to v0.10 Migration Guide

## ✅ Completed Migration Steps

This project has been successfully migrated from NuxtHub v0.9 to v0.10. Here's what was done:

### 1. Dependencies Updated
- ✅ Updated `@nuxthub/core` from `^0.9.0` to `^0.10.4`
- ✅ Updated all related dependencies

### 2. Configuration Changes
- ✅ Updated `nuxt.config.ts`: Changed `hub.database: true` to `hub.db: { dialect: 'sqlite', driver: 'd1' }`
- ✅ Updated `drizzle.config.ts` to point to new directory structure

### 3. Directory Structure
- ✅ Moved `server/database/` to `server/db/`
- ✅ Updated all schema imports

### 4. Code Migration
- ✅ Replaced `hubDatabase()` with `db` from `hub:db` (via `useDrizzle()` helper)
- ✅ Replaced `hubBlob()` with `blob` from `hub:blob`
- ✅ Updated all API handlers to use new imports

### 5. Scripts Updated
- ✅ Removed deprecated `nuxthub deploy` and `nuxthub preview` commands
- ✅ Updated to use `nuxt db generate` and `nuxt db push` for database migrations
- ✅ Changed preview to use `nuxt preview`

## 🚀 Cloudflare Deployment Setup

### Prerequisites
1. [Cloudflare account](https://dash.cloudflare.com)
2. Cloudflare resources created (see below)

### Step 1: Create Cloudflare Resources

Go to your [Cloudflare dashboard](https://dash.cloudflare.com) and create:

#### D1 Database
1. Visit [D1 Databases](https://dash.cloudflare.com/?to=/:account/workers/d1)
2. Create a new D1 database (e.g., `medicore-db`)
3. Copy the database ID

#### R2 Bucket (for file storage)
1. Visit [R2 Buckets](https://dash.cloudflare.com/?to=/:account/r2/new)
2. Create a new R2 bucket (e.g., `medicore-files`)
3. Note the bucket name

#### KV Namespace (for key-value storage)
1. Visit [KV Namespaces](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces)
2. Create a new KV namespace (e.g., `medicore-kv`)
3. Copy the namespace ID

### Step 2: Configure Environment Variables

#### Option A: Auto-Configuration (Recommended)
Set these environment variables for production deployment:

```bash
# D1 Database
NUXT_HUB_DB_CONNECTION_DATABASE_ID=<your-d1-database-id>

# R2 Blob Storage
NUXT_HUB_BLOB_BUCKET_NAME=<your-r2-bucket-name>

# KV Namespace
NUXT_HUB_KV_NAMESPACE_ID=<your-kv-namespace-id>

# OAuth (existing)
NUXT_OAUTH_GOOGLE_CLIENT_ID=<your-client-id>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<your-client-secret>

# Admin emails
NUXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com
```

#### Option B: Manual wrangler.jsonc
Alternatively, create a `wrangler.jsonc` file in the project root:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "medicore-db",
      "database_id": "<your-d1-database-id>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BLOB",
      "bucket_name": "medicore-files"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "<your-kv-namespace-id>"
    }
  ]
}
```

### Step 3: Push Database Schema

Before deploying, push your database schema to D1:

```bash
# Generate migrations (if needed)
pnpm run db:generate

# Push schema to D1
pnpm run db:push
```

Or manually with wrangler:

```bash
# Apply migrations to remote D1
npx wrangler d1 execute medicore-db --remote --file=./server/db/migrations/0000_last_winter_soldier.sql
```

### Step 4: Deploy

#### Using Cloudflare Pages (Recommended)

1. **Connect your Git repository** to Cloudflare Pages
2. **Configure build settings:**
   - Build command: `pnpm run build`
   - Build output directory: `.output/public`
   - Root directory: `/`

3. **Add environment variables** in Cloudflare Pages dashboard

4. **Deploy!** - Cloudflare Pages will automatically deploy on every push

#### Using Wrangler CLI

```bash
# Install Wrangler globally (if not already)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
pnpm run build

# Deploy
wrangler pages deploy .output/public
```

## 📝 Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start dev server (uses local SQLite, local blob storage)
pnpm run dev
```

### Database Commands
```bash
# Generate new migrations after schema changes
pnpm run db:generate

# Push schema to database
pnpm run db:push
```

### Testing
```bash
# Run linter
pnpm run lint

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview
```

## 🔄 Key Changes from v0.9

### Database Access
**Before (v0.9):**
```typescript
const db = hubDatabase()
const users = await db.prepare('SELECT * FROM users').all()
```

**After (v0.10):**
```typescript
// db is auto-imported or use via helper
const users = await db.select().from(schema.users)
// or
const users = await useDrizzle().select().from(tables.users)
```

### Blob Storage
**Before (v0.9):**
```typescript
return hubBlob().serve(event, pathname)
```

**After (v0.10):**
```typescript
import { blob } from 'hub:blob'
return blob.serve(event, pathname)
```

### Configuration
**Before (v0.9):**
```typescript
hub: {
  database: true,
  blob: true
}
```

**After (v0.10):**
```typescript
hub: {
  db: {
    dialect: 'sqlite',
    driver: 'd1'
  },
  blob: true,
  kv: true
}
```

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure your D1 database ID is correct in environment variables
- Verify migrations have been applied: `npx wrangler d1 execute <db-name> --remote --command "SELECT name FROM sqlite_master WHERE type='table';"`

### Blob Storage Issues
- Verify R2 bucket name is correct
- Check bucket permissions in Cloudflare dashboard

### Build Errors
- Clear `.nuxt` and `.output` directories: `rm -rf .nuxt .output`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

## 📚 Resources

- [NuxtHub v0.10 Documentation](https://hub.nuxt.com/docs)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
