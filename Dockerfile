# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ============================================
# Stage 2: Build
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time env variable for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["node", "server.js"]
