# 📸 Instagram Social Media Manager — Backend API

A production-ready **NestJS** backend for managing an Instagram Business/Creator account via the **Meta (Instagram) Graph API**. Features OAuth authentication, post scheduling, a unified inbox for comments & DMs, real-time webhook processing, and a Bull-powered job queue.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **OAuth Login** | Full Meta Business Login flow — connects your Instagram Business/Creator account |
| 📅 **Post Scheduling** | Schedule photo/video posts for future publishing via BullMQ delayed jobs |
| 📬 **Unified Inbox** | Sync and reply to comments & DMs in one place |
| 🔔 **Webhooks** | Real-time Instagram webhook processing (comments, messages, story mentions) |
| 📡 **WebSocket Gateway** | Live push notifications to frontend via Socket.IO |
| 🗄️ **Persistent Storage** | Prisma ORM with SQLite (easily swappable to PostgreSQL/MySQL) |
| 🔄 **Background Queues** | BullMQ + Redis for resilient async job processing |
| 📊 **Post Analytics** | Track publish status: DRAFT → SCHEDULED → PUBLISHING → PUBLISHED / FAILED |

---

## 🧱 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database ORM**: [Prisma](https://www.prisma.io/) with SQLite
- **Job Queue**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Real-time**: Socket.IO via `@nestjs/websockets`
- **API**: Meta (Instagram) Graph API v19.0
- **Auth**: Meta OAuth 2.0 (Facebook Login for Business)

---

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** v18+ — [Download](https://nodejs.org)
- **Redis** running locally — [Download](https://redis.io/download) or use Docker:
  ```bash
  docker run -d -p 6379:6379 redis:alpine
  ```
- A **Meta Developer Account** — [developers.facebook.com](https://developers.facebook.com)
- An **Instagram Business or Creator account** linked to a **Facebook Page**

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Isha2307/Social-Media-Manager-INSTAGRAM-.git
cd Social-Media-Manager-INSTAGRAM-
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Meta App Credentials
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_OAUTH_REDIRECT_URI=http://localhost:3001/api/v1/instagram/auth/callback
META_GRAPH_API_VERSION=v19.0
META_CONFIG_ID=your_business_login_config_id

# Database
DATABASE_URL="file:./dev.db"

# Redis (for BullMQ job queues)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Set Up the Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the Server

```bash
# Development (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Server starts at: **http://localhost:3001**

---

## ⚙️ Meta App Setup

### Step 1 — Create a Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Choose **Business** type
3. Give it a name and link your Facebook account

### Step 2 — Add Facebook Login for Business
1. In your app dashboard → **Add Product** → **Facebook Login for Business**
2. Go to **Facebook Login for Business → Configurations**
3. Click **Create Configuration** and select:
   - **Login variation**: `User access token`
   - **Redirect URI**: `http://localhost:3001/api/v1/instagram/auth/callback`
4. Under **Permissions**, add:
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`
5. Copy the **Configuration ID** → set it as `META_CONFIG_ID` in `.env`

### Step 3 — Add Webhook (Optional, for real-time events)
1. In your app dashboard → **Webhooks** → Subscribe to the **Instagram** object
2. Set Callback URL: `https://your-domain.com/api/v1/instagram/webhook`
3. Set a Verify Token (any string) and add it as `META_WEBHOOK_VERIFY_TOKEN` in `.env`
4. Subscribe to fields: `comments`, `messages`, `story_insights`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/instagram/auth/login` | Redirects to Meta OAuth login |
| `GET` | `/api/v1/instagram/auth/callback` | Handles OAuth callback & token exchange |

### Posts / Publishing
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/instagram/posts/publish` | Publish a post immediately |
| `POST` | `/api/v1/instagram/posts/schedule` | Schedule a post for later |
| `GET` | `/api/v1/instagram/posts` | List all posts (`?igUserId=...`) |

### Comments (Unified Inbox)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/instagram/media/:mediaId/comments` | Get comments on a post |
| `POST` | `/api/v1/instagram/comments/:commentId/reply` | Reply to a comment |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/instagram/webhook` | Webhook verification (Meta handshake) |
| `POST` | `/api/v1/instagram/webhook` | Receive real-time events from Meta |

---

## 🗄️ Database Schema

```
InstagramAccount   — Connected IG accounts with OAuth tokens
InstagramPost      — Posts and their publish status history
InstagramComment   — Synced comments for the unified inbox
InstagramMessage   — Synced DMs for the unified inbox
WebhookEvent       — Raw webhook payloads with processing status
```

Full schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## 📁 Project Structure

```
src/
├── app.module.ts
├── main.ts                            # Runs on port 3001
├── prisma.module.ts
├── prisma.service.ts
└── modules/
    └── instagram/
        ├── instagram.module.ts
        ├── controllers/
        │   ├── instagram-auth.controller.ts
        │   ├── instagram-posts.controller.ts
        │   ├── instagram-comments.controller.ts
        │   └── instagram-webhook.controller.ts
        ├── services/
        │   ├── instagram-auth.service.ts        # OAuth + token exchange
        │   ├── instagram-publishing.service.ts  # Post creation & scheduling
        │   ├── instagram-comments.service.ts    # Comment sync & replies
        │   └── instagram-webhook.service.ts     # Webhook verification & queuing
        ├── processors/
        │   ├── instagram-webhook.processor.ts   # Bull: processes webhook events
        │   └── instagram-publishing.processor.ts # Bull: publishes scheduled posts
        ├── gateways/
        │   └── instagram.gateway.ts             # Socket.IO real-time gateway
        ├── dto/
        └── exceptions/
prisma/
├── schema.prisma
└── dev.db
```

---

## 🔌 WebSocket Events (Socket.IO)

Connect to `ws://localhost:3001` to receive live events:

| Event | Trigger |
|---|---|
| `newComment` | New comment received via webhook |
| `newMessage` | New DM received via webhook |
| `postPublished` | Scheduled post has been published |

---

## 🧪 Testing the OAuth Flow

1. Ensure Redis is running: `docker run -d -p 6379:6379 redis:alpine`
2. Start the server: `npm run start:dev`
3. Open in browser: `http://localhost:3001/api/v1/instagram/auth/login`
4. Log in with your Facebook account and grant the required permissions
5. You will be redirected back with a success response
6. Your Instagram account token is now saved to the database ✅

---

## 📝 Example: Schedule a Post

```bash
curl -X POST http://localhost:3001/api/v1/instagram/posts/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "igUserId": "your_ig_user_id",
    "imageUrl": "https://your-image-host.com/photo.jpg",
    "caption": "Hello from the scheduler! 🚀",
    "scheduledAt": "2026-07-20T10:00:00Z"
  }'
```

---

## 📄 License

MIT License

---

## 🔗 Resources

- [Meta Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BullMQ Documentation](https://docs.bullmq.io)
