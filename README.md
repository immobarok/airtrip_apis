<div align="center">

# ✈️ AirTrip API

**Production-grade REST + WebSocket API for the AirTrip short-term rental platform**

[![NestJS](https://img.shields.io/badge/NestJS-11.x-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1?style=flat-square&logo=postgresql)](https://neon.tech)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Redis](https://img.shields.io/badge/Redis-IORedis-dc382d?style=flat-square&logo=redis)](https://redis.io)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://airtripapi.vercel.app)

[Live API](https://airtripapi.vercel.app) · [Health Check](https://airtripapi.vercel.app/health) · [Report Issue](https://github.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [API Modules](#-api-modules)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [WebSocket Events](#-websocket-events)
- [Authentication](#-authentication)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🌐 Overview

AirTrip API is a fully-featured, production-ready backend for a short-term property rental marketplace — think Airbnb. It exposes a versioned REST API (`/api/v1/...`) alongside a real-time WebSocket gateway for live messaging and peer-to-peer audio calls.

The API powers:

- **Guest flows** — browse listings, check availability, book properties, pay securely, leave reviews
- **Host flows** — onboard as a host, manage listings, track bookings and earnings, block calendar dates
- **Real-time messaging** — 1-on-1 chat with typing indicators and WebRTC-powered audio calling
- **Media management** — multi-file uploads directly to Cloudinary with automatic thumbnail generation
- **Transactional emails** — verification, password reset, booking confirmations via Nodemailer

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AirTrip API                              │
│                  (NestJS · Vercel Serverless)                   │
├──────────────────┬──────────────────────┬───────────────────────┤
│   REST API       │  WebSocket Gateway   │   Background Services │
│   /api/v1/*      │  Socket.io           │   Mail · Redis Cache  │
├──────────────────┴──────────────────────┴───────────────────────┤
│                     Global Middleware Stack                      │
│  CorrelationId · Helmet · JWT Guard · Roles Guard               │
│  Logging · Performance · Timeout · Error · Transform            │
├──────────────────┬──────────────────────┬───────────────────────┤
│  PostgreSQL      │       Redis          │      Cloudinary       │
│  (Neon · Prisma) │  (Cache · Sessions)  │  (Media · CDN)        │
└──────────────────┴──────────────────────┴───────────────────────┘
```

Every request passes through a layered middleware pipeline:

| Layer       | Component                 | Purpose                                                               |
| ----------- | ------------------------- | --------------------------------------------------------------------- |
| Middleware  | `CorrelationIdMiddleware` | Assigns a unique `X-Correlation-Id` to every request                  |
| Middleware  | `HelmetHeadersMiddleware` | Sets security HTTP headers                                            |
| Guard       | `JwtAuthGuard`            | Validates Bearer tokens; routes decorated with `@Public()` are exempt |
| Guard       | `RolesGuard`              | RBAC enforcement via `@Roles()` decorator                             |
| Interceptor | `LoggingInterceptor`      | Structured request/response logging with timing                       |
| Interceptor | `PerformanceInterceptor`  | Tracks slow requests                                                  |
| Interceptor | `TimeoutInterceptor`      | Enforces request timeout limits                                       |
| Interceptor | `ErrorInterceptor`        | Normalises unhandled errors                                           |
| Interceptor | `TransformInterceptor`    | Wraps all responses in a consistent envelope                          |

---

## 🛠 Tech Stack

| Category   | Technology                                                                |
| ---------- | ------------------------------------------------------------------------- |
| Framework  | [NestJS 11](https://nestjs.com)                                           |
| Language   | TypeScript 5.9                                                            |
| ORM        | [Prisma 7](https://www.prisma.io) with multi-file schema                  |
| Database   | PostgreSQL via [Neon](https://neon.tech) (serverless)                     |
| Cache      | [Redis](https://redis.io) via [ioredis](https://github.com/redis/ioredis) |
| Real-time  | [Socket.io 4](https://socket.io)                                          |
| Auth       | Passport.js — JWT, Local, Google OAuth2, Facebook OAuth                   |
| Payments   | [Stripe](https://stripe.com)                                              |
| Storage    | [Cloudinary](https://cloudinary.com)                                      |
| Email      | [Nodemailer](https://nodemailer.com)                                      |
| Validation | `class-validator` + `class-transformer`                                   |
| Deployment | [Vercel](https://vercel.com) Serverless                                   |

---

## ✨ Features

### 🔐 Authentication & Identity

- Email/password registration with OTP email verification
- JWT access & refresh token rotation
- Forgot password / reset password via email OTP
- Google OAuth 2.0 & Facebook OAuth single sign-on
- Become-a-host workflow with Stripe host onboarding
- Role-based access control (`GUEST`, `HOST`, `ADMIN`)

### 🏠 Property Listings

- Full CRUD for property listings (draft → published lifecycle)
- Multi-photo upload with Cloudinary CDN integration and auto-thumbnail generation
- Advanced filtering: city, country, property type, room type, price range, sort order
- Top destinations aggregation (grouped by city/country)
- Availability calendar — block/unblock specific dates
- Geolocation support (latitude/longitude)

### 📅 Bookings

- Conflict detection with overlapping booking prevention
- Guest & host booking views with pagination
- Booking status management (PENDING → CONFIRMED → COMPLETED / CANCELLED)
- Host earnings dashboard with aggregated metrics
- Recent bookings feed

### 💳 Payments

- Stripe Payment Intents for secure guest payment
- Stripe webhook handling for payment lifecycle events
- Host payout configuration via Stripe Connect

### 💬 Real-time Messaging

- 1-on-1 conversation creation and retrieval
- Real-time message delivery via Socket.io rooms
- Typing indicators broadcasted to the conversation partner
- WebRTC-based audio calling (offer/answer/ICE candidate relay)
- Automatic call log messages (duration or missed call)

### ⭐ Reviews

- Guest reviews on completed bookings
- Rating aggregation per listing (average + total count)

### ❤️ Wishlists

- Add/remove listings from personalised wishlists
- Full wishlist retrieval with listing details

### 🖼️ Media

- Unified media upload service supporting multiple categories
- Paginated media library per owner
- Cloudinary transformation pipeline

### 🩺 System

- `/health` — database connectivity check with uptime
- Correlation ID tracing across all log entries

---

## 📦 API Modules

All endpoints are prefixed with `/api/v1/`.

### Auth — `/api/v1/auth`

| Method | Endpoint             | Auth   | Description                     |
| ------ | -------------------- | ------ | ------------------------------- |
| `POST` | `/register`          | Public | Register a new user             |
| `POST` | `/login`             | Public | Email + password login          |
| `POST` | `/verify-email`      | Public | Verify email with OTP           |
| `POST` | `/forgot-password`   | Public | Request password reset OTP      |
| `POST` | `/reset-password`    | Public | Reset password with OTP         |
| `POST` | `/refresh`           | Public | Refresh access token            |
| `GET`  | `/me`                | JWT    | Get authenticated user profile  |
| `GET`  | `/google`            | Public | Initiate Google OAuth flow      |
| `GET`  | `/google/callback`   | Public | Google OAuth callback           |
| `GET`  | `/facebook`          | Public | Initiate Facebook OAuth flow    |
| `GET`  | `/facebook/callback` | Public | Facebook OAuth callback         |
| `POST` | `/become-host`       | JWT    | Upgrade account to HOST role    |
| `POST` | `/host-onboard`      | Public | Complete host Stripe onboarding |
| `POST` | `/logout`            | JWT    | Logout current session          |

### Properties — `/api/v1/properties`

| Method   | Endpoint             | Auth   | Description                              |
| -------- | -------------------- | ------ | ---------------------------------------- |
| `GET`    | `/`                  | Public | List published properties (with filters) |
| `POST`   | `/`                  | HOST   | Create a new listing                     |
| `GET`    | `/my`                | HOST   | Get host's own listings                  |
| `GET`    | `/top-destinations`  | Public | Top 6 destinations by listing count      |
| `GET`    | `/:id`               | Public | Get single property with reviews         |
| `PATCH`  | `/:id`               | HOST   | Update listing                           |
| `DELETE` | `/:id`               | HOST   | Delete listing                           |
| `POST`   | `/:id/publish`       | HOST   | Publish a draft listing                  |
| `POST`   | `/:id/unpublish`     | HOST   | Unpublish a listing                      |
| `POST`   | `/:id/photos`        | HOST   | Upload photos (multipart)                |
| `GET`    | `/:id/availability`  | Public | Get blocked + booked dates               |
| `POST`   | `/:id/block-dates`   | HOST   | Block calendar dates                     |
| `POST`   | `/:id/unblock-dates` | HOST   | Unblock calendar dates                   |

### Bookings — `/api/v1/bookings`

| Method  | Endpoint      | Auth | Description              |
| ------- | ------------- | ---- | ------------------------ |
| `POST`  | `/`           | JWT  | Create a booking         |
| `GET`   | `/guest`      | JWT  | Guest's booking history  |
| `GET`   | `/host`       | HOST | Host's incoming bookings |
| `GET`   | `/host/stats` | HOST | Host dashboard stats     |
| `GET`   | `/:id`        | JWT  | Get booking details      |
| `PATCH` | `/:id/status` | HOST | Update booking status    |

### Payments — `/api/v1/payments`

| Method | Endpoint         | Auth   | Description                  |
| ------ | ---------------- | ------ | ---------------------------- |
| `POST` | `/create-intent` | JWT    | Create Stripe Payment Intent |
| `POST` | `/webhook`       | Public | Stripe webhook receiver      |

### Messaging — `/api/v1/messaging`

| Method | Endpoint                      | Auth | Description                       |
| ------ | ----------------------------- | ---- | --------------------------------- |
| `POST` | `/conversations`              | JWT  | Create or retrieve a conversation |
| `GET`  | `/conversations`              | JWT  | List user's conversations         |
| `GET`  | `/conversations/:id/messages` | JWT  | Get paginated messages            |

### Reviews — `/api/v1/reviews`

| Method | Endpoint       | Auth   | Description               |
| ------ | -------------- | ------ | ------------------------- |
| `POST` | `/`            | JWT    | Submit a review           |
| `GET`  | `/listing/:id` | Public | Get reviews for a listing |

### Wishlists — `/api/v1/wishlists`

| Method | Endpoint  | Auth | Description            |
| ------ | --------- | ---- | ---------------------- |
| `GET`  | `/`       | JWT  | Get user's wishlist    |
| `POST` | `/toggle` | JWT  | Add / remove a listing |

### Media — `/api/v1/media`

| Method   | Endpoint  | Auth | Description                 |
| -------- | --------- | ---- | --------------------------- |
| `POST`   | `/upload` | JWT  | Upload one or more files    |
| `GET`    | `/`       | JWT  | Get paginated media library |
| `DELETE` | `/:id`    | JWT  | Delete a media item         |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Bun** (recommended) or npm/yarn
- A **PostgreSQL** database (Neon free tier works perfectly)
- A **Redis** instance (Upstash or local Docker)
- **Cloudinary** account
- **Stripe** account
- SMTP credentials (Mailtrap for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/airtrip-api.git
cd airtrip-api

# Install dependencies
bun install

# Copy the environment template
cp .env.demo .env
# Fill in the required values (see Environment Variables below)

# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma migrate deploy

# Start the development server
bun run dev
```

The API will be available at `http://localhost:8000`.

### Quick Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "status": "ok",
    "timestamp": "2026-07-13T06:00:00.000Z",
    "uptime": 12.5,
    "services": { "database": "ok" }
  }
}
```

---

## 🔧 Environment Variables

Create a `.env` file at the project root. All variables are required unless marked optional.

```bash
# ── Database ────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# ── Server ──────────────────────────────────────────────────────
PORT=8000
HOST=0.0.0.0
NODE_ENV=development                # development | production
BODY_LIMIT=10mb
CORS_ORIGINS=http://localhost:3000  # comma-separated, or * for all

# ── JWT ─────────────────────────────────────────────────────────
JWT_SECRET="your-256-bit-secret"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Redis ───────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"
CACHE_TTL=60000                     # milliseconds

# ── Email (SMTP) ────────────────────────────────────────────────
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-user
MAIL_PASSWORD=your-mailtrap-password
MAIL_FROM="noreply@airtrip.com"
MAIL_SECURE=false                   # true for port 465

# ── Cloudinary ──────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ── Stripe ──────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── OAuth ───────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:8000/api/v1/auth/facebook/callback
```

---

## 🗄️ Database Schema

The Prisma schema is split across multiple files in `prisma/schema/` for maintainability:

| File               | Models                                                         |
| ------------------ | -------------------------------------------------------------- |
| `base.prisma`      | Generator config, datasource (PostgreSQL + PostGIS extensions) |
| `user.prisma`      | `User`, `UserRole`, host profile fields                        |
| `listing.prisma`   | `Listing`, `ListingPhoto`, `ListingAvailability`               |
| `booking.prisma`   | `Booking`, `BookingStatus` enum                                |
| `review.prisma`    | `Review`                                                       |
| `messaging.prisma` | `Conversation`, `Message`                                      |
| `media.prisma`     | `Media`, `MediaCategory` enum                                  |
| `wishlist.prisma`  | `Wishlist`, `WishlistItem`                                     |
| `system.prisma`    | `SystemConfig`                                                 |
| `enums.prisma`     | Shared enums                                                   |

### Common Commands

```bash
# Apply pending migrations to production
bunx prisma migrate deploy

# Create a new migration (development)
bunx prisma migrate dev --name your-migration-name

# Open Prisma Studio (database GUI)
bunx prisma studio

# Re-generate the client after schema changes
bunx prisma generate
```

---

## 🔌 WebSocket Events

Connect to the WebSocket gateway at the same base URL. A valid JWT is required.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('https://airtripapi.vercel.app', {
  auth: { token: 'your-jwt-access-token' },
});
```

### Client → Server (emit)

| Event              | Payload                                                | Description                  |
| ------------------ | ------------------------------------------------------ | ---------------------------- |
| `joinConversation` | `{ conversationId: string }`                           | Join a conversation room     |
| `sendMessage`      | `{ conversationId: string, content: string }`          | Send a chat message          |
| `typing`           | `{ conversationId: string, isTyping: boolean }`        | Broadcast typing state       |
| `callUser`         | `{ userToCall, signalData, from, conversationId }`     | Initiate a WebRTC call offer |
| `answerCall`       | `{ to: string, signal: RTCSessionDescription }`        | Accept an incoming call      |
| `iceCandidate`     | `{ to: string, candidate: RTCIceCandidate }`           | Relay an ICE candidate       |
| `endCall`          | `{ to, conversationId?, durationSeconds?, isMissed? }` | Terminate a call             |

### Server → Client (on)

| Event          | Payload                                | Description                          |
| -------------- | -------------------------------------- | ------------------------------------ |
| `newMessage`   | `Message`                              | A message was sent in a conversation |
| `typing`       | `{ conversationId, userId, isTyping }` | Partner's typing state changed       |
| `incomingCall` | `{ signal, from, conversationId }`     | Incoming WebRTC call offer           |
| `callAccepted` | `RTCSessionDescription`                | Remote peer accepted your call       |
| `iceCandidate` | `RTCIceCandidate`                      | ICE candidate from remote peer       |
| `callEnded`    | —                                      | Remote peer ended the call           |

---

## 🔐 Authentication

### Token Flow

```
POST /api/v1/auth/register  →  verify email OTP
POST /api/v1/auth/verify-email
POST /api/v1/auth/login     →  { accessToken, refreshToken }
GET  /api/v1/auth/me        →  Authorization: Bearer <accessToken>
POST /api/v1/auth/refresh   →  { refreshToken } → new { accessToken }
```

### Response Envelope

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Title is required", "Price must be greater than 0"]
}
```

### Roles

| Role    | Description                                            |
| ------- | ------------------------------------------------------ |
| `GUEST` | Default — browse, book, review, message                |
| `HOST`  | Manage listings, view host dashboard, receive bookings |
| `ADMIN` | Full system access                                     |

---

## 🚢 Deployment

The API is deployed as a **Vercel Serverless Function**.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# First-time setup (links to your Vercel project)
vercel

# Deploy to production
vercel --prod
```

### How the Build Works

`vercel.json` directs `@vercel/node` to compile `src/main.ts`. The `postinstall` script runs `prisma generate` automatically after `npm install`, ensuring Prisma client types are available before TypeScript compilation.

```json
{
  "version": 2,
  "builds": [{ "src": "src/main.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/main.ts" }]
}
```

> ⚠️ **Serverless Note**: Ensure `DATABASE_URL` points to a connection-pooled endpoint (Neon provides this by default) to avoid exhausting PostgreSQL connection limits on serverless infrastructure.

---

## 📁 Project Structure

```
airtrip-api/
├── prisma/
│   ├── schema/                 # Multi-file Prisma schema
│   │   ├── base.prisma
│   │   ├── user.prisma
│   │   ├── listing.prisma
│   │   ├── booking.prisma
│   │   ├── messaging.prisma
│   │   └── ...
│   └── migrations/             # Database migration history
├── src/
│   ├── main.ts                 # Application bootstrap & config
│   ├── app.module.ts           # Root module wiring
│   ├── auth/                   # JWT · OAuth · registration · password reset
│   ├── bookings/               # Booking lifecycle management
│   ├── cloudinary/             # Cloudinary upload service
│   ├── common/
│   │   ├── decorators/         # @Public() · @CurrentUser() · @Roles()
│   │   ├── filter/             # Global exception filters
│   │   ├── interceptors/       # Logging · transform · timeout · error
│   │   └── middleware/         # CorrelationId · Helmet headers
│   ├── mail/                   # Nodemailer transactional email
│   ├── media/                  # Media upload and management
│   ├── messaging/              # Chat REST + Socket.io WebSocket gateway
│   ├── payments/               # Stripe Payment Intents + webhooks
│   ├── prisma/                 # PrismaService + module
│   ├── properties/             # Listing CRUD + photo upload + availability
│   ├── redis/                  # IORedis cache module
│   ├── reviews/                # Guest reviews
│   ├── system/                 # Health check endpoint
│   └── wishlists/              # User wishlists
├── .env.demo                   # Environment variable template
├── nest-cli.json               # NestJS CLI config
├── tsconfig.json               # TypeScript config (CommonJS for Vercel)
├── vercel.json                 # Vercel serverless deployment config
└── package.json
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

Built by Mobarok · Built with ❤️ using [NestJS](https://nestjs.com) · Deployed on [Vercel](https://vercel.com)

</div>
