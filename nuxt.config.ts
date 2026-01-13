// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/image',
    'nuxt-auth-utils',
    '@nuxt/test-utils/module'
  ],

  // https://devtools.nuxt.com
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    // OAuth configuration
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    },
    public: {
      // Can be overridden by NUXT_PUBLIC_HELLO_TEXT environment variable
      helloText: 'Hello from the Edge 👋',
      // Admin emails (comma-separated)
      adminEmails: process.env.NUXT_PUBLIC_ADMIN_EMAILS || ''
    }
  },
  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-03-01',

  nitro: {
    experimental: {
      tasks: true,
      websocket: true
    }
  },

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    // SQLite database - auto-configures driver based on environment
    // In dev: uses better-sqlite3
    // In production with Cloudflare: uses d1 (set NUXT_HUB_DB_CONNECTION_DATABASE_ID)
    db: 'sqlite',
    // KV namespace - auto-configures based on provider
    // For production, set NUXT_HUB_KV_NAMESPACE_ID env var
    kv: true,
    // R2 Blob storage - auto-configures for Cloudflare
    // For production, set NUXT_HUB_BLOB_BUCKET_NAME env var
    blob: true
  },

  // Development config
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
        commaDangle: 'never'
      }
    }
  }
})
