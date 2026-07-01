# nanaAI

Platform jual API key AI dengan sistem prepaid.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui-style components
- **PostgreSQL** database
- **NextAuth.js** (credentials provider)
- **PM2** untuk production process management

## Cara Setup

### 1. Clone & Install

```bash
cd /home/ubuntu/nanaai
npm install
```

### 2. Database

```bash
# Jalankan migration
npm run db:migrate
```

Membuat tabel: `users`, `api_keys`, `usage_logs`, `topups`.
Seed user admin: `admin@nanaai.id` / `admin123` (saldo $999,999).

### 3. Environment

Edit `.env.local`:

```
DATABASE_URL=postgresql://ubuntu:nanaai123@localhost:5432/nanaai
NEXTAUTH_SECRET=generate_random_string_pakai_openssl_rand
NEXTAUTH_URL=http://IP_VPS:3002
AUTH_TRUST_HOST=true
UPSTREAM_API_KEY=isi_dengan_api_key_openrouter_atau_openai
UPSTREAM_BASE_URL=https://openrouter.ai/api/v1
```

### 4. Build & Run

```bash
# Build
npm run build

# Development
npm run dev

# Production dengan PM2
pm2 start ecosystem.config.js --update-env
pm2 save
```

App berjalan di **http://IP_VPS:3002**.

## Routes

### Public
- `/` — Landing page
- `/login` — Login
- `/register` — Register

### Dashboard (harus login)
- `/dashboard` — Overview saldo, usage
- `/dashboard/keys` — Generate/revoke API key
- `/dashboard/usage` — Detail log penggunaan
- `/dashboard/topup` — Top-up saldo (mock payment)

### Admin (hanya admin@nanaai.id)
- `/admin` — Lihat semua user, tambah saldo manual

### API
- `POST /api/register` — Register user
- `POST /api/auth/callback/credentials` — Login
- `GET /api/keys` — List API keys
- `POST /api/keys` — Generate API key
- `DELETE /api/keys/:id` — Revoke key
- `GET /api/usage` — Usage logs
- `POST /api/topup` — Top-up (mock auto-approve)
- `GET /api/admin/users` — All users (admin only)
- `POST /api/admin/balance` — Tambah saldo manual (admin only)
- `POST /api/v1/chat/completions` — **API Proxy** (OpenAI-compatible)

## API Proxy

Endpoint: `POST /v1/chat/completions`

Menggunakan format request OpenAI-compatible:

```bash
curl -X POST http://10.3.4.161:3002/api/v1/chat/completions \
  -H "Authorization: Bearer sk-nana-xxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Cara kerja:
1. Validasi API key user
2. Cek saldo
3. Proxy request ke upstream (OpenRouter / OpenAI)
4. Hitung cost berdasarkan model & token usage
5. Potong saldo user
6. Log usage
7. Return response + info cost & sisa saldo

## Harga Model (per token)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $0.0000025 | $0.00001 |
| GPT-4o-mini | $0.00000015 | $0.0000006 |
| GPT-3.5 Turbo | $0.0000005 | $0.0000015 |
| DeepSeek Chat | $0.00000014 | $0.00000028 |
| Claude 3.5 Sonnet | $0.000003 | $0.000015 |
| Llama 3.3 70B | $0.0000005 | $0.000002 |
| Llama 3.1 8B | $0.00000015 | $0.0000006 |
| Llama 4 Scout 17B | $0.0000003 | $0.000001 |
| Qwen 3 32B | $0.0000003 | $0.000001 |
| Qwen 3.6 27B | $0.0000003 | $0.000001 |

## Yang Belum

- **Payment Gateway** — Top-up masih mock auto-approve. Integrasi Midtrans/Xendit perlu dilakukan.
- **Email verification** — Register langsung aktif tanpa verifikasi email.
- **Domain & SSL** — Masih pakai IP VPS.
- **Unit tests** — Belum ada.
