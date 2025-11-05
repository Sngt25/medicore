# Medicore - Healthcare Communication Platform

A real-time healthcare communication platform connecting patients with healthcare workers in their districts.

## ��� Implementation Summary

**Backend: ✅ COMPLETE** | **Frontend: ��� TODO**

Following the specification in `medicore.md`, I have implemented the complete backend API, database schema, authentication, real-time WebSocket messaging, and file storage. The frontend UI pages are ready to be built using Nuxt UI components.

---

## ✅ What's Implemented

### 1. Database Schema (Drizzle ORM + SQLite/D1)
- `users` - User accounts (roles: admin, healthcare_worker, patient)
- `districts` - Health districts
- `chats` - Conversations (status: queued → active → closed)
- `messages` - Chat messages with attachments
- `tasks` - Healthcare worker task management
- `files` - File metadata (R2 blob storage)
- `audit_logs` - Activity audit trail

### 2. Authentication (nuxt-auth-utils + Google OAuth)
- ✅ Google OAuth integration (`/auth/google`)
- ✅ Role-based redirection (admin/worker/patient)
- ✅ Encrypted session cookies
- ✅ Auto user creation on first login
- ✅ Admin email whitelist

### 3. API Endpoints

**Districts (Admin only)**
- `GET /api/districts` - List
- `POST /api/districts` - Create
- `PATCH /api/districts/:id` - Update  
- `DELETE /api/districts/:id` - Delete

**Chats & Messaging**
- `POST /api/chats` - Create (Patient)
- `GET /api/chats` - List (role-filtered)
- `GET /api/chats/:id` - Get with messages
- `POST /api/chats/:id/messages` - Send message
- Auto-assign workers to queued chats

**Tasks (Healthcare Worker only)**
- `GET /api/tasks` - List own tasks
- `POST /api/tasks` - Create
- `PATCH /api/tasks/:id` - Update
- `DELETE /api/tasks/:id` - Delete
- Link to patients/chats

**Files (Hub Blob - Cloudflare R2)**
- `POST /api/files/upload` - Upload (images, PDFs, 10MB max)
- `GET /api/files/:pathname` - Serve securely
- `POST /api/files/multipart` - Multipart upload

### 4. Real-time WebSocket (Nuxt Hub)
- `WS /ws/chat` - Real-time messaging
- Chat room subscriptions
- District queue subscriptions
- Message broadcasting
- Authentication required

### 5. Security & RBAC
- Role-based middleware
- Auth on all protected routes
- Audit logging
- File validation & CSP headers

---

## ��� Next: Frontend UI

### Patient Pages (Nuxt UI)
- [ ] Landing + Google OAuth login
- [ ] District selection
- [ ] Chat interface (WebSocket)
- [ ] File upload (VueUse)

### Healthcare Worker Dashboard
- [ ] Queue management
- [ ] Chat interface
- [ ] Task manager (CRUD)

### Admin Console
- [ ] District management
- [ ] Worker account creation
- [ ] Verification workflow

---

## ��� Quick Start

### 1. Install
\`\`\`bash
pnpm install
\`\`\`

### 2. Environment
Copy \`.env.example\` to \`.env\`:
\`\`\`env
NUXT_SESSION_PASSWORD=your-32-char-secret
NUXT_OAUTH_GOOGLE_CLIENT_ID=...
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=...
NUXT_PUBLIC_ADMIN_EMAILS=admin@example.com
\`\`\`

### 3. Database
\`\`\`bash
pnpm drizzle-kit push
\`\`\`

### 4. Dev
\`\`\`bash
pnpm dev
\`\`\`

### 5. Deploy
\`\`\`bash
pnpm deploy
\`\`\`

---

## ��� Tech Stack

- **Framework**: Nuxt 3.17 (Nuxt 4 compat)
- **UI**: Nuxt UI v4 (100+ components)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle v0.44.7
- **Auth**: nuxt-auth-utils (Google OAuth)
- **Realtime**: Nuxt Hub WebSocket
- **Storage**: Cloudflare R2 (Hub Blob)
- **Deploy**: Cloudflare Pages/Workers

---

## ��� Project Structure

\`\`\`
server/
├── api/              # ✅ COMPLETE
│   ├── auth/
│   ├── districts/
│   ├── chats/
│   ├── tasks/
│   └── files/
├── routes/
│   ├── auth/         # ✅ OAuth
│   └── ws/           # ✅ WebSocket
├── database/
│   └── schema/       # ✅ 7 tables
├── middleware/       # ✅ Auth
└── utils/            # ✅ Guards

app/
└── pages/            # ��� TODO: UI
\`\`\`

---

## ��� RBAC Matrix

| Action | Patient | Worker | Admin |
|--------|---------|--------|-------|
| Create chat | ✅ | ❌ | ✅ |
| View own chats | ✅ | N/A | ✅ |
| View district chats | ❌ | ✅ | ✅ |
| Manage tasks | ❌ | ✅ | ✅ |
| Manage districts | ❌ | ❌ | ✅ |

---

## ��� License

MIT
