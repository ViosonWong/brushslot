# Brushslot

预约画师排班系统（H5 + PC 适配）。

## Tech Stack

- Web: Next.js (App Router) + TypeScript + Tailwind CSS + Redux Toolkit / RTK Query
- API: NestJS + Prisma
- DB: MySQL

## Local Dev

### 1) Install deps (pnpm)

This repo uses `pnpm` via Corepack:

```bash
corepack pnpm -v
corepack pnpm install
```

### 2) Start MySQL

```bash
docker compose up -d
```

### 3) API env + migrate + seed

```bash
cp api/.env.example api/.env
corepack pnpm --filter api db:migrate
corepack pnpm --filter api db:seed
```

By default, seed creates an admin:

- phone: `13800000000`
- password: `Admin123456`

### 4) Web env

```bash
cp web/.env.local.example web/.env.local
```

If you want to open it on your phone (H5) from the same LAN:

- Run dev servers with `corepack pnpm dev` (web uses `--hostname 0.0.0.0`)
- Set `NEXT_PUBLIC_API_URL` to your computer's LAN IP, e.g. `http://192.168.1.10:4000`
- Open `http://192.168.1.10:3000` on your phone

### 5) Run dev servers

```bash
corepack pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/docs

## Roles

- CUSTOMER: 选择画师可预约时段并预约
- ARTIST: 查看自己的排班和预约信息
- ADMIN: 管理画师、排班模板、生成/封班时段、登记出勤、管理预约
