# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Cache de npm entre builds → evita re-descargar paquetes
RUN --mount=type=cache,target=/root/.npm npm install
RUN npx prisma generate

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/dck"
ENV SESSION_SECRET="build-time-placeholder-secret-minimum-32chars!!"

RUN npx prisma generate
RUN ./node_modules/.bin/esbuild prisma/seed.ts --bundle --outfile=prisma/seed.js --platform=node --external:@prisma/client

# Cache de Next.js entre builds → compilación incremental
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone ya incluye sus propios node_modules mínimos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma: schema + seed compilado
COPY --from=builder /app/prisma ./prisma

# Solo los módulos de Prisma (no copiar los 500MB de node_modules completos)
# Copiar .bin completo (Prisma v5 necesita .wasm junto al binario)
COPY --from=deps /app/node_modules/.bin ./node_modules/.bin
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/uploads

EXPOSE 3000

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
