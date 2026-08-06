# Multi-Stage Build for Rotation
# Stage 1: Build the React/Vite application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/rotation-domain/package.json ./packages/rotation-domain/package.json
COPY server/package.json ./server/package.json
RUN npm ci

COPY . .
RUN npm run build:domain && npm run build:client

# Stage 2: Serve with Caddy
FROM caddy:2-alpine

COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
